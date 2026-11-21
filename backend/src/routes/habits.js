import { Router } from 'express';
import pool from '../db.js';
import { addDays, habitProgress, isScheduled, localToday, overallProgress, scheduleOn, validDate } from '../habit-progress.js';
import { sendMilestoneAssignmentError, validMilestoneAssignment } from '../milestone-assignment.js';

const router = Router();
const habitSelect = `SELECT h.id, h.name, h.description, h.archived, h.start_date::text AS "startDate",
  h.milestone_id AS "milestoneId",
  COALESCE((SELECT json_agg(json_build_object('effectiveDate', s.effective_date, 'weekdays', s.weekdays)
    ORDER BY s.effective_date) FROM habit_schedules s WHERE s.habit_id = h.id), '[]') AS schedules,
  COALESCE((SELECT json_agg(json_build_object('id', p.id, 'startedOn', p.started_on, 'endedOn', p.ended_on)
    ORDER BY p.id) FROM habit_active_periods p WHERE p.habit_id = h.id), '[]') AS periods,
  COALESCE((SELECT json_agg(c.completed_on ORDER BY c.completed_on)
    FROM habit_checkins c WHERE c.habit_id = h.id), '[]') AS completions
  FROM recurring_habits h WHERE h.user_id = $1`;

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  const allowedOrigins = [process.env.FRONTEND_ORIGIN || 'http://localhost:9000', 'http://localhost:3000'];
  if (req.method !== 'GET' && req.get('Origin') && !allowedOrigins.includes(req.get('Origin'))) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }
  if (!req.session?.userId) return res.status(401).json({ error: 'Login required.' });
  try {
    if (typeof req.query.timezone !== 'string' || req.query.timezone.length > 100) throw new Error();
    req.habitToday = localToday(req.query.timezone);
    req.habitMonth = req.query.month ?? req.habitToday.slice(0, 7);
    if (typeof req.habitMonth !== 'string' || !validDate(`${req.habitMonth}-01`) || req.habitMonth > '9998-12') throw new Error();
  } catch {
    return res.status(400).json({ error: 'Provide a valid device timezone and calendar month (YYYY-MM).' });
  }
  next();
});

function fields(body, creating = false) {
  if (!validMilestoneAssignment(body.milestoneId)) throw new RequestError(400, 'Invalid milestone ID.');
  if (creating || body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 200) {
      throw new RequestError(400, 'Habit name must contain 1 to 200 characters.');
    }
  }
  if (body.description !== undefined && (typeof body.description !== 'string' || body.description.length > 2000)) {
    throw new RequestError(400, 'Description must contain at most 2000 characters.');
  }
  if (creating || body.weekdays !== undefined) {
    if (!Array.isArray(body.weekdays) || !body.weekdays.length || body.weekdays.length > 7 ||
        body.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6) || new Set(body.weekdays).size !== body.weekdays.length) {
      throw new RequestError(400, 'Choose at least one weekday, without duplicates.');
    }
  }
}

// Serialize writes for each habit so archive, schedule, and check-in changes cannot race.
async function mutate(req, res, next, action) {
  let client;
  try {
    if (!/^\d+$/.test(req.params.id) || Number(req.params.id) > 2147483647 || Number(req.params.id) < 1) {
      throw new RequestError(400, 'Invalid habit ID.');
    }
    client = await pool.connect();
    await client.query('BEGIN');
    const owned = await client.query('SELECT id FROM recurring_habits WHERE id = $1 AND user_id = $2 FOR UPDATE', [req.params.id, req.session.userId]);
    if (!owned.rowCount) throw new RequestError(404, 'Habit not found.');
    const habit = (await client.query(`${habitSelect} AND h.id = $2`, [req.session.userId, req.params.id])).rows[0];
    await action(client, habit);
    await client.query('COMMIT');
    res.sendStatus(204);
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    if (error instanceof RequestError) res.status(error.status).json({ error: error.message });
    else sendMilestoneAssignmentError(error, res, next);
  } finally { client?.release(); }
}

router.get('/', async (req, res, next) => {
  try {
    const rows = (await pool.query(`${habitSelect} ORDER BY h.created_at, h.id`, [req.session.userId])).rows;
    const habits = rows.map((habit) => habitProgress(habit, req.habitToday, req.habitMonth));
    res.json({ today: req.habitToday, month: req.habitMonth, habits, summary: overallProgress(habits, req.habitMonth) });
  } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
  let client;
  try {
    const body = req.body ?? {};
    fields(body, true);
    if (!validDate(body.startDate) || body.startDate > '9998-12-31') throw new RequestError(400, 'Choose a start date between 1900 and 9998.');
    client = await pool.connect();
    await client.query('BEGIN');
    const habit = (await client.query(
      `INSERT INTO recurring_habits (user_id, name, description, start_date, milestone_id)
        VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [req.session.userId, body.name.trim(), body.description?.trim() || '', body.startDate, body.milestoneId ?? null],
    )).rows[0];
    await client.query('INSERT INTO habit_schedules (habit_id, effective_date, weekdays) VALUES ($1, $2, $3)', [habit.id, body.startDate, body.weekdays]);
    await client.query('INSERT INTO habit_active_periods (habit_id, started_on) VALUES ($1, $2)', [habit.id, body.startDate]);
    await client.query('COMMIT');
    res.status(201).json(habit);
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    if (error instanceof RequestError) res.status(error.status).json({ error: error.message });
    else sendMilestoneAssignmentError(error, res, next);
  } finally { client?.release(); }
});

router.patch('/:id', (req, res, next) => mutate(req, res, next, async (client, habit) => {
  if (habit.archived) throw new RequestError(409, 'Restore this habit before editing it.');
  const body = req.body ?? {};
  if (body.startDate !== undefined) throw new RequestError(400, 'The start date cannot be changed.');
  if ([body.name, body.description, body.weekdays, body.milestoneId].every((value) => value === undefined)) {
    throw new RequestError(400, 'Provide a name, description, schedule, or milestone to update.');
  }
  fields(body);
  await client.query(`UPDATE recurring_habits
    SET name = COALESCE($1, name), description = COALESCE($2, description),
        milestone_id = CASE WHEN $3 THEN $4 ELSE milestone_id END
    WHERE id = $5`,
  [body.name?.trim() ?? null, body.description?.trim() ?? null, body.milestoneId !== undefined, body.milestoneId ?? null, habit.id]);
  if (body.weekdays !== undefined) {
    const effective = [addDays(req.habitToday, 1), habit.startDate].sort().at(-1);
    const desired = [...body.weekdays].sort().join();
    const futureVersions = habit.schedules.filter((entry) => entry.effectiveDate >= effective);
    const unchanged = [scheduleOn(habit, effective), ...futureVersions]
      .every((entry) => [...entry.weekdays].sort().join() === desired);
    if (unchanged) return;
    // Replace pending schedules, including those created before a timezone change.
    // Versions through today remain untouched.
    await client.query('DELETE FROM habit_schedules WHERE habit_id = $1 AND effective_date >= $2', [habit.id, effective]);
    await client.query('INSERT INTO habit_schedules (habit_id, effective_date, weekdays) VALUES ($1, $2, $3)', [habit.id, effective, body.weekdays]);
  }
}));

router.put('/:id/checkins/:date', (req, res, next) => mutate(req, res, next, async (client, habit) => {
  const date = req.params.date;
  if (habit.archived) throw new RequestError(409, 'Restore this habit before editing check-ins.');
  if (!validDate(date) || date > req.habitToday || !isScheduled(habit, date)) {
    throw new RequestError(400, 'Check-ins must be on scheduled dates from the start date through today.');
  }
  if (typeof req.body?.completed !== 'boolean') throw new RequestError(400, 'Completed must be a boolean.');
  if (req.body.completed) await client.query('INSERT INTO habit_checkins (habit_id, completed_on) VALUES ($1, $2) ON CONFLICT DO NOTHING', [habit.id, date]);
  else await client.query('DELETE FROM habit_checkins WHERE habit_id = $1 AND completed_on = $2', [habit.id, date]);
}));

router.post('/:id/archive', (req, res, next) => mutate(req, res, next, async (client, habit) => {
  if (habit.archived) return;
  await client.query('UPDATE recurring_habits SET archived = TRUE WHERE id = $1', [habit.id]);
  await client.query('UPDATE habit_active_periods SET ended_on = $1 WHERE habit_id = $2 AND ended_on IS NULL', [req.habitToday, habit.id]);
}));

router.post('/:id/restore', (req, res, next) => mutate(req, res, next, async (client, habit) => {
  if (!habit.archived) return;
  await client.query('UPDATE recurring_habits SET archived = FALSE WHERE id = $1', [habit.id]);
  await client.query('INSERT INTO habit_active_periods (habit_id, started_on) VALUES ($1, $2)', [habit.id, [habit.startDate, req.habitToday].sort().at(-1)]);
}));

router.delete('/:id', (req, res, next) => mutate(req, res, next, (client, habit) =>
  client.query('DELETE FROM recurring_habits WHERE id = $1', [habit.id])));

export default router;

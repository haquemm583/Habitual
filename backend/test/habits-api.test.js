// Run against the local stack: docker compose exec backend node --test test/habits-api.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pool from '../src/db.js';
import { addDays } from '../src/habit-progress.js';
import { migrateDatabase } from '../src/migrate-database.js';

const base = process.env.BASE_URL || 'http://localhost:3000';

async function request(method, path, cookie, body, query = 'timezone=UTC', origin) {
  const response = await fetch(`${base}/api/${path}${query ? `?${query}` : ''}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, headers: response.headers, data: await response.json().catch(() => null) };
}

test('habit tracking API', async (t) => {
  const userIds = [];
  async function account() {
    const user = { name: 'Habit API test', email: `habits-${crypto.randomUUID()}@example.com`, password: 'Habits-test-password-123!' };
    const registered = await request('POST', 'auth/register', null, user);
    assert.equal(registered.status, 201);
    userIds.push(registered.data.id);
    const loggedIn = await request('POST', 'auth/login', null, user);
    assert.equal(loggedIn.status, 200);
    return loggedIn.headers.getSetCookie().find((cookie) => cookie.startsWith('habitual.sid=')).split(';')[0];
  }

  try {
    const owner = await account();
    const other = await account();
    const initial = await request('GET', 'habits', owner);
    assert.equal(initial.status, 200);
    const today = initial.data.today;
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);
    const daily = [0, 1, 2, 3, 4, 5, 6];
    let id;

    await t.test('all endpoints require login and reject invalid context or browser origins', async () => {
      for (const [method, path, body] of [
        ['GET', 'habits'], ['POST', 'habits', {}], ['PATCH', 'habits/1', {}],
        ['PUT', `habits/1/checkins/${today}`, { completed: true }],
        ['POST', 'habits/1/archive'], ['POST', 'habits/1/restore'], ['DELETE', 'habits/1'],
      ]) assert.equal((await request(method, path, null, body)).status, 401);
      assert.equal((await request('GET', 'habits', owner, undefined, '')).status, 400);
      assert.equal((await request('GET', 'habits', owner, undefined, 'timezone=NotAZone')).status, 400);
      assert.equal((await request('GET', 'habits', owner, undefined, 'timezone=UTC&month=2026-13')).status, 400);
      assert.equal((await request('POST', 'habits', owner, {}, 'timezone=UTC', 'https://other.example')).status, 403);
    });

    await t.test('creation validates fields, supports past and future starts, and preserves tasks', async () => {
      const body = { name: 'Walk', description: '', startDate: yesterday, weekdays: daily };
      for (const invalid of [
        { ...body, name: '  ' }, { ...body, name: 'x'.repeat(201) }, { ...body, description: null },
        { ...body, description: 'x'.repeat(2001) }, { ...body, startDate: '2026-02-30' },
        { ...body, weekdays: [] }, { ...body, weekdays: [1, 1] }, { ...body, weekdays: [7] },
      ]) assert.equal((await request('POST', 'habits', owner, invalid)).status, 400);
      const created = await request('POST', 'habits', owner, { ...body, name: '  Walk  ' });
      assert.equal(created.status, 201);
      id = created.data.id;
      const list = (await request('GET', 'habits', owner)).data;
      assert.equal(list.habits[0].name, 'Walk');
      assert.equal(list.habits[0].startDate, yesterday);
      assert.equal(list.summary.today.scheduled, 1);
      await request('PATCH', `habits/${id}`, owner, { name: 'Walk', weekdays: daily });
      assert.equal((await request('GET', 'habits', owner)).data.habits[0].pendingSchedule, null);
      const future = await request('POST', 'habits', owner, { ...body, name: 'Future', startDate: tomorrow });
      assert.equal(future.status, 201);
      assert.equal((await request('GET', 'habits', owner)).data.habits.find((habit) => habit.id === future.data.id).today.scheduled, false);
      await request('DELETE', `habits/${future.data.id}`, owner);
      const offDay = (new Date(`${today}T00:00:00Z`).getUTCDay() + 2) % 7;
      const weekly = await request('POST', 'habits', owner, { ...body, name: 'Selected weekdays', weekdays: [offDay] });
      assert.equal(weekly.status, 201);
      assert.equal((await request('PUT', `habits/${weekly.data.id}/checkins/${today}`, owner, { completed: true })).status, 400);
      await request('DELETE', `habits/${weekly.data.id}`, owner);
      const task = await request('POST', 'tasks', owner, { name: 'One-time task' });
      assert.equal(task.status, 201);
      assert.ok(!(await request('GET', 'habits', owner)).data.habits.some((habit) => habit.name === 'One-time task'));
      await migrateDatabase();
      await migrateDatabase();
      assert.ok((await request('GET', 'tasks', owner)).data.some((item) => item.id === task.data.id));
    });

    await t.test('other accounts cannot read, edit, check in, archive, restore, or delete a habit', async () => {
      assert.equal((await request('GET', 'habits', other)).data.habits.length, 0);
      for (const [method, suffix, body] of [
        ['PATCH', '', { name: 'Changed' }], ['PUT', `/checkins/${today}`, { completed: true }],
        ['POST', '/archive'], ['POST', '/restore'], ['DELETE', ''],
      ]) assert.equal((await request(method, `habits/${id}${suffix}`, other, body)).status, 404);
      assert.equal((await request('PATCH', 'habits/2147483648', owner, { name: 'Changed' })).status, 400);
      assert.equal((await request('PATCH', 'habits/nope', owner, { name: 'Changed' })).status, 400);
    });

    await t.test('check-ins are idempotent, date-specific, undoable, and reject future or pre-start dates', async () => {
      assert.equal((await request('PUT', `habits/${id}/checkins/${tomorrow}`, owner, { completed: true })).status, 400);
      assert.equal((await request('PUT', `habits/${id}/checkins/${addDays(yesterday, -1)}`, owner, { completed: true })).status, 400);
      assert.equal((await request('PUT', `habits/${id}/checkins/${today}`, owner, { completed: 'true' })).status, 400);
      const attempts = await Promise.all(Array.from({ length: 4 }, () => request('PUT', `habits/${id}/checkins/${today}`, owner, { completed: true })));
      assert.ok(attempts.every((response) => response.status === 204));
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM habit_checkins WHERE habit_id = $1', [id])).rows[0].count, 1);
      await request('PUT', `habits/${id}/checkins/${yesterday}`, owner, { completed: true });
      let habit = (await request('GET', 'habits', owner)).data.habits[0];
      assert.equal(habit.currentStreak, 2);
      await request('PUT', `habits/${id}/checkins/${today}`, owner, { completed: false });
      habit = (await request('GET', 'habits', owner)).data.habits[0];
      assert.equal(habit.today.completed, false);
      assert.equal(habit.currentStreak, 1);
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM habit_checkins WHERE habit_id = $1', [id])).rows[0].count, 1);
      const chicago = (await request('GET', 'habits', owner, undefined, `timezone=America%2FChicago&month=${yesterday.slice(0, 7)}`)).data;
      assert.equal(chicago.habits[0].calendar.find((day) => day.date === yesterday).completed, true);
    });

    await t.test('editing schedules begins tomorrow, preserves history, and cannot change the start date', async () => {
      assert.equal((await request('PATCH', `habits/${id}`, owner, { startDate: today })).status, 400);
      assert.equal((await request('PATCH', `habits/${id}`, owner, {})).status, 400);
      const update = await request('PATCH', `habits/${id}`, owner, { name: 'Stretch', description: 'Daily movement', weekdays: [1] });
      assert.equal(update.status, 204);
      let habit = (await request('GET', 'habits', owner)).data.habits[0];
      assert.deepEqual(habit.weekdays, daily);
      assert.equal(habit.pendingSchedule.effectiveDate, tomorrow);
      assert.deepEqual(habit.pendingSchedule.weekdays, [1]);
      assert.equal(habit.name, 'Stretch');
      await request('PATCH', `habits/${id}`, owner, { weekdays: [2, 4] });
      habit = (await request('GET', 'habits', owner)).data.habits[0];
      assert.deepEqual(habit.pendingSchedule.weekdays, [2, 4]);
      assert.equal(habit.currentStreak, 1);
      // A new edit supersedes all pending versions, even after travelling west.
      await pool.query('INSERT INTO habit_schedules (habit_id, effective_date, weekdays) VALUES ($1, $2, $3)', [id, addDays(today, 3), [5]]);
      await request('PATCH', `habits/${id}`, owner, { weekdays: [2, 4] });
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM habit_schedules WHERE habit_id = $1 AND effective_date > $2', [id, today])).rows[0].count, 1);
    });

    await t.test('archive locks history and removes all overall contributions; restore preserves history and resets streak', async () => {
      await request('PUT', `habits/${id}/checkins/${today}`, owner, { completed: true });
      await Promise.all([request('POST', `habits/${id}/archive`, owner), request('POST', `habits/${id}/archive`, owner)]);
      let data = (await request('GET', 'habits', owner)).data;
      assert.equal(data.habits[0].archived, true);
      assert.equal(data.habits[0].longestStreak, 2);
      assert.equal(data.summary.month.scheduled, 0);
      assert.ok(data.summary.calendar.every((day) => day.scheduled === 0));
      assert.equal((await request('PATCH', `habits/${id}`, owner, { name: 'Blocked' })).status, 409);
      assert.equal((await request('PUT', `habits/${id}/checkins/${yesterday}`, owner, { completed: false })).status, 409);
      await Promise.all([request('POST', `habits/${id}/restore`, owner), request('POST', `habits/${id}/restore`, owner)]);
      data = (await request('GET', 'habits', owner)).data;
      assert.equal(data.habits[0].archived, false);
      assert.equal(data.habits[0].today.completed, true);
      assert.equal(data.habits[0].currentStreak, 1);
      assert.equal(data.habits[0].longestStreak, 2);
      assert.equal((await pool.query('SELECT count(*)::int AS count FROM habit_active_periods WHERE habit_id = $1 AND ended_on IS NULL', [id])).rows[0].count, 1);
    });

    await t.test('permanent deletion removes history without deleting ordinary tasks', async () => {
      assert.equal((await request('DELETE', `habits/${id}`, owner)).status, 204);
      assert.equal((await request('DELETE', `habits/${id}`, owner)).status, 404);
      assert.equal((await request('GET', 'habits', owner)).data.habits.length, 0);
      for (const table of ['habit_schedules', 'habit_active_periods', 'habit_checkins']) {
        assert.equal((await pool.query(`SELECT count(*)::int AS count FROM ${table} WHERE habit_id = $1`, [id])).rows[0].count, 0);
      }
      assert.equal((await request('GET', 'tasks', owner)).data.length, 1);
    });
  } finally {
    // Only remove the two accounts created by this test and their cascading data.
    await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [userIds]);
    await pool.end();
  }
});

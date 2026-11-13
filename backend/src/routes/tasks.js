import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');

  const allowedOrigins = [process.env.FRONTEND_ORIGIN || 'http://localhost:9000', 'http://localhost:3000'];
  if (req.method !== 'GET' && req.get('Origin') && !allowedOrigins.includes(req.get('Origin'))) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }

  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Login required.' });
  }

  next();
});

function parseTaskId(rawId) {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

// GET /api/tasks - list all tasks (habits) for the logged-in user
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, completed, milestone_id AS "milestoneId", created_at AS "createdAt"
       FROM habits
       WHERE user_id = $1
       ORDER BY created_at ASC, id ASC`,
      [req.session.userId],
    );
    return res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// POST /api/tasks - create a new task for the logged-in user
router.post('/', async (req, res, next) => {
  const { name, completed } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 200) {
    return res.status(400).json({ error: 'Task name must contain 1 to 200 characters.' });
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completed status must be a boolean.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO habits (user_id, name, completed)
       VALUES ($1, $2, $3)
       RETURNING id, name, completed, milestone_id AS "milestoneId", created_at AS "createdAt"`,
      [req.session.userId, name.trim(), Boolean(completed)],
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id - update a task's name and/or completed status for the logged-in user
async function updateTask(req, res, next) {
  const taskId = parseTaskId(req.params.id);
  if (!taskId) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }

  const { name, completed } = req.body ?? {};
  if (name === undefined && completed === undefined) {
    return res.status(400).json({ error: 'Provide a task name or completed status to update.' });
  }

  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 200)) {
    return res.status(400).json({ error: 'Task name must contain 1 to 200 characters.' });
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'Completed status must be a boolean.' });
  }

  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (completed !== undefined) {
      updates.push(`completed = $${paramIndex++}`);
      values.push(completed);
    }

    values.push(taskId, req.session.userId);

    const result = await pool.query(
      `UPDATE habits
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING id, name, completed, milestone_id AS "milestoneId", created_at AS "createdAt"`,
      values,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}

router.patch('/:id', updateTask);
router.put('/:id', updateTask);

// DELETE /api/tasks/:id - delete a task owned by the logged-in user
router.delete('/:id', async (req, res, next) => {
  const taskId = parseTaskId(req.params.id);
  if (!taskId) {
    return res.status(400).json({ error: 'Invalid task ID.' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM habits WHERE id = $1 AND user_id = $2',
      [taskId, req.session.userId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

export default router;

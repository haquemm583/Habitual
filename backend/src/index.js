/*
  index.js

  sets up the backend server and routes

  created by: CJ Quintero
  created on: 11/07/2026
*/
import express from 'express'
import pool from './db.js';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import habitRoutes from './routes/habits.js';
import milestoneRoutes from './routes/milestones.js';
import { migrateHabits } from './migrate-habits.js';
import sessionMiddleware from './session.js';
import { setTimeout as delay } from 'node:timers/promises';

const app = express();
const port = process.env.PORT || 3000

app.use(express.json({ limit: '16kb' }));
app.use(sessionMiddleware);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/milestones', milestoneRoutes);

// simple health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error.message);
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('Request failed:', error.message);
  const status = error.status === 400 || error.status === 413 ? error.status : 500;
  res.status(status).json({ error: status === 500 ? 'Unable to complete request.' : 'Invalid request body.' });
});

// Ensure the completed column exists for existing database volumes
for (let attempt = 1; attempt <= 10; attempt++) {
  try {
    await pool.query('ALTER TABLE habits ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT FALSE');
    await migrateHabits();
    break;
  } catch (error) {
    if (attempt === 10) {
      await pool.end();
      throw new Error('Database initialization failed after 10 attempts.', { cause: error });
    }
    console.error(`Database initialization attempt ${attempt}/10 failed:`, error.message);
    await delay(1000);
  }
}

// run the app
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

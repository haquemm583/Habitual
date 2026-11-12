/*
  index.js

  sets up the backend server and routes

  created by: CJ Quintero
  created on: 11/07/2026
*/
import express from 'express'
import pool from './db.js';
import authRoutes from './routes/auth.js';
import sessionMiddleware from './session.js';

const app = express();
const port = process.env.PORT || 3000

app.use(express.json({ limit: '16kb' }));
app.use(sessionMiddleware);
app.use('/api/auth', authRoutes);

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

// run the app
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

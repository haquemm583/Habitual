/*
  auth.js

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { Router } from 'express';
import argon2 from 'argon2';
import pool from '../db.js';
import { promisify } from 'node:util';
import { sessionCookieName, sessionCookieOptions } from '../session.js';

const router = Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');

  // Reject browser mutations from other origins, including login and logout requests.
  const allowedOrigins = [process.env.FRONTEND_ORIGIN || 'http://localhost:9000', 'http://localhost:3000'];
  if (req.method !== 'GET' && req.get('Origin') && !allowedOrigins.includes(req.get('Origin'))) {
    return res.status(403).json({ error: 'Request origin is not allowed.' });
  }

  next();
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    return res.status(400).json({ error: 'Name must contain 1 to 100 characters.' });
  }

  if (typeof email !== 'string' || email.trim().length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  // Match the registration form's password limits.
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must contain 8 to 128 characters.' });
  }

  try {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.trim().toLowerCase(), passwordHash],
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    console.error('Registration failed:', error.message);
    return res.status(500).json({ error: 'Unable to create account. Please try again.' });
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || !email.trim() || email.trim().length > 254 ||
      typeof password !== 'string' || !password || password.length > 128) {
    return res.status(400).json({ error: 'Enter an email address and password.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email.trim().toLowerCase()],
    );
    const user = result.rows[0];
    if (!user || !(await argon2.verify(user.password_hash, password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await promisify(req.session.regenerate).call(req.session);
    req.session.userId = user.id;
    await promisify(req.session.save).call(req.session);
    return res.json({ id: user.id, name: user.name, email: user.email });
  } catch (error) {
    next(error);
  }
});

router.get('/me', async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Login required.' });
  }

  try {
    const result = await pool.query('SELECT id, name, email FROM users WHERE id = $1', [req.session.userId]);
    if (!result.rows[0]) {
      await promisify(req.session.destroy).call(req.session);
      res.clearCookie(sessionCookieName, sessionCookieOptions);
      return res.status(401).json({ error: 'Login required.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    await promisify(req.session.destroy).call(req.session);
    res.clearCookie(sessionCookieName, sessionCookieOptions);
    return res.sendStatus(204);
  } catch (error) {
    next(error);
  }
});

export default router;

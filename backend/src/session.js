import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './db.js';

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters.');
}

const PgSession = connectPgSimple(session);

export const sessionCookieName = 'habitual.sid';
export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export default session({
  name: sessionCookieName,
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { ...sessionCookieOptions, maxAge: 24 * 60 * 60 * 1000 },
});

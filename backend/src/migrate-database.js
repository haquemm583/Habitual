import { readFile } from 'node:fs/promises';
import pool from './db.js';

export async function migrateDatabase() {
  const migrations = ['001_habit_tracking.sql', '003_rename_tasks.sql'];
  const sql = await Promise.all(migrations.map((file) =>
    readFile(new URL(`./migrations/${file}`, import.meta.url), 'utf8')));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtext('habitual schema migrations'))");
    for (const migration of sql) await client.query(migration);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

import pg from 'pg';

// return DATE columns as a raw 'YYYY-MM-DD' string
pg.types.setTypeParser(pg.types.builtins.DATE, (val) => val);

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;

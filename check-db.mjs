import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
  console.log('users columns:', res.rows.map(r => r.column_name).join(', '));
} catch(e) { console.log('ERROR:', e.message); }
await pool.end();

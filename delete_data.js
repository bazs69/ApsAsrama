require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearData() {
  const client = await pool.connect();
  try {
    await client.query('DELETE FROM "Angkatan";');
    await client.query('DELETE FROM "Prodi";');
    await client.query('DELETE FROM "Fakultas";');
    console.log('Tables cleared successfully.');
  } catch (error) {
    console.error('Error clearing tables:', error);
  } finally {
    client.release();
    pool.end();
  }
}

clearData();

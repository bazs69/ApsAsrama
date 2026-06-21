const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:root@localhost:5432/spthree_connect?schema=public' });
async function drop() {
  try {
    await pool.query('ALTER TABLE "User" DROP COLUMN IF EXISTS "roleId" CASCADE;');
    await pool.query('DROP TABLE IF EXISTS "Role" CASCADE;');
    await pool.query('DROP TYPE IF EXISTS "Role" CASCADE;');
    console.log('Successfully dropped old Role table, column, and type.');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
drop();

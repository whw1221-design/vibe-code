import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { closePool, isDatabaseConfigured, pool } from './db.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');

async function main() {
  if (!isDatabaseConfigured || !pool) {
    console.error('DATABASE_URL is missing.');
    console.error('Add your Supabase connection string to backend/.env first.');
    process.exitCode = 1;
    return;
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);

  const { rows } = await pool.query(
    `select table_name
     from information_schema.tables
     where table_schema = 'public'
       and table_name in ('users', 'products', 'orders')
     order by table_name`
  );

  console.log('Supabase schema applied.');
  console.log(`Tables: ${rows.map((row) => row.table_name).join(', ')}`);
  console.log('Next: npm run seed');
}

main()
  .catch((error) => {
    console.error(`Schema setup failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });

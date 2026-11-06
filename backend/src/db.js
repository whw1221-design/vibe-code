import pg from 'pg';
import { config } from './config.js';
import { HttpError } from './utils/http.js';

const { Pool } = pg;

export const isDatabaseConfigured = Boolean(config.databaseUrl);

export const pool = isDatabaseConfigured
  ? new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DB_POOL_MAX) || 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    })
  : null;

if (pool) {
  pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error.message);
  });
}

export function getPool() {
  if (!pool) {
    throw new HttpError(
      503,
      'The database is not configured. Add DATABASE_URL to backend/.env.'
    );
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

export async function closePool() {
  if (pool) await pool.end();
}

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Load backend/.env even when the process is started from the project root.
dotenv.config({ path: path.join(rootDir, '.env'), quiet: true });

const databaseUrl = (process.env.DATABASE_URL || '').trim();

export const config = {
  port: Number(process.env.PORT) || 5000,
  databaseUrl,
  // Supabase requires SSL. Set DATABASE_SSL=true for other hosted Postgres URLs.
  databaseSsl:
    Boolean(databaseUrl) &&
    (/supabase\.(co|com)/i.test(databaseUrl) || process.env.DATABASE_SSL === 'true'),
  // The built React app. Express serves it in single-process mode.
  frontendDist: path.resolve(rootDir, process.env.FRONTEND_DIST || '../frontend/dist'),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rootDir,
};

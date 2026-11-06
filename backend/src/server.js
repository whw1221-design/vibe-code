import { app } from './app.js';
import { config } from './config.js';
import { closePool, isDatabaseConfigured } from './db.js';

const configured = isDatabaseConfigured;

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}/api`);
  if (configured) {
    console.log('Database: Supabase Postgres (DATABASE_URL)');
    console.log('Frontend: served from frontend/dist when a build exists');
  } else {
    console.warn('WARNING: DATABASE_URL is not configured.');
    console.warn('Add your Supabase connection string to backend/.env, then restart the server.');
    console.warn('The UI will load, but /api requests will return 503 until it is configured.');
  }
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${config.port} is already in use. Set PORT in backend/.env to change it.`);
  } else {
    console.error(error);
  }
  process.exit(1);
});

function shutdown(signal) {
  console.log(`\n${signal} received. Closing server...`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

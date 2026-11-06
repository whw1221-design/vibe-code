import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { isDatabaseConfigured, pool } from './db.js';
import productRoutes from './routes/products.js';
import userRoutes from './routes/users.js';
import orderRoutes from './routes/orders.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export const app = express();

const allowedOrigins =
  config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (req, res) => {
  if (!isDatabaseConfigured || !pool) {
    return res.status(503).json({
      success: false,
      message: 'The database is not configured. Add DATABASE_URL to backend/.env.',
    });
  }

  try {
    const { rows } = await pool.query(
      `select
         to_regclass('public.products') as products,
         to_regclass('public.users') as users,
         to_regclass('public.orders') as orders`
    );

    if (!rows[0]?.products || !rows[0]?.users || !rows[0]?.orders) {
      return res.status(503).json({
        success: false,
        message:
          'Supabase is connected, but the schema is missing. Run "npm run db:setup".',
      });
    }

    return res.json({
      success: true,
      data: {
        status: 'ok',
        database: 'supabase-postgres',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Supabase health check failed:', error.message);
    return res.status(503).json({
      success: false,
      message:
        'Supabase is configured but the database is not reachable. Check DATABASE_URL in backend/.env.',
    });
  }
});

app.use('/api', productRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);

// Unknown API routes must stay JSON; they must not fall through to the SPA.
app.use('/api', notFoundHandler);

const indexFile = path.join(config.frontendDist, 'index.html');
const hasFrontendBuild = fs.existsSync(indexFile);

if (hasFrontendBuild) {
  // Serve Vite's hashed assets and other static files.
  app.use(express.static(config.frontendDist, { index: false, maxAge: '1h' }));

  // SPA fallback: React Router handles /products, /users, /orders, etc.
  app.get('*', (req, res) => {
    res.sendFile(indexFile);
  });
} else {
  app.get('/', (req, res) => {
    res
      .status(503)
      .type('text/plain')
      .send(
        [
          'Frontend build not found.',
          `Expected: ${indexFile}`,
          '',
          'Build it first:',
          '  cd frontend',
          '  npm install',
          '  npm run build',
          '',
          'Or from the project root:',
          '  npm run serve',
        ].join('\n')
      );
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

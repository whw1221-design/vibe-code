import { HttpError } from '../utils/http.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Request body must contain valid JSON.',
    });
  }

  // PostgreSQL / Supabase error codes.
  if (err?.code === '23505') {
    return res.status(409).json({
      success: false,
      message:
        err.constraint === 'users_email_key'
          ? 'A user with that email already exists.'
          : 'A record with that unique value already exists.',
    });
  }

  if (err?.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'The referenced record does not exist.',
    });
  }

  if (err?.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'A database constraint rejected the request.',
    });
  }

  if (err?.code === '42P01') {
    return res.status(503).json({
      success: false,
      message: 'The Supabase schema is missing. Run "npm run db:setup".',
    });
  }

  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '28P01', '3D000', '42501'].includes(err?.code)) {
    console.error('Database connection error:', err.message);
    return res.status(503).json({
      success: false,
      message: 'The database is not reachable. Check DATABASE_URL in backend/.env.',
    });
  }

  console.error(err);
  return res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
}

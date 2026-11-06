/**
 * An error that can safely be exposed to API clients.
 */
export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Wraps a route handler so thrown errors reach the Express error middleware.
 */
export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function sendData(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

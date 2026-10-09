import { ApiError } from '../utils/errors.js';

export const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.code === 11000) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((validationError) => ({
      field: validationError.path,
      message: validationError.message,
    }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  } else if (['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(err.name)) {
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  // Log server-side details but never expose stack traces or DB internals.
  if (statusCode >= 500) {
    console.error(`[error] ${err.stack || err.message}`);
  }

  const body = { error: message };
  if (details?.length) {
    body.details = details;
  }

  res.status(statusCode).json(body);
};

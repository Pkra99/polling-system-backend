import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// Handle specific error types
function handleDatabaseError(error) {
  // PostgreSQL unique violation
  if (error.code === '23505') {
    return new AppError('Duplicate entry. Resource already exists.', 409);
  }
  
  // PostgreSQL foreign key violation
  if (error.code === '23503') {
    return new AppError('Referenced resource does not exist.', 400);
  }
  
  // PostgreSQL not null violation
  if (error.code === '23502') {
    return new AppError('Required field is missing.', 400);
  }
  
  return new AppError('Database error occurred.', 500);
}

// Handle Zod validation errors
function handleZodError(error) {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
  
  return new AppError('Validation failed', 400, true, errors);
}

// Handle JWT errors
function handleJWTError() {
  return new AppError('Invalid token. Please log in again.', 401);
}

function handleJWTExpiredError() {
  return new AppError('Token expired. Please log in again.', 401);
}

// Send error response in development
function sendErrorDev(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
    ...(err.errors && { errors: err.errors }),
  });
}

// Send error response in production
function sendErrorProd(err, res) {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
    });
  } else {
    // Programming or unknown error: don't leak error details
    logger.error('ERROR 💥', { error: err });
    
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
}

// Global error handling middleware
export function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (env.NODE_ENV === 'development') {
    logger.error(err.message, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });
    
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.code && err.code.startsWith('23')) error = handleDatabaseError(err);
    if (err.name === 'ZodError') error = handleZodError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
}

// Async handler wrapper to catch errors in async routes
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 Not Found handler
export function notFoundHandler(req, res, next) {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404
  );
  next(error);
}
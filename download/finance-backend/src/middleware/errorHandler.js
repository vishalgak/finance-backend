/**
 * Global Error Handler Middleware
 * 
 * Catches all errors thrown in the application and returns
 * a consistent, structured error response.
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Build error response
  const response = {
    success: false,
    status: err.status,
    message: err.message,
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  // Log error for debugging
  if (err.statusCode >= 500) {
    console.error('═══════════════════════════════════════════');
    console.error(`[ERROR] ${new Date().toISOString()}`);
    console.error(`Status: ${err.statusCode} | ${err.status}`);
    console.error(`Message: ${err.message}`);
    console.error(`Path: ${req.method} ${req.originalUrl}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(`Stack: ${err.stack}`);
    }
    console.error('═══════════════════════════════════════════');
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    response.message = 'Data validation failed';
    response.details = messages;
    return res.status(400).json(response);
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    response.message = `A record with this ${field} already exists`;
    response.statusCode = 409;
    response.status = 'fail';
    return res.status(409).json(response);
  }

  // Handle Mongoose CastError (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    response.message = `Invalid ${err.path}: ${err.value}`;
    response.statusCode = 400;
    response.status = 'fail';
    return res.status(400).json(response);
  }

  // Handle JSON parse errors
  if (err.type === 'entity.parse.failed') {
    response.message = 'Malformed JSON in request body';
    response.statusCode = 400;
    response.status = 'fail';
    return res.status(400).json(response);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    response.message = 'Invalid token. Please log in again.';
    response.statusCode = 401;
    response.status = 'fail';
    return res.status(401).json(response);
  }

  if (err.name === 'TokenExpiredError') {
    response.message = 'Token has expired. Please log in again.';
    response.statusCode = 401;
    response.status = 'fail';
    return res.status(401).json(response);
  }

  // Send response
  res.status(err.statusCode).json(response);
};

module.exports = errorHandler;

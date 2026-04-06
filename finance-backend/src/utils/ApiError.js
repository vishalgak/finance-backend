/**
 * Custom API Error Class
 * 
 * Provides structured error handling across the application.
 * All business logic errors should use this class for consistent
 * error responses.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.details = details;

    // Maintain proper stack trace in V8 environments
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Common error factory methods for quick usage
   */
  static badRequest(message, details = null) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message, details = null) {
    return new ApiError(409, message, details);
  }

  static internal(message = 'Something went wrong on our end') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;

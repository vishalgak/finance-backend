const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and attaches the authenticated user
 * to the request object. Also checks that the user account
 * is still active.
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Check for authorization header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new ApiError(401, 'Authentication required. Please provide a valid token.')
      );
    }

    // 2. Verify the token
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Token has expired. Please log in again.'));
      }
      if (error.name === 'JsonWebTokenError') {
        return next(new ApiError(401, 'Invalid token. Please log in again.'));
      }
      return next(new ApiError(401, 'Token verification failed.'));
    }

    // 3. Check if user still exists
    const user = await User.findById(decoded.id).select('+status');
    if (!user) {
      return next(
        new ApiError(401, 'The user associated with this token no longer exists.')
      );
    }

    // 4. Check if user is active
    if (!user.isActive()) {
      return next(
        new ApiError(
          403,
          'Your account has been deactivated. Please contact an administrator.'
        )
      );
    }

    // 5. Attach user to request and proceed
    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(500, 'Authentication failed due to a server error.'));
  }
};

module.exports = authenticate;

const mongoose = require('mongoose');

/**
 * Mongoose ObjectId Validator
 * 
 * Validates that a given ID string is a valid MongoDB ObjectId.
 * Use this middleware before any route that uses an :id parameter.
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];

    if (!id) {
      return next(
        require('../utils/ApiError').badRequest(`${paramName} parameter is required`)
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(
        require('../utils/ApiError').badRequest(`Invalid ${paramName} format. Must be a valid MongoDB ObjectId.`)
      );
    }

    next();
  };
};

module.exports = validateObjectId;

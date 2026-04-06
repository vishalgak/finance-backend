const ApiError = require('../utils/ApiError');
const {
  validateName,
  validateEmail,
  validatePassword,
  validateRole,
  validateStatus,
} = require('../validators/inputValidator');

/**
 * Auth Route Validators
 */
const validateRegister = (req, res, next) => {
  const errors = [];

  const nameError = validateName(req.body.name);
  if (nameError) errors.push({ field: 'name', message: nameError });

  const emailError = validateEmail(req.body.email);
  if (emailError) errors.push({ field: 'email', message: emailError });

  const passwordError = validatePassword(req.body.password);
  if (passwordError) errors.push({ field: 'password', message: passwordError });

  // Validate role if provided (optional during registration, defaults to 'viewer')
  if (req.body.role) {
    const roleError = validateRole(req.body.role);
    if (roleError) errors.push({ field: 'role', message: roleError });
    else req.body.role = req.body.role.toLowerCase();
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  // Normalize email to lowercase
  req.body.email = req.body.email.toLowerCase().trim();

  next();
};

const validateLogin = (req, res, next) => {
  const errors = [];

  if (!req.body.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  if (!req.body.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  req.body.email = req.body.email.toLowerCase().trim();

  next();
};

/**
 * User Management Validators
 */
const validateUpdateUser = (req, res, next) => {
  const errors = [];
  const allowedFields = ['name', 'email', 'role', 'status'];
  const providedFields = Object.keys(req.body);

  // Check for disallowed fields
  const disallowedFields = providedFields.filter(
    (field) => !allowedFields.includes(field)
  );
  if (disallowedFields.length > 0) {
    errors.push({
      field: disallowedFields.join(', '),
      message: `The following fields cannot be updated: ${disallowedFields.join(', ')}`,
    });
  }

  if (req.body.name !== undefined) {
    const nameError = validateName(req.body.name);
    if (nameError) errors.push({ field: 'name', message: nameError });
  }

  if (req.body.email !== undefined) {
    const emailError = validateEmail(req.body.email);
    if (emailError) errors.push({ field: 'email', message: emailError });
    else req.body.email = req.body.email.toLowerCase().trim();
  }

  if (req.body.role !== undefined) {
    const roleError = validateRole(req.body.role);
    if (roleError) errors.push({ field: 'role', message: roleError });
    else req.body.role = req.body.role.toLowerCase();
  }

  if (req.body.status !== undefined) {
    const statusError = validateStatus(req.body.status);
    if (statusError) errors.push({ field: 'status', message: statusError });
    else req.body.status = req.body.status.toLowerCase();
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  next();
};

/**
 * Financial Record Validators
 */
const validateCreateRecord = (req, res, next) => {
  const {
    validateAmount,
    validateTransactionType,
    validateCategory,
    validateDate,
  } = require('../validators/inputValidator');

  const errors = [];

  if (req.body.amount !== undefined) {
    const amountError = validateAmount(req.body.amount);
    if (amountError) errors.push({ field: 'amount', message: amountError });
  } else {
    errors.push({ field: 'amount', message: 'Amount is required' });
  }

  if (req.body.type !== undefined) {
    const typeError = validateTransactionType(req.body.type);
    if (typeError) errors.push({ field: 'type', message: typeError });
  } else {
    errors.push({ field: 'type', message: 'Transaction type is required' });
  }

  if (req.body.category !== undefined) {
    const categoryError = validateCategory(req.body.category);
    if (categoryError) errors.push({ field: 'category', message: categoryError });
  } else {
    errors.push({ field: 'category', message: 'Category is required' });
  }

  if (req.body.date !== undefined) {
    const dateError = validateDate(req.body.date);
    if (dateError) errors.push({ field: 'date', message: dateError });
  }

  if (req.body.description !== undefined && typeof req.body.description === 'string') {
    if (req.body.description.trim().length > 500) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 500 characters',
      });
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  // Normalize type to lowercase
  if (req.body.type) req.body.type = req.body.type.toLowerCase();

  next();
};

const validateUpdateRecord = (req, res, next) => {
  const {
    validateAmount,
    validateTransactionType,
    validateCategory,
    validateDate,
  } = require('../validators/inputValidator');

  const errors = [];
  const allowedFields = ['amount', 'type', 'category', 'date', 'description'];
  const providedFields = Object.keys(req.body);

  if (providedFields.length === 0) {
    errors.push({ field: 'body', message: 'Request body must contain at least one field to update' });
  }

  const disallowedFields = providedFields.filter(
    (field) => !allowedFields.includes(field)
  );
  if (disallowedFields.length > 0) {
    errors.push({
      field: disallowedFields.join(', '),
      message: `The following fields cannot be updated: ${disallowedFields.join(', ')}`,
    });
  }

  if (req.body.amount !== undefined) {
    const amountError = validateAmount(req.body.amount);
    if (amountError) errors.push({ field: 'amount', message: amountError });
  }

  if (req.body.type !== undefined) {
    const typeError = validateTransactionType(req.body.type);
    if (typeError) errors.push({ field: 'type', message: typeError });
    else req.body.type = req.body.type.toLowerCase();
  }

  if (req.body.category !== undefined) {
    const categoryError = validateCategory(req.body.category);
    if (categoryError) errors.push({ field: 'category', message: categoryError });
  }

  if (req.body.date !== undefined) {
    const dateError = validateDate(req.body.date);
    if (dateError) errors.push({ field: 'date', message: dateError });
  }

  if (req.body.description !== undefined && typeof req.body.description === 'string') {
    if (req.body.description.trim().length > 500) {
      errors.push({
        field: 'description',
        message: 'Description cannot exceed 500 characters',
      });
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  next();
};

/**
 * Dashboard Query Validators
 */
const validateDashboardQuery = (req, res, next) => {
  const { validateDateRange } = require('../validators/inputValidator');

  const errors = [];

  if (req.query.startDate || req.query.endDate) {
    const rangeResult = validateDateRange(req.query.startDate, req.query.endDate);
    if (rangeResult.error) {
      errors.push({ field: 'dateRange', message: rangeResult.error });
    }
  }

  // Validate period filter if provided
  const validPeriods = ['week', 'month', 'quarter', 'year', 'all'];
  if (req.query.period && !validPeriods.includes(req.query.period)) {
    errors.push({
      field: 'period',
      message: `Invalid period. Must be one of: ${validPeriods.join(', ')}`,
    });
  }

  if (errors.length > 0) {
    return next(new ApiError(400, 'Validation failed', errors));
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateUser,
  validateCreateRecord,
  validateUpdateRecord,
  validateDashboardQuery,
};

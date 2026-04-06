const ApiError = require('../utils/ApiError');
const validator = require('validator');

/**
 * Input Validation Utilities
 * 
 * Provides reusable validation functions for common input patterns.
 * Used by route validators to ensure clean, consistent input handling.
 */

const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!validator.isEmail(email)) return 'Please provide a valid email address';
  return null;
};

const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (password.length > 128) return 'Password cannot exceed 128 characters';
  // Check for at least one number
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
  return null;
};

const validateName = (name, fieldName = 'Name') => {
  if (!name) return `${fieldName} is required`;
  if (typeof name !== 'string') return `${fieldName} must be a string`;
  const trimmed = name.trim();
  if (trimmed.length < 2) return `${fieldName} must be at least 2 characters long`;
  if (trimmed.length > 50) return `${fieldName} cannot exceed 50 characters`;
  return null;
};

const validateAmount = (amount) => {
  if (amount === undefined || amount === null) return 'Amount is required';
  if (typeof amount !== 'number' || isNaN(amount)) return 'Amount must be a valid number';
  if (amount <= 0) return 'Amount must be a positive number';
  if (amount > 999999999.99) return 'Amount exceeds maximum allowed value';
  // Check decimal places
  if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
    return 'Amount can have at most 2 decimal places';
  }
  return null;
};

const validateTransactionType = (type) => {
  if (!type) return 'Transaction type is required';
  if (!['income', 'expense'].includes(type.toLowerCase())) {
    return 'Transaction type must be either "income" or "expense"';
  }
  return null;
};

const validateCategory = (category) => {
  if (!category) return 'Category is required';
  if (typeof category !== 'string') return 'Category must be a string';
  const trimmed = category.trim();
  if (trimmed.length < 2) return 'Category must be at least 2 characters long';
  if (trimmed.length > 50) return 'Category cannot exceed 50 characters';
  return null;
};

const validateDate = (date) => {
  if (!date) return 'Date is required';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'Please provide a valid date';
  // Don't allow future dates (with 1 day buffer for timezone)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  if (parsed > tomorrow) return 'Date cannot be in the future';
  return null;
};

const validateRole = (role) => {
  if (!role) return 'Role is required';
  if (!['viewer', 'analyst', 'admin'].includes(role.toLowerCase())) {
    return 'Role must be one of: viewer, analyst, admin';
  }
  return null;
};

const validateStatus = (status) => {
  if (!status) return 'Status is required';
  if (!['active', 'inactive'].includes(status.toLowerCase())) {
    return 'Status must be either active or inactive';
  }
  return null;
};

/**
 * Validates pagination parameters
 */
const validatePagination = (page, limit) => {
  const result = {};

  if (page !== undefined) {
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return { error: 'Page must be a positive integer' };
    }
    result.page = parsedPage;
  } else {
    result.page = 1;
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return { error: 'Limit must be an integer between 1 and 100' };
    }
    result.limit = parsedLimit;
  } else {
    result.limit = 20;
  }

  return result;
};

/**
 * Validates date range filter parameters
 */
const validateDateRange = (startDate, endDate) => {
  const result = {};

  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return { error: 'Invalid start date format' };
    }
    result.startDate = start;
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return { error: 'Invalid end date format' };
    }
    result.endDate = end;
  }

  // Validate range logic
  if (result.startDate && result.endDate && result.startDate > result.endDate) {
    return { error: 'Start date must be before end date' };
  }

  return result;
};

/**
 * Validates sort parameters to prevent NoSQL injection
 */
const validateSort = (sortBy, sortOrder) => {
  const allowedSortFields = [
    'amount', 'type', 'category', 'date', 'createdAt', 'updatedAt',
  ];
  const allowedOrders = ['asc', 'desc', '1', '-1'];

  if (sortBy && !allowedSortFields.includes(sortBy)) {
    return { error: `Invalid sort field. Allowed fields: ${allowedSortFields.join(', ')}` };
  }

  if (sortOrder && !allowedOrders.includes(sortOrder)) {
    return { error: 'Sort order must be "asc" or "desc"' };
  }

  return {
    sortBy: sortBy || 'date',
    sortOrder: sortOrder === 'asc' || sortOrder === '1' ? 1 : -1,
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateAmount,
  validateTransactionType,
  validateCategory,
  validateDate,
  validateRole,
  validateStatus,
  validatePagination,
  validateDateRange,
  validateSort,
};

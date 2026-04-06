const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');
const validateObjectId = require('../validators/mongoIdValidator');
const { validateUpdateUser } = require('../validators/routeValidators');
const userController = require('../controllers/userController');

/**
 * User Management Routes
 *
 * All routes require authentication and admin role.
 */

// GET /api/users - Get all users with pagination, search, and filtering
router.get(
  '/',
  authenticate,
  adminOnly,
  userController.getAllUsers
);

// GET /api/users/:userId - Get a single user by ID
router.get(
  '/:userId',
  authenticate,
  adminOnly,
  validateObjectId('userId'),
  userController.getUserById
);

// PUT /api/users/:userId - Update a user's fields
router.put(
  '/:userId',
  authenticate,
  adminOnly,
  validateObjectId('userId'),
  validateUpdateUser,
  userController.updateUser
);

// DELETE /api/users/:userId - Soft delete a user (set status to inactive)
router.delete(
  '/:userId',
  authenticate,
  adminOnly,
  validateObjectId('userId'),
  userController.deleteUser
);

module.exports = router;

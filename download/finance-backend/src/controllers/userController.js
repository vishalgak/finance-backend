const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * User Management Controller
 *
 * Handles CRUD operations for user management.
 * All endpoints require admin authentication.
 */

/**
 * Get all users with pagination, search, and filtering.
 *
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10)
 *   - search: Search by name or email
 *   - role: Filter by role (viewer, analyst, admin)
 *   - status: Filter by status (active, inactive)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, search, role, status } = req.query;

    // Build filter object based on provided query params
    const filter = {};

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    // Add search criteria if search term is provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Count total documents matching the filter
    const total = await User.countDocuments(filter);

    // Fetch users with pagination
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single user by ID.
 *
 * Route param:
 *   - userId: MongoDB ObjectId of the user
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a user's fields (name, email, role, status).
 *
 * Route param:
 *   - userId: MongoDB ObjectId of the user
 *
 * Body (partial update allowed):
 *   - name: User's display name
 *   - email: User's email address
 *   - role: User's role (viewer, analyst, admin)
 *   - status: User's status (active, inactive)
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Update only allowed fields
    const allowedFields = ['name', 'email', 'role', 'status'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }

    // If email is being changed, check for duplicates
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        throw ApiError.conflict('A user with this email already exists');
      }
      user.email = req.body.email;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a user by setting their status to 'inactive'.
 *
 * Route param:
 *   - userId: MongoDB ObjectId of the user
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    user.status = 'inactive';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User has been deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};

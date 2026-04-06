const ApiError = require('../utils/ApiError');

/**
 * Role-Based Access Control Middleware
 * 
 * Creates middleware functions that restrict access based on user roles.
 * 
 * Role hierarchy (from least to most privileged):
 * - viewer: Read-only access to dashboard summaries
 * - analyst: Read access to records and insights
 * - admin: Full CRUD access to all resources
 * 
 * Usage:
 *   router.get('/records', authorize('viewer', 'analyst', 'admin'), controller);
 *   router.post('/records', authorize('admin'), controller);
 */

// Define role permissions as a map for clear visibility
const ROLE_PERMISSIONS = {
  viewer: {
    label: 'Viewer',
    description: 'Can only view dashboard summaries',
    canViewDashboard: true,
    canViewRecords: false,
    canCreateRecords: false,
    canUpdateRecords: false,
    canDeleteRecords: false,
    canManageUsers: false,
  },
  analyst: {
    label: 'Analyst',
    description: 'Can view records and access insights',
    canViewDashboard: true,
    canViewRecords: true,
    canCreateRecords: false,
    canUpdateRecords: false,
    canDeleteRecords: false,
    canManageUsers: false,
  },
  admin: {
    label: 'Administrator',
    description: 'Full management access',
    canViewDashboard: true,
    canViewRecords: true,
    canCreateRecords: true,
    canUpdateRecords: true,
    canDeleteRecords: true,
    canManageUsers: true,
  },
};

/**
 * Returns middleware that checks if the authenticated user has
 * one of the allowed roles.
 */
const authorize = (...allowedRoles) => {
  // Validate that provided roles are valid
  const validRoles = Object.keys(ROLE_PERMISSIONS);
  for (const role of allowedRoles) {
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role specified in authorize(): "${role}"`);
    }
  }

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Your role "${req.user.role}" does not have permission to perform this action. ` +
          `Required role(s): ${allowedRoles.join(', ')}.`
        )
      );
    }

    next();
  };
};

/**
 * Convenience middleware creators for common role checks
 */
const viewerOnly = authorize('viewer', 'analyst', 'admin');
const analystOnly = authorize('analyst', 'admin');
const adminOnly = authorize('admin');

/**
 * Check if a specific user role has a specific permission
 */
const hasPermission = (role, permission) => {
  const roleConfig = ROLE_PERMISSIONS[role];
  return roleConfig ? roleConfig[permission] === true : false;
};

/**
 * Self-action or admin check
 * Allows users to perform actions on their own resources,
 * or admins to perform actions on any resource.
 */
const selfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Authentication required.'));
  }

  // Admin can access any resource
  if (req.user.role === 'admin') {
    return next();
  }

  // Otherwise, check if the user is accessing their own resource
  const targetUserId = req.params.userId || req.body.userId;
  if (targetUserId && targetUserId !== req.user.id.toString()) {
    return next(
      new ApiError(403, 'You can only perform this action on your own resources.')
    );
  }

  next();
};

module.exports = {
  authorize,
  viewerOnly,
  analystOnly,
  adminOnly,
  hasPermission,
  selfOrAdmin,
  ROLE_PERMISSIONS,
};

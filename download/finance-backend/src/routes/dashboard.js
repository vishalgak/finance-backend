const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const { viewerOnly } = require('../middleware/roleCheck');
const { validateDashboardQuery } = require('../validators/routeValidators');
const dashboardController = require('../controllers/dashboardController');

/**
 * Dashboard Routes
 *
 * Provides aggregated analytics endpoints for the finance dashboard.
 * All routes require authentication and at least viewer role.
 */

// GET /api/dashboard/summary - Overall financial summary
router.get(
  '/summary',
  authenticate,
  viewerOnly,
  validateDashboardQuery,
  dashboardController.getSummary
);

// GET /api/dashboard/categories - Category-wise breakdown
router.get(
  '/categories',
  authenticate,
  viewerOnly,
  validateDashboardQuery,
  dashboardController.getCategoryBreakdown
);

// GET /api/dashboard/recent - Recent transactions
router.get(
  '/recent',
  authenticate,
  viewerOnly,
  dashboardController.getRecentActivity
);

// GET /api/dashboard/trends/monthly - Monthly income/expense trends
router.get(
  '/trends/monthly',
  authenticate,
  viewerOnly,
  validateDashboardQuery,
  dashboardController.getMonthlyTrends
);

// GET /api/dashboard/trends/weekly - Weekly income/expense trends
router.get(
  '/trends/weekly',
  authenticate,
  viewerOnly,
  validateDashboardQuery,
  dashboardController.getWeeklyTrends
);

// GET /api/dashboard/expenses/top - Top expense categories
router.get(
  '/expenses/top',
  authenticate,
  viewerOnly,
  validateDashboardQuery,
  dashboardController.getTopExpenses
);

// GET /api/dashboard/stats - Quick dashboard header stats
router.get(
  '/stats',
  authenticate,
  viewerOnly,
  dashboardController.getStats
);

module.exports = router;

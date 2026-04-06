const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const { viewerOnly } = require('../middleware/roleCheck');
const { validateDashboardQuery } = require('../validators/routeValidators');
const dashboardController = require('../controllers/dashboardController');


router.get(
  '/summary',
  authenticate,
  viewerOnly,
  validateDashboardQuery,
  dashboardController.getSummary
);

router.get(
  '/categories',
  authenticate,
  viewerOnly,
  validateDashboardQuery,
  dashboardController.getCategoryBreakdown
);


router.get(
  '/recent',
  authenticate,
  viewerOnly,
  dashboardController.getRecentActivity
);


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

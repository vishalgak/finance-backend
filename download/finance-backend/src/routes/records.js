const express = require('express');
const router = express.Router();

const authenticate = require('../middleware/auth');
const { viewerOnly, adminOnly } = require('../middleware/roleCheck');
const validateObjectId = require('../validators/mongoIdValidator');
const { validateCreateRecord, validateUpdateRecord } = require('../validators/routeValidators');
const recordController = require('../controllers/recordController');

/**
 * Financial Records Routes
 *
 * Provides CRUD endpoints for financial transaction records.
 * Supports filtering, sorting, pagination, and search.
 */

// POST /api/records - Create a new financial record
router.post(
  '/',
  authenticate,
  adminOnly,
  validateCreateRecord,
  recordController.createRecord
);

// GET /api/records - Get all records with filtering, sorting, and pagination
router.get(
  '/',
  authenticate,
  viewerOnly,
  recordController.getAllRecords
);

// GET /api/records/:recordId - Get a single record by ID
router.get(
  '/:recordId',
  authenticate,
  viewerOnly,
  validateObjectId('recordId'),
  recordController.getRecordById
);

// PUT /api/records/:recordId - Update a financial record
router.put(
  '/:recordId',
  authenticate,
  adminOnly,
  validateObjectId('recordId'),
  validateUpdateRecord,
  recordController.updateRecord
);

// DELETE /api/records/:recordId - Soft delete a financial record
router.delete(
  '/:recordId',
  authenticate,
  adminOnly,
  validateObjectId('recordId'),
  recordController.deleteRecord
);

module.exports = router;

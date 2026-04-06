const FinancialRecord = require('../models/FinancialRecord');
const ApiError = require('../utils/ApiError');
const { validatePagination, validateSort } = require('../validators/inputValidator');

/**
 * Financial Records Controller
 *
 * Handles CRUD operations for financial records.
 * Supports filtering, sorting, pagination, search, and soft delete.
 */

/**
 * Create a new financial record.
 *
 * Body:
 *   - amount: Positive number (required)
 *   - type: 'income' or 'expense' (required)
 *   - category: String (required)
 *   - date: ISO date string (defaults to now)
 *   - description: String (optional)
 */
const createRecord = async (req, res, next) => {
  try {
    const { amount, type, category, date, description } = req.body;

    const record = await FinancialRecord.create({
      amount,
      type,
      category,
      date,
      description,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: {
        record,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all financial records with filtering, sorting, and pagination.
 *
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 *   - type: Filter by transaction type ('income' or 'expense')
 *   - category: Filter by category (case-insensitive partial match)
 *   - startDate: Filter records from this date (inclusive)
 *   - endDate: Filter records up to this date (inclusive, end of day)
 *   - sortBy: Sort field (default: 'date')
 *   - sortOrder: Sort order 'asc' or 'desc' (default: 'desc')
 *   - search: Search term matched against description and category
 *   - userId: (Admin only) View records for a specific user
 */
const getAllRecords = async (req, res, next) => {
  try {
    const {
      page,
      limit,
      type,
      category,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      search,
    } = req.query;

    // Validate pagination parameters
    const paginationResult = validatePagination(page, limit);
    if (paginationResult.error) {
      throw ApiError.badRequest(paginationResult.error);
    }
    const { page: currentPage, limit: currentLimit } = paginationResult;

    // Validate sort parameters
    const sortResult = validateSort(sortBy, sortOrder);
    if (sortResult.error) {
      throw ApiError.badRequest(sortResult.error);
    }
    const { sortBy: sortField, sortOrder: sortDirection } = sortResult;

    // Build base filter - admin can optionally view other users' records
    const filter = {};

    if (req.user.role === 'admin' && req.query.userId) {
      filter.user = req.query.userId;
    } else {
      filter.user = req.user.id;
    }

    // Add type filter if provided
    if (type) {
      filter.type = type;
    }

    // Add category filter (case-insensitive regex)
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }

    // Add date range filter
    if (startDate || endDate) {
      filter.date = {};

      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.date.$lte = endOfDay;
      }
    }

    // Add search filter on description and category
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Count total matching records
    const total = await FinancialRecord.countDocuments(filter);

    // Fetch records with pagination and sorting
    const records = await FinancialRecord.find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((currentPage - 1) * currentLimit)
      .limit(currentLimit);

    // Build active filters summary for response
    const activeFilters = {};
    if (type) activeFilters.type = type;
    if (category) activeFilters.category = category;
    if (startDate) activeFilters.startDate = startDate;
    if (endDate) activeFilters.endDate = endDate;
    if (search) activeFilters.search = search;
    if (req.query.userId) activeFilters.userId = req.query.userId;

    res.status(200).json({
      success: true,
      data: {
        records,
        pagination: {
          page: currentPage,
          limit: currentLimit,
          total,
          pages: Math.ceil(total / currentLimit),
        },
        filters: activeFilters,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single financial record by ID.
 *
 * Route params:
 *   - recordId: MongoDB ObjectId of the record
 *
 * Access: Only the record owner or an admin can view.
 */
const getRecordById = async (req, res, next) => {
  try {
    const record = await FinancialRecord.findById(req.params.recordId);

    if (!record) {
      throw ApiError.notFound('Record not found');
    }

    // Access check: only owner or admin can view
    if (record.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw ApiError.forbidden('You do not have permission to view this record');
    }

    res.status(200).json({
      success: true,
      data: {
        record,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a financial record.
 *
 * Route params:
 *   - recordId: MongoDB ObjectId of the record
 *
 * Body (partial update allowed):
 *   - amount: Positive number
 *   - type: 'income' or 'expense'
 *   - category: String
 *   - date: ISO date string
 *   - description: String
 *
 * Access: Only the record owner or an admin can update.
 */
const updateRecord = async (req, res, next) => {
  try {
    const record = await FinancialRecord.findById(req.params.recordId);

    if (!record) {
      throw ApiError.notFound('Record not found');
    }

    // Access check: only owner or admin can update
    if (record.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw ApiError.forbidden('You do not have permission to update this record');
    }

    // Update only allowed fields
    const allowedFields = ['amount', 'type', 'category', 'date', 'description'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        record[field] = req.body[field];
      }
    }

    const updatedRecord = await record.save();

    res.status(200).json({
      success: true,
      data: {
        record: updatedRecord,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a financial record (set isDeleted=true, deletedAt=Date.now()).
 *
 * Route params:
 *   - recordId: MongoDB ObjectId of the record
 *
 * Access: Only the record owner or an admin can delete.
 */
const deleteRecord = async (req, res, next) => {
  try {
    const record = await FinancialRecord.findById(req.params.recordId);

    if (!record) {
      throw ApiError.notFound('Record not found');
    }

    // Access check: only owner or admin can delete
    if (record.user.toString() !== req.user.id && req.user.role !== 'admin') {
      throw ApiError.forbidden('You do not have permission to delete this record');
    }

    record.isDeleted = true;
    record.deletedAt = new Date();
    await record.save();

    res.status(200).json({
      success: true,
      message: 'Record has been deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord,
};

const FinancialRecord = require('../models/FinancialRecord');
const ApiError = require('../utils/ApiError');


const buildMatchFilter = (req) => {
  const filter = { isDeleted: false };

  if (req.query.userId && req.user.role === 'admin') {
    filter.user = req.query.userId;
  } else {
    filter.user = req.user.id;
  }

  if (req.query.startDate || req.query.endDate) {
    filter.date = {};
    if (req.query.startDate) {
      filter.date.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      const endOfDay = new Date(req.query.endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date.$lte = endOfDay;
    }
  }

  return filter;
};


const getSummary = async (req, res, next) => {
  try {
    const matchFilter = buildMatchFilter(req);

    const result = await FinancialRecord.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          recordCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalIncome: 1,
          totalExpense: 1,
          netBalance: { $subtract: ['$totalIncome', '$totalExpense'] },
          recordCount: 1,
        },
      },
    ]);

    const summary = result.length > 0
      ? result[0]
      : { totalIncome: 0, totalExpense: 0, netBalance: 0, recordCount: 0 };

    res.status(200).json({
      success: true,
      data: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        netBalance: summary.netBalance,
        recordCount: summary.recordCount,
        currency: 'INR',
      },
    });
  } catch (error) {
    next(error);
  }
};


const getCategoryBreakdown = async (req, res, next) => {
  try {
    const matchFilter = buildMatchFilter(req);

    const categories = await FinancialRecord.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          category: { $first: '$category' },
          totalIncome: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          totalExpense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: 1,
          totalIncome: 1,
          totalExpense: 1,
          count: 1,
        },
      },
      { $sort: { totalExpense: -1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};


const getRecentActivity = async (req, res, next) => {
  try {
    const matchFilter = buildMatchFilter(req);
    const limit = parseInt(req.query.limit) || 10;

    const recentActivity = await FinancialRecord.find(matchFilter)
      .sort({ date: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      data: { recentActivity },
    });
  } catch (error) {
    next(error);
  }
};


const getMonthlyTrends = async (req, res, next) => {
  try {
    const matchFilter = buildMatchFilter(req);

    const trends = await FinancialRecord.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$date' },
          },
          month: {
            $first: {
              $dateToString: { format: '%Y-%m', date: '$date' },
            },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: 1,
          income: 1,
          expense: 1,
          count: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { trends },
    });
  } catch (error) {
    next(error);
  }
};


const getWeeklyTrends = async (req, res, next) => {
  try {
    const matchFilter = buildMatchFilter(req);

    const trends = await FinancialRecord.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-W%V', date: '$date' },
          },
          week: {
            $first: {
              $dateToString: { format: '%Y-W%V', date: '$date' },
            },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          week: 1,
          income: 1,
          expense: 1,
          count: 1,
        },
      },
      { $sort: { week: 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: { trends },
    });
  } catch (error) {
    next(error);
  }
};


const getTopExpenses = async (req, res, next) => {
  try {
    const matchFilter = buildMatchFilter(req);
    matchFilter.type = 'expense';

    const topExpenses = await FinancialRecord.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$category',
          category: { $first: '$category' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          category: 1,
          totalAmount: 1,
          count: 1,
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      data: { topExpenses },
    });
  } catch (error) {
    next(error);
  }
};


const getStats = async (req, res, next) => {
  try {
    const matchFilter = buildMatchFilter(req);

    // Run summary aggregation and recent records query in parallel
    const [summaryResult, recentRecords, categoryResult] = await Promise.all([
      // Summary aggregation
      FinancialRecord.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0],
              },
            },
            totalExpense: {
              $sum: {
                $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0],
              },
            },
            recordCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            totalIncome: 1,
            totalExpense: 1,
            netBalance: { $subtract: ['$totalIncome', '$totalExpense'] },
            recordCount: 1,
          },
        },
      ]),

      // Recent 5 records
      FinancialRecord.find(matchFilter)
        .sort({ date: -1 })
        .limit(5),

      // Total distinct categories count
      FinancialRecord.distinct('category', matchFilter),
    ]);

    const summary = summaryResult.length > 0
      ? summaryResult[0]
      : { totalIncome: 0, totalExpense: 0, netBalance: 0, recordCount: 0 };

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalIncome: summary.totalIncome,
          totalExpense: summary.totalExpense,
          netBalance: summary.netBalance,
          recordCount: summary.recordCount,
          currency: 'INR',
        },
        recentRecords,
        totalCategories: categoryResult.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getRecentActivity,
  getMonthlyTrends,
  getWeeklyTrends,
  getTopExpenses,
  getStats,
};

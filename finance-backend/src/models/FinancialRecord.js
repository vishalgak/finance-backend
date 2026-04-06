const mongoose = require('mongoose');

/**
 * Financial Record Schema
 * 
 * Represents a single financial transaction (income or expense).
 * Supports categories, dates, soft delete, and audit tracking.
 */
const financialRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be a positive number'],
      validate: {
        validator: function (v) {
          // Allow up to 2 decimal places
          return /^\d+(\.\d{1,2})?$/.test(v.toString());
        },
        message: 'Amount can have at most 2 decimal places',
      },
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense',
      },
      required: [true, 'Transaction type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters'],
      maxlength: [50, 'Category cannot exceed 50 characters'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false, // Exclude soft-deleted records from queries by default
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for efficient filtering
financialRecordSchema.index({ user: 1, type: 1 });
financialRecordSchema.index({ user: 1, category: 1 });
financialRecordSchema.index({ user: 1, date: -1 });
financialRecordSchema.index({ user: 1, date: -1, type: 1 });

// Pre-find middleware to exclude soft-deleted records
financialRecordSchema.pre(/^find/, function (next) {
  // Only exclude if isDeleted field is not explicitly queried
  if (this._conditions.isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// Pre-save validation: ensure amount is not zero
financialRecordSchema.pre('save', function (next) {
  if (this.amount === 0) {
    return next(new Error('Amount cannot be zero'));
  }
  next();
});

// Virtual for formatted amount display
financialRecordSchema.virtual('formattedAmount').get(function () {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(this.amount);
});

// Virtual for relative time
financialRecordSchema.virtual('timeAgo').get(function () {
  const now = new Date();
  const diff = now - this.date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week(s) ago`;
  if (days < 365) return `${Math.floor(days / 30)} month(s) ago`;
  return `${Math.floor(days / 365)} year(s) ago`;
});

const FinancialRecord = mongoose.model('FinancialRecord', financialRecordSchema);

module.exports = FinancialRecord;

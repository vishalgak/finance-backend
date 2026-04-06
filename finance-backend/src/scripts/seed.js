/**
 * Seed Database Script
 * 
 * Populates the database with sample users and financial records
 * for testing and demonstration purposes.
 * 
 * Usage: npm run seed
 * 
 * Note: This script will clear existing data in the User and
 * FinancialRecord collections before seeding.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FinancialRecord = require('../models/FinancialRecord');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finance_dashboard';

// ─── Sample Data ─────────────────────────────────────────────────

const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@zorvyn.com',
    password: 'Admin@123',
    role: 'admin',
    status: 'active',
  },
  {
    name: 'Analyst User',
    email: 'analyst@zorvyn.com',
    password: 'Analyst@123',
    role: 'analyst',
    status: 'active',
  },
  {
    name: 'Viewer User',
    email: 'viewer@zorvyn.com',
    password: 'Viewer@123',
    role: 'viewer',
    status: 'active',
  },
  {
    name: 'Inactive User',
    email: 'inactive@zorvyn.com',
    password: 'Inactive@123',
    role: 'viewer',
    status: 'inactive',
  },
];

const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Rental Income', 'Bonus', 'Refund'];
const expenseCategories = [
  'Rent', 'Groceries', 'Transport', 'Utilities', 'Entertainment',
  'Healthcare', 'Education', 'Dining Out', 'Shopping', 'Insurance',
  'Travel', 'Subscriptions', 'Home Repair', 'Personal Care', 'Gifts',
];

const expenseDescriptions = [
  'Monthly rent payment',
  'Weekly grocery shopping',
  'Electricity bill',
  'Internet and phone bill',
  'Movie tickets',
  'Doctor consultation',
  'Online course subscription',
  'Restaurant dinner',
  'New clothes purchase',
  'Health insurance premium',
  'Weekend trip expenses',
  'Netflix subscription',
  'Plumber visit',
  'Gym membership',
  'Birthday gift for friend',
  'Gas refuel',
  'Office lunch',
  'Medicine purchase',
  'Taxi fare',
  'Home cleaning supplies',
];

const incomeDescriptions = [
  'Monthly salary',
  'Freelance project payment',
  'Stock dividends received',
  'Rental income for apartment',
  'Performance bonus',
  'Product refund',
  'Consulting fee',
  'Interest from savings account',
  'Project milestone payment',
  'Commission earned',
];

/**
 * Generate a random date within the last N months
 */
function randomDate(monthsBack = 6) {
  const now = new Date();
  const pastDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const randomTime = pastDate.getTime() + Math.random() * (now.getTime() - pastDate.getTime());
  return new Date(randomTime);
}

/**
 * Generate random financial records for a user
 */
function generateRecords(userId, count = 50) {
  const records = [];

  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() < 0.35; // 35% income, 65% expenses

    let amount;
    let category;
    let description;

    if (isIncome) {
      amount = parseFloat((Math.random() * 95000 + 5000).toFixed(2)); // 5,000 - 100,000
      category = incomeCategories[Math.floor(Math.random() * incomeCategories.length)];
      description = incomeDescriptions[Math.floor(Math.random() * incomeDescriptions.length)];
    } else {
      amount = parseFloat((Math.random() * 15000 + 100).toFixed(2)); // 100 - 15,000
      category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      description = expenseDescriptions[Math.floor(Math.random() * expenseDescriptions.length)];
    }

    records.push({
      user: userId,
      amount,
      type: isIncome ? 'income' : 'expense',
      category,
      date: randomDate(6),
      description,
    });
  }

  // Sort by date descending
  records.sort((a, b) => b.date - a.date);

  return records;
}

// ─── Seed Function ───────────────────────────────────────────────

async function seedDatabase() {
  try {
    // Connect to database
    console.log('\n🔄 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');

    // Clear existing data
    console.log('\n🗑️  Clearing existing data...');
    await User.deleteMany({});
    await FinancialRecord.deleteMany({});
    console.log('✅ Existing data cleared');

    // Create users
    console.log('\n👤 Creating sample users...');
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
      console.log(`   ✓ Created: ${user.email} (${user.role})`);
    }

    // Create financial records for active users
    console.log('\n💰 Generating financial records...');
    let totalRecords = 0;

    for (const user of createdUsers) {
      if (user.status === 'inactive') continue;

      const recordCount = Math.floor(Math.random() * 30) + 40; // 40-70 records per user
      const records = generateRecords(user._id, recordCount);
      await FinancialRecord.insertMany(records);
      totalRecords += records.length;
      console.log(`   ✓ Generated ${records.length} records for ${user.email}`);
    }

    console.log(`\n📊 Total records created: ${totalRecords}`);

    // Display summary
    console.log('\n' + '═'.repeat(50));
    console.log('           DATABASE SEED COMPLETE');
    console.log('═'.repeat(50));
    console.log('\n📋 Test Accounts:\n');
    console.log('   Admin Account:');
    console.log('     Email:    admin@zorvyn.com');
    console.log('     Password: Admin@123');
    console.log('     Role:     admin\n');
    console.log('   Analyst Account:');
    console.log('     Email:    analyst@zorvyn.com');
    console.log('     Password: Analyst@123');
    console.log('     Role:     analyst\n');
    console.log('   Viewer Account:');
    console.log('     Email:    viewer@zorvyn.com');
    console.log('     Password: Viewer@123');
    console.log('     Role:     viewer\n');
    console.log('   Inactive Account:');
    console.log('     Email:    inactive@zorvyn.com');
    console.log('     Password: Inactive@123');
    console.log('     Status:   inactive (cannot login)\n');
    console.log('═'.repeat(50) + '\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed\n');
    process.exit(0);
  }
}

// Run seed
seedDatabase();

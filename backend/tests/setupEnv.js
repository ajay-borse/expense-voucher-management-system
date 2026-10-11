const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Explicitly load .env.test before any application code or Prisma client is required
const envTestPath = path.resolve(__dirname, '../.env.test');

if (!fs.existsSync(envTestPath)) {
  console.error('FATAL: .env.test file is missing at:', envTestPath);
  console.error('Please provide a valid .env.test file with test database configuration.');
  process.exit(1);
}

dotenv.config({ path: envTestPath, override: true });

process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL is missing in .env.test.');
  console.error('Please configure DATABASE_URL pointing to your dedicated test database.');
  process.exit(1);
}

// CRITICAL SAFETY CHECK: Refuse to execute if database URL does not point to test database
if (!process.env.DATABASE_URL.includes('expense_voucher_test_db')) {
  console.error('FATAL: Attempted to run tests against non-test database:', process.env.DATABASE_URL);
  process.exit(1);
}


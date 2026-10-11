const prisma = require('../src/config/prisma');

beforeAll(async () => {
  // Verify test database connection and ensure identity matches test db
  try {
    const res = await prisma.$queryRawUnsafe('SELECT current_database();');
    const currentDb = res[0]?.current_database;
    if (currentDb !== 'expense_voucher_test_db') {
      throw new Error(`CRITICAL SAFETY ERROR: Connected to "${currentDb}" instead of "expense_voucher_test_db"`);
    }
  } catch (err) {
    console.error('Test database verification failed:', err.message);
    throw err;
  }
});

afterAll(async () => {
  // Gracefully disconnect Prisma and terminate pg connection pool
  try {
    await prisma.$disconnect();
    if (prisma.$pgPool) {
      await prisma.$pgPool.end();
    }
  } catch (err) {
    console.warn('Error closing database connection pool:', err.message);
  }
});

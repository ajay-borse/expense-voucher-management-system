const prisma = require('../config/prisma');

/**
 * Concurrency-safe atomic voucher number generator using PostgreSQL sequences.
 * Format: VCH-YYYY-000001
 *
 * @param {Object} db - Prisma client or transaction instance
 * @param {number} [overrideYear] - Optional year override for testing
 * @returns {Promise<string>} Unique voucher number
 */
const generateVoucherNumber = async (db = prisma, overrideYear = null) => {
  const year = overrideYear || new Date().getFullYear();
  const seqName = `voucher_seq_${year}`;

  // Ensure yearly PostgreSQL sequence exists atomically
  await db.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS "${seqName}" START 1;`);

  // Obtain next sequence value atomically
  const result = await db.$queryRawUnsafe(`SELECT nextval('"${seqName}"')::bigint as nextval;`);
  const nextVal = result[0]?.nextval || 1n;

  const paddedSequence = String(nextVal).padStart(6, '0');
  return `VCH-${year}-${paddedSequence}`;
};

module.exports = {
  generateVoucherNumber,
};

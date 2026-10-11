const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Validates user credentials and generates a signed JWT access token.
 *
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email address
 * @param {string} credentials.password - Plaintext password
 * @returns {Promise<Object|null>} Token and safe user details, or null on failed authentication
 */
const loginUser = async ({ email, password }) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }

  // Look up user by lowercase email
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Generic rejection if user doesn't exist
  if (!user) {
    return null;
  }

  // Compare passwords with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  // Sign JWT access token with user ID and database role in payload
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  const accessToken = jwt.sign(
    {
      sub: user.id,
      userId: user.id,
      role: user.role,
    },
    secret,
    { expiresIn }
  );

  // Return safe user profile without passwordHash
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    department: user.department,
    signatureUrl: user.signatureUrl,
  };

  return {
    accessToken,
    user: safeUser,
  };
};

module.exports = {
  loginUser,
};

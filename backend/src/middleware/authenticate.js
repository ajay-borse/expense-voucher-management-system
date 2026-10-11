const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Authentication middleware that verifies JWT access tokens
 * and loads the current verified user directly from the database.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing or invalid authorization token format',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Access token is required',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('CRITICAL: JWT_SECRET environment variable is missing.');
      return res.status(500).json({
        success: false,
        message: 'Server security configuration error',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      // Return safe, non-revealing 401 for expired or invalid signature tokens
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid or expired token',
      });
    }

    const userId = decoded.sub || decoded.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token payload',
      });
    }

    // Always fetch the live user from PostgreSQL database to ensure existence and verified role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employeeId: true,
        department: true,
        signatureUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User account does not exist or has been removed',
      });
    }

    // Attach safe user record to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
};

module.exports = authenticate;

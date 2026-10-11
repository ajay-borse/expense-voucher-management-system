/**
 * Reusable role-based authorization middleware factory.
 * Enforces role access strictly based on the database-loaded req.user.role.
 *
 * @param {...string} roles - List of allowed UserRole values (e.g., 'EMPLOYEE', 'DIRECTOR', 'ACCOUNTS')
 * @returns {Function} Express middleware handler
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required before authorization',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource',
      });
    }

    next();
  };
};

module.exports = authorize;

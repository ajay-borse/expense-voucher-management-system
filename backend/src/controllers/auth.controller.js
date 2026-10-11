const authService = require('../services/auth.service');

/**
 * Handle user login request
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.loginUser({ email, password });

    if (!result) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return current authenticated user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // req.user is guaranteed to be present from authenticate middleware
    return res.status(200).json({
      success: true,
      data: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        employeeId: req.user.employeeId,
        department: req.user.department,
        signatureUrl: req.user.signatureUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getCurrentUser,
};

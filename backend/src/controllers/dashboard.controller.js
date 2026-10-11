const dashboardService = require('../services/dashboard.service');

/**
 * Handle GET /api/dashboard request.
 * Obtains role strictly from req.user.role and returns role-specific summary.
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const user = req.user;
    const data = await dashboardService.getDashboardSummary(user);

    return res.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
};

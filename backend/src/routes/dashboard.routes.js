const express = require('express');
const authenticate = require('../middleware/authenticate');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

// GET /api/dashboard - Access: Any authenticated user (role-dispatched)
router.get('/', authenticate, dashboardController.getDashboardSummary);

module.exports = router;

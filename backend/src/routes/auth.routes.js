const express = require('express');
const { login, getCurrentUser } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const { loginSchema } = require('../validators/auth.validator');

const router = express.Router();

// Public route: User login
router.post('/login', validate(loginSchema), login);

// Protected route: Current user profile
router.get('/me', authenticate, getCurrentUser);

module.exports = router;

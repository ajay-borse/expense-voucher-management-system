const express = require('express');
const authenticate = require('../middleware/authenticate');
const uploadSignature = require('../middleware/uploadSignature');
const userController = require('../controllers/user.controller');

const router = express.Router();

// Upload signature for current authenticated user
router.post('/signature', authenticate, uploadSignature, userController.uploadSignature);

// Securely view signature file for authenticated users
router.get('/signature/file/:filename', authenticate, userController.getSignatureFile);

module.exports = router;

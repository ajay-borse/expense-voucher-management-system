const userService = require('../services/user.service');

/**
 * Handle user signature image upload
 * POST /api/users/signature
 */
const uploadSignature = async (req, res, next) => {
  try {
    // Rely strictly on verified token identity (req.user.id)
    const userId = req.user.id;
    const file = req.file;

    const result = await userService.updateUserSignature(userId, file);

    return res.status(200).json({
      success: true,
      message: 'Signature uploaded successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Securely serve signature image file to authenticated users
 * GET /api/users/signature/file/:filename
 */
const getSignatureFile = async (req, res, next) => {
  try {
    const { filename } = req.params;

    const fileInfo = userService.getSignatureFile(filename);

    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        message: 'Signature file not found',
      });
    }

    // Set secure response headers
    res.setHeader('Content-Type', fileInfo.contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    return res.sendFile(fileInfo.filePath);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadSignature,
  getSignatureFile,
};

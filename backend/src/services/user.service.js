const path = require('path');
const fs = require('fs');
const prisma = require('../config/prisma');
const {
  SIGNATURES_DIR,
  isValidFilename,
  safeRemoveFile,
  deleteManagedSignatureFile,
} = require('../utils/signatureFiles');

/**
 * Updates a user's signature in the database, removes the old managed file,
 * and cleans up the newly uploaded file if the database operation fails.
 *
 * @param {string} userId - User ID to update
 * @param {Object} file - Multer uploaded file object
 * @returns {Promise<Object>} Updated signature URL and safe user profile
 */
const updateUserSignature = async (userId, file) => {
  const newSignatureUrl = `/api/users/signature/file/${file.filename}`;

  // Fetch current signature URL prior to updating
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, signatureUrl: true },
  });

  if (!existingUser) {
    // If user no longer exists, remove the uploaded file immediately
    safeRemoveFile(file.path);
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const oldSignatureUrl = existingUser.signatureUrl;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { signatureUrl: newSignatureUrl },
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

    // Database update succeeded: safely clean up previous managed signature
    if (oldSignatureUrl) {
      deleteManagedSignatureFile(oldSignatureUrl);
    }

    return {
      signatureUrl: newSignatureUrl,
      user: updatedUser,
    };
  } catch (dbError) {
    // Database update failed: clean up the newly saved file to prevent orphaned storage
    safeRemoveFile(file.path);
    throw dbError;
  }
};

/**
 * Resolves and validates a requested signature file from the managed storage directory.
 *
 * @param {string} filename - Filename requested by client
 * @returns {Object|null} File descriptor with path and mime type, or null if invalid/missing
 */
const getSignatureFile = (filename) => {
  if (!isValidFilename(filename)) {
    return null;
  }

  const resolvedPath = path.resolve(SIGNATURES_DIR, filename);

  // Directory traversal guard
  if (!resolvedPath.startsWith(SIGNATURES_DIR)) {
    return null;
  }

  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';

  return {
    filePath: resolvedPath,
    contentType,
  };
};

module.exports = {
  updateUserSignature,
  getSignatureFile,
};

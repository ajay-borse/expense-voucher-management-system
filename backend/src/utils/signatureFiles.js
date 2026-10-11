const fs = require('fs');
const path = require('path');

// Managed directory for uploaded signatures
const SIGNATURES_DIR = path.resolve(__dirname, '../../uploads/signatures');

// Known protected seed files that should never be removed from disk
const PROTECTED_DEMO_FILES = new Set(['employee-demo.png', 'director-demo.png']);

// Permitted extensions and content types
const MIME_TO_EXTENSION = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
};

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

/**
 * Ensures the signature uploads directory exists.
 */
const ensureSignaturesDir = () => {
  if (!fs.existsSync(SIGNATURES_DIR)) {
    fs.mkdirSync(SIGNATURES_DIR, { recursive: true });
  }
};

/**
 * Validates file magic bytes to prevent spoofed MIME types/extensions.
 *
 * @param {string} filePath - Absolute path to uploaded file
 * @returns {boolean} True if magic bytes match PNG or JPEG
 */
const isValidImageMagicBytes = (filePath) => {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a;

    // JPEG: FF D8 FF
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    return isPng || isJpeg;
  } catch (error) {
    console.error('Error verifying image magic bytes:', error.message);
    return false;
  }
};

/**
 * Strictly validates filename to prevent directory traversal or malformed names.
 *
 * @param {string} filename - Filename to validate
 * @returns {boolean}
 */
const isValidFilename = (filename) => {
  if (!filename || typeof filename !== 'string') return false;
  // Disallow directory separators or parent directory references
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }
  // Standard safe filename pattern: alphanumeric, hyphens, underscores + allowed extension
  return /^[a-zA-Z0-9_-]+\.(png|jpg|jpeg)$/i.test(filename);
};

/**
 * Safely removes a file from disk if it exists, ignoring missing errors.
 *
 * @param {string} filePath - Absolute file path
 */
const safeRemoveFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to remove file at ${filePath}:`, err.message);
  }
};

/**
 * Deletes an old signature file managed by the application.
 * Never deletes files outside SIGNATURES_DIR or protected demo files.
 *
 * @param {string} signatureUrl - Existing signature URL or path stored in DB
 */
const deleteManagedSignatureFile = (signatureUrl) => {
  if (!signatureUrl || typeof signatureUrl !== 'string') return;

  const filename = path.basename(signatureUrl);

  // Do not delete demo assets
  if (PROTECTED_DEMO_FILES.has(filename)) {
    return;
  }

  if (!isValidFilename(filename)) {
    return;
  }

  const resolvedPath = path.resolve(SIGNATURES_DIR, filename);

  // Security guard: verify target is strictly inside SIGNATURES_DIR
  if (!resolvedPath.startsWith(SIGNATURES_DIR)) {
    console.warn(`Attempted to delete file outside signatures directory: ${resolvedPath}`);
    return;
  }

  safeRemoveFile(resolvedPath);
};

module.exports = {
  SIGNATURES_DIR,
  MIME_TO_EXTENSION,
  ALLOWED_EXTENSIONS,
  ensureSignaturesDir,
  isValidImageMagicBytes,
  isValidFilename,
  safeRemoveFile,
  deleteManagedSignatureFile,
};

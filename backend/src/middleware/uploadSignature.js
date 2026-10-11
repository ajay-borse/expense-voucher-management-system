const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const {
  SIGNATURES_DIR,
  ensureSignaturesDir,
  MIME_TO_EXTENSION,
  ALLOWED_EXTENSIONS,
  isValidImageMagicBytes,
  safeRemoveFile,
} = require('../utils/signatureFiles');

// Configure disk storage with randomized filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureSignaturesDir();
    cb(null, SIGNATURES_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const normalizedExt = ALLOWED_EXTENSIONS.has(ext)
      ? ext
      : MIME_TO_EXTENSION[file.mimetype] || '.png';

    const randomName = `sig-${crypto.randomUUID()}${normalizedExt}`;
    cb(null, randomName);
  },
});

// File filter checking extension and MIME type
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isAllowedExt = ALLOWED_EXTENSIONS.has(ext);
  const isAllowedMime = mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/jpg';

  if (!isAllowedExt || !isAllowedMime) {
    return cb(
      new Error('Unsupported file type. Only PNG, JPG, and JPEG images are allowed.')
    );
  }

  cb(null, true);
};

// Reusable upload middleware generator
const createUploadSignatureMiddleware = (fieldName = 'signature') => {
  const upload = multer({
    storage,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2 MB
      files: 1,
    },
    fileFilter,
  }).single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'File size exceeds the 2 MB limit',
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'Invalid file upload',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Signature file is required',
        });
      }

      // Deep inspection: validate image magic bytes to prevent spoofed content
      if (!isValidImageMagicBytes(req.file.path)) {
        safeRemoveFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Invalid image content: file does not match valid image signature',
        });
      }

      next();
    });
  };
};

/**
 * Default middleware handling 'signature' form field,
 * or callable as uploadSignature('customFieldName') for future reuse.
 */
const uploadSignature = (req, res, next) => {
  if (typeof req === 'string') {
    return createUploadSignatureMiddleware(req);
  }
  return createUploadSignatureMiddleware('signature')(req, res, next);
};

module.exports = uploadSignature;

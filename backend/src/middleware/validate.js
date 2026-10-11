/**
 * Generic request body validation middleware using Zod schemas.
 * Returns consistent HTTP 400 responses with field-specific messages.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const formattedErrors = issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  // Assign sanitized parsed data to req.body
  req.body = result.data;
  next();
};

module.exports = validate;

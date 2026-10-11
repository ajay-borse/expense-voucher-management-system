/**
 * Generic request validation middleware using Zod schemas.
 * Validates request body, query, or params.
 * Returns consistent HTTP 400 responses with field-specific messages.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} [source='body'] - Request property to validate
 */
const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

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

  // Assign sanitized parsed data to req[source]
  req[source] = result.data;
  next();
};

module.exports = validate;

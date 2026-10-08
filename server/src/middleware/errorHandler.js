/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';

  // Handle Multer errors (e.g. file size limit exceeded)
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size limit exceeded. Maximum allowed size is 5 MB.';
  }
  if (err.message === 'Only PDF files are allowed.') {
    statusCode = 400;
    message = 'Only PDF resume files are allowed.';
  }

  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body must contain valid JSON.';
  }

  if (err.message === 'No readable text found. Please upload a text-based PDF.') {
    statusCode = 400;
    message = 'No readable text was found. Please upload a text-based PDF.';
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = err.errors ? err.errors.map(e => e.message).join(', ') : 'Validation error';
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account with that ${field} already exists.`;
  }

  console.error(`[Error Handler] ${statusCode} ${req.method} ${req.path}`);

  res.status(statusCode).json({
    success: false,
    message: err.isAiServiceError
      ? err.publicMessage || 'The AI service could not complete this request. Please try again later.'
      : statusCode >= 500
        ? 'An unexpected server error occurred. Please try again.'
        : message
  });
};

module.exports = errorHandler;

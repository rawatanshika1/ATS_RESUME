const { z } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
      return res.status(400).json({
        success: false,
        message: formattedErrors,
        errors: error.errors
      });
    }
    next(error);
  }
};

module.exports = validate;

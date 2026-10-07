const createAiServiceError = () => {
  const error = new Error('AI service request failed.');
  error.statusCode = 502;
  error.isAiServiceError = true;
  return error;
};

module.exports = createAiServiceError;

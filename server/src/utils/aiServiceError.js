const createAiServiceError = (cause) => {
  const status = Number(cause?.status || cause?.statusCode);
  const isTimeout = cause?.name === 'TimeoutError' || cause?.name === 'AbortError' ||
    /timeout/i.test(cause?.code || '');
  let message = 'The AI service could not complete this request. Please try again later.';

  if (isTimeout) {
    message = 'The AI service request timed out after 60 seconds. Please try again later.';
  } else if (status === 429) {
    message = 'The AI service is rate limited (upstream HTTP 429). Please try again later.';
  } else if (status >= 500) {
    message = `The AI service is temporarily unavailable (upstream HTTP ${status}). Please try again later.`;
  }

  const error = new Error(message, cause ? { cause } : undefined);
  error.statusCode = 502;
  error.isAiServiceError = true;
  error.publicMessage = message;
  return error;
};

module.exports = createAiServiceError;

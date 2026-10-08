const { GoogleGenAI } = require('@google/genai');

const GEMINI_TIMEOUT_MS = 60000;
const MAX_RESUME_CHARS = 15000;
const MAX_JOB_DESCRIPTION_CHARS = 10000;
const MAX_OUTPUT_TOKENS = 3000;
let client;

const getGeminiModel = () => {
  const model = process.env.GEMINI_MODEL;
  if (!model) {
    throw new Error('GEMINI_MODEL is not configured in server environment variables.');
  }
  return model;
};

const getGeminiClient = () => {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in server environment variables.');
    }
    client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: GEMINI_TIMEOUT_MS,
        retryOptions: { attempts: 1 }
      }
    });
  }
  return client;
};

const generateContent = async (contents, config = {}) => {
  const model = getGeminiModel();
  const gemini = getGeminiClient();
  const promptLength = typeof contents === 'string' ? contents.length : JSON.stringify(contents).length;
  const startedAt = Date.now();

  console.info(`[Gemini] Request started: model=${model}, promptChars=${promptLength}`);
  try {
    const response = await gemini.models.generateContent({
      model,
      contents,
      config: {
        ...config,
        maxOutputTokens: config.maxOutputTokens || MAX_OUTPUT_TOKENS,
        thinkingConfig: config.thinkingConfig || { thinkingLevel: 'low' },
        httpOptions: {
          ...config.httpOptions,
          timeout: GEMINI_TIMEOUT_MS,
          retryOptions: { attempts: 1 }
        },
        abortSignal: AbortSignal.timeout(GEMINI_TIMEOUT_MS)
      }
    });
    console.info(`[Gemini] Request completed: model=${model}, promptChars=${promptLength}, elapsedMs=${Date.now() - startedAt}`);
    return response;
  } catch (error) {
    const status = error.status || error.statusCode ||
      (error.name === 'TimeoutError' || error.name === 'AbortError' ? 'timeout' : 'unknown');
    console.info(`[Gemini] Request failed: model=${model}, promptChars=${promptLength}, elapsedMs=${Date.now() - startedAt}, status=${status}`);
    throw error;
  }
};

const generateContentWithRetries = async (contents, config = {}, maxRetries = 1) => {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await generateContent(contents, config);
    } catch (error) {
      const status = Number(error.status || error.statusCode);
      const shouldRetry = status === 429 || status === 503;

      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }
};

module.exports = {
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_OUTPUT_TOKENS,
  MAX_RESUME_CHARS,
  generateContent,
  generateContentWithRetries,
  getGeminiModel
};

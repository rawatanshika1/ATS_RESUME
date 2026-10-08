const pdfParse = require('pdf-parse');

/**
 * Parses PDF buffer and extracts clean readable text.
 * Rejects empty or scanned PDFs lacking extractable text.
 * 
 * @param {Buffer} dataBuffer - Uploaded PDF buffer
 * @returns {Promise<string>} - Extracted & cleaned text
 */
const parsePdfBuffer = async (dataBuffer) => {
  if (!dataBuffer || !Buffer.isBuffer(dataBuffer)) {
    throw new Error('Invalid PDF file buffer provided.');
  }

  console.info(`[PDF Parser] Parsing upload: bytes=${dataBuffer.length}`);
  try {
    const data = await pdfParse(dataBuffer);
    let extractedText = data.text || '';

    // Clean whitespace & control characters
    extractedText = extractedText
      .replace(/[\r\n]+/g, '\n')       // Normalize line breaks
      .replace(/[ \t]+/g, ' ')         // Collapse multiple spaces
      .trim();

    // Remove non-printable / control characters except standard punctuation & letters
    // eslint-disable-next-line no-control-regex
    extractedText = extractedText.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Check if extracted text contains sufficient alphanumeric content
    const alphanumericCount = (extractedText.match(/[a-zA-Z0-9]/g) || []).length;

    if (extractedText.length < 30 || alphanumericCount < 20) {
      console.warn(`[PDF Parser] Rejected upload: extractedChars=${extractedText.length}, alphanumericChars=${alphanumericCount}`);
      throw new Error('No readable text found. Please upload a text-based PDF.');
    }

    // Trim to a safe maximum length (e.g. 15,000 characters) to prevent token overload
    const MAX_TEXT_LENGTH = 15000;
    if (extractedText.length > MAX_TEXT_LENGTH) {
      extractedText = extractedText.substring(0, MAX_TEXT_LENGTH);
    }

    console.info(`[PDF Parser] Extracted text: chars=${extractedText.length}`);
    return extractedText;
  } catch (error) {
    if (error.message.includes('No readable text found')) {
      throw error;
    }
    console.error(`[PDF Parser] Parsing failed: ${error.name}`);
    throw new Error('No readable text found. Please upload a text-based PDF.', { cause: error });
  }
};

module.exports = { parsePdfBuffer };

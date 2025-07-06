import pdf from 'pdf-parse';
import ErrorResponse from './createError.js';

/**
 * Extracts text from a PDF buffer.
 * @param {Buffer} pdfBuffer The buffer containing the PDF data.
 * @returns {Promise<string>} A promise that resolves with the extracted text.
 * @throws {ErrorResponse} If text extraction fails or no text is found.
 */
export async function extractTextFromPDF(pdfBuffer) {
  try {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new ErrorResponse('PDF buffer is empty.', 400);
    }

    const data = await pdf(pdfBuffer);

    if (!data || !data.text || data.text.trim().length === 0) {
      throw new ErrorResponse('No text could be extracted from the PDF.', 400);
    }

    // Basic preprocessing: trim whitespace, replace multiple newlines/spaces
    let text = data.text.trim();
    text = text.replace(/\s*\n\s*/g, '\n'); // Normalize newline spacing
    text = text.replace(/  +/g, ' '); // Normalize multiple spaces

    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    if (error instanceof ErrorResponse) {
      throw error;
    }
    throw new ErrorResponse(`Failed to process PDF: ${error.message}`, 500);
  }
}

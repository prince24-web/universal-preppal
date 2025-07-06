import asyncHandler from '../utils/asyncWrapper.js';
import ErrorResponse from '../utils/createError.js';
import supabase from '../config/supabaseClient.js';
import { extractTextFromPDF } from '../utils/pdfProcessor.js';

// Import AI generation logic from other controllers/services
// These will need to be the core AI interaction functions, not the full controller methods
// Assuming summaries.controller and flashcards.controller export these or can be refactored to do so.
// For now, let's imagine there are functions like:
// import { generateSummaryFromText } from './summaries.controller.js'; // Placeholder
// import { generateFlashcardsFromText } from './flashcards.controller.js'; // Placeholder
import quizController from './quiz.controller.js'; // Actual quiz controller

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client globally within the module
// Ensure GEMINI_API_KEY is set in your backend environment variables
let geminiModel;
try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log("✅ Gemini AI Model initialized for process.controller");
} catch (e) {
    console.error("❌ Failed to initialize Gemini AI Model in process.controller:", e.message);
    // Depending on how critical this is, you might throw error or let requests fail if model is not init
}


// Temporary: Define stubs for AI generation logic from summaries and flashcards controllers
// This is because the current controllers are tightly coupled with request/response, chunking, and DB operations.
// A refactor would be needed to expose pure text-in, data-out functions.

// Placeholder for actual summary generation logic (currently uses OpenRouter, text chunks)
async function generateSummaryFromText(textContent, genAIModel) {
  // This function would need to be adapted from summaries.controller.js
  // to take full text and use the Gemini model for consistency if desired,
  // or use its existing OpenRouter logic.
  // For this integration, we'll use a Gemini-based approach similar to the original Next.js API
  console.log(`📝 Generating summary for text (${textContent.length} characters)`);
  const prompt = `
    Please analyze the following document and create a comprehensive, well-structured summary.
    Requirements:
    - Create 3-5 main sections with clear headings
    - Include key concepts, definitions, and important details
    - Use bullet points for clarity where appropriate
    - Keep it concise but comprehensive (300-500 words)
    - Focus on the most important information for studying
    Document content:
    ${textContent.substring(0, 100000)}
  `;
  try {
    const result = await genAIModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating summary with Gemini:', error);
    throw new ErrorResponse(`Failed to generate summary: ${error.message}`, 500);
  }
}

// Placeholder for actual flashcard generation logic (currently uses OpenRouter, text chunks)
async function generateFlashcardsFromText(textContent, genAIModel) {
  // This function would need to be adapted from flashcards.controller.js
  // or use its existing OpenRouter logic.
  // For this integration, we'll use a Gemini-based approach similar to the original Next.js API
  console.log(`🎴 Generating flashcards for text (${textContent.length} characters)`);
  const prompt = `
    Create flashcards from the following document content.
    Requirements:
    - Generate 15-20 flashcards from the entire document
    - Focus on key concepts, definitions, formulas, and important facts
    - Questions should be clear and concise
    - Answers should be comprehensive but not too long
    - Include a mix of definition, concept, and application questions
    Return the response in this exact JSON format:
    {
      "cards": [
        {
          "front": "Question or term",
          "back": "Answer or definition",
          "category": "concept/definition/application"
        }
      ]
    }
    Document content:
    ${textContent.substring(0, 80000)}
  `;
  try {
    const result = await genAIModel.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      if (data.cards && Array.isArray(data.cards)) {
        return {
          title: `Flashcards (${data.cards.length} cards)`,
          cards: data.cards.map((card, index) => ({ id: index + 1, ...card })),
        };
      }
    }
    throw new Error('Invalid flashcard format from AI');
  } catch (error) {
    console.error('Error generating flashcards with Gemini:', error);
    throw new ErrorResponse(`Failed to generate flashcards: ${error.message}`, 500);
  }
}


/**
 * @desc Process a PDF from Supabase storage and generate selected AI outputs.
 * @route POST /api/process-document
 * @access Private
 */
const processDocument = asyncHandler(async (req, res, next) => {
  const { filePath, fileName, options } = req.body; // filePath is path in Supabase storage
  const userId = req.user?.id; // Assuming authMiddleware attaches Supabase user

  if (!filePath || !options || !Array.isArray(options)) {
    return next(new ErrorResponse('Missing required fields: filePath, options.', 400));
  }
  if (!userId) {
    return next(new ErrorResponse('User not authenticated.', 401));
  }

  // Gemini model is now initialized globally at the top of the file.
  if (!geminiModel) {
    // Handle case where model failed to initialize
    return next(new ErrorResponse('AI model not available. Please contact support.', 503));
  }

  let textContent;

  // 1. Download file from Supabase Storage
  console.log(`📥 Downloading file from Supabase Storage: ${filePath}`);
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('documents') // Assuming 'documents' is the bucket name used by frontend
    .download(filePath);

  if (downloadError) {
    console.error('❌ Supabase download error:', downloadError);
    return next(new ErrorResponse(`Failed to download file: ${downloadError.message}`, 500));
  }

  const arrayBuffer = await fileData.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 2. Extract text from PDF
  console.log('📄 Extracting text from PDF...');
  try {
    textContent = await extractTextFromPDF(buffer);
    console.log(`📊 Extracted ${textContent.length} characters from PDF`);
  } catch (error) {
    return next(error); // error is already an ErrorResponse
  }

  // 3. Process with AI based on selected options
  const results = {};
  let success = true;

  for (const option of options) {
    console.log(`🤖 Processing ${option}...`);
    try {
      switch (option) {
        case 'summary':
          // Using the Gemini-based function for consistency with original Next.js API
          results.summary = await generateSummaryFromText(textContent, geminiModel);
          break;
        case 'flashcards':
          // Using the Gemini-based function for consistency
          results.flashcards = await generateFlashcardsFromText(textContent, geminiModel);
          break;
        case 'quiz':
          // Create a mock request object for the quiz controller
          const mockQuizReq = { body: { textContent }, user: req.user };
          const mockQuizRes = { // Mock response to capture data from quizController
            statusVal: 200,
            jsonVal: null,
            status: function(val) { this.statusVal = val; return this; },
            json: function(val) { this.jsonVal = val; }
          };
          await quizController.generateQuiz(mockQuizReq, mockQuizRes, (err) => { if(err) throw err; });

          if (mockQuizRes.jsonVal && mockQuizRes.jsonVal.success) {
            results.quiz = mockQuizRes.jsonVal.data;
          } else {
            throw new ErrorResponse(mockQuizRes.jsonVal?.error || 'Quiz generation failed', mockQuizRes.statusVal || 500);
          }
          break;
        default:
          console.warn(`⚠️ Unknown option: ${option}`);
          results[option] = { error: `Unknown option: ${option}` };
      }
    } catch (error) {
      console.error(`❌ Error processing ${option}:`, error);
      success = false; // Mark overall success as false if any part fails
      results[option] = {
        error: `Failed to generate ${option}: ${error.message}`,
        status: error.statusCode || 500
      };
       // Handle rate limits specifically for Gemini
      if (error.message && error.message.includes('429') || error.statusCode === 429) {
        // If one service is rate-limited, we might want to stop all and return specific error
        return next(new ErrorResponse('AI service rate limit exceeded. Please wait and try again.', 429));
      }
    }
  }

  console.log('✅ Processing completed.');
  res.status(success || Object.keys(results).some(k => results[k] && !results[k].error) ? 200 : 500).json({
    success: success && Object.keys(results).some(k => results[k] && !results[k].error), // Overall success if at least one item succeeded without error
    ...results,
    fileName: fileName || filePath.split('/').pop(),
    processedAt: new Date().toISOString(),
    textLength: textContent.length,
  });
});

export default {
  processDocument,
};

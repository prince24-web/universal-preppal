import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from '../utils/asyncWrapper.js';
import ErrorResponse from '../utils/createError.js';

// Initialize Gemini AI
// Ensure GEMINI_API_KEY is set in your backend environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * @desc Generate a quiz from text content
 * @route POST /api/quiz/generate
 * @access Private
 */
const generateQuiz = asyncHandler(async (req, res, next) => {
  const { textContent } = req.body;

  if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
    return next(new ErrorResponse('Text content is required to generate a quiz.', 400));
  }

  const maxLength = 80000; // Max length for the model
  const inputText = textContent.length > maxLength
    ? textContent.substring(0, maxLength) + '...[content truncated]'
    : textContent;

  console.log(`❓ Processing document for quiz (${inputText.length} characters)`);

  const prompt = `
    Create a comprehensive quiz from the following document content.

    Requirements:
    - Generate 12-15 multiple choice questions.
    - Include questions of varying difficulty (easy, medium, hard).
    - Focus on key concepts and important details.
    - Each question should have 4 options.
    - Identify key topics covered in the document.

    Return the response in this EXACT JSON format (this is critical for proper integration):
    {
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "questionsData": [
        {
          "question": "Question text here?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct": 0,
          "explanation": "Explanation of why this answer is correct"
        }
      ]
    }

    IMPORTANT:
    - "correct" should be the index (0, 1, 2, or 3) of the correct answer.
    - "topics" should be an array of main topics/subjects covered.
    - "questionsData" should contain all questions.

    Document content:
    ${inputText}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Clean up the response to extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);

      // Validate the structure
      if (!parsedData.topics || !Array.isArray(parsedData.topics)) {
        parsedData.topics = ["General Topics"]; // Default if not provided
      }

      if (!parsedData.questionsData || !Array.isArray(parsedData.questionsData)) {
        throw new Error('No valid questions data found in AI response');
      }

      // Validate each question
      parsedData.questionsData = parsedData.questionsData.map((q, index) => ({
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ["Option A", "Option B", "Option C", "Option D"], // Default options
        correct: typeof q.correct === 'number' && q.correct >= 0 && q.correct <= 3
          ? q.correct
          : 0, // Default correct index
        explanation: q.explanation || "No explanation provided."
      }));

      console.log(`✅ Generated quiz with ${parsedData.questionsData.length} questions and topics: ${parsedData.topics.join(', ')}`);
      res.status(200).json({
        success: true,
        data: parsedData,
      });

    } else {
      throw new Error('No valid JSON found in AI response for quiz generation.');
    }
  } catch (error) {
    console.error('❌ Failed to generate quiz:', error);
    // Check for specific AI related errors if possible, e.g., rate limits
    if (error.message && error.message.includes('429')) { // Placeholder for actual rate limit error check
        return next(new ErrorResponse('AI service rate limit exceeded. Please try again later.', 429));
    }
    return next(new ErrorResponse(`Failed to generate quiz: ${error.message}`, 500));
  }
});

export default {
  generateQuiz,
};

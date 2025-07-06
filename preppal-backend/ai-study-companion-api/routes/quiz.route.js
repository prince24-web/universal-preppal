import { Router } from "express";
import quizController from "../controllers/quiz.controller.js";
import protect from "../middlewares/authMiddleware.js";
// Potentially add other middlewares like token deduction if needed for quizzes
// import verifyTokensAndParse from "../middlewares/verifyTokensAndParse.js";

const router = Router();

// Route to generate a quiz from text content
// Assuming quiz generation might also consume tokens or have specific parsing needs.
// If not, verifyTokensAndParse might not be needed or could be a simpler version.
router.post(
    "/generate",
    protect,
    // verifyTokensAndParse("quiz"), // Example: if quiz generation costs tokens
    quizController.generateQuiz
);

export default router;

import { Router } from "express";
import processController from "../controllers/process.controller.js";
import protect from "../middlewares/authMiddleware.js";

const router = Router();

// Main document processing route
router.post(
    "/document", // Route will be /api/process/document
    protect,
    processController.processDocument
);

export default router;

## Integration of Express Backend - YYYY-MM-DD

This update integrates the Express.js backend (`preppal-backend`) into the Next.js frontend (`prep-pal`), replacing the previous Next.js API route for document processing.

### Key Changes:

1.  **Backend API Integration:**
    *   The frontend now calls the Express backend for PDF processing (summaries, flashcards, quizzes).
    *   The primary Next.js API route `prep-pal/src/app/api/process-pdf/route.js` has been **removed**.
    *   A new central processing endpoint `POST /api/process/document` was created in the Express backend.

2.  **Authentication:**
    *   Frontend API calls to the Express backend are authenticated using Supabase JWTs. The frontend retrieves the current session token and sends it as a Bearer token in the `Authorization` header.
    *   The Express backend's `authMiddleware.js` was confirmed to correctly validate these Supabase JWTs and fetch user details.

3.  **Environment Variables:**
    *   **Frontend (`prep-pal/.env.local`):**
        *   `NEXT_PUBLIC_BACKEND_URL`: Added to specify the URL of the Express backend (e.g., `http://localhost:3001`).
    *   **Backend (`preppal-backend/ai-study-companion-api/.env` - required):**
        *   `SUPABASE_URL`: Needs to be set with your Supabase project URL.
        *   `SUPABASE_SERVICE_ROLE_KEY`: Needs to be set with your Supabase service role key.
        *   `GEMINI_API_KEY`: Needs to be set for AI-powered quiz generation (and summary/flashcards as implemented in the new process controller).
        *   `OPENROUTER_API_KEY`: (If applicable) Required if original summary/flashcard AI logic via OpenRouter is used/retained.
        *   `FRONTEND_URL`: Required for CORS configuration, should be the URL of the Next.js frontend (e.g., `http://localhost:3000`).

4.  **Backend (`preppal-backend/ai-study-companion-api`):**
    *   **New Dependencies:**
        *   `axios`: For general HTTP requests (if needed).
        *   `@supabase/supabase-js`: For Supabase interactions (token verification, file downloads).
        *   `pdf-parse`: For extracting text from PDF files.
    *   **New Files & Routes:**
        *   `utils/pdfProcessor.js`: Utility for extracting text from PDF buffers.
        *   `controllers/quiz.controller.js` & `routes/quiz.route.js`: Handles AI-powered quiz generation from text. Endpoint: `POST /api/quiz/generate`.
        *   `controllers/process.controller.js` & `routes/process.route.js`: Main endpoint for document processing. Endpoint: `POST /api/process/document`. This controller:
            *   Downloads the PDF from Supabase storage (path provided by frontend).
            *   Extracts text using `pdfProcessor.js`.
            *   Calls AI generation logic for summaries, flashcards (using Gemini, similar to original Next.js API), and quizzes (via `quiz.controller.js`).
            *   Returns the generated content directly to the frontend.
    *   **Modifications:**
        *   `middlewares/authMiddleware.js`: Verified to correctly use Supabase for JWT validation.
        *   `config/supabaseClient.js`: Verified to correctly initialize Supabase client using environment variables.
        *   `routes/index.route.js`: Updated to include the new `/api/quiz` and `/api/process` routes.
        *   `server.js`: CORS configuration relies on `FRONTEND_URL`. Default Express port is 3000, ensure no conflict if Next.js also runs on 3000. The backend default is 3000, but `prep-pal`'s `NEXT_PUBLIC_BACKEND_URL` was set to `http://localhost:3001`, implying the backend should run on 3001.

5.  **Frontend (`prep-pal`):**
    *   **Modifications:**
        *   `src/app/upload/page.js`:
            *   The `handleGenerate` function now calls `POST ${process.env.NEXT_PUBLIC_BACKEND_URL}/api/process/document`.
            *   Supabase session token is retrieved and sent in the `Authorization` header.
            *   Response handling is updated to match the structure from the Express backend, including display of partial errors.

### Testing Considerations:
*   Ensure all required environment variables are set in both frontend and backend `.env` files.
*   Verify user authentication flow (Supabase login on frontend, token propagation to backend).
*   Test PDF upload and processing for all options (summary, flashcards, quiz).
*   Check error handling for API failures, AI generation issues, and authentication problems.
*   Confirm CORS is correctly configured if frontend and backend are on different origins/ports. The backend Express server runs on port 3000 by default in its `server.js`, while the frontend's `NEXT_PUBLIC_BACKEND_URL` is set to `http://localhost:3001`. This implies the Express server should be started on port 3001 to match.

### Notes on AI Generation:
*   The new `/api/process/document` endpoint in the backend uses Google Gemini for summaries, flashcards, and quizzes. This aligns the AI provider with what was used in the original Next.js `process-pdf` API route.
*   The existing Express backend routes for summaries (`/api/summarize/*`) and flashcards (`/api/flashcards/*`) use OpenRouter. These routes are still available but are not directly called by the main PDF processing flow from the upload page anymore.

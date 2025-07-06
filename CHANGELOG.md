## Architectural Refactor: Backend-Only Supabase Interaction - YYYY-MM-DD

This update implements a major architectural refactor to ensure that only the Express.js backend (`preppal-backend`) interacts directly with Supabase. The Next.js frontend (`prep-pal`) no longer contains Supabase SDKs or keys and communicates exclusively with the Express backend for all authentication, data, and storage operations.

### Key Changes:

**1. Backend-Exclusive Supabase Interaction:**
    *   All Supabase client-side libraries and configurations have been removed from the Next.js frontend (`prep-pal`).
    *   The Express.js backend (`preppal-backend`) now solely manages all Supabase operations (Auth, Database, Storage) using the Supabase Admin/Service Role Key.

**2. Authentication & Session Management:**
    *   **Backend-Managed Sessions:** The Express backend now issues its own JWTs (JSON Web Tokens) for session management. These tokens are stored in secure, HTTP-only cookies (`prepPalSession`).
    *   **Frontend Auth Service (`prep-pal/src/services/authService.js`):** A new service in the frontend handles all authentication-related API calls to the backend (login, register, logout, get current user, Google OAuth initiation).
    *   **Backend Auth Controller (`preppal-backend/.../auth.controller.js`):**
        *   Handles user registration and login by authenticating against Supabase and then issuing a backend session cookie.
        *   Handles Google OAuth flow, ensuring the final session token is a backend-issued cookie.
        *   Provides endpoints for logout (clearing the cookie) and fetching user data (`/api/auth/me`) based on the backend session.
    *   **Backend Auth Middleware (`preppal-backend/.../authMiddleware.js`):**
        *   Updated to verify the backend-issued JWT from the `prepPalSession` cookie instead of a Bearer token from the client.
    *   **Dependencies:** Added `jsonwebtoken` and `cookie-parser` to the backend.

**3. File Uploads:**
    *   **Frontend (`prep-pal/src/app/upload/page.js`):**
        *   No longer uploads files directly to Supabase Storage.
        *   Sends the PDF file to a new backend endpoint (`POST /api/upload/pdf`).
    *   **Backend (`preppal-backend/.../uploads.controller.js`):**
        *   Receives the file via `multer`.
        *   Uploads the file to Supabase Storage (into the "documents" bucket).
        *   Returns the Supabase file path/key to the frontend.

**4. PDF Processing Flow:**
    *   **Frontend (`prep-pal/src/app/upload/page.js`):**
        *   After receiving the Supabase file path from the backend upload endpoint, it calls the backend's main processing endpoint (`POST /api/process/document`) with this path.
        *   Cookie-based authentication is used for this call (no explicit Authorization header).
    *   **Backend (`preppal-backend/.../process.controller.js`):**
        *   The core logic (downloading file from Supabase, text extraction, AI calls) remains largely the same but is now protected by the cookie-based auth middleware.

**5. Frontend State Management:**
    *   **Auth Context (`prep-pal/src/context/AuthContext.js`):** Implemented to manage global user authentication state (user object, loading status) based on data from `authService.js`.
    *   **UI Components (`prep-pal/src/app/login/page.js`, `ProtectedRoute.js`):**
        *   Refactored to use `AuthContext` and `authService.js` for all auth operations and state.
        *   Removed all direct Supabase SDK usage.

**6. Environment Variables:**
    *   **Frontend (`prep-pal/.env.local`):**
        *   Removed `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
        *   `NEXT_PUBLIC_BACKEND_URL` remains crucial.
    *   **Backend (`preppal-backend/.env`):**
        *   Added `JWT_SECRET` (for backend JWTs) and `COOKIE_SECRET` (for `cookie-parser`).
        *   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `FRONTEND_URL`, `PORT` remain essential.
        *   `BACKEND_API_URL` (or similar like `PUBLIC_BACKEND_URL`) may be needed for constructing OAuth redirect URIs accurately, especially if the backend is behind a proxy in production.

**7. CORS and Cookie Settings:**
    *   Backend CORS configured to accept credentials from `FRONTEND_URL`.
    *   Cookies are set with `HttpOnly`, `Secure` (in production), and `SameSite=Lax`.

### Required User Actions & Testing:

*   **Set Environment Variables:** Critically important to set all required environment variables in both frontend (`.env.local`) and backend (`.env`) files, especially secrets and URLs.
*   **Thorough Testing (as outlined previously):**
    *   Registration (Email/Password, Google OAuth).
    *   Login & Logout.
    *   Session persistence and `ProtectedRoute` behavior.
    *   File upload flow (Frontend -> Backend -> Supabase Storage).
    *   Complete PDF processing flow (triggering backend processing, AI calls, displaying results).
    *   Comprehensive error handling for all scenarios.
    *   Behavior in different browser environments and across varying network conditions.
    *   CORS and cookie handling, especially in deployed/production-like environments.
*   **Review Local User DB Sync:** The synchronization logic between Supabase Auth and the local `users` table in the backend (via `usersCrud`) needs careful review and implementation if it's a strict requirement for other backend functionalities. Placeholders and comments exist in `auth.controller.js`.

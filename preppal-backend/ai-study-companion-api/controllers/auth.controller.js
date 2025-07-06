import supabase from "../config/supabaseClient.js";
import CreateError from "../utils/createError.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import createCrudHandlers from "../utils/crudFactory.js";
import jwt from 'jsonwebtoken';

const usersCrud = createCrudHandlers("users");

// Helper function to generate JWT and set cookie
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const backendToken = jwt.sign(
        { id: user.id, email: user.email, app_metadata: user.app_metadata, user_metadata: user.user_metadata }, // Customize payload as needed
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    const cookieOptions = {
        expires: new Date(Date.now() + (parseInt(process.env.COOKIE_EXPIRES_IN_DAYS || '1') * 24 * 60 * 60 * 1000)),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use 'secure' in production
        sameSite: 'Lax', // Or 'Strict' or 'None' if cross-site
        path: '/',
    };

    // Ensure cookie secret is used if you sign cookies with cookie-parser, though JWT is already signed.
    // For simplicity, we are setting a JWT directly. If using signed cookies:
    // res.cookie('token', backendToken, { ...cookieOptions, signed: true });
    // For now, just setting the cookie without extra signing by cookie-parser itself.
    res.cookie('prepPalSession', backendToken, cookieOptions);

    // Send response (don't send Supabase tokens to client)
    // Send back user data that is safe for the client
    const clientSafeUser = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email, // Example
        // Add other relevant fields from user.user_metadata or user.app_metadata
    };

    res.status(statusCode).json({
        success: true,
        user: clientSafeUser,
        // Do NOT send backendToken or Supabase session tokens here
    });
};

const registerUser = asyncWrapper(async (req, res, next) => {
    const { email, password, username, fullName } = req.body; // Assuming fullName might also be provided

    if (!supabase) return next(new CreateError("Database connection not available", 500));
    if (!email || !password || !username) return next(new CreateError("Please provide email, password, and username", 400));

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for now, adjust if email verification flow is needed
        user_metadata: { username, full_name: fullName || username },
    });

    if (authError) return next(new CreateError(`Supabase auth error: ${authError.message}`, 400));
    if (!authData.user) return next(new CreateError("User creation failed in Supabase Auth", 500));

    const supabaseUser = authData.user;

    // 2. (Optional but recommended) Create user in local 'users' table if you have one
    // This is where usersCrud would be used. The current usersCrud might need adjustment
    // if it expects IDs or other fields not directly available from admin.createUser response
    // or if it's meant for a different purpose.
    // For now, we assume the Supabase user object is sufficient or local DB sync is handled elsewhere/not strictly needed for login.
    // Example:
    // try {
    //     await usersCrud.create({
    //         id: supabaseUser.id, // Ensure your users table uses Supabase UUIDs as primary key
    //         email: supabaseUser.email,
    //         username: supabaseUser.user_metadata.username,
    //         full_name: supabaseUser.user_metadata.full_name,
    //         // other fields
    //     });
    // } catch (dbError) {
    //     // If DB insert fails, you might want to clean up the Supabase auth user or handle inconsistency
    //     console.error("Failed to create user in local DB:", dbError);
    //     // Potentially: await supabase.auth.admin.deleteUser(supabaseUser.id);
    //     return next(new CreateError("User registration failed during database sync.", 500));
    // }


    // 3. "Log in" the new user to get a Supabase session, then issue backend token
    // This step is crucial because admin.createUser doesn't return a session.
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (loginError || !loginData.user) {
        console.error("Failed to sign in new user after registration:", loginError?.message);
        // This is an inconsistent state. User exists in Supabase auth but couldn't be logged in.
        // For now, return an error. A more robust solution might involve manual admin intervention or specific user guidance.
        return next(new CreateError("User registered, but login failed. Please try logging in manually.", 500));
    }

    sendTokenResponse(loginData.user, 201, res);
});

const loginUser = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;

    if (!supabase) return next(new CreateError("Database connection not available", 500));
    if (!email || !password) return next(new CreateError("Please provide email and password", 400));

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) return next(new CreateError(error.message, 401));
    if (!data.user) return next(new CreateError("Login failed, user data not found.", 401));

    sendTokenResponse(data.user, 200, res);
});

const logoutUser = asyncWrapper(async (req, res, next) => {
    // Clear the backend session cookie
    res.cookie('prepPalSession', 'none', {
        expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
    });

    // Note: We are not explicitly calling supabase.auth.signOut() here.
    // The backend session is terminated. If Supabase access tokens were managed
    // server-side per session, this would be the place to invalidate them.
    // Since client has no Supabase tokens, this is sufficient for client-side logout.

    res.status(200).json({ success: true, message: "Logged out successfully" });
});

const getMe = asyncWrapper(async (req, res, next) => {
    // This route is protected by the new authMiddleware which verifies the backend JWT
    // and attaches user info (from that JWT) to req.user.
    // The req.user here is the payload of OUR backend JWT.
    if (!req.user) {
        return next(new CreateError("User not found or token invalid", 401));
    }

    // We can enrich this by fetching fresh data from Supabase if needed,
    // or from local DB if req.user.id is available.
    // For now, return the user data stored in the backend JWT.
    const clientSafeUser = {
        id: req.user.id,
        email: req.user.email,
        username: req.user.user_metadata?.username || req.user.email,
        fullName: req.user.user_metadata?.full_name,
        // Add other relevant fields
    };

    res.status(200).json({
        success: true,
        user: clientSafeUser,
    });
});


// --- Google OAuth ---
// Google OAuth needs significant changes to align with backend-managed sessions.
// The backend callback will receive the Supabase session, then issue its own cookie.

const googleOAuthInitiate = asyncWrapper(async (req, res, next) => {
    if (!supabase) return next(new CreateError("Database connection not available", 500));

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.BACKEND_API_URL || req.protocol + '://' + req.get('host')}/api/auth/google/callback`, // Backend callback
            // queryParams: { access_type: 'offline', prompt: 'consent' } // if needed
        },
    });

    if (error) return next(new CreateError(error.message, 500));
    res.status(200).json({ url: data.url }); // Send the Supabase OAuth URL to frontend
});

const googleOAuthCallback = asyncWrapper(async (req, res, next) => {
    const { code } = req.query; // Supabase sends 'code' to callback

    if (!supabase) return next(new CreateError("Database connection not available", 500));
    if (!code) return next(new CreateError("OAuth code missing", 400));

    // Exchange code for Supabase session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(String(code));

    if (sessionError) {
        console.error("Supabase OAuth code exchange error:", sessionError);
        // Redirect to frontend with error
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    if (!sessionData.user || !sessionData.session) {
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_incomplete`);
    }

    const { user } = sessionData;

    // Here, you might want to check if this user exists in your local 'users' table
    // and create them if not. This logic depends on your specific requirements for local DB sync.
    // Example:
    // const localUser = await usersCrud.getOne(user.id);
    // if (!localUser) {
    //   await usersCrud.create({ id: user.id, email: user.email, ...});
    // }

    // Now, issue your backend's session cookie
    // Create a simplified user object for sendTokenResponse if needed, or pass Supabase user directly
    const userForToken = {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata
    };

    // Set cookie and redirect to frontend (e.g., dashboard)
    // We need to use a different way to send response than sendTokenResponse for redirect.
    const backendToken = jwt.sign(
        { id: userForToken.id, email: userForToken.email, app_metadata: userForToken.app_metadata, user_metadata: userForToken.user_metadata },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    const cookieOptions = {
        expires: new Date(Date.now() + (parseInt(process.env.COOKIE_EXPIRES_IN_DAYS || '1') * 24 * 60 * 60 * 1000)),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
    };
    res.cookie('prepPalSession', backendToken, cookieOptions);

    // Redirect to a frontend page, e.g., dashboard or a success page
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?login_success=true`);
});


const authController = {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    googleOAuthInitiate, // Renamed for clarity
    googleOAuthCallback,
};
export default authController;

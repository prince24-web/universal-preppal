import jwt from 'jsonwebtoken';
import CreateError from "../utils/createError.js";
// Supabase client might not be needed here if all user info is in the backend JWT
// import supabase from "../config/supabaseClient.js";
// import createCrudHandlers from "../utils/crudFactory.js"; // For local DB user fetch

// const usersCrud = createCrudHandlers("users"); // If fetching full user from local DB

const protect = async (req, res, next) => {
    let token;

    // Check if 'prepPalSession' cookie exists
    if (req.cookies && req.cookies.prepPalSession) {
        token = req.cookies.prepPalSession;
    }

    // For signed cookies, if we were using them:
    // if (req.signedCookies && req.signedCookies.prepPalSession) {
    //    token = req.signedCookies.prepPalSession;
    // }


    if (!token) {
        return next(new CreateError("Not authorized, no token (session cookie missing)", 401));
    }

    try {
        // Verify token using the backend's JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Token is valid, attach decoded payload to request object
        // This payload contains what we put in it during sendTokenResponse (id, email, metadata)
        req.user = decoded;

        // Optional: If you need to fetch the most up-to-date user profile from your local DB
        // or Supabase on every request, you can do it here using decoded.id.
        // Example with local DB:
        // const fullUser = await usersCrud.getOne(decoded.id);
        // if (!fullUser) {
        //     return next(new CreateError("User from token not found in DB", 401));
        // }
        // req.user = fullUser;
        //
        // Or with Supabase (less common if backend JWT is the source of truth for session):
        // const { data: { user: supabaseUser }, error } = await supabase.auth.admin.getUserById(decoded.id);
        // if (error || !supabaseUser) return next(new CreateError("User not found via Supabase admin", 401));
        // req.user = supabaseUser; // Or merge, etc.

        next();
    } catch (err) {
        // Handles JWT errors like 'JsonWebTokenError', 'TokenExpiredError'
        console.error("Auth middleware error:", err.message);
        if (err.name === 'TokenExpiredError') {
            return next(new CreateError("Not authorized, token expired", 401));
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new CreateError("Not authorized, token invalid", 401));
        }
        return next(new CreateError("Not authorized, token verification failed", 401));
    }
};

export default protect;

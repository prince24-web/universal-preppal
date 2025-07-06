const getBackendUrl = () => {
    const url = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!url) {
        console.warn("NEXT_PUBLIC_BACKEND_URL is not set. Defaulting to http://localhost:3001");
        return "http://localhost:3001";
    }
    return url;
};

const API_BASE_URL = `${getBackendUrl()}/api/auth`;

/**
 * Handles API responses, throwing an error for non-successful status codes.
 * @param {Response} response - The fetch API response.
 * @returns {Promise<any>} - The JSON response data.
 */
async function handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
    }
    return data;
}

/**
 * Logs in a user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Promise<object>} - The user data from the backend.
 */
export async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
}

/**
 * Registers a new user.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @param {string} username - The user's username.
 * @param {string} [fullName] - The user's full name (optional).
 * @returns {Promise<object>} - The user data from the backend.
 */
export async function register(email, password, username, fullName) {
    const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, username, fullName }),
    });
    return handleResponse(response);
}

/**
 * Logs out the current user.
 * @returns {Promise<object>} - The success message from the backend.
 */
export async function logout() {
    const response = await fetch(`${API_BASE_URL}/logout`, {
        method: 'POST',
        // Credentials 'include' is important for cookies to be sent
        credentials: 'include',
    });
    return handleResponse(response);
}

/**
 * Fetches the current authenticated user's data.
 * Relies on the httpOnly cookie being sent by the browser.
 * @returns {Promise<object|null>} - The user data or null if not authenticated/error.
 */
export async function getCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/me`, {
            method: 'GET',
            // Credentials 'include' is important for cookies to be sent
            credentials: 'include',
        });
        // getCurrentUser should return null on error (e.g. 401) rather than throwing for easier UI handling
        if (!response.ok) {
            if (response.status === 401) {
                console.log('Not authenticated or session expired.');
            } else {
                console.error('Error fetching current user:', response.status);
            }
            return null;
        }
        const data = await response.json();
        return data.user; // Assuming backend sends { success: true, user: {...} }
    } catch (error) {
        console.error('Network or other error fetching current user:', error);
        return null; // Return null on network error etc.
    }
}

/**
 * Initiates Google OAuth flow.
 * @returns {Promise<object>} - Object containing the Google OAuth URL.
 */
export async function initiateGoogleOAuth() {
    const response = await fetch(`${API_BASE_URL}/google/initiate`, { // Matches the new backend route
        method: 'POST', // Or GET, depending on backend implementation; POST is fine
        headers: {
            'Content-Type': 'application/json',
        },
        // body: JSON.stringify({ redirectTo: `${window.location.origin}/auth/callback` }) // If backend needs a frontend redirect URL
    });
    const data = await handleResponse(response);
    // Backend should return { url: "..." }
    if (data.url) {
        window.location.href = data.url; // Redirect the user to Google's OAuth page
    } else {
        throw new Error("Failed to get Google OAuth URL from backend.");
    }
    return data; // Though redirection will happen before this is likely used
}

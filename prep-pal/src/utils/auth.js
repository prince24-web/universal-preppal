// auth.js
// import { supabase } from './supabaseClient.js'; // No longer directly using supabase client for auth
// import { saveUserData } from './saveData.js'; // User data saving will be handled by the backend

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3000/api';

function storeTokens(session) {
  if (session && session.access_token) {
    localStorage.setItem('access_token', session.access_token);
    if (session.refresh_token) {
      localStorage.setItem('refresh_token', session.refresh_token);
    }
  }
}

function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function getAccessToken() {
  return localStorage.getItem('access_token');
}

// Sign Up with Email/Password
export async function signUp(email, password, username) { // Changed fullName to username to match backend
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Sign up failed');
    }

    // Backend's register endpoint might not return a session directly.
    // Typically, after registration, the user might need to login separately.
    // Or, the backend could be modified to return a session upon successful registration.
    // For now, assuming registration success means user needs to login.
    // If backend sends tokens on register, uncomment and adapt:
    // if (result.session) {
    //   storeTokens(result.session);
    // }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
}

// Sign In with Email/Password
export async function signIn(email, password) {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (!response.ok || result.status !== 'success') {
      throw new Error(result.message || 'Sign in failed');
    }

    if (result.session) {
      storeTokens(result.session);
      // The backend sends back user and session, frontend might only need to store tokens
      // and use getCurrentUser to fetch user details if needed.
      return { success: true, data: { user: result.user, session: result.session } };
    } else {
      throw new Error('No session data received from login');
    }
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

// Sign In with Google
export async function signInWithGoogle() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Backend expects redirectTo, but it's determined server-side now.
      // Frontend just needs to initiate it.
      // body: JSON.stringify({ redirectTo: window.location.origin + '/auth/callback' })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Google sign in initiation failed');
    }

    if (result.url) {
      // Redirect the user to Google's OAuth page
      window.location.href = result.url;
    } else {
      throw new Error('No OAuth URL received from backend');
    }
    // The actual sign-in completion will happen via redirect and token handling on a callback page
    // This function only starts the process.
    return { success: true };
  } catch (error) {
    console.error('Google sign in error:', error);
    throw error;
  }
}


// Handle Google OAuth Callback
// This function should be called on the page that Google redirects to.
// It expects tokens to be in the URL query parameters.
export function handleGoogleCallback() {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const error = params.get('error');

  if (error) {
    console.error('Google OAuth callback error:', error);
    clearTokens(); // Clear any partial tokens
    // Potentially redirect to login page with error message
    // window.location.href = '/login?error=' + error;
    return { success: false, error };
  }

  if (accessToken) {
    const session = { access_token: accessToken, refresh_token: refreshToken };
    storeTokens(session);
    // Remove tokens from URL for cleanliness and security
    // window.history.replaceState({}, document.title, window.location.pathname);
    return { success: true, session };
  }
  // If no tokens and no error, it might be an unexpected state or still processing.
  // Or the redirect URI might not have been hit correctly.
  return { success: false, error: 'No tokens found in callback URL' };
}


// Sign Out
export async function signOut() {
  try {
    // Optionally, call a backend logout endpoint if it exists and performs server-side session invalidation
    // await fetch(`${BACKEND_API_URL}/auth/logout`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${getAccessToken()}`,
    //   },
    // });

    clearTokens();
    // TODO: Add logic to update global auth state (e.g., redirect to login, clear user context)
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    // Even if backend logout fails, clear local tokens
    clearTokens();
    throw error;
  }
}

// Get Current User - This will now fetch from a backend protected route
export async function getCurrentUser() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(`${BACKEND_API_URL}/users/me`, { // Assuming a '/users/me' endpoint
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) { // Token might be expired or invalid
      clearTokens();
      // TODO: Potentially try to refresh token here if refresh token is available
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const result = await response.json();
    return result.data.user; // Assuming backend sends { status: 'success', data: { user: { ... } } }
  } catch (error) {
    console.error('Get user error:', error);
    // If error fetching user (e.g. network, invalid token), clear tokens
    // clearTokens(); // Decide if clearing tokens on any fetch error is desired
    return null;
  }
}


// Listen to Auth Changes - This becomes more complex as it's not a direct Supabase subscription.
// We need a way to react to login/logout events.
// This could be done via a custom event system or a state management library (Context API, Redux, Zustand).
// For now, this function will be simplified or removed, and components will rely on calling
// getCurrentUser or checking token presence and then updating state.
// A proper implementation would involve a global auth context.

// Placeholder for onAuthStateChange, actual implementation will need a global state/context
let authStateChangeListeners = [];
export function onAuthStateChange(callback) {
  // This is a mock implementation. A real one would need to be triggered by login/logout actions.
  // For example, after successful signIn or signOut, call a function that notifies listeners.
  console.warn("onAuthStateChange is now a mock. Implement with global state management.")

  const token = getAccessToken();
  // Simulate initial state check
  callback(null, token ? { /* mock session object */ access_token: token } : null);


  authStateChangeListeners.push(callback);
  return {
    unsubscribe: () => {
      authStateChangeListeners = authStateChangeListeners.filter(cb => cb !== callback);
    },
  };
}

// Helper to notify listeners - call this from signIn, signOut, handleGoogleCallback
// function notifyAuthStateChange(session) {
//   authStateChangeListeners.forEach(cb => cb(null, session));
// }

// Example usage in signIn after storeTokens(result.session):
// notifyAuthStateChange(result.session);
// Example usage in signOut after clearTokens():
// notifyAuthStateChange(null);

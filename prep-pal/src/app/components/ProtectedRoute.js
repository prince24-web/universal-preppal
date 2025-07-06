// components/ProtectedRoute.js
'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Adjust path if necessary

const ProtectedRoute = ({ children }) => {
  const { user, loading, verifyAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  useEffect(() => {
    // If still loading auth state, don't do anything yet.
    // The AuthProvider itself shows a loading indicator.
    if (loading) {
      return;
    }

    // If not loading and no user, redirect to login.
    // Preserve the intended destination via query param.
    if (!user) {
      console.log('ProtectedRoute: No user found, redirecting to login.');
      router.push(`/login?redirectTo=${pathname}`);
    }
    // If user is authenticated, component will render children.
  }, [user, loading, router, pathname]);

  // If loading, AuthProvider might be showing a loading screen,
  // or we can show one here too to prevent flash of unstyled content
  // or content that shouldn't be visible.
  // However, AuthContext already handles a basic loading screen.
  if (loading) {
    // This could be a more specific loading spinner for the protected route itself
    // For now, relying on AuthProvider's loading state.
    return null; // Or a specific spinner
  }

  // If there's a user, render the children. Otherwise, redirection is in progress.
  return user ? children : null;
  // Or, if not loading and no user, can also show a "Redirecting..." message
  // but usually router.push is fast enough.

  /* Old loading and error states - AuthContext now handles general loading and initial auth check
  const [hasError, setHasError] = useState(false); // This specific error handling might need rethinking
                                                  // if network errors are caught by authService/AuthContext
  // Show loading spinner while checking authentication
  if (loading) { // This loading is from useAuth()
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin">
              <div className="w-full h-full bg-white rounded-full m-1"></div>
            </div>
          </div>
          <p className="text-lg text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state for network/connection issues
  if (hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">
            Unable to verify authentication. Please check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Only render children if authenticated (and no errors)
  return authenticated ? children : null;
};

export default ProtectedRoute;
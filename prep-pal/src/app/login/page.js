// app/login/page.js
'use client'
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Brain, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { login as apiLogin, register as apiRegister, initiateGoogleOAuth } from '@/services/authService'; // Import auth service functions

// Separate component that uses useSearchParams
const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loginContext, loading: authLoading } = useAuth(); // Get user and login function from context
  const redirectTo = searchParams.get('redirectTo') || '/upload';

  const [isMounted, setIsMounted] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    passwordMismatch: false,
    termsRequired: false,
    emptyFields: {},
    auth: ''
  });

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  });

  useEffect(() => {
    setIsMounted(true);
    // If user is already available from AuthContext and not loading, redirect
    if (!authLoading && user) {
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  // Clear errors when switching between login/signup
  useEffect(() => {
    setErrors({
      passwordMismatch: false,
      termsRequired: false,
      emptyFields: {},
      auth: ''
    });
  }, [isLogin]);

  if (!isMounted) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setAgreeToTerms(checked);
      if (checked) {
        setErrors(prev => ({ ...prev, termsRequired: false }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));

      // Clear field-specific errors when user starts typing
      if (name === 'password' || name === 'confirmPassword') {
        setErrors(prev => ({ ...prev, passwordMismatch: false, auth: '' }));
      }
      
      // Clear empty field error when user starts typing
      if (value.trim()) {
        setErrors(prev => ({
          ...prev,
          emptyFields: { ...prev.emptyFields, [name]: false },
          auth: ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let hasErrors = false;
    const newErrors = {
      passwordMismatch: false,
      termsRequired: false,
      emptyFields: {},
      auth: ''
    };

    // Define required fields based on login/signup mode
    const requiredFields = isLogin 
      ? ['email', 'password']
      : ['name', 'email', 'password', 'confirmPassword'];

    // Check for empty fields
    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors.emptyFields[field] = true;
        hasErrors = true;
      }
    });

    // Check password match for signup
    if (!isLogin && formData.password !== formData.confirmPassword) {
      newErrors.passwordMismatch = true;
      hasErrors = true;
    }

    // Check terms agreement for signup
    if (!isLogin && !agreeToTerms) {
      newErrors.termsRequired = true;
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      let responseData;
      if (isLogin) {
        responseData = await apiLogin(formData.email, formData.password);
      } else {
        // For register, pass username (formData.name) and fullName (also formData.name for now)
        responseData = await apiRegister(formData.email, formData.password, formData.name, formData.name);
      }
      
      if (responseData && responseData.user) {
        loginContext(responseData.user); // Update AuthContext
        // Redirection is handled by loginContext or useEffect watching `user`
      } else if (!isLogin) {
        // Handle successful registration if no immediate login/user data in response
         setErrors(prev => ({ ...prev, auth: '' }));
         setIsLogin(true); // Switch to login mode
         setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
         alert('Account created successfully! Please log in.');
      }
      
    } catch (error) {
      console.error('Authentication error:', error.message);
      setErrors(prev => ({ ...prev, auth: error.message || 'An unexpected error occurred' }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // This will redirect the user, so no direct response handling here
      await initiateGoogleOAuth();
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      setErrors(prev => ({ ...prev, auth: error.message || 'Could not start Google Sign-In' }));
      setIsLoading(false);
    }
    // setIsLoading(false) might not be reached if redirection happens.
  };

  // If auth is loading and there's no user yet, show a spinner or null to avoid flashing login form
  if (authLoading && !user) {
    return <LoginFallback />; // Or some other loading indicator
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* StudyAI Branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">StudyAI</span>
          </div>
          <p className="text-gray-600">Transform your PDFs into study materials</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-slate-600">
              {isLogin
                ? 'Sign in to continue your learning journey'
                : 'Join thousands of students already using StudyAI'}
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-slate-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Auth Error Message */}
            {errors.auth && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{errors.auth}</p>
              </div>
            )}

            {/* Name Field - Only for Sign Up */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all ${
                    errors.emptyFields.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
                {errors.emptyFields.name && (
                  <p className="mt-2 text-sm text-red-600">
                    Full name is required
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all ${
                  errors.emptyFields.email
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-blue-500'
                }`}
                placeholder="Enter your email"
                required
              />
              {errors.emptyFields.email && (
                <p className="mt-2 text-sm text-red-600">
                  Email address is required
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all ${
                    errors.passwordMismatch || errors.emptyFields.password
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.emptyFields.password && (
                <p className="mt-2 text-sm text-red-600">
                  Password is required
                </p>
              )}
            </div>

            {/* Confirm Password Field - Only for Sign Up */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:border-transparent outline-none transition-all ${
                      errors.passwordMismatch || errors.emptyFields.confirmPassword
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-blue-500'
                    }`}
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.emptyFields.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    Please confirm your password
                  </p>
                )}
                {errors.passwordMismatch && !errors.emptyFields.confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

            {/* Forgot Password Link - Only for Sign In */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    // You can implement password reset functionality here
                    alert('Password reset functionality will be implemented soon!');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Terms and Conditions - Only for Sign Up */}
            {!isLogin && (
              <div>
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    name="terms"
                    checked={agreeToTerms}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    required={!isLogin}
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => alert('Terms of Service will be shown here')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => alert('Privacy Policy will be shown here')}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Privacy Policy
                    </button>
                  </label>
                </div>
                {errors.termsRequired && (
                  <p className="mt-2 text-sm text-red-600">
                    Please agree to the terms and conditions
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* OR Separator */}
          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-slate-300"></div>
            <span className="mx-4 text-sm text-slate-500">OR</span>
            <div className="flex-grow border-t border-slate-300"></div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In with Google' : 'Sign Up with Google')}
          </button>

          {/* Switch Mode */}
          <div className="mt-6 text-center">
            <p className="text-slate-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading fallback component
const LoginFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
    <div className="flex items-center space-x-2">
      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      <span className="text-gray-600">Loading...</span>
    </div>
  </div>
);

// Main component with Suspense wrapper
const LoginPage = () => {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
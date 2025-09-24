import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/KeycloakContext';

/**
 * AuthCallback component handles post-login redirects
 * This ensures users stay within the React app after authentication
 */
const AuthCallback: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Get the stored return path
      const returnPath = sessionStorage.getItem('aurex_return_path');
      sessionStorage.removeItem('aurex_return_path');
      
      // Redirect to the intended page or home
      const targetPath = returnPath || '/';
      
      // Only redirect if we're not already on the target path
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath);
        window.location.reload();
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Completing login...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Successful!</h2>
          <p className="text-gray-600">Redirecting you to the application...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-red-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
        <p className="text-gray-600">Please log in to continue...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { LogIn, UserPlus, User, LogOut, X } from 'lucide-react';

interface AuthHandlerProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRoles?: string[];
}

const AuthHandler: React.FC<AuthHandlerProps> = ({
  children,
  requireAuth = false,
  requiredRoles = []
}) => {
  const { user, isLoading, isAuthenticated, hasAnyRole } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    // If authentication is required and user is not authenticated
    if (requireAuth && !isLoading && !isAuthenticated) {
      setShowLogin(true);
    } else {
      setShowLogin(false);
    }
  }, [requireAuth, isLoading, isAuthenticated]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg animate-pulse">
            <span className="text-white text-xl font-bold">A</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Aurex Platform...</p>
        </div>
      </div>
    );
  }

  // Show custom login page instead of redirecting to Keycloak
  if (showLogin) {
    return <AurexLoginPage />;
  }

  // Check role requirements
  if (requireAuth && isAuthenticated && requiredRoles.length > 0) {
    if (!hasAnyRole(requiredRoles)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this area of the Aurex Platform.
            </p>
            <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
              <p className="text-sm text-gray-700">
                <strong>Your account:</strong> {user?.email || user?.username}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Required roles: {requiredRoles.join(', ')}
              </p>
            </div>
            <button
              onClick={() => window.history.back()}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Render children if authenticated or auth not required
  return <>{children}</>;
};

export default AuthHandler;

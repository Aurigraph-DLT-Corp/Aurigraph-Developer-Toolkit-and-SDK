/**
 * Protected Route Component for Aurex SylvaGraph
 *
 * Provides route protection with JWT authentication
 * and role-based access control.
 */

import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  fallbackComponent?: ReactNode;
  showLoginPrompt?: boolean;
  customUnauthorizedMessage?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  fallbackComponent,
  showLoginPrompt = true,
  customUnauthorizedMessage,
}) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    hasAnyRole
  } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading...
          </h2>
          <p className="text-gray-600">
            Checking authentication status
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    if (!showLoginPrompt) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Restricted
            </h2>
            <p className="text-gray-600">
              This content requires authentication.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <div className="text-6xl text-green-600 mb-4">🌳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to SylvaGraph
            </h2>
            <p className="text-gray-600">
              Please sign in to access your forest management platform and explore our satellite monitoring and carbon sequestration solutions.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors"
            >
              Sign In
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Secure JWT authentication
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but insufficient roles
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    if (fallbackComponent) {
      return <>{fallbackComponent}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="text-6xl text-amber-500 mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              {customUnauthorizedMessage ||
                `You don't have the required permissions to access this page.`
              }
            </p>

            {/* Show required roles */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Required Roles:
              </h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {requiredRoles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-red-100 text-red-800"
                  >
                    🛡️ {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Show user's current role */}
            {user?.role && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Your Current Role:
                </h3>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  🛡️ {user.role}
                </span>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
/**
 * Protected Route Component
 *
 * Wraps routes that require authentication
 * Redirects unauthenticated users to login page
 */

import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/useRedux';
import type { RootState } from '../types/state';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAppSelector((state: RootState) => state.auth);
  const location = window.location.pathname;

  // Still loading - show spinner
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin tip="Checking authentication..." />
      </div>
    );
  }

  // Not authenticated - redirect to login with return URL
  if (!isAuthenticated) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location)}`} replace />;
  }

  // Check role-based access if required roles specified
  if (requiredRoles && user && user.roles) {
    const hasRequiredRole = requiredRoles.some((role) => user.roles?.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

/**
 * Universal Authentication Component for Aurex Platform
 * 
 * Provides consistent authentication UI across all pages
 * with navigation to dedicated sign in/sign up pages.
 */

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/button';
import { LogIn, UserPlus, User, LogOut } from 'lucide-react';

interface UniversalAuthProps {
  variant?: 'header' | 'inline' | 'modal';
  showUserInfo?: boolean;
  className?: string;
  onAuthSuccess?: () => void;
}

const UniversalAuth: React.FC<UniversalAuthProps> = ({
  variant = 'header',
  showUserInfo = true,
  className = '',
  onAuthSuccess
}) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    logout
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Get current app name for context
  const getAppName = () => {
    const path = location.pathname;
    if (path.includes('/launchpad')) return 'Aurex Launchpad';
    if (path.includes('/hydropulse')) return 'Aurex HydroPulse';
    if (path.includes('/sylvagraph')) return 'Aurex Sylvagraph';
    if (path.includes('/carbontrace')) return 'Aurex CarbonTrace';
    return 'Aurex Platform';
  };

  const handleSignInClick = () => {
    const currentPath = location.pathname;
    const appName = getAppName();
    navigate(`/signin?redirect=${encodeURIComponent(currentPath)}&app=${encodeURIComponent(appName)}`);
  };

  const handleSignUpClick = () => {
    const currentPath = location.pathname;
    const appName = getAppName();
    navigate(`/signup?redirect=${encodeURIComponent(currentPath)}&app=${encodeURIComponent(appName)}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Authenticated state
  if (isAuthenticated && user) {
    if (variant === 'inline') {
      return (
        <div className={`flex items-center gap-4 ${className}`}>
          {user.picture && (
            <img
              src={user.picture}
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          )}
          {showUserInfo && (
            <div className="text-sm">
              <div className="font-medium text-gray-900">{user.name || user.email}</div>
              <div className="text-gray-500">{user.provider} account</div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        )}
        {showUserInfo && (
          <span className="text-sm text-gray-600">
            {user.name || user.email}
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoading}
        >
          <LogOut className="h-4 w-4 mr-1" />
          Sign Out
        </Button>
      </div>
    );
  }

  // Non-authenticated state
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignInClick}
        disabled={isLoading}
      >
        <LogIn className="h-4 w-4 mr-1" />
        Sign In
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={handleSignUpClick}
        disabled={isLoading}
      >
        <UserPlus className="h-4 w-4 mr-1" />
        Sign Up
      </Button>
    </div>
  );
};

export default UniversalAuth;

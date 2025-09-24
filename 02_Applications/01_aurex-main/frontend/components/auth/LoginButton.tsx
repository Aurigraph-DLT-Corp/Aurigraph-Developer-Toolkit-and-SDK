/**
 * Login Button Component for Aurex Platform
 *
 * Provides authentication controls with Keycloak integration
 * including login, logout, and user profile display.
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import AurexLoginModal from './AurexLoginModal';
import {
  User,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  Shield,
  ChevronDown
} from 'lucide-react';

interface LoginButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showUserInfo?: boolean;
  className?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({
  variant = 'default',
  size = 'md',
  showUserInfo = true,
  className = '',
}) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    logout
  } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (isLoading) {
    return (
      <Button variant="ghost" size={size} disabled className={className}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant={variant}
          size={size}
          onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
        <Button
          variant="outline"
          size={size}
          onClick={() => setShowLoginModal(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Sign Up
        </Button>
      </div>
    );
  }

  if (!showUserInfo) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => logout()}
        className={`flex items-center gap-2 ${className}`}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="ghost"
        size={size}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          {user && (
            <div className="text-left hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                {user.name || user.email}
              </div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          )}
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </div>
      </Button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {user?.name || user?.email}
                    </div>
                    <div className="text-sm text-gray-500">{user?.email}</div>
                  </div>
                </div>

                {/* User Provider */}
                <div className="mt-2">
                  <div className="text-xs text-gray-500 mb-1">Provider:</div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    <Shield className="h-3 w-3" />
                    {user?.provider || 'email'}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    // Navigate to profile page
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </button>

                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom Login Modal */}
      <AurexLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default LoginButton;

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserProfileProps {
  showDropdown?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ showDropdown = true }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const getUserInitials = () => {
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    return user.email || 'User';
  };

  if (!showDropdown) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {getUserInitials()}
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
          {user.organization && (
            <p className="text-sm text-gray-500">{user.organization}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 transition-colors"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {getUserInitials()}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-gray-900 truncate">
            {getUserDisplayName()}
          </p>
          {user.organization && (
            <p className="text-sm text-gray-500 truncate">{user.organization}</p>
          )}
        </div>
        <ChevronDown 
          className={`flex-shrink-0 h-4 w-4 text-gray-400 transition-transform ${
            isDropdownOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                <p className="font-medium">{getUserDisplayName()}</p>
                {user.organization && (
                  <p className="text-gray-500">{user.organization}</p>
                )}
                {user.role && (
                  <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                )}
              </div>
              
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={() => {
                  setIsDropdownOpen(false);
                  // TODO: Navigate to profile settings
                  console.log('Navigate to profile settings');
                }}
              >
                <User className="mr-3 h-4 w-4" />
                Profile
              </button>
              
              <button
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                onClick={() => {
                  setIsDropdownOpen(false);
                  // TODO: Navigate to settings
                  console.log('Navigate to settings');
                }}
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </button>
              
              <hr className="my-1" />
              
              <button
                className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;
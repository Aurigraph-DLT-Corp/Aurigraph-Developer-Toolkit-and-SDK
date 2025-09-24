import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import UserProfile from './auth/UserProfile';
import AuthModal from './auth/AuthModal';
import { Menu, X, User, LogIn } from 'lucide-react';

interface NavigationProps {
  showAuthButton?: boolean;
  transparent?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ 
  showAuthButton = true,
  transparent = false 
}) => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '/', public: true },
    { name: 'GHG Assessment', href: '/ghg-assessment', public: false },
    { name: 'Analytics', href: '/report-analytics', public: false },
    { name: 'Frameworks', href: '/esg-frameworks', public: false },
    { name: 'Maturity Model', href: '/maturity-model', public: false },
    { name: 'Contact', href: '/contact', public: true },
  ];

  const handleNavigation = (href: string, isPublic: boolean) => {
    if (!isPublic && !isAuthenticated && !loading) {
      setShowAuthModal(true);
      return;
    }
    navigate(href);
    setIsMobileMenuOpen(false);
  };

  const getNavItemClass = (isPublic: boolean) => {
    const baseClass = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
    const colorClass = transparent 
      ? "text-white hover:text-green-200" 
      : "text-gray-700 hover:text-green-600 hover:bg-green-50";
    
    if (!isPublic && !isAuthenticated && !loading) {
      return `${baseClass} ${colorClass} opacity-75`;
    }
    
    return `${baseClass} ${colorClass}`;
  };

  const backgroundClass = transparent 
    ? "bg-transparent" 
    : "bg-white shadow-lg";

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-40 ${backgroundClass} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className={`font-bold text-xl ${
                  transparent ? 'text-white' : 'text-gray-900'
                }`}>
                  Aurex Launchpad™
                </span>
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href, item.public)}
                  className={getNavItemClass(item.public)}
                  disabled={loading}
                >
                  {item.name}
                  {!item.public && !isAuthenticated && !loading && (
                    <span className="ml-1 text-xs opacity-75">🔒</span>
                  )}
                </button>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {loading ? (
                <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              ) : isAuthenticated ? (
                <UserProfile showDropdown={true} />
              ) : showAuthButton ? (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium ${
                    transparent
                      ? 'bg-white text-green-600 hover:bg-gray-50'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  } transition-colors`}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </button>
              ) : null}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                className={`inline-flex items-center justify-center p-2 rounded-md ${
                  transparent 
                    ? 'text-white hover:text-green-200' 
                    : 'text-gray-700 hover:text-green-600'
                } hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className={`px-2 pt-2 pb-3 space-y-1 sm:px-3 ${
              transparent ? 'bg-black bg-opacity-90' : 'bg-white border-t'
            }`}>
              {navigationItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href, item.public)}
                  className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
                    transparent
                      ? 'text-white hover:text-green-200 hover:bg-white hover:bg-opacity-10'
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  } transition-colors`}
                  disabled={loading}
                >
                  {item.name}
                  {!item.public && !isAuthenticated && !loading && (
                    <span className="ml-1 text-xs opacity-75">🔒</span>
                  )}
                </button>
              ))}

              {/* Mobile Auth Section */}
              <div className="border-t pt-4 mt-4">
                {loading ? (
                  <div className="flex justify-center">
                    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : isAuthenticated ? (
                  <div className="px-3">
                    <UserProfile showDropdown={false} />
                  </div>
                ) : showAuthButton ? (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${
                      transparent
                        ? 'text-white bg-white bg-opacity-20 hover:bg-opacity-30'
                        : 'text-green-600 bg-green-50 hover:bg-green-100'
                    } transition-colors`}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
        onSuccess={() => {
          setShowAuthModal(false);
          // The navigation will re-render with authenticated state
        }}
      />
    </>
  );
};

export default Navigation;
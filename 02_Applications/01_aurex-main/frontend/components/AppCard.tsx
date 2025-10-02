import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './auth/AuthModal';
import { Lock, ExternalLink } from 'lucide-react';

interface AppCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  iconAlt: string;
  buttonText: string;
  buttonColor: string;
  hoverColor: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  shadowColor: string;
  route: string;
  appName: string;
  requiresAuth?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  iconAlt,
  buttonText,
  buttonColor,
  hoverColor,
  gradientFrom,
  gradientTo,
  borderColor,
  shadowColor,
  route,
  appName,
  requiresAuth = true
}) => {
  const { isAuthenticated, requestAppAccess } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCardClick = async () => {
    if (!requiresAuth) {
      // Navigate directly if no auth required
      window.location.href = route;
      return;
    }

    if (!isAuthenticated) {
      // Show authentication modal
      setShowAuthModal(true);
      return;
    }

    try {
      setIsLoading(true);
      // Request app access from backend
      await requestAppAccess(appName, route);
      // Navigate to the app
      window.location.href = route;
    } catch (error) {
      console.error('Failed to access app:', error);
      // Still navigate, but user might see access denied in the app
      window.location.href = route;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // After successful auth, try to access the app
    handleCardClick();
  };

  return (
    <>
      <div 
        className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl p-6 border ${borderColor} hover:shadow-xl ${shadowColor} transition-all duration-300 flex flex-col h-full cursor-pointer group`}
        onClick={handleCardClick}
      >
        <div className="text-center mb-4">
          <div className="w-16 h-16 mx-auto mb-3 relative">
            <img 
              src={icon} 
              alt={iconAlt} 
              className="w-full h-full object-contain" 
            />
            {requiresAuth && !isAuthenticated && (
              <div className="absolute -top-1 -right-1 bg-gray-600 rounded-full p-1">
                <Lock className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{title}</h3>
          <p className={`font-medium text-sm ${buttonColor.replace('bg-', 'text-')}`}>
            {subtitle}
          </p>
        </div>
        
        <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">
          {description}
        </p>
        
        <div className="mt-auto">
          <div 
            className={`w-full ${buttonColor} text-white px-4 py-2 rounded-lg font-medium ${hoverColor} transition-colors text-sm text-center inline-flex items-center justify-center gap-2 group-hover:gap-3`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              <>
                {buttonText}
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </div>
        </div>

        {requiresAuth && !isAuthenticated && (
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" />
              Authentication required
            </p>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectTo={route}
        onSuccess={handleAuthSuccess}
        initialMode="login"
      />
    </>
  );
};

export default AppCard;

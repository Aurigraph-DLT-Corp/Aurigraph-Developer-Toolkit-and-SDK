import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      // If already authenticated, redirect to intended destination or home
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLoginSuccess = () => {
    // Navigate to intended destination or home after successful login
    navigate(from, { replace: true });
  };

  const handleSwitchToSignup = () => {
    setShowSignup(true);
  };

  const handleSwitchToLogin = () => {
    setShowSignup(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="flex items-center">
            <div className="text-3xl font-bold text-green-600">🚀</div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900">
              Aurex Launchpad
            </h1>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 mb-8">
          ESG Assessment & Reporting Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {!showSignup ? (
          <LoginForm 
            onSuccess={handleLoginSuccess}
            onSwitchToSignup={handleSwitchToSignup}
          />
        ) : (
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Create Account
              </h2>
              <p className="text-gray-600 mb-6">
                Registration is coming soon! Please contact your administrator for access.
              </p>
              <button
                onClick={handleSwitchToLogin}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2024 Aurigraph. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
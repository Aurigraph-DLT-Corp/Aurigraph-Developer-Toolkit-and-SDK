import React, { useState } from 'react';
import { useAuth } from '../../contexts/KeycloakContext';
import { AccessControl } from './AccessControl';

interface LaunchpadAuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Special authentication wrapper for Launchpad that allows self-registration
 * Unlike other sub-apps, Launchpad users can register themselves
 */
const LaunchpadAuthWrapper: React.FC<LaunchpadAuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, login, register, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Launchpad...</p>
        </div>
      </div>
    );
  }

  // Show login/register page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            {/* Launchpad Logo */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-2xl shadow-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Aurex Launchpad</h1>
              <p className="text-gray-600 text-sm">
                {showRegister 
                  ? "Create your account to start your ESG assessment journey"
                  : "Access your ESG assessment and sustainability management platform"
                }
              </p>
            </div>

            {/* Login/Register Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  sessionStorage.setItem('aurex_return_path', '/launchpad');
                  login(window.location.origin + '/launchpad');
                }}
                className="w-full bg-green-600 text-white py-4 px-4 rounded-xl font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
              >
                Sign In to Launchpad
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to Aurex?</span>
                </div>
              </div>

              <button
                onClick={() => {
                  sessionStorage.setItem('aurex_return_path', '/launchpad');
                  register(window.location.origin + '/launchpad');
                }}
                className="w-full bg-white text-green-600 py-4 px-4 rounded-xl font-medium border-2 border-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
              >
                Create Free Account
              </button>
            </div>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">What you get with Launchpad:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Comprehensive ESG Assessment
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sustainability Roadmap Planning
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Carbon Footprint Analysis
                </li>
                <li className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Expert Consultation Access
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact us at{' '}
                <a href="mailto:support@aurigraph.io" className="text-green-600 hover:text-green-700">
                  support@aurigraph.io
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, check access control
  return (
    <AccessControl app="launchpad">
      {children}
    </AccessControl>
  );
};

export default LaunchpadAuthWrapper;

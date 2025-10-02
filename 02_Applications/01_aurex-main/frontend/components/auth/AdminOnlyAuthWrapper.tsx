import React from 'react';
import { useAuth } from '../../contexts/KeycloakContext';
import { AccessControl, AppName, APP_ACCESS_REQUIREMENTS } from './AccessControl';

interface AdminOnlyAuthWrapperProps {
  children: React.ReactNode;
  app: AppName;
}

/**
 * Authentication wrapper for admin-only applications
 * Users cannot self-register - they must be configured by Aurigraph admin
 */
const AdminOnlyAuthWrapper: React.FC<AdminOnlyAuthWrapperProps> = ({ children, app }) => {
  const { isAuthenticated, login, isLoading } = useAuth();
  const appConfig = APP_ACCESS_REQUIREMENTS[app];

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {appConfig.name}...</p>
        </div>
      </div>
    );
  }

  // Show admin-only login page if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
            {/* App Icon */}
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl shadow-lg flex items-center justify-center mb-4">
                {app === 'hydropulse' && (
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                )}
                {app === 'sylvagraph' && (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )}
                {app === 'carbontrace' && (
                  <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{appConfig.name}</h1>
              <p className="text-gray-600 text-sm">{appConfig.description}</p>
            </div>

            {/* Admin-Only Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-amber-800 mb-1">Admin-Configured Access</h3>
                  <p className="text-xs text-amber-700">
                    Access to {appConfig.name} is configured by Aurigraph administrators. 
                    You cannot create an account yourself.
                  </p>
                </div>
              </div>
            </div>

            {/* Login Button */}
            <button
              onClick={() => {
                sessionStorage.setItem('aurex_return_path', `/${app}`);
                login(window.location.origin + `/${app}`);
              }}
              className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 mb-6"
            >
              Sign In with Provided Credentials
            </button>

            {/* Required Roles Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Required Access Roles:</h3>
              <div className="flex flex-wrap gap-2">
                {appConfig.requiredRoles.map(role => (
                  <span key={role} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {role.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4">
              <h4 className="font-semibold mb-2">Need Access?</h4>
              <p className="text-sm mb-3">
                Contact the Aurigraph admin team to request access credentials for {appConfig.name}.
              </p>
              <a 
                href={`mailto:admin@aurigraph.io?subject=Access Request for ${appConfig.name}&body=Hello Aurigraph Team,%0D%0A%0D%0AI would like to request access to ${appConfig.name}.%0D%0A%0D%0AOrganization: [Your Organization]%0D%0AName: [Your Full Name]%0D%0AEmail: [Your Email]%0D%0ARole/Position: [Your Role]%0D%0ABusiness Use Case: [Brief description of how you plan to use ${appConfig.name}]%0D%0A%0D%0APlease provide me with login credentials.%0D%0A%0D%0AThank you!`}
                className="inline-flex items-center justify-center w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Request Access Credentials
              </a>
            </div>

            {/* Back to Platform */}
            <div className="mt-6 text-center">
              <button 
                onClick={() => window.history.back()}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Platform
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, check access control
  return (
    <AccessControl app={app}>
      {children}
    </AccessControl>
  );
};

export default AdminOnlyAuthWrapper;

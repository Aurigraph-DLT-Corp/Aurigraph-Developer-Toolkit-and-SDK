import React from 'react';
import { useAuth } from '../../contexts/KeycloakContext';

// Define application access requirements
export const APP_ACCESS_REQUIREMENTS = {
  'hydropulse': {
    name: 'HydroPulse',
    description: 'Water Management & Agricultural Monitoring',
    requiredRoles: ['farmer', 'field-agent', 'supervisor', 'business-owner'],
    clientId: 'aurex-hydropulse'
  },
  'sylvagraph': {
    name: 'SylvaGraph',
    description: 'Forest Management & Carbon Trading',
    requiredRoles: ['forester', 'auditor', 'project-manager', 'carbon-trader'],
    clientId: 'aurex-sylvagraph'
  },
  'carbontrace': {
    name: 'CarbonTrace',
    description: 'Carbon Accounting & Compliance',
    requiredRoles: ['accountant', 'analyst', 'compliance-officer', 'reporter'],
    clientId: 'aurex-carbontrace'
  },
  'launchpad': {
    name: 'Launchpad',
    description: 'GHG Assessment & Consulting',
    requiredRoles: ['assessor', 'consultant', 'organization-admin', 'reviewer'],
    clientId: 'aurex-launchpad'
  }
} as const;

export type AppName = keyof typeof APP_ACCESS_REQUIREMENTS;

interface AccessControlProps {
  app: AppName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * AccessControl component that checks if user has required roles for specific applications
 */
export const AccessControl: React.FC<AccessControlProps> = ({ 
  app, 
  children, 
  fallback 
}) => {
  const { user, hasRole, isAuthenticated } = useAuth();

  // If not authenticated, show login
  if (!isAuthenticated) {
    return fallback || <div>Please log in to access this application.</div>;
  }

  // Check if user has any of the required roles for this app
  const appConfig = APP_ACCESS_REQUIREMENTS[app];
  const hasAccess = appConfig.requiredRoles.some(role => 
    hasRole(role, appConfig.clientId)
  );

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If no access, render fallback or default access denied
  return fallback || <AccessDenied app={app} />;
};

interface AccessDeniedProps {
  app: AppName;
}

/**
 * AccessDenied component shown when user doesn't have permission
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({ app }) => {
  const { user } = useAuth();
  const appConfig = APP_ACCESS_REQUIREMENTS[app];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
          {/* Access Denied Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-2xl shadow-lg flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access <strong>{appConfig.name}</strong>
          </p>

          {/* App Info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">{appConfig.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{appConfig.description}</p>
            <div className="text-xs text-gray-500">
              <strong>Required Roles:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {appConfig.requiredRoles.map(role => (
                  <span key={role} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {role.replace('-', ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Your Account</h4>
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {user.email || user.preferred_username}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> {user.name || `${user.given_name || ''} ${user.family_name || ''}`.trim() || 'Not provided'}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-4">
              <h4 className="font-semibold mb-2">Need Access?</h4>
              <p className="text-sm mb-3">
                Contact the Aurigraph admin team to request access to {appConfig.name}.
              </p>
              <a 
                href="mailto:admin@aurigraph.io?subject=Access Request for Aurex Platform&body=Hello Aurigraph Team,%0D%0A%0D%0AI would like to request access to the following application:%0D%0A%0D%0AApplication: {appConfig.name}%0D%0AUser Email: {user?.email || 'Not provided'}%0D%0AUser Name: {user?.name || 'Not provided'}%0D%0A%0D%0APlease let me know what information you need to process this request.%0D%0A%0D%0AThank you!"
                className="inline-flex items-center justify-center w-full bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Aurigraph Admin
              </a>
            </div>

            <button 
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to check if user has access to a specific app
 */
export const useAppAccess = (app: AppName) => {
  const { hasRole, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return { hasAccess: false, reason: 'not_authenticated' };
  }

  const appConfig = APP_ACCESS_REQUIREMENTS[app];
  const hasAccess = appConfig.requiredRoles.some(role => 
    hasRole(role, appConfig.clientId)
  );

  return { 
    hasAccess, 
    reason: hasAccess ? null : 'insufficient_permissions',
    requiredRoles: appConfig.requiredRoles,
    appName: appConfig.name
  };
};

/**
 * Higher-order component for protecting routes
 */
export const withAccessControl = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  app: AppName
) => {
  const AccessControlledComponent = (props: P) => {
    return (
      <AccessControl app={app}>
        <WrappedComponent {...props} />
      </AccessControl>
    );
  };

  AccessControlledComponent.displayName = `withAccessControl(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AccessControlledComponent;
};

export default AccessControl;

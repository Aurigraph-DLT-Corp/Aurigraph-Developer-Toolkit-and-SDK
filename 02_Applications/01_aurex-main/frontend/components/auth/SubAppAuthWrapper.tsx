import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AurexLoginPage from './AurexLoginPage';
import { AccessControl, AppName } from './AccessControl';

interface SubAppAuthWrapperProps {
  children: React.ReactNode;
  app: AppName;
}

const SubAppAuthWrapper: React.FC<SubAppAuthWrapperProps> = ({
  children,
  app
}) => {
  const { isAuthenticated } = useAuth();

  // Show unified login page if not authenticated
  if (!isAuthenticated) {
    return <AurexLoginPage />;
  }

  // Use the new AccessControl component for role-based access
  return (
    <AccessControl app={app}>
      {children}
    </AccessControl>
  );
};

export default SubAppAuthWrapper;

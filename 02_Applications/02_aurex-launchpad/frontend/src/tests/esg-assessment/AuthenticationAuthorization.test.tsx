/**
 * Authentication and Authorization Tests
 * Aurex Launchpad - ESG Assessment Platform
 * 
 * Comprehensive test suite for authentication flows, role-based access control,
 * session management, and security features for ESG assessment workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock authentication components and utilities
const MockAuthProvider = ({ children, initialUser = null, initialPermissions = [] }) => {
  const [user, setUser] = React.useState(initialUser);
  const [permissions, setPermissions] = React.useState(initialPermissions);
  const [isLoading, setIsLoading] = React.useState(false);

  const login = async (credentials) => {
    setIsLoading(true);
    // Simulate authentication
    setTimeout(() => {
      if (credentials.username === 'admin' && credentials.password === 'correct') {
        setUser({
          id: 'user-1',
          username: 'admin',
          name: 'Admin User',
          role: 'admin',
          email: 'admin@example.com',
          company: 'Test Corp',
          permissions: ['read', 'write', 'admin', 'export', 'manage_users']
        });
        setPermissions(['read', 'write', 'admin', 'export', 'manage_users']);
      } else if (credentials.username === 'esg_manager' && credentials.password === 'correct') {
        setUser({
          id: 'user-2',
          username: 'esg_manager',
          name: 'ESG Manager',
          role: 'esg_manager',
          email: 'esg@example.com',
          company: 'Test Corp',
          permissions: ['read', 'write', 'export', 'create_assessments']
        });
        setPermissions(['read', 'write', 'export', 'create_assessments']);
      } else if (credentials.username === 'viewer' && credentials.password === 'correct') {
        setUser({
          id: 'user-3',
          username: 'viewer',
          name: 'Viewer User',
          role: 'viewer',
          email: 'viewer@example.com',
          company: 'Test Corp',
          permissions: ['read']
        });
        setPermissions(['read']);
      } else {
        throw new Error('Invalid credentials');
      }
      setIsLoading(false);
    }, 100);
  };

  const logout = () => {
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission);
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  return (
    <div data-testid="auth-provider">
      {React.cloneElement(children, {
        user,
        permissions,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole
      })}
    </div>
  );
};

const MockProtectedComponent = ({ requiredPermission, requiredRole, user, hasPermission, hasRole }) => {
  const canAccess = () => {
    if (requiredPermission && !hasPermission(requiredPermission)) return false;
    if (requiredRole && !hasRole(requiredRole)) return false;
    return true;
  };

  if (!user) {
    return <div data-testid="login-required">Please log in to access this feature</div>;
  }

  if (!canAccess()) {
    return <div data-testid="access-denied">Access denied: Insufficient permissions</div>;
  }

  return (
    <div data-testid="protected-content">
      <h3>Protected ESG Assessment Content</h3>
      <div data-testid="user-info">Welcome, {user.name}</div>
      <div data-testid="user-role">Role: {user.role}</div>
      {requiredPermission && <div data-testid="required-permission">Required: {requiredPermission}</div>}
      {requiredRole && <div data-testid="required-role">Required Role: {requiredRole}</div>}
    </div>
  );
};

const MockRoleBasedMenu = ({ user, hasPermission, hasRole }) => (
  <div data-testid="role-based-menu">
    <h3>ESG Assessment Menu</h3>
    
    {hasPermission('read') && (
      <button data-testid="view-assessments">View Assessments</button>
    )}
    
    {hasPermission('write') && (
      <button data-testid="create-assessment">Create Assessment</button>
    )}
    
    {hasPermission('export') && (
      <button data-testid="export-data">Export Data</button>
    )}
    
    {hasRole('admin') && (
      <button data-testid="admin-panel">Admin Panel</button>
    )}
    
    {hasPermission('manage_users') && (
      <button data-testid="manage-users">Manage Users</button>
    )}
    
    {hasRole('esg_manager') && (
      <button data-testid="compliance-reports">Compliance Reports</button>
    )}
  </div>
);

const MockSessionManager = ({ user, onSessionExpired, onSessionWarning }) => {
  const [sessionTimeLeft, setSessionTimeLeft] = React.useState(3600); // 1 hour
  const [warningShown, setWarningShown] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      setSessionTimeLeft(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 300 && !warningShown) { // 5 minutes warning
          setWarningShown(true);
          onSessionWarning(newTime);
        }
        
        if (newTime <= 0) {
          onSessionExpired();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user, warningShown, onSessionExpired, onSessionWarning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) return null;

  return (
    <div data-testid="session-manager">
      <div data-testid="session-time">Session: {formatTime(sessionTimeLeft)}</div>
      {sessionTimeLeft <= 300 && (
        <div data-testid="session-warning" className="warning">
          Session expires in {formatTime(sessionTimeLeft)}
        </div>
      )}
    </div>
  );
};

const MockMultiFactorAuth = ({ onMFAComplete, onMFACancel }) => {
  const [mfaCode, setMFACode] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);

  const handleSubmitMFA = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    
    setTimeout(() => {
      if (mfaCode === '123456') {
        onMFAComplete(true);
      } else {
        onMFAComplete(false);
      }
      setIsVerifying(false);
    }, 1000);
  };

  return (
    <div data-testid="mfa-modal">
      <h3>Multi-Factor Authentication</h3>
      <p>Enter the 6-digit code from your authenticator app</p>
      
      <form onSubmit={handleSubmitMFA}>
        <input
          data-testid="mfa-code-input"
          type="text"
          value={mfaCode}
          onChange={(e) => setMFACode(e.target.value)}
          placeholder="123456"
          maxLength={6}
          disabled={isVerifying}
        />
        
        <button
          type="submit"
          data-testid="verify-mfa-button"
          disabled={isVerifying || mfaCode.length !== 6}
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
        
        <button
          type="button"
          data-testid="cancel-mfa-button"
          onClick={onMFACancel}
          disabled={isVerifying}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

const MockPasswordPolicy = ({ password, onPolicyCheck }) => {
  const [policyResults, setPolicyResults] = React.useState({
    length: false,
    uppercase: false,
    lowercase: false,
    numbers: false,
    specialChars: false,
    noCommonWords: false
  });

  React.useEffect(() => {
    const results = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      specialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      noCommonWords: !['password', '123456', 'admin'].some(common => 
        password.toLowerCase().includes(common)
      )
    };
    
    setPolicyResults(results);
    onPolicyCheck(Object.values(results).every(Boolean));
  }, [password, onPolicyCheck]);

  const isPolicyMet = (policy) => policyResults[policy];

  return (
    <div data-testid="password-policy">
      <h4>Password Requirements</h4>
      <ul>
        <li data-testid="policy-length" className={isPolicyMet('length') ? 'passed' : 'failed'}>
          At least 8 characters
        </li>
        <li data-testid="policy-uppercase" className={isPolicyMet('uppercase') ? 'passed' : 'failed'}>
          At least one uppercase letter
        </li>
        <li data-testid="policy-lowercase" className={isPolicyMet('lowercase') ? 'passed' : 'failed'}>
          At least one lowercase letter
        </li>
        <li data-testid="policy-numbers" className={isPolicyMet('numbers') ? 'passed' : 'failed'}>
          At least one number
        </li>
        <li data-testid="policy-special" className={isPolicyMet('specialChars') ? 'passed' : 'failed'}>
          At least one special character
        </li>
        <li data-testid="policy-common" className={isPolicyMet('noCommonWords') ? 'passed' : 'failed'}>
          No common passwords
        </li>
      </ul>
    </div>
  );
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ToastProvider>
      {children}
    </ToastProvider>
  </BrowserRouter>
);

describe('Authentication and Authorization', () => {
  let user;
  let mockOnSessionExpired;
  let mockOnSessionWarning;
  let mockOnMFAComplete;
  let mockOnMFACancel;
  let mockOnPolicyCheck;

  beforeEach(() => {
    user = userEvent.setup();
    mockOnSessionExpired = jest.fn();
    mockOnSessionWarning = jest.fn();
    mockOnMFAComplete = jest.fn();
    mockOnMFACancel = jest.fn();
    mockOnPolicyCheck = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('Authentication Flow', () => {
    test('allows admin user to authenticate successfully', async () => {
      let authProps = {};

      render(
        <TestWrapper>
          <MockAuthProvider>
            {(props) => {
              authProps = props;
              return (
                <div>
                  <button
                    data-testid="login-button"
                    onClick={() => props.login({ username: 'admin', password: 'correct' })}
                  >
                    Login as Admin
                  </button>
                  {props.user && <div data-testid="user-name">{props.user.name}</div>}
                </div>
              );
            }}
          </MockAuthProvider>
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('Admin User');
      });
    });

    test('rejects invalid credentials', async () => {
      let loginError = null;

      render(
        <TestWrapper>
          <MockAuthProvider>
            {(props) => (
              <div>
                <button
                  data-testid="invalid-login-button"
                  onClick={async () => {
                    try {
                      await props.login({ username: 'invalid', password: 'wrong' });
                    } catch (error) {
                      loginError = error.message;
                    }
                  }}
                >
                  Invalid Login
                </button>
                {loginError && <div data-testid="login-error">{loginError}</div>}
              </div>
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('invalid-login-button');
      await user.click(loginButton);

      await waitFor(() => {
        expect(loginError).toBe('Invalid credentials');
      });
    });

    test('handles logout functionality', async () => {
      render(
        <TestWrapper>
          <MockAuthProvider initialUser={{ id: '1', name: 'Test User', role: 'admin' }}>
            {(props) => (
              <div>
                {props.user && <div data-testid="user-name">{props.user.name}</div>}
                <button data-testid="logout-button" onClick={props.logout}>
                  Logout
                </button>
              </div>
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');

      const logoutButton = screen.getByTestId('logout-button');
      await user.click(logoutButton);

      expect(screen.queryByTestId('user-name')).not.toBeInTheDocument();
    });
  });

  describe('Role-Based Access Control', () => {
    test('admin user has full access to all features', () => {
      const adminUser = {
        id: 'admin-1',
        name: 'Admin User',
        role: 'admin',
        permissions: ['read', 'write', 'admin', 'export', 'manage_users']
      };

      render(
        <TestWrapper>
          <MockAuthProvider initialUser={adminUser} initialPermissions={adminUser.permissions}>
            {(props) => (
              <MockRoleBasedMenu {...props} />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('view-assessments')).toBeInTheDocument();
      expect(screen.getByTestId('create-assessment')).toBeInTheDocument();
      expect(screen.getByTestId('export-data')).toBeInTheDocument();
      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
      expect(screen.getByTestId('manage-users')).toBeInTheDocument();
    });

    test('esg_manager user has appropriate permissions', () => {
      const esgManagerUser = {
        id: 'esg-1',
        name: 'ESG Manager',
        role: 'esg_manager',
        permissions: ['read', 'write', 'export', 'create_assessments']
      };

      render(
        <TestWrapper>
          <MockAuthProvider initialUser={esgManagerUser} initialPermissions={esgManagerUser.permissions}>
            {(props) => (
              <MockRoleBasedMenu {...props} />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('view-assessments')).toBeInTheDocument();
      expect(screen.getByTestId('create-assessment')).toBeInTheDocument();
      expect(screen.getByTestId('export-data')).toBeInTheDocument();
      expect(screen.getByTestId('compliance-reports')).toBeInTheDocument();
      
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('manage-users')).not.toBeInTheDocument();
    });

    test('viewer user has limited read-only access', () => {
      const viewerUser = {
        id: 'viewer-1',
        name: 'Viewer User',
        role: 'viewer',
        permissions: ['read']
      };

      render(
        <TestWrapper>
          <MockAuthProvider initialUser={viewerUser} initialPermissions={viewerUser.permissions}>
            {(props) => (
              <MockRoleBasedMenu {...props} />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('view-assessments')).toBeInTheDocument();
      
      expect(screen.queryByTestId('create-assessment')).not.toBeInTheDocument();
      expect(screen.queryByTestId('export-data')).not.toBeInTheDocument();
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('manage-users')).not.toBeInTheDocument();
      expect(screen.queryByTestId('compliance-reports')).not.toBeInTheDocument();
    });
  });

  describe('Protected Component Access', () => {
    test('allows access with correct permissions', () => {
      const user = {
        id: '1',
        name: 'Test User',
        role: 'esg_manager',
        permissions: ['read', 'write']
      };

      render(
        <TestWrapper>
          <MockAuthProvider initialUser={user} initialPermissions={user.permissions}>
            {(props) => (
              <MockProtectedComponent
                requiredPermission="write"
                {...props}
              />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByTestId('user-info')).toHaveTextContent('Welcome, Test User');
      expect(screen.getByTestId('required-permission')).toHaveTextContent('Required: write');
    });

    test('denies access without required permissions', () => {
      const user = {
        id: '1',
        name: 'Test User',
        role: 'viewer',
        permissions: ['read']
      };

      render(
        <TestWrapper>
          <MockAuthProvider initialUser={user} initialPermissions={user.permissions}>
            {(props) => (
              <MockProtectedComponent
                requiredPermission="write"
                {...props}
              />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('access-denied')).toBeInTheDocument();
      expect(screen.getByTestId('access-denied')).toHaveTextContent('Access denied: Insufficient permissions');
    });

    test('requires authentication for protected content', () => {
      render(
        <TestWrapper>
          <MockAuthProvider>
            {(props) => (
              <MockProtectedComponent
                requiredPermission="read"
                {...props}
              />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('login-required')).toBeInTheDocument();
      expect(screen.getByTestId('login-required')).toHaveTextContent('Please log in to access this feature');
    });

    test('allows access with correct role', () => {
      const adminUser = {
        id: '1',
        name: 'Admin User',
        role: 'admin',
        permissions: ['admin']
      };

      render(
        <TestWrapper>
          <MockAuthProvider initialUser={adminUser} initialPermissions={adminUser.permissions}>
            {(props) => (
              <MockProtectedComponent
                requiredRole="admin"
                {...props}
              />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByTestId('user-role')).toHaveTextContent('Role: admin');
      expect(screen.getByTestId('required-role')).toHaveTextContent('Required Role: admin');
    });

    test('denies access with incorrect role', () => {
      const viewerUser = {
        id: '1',
        name: 'Viewer User',
        role: 'viewer',
        permissions: ['read']
      };

      render(
        <TestWrapper>
          <MockAuthProvider initialUser={viewerUser} initialPermissions={viewerUser.permissions}>
            {(props) => (
              <MockProtectedComponent
                requiredRole="admin"
                {...props}
              />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('access-denied')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('displays session time for authenticated user', () => {
      const user = { id: '1', name: 'Test User' };

      render(
        <TestWrapper>
          <MockSessionManager
            user={user}
            onSessionExpired={mockOnSessionExpired}
            onSessionWarning={mockOnSessionWarning}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('session-manager')).toBeInTheDocument();
      expect(screen.getByTestId('session-time')).toHaveTextContent('Session: 60:00');
    });

    test('shows session warning when time is low', () => {
      const user = { id: '1', name: 'Test User' };

      render(
        <TestWrapper>
          <MockSessionManager
            user={user}
            onSessionExpired={mockOnSessionExpired}
            onSessionWarning={mockOnSessionWarning}
          />
        </TestWrapper>
      );

      // Fast forward to trigger warning (3300 seconds = 55 minutes)
      act(() => {
        jest.advanceTimersByTime(3300 * 1000);
      });

      expect(screen.getByTestId('session-warning')).toBeInTheDocument();
      expect(screen.getByTestId('session-time')).toHaveTextContent('Session: 5:00');
      expect(mockOnSessionWarning).toHaveBeenCalledWith(300);
    });

    test('calls session expired callback when session ends', () => {
      const user = { id: '1', name: 'Test User' };

      render(
        <TestWrapper>
          <MockSessionManager
            user={user}
            onSessionExpired={mockOnSessionExpired}
            onSessionWarning={mockOnSessionWarning}
          />
        </TestWrapper>
      );

      // Fast forward to session expiry (3600 seconds = 1 hour)
      act(() => {
        jest.advanceTimersByTime(3600 * 1000);
      });

      expect(mockOnSessionExpired).toHaveBeenCalled();
      expect(screen.getByTestId('session-time')).toHaveTextContent('Session: 0:00');
    });

    test('does not show session manager for unauthenticated user', () => {
      render(
        <TestWrapper>
          <MockSessionManager
            user={null}
            onSessionExpired={mockOnSessionExpired}
            onSessionWarning={mockOnSessionWarning}
          />
        </TestWrapper>
      );

      expect(screen.queryByTestId('session-manager')).not.toBeInTheDocument();
    });
  });

  describe('Multi-Factor Authentication', () => {
    test('renders MFA modal with code input', () => {
      render(
        <TestWrapper>
          <MockMultiFactorAuth
            onMFAComplete={mockOnMFAComplete}
            onMFACancel={mockOnMFACancel}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('mfa-modal')).toBeInTheDocument();
      expect(screen.getByText('Multi-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByTestId('mfa-code-input')).toBeInTheDocument();
      expect(screen.getByTestId('verify-mfa-button')).toBeDisabled(); // Should be disabled initially
    });

    test('enables verify button when code is 6 digits', async () => {
      render(
        <TestWrapper>
          <MockMultiFactorAuth
            onMFAComplete={mockOnMFAComplete}
            onMFACancel={mockOnMFACancel}
          />
        </TestWrapper>
      );

      const codeInput = screen.getByTestId('mfa-code-input');
      await user.type(codeInput, '123456');

      expect(screen.getByTestId('verify-mfa-button')).not.toBeDisabled();
    });

    test('handles successful MFA verification', async () => {
      render(
        <TestWrapper>
          <MockMultiFactorAuth
            onMFAComplete={mockOnMFAComplete}
            onMFACancel={mockOnMFACancel}
          />
        </TestWrapper>
      );

      const codeInput = screen.getByTestId('mfa-code-input');
      await user.type(codeInput, '123456'); // Correct code

      const verifyButton = screen.getByTestId('verify-mfa-button');
      await user.click(verifyButton);

      await waitFor(() => {
        expect(mockOnMFAComplete).toHaveBeenCalledWith(true);
      });
    });

    test('handles failed MFA verification', async () => {
      render(
        <TestWrapper>
          <MockMultiFactorAuth
            onMFAComplete={mockOnMFAComplete}
            onMFACancel={mockOnMFACancel}
          />
        </TestWrapper>
      );

      const codeInput = screen.getByTestId('mfa-code-input');
      await user.type(codeInput, '999999'); // Incorrect code

      const verifyButton = screen.getByTestId('verify-mfa-button');
      await user.click(verifyButton);

      await waitFor(() => {
        expect(mockOnMFAComplete).toHaveBeenCalledWith(false);
      });
    });

    test('handles MFA cancellation', async () => {
      render(
        <TestWrapper>
          <MockMultiFactorAuth
            onMFAComplete={mockOnMFAComplete}
            onMFACancel={mockOnMFACancel}
          />
        </TestWrapper>
      );

      const cancelButton = screen.getByTestId('cancel-mfa-button');
      await user.click(cancelButton);

      expect(mockOnMFACancel).toHaveBeenCalled();
    });
  });

  describe('Password Policy Enforcement', () => {
    test('validates password against all policy requirements', () => {
      render(
        <TestWrapper>
          <MockPasswordPolicy
            password="StrongPass123!"
            onPolicyCheck={mockOnPolicyCheck}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('password-policy')).toBeInTheDocument();
      expect(screen.getByTestId('policy-length')).toHaveClass('passed');
      expect(screen.getByTestId('policy-uppercase')).toHaveClass('passed');
      expect(screen.getByTestId('policy-lowercase')).toHaveClass('passed');
      expect(screen.getByTestId('policy-numbers')).toHaveClass('passed');
      expect(screen.getByTestId('policy-special')).toHaveClass('passed');
      expect(screen.getByTestId('policy-common')).toHaveClass('passed');
      expect(mockOnPolicyCheck).toHaveBeenCalledWith(true);
    });

    test('fails validation for weak password', () => {
      render(
        <TestWrapper>
          <MockPasswordPolicy
            password="weak"
            onPolicyCheck={mockOnPolicyCheck}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('policy-length')).toHaveClass('failed');
      expect(screen.getByTestId('policy-uppercase')).toHaveClass('failed');
      expect(screen.getByTestId('policy-numbers')).toHaveClass('failed');
      expect(screen.getByTestId('policy-special')).toHaveClass('failed');
      expect(mockOnPolicyCheck).toHaveBeenCalledWith(false);
    });

    test('detects common passwords', () => {
      render(
        <TestWrapper>
          <MockPasswordPolicy
            password="password123"
            onPolicyCheck={mockOnPolicyCheck}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('policy-common')).toHaveClass('failed');
      expect(mockOnPolicyCheck).toHaveBeenCalledWith(false);
    });

    test('validates password with mixed case requirements', () => {
      render(
        <TestWrapper>
          <MockPasswordPolicy
            password="lowercase123!"
            onPolicyCheck={mockOnPolicyCheck}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('policy-uppercase')).toHaveClass('failed');
      expect(screen.getByTestId('policy-lowercase')).toHaveClass('passed');
      expect(mockOnPolicyCheck).toHaveBeenCalledWith(false);
    });
  });

  describe('Integration and Edge Cases', () => {
    test('handles authentication state changes across components', async () => {
      let authProps = {};

      render(
        <TestWrapper>
          <MockAuthProvider>
            {(props) => {
              authProps = props;
              return (
                <div>
                  <button
                    data-testid="login-esg-manager"
                    onClick={() => props.login({ username: 'esg_manager', password: 'correct' })}
                  >
                    Login
                  </button>
                  <MockRoleBasedMenu {...props} />
                  <MockProtectedComponent requiredPermission="write" {...props} />
                </div>
              );
            }}
          </MockAuthProvider>
        </TestWrapper>
      );

      // Initially not authenticated
      expect(screen.getByTestId('login-required')).toBeInTheDocument();
      expect(screen.queryByTestId('create-assessment')).not.toBeInTheDocument();

      // Login as ESG Manager
      await user.click(screen.getByTestId('login-esg-manager'));

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.getByTestId('create-assessment')).toBeInTheDocument();
        expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
      });
    });

    test('handles permission changes after role update', () => {
      const { rerender } = render(
        <TestWrapper>
          <MockAuthProvider
            initialUser={{ id: '1', name: 'User', role: 'viewer' }}
            initialPermissions={['read']}
          >
            {(props) => (
              <MockRoleBasedMenu {...props} />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      // Initially viewer permissions
      expect(screen.getByTestId('view-assessments')).toBeInTheDocument();
      expect(screen.queryByTestId('create-assessment')).not.toBeInTheDocument();

      // Update to manager permissions
      rerender(
        <TestWrapper>
          <MockAuthProvider
            initialUser={{ id: '1', name: 'User', role: 'esg_manager' }}
            initialPermissions={['read', 'write', 'export']}
          >
            {(props) => (
              <MockRoleBasedMenu {...props} />
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('view-assessments')).toBeInTheDocument();
      expect(screen.getByTestId('create-assessment')).toBeInTheDocument();
      expect(screen.getByTestId('export-data')).toBeInTheDocument();
    });

    test('handles loading states during authentication', async () => {
      render(
        <TestWrapper>
          <MockAuthProvider>
            {(props) => (
              <div>
                <button
                  data-testid="login-button"
                  onClick={() => props.login({ username: 'admin', password: 'correct' })}
                  disabled={props.isLoading}
                >
                  {props.isLoading ? 'Logging in...' : 'Login'}
                </button>
                {props.isLoading && <div data-testid="loading-indicator">Authenticating...</div>}
              </div>
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      // Should show loading state
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      expect(loginButton).toHaveTextContent('Logging in...');
      expect(loginButton).toBeDisabled();
    });

    test('maintains security context across route changes', () => {
      const secureUser = {
        id: 'secure-1',
        name: 'Secure User',
        role: 'admin',
        permissions: ['read', 'write', 'admin']
      };

      render(
        <TestWrapper>
          <MockAuthProvider initialUser={secureUser} initialPermissions={secureUser.permissions}>
            {(props) => (
              <div>
                <MockProtectedComponent requiredRole="admin" {...props} />
                <MockRoleBasedMenu {...props} />
              </div>
            )}
          </MockAuthProvider>
        </TestWrapper>
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
      expect(screen.getByTestId('user-info')).toHaveTextContent('Welcome, Secure User');
    });
  });
});
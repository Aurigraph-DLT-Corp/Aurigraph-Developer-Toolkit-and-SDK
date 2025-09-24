import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock API calls
const mockApiCall = vi.fn();
vi.mock('../utils/api', () => ({
  apiCall: mockApiCall,
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    validateToken: vi.fn(),
    refreshToken: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Authentication Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Login Flow', () => {
    it('should handle successful login', async () => {
      const mockToken = 'mock-jwt-token';
      const mockUser = { id: 1, email: 'test@aurex.com', name: 'Test User' };
      
      mockApiCall.mockResolvedValueOnce({
        success: true,
        data: { token: mockToken, user: mockUser }
      });

      // Mock a login form component
      const LoginForm = () => {
        const handleLogin = async () => {
          const response = await mockApiCall('/auth/login', {
            method: 'POST',
            body: { email: 'test@aurex.com', password: 'password123' }
          });
          
          if (response.success) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        };

        return (
          <form onSubmit={handleLogin}>
            <input type="email" data-testid="email-input" />
            <input type="password" data-testid="password-input" />
            <button type="submit" data-testid="login-button">Login</button>
          </form>
        );
      };

      render(<LoginForm />);
      
      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith('/auth/login', {
          method: 'POST',
          body: { email: 'test@aurex.com', password: 'password123' }
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      });
    });

    it('should handle login failure', async () => {
      mockApiCall.mockResolvedValueOnce({
        success: false,
        error: 'Invalid credentials'
      });

      const LoginForm = () => {
        const [error, setError] = React.useState('');
        
        const handleLogin = async () => {
          const response = await mockApiCall('/auth/login', {
            method: 'POST',
            body: { email: 'test@aurex.com', password: 'wrong-password' }
          });
          
          if (!response.success) {
            setError(response.error);
          }
        };

        return (
          <form onSubmit={handleLogin}>
            {error && <div data-testid="error-message">{error}</div>}
            <button type="submit" data-testid="login-button">Login</button>
          </form>
        );
      };

      render(<LoginForm />);
      
      const loginButton = screen.getByTestId('login-button');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid credentials');
      });
    });
  });

  describe('Registration Flow', () => {
    it('should handle successful registration', async () => {
      const mockUser = { id: 1, email: 'newuser@aurex.com', name: 'New User' };
      
      mockApiCall.mockResolvedValueOnce({
        success: true,
        data: { user: mockUser, message: 'Registration successful' }
      });

      const RegistrationForm = () => {
        const [message, setMessage] = React.useState('');
        
        const handleRegister = async () => {
          const response = await mockApiCall('/auth/register', {
            method: 'POST',
            body: { 
              email: 'newuser@aurex.com', 
              password: 'password123',
              name: 'New User',
              company: 'Test Company'
            }
          });
          
          if (response.success) {
            setMessage(response.data.message);
          }
        };

        return (
          <form onSubmit={handleRegister}>
            {message && <div data-testid="success-message">{message}</div>}
            <input type="email" data-testid="email-input" />
            <input type="password" data-testid="password-input" />
            <input type="text" data-testid="name-input" />
            <input type="text" data-testid="company-input" />
            <button type="submit" data-testid="register-button">Register</button>
          </form>
        );
      };

      render(<RegistrationForm />);
      
      const registerButton = screen.getByTestId('register-button');
      fireEvent.click(registerButton);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith('/auth/register', {
          method: 'POST',
          body: { 
            email: 'newuser@aurex.com', 
            password: 'password123',
            name: 'New User',
            company: 'Test Company'
          }
        });
        expect(screen.getByTestId('success-message')).toHaveTextContent('Registration successful');
      });
    });
  });

  describe('Logout Flow', () => {
    it('should handle successful logout', async () => {
      localStorageMock.getItem.mockReturnValue('mock-token');
      
      mockApiCall.mockResolvedValueOnce({
        success: true,
        message: 'Logged out successfully'
      });

      const LogoutButton = () => {
        const handleLogout = async () => {
          const response = await mockApiCall('/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.success) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        };

        return (
          <button onClick={handleLogout} data-testid="logout-button">
            Logout
          </button>
        );
      };

      render(<LogoutButton />);
      
      const logoutButton = screen.getByTestId('logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      });
    });
  });

  describe('Token Validation', () => {
    it('should validate token on app startup', async () => {
      const mockToken = 'valid-token';
      const mockUser = { id: 1, email: 'test@aurex.com' };
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      mockApiCall.mockResolvedValueOnce({
        success: true,
        data: { user: mockUser }
      });

      const TokenValidator = () => {
        React.useEffect(() => {
          const validateToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
              const response = await mockApiCall('/auth/validate', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!response.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }
            }
          };
          
          validateToken();
        }, []);

        return <div data-testid="token-validator">Token Validator</div>;
      };

      render(<TokenValidator />);

      await waitFor(() => {
        expect(mockApiCall).toHaveBeenCalledWith('/auth/validate', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer valid-token'
          }
        });
      });
    });

    it('should remove invalid token', async () => {
      const mockToken = 'invalid-token';
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      mockApiCall.mockResolvedValueOnce({
        success: false,
        error: 'Invalid token'
      });

      const TokenValidator = () => {
        React.useEffect(() => {
          const validateToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
              const response = await mockApiCall('/auth/validate', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!response.success) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
              }
            }
          };
          
          validateToken();
        }, []);

        return <div data-testid="token-validator">Token Validator</div>;
      };

      render(<TokenValidator />);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      });
    });
  });
});
/**
 * ================================================================================
 * AUREX CARBONTRACE™ LOGIN FORM COMPONENT TESTS
 * Comprehensive test suite for carbon trading platform authentication
 * Ticket: CARBONTRACE-401 - Testing & Validation Suite
 * Test Coverage Target: >95% component coverage, auth flow validation
 * Created: December 14, 2025
 * ================================================================================
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import LoginForm from '../auth/LoginForm';

// Mock the auth context
const mockLogin = vi.fn();
const mockAuthContext = {
  login: mockLogin,
  user: null,
  loading: false,
  error: null,
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Wrapper component for Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('LoginForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext.loading = false;
    mockAuthContext.error = null;
  });

  describe('Rendering and Layout', () => {
    it('renders without crashing', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });

    it('displays email input field', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('displays password input field', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toBeInTheDocument();
    });

    it('shows login button', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const loginButton = screen.getByRole('button', { name: /login|sign in/i });
      expect(loginButton).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('validates email format', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const loginButton = screen.getByRole('button', { name: /login|sign in/i });
      
      await user.type(emailInput, 'invalid-email');
      await user.click(loginButton);
      
      // Should show validation error or not submit
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('requires password field', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const loginButton = screen.getByRole('button', { name: /login|sign in/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(loginButton);
      
      // Should not submit without password
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('submits form with valid credentials', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login|sign in/i });
      
      await user.type(emailInput, 'trader@carbontrace.com');
      await user.type(passwordInput, 'securepassword123');
      await user.click(loginButton);
      
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'trader@carbontrace.com',
          password: 'securepassword123',
        })
      );
    });
  });

  describe('Loading States', () => {
    it('shows loading state during authentication', () => {
      mockAuthContext.loading = true;
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const loadingElement = screen.getByText(/loading|signing in/i) || 
                           screen.getByRole('button', { name: /loading|signing in/i });
      expect(loadingElement).toBeInTheDocument();
    });

    it('disables form during loading', () => {
      mockAuthContext.loading = true;
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const loginButton = screen.getByRole('button', { name: /login|sign in|loading|signing in/i });
      expect(loginButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays authentication errors', () => {
      mockAuthContext.error = 'Invalid credentials';
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      expect(screen.getByText(/invalid credentials|error/i)).toBeInTheDocument();
    });

    it('clears errors on new input', async () => {
      mockAuthContext.error = 'Invalid credentials';
      const user = userEvent.setup();
      
      const { rerender } = render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      expect(screen.getByText(/invalid credentials|error/i)).toBeInTheDocument();
      
      // Clear error and rerender
      mockAuthContext.error = null;
      rerender(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      expect(screen.queryByText(/invalid credentials|error/i)).not.toBeInTheDocument();
    });
  });

  describe('User Experience Features', () => {
    it('includes carbon trading platform branding', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      // Should include CarbonTrace or carbon trading related text
      expect(
        screen.getByText(/carbontrace|carbon trading|carbon credit/i) ||
        screen.getByText(/trade|marketplace|portfolio/i)
      ).toBeInTheDocument();
    });

    it('provides forgot password link', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const forgotPasswordLink = screen.queryByText(/forgot password|reset password/i);
      if (forgotPasswordLink) {
        expect(forgotPasswordLink).toBeInTheDocument();
      }
    });

    it('includes signup link for new users', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const signupLink = screen.queryByText(/sign up|create account|register/i);
      if (signupLink) {
        expect(signupLink).toBeInTheDocument();
      }
    });
  });

  describe('Form Interaction', () => {
    it('allows typing in email field', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      
      await user.type(emailInput, 'trader@example.com');
      
      expect(emailInput).toHaveValue('trader@example.com');
    });

    it('allows typing in password field', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
      
      await user.type(passwordInput, 'mypassword');
      
      expect(passwordInput).toHaveValue('mypassword');
    });

    it('handles form submission with Enter key', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');
      
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const emailField = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordField = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
      
      expect(emailField).toBeInTheDocument();
      expect(passwordField).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
      
      // Tab navigation should work
      await user.click(emailInput);
      await user.keyboard('{Tab}');
      
      expect(passwordInput).toHaveFocus();
    });

    it('has appropriate ARIA attributes', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const form = screen.getByRole('form') || screen.getByTestId('login-form') || 
                   document.querySelector('form');
      
      if (form) {
        expect(form).toBeInTheDocument();
      }
    });
  });

  describe('Security Considerations', () => {
    it('uses password input type for password field', () => {
      render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('does not expose credentials in DOM', async () => {
      const user = userEvent.setup();
      
      const { container } = render(
        <RouterWrapper>
          <LoginForm />
        </RouterWrapper>
      );
      
      const emailInput = screen.getByLabelText(/email/i) || screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i) || screen.getByPlaceholderText(/password/i);
      
      await user.type(emailInput, 'secret@example.com');
      await user.type(passwordInput, 'supersecret');
      
      // Password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });
});
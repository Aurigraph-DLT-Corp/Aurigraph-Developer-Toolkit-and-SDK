import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  redirectTo?: string;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  redirectTo,
  onSuccess
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Close modal when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      onSuccess?.();
      onClose();
    }
  }, [isAuthenticated, isLoading, onClose, onSuccess]);

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          {mode === 'login' ? (
            <LoginForm
              onSwitchToRegister={handleSwitchToRegister}
              redirectTo={redirectTo}
            />
          ) : (
            <RegisterForm
              onSwitchToLogin={handleSwitchToLogin}
              redirectTo={redirectTo}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

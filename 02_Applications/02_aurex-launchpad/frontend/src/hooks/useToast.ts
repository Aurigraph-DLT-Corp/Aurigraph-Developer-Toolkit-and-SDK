import { useState, useCallback } from 'react';
import { ToastData, ToastType } from '../components/common/Toast';

interface UseToastReturn {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  success: (title: string, message?: string, duration?: number) => string;
  error: (title: string, message?: string, duration?: number) => string;
  warning: (title: string, message?: string, duration?: number) => string;
  info: (title: string, message?: string, duration?: number) => string;
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>): string => {
    const id = generateId();
    const newToast: ToastData = {
      ...toast,
      id,
      duration: toast.duration ?? 5000, // Default 5 seconds
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string): void => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback((): void => {
    setToasts([]);
  }, []);

  const success = useCallback((title: string, message?: string, duration?: number): string => {
    return addToast({
      type: 'success',
      title,
      message,
      duration,
    });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, duration?: number): string => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: duration ?? 8000, // Errors stay longer by default
    });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, duration?: number): string => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, duration?: number): string => {
    return addToast({
      type: 'info',
      title,
      message,
      duration,
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
};

export default useToast;
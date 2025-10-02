import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Fade in animation
    setTimeout(() => setIsVisible(true), 50);

    // Auto remove after duration
    if (toast.duration !== 0) {
      const timer = setTimeout(() => {
        handleRemove();
      }, toast.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [toast.duration]);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div
      className={`max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 transition-all duration-300 transform ${
        isVisible && !isRemoving
          ? 'translate-x-0 opacity-100 scale-100'
          : isRemoving
          ? 'translate-x-full opacity-0 scale-95'
          : '-translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className={`mt-1 text-sm ${getTextColor()} opacity-75`}>
                {toast.message}
              </p>
            )}
            {toast.action && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={toast.action.onClick}
                  className={`text-sm font-medium ${
                    toast.type === 'success'
                      ? 'text-green-700 hover:text-green-600'
                      : toast.type === 'error'
                      ? 'text-red-700 hover:text-red-600'
                      : toast.type === 'warning'
                      ? 'text-yellow-700 hover:text-yellow-600'
                      : 'text-blue-700 hover:text-blue-600'
                  } transition-colors`}
                >
                  {toast.action.label}
                </button>
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className={`inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                toast.type === 'success'
                  ? 'focus:ring-green-500'
                  : toast.type === 'error'
                  ? 'focus:ring-red-500'
                  : toast.type === 'warning'
                  ? 'focus:ring-yellow-500'
                  : 'focus:ring-blue-500'
              }`}
              onClick={handleRemove}
            >
              <span className="sr-only">Close</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
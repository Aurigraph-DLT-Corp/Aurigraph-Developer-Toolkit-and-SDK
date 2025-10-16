/**
 * API Error Handler Utility
 *
 * Centralized error handling for API requests
 * Provides user-friendly error messages and retry logic
 */

import { message } from 'antd';

export interface ApiError {
  status: number;
  message: string;
  details?: string;
  retryable: boolean;
  type: 'network' | 'server' | 'client' | 'not-found' | 'timeout' | 'unknown';
}

/**
 * Parse API error and return structured error information
 */
export const parseApiError = (error: unknown): ApiError => {
  // Network error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      status: 0,
      message: 'Network error - Unable to connect to backend API',
      details: 'Please check your internet connection and try again.',
      retryable: true,
      type: 'network',
    };
  }

  // HTTP error
  if (error instanceof Error) {
    const errorMessage = error.message;

    // Parse HTTP status from error message
    const statusMatch = errorMessage.match(/HTTP (\d+):/);
    const status = statusMatch && statusMatch[1] ? parseInt(statusMatch[1], 10) : 500;

    // 404 - Not Found
    if (status === 404) {
      return {
        status: 404,
        message: 'Feature unavailable',
        details: 'This backend API endpoint is not yet implemented.',
        retryable: false,
        type: 'not-found',
      };
    }

    // 500+ - Server Error
    if (status >= 500) {
      return {
        status,
        message: 'Backend server error',
        details: 'The backend service encountered an error. Please try again later.',
        retryable: true,
        type: 'server',
      };
    }

    // 400-499 - Client Error
    if (status >= 400 && status < 500) {
      return {
        status,
        message: 'Request error',
        details: errorMessage,
        retryable: false,
        type: 'client',
      };
    }

    // Timeout
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return {
        status: 408,
        message: 'Request timeout',
        details: 'The request took too long to complete. Please try again.',
        retryable: true,
        type: 'timeout',
      };
    }
  }

  // Unknown error
  return {
    status: 500,
    message: 'Unknown error occurred',
    details: error instanceof Error ? error.message : String(error),
    retryable: true,
    type: 'unknown',
  };
};

/**
 * Handle API error with user notification
 */
export const handleApiError = (
  error: unknown,
  options?: {
    silent?: boolean;
    customMessage?: string;
    onRetry?: () => void;
  }
): ApiError => {
  const parsedError = parseApiError(error);

  // Log error to console for debugging
  console.error('API Error:', parsedError, error);

  // Show user notification unless silent mode is enabled
  if (!options?.silent) {
    const errorMessage = options?.customMessage || parsedError.message;

    if (parsedError.type === 'not-found') {
      message.warning({
        content: `${errorMessage}: ${parsedError.details}`,
        duration: 5,
      });
    } else if (parsedError.retryable) {
      message.error({
        content: `${errorMessage}${parsedError.details ? '\n' + parsedError.details : ''}`,
        duration: 6,
      });
    } else {
      message.error({
        content: errorMessage,
        duration: 5,
      });
    }
  }

  return parsedError;
};

/**
 * Wrapper for API calls with automatic error handling
 */
export const withApiErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  options?: {
    silent?: boolean;
    customMessage?: string;
    onError?: (error: ApiError) => void;
  }
): Promise<{ data: T | null; error: ApiError | null }> => {
  try {
    const data = await apiCall();
    return { data, error: null };
  } catch (error) {
    const parsedError = handleApiError(error, {
      silent: options?.silent,
      customMessage: options?.customMessage,
    });

    if (options?.onError) {
      options.onError(parsedError);
    }

    return { data: null, error: parsedError };
  }
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: ApiError): boolean => {
  return error.retryable;
};

/**
 * Check if error is a 404 Not Found
 */
export const isNotFoundError = (error: ApiError): boolean => {
  return error.status === 404 || error.type === 'not-found';
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: ApiError): boolean => {
  return error.type === 'network';
};

export default {
  parseApiError,
  handleApiError,
  withApiErrorHandling,
  isRetryableError,
  isNotFoundError,
  isNetworkError,
};

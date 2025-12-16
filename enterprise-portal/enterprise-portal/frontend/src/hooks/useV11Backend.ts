/**
 * useV11Backend Hook
 *
 * Custom React hooks for Aurigraph V11 Backend API
 * Provides data fetching with loading, error, and success states
 *
 * Usage:
 * const { data, loading, error, refetch } = useTransactions({ status: 'confirmed' });
 */

import { useState, useEffect, useCallback } from 'react';
import {
  v11BackendService,
  type Transaction,
  type Block,
  type Validator,
  type TransactionFilters,
  type BlockFilters,
  type SubmitTransactionRequest,
  type SubmitTransactionResponse,
} from '../services';
import type {
  HealthCheckResponse,
  SystemInfoResponse,
  PerformanceMetrics,
  StatsResponse,
} from '../types/api';

/**
 * Base hook result interface
 */
interface UseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Mutation hook result interface
 */
interface UseMutationResult<TData, TVariables> {
  data: TData | null;
  loading: boolean;
  error: Error | null;
  mutate: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

/**
 * Hook for fetching health check status
 */
export const useHealth = (options?: { enabled?: boolean; pollingInterval?: number }): UseQueryResult<HealthCheckResponse> => {
  const [data, setData] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await v11BackendService.getHealth();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (options?.enabled === false) return undefined;

    fetchData();

    // Set up polling if interval is provided
    if (options?.pollingInterval) {
      const interval = setInterval(fetchData, options.pollingInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchData, options?.enabled, options?.pollingInterval]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching system information
 */
export const useSystemInfo = (): UseQueryResult<SystemInfoResponse> => {
  const [data, setData] = useState<SystemInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await v11BackendService.getSystemInfo();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching performance metrics
 */
export const usePerformanceMetrics = (options?: { pollingInterval?: number }): UseQueryResult<PerformanceMetrics> => {
  const [data, setData] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await v11BackendService.getPerformanceMetrics();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Set up polling if interval is provided
    if (options?.pollingInterval) {
      const interval = setInterval(fetchData, options.pollingInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchData, options?.pollingInterval]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching all statistics
 */
export const useStats = (options?: { pollingInterval?: number }): UseQueryResult<StatsResponse> => {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await v11BackendService.getStats();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Set up polling if interval is provided
    if (options?.pollingInterval) {
      const interval = setInterval(fetchData, options.pollingInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchData, options?.pollingInterval]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching transactions with pagination and filtering
 */
export const useTransactions = (
  filters?: TransactionFilters
): UseQueryResult<{ data: Transaction[]; total: number; page: number; pageSize: number }> => {
  const [data, setData] = useState<{ data: Transaction[]; total: number; page: number; pageSize: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await v11BackendService.getTransactions(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching blocks with pagination and filtering
 */
export const useBlocks = (
  filters?: BlockFilters
): UseQueryResult<{ data: Block[]; total: number; page: number; pageSize: number }> => {
  const [data, setData] = useState<{ data: Block[]; total: number; page: number; pageSize: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await v11BackendService.getBlocks(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching validators
 */
export const useValidators = (): UseQueryResult<Validator[]> => {
  const [data, setData] = useState<Validator[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await v11BackendService.getValidators();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for submitting transactions (mutation)
 */
export const useSubmitTransaction = (): UseMutationResult<
  SubmitTransactionResponse,
  SubmitTransactionRequest
> => {
  const [data, setData] = useState<SubmitTransactionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (transaction: SubmitTransactionRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await v11BackendService.submitTransaction(transaction);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, mutate, reset };
};

/**
 * Combined hook for common dashboard data
 */
export const useDashboard = (options?: { pollingInterval?: number }) => {
  const health = useHealth({ pollingInterval: options?.pollingInterval });
  const stats = useStats({ pollingInterval: options?.pollingInterval });
  const validators = useValidators();

  return {
    health: health.data,
    stats: stats.data,
    validators: validators.data,
    loading: health.loading || stats.loading || validators.loading,
    error: health.error || stats.error || validators.error,
    refetch: async () => {
      await Promise.all([health.refetch(), stats.refetch(), validators.refetch()]);
    },
  };
};

export default {
  useHealth,
  useSystemInfo,
  usePerformanceMetrics,
  useStats,
  useTransactions,
  useBlocks,
  useValidators,
  useSubmitTransaction,
  useDashboard,
};

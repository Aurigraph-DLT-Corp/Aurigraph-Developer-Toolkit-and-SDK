/**
 * Hook for managing URL query parameters
 *
 * Enables filter persistence via URL search params
 * Allows bookmarking filtered views
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface QueryParams {
  [key: string]: string | string[] | undefined;
}

/**
 * Hook to manage URL query parameters
 *
 * Usage:
 * const { params, setParam, setParams, getParam, clearParam, clearAll } = useQueryParams();
 *
 * // Get a parameter
 * const category = getParam('category');
 *
 * // Set a parameter
 * setParam('category', 'blockchain');
 *
 * // Set multiple parameters
 * setParams({ category: 'blockchain', status: 'active' });
 *
 * // Clear a parameter
 * clearParam('category');
 *
 * // Clear all parameters
 * clearAll();
 */
export const useQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Get all parameters as an object
   */
  const params: QueryParams = useMemo(() => {
    const result: QueryParams = {};
    searchParams.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }, [searchParams]);

  /**
   * Get a single parameter value
   */
  const getParam = useCallback(
    (key: string, defaultValue?: string): string | undefined => {
      return searchParams.get(key) ?? defaultValue;
    },
    [searchParams]
  );

  /**
   * Get a parameter as a boolean
   */
  const getParamBoolean = useCallback(
    (key: string, defaultValue = false): boolean => {
      const value = searchParams.get(key);
      if (value === null) return defaultValue;
      return value === 'true' || value === '1' || value === 'yes';
    },
    [searchParams]
  );

  /**
   * Get a parameter as a number
   */
  const getParamNumber = useCallback(
    (key: string, defaultValue?: number): number | undefined => {
      const value = searchParams.get(key);
      if (value === null) return defaultValue;
      const num = parseInt(value, 10);
      return isNaN(num) ? defaultValue : num;
    },
    [searchParams]
  );

  /**
   * Get a parameter as an array (comma-separated)
   */
  const getParamArray = useCallback(
    (key: string, separator = ','): string[] => {
      const value = searchParams.get(key);
      if (!value) return [];
      return value.split(separator).map(v => v.trim());
    },
    [searchParams]
  );

  /**
   * Set a single parameter
   */
  const setParam = useCallback(
    (key: string, value: string | number | boolean | null | undefined) => {
      const newParams = new URLSearchParams(searchParams);
      if (value === null || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * Set multiple parameters at once
   */
  const setParams = useCallback(
    (updates: Record<string, string | number | boolean | null | undefined>) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      });
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * Set a parameter with an array value (comma-separated)
   */
  const setParamArray = useCallback(
    (key: string, values: string[], separator = ',') => {
      setParam(key, values.join(separator));
    },
    [setParam]
  );

  /**
   * Clear a single parameter
   */
  const clearParam = useCallback(
    (key: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete(key);
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * Clear multiple parameters
   */
  const clearParams = useCallback(
    (keys: string[]) => {
      const newParams = new URLSearchParams(searchParams);
      keys.forEach(key => newParams.delete(key));
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * Clear all parameters
   */
  const clearAll = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  /**
   * Check if a parameter exists
   */
  const hasParam = useCallback(
    (key: string): boolean => {
      return searchParams.has(key);
    },
    [searchParams]
  );

  /**
   * Get all parameters as a string
   */
  const getQueryString = useCallback((): string => {
    return searchParams.toString();
  }, [searchParams]);

  return {
    // State
    params,
    searchParams,

    // Getters
    getParam,
    getParamBoolean,
    getParamNumber,
    getParamArray,
    hasParam,

    // Setters
    setParam,
    setParams,
    setParamArray,

    // Clearers
    clearParam,
    clearParams,
    clearAll,

    // Utilities
    getQueryString,
  };
};

export default useQueryParams;

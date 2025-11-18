/**
 * Navigation Context
 *
 * Global context for managing navigation state, breadcrumbs, and inter-component communication
 * Enables consistent navigation experience across the entire portal
 */

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { RouteDefinition, getBreadcrumbPath } from '../routes/routes';

/**
 * Navigation state interface
 */
export interface NavigationState {
  currentPath: string;
  breadcrumbs: RouteDefinition[];
  previousPath?: string;
  activeMenu: string[];
  filters: Record<string, any>;
  selectedItems: Record<string, string[]>;
}

/**
 * Navigation context value interface
 */
export interface NavigationContextValue extends NavigationState {
  // Navigation actions
  navigate: (path: string) => void;
  goBack: () => void;

  // Breadcrumb management
  updateBreadcrumbs: (path: string) => void;

  // Filter management
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;

  // Selection management
  setSelectedItems: (section: string, items: string[]) => void;
  clearSelectedItems: (section: string) => void;

  // Menu state
  setActiveMenu: (keys: string[]) => void;

  // Utilities
  isActive: (path: string) => boolean;
  getFilterValue: (key: string, defaultValue?: any) => any;
  getSelectedItems: (section: string) => string[];
}

/**
 * Create the navigation context
 */
const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

/**
 * Navigation Context Provider Component
 */
export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [state, setState] = useState<NavigationState>({
    currentPath: location.pathname,
    breadcrumbs: getBreadcrumbPath(location.pathname),
    previousPath: undefined,
    activeMenu: [],
    filters: {},
    selectedItems: {},
  });

  // Update state when location changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      previousPath: prev.currentPath,
      currentPath: location.pathname,
      breadcrumbs: getBreadcrumbPath(location.pathname),
    }));
  }, [location.pathname]);

  /**
   * Navigate to a different path
   */
  const navigate = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    setState(prev => ({
      ...prev,
      previousPath: prev.currentPath,
      currentPath: path,
      breadcrumbs: getBreadcrumbPath(path),
    }));
  }, []);

  /**
   * Navigate back to previous path
   */
  const goBack = useCallback(() => {
    if (state.previousPath) {
      navigate(state.previousPath);
    } else {
      window.history.back();
    }
  }, [state.previousPath, navigate]);

  /**
   * Update breadcrumbs for a given path
   */
  const updateBreadcrumbs = useCallback((path: string) => {
    setState(prev => ({
      ...prev,
      breadcrumbs: getBreadcrumbPath(path),
    }));
  }, []);

  /**
   * Set a filter value
   */
  const setFilter = useCallback((key: string, value: any) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [key]: value,
      },
    }));
  }, []);

  /**
   * Clear a specific filter
   */
  const clearFilter = useCallback((key: string) => {
    setState(prev => {
      const newFilters = { ...prev.filters };
      delete newFilters[key];
      return {
        ...prev,
        filters: newFilters,
      };
    });
  }, []);

  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: {},
    }));
  }, []);

  /**
   * Set selected items for a section
   */
  const setSelectedItems = useCallback((section: string, items: string[]) => {
    setState(prev => ({
      ...prev,
      selectedItems: {
        ...prev.selectedItems,
        [section]: items,
      },
    }));
  }, []);

  /**
   * Clear selected items for a section
   */
  const clearSelectedItems = useCallback((section: string) => {
    setState(prev => {
      const newSelectedItems = { ...prev.selectedItems };
      delete newSelectedItems[section];
      return {
        ...prev,
        selectedItems: newSelectedItems,
      };
    });
  }, []);

  /**
   * Set active menu keys
   */
  const setActiveMenu = useCallback((keys: string[]) => {
    setState(prev => ({
      ...prev,
      activeMenu: keys,
    }));
  }, []);

  /**
   * Check if a path is currently active
   */
  const isActive = useCallback((path: string): boolean => {
    return state.currentPath === path || state.currentPath.startsWith(path + '/');
  }, [state.currentPath]);

  /**
   * Get filter value
   */
  const getFilterValue = useCallback(
    (key: string, defaultValue?: any) => {
      return state.filters[key] ?? defaultValue;
    },
    [state.filters]
  );

  /**
   * Get selected items for a section
   */
  const getSelectedItems = useCallback(
    (section: string): string[] => {
      return state.selectedItems[section] ?? [];
    },
    [state.selectedItems]
  );

  /**
   * Context value
   */
  const value: NavigationContextValue = {
    ...state,
    navigate,
    goBack,
    updateBreadcrumbs,
    setFilter,
    clearFilter,
    clearAllFilters,
    setSelectedItems,
    clearSelectedItems,
    setActiveMenu,
    isActive,
    getFilterValue,
    getSelectedItems,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * Hook to use the navigation context
 */
export const useNavigation = (): NavigationContextValue => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

/**
 * Hook to get current breadcrumbs
 */
export const useBreadcrumbs = (): RouteDefinition[] => {
  const { breadcrumbs } = useNavigation();
  return breadcrumbs;
};

/**
 * Hook to check if a path is active
 */
export const useIsActive = (path: string): boolean => {
  const { isActive } = useNavigation();
  return isActive(path);
};

/**
 * Hook to get filters
 */
export const useFilters = () => {
  const { filters, setFilter, clearFilter, clearAllFilters } = useNavigation();
  return {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
  };
};

/**
 * Hook to get selections
 */
export const useSelections = (section: string) => {
  const { getSelectedItems, setSelectedItems, clearSelectedItems } = useNavigation();
  return {
    selected: getSelectedItems(section),
    setSelected: (items: string[]) => setSelectedItems(section, items),
    clear: () => clearSelectedItems(section),
  };
};

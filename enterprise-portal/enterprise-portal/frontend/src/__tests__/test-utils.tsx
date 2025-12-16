/**
 * Test Utilities
 *
 * Helper functions and custom render methods for testing
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../store/authSlice';
import settingsSlice from '../store/settingsSlice';
import liveDataSlice from '../store/liveDataSlice';
import comprehensivePortalSlice from '../store/comprehensivePortalSlice';
import demoAppSlice from '../store/demoAppSlice';

/**
 * Create a test store with initial state
 */
export function createTestStore(preloadedState?: any) {
  return configureStore({
    reducer: {
      auth: authSlice,
      settings: settingsSlice,
      liveData: liveDataSlice,
      comprehensivePortal: comprehensivePortalSlice,
      demoApp: demoAppSlice,
    },
    preloadedState,
  });
}

/**
 * Custom render with Redux Provider and Router
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any;
  store?: ReturnType<typeof createTestStore>;
  withRouter?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState,
    store = createTestStore(preloadedState),
    withRouter = true,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    if (withRouter) {
      return (
        <Provider store={store}>
          <BrowserRouter>{children}</BrowserRouter>
        </Provider>
      );
    }

    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

/**
 * Mock API response helper
 */
export function createMockResponse<T>(data: T, options?: { delay?: number; error?: boolean }) {
  const { delay = 0, error = false } = options || {};

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (error) {
        reject(new Error('Mock API Error'));
      } else {
        resolve({
          ok: true,
          status: 200,
          json: async () => data,
        });
      }
    }, delay);
  });
}

/**
 * Create mock fetch function
 */
export function createMockFetch(responses: Map<string, any>) {
  return vi.fn((url: string) => {
    const endpoint = new URL(url).pathname;
    const response = responses.get(endpoint);

    if (!response) {
      return Promise.reject(new Error(`No mock response for ${endpoint}`));
    }

    return createMockResponse(response);
  });
}

/**
 * Wait for async operations
 */
export async function waitForAsync(timeout = 100) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * Mock localStorage
 */
export function createMockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
}

/**
 * Mock feature flags environment
 */
export function mockFeatureFlags(flags: Record<string, boolean>) {
  const env: Record<string, string> = {};

  Object.entries(flags).forEach(([key, value]) => {
    env[`VITE_FEATURE_${key.toUpperCase()}`] = value.toString();
  });

  return env;
}

/**
 * Create mock user data
 */
export function createMockUser(overrides?: any) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    permissions: ['read', 'write', 'delete'],
    ...overrides,
  };
}

/**
 * Create mock blockchain data
 */
export function createMockBlockchainData() {
  return {
    tps: 2500000,
    avgTps: 2400000,
    peakTps: 2800000,
    totalTransactions: 5000000,
    blockHeight: 75000,
    validators: 10,
    activeValidators: 9,
  };
}

/**
 * Create mock token data
 */
export function createMockTokenData(overrides?: any) {
  return {
    address: '0x1234567890abcdef',
    symbol: 'TEST',
    name: 'Test Token',
    decimals: 18,
    totalSupply: '1000000000',
    ...overrides,
  };
}

/**
 * Test data generators
 */
export const testData = {
  weather: () => ({
    location: 'New York',
    temperature: 20.5,
    humidity: 65,
    pressure: 1013,
    windSpeed: 5.5,
    condition: 'Clear',
    timestamp: new Date().toISOString(),
  }),

  stock: () => ({
    symbol: 'AAPL',
    price: 150.25,
    volume: 1000000,
    change: 2.25,
    changePercent: 1.52,
    timestamp: new Date().toISOString(),
  }),

  crypto: () => ({
    symbol: 'BTC',
    price: 45000,
    marketCap: 850000000000,
    volume24h: 25000000000,
    change24h: 2.5,
    timestamp: new Date().toISOString(),
  }),

  news: () => ({
    title: 'Test News Article',
    description: 'This is a test news article',
    source: 'Test Source',
    url: 'https://example.com/news',
    publishedAt: new Date().toISOString(),
    sentiment: 'neutral' as const,
  }),
};

/**
 * Assertion helpers
 */
export const assertions = {
  isValidTimestamp: (timestamp: string) => {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  },

  isValidAddress: (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  },

  isValidTxHash: (hash: string) => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  },
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

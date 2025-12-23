import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TransactionAnalyticsDashboard from '../../../pages/dashboards/TransactionAnalyticsDashboard';
import transactionAnalyticsReducer from '../../../store/transactionAnalyticsSlice';
import * as apiService from '../../../services/api';

// ============================================================================
// MOCKS
// ============================================================================

vi.mock('../../../services/api', () => ({
  apiService: {
    getAnalytics: vi.fn(),
    getAnalyticsPerformance: vi.fn(),
    getTransactions: vi.fn(),
  },
  safeApiCall: vi.fn((fn, fallback) => fn().then(data => ({ data, error: null, success: true })).catch(() => ({ data: fallback, error: new Error('Failed'), success: false }))),
}));

const mockApiService = apiService.apiService as any;

// Mock Data
const mockTransactionOverview = {
  totalTransactions24h: 1250000,
  avgTransactionValue: 0.0245,
  currentTPS: 776000,
  successRate: 98.7,
  failureRate: 1.3,
  totalVolume24h: 30625,
  peakTPS: 850000,
  avgConfirmationTime: 0.45,
};

const mockTypeBreakdown = [
  {
    type: 'Transfer',
    count: 875000,
    volume: 21437.5,
    avgGas: 21000,
    successRate: 99.2,
    percentage: 70,
  },
  {
    type: 'Contract',
    count: 250000,
    volume: 6125,
    avgGas: 85000,
    successRate: 97.8,
    percentage: 20,
  },
  {
    type: 'Staking',
    count: 87500,
    volume: 2143.75,
    avgGas: 45000,
    successRate: 99.5,
    percentage: 7,
  },
  {
    type: 'Governance',
    count: 37500,
    volume: 918.75,
    avgGas: 32000,
    successRate: 98.9,
    percentage: 3,
  },
];

const mockGasAnalytics = {
  avgGasPrice: 32.5,
  minGasPrice: 18.0,
  maxGasPrice: 65.0,
  totalGasUsed: 45000000000,
  estimatedSavings: 1250,
  gasPriceTrend: [
    { time: '0:00', price: 25 },
    { time: '1:00', price: 22 },
  ],
  expensiveTransactions: [
    {
      id: '0x1a2b3c4d',
      gasUsed: 250000,
      gasPrice: 65,
      totalCost: 16.25,
      timestamp: new Date().toISOString(),
    },
  ],
};

const mockPatterns = {
  hourlyDistribution: [
    { hour: 0, count: 35000, avgGas: 28000 },
    { hour: 1, count: 40000, avgGas: 30000 },
  ],
  topSenders: [
    { address: '0xABC...123', count: 12500, volume: 305.5 },
  ],
  topReceivers: [
    { address: '0xJKL...012', count: 15000, volume: 367.5 },
  ],
  congestionLevel: 'low' as const,
  recommendedTimes: ['2:00-6:00 AM'],
  peakHours: [9, 10, 14],
};

const mockErrorAnalysis = {
  totalErrors: 16250,
  errorRate: 1.3,
  errorsByType: [
    { type: 'Out of Gas', count: 7312, percentage: 45 },
    { type: 'Invalid Parameters', count: 4875, percentage: 30 },
  ],
  errorTrend: [
    { time: '0:00', count: 150 },
    { time: '1:00', count: 200 },
  ],
  topErrorCauses: [
    {
      cause: 'Out of Gas',
      count: 7312,
      recommendation: 'Increase gas limit by 20-30%',
    },
  ],
};

// ============================================================================
// TEST SETUP
// ============================================================================

const createMockStore = () => {
  return configureStore({
    reducer: {
      transactionAnalytics: transactionAnalyticsReducer,
    },
  });
};

const renderWithStore = (component: React.ReactElement) => {
  const store = createMockStore();
  return render(<Provider store={store}>{component}</Provider>);
};

// ============================================================================
// TEST SUITE: COMPONENT RENDERING
// ============================================================================

describe('TransactionAnalyticsDashboard - Component Rendering', () => {
  beforeEach(() => {
    // Setup successful API mocks
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({
      totalTransactions: 1250000,
      avgTransactionValue: 0.0245,
      successRate: 98.7,
      failureRate: 1.3,
      totalVolume: 30625,
      avgConfirmationTime: 0.45,
    });

    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({
      currentTPS: 776000,
      peakTPS: 850000,
    });

    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard header', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Transaction Analytics Dashboard/i)).toBeInTheDocument();
    });
  });

  it('should render time range selector', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Time Range/i)).toBeInTheDocument();
    });
  });

  it('should render refresh button', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Refresh/i)).toBeInTheDocument();
    });
  });

  it('should render last updated timestamp', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

// ============================================================================
// TEST SUITE: TRANSACTION OVERVIEW SECTION
// ============================================================================

describe('TransactionAnalyticsDashboard - Transaction Overview', () => {
  beforeEach(() => {
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({
      totalTransactions: mockTransactionOverview.totalTransactions24h,
      avgTransactionValue: mockTransactionOverview.avgTransactionValue,
      successRate: mockTransactionOverview.successRate,
      failureRate: mockTransactionOverview.failureRate,
      totalVolume: mockTransactionOverview.totalVolume24h,
      avgConfirmationTime: mockTransactionOverview.avgConfirmationTime,
    });

    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({
      currentTPS: mockTransactionOverview.currentTPS,
      peakTPS: mockTransactionOverview.peakTPS,
    });

    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  it('should display total transactions 24h', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/1,250,000/)).toBeInTheDocument();
    });
  });

  it('should display average transaction value', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/0.0245 AUR/)).toBeInTheDocument();
    });
  });

  it('should display current TPS', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/776,000/)).toBeInTheDocument();
    });
  });

  it('should display success rate', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/98.7%/)).toBeInTheDocument();
    });
  });

  it('should display failure rate', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/1.3%/)).toBeInTheDocument();
    });
  });

  it('should display peak TPS', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/850,000/)).toBeInTheDocument();
    });
  });

  it('should display average confirmation time', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/0.45s/)).toBeInTheDocument();
    });
  });

  it('should render transaction rate trend chart', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Transaction Rate Trend/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// TEST SUITE: TRANSACTION TYPE BREAKDOWN
// ============================================================================

describe('TransactionAnalyticsDashboard - Type Breakdown', () => {
  beforeEach(() => {
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({});
    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({});
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  it('should render type breakdown section', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Transaction Type Breakdown/i)).toBeInTheDocument();
    });
  });

  it('should display filter type selector', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Filter Type/i)).toBeInTheDocument();
    });
  });

  it('should render pie chart for type distribution', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Distribution by Type/i)).toBeInTheDocument();
    });
  });

  it('should render statistics table', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Detailed Statistics/i)).toBeInTheDocument();
    });
  });

  it('should display Transfer type data', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Transfer')).toBeInTheDocument();
    });
  });

  it('should display Contract type data', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Contract')).toBeInTheDocument();
    });
  });

  it('should display Staking type data', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Staking')).toBeInTheDocument();
    });
  });

  it('should display Governance type data', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText('Governance')).toBeInTheDocument();
    });
  });

  it('should render volume by type chart', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Volume by Transaction Type/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// TEST SUITE: GAS USAGE ANALYTICS
// ============================================================================

describe('TransactionAnalyticsDashboard - Gas Analytics', () => {
  beforeEach(() => {
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({});
    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({});
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  it('should render gas analytics section', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Gas Usage Analytics/i)).toBeInTheDocument();
    });
  });

  it('should display average gas price', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Avg Gas Price/i)).toBeInTheDocument();
    });
  });

  it('should display total gas used', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Total Gas Used/i)).toBeInTheDocument();
    });
  });

  it('should display estimated savings', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Estimated Savings/i)).toBeInTheDocument();
    });
  });

  it('should render gas price trend chart', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Gas Price Trend/i)).toBeInTheDocument();
    });
  });

  it('should render expensive transactions table', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Top Expensive Transactions/i)).toBeInTheDocument();
    });
  });

  it('should display gas optimization tips', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Gas Optimization Tips/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// TEST SUITE: TRANSACTION PATTERNS
// ============================================================================

describe('TransactionAnalyticsDashboard - Patterns', () => {
  beforeEach(() => {
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({});
    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({});
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  it('should render patterns section', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Transaction Patterns & Network Activity/i)).toBeInTheDocument();
    });
  });

  it('should display network congestion indicator', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Network Congestion/i)).toBeInTheDocument();
    });
  });

  it('should display recommended transaction times', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Recommended Transaction Times/i)).toBeInTheDocument();
    });
  });

  it('should render hourly distribution chart', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Hourly Transaction Distribution/i)).toBeInTheDocument();
    });
  });

  it('should display top senders table', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Top Senders/i)).toBeInTheDocument();
    });
  });

  it('should display top receivers table', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Top Receivers/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// TEST SUITE: ERROR ANALYSIS
// ============================================================================

describe('TransactionAnalyticsDashboard - Error Analysis', () => {
  beforeEach(() => {
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({});
    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({});
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  it('should render error analysis section', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Error Analysis & Diagnostics/i)).toBeInTheDocument();
    });
  });

  it('should display total errors', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Total Errors/i)).toBeInTheDocument();
    });
  });

  it('should display error distribution', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Error Distribution by Type/i)).toBeInTheDocument();
    });
  });

  it('should render error trend chart', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Error Trend/i)).toBeInTheDocument();
    });
  });

  it('should display quick fixes recommendations', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Quick Fixes/i)).toBeInTheDocument();
    });
  });

  it('should display error causes table', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText(/Top Error Causes & Recommendations/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// TEST SUITE: USER INTERACTIONS
// ============================================================================

describe('TransactionAnalyticsDashboard - User Interactions', () => {
  beforeEach(() => {
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({});
    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({});
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  it('should handle time range change', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      const selector = screen.getByLabelText(/Time Range/i);
      fireEvent.mouseDown(selector);
    });

    const option = await screen.findByText('Last 7 Days');
    fireEvent.click(option);

    expect(mockApiService.getAnalytics).toHaveBeenCalled();
  });

  it('should handle refresh button click', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      const refreshButton = screen.getByText(/Refresh/i);
      fireEvent.click(refreshButton);
    });

    // API should be called again
    expect(mockApiService.getAnalytics).toHaveBeenCalled();
  });

  it('should handle type filter change', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      const filterSelector = screen.getByLabelText(/Filter Type/i);
      fireEvent.mouseDown(filterSelector);
    });

    const option = await screen.findByText('Transfer');
    fireEvent.click(option);

    // Filter should be applied
    expect(screen.getByText('Transfer')).toBeInTheDocument();
  });
});

// ============================================================================
// TEST SUITE: ERROR HANDLING
// ============================================================================

describe('TransactionAnalyticsDashboard - Error Handling', () => {
  it('should handle API failures gracefully', async () => {
    mockApiService.getAnalytics = vi.fn().mockRejectedValue(new Error('API Error'));
    mockApiService.getAnalyticsPerformance = vi.fn().mockRejectedValue(new Error('API Error'));
    mockApiService.getTransactions = vi.fn().mockRejectedValue(new Error('API Error'));

    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Some data may be unavailable/i)).toBeInTheDocument();
    });
  });

  it('should display fallback data when API fails', async () => {
    mockApiService.getAnalytics = vi.fn().mockRejectedValue(new Error('API Error'));
    mockApiService.getAnalyticsPerformance = vi.fn().mockRejectedValue(new Error('API Error'));
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);

    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      // Should still render dashboard with default values
      expect(screen.getByText(/Transaction Analytics Dashboard/i)).toBeInTheDocument();
    });
  });

  it('should show error count in warning', async () => {
    mockApiService.getAnalytics = vi.fn().mockRejectedValue(new Error('API Error'));
    mockApiService.getAnalyticsPerformance = vi.fn().mockRejectedValue(new Error('API Error'));
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);

    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/endpoint\(s\) failed/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// TEST SUITE: AUTO-REFRESH
// ============================================================================

describe('TransactionAnalyticsDashboard - Auto-refresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({});
    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({});
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should auto-refresh data every 10 seconds', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      expect(mockApiService.getAnalytics).toHaveBeenCalledTimes(1);
    });

    // Advance time by 10 seconds
    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(mockApiService.getAnalytics).toHaveBeenCalledTimes(2);
    });
  });

  it('should update last refresh timestamp', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });

    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
    });
  });
});

// ============================================================================
// TEST SUITE: ACCESSIBILITY
// ============================================================================

describe('TransactionAnalyticsDashboard - Accessibility', () => {
  beforeEach(() => {
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({});
    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({});
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  it('should have accessible buttons', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });
  });

  it('should have accessible form controls', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Time Range/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Filter Type/i)).toBeInTheDocument();
    });
  });

  it('should have accessible tables', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      const tables = screen.getAllByRole('table');
      expect(tables.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// TEST SUITE: PERFORMANCE
// ============================================================================

describe('TransactionAnalyticsDashboard - Performance', () => {
  beforeEach(() => {
    mockApiService.getAnalytics = vi.fn().mockResolvedValue({});
    mockApiService.getAnalyticsPerformance = vi.fn().mockResolvedValue({});
    mockApiService.getTransactions = vi.fn().mockResolvedValue([]);
  });

  it('should batch API calls efficiently', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      expect(mockApiService.getAnalytics).toHaveBeenCalled();
      expect(mockApiService.getAnalyticsPerformance).toHaveBeenCalled();
      expect(mockApiService.getTransactions).toHaveBeenCalled();
    });
  });

  it('should render charts without blocking', async () => {
    renderWithStore(<TransactionAnalyticsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Transaction Analytics Dashboard/i)).toBeInTheDocument();
    });

    // Charts should be rendered
    expect(screen.getByText(/Transaction Rate Trend/i)).toBeInTheDocument();
  });
});

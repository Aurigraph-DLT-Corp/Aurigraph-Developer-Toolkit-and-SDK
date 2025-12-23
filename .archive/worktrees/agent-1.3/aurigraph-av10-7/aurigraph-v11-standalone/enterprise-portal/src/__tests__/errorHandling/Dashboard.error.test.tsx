import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import { apiService } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getMetrics: vi.fn(),
    getPerformance: vi.fn(),
    getSystemStatus: vi.fn(),
  },
  safeApiCall: vi.fn(async (fn, fallback) => {
    try {
      const data = await fn();
      return { data, error: null, success: true };
    } catch (error) {
      return { data: fallback, error: error as Error, success: false };
    }
  }),
}));

// Mock visualizations that might cause issues in tests
vi.mock('../../components/RealTimeTPSChart', () => ({
  RealTimeTPSChart: () => <div data-testid="tps-chart">TPS Chart</div>,
}));

vi.mock('../../components/NetworkHealthViz', () => ({
  NetworkHealthViz: () => <div data-testid="health-viz">Health Viz</div>,
}));

const DashboardWithRouter = () => (
  <BrowserRouter>
    <Dashboard />
  </BrowserRouter>
);

describe('Dashboard - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display error notification when metrics endpoint fails', async () => {
    // Mock failed metrics endpoint
    vi.mocked(apiService.getMetrics).mockRejectedValue(
      new Error('Network error: Unable to connect to /api/v11/blockchain/stats')
    );

    vi.mocked(apiService.getPerformance).mockResolvedValue({
      transactionsPerSecond: 776000,
      averageBlockTime: 500,
      networkLatency: 50,
    });

    vi.mocked(apiService.getSystemStatus).mockResolvedValue({
      consensusStatus: { state: 'LEADER' },
      cryptoStatus: { quantumCryptoEnabled: true },
      bridgeStats: { healthy: true, successRate: 99.5 },
      aiStats: { aiEnabled: true, optimizationEfficiency: 95 },
    });

    render(<DashboardWithRouter />);

    await waitFor(() => {
      expect(screen.getByText(/Some endpoints are unavailable/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Blockchain metrics endpoint failed/i)).toBeInTheDocument();
  });

  it('should display error notification when performance endpoint fails', async () => {
    vi.mocked(apiService.getMetrics).mockResolvedValue({
      transactionStats: { currentTPS: 776000, last24h: 67000000 },
      currentHeight: 1234567,
      validatorStats: { active: 121 },
      totalTransactions: 67000000,
    });

    // Mock failed performance endpoint
    vi.mocked(apiService.getPerformance).mockRejectedValue(
      new Error('HTTP 404: Endpoint not found')
    );

    vi.mocked(apiService.getSystemStatus).mockResolvedValue({
      consensusStatus: { state: 'LEADER' },
      cryptoStatus: { quantumCryptoEnabled: true },
      bridgeStats: { healthy: true, successRate: 99.5 },
      aiStats: { aiEnabled: true, optimizationEfficiency: 95 },
    });

    render(<DashboardWithRouter />);

    await waitFor(() => {
      expect(screen.getByText(/Performance data endpoint failed/i)).toBeInTheDocument();
    });
  });

  it('should display error notification when system health endpoint fails', async () => {
    vi.mocked(apiService.getMetrics).mockResolvedValue({
      transactionStats: { currentTPS: 776000, last24h: 67000000 },
      currentHeight: 1234567,
      validatorStats: { active: 121 },
      totalTransactions: 67000000,
    });

    vi.mocked(apiService.getPerformance).mockResolvedValue({
      transactionsPerSecond: 776000,
      averageBlockTime: 500,
      networkLatency: 50,
    });

    // Mock failed system health endpoint
    vi.mocked(apiService.getSystemStatus).mockRejectedValue(
      new Error('Service unavailable')
    );

    render(<DashboardWithRouter />);

    await waitFor(() => {
      expect(screen.getByText(/System health endpoint failed/i)).toBeInTheDocument();
    });
  });

  it('should handle all endpoints failing gracefully', async () => {
    // All endpoints fail
    vi.mocked(apiService.getMetrics).mockRejectedValue(new Error('Connection timeout'));
    vi.mocked(apiService.getPerformance).mockRejectedValue(new Error('Connection timeout'));
    vi.mocked(apiService.getSystemStatus).mockRejectedValue(new Error('Connection timeout'));

    render(<DashboardWithRouter />);

    await waitFor(() => {
      expect(screen.getByText(/Some endpoints are unavailable/i)).toBeInTheDocument();
    });

    // Verify multiple errors are shown
    expect(screen.getByText(/Blockchain metrics endpoint failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Performance data endpoint failed/i)).toBeInTheDocument();
    expect(screen.getByText(/System health endpoint failed/i)).toBeInTheDocument();

    // Verify retry button with count
    expect(screen.getByRole('button', { name: /Retry Failed \(3\)/i })).toBeInTheDocument();
  });

  it('should show retry button when there are errors', async () => {
    vi.mocked(apiService.getMetrics).mockRejectedValue(new Error('Error'));

    vi.mocked(apiService.getPerformance).mockResolvedValue({
      transactionsPerSecond: 776000,
      averageBlockTime: 500,
      networkLatency: 50,
    });

    vi.mocked(apiService.getSystemStatus).mockResolvedValue({
      consensusStatus: { state: 'LEADER' },
      cryptoStatus: { quantumCryptoEnabled: true },
      bridgeStats: { healthy: true, successRate: 99.5 },
      aiStats: { aiEnabled: true, optimizationEfficiency: 95 },
    });

    render(<DashboardWithRouter />);

    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /Retry Failed/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  it('should retry failed requests when retry button is clicked', async () => {
    // First call fails, second succeeds
    vi.mocked(apiService.getMetrics)
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce({
        transactionStats: { currentTPS: 776000, last24h: 67000000 },
        currentHeight: 1234567,
        validatorStats: { active: 121 },
        totalTransactions: 67000000,
      });

    vi.mocked(apiService.getPerformance).mockResolvedValue({
      transactionsPerSecond: 776000,
      averageBlockTime: 500,
      networkLatency: 50,
    });

    vi.mocked(apiService.getSystemStatus).mockResolvedValue({
      consensusStatus: { state: 'LEADER' },
      cryptoStatus: { quantumCryptoEnabled: true },
      bridgeStats: { healthy: true, successRate: 99.5 },
      aiStats: { aiEnabled: true, optimizationEfficiency: 95 },
    });

    render(<DashboardWithRouter />);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/Blockchain metrics endpoint failed/i)).toBeInTheDocument();
    });

    // Click retry
    const user = userEvent.setup();
    const retryButton = screen.getByRole('button', { name: /Retry Failed/i });
    await user.click(retryButton);

    // Wait for error to disappear
    await waitFor(() => {
      expect(screen.queryByText(/Blockchain metrics endpoint failed/i)).not.toBeInTheDocument();
    });
  });

  it('should display partial data when only some endpoints fail', async () => {
    // Metrics succeeds
    vi.mocked(apiService.getMetrics).mockResolvedValue({
      transactionStats: { currentTPS: 776000, last24h: 67000000 },
      currentHeight: 1234567,
      validatorStats: { active: 121 },
      totalTransactions: 67000000,
    });

    // Performance fails
    vi.mocked(apiService.getPerformance).mockRejectedValue(new Error('Failed'));

    // System health succeeds
    vi.mocked(apiService.getSystemStatus).mockResolvedValue({
      consensusStatus: { state: 'LEADER' },
      cryptoStatus: { quantumCryptoEnabled: true },
      bridgeStats: { healthy: true, successRate: 99.5 },
      aiStats: { aiEnabled: true, optimizationEfficiency: 95 },
    });

    render(<DashboardWithRouter />);

    await waitFor(() => {
      // Metrics data should be visible
      expect(screen.getByText(/776K/i)).toBeInTheDocument(); // TPS metric
    });

    // Error notification should be visible
    expect(screen.getByText(/Performance data endpoint failed/i)).toBeInTheDocument();
  });

  it('should show warning about limited functionality when endpoints fail', async () => {
    vi.mocked(apiService.getMetrics).mockRejectedValue(new Error('Error'));
    vi.mocked(apiService.getPerformance).mockResolvedValue({
      transactionsPerSecond: 776000,
      averageBlockTime: 500,
      networkLatency: 50,
    });
    vi.mocked(apiService.getSystemStatus).mockResolvedValue({
      consensusStatus: { state: 'LEADER' },
      cryptoStatus: { quantumCryptoEnabled: true },
      bridgeStats: { healthy: true, successRate: 99.5 },
      aiStats: { aiEnabled: true, optimizationEfficiency: 95 },
    });

    render(<DashboardWithRouter />);

    await waitFor(() => {
      expect(
        screen.getByText(/Dashboard is showing partial data. Some features may be limited./i)
      ).toBeInTheDocument();
    });
  });
});

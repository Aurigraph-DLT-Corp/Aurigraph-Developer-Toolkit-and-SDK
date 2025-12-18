import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MLPerformanceDashboard from '../../pages/dashboards/MLPerformanceDashboard';
import { apiService } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getMLMetrics: vi.fn(),
    getMLPredictions: vi.fn(),
    getMLPerformance: vi.fn(),
    getMLConfidence: vi.fn(),
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

describe('MLPerformanceDashboard - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display error notification when ML Performance endpoint fails', async () => {
    // Mock successful responses for most endpoints
    vi.mocked(apiService.getMLMetrics).mockResolvedValue({
      mlShardSelections: 1000,
      mlShardFallbacks: 10,
      mlShardSuccessRate: 99,
      avgShardConfidence: 0.95,
      avgShardLatencyMs: 5,
      mlOrderingCalls: 800,
      mlOrderingFallbacks: 5,
      mlOrderingSuccessRate: 99.4,
      totalOrderedTransactions: 50000,
      avgOrderingLatencyMs: 3,
    });

    vi.mocked(apiService.getMLPredictions).mockResolvedValue({
      nextDayTpsForecast: 850000,
      weeklyGrowthRate: 5.2,
      monthlyVolumePrediction: 2500000000,
      anomalyScore: 0.15,
    });

    vi.mocked(apiService.getMLConfidence).mockResolvedValue({
      avgShardConfidence: 0.95,
      overallHealth: 'EXCELLENT',
      anomaliesDetected: 2,
    });

    // Mock failed response for ML Performance
    vi.mocked(apiService.getMLPerformance).mockRejectedValue(
      new Error('Network error: Unable to connect to /api/v12/ai/performance')
    );

    render(<MLPerformanceDashboard />);

    // Wait for error notification to appear
    await waitFor(() => {
      expect(screen.getByText(/Some endpoints are unavailable/i)).toBeInTheDocument();
    });

    // Verify specific error message
    expect(screen.getByText(/ML Performance endpoint failed/i)).toBeInTheDocument();

    // Verify fallback data is shown
    expect(screen.getByText(/Data Unavailable/i)).toBeInTheDocument();
  });

  it('should display error notification when ML Confidence endpoint fails', async () => {
    vi.mocked(apiService.getMLMetrics).mockResolvedValue({
      mlShardSelections: 1000,
      mlShardFallbacks: 10,
      mlShardSuccessRate: 99,
      avgShardConfidence: 0.95,
      avgShardLatencyMs: 5,
      mlOrderingCalls: 800,
      mlOrderingFallbacks: 5,
      mlOrderingSuccessRate: 99.4,
      totalOrderedTransactions: 50000,
      avgOrderingLatencyMs: 3,
    });

    vi.mocked(apiService.getMLPredictions).mockResolvedValue({
      nextDayTpsForecast: 850000,
      weeklyGrowthRate: 5.2,
      monthlyVolumePrediction: 2500000000,
      anomalyScore: 0.15,
    });

    vi.mocked(apiService.getMLPerformance).mockResolvedValue({
      baselineTPS: 700000,
      mlOptimizedTPS: 776000,
      performanceGainPercent: 10.9,
      mlShardSuccessRate: 99,
      avgShardLatencyMs: 5,
      mlOrderingSuccessRate: 99.4,
      avgOrderingLatencyMs: 3,
    });

    // Mock failed response for ML Confidence
    vi.mocked(apiService.getMLConfidence).mockRejectedValue(
      new Error('HTTP 404: Endpoint not found')
    );

    render(<MLPerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/ML Confidence endpoint failed/i)).toBeInTheDocument();
    });

    // Verify ML System Health shows unavailable
    expect(screen.getByText(/ML System Health: Data Unavailable/i)).toBeInTheDocument();
  });

  it('should handle multiple endpoint failures gracefully', async () => {
    // All endpoints fail
    vi.mocked(apiService.getMLMetrics).mockRejectedValue(new Error('Connection timeout'));
    vi.mocked(apiService.getMLPredictions).mockRejectedValue(new Error('Connection timeout'));
    vi.mocked(apiService.getMLPerformance).mockRejectedValue(new Error('Connection timeout'));
    vi.mocked(apiService.getMLConfidence).mockRejectedValue(new Error('Connection timeout'));

    render(<MLPerformanceDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Some endpoints are unavailable/i)).toBeInTheDocument();
    });

    // Verify all error messages appear
    expect(screen.getByText(/ML Metrics endpoint failed/i)).toBeInTheDocument();
    expect(screen.getByText(/ML Predictions endpoint failed/i)).toBeInTheDocument();
    expect(screen.getByText(/ML Performance endpoint failed/i)).toBeInTheDocument();
    expect(screen.getByText(/ML Confidence endpoint failed/i)).toBeInTheDocument();

    // Verify retry button exists
    expect(screen.getByRole('button', { name: /Retry Failed Requests/i })).toBeInTheDocument();
  });

  it('should retry failed requests when retry button is clicked', async () => {
    // First call fails
    vi.mocked(apiService.getMLPerformance)
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce({
        baselineTPS: 700000,
        mlOptimizedTPS: 776000,
        performanceGainPercent: 10.9,
        mlShardSuccessRate: 99,
        avgShardLatencyMs: 5,
        mlOrderingSuccessRate: 99.4,
        avgOrderingLatencyMs: 3,
      });

    vi.mocked(apiService.getMLMetrics).mockResolvedValue({
      mlShardSelections: 1000,
      mlShardFallbacks: 10,
      mlShardSuccessRate: 99,
      avgShardConfidence: 0.95,
      avgShardLatencyMs: 5,
      mlOrderingCalls: 800,
      mlOrderingFallbacks: 5,
      mlOrderingSuccessRate: 99.4,
      totalOrderedTransactions: 50000,
      avgOrderingLatencyMs: 3,
    });

    vi.mocked(apiService.getMLPredictions).mockResolvedValue({
      nextDayTpsForecast: 850000,
      weeklyGrowthRate: 5.2,
      monthlyVolumePrediction: 2500000000,
      anomalyScore: 0.15,
    });

    vi.mocked(apiService.getMLConfidence).mockResolvedValue({
      avgShardConfidence: 0.95,
      overallHealth: 'EXCELLENT',
      anomaliesDetected: 2,
    });

    render(<MLPerformanceDashboard />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/ML Performance endpoint failed/i)).toBeInTheDocument();
    });

    // Click retry button
    const user = userEvent.setup();
    const retryButton = screen.getByRole('button', { name: /Retry Failed Requests/i });
    await user.click(retryButton);

    // Verify error is cleared after successful retry
    await waitFor(() => {
      expect(screen.queryByText(/ML Performance endpoint failed/i)).not.toBeInTheDocument();
    });
  });

  it('should show fallback data when endpoint fails', async () => {
    vi.mocked(apiService.getMLMetrics).mockResolvedValue({
      mlShardSelections: 1000,
      mlShardFallbacks: 10,
      mlShardSuccessRate: 99,
      avgShardConfidence: 0.95,
      avgShardLatencyMs: 5,
      mlOrderingCalls: 800,
      mlOrderingFallbacks: 5,
      mlOrderingSuccessRate: 99.4,
      totalOrderedTransactions: 50000,
      avgOrderingLatencyMs: 3,
    });

    // ML Predictions fails
    vi.mocked(apiService.getMLPredictions).mockRejectedValue(new Error('Service unavailable'));

    vi.mocked(apiService.getMLPerformance).mockResolvedValue({
      baselineTPS: 700000,
      mlOptimizedTPS: 776000,
      performanceGainPercent: 10.9,
      mlShardSuccessRate: 99,
      avgShardLatencyMs: 5,
      mlOrderingSuccessRate: 99.4,
      avgOrderingLatencyMs: 3,
    });

    vi.mocked(apiService.getMLConfidence).mockResolvedValue({
      avgShardConfidence: 0.95,
      overallHealth: 'EXCELLENT',
      anomaliesDetected: 2,
    });

    render(<MLPerformanceDashboard />);

    await waitFor(() => {
      // Verify "Data Unavailable" appears in prediction cards
      const unavailableTexts = screen.getAllByText(/Data Unavailable/i);
      expect(unavailableTexts.length).toBeGreaterThan(0);
    });

    // Verify fallback message appears (using getAllByText since multiple cards show this)
    const endpointMessages = screen.getAllByText(/Endpoint not responding/i);
    expect(endpointMessages.length).toBeGreaterThan(0);
  });

  it('should continue to show available data when some endpoints fail', async () => {
    // Only ML Performance succeeds
    vi.mocked(apiService.getMLPerformance).mockResolvedValue({
      baselineTPS: 700000,
      mlOptimizedTPS: 776000,
      performanceGainPercent: 10.9,
      mlShardSuccessRate: 99,
      avgShardLatencyMs: 5,
      mlOrderingSuccessRate: 99.4,
      avgOrderingLatencyMs: 3,
    });

    // Others fail
    vi.mocked(apiService.getMLMetrics).mockRejectedValue(new Error('Failed'));
    vi.mocked(apiService.getMLPredictions).mockRejectedValue(new Error('Failed'));
    vi.mocked(apiService.getMLConfidence).mockRejectedValue(new Error('Failed'));

    render(<MLPerformanceDashboard />);

    await waitFor(() => {
      // Verify performance gain is still shown (from successful endpoint)
      expect(screen.getByText(/\+10\.9%/i)).toBeInTheDocument();
    });

    // Verify error notification exists
    expect(screen.getByText(/Some endpoints are unavailable/i)).toBeInTheDocument();
  });
});

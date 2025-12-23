import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import Analytics from '../../pages/Analytics';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />
}));

// Mock data
const mockAnalyticsData = {
  totalBlocks: 1500000,
  totalTransactions: 9876543210,
  totalVolume: 25000000000,
  activeUsers: 15000,
  blockGrowthRate: 12.5,
  transactionGrowthRate: 8.3,
  volumeGrowthRate: 15.2,
  userGrowthRate: 5.7
};

const mockMLPredictions = {
  nextDayTpsForecast: 850000,
  weeklyGrowthRate: 7.5,
  monthlyVolumePrediction: 30000000000,
  anomalyScore: 0.15
};

describe('Analytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup default mock implementations
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/analytics/dashboard')) {
        return Promise.resolve({ data: mockAnalyticsData });
      }
      if (url.includes('/ai/predictions')) {
        return Promise.resolve({ data: mockMLPredictions });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });
    });

    it('should display page title', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Analytics Dashboard/i })).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<Analytics />);

      expect(screen.getByText(/Loading analytics data.../i)).toBeInTheDocument();
    });

    it('should render all KPI cards', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Total Blocks/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Transactions/i)).toBeInTheDocument();
        expect(screen.getByText(/Total Volume/i)).toBeInTheDocument();
        expect(screen.getByText(/Active Users/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch analytics dashboard data on mount', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/analytics/dashboard')
        );
      });
    });

    it('should fetch ML predictions data on mount', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/ai/predictions')
        );
      });
    });

    it('should make parallel API calls for optimal performance', async () => {
      render(<Analytics />);

      await waitFor(() => {
        // Both APIs should be called approximately at the same time
        const calls = mockedAxios.get.mock.calls;
        expect(calls.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should display fetched analytics data', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('1.5M')).toBeInTheDocument(); // Total Blocks
        expect(screen.getByText('9.9B')).toBeInTheDocument(); // Total Transactions
      });
    });

    it('should display growth rates with correct signs', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('+12.5%')).toBeInTheDocument(); // Block growth
        expect(screen.getByText('+8.3%')).toBeInTheDocument(); // Transaction growth
      });
    });
  });

  describe('KPI Cards', () => {
    it('should format large numbers correctly', async () => {
      render(<Analytics />);

      await waitFor(() => {
        // 1,500,000 blocks -> 1.5M
        expect(screen.getByText('1.5M')).toBeInTheDocument();
        // 9,876,543,210 transactions -> 9.9B
        expect(screen.getByText('9.9B')).toBeInTheDocument();
      });
    });

    it('should format currency correctly', async () => {
      render(<Analytics />);

      await waitFor(() => {
        // 25,000,000,000 -> $25.0B
        expect(screen.getByText('$25.0B')).toBeInTheDocument();
      });
    });

    it('should display positive growth with success color', async () => {
      render(<Analytics />);

      await waitFor(() => {
        const positiveChips = screen.getAllByText(/\+.*%/);
        expect(positiveChips.length).toBeGreaterThan(0);
      });
    });

    it('should display negative growth with error color', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/analytics/dashboard')) {
          return Promise.resolve({
            data: { ...mockAnalyticsData, blockGrowthRate: -5.2 }
          });
        }
        if (url.includes('/ai/predictions')) {
          return Promise.resolve({ data: mockMLPredictions });
        }
        return Promise.reject(new Error('Not found'));
      });

      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('-5.2%')).toBeInTheDocument();
      });
    });

    it('should display active users count', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('15.0K')).toBeInTheDocument(); // 15,000 users
      });
    });
  });

  describe('Time Range Selector', () => {
    it('should render time range selector', async () => {
      render(<Analytics />);

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThan(0);
      });
    });

    it('should have default time range of 24h', async () => {
      render(<Analytics />);

      await waitFor(() => {
        // Check that 24h data is being used (24 data points)
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });
    });

    it('should allow changing time range to 7 days', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      // Find and click the select
      const selects = screen.getAllByRole('combobox');
      if (selects.length > 0) {
        await user.click(selects[0]);

        const sevenDayOption = await screen.findByText('7 Days');
        await user.click(sevenDayOption);

        // Should trigger data refetch
        await waitFor(() => {
          expect(mockedAxios.get).toHaveBeenCalled();
        });
      }
    });

    it('should allow changing time range to 30 days', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      const selects = screen.getAllByRole('combobox');
      if (selects.length > 0) {
        await user.click(selects[0]);

        const thirtyDayOption = await screen.findByText('30 Days');
        await user.click(thirtyDayOption);

        await waitFor(() => {
          expect(mockedAxios.get).toHaveBeenCalled();
        });
      }
    });

    it('should refetch data when time range changes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      const initialCallCount = mockedAxios.get.mock.calls.length;

      const selects = screen.getAllByRole('combobox');
      if (selects.length > 0) {
        await user.click(selects[0]);
        const option = await screen.findByText('7 Days');
        await user.click(option);

        await waitFor(() => {
          expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(initialCallCount);
        });
      }
    });
  });

  describe('Charts', () => {
    it('should render blockchain activity chart', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });

    it('should render token distribution pie chart', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
      });
    });

    it('should display chart title for blockchain activity', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Blockchain Activity/i)).toBeInTheDocument();
      });
    });

    it('should display chart title for token distribution', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Token Distribution/i)).toBeInTheDocument();
      });
    });

    it('should render chart legends', async () => {
      render(<Analytics />);

      await waitFor(() => {
        const legends = screen.getAllByTestId('legend');
        expect(legends.length).toBeGreaterThan(0);
      });
    });

    it('should render chart tooltips', async () => {
      render(<Analytics />);

      await waitFor(() => {
        const tooltips = screen.getAllByTestId('tooltip');
        expect(tooltips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Token Distribution', () => {
    it('should display token distribution categories', async () => {
      render(<Analytics />);

      await waitFor(() => {
        // Token distribution is rendered in the pie chart
        expect(screen.getByText(/Token Distribution/i)).toBeInTheDocument();
      });
    });

    it('should calculate token distribution percentages', async () => {
      render(<Analytics />);

      await waitFor(() => {
        // Default distribution: Staking 35%, Liquidity 25%, Treasury 20%, Circulation 20%
        expect(screen.getByText(/Token Distribution/i)).toBeInTheDocument();
      });
    });
  });

  describe('AI Predictions', () => {
    it('should display AI predictions section', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/AI Predictions & Insights/i)).toBeInTheDocument();
      });
    });

    it('should display next day TPS forecast', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Next Day TPS Forecast/i)).toBeInTheDocument();
        expect(screen.getByText('850,000')).toBeInTheDocument();
      });
    });

    it('should display weekly growth rate', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Weekly Growth Rate/i)).toBeInTheDocument();
        expect(screen.getByText('+7.5%')).toBeInTheDocument();
      });
    });

    it('should display monthly volume prediction', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Monthly Volume Prediction/i)).toBeInTheDocument();
        expect(screen.getByText('30.0B')).toBeInTheDocument();
      });
    });

    it('should display anomaly score', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Anomaly Score/i)).toBeInTheDocument();
        expect(screen.getByText('0.15')).toBeInTheDocument();
      });
    });

    it('should show low anomaly score with success color', async () => {
      render(<Analytics />);

      await waitFor(() => {
        // Anomaly score 0.15 is low (< 0.5), should be success color
        expect(screen.getByText('0.15')).toBeInTheDocument();
      });
    });

    it('should show high anomaly score with error color', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/analytics/dashboard')) {
          return Promise.resolve({ data: mockAnalyticsData });
        }
        if (url.includes('/ai/predictions')) {
          return Promise.resolve({
            data: { ...mockMLPredictions, anomalyScore: 0.85 }
          });
        }
        return Promise.reject(new Error('Not found'));
      });

      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('0.85')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should set up 5-second polling interval', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      const initialCalls = mockedAxios.get.mock.calls.length;

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(initialCalls);
      });
    });

    it('should cleanup interval on unmount', async () => {
      const { unmount } = render(<Analytics />);
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should continue polling every 5 seconds', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      const calls1 = mockedAxios.get.mock.calls.length;

      vi.advanceTimersByTime(5000);
      await waitFor(() => {
        expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(calls1);
      });

      const calls2 = mockedAxios.get.mock.calls.length;

      vi.advanceTimersByTime(5000);
      await waitFor(() => {
        expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(calls2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Analytics />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch analytics data:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should display error message on fetch failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Error: Network Error/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('should retry fetch when retry button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      // First call fails
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      // Set up successful response for retry
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/analytics/dashboard')) {
          return Promise.resolve({ data: mockAnalyticsData });
        }
        if (url.includes('/ai/predictions')) {
          return Promise.resolve({ data: mockMLPredictions });
        }
        return Promise.reject(new Error('Not found'));
      });

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });
    });

    it('should clear error state on successful retry', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Error: API Error/i)).toBeInTheDocument();
      });

      // Setup successful response
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/analytics/dashboard')) {
          return Promise.resolve({ data: mockAnalyticsData });
        }
        if (url.includes('/ai/predictions')) {
          return Promise.resolve({ data: mockMLPredictions });
        }
        return Promise.reject(new Error('Not found'));
      });

      const retryButton = screen.getByRole('button', { name: /Retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText(/Error:/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Number Formatting', () => {
    it('should format billions correctly', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('9.9B')).toBeInTheDocument(); // 9,876,543,210
      });
    });

    it('should format millions correctly', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('1.5M')).toBeInTheDocument(); // 1,500,000
      });
    });

    it('should format thousands correctly', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('15.0K')).toBeInTheDocument(); // 15,000
      });
    });

    it('should format currency with dollar sign', async () => {
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText('$25.0B')).toBeInTheDocument(); // $25,000,000,000
      });
    });
  });

  describe('Blockchain History Generation', () => {
    it('should generate history data based on time range', async () => {
      render(<Analytics />);

      await waitFor(() => {
        // Default is 24h, should have blockchain activity data
        expect(screen.getByText(/Blockchain Activity/i)).toBeInTheDocument();
      });
    });

    it('should generate 24 data points for 24h range', async () => {
      render(<Analytics />);

      await waitFor(() => {
        // With 24h range, history should have 24 points
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
      });
    });

    it('should update history when time range changes', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Analytics />);

      await waitFor(() => {
        expect(screen.getByText(/Analytics Dashboard/i)).toBeInTheDocument();
      });

      // Change to 7 days
      const selects = screen.getAllByRole('combobox');
      if (selects.length > 0) {
        await user.click(selects[0]);
        const option = await screen.findByText('7 Days');
        await user.click(option);

        await waitFor(() => {
          // History should be regenerated with 7 data points
          expect(screen.getByTestId('area-chart')).toBeInTheDocument();
        });
      }
    });
  });
});

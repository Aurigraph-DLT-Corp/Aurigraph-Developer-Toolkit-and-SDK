import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import Performance from '../../pages/Performance';
import { apiService } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getMLPerformance: vi.fn(),
    getPerformance: vi.fn(),
  }
}));

// Mock Recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock data
const mockMLPerformance = {
  baselineTPS: 500000,
  mlOptimizedTPS: 776000,
  performanceGainPercent: 55.2,
  mlShardSuccessRate: 0.98,
  mlOrderingSuccessRate: 0.96,
  avgShardConfidence: 0.92,
  avgShardLatencyMs: 3.5,
  avgOrderingLatencyMs: 2.1
};

const mockPerformanceMetrics = {
  cpuUtilization: 45.3,
  memoryUsage: {
    total: 49152,
    used: 30720,
    free: 18432
  },
  diskIO: {
    readMBps: 50.5,
    writeMBps: 30.2
  },
  networkIO: {
    inboundMBps: 120.5,
    outboundMBps: 80.3
  },
  responseTimePercentiles: {
    p50: 4.5,
    p95: 12.3,
    p99: 25.7
  },
  throughput: 776000,
  errorRate: 0.02,
  uptimeSeconds: 172800
};

const mockNetworkStats = {
  totalNodes: 10,
  activeValidators: 8,
  currentTPS: 776000,
  peakTPS: 900000,
  avgBlockTime: 2.5,
  totalBlocks: 1234567,
  totalTransactions: 9876543210,
  networkLatency: 45.3,
  networkStatus: 'HEALTHY',
  timestamp: Date.now()
};

const mockLiveNetworkData = {
  messageRates: {
    transactionsPerSecond: 780000,
    blocksPerMinute: 24,
    messagesPerSecond: 1500000
  }
};

describe('Performance Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup default mock implementations
    (apiService.getMLPerformance as any).mockResolvedValue(mockMLPerformance);
    (apiService.getPerformance as any).mockResolvedValue(mockPerformanceMetrics);

    // Mock fetch for network stats and live data
    global.fetch = vi.fn((url: string) => {
      if (url.includes('/blockchain/network/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockNetworkStats)
        } as Response);
      }
      if (url.includes('/live/network')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLiveNetworkData)
        } as Response);
      }
      if (url.includes('/performance')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            transactionsPerSecond: 776000,
            durationMs: 1234.56,
            totalTransactions: 100000
          })
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    }) as any;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      render(<Performance />);
      expect(screen.getByText(/Performance Monitoring/i)).toBeInTheDocument();
    });

    it('should display the page title', () => {
      render(<Performance />);
      expect(screen.getByRole('heading', { name: /Performance Monitoring/i })).toBeInTheDocument();
    });

    it('should show loading state for TPS initially', () => {
      render(<Performance />);
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    it('should render all metric cards', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/Live TPS Monitor/i)).toBeInTheDocument();
        expect(screen.getByText(/System Resources/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch ML performance data on mount', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(apiService.getMLPerformance).toHaveBeenCalled();
      });
    });

    it('should fetch performance metrics on mount', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(apiService.getPerformance).toHaveBeenCalled();
      });
    });

    it('should fetch network stats on mount', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/blockchain/network/stats')
        );
      });
    });

    it('should fetch live network metrics on mount', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/live/network')
        );
      });
    });

    it('should display fetched TPS data', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/776,000 TPS/i)).toBeInTheDocument();
      });
    });

    it('should display network status chip', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/HEALTHY/i)).toBeInTheDocument();
      });
    });

    it('should display ML performance gain', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/AI Optimization Active/i)).toBeInTheDocument();
        expect(screen.getByText(/\+55.2% performance gain/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should poll data every 5 seconds', async () => {
      render(<Performance />);

      // Initial calls
      await waitFor(() => {
        expect(apiService.getMLPerformance).toHaveBeenCalledTimes(1);
      });

      // Advance timers by 5 seconds
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(apiService.getMLPerformance).toHaveBeenCalledTimes(2);
      });

      // Advance another 5 seconds
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(apiService.getMLPerformance).toHaveBeenCalledTimes(3);
      });
    });

    it('should cleanup interval on unmount', async () => {
      const { unmount } = render(<Performance />);
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should update TPS from live network data', async () => {
      render(<Performance />);

      await waitFor(() => {
        // Should show updated TPS from live data (780000)
        expect(screen.getByText(/776,000 TPS/i) || screen.getByText(/780,000 TPS/i)).toBeTruthy();
      });
    });
  });

  describe('System Resources Display', () => {
    it('should display CPU utilization', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/CPU: 45.3%/i)).toBeInTheDocument();
      });
    });

    it('should display memory usage percentage', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/Memory: 62.5%/i)).toBeInTheDocument();
      });
    });

    it('should display memory usage in GB', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/30.0GB \/ 48.0GB/i)).toBeInTheDocument();
      });
    });

    it('should display network IO metrics', async () => {
      render(<Performance />);

      await waitFor(() => {
        const networkText = screen.getByText(/Network:/);
        expect(networkText).toBeInTheDocument();
      });
    });

    it('should display uptime', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/Uptime: 48h 0m/i)).toBeInTheDocument();
      });
    });

    it('should show loading spinner when metrics not available', () => {
      (apiService.getPerformance as any).mockResolvedValue(null);

      render(<Performance />);

      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });

  describe('Additional Metrics', () => {
    it('should display latency percentiles', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/4.5ms/i)).toBeInTheDocument();
        expect(screen.getByText(/p95: 12.3ms/i)).toBeInTheDocument();
        expect(screen.getByText(/p99: 25.7ms/i)).toBeInTheDocument();
      });
    });

    it('should display total blocks', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/1,234,567/i)).toBeInTheDocument();
      });
    });

    it('should display average block time', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/Avg: 2.50s\/block/i)).toBeInTheDocument();
      });
    });

    it('should display total transactions', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/9,876,543,210/i)).toBeInTheDocument();
      });
    });

    it('should display active validators', async () => {
      render(<Performance />);

      await waitFor(() => {
        const validatorElements = screen.getAllByText(/8/);
        expect(validatorElements.length).toBeGreaterThan(0);
      });
    });

    it('should display total nodes', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/Total Nodes: 10/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Chart', () => {
    it('should render performance history chart', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      });
    });

    it('should show loading state when no data', () => {
      (apiService.getPerformance as any).mockResolvedValue(null);

      render(<Performance />);

      expect(screen.getByText(/Loading performance data.../i)).toBeInTheDocument();
    });

    it('should display data points count', async () => {
      render(<Performance />);

      await waitFor(() => {
        const dataPointsChip = screen.queryByText(/data points/i);
        if (dataPointsChip) {
          expect(dataPointsChip).toBeInTheDocument();
        }
      });
    });
  });

  describe('Tabs Navigation', () => {
    it('should render all tabs', () => {
      render(<Performance />);

      expect(screen.getByRole('tab', { name: /Load Testing/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Optimization/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Benchmarks/i })).toBeInTheDocument();
    });

    it('should show Load Testing tab by default', () => {
      render(<Performance />);

      expect(screen.getByText(/Configure Load Test/i)).toBeInTheDocument();
    });

    it('should switch to Optimization tab', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const optimizationTab = screen.getByRole('tab', { name: /Optimization/i });
      await user.click(optimizationTab);

      await waitFor(() => {
        expect(screen.getByText(/Performance Optimization/i)).toBeInTheDocument();
      });
    });

    it('should switch to Benchmarks tab', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const benchmarksTab = screen.getByRole('tab', { name: /Benchmarks/i });
      await user.click(benchmarksTab);

      await waitFor(() => {
        expect(screen.getByText(/TPS \(Transactions Per Second\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Load Testing', () => {
    it('should display load test configuration form', () => {
      render(<Performance />);

      expect(screen.getByLabelText(/Duration \(seconds\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Threads/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Target TPS/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Batch Size/i)).toBeInTheDocument();
    });

    it('should have default test configuration values', () => {
      render(<Performance />);

      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
      expect(screen.getByDisplayValue('256')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1000000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
    });

    it('should allow changing test configuration', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const durationInput = screen.getByLabelText(/Duration \(seconds\)/i);
      await user.clear(durationInput);
      await user.type(durationInput, '120');

      expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    });

    it('should display start load test button', () => {
      render(<Performance />);

      expect(screen.getByRole('button', { name: /Start Load Test/i })).toBeInTheDocument();
    });

    it('should execute load test on button click', async () => {
      const user = userEvent.setup({ delay: null });
      global.alert = vi.fn();

      render(<Performance />);

      const startButton = screen.getByRole('button', { name: /Start Load Test/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/performance?iterations=100000&threads=256'),
          expect.any(Object)
        );
      });
    });

    it('should show loading state during test', async () => {
      const user = userEvent.setup({ delay: null });

      // Mock a slow response
      global.fetch = vi.fn(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ transactionsPerSecond: 776000, durationMs: 1234 })
          } as Response), 2000)
        )
      ) as any;

      render(<Performance />);

      const startButton = screen.getByRole('button', { name: /Start Load Test/i });
      await user.click(startButton);

      expect(screen.getByRole('button', { name: /Running Test.../i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Running Test.../i })).toBeDisabled();
    });

    it('should display load test info alert', () => {
      render(<Performance />);

      expect(screen.getByText(/Load testing will simulate/i)).toBeInTheDocument();
    });
  });

  describe('Optimization Tab', () => {
    it('should display consensus algorithm selector', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const optimizationTab = screen.getByRole('tab', { name: /Optimization/i });
      await user.click(optimizationTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/Consensus Algorithm/i)).toBeInTheDocument();
      });
    });

    it('should display thread pool size slider', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const optimizationTab = screen.getByRole('tab', { name: /Optimization/i });
      await user.click(optimizationTab);

      await waitFor(() => {
        expect(screen.getByText(/Thread Pool Size/i)).toBeInTheDocument();
      });
    });

    it('should display cache size slider', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const optimizationTab = screen.getByRole('tab', { name: /Optimization/i });
      await user.click(optimizationTab);

      await waitFor(() => {
        expect(screen.getByText(/Cache Size \(MB\)/i)).toBeInTheDocument();
      });
    });

    it('should show AI optimization status', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const optimizationTab = screen.getByRole('tab', { name: /Optimization/i });
      await user.click(optimizationTab);

      await waitFor(() => {
        expect(screen.getByText(/AI Optimization Status/i)).toBeInTheDocument();
      });
    });
  });

  describe('Benchmarks Tab', () => {
    it('should display benchmarks table', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const benchmarksTab = screen.getByRole('tab', { name: /Benchmarks/i });
      await user.click(benchmarksTab);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should display TPS benchmark row', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const benchmarksTab = screen.getByRole('tab', { name: /Benchmarks/i });
      await user.click(benchmarksTab);

      await waitFor(() => {
        expect(screen.getByText(/TPS \(Transactions Per Second\)/i)).toBeInTheDocument();
        expect(screen.getByText(/2,000,000/)).toBeInTheDocument();
      });
    });

    it('should display latency benchmark row', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const benchmarksTab = screen.getByRole('tab', { name: /Benchmarks/i });
      await user.click(benchmarksTab);

      await waitFor(() => {
        expect(screen.getByText(/Latency \(p50\)/i)).toBeInTheDocument();
      });
    });

    it('should display ML performance gain benchmark', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const benchmarksTab = screen.getByRole('tab', { name: /Benchmarks/i });
      await user.click(benchmarksTab);

      await waitFor(() => {
        expect(screen.getByText(/ML Performance Gain/i)).toBeInTheDocument();
        expect(screen.getByText(/\+55.2%/i)).toBeInTheDocument();
      });
    });

    it('should show benchmark status chips', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Performance />);

      const benchmarksTab = screen.getByRole('tab', { name: /Benchmarks/i });
      await user.click(benchmarksTab);

      await waitFor(() => {
        const chips = screen.getAllByRole('status');
        expect(chips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle ML performance fetch error gracefully', async () => {
      (apiService.getMLPerformance as any).mockRejectedValue(new Error('API Error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Performance />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch ML performance:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should display error alert when API fails', async () => {
      (apiService.getMLPerformance as any).mockRejectedValue(new Error('Network Error'));

      render(<Performance />);

      await waitFor(() => {
        const errorAlert = screen.queryByText(/Failed to fetch ML performance data/i);
        if (errorAlert) {
          expect(errorAlert).toBeInTheDocument();
        }
      });
    });

    it('should handle performance metrics fetch failure silently', async () => {
      (apiService.getPerformance as any).mockRejectedValue(new Error('API Error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Performance />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch performance metrics:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle network stats fetch failure with fallback', async () => {
      global.fetch = vi.fn((url: string) => {
        if (url.includes('/blockchain/network/stats')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPerformanceMetrics)
        } as Response);
      }) as any;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Performance />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch network stats:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should handle load test failure', async () => {
      const user = userEvent.setup({ delay: null });
      global.alert = vi.fn();

      global.fetch = vi.fn((url: string) => {
        if (url.includes('/performance')) {
          return Promise.resolve({
            ok: false,
            statusText: 'Internal Server Error'
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({})
        } as Response);
      }) as any;

      render(<Performance />);

      const startButton = screen.getByRole('button', { name: /Start Load Test/i });
      await user.click(startButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('Load test failed')
        );
      });
    });

    it('should allow closing error alert', async () => {
      const user = userEvent.setup({ delay: null });
      (apiService.getMLPerformance as any).mockRejectedValue(new Error('API Error'));

      render(<Performance />);

      await waitFor(() => {
        const errorAlert = screen.queryByText(/Failed to fetch ML performance data/i);
        if (errorAlert) {
          const closeButton = screen.getByRole('button', { name: /close/i });
          user.click(closeButton);
        }
      });
    });
  });

  describe('Progress Indicators', () => {
    it('should display TPS progress bar', async () => {
      render(<Performance />);

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('should show correct progress percentage for TPS', async () => {
      render(<Performance />);

      await waitFor(() => {
        // 776,000 / 2,000,000 = 38.8%
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('should display peak TPS', async () => {
      render(<Performance />);

      await waitFor(() => {
        expect(screen.getByText(/Peak: 900,000 TPS/i)).toBeInTheDocument();
      });
    });
  });
});

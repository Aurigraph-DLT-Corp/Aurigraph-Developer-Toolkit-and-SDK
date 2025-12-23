import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import BlockchainOperations from '../../../pages/dashboards/BlockchainOperations';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Recharts
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock data
const mockNetworkStats = {
  totalNodes: 25,
  activeValidators: 22,
  currentTPS: 776543,
  networkHashRate: '15.5 PH/s',
  averageBlockTime: 2500, // 2.5 seconds in ms
  totalBlocks: 1234567,
  totalTransactions: 9876543210,
  networkLatency: 45.3,
  timestamp: Date.now(),
  healthScore: 95,
  networkStatus: 'EXCELLENT'
};

const mockBlocksResponse = {
  blocks: [
    {
      height: 1234567,
      hash: '0xabc123def456789abc123def456789abc123def456789abc123def456789abcd',
      timestamp: Date.now() - 5000,
      transactions: 15000,
      validator: '0x1234567890abcdef',
      size: 2048576, // 2MB
      gasUsed: 21000000
    },
    {
      height: 1234566,
      hash: '0xdef456abc789012def456abc789012def456abc789012def456abc789012defc',
      timestamp: Date.now() - 10000,
      transactions: 14500,
      validator: '0xabcdef1234567890',
      size: 1998848, // ~1.9MB
      gasUsed: 20500000
    },
    {
      height: 1234565,
      hash: '0x789abc123def456789abc123def456789abc123def456789abc123def456789a',
      timestamp: Date.now() - 15000,
      transactions: 15200,
      validator: '0x9876543210fedcba',
      size: 2097152, // 2MB
      gasUsed: 21500000
    }
  ],
  total: 1234567,
  limit: 10,
  offset: 0
};

describe('BlockchainOperations Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/blockchain/network/stats')) {
        return Promise.resolve({ data: mockNetworkStats });
      }
      if (url.includes('/blockchain/blocks')) {
        return Promise.resolve({ data: mockBlocksResponse });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      render(<BlockchainOperations />);
      await waitFor(() => {
        expect(screen.getByText('Blockchain Operations Dashboard')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<BlockchainOperations />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render main dashboard after loading', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Blockchain Operations Dashboard')).toBeInTheDocument();
        expect(screen.getByText('EXCELLENT')).toBeInTheDocument();
      });
    });

    it('should display error state when fetch fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch blockchain operations data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch network stats on mount', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/blockchain/network/stats')
        );
      });
    });

    it('should fetch recent blocks on mount', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/blockchain/blocks?limit=10')
        );
      });
    });

    it('should fetch both stats and blocks in parallel', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Network Status', () => {
    it('should display excellent network status', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('EXCELLENT')).toBeInTheDocument();
      });
    });

    it('should display good network status', async () => {
      const goodStats = { ...mockNetworkStats, networkStatus: 'GOOD' };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/blockchain/network/stats')) {
          return Promise.resolve({ data: goodStats });
        }
        if (url.includes('/blockchain/blocks')) {
          return Promise.resolve({ data: mockBlocksResponse });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('GOOD')).toBeInTheDocument();
      });
    });

    it('should display degraded network status', async () => {
      const degradedStats = { ...mockNetworkStats, networkStatus: 'DEGRADED' };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/blockchain/network/stats')) {
          return Promise.resolve({ data: degradedStats });
        }
        if (url.includes('/blockchain/blocks')) {
          return Promise.resolve({ data: mockBlocksResponse });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('DEGRADED')).toBeInTheDocument();
      });
    });

    it('should display critical network status', async () => {
      const criticalStats = { ...mockNetworkStats, networkStatus: 'CRITICAL' };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/blockchain/network/stats')) {
          return Promise.resolve({ data: criticalStats });
        }
        if (url.includes('/blockchain/blocks')) {
          return Promise.resolve({ data: mockBlocksResponse });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      });
    });
  });

  describe('Key Metrics Display', () => {
    it('should display block height', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Block Height')).toBeInTheDocument();
        expect(screen.getByText('1,234,567')).toBeInTheDocument();
      });
    });

    it('should display current TPS', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Current TPS')).toBeInTheDocument();
        expect(screen.getByText('776,543')).toBeInTheDocument();
      });
    });

    it('should display average block time', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Block Time (avg)')).toBeInTheDocument();
        expect(screen.getByText('2.50s')).toBeInTheDocument();
      });
    });

    it('should display active validators', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Active Validators')).toBeInTheDocument();
        expect(screen.getByText('22 / 25')).toBeInTheDocument();
      });
    });
  });

  describe('Transaction Statistics', () => {
    it('should display total transactions', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Transaction Statistics')).toBeInTheDocument();
        expect(screen.getByText('Total Transactions')).toBeInTheDocument();
        expect(screen.getByText('9,876,543,210')).toBeInTheDocument();
      });
    });

    it('should display network latency', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Network Latency')).toBeInTheDocument();
        expect(screen.getByText('45.30 ms')).toBeInTheDocument();
      });
    });
  });

  describe('Network Information', () => {
    it('should display network hash rate', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Network Information')).toBeInTheDocument();
        expect(screen.getByText('Network Hash Rate')).toBeInTheDocument();
        expect(screen.getByText('15.5 PH/s')).toBeInTheDocument();
      });
    });

    it('should display total nodes', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Total Nodes')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });
  });

  describe('TPS Chart', () => {
    it('should display TPS chart heading', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Transactions Per Second (Live - Last 2 Minutes)')).toBeInTheDocument();
      });
    });

    it('should display chart components', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });
    });

    it('should update TPS history on data fetch', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Advance timers to trigger another fetch
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(4); // 2 initial + 2 after 5s
      });
    });

    it('should show collecting message when no history data', async () => {
      // Create a fresh render without any data
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/blockchain/network/stats')) {
          return new Promise(() => {}); // Never resolves
        }
        if (url.includes('/blockchain/blocks')) {
          return new Promise(() => {});
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<BlockchainOperations />);

      // Should still show loading
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Recent Blocks Table', () => {
    it('should display recent blocks table heading', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Recent Blocks (Live)')).toBeInTheDocument();
      });
    });

    it('should display table headers', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('Height')).toBeInTheDocument();
        expect(screen.getByText('Hash')).toBeInTheDocument();
        expect(screen.getByText('Timestamp')).toBeInTheDocument();
        expect(screen.getByText('Transactions')).toBeInTheDocument();
        expect(screen.getByText('Validator')).toBeInTheDocument();
        expect(screen.getByText('Size')).toBeInTheDocument();
      });
    });

    it('should display block heights', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('1,234,567')).toBeInTheDocument();
        expect(screen.getByText('1,234,566')).toBeInTheDocument();
        expect(screen.getByText('1,234,565')).toBeInTheDocument();
      });
    });

    it('should display block hashes', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText(/0xabc123def456/)).toBeInTheDocument();
        expect(screen.getByText(/0xdef456abc789/)).toBeInTheDocument();
        expect(screen.getByText(/0x789abc123def/)).toBeInTheDocument();
      });
    });

    it('should display transaction counts', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('15,000')).toBeInTheDocument();
        expect(screen.getByText('14,500')).toBeInTheDocument();
        expect(screen.getByText('15,200')).toBeInTheDocument();
      });
    });

    it('should display validator addresses', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument();
        expect(screen.getByText('0xabcdef1234567890')).toBeInTheDocument();
        expect(screen.getByText('0x9876543210fedcba')).toBeInTheDocument();
      });
    });

    it('should display block sizes in KB', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('2000.00 KB')).toBeInTheDocument();
        expect(screen.getByText('1952.00 KB')).toBeInTheDocument();
        expect(screen.getByText('2048.00 KB')).toBeInTheDocument();
      });
    });

    it('should display timestamps', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        const timestamps = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it('should display empty state when no blocks', async () => {
      const emptyBlocks = { ...mockBlocksResponse, blocks: [] };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/blockchain/network/stats')) {
          return Promise.resolve({ data: mockNetworkStats });
        }
        if (url.includes('/blockchain/blocks')) {
          return Promise.resolve({ data: emptyBlocks });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('No blocks available')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should poll data every 5 seconds', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
      });
    });

    it('should poll data twice after 10 seconds', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });

      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(6);
      });
    });

    it('should update TPS history with each poll', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      });

      // Change TPS in next poll
      const updatedStats = { ...mockNetworkStats, currentTPS: 850000 };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/blockchain/network/stats')) {
          return Promise.resolve({ data: updatedStats });
        }
        if (url.includes('/blockchain/blocks')) {
          return Promise.resolve({ data: mockBlocksResponse });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.getByText('850,000')).toBeInTheDocument();
      });
    });

    it('should cleanup interval on unmount', async () => {
      const { unmount } = render(<BlockchainOperations />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });

      unmount();
      const callsBeforeUnmount = mockedAxios.get.mock.calls.length;

      vi.advanceTimersByTime(5000);

      expect(mockedAxios.get).toHaveBeenCalledTimes(callsBeforeUnmount);
    });
  });

  describe('Error Handling', () => {
    it('should handle network stats API error', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/blockchain/network/stats')) {
          return Promise.reject(new Error('Stats API failed'));
        }
        if (url.includes('/blockchain/blocks')) {
          return Promise.resolve({ data: mockBlocksResponse });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch blockchain operations data/)).toBeInTheDocument();
      });
    });

    it('should handle blocks API error', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/blockchain/network/stats')) {
          return Promise.resolve({ data: mockNetworkStats });
        }
        if (url.includes('/blockchain/blocks')) {
          return Promise.reject(new Error('Blocks API failed'));
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch blockchain operations data/)).toBeInTheDocument();
      });
    });

    it('should display helpful error message', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network timeout'));

      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText(/Please ensure the backend is running on port 9003/)).toBeInTheDocument();
      });
    });
  });

  describe('Data Formatting', () => {
    it('should format large numbers with commas', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('1,234,567')).toBeInTheDocument(); // Block height
        expect(screen.getByText('776,543')).toBeInTheDocument(); // TPS
        expect(screen.getByText('9,876,543,210')).toBeInTheDocument(); // Total transactions
      });
    });

    it('should format block time to seconds with decimals', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('2.50s')).toBeInTheDocument();
      });
    });

    it('should format network latency to milliseconds with decimals', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('45.30 ms')).toBeInTheDocument();
      });
    });

    it('should format block sizes to KB with decimals', async () => {
      render(<BlockchainOperations />);

      await waitFor(() => {
        expect(screen.getByText('2000.00 KB')).toBeInTheDocument();
      });
    });
  });
});

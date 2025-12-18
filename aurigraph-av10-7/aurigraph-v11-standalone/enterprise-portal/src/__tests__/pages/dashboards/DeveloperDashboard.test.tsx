import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import DeveloperDashboard from '../../../pages/dashboards/DeveloperDashboard';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockSystemInfo = {
  applicationName: 'Aurigraph V11',
  version: '11.0.0',
  buildTimestamp: '2025-01-15T10:30:00Z',
  javaVersion: '21.0.1',
  quarkusVersion: '3.26.2',
  environment: 'development',
  hostname: 'localhost',
  uptime: 7200000, // 2 hours
  startTime: Date.now() - 7200000
};

const mockAPIMetrics = {
  totalRequests: 125000,
  totalErrors: 250,
  avgResponseTime: 12.5,
  p95ResponseTime: 45.2,
  p99ResponseTime: 89.7,
  requestsPerSecond: 125.5,
  errorRate: 0.2,
  endpoints: [
    {
      path: '/api/v12/health',
      method: 'GET',
      description: 'Health check endpoint',
      requestCount: 50000,
      avgResponseTime: 5.2,
      errorRate: 0,
      auth: false,
      status: 'healthy' as const
    },
    {
      path: '/api/v12/transactions',
      method: 'POST',
      description: 'Submit transaction',
      requestCount: 30000,
      avgResponseTime: 25.8,
      errorRate: 1.5,
      auth: true,
      status: 'healthy' as const
    },
    {
      path: '/api/v12/blockchain/stats',
      method: 'GET',
      description: 'Blockchain statistics',
      requestCount: 25000,
      avgResponseTime: 15.3,
      errorRate: 0.5,
      auth: false,
      status: 'degraded' as const
    },
    {
      path: '/api/v12/validators',
      method: 'PUT',
      description: 'Update validator',
      requestCount: 10000,
      avgResponseTime: 35.5,
      errorRate: 8.2,
      auth: true,
      status: 'down' as const
    }
  ]
};

describe('DeveloperDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/info')) {
        return Promise.resolve({ data: mockSystemInfo });
      }
      if (url.includes('/metrics/api')) {
        return Promise.resolve({ data: mockAPIMetrics });
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
      render(<DeveloperDashboard />);
      await waitFor(() => {
        expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<DeveloperDashboard />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render all main sections after loading', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Developer Dashboard')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /API Reference/i })).toBeInTheDocument();
      });
    });

    it('should display error state when fetch fails and no fallback data', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch system info on mount', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/info')
        );
      });
    });

    it('should fetch API metrics on mount', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/metrics/api')
        );
      });
    });

    it('should fetch both system info and metrics in parallel', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });

    it('should use fallback data when API fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Aurigraph V11')).toBeInTheDocument();
        expect(screen.getByText(/v11\.0\.0/i)).toBeInTheDocument();
      });
    });
  });

  describe('System Information Cards', () => {
    it('should display application name and version', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Aurigraph V11')).toBeInTheDocument();
        expect(screen.getByText('v11.0.0')).toBeInTheDocument();
      });
    });

    it('should display environment chip with correct color', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        const envChip = screen.getByText('DEVELOPMENT');
        expect(envChip).toBeInTheDocument();
      });
    });

    it('should display hostname', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('localhost')).toBeInTheDocument();
      });
    });

    it('should display formatted uptime', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/2h 0m/i)).toBeInTheDocument();
      });
    });

    it('should display Java version', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Java 21\.0\.1/i)).toBeInTheDocument();
      });
    });

    it('should display Quarkus version', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Quarkus 3\.26\.2/i)).toBeInTheDocument();
      });
    });

    it('should display production environment with error color', async () => {
      const prodSystemInfo = { ...mockSystemInfo, environment: 'production' };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/info')) {
          return Promise.resolve({ data: prodSystemInfo });
        }
        if (url.includes('/metrics/api')) {
          return Promise.resolve({ data: mockAPIMetrics });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('PRODUCTION')).toBeInTheDocument();
      });
    });
  });

  describe('API Metrics Cards', () => {
    it('should display requests per second', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('125.5')).toBeInTheDocument();
      });
    });

    it('should display total requests', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('125,000')).toBeInTheDocument();
      });
    });

    it('should display error rate', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('0.20%')).toBeInTheDocument();
        expect(screen.getByText('250 errors')).toBeInTheDocument();
      });
    });

    it('should display average response time', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('12.5ms')).toBeInTheDocument();
      });
    });

    it('should display P95 and P99 response times', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/P95: 45\.2ms/i)).toBeInTheDocument();
        expect(screen.getByText(/P99: 89\.7ms/i)).toBeInTheDocument();
      });
    });
  });

  describe('Tabs', () => {
    it('should render all four tabs', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /API Reference/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Code Examples/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Documentation/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Testing/i })).toBeInTheDocument();
      });
    });

    it('should default to API Reference tab', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Available API Endpoints')).toBeInTheDocument();
      });
    });

    it('should switch to Code Examples tab', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Code Examples/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Code Examples/i }));

      await waitFor(() => {
        expect(screen.getByText('Quick Start Code Examples')).toBeInTheDocument();
      });
    });

    it('should switch to Documentation tab', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Documentation/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Documentation/i }));

      await waitFor(() => {
        expect(screen.getByText('Documentation Resources')).toBeInTheDocument();
      });
    });

    it('should switch to Testing tab', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Testing/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Testing/i }));

      await waitFor(() => {
        expect(screen.getByText('Testing Tools')).toBeInTheDocument();
      });
    });
  });

  describe('API Reference Tab', () => {
    it('should display endpoints table', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('/api/v12/health')).toBeInTheDocument();
        expect(screen.getByText('/api/v12/transactions')).toBeInTheDocument();
        expect(screen.getByText('/api/v12/blockchain/stats')).toBeInTheDocument();
        expect(screen.getByText('/api/v12/validators')).toBeInTheDocument();
      });
    });

    it('should display endpoint descriptions', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Health check endpoint')).toBeInTheDocument();
        expect(screen.getByText('Submit transaction')).toBeInTheDocument();
        expect(screen.getByText('Blockchain statistics')).toBeInTheDocument();
        expect(screen.getByText('Update validator')).toBeInTheDocument();
      });
    });

    it('should display HTTP methods with correct colors', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        const getMethods = screen.getAllByText('GET');
        expect(getMethods.length).toBeGreaterThan(0);

        expect(screen.getByText('POST')).toBeInTheDocument();
        expect(screen.getByText('PUT')).toBeInTheDocument();
      });
    });

    it('should display endpoint request counts', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('50,000')).toBeInTheDocument(); // health endpoint
        expect(screen.getByText('30,000')).toBeInTheDocument(); // transactions
        expect(screen.getByText('25,000')).toBeInTheDocument(); // stats
        expect(screen.getByText('10,000')).toBeInTheDocument(); // validators
      });
    });

    it('should display endpoint response times', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('5.2ms')).toBeInTheDocument();
        expect(screen.getByText('25.8ms')).toBeInTheDocument();
        expect(screen.getByText('15.3ms')).toBeInTheDocument();
        expect(screen.getByText('35.5ms')).toBeInTheDocument();
      });
    });

    it('should display endpoint error rates', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText('0.00%')).toBeInTheDocument(); // health
        expect(screen.getByText('1.50%')).toBeInTheDocument(); // transactions
        expect(screen.getByText('0.50%')).toBeInTheDocument(); // stats
        expect(screen.getByText('8.20%')).toBeInTheDocument(); // validators
      });
    });

    it('should display endpoint status', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        const healthyStatuses = screen.getAllByText('HEALTHY');
        expect(healthyStatuses.length).toBe(2);

        expect(screen.getByText('DEGRADED')).toBeInTheDocument();
        expect(screen.getByText('DOWN')).toBeInTheDocument();
      });
    });

    it('should display auth requirements', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        const requiredBadges = screen.getAllByText('Required');
        expect(requiredBadges.length).toBe(2); // POST and PUT endpoints

        const publicBadges = screen.getAllByText('Public');
        expect(publicBadges.length).toBe(2); // GET endpoints
      });
    });

    it('should show info message when no endpoints available', async () => {
      const emptyMetrics = { ...mockAPIMetrics, endpoints: [] };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/info')) {
          return Promise.resolve({ data: mockSystemInfo });
        }
        if (url.includes('/metrics/api')) {
          return Promise.resolve({ data: emptyMetrics });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/No API metrics available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Code Examples Tab', () => {
    it('should display JavaScript/TypeScript code example', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Code Examples/i }));

      await waitFor(() => {
        expect(screen.getByText('JavaScript/TypeScript')).toBeInTheDocument();
        expect(screen.getByText(/import axios from 'axios'/i)).toBeInTheDocument();
      });
    });

    it('should display cURL code example', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Code Examples/i }));

      await waitFor(() => {
        expect(screen.getByText('cURL')).toBeInTheDocument();
        expect(screen.getByText(/# Health check/i)).toBeInTheDocument();
      });
    });

    it('should display link to full API documentation', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Code Examples/i }));

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /View Full API Documentation/i });
        expect(link).toHaveAttribute('href', 'https://docs.aurigraph.io/api');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });
  });

  describe('Documentation Tab', () => {
    it('should display Getting Started resource', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Documentation/i }));

      await waitFor(() => {
        expect(screen.getByText('Getting Started')).toBeInTheDocument();
        expect(screen.getByText(/Learn the basics of integrating/i)).toBeInTheDocument();
      });
    });

    it('should display API Reference resource', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Documentation/i }));

      await waitFor(() => {
        expect(screen.getByText('API Reference')).toBeInTheDocument();
        expect(screen.getByText(/Complete API documentation/i)).toBeInTheDocument();
      });
    });

    it('should display SDK Libraries resource', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Documentation/i }));

      await waitFor(() => {
        expect(screen.getByText('SDK Libraries')).toBeInTheDocument();
        expect(screen.getByText(/Download SDKs for JavaScript/i)).toBeInTheDocument();
      });
    });

    it('should display Tutorials resource', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Documentation/i }));

      await waitFor(() => {
        expect(screen.getByText('Tutorials')).toBeInTheDocument();
        expect(screen.getByText(/Step-by-step tutorials/i)).toBeInTheDocument();
      });
    });

    it('should have correct links for all documentation resources', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Documentation/i }));

      await waitFor(() => {
        const readGuideLink = screen.getByRole('link', { name: /Read Guide/i });
        expect(readGuideLink).toHaveAttribute('href', 'https://docs.aurigraph.io/getting-started');

        const viewDocsLink = screen.getByRole('link', { name: /View API Docs/i });
        expect(viewDocsLink).toHaveAttribute('href', 'https://docs.aurigraph.io/api');

        const downloadSDKLink = screen.getByRole('link', { name: /Download SDKs/i });
        expect(downloadSDKLink).toHaveAttribute('href', 'https://docs.aurigraph.io/sdks');

        const browseTutorialsLink = screen.getByRole('link', { name: /Browse Tutorials/i });
        expect(browseTutorialsLink).toHaveAttribute('href', 'https://docs.aurigraph.io/tutorials');
      });
    });
  });

  describe('Testing Tab', () => {
    it('should display API Testing Console card', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Testing/i }));

      await waitFor(() => {
        expect(screen.getByText('API Testing Console')).toBeInTheDocument();
        expect(screen.getByText(/Test API endpoints interactively/i)).toBeInTheDocument();
        expect(screen.getByText(/sandbox\.dlt\.aurigraph\.io\/api\/v11/i)).toBeInTheDocument();
      });
    });

    it('should display Sandbox Environment card', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Testing/i }));

      await waitFor(() => {
        expect(screen.getByText('Sandbox Environment')).toBeInTheDocument();
        expect(screen.getByText(/Full-featured test environment/i)).toBeInTheDocument();
      });
    });

    it('should display test credentials', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Testing/i }));

      await waitFor(() => {
        expect(screen.getByText('Test Credentials')).toBeInTheDocument();
        expect(screen.getByText('sandbox_test_key_1234567890abcdef')).toBeInTheDocument();
        expect(screen.getByText('0x1234567890abcdef1234567890abcdef12345678')).toBeInTheDocument();
      });
    });

    it('should display Launch Console button', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Testing/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Launch Console/i })).toBeInTheDocument();
      });
    });

    it('should display Access Sandbox link with correct URL', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Testing/i }));

      await waitFor(() => {
        const sandboxLink = screen.getByRole('link', { name: /Access Sandbox/i });
        expect(sandboxLink).toHaveAttribute('href', 'https://sandbox.dlt.aurigraph.io');
        expect(sandboxLink).toHaveAttribute('target', '_blank');
      });
    });

    it('should display sandbox info alert', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await user.click(screen.getByRole('tab', { name: /Testing/i }));

      await waitFor(() => {
        expect(screen.getByText(/Use our testing sandbox environment/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should poll data every 10 seconds', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });

      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(4);
      });
    });

    it('should poll data twice after 20 seconds', async () => {
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });

      vi.advanceTimersByTime(20000);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(6);
      });
    });

    it('should cleanup interval on unmount', async () => {
      const { unmount } = render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });

      unmount();
      vi.advanceTimersByTime(10000);

      const callsBeforeUnmount = mockedAxios.get.mock.calls.length;
      vi.advanceTimersByTime(10000);

      expect(mockedAxios.get).toHaveBeenCalledTimes(callsBeforeUnmount);
    });
  });

  describe('Error Handling', () => {
    it('should display error alert when fetch fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('should refetch data when retry button clicked', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))
                   .mockResolvedValueOnce({ data: mockSystemInfo })
                   .mockResolvedValueOnce({ data: mockAPIMetrics });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Retry/i }));

      await waitFor(() => {
        expect(screen.getByText('Aurigraph V11')).toBeInTheDocument();
      });
    });

    it('should refresh data when Refresh button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });

      mockedAxios.get.mockClear();

      await user.click(screen.getByRole('button', { name: /Refresh/i }));

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should format uptime in days and hours', async () => {
      const longUptimeInfo = {
        ...mockSystemInfo,
        uptime: 90000000, // 25 hours
        startTime: Date.now() - 90000000
      };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/info')) {
          return Promise.resolve({ data: longUptimeInfo });
        }
        if (url.includes('/metrics/api')) {
          return Promise.resolve({ data: mockAPIMetrics });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/1d 1h/i)).toBeInTheDocument();
      });
    });

    it('should format uptime in hours and minutes', async () => {
      const mediumUptimeInfo = {
        ...mockSystemInfo,
        uptime: 3900000, // 1h 5m
        startTime: Date.now() - 3900000
      };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/info')) {
          return Promise.resolve({ data: mediumUptimeInfo });
        }
        if (url.includes('/metrics/api')) {
          return Promise.resolve({ data: mockAPIMetrics });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/1h 5m/i)).toBeInTheDocument();
      });
    });

    it('should format uptime in minutes and seconds', async () => {
      const shortUptimeInfo = {
        ...mockSystemInfo,
        uptime: 125000, // 2m 5s
        startTime: Date.now() - 125000
      };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/info')) {
          return Promise.resolve({ data: shortUptimeInfo });
        }
        if (url.includes('/metrics/api')) {
          return Promise.resolve({ data: mockAPIMetrics });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/2m 5s/i)).toBeInTheDocument();
      });
    });

    it('should format uptime in seconds only', async () => {
      const veryShortUptimeInfo = {
        ...mockSystemInfo,
        uptime: 30000, // 30s
        startTime: Date.now() - 30000
      };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/info')) {
          return Promise.resolve({ data: veryShortUptimeInfo });
        }
        if (url.includes('/metrics/api')) {
          return Promise.resolve({ data: mockAPIMetrics });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<DeveloperDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/30s/i)).toBeInTheDocument();
      });
    });
  });
});

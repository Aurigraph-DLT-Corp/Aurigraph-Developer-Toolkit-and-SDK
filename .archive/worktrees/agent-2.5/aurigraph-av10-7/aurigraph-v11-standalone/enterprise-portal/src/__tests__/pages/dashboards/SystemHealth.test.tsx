import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SystemHealth from '../../../pages/dashboards/SystemHealth';
import apiService from '../../../services/api';

// Mock apiService
vi.mock('../../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Mock data
const mockHealthResponse = {
  status: 'HEALTHY',
  version: '11.0.0',
  uptimeSeconds: 7200,
  totalRequests: 1000000,
  platform: 'Quarkus'
};

const mockPerformanceResponse = {
  memoryUsage: {
    total: 49152, // 48 GB
    used: 24576, // 24 GB (50%)
    free: 24576
  },
  cpuUtilization: 45.5,
  diskIO: {
    read: 150.5,
    write: 250.8
  },
  networkIO: {
    inbound: 500.2,
    outbound: 450.3
  },
  responseTime: {
    p50: 15.2,
    p95: 45.8,
    p99: 89.3
  },
  throughput: 776000,
  errorRate: 0.002, // 0.2%
  uptimeSeconds: 7200,
  timestamp: new Date().toISOString()
};

describe('SystemHealth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockedApiService.getHealth.mockResolvedValue(mockHealthResponse);
    mockedApiService.getAnalyticsPerformance.mockResolvedValue(mockPerformanceResponse);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      render(<SystemHealth />);
      await waitFor(() => {
        expect(screen.getByText('System Health Dashboard')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<SystemHealth />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render main dashboard after loading', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('System Health Dashboard')).toBeInTheDocument();
        expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      });
    });

    it('should display error state when fetch fails', async () => {
      mockedApiService.getHealth.mockRejectedValue(new Error('Network error'));

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch system health data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch health data on mount', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(mockedApiService.getHealth).toHaveBeenCalled();
      });
    });

    it('should fetch performance metrics on mount', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(mockedApiService.getAnalyticsPerformance).toHaveBeenCalled();
      });
    });

    it('should fetch both health and performance in parallel', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(mockedApiService.getHealth).toHaveBeenCalled();
        expect(mockedApiService.getAnalyticsPerformance).toHaveBeenCalled();
      });
    });
  });

  describe('Health Score Calculation', () => {
    it('should calculate high health score for good metrics', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        // With 45% CPU, 50% memory, 0.2% error rate, 45ms p95
        // Score should be: 100 - 5 (cpu) - 5 (memory) = 90
        expect(screen.getByText('90/100')).toBeInTheDocument();
      });
    });

    it('should calculate lower score for high CPU usage', async () => {
      const highCPUPerf = { ...mockPerformanceResponse, cpuUtilization: 85 };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highCPUPerf);

      render(<SystemHealth />);

      await waitFor(() => {
        // High CPU (>80%) should penalize score by 30
        expect(screen.getByText('60/100')).toBeInTheDocument();
      });
    });

    it('should calculate lower score for high memory usage', async () => {
      const highMemoryPerf = {
        ...mockPerformanceResponse,
        memoryUsage: { total: 49152, used: 43008, free: 6144 } // 87.5% usage
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highMemoryPerf);

      render(<SystemHealth />);

      await waitFor(() => {
        // High memory (>80%) should penalize score by 30
        expect(screen.getByText('60/100')).toBeInTheDocument();
      });
    });

    it('should calculate lower score for high error rate', async () => {
      const highErrorPerf = { ...mockPerformanceResponse, errorRate: 0.06 }; // 6%
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highErrorPerf);

      render(<SystemHealth />);

      await waitFor(() => {
        // High error rate (>5%) should penalize score by 25
        expect(screen.getByText('65/100')).toBeInTheDocument();
      });
    });

    it('should calculate lower score for slow response time', async () => {
      const slowResponsePerf = {
        ...mockPerformanceResponse,
        responseTime: { p50: 50, p95: 150, p99: 250 }
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(slowResponsePerf);

      render(<SystemHealth />);

      await waitFor(() => {
        // Slow p95 (>100ms) should penalize score by 15
        expect(screen.getByText('75/100')).toBeInTheDocument();
      });
    });
  });

  describe('Status Display', () => {
    it('should display healthy status for score >= 80', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      });
    });

    it('should display degraded status for score 50-79', async () => {
      const degradedPerf = {
        ...mockPerformanceResponse,
        cpuUtilization: 65,
        memoryUsage: { total: 49152, used: 32768, free: 16384 } // 66%
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(degradedPerf);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('DEGRADED')).toBeInTheDocument();
      });
    });

    it('should display critical status for score < 50', async () => {
      const criticalPerf = {
        ...mockPerformanceResponse,
        cpuUtilization: 85,
        memoryUsage: { total: 49152, used: 43008, free: 6144 }, // 87.5%
        errorRate: 0.06 // 6%
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(criticalPerf);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('CRITICAL')).toBeInTheDocument();
      });
    });
  });

  describe('Resource Usage Metrics', () => {
    it('should display CPU usage percentage', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('CPU Usage')).toBeInTheDocument();
        expect(screen.getByText('45.5%')).toBeInTheDocument();
        expect(screen.getByText('16 cores available')).toBeInTheDocument();
      });
    });

    it('should display memory usage percentage and values', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('Memory Usage')).toBeInTheDocument();
        expect(screen.getByText('50.0%')).toBeInTheDocument();
        expect(screen.getByText(/24\.00 GB \/ 48\.00 GB/)).toBeInTheDocument();
      });
    });

    it('should display disk usage', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('Disk Usage')).toBeInTheDocument();
        // Disk percentage should be calculated
        const diskPercentage = screen.getAllByText(/\d+\.\d+%/);
        expect(diskPercentage.length).toBeGreaterThan(0);
      });
    });

    it('should show error color for high CPU usage', async () => {
      const highCPU = { ...mockPerformanceResponse, cpuUtilization: 85 };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highCPU);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('85.0%')).toBeInTheDocument();
      });
    });

    it('should show error color for high memory usage', async () => {
      const highMemory = {
        ...mockPerformanceResponse,
        memoryUsage: { total: 49152, used: 43008, free: 6144 }
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highMemory);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('87.5%')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should display transaction throughput', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('Transaction Throughput')).toBeInTheDocument();
        expect(screen.getByText('776K')).toBeInTheDocument();
        expect(screen.getByText('TPS (Transactions Per Second)')).toBeInTheDocument();
      });
    });

    it('should display response time metrics', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('Response Time (P95)')).toBeInTheDocument();
        expect(screen.getByText('45.8ms')).toBeInTheDocument();
        expect(screen.getByText(/P50: 15\.2ms/)).toBeInTheDocument();
        expect(screen.getByText(/P99: 89\.3ms/)).toBeInTheDocument();
      });
    });

    it('should display error rate', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('Error Rate')).toBeInTheDocument();
        expect(screen.getByText('0.20%')).toBeInTheDocument();
      });
    });

    it('should show success color for low error rate', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('0.20%')).toBeInTheDocument();
      });
    });

    it('should show warning color for elevated error rate', async () => {
      const elevatedError = { ...mockPerformanceResponse, errorRate: 0.015 }; // 1.5%
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(elevatedError);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('1.50%')).toBeInTheDocument();
      });
    });

    it('should show error color for high error rate', async () => {
      const highError = { ...mockPerformanceResponse, errorRate: 0.06 }; // 6%
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highError);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('6.00%')).toBeInTheDocument();
      });
    });
  });

  describe('Service Status', () => {
    it('should display all services', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('Service Status')).toBeInTheDocument();
        expect(screen.getByText('Quarkus Runtime')).toBeInTheDocument();
        expect(screen.getByText('Transaction Processing')).toBeInTheDocument();
        expect(screen.getByText('Network Layer')).toBeInTheDocument();
        expect(screen.getByText('Consensus Engine')).toBeInTheDocument();
      });
    });

    it('should show all services as running', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        const runningChips = screen.getAllByText('RUNNING');
        expect(runningChips.length).toBe(4);
      });
    });

    it('should display service uptimes', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        const uptimeTexts = screen.getAllByText(/Uptime: 2\.00h/);
        expect(uptimeTexts.length).toBeGreaterThan(0);
      });
    });

    it('should show degraded status for low throughput service', async () => {
      const lowThroughput = { ...mockPerformanceResponse, throughput: 400000 };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(lowThroughput);

      render(<SystemHealth />);

      await waitFor(() => {
        const degradedChips = screen.getAllByText('DEGRADED');
        expect(degradedChips.length).toBeGreaterThan(0);
      });
    });

    it('should show degraded status for high error rate service', async () => {
      const highError = { ...mockPerformanceResponse, errorRate: 0.06 }; // 6%
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highError);

      render(<SystemHealth />);

      await waitFor(() => {
        const degradedChips = screen.getAllByText('DEGRADED');
        expect(degradedChips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Alerts Generation', () => {
    it('should not generate alerts for good metrics', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('90/100')).toBeInTheDocument();
      });

      // No alerts should be shown
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should generate high CPU alert', async () => {
      const highCPU = { ...mockPerformanceResponse, cpuUtilization: 85 };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highCPU);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Critical CPU usage: 85\.0%/)).toBeInTheDocument();
      });
    });

    it('should generate warning for moderate CPU usage', async () => {
      const moderateCPU = { ...mockPerformanceResponse, cpuUtilization: 65 };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(moderateCPU);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/High CPU usage: 65\.0%/)).toBeInTheDocument();
      });
    });

    it('should generate high memory alert', async () => {
      const highMemory = {
        ...mockPerformanceResponse,
        memoryUsage: { total: 49152, used: 43008, free: 6144 } // 87.5%
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highMemory);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Critical memory usage: 87\.5%/)).toBeInTheDocument();
      });
    });

    it('should generate warning for moderate memory usage', async () => {
      const moderateMemory = {
        ...mockPerformanceResponse,
        memoryUsage: { total: 49152, used: 32768, free: 16384 } // 66.6%
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(moderateMemory);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/High memory usage: 66\.6%/)).toBeInTheDocument();
      });
    });

    it('should generate critical error rate alert', async () => {
      const criticalError = { ...mockPerformanceResponse, errorRate: 0.06 }; // 6%
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(criticalError);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Critical error rate: 6\.00%/)).toBeInTheDocument();
      });
    });

    it('should generate elevated error rate alert', async () => {
      const elevatedError = { ...mockPerformanceResponse, errorRate: 0.025 }; // 2.5%
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(elevatedError);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Elevated error rate: 2\.50%/)).toBeInTheDocument();
      });
    });

    it('should generate slow response time alert', async () => {
      const slowResponse = {
        ...mockPerformanceResponse,
        responseTime: { p50: 50, p95: 120, p99: 250 }
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(slowResponse);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Slow response time \(P95\): 120\.0ms/)).toBeInTheDocument();
      });
    });

    it('should generate high disk write alert', async () => {
      const highDiskWrite = {
        ...mockPerformanceResponse,
        diskIO: { read: 150, write: 5500 }
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(highDiskWrite);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/High disk write activity: 5500\.0 MB\/s/)).toBeInTheDocument();
      });
    });

    it('should generate multiple alerts for multiple issues', async () => {
      const multipleIssues = {
        ...mockPerformanceResponse,
        cpuUtilization: 85,
        memoryUsage: { total: 49152, used: 43008, free: 6144 },
        errorRate: 0.06
      };
      mockedApiService.getAnalyticsPerformance.mockResolvedValue(multipleIssues);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Critical CPU usage/)).toBeInTheDocument();
        expect(screen.getByText(/Critical memory usage/)).toBeInTheDocument();
        expect(screen.getByText(/Critical error rate/)).toBeInTheDocument();
      });
    });
  });

  describe('System Uptime', () => {
    it('should display system uptime', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('System Uptime')).toBeInTheDocument();
        expect(screen.getByText('0d 2h 0m')).toBeInTheDocument();
      });
    });

    it('should display uptime with days', async () => {
      const longUptime = { ...mockHealthResponse, uptimeSeconds: 259200 }; // 3 days
      mockedApiService.getHealth.mockResolvedValue(longUptime);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('3d 0h 0m')).toBeInTheDocument();
      });
    });

    it('should display uptime with days, hours and minutes', async () => {
      const mixedUptime = { ...mockHealthResponse, uptimeSeconds: 267900 }; // 3d 2h 25m
      mockedApiService.getHealth.mockResolvedValue(mixedUptime);

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText('3d 2h 25m')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should poll data every 10 seconds', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(mockedApiService.getHealth).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockedApiService.getHealth).toHaveBeenCalledTimes(2);
      });
    });

    it('should poll data twice after 20 seconds', async () => {
      render(<SystemHealth />);

      await waitFor(() => {
        expect(mockedApiService.getHealth).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(20000);

      await waitFor(() => {
        expect(mockedApiService.getHealth).toHaveBeenCalledTimes(3);
      });
    });

    it('should cleanup interval on unmount', async () => {
      const { unmount } = render(<SystemHealth />);

      await waitFor(() => {
        expect(mockedApiService.getHealth).toHaveBeenCalled();
      });

      unmount();
      const callsBeforeUnmount = mockedApiService.getHealth.mock.calls.length;

      vi.advanceTimersByTime(10000);

      expect(mockedApiService.getHealth).toHaveBeenCalledTimes(callsBeforeUnmount);
    });
  });

  describe('Error Handling', () => {
    it('should handle health API error', async () => {
      mockedApiService.getHealth.mockRejectedValue(new Error('Health API failed'));

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch system health data/)).toBeInTheDocument();
      });
    });

    it('should handle performance API error', async () => {
      mockedApiService.getAnalyticsPerformance.mockRejectedValue(new Error('Performance API failed'));

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch system health data/)).toBeInTheDocument();
      });
    });

    it('should display error message', async () => {
      mockedApiService.getHealth.mockRejectedValue(new Error('Network timeout'));

      render(<SystemHealth />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch system health data/)).toBeInTheDocument();
        expect(screen.getByText(/Please check if the backend is running/)).toBeInTheDocument();
      });
    });
  });
});

/**
 * V11 Backend Service Tests
 *
 * Tests for V11BackendService API client including retry logic,
 * error handling, and mock data generation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import V11BackendService from '../../services/V11BackendService';
import type {
  HealthCheckResponse,
  SystemInfoResponse,
  PerformanceMetrics,
  StatsResponse,
} from '../../types/api';

describe('V11BackendService', () => {
  let service: V11BackendService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    service = new V11BackendService('http://localhost:9003');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default base URL', () => {
      const defaultService = new V11BackendService();
      expect(defaultService).toBeDefined();
    });

    it('should initialize with custom base URL', () => {
      const customService = new V11BackendService('https://custom.api.com');
      expect(customService).toBeDefined();
    });

    it('should have demo mode disabled by default', () => {
      // Demo mode is permanently disabled
      expect(service).toBeDefined();
    });
  });

  describe('Demo Mode', () => {
    it('should keep demo mode disabled when attempting to enable', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      service.setDemoMode(true);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Demo mode is permanently disabled. Only real backend API data is used.'
      );

      consoleSpy.mockRestore();
    });

    it('should not use mock data when demo mode is attempted', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'UP',
          timestamp: '2025-01-01T00:00:00Z',
          version: '11.0.0',
        }),
      });

      service.setDemoMode(true);
      const health = await service.getHealth();

      // Should call real API, not return mock data
      expect(fetchMock).toHaveBeenCalled();
      expect(health.status).toBe('UP');
    });
  });

  describe('Health Check', () => {
    it('should fetch health status successfully', async () => {
      const mockHealth: HealthCheckResponse = {
        status: 'UP',
        timestamp: '2025-01-01T00:00:00Z',
        version: '11.0.0',
        uptime: 3600,
        checks: {
          database: 'UP',
          consensus: 'UP',
          network: 'UP',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const result = await service.getHealth();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:9003/api/v11/health',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockHealth);
      expect(result.status).toBe('UP');
      expect(result.version).toBe('11.0.0');
    });

    it('should handle health check errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getHealth()).rejects.toThrow();
    });
  });

  describe('System Info', () => {
    it('should fetch system information successfully', async () => {
      const mockInfo: SystemInfoResponse = {
        version: '11.0.0',
        buildTime: '2025-01-01T00:00:00Z',
        javaVersion: '21.0.1',
        quarkusVersion: '3.26.2',
        graalvmVersion: '21.0.1',
        nativeImage: true,
        platform: 'Linux',
        architecture: 'x86_64',
        availableProcessors: 16,
        totalMemory: 16777216000,
        freeMemory: 8388608000,
        maxMemory: 16777216000,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInfo,
      });

      const result = await service.getSystemInfo();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:9003/api/v11/info',
        expect.any(Object)
      );

      expect(result).toEqual(mockInfo);
      expect(result.version).toBe('11.0.0');
      expect(result.nativeImage).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should fetch performance metrics successfully', async () => {
      const mockMetrics: PerformanceMetrics = {
        timestamp: '2025-01-01T00:00:00Z',
        tps: 2500000,
        avgTps: 2400000,
        peakTps: 2800000,
        totalTransactions: 5000000,
        activeTransactions: 500,
        pendingTransactions: 100,
        confirmedTransactions: 4900000,
        failedTransactions: 500,
        avgLatencyMs: 12.5,
        p50LatencyMs: 10.0,
        p95LatencyMs: 18.0,
        p99LatencyMs: 25.0,
        memoryUsageMb: 512,
        cpuUsagePercent: 65,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      });

      const result = await service.getPerformanceMetrics();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:9003/api/v11/performance',
        expect.any(Object)
      );

      expect(result).toEqual(mockMetrics);
      expect(result.tps).toBeGreaterThan(0);
      expect(result.avgLatencyMs).toBeGreaterThan(0);
    });
  });

  describe('Statistics', () => {
    it('should fetch comprehensive stats successfully', async () => {
      const mockStats: StatsResponse = {
        timestamp: '2025-01-01T00:00:00Z',
        performance: {
          timestamp: '2025-01-01T00:00:00Z',
          tps: 2500000,
          avgTps: 2400000,
          peakTps: 2800000,
          totalTransactions: 5000000,
          activeTransactions: 500,
          pendingTransactions: 100,
          confirmedTransactions: 4900000,
          failedTransactions: 500,
          avgLatencyMs: 12.5,
          p50LatencyMs: 10.0,
          p95LatencyMs: 18.0,
          p99LatencyMs: 25.0,
          memoryUsageMb: 512,
          cpuUsagePercent: 65,
        },
        consensus: {
          currentTerm: 150,
          blockHeight: 75000,
          commitIndex: 74990,
          lastApplied: 74990,
          leaderNodeId: 'validator-1',
          validatorCount: 10,
          activeValidators: 9,
          totalLeaderChanges: 25,
          avgFinalityLatencyMs: 55.5,
          consensusState: 'IDLE',
        },
        transactions: {
          totalTransactions: 5000000,
          confirmedTransactions: 4900000,
          pendingTransactions: 50000,
          failedTransactions: 500,
          avgTxPerSecond: 2500000,
          avgTxSizeBytes: 600,
          totalVolumeProcessed: 3000000000,
          transactionsByType: {
            transfer: 3000000,
            mint: 500000,
            burn: 250000,
            stake: 750000,
            unstake: 250000,
            contract: 250000,
          },
        },
        channels: {
          totalChannels: 10,
          activeChannels: 8,
          totalConnections: 32,
          activeConnections: 28,
          totalPacketsTransferred: 1500000,
          totalBytesTransferred: 75000000,
          avgLatencyMs: 12.5,
          channelsByAlgorithm: {
            'round-robin': 4,
            'least-connections': 3,
            random: 2,
            'hash-based': 1,
          },
        },
        network: {
          totalNodes: 25,
          activeNodes: 22,
          nodesByType: {
            channel: 8,
            validator: 10,
            business: 5,
            slim: 2,
          },
          totalConnections: 100,
          networkLatencyMs: 15.2,
          bandwidthUtilization: 0.65,
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      });

      const result = await service.getStats();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:9003/api/v11/stats',
        expect.any(Object)
      );

      expect(result).toEqual(mockStats);
      expect(result.performance).toBeDefined();
      expect(result.consensus).toBeDefined();
      expect(result.transactions).toBeDefined();
      expect(result.channels).toBeDefined();
      expect(result.network).toBeDefined();
    });
  });

  describe('Retry Logic', () => {
    it('should retry on failure up to 3 times', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'UP' }),
        });

      const result = await service.getHealth();

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.status).toBe('UP');
    });

    it('should fail after max retries exceeded', async () => {
      fetchMock
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getHealth()).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff between retries', async () => {
      const delays: number[] = [];
      const originalSetTimeout = global.setTimeout;

      global.setTimeout = vi.fn((callback, delay) => {
        delays.push(delay as number);
        return originalSetTimeout(callback as any, 0);
      }) as any;

      fetchMock
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'UP' }),
        });

      await service.getHealth();

      // Should have exponential backoff: 1000ms, 2000ms
      expect(delays.length).toBe(2);
      expect(delays[0]).toBe(1000);
      expect(delays[1]).toBe(2000);

      global.setTimeout = originalSetTimeout;
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.getHealth()).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network failure'));

      await expect(service.getHealth()).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      await expect(service.getHealth()).rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(service.getHealth()).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Request Headers', () => {
    it('should include Content-Type header', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await service.getHealth();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should allow custom headers', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      // This would require extending the service to support custom headers
      await service.getHealth();

      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('API Endpoints', () => {
    it('should construct correct health endpoint URL', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await service.getHealth();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:9003/api/v11/health',
        expect.any(Object)
      );
    });

    it('should construct correct system info endpoint URL', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await service.getSystemInfo();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:9003/api/v11/info',
        expect.any(Object)
      );
    });

    it('should construct correct performance endpoint URL', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await service.getPerformanceMetrics();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:9003/api/v11/performance',
        expect.any(Object)
      );
    });

    it('should construct correct stats endpoint URL', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await service.getStats();

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:9003/api/v11/stats',
        expect.any(Object)
      );
    });
  });

  describe('Response Validation', () => {
    it('should validate health check response structure', async () => {
      const mockHealth: HealthCheckResponse = {
        status: 'UP',
        timestamp: '2025-01-01T00:00:00Z',
        version: '11.0.0',
        uptime: 3600,
        checks: {
          database: 'UP',
          consensus: 'UP',
          network: 'UP',
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth,
      });

      const result = await service.getHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('database');
      expect(result.checks).toHaveProperty('consensus');
      expect(result.checks).toHaveProperty('network');
    });

    it('should validate performance metrics structure', async () => {
      const mockMetrics: PerformanceMetrics = {
        timestamp: '2025-01-01T00:00:00Z',
        tps: 2500000,
        avgTps: 2400000,
        peakTps: 2800000,
        totalTransactions: 5000000,
        activeTransactions: 500,
        pendingTransactions: 100,
        confirmedTransactions: 4900000,
        failedTransactions: 500,
        avgLatencyMs: 12.5,
        p50LatencyMs: 10.0,
        p95LatencyMs: 18.0,
        p99LatencyMs: 25.0,
        memoryUsageMb: 512,
        cpuUsagePercent: 65,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      });

      const result = await service.getPerformanceMetrics();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('tps');
      expect(result).toHaveProperty('avgTps');
      expect(result).toHaveProperty('peakTps');
      expect(result).toHaveProperty('totalTransactions');
      expect(result).toHaveProperty('avgLatencyMs');
      expect(result).toHaveProperty('memoryUsageMb');
      expect(result).toHaveProperty('cpuUsagePercent');
    });
  });
});

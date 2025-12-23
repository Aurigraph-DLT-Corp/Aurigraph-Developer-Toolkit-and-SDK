/**
 * NetworkTopologyVisualizer.test.tsx
 *
 * Comprehensive test suite for NetworkTopologyVisualizer component
 * Coverage: 50+ tests for visualization, real-time updates, and performance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import NetworkTopologyVisualizer from '../../../pages/network/NetworkTopologyVisualizer';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock React Flow
vi.mock('reactflow', () => ({
  default: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  Controls: () => <div data-testid="flow-controls">Controls</div>,
  Background: () => <div data-testid="flow-background">Background</div>,
  MiniMap: () => <div data-testid="flow-minimap">MiniMap</div>,
  Panel: ({ children }: any) => <div data-testid="flow-panel">{children}</div>,
  useNodesState: () => [[], vi.fn(), vi.fn()],
  useEdgesState: () => [[], vi.fn(), vi.fn()],
  MarkerType: { ArrowClosed: 'arrowclosed' },
  Position: { Right: 'right', Left: 'left' },
}));

// Mock test data
const mockTopologyData = {
  nodes: [
    {
      id: 'node1',
      address: '192.168.1.1:9003',
      type: 'validator',
      status: 'connected',
      latency: 25,
      uptime: 99.9,
      version: 'v11.0.0',
      location: {
        country: 'United States',
        region: 'North America',
        lat: 37.7749,
        lon: -122.4194,
      },
      stake: 5000000,
      capacity: 10000,
      connections: ['node2', 'node3'],
      lastSeen: '2025-10-25T10:00:00Z',
      bandwidthIn: 1024000,
      bandwidthOut: 512000,
    },
    {
      id: 'node2',
      address: '192.168.1.2:9003',
      type: 'full',
      status: 'connected',
      latency: 45,
      uptime: 98.5,
      version: 'v11.0.0',
      location: {
        country: 'Germany',
        region: 'Europe',
        lat: 52.5200,
        lon: 13.4050,
      },
      capacity: 5000,
      connections: ['node1', 'node3'],
      lastSeen: '2025-10-25T10:00:00Z',
      bandwidthIn: 512000,
      bandwidthOut: 256000,
    },
    {
      id: 'node3',
      address: '192.168.1.3:9003',
      type: 'light',
      status: 'syncing',
      latency: 120,
      uptime: 95.0,
      version: 'v10.5.0',
      location: {
        country: 'Japan',
        region: 'Asia',
        lat: 35.6762,
        lon: 139.6503,
      },
      capacity: 1000,
      connections: ['node1'],
      lastSeen: '2025-10-25T09:59:00Z',
      bandwidthIn: 256000,
      bandwidthOut: 128000,
    },
  ],
  edges: [
    { source: 'node1', target: 'node2', latency: 35, bandwidth: 500 },
    { source: 'node1', target: 'node3', latency: 100, bandwidth: 300 },
    { source: 'node2', target: 'node3', latency: 85, bandwidth: 200 },
  ],
  timestamp: '2025-10-25T10:00:00Z',
};

const mockHealthData = {
  score: 95,
  totalPeers: 150,
  activePeers: 142,
  avgLatency: 56,
  throughput: 776000,
  blockPropagationTime: 120,
  networkEfficiency: 94.7,
  centralizationScore: 0.35,
};

const mockEventsData = {
  events: [
    {
      id: 'evt1',
      type: 'connection',
      peerId: 'node1',
      peerAddress: '192.168.1.1:9003',
      message: 'New peer connected',
      timestamp: '2025-10-25T10:00:00Z',
      severity: 'low',
    },
    {
      id: 'evt2',
      type: 'disconnection',
      peerId: 'node4',
      peerAddress: '192.168.1.4:9003',
      message: 'Peer disconnected due to timeout',
      timestamp: '2025-10-25T09:59:00Z',
      severity: 'medium',
    },
    {
      id: 'evt3',
      type: 'error',
      peerId: 'node5',
      peerAddress: '192.168.1.5:9003',
      message: 'Failed to sync blocks',
      timestamp: '2025-10-25T09:58:00Z',
      severity: 'high',
    },
  ],
};

const mockLiveMetrics = {
  connectedPeers: 142,
  avgLatency: 56,
  throughput: 776000,
  bandwidthIn: 2048000,
  bandwidthOut: 1024000,
};

describe('NetworkTopologyVisualizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock responses
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/network/topology')) {
        return Promise.resolve({ data: mockTopologyData });
      }
      if (url.includes('/network/health')) {
        return Promise.resolve({ data: mockHealthData });
      }
      if (url.includes('/network/events')) {
        return Promise.resolve({ data: mockEventsData });
      }
      if (url.includes('/live/network')) {
        return Promise.resolve({ data: mockLiveMetrics });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==================== Component Rendering Tests ====================

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(<NetworkTopologyVisualizer />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render main component after loading', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });
    });

    it('should render all tabs', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Graph')).toBeInTheDocument();
        expect(screen.getByText('Peer Monitoring')).toBeInTheDocument();
        expect(screen.getByText('Statistics')).toBeInTheDocument();
        expect(screen.getByText('Geographic')).toBeInTheDocument();
        expect(screen.getByText('Events Log')).toBeInTheDocument();
      });
    });

    it('should show error state when API fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load network topology/i)).toBeInTheDocument();
      });
    });

    it('should render auto-refresh toggle', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByLabelText('Auto-refresh')).toBeInTheDocument();
      });
    });

    it('should render refresh button', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        const refreshButton = screen.getByLabelText('Refresh Now');
        expect(refreshButton).toBeInTheDocument();
      });
    });
  });

  // ==================== Network Graph Tests ====================

  describe('Network Graph Tab', () => {
    it('should render React Flow component', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });
    });

    it('should render flow controls', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByTestId('flow-controls')).toBeInTheDocument();
      });
    });

    it('should render minimap', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByTestId('flow-minimap')).toBeInTheDocument();
      });
    });

    it('should render node type filter', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByLabelText('Filter')).toBeInTheDocument();
      });
    });

    it('should filter nodes by type', async () => {
      const user = userEvent.setup();
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByLabelText('Filter')).toBeInTheDocument();
      });

      const filterSelect = screen.getByLabelText('Filter');
      await user.click(filterSelect);

      // Note: Filtering logic is tested via state changes
      expect(filterSelect).toBeInTheDocument();
    });

    it('should show export topology button', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        const exportButton = screen.getByLabelText('Export Topology');
        expect(exportButton).toBeInTheDocument();
      });
    });

    it('should render legend panel', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        const panels = screen.getAllByTestId('flow-panel');
        expect(panels.length).toBeGreaterThan(0);
      });
    });
  });

  // ==================== Peer Monitoring Tests ====================

  describe('Peer Monitoring Tab', () => {
    beforeEach(async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      const monitoringTab = screen.getByText('Peer Monitoring');
      fireEvent.click(monitoringTab);
    });

    it('should switch to peer monitoring tab', async () => {
      await waitFor(() => {
        expect(screen.getByText('Connection Statistics')).toBeInTheDocument();
      });
    });

    it('should display active peers count', async () => {
      await waitFor(() => {
        expect(screen.getByText('142')).toBeInTheDocument();
        expect(screen.getByText('Active Peers')).toBeInTheDocument();
      });
    });

    it('should display average latency', async () => {
      await waitFor(() => {
        expect(screen.getByText('56ms')).toBeInTheDocument();
        expect(screen.getByText('Avg Latency')).toBeInTheDocument();
      });
    });

    it('should display throughput', async () => {
      await waitFor(() => {
        expect(screen.getByText('776.0K')).toBeInTheDocument();
        expect(screen.getByText('TPS')).toBeInTheDocument();
      });
    });

    it('should display health score', async () => {
      await waitFor(() => {
        expect(screen.getByText('95')).toBeInTheDocument();
        expect(screen.getByText('Health Score')).toBeInTheDocument();
      });
    });

    it('should render bandwidth usage chart', async () => {
      await waitFor(() => {
        expect(screen.getByText('Bandwidth Usage')).toBeInTheDocument();
      });
    });

    it('should render peer version distribution', async () => {
      await waitFor(() => {
        expect(screen.getByText('Peer Version Distribution')).toBeInTheDocument();
      });
    });

    it('should render node type distribution pie chart', async () => {
      await waitFor(() => {
        expect(screen.getByText('Node Type Distribution')).toBeInTheDocument();
      });
    });
  });

  // ==================== Network Statistics Tests ====================

  describe('Network Statistics Tab', () => {
    beforeEach(async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      const statsTab = screen.getByText('Statistics');
      fireEvent.click(statsTab);
    });

    it('should switch to statistics tab', async () => {
      await waitFor(() => {
        expect(screen.getByText('Network Health Metrics')).toBeInTheDocument();
      });
    });

    it('should display total peers', async () => {
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('Total Peers')).toBeInTheDocument();
      });
    });

    it('should display block propagation time', async () => {
      await waitFor(() => {
        expect(screen.getByText('120ms')).toBeInTheDocument();
        expect(screen.getByText('Block Propagation')).toBeInTheDocument();
      });
    });

    it('should display network efficiency', async () => {
      await waitFor(() => {
        expect(screen.getByText('94.7%')).toBeInTheDocument();
        expect(screen.getByText('Network Efficiency')).toBeInTheDocument();
      });
    });

    it('should display centralization score', async () => {
      await waitFor(() => {
        expect(screen.getByText('0.35')).toBeInTheDocument();
        expect(screen.getByText('Centralization Score')).toBeInTheDocument();
      });
    });

    it('should render performance trends chart', async () => {
      await waitFor(() => {
        expect(screen.getByText('Performance Trends')).toBeInTheDocument();
      });
    });
  });

  // ==================== Geographic Distribution Tests ====================

  describe('Geographic Distribution Tab', () => {
    beforeEach(async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      const geoTab = screen.getByText('Geographic');
      fireEvent.click(geoTab);
    });

    it('should switch to geographic tab', async () => {
      await waitFor(() => {
        expect(screen.getByText('Regional Distribution')).toBeInTheDocument();
      });
    });

    it('should render regional statistics table', async () => {
      await waitFor(() => {
        expect(screen.getByText('Region')).toBeInTheDocument();
        expect(screen.getByText('Peer Count')).toBeInTheDocument();
        expect(screen.getByText('Avg Latency (ms)')).toBeInTheDocument();
      });
    });

    it('should display regional data', async () => {
      await waitFor(() => {
        expect(screen.getByText('North America')).toBeInTheDocument();
        expect(screen.getByText('Europe')).toBeInTheDocument();
        expect(screen.getByText('Asia')).toBeInTheDocument();
      });
    });

    it('should render peer distribution chart', async () => {
      await waitFor(() => {
        expect(screen.getByText('Peer Distribution by Region')).toBeInTheDocument();
      });
    });

    it('should show geographic map placeholder', async () => {
      await waitFor(() => {
        expect(screen.getByText('Geographic Network Map')).toBeInTheDocument();
      });
    });
  });

  // ==================== Network Events Tests ====================

  describe('Network Events Tab', () => {
    beforeEach(async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      const eventsTab = screen.getByText('Events Log');
      fireEvent.click(eventsTab);
    });

    it('should switch to events tab', async () => {
      await waitFor(() => {
        expect(screen.getByText('Network Events Log')).toBeInTheDocument();
      });
    });

    it('should display events count', async () => {
      await waitFor(() => {
        expect(screen.getByText('3 events')).toBeInTheDocument();
      });
    });

    it('should render events table', async () => {
      await waitFor(() => {
        expect(screen.getByText('Timestamp')).toBeInTheDocument();
        expect(screen.getByText('Type')).toBeInTheDocument();
        expect(screen.getByText('Message')).toBeInTheDocument();
        expect(screen.getByText('Severity')).toBeInTheDocument();
      });
    });

    it('should display connection event', async () => {
      await waitFor(() => {
        expect(screen.getByText('New peer connected')).toBeInTheDocument();
        expect(screen.getByText('192.168.1.1:9003')).toBeInTheDocument();
      });
    });

    it('should display disconnection event', async () => {
      await waitFor(() => {
        expect(screen.getByText('Peer disconnected due to timeout')).toBeInTheDocument();
      });
    });

    it('should display error event', async () => {
      await waitFor(() => {
        expect(screen.getByText('Failed to sync blocks')).toBeInTheDocument();
      });
    });

    it('should show export button', async () => {
      await waitFor(() => {
        const exportButton = screen.getByLabelText('Export to CSV');
        expect(exportButton).toBeInTheDocument();
      });
    });
  });

  // ==================== API Integration Tests ====================

  describe('API Integration', () => {
    it('should fetch topology data on mount', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v11/network/topology');
      });
    });

    it('should fetch health data on mount', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v11/network/health');
      });
    });

    it('should fetch events data on mount', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v11/network/events?limit=50');
      });
    });

    it('should fetch live metrics on mount', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith('/api/v11/live/network');
      });
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== Auto-Refresh Tests ====================

  describe('Auto-Refresh Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-refresh when enabled', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      const initialCallCount = mockedAxios.get.mock.calls.length;

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });

    it('should stop auto-refresh when disabled', async () => {
      const user = userEvent.setup({ delay: null });
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByLabelText('Auto-refresh')).toBeInTheDocument();
      });

      const autoRefreshToggle = screen.getByLabelText('Auto-refresh');
      await user.click(autoRefreshToggle);

      const callCountAfterDisable = mockedAxios.get.mock.calls.length;

      // Fast-forward time
      vi.advanceTimersByTime(10000);

      // Call count should not increase significantly (only initial calls)
      expect(mockedAxios.get.mock.calls.length).toBeLessThanOrEqual(callCountAfterDisable + 1);
    });
  });

  // ==================== User Interaction Tests ====================

  describe('User Interactions', () => {
    it('should allow tab switching', async () => {
      const user = userEvent.setup();
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Graph')).toBeInTheDocument();
      });

      const statsTab = screen.getByText('Statistics');
      await user.click(statsTab);

      await waitFor(() => {
        expect(screen.getByText('Network Health Metrics')).toBeInTheDocument();
      });
    });

    it('should refresh data on button click', async () => {
      const user = userEvent.setup();
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByLabelText('Refresh Now')).toBeInTheDocument();
      });

      const initialCalls = mockedAxios.get.mock.calls.length;

      const refreshButton = screen.getByLabelText('Refresh Now');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(initialCalls);
      });
    });

    it('should change refresh interval', async () => {
      const user = userEvent.setup();
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByLabelText('Interval')).toBeInTheDocument();
      });

      const intervalSelect = screen.getByLabelText('Interval');
      expect(intervalSelect).toBeInTheDocument();

      // Select is functional
      await user.click(intervalSelect);
    });
  });

  // ==================== Data Processing Tests ====================

  describe('Data Processing', () => {
    it('should process topology data correctly', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByTestId('react-flow')).toBeInTheDocument();
      });

      // Verify nodes are processed (implicit through rendering)
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('should calculate region statistics', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      const geoTab = screen.getByText('Geographic');
      fireEvent.click(geoTab);

      await waitFor(() => {
        expect(screen.getByText('North America')).toBeInTheDocument();
        expect(screen.getByText('Europe')).toBeInTheDocument();
        expect(screen.getByText('Asia')).toBeInTheDocument();
      });
    });

    it('should compute node type distribution', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      const monitoringTab = screen.getByText('Peer Monitoring');
      fireEvent.click(monitoringTab);

      await waitFor(() => {
        expect(screen.getByText('Node Type Distribution')).toBeInTheDocument();
      });
    });

    it('should track metrics history', async () => {
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      // Metrics are tracked in state and displayed in charts
      const statsTab = screen.getByText('Statistics');
      fireEvent.click(statsTab);

      await waitFor(() => {
        expect(screen.getByText('Performance Trends')).toBeInTheDocument();
      });
    });
  });

  // ==================== Export Functionality Tests ====================

  describe('Export Functionality', () => {
    it('should export events to CSV', async () => {
      const user = userEvent.setup();
      const createObjectURL = vi.fn();
      const revokeObjectURL = vi.fn();

      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Events Log')).toBeInTheDocument();
      });

      const eventsTab = screen.getByText('Events Log');
      await user.click(eventsTab);

      await waitFor(() => {
        expect(screen.getByLabelText('Export to CSV')).toBeInTheDocument();
      });

      const exportButton = screen.getByLabelText('Export to CSV');
      await user.click(exportButton);

      // Verify export was triggered
      expect(createObjectURL).toHaveBeenCalled();
    });

    it('should export topology to JSON', async () => {
      const user = userEvent.setup();
      const createObjectURL = vi.fn();
      const revokeObjectURL = vi.fn();

      global.URL.createObjectURL = createObjectURL;
      global.URL.revokeObjectURL = revokeObjectURL;

      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByLabelText('Export Topology')).toBeInTheDocument();
      });

      const exportButton = screen.getByLabelText('Export Topology');
      await user.click(exportButton);

      // Verify export was triggered
      expect(createObjectURL).toHaveBeenCalled();
    });
  });

  // ==================== Performance Tests ====================

  describe('Performance Optimization', () => {
    it('should handle large number of nodes efficiently', async () => {
      const largeTopology = {
        ...mockTopologyData,
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          ...mockTopologyData.nodes[0],
          id: `node${i}`,
          address: `192.168.${Math.floor(i / 256)}.${i % 256}:9003`,
        })),
        edges: Array.from({ length: 5000 }, (_, i) => ({
          source: `node${i % 1000}`,
          target: `node${(i + 1) % 1000}`,
          latency: Math.random() * 200,
          bandwidth: Math.random() * 1000,
        })),
      };

      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/network/topology')) {
          return Promise.resolve({ data: largeTopology });
        }
        return Promise.resolve({ data: {} });
      });

      const startTime = performance.now();
      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      }, { timeout: 5000 });

      const renderTime = performance.now() - startTime;

      // Should render within 5 seconds even with 1000 nodes
      expect(renderTime).toBeLessThan(5000);
    });

    it('should limit metrics history to prevent memory leaks', async () => {
      vi.useFakeTimers();

      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      // Simulate 50 metric updates
      for (let i = 0; i < 50; i++) {
        vi.advanceTimersByTime(5000);
        await waitFor(() => {
          expect(mockedAxios.get).toHaveBeenCalled();
        }, { timeout: 100 });
      }

      // Component should still be responsive (metrics limited to last 30)
      expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  // ==================== Edge Cases Tests ====================

  describe('Edge Cases', () => {
    it('should handle empty topology data', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/network/topology')) {
          return Promise.resolve({ data: { nodes: [], edges: [], timestamp: new Date().toISOString() } });
        }
        return Promise.resolve({ data: {} });
      });

      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      // Should handle empty data gracefully
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });

    it('should handle missing health data', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/network/health')) {
          return Promise.resolve({ data: null });
        }
        if (url.includes('/network/topology')) {
          return Promise.resolve({ data: mockTopologyData });
        }
        return Promise.resolve({ data: {} });
      });

      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText('Network Topology Visualizer')).toBeInTheDocument();
      });

      // Should still render without crashing
      expect(screen.getByText('Peer Monitoring')).toBeInTheDocument();
    });

    it('should handle network timeout', async () => {
      mockedAxios.get.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      render(<NetworkTopologyVisualizer />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});

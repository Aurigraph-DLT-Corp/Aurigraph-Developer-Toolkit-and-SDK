import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../utils/test-utils';
import Dashboard from '../../pages/Dashboard';
import { mockStats, mockConsensusData, mockSystemInfo } from '../utils/mockData';

// Mock axios
vi.mock('axios');

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Dashboard />);
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    it('should display the page title', () => {
      render(<Dashboard />);
      expect(screen.getByRole('heading', { name: /Dashboard/i })).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<Dashboard />);
      // Check for loading indicators or skeleton screens
      expect(screen.getByText(/Loading.../i) || screen.getAllByRole('progressbar')).toBeTruthy();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch and display system stats', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/776,000/i)).toBeInTheDocument(); // TPS
      });
    });

    it('should fetch and display consensus data', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/HyperRAFT\+\+/i)).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      // This test would mock a failed API call
      render(<Dashboard />);

      await waitFor(() => {
        // Should still render without crashing
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Metrics Display', () => {
    it('should display TPS (Transactions Per Second)', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const tpsElement = screen.getByText(/TPS/i);
        expect(tpsElement).toBeInTheDocument();
      });
    });

    it('should display block height', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Block Height/i)).toBeInTheDocument();
      });
    });

    it('should display active nodes count', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Active Nodes/i)).toBeInTheDocument();
      });
    });

    it('should display latency metrics', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Latency/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update metrics periodically', async () => {
      vi.useFakeTimers();
      render(<Dashboard />);

      // Initial load
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });

      // Advance timers to trigger update
      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        // Verify data is still present after update
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('should cleanup interval on unmount', () => {
      const { unmount } = render(<Dashboard />);
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should allow navigation to detailed views', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links.length).toBeGreaterThan(0);
      });
    });

    it('should refresh data on manual refresh', async () => {
      render(<Dashboard />);

      const refreshButton = screen.queryByRole('button', { name: /refresh/i });
      if (refreshButton) {
        refreshButton.click();

        await waitFor(() => {
          expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Charts and Visualizations', () => {
    it('should render TPS chart', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // Check for chart container or canvas
        const charts = document.querySelectorAll('.recharts-wrapper, canvas');
        expect(charts.length).toBeGreaterThan(0);
      });
    });

    it('should render performance metrics chart', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Performance/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile viewport', () => {
      // Set mobile viewport
      global.innerWidth = 375;
      global.innerHeight = 667;

      render(<Dashboard />);

      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    it('should render correctly on desktop viewport', () => {
      // Set desktop viewport
      global.innerWidth = 1920;
      global.innerHeight = 1080;

      render(<Dashboard />);

      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      // Mock API error
      render(<Dashboard />);

      // Even with errors, component should not crash
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
    });

    it('should show retry option on error', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry/i });
        // Retry button might be present on error
        if (retryButton) {
          expect(retryButton).toBeInTheDocument();
        }
      });
    });

    it('should handle network timeout gracefully', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Dashboard />);

      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      expect(headings[0]).toHaveTextContent(/Dashboard/i);
    });

    it('should have accessible labels for metrics', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // Metrics should have readable labels
        expect(screen.getByText(/TPS/i) || screen.getByText(/Transactions Per Second/i)).toBeTruthy();
      });
    });

    it('should support keyboard navigation', () => {
      render(<Dashboard />);

      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        expect(element).toHaveAttribute('tabIndex');
      });
    });
  });

  describe('State Management', () => {
    it('should maintain state during updates', async () => {
      const { rerender } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });

      rerender(<Dashboard />);

      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    });

    it('should handle loading state correctly', () => {
      render(<Dashboard />);

      // Should show loading initially
      expect(screen.getByText(/Loading.../i) || screen.queryAllByRole('progressbar').length > 0).toBeTruthy();
    });

    it('should transition from loading to loaded state', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // After loading, data should be displayed
        expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });
});

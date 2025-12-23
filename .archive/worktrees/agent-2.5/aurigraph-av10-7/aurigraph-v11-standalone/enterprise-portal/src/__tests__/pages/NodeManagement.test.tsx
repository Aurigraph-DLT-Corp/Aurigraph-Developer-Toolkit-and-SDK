import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import NodeManagement from '../../pages/NodeManagement';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock data
const mockValidatorsResponse = {
  validators: [
    {
      id: 'val-1',
      name: 'Validator 1',
      type: 'validator',
      status: 'online',
      address: '192.168.1.100',
      port: 9003,
      publicKey: '0x1234567890abcdef',
      stake: 10000,
      votingPower: 100,
      uptime: 99.95,
      lastBlockProposed: 1234567,
      lastSeen: Date.now() - 60000,
      version: 'v11.0.0',
      isActive: true
    },
    {
      id: 'val-2',
      name: 'Validator 2',
      type: 'validator',
      status: 'online',
      address: '192.168.1.101',
      port: 9003,
      publicKey: '0xabcdef1234567890',
      stake: 15000,
      votingPower: 150,
      uptime: 98.50,
      lastBlockProposed: 1234565,
      lastSeen: Date.now() - 120000,
      version: 'v11.0.0',
      isActive: true
    },
    {
      id: 'bus-1',
      name: 'Business Node 1',
      type: 'business',
      status: 'online',
      address: '192.168.1.102',
      port: 9003,
      publicKey: '0xbusiness123456',
      stake: 5000,
      votingPower: 0,
      uptime: 97.80,
      lastBlockProposed: 0,
      lastSeen: Date.now() - 30000,
      version: 'v11.0.0',
      isActive: true
    }
  ],
  totalValidators: 3,
  activeValidators: 3,
  totalStake: 30000,
  averageUptime: 98.75
};

const mockLiveValidatorsResponse = {
  validators: [
    {
      validatorId: 'val-1',
      currentTPS: 500000,
      proposedBlocks: 1000,
      votedBlocks: 5000,
      missedBlocks: 2,
      performance: 99.8
    },
    {
      validatorId: 'val-2',
      currentTPS: 480000,
      proposedBlocks: 950,
      votedBlocks: 4800,
      missedBlocks: 0,
      performance: 100.0
    }
  ]
};

describe('NodeManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup default mock implementations
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/blockchain/validators')) {
        return Promise.resolve({ data: mockValidatorsResponse });
      }
      if (url.includes('/live/validators')) {
        return Promise.resolve({ data: mockLiveValidatorsResponse });
      }
      return Promise.reject(new Error('Not found'));
    });

    mockedAxios.post.mockResolvedValue({ data: { success: true } });
    mockedAxios.patch.mockResolvedValue({ data: { success: true } });
    mockedAxios.delete.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Node Management/i)).toBeInTheDocument();
      });
    });

    it('should display page title', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Node Management/i })).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<NodeManagement />);

      expect(screen.getByText(/Loading validators.../i)).toBeInTheDocument();
    });

    it('should render refresh button', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });
    });

    it('should render add node button', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Node/i })).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch validators on mount', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/blockchain/validators')
        );
      });
    });

    it('should fetch live validator stats on mount', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/live/validators')
        );
      });
    });

    it('should make parallel API calls', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });

    it('should display fetched validator data', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
        expect(screen.getByText('Validator 2')).toBeInTheDocument();
      });
    });
  });

  describe('Stats Cards', () => {
    it('should display total nodes count', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Total Nodes')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should display online nodes count', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/^Online$/)).toBeInTheDocument();
      });
    });

    it('should display validators count', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validators')).toBeInTheDocument();
      });
    });

    it('should display total stake', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/30,000 AUR/i)).toBeInTheDocument();
      });
    });

    it('should display average uptime', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Average Uptime/i)).toBeInTheDocument();
        expect(screen.getByText(/98.75%/i)).toBeInTheDocument();
      });
    });

    it('should display total voting power', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Total Voting Power/i)).toBeInTheDocument();
        expect(screen.getByText(/250/i)).toBeInTheDocument();
      });
    });

    it('should display business nodes count', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Business Nodes/i)).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs', () => {
    it('should render all tabs', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /All Nodes/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /^Validators$/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Business Nodes/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Performance/i })).toBeInTheDocument();
      });
    });

    it('should show all nodes by default', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
        expect(screen.getByText('Validator 2')).toBeInTheDocument();
        expect(screen.getByText('Business Node 1')).toBeInTheDocument();
      });
    });

    it('should filter validators when Validators tab is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
      });

      const validatorsTab = screen.getByRole('tab', { name: /^Validators$/i });
      await user.click(validatorsTab);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
        expect(screen.getByText('Validator 2')).toBeInTheDocument();
      });
    });

    it('should filter business nodes when Business Nodes tab is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Business Node 1')).toBeInTheDocument();
      });

      const businessTab = screen.getByRole('tab', { name: /Business Nodes/i });
      await user.click(businessTab);

      await waitFor(() => {
        expect(screen.getByText('Business Node 1')).toBeInTheDocument();
      });
    });

    it('should show performance metrics when Performance tab is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
      });

      const performanceTab = screen.getByRole('tab', { name: /Performance/i });
      await user.click(performanceTab);

      await waitFor(() => {
        expect(screen.getByText(/Validator Performance Metrics/i)).toBeInTheDocument();
        expect(screen.getByText(/Current TPS/i)).toBeInTheDocument();
      });
    });
  });

  describe('Node Table', () => {
    it('should display node names', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
        expect(screen.getByText('Validator 2')).toBeInTheDocument();
      });
    });

    it('should display node types with chips', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        const typeChips = screen.getAllByText(/validator|business/i);
        expect(typeChips.length).toBeGreaterThan(0);
      });
    });

    it('should display node status', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        const onlineStatuses = screen.getAllByText(/online/i);
        expect(onlineStatuses.length).toBeGreaterThan(0);
      });
    });

    it('should display node addresses and ports', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/192.168.1.100:9003/i)).toBeInTheDocument();
      });
    });

    it('should display stake amounts', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/10,000 AUR/i)).toBeInTheDocument();
      });
    });

    it('should display voting power', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/^100$/)).toBeInTheDocument();
        expect(screen.getByText(/^150$/)).toBeInTheDocument();
      });
    });

    it('should display uptime with color coding', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        const uptimeChips = screen.getAllByText(/99.95%|98.50%/i);
        expect(uptimeChips.length).toBeGreaterThan(0);
      });
    });

    it('should display node versions', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        const versionChips = screen.getAllByText(/v11.0.0/i);
        expect(versionChips.length).toBeGreaterThan(0);
      });
    });

    it('should display action buttons for each node', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        // Each node should have toggle, settings, and delete buttons
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(5); // More than just the header buttons
      });
    });
  });

  describe('Node Actions', () => {
    it('should toggle node status when toggle button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
      });

      // Find and click the first toggle button (Stop icon for online node)
      const toggleButtons = screen.getAllByRole('button', { name: /Toggle status/i });
      if (toggleButtons.length > 0) {
        await user.click(toggleButtons[0]);

        await waitFor(() => {
          expect(mockedAxios.patch).toHaveBeenCalledWith(
            expect.stringContaining('/validators/val-1/status'),
            expect.objectContaining({ status: 'offline' })
          );
        });
      }
    });

    it('should open settings dialog when settings button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
      });

      const settingsButtons = screen.getAllByRole('button', { name: /Settings/i });
      if (settingsButtons.length > 0) {
        await user.click(settingsButtons[0]);

        await waitFor(() => {
          expect(screen.getByText(/Node Details:/i)).toBeInTheDocument();
        });
      }
    });

    it('should delete node when delete button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);

        await waitFor(() => {
          expect(mockedAxios.delete).toHaveBeenCalledWith(
            expect.stringContaining('/validators/val-1')
          );
        });
      }
    });
  });

  describe('Add Node Dialog', () => {
    it('should open add node dialog when Add Node button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Node/i })).toBeInTheDocument();
      });

      const addButton = screen.getByRole('button', { name: /Add Node/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Add New Node/i)).toBeInTheDocument();
      });
    });

    it('should display node type selector in dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Node/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Add Node/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Node Type/i)).toBeInTheDocument();
      });
    });

    it('should display node name input in dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Node/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Add Node/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Node Name/i)).toBeInTheDocument();
      });
    });

    it('should display address and port inputs in dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Node/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Add Node/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Port/i)).toBeInTheDocument();
      });
    });

    it('should show stake input for validator type', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Node/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Add Node/i }));

      await waitFor(() => {
        // Default type is validator, should show stake input
        expect(screen.getByLabelText(/Stake Amount/i)).toBeInTheDocument();
      });
    });

    it('should submit add node form', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Node/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Add Node/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Node Name/i)).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/Node Name/i), 'New Validator');
      await user.type(screen.getByLabelText(/Address/i), '192.168.1.200');

      // Submit
      const submitButton = screen.getByRole('button', { name: /^Add Node$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/validators'),
          expect.objectContaining({ name: 'New Validator' })
        );
      });
    });

    it('should close dialog on cancel', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Node/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Add Node/i }));

      await waitFor(() => {
        expect(screen.getByText(/Add New Node/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/Add New Node/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should display performance table on Performance tab', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Performance/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Performance/i }));

      await waitFor(() => {
        expect(screen.getByText(/Validator Performance Metrics/i)).toBeInTheDocument();
      });
    });

    it('should display TPS metrics', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Performance/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Performance/i }));

      await waitFor(() => {
        expect(screen.getByText(/500,000 TPS/i)).toBeInTheDocument();
      });
    });

    it('should display proposed blocks count', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Performance/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Performance/i }));

      await waitFor(() => {
        expect(screen.getByText('1,000')).toBeInTheDocument();
      });
    });

    it('should display performance scores', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Performance/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Performance/i }));

      await waitFor(() => {
        expect(screen.getByText(/99.8%/i) || screen.getByText(/100.0%/i)).toBeTruthy();
      });
    });

    it('should color code missed blocks', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /Performance/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('tab', { name: /Performance/i }));

      await waitFor(() => {
        // Should have chips for missed blocks
        const chips = screen.getAllByRole('status');
        expect(chips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should set up 5-second polling interval', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument();
      });

      const initialCalls = mockedAxios.get.mock.calls.length;

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(initialCalls);
      });
    });

    it('should cleanup interval on unmount', async () => {
      const { unmount } = render(<NodeManagement />);
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      await waitFor(() => {
        expect(screen.getByText(/Node Management/i)).toBeInTheDocument();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should refresh data when Refresh button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });

      const initialCalls = mockedAxios.get.mock.calls.length;

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(mockedAxios.get.mock.calls.length).toBeGreaterThan(initialCalls);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<NodeManagement />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to fetch validators:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('should display error message on fetch failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument();
      });
    });

    it('should allow closing error alert', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/API Error/i)).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText(/API Error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Time Formatting', () => {
    it('should format last seen timestamps', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        // Should display relative time (e.g., "1m ago", "2m ago")
        const timeTexts = screen.getAllByText(/ago/i);
        expect(timeTexts.length).toBeGreaterThan(0);
      });
    });

    it('should format uptime percentages', async () => {
      render(<NodeManagement />);

      await waitFor(() => {
        expect(screen.getByText(/99.95%/i)).toBeInTheDocument();
      });
    });
  });
});

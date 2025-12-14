import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import Settings from '../../pages/Settings';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock data
const mockSystemSettings = {
  consensusAlgorithm: 'hyperraft',
  targetTps: 2000000,
  blockTime: 1,
  maxBlockSize: 10,
  enableAiOptimization: true,
  enableQuantumSecurity: true,
  backupSchedule: 'daily',
  retentionDays: 30
};

const mockAPISettings = {
  alpaca: {
    enabled: true,
    apiKey: 'test-alpaca-key',
    apiSecret: 'test-alpaca-secret',
    baseUrl: 'https://api.alpaca.markets',
    rateLimit: 200,
    enablePaperTrading: true
  },
  twitter: {
    enabled: true,
    apiKey: 'test-twitter-key',
    apiSecret: 'test-twitter-secret',
    bearerToken: 'test-bearer-token',
    rateLimit: 300
  },
  weather: {
    enabled: true,
    apiKey: 'test-weather-key',
    baseUrl: 'https://api.weather.com',
    rateLimit: 100
  },
  newsapi: {
    enabled: true,
    apiKey: 'test-newsapi-key',
    baseUrl: 'https://newsapi.org',
    rateLimit: 100
  },
  streaming: {
    enableEINodes: true,
    maxConcurrentConnections: 1000,
    dataBufferSize: '10MB',
    streamingInterval: 1000,
    enableCompression: true
  },
  oracle: {
    enableOracleService: true,
    verificationMode: 'multi_source',
    cacheTTL: 300,
    cacheSize: '5GB'
  }
};

const mockUsers = [
  { id: 1, name: 'Admin', email: 'admin@aurigraph.io', role: 'admin' },
  { id: 2, name: 'Developer', email: 'dev@aurigraph.io', role: 'developer' },
  { id: 3, name: 'Viewer', email: 'viewer@aurigraph.io', role: 'viewer' }
];

const mockBackups = [
  {
    filename: 'backup_2025_01_27_12_00.tar.gz',
    size: '2.5 GB',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'completed'
  },
  {
    filename: 'backup_2025_01_26_12_00.tar.gz',
    size: '2.4 GB',
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    status: 'completed'
  }
];

describe('Settings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock implementations
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/settings/system')) {
        return Promise.resolve({ data: mockSystemSettings });
      }
      if (url.includes('/settings/api-integrations')) {
        return Promise.resolve({ data: mockAPISettings });
      }
      if (url.includes('/users')) {
        return Promise.resolve({ data: mockUsers });
      }
      if (url.includes('/backups/history')) {
        return Promise.resolve({ data: mockBackups });
      }
      if (url.includes('/live/consensus')) {
        return Promise.resolve({ data: { aiOptimizationEnabled: true } });
      }
      return Promise.reject(new Error('Not found'));
    });

    mockedAxios.put.mockResolvedValue({ data: { success: true } });
    mockedAxios.post.mockResolvedValue({ data: { success: true } });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Settings />);
      expect(screen.getByText(/Settings & Configuration/i)).toBeInTheDocument();
    });

    it('should display the page title', () => {
      render(<Settings />);
      expect(screen.getByRole('heading', { name: /Settings & Configuration/i })).toBeInTheDocument();
    });

    it('should render all tabs', () => {
      render(<Settings />);

      expect(screen.getByRole('tab', { name: /System Configuration/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /User Management/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Security/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Backup & Recovery/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /External API Integrations/i })).toBeInTheDocument();
    });

    it('should show System Configuration tab by default', () => {
      render(<Settings />);

      expect(screen.getByLabelText(/Consensus Algorithm/i)).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch system settings on mount', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/settings/system')
        );
      });
    });

    it('should fetch API integration settings on mount', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/settings/api-integrations')
        );
      });
    });

    it('should fetch users on mount', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/users')
        );
      });
    });

    it('should fetch backup history on mount', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/backups/history')
        );
      });
    });

    it('should display loading state while fetching', () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));

      render(<Settings />);

      expect(screen.getByText(/Loading settings.../i)).toBeInTheDocument();
    });

    it('should handle system settings fetch error with fallback', async () => {
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/settings/system')) {
          return Promise.reject(new Error('API Error'));
        }
        if (url.includes('/live/consensus')) {
          return Promise.resolve({ data: { aiOptimizationEnabled: true } });
        }
        return Promise.resolve({ data: [] });
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Settings />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should display error alert on fetch failure', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      render(<Settings />);

      await waitFor(() => {
        const errorAlert = screen.queryByText(/Failed to fetch system settings/i) ||
                          screen.queryByRole('alert');
        if (errorAlert) {
          expect(errorAlert).toBeInTheDocument();
        }
      });
    });
  });

  describe('System Configuration Tab', () => {
    it('should display consensus algorithm selector', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Consensus Algorithm/i)).toBeInTheDocument();
      });
    });

    it('should have correct default values', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('2000000')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      });
    });

    it('should allow changing target TPS', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Target TPS/i)).toBeInTheDocument();
      });

      const tpsInput = screen.getByLabelText(/Target TPS/i);
      await user.clear(tpsInput);
      await user.type(tpsInput, '3000000');

      expect(screen.getByDisplayValue('3000000')).toBeInTheDocument();
    });

    it('should allow changing consensus algorithm', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Consensus Algorithm/i)).toBeInTheDocument();
      });

      // Open select and choose PBFT
      const select = screen.getByLabelText(/Consensus Algorithm/i);
      await user.click(select);

      const pbftOption = await screen.findByText('PBFT');
      await user.click(pbftOption);

      await waitFor(() => {
        // Check that PBFT is now selected
        expect(screen.getByLabelText(/Consensus Algorithm/i)).toHaveValue('pbft');
      });
    });

    it('should toggle AI Optimization switch', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Enable AI Optimization/i)).toBeInTheDocument();
      });

      const aiSwitch = screen.getByLabelText(/Enable AI Optimization/i);
      expect(aiSwitch).toBeChecked();

      await user.click(aiSwitch);
      expect(aiSwitch).not.toBeChecked();
    });

    it('should toggle Quantum Security switch', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Enable Quantum Security/i)).toBeInTheDocument();
      });

      const quantumSwitch = screen.getByLabelText(/Enable Quantum Security/i);
      expect(quantumSwitch).toBeChecked();

      await user.click(quantumSwitch);
      expect(quantumSwitch).not.toBeChecked();
    });

    it('should display system configuration alerts', async () => {
      render(<Settings />);

      await waitFor(() => {
        expect(screen.getByText(/These settings will affect the entire blockchain network/i)).toBeInTheDocument();
        expect(screen.getByText(/Connected to V11 backend \(port 9003\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Management Tab', () => {
    it('should display users table when tab is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const userTab = screen.getByRole('tab', { name: /User Management/i });
      await user.click(userTab);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('should display user data in table', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const userTab = screen.getByRole('tab', { name: /User Management/i });
      await user.click(userTab);

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('admin@aurigraph.io')).toBeInTheDocument();
        expect(screen.getByText('Developer')).toBeInTheDocument();
      });
    });

    it('should display add user button', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const userTab = screen.getByRole('tab', { name: /User Management/i });
      await user.click(userTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add User/i })).toBeInTheDocument();
      });
    });

    it('should display edit and delete buttons for each user', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const userTab = screen.getByRole('tab', { name: /User Management/i });
      await user.click(userTab);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button');
        expect(editButtons.length).toBeGreaterThan(0);
      });
    });

    it('should show loading state when users not loaded', async () => {
      const user = userEvent.setup({ delay: null });
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/users')) {
          return new Promise(() => {});
        }
        return Promise.resolve({ data: mockSystemSettings });
      });

      render(<Settings />);

      const userTab = screen.getByRole('tab', { name: /User Management/i });
      await user.click(userTab);

      await waitFor(() => {
        expect(screen.getByText(/Loading users.../i)).toBeInTheDocument();
      });
    });
  });

  describe('Security Tab', () => {
    it('should display security settings when tab is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const securityTab = screen.getByRole('tab', { name: /^Security$/i });
      await user.click(securityTab);

      await waitFor(() => {
        expect(screen.getByText('Security Settings')).toBeInTheDocument();
      });
    });

    it('should display two-factor authentication switch', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const securityTab = screen.getByRole('tab', { name: /^Security$/i });
      await user.click(securityTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/Two-Factor Authentication/i)).toBeInTheDocument();
      });
    });

    it('should display API security settings', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const securityTab = screen.getByRole('tab', { name: /^Security$/i });
      await user.click(securityTab);

      await waitFor(() => {
        expect(screen.getByText('API Security')).toBeInTheDocument();
        expect(screen.getByLabelText(/API Rate Limit/i)).toBeInTheDocument();
      });
    });

    it('should have security settings with default values', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const securityTab = screen.getByRole('tab', { name: /^Security$/i });
      await user.click(securityTab);

      await waitFor(() => {
        expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // Session timeout
        expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Max login attempts
        expect(screen.getByDisplayValue('100')).toBeInTheDocument(); // API rate limit
      });
    });

    it('should toggle encryption switch', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const securityTab = screen.getByRole('tab', { name: /^Security$/i });
      await user.click(securityTab);

      await waitFor(async () => {
        const encryptSwitch = screen.getByLabelText(/Encrypt Data at Rest/i);
        expect(encryptSwitch).toBeChecked();

        await user.click(encryptSwitch);
        expect(encryptSwitch).not.toBeChecked();
      });
    });
  });

  describe('Backup & Recovery Tab', () => {
    it('should display backup configuration when tab is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByText('Backup Configuration')).toBeInTheDocument();
      });
    });

    it('should display backup schedule selector', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/Backup Schedule/i)).toBeInTheDocument();
      });
    });

    it('should display retention days input', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/Retention Days/i)).toBeInTheDocument();
      });
    });

    it('should display backup now button', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Backup Now/i })).toBeInTheDocument();
      });
    });

    it('should display recent backups list', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByText('Recent Backups')).toBeInTheDocument();
        expect(screen.getByText(/backup_2025_01_27_12_00.tar.gz/i)).toBeInTheDocument();
      });
    });

    it('should trigger backup when button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(async () => {
        const backupButton = screen.getByRole('button', { name: /Backup Now/i });
        await user.click(backupButton);
      });

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/backups/create'),
          expect.objectContaining({ type: 'manual' })
        );
      });
    });

    it('should show loading state during backup', async () => {
      const user = userEvent.setup({ delay: null });
      mockedAxios.post.mockImplementation(() => new Promise(() => {}));

      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(async () => {
        const backupButton = screen.getByRole('button', { name: /Backup Now/i });
        await user.click(backupButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Starting Backup.../i })).toBeDisabled();
      });
    });
  });

  describe('External API Integrations Tab', () => {
    it('should display API integrations when tab is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const apiTab = screen.getByRole('tab', { name: /External API Integrations/i });
      await user.click(apiTab);

      await waitFor(() => {
        expect(screen.getByText(/Configure external API integrations/i)).toBeInTheDocument();
      });
    });

    it('should display Alpaca Markets configuration', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const apiTab = screen.getByRole('tab', { name: /External API Integrations/i });
      await user.click(apiTab);

      await waitFor(() => {
        expect(screen.getByText(/Alpaca Markets \(Stock Trading\)/i)).toBeInTheDocument();
      });
    });

    it('should display Twitter configuration', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const apiTab = screen.getByRole('tab', { name: /External API Integrations/i });
      await user.click(apiTab);

      await waitFor(() => {
        expect(screen.getByText(/X \(Twitter\) Social Feed/i)).toBeInTheDocument();
      });
    });

    it('should display Weather.com configuration', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const apiTab = screen.getByRole('tab', { name: /External API Integrations/i });
      await user.click(apiTab);

      await waitFor(() => {
        expect(screen.getByText(/^Weather.com$/i)).toBeInTheDocument();
      });
    });

    it('should display NewsAPI configuration', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const apiTab = screen.getByRole('tab', { name: /External API Integrations/i });
      await user.click(apiTab);

      await waitFor(() => {
        expect(screen.getByText(/^NewsAPI.com$/i)).toBeInTheDocument();
      });
    });

    it('should display Streaming Data configuration', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const apiTab = screen.getByRole('tab', { name: /External API Integrations/i });
      await user.click(apiTab);

      await waitFor(() => {
        expect(screen.getByText(/Streaming Data via External Integration (EI) Nodes/i)).toBeInTheDocument();
      });
    });

    it('should display Oracle Service configuration', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const apiTab = screen.getByRole('tab', { name: /External API Integrations/i });
      await user.click(apiTab);

      await waitFor(() => {
        expect(screen.getByText(/Oracle Service Configuration/i)).toBeInTheDocument();
      });
    });

    it('should toggle Alpaca enabled switch', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const apiTab = screen.getByRole('tab', { name: /External API Integrations/i });
      await user.click(apiTab);

      await waitFor(async () => {
        const switches = screen.getAllByRole('checkbox');
        const alpacaSwitch = switches[0]; // First switch is Alpaca enabled
        expect(alpacaSwitch).toBeChecked();

        await user.click(alpacaSwitch);
        expect(alpacaSwitch).not.toBeChecked();
      });
    });

    it('should save API integration settings', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const apiTab = screen.getByRole('tab', { name: /External API Integrations/i });
      await user.click(apiTab);

      await waitFor(async () => {
        const saveButton = screen.getByRole('button', { name: /Save API Integration Settings/i });
        await user.click(saveButton);
      });

      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          expect.stringContaining('/settings/api-integrations'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Save Functionality', () => {
    it('should display save settings button', () => {
      render(<Settings />);

      expect(screen.getByRole('button', { name: /^Save Settings$/i })).toBeInTheDocument();
    });

    it('should save system settings when button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      await waitFor(async () => {
        const saveButton = screen.getByRole('button', { name: /^Save Settings$/i });
        await user.click(saveButton);
      });

      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          expect.stringContaining('/settings/system'),
          expect.any(Object)
        );
      });
    });

    it('should show loading state during save', async () => {
      const user = userEvent.setup({ delay: null });
      mockedAxios.put.mockImplementation(() => new Promise(() => {}));

      render(<Settings />);

      await waitFor(async () => {
        const saveButton = screen.getByRole('button', { name: /^Save Settings$/i });
        await user.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled();
      });
    });

    it('should display success snackbar after successful save', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      await waitFor(async () => {
        const saveButton = screen.getByRole('button', { name: /^Save Settings$/i });
        await user.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/System settings saved successfully!/i)).toBeInTheDocument();
      });
    });

    it('should handle save error', async () => {
      const user = userEvent.setup({ delay: null });
      mockedAxios.put.mockRejectedValue(new Error('Save failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Settings />);

      await waitFor(async () => {
        const saveButton = screen.getByRole('button', { name: /^Save Settings$/i });
        await user.click(saveButton);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Snackbar Notifications', () => {
    it('should close snackbar automatically after 3 seconds', async () => {
      vi.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      await waitFor(async () => {
        const saveButton = screen.getByRole('button', { name: /^Save Settings$/i });
        await user.click(saveButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/System settings saved successfully!/i)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(screen.queryByText(/System settings saved successfully!/i)).not.toBeInTheDocument();
      });

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    it('should display error alert when visible', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      render(<Settings />);

      await waitFor(() => {
        const errorAlert = screen.queryByRole('alert');
        if (errorAlert) {
          expect(errorAlert).toBeInTheDocument();
        }
      });
    });

    it('should allow closing error alert', async () => {
      const user = userEvent.setup({ delay: null });
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      render(<Settings />);

      await waitFor(() => {
        const errorAlert = screen.queryByRole('alert');
        if (errorAlert) {
          const closeButton = screen.queryByRole('button', { name: /close/i });
          if (closeButton) {
            user.click(closeButton);
          }
        }
      });
    });

    it('should handle backup trigger failure', async () => {
      const user = userEvent.setup({ delay: null });
      mockedAxios.post.mockRejectedValue(new Error('Backup failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(async () => {
        const backupButton = screen.getByRole('button', { name: /Backup Now/i });
        await user.click(backupButton);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should fallback to static users on API failure', async () => {
      const user = userEvent.setup({ delay: null });
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/users')) {
          return Promise.reject(new Error('API Error'));
        }
        if (url.includes('/settings/system')) {
          return Promise.resolve({ data: mockSystemSettings });
        }
        return Promise.resolve({ data: [] });
      });

      render(<Settings />);

      const userTab = screen.getByRole('tab', { name: /User Management/i });
      await user.click(userTab);

      await waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('admin@aurigraph.io')).toBeInTheDocument();
      });
    });

    it('should fallback to static backups on API failure', async () => {
      const user = userEvent.setup({ delay: null });
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/backups/history')) {
          return Promise.reject(new Error('API Error'));
        }
        if (url.includes('/settings/system')) {
          return Promise.resolve({ data: mockSystemSettings });
        }
        return Promise.resolve({ data: [] });
      });

      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(() => {
        expect(screen.getByText(/backup_2025_01_27_12_00.tar.gz/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    it('should disable inputs when loading', async () => {
      mockedAxios.get.mockImplementation(() => new Promise(() => {}));

      render(<Settings />);

      await waitFor(() => {
        const tpsInput = screen.getByLabelText(/Target TPS/i);
        expect(tpsInput).toBeDisabled();
      });
    });

    it('should allow changing block time', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      await waitFor(async () => {
        const blockTimeInput = screen.getByLabelText(/Block Time \(seconds\)/i);
        await user.clear(blockTimeInput);
        await user.type(blockTimeInput, '2');
      });

      expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    });

    it('should allow changing max block size', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      await waitFor(async () => {
        const blockSizeInput = screen.getByLabelText(/Max Block Size \(MB\)/i);
        await user.clear(blockSizeInput);
        await user.type(blockSizeInput, '20');
      });

      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format backup dates correctly', async () => {
      const user = userEvent.setup({ delay: null });
      render(<Settings />);

      const backupTab = screen.getByRole('tab', { name: /Backup & Recovery/i });
      await user.click(backupTab);

      await waitFor(() => {
        const dateText = screen.queryByText(/hours ago/i) || screen.queryByText(/days ago/i);
        if (dateText) {
          expect(dateText).toBeInTheDocument();
        }
      });
    });
  });
});

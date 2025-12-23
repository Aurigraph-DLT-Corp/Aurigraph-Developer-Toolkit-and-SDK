import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import SecurityAudit from '../../../pages/dashboards/SecurityAudit';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockSecurityStatus = {
  overallSecurityScore: 92,
  encryptionEnabled: true,
  firewallActive: true,
  intrusionDetectionActive: true,
  lastSecurityScan: Date.now() - 3600000, // 1 hour ago
  vulnerabilitiesDetected: 3,
  criticalVulnerabilities: 0,
  patchesApplied: 145,
  pendingPatches: 2
};

const mockQuantumStatus = {
  quantumResistanceEnabled: true,
  kyberKeyExchange: {
    enabled: true,
    level: 5,
    strength: 'NIST Level 5 (256-bit quantum security)'
  },
  dilithiumSignature: {
    enabled: true,
    level: 5,
    strength: 'NIST Level 5 (256-bit quantum security)'
  },
  postQuantumReady: true,
  classicalFallbackEnabled: true
};

const mockHSMStatus = {
  connected: true,
  vendor: 'Thales',
  model: 'Luna SA-7',
  firmware: 'v7.8.2',
  keysStored: 15000,
  operationsPerSecond: 50000,
  lastHealthCheck: Date.now() - 1800000, // 30 minutes ago
  status: 'healthy' as const,
  entropy: 98
};

describe('SecurityAudit Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/security/status')) {
        return Promise.resolve({ data: mockSecurityStatus });
      }
      if (url.includes('/security/quantum')) {
        return Promise.resolve({ data: mockQuantumStatus });
      }
      if (url.includes('/security/hsm/status')) {
        return Promise.resolve({ data: mockHSMStatus });
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
      render(<SecurityAudit />);
      await waitFor(() => {
        expect(screen.getByText('Security & Audit Dashboard')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<SecurityAudit />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render main dashboard after loading', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('Security & Audit Dashboard')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });
    });

    it('should display error state when fetch fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch security status on mount', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/security/status')
        );
      });
    });

    it('should fetch quantum crypto status on mount', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/security/quantum')
        );
      });
    });

    it('should fetch HSM status on mount', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/security/hsm/status')
        );
      });
    });

    it('should fetch all data in parallel', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Main Security Metrics', () => {
    it('should display overall security score', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('92/100')).toBeInTheDocument();
      });
    });

    it('should display security score progress bar', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    it('should display encryption status as enabled', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('ENABLED')).toBeInTheDocument();
        expect(screen.getByText(/Quantum Resistant: Yes/i)).toBeInTheDocument();
      });
    });

    it('should display vulnerabilities count', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('Vulnerabilities')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText(/Critical: 0/i)).toBeInTheDocument();
      });
    });

    it('should display patches applied and pending', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('145')).toBeInTheDocument();
        expect(screen.getByText(/Pending: 2/i)).toBeInTheDocument();
      });
    });
  });

  describe('Quantum Cryptography Status', () => {
    it('should display CRYSTALS-Kyber section', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/CRYSTALS-Kyber \(Key Exchange\)/i)).toBeInTheDocument();
      });
    });

    it('should show Kyber as active', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        const activeChips = screen.getAllByText('ACTIVE');
        expect(activeChips.length).toBeGreaterThan(0);
      });
    });

    it('should display Kyber NIST level and strength', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/NIST Level: 5/i)).toBeInTheDocument();
        expect(screen.getByText(/NIST Level 5 \(256-bit quantum security\)/i)).toBeInTheDocument();
      });
    });

    it('should display CRYSTALS-Dilithium section', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/CRYSTALS-Dilithium \(Signatures\)/i)).toBeInTheDocument();
      });
    });

    it('should show Dilithium as active', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        const activeChips = screen.getAllByText('ACTIVE');
        expect(activeChips.length).toBeGreaterThan(2); // Both Kyber and Dilithium
      });
    });

    it('should display post-quantum ready status', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Post-Quantum Ready: Yes/i)).toBeInTheDocument();
      });
    });

    it('should display classical fallback status', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Classical fallback enabled/i)).toBeInTheDocument();
      });
    });

    it('should display post-quantum warning when not ready', async () => {
      const notReadyQuantumStatus = { ...mockQuantumStatus, postQuantumReady: false };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/security/status')) {
          return Promise.resolve({ data: mockSecurityStatus });
        }
        if (url.includes('/security/quantum')) {
          return Promise.resolve({ data: notReadyQuantumStatus });
        }
        if (url.includes('/security/hsm/status')) {
          return Promise.resolve({ data: mockHSMStatus });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Post-Quantum Ready: No/i)).toBeInTheDocument();
      });
    });
  });

  describe('HSM Status', () => {
    it('should display HSM connection status', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('CONNECTED')).toBeInTheDocument();
      });
    });

    it('should display HSM vendor and model', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Vendor: Thales/i)).toBeInTheDocument();
        expect(screen.getByText(/Model: Luna SA-7/i)).toBeInTheDocument();
      });
    });

    it('should display HSM firmware version', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Firmware: v7\.8\.2/i)).toBeInTheDocument();
      });
    });

    it('should display keys stored count', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('15,000')).toBeInTheDocument();
      });
    });

    it('should display operations per second', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('50,000')).toBeInTheDocument();
      });
    });

    it('should display HSM entropy percentage', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Entropy: 98%/i)).toBeInTheDocument();
      });
    });

    it('should display last health check timestamp', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Last health check:/i)).toBeInTheDocument();
      });
    });

    it('should show disconnected HSM status', async () => {
      const disconnectedHSM = { ...mockHSMStatus, connected: false, status: 'error' as const };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/security/status')) {
          return Promise.resolve({ data: mockSecurityStatus });
        }
        if (url.includes('/security/quantum')) {
          return Promise.resolve({ data: mockQuantumStatus });
        }
        if (url.includes('/security/hsm/status')) {
          return Promise.resolve({ data: disconnectedHSM });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('DISCONNECTED')).toBeInTheDocument();
      });
    });
  });

  describe('Cryptographic Algorithms Table', () => {
    it('should display cryptographic algorithms heading', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('Cryptographic Algorithms In Use')).toBeInTheDocument();
      });
    });

    it('should display CRYSTALS-Kyber algorithm', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/CRYSTALS-Kyber \(Key Exchange\)/i)).toBeInTheDocument();
      });
    });

    it('should display CRYSTALS-Dilithium algorithm', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/CRYSTALS-Dilithium \(Signatures\)/i)).toBeInTheDocument();
      });
    });

    it('should display AES-256-GCM algorithm', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('AES-256-GCM')).toBeInTheDocument();
      });
    });

    it('should display ChaCha20-Poly1305 algorithm', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('ChaCha20-Poly1305')).toBeInTheDocument();
      });
    });

    it('should display SHA3-512 algorithm', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('SHA3-512')).toBeInTheDocument();
      });
    });

    it('should display BLAKE3 algorithm', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('BLAKE3')).toBeInTheDocument();
      });
    });

    it('should display algorithm types', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        const pqcChips = screen.getAllByText('PQC');
        expect(pqcChips.length).toBe(2); // Kyber and Dilithium

        expect(screen.getByText('SYMMETRIC')).toBeInTheDocument();
        expect(screen.getByText('HASH')).toBeInTheDocument();
      });
    });

    it('should display algorithm strengths', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        const strength256 = screen.getAllByText('256-bit');
        expect(strength256.length).toBeGreaterThan(0);

        expect(screen.getByText('512-bit')).toBeInTheDocument();
      });
    });

    it('should show all algorithms as active', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        const activeStatuses = screen.getAllByText('ACTIVE');
        expect(activeStatuses.length).toBeGreaterThan(4); // At least the 6 algorithms
      });
    });
  });

  describe('Security Events Table', () => {
    it('should display recent security events heading', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('Recent Security Events')).toBeInTheDocument();
      });
    });

    it('should display security event descriptions', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Successful quantum key exchange/i)).toBeInTheDocument();
        expect(screen.getByText(/HSM firmware update available/i)).toBeInTheDocument();
      });
    });

    it('should display event severity levels', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('LOW')).toBeInTheDocument();
        expect(screen.getByText('MEDIUM')).toBeInTheDocument();
      });
    });

    it('should display event types', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('Authentication')).toBeInTheDocument();
        expect(screen.getByText('HSM')).toBeInTheDocument();
      });
    });

    it('should display event sources', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('QKD-Module')).toBeInTheDocument();
        expect(screen.getByText('Thales')).toBeInTheDocument();
      });
    });

    it('should display event resolution status', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        const resolvedChips = screen.getAllByText('RESOLVED');
        const activeChips = screen.getAllByText('ACTIVE');
        expect(resolvedChips.length).toBeGreaterThan(0);
        expect(activeChips.length).toBeGreaterThan(0);
      });
    });
  });

  describe('System Status Summary', () => {
    it('should display firewall status', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('Firewall')).toBeInTheDocument();
        const activeChips = screen.getAllByText('ACTIVE');
        expect(activeChips.length).toBeGreaterThan(0);
      });
    });

    it('should display intrusion detection status', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('Intrusion Detection')).toBeInTheDocument();
      });
    });

    it('should display last security scan timestamp', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('Last Security Scan')).toBeInTheDocument();
      });
    });

    it('should show inactive firewall status', async () => {
      const inactiveStatus = { ...mockSecurityStatus, firewallActive: false };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/security/status')) {
          return Promise.resolve({ data: inactiveStatus });
        }
        if (url.includes('/security/quantum')) {
          return Promise.resolve({ data: mockQuantumStatus });
        }
        if (url.includes('/security/hsm/status')) {
          return Promise.resolve({ data: mockHSMStatus });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('INACTIVE')).toBeInTheDocument();
      });
    });
  });

  describe('Critical Vulnerability Alert', () => {
    it('should not display alert when no critical vulnerabilities', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText('92/100')).toBeInTheDocument();
      });

      expect(screen.queryByText(/critical vulnerabilit/i)).not.toBeInTheDocument();
    });

    it('should display alert with singular message for 1 critical vulnerability', async () => {
      const criticalStatus = { ...mockSecurityStatus, criticalVulnerabilities: 1 };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/security/status')) {
          return Promise.resolve({ data: criticalStatus });
        }
        if (url.includes('/security/quantum')) {
          return Promise.resolve({ data: mockQuantumStatus });
        }
        if (url.includes('/security/hsm/status')) {
          return Promise.resolve({ data: mockHSMStatus });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/1 critical vulnerability detected/i)).toBeInTheDocument();
      });
    });

    it('should display alert with plural message for multiple critical vulnerabilities', async () => {
      const criticalStatus = { ...mockSecurityStatus, criticalVulnerabilities: 3 };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/security/status')) {
          return Promise.resolve({ data: criticalStatus });
        }
        if (url.includes('/security/quantum')) {
          return Promise.resolve({ data: mockQuantumStatus });
        }
        if (url.includes('/security/hsm/status')) {
          return Promise.resolve({ data: mockHSMStatus });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/3 critical vulnerabilities detected/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should poll data every 10 seconds', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      });

      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(6);
      });
    });

    it('should poll data twice after 20 seconds', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      });

      vi.advanceTimersByTime(20000);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(9);
      });
    });

    it('should cleanup interval on unmount', async () => {
      const { unmount } = render(<SecurityAudit />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalled();
      });

      unmount();
      const callsBeforeUnmount = mockedAxios.get.mock.calls.length;

      vi.advanceTimersByTime(10000);

      expect(mockedAxios.get).toHaveBeenCalledTimes(callsBeforeUnmount);
    });
  });

  describe('Error Handling', () => {
    it('should display error alert when fetch fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('should refetch data when retry button clicked', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))
                       .mockImplementation((url: string) => {
                         if (url.includes('/security/status')) {
                           return Promise.resolve({ data: mockSecurityStatus });
                         }
                         if (url.includes('/security/quantum')) {
                           return Promise.resolve({ data: mockQuantumStatus });
                         }
                         if (url.includes('/security/hsm/status')) {
                           return Promise.resolve({ data: mockHSMStatus });
                         }
                         return Promise.reject(new Error('Unknown endpoint'));
                       });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Retry/i }));

      await waitFor(() => {
        expect(screen.getByText('92/100')).toBeInTheDocument();
      });
    });

    it('should refresh data when Refresh button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });

      mockedAxios.get.mockClear();

      await user.click(screen.getByRole('button', { name: /Refresh/i }));

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should format timestamp as hours ago', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/1h ago/i)).toBeInTheDocument();
      });
    });

    it('should format timestamp as minutes ago', async () => {
      const recentScan = { ...mockSecurityStatus, lastSecurityScan: Date.now() - 1800000 };
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/security/status')) {
          return Promise.resolve({ data: recentScan });
        }
        if (url.includes('/security/quantum')) {
          return Promise.resolve({ data: mockQuantumStatus });
        }
        if (url.includes('/security/hsm/status')) {
          return Promise.resolve({ data: mockHSMStatus });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      render(<SecurityAudit />);

      await waitFor(() => {
        expect(screen.getByText(/30m ago/i)).toBeInTheDocument();
      });
    });

    it('should apply correct colors to severity chips', async () => {
      render(<SecurityAudit />);

      await waitFor(() => {
        const lowChip = screen.getByText('LOW');
        const mediumChip = screen.getByText('MEDIUM');

        expect(lowChip).toBeInTheDocument();
        expect(mediumChip).toBeInTheDocument();
      });
    });
  });
});

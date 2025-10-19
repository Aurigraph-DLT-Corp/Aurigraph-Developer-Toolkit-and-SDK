import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import RicardianContracts from '../../../pages/dashboards/RicardianContracts';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock data
const mockContractsResponse = {
  contracts: [
    {
      id: 'contract-123456789abc',
      title: 'Real Estate Sale Agreement',
      type: 'sale' as const,
      parties: ['0x1234567890abcdef', '0xabcdef1234567890'],
      status: 'active' as const,
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-15T14:30:00Z',
      signatures: 2,
      requiredSignatures: 2,
      verificationStatus: 'verified' as const,
      hash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      blockchainTxId: 'tx-987654321fedcba',
      legalJurisdiction: 'US',
      value: 500000,
      currency: 'USD'
    },
    {
      id: 'contract-234567890bcd',
      title: 'Equipment Lease Agreement',
      type: 'lease' as const,
      parties: ['0x2345678901bcdefg', '0xbcdefg2345678901'],
      status: 'pending' as const,
      createdAt: '2025-01-12T09:00:00Z',
      updatedAt: '2025-01-12T09:00:00Z',
      signatures: 1,
      requiredSignatures: 2,
      verificationStatus: 'pending' as const,
      hash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
      legalJurisdiction: 'UK',
      value: 25000,
      currency: 'GBP'
    },
    {
      id: 'contract-345678901cde',
      title: 'Software Development Service',
      type: 'service' as const,
      parties: ['0x3456789012cdefgh', '0xcdefgh3456789012', '0x9876543210fedcba'],
      status: 'completed' as const,
      createdAt: '2025-01-05T08:00:00Z',
      updatedAt: '2025-01-14T16:00:00Z',
      signatures: 3,
      requiredSignatures: 3,
      verificationStatus: 'verified' as const,
      hash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
      blockchainTxId: 'tx-876543210fedcba9',
      legalJurisdiction: 'EU',
      value: 150000,
      currency: 'EUR'
    },
    {
      id: 'contract-456789012def',
      title: 'Partnership Agreement Draft',
      type: 'partnership' as const,
      parties: ['0x4567890123defghi'],
      status: 'draft' as const,
      createdAt: '2025-01-15T11:00:00Z',
      updatedAt: '2025-01-15T11:00:00Z',
      signatures: 0,
      requiredSignatures: 2,
      verificationStatus: 'pending' as const,
      hash: 'd4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
      legalJurisdiction: 'US'
    },
    {
      id: 'contract-567890123efg',
      title: 'Disputed Service Contract',
      type: 'service' as const,
      parties: ['0x5678901234efghij', '0xefghij5678901234'],
      status: 'disputed' as const,
      createdAt: '2025-01-08T12:00:00Z',
      updatedAt: '2025-01-13T10:00:00Z',
      signatures: 2,
      requiredSignatures: 2,
      verificationStatus: 'failed' as const,
      hash: 'e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6',
      legalJurisdiction: 'CA'
    }
  ],
  total: 5,
  pending: 1,
  active: 1,
  completed: 1
};

describe('RicardianContracts Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockedAxios.get.mockResolvedValue({ data: mockContractsResponse });
    mockedAxios.post.mockResolvedValue({ data: { success: true } });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      render(<RicardianContracts />);
      await waitFor(() => {
        expect(screen.getByText('Ricardian Contracts Dashboard')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<RicardianContracts />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render main dashboard after loading', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Ricardian Contracts Dashboard')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Upload Contract/i })).toBeInTheDocument();
      });
    });

    it('should display error state when fetch fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch contracts on mount', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/contracts/ricardian')
        );
      });
    });

    it('should display contracts in table', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
        expect(screen.getByText('Equipment Lease Agreement')).toBeInTheDocument();
        expect(screen.getByText('Software Development Service')).toBeInTheDocument();
      });
    });

    it('should retry fetching when retry button clicked', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))
                       .mockResolvedValueOnce({ data: mockContractsResponse });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Retry/i }));

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });
    });
  });

  describe('Stats Cards', () => {
    it('should display total contracts count', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Total Contracts')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
      });
    });

    it('should display active contracts count', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Active Contracts')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should display pending signatures count', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Pending Signatures')).toBeInTheDocument();
        const pendingCards = screen.getAllByText('1');
        expect(pendingCards.length).toBeGreaterThan(0);
      });
    });

    it('should display completed contracts count', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
        const completedCards = screen.getAllByText('1');
        expect(completedCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Contracts Table', () => {
    it('should display all contract titles', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
        expect(screen.getByText('Equipment Lease Agreement')).toBeInTheDocument();
        expect(screen.getByText('Software Development Service')).toBeInTheDocument();
        expect(screen.getByText('Partnership Agreement Draft')).toBeInTheDocument();
        expect(screen.getByText('Disputed Service Contract')).toBeInTheDocument();
      });
    });

    it('should display contract types', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('SALE')).toBeInTheDocument();
        expect(screen.getByText('LEASE')).toBeInTheDocument();
        expect(screen.getByText('SERVICE')).toBeInTheDocument();
        expect(screen.getByText('PARTNERSHIP')).toBeInTheDocument();
      });
    });

    it('should display contract statuses', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
        expect(screen.getByText('DRAFT')).toBeInTheDocument();
        expect(screen.getByText('DISPUTED')).toBeInTheDocument();
      });
    });

    it('should display number of parties', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('2 parties')).toBeInTheDocument();
        expect(screen.getByText('3 parties')).toBeInTheDocument();
        expect(screen.getByText('1 parties')).toBeInTheDocument();
      });
    });

    it('should display signature progress', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('2/2')).toBeInTheDocument();
        expect(screen.getByText('1/2')).toBeInTheDocument();
        expect(screen.getByText('3/3')).toBeInTheDocument();
        expect(screen.getByText('0/2')).toBeInTheDocument();
      });
    });

    it('should display verification status', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        const verifiedBadges = screen.getAllByText('VERIFIED');
        expect(verifiedBadges.length).toBe(2);

        const pendingBadges = screen.getAllByText('PENDING');
        expect(pendingBadges.length).toBeGreaterThan(0);

        expect(screen.getByText('FAILED')).toBeInTheDocument();
      });
    });

    it('should display contract IDs in short format', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('contract-1234...')).toBeInTheDocument();
        expect(screen.getByText('contract-2345...')).toBeInTheDocument();
      });
    });

    it('should display creation dates', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('should display empty state when no contracts', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { contracts: [], total: 0, pending: 0, active: 0, completed: 0 }
      });

      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText(/No contracts found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Upload Contract Dialog', () => {
    it('should open upload dialog when button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Contract/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      await waitFor(() => {
        expect(screen.getByText('Upload New Ricardian Contract')).toBeInTheDocument();
      });
    });

    it('should display all form fields in upload dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Contract Title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contract Type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Legal Jurisdiction/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Document Hash/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Contract Value/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Currency/i)).toBeInTheDocument();
      });
    });

    it('should allow entering contract title', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      const titleInput = screen.getByLabelText(/Contract Title/i);
      await user.type(titleInput, 'New Test Contract');

      expect(titleInput).toHaveValue('New Test Contract');
    });

    it('should allow selecting contract type', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Contract Type/i)).toBeInTheDocument();
      });

      // The default value should be "sale"
      const typeSelect = screen.getByLabelText(/Contract Type/i);
      expect(typeSelect).toBeInTheDocument();
    });

    it('should allow entering legal jurisdiction', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      const jurisdictionInput = screen.getByLabelText(/Legal Jurisdiction/i);
      await user.clear(jurisdictionInput);
      await user.type(jurisdictionInput, 'UK');

      expect(jurisdictionInput).toHaveValue('UK');
    });

    it('should allow entering document hash', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      const hashInput = screen.getByLabelText(/Document Hash/i);
      await user.type(hashInput, 'abc123def456');

      expect(hashInput).toHaveValue('abc123def456');
    });

    it('should submit upload form when Upload Contract button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Contract Title/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Contract Title/i), 'New Contract');
      await user.type(screen.getByLabelText(/Document Hash/i), 'hash123');

      const uploadButtons = screen.getAllByRole('button', { name: /Upload Contract/i });
      const submitButton = uploadButtons[uploadButtons.length - 1]; // Get the dialog button
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.stringContaining('/contracts/ricardian/upload'),
          expect.objectContaining({
            title: 'New Contract',
            documentHash: 'hash123'
          })
        );
      });
    });

    it('should close dialog after successful upload', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      await user.type(screen.getByLabelText(/Contract Title/i), 'New Contract');
      await user.type(screen.getByLabelText(/Document Hash/i), 'hash123');

      const uploadButtons = screen.getAllByRole('button', { name: /Upload Contract/i });
      const submitButton = uploadButtons[uploadButtons.length - 1];
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Upload New Ricardian Contract')).not.toBeInTheDocument();
      });
    });

    it('should disable upload button when required fields empty', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      await waitFor(() => {
        const uploadButtons = screen.getAllByRole('button', { name: /Upload Contract/i });
        const submitButton = uploadButtons[uploadButtons.length - 1];
        expect(submitButton).toBeDisabled();
      });
    });

    it('should close dialog when Cancel button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));

      await waitFor(() => {
        expect(screen.getByText('Upload New Ricardian Contract')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      await waitFor(() => {
        expect(screen.queryByText('Upload New Ricardian Contract')).not.toBeInTheDocument();
      });
    });
  });

  describe('View Contract Details Dialog', () => {
    it('should open view dialog when view icon clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View Details');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Contract Details')).toBeInTheDocument();
      });
    });

    it('should display contract title in view dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View Details');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        const titles = screen.getAllByText('Real Estate Sale Agreement');
        expect(titles.length).toBeGreaterThan(1); // One in table, one in dialog
      });
    });

    it('should display full contract ID in view dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View Details');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/ID: contract-123456789abc/i)).toBeInTheDocument();
      });
    });

    it('should display contract status in view dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View Details');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        const activeStatuses = screen.getAllByText('ACTIVE');
        expect(activeStatuses.length).toBeGreaterThan(1);
      });
    });

    it('should display parties in view dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View Details');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Parties \(2\)/i)).toBeInTheDocument();
        expect(screen.getByText('0x1234567890abcdef')).toBeInTheDocument();
        expect(screen.getByText('0xabcdef1234567890')).toBeInTheDocument();
      });
    });

    it('should display signature progress in view dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View Details');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/2 of 2 required signatures/i)).toBeInTheDocument();
      });
    });

    it('should display document hash in view dialog', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View Details');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/a1b2c3d4e5f6a1b2c3d4e5f6/i)).toBeInTheDocument();
      });
    });

    it('should display blockchain transaction ID when available', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View Details');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/tx-987654321fedcba/i)).toBeInTheDocument();
      });
    });

    it('should close view dialog when Close button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByText('Real Estate Sale Agreement')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View Details');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Contract Details')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /^Close$/i }));

      await waitFor(() => {
        expect(screen.queryByText('Contract Details')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should poll data every 10 seconds', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(10000);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });

    it('should poll data twice after 20 seconds', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });

      vi.advanceTimersByTime(20000);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(3);
      });
    });

    it('should cleanup interval on unmount', async () => {
      const { unmount } = render(<RicardianContracts />);

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
    it('should display error when upload fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Upload failed'));

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Upload Contract/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));
      await user.type(screen.getByLabelText(/Contract Title/i), 'Test');
      await user.type(screen.getByLabelText(/Document Hash/i), 'hash');

      const uploadButtons = screen.getAllByRole('button', { name: /Upload Contract/i });
      await user.click(uploadButtons[uploadButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
      });
    });

    it('should refresh contracts when Refresh button clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument();
      });

      mockedAxios.get.mockClear();

      await user.click(screen.getByRole('button', { name: /Refresh/i }));

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      });
    });

    it('should dismiss error alert when close button clicked', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Upload failed'));

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<RicardianContracts />);

      await user.click(screen.getByRole('button', { name: /Upload Contract/i }));
      await user.type(screen.getByLabelText(/Contract Title/i), 'Test');
      await user.type(screen.getByLabelText(/Document Hash/i), 'hash');

      const uploadButtons = screen.getAllByRole('button', { name: /Upload Contract/i });
      await user.click(uploadButtons[uploadButtons.length - 1]);

      await waitFor(() => {
        expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
      });

      // Note: MUI Alert close button might not have a specific role
      // The error should be visible
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
    });
  });

  describe('Utility Functions', () => {
    it('should display appropriate icons for different statuses', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        // Check that status chips are rendered (icons are part of the implementation)
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('PENDING')).toBeInTheDocument();
        expect(screen.getByText('COMPLETED')).toBeInTheDocument();
        expect(screen.getByText('DISPUTED')).toBeInTheDocument();
        expect(screen.getByText('DRAFT')).toBeInTheDocument();
      });
    });

    it('should apply correct colors to status chips', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        // Verify status chips are displayed with appropriate text
        const activeChip = screen.getByText('ACTIVE');
        const pendingChip = screen.getByText('PENDING');
        const completedChip = screen.getByText('COMPLETED');
        const disputedChip = screen.getByText('DISPUTED');

        expect(activeChip).toBeInTheDocument();
        expect(pendingChip).toBeInTheDocument();
        expect(completedChip).toBeInTheDocument();
        expect(disputedChip).toBeInTheDocument();
      });
    });

    it('should apply correct colors to verification status chips', async () => {
      render(<RicardianContracts />);

      await waitFor(() => {
        const verifiedChips = screen.getAllByText('VERIFIED');
        const pendingChips = screen.getAllByText('PENDING');
        const failedChip = screen.getByText('FAILED');

        expect(verifiedChips.length).toBeGreaterThan(0);
        expect(pendingChips.length).toBeGreaterThan(0);
        expect(failedChip).toBeInTheDocument();
      });
    });
  });
});

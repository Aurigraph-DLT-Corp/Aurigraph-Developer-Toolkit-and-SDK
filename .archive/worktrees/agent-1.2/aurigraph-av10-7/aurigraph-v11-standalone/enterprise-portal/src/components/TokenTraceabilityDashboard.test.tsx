import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TokenTraceabilityDashboard from './TokenTraceabilityDashboard';

// Mock fetch
global.fetch = vi.fn();

// Mock data
const mockTokenTrace = {
  trace_id: 'TRACE-001',
  token_id: 'TOKEN-123',
  asset_id: 'ASSET-456',
  asset_type: 'REAL_ESTATE',
  verification_status: 'VERIFIED' as const,
  proof_valid: true,
  asset_verified: true,
  fractional_ownership: 75.5,
  owner_address: '0x1234567890123456789012345678901234567890',
  token_value_usd: 50000,
  merkle_proof_path: [],
  compliance_certifications: [],
  audit_trail: [],
  ownership_history: [],
  token_creation_timestamp: '2024-01-15T10:00:00Z',
  last_verified_timestamp: '2024-01-16T10:00:00Z',
  next_verification_due: '2024-04-15T10:00:00Z',
};

const mockAllTracesResponse = {
  total: 2,
  traces: [mockTokenTrace],
};

describe('TokenTraceabilityDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading state when no initial data', () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllTracesResponse,
      });

      render(<TokenTraceabilityDashboard />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should render dashboard with token traces', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllTracesResponse,
      });

      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
      });
    });

    it('should display statistics cards', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllTracesResponse,
      });

      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/total traces/i)).toBeInTheDocument();
      });
    });

    it('should render search input', () => {
      render(<TokenTraceabilityDashboard />);
      expect(screen.getByPlaceholderText(/search by token id/i)).toBeInTheDocument();
    });

    it('should render filter selects', () => {
      render(<TokenTraceabilityDashboard />);
      expect(screen.getByDisplayValue('All Asset Types')).toBeInTheDocument();
      expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter traces by token ID', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAllTracesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenTrace,
        });

      const user = userEvent.setup();
      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by token id/i);
      await user.type(searchInput, 'TOKEN-123');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('TOKEN-123'),
          expect.any(Object)
        );
      });
    });

    it('should handle search with empty results', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAllTracesResponse,
        })
        .mockRejectedValueOnce(new Error('Not found'));

      const user = userEvent.setup();
      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by token id/i);
      await user.type(searchInput, 'NONEXISTENT');

      // Should handle error gracefully
      await waitFor(() => {
        expect(screen.queryByText('NONEXISTENT')).not.toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter by asset type', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAllTracesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ asset_type: 'REAL_ESTATE', total: 1, traces: [mockTokenTrace] }),
        });

      const user = userEvent.setup();
      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
      });

      const assetTypeSelect = screen.getByDisplayValue('All Asset Types');
      await user.click(assetTypeSelect);

      const realEstateOption = screen.getByText('Real Estate');
      await user.click(realEstateOption);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('REAL_ESTATE'),
          expect.any(Object)
        );
      });
    });

    it('should filter by verification status', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAllTracesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ verification_status: 'VERIFIED', total: 1, traces: [mockTokenTrace] }),
        });

      const user = userEvent.setup();
      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('All Statuses');
      await user.click(statusSelect);

      const verifiedOption = screen.getByText('Verified');
      await user.click(verifiedOption);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('VERIFIED'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Data Table', () => {
    it('should display token trace in table', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllTracesResponse,
      });

      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
        expect(screen.getByText('REAL_ESTATE')).toBeInTheDocument();
        expect(screen.getByText('VERIFIED')).toBeInTheDocument();
      });
    });

    it('should display ownership percentage in table', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllTracesResponse,
      });

      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/75\.5/)).toBeInTheDocument();
      });
    });

    it('should display token value in table', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllTracesResponse,
      });

      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/\$50,000/)).toBeInTheDocument();
      });
    });
  });

  describe('Details Dialog', () => {
    it('should open details dialog on row click', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllTracesResponse,
      });

      const user = userEvent.setup();
      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
      });

      const tokenLink = screen.getByText('TOKEN-123');
      await user.click(tokenLink);

      await waitFor(() => {
        expect(screen.getByText(/ownership history/i)).toBeInTheDocument();
      });
    });

    it('should display basic information in dialog', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllTracesResponse,
      });

      const user = userEvent.setup();
      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
      });

      await user.click(screen.getByText('TOKEN-123'));

      await waitFor(() => {
        expect(screen.getByText('ASSET-456')).toBeInTheDocument();
      });
    });

    it('should close details dialog', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAllTracesResponse,
      });

      const user = userEvent.setup();
      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
      });

      await user.click(screen.getByText('TOKEN-123'));

      await waitFor(() => {
        expect(screen.getByText(/ownership history/i)).toBeInTheDocument();
      });

      const closeButton = screen.getAllByRole('button').find(btn => btn.textContent === 'Close');
      if (closeButton) {
        await user.click(closeButton);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle 404 responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should display error message in alert', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Network Error')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh data on button click', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAllTracesResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockAllTracesResponse,
        });

      const user = userEvent.setup();
      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText('TOKEN-123')).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('should display message when no traces found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ total: 0, traces: [] }),
      });

      render(<TokenTraceabilityDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no traces/i)).toBeInTheDocument();
      });
    });
  });
});

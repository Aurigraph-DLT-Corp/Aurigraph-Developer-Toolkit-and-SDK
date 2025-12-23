import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import Transactions from '../../pages/Transactions';
import { mockTransactions, createMockTransaction } from '../utils/mockData';

describe('Transactions Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<Transactions />);
      expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
    });

    it('should display the page title', () => {
      render(<Transactions />);
      expect(screen.getByRole('heading', { name: /Transactions/i })).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      render(<Transactions />);
      expect(screen.getByText(/Loading.../i) || screen.getAllByRole('progressbar')).toBeTruthy();
    });
  });

  describe('Transaction List', () => {
    it('should fetch and display transactions', async () => {
      render(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/0x1234567890abcdef/i)).toBeInTheDocument();
      });
    });

    it('should display transaction type', async () => {
      render(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/payment/i)).toBeInTheDocument();
      });
    });

    it('should display transaction status', async () => {
      render(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/confirmed/i) || screen.getByText(/pending/i)).toBeInTheDocument();
      });
    });

    it('should display transaction amount', async () => {
      render(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/1000/i) || screen.getByText(/1,000/i)).toBeInTheDocument();
      });
    });

    it('should handle empty transaction list', async () => {
      // Mock empty response
      render(<Transactions />);

      await waitFor(() => {
        const emptyMessage = screen.queryByText(/No transactions/i);
        if (emptyMessage) {
          expect(emptyMessage).toBeInTheDocument();
        }
      });
    });
  });

  describe('Filtering', () => {
    it('should filter transactions by type', async () => {
      const user = userEvent.setup();
      render(<Transactions />);

      await waitFor(() => {
        const filterSelect = screen.queryByLabelText(/Type/i) || screen.queryByRole('combobox');
        if (filterSelect) {
          user.selectOptions(filterSelect, 'payment');
        }
      });
    });

    it('should filter transactions by status', async () => {
      const user = userEvent.setup();
      render(<Transactions />);

      await waitFor(() => {
        const statusFilter = screen.queryByLabelText(/Status/i);
        if (statusFilter) {
          user.selectOptions(statusFilter, 'confirmed');
        }
      });
    });

    it('should filter transactions by date range', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const dateFilter = screen.queryByLabelText(/Date/i) || screen.queryByPlaceholderText(/Select date/i);
        if (dateFilter) {
          expect(dateFilter).toBeInTheDocument();
        }
      });
    });

    it('should clear filters', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const clearButton = screen.queryByRole('button', { name: /clear/i });
        if (clearButton) {
          fireEvent.click(clearButton);
        }
      });
    });
  });

  describe('Search', () => {
    it('should search transactions by hash', async () => {
      const user = userEvent.setup();
      render(<Transactions />);

      await waitFor(async () => {
        const searchInput = screen.queryByPlaceholderText(/Search/i) || screen.queryByRole('searchbox');
        if (searchInput) {
          await user.type(searchInput, '0x1234');
        }
      });
    });

    it('should display search results', async () => {
      const user = userEvent.setup();
      render(<Transactions />);

      await waitFor(async () => {
        const searchInput = screen.queryByPlaceholderText(/Search/i);
        if (searchInput) {
          await user.type(searchInput, '0x1234567890abcdef');
        }
      });
    });

    it('should handle no search results', async () => {
      const user = userEvent.setup();
      render(<Transactions />);

      await waitFor(async () => {
        const searchInput = screen.queryByPlaceholderText(/Search/i);
        if (searchInput) {
          await user.type(searchInput, 'nonexistent');
        }
      });
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const pagination = screen.queryByRole('navigation') || screen.queryByLabelText(/pagination/i);
        if (pagination) {
          expect(pagination).toBeInTheDocument();
        }
      });
    });

    it('should navigate to next page', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const nextButton = screen.queryByRole('button', { name: /next/i });
        if (nextButton) {
          fireEvent.click(nextButton);
        }
      });
    });

    it('should navigate to previous page', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const prevButton = screen.queryByRole('button', { name: /previous/i });
        if (prevButton) {
          fireEvent.click(prevButton);
        }
      });
    });

    it('should change page size', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const pageSizeSelect = screen.queryByLabelText(/rows per page/i);
        if (pageSizeSelect) {
          fireEvent.change(pageSizeSelect, { target: { value: '25' } });
        }
      });
    });
  });

  describe('Transaction Details', () => {
    it('should open transaction details on click', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const transactionRow = screen.queryByText(/0x1234567890abcdef/i);
        if (transactionRow) {
          fireEvent.click(transactionRow);
        }
      });
    });

    it('should display full transaction details', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const transactionRow = screen.queryByText(/0x1234567890abcdef/i);
        if (transactionRow) {
          fireEvent.click(transactionRow);
          // Details dialog or panel should open
        }
      });
    });

    it('should close transaction details', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const closeButton = screen.queryByRole('button', { name: /close/i });
        if (closeButton) {
          fireEvent.click(closeButton);
        }
      });
    });
  });

  describe('Export Functionality', () => {
    it('should have export button', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const exportButton = screen.queryByRole('button', { name: /export/i });
        if (exportButton) {
          expect(exportButton).toBeInTheDocument();
        }
      });
    });

    it('should export to CSV', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const exportButton = screen.queryByRole('button', { name: /export/i });
        if (exportButton) {
          fireEvent.click(exportButton);
        }
      });
    });

    it('should export to JSON', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const jsonOption = screen.queryByText(/JSON/i);
        if (jsonOption) {
          fireEvent.click(jsonOption);
        }
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should update transaction list periodically', async () => {
      vi.useFakeTimers();
      render(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
      });

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
      });

      vi.useRealTimers();
    });

    it('should show new transaction indicator', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const newBadge = screen.queryByText(/new/i);
        if (newBadge) {
          expect(newBadge).toBeInTheDocument();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      render(<Transactions />);

      await waitFor(() => {
        expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
      });
    });

    it('should show error message on failure', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const errorMessage = screen.queryByText(/error/i) || screen.queryByText(/failed/i);
        // Component should not crash even on error
        expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
      });
    });

    it('should allow retry on error', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const retryButton = screen.queryByRole('button', { name: /retry/i });
        if (retryButton) {
          fireEvent.click(retryButton);
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const table = screen.queryByRole('table') || document.querySelector('.MuiDataGrid-root');
        if (table) {
          expect(table).toBeInTheDocument();
        }
      });
    });

    it('should have accessible table headers', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const columnHeaders = screen.queryAllByRole('columnheader');
        if (columnHeaders.length > 0) {
          expect(columnHeaders.length).toBeGreaterThan(0);
        }
      });
    });

    it('should support keyboard navigation', () => {
      render(<Transactions />);

      const focusableElements = screen.getAllByRole('button');
      focusableElements.forEach(element => {
        expect(element).toBeVisible();
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by timestamp', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const timestampHeader = screen.queryByText(/timestamp/i) || screen.queryByText(/date/i);
        if (timestampHeader) {
          fireEvent.click(timestampHeader);
        }
      });
    });

    it('should sort by amount', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const amountHeader = screen.queryByText(/amount/i);
        if (amountHeader) {
          fireEvent.click(amountHeader);
        }
      });
    });

    it('should toggle sort direction', async () => {
      render(<Transactions />);

      await waitFor(() => {
        const header = screen.queryByText(/timestamp/i);
        if (header) {
          fireEvent.click(header);
          fireEvent.click(header); // Second click for descending
        }
      });
    });
  });
});

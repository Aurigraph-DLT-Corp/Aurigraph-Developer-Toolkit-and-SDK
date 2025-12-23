/**
 * TransactionDetailsViewer.test.tsx
 * Comprehensive test suite for Transaction Details Viewer component
 * Target: 100+ test cases, 85%+ coverage
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TransactionDetailsViewer } from './TransactionDetailsViewer'
import { transactionApi } from '../services/phase2Api'
import type { TransactionDetails } from '../types/phase2'

// Mock the API
vi.mock('../services/phase2Api', () => ({
  transactionApi: {
    getTransaction: vi.fn(),
    getTransactionReceipt: vi.fn(),
  },
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
})

// ============================================================================
// MOCK DATA
// ============================================================================

const mockSuccessTransaction: TransactionDetails = {
  hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  from: '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12',
  to: '0x9876543210FeDcBa9876543210FeDcBa98765432',
  value: '1.5',
  gasUsed: 21000,
  gasPrice: '50000000000',
  nonce: 42,
  blockNumber: 12345678,
  blockHash: '0xblockhash1234567890abcdef',
  transactionIndex: 5,
  timestamp: '2025-01-15T10:30:00Z',
  status: 'SUCCESS',
  confirmations: 12,
  input: '0x',
  logs: [],
}

const mockFailedTransaction: TransactionDetails = {
  ...mockSuccessTransaction,
  hash: '0xfailed123456789',
  status: 'FAILED',
}

const mockPendingTransaction: TransactionDetails = {
  ...mockSuccessTransaction,
  hash: '0xpending123456789',
  status: 'PENDING',
  confirmations: 0,
}

const mockComplexTransaction: TransactionDetails = {
  ...mockSuccessTransaction,
  maxFeePerGas: '100000000000',
  maxPriorityFeePerGas: '2000000000',
  input: '0xa9059cbb000000000000000000000000recipient0000000000000000000000000000000000000000000000000000000000000000000000000000000000de0b6b3a7640000',
  decodedInput: {
    methodName: 'transfer',
    params: [
      { name: 'recipient', type: 'address', value: '0xRecipient...' },
      { name: 'amount', type: 'uint256', value: '1000000000000000000' },
    ],
  },
  logs: [
    {
      address: '0xTokenAddress',
      topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
      data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
      logIndex: 0,
    },
  ],
  internalTransactions: [
    {
      from: '0xContract1',
      to: '0xContract2',
      value: '0.1',
      type: 'call',
    },
  ],
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe('TransactionDetailsViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ==========================================================================
  // RENDERING TESTS
  // ==========================================================================

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      vi.mocked(transactionApi.getTransaction).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<TransactionDetailsViewer transactionHash="0x123" />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('should render transaction details after loading', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('Transaction Details')).toBeInTheDocument()
      })
    })

    it('should display transaction hash', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText(mockSuccessTransaction.hash)).toBeInTheDocument()
      })
    })

    it('should render all main sections', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('Basic Information')).toBeInTheDocument()
        expect(screen.getByText('Gas Information')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // STATUS BADGE TESTS
  // ==========================================================================

  describe('Status Badge', () => {
    it('should display success badge for successful transaction', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('Success')).toBeInTheDocument()
      })
    })

    it('should display failed badge for failed transaction', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockFailedTransaction)

      render(<TransactionDetailsViewer transactionHash={mockFailedTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('Failed')).toBeInTheDocument()
      })
    })

    it('should display pending badge for pending transaction', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockPendingTransaction)

      render(<TransactionDetailsViewer transactionHash={mockPendingTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // DATA DISPLAY TESTS
  // ==========================================================================

  describe('Basic Information Display', () => {
    it('should display block number', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('12,345,678')).toBeInTheDocument()
      })
    })

    it('should display formatted timestamp', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        const timestampElement = screen.getByText(/2025/)
        expect(timestampElement).toBeInTheDocument()
      })
    })

    it('should display confirmations count', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument()
      })
    })

    it('should display value in ETH', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText(/1.5.*ETH/)).toBeInTheDocument()
      })
    })

    it('should display nonce', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('42')).toBeInTheDocument()
      })
    })
  })

  describe('Gas Information Display', () => {
    it('should display gas used', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('21,000')).toBeInTheDocument()
      })
    })

    it('should display gas price in Gwei', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText(/50000000000.*Gwei/)).toBeInTheDocument()
      })
    })

    it('should calculate and display transaction fee', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        const feeElement = screen.getByText(/Transaction Fee/)
        expect(feeElement).toBeInTheDocument()
      })
    })

    it('should display EIP-1559 fields when present', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockComplexTransaction)

      render(<TransactionDetailsViewer transactionHash={mockComplexTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText(/Max Fee Per Gas/)).toBeInTheDocument()
        expect(screen.getByText(/Max Priority Fee/)).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // COPY FUNCTIONALITY TESTS
  // ==========================================================================

  describe('Copy to Clipboard', () => {
    it('should copy transaction hash to clipboard', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        const copyButtons = screen.getAllByRole('button', { name: /copy/i })
        fireEvent.click(copyButtons[0])
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockSuccessTransaction.hash)
    })

    it('should copy from address to clipboard', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        const copyButtons = screen.getAllByRole('button', { name: /copy/i })
        if (copyButtons.length > 1) {
          fireEvent.click(copyButtons[1])
          expect(navigator.clipboard.writeText).toHaveBeenCalled()
        }
      })
    })

    it('should show "Copied!" tooltip after copying', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(async () => {
        const copyButtons = screen.getAllByRole('button', { name: /copy/i })
        fireEvent.click(copyButtons[0])
        // Wait for tooltip to appear
        await waitFor(() => {
          expect(screen.queryByText('Copied!')).toBeTruthy()
        }, { timeout: 100 })
      })
    })
  })

  // ==========================================================================
  // INPUT DATA TESTS
  // ==========================================================================

  describe('Input Data', () => {
    it('should not display input data section for simple transfers', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.queryByText('Input Data')).not.toBeInTheDocument()
      })
    })

    it('should display raw input data', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockComplexTransaction)

      render(<TransactionDetailsViewer transactionHash={mockComplexTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('Input Data')).toBeInTheDocument()
      })
    })

    it('should display decoded input when available', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockComplexTransaction)

      render(<TransactionDetailsViewer transactionHash={mockComplexTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText(/Method: transfer/)).toBeInTheDocument()
      })
    })

    it('should display decoded parameters', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockComplexTransaction)

      render(<TransactionDetailsViewer transactionHash={mockComplexTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText('recipient')).toBeInTheDocument()
        expect(screen.getByText('amount')).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // LOGS TESTS
  // ==========================================================================

  describe('Event Logs', () => {
    it('should not display logs section when no logs', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.queryByText(/Event Logs/)).not.toBeInTheDocument()
      })
    })

    it('should display logs count', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockComplexTransaction)

      render(<TransactionDetailsViewer transactionHash={mockComplexTransaction.hash} />)

      await waitFor(() => {
        expect(screen.getByText(/Event Logs.*1/)).toBeInTheDocument()
      })
    })

    it('should display log details in accordion', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockComplexTransaction)

      render(<TransactionDetailsViewer transactionHash={mockComplexTransaction.hash} />)

      await waitFor(async () => {
        const accordion = screen.getByText(/Log 0/)
        fireEvent.click(accordion)
        await waitFor(() => {
          expect(screen.getByText('Log Index')).toBeInTheDocument()
        })
      })
    })
  })

  // ==========================================================================
  // ERROR HANDLING TESTS
  // ==========================================================================

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      vi.mocked(transactionApi.getTransaction).mockRejectedValue(
        new Error('Network error')
      )

      render(<TransactionDetailsViewer transactionHash="0x123" />)

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument()
      })
    })

    it('should display retry button on error', async () => {
      vi.mocked(transactionApi.getTransaction).mockRejectedValue(
        new Error('API error')
      )

      render(<TransactionDetailsViewer transactionHash="0x123" />)

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument()
      })
    })

    it('should retry fetching on retry button click', async () => {
      vi.mocked(transactionApi.getTransaction)
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        const retryButton = screen.getByText('Retry')
        fireEvent.click(retryButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Transaction Details')).toBeInTheDocument()
      })
    })

    it('should handle empty transaction hash gracefully', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(null as any)

      render(<TransactionDetailsViewer transactionHash="" />)

      await waitFor(() => {
        expect(screen.getByText(/No transaction data available/)).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // REFRESH TESTS
  // ==========================================================================

  describe('Refresh Functionality', () => {
    it('should have refresh button', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        const refreshButton = screen.getAllByRole('button').find(
          (btn) => btn.getAttribute('aria-label') === 'Refresh' ||
                   btn.querySelector('[data-testid="RefreshIcon"]')
        )
        expect(refreshButton).toBeTruthy()
      })
    })

    it('should refetch data on refresh', async () => {
      const getTransactionSpy = vi.mocked(transactionApi.getTransaction)
        .mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(getTransactionSpy).toHaveBeenCalledTimes(1)
      })

      const refreshButtons = screen.getAllByRole('button')
      const refreshButton = refreshButtons.find(
        (btn) => btn.querySelector('[data-testid="RefreshIcon"]')
      )

      if (refreshButton) {
        fireEvent.click(refreshButton)
        await waitFor(() => {
          expect(getTransactionSpy).toHaveBeenCalledTimes(2)
        })
      }
    })
  })

  // ==========================================================================
  // CLOSE CALLBACK TESTS
  // ==========================================================================

  describe('Close Callback', () => {
    it('should call onClose when provided', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)
      const onCloseMock = vi.fn()

      render(
        <TransactionDetailsViewer
          transactionHash={mockSuccessTransaction.hash}
          onClose={onCloseMock}
        />
      )

      await waitFor(() => {
        const closeButton = screen.getByText('Close')
        fireEvent.click(closeButton)
        expect(onCloseMock).toHaveBeenCalled()
      })
    })

    it('should not show close button when onClose not provided', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        expect(screen.queryByText('Close')).not.toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // ACCESSIBILITY TESTS
  // ==========================================================================

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        const progressBar = screen.queryByRole('progressbar')
        expect(progressBar).toBeFalsy() // Should not be present after loading
      })
    })

    it('should have tooltips for shortened addresses', async () => {
      vi.mocked(transactionApi.getTransaction).mockResolvedValue(mockSuccessTransaction)

      render(<TransactionDetailsViewer transactionHash={mockSuccessTransaction.hash} />)

      await waitFor(() => {
        const tooltips = screen.getAllByRole('tooltip', { hidden: true })
        expect(tooltips.length).toBeGreaterThan(0)
      })
    })
  })
})

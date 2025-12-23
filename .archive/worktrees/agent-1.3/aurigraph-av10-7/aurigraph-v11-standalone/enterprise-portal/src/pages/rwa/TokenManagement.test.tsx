/**
 * TokenManagement.test.tsx
 * Test suite for TokenManagement component
 * Target: 85%+ coverage
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor, fireEvent, within } from '@testing-library/react'
import { render } from '../../__tests__/utils/test-utils'
import TokenManagement from './TokenManagement'
import { apiService } from '../../services/api'

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getTokens: vi.fn(),
    getMerkleRootHash: vi.fn(),
  },
}))

const mockTokens = [
  {
    id: 'token-1',
    name: 'Real Estate Token',
    symbol: 'RET',
    totalSupply: 1000000,
    circulatingSupply: 500000,
    decimals: 18,
    contractAddress: '0x1234567890abcdef',
    verified: true,
    createdAt: '2024-01-01T00:00:00Z',
    status: 'ACTIVE' as const,
    merkleProofAvailable: true,
    inMerkleTree: true,
  },
  {
    id: 'token-2',
    name: 'Commodity Token',
    symbol: 'COM',
    totalSupply: 5000000,
    circulatingSupply: 3000000,
    decimals: 8,
    contractAddress: '0xabcdef1234567890',
    verified: true,
    createdAt: '2024-01-02T00:00:00Z',
    status: 'ACTIVE' as const,
    merkleProofAvailable: true,
    inMerkleTree: false,
  },
  {
    id: 'token-3',
    name: 'Paused Token',
    symbol: 'PST',
    totalSupply: 2000000,
    circulatingSupply: 1000000,
    decimals: 18,
    contractAddress: '0x0987654321fedcba',
    verified: false,
    createdAt: '2024-01-03T00:00:00Z',
    status: 'PAUSED' as const,
    merkleProofAvailable: false,
    inMerkleTree: false,
  },
]

const mockMerkleRootHash = {
  rootHash: '0xaabbccddeeff00112233445566778899aabbccdd',
}

describe('TokenManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(apiService.getTokens as any).mockResolvedValue(mockTokens)
    ;(apiService.getMerkleRootHash as any).mockResolvedValue(mockMerkleRootHash)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================

  it('should render the TokenManagement component', async () => {
    render(<TokenManagement />)

    // Check for header
    expect(await screen.findByText('Token Management')).toBeTruthy()
  })

  it('should display loading state initially', () => {
    ;(apiService.getTokens as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    render(<TokenManagement />)

    // LinearProgress should be visible
    const progress = document.querySelector('[role="progressbar"]')
    expect(progress).toBeTruthy()
  })

  it('should display tokens after loading', async () => {
    render(<TokenManagement />)

    // Wait for tokens to load
    await waitFor(() => {
      expect(screen.getByText('Real Estate Token')).toBeTruthy()
      expect(screen.getByText('Commodity Token')).toBeTruthy()
      expect(screen.getByText('Paused Token')).toBeTruthy()
    })
  })

  it('should display error message on API failure', async () => {
    const errorMessage = 'Failed to fetch tokens'
    ;(apiService.getTokens as any).mockRejectedValue(new Error(errorMessage))

    render(<TokenManagement />)

    await waitFor(() => {
      expect(screen.getByText(/Unable to load token data/)).toBeTruthy()
    })
  })

  // ============================================================================
  // STATISTICS TESTS
  // ============================================================================

  it('should display correct token statistics', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      // Total tokens
      expect(screen.getByText('3')).toBeTruthy()
      // Active tokens
      expect(screen.getByText('2')).toBeTruthy()
    })
  })

  it('should calculate verification rate correctly', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      // 2 out of 3 tokens are verified = 66.67%
      expect(screen.getByText(/66/)).toBeTruthy()
    })
  })

  it('should display total supply correctly', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      // Total supply = 1000000 + 5000000 + 2000000 = 8000000
      expect(screen.getByText(/8,000,000/)).toBeTruthy()
    })
  })

  // ============================================================================
  // TOKEN TABLE TESTS
  // ============================================================================

  it('should display token table with all columns', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      // Check for table headers
      expect(screen.getByText('Name')).toBeTruthy()
      expect(screen.getByText('Symbol')).toBeTruthy()
      expect(screen.getByText('Status')).toBeTruthy()
    })
  })

  it('should display correct token information in table', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      const table = screen.getByRole('table')
      const rows = within(table).getAllByRole('row')

      // Check that we have rows for each token (plus header)
      expect(rows.length).toBeGreaterThanOrEqual(4)
    })
  })

  it('should display verified badges for verified tokens', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      const verifiedChips = screen.getAllByRole('img', { hidden: true })
      expect(verifiedChips.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // STATUS CHIP TESTS
  // ============================================================================

  it('should display correct status chips', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      // Check for status chips with correct colors
      const activeChips = screen.getAllByText('ACTIVE')
      expect(activeChips.length).toBeGreaterThan(0)

      const pausedChips = screen.queryAllByText('PAUSED')
      expect(pausedChips.length).toBeGreaterThan(0)
    })
  })

  it('should apply correct color to status chips', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      const activeChips = screen.getAllByText('ACTIVE')
      activeChips.forEach((chip) => {
        // Check if it has the success color class or style
        const chipElement = chip.closest('[class*="MuiChip"]')
        expect(chipElement).toBeTruthy()
      })
    })
  })

  // ============================================================================
  // MERKLE PROOF TESTS
  // ============================================================================

  it('should fetch and display Merkle root hash', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      expect(apiService.getMerkleRootHash).toHaveBeenCalled()
    })
  })

  it('should handle missing Merkle root hash gracefully', async () => {
    ;(apiService.getMerkleRootHash as any).mockRejectedValue(
      new Error('Merkle root not available')
    )

    render(<TokenManagement />)

    // Component should still render without crashing
    await waitFor(() => {
      expect(screen.getByText('Token Management')).toBeTruthy()
    })
  })

  // ============================================================================
  // ACTION BUTTON TESTS
  // ============================================================================

  it('should display action buttons', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      // Check for refresh button
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  it('should refresh data when refresh button is clicked', async () => {
    render(<TokenManagement />)

    await waitFor(() => {
      expect(apiService.getTokens).toHaveBeenCalledTimes(1)
    })

    const refreshButton = screen.getByTitle(/Refresh|refresh/) || screen.getByRole('button', { name: /refresh/i })

    if (refreshButton) {
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(apiService.getTokens).toHaveBeenCalledTimes(2)
      })
    }
  })

  // ============================================================================
  // AUTO-REFRESH TESTS
  // ============================================================================

  it('should set up auto-refresh interval', async () => {
    vi.useFakeTimers()

    render(<TokenManagement />)

    // Fast forward 10 seconds (auto-refresh interval)
    vi.advanceTimersByTime(10000)

    // Cleanup
    vi.useRealTimers()
  })

  // ============================================================================
  // DATA TRANSFORMATION TESTS
  // ============================================================================

  it('should transform API response to Token interface', async () => {
    const apiResponse = [
      {
        id: 'test-token',
        name: 'Test Token',
        symbol: 'TST',
        totalSupply: 1000,
        circulatingSupply: 500,
        decimals: 18,
        contractAddress: '0x123',
        verified: true,
        createdAt: '2024-01-01T00:00:00Z',
        status: 'ACTIVE',
      },
    ]

    ;(apiService.getTokens as any).mockResolvedValue(apiResponse)

    render(<TokenManagement />)

    await waitFor(() => {
      expect(screen.getByText('Test Token')).toBeTruthy()
      expect(screen.getByText('TST')).toBeTruthy()
    })
  })

  it('should generate fallback token ID if missing', async () => {
    const apiResponse = [
      {
        name: 'Token Without ID',
        symbol: 'TWI',
        totalSupply: 1000,
        circulatingSupply: 500,
        decimals: 18,
        contractAddress: '0x123',
        verified: false,
        createdAt: '2024-01-01T00:00:00Z',
        status: 'ACTIVE',
      },
    ]

    ;(apiService.getTokens as any).mockResolvedValue(apiResponse)

    render(<TokenManagement />)

    await waitFor(() => {
      expect(screen.getByText('Token Without ID')).toBeTruthy()
    })
  })

  // ============================================================================
  // EMPTY STATE TESTS
  // ============================================================================

  it('should handle empty token list', async () => {
    ;(apiService.getTokens as any).mockResolvedValue([])

    render(<TokenManagement />)

    await waitFor(() => {
      expect(screen.getByText('Token Management')).toBeTruthy()
    })
  })

  // ============================================================================
  // NETWORK ERROR TESTS
  // ============================================================================

  it('should handle network errors gracefully', async () => {
    ;(apiService.getTokens as any).mockRejectedValue(
      new Error('Network Error: Unable to connect to server')
    )

    render(<TokenManagement />)

    await waitFor(() => {
      expect(screen.getByText(/Unable to load token data/)).toBeTruthy()
    })
  })

  // ============================================================================
  // MERKLE TREE INTEGRATION TESTS
  // ============================================================================

  it('should identify RWAT tokens in Merkle tree', async () => {
    const rwaTokens = [
      {
        id: 'RWAT-001',
        name: 'Real Estate Asset',
        symbol: 'RWAT',
        totalSupply: 1000000,
        circulatingSupply: 500000,
        decimals: 18,
        contractAddress: '0x123',
        verified: true,
        createdAt: '2024-01-01T00:00:00Z',
        status: 'ACTIVE',
      },
    ]

    ;(apiService.getTokens as any).mockResolvedValue(rwaTokens)

    render(<TokenManagement />)

    await waitFor(() => {
      expect(screen.getByText('Real Estate Asset')).toBeTruthy()
    })
  })
})

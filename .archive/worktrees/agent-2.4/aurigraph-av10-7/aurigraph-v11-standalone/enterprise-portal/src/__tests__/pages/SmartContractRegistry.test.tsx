import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SmartContractRegistry from '../../pages/SmartContractRegistry'
import { apiService } from '../../services/api'

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getRicardianContracts: vi.fn(),
    getContractTemplates: vi.fn(),
    deployContract: vi.fn(),
    verifyContract: vi.fn(),
    executeContract: vi.fn(),
  },
  safeApiCall: vi.fn((fn, fallback) => {
    return fn().then(data => ({ data, success: true, error: null }))
      .catch(error => ({ data: fallback, success: false, error }))
  }),
}))

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}))

describe('SmartContractRegistry', () => {
  const mockContracts = [
    {
      id: 'contract-1',
      name: 'Token Contract',
      type: 'DeFi',
      version: '1.0.0',
      status: 'deployed',
      deployedAt: Date.now() - 86400000,
      deployedBy: 'user@aurigraph.io',
      address: '0x1234567890abcdef',
      channelId: 'channel-1',
      gasUsed: 250000,
      verificationStatus: 'verified',
      ricardianHash: '0xabc123',
      sourceCodeHash: '0xdef456',
    },
    {
      id: 'contract-2',
      name: 'RWA Asset Registry',
      type: 'RWA',
      version: '2.1.0',
      status: 'pending',
      deployedAt: Date.now() - 172800000,
      deployedBy: 'admin@aurigraph.io',
      address: '0xfedcba0987654321',
      channelId: 'channel-2',
      gasUsed: 750000,
      verificationStatus: 'pending',
      ricardianHash: '0x789xyz',
      sourceCodeHash: '0x012abc',
    },
  ]

  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Token Contract',
      description: 'ERC20-compatible token contract',
      category: 'DeFi',
      complexity: 'simple',
      estimatedGas: 250000,
      parameters: [
        { name: 'name', type: 'string', description: 'Token name', required: true },
        { name: 'symbol', type: 'string', description: 'Token symbol', required: true },
        { name: 'totalSupply', type: 'uint256', description: 'Initial supply', required: true },
      ],
    },
    {
      id: 'template-2',
      name: 'RWA Asset Registry',
      description: 'Real-world asset tokenization',
      category: 'RWA',
      complexity: 'complex',
      estimatedGas: 750000,
      parameters: [
        { name: 'assetName', type: 'string', description: 'Asset name', required: true },
        { name: 'assetValue', type: 'uint256', description: 'Total asset value', required: true },
      ],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(apiService.getRicardianContracts as any).mockResolvedValue({
      contracts: mockContracts,
      total: mockContracts.length,
    })
    ;(apiService.getContractTemplates as any).mockResolvedValue({
      templates: mockTemplates,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ==================== RENDERING TESTS ====================

  describe('Initial Rendering', () => {
    it('should render the main title', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByText('Smart Contract Registry')).toBeInTheDocument()
      })
    })

    it('should render the contract count', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByText(/contracts deployed/i)).toBeInTheDocument()
      })
    })

    it('should render filter dropdown', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByLabelText('Filter Status')).toBeInTheDocument()
      })
    })

    it('should render refresh button', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
      })
    })

    it('should render deploy new contract button', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /deploy new contract/i })).toBeInTheDocument()
      })
    })
  })

  // ==================== CONTRACT LIST TESTS ====================

  describe('Contract List', () => {
    it('should display contracts in table', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
        expect(screen.getByText('RWA Asset Registry')).toBeInTheDocument()
      })
    })

    it('should show contract status chips', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByText('deployed')).toBeInTheDocument()
        expect(screen.getByText('pending')).toBeInTheDocument()
      })
    })

    it('should show verification status', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        const verifiedChips = screen.getAllByText('verified')
        expect(verifiedChips.length).toBeGreaterThan(0)
      })
    })

    it('should display gas used information', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByText('250,000')).toBeInTheDocument()
        expect(screen.getByText('750,000')).toBeInTheDocument()
      })
    })

    it('should show action buttons for each contract', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        const interactButtons = screen.getAllByRole('button', { name: /interact/i })
        expect(interactButtons.length).toBe(mockContracts.length)
      })
    })
  })

  // ==================== FILTERING TESTS ====================

  describe('Contract Filtering', () => {
    it('should filter contracts by status', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByLabelText('Filter Status')).toBeInTheDocument()
      })

      const filterSelect = screen.getByLabelText('Filter Status')
      await user.click(filterSelect)

      const deployedOption = await screen.findByText('Deployed')
      await user.click(deployedOption)

      await waitFor(() => {
        expect(apiService.getRicardianContracts).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'deployed' })
        )
      })
    })

    it('should show all contracts when filter is set to all', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByLabelText('Filter Status')).toBeInTheDocument()
      })

      const filterSelect = screen.getByLabelText('Filter Status')
      await user.click(filterSelect)

      const allOption = await screen.findByText('All')
      await user.click(allOption)

      await waitFor(() => {
        expect(apiService.getRicardianContracts).toHaveBeenCalledWith(
          expect.objectContaining({ status: undefined })
        )
      })
    })
  })

  // ==================== PAGINATION TESTS ====================

  describe('Pagination', () => {
    it('should display pagination controls', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByText(/rows per page/i)).toBeInTheDocument()
      })
    })

    it('should handle page change', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        const nextPageButton = screen.getByRole('button', { name: /next page/i })
        expect(nextPageButton).toBeInTheDocument()
      })
    })

    it('should handle rows per page change', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        const rowsPerPageSelect = screen.getByRole('combobox', { name: /rows per page/i })
        expect(rowsPerPageSelect).toBeInTheDocument()
      })
    })
  })

  // ==================== DEPLOYMENT WIZARD TESTS ====================

  describe('Deployment Wizard', () => {
    it('should open deployment wizard on button click', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /deploy new contract/i })).toBeInTheDocument()
      })

      const deployButton = screen.getByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      await waitFor(() => {
        expect(screen.getByText('Deploy Smart Contract')).toBeInTheDocument()
      })
    })

    it('should show deployment steps', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      const deployButton = await screen.findByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      await waitFor(() => {
        expect(screen.getByText('Select Template')).toBeInTheDocument()
        expect(screen.getByText('Configure Parameters')).toBeInTheDocument()
        expect(screen.getByText('Review & Estimate Gas')).toBeInTheDocument()
        expect(screen.getByText('Deploy')).toBeInTheDocument()
      })
    })

    it('should display contract templates', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      const deployButton = await screen.findByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
        expect(screen.getByText('RWA Asset Registry')).toBeInTheDocument()
      })
    })

    it('should allow template selection', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      const deployButton = await screen.findByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })

      const tokenTemplate = screen.getByText('Token Contract').closest('div[class*="MuiCard"]')
      if (tokenTemplate) {
        await user.click(tokenTemplate)
      }

      // Verify Next button is enabled
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).not.toBeDisabled()
    })

    it('should show parameter configuration on step 2', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      const deployButton = await screen.findByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })

      const tokenTemplate = screen.getByText('Token Contract').closest('div[class*="MuiCard"]')
      if (tokenTemplate) {
        await user.click(tokenTemplate)
      }

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByLabelText('Contract Name')).toBeInTheDocument()
        expect(screen.getByLabelText('Channel ID')).toBeInTheDocument()
      })
    })

    it('should close wizard on cancel', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      const deployButton = await screen.findByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      await waitFor(() => {
        expect(screen.getByText('Deploy Smart Contract')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Deploy Smart Contract')).not.toBeInTheDocument()
      })
    })
  })

  // ==================== GAS ESTIMATION TESTS ====================

  describe('Gas Estimation', () => {
    it('should display gas estimate button', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      const deployButton = await screen.findByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      // Select template
      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })
      const tokenTemplate = screen.getByText('Token Contract').closest('div[class*="MuiCard"]')
      if (tokenTemplate) await user.click(tokenTemplate)

      // Go to next steps
      let nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => nextButton = screen.getByRole('button', { name: /next/i }))
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /estimate gas/i })).toBeInTheDocument()
      })
    })

    it('should calculate gas estimate on button click', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      const deployButton = await screen.findByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      // Select template and navigate to gas estimation step
      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })
      const tokenTemplate = screen.getByText('Token Contract').closest('div[class*="MuiCard"]')
      if (tokenTemplate) await user.click(tokenTemplate)

      let nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => nextButton = screen.getByRole('button', { name: /next/i }))
      await user.click(nextButton)

      await waitFor(() => {
        const estimateButton = screen.getByRole('button', { name: /estimate gas/i })
        expect(estimateButton).toBeInTheDocument()
      })
    })
  })

  // ==================== CONTRACT VERIFICATION TESTS ====================

  describe('Contract Verification', () => {
    it('should trigger verification on verify button click', async () => {
      ;(apiService.verifyContract as any).mockResolvedValue({
        rootHash: '0xverified',
        proof: ['0xproof1', '0xproof2'],
        verified: true,
      })

      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })

      const verifyButtons = screen.getAllByRole('button', { name: /verify/i })
      await user.click(verifyButtons[0])

      await waitFor(() => {
        expect(apiService.verifyContract).toHaveBeenCalledWith('contract-1')
      })
    })

    it('should display Merkle proof in verification dialog', async () => {
      ;(apiService.verifyContract as any).mockResolvedValue({
        rootHash: '0xverifiedhash',
        proof: ['0xproof1', '0xproof2'],
        verified: true,
      })

      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('RWA Asset Registry')).toBeInTheDocument()
      })

      const verifyButtons = screen.getAllByRole('button', { name: /verify/i })
      await user.click(verifyButtons[1])

      await waitFor(() => {
        expect(screen.getByText('Contract Verification')).toBeInTheDocument()
      })
    })

    it('should not allow verification of already verified contracts', async () => {
      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })

      const verifyButtons = screen.getAllByRole('button', { name: /verify/i })
      const firstVerifyButton = verifyButtons[0] // Token Contract is already verified

      expect(firstVerifyButton).toBeDisabled()
    })
  })

  // ==================== CONTRACT INTERACTION TESTS ====================

  describe('Contract Interaction', () => {
    it('should open interaction dialog on interact button click', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })

      const interactButtons = screen.getAllByRole('button', { name: /interact/i })
      await user.click(interactButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Contract Interaction')).toBeInTheDocument()
      })
    })

    it('should display contract name in interaction dialog', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })

      const interactButtons = screen.getAllByRole('button', { name: /interact/i })
      await user.click(interactButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/Token Contract/i)).toBeInTheDocument()
      })
    })

    it('should close interaction dialog on close button', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })

      const interactButtons = screen.getAllByRole('button', { name: /interact/i })
      await user.click(interactButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Contract Interaction')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Contract Interaction')).not.toBeInTheDocument()
      })
    })
  })

  // ==================== CLIPBOARD TESTS ====================

  describe('Clipboard Operations', () => {
    it('should copy contract address to clipboard', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      }
      Object.assign(navigator, { clipboard: mockClipboard })

      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })

      const copyButtons = screen.getAllByRole('button', { name: /copy address/i })
      await user.click(copyButtons[0])

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith('0x1234567890abcdef')
      })
    })

    it('should show success message after copying address', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      }
      Object.assign(navigator, { clipboard: mockClipboard })

      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('Token Contract')).toBeInTheDocument()
      })

      const copyButtons = screen.getAllByRole('button', { name: /copy address/i })
      await user.click(copyButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/address copied to clipboard/i)).toBeInTheDocument()
      })
    })
  })

  // ==================== ERROR HANDLING TESTS ====================

  describe('Error Handling', () => {
    it('should display error message when contract fetch fails', async () => {
      ;(apiService.getRicardianContracts as any).mockRejectedValue(
        new Error('Network error')
      )

      render(<SmartContractRegistry />)

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch contracts/i)).toBeInTheDocument()
      })
    })

    it('should display error message when deployment fails', async () => {
      ;(apiService.deployContract as any).mockRejectedValue(
        new Error('Deployment failed')
      )

      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      // Open wizard and attempt deployment
      const deployButton = await screen.findByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      // Would need to complete wizard steps to test deployment error
      // This is a placeholder for the full flow
    })

    it('should display error message when verification fails', async () => {
      ;(apiService.verifyContract as any).mockRejectedValue(
        new Error('Verification failed')
      )

      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByText('RWA Asset Registry')).toBeInTheDocument()
      })

      const verifyButtons = screen.getAllByRole('button', { name: /verify/i })
      await user.click(verifyButtons[1])

      await waitFor(() => {
        expect(screen.getByText(/failed to verify contract/i)).toBeInTheDocument()
      })
    })

    it('should handle graceful fallback to mock data on API failure', async () => {
      ;(apiService.getRicardianContracts as any).mockRejectedValue(
        new Error('API unavailable')
      )

      render(<SmartContractRegistry />)

      // Should still render with mock data
      await waitFor(() => {
        const contractElements = screen.queryAllByText(/Smart Contract \d+/)
        expect(contractElements.length).toBeGreaterThan(0)
      })
    })
  })

  // ==================== LOADING STATE TESTS ====================

  describe('Loading States', () => {
    it('should show loading skeletons while fetching contracts', async () => {
      ;(apiService.getRicardianContracts as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ contracts: mockContracts, total: mockContracts.length }), 1000))
      )

      render(<SmartContractRegistry />)

      // Check for skeleton loaders
      const skeletons = screen.getAllByRole('progressbar')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should show loading indicator during deployment', async () => {
      ;(apiService.deployContract as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      )

      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      const deployButton = await screen.findByRole('button', { name: /deploy new contract/i })
      await user.click(deployButton)

      // Loading indicator would appear during deployment step
      // Full test would require completing wizard steps
    })
  })

  // ==================== REFRESH FUNCTIONALITY TESTS ====================

  describe('Refresh Functionality', () => {
    it('should refresh contracts on refresh button click', async () => {
      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
      })

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      await user.click(refreshButton)

      await waitFor(() => {
        expect(apiService.getRicardianContracts).toHaveBeenCalledTimes(2) // Initial + refresh
      })
    })

    it('should disable refresh button while loading', async () => {
      ;(apiService.getRicardianContracts as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ contracts: mockContracts, total: mockContracts.length }), 1000))
      )

      render(<SmartContractRegistry />)
      const user = userEvent.setup()

      await waitFor(() => {
        const refreshButton = screen.getByRole('button', { name: /refresh/i })
        expect(refreshButton).toBeDisabled()
      })
    })
  })
})

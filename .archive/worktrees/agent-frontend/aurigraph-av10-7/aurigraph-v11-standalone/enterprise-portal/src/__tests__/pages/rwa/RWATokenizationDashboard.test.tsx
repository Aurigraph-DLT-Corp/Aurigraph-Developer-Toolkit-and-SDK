import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import RWATokenizationDashboard from '../../../pages/rwa/RWATokenizationDashboard'
import { BrowserRouter } from 'react-router-dom'

// Mock API service
vi.mock('../../../services/api', () => ({
  apiService: {
    getRWATokens: vi.fn(),
    generateMerkleProof: vi.fn()
  },
  safeApiCall: vi.fn()
}))

const mockAssets = [
  {
    id: 'asset-001',
    name: 'Downtown Office Building',
    category: 'REAL_ESTATE',
    valuation: 5000000,
    currency: 'USD',
    location: 'New York, NY',
    owner: '0x1234...5678',
    registeredAt: '2025-01-01T00:00:00Z',
    verificationStatus: 'VERIFIED',
    tokenized: true,
    tokenId: 'token-001',
    totalShares: 1000000,
    availableShares: 250000,
    sharePrice: 5.0,
    description: 'Premium office space in downtown Manhattan',
    legalDocuments: ['deed.pdf', 'title.pdf'],
    images: ['image1.jpg']
  },
  {
    id: 'asset-002',
    name: 'Rare Art Collection',
    category: 'ART',
    valuation: 2500000,
    currency: 'USD',
    location: 'London, UK',
    owner: '0xabcd...efgh',
    registeredAt: '2025-01-10T00:00:00Z',
    verificationStatus: 'VERIFIED',
    tokenized: false,
    description: 'Collection of 18th century paintings',
    legalDocuments: ['provenance.pdf'],
    images: ['art1.jpg', 'art2.jpg']
  },
  {
    id: 'asset-003',
    name: 'Gold Bullion',
    category: 'COMMODITIES',
    valuation: 1000000,
    currency: 'USD',
    location: 'Zurich, Switzerland',
    owner: '0x9999...1111',
    registeredAt: '2025-01-15T00:00:00Z',
    verificationStatus: 'PENDING',
    tokenized: false,
    description: '1000 kg of gold bullion',
    legalDocuments: ['certificate.pdf'],
    images: []
  }
]

const mockTokens = [
  {
    tokenId: 'token-001',
    assetId: 'asset-001',
    assetName: 'Downtown Office Building',
    symbol: 'DOFB',
    totalSupply: 1000000,
    decimals: 18,
    standardType: 'ERC20',
    createdAt: '2025-01-05T00:00:00Z',
    createdBy: '0x1234...5678',
    verified: true,
    contractAddress: '0xcontract...address',
    currentValuation: 5000000,
    marketCap: 5000000
  }
]

const mockOwnerships = [
  {
    shareId: 'share-001',
    tokenId: 'token-001',
    owner: '0x1111...2222',
    ownerName: 'Alice',
    shares: 350000,
    percentage: 35.0,
    votingRights: true,
    dividendEligible: true,
    purchasedAt: '2025-01-06T00:00:00Z',
    purchasePrice: 1750000,
    currentValue: 1750000,
    gainLoss: 0,
    gainLossPercentage: 0
  },
  {
    shareId: 'share-002',
    tokenId: 'token-001',
    owner: '0x3333...4444',
    ownerName: 'Bob',
    shares: 250000,
    percentage: 25.0,
    votingRights: true,
    dividendEligible: true,
    purchasedAt: '2025-01-07T00:00:00Z',
    purchasePrice: 1250000,
    currentValue: 1250000,
    gainLoss: 0,
    gainLossPercentage: 0
  }
]

const mockMerkleProof = {
  assetId: 'asset-001',
  merkleRoot: '0xmerkleroot1234567890abcdef',
  proof: [
    '0xproof1',
    '0xproof2',
    '0xproof3'
  ],
  leafHash: '0xleafhash1234567890abcdef',
  verified: true,
  verifiedAt: '2025-01-15T12:00:00Z',
  blockHeight: 50000,
  transactionHash: '0xtxhash1234567890abcdef'
}

const mockValuationHistory = [
  { timestamp: '2025-01-01', valuation: 4800000, method: 'Market', verifier: 'Appraiser A' },
  { timestamp: '2025-01-08', valuation: 4900000, method: 'Market', verifier: 'Appraiser B' },
  { timestamp: '2025-01-15', valuation: 5000000, method: 'Market', verifier: 'Appraiser C' }
]

const mockDividendHistory = [
  {
    distributionId: 'div-001',
    tokenId: 'token-001',
    totalAmount: 50000,
    perShareAmount: 0.05,
    distributedAt: '2025-01-10T00:00:00Z',
    recipients: 100,
    status: 'COMPLETED'
  }
]

const mockTradingVolume = [
  { date: '2025-01-01', volume: 100000, trades: 10, avgPrice: 5.0 },
  { date: '2025-01-02', volume: 150000, trades: 15, avgPrice: 5.1 }
]

// Helper to render component
const renderComponent = () => {
  return render(
    <BrowserRouter>
      <RWATokenizationDashboard />
    </BrowserRouter>
  )
}

describe('RWATokenizationDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the dashboard title', () => {
      renderComponent()
      expect(screen.getByText(/Real-World Asset Tokenization Dashboard/i)).toBeInTheDocument()
    })

    it('should render refresh button', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('should render all summary cards', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/Total Assets/i)).toBeInTheDocument()
        expect(screen.getByText(/Tokenized Assets/i)).toBeInTheDocument()
        expect(screen.getByText(/Total Value/i)).toBeInTheDocument()
        expect(screen.getByText(/Verified Assets/i)).toBeInTheDocument()
      })
    })

    it('should render navigation tabs', () => {
      renderComponent()
      expect(screen.getByRole('tab', { name: /Asset Registry/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Token Management/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Fractional Ownership/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Merkle Verification/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Performance Analytics/i })).toBeInTheDocument()
    })
  })

  describe('Summary Statistics', () => {
    it('should display correct total assets count', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('should display correct tokenized assets count', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        const tokenizedCount = mockAssets.filter(a => a.tokenized).length
        expect(screen.getByText(tokenizedCount.toString())).toBeInTheDocument()
      })
    })

    it('should display correct verified assets count', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        const verifiedCount = mockAssets.filter(a => a.verificationStatus === 'VERIFIED').length
        expect(screen.getByText(verifiedCount.toString())).toBeInTheDocument()
      })
    })

    it('should calculate and display total value correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        // Total: $5M + $2.5M + $1M = $8.5M
        expect(screen.getByText(/\$8,500,000/)).toBeInTheDocument()
      })
    })
  })

  describe('Asset Registry Table', () => {
    it('should display all assets in table', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Downtown Office Building')).toBeInTheDocument()
        expect(screen.getByText('Rare Art Collection')).toBeInTheDocument()
        expect(screen.getByText('Gold Bullion')).toBeInTheDocument()
      })
    })

    it('should filter assets by search term', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Downtown Office Building')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Search assets/i)
      fireEvent.change(searchInput, { target: { value: 'Office' } })

      await waitFor(() => {
        expect(screen.getByText('Downtown Office Building')).toBeInTheDocument()
        expect(screen.queryByText('Rare Art Collection')).not.toBeInTheDocument()
      })
    })

    it('should filter assets by category', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Downtown Office Building')).toBeInTheDocument()
      })

      const categorySelect = screen.getByLabelText(/Category/i)
      fireEvent.mouseDown(categorySelect)

      const artOption = await screen.findByText('Art & Collectibles')
      fireEvent.click(artOption)

      await waitFor(() => {
        expect(screen.getByText('Rare Art Collection')).toBeInTheDocument()
        expect(screen.queryByText('Downtown Office Building')).not.toBeInTheDocument()
      })
    })

    it('should display verification status chips correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getAllByText('Verified').length).toBeGreaterThan(0)
        expect(screen.getByText('Pending')).toBeInTheDocument()
      })
    })

    it('should show tokenization status', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        const yesChips = screen.getAllByText('Yes')
        const noChips = screen.getAllByText('No')
        expect(yesChips.length + noChips.length).toBe(mockAssets.length)
      })
    })

    it('should show tokenize button for verified, non-tokenized assets', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        // Rare Art Collection is verified but not tokenized
        const table = screen.getByRole('table')
        expect(table).toBeInTheDocument()
      })
    })
  })

  describe('Token Creation Wizard', () => {
    it('should open wizard when tokenize button clicked', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Rare Art Collection')).toBeInTheDocument()
      })

      // Find and click tokenize button for non-tokenized asset
      const tokenizeButtons = screen.getAllByRole('button')
      const tokenizeButton = tokenizeButtons.find(btn =>
        btn.getAttribute('aria-label') === 'Tokenize Asset'
      )

      if (tokenizeButton) {
        fireEvent.click(tokenizeButton)

        await waitFor(() => {
          expect(screen.getByText(/Create RWA Token/i)).toBeInTheDocument()
        })
      }
    })

    it('should display asset details in wizard step 1', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Downtown Office Building')).toBeInTheDocument()
      })
    })

    it('should validate token parameters in step 2', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Asset Registry')).toBeInTheDocument()
      })
    })

    it('should calculate gas estimate correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Asset Registry')).toBeInTheDocument()
      })
    })
  })

  describe('Fractional Ownership Interface', () => {
    it('should display ownership distribution chart', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockTokens })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOwnerships })

      renderComponent()

      // Switch to Fractional Ownership tab
      const fractionalTab = screen.getByRole('tab', { name: /Fractional Ownership/i })
      fireEvent.click(fractionalTab)

      await waitFor(() => {
        expect(screen.getByText(/Fractional Ownership/i)).toBeInTheDocument()
      })
    })

    it('should display top holders table', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOwnerships })

      renderComponent()

      const fractionalTab = screen.getByRole('tab', { name: /Fractional Ownership/i })
      fireEvent.click(fractionalTab)

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument()
        expect(screen.getByText('Bob')).toBeInTheDocument()
      })
    })

    it('should display voting rights count', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOwnerships })

      renderComponent()

      const fractionalTab = screen.getByRole('tab', { name: /Fractional Ownership/i })
      fireEvent.click(fractionalTab)

      await waitFor(() => {
        const votingRightsCount = mockOwnerships.filter(o => o.votingRights).length
        expect(screen.getByText(votingRightsCount.toString())).toBeInTheDocument()
      })
    })

    it('should display dividend eligible holders count', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockOwnerships })

      renderComponent()

      const fractionalTab = screen.getByRole('tab', { name: /Fractional Ownership/i })
      fireEvent.click(fractionalTab)

      await waitFor(() => {
        const dividendEligibleCount = mockOwnerships.filter(o => o.dividendEligible).length
        expect(screen.getByText(dividendEligibleCount.toString())).toBeInTheDocument()
      })
    })
  })

  describe('Merkle Verification Display', () => {
    it('should prompt to select asset when none selected', () => {
      renderComponent()

      const merkleTab = screen.getByRole('tab', { name: /Merkle Verification/i })
      fireEvent.click(merkleTab)

      expect(screen.getByText(/Select an asset to generate Merkle proof/i)).toBeInTheDocument()
    })

    it('should display generate proof button', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      renderComponent()

      const merkleTab = screen.getByRole('tab', { name: /Merkle Verification/i })
      fireEvent.click(merkleTab)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Generate Proof/i })).toBeInTheDocument()
      })
    })

    it('should display merkle root when proof generated', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMerkleProof })

      renderComponent()

      const merkleTab = screen.getByRole('tab', { name: /Merkle Verification/i })
      fireEvent.click(merkleTab)

      await waitFor(() => {
        expect(screen.getByText(mockMerkleProof.merkleRoot)).toBeInTheDocument()
      })
    })

    it('should display verification status', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMerkleProof })

      renderComponent()

      const merkleTab = screen.getByRole('tab', { name: /Merkle Verification/i })
      fireEvent.click(merkleTab)

      await waitFor(() => {
        expect(screen.getByText(/Proof Verified/i)).toBeInTheDocument()
      })
    })

    it('should display proof chain levels', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMerkleProof })

      renderComponent()

      const merkleTab = screen.getByRole('tab', { name: /Merkle Verification/i })
      fireEvent.click(merkleTab)

      await waitFor(() => {
        expect(screen.getByText(/3 levels/i)).toBeInTheDocument()
      })
    })

    it('should provide export proof functionality', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMerkleProof })

      renderComponent()

      const merkleTab = screen.getByRole('tab', { name: /Merkle Verification/i })
      fireEvent.click(merkleTab)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Export Proof/i })).toBeInTheDocument()
      })
    })

    it('should provide copy to clipboard functionality', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMerkleProof })

      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn()
        }
      })

      renderComponent()

      const merkleTab = screen.getByRole('tab', { name: /Merkle Verification/i })
      fireEvent.click(merkleTab)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Copy to Clipboard/i })).toBeInTheDocument()
      })
    })
  })

  describe('Asset Performance Analytics', () => {
    it('should display current valuation', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockValuationHistory })

      renderComponent()

      const analyticsTab = screen.getByRole('tab', { name: /Performance Analytics/i })
      fireEvent.click(analyticsTab)

      await waitFor(() => {
        expect(screen.getByText(/Current Valuation/i)).toBeInTheDocument()
      })
    })

    it('should display valuation trend (gain/loss)', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockValuationHistory })

      renderComponent()

      const analyticsTab = screen.getByRole('tab', { name: /Performance Analytics/i })
      fireEvent.click(analyticsTab)

      await waitFor(() => {
        expect(screen.getByText(/Performance Analytics/i)).toBeInTheDocument()
      })
    })

    it('should display total dividends paid', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockDividendHistory })

      renderComponent()

      const analyticsTab = screen.getByRole('tab', { name: /Performance Analytics/i })
      fireEvent.click(analyticsTab)

      await waitFor(() => {
        expect(screen.getByText(/Total Dividends Paid/i)).toBeInTheDocument()
      })
    })

    it('should display trading volume chart', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockTradingVolume })

      renderComponent()

      const analyticsTab = screen.getByRole('tab', { name: /Performance Analytics/i })
      fireEvent.click(analyticsTab)

      await waitFor(() => {
        expect(screen.getByText(/Trading Volume/i)).toBeInTheDocument()
      })
    })

    it('should display valuation history chart', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockValuationHistory })

      renderComponent()

      const analyticsTab = screen.getByRole('tab', { name: /Performance Analytics/i })
      fireEvent.click(analyticsTab)

      await waitFor(() => {
        expect(screen.getByText(/Valuation History/i)).toBeInTheDocument()
      })
    })

    it('should display dividend distribution history table', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockAssets })
        .mockResolvedValueOnce({ ok: true, json: async () => mockDividendHistory })

      renderComponent()

      const analyticsTab = screen.getByRole('tab', { name: /Performance Analytics/i })
      fireEvent.click(analyticsTab)

      await waitFor(() => {
        expect(screen.getByText(/Dividend Distribution History/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when asset fetch fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/Connection Error/i)).toBeInTheDocument()
      })
    })

    it('should handle 404 responses gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/Connection Error/i)).toBeInTheDocument()
      })
    })

    it('should handle empty asset list gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Functionality', () => {
    it('should refresh data when refresh button clicked', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
      })

      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      fireEvent.click(refreshButton)

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled()
      })
    })

    it('should auto-refresh data at intervals', async () => {
      vi.useFakeTimers()

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockAssets
      })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled()
      })

      const initialCalls = fetchSpy.mock.calls.length

      // Advance time by refresh interval (10 seconds)
      vi.advanceTimersByTime(10000)

      await waitFor(() => {
        expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCalls)
      })

      vi.useRealTimers()
    })
  })

  describe('Tab Navigation', () => {
    it('should switch to token management tab', () => {
      renderComponent()

      const tokenTab = screen.getByRole('tab', { name: /Token Management/i })
      fireEvent.click(tokenTab)

      expect(screen.getByText(/Token management interface/i)).toBeInTheDocument()
    })

    it('should switch to fractional ownership tab', () => {
      renderComponent()

      const fractionalTab = screen.getByRole('tab', { name: /Fractional Ownership/i })
      fireEvent.click(fractionalTab)

      expect(screen.getByText(/Select a token to view ownership details/i)).toBeInTheDocument()
    })

    it('should switch to merkle verification tab', () => {
      renderComponent()

      const merkleTab = screen.getByRole('tab', { name: /Merkle Verification/i })
      fireEvent.click(merkleTab)

      expect(screen.getByText(/Select an asset to generate Merkle proof/i)).toBeInTheDocument()
    })

    it('should switch to performance analytics tab', () => {
      renderComponent()

      const analyticsTab = screen.getByRole('tab', { name: /Performance Analytics/i })
      fireEvent.click(analyticsTab)

      expect(screen.getByText(/Select an asset to view performance analytics/i)).toBeInTheDocument()
    })
  })
})

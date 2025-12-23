import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ConsensusStateMonitor from '../../../pages/consensus/ConsensusStateMonitor'
import { BrowserRouter } from 'react-router-dom'

// Mock API service
vi.mock('../../../services/api', () => ({
  apiService: {},
  safeApiCall: vi.fn()
}))

const mockConsensusState = {
  state: 'LEADER',
  currentLeaderId: 'node-001',
  currentTerm: 42,
  currentEpoch: 100,
  currentRound: 1500,
  votedFor: 'node-001',
  lastBlockHash: '0x1234567890abcdef',
  lastBlockHeight: 50000,
  consensusHealth: 98.5,
  finalizedBlocks: 49950,
  pendingBlocks: 50
}

const mockLeaderInfo = {
  nodeId: 'node-001',
  nodeName: 'Leader Node 1',
  term: 42,
  electedAt: '2025-01-15T10:00:00Z',
  votingPower: 35.5,
  stability: 99.2,
  contributions: 15000,
  uptime: 99.9
}

const mockValidators = [
  {
    nodeId: 'node-001',
    nodeName: 'Validator 1',
    votingPower: 35.5,
    stake: 1000000,
    performance: 99.5,
    reliability: 99.8
  },
  {
    nodeId: 'node-002',
    nodeName: 'Validator 2',
    votingPower: 28.3,
    stake: 800000,
    performance: 98.2,
    reliability: 99.1
  }
]

const mockLeadershipChanges = [
  {
    timestamp: '2025-01-15T10:00:00Z',
    fromLeader: 'node-002',
    toLeader: 'node-001',
    term: 42,
    reason: 'Election',
    votesReceived: 85,
    totalVotes: 127
  }
]

const mockFinalityMetrics = {
  totalBlocks: 50000,
  finalizedBlocks: 49950,
  pendingBlocks: 50,
  orphanedBlocks: 5,
  finalityRate: 99.9,
  avgConfirmationTimeMs: 450,
  confidenceScore: 99.5,
  currentFinalityProgress: 99.9
}

const mockFinalityTrends = [
  { timestamp: '10:00', confirmationTimeMs: 400, blocksFinalized: 1000 },
  { timestamp: '11:00', confirmationTimeMs: 450, blocksFinalized: 1050 }
]

const mockConsensusMetrics = {
  validatorParticipationRate: 95.2,
  averageBlockTimeMs: 500,
  blockDifficulty: 15000000,
  consensusLatencyMs: 120,
  networkSyncStatus: 99.8,
  byzantineFaultTolerance: 33.3,
  activeValidators: 121,
  totalValidators: 127,
  missedBlockCount: 8
}

const mockLatencyDistribution = [
  { range: '0-100ms', count: 5000, percentage: 50 },
  { range: '100-200ms', count: 3000, percentage: 30 },
  { range: '200-500ms', count: 2000, percentage: 20 }
]

const mockActiveForks = [
  {
    forkId: 'fork-123',
    detectedAt: '2025-01-15T12:00:00Z',
    severity: 'MEDIUM' as const,
    status: 'RESOLVING' as const,
    baseBlockHeight: 49000,
    fork1Height: 49010,
    fork2Height: 49008,
    fork1Leader: 'node-001',
    fork2Leader: 'node-003',
    resolutionStrategy: 'Longest chain',
    resolutionTime: null,
    impactedTransactions: 150
  }
]

const mockForkHistory = [
  {
    timestamp: '2025-01-14T15:00:00Z',
    forkId: 'fork-100',
    strategy: 'Longest chain',
    durationMs: 5000,
    blocksRolledBack: 2,
    consensusReached: true
  }
]

// Helper to render component
const renderComponent = () => {
  return render(
    <BrowserRouter>
      <ConsensusStateMonitor />
    </BrowserRouter>
  )
}

describe('ConsensusStateMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render the consensus state monitor title', () => {
      renderComponent()
      expect(screen.getByText(/HyperRAFT\+\+ Consensus State Monitor/i)).toBeInTheDocument()
    })

    it('should render refresh button', () => {
      renderComponent()
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('should render all main sections', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConsensusState
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/Consensus Overview/i)).toBeInTheDocument()
      })
    })
  })

  describe('Consensus Overview Section', () => {
    it('should display consensus state badge', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConsensusState
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('LEADER')).toBeInTheDocument()
      })
    })

    it('should display current leader information', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConsensusState
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(mockConsensusState.currentLeaderId)).toBeInTheDocument()
      })
    })

    it('should display consensus health score', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConsensusState
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/98\.5%/)).toBeInTheDocument()
      })
    })

    it('should display epoch, round, and term', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConsensusState
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/100 \/ 1500 \/ 42/)).toBeInTheDocument()
      })
    })

    it('should display finalized and pending blocks', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConsensusState
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/Finalized: 49950/)).toBeInTheDocument()
        expect(screen.getByText(/Pending: 50/)).toBeInTheDocument()
      })
    })

    it('should display latest finalized block', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConsensusState
      })

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/#50000/)).toBeInTheDocument()
      })
    })
  })

  describe('Leader Election Tracking', () => {
    it('should display leader voting power', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockLeaderInfo })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/35\.5%/)).toBeInTheDocument()
      })
    })

    it('should display validator table', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockLeaderInfo })
        .mockResolvedValueOnce({ ok: true, json: async () => mockValidators })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('Validator 1')).toBeInTheDocument()
        expect(screen.getByText('Validator 2')).toBeInTheDocument()
      })
    })

    it('should display leadership change history', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockLeaderInfo })
        .mockResolvedValueOnce({ ok: true, json: async () => mockValidators })
        .mockResolvedValueOnce({ ok: true, json: async () => mockLeadershipChanges })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/node-002 → node-001/)).toBeInTheDocument()
      })
    })
  })

  describe('Block Finality Monitoring', () => {
    it('should display finality progress bar', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValue({ ok: true, json: async () => mockFinalityMetrics })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/99\.9%/)).toBeInTheDocument()
      })
    })

    it('should display average confirmation time', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockFinalityMetrics })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/450ms/)).toBeInTheDocument()
      })
    })

    it('should display orphaned blocks count', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockFinalityMetrics })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/Orphaned: 5/)).toBeInTheDocument()
      })
    })
  })

  describe('Consensus Metrics', () => {
    it('should display validator participation rate', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValue({ ok: true, json: async () => mockConsensusMetrics })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/95\.2%/)).toBeInTheDocument()
      })
    })

    it('should display average block time', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusMetrics })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/500ms/)).toBeInTheDocument()
      })
    })

    it('should display Byzantine fault tolerance margin', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusMetrics })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/33\.3%/)).toBeInTheDocument()
      })
    })

    it('should display active/total validators', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusMetrics })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/121 \/ 127 active/)).toBeInTheDocument()
      })
    })
  })

  describe('Fork Resolution & History', () => {
    it('should display active fork warning when forks exist', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValue({ ok: true, json: async () => mockActiveForks })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/Active Fork Detection/i)).toBeInTheDocument()
      })
    })

    it('should display fork severity levels', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockActiveForks })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('MEDIUM')).toBeInTheDocument()
      })
    })

    it('should display fork resolution strategy', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockActiveForks })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/Longest chain/)).toBeInTheDocument()
      })
    })

    it('should display impacted transactions count', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => mockActiveForks })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/150 txs/)).toBeInTheDocument()
      })
    })

    it('should show success message when no forks exist', async () => {
      const fetchSpy = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockConsensusState })
        .mockResolvedValueOnce({ ok: true, json: async () => [] })

      global.fetch = fetchSpy

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/No active forks detected/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('API Error'))

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
  })

  describe('Refresh Functionality', () => {
    it('should refresh data when refresh button clicked', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockConsensusState
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
        json: async () => mockConsensusState
      })

      global.fetch = fetchSpy

      renderComponent()

      // Wait for initial fetch
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled()
      })

      const initialCalls = fetchSpy.mock.calls.length

      // Advance time by refresh interval
      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(fetchSpy.mock.calls.length).toBeGreaterThan(initialCalls)
      })

      vi.useRealTimers()
    })
  })
})

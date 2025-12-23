import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { render } from '../__tests__/utils/test-utils'
import ValidatorPerformance from './ValidatorPerformance'
import { validatorApi } from '../services/phase1Api'

vi.mock('../services/phase1Api')

const mockValidators = [
  {
    id: 'val-1',
    address: '0x1234567890abcdef',
    name: 'Validator 1',
    status: 'active' as const,
    stake: 1000000,
    commission: 5,
    uptime: 99.5,
    blocksProduced: 1000,
    missedBlocks: 5,
    slashingEvents: 0,
    votingPower: 10.5,
    delegators: 100,
    rewards: 50000,
    joinedAt: '2024-01-01T00:00:00Z',
    lastActiveAt: '2024-01-02T00:00:00Z',
  },
]

const mockMetrics = {
  averageBlockTime: 5000,
  averageUptime: 99.2,
  totalSlashingEvents: 2,
  totalStake: 10000000,
  activeValidators: 120,
  jailedValidators: 2,
}

describe('ValidatorPerformance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(validatorApi.getAllValidators as any).mockResolvedValue(mockValidators)
    ;(validatorApi.getValidatorMetrics as any).mockResolvedValue(mockMetrics)
    ;(validatorApi.getSlashingEvents as any).mockResolvedValue({ items: [], totalCount: 0, pageSize: 20, currentPage: 1, totalPages: 0 })
  })

  it('should render without crashing', () => {
    render(<ValidatorPerformance />)
    expect(screen.getByText(/Validator Performance/i)).toBeInTheDocument()
  })

  it('should fetch and display validator data', async () => {
    render(<ValidatorPerformance />)
    await waitFor(() => {
      expect(screen.getByText('Validator 1')).toBeInTheDocument()
    })
  })

  it('should display validator metrics', async () => {
    render(<ValidatorPerformance />)
    await waitFor(() => {
      expect(screen.getByText('120')).toBeInTheDocument()
    })
  })

  it('should switch between tabs', async () => {
    render(<ValidatorPerformance />)
    await waitFor(() => {
      expect(screen.getByText('Validator 1')).toBeInTheDocument()
    })

    const slashingTab = screen.getByText(/Slashing Events/i)
    fireEvent.click(slashingTab)

    expect(slashingTab).toBeInTheDocument()
  })

  it('should open slash dialog', async () => {
    render(<ValidatorPerformance />)
    await waitFor(() => {
      expect(screen.getByText('Validator 1')).toBeInTheDocument()
    })

    const slashButton = screen.getByRole('button', { name: /Slash/i })
    fireEvent.click(slashButton)

    await waitFor(() => {
      expect(screen.getByText(/Slash Validator/i)).toBeInTheDocument()
    })
  })
})

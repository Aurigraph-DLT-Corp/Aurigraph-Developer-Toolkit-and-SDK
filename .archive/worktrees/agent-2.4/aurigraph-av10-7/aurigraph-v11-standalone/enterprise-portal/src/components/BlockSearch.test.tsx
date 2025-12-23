/**
 * BlockSearch.test.tsx - Test suite for BlockSearch component
 * Target: 85%+ coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { render } from '../__tests__/utils/test-utils'
import BlockSearch from './BlockSearch'
import { blockSearchApi } from '../services/phase1Api'

vi.mock('../services/phase1Api', () => ({
  blockSearchApi: {
    searchBlocks: vi.fn(),
    getBlockByHeight: vi.fn(),
    getBlockByHash: vi.fn(),
  },
}))

const mockSearchResult = {
  blocks: [
    {
      height: 12345,
      hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      timestamp: '2024-01-01T12:00:00Z',
      transactionCount: 150,
      size: 102400,
      validator: '0x1234567890abcdef1234567890abcdef12345678',
      parentHash: '0xparent',
      stateRoot: '0xstate',
      receiptsRoot: '0xreceipts',
      gasUsed: 5000000,
      gasLimit: 10000000,
    },
  ],
  totalCount: 1,
  pageSize: 20,
  currentPage: 1,
}

describe('BlockSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(blockSearchApi.searchBlocks as any).mockResolvedValue(mockSearchResult)
  })

  it('should render without crashing', () => {
    render(<BlockSearch />)
    expect(screen.getByText(/Block Search/i)).toBeInTheDocument()
  })

  it('should fetch blocks on mount', async () => {
    render(<BlockSearch />)
    await waitFor(() => {
      expect(blockSearchApi.searchBlocks).toHaveBeenCalled()
    })
  })

  it('should display search results', async () => {
    render(<BlockSearch />)
    await waitFor(() => {
      expect(screen.getByText('12345')).toBeInTheDocument()
    })
  })

  it('should handle quick search', async () => {
    ;(blockSearchApi.getBlockByHeight as any).mockResolvedValue(mockSearchResult.blocks[0])
    
    render(<BlockSearch />)
    
    const searchInput = screen.getByPlaceholderText(/Search by block height/i)
    fireEvent.change(searchInput, { target: { value: '12345' } })
    
    const searchButton = screen.getByText(/Quick Search/i)
    fireEvent.click(searchButton)
    
    await waitFor(() => {
      expect(blockSearchApi.getBlockByHeight).toHaveBeenCalledWith(12345)
    })
  })

  it('should toggle filters', () => {
    render(<BlockSearch />)
    
    const filterButton = screen.getByText(/Filters/i)
    fireEvent.click(filterButton)
    
    expect(screen.getByText(/Advanced Filters/i)).toBeVisible()
  })

  it('should apply filters', async () => {
    render(<BlockSearch />)
    
    const filterButton = screen.getByText(/Filters/i)
    fireEvent.click(filterButton)
    
    const applyButton = screen.getByText(/Apply Filters/i)
    fireEvent.click(applyButton)
    
    await waitFor(() => {
      expect(blockSearchApi.searchBlocks).toHaveBeenCalled()
    })
  })

  it('should clear filters', async () => {
    render(<BlockSearch />)
    
    const filterButton = screen.getByText(/Filters/i)
    fireEvent.click(filterButton)
    
    const clearButton = screen.getByText(/Clear/i)
    fireEvent.click(clearButton)
    
    expect(clearButton).toBeInTheDocument()
  })

  it('should handle pagination', async () => {
    const multiPageResult = {
      ...mockSearchResult,
      totalCount: 100,
    }
    ;(blockSearchApi.searchBlocks as any).mockResolvedValue(multiPageResult)
    
    render(<BlockSearch />)
    
    await waitFor(() => {
      const pagination = screen.getByRole('navigation')
      expect(pagination).toBeInTheDocument()
    })
  })

  it('should handle search errors', async () => {
    ;(blockSearchApi.searchBlocks as any).mockRejectedValue(new Error('Search failed'))
    
    render(<BlockSearch />)
    
    await waitFor(() => {
      expect(screen.getByText(/Search failed/i)).toBeInTheDocument()
    })
  })

  it('should display no results message', async () => {
    ;(blockSearchApi.searchBlocks as any).mockResolvedValue({
      blocks: [],
      totalCount: 0,
      pageSize: 20,
      currentPage: 1,
    })
    
    render(<BlockSearch />)
    
    await waitFor(() => {
      expect(screen.getByText(/No blocks found/i)).toBeInTheDocument()
    })
  })
})

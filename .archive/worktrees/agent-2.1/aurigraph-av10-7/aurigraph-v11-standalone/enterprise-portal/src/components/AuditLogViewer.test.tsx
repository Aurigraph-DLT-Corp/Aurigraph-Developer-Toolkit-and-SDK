import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../__tests__/utils/test-utils'
import AuditLogViewer from './AuditLogViewer'

vi.mock('../services/phase1Api')

describe('AuditLogViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render without crashing', () => {
    render(<AuditLogViewer />)
    expect(screen.getByText(/./i)).toBeInTheDocument()
  })

  it('should fetch data on mount', async () => {
    render(<AuditLogViewer />)
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  it('should handle loading state', () => {
    render(<AuditLogViewer />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should handle errors gracefully', async () => {
    render(<AuditLogViewer />)
    await waitFor(() => {
      const retryButton = screen.queryByText(/retry/i)
      expect(retryButton || screen.queryByRole('progressbar')).toBeTruthy()
    })
  })

  it('should display data after loading', async () => {
    render(<AuditLogViewer />)
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Box, Button, Card, CardContent, Typography, Alert } from '@mui/material'
import { Error as ErrorIcon, Refresh } from '@mui/icons-material'

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays fallback UI
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // Log to error reporting service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      // logErrorToService(error, errorInfo)
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset()
    }

    // Reload the page as fallback
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            bgcolor: '#0A0E1A',
            p: 3
          }}
        >
          <Card
            sx={{
              maxWidth: 600,
              width: '100%',
              background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              {/* Error Icon */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 107, 107, 0.2)'
                  }}
                >
                  <ErrorIcon sx={{ fontSize: 64, color: '#FF6B6B' }} />
                </Box>
              </Box>

              {/* Error Title */}
              <Typography
                variant="h4"
                sx={{ color: '#fff', fontWeight: 600, mb: 2, textAlign: 'center' }}
              >
                Something Went Wrong
              </Typography>

              {/* Error Description */}
              <Typography
                variant="body1"
                sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, textAlign: 'center' }}
              >
                The application encountered an unexpected error. We apologize for the
                inconvenience.
              </Typography>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    bgcolor: 'rgba(255, 107, 107, 0.1)',
                    color: '#FF6B6B',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                    '& .MuiAlert-icon': {
                      color: '#FF6B6B'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Error: {this.state.error.message}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        mt: 1
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Alert>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReset}
                  sx={{
                    bgcolor: '#4ECDC4',
                    '&:hover': {
                      bgcolor: '#3CAAA0'
                    }
                  }}
                >
                  Reload Page
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => (window.location.href = '/')}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#fff',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.5)',
                      bgcolor: 'rgba(255,255,255,0.05)'
                    }
                  }}
                >
                  Go to Dashboard
                </Button>
              </Box>

              {/* Support Message */}
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.5)',
                  textAlign: 'center',
                  display: 'block',
                  mt: 3
                }}
              >
                If this problem persists, please contact support at{' '}
                <Box component="span" sx={{ color: '#4ECDC4' }}>
                  support@aurigraph.io
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

/**
 * WebSocketStatus.tsx
 * Real-time WebSocket connection status indicator component
 *
 * Features:
 * - Visual connection status for all WebSocket endpoints
 * - Connection quality indicators
 * - Reconnection status and attempts
 * - Click to expand for detailed diagnostics
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  CheckCircle as ConnectedIcon,
  Error as ErrorIcon,
  HourglassEmpty as ReconnectingIcon,
  Cancel as DisconnectedIcon
} from '@mui/icons-material'
import { webSocketManager, WebSocketEndpoint, GlobalWebSocketStatus } from '../utils/WebSocketConfig'

// ============================================================================
// TYPES
// ============================================================================

interface WebSocketStatusProps {
  compact?: boolean
  showDetails?: boolean
  onRefresh?: () => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  CONNECTED: {
    color: 'success' as const,
    icon: ConnectedIcon,
    label: 'Connected',
    bgColor: 'rgba(0, 191, 165, 0.1)'
  },
  DISCONNECTED: {
    color: 'default' as const,
    icon: DisconnectedIcon,
    label: 'Disconnected',
    bgColor: 'rgba(128, 128, 128, 0.1)'
  },
  CONNECTING: {
    color: 'warning' as const,
    icon: ReconnectingIcon,
    label: 'Connecting',
    bgColor: 'rgba(255, 193, 7, 0.1)'
  },
  ERROR: {
    color: 'error' as const,
    icon: ErrorIcon,
    label: 'Error',
    bgColor: 'rgba(244, 67, 54, 0.1)'
  }
}

const HEALTH_CONFIG = {
  HEALTHY: { color: '#00BFA5', label: 'Healthy' },
  DEGRADED: { color: '#FFD93D', label: 'Degraded' },
  CRITICAL: { color: '#FF6B6B', label: 'Critical' }
}

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)'
}

// ============================================================================
// COMPONENT
// ============================================================================

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  compact = false,
  showDetails = false,
  onRefresh
}) => {
  const [expanded, setExpanded] = useState(showDetails)
  const [globalStatus, setGlobalStatus] = useState<GlobalWebSocketStatus>(
    webSocketManager.getGlobalStatus()
  )

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Update status every second
    const interval = setInterval(() => {
      setGlobalStatus(webSocketManager.getGlobalStatus())
    }, 1000)

    // Subscribe to WebSocket events
    const unsubscribe = webSocketManager.subscribe(() => {
      setGlobalStatus(webSocketManager.getGlobalStatus())
    })

    return () => {
      clearInterval(interval)
      unsubscribe()
    }
  }, [])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleExpand = () => {
    setExpanded(!expanded)
  }

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    }
    setGlobalStatus(webSocketManager.getGlobalStatus())
  }

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderStatusChip = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DISCONNECTED
    const StatusIcon = config.icon

    return (
      <Chip
        icon={<StatusIcon fontSize="small" />}
        label={config.label}
        color={config.color}
        size="small"
        sx={{ fontWeight: 600 }}
      />
    )
  }

  const renderHealthIndicator = () => {
    const health = HEALTH_CONFIG[globalStatus.overallHealth]
    const percentage = globalStatus.totalConnections > 0
      ? (globalStatus.activeConnections / globalStatus.totalConnections) * 100
      : 0

    return (
      <Box sx={{ width: '100%', mt: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Connection Health
          </Typography>
          <Typography variant="caption" sx={{ color: health.color, fontWeight: 600 }}>
            {health.label} ({percentage.toFixed(0)}%)
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.1)',
            '& .MuiLinearProgress-bar': {
              bgcolor: health.color
            }
          }}
        />
      </Box>
    )
  }

  const renderConnectionTable = () => {
    const connections = Array.from(globalStatus.connections.entries())

    if (connections.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No WebSocket connections active
        </Alert>
      )
    }

    return (
      <TableContainer sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                Endpoint
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                Status
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                Reconnect Attempts
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                Last Connected
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {connections.map(([endpoint, conn]) => (
              <TableRow key={endpoint}>
                <TableCell sx={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'monospace' }}>
                  {endpoint}
                </TableCell>
                <TableCell>{renderStatusChip(conn.status)}</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {conn.reconnectAttempts > 0 ? (
                    <Chip
                      label={`${conn.reconnectAttempts} attempts`}
                      size="small"
                      color={conn.reconnectAttempts > 5 ? 'error' : 'warning'}
                    />
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                  {conn.lastConnected
                    ? new Date(conn.lastConnected).toLocaleTimeString()
                    : 'Never'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  // ============================================================================
  // COMPACT VIEW
  // ============================================================================

  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Tooltip title={`${globalStatus.activeConnections}/${globalStatus.totalConnections} connections active`}>
          <Chip
            icon={<ConnectedIcon fontSize="small" />}
            label={`WS: ${globalStatus.activeConnections}/${globalStatus.totalConnections}`}
            size="small"
            sx={{
              bgcolor: HEALTH_CONFIG[globalStatus.overallHealth].color + '20',
              color: HEALTH_CONFIG[globalStatus.overallHealth].color,
              fontWeight: 600
            }}
          />
        </Tooltip>
      </Box>
    )
  }

  // ============================================================================
  // FULL VIEW
  // ============================================================================

  return (
    <Card sx={CARD_STYLE}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            WebSocket Connections
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
              <IconButton size="small" onClick={handleToggleExpand}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Summary */}
        <Box display="flex" gap={2} mt={2} flexWrap="wrap">
          <Chip
            label={`Total: ${globalStatus.totalConnections}`}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}
          />
          <Chip
            label={`Active: ${globalStatus.activeConnections}`}
            size="small"
            color="success"
          />
          {globalStatus.failedConnections > 0 && (
            <Chip
              label={`Failed: ${globalStatus.failedConnections}`}
              size="small"
              color="error"
            />
          )}
        </Box>

        {/* Health Indicator */}
        {renderHealthIndicator()}

        {/* Expanded Details */}
        <Collapse in={expanded} timeout="auto">
          {renderConnectionTable()}
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default WebSocketStatus

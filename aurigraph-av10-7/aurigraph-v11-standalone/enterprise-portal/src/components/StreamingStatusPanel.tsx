/**
 * StreamingStatusPanel.tsx
 * Real-time streaming status monitoring panel for gRPC-Web migration
 *
 * Displays connection status for all streaming endpoints and allows
 * toggling between gRPC-Web and WebSocket protocols during migration.
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Switch,
  FormControlLabel,
  Collapse,
  LinearProgress,
  Divider,
  Alert,
  Button,
  Stack
} from '@mui/material'
import {
  Wifi,
  WifiOff,
  Refresh,
  ExpandMore,
  ExpandLess,
  Speed,
  Memory,
  NetworkCheck,
  CheckCircle,
  Error,
  Warning,
  Info
} from '@mui/icons-material'

import { streamingConfig, StreamingConfig, StreamProtocol } from '../grpc/StreamingConfig'
import { useMetricsGrpc } from '../grpc/hooks/useMetricsGrpc'
import { useConsensusGrpc } from '../grpc/hooks/useConsensusGrpc'
import { useValidatorGrpc } from '../grpc/hooks/useValidatorGrpc'
import { useNetworkGrpc } from '../grpc/hooks/useNetworkGrpc'
import { useTransactionGrpc } from '../grpc/hooks/useTransactionGrpc'

// ============================================================================
// TYPES
// ============================================================================

interface StreamStatus {
  name: string
  endpoint: string
  protocol: StreamProtocol
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  messageCount?: number
}

interface StreamingStatusPanelProps {
  expanded?: boolean
  showControls?: boolean
  compact?: boolean
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

const StatusIndicator: React.FC<{ connected: boolean; reconnecting: boolean; error: string | null }> = ({
  connected,
  reconnecting,
  error
}) => {
  if (error) {
    return (
      <Tooltip title={error}>
        <Error color="error" fontSize="small" />
      </Tooltip>
    )
  }
  if (reconnecting) {
    return (
      <Tooltip title="Reconnecting...">
        <Warning color="warning" fontSize="small" />
      </Tooltip>
    )
  }
  if (connected) {
    return (
      <Tooltip title="Connected">
        <CheckCircle color="success" fontSize="small" />
      </Tooltip>
    )
  }
  return (
    <Tooltip title="Disconnected">
      <WifiOff color="disabled" fontSize="small" />
    </Tooltip>
  )
}

const ProtocolChip: React.FC<{ protocol: StreamProtocol }> = ({ protocol }) => {
  const colors: Record<StreamProtocol, 'primary' | 'secondary' | 'default'> = {
    'grpc-web': 'primary',
    'websocket': 'secondary',
    'auto': 'default'
  }

  return (
    <Chip
      label={protocol.toUpperCase()}
      size="small"
      color={colors[protocol]}
      variant="outlined"
      sx={{ fontSize: '0.7rem', height: 20 }}
    />
  )
}

const formatTimestamp = (timestamp: number | null): string => {
  if (!timestamp) return 'Never'
  const diff = Date.now() - timestamp
  if (diff < 1000) return 'Just now'
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  return new Date(timestamp).toLocaleTimeString()
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StreamingStatusPanel: React.FC<StreamingStatusPanelProps> = ({
  expanded: initialExpanded = false,
  showControls = true,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(initialExpanded)
  const [config, setConfig] = useState<StreamingConfig>(streamingConfig.getConfig())
  const [debugMode, setDebugMode] = useState(config.debug)

  // Connect to all streams
  const metrics = useMetricsGrpc({ enabled: true })
  const consensus = useConsensusGrpc({ enabled: true })
  const validators = useValidatorGrpc({ enabled: true })
  const network = useNetworkGrpc({ enabled: true })
  const transactions = useTransactionGrpc({ enabled: true })

  // Subscribe to config changes
  useEffect(() => {
    const unsubscribe = streamingConfig.subscribe(setConfig)
    return unsubscribe
  }, [])

  // Build stream statuses
  const streams: StreamStatus[] = [
    {
      name: 'Metrics',
      endpoint: '/metrics',
      protocol: config.endpoints.metrics.protocol,
      connected: metrics.isConnected,
      reconnecting: metrics.isReconnecting,
      error: metrics.status.error,
      lastUpdate: metrics.status.lastUpdate
    },
    {
      name: 'Consensus',
      endpoint: '/consensus',
      protocol: config.endpoints.consensus.protocol,
      connected: consensus.isConnected,
      reconnecting: consensus.isReconnecting,
      error: consensus.status.error,
      lastUpdate: consensus.status.lastUpdate
    },
    {
      name: 'Validators',
      endpoint: '/validators',
      protocol: config.endpoints.validators.protocol,
      connected: validators.isConnected,
      reconnecting: validators.isReconnecting,
      error: validators.status.error,
      lastUpdate: validators.status.lastUpdate
    },
    {
      name: 'Network',
      endpoint: '/network',
      protocol: config.endpoints.network.protocol,
      connected: network.isConnected,
      reconnecting: network.isReconnecting,
      error: network.status.error,
      lastUpdate: network.status.lastUpdate
    },
    {
      name: 'Transactions',
      endpoint: '/transactions',
      protocol: config.endpoints.transactions.protocol,
      connected: transactions.isConnected,
      reconnecting: transactions.isReconnecting,
      error: transactions.status.error,
      lastUpdate: transactions.status.lastUpdate,
      messageCount: transactions.transactionCount
    }
  ]

  const connectedCount = streams.filter(s => s.connected).length
  const hasErrors = streams.some(s => s.error)
  const isReconnecting = streams.some(s => s.reconnecting)

  const handleToggleDebug = () => {
    const newDebug = !debugMode
    setDebugMode(newDebug)
    streamingConfig.setDebug(newDebug)
  }

  const handleReconnectAll = () => {
    metrics.reconnect()
    consensus.reconnect()
    validators.reconnect()
    network.reconnect()
    transactions.reconnect()
  }

  const handleToggleProtocol = (endpoint: keyof StreamingConfig['endpoints']) => {
    const current = config.endpoints[endpoint].protocol
    const next: StreamProtocol = current === 'grpc-web' ? 'websocket' : 'grpc-web'
    streamingConfig.setEndpointProtocol(endpoint, next)
  }

  // Compact view
  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={`${connectedCount}/${streams.length} streams connected`}>
          <Chip
            icon={connectedCount === streams.length ? <Wifi /> : <WifiOff />}
            label={`${connectedCount}/${streams.length}`}
            color={hasErrors ? 'error' : connectedCount === streams.length ? 'success' : 'warning'}
            size="small"
            onClick={() => setExpanded(!expanded)}
          />
        </Tooltip>
        {isReconnecting && <LinearProgress sx={{ width: 50 }} />}
      </Box>
    )
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ pb: expanded ? 2 : 1, '&:last-child': { pb: expanded ? 2 : 1 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NetworkCheck color={hasErrors ? 'error' : 'primary'} />
            <Typography variant="subtitle1" fontWeight={600}>
              Streaming Status
            </Typography>
            <Chip
              label={`${connectedCount}/${streams.length}`}
              color={hasErrors ? 'error' : connectedCount === streams.length ? 'success' : 'warning'}
              size="small"
            />
            {debugMode && (
              <Chip label="DEBUG" size="small" color="info" variant="outlined" />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showControls && (
              <>
                <Tooltip title="Reconnect all streams">
                  <IconButton size="small" onClick={handleReconnectAll}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
                <FormControlLabel
                  control={
                    <Switch
                      checked={debugMode}
                      onChange={handleToggleDebug}
                      size="small"
                    />
                  }
                  label="Debug"
                  sx={{ mr: 0 }}
                />
              </>
            )}
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        </Box>

        {/* Quick Status Bar */}
        {!expanded && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            {streams.map(stream => (
              <Tooltip key={stream.name} title={`${stream.name}: ${stream.connected ? 'Connected' : stream.error || 'Disconnected'}`}>
                <Chip
                  label={stream.name}
                  size="small"
                  color={stream.error ? 'error' : stream.connected ? 'success' : 'default'}
                  variant={stream.connected ? 'filled' : 'outlined'}
                  sx={{ fontSize: '0.7rem' }}
                />
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />

          {/* Migration Alert */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>gRPC-Web Migration Active:</strong> All streaming endpoints are being migrated from WebSocket to gRPC-Web.
              Use the toggle to switch protocols per endpoint. WebSocket will be deprecated on 2025-03-01.
            </Typography>
          </Alert>

          {/* Stream Details */}
          <Grid container spacing={2}>
            {streams.map(stream => (
              <Grid item xs={12} sm={6} md={4} key={stream.name}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {stream.name}
                      </Typography>
                      <StatusIndicator
                        connected={stream.connected}
                        reconnecting={stream.reconnecting}
                        error={stream.error}
                      />
                    </Box>

                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Protocol:</Typography>
                        <ProtocolChip protocol={stream.protocol} />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Last Update:</Typography>
                        <Typography variant="caption">{formatTimestamp(stream.lastUpdate)}</Typography>
                      </Box>

                      {stream.messageCount !== undefined && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">Messages:</Typography>
                          <Typography variant="caption">{stream.messageCount.toLocaleString()}</Typography>
                        </Box>
                      )}

                      {stream.error && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                          {stream.error}
                        </Typography>
                      )}
                    </Stack>

                    {showControls && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleToggleProtocol(stream.name.toLowerCase() as keyof StreamingConfig['endpoints'])}
                          sx={{ fontSize: '0.65rem', py: 0.25 }}
                        >
                          Switch to {stream.protocol === 'grpc-web' ? 'WS' : 'gRPC'}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Debug Info */}
          {debugMode && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Debug Information
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  p: 1.5,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                {JSON.stringify(streamingConfig.getDiagnostics(), null, 2)}
              </Box>
            </>
          )}
        </Collapse>
      </CardContent>
    </Card>
  )
}

export default StreamingStatusPanel

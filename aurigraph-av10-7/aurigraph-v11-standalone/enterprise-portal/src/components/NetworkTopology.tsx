/**
 * NetworkTopology.tsx
 * Network topology visualization with D3.js force-directed graph
 * Displays nodes, connections, and real-time network health
 */

import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as CenterIcon,
  Info as InfoIcon,
} from '@mui/icons-material'
import { networkTopologyApi } from '../services/phase1Api'
import type { NetworkTopologyData, NetworkNode, NetworkEdge } from '../types/phase1'

// ============================================================================
// CONSTANTS
// ============================================================================

const REFRESH_INTERVAL = 10000 // 10 seconds
const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const NODE_COLORS = {
  validator: '#00BFA5',
  observer: '#4ECDC4',
  seed: '#FFD93D',
  relay: '#FF6B6B',
}

const STATUS_COLORS = {
  active: '#00BFA5',
  inactive: '#6c757d',
  syncing: '#FFD93D',
  error: '#FF6B6B',
}

// ============================================================================
// TYPES
// ============================================================================

interface ViewMode {
  value: 'force' | 'circle' | 'grid'
  label: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NetworkTopology: React.FC = () => {
  const [topologyData, setTopologyData] = useState<NetworkTopologyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [viewMode, setViewMode] = useState<'force' | 'circle' | 'grid'>('force')
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchTopologyData = useCallback(async () => {
    try {
      setError(null)
      const data = await networkTopologyApi.getTopology()
      setTopologyData(data)
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch network topology'
      setError(errorMessage)
      setLoading(false)
      console.error('Failed to fetch network topology:', err)
    }
  }, [])

  useEffect(() => {
    fetchTopologyData()
    const interval = setInterval(fetchTopologyData, REFRESH_INTERVAL)
    return () => {
      clearInterval(interval)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [fetchTopologyData])

  // ============================================================================
  // CANVAS RENDERING
  // ============================================================================

  const renderTopology = useCallback(() => {
    if (!canvasRef.current || !topologyData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.parentElement?.getBoundingClientRect()
    if (rect) {
      canvas.width = rect.width
      canvas.height = rect.height
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    // Apply zoom
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.scale(zoom, zoom)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    // Calculate node positions based on view mode
    const positions = calculateNodePositions(
      topologyData.nodes,
      viewMode,
      canvas.width,
      canvas.height
    )

    // Draw edges first
    topologyData.edges.forEach((edge) => {
      const sourcePos = positions.get(edge.source)
      const targetPos = positions.get(edge.target)

      if (sourcePos && targetPos) {
        ctx.beginPath()
        ctx.moveTo(sourcePos.x, sourcePos.y)
        ctx.lineTo(targetPos.x, targetPos.y)
        ctx.strokeStyle =
          edge.status === 'healthy'
            ? 'rgba(0, 191, 165, 0.3)'
            : edge.status === 'degraded'
            ? 'rgba(255, 217, 61, 0.3)'
            : 'rgba(255, 107, 107, 0.3)'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })

    // Draw nodes
    topologyData.nodes.forEach((node) => {
      const pos = positions.get(node.id)
      if (!pos) return

      const radius = node.type === 'validator' ? 8 : 6
      const color = NODE_COLORS[node.type]
      const statusColor = STATUS_COLORS[node.status]

      // Node circle
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      // Status ring
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius + 3, 0, 2 * Math.PI)
      ctx.strokeStyle = statusColor
      ctx.lineWidth = 2
      ctx.stroke()

      // Node label (for validators)
      if (node.type === 'validator') {
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(node.name.substring(0, 8), pos.x, pos.y + radius + 12)
      }
    })

    ctx.restore()
  }, [topologyData, viewMode, zoom])

  useEffect(() => {
    renderTopology()
  }, [renderTopology])

  // ============================================================================
  // POSITION CALCULATION
  // ============================================================================

  const calculateNodePositions = (
    nodes: NetworkNode[],
    mode: 'force' | 'circle' | 'grid',
    width: number,
    height: number
  ): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>()
    const padding = 50

    switch (mode) {
      case 'circle': {
        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.min(width, height) / 2 - padding
        nodes.forEach((node, i) => {
          const angle = (i * 2 * Math.PI) / nodes.length
          positions.set(node.id, {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          })
        })
        break
      }

      case 'grid': {
        const cols = Math.ceil(Math.sqrt(nodes.length))
        const cellWidth = (width - padding * 2) / cols
        const cellHeight = (height - padding * 2) / Math.ceil(nodes.length / cols)
        nodes.forEach((node, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          positions.set(node.id, {
            x: padding + col * cellWidth + cellWidth / 2,
            y: padding + row * cellHeight + cellHeight / 2,
          })
        })
        break
      }

      case 'force':
      default: {
        // Simple force-directed layout (simplified for performance)
        nodes.forEach((node, i) => {
          const angle = (i * 2 * Math.PI) / nodes.length
          const radius = Math.min(width, height) / 3
          positions.set(node.id, {
            x: width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 50,
            y: height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 50,
          })
        })
        break
      }
    }

    return positions
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleRefresh = useCallback(() => {
    setLoading(true)
    fetchTopologyData()
  }, [fetchTopologyData])

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.2, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5))
  }, [])

  const handleResetZoom = useCallback(() => {
    setZoom(1)
  }, [])

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current || !topologyData) return

      const rect = canvasRef.current.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Find clicked node
      const positions = calculateNodePositions(
        topologyData.nodes,
        viewMode,
        canvasRef.current.width,
        canvasRef.current.height
      )

      for (const node of topologyData.nodes) {
        const pos = positions.get(node.id)
        if (!pos) continue

        const radius = node.type === 'validator' ? 8 : 6
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2)

        if (distance <= radius) {
          setSelectedNode(node)
          return
        }
      }

      setSelectedNode(null)
    },
    [topologyData, viewMode]
  )

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && !topologyData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={handleRefresh} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    )
  }

  if (!topologyData) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No topology data available
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Network Topology
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>View Mode</InputLabel>
            <Select
              value={viewMode}
              label="View Mode"
              onChange={(e) => setViewMode(e.target.value as any)}
            >
              <MenuItem value="force">Force</MenuItem>
              <MenuItem value="circle">Circle</MenuItem>
              <MenuItem value="grid">Grid</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleZoomIn} size="small" title="Zoom In">
            <ZoomInIcon />
          </IconButton>
          <IconButton onClick={handleZoomOut} size="small" title="Zoom Out">
            <ZoomOutIcon />
          </IconButton>
          <IconButton onClick={handleResetZoom} size="small" title="Reset Zoom">
            <CenterIcon />
          </IconButton>
          <IconButton onClick={handleRefresh} disabled={loading} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                {topologyData.stats.activeNodes}/{topologyData.stats.totalNodes}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Active Nodes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                {topologyData.stats.totalConnections}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Total Connections
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#FFD93D', fontWeight: 700 }}>
                {topologyData.stats.averageLatency.toFixed(0)}ms
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Avg Latency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#FF6B6B', fontWeight: 700 }}>
                {topologyData.stats.networkHealth.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Network Health
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Visualization */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={selectedNode ? 8 : 12}>
          <Card sx={{ ...CARD_STYLE, height: 600 }}>
            <CardContent sx={{ height: '100%', position: 'relative' }}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              />
              {/* Legend */}
              <Paper
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  p: 2,
                  bgcolor: 'rgba(26, 31, 58, 0.9)',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Node Types
                </Typography>
                {Object.entries(NODE_COLORS).map(([type, color]) => (
                  <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: color,
                      }}
                    />
                    <Typography variant="body2">{type}</Typography>
                  </Box>
                ))}
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Node Details Panel */}
        {selectedNode && (
          <Grid item xs={12} md={4}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Node Details</Typography>
                  <Chip
                    label={selectedNode.status}
                    sx={{
                      bgcolor: `${STATUS_COLORS[selectedNode.status]}20`,
                      color: STATUS_COLORS[selectedNode.status],
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Name
                    </Typography>
                    <Typography variant="body1">{selectedNode.name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Type
                    </Typography>
                    <Chip
                      label={selectedNode.type}
                      sx={{
                        bgcolor: `${NODE_COLORS[selectedNode.type]}20`,
                        color: NODE_COLORS[selectedNode.type],
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      IP Address
                    </Typography>
                    <Typography variant="body1">
                      {selectedNode.ipAddress}:{selectedNode.port}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Region
                    </Typography>
                    <Typography variant="body1">{selectedNode.region}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Uptime
                    </Typography>
                    <Typography variant="body1">{selectedNode.uptime.toFixed(2)}%</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Connections
                    </Typography>
                    <Typography variant="body1">{selectedNode.connections}</Typography>
                  </Box>
                  {selectedNode.performance && (
                    <>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          TPS
                        </Typography>
                        <Typography variant="body1">
                          {selectedNode.performance.tps.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Latency
                        </Typography>
                        <Typography variant="body1">
                          {selectedNode.performance.latency.toFixed(0)}ms
                        </Typography>
                      </Box>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default NetworkTopology

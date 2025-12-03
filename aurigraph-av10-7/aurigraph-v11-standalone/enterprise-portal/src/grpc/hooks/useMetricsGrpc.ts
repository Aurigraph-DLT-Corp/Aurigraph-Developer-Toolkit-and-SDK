/**
 * useMetricsGrpc.ts
 * React hook for real-time metrics streaming via gRPC-Web
 *
 * Replaces: useMetricsWebSocket.ts
 * Service: MetricsStreamService.StreamMetrics
 * Update frequency: 1 second (configurable)
 *
 * Benefits over WebSocket:
 * - Type-safe Protobuf messages
 * - HTTP/2 multiplexing
 * - Built-in flow control
 * - 60-70% bandwidth reduction
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { metricsStreamClient } from '../services'
import { GrpcStreamStatus } from '../GrpcWebClient'
import {
  PerformanceMetricsUpdate,
  AggregatedMetrics,
  MetricsSubscription,
  timestampToUnixMs
} from '../types'

// ============================================================================
// TYPES
// ============================================================================

export interface MetricsData {
  // Core metrics (matching WebSocket interface)
  currentTPS: number
  cpuUsage: number
  memoryUsage: number
  activeConnections: number
  errorRate: number
  timestamp: number

  // Extended metrics from gRPC
  avgTps1m: number
  avgTps5m: number
  peakTps: number
  latencyAvg: number
  latencyP99: number
  consensusHealth: string
  networkPeers: number
  queuePending: number
  blockTime: number
}

export interface MetricsStreamState {
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  reconnectAttempts: number
  streamStatus: GrpcStreamStatus
}

export interface UseMetricsGrpcOptions {
  updateIntervalMs?: number
  metricTypes?: string[]
  nodeIds?: string[]
  enabled?: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapToMetricsData(update: PerformanceMetricsUpdate): MetricsData {
  const tps = update.transactions?.tps
  const latency = update.transactions?.latency
  const system = update.system
  const network = update.network
  const queue = update.transactions?.queue
  const consensus = update.consensus

  return {
    currentTPS: tps?.current || 0,
    cpuUsage: system?.cpuUsagePercent || 0,
    memoryUsage: system?.memoryUsagePercent || 0,
    activeConnections: network?.connectedPeers || 0,
    errorRate: update.transactions?.failureRate || 0,
    timestamp: timestampToUnixMs(update.timestamp),

    // Extended metrics
    avgTps1m: tps?.avg1m || 0,
    avgTps5m: tps?.avg5m || 0,
    peakTps: tps?.peak1h || 0,
    latencyAvg: latency?.avg || 0,
    latencyP99: latency?.p99 || 0,
    consensusHealth: consensus?.leaderNodeId ? 'HEALTHY' : 'UNKNOWN',
    networkPeers: network?.connectedPeers || 0,
    queuePending: queue?.pending || 0,
    blockTime: consensus?.avgBlockTimeMs || 0
  }
}

// ============================================================================
// HOOK
// ============================================================================

export function useMetricsGrpc(options: UseMetricsGrpcOptions = {}) {
  const {
    updateIntervalMs = 1000,
    metricTypes = ['tps', 'latency', 'consensus', 'network', 'system'],
    nodeIds = [],
    enabled = true
  } = options

  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [state, setState] = useState<MetricsStreamState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    reconnectAttempts: 0,
    streamStatus: 'IDLE'
  })

  const cancelRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(true)

  // Message handler
  const handleMessage = useCallback((update: PerformanceMetricsUpdate) => {
    if (!mountedRef.current) return

    const data = mapToMetricsData(update)
    setMetrics(data)
    setState(prev => ({
      ...prev,
      lastUpdate: Date.now(),
      error: null
    }))
  }, [])

  // Error handler
  const handleError = useCallback((error: Error) => {
    if (!mountedRef.current) return

    console.error('[useMetricsGrpc] Stream error:', error)
    setState(prev => ({
      ...prev,
      error: error.message
    }))
  }, [])

  // Status handler
  const handleStatus = useCallback((status: GrpcStreamStatus) => {
    if (!mountedRef.current) return

    setState(prev => ({
      ...prev,
      streamStatus: status,
      connected: status === 'STREAMING',
      reconnecting: status === 'RECONNECTING',
      reconnectAttempts: status === 'RECONNECTING' ? prev.reconnectAttempts + 1 : prev.reconnectAttempts
    }))

    if (status === 'STREAMING') {
      console.log('[useMetricsGrpc] Stream connected')
    } else if (status === 'RECONNECTING') {
      console.log('[useMetricsGrpc] Attempting reconnection...')
    }
  }, [])

  // Start stream
  const startStream = useCallback(() => {
    if (!enabled) return

    const subscription: Partial<MetricsSubscription> = {
      clientId: `metrics-${Date.now()}`,
      metricTypes,
      nodeIds,
      updateIntervalMs
    }

    cancelRef.current = metricsStreamClient.streamMetrics(
      subscription,
      handleMessage,
      handleError,
      handleStatus
    )
  }, [enabled, metricTypes, nodeIds, updateIntervalMs, handleMessage, handleError, handleStatus])

  // Stop stream
  const stopStream = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current()
      cancelRef.current = null
    }
  }, [])

  // Reconnect
  const reconnect = useCallback(() => {
    stopStream()
    setState(prev => ({ ...prev, reconnectAttempts: 0 }))
    startStream()
  }, [stopStream, startStream])

  // Effect: Start/stop stream based on enabled flag
  useEffect(() => {
    mountedRef.current = true

    if (enabled) {
      startStream()
    }

    return () => {
      mountedRef.current = false
      stopStream()
    }
  }, [enabled, startStream, stopStream])

  return {
    metrics,
    status: state,
    reconnect,
    isConnected: state.connected,
    isReconnecting: state.reconnecting
  }
}

// ============================================================================
// AGGREGATED METRICS HOOK
// ============================================================================

export function useAggregatedMetricsGrpc(options: UseMetricsGrpcOptions = {}) {
  const {
    updateIntervalMs = 2000,
    enabled = true
  } = options

  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null)
  const [state, setState] = useState<MetricsStreamState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    reconnectAttempts: 0,
    streamStatus: 'IDLE'
  })

  const cancelRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(true)

  const handleMessage = useCallback((update: AggregatedMetrics) => {
    if (!mountedRef.current) return
    setMetrics(update)
    setState(prev => ({ ...prev, lastUpdate: Date.now(), error: null }))
  }, [])

  const handleError = useCallback((error: Error) => {
    if (!mountedRef.current) return
    setState(prev => ({ ...prev, error: error.message }))
  }, [])

  const handleStatus = useCallback((status: GrpcStreamStatus) => {
    if (!mountedRef.current) return
    setState(prev => ({
      ...prev,
      streamStatus: status,
      connected: status === 'STREAMING',
      reconnecting: status === 'RECONNECTING'
    }))
  }, [])

  useEffect(() => {
    mountedRef.current = true

    if (enabled) {
      cancelRef.current = metricsStreamClient.streamAggregatedMetrics(
        { updateIntervalMs },
        handleMessage,
        handleError,
        handleStatus
      )
    }

    return () => {
      mountedRef.current = false
      if (cancelRef.current) {
        cancelRef.current()
      }
    }
  }, [enabled, updateIntervalMs, handleMessage, handleError, handleStatus])

  return {
    metrics,
    status: state,
    isConnected: state.connected
  }
}

export default useMetricsGrpc

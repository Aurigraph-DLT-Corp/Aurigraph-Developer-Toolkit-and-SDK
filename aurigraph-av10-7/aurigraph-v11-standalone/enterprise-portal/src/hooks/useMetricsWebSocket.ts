/**
 * useMetricsWebSocket.ts
 * Custom hook for real-time metrics streaming via WebSocket
 *
 * @deprecated This hook is deprecated. Use useMetricsGrpc from '../grpc' instead.
 * Migration: import { useMetricsGrpc } from '../grpc'
 * Sunset date: 2025-03-01
 *
 * Endpoint: ws://localhost:9003/ws/metrics
 * Update frequency: 1 second
 * Auto-reconnect: Exponential backoff (1s, 2s, 4s, 8s, max 30s)
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface MetricsData {
  currentTPS: number
  cpuUsage: number
  memoryUsage: number
  activeConnections: number
  errorRate: number
  timestamp: number
}

export interface WebSocketStatus {
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  connectionAttempts: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:9003'
const METRICS_ENDPOINT = '/ws/metrics'
const INITIAL_RECONNECT_DELAY = 1000 // 1 second
const MAX_RECONNECT_DELAY = 30000 // 30 seconds
const RECONNECT_MULTIPLIER = 2

// ============================================================================
// HOOK
// ============================================================================

export const useMetricsWebSocket = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    connectionAttempts: 0
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY)
  const mountedRef = useRef<boolean>(true)

  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const ws = new WebSocket(`${WS_URL}${METRICS_ENDPOINT}`)

      ws.onopen = () => {
        console.log('✅ Metrics WebSocket connected')
        setStatus(prev => ({
          ...prev,
          connected: true,
          reconnecting: false,
          error: null,
          connectionAttempts: 0
        }))
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as MetricsData
          setMetrics(data)
          setStatus(prev => ({
            ...prev,
            lastUpdate: Date.now(),
            error: null
          }))
        } catch (err) {
          console.error('Failed to parse metrics data:', err)
          setStatus(prev => ({
            ...prev,
            error: 'Failed to parse metrics data'
          }))
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Metrics WebSocket error:', error)
        setStatus(prev => ({
          ...prev,
          error: 'WebSocket connection error'
        }))
      }

      ws.onclose = () => {
        console.log('🔌 Metrics WebSocket disconnected')
        setStatus(prev => ({
          ...prev,
          connected: false
        }))

        // Attempt reconnection with exponential backoff
        if (mountedRef.current) {
          scheduleReconnect()
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Failed to create WebSocket:', err)
      setStatus(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection'
      }))
      scheduleReconnect()
    }
  }, [])

  // ============================================================================
  // RECONNECTION LOGIC
  // ============================================================================

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return

    setStatus(prev => ({
      ...prev,
      reconnecting: true,
      connectionAttempts: prev.connectionAttempts + 1
    }))

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`🔄 Attempting to reconnect (delay: ${reconnectDelayRef.current}ms)`)
      connect()

      // Exponential backoff
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * RECONNECT_MULTIPLIER,
        MAX_RECONNECT_DELAY
      )
    }, reconnectDelayRef.current)
  }, [connect])

  // ============================================================================
  // CLEANUP
  // ============================================================================

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [connect, disconnect])

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    metrics,
    status,
    reconnect: connect
  }
}

/**
 * useEnhancedWebSocket.ts
 * Enhanced WebSocket hook for real-time analytics with topic-based subscriptions
 *
 * Features:
 * - Topic-based subscriptions (metrics, tps_update, latency_update, etc.)
 * - Auto-reconnect with exponential backoff
 * - Type-safe message handling
 * - Connection status tracking
 *
 * Usage:
 * const { data, status } = useEnhancedWebSocket<number>('metrics', 'tps_update')
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface WebSocketMessage<T = any> {
  topic: string
  type: string
  data: T
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

const WS_URL = (import.meta as any).env?.PROD
  ? 'wss://dlt.aurigraph.io'
  : 'ws://localhost:9003'
const INITIAL_RECONNECT_DELAY = 1000 // 1 second
const MAX_RECONNECT_DELAY = 30000 // 30 seconds
const RECONNECT_MULTIPLIER = 2

// ============================================================================
// HOOK
// ============================================================================

export function useEnhancedWebSocket<T = any>(
  topic: string,
  messageType?: string
): {
  data: T | null
  status: WebSocketStatus
  send: (data: any) => void
  reconnect: () => void
} {
  const [data, setData] = useState<T | null>(null)
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
  const subscriptionRef = useRef<{ topic: string; messageType?: string }>({ topic, messageType })

  // Update subscription ref when topic/messageType changes
  useEffect(() => {
    subscriptionRef.current = { topic, messageType }
  }, [topic, messageType])

  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const endpoint = `${WS_URL}/ws/${subscriptionRef.current.topic}`
      const ws = new WebSocket(endpoint)

      ws.onopen = () => {
        console.log(`✅ WebSocket connected: ${subscriptionRef.current.topic}`)
        setStatus(prev => ({
          ...prev,
          connected: true,
          reconnecting: false,
          error: null,
          connectionAttempts: 0
        }))
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY

        // Send subscription message if needed
        if (subscriptionRef.current.messageType) {
          ws.send(JSON.stringify({
            action: 'subscribe',
            topic: subscriptionRef.current.topic,
            type: subscriptionRef.current.messageType
          }))
        }
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage<T> = JSON.parse(event.data)

          // Filter by message type if specified
          if (subscriptionRef.current.messageType && message.type !== subscriptionRef.current.messageType) {
            return
          }

          setData(message.data)
          setStatus(prev => ({
            ...prev,
            lastUpdate: Date.now(),
            error: null
          }))
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
          setStatus(prev => ({
            ...prev,
            error: 'Failed to parse message data'
          }))
        }
      }

      ws.onerror = (error) => {
        console.error(`❌ WebSocket error (${subscriptionRef.current.topic}):`, error)
        setStatus(prev => ({
          ...prev,
          error: 'WebSocket connection error'
        }))
      }

      ws.onclose = () => {
        console.log(`🔌 WebSocket disconnected: ${subscriptionRef.current.topic}`)
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
      console.log(`🔄 Attempting to reconnect ${subscriptionRef.current.topic} (delay: ${reconnectDelayRef.current}ms)`)
      connect()

      // Exponential backoff
      reconnectDelayRef.current = Math.min(
        reconnectDelayRef.current * RECONNECT_MULTIPLIER,
        MAX_RECONNECT_DELAY
      )
    }, reconnectDelayRef.current)
  }, [connect])

  // ============================================================================
  // SEND MESSAGE
  // ============================================================================

  const send = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected. Cannot send message.')
    }
  }, [])

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
    data,
    status,
    send,
    reconnect: connect
  }
}

export default useEnhancedWebSocket

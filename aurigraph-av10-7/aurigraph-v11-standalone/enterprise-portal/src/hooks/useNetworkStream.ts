/**
 * useNetworkStream.ts
 * Custom hook for real-time network topology streaming via WebSocket
 *
 * Endpoint: ws://localhost:9003/ws/network
 * Trigger: On peer connection/disconnection
 * Features: Peer connections, network latency updates, version information
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface PeerNode {
  id: string
  address: string
  location?: {
    country: string
    city: string
    latitude: number
    longitude: number
  }
  latency: number
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'
  version: string
  uptime: number
  lastSeen: number
  inboundBytes: number
  outboundBytes: number
  connectionQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
}

export interface NetworkEvent {
  type: 'PEER_CONNECTED' | 'PEER_DISCONNECTED' | 'LATENCY_UPDATE' | 'VERSION_MISMATCH'
  peerId: string
  peerAddress?: string
  timestamp: number
  details?: string
}

export interface NetworkMetrics {
  totalPeers: number
  connectedPeers: number
  disconnectedPeers: number
  averageLatency: number
  totalInbound: number
  totalOutbound: number
  networkHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
}

export interface NetworkStreamStatus {
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  connectionAttempts: number
  eventCount: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:9003'
const NETWORK_ENDPOINT = '/ws/network'
const INITIAL_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000
const RECONNECT_MULTIPLIER = 2
const RECENT_EVENTS_LIMIT = 100

// ============================================================================
// HOOK
// ============================================================================

export const useNetworkStream = () => {
  const [peers, setPeers] = useState<Map<string, PeerNode>>(new Map())
  const [recentEvents, setRecentEvents] = useState<NetworkEvent[]>([])
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    totalPeers: 0,
    connectedPeers: 0,
    disconnectedPeers: 0,
    averageLatency: 0,
    totalInbound: 0,
    totalOutbound: 0,
    networkHealth: 'HEALTHY'
  })
  const [status, setStatus] = useState<NetworkStreamStatus>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    connectionAttempts: 0,
    eventCount: 0
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY)
  const mountedRef = useRef<boolean>(true)

  // ============================================================================
  // NETWORK MANAGEMENT
  // ============================================================================

  const calculateMetrics = useCallback((peerMap: Map<string, PeerNode>): NetworkMetrics => {
    const peerArray = Array.from(peerMap.values())
    const connected = peerArray.filter(p => p.status === 'CONNECTED')
    const disconnected = peerArray.filter(p => p.status === 'DISCONNECTED')

    const averageLatency = connected.length > 0
      ? connected.reduce((sum, p) => sum + p.latency, 0) / connected.length
      : 0

    const totalInbound = peerArray.reduce((sum, p) => sum + p.inboundBytes, 0)
    const totalOutbound = peerArray.reduce((sum, p) => sum + p.outboundBytes, 0)

    // Determine network health
    const connectedRatio = peerArray.length > 0 ? connected.length / peerArray.length : 1
    let networkHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY'

    if (connectedRatio < 0.5) {
      networkHealth = 'CRITICAL'
    } else if (connectedRatio < 0.8 || averageLatency > 500) {
      networkHealth = 'DEGRADED'
    }

    return {
      totalPeers: peerArray.length,
      connectedPeers: connected.length,
      disconnectedPeers: disconnected.length,
      averageLatency: Math.round(averageLatency),
      totalInbound,
      totalOutbound,
      networkHealth
    }
  }, [])

  const updatePeer = useCallback((peerData: PeerNode) => {
    setPeers(prev => {
      const existing = prev.get(peerData.id)
      const updated = new Map(prev)
      updated.set(peerData.id, peerData)

      // Track events
      const events: NetworkEvent[] = []

      if (!existing) {
        // New peer connected
        events.push({
          type: 'PEER_CONNECTED',
          peerId: peerData.id,
          peerAddress: peerData.address,
          timestamp: Date.now(),
          details: `New peer connected: ${peerData.address}`
        })
      } else {
        // Check for status changes
        if (existing.status !== peerData.status) {
          if (peerData.status === 'DISCONNECTED') {
            events.push({
              type: 'PEER_DISCONNECTED',
              peerId: peerData.id,
              peerAddress: peerData.address,
              timestamp: Date.now(),
              details: `Peer disconnected: ${peerData.address}`
            })
          } else if (peerData.status === 'CONNECTED') {
            events.push({
              type: 'PEER_CONNECTED',
              peerId: peerData.id,
              peerAddress: peerData.address,
              timestamp: Date.now(),
              details: `Peer reconnected: ${peerData.address}`
            })
          }
        }

        // Check for significant latency changes (>50ms)
        if (Math.abs(existing.latency - peerData.latency) > 50) {
          events.push({
            type: 'LATENCY_UPDATE',
            peerId: peerData.id,
            peerAddress: peerData.address,
            timestamp: Date.now(),
            details: `Latency changed from ${existing.latency}ms to ${peerData.latency}ms`
          })
        }

        // Check for version mismatch
        if (existing.version !== peerData.version) {
          events.push({
            type: 'VERSION_MISMATCH',
            peerId: peerData.id,
            peerAddress: peerData.address,
            timestamp: Date.now(),
            details: `Peer version changed from ${existing.version} to ${peerData.version}`
          })
        }
      }

      // Add events to recent events list
      if (events.length > 0) {
        setRecentEvents(prevEvents => {
          const updatedEvents = [...events, ...prevEvents]
          return updatedEvents.slice(0, RECENT_EVENTS_LIMIT)
        })

        setStatus(prev => ({
          ...prev,
          eventCount: prev.eventCount + events.length
        }))
      }

      // Recalculate metrics
      const newMetrics = calculateMetrics(updated)
      setMetrics(newMetrics)

      return updated
    })

    setStatus(prev => ({
      ...prev,
      lastUpdate: Date.now()
    }))
  }, [calculateMetrics])

  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const ws = new WebSocket(`${WS_URL}${NETWORK_ENDPOINT}`)

      ws.onopen = () => {
        console.log('✅ Network WebSocket connected')
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
          const peer = JSON.parse(event.data) as PeerNode
          updatePeer(peer)
        } catch (err) {
          console.error('Failed to parse network data:', err)
          setStatus(prev => ({
            ...prev,
            error: 'Failed to parse network data'
          }))
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Network WebSocket error:', error)
        setStatus(prev => ({
          ...prev,
          error: 'WebSocket connection error'
        }))
      }

      ws.onclose = () => {
        console.log('🔌 Network WebSocket disconnected')
        setStatus(prev => ({
          ...prev,
          connected: false
        }))

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
  }, [updatePeer])

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
    peers: Array.from(peers.values()),
    peersMap: peers,
    recentEvents,
    metrics,
    status,
    reconnect: connect
  }
}

/**
 * useNetworkGrpc.ts
 * React hook for real-time network streaming via gRPC-Web
 *
 * Replaces: useNetworkStream.ts
 * Service: NetworkStreamService.StreamNetworkEvents
 * Update frequency: 3 seconds (configurable)
 *
 * Provides real-time network topology, peer status, and performance monitoring
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { networkStreamClient } from '../services'
import { GrpcStreamStatus } from '../GrpcWebClient'
import {
  NetworkEventStream,
  NetworkTopologyUpdate,
  NetworkSubscribeRequest,
  PeerNode,
  NetworkHealth,
  ConnectionQuality,
  timestampToUnixMs
} from '../types'

// ============================================================================
// TYPES
// ============================================================================

export interface Peer {
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
  connectionQuality: ConnectionQuality
}

export interface NetworkMetrics {
  totalPeers: number
  connectedPeers: number
  disconnectedPeers: number
  averageLatency: number
  totalInbound: number
  totalOutbound: number
  networkHealth: NetworkHealth
}

export interface NetworkEvent {
  type: 'PEER_CONNECTED' | 'PEER_DISCONNECTED' | 'LATENCY_UPDATE' | 'VERSION_MISMATCH' | 'TOPOLOGY_UPDATE' | 'HEALTH_UPDATE'
  description: string
  timestamp: number
  peerId?: string
  data?: any
}

export interface NetworkStreamState {
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  streamStatus: GrpcStreamStatus
}

export interface UseNetworkGrpcOptions {
  updateIntervalMs?: number
  filterPeerIds?: string[]
  includeTopology?: boolean
  enabled?: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapToPeer(node: PeerNode): Peer {
  return {
    id: node.id,
    address: node.address,
    location: node.location || undefined,
    latency: node.latency,
    status: node.status,
    version: node.version,
    uptime: node.uptime,
    lastSeen: timestampToUnixMs(node.lastSeen),
    inboundBytes: node.inboundBytes,
    outboundBytes: node.outboundBytes,
    connectionQuality: node.connectionQuality
  }
}

function mapToNetworkMetrics(topology: NetworkTopologyUpdate): NetworkMetrics {
  return {
    totalPeers: topology.totalPeers,
    connectedPeers: topology.connectedPeers,
    disconnectedPeers: topology.disconnectedPeers,
    averageLatency: topology.averageLatency,
    totalInbound: topology.totalInbound,
    totalOutbound: topology.totalOutbound,
    networkHealth: topology.networkHealth
  }
}

function createEventFromStream(event: NetworkEventStream): NetworkEvent | null {
  if (event.topologyUpdate) {
    return {
      type: 'TOPOLOGY_UPDATE',
      description: `Network: ${event.topologyUpdate.connectedPeers}/${event.topologyUpdate.totalPeers} peers connected`,
      timestamp: timestampToUnixMs(event.timestamp),
      data: event.topologyUpdate
    }
  }

  if (event.peerConnected) {
    return {
      type: 'PEER_CONNECTED',
      description: `Peer connected: ${event.peerConnected.peerId} (${event.peerConnected.peerAddress})`,
      timestamp: timestampToUnixMs(event.timestamp),
      peerId: event.peerConnected.peerId,
      data: event.peerConnected
    }
  }

  if (event.peerDisconnected) {
    return {
      type: 'PEER_DISCONNECTED',
      description: `Peer disconnected: ${event.peerDisconnected.peerId} - ${event.peerDisconnected.reason}`,
      timestamp: timestampToUnixMs(event.timestamp),
      peerId: event.peerDisconnected.peerId,
      data: event.peerDisconnected
    }
  }

  if (event.latencyUpdate) {
    return {
      type: 'LATENCY_UPDATE',
      description: `Latency change: ${event.latencyUpdate.peerId} ${event.latencyUpdate.oldLatency}ms -> ${event.latencyUpdate.newLatency}ms`,
      timestamp: timestampToUnixMs(event.timestamp),
      peerId: event.latencyUpdate.peerId,
      data: event.latencyUpdate
    }
  }

  if (event.healthUpdate) {
    return {
      type: 'HEALTH_UPDATE',
      description: `Network health: ${event.healthUpdate.overallHealth} (${event.healthUpdate.connectedPeersPercent.toFixed(0)}% connected)`,
      timestamp: timestampToUnixMs(event.timestamp),
      data: event.healthUpdate
    }
  }

  if (event.nodeEvent) {
    return {
      type: 'PEER_CONNECTED', // Map node events
      description: `Node ${event.nodeEvent.nodeId}: ${event.nodeEvent.oldStatus} -> ${event.nodeEvent.newStatus}`,
      timestamp: timestampToUnixMs(event.timestamp),
      peerId: event.nodeEvent.nodeId,
      data: event.nodeEvent
    }
  }

  return null
}

// ============================================================================
// HOOK
// ============================================================================

export function useNetworkGrpc(options: UseNetworkGrpcOptions = {}) {
  const {
    updateIntervalMs = 3000,
    filterPeerIds = [],
    includeTopology = true,
    enabled = true
  } = options

  const [peers, setPeers] = useState<Map<string, Peer>>(new Map())
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null)
  const [recentEvents, setRecentEvents] = useState<NetworkEvent[]>([])
  const [state, setState] = useState<NetworkStreamState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    streamStatus: 'IDLE'
  })

  const cancelRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(true)
  const maxEvents = 100

  // Message handler
  const handleMessage = useCallback((event: NetworkEventStream) => {
    if (!mountedRef.current) return

    // Update topology if present
    if (event.topologyUpdate) {
      const topology = event.topologyUpdate
      setMetrics(mapToNetworkMetrics(topology))

      // Update peers map
      if (topology.peers) {
        setPeers(prev => {
          const updated = new Map(prev)
          topology.peers.forEach(node => {
            updated.set(node.id, mapToPeer(node))
          })
          return updated
        })
      }
    }

    // Update individual peer status
    if (event.peerConnected) {
      setPeers(prev => {
        const updated = new Map(prev)
        updated.set(event.peerConnected!.peerId, {
          id: event.peerConnected!.peerId,
          address: event.peerConnected!.peerAddress,
          status: 'CONNECTED',
          latency: event.peerConnected!.initialLatency,
          version: '',
          uptime: 0,
          lastSeen: timestampToUnixMs(event.peerConnected!.connectionTime),
          inboundBytes: 0,
          outboundBytes: 0,
          connectionQuality: 'GOOD'
        })
        return updated
      })
    }

    if (event.peerDisconnected) {
      setPeers(prev => {
        const updated = new Map(prev)
        const existing = updated.get(event.peerDisconnected!.peerId)
        if (existing) {
          updated.set(event.peerDisconnected!.peerId, {
            ...existing,
            status: 'DISCONNECTED'
          })
        }
        return updated
      })
    }

    // Add event to recent events
    const newEvent = createEventFromStream(event)
    if (newEvent) {
      setRecentEvents(prev => [newEvent, ...prev].slice(0, maxEvents))
    }

    setState(prev => ({
      ...prev,
      lastUpdate: Date.now(),
      error: null
    }))
  }, [])

  // Error handler
  const handleError = useCallback((error: Error) => {
    if (!mountedRef.current) return
    console.error('[useNetworkGrpc] Stream error:', error)
    setState(prev => ({ ...prev, error: error.message }))
  }, [])

  // Status handler
  const handleStatus = useCallback((status: GrpcStreamStatus) => {
    if (!mountedRef.current) return
    setState(prev => ({
      ...prev,
      streamStatus: status,
      connected: status === 'STREAMING',
      reconnecting: status === 'RECONNECTING'
    }))
  }, [])

  // Start stream
  const startStream = useCallback(() => {
    if (!enabled) return

    const subscription: Partial<NetworkSubscribeRequest> = {
      clientId: `network-${Date.now()}`,
      eventTypes: ['topology', 'peer_connected', 'peer_disconnected', 'latency', 'health'],
      updateIntervalMs,
      filterPeerIds,
      includeTopology
    }

    cancelRef.current = networkStreamClient.streamNetworkEvents(
      subscription,
      handleMessage,
      handleError,
      handleStatus
    )
  }, [enabled, updateIntervalMs, filterPeerIds, includeTopology, handleMessage, handleError, handleStatus])

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
    startStream()
  }, [stopStream, startStream])

  // Clear events
  const clearEvents = useCallback(() => {
    setRecentEvents([])
  }, [])

  // Effect: Start/stop stream
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

  // Get peers as array
  const peerList = Array.from(peers.values())
  const connectedPeers = peerList.filter(p => p.status === 'CONNECTED')
  const disconnectedPeers = peerList.filter(p => p.status === 'DISCONNECTED')

  return {
    peers: peerList,
    peersMap: peers,
    connectedPeers,
    disconnectedPeers,
    metrics,
    recentEvents,
    status: state,
    reconnect,
    clearEvents,
    isConnected: state.connected,
    isReconnecting: state.reconnecting
  }
}

export default useNetworkGrpc

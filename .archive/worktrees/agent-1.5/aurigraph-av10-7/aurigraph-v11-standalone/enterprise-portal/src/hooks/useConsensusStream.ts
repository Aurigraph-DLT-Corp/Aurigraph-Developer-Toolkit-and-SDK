/**
 * useConsensusStream.ts
 * Custom hook for real-time consensus state streaming via WebSocket
 *
 * Endpoint: ws://localhost:9003/ws/consensus
 * Trigger: On consensus state change
 * Features: Current leader, consensus state, performance score, active validators
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface ConsensusState {
  state: 'LEADER' | 'FOLLOWER' | 'CANDIDATE' | 'OBSERVER'
  currentLeader: string | null
  epoch: number
  round: number
  term: number
  performanceScore: number
  activeValidators: number
  totalValidators: number
  lastBlockTime: number
  averageBlockTime: number
  consensusHealth: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL'
  timestamp: number
}

export interface ConsensusEvent {
  type: 'LEADER_CHANGE' | 'STATE_CHANGE' | 'EPOCH_CHANGE' | 'PERFORMANCE_UPDATE'
  oldValue?: string | number
  newValue?: string | number
  timestamp: number
  details?: string
}

export interface ConsensusStreamStatus {
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
const CONSENSUS_ENDPOINT = '/ws/consensus'
const INITIAL_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000
const RECONNECT_MULTIPLIER = 2
const RECENT_EVENTS_LIMIT = 50

// ============================================================================
// HOOK
// ============================================================================

export const useConsensusStream = () => {
  const [consensus, setConsensus] = useState<ConsensusState | null>(null)
  const [recentEvents, setRecentEvents] = useState<ConsensusEvent[]>([])
  const [status, setStatus] = useState<ConsensusStreamStatus>({
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
  const prevConsensusRef = useRef<ConsensusState | null>(null)

  // ============================================================================
  // CONSENSUS MANAGEMENT
  // ============================================================================

  const updateConsensus = useCallback((newConsensus: ConsensusState) => {
    const prev = prevConsensusRef.current
    const events: ConsensusEvent[] = []

    // Track leader changes
    if (prev && prev.currentLeader !== newConsensus.currentLeader) {
      events.push({
        type: 'LEADER_CHANGE',
        oldValue: prev.currentLeader || 'None',
        newValue: newConsensus.currentLeader || 'None',
        timestamp: Date.now(),
        details: `Leader changed from ${prev.currentLeader || 'None'} to ${newConsensus.currentLeader || 'None'}`
      })
    }

    // Track state changes
    if (prev && prev.state !== newConsensus.state) {
      events.push({
        type: 'STATE_CHANGE',
        oldValue: prev.state,
        newValue: newConsensus.state,
        timestamp: Date.now(),
        details: `Consensus state changed from ${prev.state} to ${newConsensus.state}`
      })
    }

    // Track epoch changes
    if (prev && prev.epoch !== newConsensus.epoch) {
      events.push({
        type: 'EPOCH_CHANGE',
        oldValue: prev.epoch,
        newValue: newConsensus.epoch,
        timestamp: Date.now(),
        details: `New epoch: ${newConsensus.epoch}`
      })
    }

    // Track significant performance changes (>5% change)
    if (prev && Math.abs(prev.performanceScore - newConsensus.performanceScore) > 5) {
      events.push({
        type: 'PERFORMANCE_UPDATE',
        oldValue: prev.performanceScore,
        newValue: newConsensus.performanceScore,
        timestamp: Date.now(),
        details: `Performance score changed from ${prev.performanceScore}% to ${newConsensus.performanceScore}%`
      })
    }

    // Add events to recent events list
    if (events.length > 0) {
      setRecentEvents(prevEvents => {
        const updated = [...events, ...prevEvents]
        return updated.slice(0, RECENT_EVENTS_LIMIT)
      })

      setStatus(prev => ({
        ...prev,
        eventCount: prev.eventCount + events.length
      }))
    }

    setConsensus(newConsensus)
    prevConsensusRef.current = newConsensus

    setStatus(prev => ({
      ...prev,
      lastUpdate: Date.now()
    }))
  }, [])

  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const ws = new WebSocket(`${WS_URL}${CONSENSUS_ENDPOINT}`)

      ws.onopen = () => {
        console.log('✅ Consensus WebSocket connected')
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
          const data = JSON.parse(event.data) as ConsensusState
          updateConsensus(data)
        } catch (err) {
          console.error('Failed to parse consensus data:', err)
          setStatus(prev => ({
            ...prev,
            error: 'Failed to parse consensus data'
          }))
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Consensus WebSocket error:', error)
        setStatus(prev => ({
          ...prev,
          error: 'WebSocket connection error'
        }))
      }

      ws.onclose = () => {
        console.log('🔌 Consensus WebSocket disconnected')
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
  }, [updateConsensus])

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
    consensus,
    recentEvents,
    status,
    reconnect: connect
  }
}

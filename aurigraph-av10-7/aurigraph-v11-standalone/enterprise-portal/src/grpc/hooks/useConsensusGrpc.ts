/**
 * useConsensusGrpc.ts
 * React hook for real-time consensus streaming via gRPC-Web
 *
 * Replaces: useConsensusStream.ts
 * Service: ConsensusStreamService.StreamConsensusEvents
 * Update frequency: 500ms (configurable)
 *
 * Provides real-time HyperRAFT++ consensus state monitoring
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { consensusStreamClient } from '../services'
import { GrpcStreamStatus } from '../GrpcWebClient'
import {
  ConsensusEventStream,
  ConsensusStateUpdate,
  LeaderElectionEvent,
  BlockProposalEvent,
  ConsensusSubscribeRequest,
  ConsensusState,
  ConsensusRole,
  ConsensusHealth,
  timestampToUnixMs
} from '../types'

// ============================================================================
// TYPES
// ============================================================================

export interface ConsensusData {
  // Core state (matching WebSocket interface)
  state: ConsensusRole
  currentLeader: string | null
  epoch: number
  round: number
  term: number
  performanceScore: number
  activeValidators: number
  totalValidators: number
  lastBlockTime: number
  averageBlockTime: number
  consensusHealth: ConsensusHealth
  timestamp: number
}

export interface ConsensusEvent {
  type: 'LEADER_CHANGE' | 'STATE_CHANGE' | 'EPOCH_CHANGE' | 'PERFORMANCE_UPDATE' | 'BLOCK_PROPOSAL' | 'COMMITMENT'
  description: string
  timestamp: number
  data?: any
}

export interface ConsensusStreamState {
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  streamStatus: GrpcStreamStatus
}

export interface UseConsensusGrpcOptions {
  updateIntervalMs?: number
  eventTypes?: string[]
  filterValidatorIds?: string[]
  includeHistorical?: boolean
  historicalMinutes?: number
  enabled?: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapToConsensusData(update: ConsensusStateUpdate): ConsensusData {
  const state = update.currentState
  const metrics = update.metrics

  return {
    state: state?.currentRole || 'FOLLOWER',
    currentLeader: state?.currentLeader || null,
    epoch: 0, // Not in proto, would need to add
    round: 0, // Not in proto, would need to add
    term: state?.currentTerm || 0,
    performanceScore: metrics?.blocksPerSecond ? Math.min(100, metrics.blocksPerSecond * 10) : 0,
    activeValidators: state?.activeValidators || 0,
    totalValidators: state?.totalValidators || 0,
    lastBlockTime: timestampToUnixMs(state?.lastBlockTime),
    averageBlockTime: state?.averageBlockTimeMs || 0,
    consensusHealth: state?.consensusHealth || 'OPTIMAL',
    timestamp: timestampToUnixMs(update.timestamp)
  }
}

function createEventFromStream(event: ConsensusEventStream): ConsensusEvent | null {
  if (event.stateUpdate) {
    const change = event.stateUpdate.stateChange
    if (change) {
      return {
        type: change.changeType === 'LEADER_CHANGE' ? 'LEADER_CHANGE' : 'STATE_CHANGE',
        description: `${change.changeType}: ${change.oldValue} -> ${change.newValue}`,
        timestamp: timestampToUnixMs(event.timestamp),
        data: change
      }
    }
  }

  if (event.leaderElection) {
    return {
      type: 'LEADER_CHANGE',
      description: `Leader election: ${event.leaderElection.phase} - ${event.leaderElection.electedLeaderId || event.leaderElection.candidateId}`,
      timestamp: timestampToUnixMs(event.timestamp),
      data: event.leaderElection
    }
  }

  if (event.blockProposal) {
    return {
      type: 'BLOCK_PROPOSAL',
      description: `Block proposal: ${event.blockProposal.status} - ${event.blockProposal.proposalId}`,
      timestamp: timestampToUnixMs(event.timestamp),
      data: event.blockProposal
    }
  }

  if (event.commitment) {
    return {
      type: 'COMMITMENT',
      description: `Block commitment: ${event.commitment.phase} - height ${event.commitment.finalizedHeight}`,
      timestamp: timestampToUnixMs(event.timestamp),
      data: event.commitment
    }
  }

  if (event.performance) {
    return {
      type: 'PERFORMANCE_UPDATE',
      description: `Performance: ${event.performance.currentBlocksPerSecond.toFixed(2)} blocks/s`,
      timestamp: timestampToUnixMs(event.timestamp),
      data: event.performance
    }
  }

  return null
}

// ============================================================================
// HOOK
// ============================================================================

export function useConsensusGrpc(options: UseConsensusGrpcOptions = {}) {
  const {
    updateIntervalMs = 500,
    eventTypes = ['state_changes', 'leader_election', 'proposals', 'commitments', 'performance'],
    filterValidatorIds = [],
    includeHistorical = false,
    historicalMinutes = 5,
    enabled = true
  } = options

  const [consensusState, setConsensusState] = useState<ConsensusData | null>(null)
  const [recentEvents, setRecentEvents] = useState<ConsensusEvent[]>([])
  const [state, setState] = useState<ConsensusStreamState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    streamStatus: 'IDLE'
  })

  const cancelRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(true)
  const maxEvents = 50

  // Message handler
  const handleMessage = useCallback((event: ConsensusEventStream) => {
    if (!mountedRef.current) return

    // Update state if we have a state update
    if (event.stateUpdate) {
      const data = mapToConsensusData(event.stateUpdate)
      setConsensusState(data)
    }

    // Add event to recent events
    const newEvent = createEventFromStream(event)
    if (newEvent) {
      setRecentEvents(prev => {
        const updated = [newEvent, ...prev].slice(0, maxEvents)
        return updated
      })
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
    console.error('[useConsensusGrpc] Stream error:', error)
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

    const subscription: Partial<ConsensusSubscribeRequest> = {
      clientId: `consensus-${Date.now()}`,
      eventTypes,
      updateIntervalMs,
      filterValidatorIds,
      includeHistorical,
      historicalMinutes
    }

    cancelRef.current = consensusStreamClient.streamConsensusEvents(
      subscription,
      handleMessage,
      handleError,
      handleStatus
    )
  }, [enabled, eventTypes, updateIntervalMs, filterValidatorIds, includeHistorical, historicalMinutes, handleMessage, handleError, handleStatus])

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

  return {
    consensusState,
    recentEvents,
    status: state,
    reconnect,
    clearEvents,
    isConnected: state.connected,
    isReconnecting: state.reconnecting
  }
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

export function useLeaderElectionGrpc(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  const [elections, setElections] = useState<LeaderElectionEvent[]>([])
  const [currentElection, setCurrentElection] = useState<LeaderElectionEvent | null>(null)
  const [state, setState] = useState<ConsensusStreamState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    streamStatus: 'IDLE'
  })

  const cancelRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    if (enabled) {
      cancelRef.current = consensusStreamClient.streamLeaderElections(
        { updateIntervalMs: 500 },
        (election) => {
          if (!mountedRef.current) return
          setCurrentElection(election)
          setElections(prev => [election, ...prev].slice(0, 20))
          setState(prev => ({ ...prev, lastUpdate: Date.now() }))
        },
        (error) => {
          if (!mountedRef.current) return
          setState(prev => ({ ...prev, error: error.message }))
        },
        (status) => {
          if (!mountedRef.current) return
          setState(prev => ({
            ...prev,
            streamStatus: status,
            connected: status === 'STREAMING',
            reconnecting: status === 'RECONNECTING'
          }))
        }
      )
    }

    return () => {
      mountedRef.current = false
      if (cancelRef.current) cancelRef.current()
    }
  }, [enabled])

  return { currentElection, elections, status: state }
}

export function useBlockProposalsGrpc(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  const [proposals, setProposals] = useState<BlockProposalEvent[]>([])
  const [state, setState] = useState<ConsensusStreamState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    streamStatus: 'IDLE'
  })

  const cancelRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    if (enabled) {
      cancelRef.current = consensusStreamClient.streamBlockProposals(
        { updateIntervalMs: 500 },
        (proposal) => {
          if (!mountedRef.current) return
          setProposals(prev => [proposal, ...prev].slice(0, 50))
          setState(prev => ({ ...prev, lastUpdate: Date.now() }))
        },
        (error) => {
          if (!mountedRef.current) return
          setState(prev => ({ ...prev, error: error.message }))
        },
        (status) => {
          if (!mountedRef.current) return
          setState(prev => ({
            ...prev,
            streamStatus: status,
            connected: status === 'STREAMING',
            reconnecting: status === 'RECONNECTING'
          }))
        }
      )
    }

    return () => {
      mountedRef.current = false
      if (cancelRef.current) cancelRef.current()
    }
  }, [enabled])

  return { proposals, status: state }
}

export default useConsensusGrpc

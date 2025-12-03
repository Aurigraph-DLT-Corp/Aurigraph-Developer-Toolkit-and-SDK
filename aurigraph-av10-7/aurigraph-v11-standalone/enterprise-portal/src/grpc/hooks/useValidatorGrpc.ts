/**
 * useValidatorGrpc.ts
 * React hook for real-time validator streaming via gRPC-Web
 *
 * Replaces: useValidatorStream.ts
 * Service: ValidatorStreamService.StreamValidatorEvents
 * Update frequency: 2 seconds (configurable)
 *
 * Provides real-time validator status, health, and performance monitoring
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { validatorStreamClient } from '../services'
import { GrpcStreamStatus } from '../GrpcWebClient'
import {
  ValidatorEventStream,
  ValidatorStatusUpdate,
  ValidatorSubscribeRequest,
  ValidatorInfo,
  ValidatorStatus,
  HealthStatus,
  timestampToUnixMs
} from '../types'

// ============================================================================
// TYPES
// ============================================================================

export interface Validator {
  id: string
  address: string
  name: string
  status: ValidatorStatus
  votingPower: number
  uptime: number
  lastBlockProposed: number
  commissionRate: number
  delegators: number
  totalStaked: string
  lastUpdate: number
  healthStatus?: HealthStatus
  performanceScore?: number
  reputationScore?: number
}

export interface ValidatorUpdate {
  validatorId: string
  type: 'STATUS' | 'VOTING_POWER' | 'UPTIME' | 'BLOCK_PROPOSED' | 'HEALTH' | 'PERFORMANCE' | 'REPUTATION'
  description: string
  timestamp: number
  oldValue?: any
  newValue?: any
}

export interface ValidatorStreamState {
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  streamStatus: GrpcStreamStatus
}

export interface UseValidatorGrpcOptions {
  updateIntervalMs?: number
  validatorIds?: string[]
  includePerformanceMetrics?: boolean
  includeHealthMetrics?: boolean
  enabled?: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapToValidator(info: ValidatorInfo, statusUpdate?: ValidatorStatusUpdate): Validator {
  return {
    id: info.id,
    address: info.address,
    name: info.name,
    status: info.status,
    votingPower: info.votingPower,
    uptime: info.uptime,
    lastBlockProposed: info.lastBlockProposed,
    commissionRate: info.commissionRate,
    delegators: info.delegators,
    totalStaked: info.totalStaked,
    lastUpdate: timestampToUnixMs(info.lastUpdate),
    healthStatus: statusUpdate?.health?.status,
    performanceScore: statusUpdate?.performance?.overallPerformanceScore,
    reputationScore: statusUpdate?.reputation?.currentReputation
  }
}

function createUpdateFromEvent(event: ValidatorEventStream): ValidatorUpdate | null {
  if (event.statusUpdate) {
    const v = event.statusUpdate.validator
    return {
      validatorId: v.id,
      type: 'STATUS',
      description: `Validator ${v.name} status: ${v.status}`,
      timestamp: timestampToUnixMs(event.timestamp),
      newValue: v.status
    }
  }

  if (event.healthUpdate) {
    return {
      validatorId: '',
      type: 'HEALTH',
      description: `Health update: ${event.healthUpdate.status} (score: ${event.healthUpdate.healthScore})`,
      timestamp: timestampToUnixMs(event.timestamp),
      newValue: event.healthUpdate
    }
  }

  if (event.performanceUpdate) {
    return {
      validatorId: '',
      type: 'PERFORMANCE',
      description: `Performance: ${event.performanceUpdate.overallPerformanceScore.toFixed(1)}%`,
      timestamp: timestampToUnixMs(event.timestamp),
      newValue: event.performanceUpdate
    }
  }

  if (event.reputationUpdate) {
    return {
      validatorId: '',
      type: 'REPUTATION',
      description: `Reputation: ${event.reputationUpdate.currentReputation.toFixed(1)} (rank #${event.reputationUpdate.reputationRank})`,
      timestamp: timestampToUnixMs(event.timestamp),
      newValue: event.reputationUpdate
    }
  }

  if (event.activityEvent) {
    const a = event.activityEvent
    return {
      validatorId: a.validatorId,
      type: a.activityType === 'ROLE_CHANGED' ? 'STATUS' :
            a.activityType === 'REPUTATION_CHANGED' ? 'REPUTATION' : 'STATUS',
      description: `${a.validatorId}: ${a.activityType} - ${a.reason}`,
      timestamp: timestampToUnixMs(event.timestamp),
      oldValue: a.oldRole || a.oldReputation,
      newValue: a.newRole || a.newReputation
    }
  }

  return null
}

// ============================================================================
// HOOK
// ============================================================================

export function useValidatorGrpc(options: UseValidatorGrpcOptions = {}) {
  const {
    updateIntervalMs = 2000,
    validatorIds = [],
    includePerformanceMetrics = true,
    includeHealthMetrics = true,
    enabled = true
  } = options

  const [validators, setValidators] = useState<Map<string, Validator>>(new Map())
  const [recentUpdates, setRecentUpdates] = useState<ValidatorUpdate[]>([])
  const [state, setState] = useState<ValidatorStreamState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    streamStatus: 'IDLE'
  })

  const cancelRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(true)
  const maxUpdates = 50

  // Message handler
  const handleMessage = useCallback((event: ValidatorEventStream) => {
    if (!mountedRef.current) return

    // Update validator if we have status update
    if (event.statusUpdate) {
      const validator = mapToValidator(event.statusUpdate.validator, event.statusUpdate)
      setValidators(prev => {
        const updated = new Map(prev)
        updated.set(validator.id, validator)
        return updated
      })
    }

    // Add to recent updates
    const update = createUpdateFromEvent(event)
    if (update) {
      setRecentUpdates(prev => [update, ...prev].slice(0, maxUpdates))
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
    console.error('[useValidatorGrpc] Stream error:', error)
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

    const subscription: Partial<ValidatorSubscribeRequest> = {
      clientId: `validator-${Date.now()}`,
      validatorIds,
      eventTypes: ['status', 'health', 'performance', 'reputation'],
      updateIntervalMs,
      includePerformanceMetrics,
      includeHealthMetrics
    }

    cancelRef.current = validatorStreamClient.streamValidatorEvents(
      subscription,
      handleMessage,
      handleError,
      handleStatus
    )
  }, [enabled, validatorIds, updateIntervalMs, includePerformanceMetrics, includeHealthMetrics, handleMessage, handleError, handleStatus])

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

  // Get validators as array
  const validatorList = Array.from(validators.values())

  // Get active/inactive counts
  const activeCount = validatorList.filter(v => v.status === 'ACTIVE').length
  const inactiveCount = validatorList.filter(v => v.status !== 'ACTIVE').length

  return {
    validators: validatorList,
    validatorsMap: validators,
    recentUpdates,
    activeCount,
    inactiveCount,
    totalCount: validatorList.length,
    status: state,
    reconnect,
    isConnected: state.connected,
    isReconnecting: state.reconnecting
  }
}

export default useValidatorGrpc

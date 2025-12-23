/**
 * useValidatorStream.ts
 * Custom hook for real-time validator status streaming via WebSocket
 *
 * Endpoint: ws://localhost:9003/ws/validators
 * Trigger: On validator status change
 * Features: Real-time validator updates, uptime tracking, voting power changes
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface Validator {
  id: string
  address: string
  name: string
  status: 'ACTIVE' | 'INACTIVE' | 'JAILED' | 'UNBONDING'
  votingPower: number
  uptime: number
  lastBlockProposed: number
  commissionRate: number
  delegators: number
  totalStaked: string
  lastUpdate: number
}

export interface ValidatorUpdate {
  validatorId: string
  field: 'status' | 'votingPower' | 'uptime' | 'lastBlockProposed'
  oldValue: string | number
  newValue: string | number
  timestamp: number
}

export interface ValidatorStreamStatus {
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  connectionAttempts: number
  updateCount: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:9003'
const VALIDATOR_ENDPOINT = '/ws/validators'
const INITIAL_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000
const RECONNECT_MULTIPLIER = 2
const RECENT_UPDATES_LIMIT = 50

// ============================================================================
// HOOK
// ============================================================================

export const useValidatorStream = () => {
  const [validators, setValidators] = useState<Map<string, Validator>>(new Map())
  const [recentUpdates, setRecentUpdates] = useState<ValidatorUpdate[]>([])
  const [status, setStatus] = useState<ValidatorStreamStatus>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    connectionAttempts: 0,
    updateCount: 0
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY)
  const mountedRef = useRef<boolean>(true)

  // ============================================================================
  // VALIDATOR MANAGEMENT
  // ============================================================================

  const updateValidator = useCallback((validatorData: Validator) => {
    setValidators(prev => {
      const existing = prev.get(validatorData.id)
      const updated = new Map(prev)
      updated.set(validatorData.id, {
        ...validatorData,
        lastUpdate: Date.now()
      })

      // Track what changed
      if (existing) {
        const changes: ValidatorUpdate[] = []

        if (existing.status !== validatorData.status) {
          changes.push({
            validatorId: validatorData.id,
            field: 'status',
            oldValue: existing.status,
            newValue: validatorData.status,
            timestamp: Date.now()
          })
        }

        if (existing.votingPower !== validatorData.votingPower) {
          changes.push({
            validatorId: validatorData.id,
            field: 'votingPower',
            oldValue: existing.votingPower,
            newValue: validatorData.votingPower,
            timestamp: Date.now()
          })
        }

        if (existing.uptime !== validatorData.uptime) {
          changes.push({
            validatorId: validatorData.id,
            field: 'uptime',
            oldValue: existing.uptime,
            newValue: validatorData.uptime,
            timestamp: Date.now()
          })
        }

        if (existing.lastBlockProposed !== validatorData.lastBlockProposed) {
          changes.push({
            validatorId: validatorData.id,
            field: 'lastBlockProposed',
            oldValue: existing.lastBlockProposed,
            newValue: validatorData.lastBlockProposed,
            timestamp: Date.now()
          })
        }

        if (changes.length > 0) {
          setRecentUpdates(prev => {
            const updated = [...changes, ...prev]
            return updated.slice(0, RECENT_UPDATES_LIMIT)
          })
        }
      }

      return updated
    })

    setStatus(prev => ({
      ...prev,
      updateCount: prev.updateCount + 1,
      lastUpdate: Date.now()
    }))
  }, [])

  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const ws = new WebSocket(`${WS_URL}${VALIDATOR_ENDPOINT}`)

      ws.onopen = () => {
        console.log('✅ Validator WebSocket connected')
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
          const validator = JSON.parse(event.data) as Validator
          updateValidator(validator)
        } catch (err) {
          console.error('Failed to parse validator data:', err)
          setStatus(prev => ({
            ...prev,
            error: 'Failed to parse validator data'
          }))
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Validator WebSocket error:', error)
        setStatus(prev => ({
          ...prev,
          error: 'WebSocket connection error'
        }))
      }

      ws.onclose = () => {
        console.log('🔌 Validator WebSocket disconnected')
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
  }, [updateValidator])

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
    validators: Array.from(validators.values()),
    validatorsMap: validators,
    recentUpdates,
    status,
    reconnect: connect
  }
}

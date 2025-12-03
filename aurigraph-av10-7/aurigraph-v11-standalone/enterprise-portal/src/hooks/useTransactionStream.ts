/**
 * useTransactionStream.ts
 * Custom hook for real-time transaction streaming via WebSocket
 *
 * @deprecated This hook is deprecated. Use useTransactionGrpc from '../grpc' instead.
 * Migration: import { useTransactionGrpc } from '../grpc'
 * Sunset date: 2025-03-01
 *
 * Endpoint: ws://localhost:9003/ws/transactions
 * Trigger: On new transaction
 * Features: Auto-update transaction list, new badge for recent txs
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  timestamp: number
  blockNumber?: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  isNew?: boolean
}

export interface TransactionStreamStatus {
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  connectionAttempts: number
  transactionCount: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:9003'
const TRANSACTION_ENDPOINT = '/ws/transactions'
const INITIAL_RECONNECT_DELAY = 1000
const MAX_RECONNECT_DELAY = 30000
const RECONNECT_MULTIPLIER = 2
const NEW_TRANSACTION_TIMEOUT = 5000 // 5 seconds to show "new" badge
const MAX_TRANSACTIONS = 100 // Keep last 100 transactions

// ============================================================================
// HOOK
// ============================================================================

export const useTransactionStream = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [status, setStatus] = useState<TransactionStreamStatus>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    connectionAttempts: 0,
    transactionCount: 0
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectDelayRef = useRef<number>(INITIAL_RECONNECT_DELAY)
  const mountedRef = useRef<boolean>(true)
  const newTransactionTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // ============================================================================
  // TRANSACTION MANAGEMENT
  // ============================================================================

  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions(prev => {
      // Mark as new
      const newTx = { ...tx, isNew: true }

      // Add to beginning of array
      const updated = [newTx, ...prev]

      // Keep only last MAX_TRANSACTIONS
      const trimmed = updated.slice(0, MAX_TRANSACTIONS)

      return trimmed
    })

    // Set timer to remove "new" badge
    const timer = setTimeout(() => {
      setTransactions(prev =>
        prev.map(t => t.hash === tx.hash ? { ...t, isNew: false } : t)
      )
      newTransactionTimersRef.current.delete(tx.hash)
    }, NEW_TRANSACTION_TIMEOUT)

    newTransactionTimersRef.current.set(tx.hash, timer)

    // Update transaction count
    setStatus(prev => ({
      ...prev,
      transactionCount: prev.transactionCount + 1,
      lastUpdate: Date.now()
    }))
  }, [])

  // ============================================================================
  // WEBSOCKET CONNECTION
  // ============================================================================

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    try {
      const ws = new WebSocket(`${WS_URL}${TRANSACTION_ENDPOINT}`)

      ws.onopen = () => {
        console.log('✅ Transaction WebSocket connected')
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
          const tx = JSON.parse(event.data) as Transaction
          addTransaction(tx)
        } catch (err) {
          console.error('Failed to parse transaction data:', err)
          setStatus(prev => ({
            ...prev,
            error: 'Failed to parse transaction data'
          }))
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Transaction WebSocket error:', error)
        setStatus(prev => ({
          ...prev,
          error: 'WebSocket connection error'
        }))
      }

      ws.onclose = () => {
        console.log('🔌 Transaction WebSocket disconnected')
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
  }, [addTransaction])

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

    // Clear all new transaction timers
    newTransactionTimersRef.current.forEach(timer => clearTimeout(timer))
    newTransactionTimersRef.current.clear()

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
    transactions,
    status,
    reconnect: connect,
    clearTransactions: () => setTransactions([])
  }
}

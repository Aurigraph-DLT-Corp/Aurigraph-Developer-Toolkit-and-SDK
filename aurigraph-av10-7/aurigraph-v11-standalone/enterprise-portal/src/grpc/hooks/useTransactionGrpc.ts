/**
 * useTransactionGrpc.ts
 * React hook for real-time transaction streaming via gRPC-Web
 *
 * Replaces: useTransactionStream.ts
 * Service: TransactionStreamService.StreamTransactionEvents
 * Trigger: On new transaction
 *
 * Provides real-time transaction feed with automatic updates and "new" badge support
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { grpcClient } from '../GrpcWebClient'
import { GrpcStreamStatus } from '../GrpcWebClient'
import { timestampToUnixMs } from '../types'

// ============================================================================
// TYPES
// ============================================================================

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CONFIRMING'

export interface TransactionStreamRequest {
  clientId: string
  updateIntervalMs?: number
  filterStatuses?: TransactionStatus[]
  filterAddresses?: string[]
  includeDetails?: boolean
  maxBatchSize?: number
}

export interface TransactionEvent {
  transaction?: TransactionInfo
  batch?: TransactionBatch
  statistics?: TransactionStatistics
  alert?: TransactionAlert
  timestamp: { seconds: number; nanos: number }
}

export interface TransactionInfo {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  gasLimit: string
  gasUsed: string
  nonce: number
  blockNumber: number
  blockHash: string
  timestamp: { seconds: number; nanos: number }
  status: TransactionStatus
  type: TransactionType
  data: string
  signature: string
  fee: string
  confirmations: number
}

export type TransactionType = 'TRANSFER' | 'CONTRACT_CALL' | 'CONTRACT_DEPLOY' | 'STAKE' | 'UNSTAKE' | 'GOVERNANCE'

export interface TransactionBatch {
  transactions: TransactionInfo[]
  totalCount: number
  fromTimestamp: { seconds: number; nanos: number }
  toTimestamp: { seconds: number; nanos: number }
}

export interface TransactionStatistics {
  totalTransactions: number
  pendingTransactions: number
  successfulTransactions: number
  failedTransactions: number
  averageGasPrice: string
  averageFee: string
  tps: number
  timestamp: { seconds: number; nanos: number }
}

export interface TransactionAlert {
  alertType: 'HIGH_VALUE' | 'WHALE_MOVEMENT' | 'UNUSUAL_ACTIVITY' | 'FAILED_TRANSACTION'
  transaction: TransactionInfo
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
}

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  timestamp: number
  blockNumber?: number
  status: TransactionStatus
  isNew?: boolean
  type?: TransactionType
  fee?: string
  confirmations?: number
}

export interface TransactionStreamState {
  connected: boolean
  reconnecting: boolean
  error: string | null
  lastUpdate: number | null
  streamStatus: GrpcStreamStatus
  transactionCount: number
}

export interface UseTransactionGrpcOptions {
  updateIntervalMs?: number
  filterStatuses?: TransactionStatus[]
  filterAddresses?: string[]
  includeDetails?: boolean
  maxTransactions?: number
  newBadgeTimeoutMs?: number
  enabled?: boolean
}

// ============================================================================
// SERVICE CONSTANTS
// ============================================================================

const SERVICE = 'io.aurigraph.v11.proto.TransactionStreamService'
const STREAM_TRANSACTIONS = 'StreamTransactionEvents'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapToTransaction(info: TransactionInfo): Transaction {
  return {
    hash: info.hash,
    from: info.from,
    to: info.to,
    value: info.value,
    gasPrice: info.gasPrice,
    timestamp: timestampToUnixMs(info.timestamp),
    blockNumber: info.blockNumber || undefined,
    status: info.status,
    isNew: true,
    type: info.type,
    fee: info.fee,
    confirmations: info.confirmations
  }
}

function deserializeTransactionEvent(data: Uint8Array): TransactionEvent {
  // Manual deserialization from protobuf binary format
  // In production, use generated protobuf decoder
  const text = new TextDecoder().decode(data)
  try {
    return JSON.parse(text) as TransactionEvent
  } catch {
    // Fallback for binary protobuf - would need proper decoder
    console.warn('[useTransactionGrpc] Binary protobuf received, JSON fallback failed')
    return {
      timestamp: { seconds: Math.floor(Date.now() / 1000), nanos: 0 }
    }
  }
}

// ============================================================================
// TRANSACTION STREAM CLIENT
// ============================================================================

class TransactionStreamClient {
  streamTransactionEvents(
    request: Partial<TransactionStreamRequest>,
    onMessage: (event: TransactionEvent) => void,
    onError: (error: Error) => void,
    onStatus: (status: GrpcStreamStatus) => void
  ): () => void {
    const fullRequest: TransactionStreamRequest = {
      clientId: request.clientId || `tx-${Date.now()}`,
      updateIntervalMs: request.updateIntervalMs ?? 1000,
      filterStatuses: request.filterStatuses || [],
      filterAddresses: request.filterAddresses || [],
      includeDetails: request.includeDetails ?? true,
      maxBatchSize: request.maxBatchSize ?? 50
    }

    return grpcClient.serverStream(
      SERVICE,
      STREAM_TRANSACTIONS,
      fullRequest,
      deserializeTransactionEvent,
      onMessage,
      onError,
      onStatus,
      { autoReconnect: true, maxRetries: 10 }
    )
  }
}

export const transactionStreamClient = new TransactionStreamClient()

// ============================================================================
// HOOK
// ============================================================================

export function useTransactionGrpc(options: UseTransactionGrpcOptions = {}) {
  const {
    updateIntervalMs = 1000,
    filterStatuses = [],
    filterAddresses = [],
    includeDetails = true,
    maxTransactions = 100,
    newBadgeTimeoutMs = 5000,
    enabled = true
  } = options

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [statistics, setStatistics] = useState<TransactionStatistics | null>(null)
  const [recentAlerts, setRecentAlerts] = useState<TransactionAlert[]>([])
  const [state, setState] = useState<TransactionStreamState>({
    connected: false,
    reconnecting: false,
    error: null,
    lastUpdate: null,
    streamStatus: 'IDLE',
    transactionCount: 0
  })

  const cancelRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(true)
  const newBadgeTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const maxAlerts = 20

  // Clear "new" badge after timeout
  const scheduleNewBadgeRemoval = useCallback((hash: string) => {
    const timer = setTimeout(() => {
      if (!mountedRef.current) return
      setTransactions(prev =>
        prev.map(tx => tx.hash === hash ? { ...tx, isNew: false } : tx)
      )
      newBadgeTimersRef.current.delete(hash)
    }, newBadgeTimeoutMs)

    newBadgeTimersRef.current.set(hash, timer)
  }, [newBadgeTimeoutMs])

  // Add transaction
  const addTransaction = useCallback((tx: Transaction) => {
    setTransactions(prev => {
      // Check if transaction already exists
      const exists = prev.some(t => t.hash === tx.hash)
      if (exists) {
        // Update existing transaction
        return prev.map(t => t.hash === tx.hash ? { ...tx, isNew: t.isNew } : t)
      }

      // Add new transaction at the beginning
      const updated = [tx, ...prev].slice(0, maxTransactions)
      return updated
    })

    scheduleNewBadgeRemoval(tx.hash)

    setState(prev => ({
      ...prev,
      transactionCount: prev.transactionCount + 1,
      lastUpdate: Date.now()
    }))
  }, [maxTransactions, scheduleNewBadgeRemoval])

  // Message handler
  const handleMessage = useCallback((event: TransactionEvent) => {
    if (!mountedRef.current) return

    // Handle single transaction
    if (event.transaction) {
      const tx = mapToTransaction(event.transaction)
      addTransaction(tx)
    }

    // Handle batch of transactions
    if (event.batch) {
      event.batch.transactions.forEach(info => {
        const tx = mapToTransaction(info)
        addTransaction(tx)
      })
    }

    // Update statistics
    if (event.statistics) {
      setStatistics(event.statistics)
    }

    // Handle alerts
    if (event.alert) {
      setRecentAlerts(prev => [event.alert!, ...prev].slice(0, maxAlerts))
    }

    setState(prev => ({
      ...prev,
      lastUpdate: Date.now(),
      error: null
    }))
  }, [addTransaction])

  // Error handler
  const handleError = useCallback((error: Error) => {
    if (!mountedRef.current) return
    console.error('[useTransactionGrpc] Stream error:', error)
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

    const request: Partial<TransactionStreamRequest> = {
      clientId: `transaction-${Date.now()}`,
      updateIntervalMs,
      filterStatuses,
      filterAddresses,
      includeDetails
    }

    cancelRef.current = transactionStreamClient.streamTransactionEvents(
      request,
      handleMessage,
      handleError,
      handleStatus
    )
  }, [enabled, updateIntervalMs, filterStatuses, filterAddresses, includeDetails, handleMessage, handleError, handleStatus])

  // Stop stream
  const stopStream = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current()
      cancelRef.current = null
    }

    // Clear all new badge timers
    newBadgeTimersRef.current.forEach(timer => clearTimeout(timer))
    newBadgeTimersRef.current.clear()
  }, [])

  // Reconnect
  const reconnect = useCallback(() => {
    stopStream()
    startStream()
  }, [stopStream, startStream])

  // Clear transactions
  const clearTransactions = useCallback(() => {
    setTransactions([])
    setState(prev => ({ ...prev, transactionCount: 0 }))
  }, [])

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setRecentAlerts([])
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

  // Computed values
  const pendingTransactions = transactions.filter(tx => tx.status === 'PENDING')
  const successfulTransactions = transactions.filter(tx => tx.status === 'SUCCESS')
  const failedTransactions = transactions.filter(tx => tx.status === 'FAILED')
  const newTransactions = transactions.filter(tx => tx.isNew)

  return {
    transactions,
    pendingTransactions,
    successfulTransactions,
    failedTransactions,
    newTransactions,
    statistics,
    recentAlerts,
    status: state,
    reconnect,
    clearTransactions,
    clearAlerts,
    isConnected: state.connected,
    isReconnecting: state.reconnecting,
    transactionCount: state.transactionCount
  }
}

export default useTransactionGrpc

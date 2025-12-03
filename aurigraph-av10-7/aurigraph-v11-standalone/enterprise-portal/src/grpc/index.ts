/**
 * Aurigraph V12 gRPC-Web Module
 *
 * This module provides gRPC-Web streaming capabilities for the Enterprise Portal,
 * replacing WebSocket connections with HTTP/2 + Protobuf for improved performance.
 *
 * Benefits:
 * - 60-70% bandwidth reduction (Protobuf vs JSON)
 * - HTTP/2 multiplexing (single connection for all streams)
 * - Type-safe message handling
 * - Built-in flow control and backpressure
 * - Better reconnection handling
 *
 * Migration:
 * - useMetricsWebSocket    -> useMetricsGrpc
 * - useConsensusStream     -> useConsensusGrpc
 * - useValidatorStream     -> useValidatorGrpc
 * - useNetworkStream       -> useNetworkGrpc
 * - useTransactionStream   -> useTransactionGrpc
 */

// Core client
export { grpcClient, GrpcWebClient } from './GrpcWebClient'
export type {
  GrpcStreamStatus,
  GrpcStreamState,
  GrpcClientConfig,
  StreamOptions,
  MessageHandler,
  ErrorHandler,
  StatusHandler
} from './GrpcWebClient'

// Service clients
export {
  metricsStreamClient,
  consensusStreamClient,
  validatorStreamClient,
  networkStreamClient,
  MetricsStreamClient,
  ConsensusStreamClient,
  ValidatorStreamClient,
  NetworkStreamClient,
  SERVICES
} from './services'

// Types
export * from './types'

// Hooks
export { useMetricsGrpc, useAggregatedMetricsGrpc } from './hooks/useMetricsGrpc'
export type { MetricsData, MetricsStreamState, UseMetricsGrpcOptions } from './hooks/useMetricsGrpc'

export { useConsensusGrpc, useLeaderElectionGrpc, useBlockProposalsGrpc } from './hooks/useConsensusGrpc'
export type { ConsensusData, ConsensusEvent, ConsensusStreamState, UseConsensusGrpcOptions } from './hooks/useConsensusGrpc'

export { useValidatorGrpc } from './hooks/useValidatorGrpc'
export type { Validator, ValidatorUpdate, ValidatorStreamState, UseValidatorGrpcOptions } from './hooks/useValidatorGrpc'

export { useNetworkGrpc } from './hooks/useNetworkGrpc'
export type { Peer, NetworkMetrics, NetworkEvent, NetworkStreamState, UseNetworkGrpcOptions } from './hooks/useNetworkGrpc'

export { useTransactionGrpc, transactionStreamClient } from './hooks/useTransactionGrpc'
export type { Transaction, TransactionStreamState, UseTransactionGrpcOptions, TransactionStatistics, TransactionAlert } from './hooks/useTransactionGrpc'

/**
 * useGrpcStream Hook
 *
 * Custom React hook for managing gRPC streaming connections.
 * Replaces useWebSocket with gRPC-Web streaming for improved performance.
 *
 * Features:
 * - Automatic connection lifecycle management
 * - Type-safe streaming data
 * - Connection status tracking
 * - Automatic reconnection handling
 * - Buffer management for high-frequency updates
 * - Component cleanup on unmount
 *
 * Usage:
 * ```tsx
 * const { data, status, error, connect, disconnect, latestMessage } = useGrpcStream<TransactionEvent>(
 *   'transactions',
 *   {
 *     autoConnect: true,
 *     reconnect: true,
 *     maxItems: 100,
 *   }
 * );
 * ```
 *
 * @author Enterprise Portal Team
 * @version 1.0.0
 * @since V12.0.0
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  grpcService,
  type StreamType,
  type ConnectionStatus,
  type StreamSubscription,
  type StreamConfig,
  type TransactionEvent,
  type MetricEvent,
  type ConsensusEvent,
  type ValidatorEvent,
  type NetworkEvent,
} from '../services/grpcService';

// Re-export types for convenience
export type {
  StreamType,
  ConnectionStatus,
  TransactionEvent,
  MetricEvent,
  ConsensusEvent,
  ValidatorEvent,
  NetworkEvent,
};

// =============================================================================
// Hook Types
// =============================================================================

/**
 * Stream status type alias
 */
export type StreamStatus = ConnectionStatus;

/**
 * Options for useGrpcStream hook
 */
export interface UseGrpcStreamOptions {
  /** Automatically connect on mount (default: true) */
  autoConnect?: boolean;
  /** Automatically reconnect on disconnect (default: true) */
  reconnect?: boolean;
  /** Delay before reconnection attempts in ms (default: 1000) */
  reconnectDelay?: number;
  /** Maximum reconnection attempts (default: 5) */
  maxReconnectAttempts?: number;
  /** Update interval for polling fallback in ms (default: 1000) */
  updateIntervalMs?: number;
  /** Maximum items to keep in data buffer (default: 100) */
  maxItems?: number;
  /** Filters to apply to stream */
  filters?: Record<string, string>;
  /** Callback when new message is received */
  onMessage?: <T>(message: T) => void;
  /** Callback when connection status changes */
  onStatusChange?: (status: StreamStatus) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

/**
 * Return type for useGrpcStream hook
 */
export interface UseGrpcStreamReturn<T> {
  /** Array of received data items */
  data: T[];
  /** Latest message received */
  latestMessage: T | null;
  /** Current connection status */
  status: StreamStatus;
  /** Current error if any */
  error: Error | null;
  /** Whether currently connected */
  isConnected: boolean;
  /** Whether currently connecting */
  isConnecting: boolean;
  /** Connect to stream */
  connect: () => void;
  /** Disconnect from stream */
  disconnect: () => void;
  /** Clear data buffer */
  clearData: () => void;
  /** Stream subscription ID */
  streamId: string | null;
  /** Message count */
  messageCount: number;
}

// =============================================================================
// Type Mapping for Stream Types
// =============================================================================

/**
 * Maps stream type to its event type
 */
type StreamEventType<T extends StreamType> = T extends 'transactions'
  ? TransactionEvent
  : T extends 'metrics'
    ? MetricEvent
    : T extends 'consensus'
      ? ConsensusEvent
      : T extends 'validators'
        ? ValidatorEvent
        : T extends 'network'
          ? NetworkEvent
          : never;

// =============================================================================
// Main Hook Implementation
// =============================================================================

/**
 * React hook for gRPC streaming with automatic lifecycle management
 *
 * @param streamType - Type of stream to subscribe to
 * @param options - Configuration options
 * @returns Stream state and control functions
 *
 * @example
 * ```tsx
 * // Subscribe to transaction stream
 * const { data, status, latestMessage } = useGrpcStream('transactions');
 *
 * // With options
 * const { data, status } = useGrpcStream('metrics', {
 *   autoConnect: true,
 *   maxItems: 50,
 *   onMessage: (msg) => console.log('New metric:', msg),
 * });
 * ```
 */
export function useGrpcStream<T extends StreamType>(
  streamType: T,
  options: UseGrpcStreamOptions = {}
): UseGrpcStreamReturn<StreamEventType<T>> {
  type EventType = StreamEventType<T>;

  // Destructure options with defaults
  const {
    autoConnect = true,
    reconnect = true,
    reconnectDelay = 1000,
    maxReconnectAttempts = 5,
    updateIntervalMs = 1000,
    maxItems = 100,
    filters = {},
    onMessage,
    onStatusChange,
    onError,
  } = options;

  // State
  const [data, setData] = useState<EventType[]>([]);
  const [latestMessage, setLatestMessage] = useState<EventType | null>(null);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [error, setError] = useState<Error | null>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  // Refs for cleanup and callbacks
  const subscriptionRef = useRef<StreamSubscription | null>(null);
  const mountedRef = useRef(true);
  const optionsRef = useRef(options);

  // Update options ref on change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Derived state
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  /**
   * Handle incoming messages
   */
  const handleMessage = useCallback(
    (message: EventType) => {
      if (!mountedRef.current) return;

      setLatestMessage(message);
      setMessageCount((prev) => prev + 1);
      setData((prevData) => {
        const newData = [message, ...prevData];
        // Limit buffer size
        if (newData.length > maxItems) {
          return newData.slice(0, maxItems);
        }
        return newData;
      });

      // Call user callback
      onMessage?.(message);
    },
    [maxItems, onMessage]
  );

  /**
   * Handle errors
   */
  const handleError = useCallback(
    (err: Error) => {
      if (!mountedRef.current) return;

      console.error(`[useGrpcStream] Error on ${streamType}:`, err);
      setError(err);
      onError?.(err);
    },
    [streamType, onError]
  );

  /**
   * Handle status changes
   */
  const handleStatusChange = useCallback(
    (newStatus: StreamStatus) => {
      if (!mountedRef.current) return;

      setStatus(newStatus);
      onStatusChange?.(newStatus);

      // Clear error on successful connection
      if (newStatus === 'connected') {
        setError(null);
      }
    },
    [onStatusChange]
  );

  /**
   * Connect to stream
   */
  const connect = useCallback(() => {
    // Don't connect if already connected/connecting
    if (subscriptionRef.current?.isActive) {
      console.log(`[useGrpcStream] Already connected to ${streamType}`);
      return;
    }

    console.log(`[useGrpcStream] Connecting to ${streamType}`);
    setStatus('connecting');
    setError(null);

    const config: StreamConfig = {
      updateIntervalMs,
      filters,
      autoReconnect: reconnect,
      maxReconnectAttempts,
      reconnectDelayMs: reconnectDelay,
    };

    // Subscribe based on stream type
    let subscription: StreamSubscription;

    switch (streamType) {
      case 'transactions':
        subscription = grpcService.subscribeToTransactions(
          handleMessage as (msg: TransactionEvent) => void,
          handleError,
          handleStatusChange,
          config
        );
        break;
      case 'metrics':
        subscription = grpcService.subscribeToMetrics(
          handleMessage as (msg: MetricEvent) => void,
          handleError,
          handleStatusChange,
          config
        );
        break;
      case 'consensus':
        subscription = grpcService.subscribeToConsensus(
          handleMessage as (msg: ConsensusEvent) => void,
          handleError,
          handleStatusChange,
          config
        );
        break;
      case 'validators':
        subscription = grpcService.subscribeToValidators(
          handleMessage as (msg: ValidatorEvent) => void,
          handleError,
          handleStatusChange,
          config
        );
        break;
      case 'network':
        subscription = grpcService.subscribeToNetwork(
          handleMessage as (msg: NetworkEvent) => void,
          handleError,
          handleStatusChange,
          config
        );
        break;
      default:
        console.error(`[useGrpcStream] Unknown stream type: ${streamType}`);
        setStatus('error');
        setError(new Error(`Unknown stream type: ${streamType}`));
        return;
    }

    subscriptionRef.current = subscription;
    setStreamId(subscription.streamId);
  }, [
    streamType,
    handleMessage,
    handleError,
    handleStatusChange,
    updateIntervalMs,
    filters,
    reconnect,
    maxReconnectAttempts,
    reconnectDelay,
  ]);

  /**
   * Disconnect from stream
   */
  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      console.log(`[useGrpcStream] Disconnecting from ${streamType}`);
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
      setStreamId(null);
      setStatus('disconnected');
    }
  }, [streamType]);

  /**
   * Clear data buffer
   */
  const clearData = useCallback(() => {
    setData([]);
    setLatestMessage(null);
    setMessageCount(0);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    mountedRef.current = true;

    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [streamType]); // Only re-run if streamType changes

  // Memoize return value
  const returnValue = useMemo(
    () => ({
      data,
      latestMessage,
      status,
      error,
      isConnected,
      isConnecting,
      connect,
      disconnect,
      clearData,
      streamId,
      messageCount,
    }),
    [
      data,
      latestMessage,
      status,
      error,
      isConnected,
      isConnecting,
      connect,
      disconnect,
      clearData,
      streamId,
      messageCount,
    ]
  );

  return returnValue;
}

// =============================================================================
// Specialized Hooks for Common Use Cases
// =============================================================================

/**
 * Hook specifically for transaction streaming
 *
 * @example
 * ```tsx
 * const { data, latestMessage, status } = useTransactionStream({
 *   maxItems: 50,
 *   onMessage: (tx) => console.log('New transaction:', tx.transactionHash),
 * });
 * ```
 */
export function useTransactionStream(
  options?: UseGrpcStreamOptions
): UseGrpcStreamReturn<TransactionEvent> {
  return useGrpcStream('transactions', options);
}

/**
 * Hook specifically for metrics streaming
 *
 * @example
 * ```tsx
 * const { latestMessage, status } = useMetricsStream();
 * const currentTps = latestMessage?.value;
 * ```
 */
export function useMetricsStream(options?: UseGrpcStreamOptions): UseGrpcStreamReturn<MetricEvent> {
  return useGrpcStream('metrics', options);
}

/**
 * Hook specifically for consensus streaming
 *
 * @example
 * ```tsx
 * const { latestMessage, status } = useConsensusStream();
 * const currentPhase = latestMessage?.phase;
 * ```
 */
export function useConsensusStream(
  options?: UseGrpcStreamOptions
): UseGrpcStreamReturn<ConsensusEvent> {
  return useGrpcStream('consensus', options);
}

/**
 * Hook specifically for validator streaming
 *
 * @example
 * ```tsx
 * const { data, status } = useValidatorStream();
 * const activeValidators = data.filter(v => v.status === 'ACTIVE');
 * ```
 */
export function useValidatorStream(
  options?: UseGrpcStreamOptions
): UseGrpcStreamReturn<ValidatorEvent> {
  return useGrpcStream('validators', options);
}

/**
 * Hook specifically for network topology streaming
 *
 * @example
 * ```tsx
 * const { latestMessage, status } = useNetworkStream();
 * const networkHealth = latestMessage?.networkHealth;
 * ```
 */
export function useNetworkStream(
  options?: UseGrpcStreamOptions
): UseGrpcStreamReturn<NetworkEvent> {
  return useGrpcStream('network', options);
}

// =============================================================================
// Multi-Stream Hook
// =============================================================================

/**
 * Options for multi-stream hook
 */
export interface UseMultiGrpcStreamOptions {
  autoConnect?: boolean;
  reconnect?: boolean;
  maxItems?: number;
}

/**
 * Return type for multi-stream hook
 */
export interface UseMultiGrpcStreamReturn {
  transactions: UseGrpcStreamReturn<TransactionEvent>;
  metrics: UseGrpcStreamReturn<MetricEvent>;
  consensus: UseGrpcStreamReturn<ConsensusEvent>;
  validators: UseGrpcStreamReturn<ValidatorEvent>;
  network: UseGrpcStreamReturn<NetworkEvent>;
  connectAll: () => void;
  disconnectAll: () => void;
  isAllConnected: boolean;
}

/**
 * Hook for managing multiple gRPC streams simultaneously
 *
 * @example
 * ```tsx
 * const {
 *   transactions,
 *   metrics,
 *   validators,
 *   connectAll,
 *   isAllConnected,
 * } = useMultiGrpcStream({ autoConnect: true });
 *
 * // Access individual stream data
 * console.log('Latest TX:', transactions.latestMessage);
 * console.log('Current TPS:', metrics.latestMessage?.value);
 * ```
 */
export function useMultiGrpcStream(
  options: UseMultiGrpcStreamOptions = {}
): UseMultiGrpcStreamReturn {
  const { autoConnect = true, reconnect = true, maxItems = 100 } = options;

  const streamOptions: UseGrpcStreamOptions = {
    autoConnect,
    reconnect,
    maxItems,
  };

  const transactions = useGrpcStream('transactions', streamOptions);
  const metrics = useGrpcStream('metrics', streamOptions);
  const consensus = useGrpcStream('consensus', streamOptions);
  const validators = useGrpcStream('validators', streamOptions);
  const network = useGrpcStream('network', streamOptions);

  const connectAll = useCallback(() => {
    transactions.connect();
    metrics.connect();
    consensus.connect();
    validators.connect();
    network.connect();
  }, [transactions, metrics, consensus, validators, network]);

  const disconnectAll = useCallback(() => {
    transactions.disconnect();
    metrics.disconnect();
    consensus.disconnect();
    validators.disconnect();
    network.disconnect();
  }, [transactions, metrics, consensus, validators, network]);

  const isAllConnected =
    transactions.isConnected &&
    metrics.isConnected &&
    consensus.isConnected &&
    validators.isConnected &&
    network.isConnected;

  return {
    transactions,
    metrics,
    consensus,
    validators,
    network,
    connectAll,
    disconnectAll,
    isAllConnected,
  };
}

// Default export
export default useGrpcStream;

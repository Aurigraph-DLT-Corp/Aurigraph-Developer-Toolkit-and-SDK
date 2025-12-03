/**
 * services.ts
 * gRPC-Web Service Client Wrappers for Aurigraph V12
 *
 * These service classes provide type-safe access to gRPC streaming services:
 * - MetricsStreamService
 * - ConsensusStreamService
 * - ValidatorStreamService
 * - NetworkStreamService
 * - ChannelStreamService
 * - AnalyticsStreamService
 */

import { grpcClient, GrpcWebClient, MessageHandler, ErrorHandler, StatusHandler, StreamOptions } from './GrpcWebClient'
import {
  PerformanceMetricsUpdate,
  AggregatedMetrics,
  MetricsSubscription,
  ConsensusEventStream,
  ConsensusStateUpdate,
  ConsensusSubscribeRequest,
  LeaderElectionEvent,
  BlockProposalEvent,
  CommitmentEvent,
  ValidatorActivityUpdate,
  ValidatorEventStream,
  ValidatorStatusUpdate,
  ValidatorSubscribeRequest,
  NetworkEventStream,
  NetworkTopologyUpdate,
  NetworkSubscribeRequest,
  Timestamp,
  timestampToUnixMs
} from './types'

// ============================================================================
// SERVICE NAMES
// ============================================================================

const SERVICES = {
  METRICS: 'io.aurigraph.v11.proto.MetricsStreamService',
  CONSENSUS: 'io.aurigraph.v11.proto.ConsensusStreamService',
  VALIDATOR: 'io.aurigraph.v11.proto.ValidatorStreamService',
  NETWORK: 'io.aurigraph.v11.proto.NetworkStreamService',
  CHANNEL: 'io.aurigraph.v11.proto.ChannelStreamService',
  ANALYTICS: 'io.aurigraph.v11.proto.AnalyticsStreamService'
} as const

// ============================================================================
// JSON DESERIALIZERS
// ============================================================================

// Note: In production with proper protobuf, these would use generated deserializers
// For now, we use JSON as intermediate format since Quarkus can serialize to JSON

function deserializeJson<T>(data: Uint8Array): T {
  const text = new TextDecoder().decode(data)
  return JSON.parse(text) as T
}

function createTimestamp(): Timestamp {
  const now = Date.now()
  return {
    seconds: Math.floor(now / 1000),
    nanos: (now % 1000) * 1000000
  }
}

// ============================================================================
// METRICS STREAM SERVICE
// ============================================================================

export class MetricsStreamClient {
  private client: GrpcWebClient

  constructor(client: GrpcWebClient = grpcClient) {
    this.client = client
  }

  /**
   * Get current metrics snapshot (one-shot)
   */
  async getCurrentMetrics(nodeIds: string[] = []): Promise<PerformanceMetricsUpdate> {
    return this.client.unary(
      SERVICES.METRICS,
      'GetCurrentMetrics',
      { nodeIds, metricTypes: [] },
      deserializeJson<PerformanceMetricsUpdate>
    )
  }

  /**
   * Get aggregated cluster metrics (one-shot)
   */
  async getAggregatedMetrics(aggregationType: string = 'cluster'): Promise<AggregatedMetrics> {
    return this.client.unary(
      SERVICES.METRICS,
      'GetAggregatedMetrics',
      { aggregationType, filterIds: [] },
      deserializeJson<AggregatedMetrics>
    )
  }

  /**
   * Stream real-time performance metrics
   */
  streamMetrics(
    subscription: Partial<MetricsSubscription>,
    onMessage: MessageHandler<PerformanceMetricsUpdate>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: MetricsSubscription = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      authToken: subscription.authToken,
      metricTypes: subscription.metricTypes || ['tps', 'latency', 'consensus', 'network'],
      nodeIds: subscription.nodeIds || [],
      channels: subscription.channels || [],
      updateIntervalMs: subscription.updateIntervalMs || 1000,
      includeTimeSeries: subscription.includeTimeSeries || false,
      timeSeriesWindowMinutes: subscription.timeSeriesWindowMinutes || 5
    }

    return this.client.serverStream(
      SERVICES.METRICS,
      'StreamMetrics',
      request,
      deserializeJson<PerformanceMetricsUpdate>,
      onMessage,
      onError,
      onStatus
    )
  }

  /**
   * Stream aggregated metrics for dashboard
   */
  streamAggregatedMetrics(
    subscription: Partial<MetricsSubscription>,
    onMessage: MessageHandler<AggregatedMetrics>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: MetricsSubscription = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      metricTypes: [],
      nodeIds: [],
      channels: [],
      updateIntervalMs: subscription.updateIntervalMs || 2000,
      includeTimeSeries: false,
      timeSeriesWindowMinutes: 0
    }

    return this.client.serverStream(
      SERVICES.METRICS,
      'StreamAggregatedMetrics',
      request,
      deserializeJson<AggregatedMetrics>,
      onMessage,
      onError,
      onStatus
    )
  }
}

// ============================================================================
// CONSENSUS STREAM SERVICE
// ============================================================================

export class ConsensusStreamClient {
  private client: GrpcWebClient

  constructor(client: GrpcWebClient = grpcClient) {
    this.client = client
  }

  /**
   * Get current consensus state (one-shot)
   */
  async getCurrentState(): Promise<ConsensusStateUpdate> {
    return this.client.unary(
      SERVICES.CONSENSUS,
      'GetCurrentState',
      { clientId: `client-${Date.now()}` },
      deserializeJson<ConsensusStateUpdate>
    )
  }

  /**
   * Stream all consensus events
   */
  streamConsensusEvents(
    subscription: Partial<ConsensusSubscribeRequest>,
    onMessage: MessageHandler<ConsensusEventStream>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: ConsensusSubscribeRequest = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      sessionToken: subscription.sessionToken,
      eventTypes: subscription.eventTypes || ['state_changes', 'leader_election', 'proposals', 'commitments'],
      updateIntervalMs: subscription.updateIntervalMs || 500,
      filterValidatorIds: subscription.filterValidatorIds || [],
      includeHistorical: subscription.includeHistorical || false,
      historicalMinutes: subscription.historicalMinutes || 0,
      bufferSize: subscription.bufferSize || 50,
      compressUpdates: subscription.compressUpdates || false
    }

    return this.client.serverStream(
      SERVICES.CONSENSUS,
      'StreamConsensusEvents',
      request,
      deserializeJson<ConsensusEventStream>,
      onMessage,
      onError,
      onStatus
    )
  }

  /**
   * Stream leader election events only
   */
  streamLeaderElections(
    subscription: Partial<ConsensusSubscribeRequest>,
    onMessage: MessageHandler<LeaderElectionEvent>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: ConsensusSubscribeRequest = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      eventTypes: ['leader_election'],
      updateIntervalMs: subscription.updateIntervalMs || 500,
      filterValidatorIds: [],
      includeHistorical: false,
      historicalMinutes: 0,
      bufferSize: 50,
      compressUpdates: false
    }

    return this.client.serverStream(
      SERVICES.CONSENSUS,
      'StreamLeaderElections',
      request,
      deserializeJson<LeaderElectionEvent>,
      onMessage,
      onError,
      onStatus
    )
  }

  /**
   * Stream block proposals
   */
  streamBlockProposals(
    subscription: Partial<ConsensusSubscribeRequest>,
    onMessage: MessageHandler<BlockProposalEvent>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: ConsensusSubscribeRequest = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      eventTypes: ['proposals'],
      updateIntervalMs: subscription.updateIntervalMs || 500,
      filterValidatorIds: [],
      includeHistorical: false,
      historicalMinutes: 0,
      bufferSize: 50,
      compressUpdates: false
    }

    return this.client.serverStream(
      SERVICES.CONSENSUS,
      'StreamBlockProposals',
      request,
      deserializeJson<BlockProposalEvent>,
      onMessage,
      onError,
      onStatus
    )
  }

  /**
   * Stream commitment events
   */
  streamCommitments(
    subscription: Partial<ConsensusSubscribeRequest>,
    onMessage: MessageHandler<CommitmentEvent>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: ConsensusSubscribeRequest = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      eventTypes: ['commitments'],
      updateIntervalMs: subscription.updateIntervalMs || 500,
      filterValidatorIds: [],
      includeHistorical: false,
      historicalMinutes: 0,
      bufferSize: 50,
      compressUpdates: false
    }

    return this.client.serverStream(
      SERVICES.CONSENSUS,
      'StreamCommitments',
      request,
      deserializeJson<CommitmentEvent>,
      onMessage,
      onError,
      onStatus
    )
  }

  /**
   * Stream validator activity
   */
  streamValidatorActivity(
    subscription: Partial<ConsensusSubscribeRequest>,
    onMessage: MessageHandler<ValidatorActivityUpdate>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: ConsensusSubscribeRequest = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      eventTypes: ['validators'],
      updateIntervalMs: subscription.updateIntervalMs || 2000,
      filterValidatorIds: subscription.filterValidatorIds || [],
      includeHistorical: false,
      historicalMinutes: 0,
      bufferSize: 50,
      compressUpdates: false
    }

    return this.client.serverStream(
      SERVICES.CONSENSUS,
      'StreamValidatorActivity',
      request,
      deserializeJson<ValidatorActivityUpdate>,
      onMessage,
      onError,
      onStatus
    )
  }
}

// ============================================================================
// VALIDATOR STREAM SERVICE
// ============================================================================

export class ValidatorStreamClient {
  private client: GrpcWebClient

  constructor(client: GrpcWebClient = grpcClient) {
    this.client = client
  }

  /**
   * Get validator status (one-shot)
   */
  async getValidatorStatus(validatorIds: string[] = []): Promise<ValidatorStatusUpdate> {
    return this.client.unary(
      SERVICES.VALIDATOR,
      'GetValidatorStatus',
      { clientId: `client-${Date.now()}`, validatorIds },
      deserializeJson<ValidatorStatusUpdate>
    )
  }

  /**
   * Stream all validator events
   */
  streamValidatorEvents(
    subscription: Partial<ValidatorSubscribeRequest>,
    onMessage: MessageHandler<ValidatorEventStream>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: ValidatorSubscribeRequest = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      sessionToken: subscription.sessionToken,
      validatorIds: subscription.validatorIds || [],
      eventTypes: subscription.eventTypes || ['status', 'health', 'performance', 'reputation'],
      updateIntervalMs: subscription.updateIntervalMs || 2000,
      includePerformanceMetrics: subscription.includePerformanceMetrics ?? true,
      includeHealthMetrics: subscription.includeHealthMetrics ?? true
    }

    return this.client.serverStream(
      SERVICES.VALIDATOR,
      'StreamValidatorEvents',
      request,
      deserializeJson<ValidatorEventStream>,
      onMessage,
      onError,
      onStatus
    )
  }

  /**
   * Stream validator status updates
   */
  streamValidatorStatus(
    subscription: Partial<ValidatorSubscribeRequest>,
    onMessage: MessageHandler<ValidatorStatusUpdate>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: ValidatorSubscribeRequest = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      validatorIds: subscription.validatorIds || [],
      eventTypes: ['status'],
      updateIntervalMs: subscription.updateIntervalMs || 2000,
      includePerformanceMetrics: true,
      includeHealthMetrics: true
    }

    return this.client.serverStream(
      SERVICES.VALIDATOR,
      'StreamValidatorStatus',
      request,
      deserializeJson<ValidatorStatusUpdate>,
      onMessage,
      onError,
      onStatus
    )
  }
}

// ============================================================================
// NETWORK STREAM SERVICE
// ============================================================================

export class NetworkStreamClient {
  private client: GrpcWebClient

  constructor(client: GrpcWebClient = grpcClient) {
    this.client = client
  }

  /**
   * Get network topology (one-shot)
   */
  async getNetworkTopology(): Promise<NetworkTopologyUpdate> {
    return this.client.unary(
      SERVICES.NETWORK,
      'GetNetworkTopology',
      { clientId: `client-${Date.now()}` },
      deserializeJson<NetworkTopologyUpdate>
    )
  }

  /**
   * Stream all network events
   */
  streamNetworkEvents(
    subscription: Partial<NetworkSubscribeRequest>,
    onMessage: MessageHandler<NetworkEventStream>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: NetworkSubscribeRequest = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      sessionToken: subscription.sessionToken,
      eventTypes: subscription.eventTypes || ['topology', 'peer_connected', 'peer_disconnected', 'latency', 'health'],
      updateIntervalMs: subscription.updateIntervalMs || 3000,
      filterPeerIds: subscription.filterPeerIds || [],
      includeTopology: subscription.includeTopology ?? true
    }

    return this.client.serverStream(
      SERVICES.NETWORK,
      'StreamNetworkEvents',
      request,
      deserializeJson<NetworkEventStream>,
      onMessage,
      onError,
      onStatus
    )
  }

  /**
   * Stream network topology updates
   */
  streamTopologyUpdates(
    subscription: Partial<NetworkSubscribeRequest>,
    onMessage: MessageHandler<NetworkTopologyUpdate>,
    onError: ErrorHandler,
    onStatus: StatusHandler
  ): () => void {
    const request: NetworkSubscribeRequest = {
      clientId: subscription.clientId || `client-${Date.now()}`,
      eventTypes: ['topology'],
      updateIntervalMs: subscription.updateIntervalMs || 5000,
      filterPeerIds: [],
      includeTopology: true
    }

    return this.client.serverStream(
      SERVICES.NETWORK,
      'StreamTopologyUpdates',
      request,
      deserializeJson<NetworkTopologyUpdate>,
      onMessage,
      onError,
      onStatus
    )
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

export const metricsStreamClient = new MetricsStreamClient()
export const consensusStreamClient = new ConsensusStreamClient()
export const validatorStreamClient = new ValidatorStreamClient()
export const networkStreamClient = new NetworkStreamClient()

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export {
  SERVICES,
  deserializeJson
}

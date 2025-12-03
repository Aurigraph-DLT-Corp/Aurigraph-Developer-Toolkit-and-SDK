/**
 * types.ts
 * TypeScript types generated from Aurigraph V12 Protocol Buffer definitions
 *
 * These types mirror the proto definitions in:
 * - metrics-stream.proto
 * - consensus-stream.proto
 * - network-stream.proto
 * - validator-stream.proto
 * - channel-stream.proto
 * - analytics-stream.proto
 *
 * Note: In production, these would be auto-generated using protoc + ts-proto
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface Timestamp {
  seconds: number
  nanos: number
}

// ============================================================================
// METRICS STREAM TYPES
// ============================================================================

export interface PerformanceMetricsUpdate {
  timestamp: Timestamp
  nodeId: string
  transactions: TransactionMetrics
  consensus: ConsensusPerformance
  network: NetworkMetrics
  system: SystemMetrics
  storage: StorageMetrics
  aiMetrics: AIMetrics
}

export interface TransactionMetrics {
  tps: TPSMetrics
  latency: LatencyMetrics
  queue: QueueMetrics
  successRate: number
  failureRate: number
  rejectedCount: number
  gas: GasMetrics
}

export interface TPSMetrics {
  current: number
  avg1m: number
  avg5m: number
  avg1h: number
  peak1m: number
  peak1h: number
  peak24h: number
  trendPercent: number
  targetTps: number
  achievementPercent: number
}

export interface LatencyMetrics {
  avg: number
  min: number
  max: number
  p50: number
  p95: number
  p99: number
  p999: number
  finalityAvgMs: number
  finalityP99Ms: number
  validationMs: number
  consensusMs: number
  executionMs: number
  commitMs: number
}

export interface QueueMetrics {
  pending: number
  processing: number
  completed: number
  failed: number
  avgWaitTimeMs: number
  maxWaitTimeMs: number
  queueCapacity: number
  utilizationPercent: number
}

export interface GasMetrics {
  avgGasPrice: number
  minGasPrice: number
  maxGasPrice: number
  totalGasUsed: number
  gasLimitPerBlock: number
  gasUtilizationPercent: number
}

export interface ConsensusPerformance {
  leaderNodeId: string
  term: number
  commitIndex: number
  lastApplied: number
  avgBlockTimeMs: number
  blocksProduced1m: number
  blocksProduced1h: number
  avgVotingTimeMs: number
  successfulVotes: number
  failedVotes: number
  voteSuccessRate: number
  leaderChangesLastHour: number
  lastElection: Timestamp
  leadershipStabilityScore: number
  consensusOverheadPercent: number
  pendingProposals: number
}

export interface NetworkMetrics {
  connectedPeers: number
  maxPeers: number
  peerUtilizationPercent: number
  bytesSentPerSec: number
  bytesReceivedPerSec: number
  messagesSentPerSec: number
  messagesReceivedPerSec: number
  avgPeerLatencyMs: number
  p95PeerLatencyMs: number
  droppedConnections1m: number
  connectionSuccessRate: number
  bandwidthUtilizationPercent: number
  bandwidthLimitMbps: number
}

export interface SystemMetrics {
  cpuUsagePercent: number
  memoryUsagePercent: number
  memoryUsedBytes: number
  memoryTotalBytes: number
  diskUsagePercent: number
  diskReadBytesPerSec: number
  diskWriteBytesPerSec: number
  networkInBytesPerSec: number
  networkOutBytesPerSec: number
  openFileDescriptors: number
  maxFileDescriptors: number
  goroutines: number
  gcPauseMs: number
}

export interface StorageMetrics {
  blockchainSizeBytes: number
  stateDbSizeBytes: number
  rocksdbSizeBytes: number
  diskReadsPerSec: number
  diskWritesPerSec: number
  diskReadLatencyMs: number
  diskWriteLatencyMs: number
  blockCacheHitRate: number
  stateCacheHitRate: number
  cacheSizeBytes: number
  pendingCompactions: number
  compactionCpuPercent: number
}

export interface AIMetrics {
  aiEnabled: boolean
  modelVersion: string
  aiTpsImprovementPercent: number
  aiLatencyReductionPercent: number
  modelAccuracy: number
  modelLatencyMs: number
  predictionsPerSec: number
  optimizationsApplied1m: number
  successfulOptimizations: number
  failedOptimizations: number
  optimizationSuccessRate: number
  aiCpuUsagePercent: number
  aiMemoryBytes: number
}

export interface AggregatedMetrics {
  timestamp: Timestamp
  aggregationType: string
  cluster: ClusterMetrics
  channels: ChannelMetrics[]
  nodeTypes: Record<string, NodeTypeMetrics>
}

export interface ClusterMetrics {
  totalNodes: number
  activeNodes: number
  totalTps: number
  avgTpsPerNode: number
  clusterHealthScore: number
  avgCpuUsage: number
  avgMemoryUsage: number
}

export interface ChannelMetrics {
  channelId: string
  channelName: string
  tps: number
  activeNodes: number
  avgLatencyMs: number
  healthScore: number
}

export interface NodeTypeMetrics {
  nodeType: string
  count: number
  avgTps: number
  avgLatencyMs: number
  avgCpuPercent: number
  avgMemoryPercent: number
}

// ============================================================================
// CONSENSUS STREAM TYPES
// ============================================================================

export type ConsensusRole = 'LEADER' | 'CANDIDATE' | 'FOLLOWER' | 'OBSERVER'
export type ConsensusPhase = 'PROPOSAL' | 'VOTING' | 'COMMITMENT' | 'FINALIZATION'
export type ConsensusHealth = 'OPTIMAL' | 'DEGRADED' | 'CRITICAL'

export interface ConsensusState {
  currentRole: ConsensusRole
  currentPhase: ConsensusPhase
  currentTerm: number
  currentLeader: string
  activeValidators: number
  totalValidators: number
  lastBlockTime: Timestamp
  averageBlockTimeMs: number
  consensusHealth: ConsensusHealth
}

export interface ConsensusStateUpdate {
  timestamp: Timestamp
  currentState: ConsensusState
  metrics: ConsensusMetrics
  stateChange: ConsensusStateChange | null
  changeReason: string
}

export interface ConsensusMetrics {
  blocksPerSecond: number
  votingLatencyMs: number
  commitLatencyMs: number
  consensusRoundDurationMs: number
}

export interface ConsensusStateChange {
  changeType: 'ROLE_CHANGE' | 'PHASE_CHANGE' | 'LEADER_CHANGE' | 'TERM_CHANGE' | 'VALIDATOR_CHANGE'
  oldValue: string
  newValue: string
  occurredAt: Timestamp
}

export interface LeaderElectionEvent {
  electionId: string
  electionTerm: number
  phase: 'INITIATED' | 'VOTING' | 'DECIDED' | 'FAILED'
  candidateId: string
  votesReceived: number
  votesRequired: number
  votes: ElectionVote[]
  startedAt: Timestamp
  endedAt: Timestamp | null
  durationMs: number
  electedLeaderId: string | null
  electionSuccessful: boolean
  failureReason: string | null
}

export interface ElectionVote {
  voterId: string
  candidateId: string
  voteGranted: boolean
  votedAt: Timestamp
}

export interface BlockProposalEvent {
  proposalId: string
  proposal: BlockProposal
  status: 'PROPOSED' | 'VOTING_IN_PROGRESS' | 'ACCEPTED' | 'REJECTED' | 'TIMEOUT'
  votesFor: number
  votesAgainst: number
  votesPending: number
  recentVotes: Vote[]
  proposedAt: Timestamp
  proposalDurationMs: number
  timeoutSeconds: number
}

export interface BlockProposal {
  blockHash: string
  blockHeight: number
  proposerId: string
  parentHash: string
  transactionCount: number
  timestamp: Timestamp
}

export interface Vote {
  voterId: string
  blockHash: string
  voteType: 'FOR' | 'AGAINST' | 'ABSTAIN'
  signature: string
  votedAt: Timestamp
}

export interface CommitmentEvent {
  blockHash: string
  block: Block | null
  phase: 'INITIATED' | 'SIGNATURES_COLLECTED' | 'COMMITTED' | 'FINALIZED' | 'FAILED'
  signaturesCollected: number
  signaturesRequired: number
  validatorSignatures: string[]
  commitStarted: Timestamp
  commitCompleted: Timestamp | null
  commitDurationMs: number
  commitSuccessful: boolean
  finalizedHeight: number
  failureReason: string | null
}

export interface Block {
  hash: string
  height: number
  parentHash: string
  timestamp: Timestamp
  proposer: string
  transactionCount: number
  size: number
}

export interface ConsensusEventStream {
  timestamp: Timestamp
  eventId: string
  stateUpdate?: ConsensusStateUpdate
  leaderElection?: LeaderElectionEvent
  blockProposal?: BlockProposalEvent
  votingUpdate?: VotingUpdate
  commitment?: CommitmentEvent
  heartbeat?: HeartbeatStream
  validatorActivity?: ValidatorActivityUpdate
  validatorSet?: ValidatorSetUpdate
  performance?: ConsensusPerformanceUpdate
}

export interface VotingUpdate {
  blockHash: string
  vote: Vote
  totalVotes: number
  votesRequired: number
  votePercentage: number
  consensusReached: boolean
  consensusFailed: boolean
  timestamp: Timestamp
}

export interface HeartbeatStream {
  leaderId: string
  currentTerm: number
  heartbeatSequence: number
  followerResponses: HeartbeatResponse[]
  responsiveFollowers: number
  totalFollowers: number
  averageResponseTimeMs: number
  missedHeartbeats: number
  unresponsiveNodes: string[]
  timestamp: Timestamp
}

export interface HeartbeatResponse {
  followerId: string
  responseTimeMs: number
  success: boolean
}

export interface ValidatorActivityUpdate {
  validatorId: string
  activityType: 'JOINED' | 'LEFT' | 'BECAME_ACTIVE' | 'BECAME_INACTIVE' | 'ROLE_CHANGED' | 'REPUTATION_CHANGED'
  validatorInfo: ValidatorInfo
  oldRole: string
  newRole: string
  oldReputation: number
  newReputation: number
  reason: string
  timestamp: Timestamp
}

export interface ValidatorSetUpdate {
  totalValidators: number
  activeValidators: number
  inactiveValidators: number
  validatorList: ValidatorInfo[]
  recentAdditions: string[]
  recentRemovals: string[]
  timestamp: Timestamp
}

export interface ConsensusPerformanceUpdate {
  currentBlocksPerSecond: number
  averageBlockTimeMs: number
  blocksCommittedLastMinute: number
  consensusLatencyMs: number
  proposalToCommitLatencyMs: number
  voteCollectionLatencyMs: number
  consensusSuccessRate: number
  voteSuccessRate: number
  failedProposalsLastHour: number
  networkHealthPercent: number
  byzantineFaultsDetected: number
  timestamp: Timestamp
}

// ============================================================================
// VALIDATOR STREAM TYPES
// ============================================================================

export type ValidatorStatus = 'ACTIVE' | 'INACTIVE' | 'JAILED' | 'UNBONDING'
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'OFFLINE' | 'SYNCING'

export interface ValidatorInfo {
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
  lastUpdate: Timestamp
}

export interface ValidatorStatusUpdate {
  validator: ValidatorInfo
  health: ValidatorHealthMetrics
  performance: ValidatorPerformanceMetrics
  reputation: ValidatorReputationInfo
  timestamp: Timestamp
}

export interface ValidatorHealthMetrics {
  status: HealthStatus
  healthScore: number
  systemMetrics: SystemMetrics
  networkLatencyMs: number
  peerConnections: number
  networkBandwidthMbps: number
  currentBlockHeight: number
  networkBlockHeight: number
  blocksBehind: number
  isSynced: boolean
  uptimePercent: number
  lastHeartbeat: Timestamp
  missedHeartbeatsLastHour: number
  issues: HealthIssue[]
  warnings: string[]
}

export interface HealthIssue {
  issueId: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  description: string
  resolution: string
  detectedAt: Timestamp
  resolved: boolean
}

export interface ValidatorPerformanceMetrics {
  blocksProposed: number
  blocksAccepted: number
  blocksRejected: number
  blockAcceptanceRate: number
  averageBlockProposalTimeMs: number
  votesCast: number
  votesOnTime: number
  votesLate: number
  votesMissed: number
  votingParticipationRate: number
  transactionsProcessed: number
  transactionsValidated: number
  transactionsRejected: number
  transactionValidationRate: number
  averageTransactionProcessingTimeMs: number
  consensusRoundsParticipated: number
  consensusRoundsMissed: number
  consensusParticipationRate: number
  overallPerformanceScore: number
  responsivenessScore: number
  reliabilityScore: number
  measurementPeriodStart: Timestamp
  measurementPeriodEnd: Timestamp
}

export interface ValidatorReputationInfo {
  currentReputation: number
  reputationChange24h: number
  reputationRank: number
  uptimeFactor: number
  performanceFactor: number
  reliabilityFactor: number
  communityFactor: number
  history: ReputationHistoryPoint[]
}

export interface ReputationHistoryPoint {
  timestamp: Timestamp
  reputationScore: number
  changeReason: string
}

export interface ValidatorEventStream {
  timestamp: Timestamp
  eventId: string
  statusUpdate?: ValidatorStatusUpdate
  healthUpdate?: ValidatorHealthMetrics
  performanceUpdate?: ValidatorPerformanceMetrics
  reputationUpdate?: ValidatorReputationInfo
  activityEvent?: ValidatorActivityUpdate
}

// ============================================================================
// NETWORK STREAM TYPES
// ============================================================================

export type ConnectionQuality = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
export type NetworkHealth = 'HEALTHY' | 'DEGRADED' | 'CRITICAL'

export interface PeerNode {
  id: string
  address: string
  location: PeerLocation | null
  latency: number
  status: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING'
  version: string
  uptime: number
  lastSeen: Timestamp
  inboundBytes: number
  outboundBytes: number
  connectionQuality: ConnectionQuality
}

export interface PeerLocation {
  country: string
  city: string
  latitude: number
  longitude: number
}

export interface NetworkTopologyUpdate {
  timestamp: Timestamp
  totalPeers: number
  connectedPeers: number
  disconnectedPeers: number
  averageLatency: number
  totalInbound: number
  totalOutbound: number
  networkHealth: NetworkHealth
  peers: PeerNode[]
}

export interface NetworkEventStream {
  timestamp: Timestamp
  eventId: string
  topologyUpdate?: NetworkTopologyUpdate
  nodeEvent?: NodeStatusChangeEvent
  peerConnected?: PeerConnectedEvent
  peerDisconnected?: PeerDisconnectedEvent
  latencyUpdate?: LatencyUpdateEvent
  performanceUpdate?: NetworkPerformanceUpdate
  healthUpdate?: NetworkHealthUpdate
}

export interface NodeStatusChangeEvent {
  nodeId: string
  oldStatus: string
  newStatus: string
  reason: string
  timestamp: Timestamp
}

export interface PeerConnectedEvent {
  peerId: string
  peerAddress: string
  connectionTime: Timestamp
  initialLatency: number
}

export interface PeerDisconnectedEvent {
  peerId: string
  disconnectTime: Timestamp
  reason: string
  connectionDuration: number
}

export interface LatencyUpdateEvent {
  peerId: string
  oldLatency: number
  newLatency: number
  changePercent: number
}

export interface NetworkPerformanceUpdate {
  timestamp: Timestamp
  throughputBytesPerSec: number
  messagesPerSec: number
  averageLatencyMs: number
  p99LatencyMs: number
  packetLossPercent: number
  bandwidthUtilization: number
}

export interface NetworkHealthUpdate {
  timestamp: Timestamp
  overallHealth: NetworkHealth
  connectedPeersPercent: number
  averageLatencyMs: number
  packetLossPercent: number
  issues: string[]
}

// ============================================================================
// SUBSCRIPTION & CONTROL TYPES
// ============================================================================

export interface MetricsSubscription {
  clientId: string
  authToken?: string
  metricTypes: string[]
  nodeIds: string[]
  channels: string[]
  updateIntervalMs: number
  includeTimeSeries: boolean
  timeSeriesWindowMinutes: number
}

export interface ConsensusSubscribeRequest {
  clientId: string
  sessionToken?: string
  eventTypes: string[]
  updateIntervalMs: number
  filterValidatorIds: string[]
  includeHistorical: boolean
  historicalMinutes: number
  bufferSize: number
  compressUpdates: boolean
}

export interface ValidatorSubscribeRequest {
  clientId: string
  sessionToken?: string
  validatorIds: string[]
  eventTypes: string[]
  updateIntervalMs: number
  includePerformanceMetrics: boolean
  includeHealthMetrics: boolean
}

export interface NetworkSubscribeRequest {
  clientId: string
  sessionToken?: string
  eventTypes: string[]
  updateIntervalMs: number
  filterPeerIds: string[]
  includeTopology: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function timestampToDate(ts: Timestamp | null | undefined): Date {
  if (!ts) return new Date()
  return new Date(ts.seconds * 1000 + ts.nanos / 1000000)
}

export function dateToTimestamp(date: Date): Timestamp {
  const ms = date.getTime()
  return {
    seconds: Math.floor(ms / 1000),
    nanos: (ms % 1000) * 1000000
  }
}

export function timestampToUnixMs(ts: Timestamp | null | undefined): number {
  if (!ts) return Date.now()
  return ts.seconds * 1000 + Math.floor(ts.nanos / 1000000)
}

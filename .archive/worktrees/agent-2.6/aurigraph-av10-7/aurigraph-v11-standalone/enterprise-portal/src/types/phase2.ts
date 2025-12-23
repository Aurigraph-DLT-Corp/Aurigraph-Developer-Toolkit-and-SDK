/**
 * Phase 2 Component Type Definitions
 * Enterprise Portal - Advanced Blockchain Features
 * AV11-281 through AV11-290
 */

// ============================================================================
// Transaction Details Types (AV11-281)
// ============================================================================

export interface TransactionDetails {
  hash: string
  from: string
  to: string
  value: string
  gasUsed: number
  gasPrice: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce: number
  blockNumber: number
  blockHash: string
  transactionIndex: number
  timestamp: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  confirmations: number
  input: string
  decodedInput?: {
    methodName: string
    params: Array<{
      name: string
      type: string
      value: any
    }>
  }
  logs: Array<{
    address: string
    topics: string[]
    data: string
    logIndex: number
  }>
  internalTransactions?: Array<{
    from: string
    to: string
    value: string
    type: string
  }>
}

export interface TransactionReceipt {
  transactionHash: string
  status: number
  gasUsed: number
  cumulativeGasUsed: number
  effectiveGasPrice: string
  logs: any[]
  logsBloom: string
  type: string
}

// ============================================================================
// Smart Contract Types (AV11-282, AV11-283)
// ============================================================================

export interface SmartContract {
  address: string
  name: string
  symbol?: string
  type: 'ERC20' | 'ERC721' | 'ERC1155' | 'CUSTOM' | 'SYSTEM'
  balance: string
  transactionCount: number
  createdAt: string
  creator: string
  deploymentBlock: number
  deploymentTxHash: string
  isVerified: boolean
  verificationStatus: 'verified' | 'unverified' | 'pending'
  sourceCode?: string
  abi?: any[]
  compiler?: {
    version: string
    optimizationEnabled: boolean
    runs: number
  }
  contractSize: number
  bytecode?: string
  metadata?: Record<string, any>
}

export interface ContractMethod {
  name: string
  type: 'function' | 'constructor' | 'receive' | 'fallback'
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable'
  inputs: Array<{
    name: string
    type: string
    indexed?: boolean
  }>
  outputs: Array<{
    name: string
    type: string
  }>
}

export interface ContractEvent {
  name: string
  type: 'event'
  inputs: Array<{
    name: string
    type: string
    indexed: boolean
  }>
  anonymous: boolean
}

export interface ContractInteraction {
  method: string
  params: any[]
  result?: any
  error?: string
}

// ============================================================================
// Gas Fee Types (AV11-284)
// ============================================================================

export interface GasFeeData {
  timestamp: string
  baseFee: number
  priorityFee: number
  gasPrice: number
  fast: number
  standard: number
  slow: number
}

export interface GasFeeHistory {
  timestamps: string[]
  baseFees: number[]
  priorityFees: number[]
  gasPrices: number[]
}

export interface GasFeeEstimate {
  transactionType: 'transfer' | 'contract_call' | 'contract_deploy' | 'swap'
  estimatedGas: number
  gasPrice: GasFeeData
  totalCost: {
    slow: string
    standard: string
    fast: string
  }
  fiatValue: {
    slow: string
    standard: string
    fast: string
  }
  estimatedTime: {
    slow: string
    standard: string
    fast: string
  }
}

export interface GasTrend {
  period: '1h' | '24h' | '7d' | '30d'
  average: number
  median: number
  min: number
  max: number
  trend: 'increasing' | 'decreasing' | 'stable'
  percentageChange: number
}

// ============================================================================
// Governance Types (AV11-285, AV11-286)
// ============================================================================

export interface GovernanceProposal {
  id: string
  title: string
  description: string
  proposer: string
  proposerName?: string
  type: 'parameter_change' | 'upgrade' | 'grant' | 'text' | 'emergency'
  status: 'active' | 'passed' | 'rejected' | 'expired' | 'executed'
  votingStartTime: string
  votingEndTime: string
  executionTime?: string
  totalVotingPower: number
  currentResults: {
    yes: number
    no: number
    abstain: number
    noWithVeto: number
  }
  quorum: number
  threshold: number
  vetoThreshold: number
  metadata?: {
    category: string
    tags: string[]
    discussionUrl?: string
  }
}

export interface ProposalVote {
  proposalId: string
  voter: string
  voterName?: string
  vote: 'yes' | 'no' | 'abstain' | 'no_with_veto'
  votingPower: number
  timestamp: string
  txHash: string
  reason?: string
}

export interface VotingStats {
  totalProposals: number
  activeProposals: number
  passedProposals: number
  rejectedProposals: number
  totalVoters: number
  averageTurnout: number
  recentVotes: ProposalVote[]
}

// ============================================================================
// Staking Types (AV11-287, AV11-288, AV11-289, AV11-290)
// ============================================================================

export interface StakingInfo {
  totalStaked: string
  totalStakers: number
  averageAPY: number
  minStakeAmount: string
  unbondingPeriod: number
  rewardRate: number
  validators: StakingValidator[]
  userStaking?: UserStakingInfo
}

export interface StakingValidator {
  address: string
  name: string
  status: 'active' | 'inactive' | 'jailed'
  commission: number
  stake: string
  delegators: number
  apy: number
  uptime: number
  performance: number
  rank: number
  votingPower: number
  maxCapacity: string
  isFull: boolean
}

export interface UserStakingInfo {
  totalStaked: string
  totalRewards: string
  activeStakes: Stake[]
  pendingUnstakes: Unstake[]
  claimableRewards: string
  estimatedYearlyReward: string
}

export interface Stake {
  validator: string
  validatorName: string
  amount: string
  shares: string
  stakedAt: string
  rewards: string
  apy: number
}

export interface Unstake {
  validator: string
  validatorName: string
  amount: string
  initiatedAt: string
  completionTime: string
  status: 'pending' | 'completed'
}

export interface StakingReward {
  timestamp: string
  validator: string
  validatorName: string
  amount: string
  type: 'block_reward' | 'transaction_fee' | 'inflation'
  claimed: boolean
  txHash?: string
}

export interface StakingTransaction {
  id: string
  type: 'stake' | 'unstake' | 'claim_rewards' | 'redelegate'
  validator: string
  validatorName: string
  amount: string
  timestamp: string
  txHash: string
  status: 'completed' | 'pending' | 'failed'
  fee: string
}

export interface StakingDelegation {
  delegator: string
  validator: string
  validatorName: string
  shares: string
  balance: string
  rewards: string
}

export interface ValidatorCommission {
  rate: number
  maxRate: number
  maxChangeRate: number
  updateTime: string
}

export interface ValidatorDescription {
  moniker: string
  identity: string
  website: string
  securityContact: string
  details: string
}

// ============================================================================
// Ricardian Contract Types
// ============================================================================

export interface RicardianContract {
  id: string
  name: string
  hash: string
  contractAddress: string
  templateId: string
  parties: Array<{
    role: string
    address: string
    name?: string
  }>
  terms: string
  metadata: {
    jurisdiction: string
    governingLaw: string
    disputeResolution: string
  }
  status: 'draft' | 'active' | 'executed' | 'terminated'
  createdAt: string
  signedAt?: string
  executedAt?: string
  signatures: Array<{
    party: string
    signature: string
    timestamp: string
  }>
}

// ============================================================================
// Common Response Types
// ============================================================================

export interface Phase2ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface Phase2PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageSize: number
  currentPage: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export interface TimeSeriesPoint {
  timestamp: string
  value: number
  metadata?: Record<string, any>
}

export interface ChartDataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string
  fill?: boolean
  tension?: number
}

export interface ChartConfiguration {
  labels: string[]
  datasets: ChartDataset[]
}

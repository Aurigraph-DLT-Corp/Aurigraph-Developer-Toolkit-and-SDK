/**
 * Phase 2 API Service
 * Backend Integration for Advanced Blockchain Features
 * AV11-281 through AV11-290
 */

import axios from 'axios'
import type {
  TransactionDetails,
  TransactionReceipt,
  SmartContract,
  ContractMethod,
  ContractInteraction,
  GasFeeData,
  GasFeeHistory,
  GasFeeEstimate,
  GasTrend,
  GovernanceProposal,
  ProposalVote,
  VotingStats,
  StakingInfo,
  StakingValidator,
  UserStakingInfo,
  StakingReward,
  StakingTransaction,
  RicardianContract,
  Phase2ApiResponse,
  Phase2PaginatedResponse,
} from '../types/phase2'

const API_BASE_URL = (import.meta as any).env?.PROD
  ? 'https://dlt.aurigraph.io/api/v11'
  : 'http://localhost:9003/api/v11'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ============================================================================
// Transaction Details API (AV11-281)
// ============================================================================

export const transactionApi = {
  /**
   * Get transaction details by hash
   * Endpoint: GET /api/v11/blockchain/transactions/{hash}
   */
  async getTransaction(hash: string): Promise<TransactionDetails> {
    const response = await apiClient.get<Phase2ApiResponse<TransactionDetails>>(
      `/blockchain/transactions/${hash}`
    )
    return response.data.data
  },

  /**
   * Get transaction receipt
   * Endpoint: GET /api/v11/blockchain/transactions/{hash}/receipt
   */
  async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    const response = await apiClient.get<Phase2ApiResponse<TransactionReceipt>>(
      `/blockchain/transactions/${hash}/receipt`
    )
    return response.data.data
  },

  /**
   * Get pending transactions
   * Endpoint: GET /api/v11/blockchain/transactions/pending
   */
  async getPendingTransactions(limit: number = 50): Promise<TransactionDetails[]> {
    const response = await apiClient.get<Phase2ApiResponse<TransactionDetails[]>>(
      '/blockchain/transactions/pending',
      { params: { limit } }
    )
    return response.data.data
  },

  /**
   * Get transactions by address
   * Endpoint: GET /api/v11/blockchain/transactions/address/{address}
   */
  async getTransactionsByAddress(
    address: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<Phase2PaginatedResponse<TransactionDetails>> {
    const response = await apiClient.get<Phase2ApiResponse<Phase2PaginatedResponse<TransactionDetails>>>(
      `/blockchain/transactions/address/${address}`,
      { params: { page, pageSize } }
    )
    return response.data.data
  },
}

// ============================================================================
// Smart Contract API (AV11-282, AV11-283)
// ============================================================================

export const contractApi = {
  /**
   * List all smart contracts
   * Endpoint: GET /api/v11/contracts/list
   */
  async getContracts(
    page: number = 1,
    pageSize: number = 20,
    type?: string
  ): Promise<Phase2PaginatedResponse<SmartContract>> {
    const response = await apiClient.get<Phase2ApiResponse<Phase2PaginatedResponse<SmartContract>>>(
      '/contracts/list',
      { params: { page, pageSize, type } }
    )
    return response.data.data
  },

  /**
   * Get contract details
   * Endpoint: GET /api/v11/contracts/{address}
   */
  async getContract(address: string): Promise<SmartContract> {
    const response = await apiClient.get<Phase2ApiResponse<SmartContract>>(
      `/contracts/${address}`
    )
    return response.data.data
  },

  /**
   * Get contract methods
   * Endpoint: GET /api/v11/contracts/{address}/methods
   */
  async getContractMethods(address: string): Promise<ContractMethod[]> {
    const response = await apiClient.get<Phase2ApiResponse<ContractMethod[]>>(
      `/contracts/${address}/methods`
    )
    return response.data.data
  },

  /**
   * Call contract method (read-only)
   * Endpoint: POST /api/v11/contracts/{address}/call
   */
  async callContractMethod(
    address: string,
    method: string,
    params: any[]
  ): Promise<ContractInteraction> {
    const response = await apiClient.post<Phase2ApiResponse<ContractInteraction>>(
      `/contracts/${address}/call`,
      { method, params }
    )
    return response.data.data
  },

  /**
   * Get contract source code
   * Endpoint: GET /api/v11/contracts/{address}/source
   */
  async getContractSource(address: string): Promise<{ sourceCode: string; abi: any[] }> {
    const response = await apiClient.get<Phase2ApiResponse<{ sourceCode: string; abi: any[] }>>(
      `/contracts/${address}/source`
    )
    return response.data.data
  },

  /**
   * Get contract events
   * Endpoint: GET /api/v11/contracts/{address}/events
   */
  async getContractEvents(
    address: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<any[]> {
    const response = await apiClient.get<Phase2ApiResponse<any[]>>(
      `/contracts/${address}/events`,
      { params: { fromBlock, toBlock } }
    )
    return response.data.data
  },
}

// ============================================================================
// Gas Fee API (AV11-284)
// ============================================================================

export const gasFeeApi = {
  /**
   * Get current gas fees
   * Endpoint: GET /api/v11/contracts/ricardian/gas-fees
   */
  async getCurrentGasFees(): Promise<GasFeeData> {
    const response = await apiClient.get<Phase2ApiResponse<GasFeeData>>(
      '/contracts/ricardian/gas-fees'
    )
    return response.data.data
  },

  /**
   * Get gas fee history
   * Endpoint: GET /api/v11/gas/history
   */
  async getGasFeeHistory(
    period: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<GasFeeHistory> {
    const response = await apiClient.get<Phase2ApiResponse<GasFeeHistory>>(
      '/gas/history',
      { params: { period } }
    )
    return response.data.data
  },

  /**
   * Estimate gas fee for transaction
   * Endpoint: POST /api/v11/gas/estimate
   */
  async estimateGasFee(
    transactionType: string,
    data?: any
  ): Promise<GasFeeEstimate> {
    const response = await apiClient.post<Phase2ApiResponse<GasFeeEstimate>>(
      '/gas/estimate',
      { transactionType, data }
    )
    return response.data.data
  },

  /**
   * Get gas price trends
   * Endpoint: GET /api/v11/gas/trends
   */
  async getGasTrends(period: string = '24h'): Promise<GasTrend> {
    const response = await apiClient.get<Phase2ApiResponse<GasTrend>>(
      '/gas/trends',
      { params: { period } }
    )
    return response.data.data
  },
}

// ============================================================================
// Governance API (AV11-285, AV11-286)
// ============================================================================

export const governanceApi = {
  /**
   * Get all governance proposals
   * Endpoint: GET /api/v11/blockchain/governance/proposals
   */
  async getProposals(
    status?: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<Phase2PaginatedResponse<GovernanceProposal>> {
    const response = await apiClient.get<Phase2ApiResponse<Phase2PaginatedResponse<GovernanceProposal>>>(
      '/blockchain/governance/proposals',
      { params: { status, page, pageSize } }
    )
    return response.data.data
  },

  /**
   * Get proposal details
   * Endpoint: GET /api/v11/governance/proposals/{id}
   */
  async getProposal(id: string): Promise<GovernanceProposal> {
    const response = await apiClient.get<Phase2ApiResponse<GovernanceProposal>>(
      `/governance/proposals/${id}`
    )
    return response.data.data
  },

  /**
   * Get proposal votes
   * Endpoint: GET /api/v11/governance/proposals/{id}/votes
   */
  async getProposalVotes(
    id: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<Phase2PaginatedResponse<ProposalVote>> {
    const response = await apiClient.get<Phase2ApiResponse<Phase2PaginatedResponse<ProposalVote>>>(
      `/governance/proposals/${id}/votes`,
      { params: { page, pageSize } }
    )
    return response.data.data
  },

  /**
   * Get voting statistics
   * Endpoint: GET /api/v11/governance/stats
   */
  async getVotingStats(): Promise<VotingStats> {
    const response = await apiClient.get<Phase2ApiResponse<VotingStats>>(
      '/governance/stats'
    )
    return response.data.data
  },

  /**
   * Submit vote (view mode - will be disabled in UI)
   * Endpoint: POST /api/v11/governance/proposals/{id}/vote
   */
  async submitVote(
    proposalId: string,
    vote: 'yes' | 'no' | 'abstain' | 'no_with_veto',
    reason?: string
  ): Promise<{ success: boolean; txHash: string }> {
    const response = await apiClient.post<Phase2ApiResponse<{ success: boolean; txHash: string }>>(
      `/governance/proposals/${proposalId}/vote`,
      { vote, reason }
    )
    return response.data.data
  },
}

// ============================================================================
// Staking API (AV11-287, AV11-288, AV11-289, AV11-290)
// ============================================================================

export const stakingApi = {
  /**
   * Get staking information
   * Endpoint: GET /api/v11/blockchain/staking/info
   */
  async getStakingInfo(): Promise<StakingInfo> {
    const response = await apiClient.get<Phase2ApiResponse<StakingInfo>>(
      '/blockchain/staking/info'
    )
    return response.data.data
  },

  /**
   * Get all validators
   * Endpoint: GET /api/v11/staking/validators
   */
  async getValidators(
    status?: string,
    sortBy: string = 'stake',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<StakingValidator[]> {
    const response = await apiClient.get<Phase2ApiResponse<StakingValidator[]>>(
      '/staking/validators',
      { params: { status, sortBy, sortOrder } }
    )
    return response.data.data
  },

  /**
   * Get validator details
   * Endpoint: GET /api/v11/staking/validators/{address}
   */
  async getValidator(address: string): Promise<StakingValidator> {
    const response = await apiClient.get<Phase2ApiResponse<StakingValidator>>(
      `/staking/validators/${address}`
    )
    return response.data.data
  },

  /**
   * Get user staking info
   * Endpoint: GET /api/v11/staking/user/{address}
   */
  async getUserStakingInfo(address: string): Promise<UserStakingInfo> {
    const response = await apiClient.get<Phase2ApiResponse<UserStakingInfo>>(
      `/staking/user/${address}`
    )
    return response.data.data
  },

  /**
   * Get staking rewards history
   * Endpoint: GET /api/v11/staking/rewards/{address}
   */
  async getStakingRewards(
    address: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<Phase2PaginatedResponse<StakingReward>> {
    const response = await apiClient.get<Phase2ApiResponse<Phase2PaginatedResponse<StakingReward>>>(
      `/staking/rewards/${address}`,
      { params: { page, pageSize } }
    )
    return response.data.data
  },

  /**
   * Get staking transactions
   * Endpoint: GET /api/v11/staking/transactions/{address}
   */
  async getStakingTransactions(
    address: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<Phase2PaginatedResponse<StakingTransaction>> {
    const response = await apiClient.get<Phase2ApiResponse<Phase2PaginatedResponse<StakingTransaction>>>(
      `/staking/transactions/${address}`,
      { params: { page, pageSize } }
    )
    return response.data.data
  },

  /**
   * Stake tokens (view mode - will be disabled in UI)
   * Endpoint: POST /api/v11/staking/stake
   */
  async stake(
    validatorAddress: string,
    amount: string
  ): Promise<{ success: boolean; txHash: string }> {
    const response = await apiClient.post<Phase2ApiResponse<{ success: boolean; txHash: string }>>(
      '/staking/stake',
      { validatorAddress, amount }
    )
    return response.data.data
  },

  /**
   * Unstake tokens (view mode - will be disabled in UI)
   * Endpoint: POST /api/v11/staking/unstake
   */
  async unstake(
    validatorAddress: string,
    amount: string
  ): Promise<{ success: boolean; txHash: string }> {
    const response = await apiClient.post<Phase2ApiResponse<{ success: boolean; txHash: string }>>(
      '/staking/unstake',
      { validatorAddress, amount }
    )
    return response.data.data
  },

  /**
   * Claim staking rewards (view mode - will be disabled in UI)
   * Endpoint: POST /api/v11/staking/claim
   */
  async claimRewards(
    validatorAddress?: string
  ): Promise<{ success: boolean; txHash: string; amount: string }> {
    const response = await apiClient.post<Phase2ApiResponse<{ success: boolean; txHash: string; amount: string }>>(
      '/staking/claim',
      { validatorAddress }
    )
    return response.data.data
  },
}

// ============================================================================
// Ricardian Contract API
// ============================================================================

export const ricardianContractApi = {
  /**
   * Get all Ricardian contracts
   * Endpoint: GET /api/v11/contracts/ricardian
   */
  async getContracts(
    page: number = 1,
    pageSize: number = 20
  ): Promise<Phase2PaginatedResponse<RicardianContract>> {
    const response = await apiClient.get<Phase2ApiResponse<Phase2PaginatedResponse<RicardianContract>>>(
      '/contracts/ricardian',
      { params: { page, pageSize } }
    )
    return response.data.data
  },

  /**
   * Get Ricardian contract details
   * Endpoint: GET /api/v11/contracts/ricardian/{id}
   */
  async getContract(id: string): Promise<RicardianContract> {
    const response = await apiClient.get<Phase2ApiResponse<RicardianContract>>(
      `/contracts/ricardian/${id}`
    )
    return response.data.data
  },
}

// Default export
export default {
  transactionApi,
  contractApi,
  gasFeeApi,
  governanceApi,
  stakingApi,
  ricardianContractApi,
}

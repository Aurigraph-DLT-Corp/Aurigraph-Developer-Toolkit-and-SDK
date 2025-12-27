/**
 * Aurigraph V11 TypeScript/JavaScript SDK
 * Main client for interacting with the Aurigraph blockchain
 */

import axios, { AxiosInstance } from 'axios'

/**
 * Configuration for the Aurigraph client
 */
export interface AurigraphClientConfig {
  baseUrl: string
  apiKey?: string
  timeout?: number
}

/**
 * Account information
 */
export interface Account {
  address: string
  balance: string
  nonce: number
  publicKey: string
}

/**
 * Transaction
 */
export interface Transaction {
  hash: string
  from: string
  to: string
  amount: string
  nonce: number
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}

/**
 * RWAT White Label Provider Configuration
 * Allows 3rd parties to offer RWAT as a white-labeled service
 */
export interface WhiteLabelConfig {
  providerId: string
  providerName: string
  branding: {
    logo?: string
    primaryColor?: string
    apiEndpoint?: string
  }
  pricingTier: 'starter' | 'professional' | 'enterprise'
}

/**
 * Pricing Tier Configuration with Usage-based Fees
 */
export interface PricingTier {
  tier: 'starter' | 'professional' | 'enterprise'
  monthlyFee: number
  transactionFee: number // percentage or fixed amount
  assetRegistrationFee: number
  tokenizationFee: number
  monthlyTransactionLimit?: number
  customOracleSupport: boolean
}

/**
 * RWAT Asset Definition
 */
export interface RWAAsset {
  id: string
  type: 'real_estate' | 'commodities' | 'fine_art' | 'carbon_credits' | 'shipping' | 'intellectual_property'
  name: string
  value: string
  location?: string
  metadata: Record<string, any>
  owner: string
  registryHash: string
  created: number
  updated: number
}

/**
 * RWAT Token Configuration
 */
export interface RWATTokenConfig {
  assetId: string
  totalSupply: string
  tokenSymbol: string
  tokenName: string
  decimals: number
  fractionalOwnership: boolean
  complianceHooks: {
    requireKYC: boolean
    requireAML: boolean
    transferRestrictions?: string[]
  }
  oracleFeeds?: string[]
}

/**
 * Active Contract Definition for Workflow
 */
export interface ActiveContract {
  id: string
  name: string
  description: string
  workflowSteps: WorkflowStep[]
  triggerConditions: TriggerCondition[]
  actions: ContractAction[]
  status: 'draft' | 'active' | 'paused' | 'archived'
  createdBy: string
  created: number
}

/**
 * Workflow Step Definition
 */
export interface WorkflowStep {
  id: string
  name: string
  type: 'validation' | 'approval' | 'execution' | 'notification'
  config: Record<string, any>
  nextSteps?: string[]
  onError?: string
}

/**
 * Trigger Condition for Workflow Execution
 */
export interface TriggerCondition {
  id: string
  type: 'event' | 'schedule' | 'manual' | 'threshold'
  config: Record<string, any>
}

/**
 * Contract Action to Execute
 */
export interface ContractAction {
  id: string
  type: 'transfer' | 'mint' | 'burn' | 'oracle_fetch' | 'notification'
  config: Record<string, any>
}

/**
 * Token Navigation Information
 */
export interface TokenNavigation {
  tokenId: string
  assetId: string
  holder: string
  quantity: string
  fractionalOwnershipPercentage: number
  dividends?: string
  tradingHistory: TokenTransaction[]
  lastTransfer: number
}

/**
 * Token Transaction History
 */
export interface TokenTransaction {
  hash: string
  from: string
  to: string
  quantity: string
  price: string
  timestamp: number
  transactionType: 'transfer' | 'mint' | 'burn' | 'dividend'
}

/**
 * Main Aurigraph SDK Client
 *
 * @example
 * ```typescript
 * const client = new AurigraphClient({
 *   baseUrl: 'https://dlt.aurigraph.io/api/v11',
 *   apiKey: 'sk_...'
 * })
 *
 * await client.connect()
 * const account = await client.getAccount('auri1...')
 * ```
 */
export class AurigraphClient {
  private config: AurigraphClientConfig
  private httpClient: AxiosInstance
  private connected: boolean = false

  constructor(config: AurigraphClientConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    }

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'X-API-Key': this.config.apiKey }),
      },
    })
  }

  /**
   * Connect to the Aurigraph network
   */
  async connect(): Promise<void> {
    try {
      const response = await this.httpClient.get('/health')
      if (response.status === 200) {
        this.connected = true
        console.log('✅ Connected to Aurigraph network')
      }
    } catch (error) {
      throw new Error(`Failed to connect to Aurigraph: ${error}`)
    }
  }

  /**
   * Disconnect from the network
   */
  async disconnect(): Promise<void> {
    this.connected = false
    console.log('✅ Disconnected from Aurigraph network')
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Get account information
   */
  async getAccount(address: string): Promise<Account> {
    try {
      const response = await this.httpClient.get(`/accounts/${address}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get account: ${error}`)
    }
  }

  /**
   * Get balance for an address
   */
  async getBalance(address: string): Promise<string> {
    try {
      const account = await this.getAccount(address)
      return account.balance
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`)
    }
  }

  /**
   * Submit a transaction
   */
  async submitTransaction(tx: Partial<Transaction>): Promise<Transaction> {
    try {
      const response = await this.httpClient.post('/transactions', tx)
      return response.data
    } catch (error) {
      throw new Error(`Failed to submit transaction: ${error}`)
    }
  }

  /**
   * Get transaction details
   */
  async getTransaction(hash: string): Promise<Transaction> {
    try {
      const response = await this.httpClient.get(`/transactions/${hash}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get transaction: ${error}`)
    }
  }

  /**
   * Get latest block
   */
  async getLatestBlock(): Promise<any> {
    try {
      const response = await this.httpClient.get('/blocks/latest')
      return response.data
    } catch (error) {
      throw new Error(`Failed to get latest block: ${error}`)
    }
  }

  // ===========================
  // RWAT WHITE LABELING FEATURES
  // ===========================

  /**
   * Initialize white label provider with custom branding and pricing
   */
  async initializeWhiteLabel(config: WhiteLabelConfig): Promise<void> {
    try {
      await this.httpClient.post('/rwat/white-label/initialize', config)
      console.log(`✅ White label provider initialized: ${config.providerName}`)
    } catch (error) {
      throw new Error(`Failed to initialize white label: ${error}`)
    }
  }

  /**
   * Get pricing tiers for white label provider
   */
  async getPricingTiers(providerId: string): Promise<PricingTier[]> {
    try {
      const response = await this.httpClient.get(`/rwat/white-label/${providerId}/pricing`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get pricing tiers: ${error}`)
    }
  }

  /**
   * Update pricing tier configuration
   */
  async updatePricingTier(providerId: string, tier: PricingTier): Promise<void> {
    try {
      await this.httpClient.put(`/rwat/white-label/${providerId}/pricing/${tier.tier}`, tier)
      console.log(`✅ Pricing tier updated: ${tier.tier}`)
    } catch (error) {
      throw new Error(`Failed to update pricing tier: ${error}`)
    }
  }

  /**
   * Register a real-world asset for tokenization
   */
  async registerRWAT(asset: Partial<RWAAsset>): Promise<RWAAsset> {
    try {
      const response = await this.httpClient.post('/rwat/assets/register', asset)
      return response.data
    } catch (error) {
      throw new Error(`Failed to register RWAT asset: ${error}`)
    }
  }

  /**
   * Create tokens from a registered asset
   */
  async createRWATTokens(config: RWATTokenConfig): Promise<any> {
    try {
      const response = await this.httpClient.post('/rwat/tokens/create', config)
      return response.data
    } catch (error) {
      throw new Error(`Failed to create RWAT tokens: ${error}`)
    }
  }

  /**
   * Get asset details by ID
   */
  async getRWATAsset(assetId: string): Promise<RWAAsset> {
    try {
      const response = await this.httpClient.get(`/rwat/assets/${assetId}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get RWAT asset: ${error}`)
    }
  }

  // ===========================
  // ACTIVE CONTRACTS & WORKFLOWS
  // ===========================

  /**
   * Create a new Active Contract with workflow
   */
  async createActiveContract(contract: Partial<ActiveContract>): Promise<ActiveContract> {
    try {
      const response = await this.httpClient.post('/contracts/active/create', contract)
      return response.data
    } catch (error) {
      throw new Error(`Failed to create active contract: ${error}`)
    }
  }

  /**
   * Get active contract by ID
   */
  async getActiveContract(contractId: string): Promise<ActiveContract> {
    try {
      const response = await this.httpClient.get(`/contracts/active/${contractId}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get active contract: ${error}`)
    }
  }

  /**
   * Execute an active contract workflow
   */
  async executeActiveContract(contractId: string, inputData?: Record<string, any>): Promise<any> {
    try {
      const response = await this.httpClient.post(`/contracts/active/${contractId}/execute`, {
        data: inputData,
      })
      return response.data
    } catch (error) {
      throw new Error(`Failed to execute active contract: ${error}`)
    }
  }

  /**
   * Add a workflow step to an active contract
   */
  async addWorkflowStep(contractId: string, step: WorkflowStep): Promise<void> {
    try {
      await this.httpClient.post(`/contracts/active/${contractId}/steps`, step)
      console.log(`✅ Workflow step added: ${step.name}`)
    } catch (error) {
      throw new Error(`Failed to add workflow step: ${error}`)
    }
  }

  /**
   * List all active contracts for a user
   */
  async listActiveContracts(createdBy: string, status?: string): Promise<ActiveContract[]> {
    try {
      const params = { createdBy, ...(status && { status }) }
      const response = await this.httpClient.get('/contracts/active/list', { params })
      return response.data
    } catch (error) {
      throw new Error(`Failed to list active contracts: ${error}`)
    }
  }

  // ===========================
  // TOKEN NAVIGATION & TRACKING
  // ===========================

  /**
   * Get token navigation details (ownership, history, dividends)
   */
  async getTokenNavigation(tokenId: string): Promise<TokenNavigation> {
    try {
      const response = await this.httpClient.get(`/tokens/navigation/${tokenId}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get token navigation: ${error}`)
    }
  }

  /**
   * Get trading history for a token
   */
  async getTokenTradingHistory(tokenId: string, limit: number = 100): Promise<TokenTransaction[]> {
    try {
      const response = await this.httpClient.get(`/tokens/${tokenId}/history`, {
        params: { limit },
      })
      return response.data
    } catch (error) {
      throw new Error(`Failed to get token trading history: ${error}`)
    }
  }

  /**
   * Get all tokens held by an address
   */
  async getAddressTokens(address: string): Promise<TokenNavigation[]> {
    try {
      const response = await this.httpClient.get(`/tokens/holder/${address}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get address tokens: ${error}`)
    }
  }

  /**
   * Transfer RWAT tokens with compliance checks
   */
  async transferRWATToken(
    tokenId: string,
    to: string,
    quantity: string,
    metadata?: Record<string, any>
  ): Promise<TokenTransaction> {
    try {
      const response = await this.httpClient.post(`/tokens/${tokenId}/transfer`, {
        to,
        quantity,
        metadata,
      })
      return response.data
    } catch (error) {
      throw new Error(`Failed to transfer RWAT token: ${error}`)
    }
  }

  /**
   * Get dividend information for token holders
   */
  async getTokenDividends(tokenId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(`/tokens/${tokenId}/dividends`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to get token dividends: ${error}`)
    }
  }

  /**
   * Claim dividends for a token holding
   */
  async claimDividends(tokenId: string, holderAddress: string): Promise<any> {
    try {
      const response = await this.httpClient.post(`/tokens/${tokenId}/claim-dividends`, {
        holderAddress,
      })
      return response.data
    } catch (error) {
      throw new Error(`Failed to claim dividends: ${error}`)
    }
  }
}

export default AurigraphClient

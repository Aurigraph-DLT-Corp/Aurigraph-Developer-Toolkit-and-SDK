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
}

export default AurigraphClient

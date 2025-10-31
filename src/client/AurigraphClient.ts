/**
 * Aurigraph Client
 * Main entry point for SDK - REST API client with event streaming
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { EventEmitter } from 'eventemitter3';
import { AuthManager } from '../auth/AuthManager';
import {
  AurigraphConfig,
  ApiResponse,
  ApiError,
  AurigraphError,
  RateLimitError,
  ValidationError,
  Transaction,
  Block,
  Account,
  SmartContract,
  RWAAsset,
  Validator,
  NetworkStatus,
  PaginatedResult,
  QueryOptions,
  Event,
  EventHandler,
  ErrorHandler,
} from '../types/index';

export class AurigraphClient extends EventEmitter {
  private httpClient: AxiosInstance;
  private authManager: AuthManager;
  private baseURL: string;
  private apiVersion: string;
  private config: AurigraphConfig;

  constructor(config: AurigraphConfig) {
    super();

    this.config = {
      apiVersion: 'v11',
      timeout: 30000,
      debug: false,
      ...config,
    };

    this.baseURL = this.config.baseURL;
    this.apiVersion = this.config.apiVersion || 'v11';
    this.authManager = new AuthManager(config.auth);

    // Initialize HTTP client
    this.httpClient = axios.create({
      baseURL: `${this.baseURL}/api/${this.apiVersion}`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '@aurigraph/sdk/1.0.0',
        ...this.authManager.getAuthHeader(),
      },
    });

    // Setup request/response interceptors
    this.setupInterceptors();
  }

  /**
   * Setup axios interceptors for logging, retry, etc.
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        if (this.config.debug) {
          console.log(`[Aurigraph SDK] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        if (this.config.debug) {
          console.log(`[Aurigraph SDK] Response: ${response.status}`);
        }
        return response;
      },
      (error: AxiosError) => this.handleErrorResponse(error)
    );
  }

  /**
   * Handle API error responses
   */
  private handleErrorResponse(error: AxiosError<any>): Promise<never> {
    const statusCode = error.response?.status || 0;
    const data = error.response?.data;

    if (statusCode === 429) {
      const retryAfter = parseInt(
        error.response?.headers['retry-after'] || '60'
      );
      throw new RateLimitError(
        'Rate limit exceeded. Please retry after ' + retryAfter + ' seconds',
        retryAfter * 1000
      );
    }

    if (statusCode === 400) {
      throw new ValidationError(
        data?.message || 'Validation error',
        data?.details
      );
    }

    const apiError: ApiError = {
      code: data?.code || 'UNKNOWN_ERROR',
      message: data?.message || error.message,
      statusCode,
      details: data?.details,
      timestamp: new Date().toISOString(),
    };

    throw new AurigraphError(
      apiError.message,
      apiError.code,
      statusCode,
      apiError.details
    );
  }

  // ==================== Transaction Methods ====================

  /**
   * Get transaction by hash
   */
  async getTransaction(hash: string): Promise<Transaction> {
    const response = await this.httpClient.get<ApiResponse<Transaction>>(
      `/transactions/${hash}`
    );
    return response.data.data!;
  }

  /**
   * Get all transactions for an address
   */
  async getTransactions(
    address: string,
    options?: QueryOptions
  ): Promise<PaginatedResult<Transaction>> {
    const response = await this.httpClient.get<ApiResponse<PaginatedResult<Transaction>>>(
      `/transactions`,
      { params: { address, ...options } }
    );
    return response.data.data!;
  }

  /**
   * Send a signed transaction
   */
  async sendTransaction(
    signedTx: string
  ): Promise<{ hash: string; nonce: number }> {
    const response = await this.httpClient.post<
      ApiResponse<{ hash: string; nonce: number }>
    >(`/transactions`, { signedTx });
    return response.data.data!;
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash: string): Promise<any> {
    const response = await this.httpClient.get<ApiResponse>(
      `/transactions/${hash}/receipt`
    );
    return response.data.data;
  }

  // ==================== Block Methods ====================

  /**
   * Get block by number or hash
   */
  async getBlock(numberOrHash: number | string): Promise<Block> {
    const response = await this.httpClient.get<ApiResponse<Block>>(
      `/blocks/${numberOrHash}`
    );
    return response.data.data!;
  }

  /**
   * Get latest block
   */
  async getLatestBlock(): Promise<Block> {
    const response = await this.httpClient.get<ApiResponse<Block>>(`/blocks/latest`);
    return response.data.data!;
  }

  /**
   * Get blocks in range
   */
  async getBlocks(
    from: number,
    to: number
  ): Promise<PaginatedResult<Block>> {
    const response = await this.httpClient.get<ApiResponse<PaginatedResult<Block>>>(
      `/blocks`,
      { params: { from, to } }
    );
    return response.data.data!;
  }

  // ==================== Account Methods ====================

  /**
   * Get account details
   */
  async getAccount(address: string): Promise<Account> {
    const response = await this.httpClient.get<ApiResponse<Account>>(
      `/accounts/${address}`
    );
    return response.data.data!;
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    const response = await this.httpClient.get<ApiResponse<{ balance: string }>>(
      `/accounts/${address}/balance`
    );
    return response.data.data!.balance;
  }

  /**
   * Get nonce for address (for transaction construction)
   */
  async getNonce(address: string): Promise<number> {
    const response = await this.httpClient.get<ApiResponse<{ nonce: number }>>(
      `/accounts/${address}/nonce`
    );
    return response.data.data!.nonce;
  }

  // ==================== Smart Contract Methods ====================

  /**
   * Call a smart contract function (read-only)
   */
  async callContract(
    contractAddress: string,
    functionName: string,
    parameters: any[] = []
  ): Promise<any> {
    const response = await this.httpClient.post<ApiResponse<any>>(
      `/contracts/${contractAddress}/call`,
      { functionName, parameters }
    );
    return response.data.data;
  }

  /**
   * Get contract ABI
   */
  async getContractABI(contractAddress: string): Promise<any[]> {
    const response = await this.httpClient.get<ApiResponse<any[]>>(
      `/contracts/${contractAddress}/abi`
    );
    return response.data.data!;
  }

  /**
   * Get contract details
   */
  async getContract(contractAddress: string): Promise<SmartContract> {
    const response = await this.httpClient.get<ApiResponse<SmartContract>>(
      `/contracts/${contractAddress}`
    );
    return response.data.data!;
  }

  // ==================== RWA Methods ====================

  /**
   * Get RWA asset by ID
   */
  async getRWAAsset(assetId: string): Promise<RWAAsset> {
    const response = await this.httpClient.get<ApiResponse<RWAAsset>>(
      `/rwa/assets/${assetId}`
    );
    return response.data.data!;
  }

  /**
   * List RWA assets
   */
  async listRWAAssets(options?: QueryOptions): Promise<PaginatedResult<RWAAsset>> {
    const response = await this.httpClient.get<ApiResponse<PaginatedResult<RWAAsset>>>(
      `/rwa/assets`,
      { params: options }
    );
    return response.data.data!;
  }

  /**
   * Get RWA portfolio for address
   */
  async getRWAPortfolio(address: string): Promise<any> {
    const response = await this.httpClient.get<ApiResponse>(
      `/rwa/portfolio/${address}`
    );
    return response.data.data;
  }

  // ==================== Validator Methods ====================

  /**
   * Get validator details
   */
  async getValidator(address: string): Promise<Validator> {
    const response = await this.httpClient.get<ApiResponse<Validator>>(
      `/validators/${address}`
    );
    return response.data.data!;
  }

  /**
   * List active validators
   */
  async listValidators(options?: QueryOptions): Promise<PaginatedResult<Validator>> {
    const response = await this.httpClient.get<ApiResponse<PaginatedResult<Validator>>>(
      `/validators`,
      { params: options }
    );
    return response.data.data!;
  }

  /**
   * Get validator performance metrics
   */
  async getValidatorPerformance(address: string): Promise<any> {
    const response = await this.httpClient.get<ApiResponse>(
      `/validators/${address}/performance`
    );
    return response.data.data;
  }

  // ==================== Network Methods ====================

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    const response = await this.httpClient.get<ApiResponse<NetworkStatus>>(
      `/network/status`
    );
    return response.data.data!;
  }

  /**
   * Get network metrics
   */
  async getNetworkMetrics(): Promise<any> {
    const response = await this.httpClient.get<ApiResponse>(
      `/network/metrics`
    );
    return response.data.data;
  }

  /**
   * Get network peers
   */
  async getPeers(): Promise<any[]> {
    const response = await this.httpClient.get<ApiResponse<any[]>>(
      `/network/peers`
    );
    return response.data.data!;
  }

  // ==================== Event Streaming Methods ====================

  /**
   * Subscribe to events via Server-Sent Events
   */
  async subscribeToEvents(
    types?: string[],
    onEvent?: EventHandler,
    onError?: ErrorHandler
  ): Promise<void> {
    const params = types ? { types: types.join(',') } : {};
    const url = `${this.baseURL}/api/${this.apiVersion}/events/stream?${new URLSearchParams(
      params
    ).toString()}`;

    try {
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('event', data);
          if (onEvent) {
            onEvent(data);
          }
        } catch (error) {
          console.error('Failed to parse event:', error);
        }
      };

      eventSource.onerror = (error) => {
        const err = new AurigraphError(
          'Event stream error',
          'EVENT_STREAM_ERROR',
          500
        );
        this.emit('error', err);
        if (onError) {
          onError(err);
        }
      };

      this.once('close', () => eventSource.close());
    } catch (error) {
      const err = new AurigraphError(
        `Failed to establish event stream: ${error}`,
        'EVENT_STREAM_ERROR',
        500
      );
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }

  /**
   * Search transactions
   */
  async searchTransactions(
    query: string,
    options?: QueryOptions
  ): Promise<PaginatedResult<Transaction>> {
    const response = await this.httpClient.get<
      ApiResponse<PaginatedResult<Transaction>>
    >(`/search/transactions`, { params: { q: query, ...options } });
    return response.data.data!;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy' }> {
    const response = await this.httpClient.get<ApiResponse>(
      `/health`
    );
    return { status: response.data.success ? 'healthy' : 'unhealthy' };
  }

  /**
   * Close client
   */
  close(): void {
    this.emit('close');
    this.removeAllListeners();
  }
}

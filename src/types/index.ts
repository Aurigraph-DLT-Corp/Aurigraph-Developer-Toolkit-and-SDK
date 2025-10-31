/**
 * Aurigraph SDK Type Definitions
 * Core types and interfaces for the Aurigraph integration SDK
 */

// ==================== Configuration Types ====================

export interface AurigraphConfig {
  /**
   * API base URL (default: https://api.aurigraph.io or http://localhost:9003)
   */
  baseURL: string;

  /**
   * API version (default: v11)
   */
  apiVersion?: string;

  /**
   * Authentication credentials
   */
  auth: AuthCredentials;

  /**
   * Request timeout in milliseconds (default: 30000)
   */
  timeout?: number;

  /**
   * Enable request logging (default: false)
   */
  debug?: boolean;

  /**
   * WebSocket configuration for real-time updates
   */
  websocket?: WebSocketConfig;

  /**
   * Retry configuration
   */
  retry?: RetryConfig;
}

export interface AuthCredentials {
  /**
   * API key for authentication
   */
  apiKey?: string;

  /**
   * JWT token for authentication
   */
  token?: string;

  /**
   * OAuth 2.0 client credentials
   */
  oauth?: OAuthConfig;

  /**
   * Wallet/private key for signing transactions
   */
  privateKey?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  grantType: 'client_credentials' | 'authorization_code';
  scope?: string[];
  tokenURL?: string;
}

export interface WebSocketConfig {
  enabled: boolean;
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatusCodes: number[];
  exponentialBackoff: boolean;
}

// ==================== API Response Types ====================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
  timestamp: string;
}

// ==================== Transaction Types ====================

export interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  from: string;
  to?: string;
  value: string;
  fee: string;
  nonce: number;
  timestamp: number;
  blockNumber?: number;
  blockHash?: string;
  gasUsed?: string;
  data?: string;
}

export type TransactionType = 'transfer' | 'contract_deploy' | 'contract_call' | 'stake' | 'governance';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'reverted';

export interface TransactionRequest {
  to?: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  nonce?: number;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to?: string;
  gasUsed: string;
  status: 0 | 1;
  logs: LogEntry[];
  contractAddress?: string;
}

export interface LogEntry {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

// ==================== Block Types ====================

export interface Block {
  number: number;
  hash: string;
  parentHash: string;
  timestamp: number;
  miner: string;
  transactions: string[];
  transactionCount: number;
  gasUsed: string;
  gasLimit: string;
  difficulty: string;
}

export interface BlockDetails extends Block {
  receipts?: TransactionReceipt[];
}

// ==================== Account/Address Types ====================

export interface Account {
  address: string;
  balance: string;
  nonce: number;
  codeHash?: string;
  storageRoot?: string;
}

export interface Balance {
  address: string;
  balance: string;
  unit: 'wei' | 'gwei' | 'ether';
}

// ==================== Smart Contract Types ====================

export interface SmartContract {
  address: string;
  name: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  bytecode: string;
  abi: ContractABI[];
  deploymentBlock: number;
  verified: boolean;
}

export interface ContractABI {
  type: 'function' | 'constructor' | 'event' | 'fallback';
  name?: string;
  inputs: ABIParameter[];
  outputs?: ABIParameter[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
}

export interface ABIParameter {
  name: string;
  type: string;
  components?: ABIParameter[];
  indexed?: boolean;
}

export interface ContractCallRequest {
  to: string;
  functionName: string;
  parameters: any[];
  value?: string;
  gas?: string;
}

export interface ContractCallResult {
  result: any;
  status: 'success' | 'failure';
  gasUsed?: string;
  output?: string;
}

// ==================== Real-World Assets (RWA) Types ====================

export interface RWAAsset {
  id: string;
  tokenAddress: string;
  name: string;
  symbol: string;
  underlyingAsset: string;
  issuer: string;
  totalSupply: string;
  decimals: number;
  metadata: RWAMetadata;
  merkleRoot?: string;
  verified: boolean;
}

export interface RWAMetadata {
  assetType: 'real_estate' | 'commodity' | 'equity' | 'bond' | 'other';
  valuation: string;
  valuationDate: string;
  custodian?: string;
  auditor?: string;
  documentHash?: string;
  externalRegistry?: string;
}

export interface RWAPortfolio {
  owner: string;
  assets: RWAAsset[];
  totalValue: string;
  lastUpdated: number;
}

// ==================== Validator Types ====================

export interface Validator {
  address: string;
  publicKey: string;
  stake: string;
  commissionRate: number;
  operatorAddress: string;
  status: ValidatorStatus;
  unbondingHeight?: number;
  joinHeight: number;
}

export type ValidatorStatus = 'active' | 'inactive' | 'jailed' | 'unbonding';

export interface ValidatorPerformance {
  address: string;
  uptime: number;
  blocksProposed: number;
  blocksValidated: number;
  missedBlocks: number;
  slashingEvents: number;
  lastProposedHeight: number;
}

// ==================== Network Types ====================

export interface NetworkStatus {
  chainId: number;
  currentHeight: number;
  currentHash: string;
  averageBlockTime: number;
  tps: number;
  validators: number;
  totalStake: string;
  circulatingSupply: string;
  totalSupply: string;
}

export interface NetworkMetrics {
  blockHeight: number;
  blockTime: number;
  transactionCount: number;
  gasPrice: string;
  difficulty: string;
  hashRate: string;
}

export interface Peer {
  id: string;
  address: string;
  port: number;
  version: string;
  lastSeen: number;
}

// ==================== Event Types ====================

export interface Event {
  id: string;
  type: EventType;
  source: string;
  timestamp: number;
  data: Record<string, any>;
}

export type EventType =
  | 'transaction.created'
  | 'transaction.confirmed'
  | 'transaction.failed'
  | 'block.created'
  | 'contract.deployed'
  | 'contract.call'
  | 'validator.joined'
  | 'validator.left'
  | 'rwa.created'
  | 'rwa.transferred';

// ==================== Query Types ====================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: SortOrder;
  filter?: Record<string, any>;
}

export type SortOrder = 'asc' | 'desc';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ==================== Webhook Types ====================

export interface WebhookEvent {
  id: string;
  type: EventType;
  timestamp: number;
  data: Record<string, any>;
  attempts: number;
  lastAttempt?: number;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: EventType[];
  active: boolean;
  secret?: string;
  headers?: Record<string, string>;
}

// ==================== Stream Types ====================

export interface StreamOptions {
  types?: EventType[];
  addresses?: string[];
  topics?: string[];
  fromBlock?: number;
  toBlock?: number;
}

export interface StreamEvent<T = any> {
  id: string;
  blockNumber: number;
  transactionIndex: number;
  address: string;
  topics: string[];
  data: T;
  timestamp: number;
}

// ==================== Error Types ====================

export class AurigraphError extends Error {
  code: string;
  statusCode: number;
  details?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AurigraphError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AuthError extends AurigraphError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'AUTH_ERROR', 401, details);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AurigraphError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends AurigraphError {
  retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// ==================== Handler Types ====================

export type EventHandler<T = any> = (event: T) => Promise<void> | void;
export type ErrorHandler = (error: AurigraphError) => Promise<void> | void;
export type ConnectionHandler = () => Promise<void> | void;

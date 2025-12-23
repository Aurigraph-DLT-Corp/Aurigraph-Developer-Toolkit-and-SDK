/**
 * Aurigraph SDK - Main Entry Point
 * Official TypeScript SDK for Aurigraph DLT Platform integration
 */

// Export main client
export { AurigraphClient } from './client/AurigraphClient';

// Export authentication
export { AuthManager } from './auth/AuthManager';

// Export all types
export type {
  AurigraphConfig,
  AuthCredentials,
  OAuthConfig,
  WebSocketConfig,
  RetryConfig,
  ApiResponse,
  ResponseMeta,
  RateLimitInfo,
  ApiError,
  Transaction,
  TransactionRequest,
  TransactionReceipt,
  TransactionStatus,
  TransactionType,
  LogEntry,
  Block,
  BlockDetails,
  Account,
  Balance,
  SmartContract,
  ContractABI,
  ABIParameter,
  ContractCallRequest,
  ContractCallResult,
  RWAAsset,
  RWAMetadata,
  RWAPortfolio,
  Validator,
  ValidatorStatus,
  ValidatorPerformance,
  NetworkStatus,
  NetworkMetrics,
  Peer,
  Event,
  EventType,
  QueryOptions,
  PaginatedResult,
  WebhookEvent,
  WebhookSubscription,
  StreamOptions,
  StreamEvent,
  EventHandler,
  ErrorHandler,
  ConnectionHandler,
} from './types/index';

export {
  AurigraphError,
  AuthError,
  ValidationError,
  RateLimitError,
} from './types/index';

// SDK Version
export const VERSION = '1.0.0';

// Create and export default instance factory
export function createClient(config: any) {
  const { AurigraphClient } = require('./client/AurigraphClient');
  return new AurigraphClient(config);
}

/**
 * Token Traceability API Service
 * Provides centralized HTTP client for all token traceability endpoints
 * Includes error handling, retries, and request/response transformations
 */

const API_BASE = 'http://localhost:9003/api/v11/traceability';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface TokenTrace {
  trace_id: string;
  token_id: string;
  asset_id: string;
  asset_type: string;
  underlying_asset_hash: string;
  merkle_proof_path: MerkleProofNode[];
  merkle_root_hash: string;
  token_creation_timestamp: string;
  token_value_usd?: number;
  fractional_ownership: number;
  owner_address: string;
  asset_verified: boolean;
  verification_status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  proof_valid: boolean;
  ownership_history: OwnershipTransfer[];
  compliance_certifications: string[];
  audit_trail: AuditLogEntry[];
  last_verified_timestamp?: string;
  next_verification_due?: string;
  metadata?: Record<string, unknown>;
}

export interface MerkleProofNode {
  index: number;
  hash: string;
  sibling_hash: string;
  direction: 'LEFT' | 'RIGHT';
}

export interface OwnershipTransfer {
  transfer_id: string;
  from_address: string;
  to_address: string;
  timestamp: string;
  transaction_hash: string;
  transfer_value?: number;
  ownership_percentage: number;
}

export interface AuditLogEntry {
  entry_id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export interface ComplianceSummary {
  token_id: string;
  asset_id: string;
  verification_status: string;
  is_verified: boolean;
  proof_valid: boolean;
  last_verified: string;
  next_verification_due: string;
  compliance_certifications: string[];
  total_transfers: number;
  audit_entries: number;
  requires_verification: boolean;
}

export interface TraceStatistics {
  total_traces: number;
  verified_traces: number;
  pending_verification: number;
  verified_assets: number;
  total_ownership_transfers: number;
  total_audit_entries: number;
}

// Request Types
export interface CreateTraceRequest {
  assetId: string;
  assetType: string;
  ownerAddress: string;
}

export interface LinkAssetRequest {
  rwatId: string;
}

export interface TransferRequest {
  fromAddress: string;
  toAddress: string;
  ownershipPercentage: number;
}

export interface CertificationRequest {
  certification: string;
}

// API Client Class
class TokenTraceabilityApiClient {
  private maxRetries = 3;
  private retryDelay = 1000; // milliseconds

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    retries = this.maxRetries
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status >= 500 && retries > 0) {
          // Retry on server errors
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          return this.fetchWithRetry(url, options, retries - 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (retries > 0 && error instanceof Error && error.message.includes('Failed to fetch')) {
        // Retry on network errors
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Create a new token trace
   * POST /tokens/{tokenId}/trace
   */
  async createTokenTrace(tokenId: string, request: CreateTraceRequest): Promise<TokenTrace> {
    return this.fetchWithRetry(`${API_BASE}/tokens/${tokenId}/trace`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Link token to underlying asset
   * POST /tokens/{tokenId}/link-asset
   */
  async linkTokenToAsset(tokenId: string, rwatId: string): Promise<TokenTrace> {
    return this.fetchWithRetry(`${API_BASE}/tokens/${tokenId}/link-asset`, {
      method: 'POST',
      body: JSON.stringify({ rwatId }),
    });
  }

  /**
   * Verify token asset proof
   * POST /tokens/{tokenId}/verify-proof
   */
  async verifyTokenAssetProof(
    tokenId: string
  ): Promise<{
    token_id: string;
    proof_valid: boolean;
    verification_status: string;
    asset_verified: boolean;
    merkle_proof_path: MerkleProofNode[];
  }> {
    return this.fetchWithRetry(`${API_BASE}/tokens/${tokenId}/verify-proof`, {
      method: 'POST',
    });
  }

  /**
   * Record ownership transfer
   * POST /tokens/{tokenId}/transfer
   */
  async recordOwnershipTransfer(tokenId: string, request: TransferRequest): Promise<TokenTrace> {
    return this.fetchWithRetry(`${API_BASE}/tokens/${tokenId}/transfer`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get token trace by ID
   * GET /tokens/{tokenId}
   */
  async getTokenTrace(tokenId: string): Promise<TokenTrace> {
    return this.fetchWithRetry(`${API_BASE}/tokens/${tokenId}`);
  }

  /**
   * Get all token traces
   * GET /tokens
   */
  async getAllTraces(): Promise<{ total: number; traces: TokenTrace[] }> {
    return this.fetchWithRetry(`${API_BASE}/tokens`);
  }

  /**
   * Get traces by asset type
   * GET /tokens/type/{assetType}
   */
  async getTracesByAssetType(assetType: string): Promise<{ asset_type: string; total: number; traces: TokenTrace[] }> {
    return this.fetchWithRetry(`${API_BASE}/tokens/type/${encodeURIComponent(assetType)}`);
  }

  /**
   * Get traces by owner address
   * GET /tokens/owner/{ownerAddress}
   */
  async getTracesByOwner(ownerAddress: string): Promise<{ owner_address: string; total: number; traces: TokenTrace[] }> {
    return this.fetchWithRetry(`${API_BASE}/tokens/owner/${encodeURIComponent(ownerAddress)}`);
  }

  /**
   * Get traces by verification status
   * GET /tokens/status/{verificationStatus}
   */
  async getTracesByStatus(status: string): Promise<{ verification_status: string; total: number; traces: TokenTrace[] }> {
    return this.fetchWithRetry(`${API_BASE}/tokens/status/${encodeURIComponent(status)}`);
  }

  /**
   * Get compliance summary for token
   * GET /tokens/{tokenId}/compliance
   */
  async getComplianceSummary(tokenId: string): Promise<ComplianceSummary> {
    return this.fetchWithRetry(`${API_BASE}/tokens/${tokenId}/compliance`);
  }

  /**
   * Add compliance certification
   * POST /tokens/{tokenId}/certify
   */
  async addComplianceCertification(tokenId: string, request: CertificationRequest): Promise<TokenTrace> {
    return this.fetchWithRetry(`${API_BASE}/tokens/${tokenId}/certify`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get token traceability statistics
   * GET /statistics
   */
  async getStatistics(): Promise<TraceStatistics> {
    return this.fetchWithRetry(`${API_BASE}/statistics`);
  }

  /**
   * Advanced search with multiple filters
   */
  async searchTraces(filters: {
    assetType?: string;
    status?: string;
    owner?: string;
    tokenId?: string;
  }): Promise<TokenTrace[]> {
    try {
      // Build filter results in parallel
      const results: TokenTrace[] = [];

      if (filters.tokenId) {
        try {
          const trace = await this.getTokenTrace(filters.tokenId);
          results.push(trace);
        } catch (error) {
          // Token not found, continue with other filters
        }
      }

      if (filters.assetType) {
        try {
          const response = await this.getTracesByAssetType(filters.assetType);
          results.push(...response.traces);
        } catch (error) {
          // Continue with other filters
        }
      }

      if (filters.status) {
        try {
          const response = await this.getTracesByStatus(filters.status);
          results.push(...response.traces);
        } catch (error) {
          // Continue with other filters
        }
      }

      if (filters.owner) {
        try {
          const response = await this.getTracesByOwner(filters.owner);
          results.push(...response.traces);
        } catch (error) {
          // Continue with other filters
        }
      }

      // Deduplicate results
      const uniqueResults = Array.from(
        new Map(results.map(trace => [trace.trace_id, trace])).values()
      );

      return uniqueResults;
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  /**
   * Batch fetch multiple traces
   */
  async batchFetchTraces(tokenIds: string[]): Promise<(TokenTrace | null)[]> {
    return Promise.all(
      tokenIds.map(async tokenId => {
        try {
          return await this.getTokenTrace(tokenId);
        } catch (error) {
          console.error(`Failed to fetch trace ${tokenId}:`, error);
          return null;
        }
      })
    );
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:9003/q/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API status and metrics
   */
  async getApiMetrics(): Promise<Record<string, unknown>> {
    try {
      return await this.fetchWithRetry(`http://localhost:9003/q/metrics`);
    } catch (error) {
      return { error: 'Failed to fetch metrics' };
    }
  }
}

// Export singleton instance
export const tokenTraceabilityApi = new TokenTraceabilityApiClient();

/**
 * Hook for React components - useTokenTraceability
 * Provides easy access to API methods with loading/error states
 */
export function useTokenTraceability() {
  return {
    api: tokenTraceabilityApi,

    // High-level operations
    createTrace: tokenTraceabilityApi.createTokenTrace.bind(tokenTraceabilityApi),
    linkAsset: tokenTraceabilityApi.linkTokenToAsset.bind(tokenTraceabilityApi),
    verifyProof: tokenTraceabilityApi.verifyTokenAssetProof.bind(tokenTraceabilityApi),
    transferOwnership: tokenTraceabilityApi.recordOwnershipTransfer.bind(tokenTraceabilityApi),
    certify: tokenTraceabilityApi.addComplianceCertification.bind(tokenTraceabilityApi),

    // Query operations
    getTrace: tokenTraceabilityApi.getTokenTrace.bind(tokenTraceabilityApi),
    getAllTraces: tokenTraceabilityApi.getAllTraces.bind(tokenTraceabilityApi),
    getByAssetType: tokenTraceabilityApi.getTracesByAssetType.bind(tokenTraceabilityApi),
    getByOwner: tokenTraceabilityApi.getTracesByOwner.bind(tokenTraceabilityApi),
    getByStatus: tokenTraceabilityApi.getTracesByStatus.bind(tokenTraceabilityApi),
    search: tokenTraceabilityApi.searchTraces.bind(tokenTraceabilityApi),

    // Compliance and statistics
    getCompliance: tokenTraceabilityApi.getComplianceSummary.bind(tokenTraceabilityApi),
    getStatistics: tokenTraceabilityApi.getStatistics.bind(tokenTraceabilityApi),

    // Health and metrics
    healthCheck: tokenTraceabilityApi.healthCheck.bind(tokenTraceabilityApi),
    getMetrics: tokenTraceabilityApi.getApiMetrics.bind(tokenTraceabilityApi),
  };
}

/**
 * Error handler utility
 */
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return 'Invalid date';
  }
}

/**
 * Format hash for display (truncated or full)
 */
export function formatHash(hash: string, truncate = true): string {
  if (!hash) return 'N/A';
  if (truncate && hash.length > 16) {
    return hash.substring(0, 8) + '...' + hash.substring(hash.length - 8);
  }
  return hash;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'VERIFIED':
      return '#4caf50'; // Green
    case 'REJECTED':
      return '#f44336'; // Red
    case 'IN_REVIEW':
      return '#ff9800'; // Orange
    case 'PENDING':
      return '#9e9e9e'; // Gray
    default:
      return '#2196f3'; // Blue
  }
}

/**
 * Get asset type badge color
 */
export function getAssetTypeColor(assetType: string): string {
  switch (assetType) {
    case 'REAL_ESTATE':
      return '#8b4513'; // Brown
    case 'CARBON_CREDIT':
      return '#4caf50'; // Green
    case 'ART_COLLECTIBLE':
      return '#ff6f00'; // Orange
    case 'COMMODITY':
      return '#607d8b'; // Blue-gray
    default:
      return '#2196f3'; // Blue
  }
}

/**
 * Validate token ID format
 */
export function isValidTokenId(tokenId: string): boolean {
  return tokenId && tokenId.length > 0 && !/[<>:"|?*]/.test(tokenId);
}

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Calculate verification progress percentage
 */
export function calculateVerificationProgress(trace: TokenTrace): number {
  let completed = 0;
  const steps = 5;

  if (trace.verification_status !== 'PENDING') completed++;
  if (trace.verification_status !== 'PENDING' && trace.verification_status !== 'IN_REVIEW') completed++;
  if (trace.merkle_proof_path && trace.merkle_proof_path.length > 0) completed++;
  if (trace.proof_valid) completed++;
  if (trace.asset_verified) completed++;

  return Math.round((completed / steps) * 100);
}

export default tokenTraceabilityApi;

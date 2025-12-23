/**
 * Token Management Service
 *
 * REST API client for token operations
 */

import type {
  Token,
  TokenCreateRequest,
  TokenTransferRequest,
  TokenMintRequest,
  TokenBurnRequest,
  TokenBalance,
  TokenTransaction,
  TokenStats,
} from '../types/tokens';
import { API_BASE_URL } from '../utils/constants';

class TokenService {
  private baseUrl: string;
  private demoMode: boolean;

  constructor(baseUrl: string = API_BASE_URL, demoMode: boolean = false) {
    this.baseUrl = baseUrl;
    this.demoMode = demoMode;
  }

  setDemoMode(enabled: boolean) {
    this.demoMode = enabled;
  }

  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.ok) {
          return await response.json();
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Create a new token
   */
  async createToken(request: TokenCreateRequest): Promise<Token> {
    if (this.demoMode) {
      return this.generateMockToken(request);
    }
    return this.fetchWithRetry<Token>('/api/v11/tokens/create', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get list of all tokens
   */
  async listTokens(): Promise<Token[]> {
    if (this.demoMode) {
      return this.generateMockTokenList();
    }
    return this.fetchWithRetry<Token[]>('/api/v11/tokens/list');
  }

  /**
   * Get token details by ID
   */
  async getToken(tokenId: string): Promise<Token> {
    if (this.demoMode) {
      return this.generateMockToken({
        name: 'Demo Token',
        symbol: 'DMO',
        decimals: 18,
        initialSupply: 1000000,
        mintable: true,
        burnable: true,
        pausable: false,
      });
    }
    return this.fetchWithRetry<Token>(`/api/v11/tokens/${tokenId}`);
  }

  /**
   * Burn tokens
   */
  async burnTokens(request: TokenBurnRequest): Promise<TokenTransaction> {
    if (this.demoMode) {
      return this.generateMockTransaction('burn', request);
    }
    return this.fetchWithRetry<TokenTransaction>('/api/v11/tokens/burn', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Mint additional tokens
   */
  async mintTokens(request: TokenMintRequest): Promise<TokenTransaction> {
    if (this.demoMode) {
      return this.generateMockTransaction('mint', request);
    }
    return this.fetchWithRetry<TokenTransaction>('/api/v11/tokens/mint', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Transfer tokens
   */
  async transferTokens(request: TokenTransferRequest): Promise<TokenTransaction> {
    if (this.demoMode) {
      return this.generateMockTransaction('transfer', request);
    }
    return this.fetchWithRetry<TokenTransaction>('/api/v11/tokens/transfer', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get token balance for an address
   */
  async getBalance(tokenId: string, address: string): Promise<TokenBalance> {
    if (this.demoMode) {
      return this.generateMockBalance(tokenId, address);
    }
    return this.fetchWithRetry<TokenBalance>(`/api/v11/tokens/${tokenId}/balance/${address}`);
  }

  /**
   * Get token statistics
   */
  async getStats(): Promise<TokenStats> {
    if (this.demoMode) {
      return this.generateMockStats();
    }
    return this.fetchWithRetry<TokenStats>('/api/v11/tokens/stats');
  }

  // Mock data generators
  private generateMockToken(request: Partial<TokenCreateRequest>): Token {
    return {
      id: `token-${Date.now()}`,
      name: request.name || 'Demo Token',
      symbol: request.symbol || 'DMO',
      decimals: request.decimals || 18,
      totalSupply: request.initialSupply || 1000000,
      currentSupply: request.initialSupply || 1000000,
      owner: '0x' + Math.random().toString(16).substring(2, 42),
      contractAddress: '0x' + Math.random().toString(16).substring(2, 42),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      burned: 0,
      minted: request.initialSupply || 1000000,
      transfers: 0,
      holders: 1,
      status: 'active',
      metadata: request.metadata,
    };
  }

  private generateMockTokenList(): Token[] {
    const names = ['AuriGold', 'AuriSilver', 'AuriBond', 'AuriShare', 'AuriCredit'];
    const symbols = ['AUG', 'AUS', 'AUB', 'ASH', 'AUC'];

    return names.map((name, i) => ({
      id: `token-${i + 1}`,
      name,
      symbol: symbols[i] ?? 'UNKNOWN',
      decimals: 18,
      totalSupply: Math.floor(Math.random() * 10000000) + 100000,
      currentSupply: Math.floor(Math.random() * 9000000) + 90000,
      owner: '0x' + Math.random().toString(16).substring(2, 42),
      contractAddress: '0x' + Math.random().toString(16).substring(2, 42),
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      burned: Math.floor(Math.random() * 10000),
      minted: Math.floor(Math.random() * 1000000) + 100000,
      transfers: Math.floor(Math.random() * 50000) + 1000,
      holders: Math.floor(Math.random() * 5000) + 100,
      status: 'active',
    }));
  }

  private generateMockTransaction(
    type: 'mint' | 'burn' | 'transfer',
    request: any
  ): TokenTransaction {
    return {
      id: `tx-${Date.now()}`,
      tokenId: request.tokenId,
      type,
      from: request.from || '0x' + Math.random().toString(16).substring(2, 42),
      to: request.to || '0x' + Math.random().toString(16).substring(2, 42),
      amount: request.amount,
      timestamp: new Date().toISOString(),
      blockHeight: Math.floor(Math.random() * 1000000) + 1000000,
      transactionHash:
        '0x' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
      status: 'confirmed',
      memo: request.memo,
    };
  }

  private generateMockBalance(tokenId: string, address: string): TokenBalance {
    const balance = Math.random() * 10000;
    const locked = balance * 0.1;
    return {
      tokenId,
      address,
      balance,
      locked,
      available: balance - locked,
      lastUpdated: new Date().toISOString(),
    };
  }

  private generateMockStats(): TokenStats {
    return {
      totalTokens: Math.floor(Math.random() * 100) + 50,
      activeTokens: Math.floor(Math.random() * 80) + 40,
      totalSupply: Math.floor(Math.random() * 100000000) + 10000000,
      totalHolders: Math.floor(Math.random() * 50000) + 10000,
      totalTransfers: Math.floor(Math.random() * 1000000) + 100000,
      totalMinted: Math.floor(Math.random() * 50000000) + 5000000,
      totalBurned: Math.floor(Math.random() * 1000000) + 100000,
    };
  }
}

export const tokenService = new TokenService();
export default TokenService;

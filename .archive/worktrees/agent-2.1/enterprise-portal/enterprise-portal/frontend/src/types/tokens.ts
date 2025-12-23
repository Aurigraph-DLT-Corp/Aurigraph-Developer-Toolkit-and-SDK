/**
 * Token Management Type Definitions
 *
 * Types for token creation, management, and operations
 */

export interface Token {
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  currentSupply: number;
  owner: string;
  contractAddress: string;
  createdAt: string;
  updatedAt: string;
  burned: number;
  minted: number;
  transfers: number;
  holders: number;
  status: 'active' | 'paused' | 'frozen';
  metadata?: {
    description?: string;
    website?: string;
    logo?: string;
    tags?: string[];
  };
}

export interface TokenCreateRequest {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: number;
  maxSupply?: number;
  mintable: boolean;
  burnable: boolean;
  pausable: boolean;
  metadata?: {
    description?: string;
    website?: string;
    logo?: string;
    tags?: string[];
  };
}

export interface TokenTransferRequest {
  tokenId: string;
  from: string;
  to: string;
  amount: number;
  memo?: string;
}

export interface TokenMintRequest {
  tokenId: string;
  amount: number;
  to: string;
  memo?: string;
}

export interface TokenBurnRequest {
  tokenId: string;
  amount: number;
  from: string;
  memo?: string;
}

export interface TokenBalance {
  tokenId: string;
  address: string;
  balance: number;
  locked: number;
  available: number;
  lastUpdated: string;
}

export interface TokenTransaction {
  id: string;
  tokenId: string;
  type: 'mint' | 'burn' | 'transfer';
  from: string;
  to: string;
  amount: number;
  timestamp: string;
  blockHeight: number;
  transactionHash: string;
  status: 'confirmed' | 'pending' | 'failed';
  memo?: string;
}

export interface TokenStats {
  totalTokens: number;
  activeTokens: number;
  totalSupply: number;
  totalHolders: number;
  totalTransfers: number;
  totalMinted: number;
  totalBurned: number;
}

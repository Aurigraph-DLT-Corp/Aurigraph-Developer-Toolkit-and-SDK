/**
 * Aurigraph DLT React Native SDK
 * 
 * Cross-platform mobile SDK for Aurigraph V11 blockchain
 * with quantum-resistant cryptography and AI-driven consensus
 */

import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package '@aurigraph/react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n';

const AurigraphSDK = NativeModules.AurigraphSDK
  ? NativeModules.AurigraphSDK
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

// Types
export interface AurigraphConfiguration {
  networkEndpoint: string;
  grpcPort: number;
  environment: 'mainnet' | 'testnet' | 'development';
  enableBiometrics: boolean;
  enableOfflineMode: boolean;
  debugMode: boolean;
}

export interface Wallet {
  id: string;
  name: string;
  address: string;
  publicKey: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  data?: string;
  gasLimit: number;
  gasPrice: string;
  nonce: number;
  fee: string;
  status: TransactionStatus;
  hash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignedTransaction {
  transaction: Transaction;
  signature: string;
  hash: string;
  signedAt: string;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  gasUsed: number;
  effectiveGasPrice: string;
  status: TransactionStatus;
  confirmations: number;
  timestamp: string;
}

export interface BridgeRequest {
  fromChain: string;
  toChain: string;
  amount: string;
  recipientAddress: string;
  tokenAddress?: string;
}

export interface BridgeTransaction {
  id: string;
  request: BridgeRequest;
  status: BridgeStatus;
  sourceTransactionHash?: string;
  targetTransactionHash?: string;
  estimatedCompletionTime: string;
  createdAt: string;
}

export type TransactionStatus = 
  | 'created' 
  | 'signed' 
  | 'broadcasted' 
  | 'pending' 
  | 'confirmed' 
  | 'failed';

export type BridgeStatus = 
  | 'initiated' 
  | 'deposited' 
  | 'validated' 
  | 'minted' 
  | 'completed' 
  | 'failed';

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'voice' | 'none';

// SDK Class
export class Aurigraph {
  private static instance: Aurigraph;
  private isInitialized = false;

  /**
   * Get singleton instance
   */
  public static getInstance(): Aurigraph {
    if (!Aurigraph.instance) {
      Aurigraph.instance = new Aurigraph();
    }
    return Aurigraph.instance;
  }

  /**
   * Initialize the SDK
   */
  public async initialize(config: AurigraphConfiguration): Promise<void> {
    if (this.isInitialized) {
      throw new Error('SDK already initialized');
    }

    await AurigraphSDK.initialize(config);
    this.isInitialized = true;
  }

  /**
   * Check if SDK is initialized
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get SDK version
   */
  public static get version(): string {
    return AurigraphSDK.getVersion();
  }

  /**
   * Check biometric availability
   */
  public async getBiometricType(): Promise<BiometricType> {
    return AurigraphSDK.getBiometricType();
  }

  // Wallet Management
  public async createWallet(
    name: string,
    passcode?: string,
    useBiometrics: boolean = true
  ): Promise<Wallet> {
    this.ensureInitialized();
    return AurigraphSDK.createWallet(name, passcode, useBiometrics);
  }

  public async importWallet(
    name: string,
    privateKey: string,
    passcode?: string,
    useBiometrics: boolean = true
  ): Promise<Wallet> {
    this.ensureInitialized();
    return AurigraphSDK.importWallet(name, privateKey, passcode, useBiometrics);
  }

  public async loadWallet(
    id: string,
    passcode?: string,
    useBiometrics: boolean = true
  ): Promise<Wallet> {
    this.ensureInitialized();
    return AurigraphSDK.loadWallet(id, passcode, useBiometrics);
  }

  public async listWallets(): Promise<Wallet[]> {
    this.ensureInitialized();
    return AurigraphSDK.listWallets();
  }

  public async deleteWallet(
    id: string,
    passcode?: string,
    useBiometrics: boolean = true
  ): Promise<void> {
    this.ensureInitialized();
    return AurigraphSDK.deleteWallet(id, passcode, useBiometrics);
  }

  public async exportPrivateKey(
    walletId: string,
    passcode?: string,
    useBiometrics: boolean = true
  ): Promise<string> {
    this.ensureInitialized();
    return AurigraphSDK.exportPrivateKey(walletId, passcode, useBiometrics);
  }

  // Transaction Management
  public async createTransaction(
    from: string,
    to: string,
    amount: string,
    data?: string,
    gasLimit: number = 21000,
    gasPrice?: string
  ): Promise<Transaction> {
    this.ensureInitialized();
    return AurigraphSDK.createTransaction(from, to, amount, data, gasLimit, gasPrice);
  }

  public async signTransaction(
    transaction: Transaction,
    walletId: string,
    passcode?: string,
    useBiometrics: boolean = true
  ): Promise<SignedTransaction> {
    this.ensureInitialized();
    return AurigraphSDK.signTransaction(transaction, walletId, passcode, useBiometrics);
  }

  public async broadcastTransaction(signedTransaction: SignedTransaction): Promise<string> {
    this.ensureInitialized();
    return AurigraphSDK.broadcastTransaction(signedTransaction);
  }

  public async sendTransaction(
    from: string,
    to: string,
    amount: string,
    walletId: string,
    passcode?: string,
    useBiometrics: boolean = true,
    data?: string,
    gasLimit: number = 21000,
    gasPrice?: string
  ): Promise<string> {
    this.ensureInitialized();
    return AurigraphSDK.sendTransaction(
      from,
      to,
      amount,
      walletId,
      passcode,
      useBiometrics,
      data,
      gasLimit,
      gasPrice
    );
  }

  public async getTransactionStatus(hash: string): Promise<TransactionStatus> {
    this.ensureInitialized();
    return AurigraphSDK.getTransactionStatus(hash);
  }

  public async waitForConfirmation(
    hash: string,
    confirmations: number = 1,
    timeout: number = 300
  ): Promise<TransactionReceipt> {
    this.ensureInitialized();
    return AurigraphSDK.waitForConfirmation(hash, confirmations, timeout);
  }

  public async getTransactionReceipt(hash: string): Promise<TransactionReceipt> {
    this.ensureInitialized();
    return AurigraphSDK.getTransactionReceipt(hash);
  }

  public async getTransactionHistory(
    address: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Transaction[]> {
    this.ensureInitialized();
    return AurigraphSDK.getTransactionHistory(address, limit, offset);
  }

  // Balance and Gas
  public async getBalance(address: string): Promise<string> {
    this.ensureInitialized();
    return AurigraphSDK.getBalance(address);
  }

  public async estimateGas(
    from: string,
    to: string,
    amount: string,
    data?: string
  ): Promise<number> {
    this.ensureInitialized();
    return AurigraphSDK.estimateGas(from, to, amount, data);
  }

  public async getGasPrice(): Promise<string> {
    this.ensureInitialized();
    return AurigraphSDK.getGasPrice();
  }

  // Cross-Chain Bridge
  public async initiateBridge(request: BridgeRequest): Promise<BridgeTransaction> {
    this.ensureInitialized();
    return AurigraphSDK.initiateBridge(request);
  }

  public async getBridgeStatus(bridgeId: string): Promise<BridgeStatus> {
    this.ensureInitialized();
    return AurigraphSDK.getBridgeStatus(bridgeId);
  }

  public async getBridgeTransaction(bridgeId: string): Promise<BridgeTransaction> {
    this.ensureInitialized();
    return AurigraphSDK.getBridgeTransaction(bridgeId);
  }

  public async getSupportedChains(): Promise<string[]> {
    this.ensureInitialized();
    return AurigraphSDK.getSupportedChains();
  }

  public async getBridgeFee(request: BridgeRequest): Promise<string> {
    this.ensureInitialized();
    return AurigraphSDK.getBridgeFee(request);
  }

  // Offline Operations
  public async processOfflineTransactions(): Promise<void> {
    this.ensureInitialized();
    return AurigraphSDK.processOfflineTransactions();
  }

  public async getOfflineTransactionCount(): Promise<number> {
    this.ensureInitialized();
    return AurigraphSDK.getOfflineTransactionCount();
  }

  // Network Status
  public async getNetworkStatus(): Promise<{
    isConnected: boolean;
    isOfflineMode: boolean;
    blockHeight: number;
    peerCount: number;
  }> {
    this.ensureInitialized();
    return AurigraphSDK.getNetworkStatus();
  }

  // Shutdown
  public async shutdown(): Promise<void> {
    await AurigraphSDK.shutdown();
    this.isInitialized = false;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
  }
}

// Export default instance
export default Aurigraph.getInstance();

// Export all types
export * from './types';
export * from './components';
export * from './hooks';
export * from './utils';
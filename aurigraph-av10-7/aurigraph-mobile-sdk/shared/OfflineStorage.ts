/**
 * Offline Storage Manager
 * 
 * Handles offline transaction storage and synchronization across all platforms
 */

interface OfflineTransaction {
  id: string;
  signedTransaction: any; // Platform-specific signed transaction type
  timestamp: number;
  attempts: number;
  lastAttempt?: number;
  error?: string;
}

interface OfflineStorageConfig {
  maxRetryAttempts: number;
  retryInterval: number; // milliseconds
  maxStorageSize: number; // bytes
  encryptionKey?: string;
}

export class OfflineStorage {
  private config: OfflineStorageConfig;
  private storageKey = 'aurigraph_offline_transactions';
  private syncInProgress = false;

  constructor(config: Partial<OfflineStorageConfig> = {}) {
    this.config = {
      maxRetryAttempts: 3,
      retryInterval: 30000, // 30 seconds
      maxStorageSize: 10 * 1024 * 1024, // 10MB
      ...config,
    };
  }

  /**
   * Store transaction offline
   */
  async storeTransaction(signedTransaction: any): Promise<void> {
    const transaction: OfflineTransaction = {
      id: this.generateTransactionId(),
      signedTransaction,
      timestamp: Date.now(),
      attempts: 0,
    };

    const transactions = await this.getStoredTransactions();
    
    // Check storage limit
    const newSize = this.calculateStorageSize([...transactions, transaction]);
    if (newSize > this.config.maxStorageSize) {
      // Remove oldest transactions to make space
      await this.cleanupOldTransactions(transactions, newSize - this.config.maxStorageSize);
    }

    transactions.push(transaction);
    await this.saveTransactions(transactions);

    console.log(`Stored offline transaction: ${transaction.id}`);
  }

  /**
   * Get all stored offline transactions
   */
  async getStoredTransactions(): Promise<OfflineTransaction[]> {
    try {
      const stored = await this.getFromStorage(this.storageKey);
      if (!stored) return [];

      const decrypted = this.config.encryptionKey 
        ? this.decrypt(stored, this.config.encryptionKey)
        : stored;

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to load offline transactions:', error);
      return [];
    }
  }

  /**
   * Remove transaction from offline storage
   */
  async removeTransaction(transactionId: string): Promise<void> {
    const transactions = await this.getStoredTransactions();
    const filtered = transactions.filter(tx => tx.id !== transactionId);
    await this.saveTransactions(filtered);

    console.log(`Removed offline transaction: ${transactionId}`);
  }

  /**
   * Mark transaction attempt as failed
   */
  async markAttemptFailed(transactionId: string, error: string): Promise<void> {
    const transactions = await this.getStoredTransactions();
    const transaction = transactions.find(tx => tx.id === transactionId);
    
    if (transaction) {
      transaction.attempts++;
      transaction.lastAttempt = Date.now();
      transaction.error = error;

      await this.saveTransactions(transactions);
    }
  }

  /**
   * Get transactions ready for retry
   */
  async getTransactionsForRetry(): Promise<OfflineTransaction[]> {
    const transactions = await this.getStoredTransactions();
    const now = Date.now();

    return transactions.filter(tx => {
      // Don't retry if max attempts reached
      if (tx.attempts >= this.config.maxRetryAttempts) {
        return false;
      }

      // Check if enough time has passed since last attempt
      if (tx.lastAttempt && (now - tx.lastAttempt) < this.config.retryInterval) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get failed transactions that exceeded retry limit
   */
  async getFailedTransactions(): Promise<OfflineTransaction[]> {
    const transactions = await this.getStoredTransactions();
    return transactions.filter(tx => tx.attempts >= this.config.maxRetryAttempts);
  }

  /**
   * Clear failed transactions from storage
   */
  async clearFailedTransactions(): Promise<number> {
    const transactions = await this.getStoredTransactions();
    const failed = transactions.filter(tx => tx.attempts >= this.config.maxRetryAttempts);
    const remaining = transactions.filter(tx => tx.attempts < this.config.maxRetryAttempts);
    
    await this.saveTransactions(remaining);
    
    console.log(`Cleared ${failed.length} failed transactions`);
    return failed.length;
  }

  /**
   * Start automatic synchronization when network is available
   */
  async startSync(networkManager: any): Promise<void> {
    if (this.syncInProgress) return;

    this.syncInProgress = true;
    console.log('Starting offline transaction sync...');

    try {
      const transactionsToRetry = await this.getTransactionsForRetry();
      console.log(`Found ${transactionsToRetry.length} transactions to retry`);

      for (const transaction of transactionsToRetry) {
        try {
          // Attempt to broadcast transaction
          await networkManager.broadcastTransaction(transaction.signedTransaction);
          
          // Remove from offline storage on success
          await this.removeTransaction(transaction.id);
          
          console.log(`Successfully synced offline transaction: ${transaction.id}`);
        } catch (error: any) {
          console.warn(`Failed to sync transaction ${transaction.id}:`, error.message);
          
          // Mark attempt as failed
          await this.markAttemptFailed(transaction.id, error.message);
        }
      }

      // Clean up old failed transactions
      await this.cleanupFailedTransactions();

    } finally {
      this.syncInProgress = false;
      console.log('Offline transaction sync completed');
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    storageSize: number;
    oldestTransaction?: number;
  }> {
    const transactions = await this.getStoredTransactions();
    const pending = transactions.filter(tx => tx.attempts < this.config.maxRetryAttempts);
    const failed = transactions.filter(tx => tx.attempts >= this.config.maxRetryAttempts);
    const storageSize = this.calculateStorageSize(transactions);
    const oldestTransaction = transactions.length > 0 
      ? Math.min(...transactions.map(tx => tx.timestamp))
      : undefined;

    return {
      totalTransactions: transactions.length,
      pendingTransactions: pending.length,
      failedTransactions: failed.length,
      storageSize,
      oldestTransaction,
    };
  }

  /**
   * Export offline transactions for debugging
   */
  async exportTransactions(): Promise<string> {
    const transactions = await this.getStoredTransactions();
    return JSON.stringify(transactions, null, 2);
  }

  /**
   * Import transactions (for testing or recovery)
   */
  async importTransactions(transactionsJson: string): Promise<number> {
    try {
      const transactions: OfflineTransaction[] = JSON.parse(transactionsJson);
      const existing = await this.getStoredTransactions();
      
      // Merge with existing, avoiding duplicates
      const merged = [...existing];
      let imported = 0;
      
      for (const tx of transactions) {
        if (!existing.find(existing => existing.id === tx.id)) {
          merged.push(tx);
          imported++;
        }
      }
      
      await this.saveTransactions(merged);
      console.log(`Imported ${imported} offline transactions`);
      
      return imported;
    } catch (error) {
      console.error('Failed to import transactions:', error);
      throw new Error('Invalid transaction data format');
    }
  }

  // Private methods

  private async saveTransactions(transactions: OfflineTransaction[]): Promise<void> {
    const data = JSON.stringify(transactions);
    const encrypted = this.config.encryptionKey 
      ? this.encrypt(data, this.config.encryptionKey)
      : data;
    
    await this.saveToStorage(this.storageKey, encrypted);
  }

  private calculateStorageSize(transactions: OfflineTransaction[]): number {
    return JSON.stringify(transactions).length;
  }

  private async cleanupOldTransactions(
    transactions: OfflineTransaction[], 
    bytesToFree: number
  ): Promise<void> {
    // Sort by timestamp (oldest first)
    const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    let freedBytes = 0;
    let removed = 0;

    for (const tx of sorted) {
      const txSize = JSON.stringify(tx).length;
      freedBytes += txSize;
      removed++;

      if (freedBytes >= bytesToFree) {
        break;
      }
    }

    const remaining = sorted.slice(removed);
    await this.saveTransactions(remaining);

    console.log(`Cleaned up ${removed} old transactions, freed ${freedBytes} bytes`);
  }

  private async cleanupFailedTransactions(): Promise<void> {
    const transactions = await this.getStoredTransactions();
    const now = Date.now();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    const filtered = transactions.filter(tx => {
      // Remove failed transactions older than maxAge
      if (tx.attempts >= this.config.maxRetryAttempts) {
        return (now - tx.timestamp) < maxAge;
      }
      return true;
    });

    if (filtered.length < transactions.length) {
      await this.saveTransactions(filtered);
      console.log(`Cleaned up ${transactions.length - filtered.length} old failed transactions`);
    }
  }

  private generateTransactionId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Platform-specific storage methods (to be implemented by platform)

  private async getFromStorage(key: string): Promise<string | null> {
    // Platform-specific implementation
    if (typeof localStorage !== 'undefined') {
      // Browser/React Native
      return localStorage.getItem(key);
    } else if (typeof require !== 'undefined') {
      // Node.js/React Native
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem(key);
      } catch {
        // Fallback for testing
        return null;
      }
    }
    return null;
  }

  private async saveToStorage(key: string, value: string): Promise<void> {
    // Platform-specific implementation
    if (typeof localStorage !== 'undefined') {
      // Browser/React Native
      localStorage.setItem(key, value);
    } else if (typeof require !== 'undefined') {
      // Node.js/React Native
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.error('Failed to save to storage:', error);
      }
    }
  }

  private encrypt(data: string, key: string): string {
    // Simple XOR encryption for demo purposes
    // In production, use proper encryption like AES
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted);
  }

  private decrypt(encrypted: string, key: string): string {
    const data = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return decrypted;
  }
}

// Network state management for automatic sync
export class NetworkStateManager {
  private offlineStorage: OfflineStorage;
  private networkManager: any;
  private isOnline = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor(offlineStorage: OfflineStorage, networkManager: any) {
    this.offlineStorage = offlineStorage;
    this.networkManager = networkManager;
    this.setupNetworkListener();
  }

  private setupNetworkListener(): void {
    // Browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      this.isOnline = navigator.onLine;
    }

    // React Native environment
    if (typeof require !== 'undefined') {
      try {
        const NetInfo = require('@react-native-netinfo/netinfo').default;
        NetInfo.addEventListener((state: any) => {
          const online = state.isConnected && state.isInternetReachable;
          if (online !== this.isOnline) {
            this.isOnline = online;
            if (online) {
              this.handleOnline();
            } else {
              this.handleOffline();
            }
          }
        });
      } catch {
        // NetInfo not available
      }
    }
  }

  private async handleOnline(): Promise<void> {
    console.log('Network connection restored');
    this.isOnline = true;
    
    // Notify listeners
    this.listeners.forEach(listener => listener(true));
    
    // Start syncing offline transactions
    try {
      await this.offlineStorage.startSync(this.networkManager);
    } catch (error) {
      console.error('Failed to sync offline transactions:', error);
    }
  }

  private handleOffline(): void {
    console.log('Network connection lost - entering offline mode');
    this.isOnline = false;
    
    // Notify listeners
    this.listeners.forEach(listener => listener(false));
  }

  public addListener(listener: (isOnline: boolean) => void): void {
    this.listeners.add(listener);
  }

  public removeListener(listener: (isOnline: boolean) => void): void {
    this.listeners.delete(listener);
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.offlineStorage.startSync(this.networkManager);
    } else {
      throw new Error('Cannot sync while offline');
    }
  }
}
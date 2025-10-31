/**
 * Transaction Monitor Example
 *
 * This example demonstrates real-time transaction monitoring using the Aurigraph SDK.
 * It shows how to:
 * - Subscribe to blockchain events
 * - Track transaction status in real-time
 * - Watch specific addresses for activity
 * - Retrieve transaction history
 */

import { AurigraphClient, AuthCredentials } from '../src/index';

// Configuration
const config = {
  baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY || 'your-api-key'
  } as AuthCredentials
};

interface TransactionSummary {
  hash: string;
  from: string;
  to: string;
  value: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  gasUsed?: string;
  blockNumber?: number;
}

class TransactionMonitor {
  private client: AurigraphClient;
  private monitoredAddresses: Set<string> = new Set();
  private transactionCache: Map<string, TransactionSummary> = new Map();

  constructor(clientConfig: any) {
    this.client = new AurigraphClient(clientConfig);
  }

  /**
   * Start monitoring blockchain for transactions
   */
  async startMonitoring(): Promise<void> {
    console.log('Starting transaction monitoring...');

    try {
      // Subscribe to all blockchain events
      await this.client.subscribeToEvents({
        eventTypes: ['transaction_created', 'transaction_confirmed', 'transaction_failed'],
        onEvent: (event) => this.handleTransactionEvent(event),
        onError: (error) => console.error('Event subscription error:', error),
        onClose: () => console.log('Event subscription closed')
      });

      console.log('✅ Transaction monitoring started');
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      throw error;
    }
  }

  /**
   * Watch a specific address for transactions
   */
  async watchAddress(address: string): Promise<void> {
    console.log(`👁️  Watching address: ${address}`);
    this.monitoredAddresses.add(address);

    try {
      // Get initial transaction history
      const transactions = await this.client.getTransactions(address, {
        limit: 50,
        offset: 0
      });

      console.log(`📊 Address history: ${transactions.data.length} recent transactions`);
      transactions.data.forEach(tx => {
        this.cacheTransaction(tx);
      });
    } catch (error) {
      console.error(`❌ Failed to fetch address history for ${address}:`, error);
    }
  }

  /**
   * Get transaction history for an address
   */
  async getAddressHistory(address: string, limit: number = 100): Promise<TransactionSummary[]> {
    try {
      const response = await this.client.getTransactions(address, { limit });
      return response.data.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        status: tx.status as any,
        timestamp: tx.timestamp,
        gasUsed: tx.gasUsed?.toString(),
        blockNumber: tx.blockNumber
      }));
    } catch (error) {
      console.error(`Failed to get history for ${address}:`, error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific transaction
   */
  async getTransactionDetails(txHash: string): Promise<any> {
    try {
      const tx = await this.client.getTransaction(txHash);
      const receipt = await this.client.getTransactionReceipt(txHash);

      return {
        transaction: tx,
        receipt: receipt,
        details: {
          isSuccessful: receipt.status === 1,
          gasPrice: tx.gasPrice?.toString(),
          totalCost: (BigInt(tx.gasPrice || 0) * BigInt(receipt.gasUsed || 0)).toString(),
          confirmations: receipt.confirmations || 0
        }
      };
    } catch (error) {
      console.error(`Failed to get transaction details for ${txHash}:`, error);
      return null;
    }
  }

  /**
   * Get account information
   */
  async getAddressInfo(address: string): Promise<any> {
    try {
      const [account, balance] = await Promise.all([
        this.client.getAccount(address),
        this.client.getBalance(address)
      ]);

      return {
        address,
        balance: balance.balance.toString(),
        nonce: account.nonce,
        isContract: account.isContract,
        codeHash: account.codeHash
      };
    } catch (error) {
      console.error(`Failed to get address info for ${address}:`, error);
      return null;
    }
  }

  /**
   * Handle transaction event
   */
  private handleTransactionEvent(event: any): void {
    const { type, data } = event;

    switch (type) {
      case 'transaction_created':
        this.handleTransactionCreated(data);
        break;
      case 'transaction_confirmed':
        this.handleTransactionConfirmed(data);
        break;
      case 'transaction_failed':
        this.handleTransactionFailed(data);
        break;
    }
  }

  /**
   * Handle newly created transaction
   */
  private handleTransactionCreated(data: any): void {
    const { hash, from, to, value } = data;

    console.log(`\n📝 New Transaction Created`);
    console.log(`   Hash: ${hash}`);
    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);
    console.log(`   Value: ${value}`);

    // Check if we're watching this address
    if (this.monitoredAddresses.has(from) || this.monitoredAddresses.has(to)) {
      console.log(`   ⭐ WATCHED ADDRESS INVOLVED`);
    }

    this.cacheTransaction(data);
  }

  /**
   * Handle confirmed transaction
   */
  private handleTransactionConfirmed(data: any): void {
    const { hash, blockNumber, gasUsed } = data;

    console.log(`\n✅ Transaction Confirmed`);
    console.log(`   Hash: ${hash}`);
    console.log(`   Block: ${blockNumber}`);
    console.log(`   Gas Used: ${gasUsed}`);

    const cached = this.transactionCache.get(hash);
    if (cached) {
      cached.status = 'confirmed';
      cached.blockNumber = blockNumber;
      cached.gasUsed = gasUsed;
    }
  }

  /**
   * Handle failed transaction
   */
  private handleTransactionFailed(data: any): void {
    const { hash, reason } = data;

    console.log(`\n❌ Transaction Failed`);
    console.log(`   Hash: ${hash}`);
    console.log(`   Reason: ${reason}`);

    const cached = this.transactionCache.get(hash);
    if (cached) {
      cached.status = 'failed';
    }
  }

  /**
   * Cache transaction for quick lookup
   */
  private cacheTransaction(tx: any): void {
    this.transactionCache.set(tx.hash, {
      hash: tx.hash,
      from: tx.from,
      to: tx.to || '',
      value: tx.value.toString(),
      status: tx.status || 'pending',
      timestamp: tx.timestamp,
      gasUsed: tx.gasUsed?.toString(),
      blockNumber: tx.blockNumber
    });
  }

  /**
   * Get statistics
   */
  getStatistics(): any {
    const transactions = Array.from(this.transactionCache.values());
    const confirmed = transactions.filter(t => t.status === 'confirmed').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const failed = transactions.filter(t => t.status === 'failed').length;

    return {
      totalCached: transactions.length,
      confirmed,
      pending,
      failed,
      watchedAddresses: this.monitoredAddresses.size
    };
  }

  /**
   * Print current statistics
   */
  printStatistics(): void {
    const stats = this.getStatistics();
    console.log('\n📊 Transaction Monitor Statistics:');
    console.log(`   Total Transactions: ${stats.totalCached}`);
    console.log(`   Confirmed: ${stats.confirmed}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Watched Addresses: ${stats.watchedAddresses}`);
  }
}

/**
 * Main execution
 */
async function main() {
  const monitor = new TransactionMonitor(config);

  try {
    // Start monitoring
    await monitor.startMonitoring();

    // Watch some addresses
    const addresses = [
      '0x1234567890123456789012345678901234567890',
      '0x0987654321098765432109876543210987654321'
    ];

    for (const address of addresses) {
      await monitor.watchAddress(address);
    }

    // Get address info
    console.log('\n📋 Address Information:');
    for (const address of addresses) {
      const info = await monitor.getAddressInfo(address);
      if (info) {
        console.log(`\n${address}:`);
        console.log(`  Balance: ${info.balance}`);
        console.log(`  Nonce: ${info.nonce}`);
        console.log(`  Is Contract: ${info.isContract}`);
      }
    }

    // Print statistics periodically
    setInterval(() => {
      monitor.printStatistics();
    }, 30000);

    console.log('\n🚀 Transaction monitor running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { TransactionMonitor };

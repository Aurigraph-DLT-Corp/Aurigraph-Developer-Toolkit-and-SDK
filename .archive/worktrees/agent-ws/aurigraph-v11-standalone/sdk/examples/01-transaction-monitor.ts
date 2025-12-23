/**
 * Example 1: Real-Time Transaction Monitor
 *
 * Monitor blockchain transactions in real-time using event streaming.
 * Tracks transaction status changes from pending → confirmed.
 */

import { AurigraphClient, EventType } from '../src/index';

class TransactionMonitor {
  private client: AurigraphClient;
  private watchedAddresses: Set<string> = new Set();
  private transactionCache: Map<string, any> = new Map();

  constructor(baseURL: string, apiKey: string) {
    this.client = new AurigraphClient({
      baseURL,
      auth: { apiKey },
      debug: true,
      timeout: 30000,
    });
  }

  /**
   * Start monitoring transactions
   */
  async startMonitoring(): Promise<void> {
    console.log('🚀 Starting transaction monitor...');

    try {
      // Get network status
      const status = await this.client.getNetworkStatus();
      console.log(`📊 Network Status:`);
      console.log(`   Current Height: ${status.currentHeight}`);
      console.log(`   Current TPS: ${status.tps}`);
      console.log(`   Active Validators: ${status.validators}`);

      // Subscribe to transaction events
      await this.client.subscribeToEvents(
        ['transaction.created', 'transaction.confirmed', 'transaction.failed'],
        (event) => this.handleTransactionEvent(event),
        (error) => this.handleError(error)
      );

      // Keep listening for events
      console.log('✅ Connected to event stream. Listening for transactions...\n');
    } catch (error) {
      console.error('❌ Failed to start monitoring:', error);
      process.exit(1);
    }
  }

  /**
   * Handle incoming transaction events
   */
  private async handleTransactionEvent(event: any): Promise<void> {
    const { type, data } = event;
    const txHash = data.hash;

    console.log(`\n📨 Event: ${type}`);
    console.log(`   Hash: ${txHash}`);

    switch (type) {
      case 'transaction.created':
        await this.handleTransactionCreated(data);
        break;
      case 'transaction.confirmed':
        await this.handleTransactionConfirmed(data);
        break;
      case 'transaction.failed':
        await this.handleTransactionFailed(data);
        break;
    }
  }

  /**
   * Handle newly created transaction
   */
  private async handleTransactionCreated(data: any): Promise<void> {
    const { hash, from, to, value } = data;

    console.log(`   📤 From: ${from}`);
    console.log(`   📥 To: ${to || 'Contract Deployment'}`);
    console.log(`   💰 Value: ${value}`);
    console.log(`   ⏳ Status: PENDING`);

    // Cache transaction
    this.transactionCache.set(hash, {
      ...data,
      status: 'pending',
      createdAt: new Date(),
    });

    // Watch for confirmation
    if (this.watchedAddresses.has(from)) {
      console.log(`   ⭐ Watched address detected!`);
    }
  }

  /**
   * Handle confirmed transaction
   */
  private async handleTransactionConfirmed(data: any): Promise<void> {
    const { hash, blockNumber, gasUsed } = data;

    const cached = this.transactionCache.get(hash);
    if (cached) {
      cached.status = 'confirmed';
      cached.blockNumber = blockNumber;
      cached.gasUsed = gasUsed;

      console.log(`   ✅ Block: ${blockNumber}`);
      console.log(`   ⛽ Gas Used: ${gasUsed}`);
      console.log(`   ⏱️  Confirmation Time: ${this.getElapsedTime(cached.createdAt)}`);
    }
  }

  /**
   * Handle failed transaction
   */
  private async handleTransactionFailed(data: any): Promise<void> {
    const { hash, reason } = data;

    const cached = this.transactionCache.get(hash);
    if (cached) {
      cached.status = 'failed';

      console.log(`   ❌ Reason: ${reason}`);
      console.log(`   ⏱️  Failed After: ${this.getElapsedTime(cached.createdAt)}`);
    }
  }

  /**
   * Add address to watch list
   */
  watchAddress(address: string): void {
    this.watchedAddresses.add(address.toLowerCase());
    console.log(`👁️  Now watching address: ${address}`);
  }

  /**
   * Get transaction history for address
   */
  async getAddressHistory(address: string, limit: number = 20): Promise<void> {
    try {
      console.log(`\n📜 Transaction History for ${address}`);

      const transactions = await this.client.getTransactions(address, {
        limit,
        sort: 'desc',
      });

      console.log(`Found ${transactions.total} total transactions\n`);

      for (const tx of transactions.data) {
        console.log(`${tx.hash.slice(0, 10)}...`);
        console.log(`  Status: ${tx.status}`);
        console.log(`  From: ${tx.from === address ? '↙️' : '➡️'} ${tx.from}`);
        if (tx.to) {
          console.log(`  To: ${tx.to === address ? '↙️' : '⬅️'} ${tx.to}`);
        }
        console.log(`  Value: ${tx.value}`);
        console.log(`  Block: ${tx.blockNumber || 'Pending'}\n`);
      }
    } catch (error) {
      console.error('Failed to get transaction history:', error);
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetails(hash: string): Promise<void> {
    try {
      console.log(`\n🔍 Transaction Details: ${hash}`);

      const tx = await this.client.getTransaction(hash);

      console.log(`\nBasic Info:`);
      console.log(`  Hash: ${tx.hash}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  Status: ${tx.status}`);
      console.log(`  Nonce: ${tx.nonce}`);

      console.log(`\nParties:`);
      console.log(`  From: ${tx.from}`);
      console.log(`  To: ${tx.to || 'N/A (Contract Deployment)'}`);

      console.log(`\nValue & Fees:`);
      console.log(`  Value: ${tx.value}`);
      console.log(`  Fee: ${tx.fee}`);

      console.log(`\nBlock Info:`);
      if (tx.blockNumber) {
        console.log(`  Block Number: ${tx.blockNumber}`);
        console.log(`  Block Hash: ${tx.blockHash}`);
        console.log(`  Gas Used: ${tx.gasUsed}`);
      } else {
        console.log(`  Status: PENDING`);
      }

      console.log(`\nTimestamp: ${new Date(tx.timestamp * 1000).toISOString()}`);
    } catch (error) {
      console.error('Failed to get transaction details:', error);
    }
  }

  /**
   * Get balance and nonce for address
   */
  async getAddressInfo(address: string): Promise<void> {
    try {
      console.log(`\n ℹ️  Address Info: ${address}`);

      const [balance, account, nonce] = await Promise.all([
        this.client.getBalance(address),
        this.client.getAccount(address),
        this.client.getNonce(address),
      ]);

      console.log(`  Balance: ${balance}`);
      console.log(`  Nonce: ${nonce}`);
      console.log(`  Account Exists: ${account ? 'Yes' : 'No'}`);
    } catch (error) {
      console.error('Failed to get address info:', error);
    }
  }

  /**
   * Helper: Format elapsed time
   */
  private getElapsedTime(startDate: Date): string {
    const elapsed = Date.now() - startDate.getTime();
    const seconds = Math.floor(elapsed / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  /**
   * Handle errors
   */
  private handleError(error: any): void {
    console.error(`\n⚠️  Error:`, error.message);
    if (error.code === 'RATE_LIMIT_ERROR') {
      console.error(`   Retry after: ${error.retryAfter}ms`);
    }
  }

  /**
   * Close monitoring
   */
  close(): void {
    this.client.close();
    console.log('\n👋 Monitor closed');
  }
}

// ==================== Main Execution ====================

async function main() {
  const BASE_URL = process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003';
  const API_KEY = process.env.AURIGRAPH_API_KEY || 'demo-key';

  const monitor = new TransactionMonitor(BASE_URL, API_KEY);

  try {
    // Start monitoring
    await monitor.startMonitoring();

    // Get some initial data
    const address = '0x1234567890123456789012345678901234567890';
    await monitor.getAddressInfo(address);
    await monitor.watchAddress(address);

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      monitor.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    monitor.close();
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { TransactionMonitor };

/**
 * Metrics Dashboard Example (Template)
 *
 * This template demonstrates building a real-time metrics dashboard using the Aurigraph SDK.
 * It shows how to:
 * - Fetch network metrics
 * - Monitor validator performance
 * - Track blockchain statistics
 * - Display real-time updates
 */

import { AurigraphClient, AuthCredentials } from '../src/index';

// Configuration
const config = {
  baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY || 'your-api-key'
  } as AuthCredentials
};

interface NetworkMetrics {
  currentHeight: number;
  tps: number;
  totalTransactions: number;
  totalBlocks: number;
  activeValidators: number;
  networkTime: number;
}

interface ValidatorMetrics {
  address: string;
  name: string;
  status: string;
  votingPower: number;
  blocksProposed: number;
  blocksMissed: number;
  uptime: number;
  performance: number;
}

class MetricsDashboard {
  private client: AurigraphClient;
  private metrics: NetworkMetrics | null = null;
  private validators: ValidatorMetrics[] = [];

  constructor(clientConfig: any) {
    this.client = new AurigraphClient(clientConfig);
  }

  /**
   * Fetch current network metrics
   */
  async fetchNetworkMetrics(): Promise<NetworkMetrics> {
    try {
      console.log('📊 Fetching network metrics...');

      const metrics = await this.client.getNetworkMetrics();
      const status = await this.client.getNetworkStatus();

      this.metrics = {
        currentHeight: status.currentHeight,
        tps: metrics.tps || 0,
        totalTransactions: metrics.totalTransactions || 0,
        totalBlocks: metrics.totalBlocks || 0,
        activeValidators: metrics.activeValidators || 0,
        networkTime: Date.now()
      };

      return this.metrics;
    } catch (error) {
      console.error('❌ Failed to fetch network metrics:', error);
      throw error;
    }
  }

  /**
   * Fetch validator performance metrics
   */
  async fetchValidatorMetrics(): Promise<ValidatorMetrics[]> {
    try {
      console.log('🔗 Fetching validator metrics...');

      const validators = await this.client.listValidators({
        limit: 100
      });

      this.validators = await Promise.all(
        validators.data.map(async (validator: any) => {
          try {
            const performance = await this.client.getValidatorPerformance(
              validator.address
            );

            return {
              address: validator.address,
              name: validator.name || 'Unknown',
              status: validator.status,
              votingPower: validator.votingPower || 0,
              blocksProposed: performance.blocksProposed || 0,
              blocksMissed: performance.blocksMissed || 0,
              uptime: performance.uptime || 0,
              performance: performance.performanceScore || 0
            };
          } catch (error) {
            return {
              address: validator.address,
              name: validator.name || 'Unknown',
              status: 'error',
              votingPower: 0,
              blocksProposed: 0,
              blocksMissed: 0,
              uptime: 0,
              performance: 0
            };
          }
        })
      );

      return this.validators;
    } catch (error) {
      console.error('❌ Failed to fetch validator metrics:', error);
      throw error;
    }
  }

  /**
   * Get real-time blockchain statistics
   */
  async getBlockchainStats(): Promise<any> {
    try {
      if (!this.metrics) {
        await this.fetchNetworkMetrics();
      }

      const latestBlock = await this.client.getLatestBlock();

      return {
        currentHeight: this.metrics?.currentHeight || 0,
        latestBlockTime: latestBlock.timestamp,
        tps: this.metrics?.tps || 0,
        totalTransactions: this.metrics?.totalTransactions || 0,
        averageBlockTime: this.calculateAverageBlockTime(),
        estimatedTPS: this.estimateTPS(latestBlock)
      };
    } catch (error) {
      console.error('❌ Failed to get blockchain stats:', error);
      return {};
    }
  }

  /**
   * Calculate average block time
   */
  private calculateAverageBlockTime(): number {
    // TODO: Implement block time calculation
    // This would calculate average block time over last N blocks
    return 0;
  }

  /**
   * Estimate transactions per second
   */
  private estimateTPS(latestBlock: any): number {
    if (!latestBlock.transactions) return 0;
    // Estimate based on transactions per block
    return latestBlock.transactions.length * 10; // Assuming 10 blocks per second
  }

  /**
   * Display dashboard
   */
  async displayDashboard(): Promise<void> {
    try {
      console.clear();

      // Fetch metrics
      await this.fetchNetworkMetrics();
      await this.fetchValidatorMetrics();
      const stats = await this.getBlockchainStats();

      // Display header
      console.log('╔' + '═'.repeat(78) + '╗');
      console.log('║' + ' '.repeat(20) + 'AURIGRAPH BLOCKCHAIN METRICS DASHBOARD' + ' '.repeat(20) + '║');
      console.log('╚' + '═'.repeat(78) + '╝\n');

      // Network metrics
      console.log('📊 NETWORK METRICS');
      console.log('─'.repeat(40));
      console.log(`Current Height:      ${stats.currentHeight}`);
      console.log(`TPS:                 ${stats.tps.toFixed(0)} tx/s`);
      console.log(`Total Transactions:  ${stats.totalTransactions}`);
      console.log(`Average Block Time:  ${stats.averageBlockTime.toFixed(2)}s\n`);

      // Validator metrics
      console.log('🔗 TOP 10 VALIDATORS');
      console.log('─'.repeat(40));
      this.validators.slice(0, 10).forEach((v, i) => {
        console.log(
          `${i + 1}. ${v.name.padEnd(20)} | ` +
          `Power: ${v.votingPower.toString().padStart(8)} | ` +
          `Uptime: ${v.uptime.toFixed(1)}%`
        );
      });

      console.log('\n📈 VALIDATOR PERFORMANCE');
      console.log('─'.repeat(40));
      const avgPerformance = this.validators.length > 0
        ? this.validators.reduce((sum, v) => sum + v.performance, 0) / this.validators.length
        : 0;
      console.log(`Average Performance:  ${avgPerformance.toFixed(1)}/100`);
      console.log(`Active Validators:    ${this.metrics?.activeValidators || 0}`);

      console.log('\n' + '─'.repeat(80));
      console.log(`Last Updated: ${new Date().toLocaleTimeString()}`);
      console.log('Press Ctrl+C to exit\n');
    } catch (error) {
      console.error('❌ Failed to display dashboard:', error);
    }
  }

  /**
   * Start real-time dashboard (updates every interval)
   */
  async startDashboard(updateInterval: number = 5000): Promise<void> {
    console.log('🚀 Starting metrics dashboard...');

    // Initial display
    await this.displayDashboard();

    // Update periodically
    setInterval(async () => {
      await this.displayDashboard();
    }, updateInterval);
  }

  /**
   * Get validator rankings
   */
  getRankedValidators(): ValidatorMetrics[] {
    return [...this.validators].sort((a, b) => b.performance - a.performance);
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      network: this.metrics,
      validators: this.validators,
      ranking: this.getRankedValidators()
    };
  }
}

/**
 * Main execution (template)
 */
async function main() {
  const dashboard = new MetricsDashboard(config);

  try {
    // Start dashboard with 5-second updates
    await dashboard.startDashboard(5000);

    // Optional: Export metrics periodically
    // setInterval(() => {
    //   const metrics = dashboard.exportMetrics();
    //   console.log('Exported metrics:', JSON.stringify(metrics, null, 2));
    // }, 30000);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { MetricsDashboard };

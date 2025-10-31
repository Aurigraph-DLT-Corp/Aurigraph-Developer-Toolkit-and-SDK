/**
 * Real-World Asset (RWA) Portfolio Tracker Example
 *
 * This example demonstrates RWA portfolio management using the Aurigraph SDK.
 * It shows how to:
 * - Fetch RWA assets and portfolio information
 * - Analyze asset diversification
 * - Calculate portfolio statistics
 * - Monitor asset performance
 * - Export portfolio reports
 */

import { AurigraphClient, AuthCredentials } from '../src/index';

// Configuration
const config = {
  baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY || 'your-api-key'
  } as AuthCredentials
};

interface PortfolioAsset {
  id: string;
  name: string;
  type: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  percentage: number;
  status: string;
}

interface PortfolioMetrics {
  totalValue: number;
  assetCount: number;
  diversificationScore: number;
  riskScore: number;
  topAsset: PortfolioAsset;
  largestPosition: PortfolioAsset;
}

class RWAPortfolioTracker {
  private client: AurigraphClient;
  private cachedAssets: Map<string, any> = new Map();
  private portfolioData: any = null;

  constructor(clientConfig: any) {
    this.client = new AurigraphClient(clientConfig);
  }

  /**
   * Get portfolio overview
   */
  async getPortfolioOverview(): Promise<PortfolioAsset[]> {
    try {
      console.log('📊 Fetching portfolio overview...');

      const portfolio = await this.client.getRWAPortfolio();

      const assets: PortfolioAsset[] = portfolio.assets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        type: asset.assetType,
        quantity: asset.quantity,
        unitValue: asset.unitValue,
        totalValue: asset.quantity * asset.unitValue,
        percentage: 0, // Will be calculated
        status: asset.status
      }));

      // Calculate percentages
      const totalValue = assets.reduce((sum, a) => sum + a.totalValue, 0);
      assets.forEach(asset => {
        asset.percentage = (asset.totalValue / totalValue) * 100;
      });

      // Sort by value (descending)
      assets.sort((a, b) => b.totalValue - a.totalValue);

      this.portfolioData = {
        assets,
        totalValue,
        lastUpdated: new Date()
      };

      return assets;
    } catch (error) {
      console.error('❌ Failed to fetch portfolio overview:', error);
      return [];
    }
  }

  /**
   * Get detailed asset information
   */
  async getAssetDetails(assetId: string): Promise<any> {
    try {
      // Check cache first
      if (this.cachedAssets.has(assetId)) {
        return this.cachedAssets.get(assetId);
      }

      console.log(`📄 Fetching details for asset: ${assetId}`);
      const asset = await this.client.getRWAAsset(assetId);

      this.cachedAssets.set(assetId, asset);
      return asset;
    } catch (error) {
      console.error(`❌ Failed to fetch asset details for ${assetId}:`, error);
      return null;
    }
  }

  /**
   * List all available RWA assets
   */
  async listAvailableAssets(): Promise<any[]> {
    try {
      console.log('📋 Fetching available RWA assets...');
      const response = await this.client.listRWAAssets({
        limit: 100,
        offset: 0
      });

      console.log(`✅ Found ${response.data.length} available assets`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to list available assets:', error);
      return [];
    }
  }

  /**
   * Analyze portfolio diversification
   */
  analyzeDiversification(assets: PortfolioAsset[]): any {
    if (assets.length === 0) {
      return { score: 0, analysis: 'No assets in portfolio' };
    }

    // Group by type
    const byType = new Map<string, number>();
    assets.forEach(asset => {
      const current = byType.get(asset.type) || 0;
      byType.set(asset.type, current + asset.totalValue);
    });

    // Calculate Herfindahl index (0 = perfectly diversified, 10000 = fully concentrated)
    const totalValue = assets.reduce((sum, a) => sum + a.totalValue, 0);
    let herfindahl = 0;

    byType.forEach(value => {
      const percentage = (value / totalValue) * 100;
      herfindahl += percentage * percentage;
    });

    // Convert to 0-100 scale (invert so higher = better)
    const diversificationScore = Math.max(0, 100 - herfindahl / 100);

    // Analyze by type
    const typeBreakdown = Array.from(byType.entries()).map(([type, value]) => ({
      type,
      value,
      percentage: (value / totalValue) * 100
    }));

    return {
      score: diversificationScore,
      totalTypes: byType.size,
      breakdown: typeBreakdown,
      isWellDiversified: diversificationScore > 50,
      recommendation: this.getDiversificationRecommendation(diversificationScore, byType.size)
    };
  }

  /**
   * Get diversification recommendation
   */
  private getDiversificationRecommendation(score: number, typeCount: number): string {
    if (score < 30) {
      return '⚠️ Portfolio is concentrated. Consider adding more asset types.';
    } else if (score < 60) {
      return '📊 Portfolio diversification is moderate. Could be improved.';
    } else if (score < 80) {
      return '✅ Portfolio is well diversified.';
    } else {
      return '🌟 Portfolio is excellently diversified across multiple asset types.';
    }
  }

  /**
   * Monitor specific asset holding
   */
  async monitorAssetHolding(assetId: string, interval: number = 5000): Promise<void> {
    console.log(`👁️  Monitoring asset: ${assetId}`);

    const monitor = async () => {
      try {
        const asset = await this.getAssetDetails(assetId);
        if (asset) {
          console.log(`\n📊 Asset Update - ${asset.name}`);
          console.log(`   Current Price: $${asset.unitValue.toFixed(2)}`);
          console.log(`   Status: ${asset.status}`);
          console.log(`   Last Updated: ${new Date().toLocaleTimeString()}`);
        }
      } catch (error) {
        console.error(`Error monitoring asset ${assetId}:`, error);
      }
    };

    // Initial check
    await monitor();

    // Set up recurring monitor
    setInterval(monitor, interval);
  }

  /**
   * Get portfolio statistics
   */
  getPortfolioStats(assets: PortfolioAsset[]): PortfolioMetrics {
    const totalValue = assets.reduce((sum, a) => sum + a.totalValue, 0);
    const diversification = this.analyzeDiversification(assets);
    const topAsset = assets[0];
    const largestPosition = assets.reduce((prev, current) =>
      current.totalValue > prev.totalValue ? current : prev
    );

    return {
      totalValue,
      assetCount: assets.length,
      diversificationScore: diversification.score,
      riskScore: this.calculateRiskScore(assets),
      topAsset,
      largestPosition
    };
  }

  /**
   * Calculate portfolio risk score
   */
  private calculateRiskScore(assets: PortfolioAsset[]): number {
    if (assets.length === 0) return 0;

    // Risk is higher when portfolio is concentrated
    const concentrationRisk = assets[0].percentage; // Top asset percentage

    // Risk increases with number of speculative assets
    const speculativeAssets = assets.filter(a =>
      a.type === 'crypto' || a.type === 'speculative'
    ).length;
    const speculativeRisk = (speculativeAssets / assets.length) * 100;

    // Weighted risk calculation
    return (concentrationRisk * 0.6) + (speculativeRisk * 0.4);
  }

  /**
   * Export portfolio report
   */
  exportPortfolioReport(assets: PortfolioAsset[]): string {
    if (!this.portfolioData) {
      return 'No portfolio data available';
    }

    const stats = this.getPortfolioStats(assets);
    const diversification = this.analyzeDiversification(assets);

    let report = '# RWA Portfolio Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '## Portfolio Summary\n';
    report += `- Total Value: $${stats.totalValue.toFixed(2)}\n`;
    report += `- Number of Assets: ${stats.assetCount}\n`;
    report += `- Diversification Score: ${stats.diversificationScore.toFixed(1)}/100\n`;
    report += `- Risk Score: ${stats.riskScore.toFixed(1)}/100\n\n`;

    report += '## Asset Allocation\n';
    assets.forEach(asset => {
      report += `- ${asset.name}: $${asset.totalValue.toFixed(2)} (${asset.percentage.toFixed(1)}%)\n`;
    });

    report += '\n## Diversification Analysis\n';
    report += `${diversification.recommendation}\n`;
    report += `\nBreakdown by Type:\n`;
    diversification.breakdown.forEach((item: any) => {
      report += `- ${item.type}: ${item.percentage.toFixed(1)}%\n`;
    });

    report += '\n## Top Holdings\n';
    report += `- Largest: ${stats.largestPosition.name} ($${stats.largestPosition.totalValue.toFixed(2)})\n`;
    report += `- Most Valuable: ${stats.topAsset.name} ($${stats.topAsset.totalValue.toFixed(2)})\n`;

    return report;
  }

  /**
   * Print portfolio summary
   */
  printPortfolioSummary(assets: PortfolioAsset[]): void {
    const stats = this.getPortfolioStats(assets);
    const diversification = this.analyzeDiversification(assets);

    console.log('\n' + '='.repeat(60));
    console.log('📊 RWA PORTFOLIO SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n💰 Portfolio Value: $${stats.totalValue.toFixed(2)}`);
    console.log(`📈 Number of Assets: ${stats.assetCount}`);
    console.log(`🎯 Diversification: ${stats.diversificationScore.toFixed(1)}/100`);
    console.log(`⚠️  Risk Score: ${stats.riskScore.toFixed(1)}/100`);

    console.log('\n📋 Top Holdings:');
    assets.slice(0, 5).forEach((asset, index) => {
      console.log(`   ${index + 1}. ${asset.name}: $${asset.totalValue.toFixed(2)} (${asset.percentage.toFixed(1)}%)`);
    });

    console.log(`\n${diversification.recommendation}`);
    console.log('='.repeat(60) + '\n');
  }
}

/**
 * Main execution
 */
async function main() {
  const tracker = new RWAPortfolioTracker(config);

  try {
    // Get portfolio overview
    const assets = await tracker.getPortfolioOverview();

    if (assets.length === 0) {
      console.log('⚠️  No assets in portfolio');
      return;
    }

    // Print summary
    tracker.printPortfolioSummary(assets);

    // Get available assets
    console.log('\n📋 Available RWA Assets:');
    const availableAssets = await tracker.listAvailableAssets();
    console.log(`   Total: ${availableAssets.length} assets available for trading\n`);

    // Get detailed info on top assets
    console.log('📄 Top Asset Details:\n');
    const topAsset = assets[0];
    const details = await tracker.getAssetDetails(topAsset.id);
    if (details) {
      console.log(`Name: ${details.name}`);
      console.log(`Type: ${details.assetType}`);
      console.log(`Status: ${details.status}`);
      console.log(`Unit Value: $${details.unitValue}`);
    }

    // Export report
    const report = tracker.exportPortfolioReport(assets);
    console.log('\n📑 Portfolio Report:\n');
    console.log(report);

    console.log('✅ Portfolio analysis complete!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { RWAPortfolioTracker };

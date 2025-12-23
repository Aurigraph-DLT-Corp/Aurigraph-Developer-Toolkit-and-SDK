/**
 * Example 2: Real-World Asset (RWA) Portfolio Tracker
 *
 * Track and manage a portfolio of real-world asset tokens.
 * Monitor holdings, valuations, and perform asset transfers.
 */

import { AurigraphClient, RWAAsset, RWAPortfolio } from '../src/index';

class RWAPortfolioTracker {
  private client: AurigraphClient;
  private ownerAddress: string;

  constructor(baseURL: string, apiKey: string, ownerAddress: string) {
    this.client = new AurigraphClient({
      baseURL,
      auth: { apiKey },
      debug: true,
    });
    this.ownerAddress = ownerAddress.toLowerCase();
  }

  /**
   * Get portfolio overview
   */
  async getPortfolioOverview(): Promise<void> {
    try {
      console.log(`\n📊 RWA Portfolio Overview`);
      console.log(`================================`);
      console.log(`Owner: ${this.ownerAddress}\n`);

      const portfolio = await this.client.getRWAPortfolio(this.ownerAddress);

      console.log(`Total Assets: ${portfolio.assets.length}`);
      console.log(`Total Portfolio Value: $${portfolio.totalValue}`);
      console.log(`Last Updated: ${new Date(portfolio.lastUpdated * 1000).toISOString()}\n`);

      // Display asset breakdown
      console.log(`Asset Breakdown:`);
      console.log(`────────────────────`);

      let totalValue = 0;
      for (const asset of portfolio.assets) {
        const percentage = (parseFloat(asset.metadata.valuation) / parseFloat(portfolio.totalValue)) * 100;
        console.log(`\n${asset.name} (${asset.symbol})`);
        console.log(`  Type: ${asset.metadata.assetType}`);
        console.log(`  Valuation: $${asset.metadata.valuation}`);
        console.log(`  Percentage: ${percentage.toFixed(2)}%`);
        console.log(`  Verified: ${asset.verified ? '✅' : '❌'}`);

        totalValue += parseFloat(asset.metadata.valuation);
      }

      console.log(`\n════════════════════════════════`);
      console.log(`Total Verified Value: $${totalValue}`);
    } catch (error) {
      console.error('Failed to get portfolio overview:', error);
    }
  }

  /**
   * Get details for specific RWA asset
   */
  async getAssetDetails(assetId: string): Promise<void> {
    try {
      console.log(`\n📋 RWA Asset Details`);
      console.log(`════════════════════════════════`);

      const asset = await this.client.getRWAAsset(assetId);

      console.log(`\nBasic Information:`);
      console.log(`  Name: ${asset.name}`);
      console.log(`  Symbol: ${asset.symbol}`);
      console.log(`  Token Address: ${asset.tokenAddress}`);
      console.log(`  Issuer: ${asset.issuer}`);

      console.log(`\nAsset Details:`);
      console.log(`  Type: ${asset.metadata.assetType}`);
      console.log(`  Underlying Asset: ${asset.underlyingAsset}`);
      console.log(`  Total Supply: ${asset.totalSupply}`);
      console.log(`  Decimals: ${asset.decimals}`);

      console.log(`\nValuation:`);
      console.log(`  Amount: $${asset.metadata.valuation}`);
      console.log(`  Date: ${asset.metadata.valuationDate}`);

      if (asset.metadata.custodian) {
        console.log(`\nCustodian: ${asset.metadata.custodian}`);
      }

      if (asset.metadata.auditor) {
        console.log(`Auditor: ${asset.metadata.auditor}`);
      }

      console.log(`\nVerification:`);
      console.log(`  Verified: ${asset.verified ? '✅ Yes' : '❌ No'}`);
      console.log(`  Merkle Root: ${asset.merkleRoot || 'Not set'}`);

      if (asset.metadata.documentHash) {
        console.log(`  Document Hash: ${asset.metadata.documentHash}`);
      }

      if (asset.metadata.externalRegistry) {
        console.log(`  External Registry: ${asset.metadata.externalRegistry}`);
      }
    } catch (error) {
      console.error('Failed to get asset details:', error);
    }
  }

  /**
   * List all available RWA assets
   */
  async listAvailableAssets(limit: number = 20): Promise<void> {
    try {
      console.log(`\n🏦 Available RWA Assets (Limit: ${limit})`);
      console.log(`════════════════════════════════`);

      const assets = await this.client.listRWAAssets({
        limit,
        sort: 'desc',
      });

      console.log(`Total Available: ${assets.total}\n`);

      for (let i = 0; i < assets.data.length; i++) {
        const asset = assets.data[i];
        console.log(`${i + 1}. ${asset.name} (${asset.symbol})`);
        console.log(`   ID: ${asset.id}`);
        console.log(`   Type: ${asset.metadata.assetType}`);
        console.log(`   Valuation: $${asset.metadata.valuation}`);
        console.log(`   Verified: ${asset.verified ? '✅' : '❌'}`);

        if (i < assets.data.length - 1) {
          console.log();
        }
      }

      if (assets.hasMore) {
        console.log(`\n... and ${assets.total - assets.limit} more assets`);
      }
    } catch (error) {
      console.error('Failed to list assets:', error);
    }
  }

  /**
   * Analyze portfolio diversification
   */
  async analyzeDiversification(): Promise<void> {
    try {
      console.log(`\n📈 Portfolio Diversification Analysis`);
      console.log(`════════════════════════════════`);

      const portfolio = await this.client.getRWAPortfolio(this.ownerAddress);

      const diversification: Record<string, number> = {};
      let totalValue = 0;

      for (const asset of portfolio.assets) {
        const assetType = asset.metadata.assetType;
        const value = parseFloat(asset.metadata.valuation);

        diversification[assetType] = (diversification[assetType] || 0) + value;
        totalValue += value;
      }

      console.log(`\nAsset Class Distribution:`);
      console.log();

      const sortedTypes = Object.entries(diversification)
        .sort((a, b) => b[1] - a[1]);

      for (const [type, value] of sortedTypes) {
        const percentage = (value / totalValue) * 100;
        const barLength = Math.round(percentage / 2);
        const bar = '█'.repeat(barLength) + '░'.repeat(50 - barLength);

        console.log(`${type.padEnd(20)} ${bar} ${percentage.toFixed(1)}%`);
        console.log(`                      $${value.toFixed(2)}\n`);
      }

      // Risk analysis
      console.log(`\nRisk Assessment:`);
      const concentration = Math.max(...Object.values(diversification)) / totalValue;

      if (concentration > 0.5) {
        console.log(`⚠️  Concentration Risk: HIGH (${(concentration * 100).toFixed(1)}%)`);
        console.log(`   Consider diversifying into other asset classes`);
      } else if (concentration > 0.3) {
        console.log(`⚡ Concentration Risk: MODERATE (${(concentration * 100).toFixed(1)}%)`);
        console.log(`   Portfolio is reasonably diversified`);
      } else {
        console.log(`✅ Concentration Risk: LOW (${(concentration * 100).toFixed(1)}%)`);
        console.log(`   Portfolio is well-diversified`);
      }
    } catch (error) {
      console.error('Failed to analyze diversification:', error);
    }
  }

  /**
   * Monitor specific asset holdings
   */
  async monitorAssetHolding(assetId: string): Promise<void> {
    try {
      console.log(`\n👁️  Monitoring Asset: ${assetId}`);

      const asset = await this.client.getRWAAsset(assetId);
      const portfolio = await this.client.getRWAPortfolio(this.ownerAddress);

      const holding = portfolio.assets.find(a => a.id === assetId);

      if (!holding) {
        console.log(`❌ Asset not found in portfolio`);
        return;
      }

      console.log(`\nCurrent Holding:`);
      console.log(`  Asset: ${holding.name}`);
      console.log(`  Symbol: ${holding.symbol}`);
      console.log(`  Balance: ${holding.totalSupply}`);
      console.log(`  Valuation: $${holding.metadata.valuation}`);
      console.log(`  Last Updated: ${new Date(holding.metadata.valuationDate).toISOString()}`);

      // Calculate metrics
      const portfolioTotal = parseFloat(portfolio.totalValue);
      const assetValue = parseFloat(holding.metadata.valuation);
      const percentage = (assetValue / portfolioTotal) * 100;

      console.log(`\nPortfolio Metrics:`);
      console.log(`  Portfolio Percentage: ${percentage.toFixed(2)}%`);
      console.log(`  Verified: ${holding.verified ? '✅ Yes' : '❌ No'}`);

      if (holding.merkleRoot) {
        console.log(`  Merkle Verification: ✅ Available`);
      }
    } catch (error) {
      console.error('Failed to monitor asset:', error);
    }
  }

  /**
   * Get portfolio statistics
   */
  async getPortfolioStats(): Promise<void> {
    try {
      console.log(`\n📊 Portfolio Statistics`);
      console.log(`════════════════════════════════`);

      const portfolio = await this.client.getRWAPortfolio(this.ownerAddress);

      const stats = {
        totalAssets: portfolio.assets.length,
        totalValue: parseFloat(portfolio.totalValue),
        verifiedAssets: portfolio.assets.filter(a => a.verified).length,
        assetTypes: new Set(portfolio.assets.map(a => a.metadata.assetType)).size,
        avgAssetValue: 0,
        minAssetValue: Infinity,
        maxAssetValue: 0,
      };

      let sumValues = 0;
      for (const asset of portfolio.assets) {
        const value = parseFloat(asset.metadata.valuation);
        sumValues += value;
        stats.minAssetValue = Math.min(stats.minAssetValue, value);
        stats.maxAssetValue = Math.max(stats.maxAssetValue, value);
      }

      stats.avgAssetValue = sumValues / portfolio.assets.length;

      console.log(`\nQuantitative Metrics:`);
      console.log(`  Total Assets: ${stats.totalAssets}`);
      console.log(`  Total Value: $${stats.totalValue.toLocaleString()}`);
      console.log(`  Average Value: $${stats.avgAssetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      console.log(`  Min Value: $${stats.minAssetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
      console.log(`  Max Value: $${stats.maxAssetValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`);

      console.log(`\nQuality Metrics:`);
      console.log(`  Asset Types: ${stats.assetTypes}`);
      console.log(`  Verified Assets: ${stats.verifiedAssets} / ${stats.totalAssets}`);
      console.log(`  Verification Rate: ${((stats.verifiedAssets / stats.totalAssets) * 100).toFixed(1)}%`);
    } catch (error) {
      console.error('Failed to get portfolio stats:', error);
    }
  }

  /**
   * Export portfolio report
   */
  async exportPortfolioReport(filename?: string): Promise<void> {
    try {
      console.log(`\n📄 Exporting Portfolio Report...`);

      const portfolio = await this.client.getRWAPortfolio(this.ownerAddress);

      const report = {
        timestamp: new Date().toISOString(),
        owner: this.ownerAddress,
        summary: {
          totalAssets: portfolio.assets.length,
          totalValue: portfolio.totalValue,
          verifiedAssets: portfolio.assets.filter(a => a.verified).length,
        },
        assets: portfolio.assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          symbol: asset.symbol,
          type: asset.metadata.assetType,
          valuation: asset.metadata.valuation,
          verified: asset.verified,
        })),
      };

      // In a real implementation, would write to file
      console.log(`\n✅ Report generated:`);
      console.log(JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  }
}

// ==================== Main Execution ====================

async function main() {
  const BASE_URL = process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003';
  const API_KEY = process.env.AURIGRAPH_API_KEY || 'demo-key';
  const OWNER_ADDRESS = process.env.OWNER_ADDRESS || '0x1234567890123456789012345678901234567890';

  const tracker = new RWAPortfolioTracker(BASE_URL, API_KEY, OWNER_ADDRESS);

  try {
    // Display portfolio overview
    await tracker.getPortfolioOverview();

    // List available assets
    await tracker.listAvailableAssets(5);

    // Analyze diversification
    await tracker.analyzeDiversification();

    // Get statistics
    await tracker.getPortfolioStats();

    // Export report
    await tracker.exportPortfolioReport();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { RWAPortfolioTracker };

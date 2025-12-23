import { Logger } from '../utils/Logger';
import { RegisteredAsset } from './types';

export class AssetRegistry {
  private logger: Logger;
  private assets: Map<string, RegisteredAsset> = new Map();

  constructor() {
    this.logger = new Logger('AssetRegistry');
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Asset Registry...');
  }

  async registerAsset(asset: RegisteredAsset): Promise<void> {
    this.assets.set(asset.assetId, asset);
    this.logger.info(`Asset registered: ${asset.assetId}`);
  }

  async updateAsset(asset: RegisteredAsset): Promise<void> {
    this.assets.set(asset.assetId, asset);
    this.logger.info(`Asset updated: ${asset.assetId}`);
  }

  async getAsset(assetId: string): Promise<RegisteredAsset> {
    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    return asset;
  }

  async getTokensForAsset(assetId: string): Promise<any[]> {
    // Mock tokens for asset
    return [
      {
        tokenId: `${assetId}-PRIMARY`,
        tokenType: 'PRIMARY',
        symbol: 'ASSET',
        totalSupply: 1
      }
    ];
  }
}
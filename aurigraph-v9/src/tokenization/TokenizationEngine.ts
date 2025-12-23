import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { DigitalTwinManager } from './DigitalTwinManager';
import { AssetRegistry } from './AssetRegistry';
import { ComplianceEngine } from './ComplianceEngine';
import { SmartContractEngine } from '../contracts/SmartContractEngine';
import {
  PhysicalAsset,
  RegisteredAsset,
  TokenizationParameters,
  TokenizationResult,
  TokenStructure,
  TokenType,
  AssetCategory
} from './types';

export class TokenizationEngine extends EventEmitter {
  private logger: Logger;
  private assetRegistry: AssetRegistry;
  private complianceEngine: ComplianceEngine;
  private contractEngine: SmartContractEngine;
  private digitalTwinManager: DigitalTwinManager;

  constructor() {
    super();
    this.logger = new Logger('TokenizationEngine');
    this.assetRegistry = new AssetRegistry();
    this.complianceEngine = new ComplianceEngine();
    this.contractEngine = new SmartContractEngine();
    this.digitalTwinManager = new DigitalTwinManager();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Tokenization Engine...');
    
    await this.assetRegistry.initialize();
    await this.complianceEngine.initialize();
    await this.contractEngine.initialize();
    await this.digitalTwinManager.initialize();
    
    this.logger.info('Tokenization Engine initialized');
  }

  async tokenizeAsset(
    asset: PhysicalAsset,
    tokenizationParams: TokenizationParameters
  ): Promise<TokenizationResult> {
    this.logger.info(`Starting tokenization for asset: ${asset.name}`);
    
    const registeredAsset = await this.registerAsset(asset);
    await this.verifyAssetOwnership(registeredAsset);
    await this.performDueDiligence(registeredAsset);
    
    const digitalTwin = await this.digitalTwinManager.createDigitalTwin(registeredAsset);
    
    const tokenStructure = await this.generateTokenStructure(
      registeredAsset,
      tokenizationParams
    );
    
    const contracts = await this.deployTokenContracts(tokenStructure);
    
    const tokens = await this.mintTokens(contracts, tokenStructure);
    
    await this.setupGovernance(tokens, tokenizationParams.governance);
    await this.configureCompliance(tokens, registeredAsset.jurisdiction);
    
    const result: TokenizationResult = {
      assetId: registeredAsset.assetId,
      digitalTwinId: digitalTwin.twinId,
      tokens: tokens,
      contracts: contracts,
      governanceFramework: tokenizationParams.governance,
      complianceConfiguration: await this.complianceEngine.getConfiguration(registeredAsset),
      timestamp: new Date()
    };
    
    this.emit('asset-tokenized', result);
    
    return result;
  }

  private async registerAsset(asset: PhysicalAsset): Promise<RegisteredAsset> {
    this.logger.info(`Registering asset: ${asset.name}`);
    
    const assetId = this.generateAssetId(asset);
    
    const registeredAsset: RegisteredAsset = {
      assetId: assetId,
      name: asset.name,
      category: asset.category,
      description: asset.description,
      physicalCharacteristics: asset.physicalCharacteristics,
      location: asset.location,
      owner: asset.owner,
      value: asset.value,
      currency: asset.currency,
      certifications: asset.certifications || [],
      images: asset.images || [],
      documents: asset.documents || [],
      jurisdiction: asset.jurisdiction,
      registrationDate: new Date(),
      status: 'registered',
      digitalTwinId: '',
      symbol: this.generateAssetSymbol(asset)
    };
    
    await this.assetRegistry.registerAsset(registeredAsset);
    
    return registeredAsset;
  }

  private async verifyAssetOwnership(asset: RegisteredAsset): Promise<void> {
    this.logger.info(`Verifying ownership for asset: ${asset.assetId}`);
    
    const ownershipVerification = await this.complianceEngine.verifyOwnership(
      asset.owner,
      asset.documents || []
    );
    
    if (!ownershipVerification.verified) {
      throw new Error(`Ownership verification failed: ${ownershipVerification.reason}`);
    }
    
    asset.ownershipVerified = true;
    await this.assetRegistry.updateAsset(asset);
  }

  private async performDueDiligence(asset: RegisteredAsset): Promise<void> {
    this.logger.info(`Performing due diligence for asset: ${asset.assetId}`);
    
    const dueDiligenceResult = await this.complianceEngine.performDueDiligence(asset);
    
    if (!dueDiligenceResult.passed) {
      throw new Error(`Due diligence failed: ${dueDiligenceResult.issues.join(', ')}`);
    }
    
    asset.dueDiligenceCompleted = true;
    asset.dueDiligenceReport = dueDiligenceResult.report;
    await this.assetRegistry.updateAsset(asset);
  }

  private async generateTokenStructure(
    asset: RegisteredAsset,
    params: TokenizationParameters
  ): Promise<TokenStructure> {
    this.logger.info(`Generating token structure for asset: ${asset.assetId}`);
    
    const structure: TokenStructure = {
      primaryTokens: [],
      secondaryTokens: [],
      compoundTokens: [],
      totalSupply: params.totalSupply,
      denomination: params.denomination
    };
    
    if (params.includePrimaryTokens) {
      structure.primaryTokens.push({
        tokenId: `${asset.assetId}-PRIMARY`,
        tokenType: TokenType.PRIMARY,
        symbol: `${asset.symbol}_ASSET`,
        name: `${asset.name} Asset Token`,
        totalSupply: 1,
        decimals: 0,
        metadata: {
          assetDetails: asset.physicalCharacteristics,
          location: asset.location,
          certifications: asset.certifications,
          digitalTwinId: asset.digitalTwinId
        },
        transferable: false,
        burnable: false,
        mintable: false
      });
    }
    
    if (params.includeSecondaryTokens) {
      structure.secondaryTokens.push({
        tokenId: `${asset.assetId}-SECONDARY`,
        tokenType: TokenType.SECONDARY,
        symbol: `${asset.symbol}_OWN`,
        name: `${asset.name} Ownership Token`,
        totalSupply: params.totalSupply,
        decimals: params.decimals || 18,
        metadata: {
          ownershipRights: params.ownershipRights,
          votingRights: params.votingRights,
          profitSharing: params.profitSharing,
          liquidationRights: params.liquidationRights
        },
        transferable: true,
        burnable: params.burnable || false,
        mintable: params.mintable || false,
        fractionable: params.allowFractional
      });
    }
    
    if (params.includeCompoundTokens) {
      structure.compoundTokens.push({
        tokenId: `${asset.assetId}-COMPOUND`,
        tokenType: TokenType.COMPOUND,
        symbol: `${asset.symbol}_COMP`,
        name: `${asset.name} Compound Token`,
        totalSupply: params.totalSupply,
        decimals: params.decimals || 18,
        metadata: {
          primaryTokenId: structure.primaryTokens[0]?.tokenId,
          secondaryTokenId: structure.secondaryTokens[0]?.tokenId,
          combinedRights: {
            ...params.ownershipRights,
            assetAccess: params.assetAccess
          }
        },
        transferable: true,
        burnable: params.burnable || false,
        mintable: params.mintable || false,
        fractionable: params.allowFractional
      });
    }
    
    return structure;
  }

  private async deployTokenContracts(tokenStructure: TokenStructure): Promise<any[]> {
    this.logger.info('Deploying token contracts...');
    
    const contracts = [];
    
    for (const token of tokenStructure.primaryTokens) {
      const contract = await this.contractEngine.deployTokenContract(token);
      contracts.push(contract);
    }
    
    for (const token of tokenStructure.secondaryTokens) {
      const contract = await this.contractEngine.deployTokenContract(token);
      contracts.push(contract);
    }
    
    for (const token of tokenStructure.compoundTokens) {
      const contract = await this.contractEngine.deployCompoundTokenContract(token);
      contracts.push(contract);
    }
    
    return contracts;
  }

  private async mintTokens(contracts: any[], tokenStructure: TokenStructure): Promise<any[]> {
    this.logger.info('Minting tokens...');
    
    const tokens = [];
    
    for (const contract of contracts) {
      const mintResult = await contract.mint(
        contract.tokenMetadata.totalSupply,
        contract.tokenMetadata.initialOwner
      );
      
      tokens.push({
        ...contract.tokenMetadata,
        contractAddress: contract.address,
        mintTransactionHash: mintResult.transactionHash
      });
    }
    
    return tokens;
  }

  private async setupGovernance(tokens: any[], governance: any): Promise<void> {
    this.logger.info('Setting up governance...');
    
    if (!governance || !governance.enabled) return;
    
    const governanceContract = await this.contractEngine.deployGovernanceContract({
      tokens: tokens,
      votingPeriod: governance.votingPeriod,
      quorum: governance.quorum,
      proposalThreshold: governance.proposalThreshold,
      executionDelay: governance.executionDelay
    });
    
    for (const token of tokens) {
      if (token.tokenType === TokenType.SECONDARY || token.tokenType === TokenType.COMPOUND) {
        await this.contractEngine.linkGovernance(token.contractAddress, governanceContract.address);
      }
    }
  }

  private async configureCompliance(tokens: any[], jurisdiction: string): Promise<void> {
    this.logger.info(`Configuring compliance for jurisdiction: ${jurisdiction}`);
    
    const complianceRules = await this.complianceEngine.getRulesForJurisdiction(jurisdiction);
    
    for (const token of tokens) {
      if (token.transferable) {
        await this.contractEngine.setComplianceRules(
          token.contractAddress,
          complianceRules
        );
      }
    }
  }

  private generateAssetId(asset: PhysicalAsset): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `ASSET-${asset.category}-${timestamp}-${random}`.toUpperCase();
  }

  private generateAssetSymbol(asset: PhysicalAsset): string {
    const categoryPrefix = asset.category.substring(0, 3).toUpperCase();
    const namePrefix = asset.name.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${categoryPrefix}${namePrefix}${random}`;
  }

  async getTokenizedAsset(assetId: string): Promise<any> {
    const asset = await this.assetRegistry.getAsset(assetId);
    const digitalTwin = await this.digitalTwinManager.getDigitalTwin(asset.digitalTwinId);
    
    return {
      asset: asset,
      digitalTwin: digitalTwin,
      tokens: await this.assetRegistry.getTokensForAsset(assetId)
    };
  }

  async updateAssetValue(assetId: string, newValue: bigint): Promise<void> {
    const asset = await this.assetRegistry.getAsset(assetId);
    asset.value = newValue;
    asset.lastValuationDate = new Date();
    
    await this.assetRegistry.updateAsset(asset);
    
    await this.digitalTwinManager.updateDigitalTwinState(
      asset.digitalTwinId,
      { value: newValue }
    );
    
    this.emit('asset-value-updated', {
      assetId: assetId,
      oldValue: asset.value,
      newValue: newValue
    });
  }
}
/**
 * Demo Token Service
 *
 * Provides pre-configured demo tokens for user experience demonstration.
 * Demo tokens are persistent for 48 hours and showcase the complete
 * tokenization workflow including all stakeholders.
 *
 * @author Aurigraph DLT Development Team
 * @since V12.0.0
 */

// Demo Token Configuration
export interface DemoToken {
  id: string
  name: string
  symbol: string
  assetType: string
  description: string
  value: number
  currency: string
  imageUrl: string
  creator: DemoStakeholder
  stakeholders: DemoStakeholder[]
  compositeTokens: CompositeToken[]
  vvbVerification: VVBVerification
  timeline: DemoTimeline[]
  status: TokenStatus
  createdAt: Date
  expiresAt: Date
  metadata: TokenMetadata
}

export interface DemoStakeholder {
  id: string
  name: string
  role: StakeholderRole
  avatar: string
  organization: string
  verified: boolean
  permissions: string[]
}

export type StakeholderRole =
  | 'creator'
  | 'owner'
  | 'custodian'
  | 'verifier'
  | 'appraiser'
  | 'legal'
  | 'compliance'
  | 'investor'

export interface CompositeToken {
  type: SecondaryTokenType
  tokenId: string
  standard: string
  status: 'active' | 'pending' | 'verified'
  data: Record<string, string>
  linkedAt: Date
}

export type SecondaryTokenType =
  | 'OWNER'
  | 'COLLATERAL'
  | 'MEDIA'
  | 'VERIFICATION'
  | 'VALUATION'
  | 'COMPLIANCE'

export interface VVBVerification {
  provider: string
  providerId: string
  status: VVBStatus
  submittedAt: Date
  completedAt?: Date
  reportUrl?: string
  score: number
  comments: string[]
}

export type VVBStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'site_inspection'
  | 'verification_report'
  | 'approved'
  | 'rejected'

export interface DemoTimeline {
  step: number
  title: string
  description: string
  completedAt?: Date
  actor: string
  action: string
}

export type TokenStatus =
  | 'draft'
  | 'pending_verification'
  | 'verified'
  | 'tokenized'
  | 'listed'
  | 'traded'

export interface TokenMetadata {
  blockchain: string
  contractAddress: string
  tokenStandard: string
  totalSupply: number
  decimals: number
  mintable: boolean
  burnable: boolean
  transferable: boolean
}

// Demo Storage Key
const DEMO_STORAGE_KEY = 'aurigraph_demo_tokens'
const DEMO_EXPIRY_HOURS = 48

// Featured Asset Types - Linked to Tokenization Use Cases
export interface FeaturedAsset {
  id: string
  name: string
  assetType: string
  useCase: string
  description: string
  icon: string
  value: number
  currency: string
  imageUrl: string
  highlights: string[]
}

// Featured Assets Configuration - Links each use case to a demo token
export const FEATURED_ASSETS: FeaturedAsset[] = [
  {
    id: 'digital_art',
    name: 'Cosmic Dreams #42',
    assetType: 'DIGITAL_ART',
    useCase: 'Digital Art & NFTs',
    description: 'Generative art piece with full commercial rights and provenance tracking',
    icon: '🎨',
    value: 25000,
    currency: 'USD',
    imageUrl: 'https://picsum.photos/seed/cosmic42/800/800',
    highlights: ['ERC-721 Token', 'IPFS Storage', 'Royalty Enforcement', 'Artist Verified']
  },
  {
    id: 'real_estate',
    name: 'Manhattan Tower Unit 42-A',
    assetType: 'REAL_ESTATE',
    useCase: 'Real Estate Tokenization',
    description: 'Premium commercial real estate with fractional ownership capability',
    icon: '🏢',
    value: 2500000,
    currency: 'USD',
    imageUrl: 'https://picsum.photos/seed/manhattan42/800/800',
    highlights: ['Fractional Shares', 'Rental Income', 'SEC Reg D', 'Title Insurance']
  },
  {
    id: 'carbon_credits',
    name: 'Amazon Rainforest Credits',
    assetType: 'CARBON_CREDIT',
    useCase: 'Carbon Credits',
    description: 'Verified carbon offset credits from rainforest conservation project',
    icon: '🌿',
    value: 150000,
    currency: 'USD',
    imageUrl: 'https://picsum.photos/seed/amazon42/800/800',
    highlights: ['Verra Certified', 'Annual Yield', 'ESG Compliant', 'Impact Tracking']
  },
  {
    id: 'trade_finance',
    name: 'Global Trade Invoice Pool',
    assetType: 'FINANCIAL',
    useCase: 'Trade Finance',
    description: 'Diversified pool of verified trade receivables from Fortune 500 companies',
    icon: '📦',
    value: 5000000,
    currency: 'USD',
    imageUrl: 'https://picsum.photos/seed/trade42/800/800',
    highlights: ['Invoice Factoring', '30-90 Day Terms', 'Credit Insured', 'Auto-Settlement']
  },
  {
    id: 'securities',
    name: 'Corporate Bond Series A',
    assetType: 'FINANCIAL',
    useCase: 'Securities & Bonds',
    description: 'Investment-grade corporate bonds with programmable coupon payments',
    icon: '📈',
    value: 1000000,
    currency: 'USD',
    imageUrl: 'https://picsum.photos/seed/bonds42/800/800',
    highlights: ['6.5% Annual Yield', 'Quarterly Dividends', 'AA Rated', 'Smart Coupon']
  },
  {
    id: 'supply_chain',
    name: 'Logistics Invoice Bundle',
    assetType: 'SUPPLY_CHAIN',
    useCase: 'Supply Chain Finance',
    description: 'Supply chain financing backed by verified shipping and logistics invoices',
    icon: '🚚',
    value: 750000,
    currency: 'USD',
    imageUrl: 'https://picsum.photos/seed/logistics42/800/800',
    highlights: ['IoT Verified', 'Real-time Tracking', 'Insurance Backed', 'Multi-party']
  },
  {
    id: 'intellectual_property',
    name: 'PatentTech AI Framework',
    assetType: 'INTELLECTUAL_PROPERTY',
    useCase: 'Intellectual Property',
    description: 'Portfolio of AI/ML patents with licensing revenue streams',
    icon: '💡',
    value: 3500000,
    currency: 'USD',
    imageUrl: 'https://picsum.photos/seed/patent42/800/800',
    highlights: ['12 Patents', 'Active Licenses', 'Royalty Stream', 'USPTO Verified']
  },
  {
    id: 'defi_commodity',
    name: 'Gold Bullion Reserve',
    assetType: 'COMMODITY',
    useCase: 'DeFi Integration',
    description: 'Physical gold bullion in secure vault with DeFi liquidity pool integration',
    icon: '🥇',
    value: 500000,
    currency: 'USD',
    imageUrl: 'https://picsum.photos/seed/gold42/800/800',
    highlights: ['100oz Gold Bar', 'LBMA Certified', 'DeFi Enabled', 'Vault Insured']
  }
]

// Pre-configured Demo Stakeholders
const DEMO_STAKEHOLDERS: Record<string, DemoStakeholder> = {
  artist: {
    id: 'stakeholder_artist_001',
    name: 'Elena Rodriguez',
    role: 'creator',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    organization: 'Independent Digital Artist',
    verified: true,
    permissions: ['create', 'transfer', 'list'],
  },
  owner: {
    id: 'stakeholder_owner_001',
    name: 'Marcus Chen',
    role: 'owner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    organization: 'Chen Art Collection LLC',
    verified: true,
    permissions: ['transfer', 'list', 'collateralize'],
  },
  custodian: {
    id: 'stakeholder_custodian_001',
    name: 'Sarah Williams',
    role: 'custodian',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    organization: 'Aurigraph Digital Vault Services',
    verified: true,
    permissions: ['custody', 'safekeep', 'report'],
  },
  verifier: {
    id: 'stakeholder_verifier_001',
    name: 'Dr. James Mitchell',
    role: 'verifier',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    organization: 'Verisart Digital Authentication',
    verified: true,
    permissions: ['verify', 'attest', 'certify'],
  },
  appraiser: {
    id: 'stakeholder_appraiser_001',
    name: 'Olivia Thompson',
    role: 'appraiser',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia',
    organization: "Christie's Art Valuation",
    verified: true,
    permissions: ['appraise', 'value', 'report'],
  },
  legal: {
    id: 'stakeholder_legal_001',
    name: 'David Park',
    role: 'legal',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    organization: 'Baker McKenzie LLP',
    verified: true,
    permissions: ['legal_review', 'contract', 'compliance'],
  },
  compliance: {
    id: 'stakeholder_compliance_001',
    name: 'Anna Schmidt',
    role: 'compliance',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anna',
    organization: 'Aurigraph Compliance Services',
    verified: true,
    permissions: ['aml_check', 'kyc_verify', 'regulatory_report'],
  },
  investor: {
    id: 'stakeholder_investor_001',
    name: 'Robert Nakamura',
    role: 'investor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    organization: 'Digital Art Capital Partners',
    verified: true,
    permissions: ['invest', 'trade', 'dividend'],
  },
}

// Demo Digital Art Token
const createDemoDigitalArtToken = (): DemoToken => {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + DEMO_EXPIRY_HOURS * 60 * 60 * 1000)

  return {
    id: `demo_token_${Date.now()}_digital_art`,
    name: 'Cosmic Dreams #42',
    symbol: 'COSMIC42',
    assetType: 'DIGITAL_ART',
    description: 'A stunning generative art piece exploring the intersection of mathematics and cosmic phenomena. This NFT represents ownership of the original 8K digital artwork with full commercial rights.',
    value: 25000,
    currency: 'USD',
    imageUrl: 'https://picsum.photos/seed/cosmic42/800/800',
    creator: DEMO_STAKEHOLDERS.artist,
    stakeholders: [
      DEMO_STAKEHOLDERS.artist,
      DEMO_STAKEHOLDERS.owner,
      DEMO_STAKEHOLDERS.custodian,
      DEMO_STAKEHOLDERS.verifier,
      DEMO_STAKEHOLDERS.appraiser,
      DEMO_STAKEHOLDERS.legal,
      DEMO_STAKEHOLDERS.compliance,
      DEMO_STAKEHOLDERS.investor,
    ],
    compositeTokens: [
      {
        type: 'OWNER',
        tokenId: 'owner_token_001',
        standard: 'ERC-721',
        status: 'verified',
        data: {
          ownerName: 'Marcus Chen',
          legalEntity: 'Chen Art Collection LLC',
          ownershipPercentage: '100%',
          transferRights: 'Full transfer rights with royalty obligations',
          acquisitionDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        linkedAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'COLLATERAL',
        tokenId: 'collateral_token_001',
        standard: 'ERC-1155',
        status: 'active',
        data: {
          collateralValue: '$25,000 USD',
          lienPosition: 'First Lien',
          securityAgreement: 'SA-2024-001234',
          releaseConditions: 'Full repayment of associated loan',
          collateralRatio: '150%',
        },
        linkedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'MEDIA',
        tokenId: 'media_token_001',
        standard: 'ERC-1155',
        status: 'verified',
        data: {
          originalFile: 'cosmic_dreams_42_8k.png',
          fileSize: '124.5 MB',
          resolution: '7680x4320',
          ipfsHash: 'QmXyZ123...abc789',
          arweaveId: 'ar://xyz789...def456',
          thumbnails: '3 sizes available',
        },
        linkedAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'VERIFICATION',
        tokenId: 'verification_token_001',
        standard: 'ERC-721',
        status: 'verified',
        data: {
          vvbProvider: 'Verisart Digital Authentication',
          verificationDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          auditReport: 'VER-2024-DAT-001234',
          complianceStatus: 'Fully Compliant',
          authenticityScore: '98.5%',
        },
        linkedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'VALUATION',
        tokenId: 'valuation_token_001',
        standard: 'ERC-20',
        status: 'verified',
        data: {
          marketValue: '$25,000 USD',
          appraisalDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          appraiser: "Christie's Art Valuation",
          methodology: 'Comparable Sales + Artist Portfolio Analysis',
          confidenceLevel: 'High (95%)',
        },
        linkedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'COMPLIANCE',
        tokenId: 'compliance_token_001',
        standard: 'ERC-721',
        status: 'verified',
        data: {
          jurisdiction: 'United States, European Union',
          regulations: 'SEC Reg D, MiCA',
          certifications: 'ISO 27001, SOC 2 Type II',
          kycStatus: 'Verified',
          amlStatus: 'Cleared',
          expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        linkedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
    ],
    vvbVerification: {
      provider: 'Verisart Digital Authentication',
      providerId: 'vvb_5',
      status: 'approved',
      submittedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      reportUrl: '/reports/VER-2024-DAT-001234.pdf',
      score: 98.5,
      comments: [
        'Original artwork verified through blockchain provenance',
        'Artist identity confirmed via multi-factor authentication',
        'File integrity verified through cryptographic hashing',
        'Ownership chain fully documented',
      ],
    },
    timeline: [
      {
        step: 1,
        title: 'Asset Created',
        description: 'Digital artwork "Cosmic Dreams #42" created by Elena Rodriguez',
        completedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
        actor: 'Elena Rodriguez',
        action: 'Created original artwork',
      },
      {
        step: 2,
        title: 'Documentation Uploaded',
        description: 'High-resolution files and metadata uploaded to decentralized storage',
        completedAt: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000),
        actor: 'Elena Rodriguez',
        action: 'Uploaded to IPFS and Arweave',
      },
      {
        step: 3,
        title: 'VVB Submitted',
        description: 'Submitted for verification to Verisart Digital Authentication',
        completedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        actor: 'System',
        action: 'VVB assignment',
      },
      {
        step: 4,
        title: 'Verification Complete',
        description: 'Artwork authenticity and ownership verified',
        completedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        actor: 'Dr. James Mitchell',
        action: 'Verification approved',
      },
      {
        step: 5,
        title: 'Valuation Completed',
        description: 'Professional appraisal completed by Christie\'s',
        completedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        actor: 'Olivia Thompson',
        action: 'Appraised at $25,000',
      },
      {
        step: 6,
        title: 'Legal Review',
        description: 'Legal documentation and transfer rights reviewed',
        completedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        actor: 'David Park',
        action: 'Legal clearance granted',
      },
      {
        step: 7,
        title: 'Compliance Check',
        description: 'KYC/AML compliance verification completed',
        completedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        actor: 'Anna Schmidt',
        action: 'Compliance approved',
      },
      {
        step: 8,
        title: 'Token Minted',
        description: 'Primary ERC-721 token and composite tokens minted',
        completedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        actor: 'System',
        action: 'Tokens minted on Aurigraph DLT',
      },
      {
        step: 9,
        title: 'Ownership Transfer',
        description: 'Token transferred to Marcus Chen',
        completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        actor: 'Elena Rodriguez',
        action: 'Ownership transferred',
      },
      {
        step: 10,
        title: 'Listed for Investment',
        description: 'Token listed on Aurigraph Marketplace for fractional investment',
        completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        actor: 'Marcus Chen',
        action: 'Listed at $25,000',
      },
    ],
    status: 'listed',
    createdAt: now,
    expiresAt: expiresAt,
    metadata: {
      blockchain: 'Aurigraph DLT V12',
      contractAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD38',
      tokenStandard: 'ERC-721 (Primary) + ERC-1155/ERC-20 (Composite)',
      totalSupply: 1,
      decimals: 0,
      mintable: false,
      burnable: false,
      transferable: true,
    },
  }
}

// Create Demo Token for Any Featured Asset
const createDemoTokenForAsset = (featuredAsset: FeaturedAsset): DemoToken => {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + DEMO_EXPIRY_HOURS * 60 * 60 * 1000)

  // Customize stakeholders based on asset type
  const getStakeholdersForAssetType = (assetType: string): DemoStakeholder[] => {
    const baseStakeholders = [
      DEMO_STAKEHOLDERS.owner,
      DEMO_STAKEHOLDERS.custodian,
      DEMO_STAKEHOLDERS.verifier,
      DEMO_STAKEHOLDERS.appraiser,
      DEMO_STAKEHOLDERS.legal,
      DEMO_STAKEHOLDERS.compliance,
      DEMO_STAKEHOLDERS.investor,
    ]

    // Add creator based on asset type
    if (assetType === 'DIGITAL_ART' || assetType === 'ARTWORK') {
      return [DEMO_STAKEHOLDERS.artist, ...baseStakeholders]
    }
    return [{ ...DEMO_STAKEHOLDERS.artist, role: 'creator' as StakeholderRole, name: 'Asset Originator', organization: 'Aurigraph Asset Services' }, ...baseStakeholders]
  }

  // Get VVB provider based on asset type
  const getVVBProvider = (assetType: string): string => {
    const providers: Record<string, string> = {
      'DIGITAL_ART': 'Verisart Digital Authentication',
      'REAL_ESTATE': 'CBRE Property Verification',
      'CARBON_CREDIT': 'Verra Carbon Standards',
      'FINANCIAL': 'Moody\'s Analytics',
      'SUPPLY_CHAIN': 'SGS Supply Chain Audit',
      'INTELLECTUAL_PROPERTY': 'USPTO Patent Services',
      'COMMODITY': 'LBMA Gold Verification',
    }
    return providers[assetType] || 'Aurigraph Verification Services'
  }

  return {
    id: `demo_token_${Date.now()}_${featuredAsset.id}`,
    name: featuredAsset.name,
    symbol: featuredAsset.id.toUpperCase().replace(/_/g, '').slice(0, 8),
    assetType: featuredAsset.assetType,
    description: featuredAsset.description,
    value: featuredAsset.value,
    currency: featuredAsset.currency,
    imageUrl: featuredAsset.imageUrl,
    creator: getStakeholdersForAssetType(featuredAsset.assetType)[0],
    stakeholders: getStakeholdersForAssetType(featuredAsset.assetType),
    compositeTokens: [
      {
        type: 'OWNER',
        tokenId: `owner_token_${featuredAsset.id}`,
        standard: 'ERC-721',
        status: 'verified',
        data: {
          ownerName: 'Marcus Chen',
          legalEntity: 'Chen Asset Holdings LLC',
          ownershipPercentage: featuredAsset.assetType === 'REAL_ESTATE' ? '25%' : '100%',
          transferRights: 'Full transfer rights with regulatory compliance',
          acquisitionDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        linkedAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'COLLATERAL',
        tokenId: `collateral_token_${featuredAsset.id}`,
        standard: 'ERC-1155',
        status: 'active',
        data: {
          collateralValue: `$${featuredAsset.value.toLocaleString()} ${featuredAsset.currency}`,
          lienPosition: 'First Lien',
          securityAgreement: `SA-2025-${featuredAsset.id.toUpperCase()}`,
          releaseConditions: 'Full repayment or asset transfer',
          collateralRatio: '150%',
        },
        linkedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'MEDIA',
        tokenId: `media_token_${featuredAsset.id}`,
        standard: 'ERC-1155',
        status: 'verified',
        data: {
          originalFile: `${featuredAsset.id}_documentation.pdf`,
          fileSize: '45.2 MB',
          resolution: 'High Definition',
          ipfsHash: `Qm${featuredAsset.id.slice(0, 8)}...xyz789`,
          arweaveId: `ar://${featuredAsset.id.slice(0, 8)}...def456`,
          thumbnails: '3 sizes available',
        },
        linkedAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'VERIFICATION',
        tokenId: `verification_token_${featuredAsset.id}`,
        standard: 'ERC-721',
        status: 'verified',
        data: {
          vvbProvider: getVVBProvider(featuredAsset.assetType),
          verificationDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          auditReport: `VER-2025-${featuredAsset.assetType.slice(0, 3)}-001`,
          complianceStatus: 'Fully Compliant',
          authenticityScore: '97.8%',
        },
        linkedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'VALUATION',
        tokenId: `valuation_token_${featuredAsset.id}`,
        standard: 'ERC-20',
        status: 'verified',
        data: {
          marketValue: `$${featuredAsset.value.toLocaleString()} ${featuredAsset.currency}`,
          appraisalDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          appraiser: 'Aurigraph Valuation Services',
          methodology: 'Market Comparable + Discounted Cash Flow',
          confidenceLevel: 'High (94%)',
        },
        linkedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      },
      {
        type: 'COMPLIANCE',
        tokenId: `compliance_token_${featuredAsset.id}`,
        standard: 'ERC-721',
        status: 'verified',
        data: {
          jurisdiction: 'United States, European Union, Singapore',
          regulations: featuredAsset.assetType === 'FINANCIAL' ? 'SEC Reg D, MiFID II' : 'MiCA, SEC Guidelines',
          certifications: 'ISO 27001, SOC 2 Type II',
          kycStatus: 'Verified',
          amlStatus: 'Cleared',
          expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        },
        linkedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
    ],
    vvbVerification: {
      provider: getVVBProvider(featuredAsset.assetType),
      providerId: `vvb_${featuredAsset.id}`,
      status: 'approved',
      submittedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
      reportUrl: `/reports/VER-2025-${featuredAsset.id.toUpperCase()}.pdf`,
      score: 97.8,
      comments: [
        `Asset authenticity verified through ${getVVBProvider(featuredAsset.assetType)}`,
        'All documentation reviewed and validated',
        'Ownership chain fully documented on blockchain',
        'Regulatory compliance confirmed',
      ],
    },
    timeline: [
      {
        step: 1,
        title: 'Asset Registered',
        description: `${featuredAsset.name} registered on Aurigraph platform`,
        completedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
        actor: 'Asset Originator',
        action: 'Initiated tokenization',
      },
      {
        step: 2,
        title: 'Documentation Uploaded',
        description: 'All supporting documents uploaded to decentralized storage',
        completedAt: new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000),
        actor: 'Asset Originator',
        action: 'Uploaded to IPFS and Arweave',
      },
      {
        step: 3,
        title: 'VVB Submitted',
        description: `Submitted for verification to ${getVVBProvider(featuredAsset.assetType)}`,
        completedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        actor: 'System',
        action: 'VVB assignment',
      },
      {
        step: 4,
        title: 'Verification Complete',
        description: 'Asset authenticity and documentation verified',
        completedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        actor: getVVBProvider(featuredAsset.assetType),
        action: 'Verification approved',
      },
      {
        step: 5,
        title: 'Valuation Completed',
        description: 'Professional appraisal completed',
        completedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        actor: 'Aurigraph Valuation Services',
        action: `Appraised at $${featuredAsset.value.toLocaleString()}`,
      },
      {
        step: 6,
        title: 'Legal Review',
        description: 'Legal documentation and transfer rights reviewed',
        completedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
        actor: 'Baker McKenzie LLP',
        action: 'Legal clearance granted',
      },
      {
        step: 7,
        title: 'Compliance Check',
        description: 'KYC/AML compliance verification completed',
        completedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        actor: 'Aurigraph Compliance',
        action: 'Compliance approved',
      },
      {
        step: 8,
        title: 'Token Minted',
        description: 'Primary token and composite tokens minted',
        completedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        actor: 'System',
        action: 'Tokens minted on Aurigraph DLT',
      },
    ],
    status: 'listed',
    createdAt: now,
    expiresAt: expiresAt,
    metadata: {
      blockchain: 'Aurigraph DLT V12',
      contractAddress: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`,
      tokenStandard: 'ERC-721 (Primary) + ERC-1155/ERC-20 (Composite)',
      totalSupply: featuredAsset.assetType === 'REAL_ESTATE' ? 1000 : 1,
      decimals: featuredAsset.assetType === 'REAL_ESTATE' ? 18 : 0,
      mintable: false,
      burnable: false,
      transferable: true,
    },
  }
}

// Demo Token Service Class
class DemoTokenServiceClass {
  private tokens: Map<string, DemoToken> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const now = new Date()

        // Filter out expired tokens
        Object.entries(data).forEach(([id, token]: [string, any]) => {
          const expiresAt = new Date(token.expiresAt)
          if (expiresAt > now) {
            // Restore Date objects
            token.createdAt = new Date(token.createdAt)
            token.expiresAt = new Date(token.expiresAt)
            token.vvbVerification.submittedAt = new Date(token.vvbVerification.submittedAt)
            if (token.vvbVerification.completedAt) {
              token.vvbVerification.completedAt = new Date(token.vvbVerification.completedAt)
            }
            token.timeline.forEach((item: any) => {
              if (item.completedAt) item.completedAt = new Date(item.completedAt)
            })
            token.compositeTokens.forEach((ct: any) => {
              ct.linkedAt = new Date(ct.linkedAt)
            })
            this.tokens.set(id, token)
          }
        })

        this.saveToStorage()
      }
    } catch (error) {
      console.error('Failed to load demo tokens from storage:', error)
    }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, DemoToken> = {}
      this.tokens.forEach((token, id) => {
        data[id] = token
      })
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save demo tokens to storage:', error)
    }
  }

  /**
   * Get or create the demo Digital Art token
   */
  getOrCreateDemoToken(): DemoToken {
    // Check for existing demo token
    const existingToken = Array.from(this.tokens.values()).find(
      t => t.assetType === 'DIGITAL_ART' && t.name === 'Cosmic Dreams #42'
    )

    if (existingToken && new Date(existingToken.expiresAt) > new Date()) {
      console.log('✅ Using existing demo token:', existingToken.id)
      return existingToken
    }

    // Create new demo token
    const newToken = createDemoDigitalArtToken()
    this.tokens.set(newToken.id, newToken)
    this.saveToStorage()
    console.log('✨ Created new demo token:', newToken.id)
    return newToken
  }

  /**
   * Get a demo token by ID
   */
  getToken(id: string): DemoToken | undefined {
    const token = this.tokens.get(id)
    if (token && new Date(token.expiresAt) > new Date()) {
      return token
    }
    return undefined
  }

  /**
   * Get all active demo tokens
   */
  getAllTokens(): DemoToken[] {
    const now = new Date()
    return Array.from(this.tokens.values()).filter(t => new Date(t.expiresAt) > now)
  }

  /**
   * Get remaining time for a token
   */
  getRemainingTime(tokenId: string): { hours: number; minutes: number } | null {
    const token = this.tokens.get(tokenId)
    if (!token) return null

    const now = new Date()
    const expiresAt = new Date(token.expiresAt)
    const diffMs = expiresAt.getTime() - now.getTime()

    if (diffMs <= 0) return null

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return { hours, minutes }
  }

  /**
   * Extend token expiry by 48 hours
   */
  extendTokenExpiry(tokenId: string): boolean {
    const token = this.tokens.get(tokenId)
    if (!token) return false

    const newExpiry = new Date(token.expiresAt.getTime() + DEMO_EXPIRY_HOURS * 60 * 60 * 1000)
    token.expiresAt = newExpiry
    this.saveToStorage()
    return true
  }

  /**
   * Delete a demo token
   */
  deleteToken(tokenId: string): boolean {
    const deleted = this.tokens.delete(tokenId)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens(): number {
    const now = new Date()
    let cleaned = 0

    this.tokens.forEach((token, id) => {
      if (new Date(token.expiresAt) <= now) {
        this.tokens.delete(id)
        cleaned++
      }
    })

    if (cleaned > 0) {
      this.saveToStorage()
    }

    return cleaned
  }

  /**
   * Get demo workflow steps for guided experience
   */
  getDemoWorkflowSteps(): DemoWorkflowStep[] {
    return DEMO_WORKFLOW_STEPS
  }

  /**
   * Get stakeholder by role
   */
  getStakeholder(role: StakeholderRole): DemoStakeholder | undefined {
    return Object.values(DEMO_STAKEHOLDERS).find(s => s.role === role)
  }

  /**
   * Get all stakeholders
   */
  getAllStakeholders(): DemoStakeholder[] {
    return Object.values(DEMO_STAKEHOLDERS)
  }

  /**
   * Get all featured assets
   */
  getFeaturedAssets(): FeaturedAsset[] {
    return FEATURED_ASSETS
  }

  /**
   * Get featured asset by ID
   */
  getFeaturedAsset(assetId: string): FeaturedAsset | undefined {
    return FEATURED_ASSETS.find(a => a.id === assetId)
  }

  /**
   * Get featured asset by use case
   */
  getFeaturedAssetByUseCase(useCase: string): FeaturedAsset | undefined {
    return FEATURED_ASSETS.find(a => a.useCase === useCase)
  }

  /**
   * Get or create demo token for a specific featured asset
   */
  getOrCreateDemoTokenForAsset(assetId: string): DemoToken | null {
    const featuredAsset = FEATURED_ASSETS.find(a => a.id === assetId)
    if (!featuredAsset) {
      console.error('Featured asset not found:', assetId)
      return null
    }

    // Check for existing token for this asset type
    const existingToken = Array.from(this.tokens.values()).find(
      t => t.assetType === featuredAsset.assetType && t.name === featuredAsset.name
    )

    if (existingToken && new Date(existingToken.expiresAt) > new Date()) {
      console.log('✅ Using existing demo token for asset:', featuredAsset.name)
      return existingToken
    }

    // Create new token for this featured asset
    const newToken = createDemoTokenForAsset(featuredAsset)
    this.tokens.set(newToken.id, newToken)
    this.saveToStorage()
    console.log('✨ Created new demo token for asset:', featuredAsset.name)
    return newToken
  }

  /**
   * Get active token for a featured asset
   */
  getActiveTokenForAsset(assetId: string): DemoToken | undefined {
    const featuredAsset = FEATURED_ASSETS.find(a => a.id === assetId)
    if (!featuredAsset) return undefined

    return Array.from(this.tokens.values()).find(
      t => t.assetType === featuredAsset.assetType &&
           t.name === featuredAsset.name &&
           new Date(t.expiresAt) > new Date()
    )
  }

  /**
   * Get the currently selected/active demo token
   * Returns the most recently created token or the Digital Art token as default
   */
  getCurrentDemoToken(): DemoToken | null {
    const allTokens = this.getAllTokens()
    if (allTokens.length === 0) {
      return this.getOrCreateDemoToken()
    }
    // Return the most recently created token
    return allTokens.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  }
}

// Demo Workflow Steps for Click-Through Experience
export interface DemoWorkflowStep {
  id: string
  title: string
  description: string
  stakeholder: StakeholderRole
  duration: string
  actions: string[]
  highlights: string[]
}

const DEMO_WORKFLOW_STEPS: DemoWorkflowStep[] = [
  {
    id: 'step_1',
    title: 'Asset Creation',
    description: 'Artist creates and uploads digital artwork with metadata',
    stakeholder: 'creator',
    duration: '~5 minutes',
    actions: [
      'Upload high-resolution artwork',
      'Add metadata and description',
      'Set royalty percentage',
      'Sign with digital signature',
    ],
    highlights: [
      'Decentralized storage (IPFS/Arweave)',
      'Cryptographic file hashing',
      'Immutable provenance record',
    ],
  },
  {
    id: 'step_2',
    title: 'VVB Verification',
    description: 'Validation and Verification Body authenticates the asset',
    stakeholder: 'verifier',
    duration: '14-21 days',
    actions: [
      'Submit to VVB for review',
      'Document verification',
      'Authenticity assessment',
      'Generate verification report',
    ],
    highlights: [
      'ISO-certified verification process',
      'Blockchain-anchored attestation',
      'Multi-party validation',
    ],
  },
  {
    id: 'step_3',
    title: 'Professional Valuation',
    description: 'Certified appraiser determines market value',
    stakeholder: 'appraiser',
    duration: '7-14 days',
    actions: [
      'Market analysis',
      'Comparable sales review',
      'Artist portfolio assessment',
      'Issue valuation certificate',
    ],
    highlights: [
      'Industry-standard methodology',
      'On-chain valuation record',
      'Periodic revaluation triggers',
    ],
  },
  {
    id: 'step_4',
    title: 'Legal Review',
    description: 'Legal team reviews ownership and transfer rights',
    stakeholder: 'legal',
    duration: '5-10 days',
    actions: [
      'Review ownership documents',
      'Verify intellectual property rights',
      'Draft transfer agreements',
      'Ensure regulatory compliance',
    ],
    highlights: [
      'Smart contract legal framework',
      'Automated royalty enforcement',
      'Multi-jurisdiction support',
    ],
  },
  {
    id: 'step_5',
    title: 'Compliance Check',
    description: 'KYC/AML verification and regulatory compliance',
    stakeholder: 'compliance',
    duration: '1-3 days',
    actions: [
      'KYC verification',
      'AML screening',
      'Sanctions list check',
      'Issue compliance certificate',
    ],
    highlights: [
      'Automated compliance checks',
      'Real-time sanctions screening',
      'Regulatory reporting ready',
    ],
  },
  {
    id: 'step_6',
    title: 'Token Minting',
    description: 'Primary token and composite tokens are minted',
    stakeholder: 'custodian',
    duration: '~30 seconds',
    actions: [
      'Mint primary ERC-721 token',
      'Create composite tokens (6 types)',
      'Link tokens in topology',
      'Store in secure custody',
    ],
    highlights: [
      'Atomic multi-token minting',
      'Composite token architecture',
      'Gas-optimized transactions',
    ],
  },
  {
    id: 'step_7',
    title: 'Ownership Transfer',
    description: 'Token ownership transferred to buyer',
    stakeholder: 'owner',
    duration: '~1 minute',
    actions: [
      'Initiate transfer request',
      'Multi-signature approval',
      'Update ownership token',
      'Record on blockchain',
    ],
    highlights: [
      'Instant settlement',
      'Automatic royalty distribution',
      'Complete audit trail',
    ],
  },
  {
    id: 'step_8',
    title: 'Marketplace Listing',
    description: 'Token listed for trading or fractional investment',
    stakeholder: 'investor',
    duration: '~2 minutes',
    actions: [
      'Set listing parameters',
      'Enable fractional ownership',
      'Configure trading rules',
      'Go live on marketplace',
    ],
    highlights: [
      'Fractional ownership support',
      'Secondary market trading',
      'Dividend distribution ready',
    ],
  },
]

// Singleton instance
export const DemoTokenService = new DemoTokenServiceClass()

// Export for testing and external use
export {
  createDemoDigitalArtToken,
  createDemoTokenForAsset,
  DEMO_STAKEHOLDERS,
  DEMO_WORKFLOW_STEPS
}

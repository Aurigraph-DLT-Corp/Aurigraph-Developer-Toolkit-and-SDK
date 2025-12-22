/**
 * Route Configuration
 *
 * Complete route definitions for the Aurigraph Enterprise Portal v4.6+
 * Using React Router v6 with lazy loading and code splitting
 */

import { lazy } from 'react';

// Lazy-loaded components
const LandingPage = lazy(() => import('../components/LandingPage'));
const Dashboard = lazy(() => import('../components/DashboardIntegrated'));
const Monitoring = lazy(() => import('../components/Monitoring'));
const DemoApp = lazy(() => import('../components/demo-app/DemoApp'));
const DemoChannelApp = lazy(() => import('../components/demo/DemoChannelApp'));

// Blockchain components
const TransactionExplorer = lazy(() => import('../components/comprehensive/TransactionExplorerIntegrated'));
const BlockExplorer = lazy(() => import('../components/comprehensive/BlockExplorer'));
const ValidatorDashboard = lazy(() => import('../components/comprehensive/ValidatorDashboard'));

// AI & Security components
const AIOptimizationControls = lazy(() => import('../components/comprehensive/AIOptimizationControls'));
const QuantumSecurityPanel = lazy(() => import('../components/comprehensive/QuantumSecurityPanel'));

// Integration components
const CrossChainBridge = lazy(() => import('../components/comprehensive/CrossChainBridge'));

// Smart Contracts
const ActiveContracts = lazy(() => import('../components/comprehensive/ActiveContracts'));
const SmartContractRegistry = lazy(() => import('../components/comprehensive/SmartContractRegistry'));
const RicardianContractUpload = lazy(() => import('../components/comprehensive/RicardianContractUpload'));

// Tokenization
const Tokenization = lazy(() => import('../components/comprehensive/Tokenization'));
const TokenizationRegistry = lazy(() => import('../components/comprehensive/TokenizationRegistry'));
const ExternalAPITokenization = lazy(() => import('../components/comprehensive/ExternalAPITokenization'));
const RWATRegistry = lazy(() => import('../components/comprehensive/RWATRegistry'));

// Registries & Traceability
const AssetTraceability = lazy(() => import('../components/comprehensive/AssetTraceability'));
const ContractAssetLinks = lazy(() => import('../components/comprehensive/ContractAssetLinks'));
const TraceabilityManagement = lazy(() => import('../components/comprehensive/TraceabilityManagement'));
const RegistryManagement = lazy(() => import('../components/comprehensive/RegistryManagement'));

// Additional components
const UserManagement = lazy(() => import('../components/UserManagement'));
const ComplianceDashboard = lazy(() => import('../components/compliance/ComplianceDashboard'));
const MerkleTreeRegistry = lazy(() => import('../components/registry/MerkleTreeRegistry'));
const Whitepaper = lazy(() => import('../components/comprehensive/Whitepaper'));
const RWATTokenizationForm = lazy(() => import('../components/rwat/RWATTokenizationForm'));
const VVBApprovalWorkflow = lazy(() => import('../components/rwat/VVBApprovalWorkflow'));
const AssetBackedStablecoin = lazy(() => import('../components/rwat/AssetBackedStablecoin'));

// New Comprehensive RWAT & Contracts components
const RWATokenizationDashboard = lazy(() => import('../components/comprehensive/RWATokenizationDashboard'));
const AssetFractionalOwnershipUI = lazy(() => import('../components/comprehensive/AssetFractionalOwnershipUI'));

// Banking & Trade Finance
const BankingTokenization = lazy(() => import('../components/banking/BankingTokenization'));

// Admin & Infrastructure
const InfrastructureMonitoring = lazy(() => import('../components/admin/InfrastructureMonitoring'));
const RWATAssetSettings = lazy(() => import('../components/admin/RWATAssetSettings'));

// User & Referral
const UserReferralProgram = lazy(() => import('../components/UserReferralProgram'));

/**
 * Route definition interface
 */
export interface RouteDefinition {
  path: string;
  component: any; // React.LazyExoticComponent or FC
  label: string;
  breadcrumbLabel: string;
  parent?: string;
  icon?: string;
  description?: string;
  category?: 'demo' | 'blockchain' | 'contracts' | 'tokenization' | 'rwat' | 'banking' | 'compliance' | 'registries' | 'ai' | 'integration' | 'admin';
  order?: number;
}

/**
 * Complete route definitions for all portal pages
 * Organized by functional category
 */
export const routes: RouteDefinition[] = [
  // =========================================================================
  // HOME & MAIN
  // =========================================================================
  {
    path: '/',
    component: LandingPage,
    label: 'Home',
    breadcrumbLabel: 'Home',
    icon: 'HomeOutlined',
    order: 0,
  },

  // =========================================================================
  // BLOCKCHAIN & TRANSACTIONS (Category)
  // =========================================================================
  {
    path: '/dashboard',
    component: Dashboard,
    label: 'Dashboard',
    breadcrumbLabel: 'Dashboard',
    parent: '/',
    icon: 'DashboardOutlined',
    description: 'Main analytics dashboard',
    category: 'blockchain',
    order: 10,
  },
  {
    path: '/transactions',
    component: TransactionExplorer,
    label: 'Transactions',
    breadcrumbLabel: 'Transaction Explorer',
    parent: '/dashboard',
    icon: 'LineChartOutlined',
    description: 'Explore and analyze transactions',
    category: 'blockchain',
    order: 11,
  },
  {
    path: '/blocks',
    component: BlockExplorer,
    label: 'Blocks',
    breadcrumbLabel: 'Block Explorer',
    parent: '/dashboard',
    icon: 'BlockOutlined',
    description: 'Browse blockchain blocks',
    category: 'blockchain',
    order: 12,
  },
  {
    path: '/validators',
    component: ValidatorDashboard,
    label: 'Validators',
    breadcrumbLabel: 'Validator Dashboard',
    parent: '/dashboard',
    icon: 'NodeIndexOutlined',
    description: 'Monitor validator nodes',
    category: 'blockchain',
    order: 13,
  },
  {
    path: '/monitoring',
    component: Monitoring,
    label: 'Monitoring',
    breadcrumbLabel: 'Network Monitoring',
    parent: '/dashboard',
    icon: 'LineChartOutlined',
    description: 'Monitor network performance',
    category: 'blockchain',
    order: 14,
  },

  // =========================================================================
  // DEMO APPLICATIONS
  // =========================================================================
  {
    path: '/demo-app',
    component: DemoApp,
    label: 'Demo App',
    breadcrumbLabel: 'Demo Application',
    icon: 'RocketOutlined',
    description: 'Interactive demo application with real-time performance monitoring',
    category: 'demo',
    order: 5,
  },
  {
    path: '/demo-channel',
    component: DemoChannelApp,
    label: 'Demo Channel',
    breadcrumbLabel: 'Demo Channel App',
    icon: 'NodeIndexOutlined',
    description: 'Channel-based demo with multi-node simulation',
    category: 'demo',
    order: 6,
  },

  // =========================================================================
  // SMART CONTRACTS (Category)
  // =========================================================================
  {
    path: '/contracts',
    component: ActiveContracts,
    label: 'Smart Contracts',
    breadcrumbLabel: 'Smart Contracts',
    parent: '/',
    icon: 'FileTextOutlined',
    description: 'Manage smart contracts',
    category: 'contracts',
    order: 20,
  },
  {
    path: '/contracts/active',
    component: ActiveContracts,
    label: 'Active Contracts',
    breadcrumbLabel: 'Active Contracts',
    parent: '/contracts',
    icon: 'FileTextOutlined',
    description: 'View active contract deployments',
    category: 'contracts',
    order: 21,
  },
  {
    path: '/contracts/registry',
    component: SmartContractRegistry,
    label: 'Contract Registry',
    breadcrumbLabel: 'Smart Contract Registry',
    parent: '/contracts',
    icon: 'FileTextOutlined',
    description: 'Browse all contracts',
    category: 'contracts',
    order: 22,
  },
  {
    path: '/contracts/ricardian',
    component: RicardianContractUpload,
    label: 'Ricardian Contracts',
    breadcrumbLabel: 'Ricardian Contract Upload',
    parent: '/contracts',
    icon: 'FileAddOutlined',
    description: 'Upload and manage Ricardian contracts',
    category: 'contracts',
    order: 23,
  },

  // =========================================================================
  // RWA TOKENIZATION (Category)
  // =========================================================================
  {
    path: '/tokenization',
    component: Tokenization,
    label: 'Tokenization',
    breadcrumbLabel: 'RWA Tokenization',
    parent: '/',
    icon: 'DollarOutlined',
    description: 'Tokenize real-world assets',
    category: 'tokenization',
    order: 30,
  },
  {
    path: '/tokenization/create',
    component: Tokenization,
    label: 'Create Token',
    breadcrumbLabel: 'Create RWA Token',
    parent: '/tokenization',
    icon: 'DollarOutlined',
    description: 'Create new tokenized asset',
    category: 'tokenization',
    order: 31,
  },
  {
    path: '/tokenization/registry',
    component: TokenizationRegistry,
    label: 'Token Registry',
    breadcrumbLabel: 'Tokenization Registry',
    parent: '/tokenization',
    icon: 'GoldOutlined',
    description: 'View all tokens',
    category: 'tokenization',
    order: 32,
  },
  {
    path: '/tokenization/external-api',
    component: ExternalAPITokenization,
    label: 'External API',
    breadcrumbLabel: 'External API Tokenization',
    parent: '/tokenization',
    icon: 'ApiOutlined',
    description: 'Tokenize via external API',
    category: 'tokenization',
    order: 33,
  },
  {
    path: '/tokenization/rwa',
    component: RWATRegistry,
    label: 'RWA Registry',
    breadcrumbLabel: 'RWA Registry',
    parent: '/tokenization',
    icon: 'BankOutlined',
    description: 'Real-world asset registry',
    category: 'tokenization',
    order: 34,
  },
  {
    path: '/tokenization/vvb-approval',
    component: VVBApprovalWorkflow,
    label: 'VVB Approval',
    breadcrumbLabel: 'VVB Approval Workflow',
    parent: '/tokenization',
    icon: 'VerifiedUserOutlined',
    description: 'Validation and Verification Body approval workflow',
    category: 'tokenization',
    order: 35,
  },
  {
    path: '/tokenization/stablecoin',
    component: AssetBackedStablecoin,
    label: 'Stablecoins',
    breadcrumbLabel: 'Asset-Backed Stablecoins',
    parent: '/tokenization',
    icon: 'AccountBalanceOutlined',
    description: 'Asset-backed stablecoin management with Proof of Reserve',
    category: 'tokenization',
    order: 36,
  },

  // =========================================================================
  // RWAT - REAL WORLD ASSET TOKENIZATION (Category)
  // All asset categories for tokenization
  // =========================================================================
  {
    path: '/rwat',
    component: RWATRegistry,
    label: 'RWAT',
    breadcrumbLabel: 'Real World Asset Tokenization',
    parent: '/',
    icon: 'GoldOutlined',
    description: 'Real World Asset Tokenization - All Categories',
    category: 'rwat',
    order: 37,
  },
  {
    path: '/rwat/real-estate',
    component: RWATTokenizationForm,
    label: 'Real Estate',
    breadcrumbLabel: 'Real Estate Tokenization',
    parent: '/rwat',
    icon: 'HomeOutlined',
    description: 'Tokenize commercial and residential real estate',
    category: 'rwat',
    order: 38,
  },
  {
    path: '/rwat/commodities',
    component: RWATTokenizationForm,
    label: 'Commodities',
    breadcrumbLabel: 'Commodities Tokenization',
    parent: '/rwat',
    icon: 'GoldOutlined',
    description: 'Tokenize agricultural and industrial commodities',
    category: 'rwat',
    order: 39,
  },
  {
    path: '/rwat/precious-metals',
    component: RWATTokenizationForm,
    label: 'Precious Metals',
    breadcrumbLabel: 'Precious Metals Tokenization',
    parent: '/rwat',
    icon: 'GoldOutlined',
    description: 'Gold, silver, platinum and other precious metals',
    category: 'rwat',
    order: 40,
  },
  {
    path: '/rwat/art',
    component: RWATTokenizationForm,
    label: 'Fine Art',
    breadcrumbLabel: 'Fine Art Tokenization',
    parent: '/rwat',
    icon: 'PictureOutlined',
    description: 'Tokenize paintings, sculptures and fine art',
    category: 'rwat',
    order: 41,
  },
  {
    path: '/rwat/digital-art',
    component: RWATTokenizationForm,
    label: 'Digital Art & NFTs',
    breadcrumbLabel: 'Digital Art Tokenization',
    parent: '/rwat',
    icon: 'PictureOutlined',
    description: 'Digital art, NFTs and collectible media',
    category: 'rwat',
    order: 42,
  },
  {
    path: '/rwat/collectibles',
    component: RWATTokenizationForm,
    label: 'Collectibles',
    breadcrumbLabel: 'Collectibles Tokenization',
    parent: '/rwat',
    icon: 'TrophyOutlined',
    description: 'Rare items, antiques and collectibles',
    category: 'rwat',
    order: 43,
  },
  {
    path: '/rwat/carbon-credits',
    component: RWATTokenizationForm,
    label: 'Carbon Credits',
    breadcrumbLabel: 'Carbon Credits Tokenization',
    parent: '/rwat',
    icon: 'CloudOutlined',
    description: 'Carbon offsets and environmental credits',
    category: 'rwat',
    order: 44,
  },
  {
    path: '/rwat/bonds',
    component: RWATTokenizationForm,
    label: 'Bonds',
    breadcrumbLabel: 'Bonds Tokenization',
    parent: '/rwat',
    icon: 'FileTextOutlined',
    description: 'Government and corporate bonds',
    category: 'rwat',
    order: 45,
  },
  {
    path: '/rwat/equities',
    component: RWATTokenizationForm,
    label: 'Equities',
    breadcrumbLabel: 'Equities Tokenization',
    parent: '/rwat',
    icon: 'StockOutlined',
    description: 'Stocks, shares and equity instruments',
    category: 'rwat',
    order: 46,
  },
  {
    path: '/rwat/intellectual-property',
    component: RWATTokenizationForm,
    label: 'Intellectual Property',
    breadcrumbLabel: 'IP Tokenization',
    parent: '/rwat',
    icon: 'BulbOutlined',
    description: 'Patents, trademarks and copyrights',
    category: 'rwat',
    order: 47,
  },
  {
    path: '/rwat/patents',
    component: RWATTokenizationForm,
    label: 'Patents',
    breadcrumbLabel: 'Patents Tokenization',
    parent: '/rwat',
    icon: 'FileProtectOutlined',
    description: 'Patent rights and licensing',
    category: 'rwat',
    order: 48,
  },
  {
    path: '/rwat/trademarks',
    component: RWATTokenizationForm,
    label: 'Trademarks',
    breadcrumbLabel: 'Trademarks Tokenization',
    parent: '/rwat',
    icon: 'TrademarkOutlined',
    description: 'Trademark rights and brand assets',
    category: 'rwat',
    order: 49,
  },
  {
    path: '/rwat/copyrights',
    component: RWATTokenizationForm,
    label: 'Copyrights',
    breadcrumbLabel: 'Copyrights Tokenization',
    parent: '/rwat',
    icon: 'CopyrightOutlined',
    description: 'Copyright and content licensing',
    category: 'rwat',
    order: 50,
  },
  {
    path: '/rwat/vvb-approval',
    component: VVBApprovalWorkflow,
    label: 'VVB Approval',
    breadcrumbLabel: 'VVB Approval Workflow',
    parent: '/rwat',
    icon: 'SafetyCertificateOutlined',
    description: 'Asset validation and verification',
    category: 'rwat',
    order: 51,
  },
  {
    path: '/rwat/stablecoins',
    component: AssetBackedStablecoin,
    label: 'Asset-Backed Stablecoins',
    breadcrumbLabel: 'Stablecoin Management',
    parent: '/rwat',
    icon: 'DollarCircleOutlined',
    description: 'Asset-backed stablecoin issuance',
    category: 'rwat',
    order: 52,
  },
  {
    path: '/rwat/dashboard',
    component: RWATokenizationDashboard,
    label: 'RWA Dashboard',
    breadcrumbLabel: 'RWA Analytics Dashboard',
    parent: '/rwat',
    icon: 'DashboardOutlined',
    description: 'Real-time RWA tokenization analytics and metrics',
    category: 'rwat',
    order: 53,
  },
  {
    path: '/rwat/fractional-ownership',
    component: AssetFractionalOwnershipUI,
    label: 'Fractional Ownership',
    breadcrumbLabel: 'Fractional Ownership',
    parent: '/rwat',
    icon: 'PieChartOutlined',
    description: 'Manage fractional ownership of tokenized assets',
    category: 'rwat',
    order: 54,
  },

  // =========================================================================
  // BANKING & TRADE FINANCE (Category)
  // =========================================================================
  {
    path: '/banking',
    component: BankingTokenization,
    label: 'Banking',
    breadcrumbLabel: 'Banking & Trade Finance',
    parent: '/',
    icon: 'BankOutlined',
    description: 'Banking and trade finance tokenization',
    category: 'banking',
    order: 60,
  },
  {
    path: '/banking/tokenization',
    component: BankingTokenization,
    label: 'Trade Finance',
    breadcrumbLabel: 'Banking Tokenization',
    parent: '/banking',
    icon: 'DollarOutlined',
    description: 'Tokenize trade finance instruments',
    category: 'banking',
    order: 38,
  },
  {
    path: '/banking/deposits',
    component: BankingTokenization,
    label: 'Deposits & CDs',
    breadcrumbLabel: 'Deposits & Certificates',
    parent: '/banking',
    icon: 'SafetyOutlined',
    description: 'Bank deposits and certificates of deposit',
    category: 'banking',
    order: 39,
  },
  {
    path: '/banking/loans',
    component: BankingTokenization,
    label: 'Loans',
    breadcrumbLabel: 'Commercial Loans',
    parent: '/banking',
    icon: 'AccountBalanceOutlined',
    description: 'Commercial loans and mortgages',
    category: 'banking',
    order: 40,
  },
  {
    path: '/banking/invoice-factoring',
    component: BankingTokenization,
    label: 'Invoice Factoring',
    breadcrumbLabel: 'Invoice Factoring',
    parent: '/banking',
    icon: 'FileTextOutlined',
    description: 'Invoice financing and factoring',
    category: 'banking',
    order: 41,
  },
  {
    path: '/banking/supply-chain',
    component: BankingTokenization,
    label: 'Supply Chain Finance',
    breadcrumbLabel: 'Supply Chain Finance',
    parent: '/banking',
    icon: 'SwapOutlined',
    description: 'Supply chain financing instruments',
    category: 'banking',
    order: 42,
  },
  {
    path: '/banking/treasury',
    component: BankingTokenization,
    label: 'Treasury',
    breadcrumbLabel: 'Treasury Instruments',
    parent: '/banking',
    icon: 'GoldOutlined',
    description: 'Treasury instruments and management',
    category: 'banking',
    order: 43,
  },

  // =========================================================================
  // REGISTRIES & TRACEABILITY (Category)
  // =========================================================================
  {
    path: '/registries',
    component: RegistryManagement,
    label: 'Registries',
    breadcrumbLabel: 'Registry Management',
    parent: '/',
    icon: 'DatabaseOutlined',
    description: 'Manage all registries',
    category: 'registries',
    order: 40,
  },
  {
    path: '/registries/management',
    component: RegistryManagement,
    label: 'Registry Management',
    breadcrumbLabel: 'Registry Management',
    parent: '/registries',
    icon: 'DatabaseOutlined',
    description: 'Manage all system registries',
    category: 'registries',
    order: 41,
  },
  {
    path: '/registries/merkle',
    component: MerkleTreeRegistry,
    label: 'Merkle Tree Registry',
    breadcrumbLabel: 'Merkle Tree Registry',
    parent: '/registries',
    icon: 'DatabaseOutlined',
    description: 'Merkle tree based registry',
    category: 'registries',
    order: 42,
  },
  {
    path: '/traceability',
    component: AssetTraceability,
    label: 'Asset Traceability',
    breadcrumbLabel: 'Asset Traceability',
    parent: '/registries',
    icon: 'LinkOutlined',
    description: 'Track asset lineage',
    category: 'registries',
    order: 43,
  },
  {
    path: '/traceability/management',
    component: TraceabilityManagement,
    label: 'Traceability Management',
    breadcrumbLabel: 'Traceability Management',
    parent: '/traceability',
    icon: 'HistoryOutlined',
    description: 'Manage traceability records',
    category: 'registries',
    order: 44,
  },
  {
    path: '/traceability/contract-asset-links',
    component: ContractAssetLinks,
    label: 'Contract-Asset Links',
    breadcrumbLabel: 'Contract-Asset Links',
    parent: '/traceability',
    icon: 'LinkOutlined',
    description: 'Link contracts to assets',
    category: 'registries',
    order: 45,
  },

  // =========================================================================
  // COMPLIANCE & SECURITY (Category)
  // =========================================================================
  {
    path: '/compliance',
    component: ComplianceDashboard,
    label: 'Compliance',
    breadcrumbLabel: 'Compliance Dashboard',
    parent: '/',
    icon: 'SecurityScanOutlined',
    description: 'View compliance status',
    category: 'compliance',
    order: 50,
  },

  // =========================================================================
  // AI & OPTIMIZATION (Category)
  // =========================================================================
  {
    path: '/ai',
    component: AIOptimizationControls,
    label: 'AI Optimization',
    breadcrumbLabel: 'AI Optimization',
    parent: '/',
    icon: 'RobotOutlined',
    description: 'Configure AI optimization',
    category: 'ai',
    order: 60,
  },
  {
    path: '/ai/optimization',
    component: AIOptimizationControls,
    label: 'Optimization Controls',
    breadcrumbLabel: 'AI Optimization Controls',
    parent: '/ai',
    icon: 'RobotOutlined',
    description: 'AI-driven optimization settings',
    category: 'ai',
    order: 61,
  },
  {
    path: '/ai/quantum-security',
    component: QuantumSecurityPanel,
    label: 'Quantum Security',
    breadcrumbLabel: 'Quantum Security Panel',
    parent: '/ai',
    icon: 'SafetyOutlined',
    description: 'Quantum-resistant security',
    category: 'ai',
    order: 62,
  },
  // =========================================================================
  // INTEGRATION (Category)
  // =========================================================================
  {
    path: '/integration',
    component: CrossChainBridge,
    label: 'Integration',
    breadcrumbLabel: 'Cross-Chain Bridge',
    parent: '/',
    icon: 'SwapOutlined',
    description: 'Cross-chain integration',
    category: 'integration',
    order: 70,
  },
  {
    path: '/integration/cross-chain',
    component: CrossChainBridge,
    label: 'Cross-Chain Bridge',
    breadcrumbLabel: 'Cross-Chain Bridge',
    parent: '/integration',
    icon: 'SwapOutlined',
    description: 'Bridge assets across chains',
    category: 'integration',
    order: 71,
  },

  // =========================================================================
  // ADMINISTRATION (Category)
  // =========================================================================
  {
    path: '/admin/users',
    component: UserManagement,
    label: 'User Management',
    breadcrumbLabel: 'User Management',
    parent: '/',
    icon: 'TeamOutlined',
    description: 'Manage portal users',
    category: 'admin',
    order: 80,
  },
  {
    path: '/admin/rwat-form',
    component: RWATTokenizationForm,
    label: 'RWAT Form',
    breadcrumbLabel: 'RWAT Tokenization Form',
    parent: '/',
    icon: 'FormOutlined',
    description: 'RWAT tokenization form',
    category: 'admin',
    order: 81,
  },
  {
    path: '/admin/infrastructure',
    component: InfrastructureMonitoring,
    label: 'Infrastructure',
    breadcrumbLabel: 'Infrastructure Monitoring',
    parent: '/',
    icon: 'CloudServerOutlined',
    description: 'Monitor local and remote server infrastructure',
    category: 'admin',
    order: 82,
  },
  {
    path: '/admin/settings',
    component: RWATAssetSettings,
    label: 'Enterprise Settings',
    breadcrumbLabel: 'Enterprise Settings',
    parent: '/',
    icon: 'SettingOutlined',
    description: 'Configure enterprise-wide settings',
    category: 'admin',
    order: 83,
  },

  // =========================================================================
  // USER & REFERRAL PROGRAM
  // =========================================================================
  {
    path: '/user/profile',
    component: UserReferralProgram,
    label: 'My Profile',
    breadcrumbLabel: 'User Profile',
    parent: '/',
    icon: 'UserOutlined',
    description: 'View and manage your profile',
    category: 'admin',
    order: 83,
  },
  {
    path: '/user/referral',
    component: UserReferralProgram,
    label: 'Referral Program',
    breadcrumbLabel: 'Referral Program',
    parent: '/user/profile',
    icon: 'GiftOutlined',
    description: 'Earn rewards by referring friends',
    category: 'admin',
    order: 84,
  },
  {
    path: '/referral',
    component: UserReferralProgram,
    label: 'Referrals',
    breadcrumbLabel: 'Referral Program',
    parent: '/',
    icon: 'TeamOutlined',
    description: 'Manage your referrals and earn rewards',
    category: 'admin',
    order: 85,
  },

  // =========================================================================
  // DOCUMENTATION
  // =========================================================================
  {
    path: '/docs/whitepaper',
    component: Whitepaper,
    label: 'Whitepaper',
    breadcrumbLabel: 'Whitepaper',
    parent: '/',
    icon: 'FileTextOutlined',
    description: 'Project documentation',
    order: 100,
  },
];

/**
 * Helper function to find a route by path
 */
export const findRoute = (path: string): RouteDefinition | undefined => {
  return routes.find(route => route.path === path);
};

/**
 * Helper function to get all routes in a category
 */
export const getRoutesByCategory = (
  category: RouteDefinition['category']
): RouteDefinition[] => {
  return routes.filter(route => route.category === category);
};

/**
 * Helper function to get child routes
 */
export const getChildRoutes = (parentPath: string): RouteDefinition[] => {
  return routes.filter(route => route.parent === parentPath);
};

/**
 * Helper function to build breadcrumb path
 */
export const getBreadcrumbPath = (path: string): RouteDefinition[] => {
  const breadcrumbs: RouteDefinition[] = [];
  let currentPath = path;

  while (currentPath) {
    const route = findRoute(currentPath);
    if (!route) break;

    breadcrumbs.unshift(route);
    currentPath = route.parent || '';
  }

  return breadcrumbs;
};

/**
 * Export default routes array for use in App.tsx
 */
export default routes;

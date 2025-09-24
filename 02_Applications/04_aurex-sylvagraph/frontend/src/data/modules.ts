import { 
  Shield, 
  Users, 
  MapPin, 
  User,
  Key,
  Settings,
  Smartphone,
  Plane,
  Satellite,
  Database,
  Brain,
  FileCheck,
  FileText,
  CheckSquare,
  Coins,
  Layers,
  Link,
  ArrowUpDown,
  DollarSign,
  BarChart3,
  Lock,
  AlertTriangle,
  Eye,
  Bell,
  Map,
  Calculator,
  BookOpen,
  Wrench,
  ShieldCheck,
  TrendingUp,
  Monitor,
  Camera,
  Thermometer,
  CloudRain,
  Wind,
  Wifi,
  TreePine,
  Activity,
  Zap,
  Globe,
  type LucideIcon
} from 'lucide-react'

export interface Module {
  id: string
  slug: string
  title: string
  description: string
  category: 'core' | 'dmrv' | 'mrv' | 'credits' | 'compliance'
  icon: LucideIcon
  path: string
  featured: boolean
}

export const modules: Module[] = [
  // Core (6 modules)
  {
    id: 'iam',
    slug: 'identity-access-management',
    title: 'Identity & Access Management (IAM)',
    description: 'User authentication, roles, and permissions management',
    category: 'core',
    icon: Shield,
    path: '/modules/identity-access-management',
    featured: true
  },
  {
    id: 'onboarding',
    slug: 'tenant-partner-onboarding',
    title: 'Tenant & Partner Onboarding',
    description: 'Streamlined onboarding process for new organizations',
    category: 'core',
    icon: Users,
    path: '/modules/tenant-partner-onboarding',
    featured: false
  },
  {
    id: 'project-management',
    slug: 'project-parcel-management',
    title: 'Project & Parcel Management',
    description: 'Comprehensive project lifecycle and land parcel tracking',
    category: 'core',
    icon: MapPin,
    path: '/modules/project-parcel-management',
    featured: true
  },
  {
    id: 'farmer-registry',
    slug: 'farmer-registry-profiles',
    title: 'Farmer Registry & Household Profiles',
    description: 'Detailed farmer and household information management',
    category: 'core',
    icon: User,
    path: '/modules/farmer-registry-profiles',
    featured: false
  },
  {
    id: 'api-gateway',
    slug: 'api-gateway-developer',
    title: 'API Gateway & Developer Access',
    description: 'Secure API access and developer tools',
    category: 'core',
    icon: Key,
    path: '/modules/api-gateway-developer',
    featured: false
  },
  {
    id: 'admin-console',
    slug: 'admin-console-configuration',
    title: 'Admin Console & Configuration',
    description: 'System administration and configuration management',
    category: 'core',
    icon: Settings,
    path: '/modules/admin-console-configuration',
    featured: false
  },

  // DMRV - Digital Monitoring, Reporting & Verification (12 modules)
  {
    id: 'forest-health-monitoring',
    slug: 'forest-health-monitoring',
    title: 'Forest Health Monitoring System',
    description: 'Real-time monitoring of forest health using satellite and IoT sensors',
    category: 'dmrv',
    icon: TreePine,
    path: '/modules/forest-health-monitoring',
    featured: true
  },
  {
    id: 'satellite-analysis-engine',
    slug: 'satellite-analysis-engine',
    title: 'Satellite Analysis Engine',
    description: 'Advanced satellite imagery processing for deforestation detection',
    category: 'dmrv',
    icon: Satellite,
    path: '/modules/satellite-analysis-engine',
    featured: true
  },
  {
    id: 'iot-sensor-network',
    slug: 'iot-sensor-network',
    title: 'IoT Sensor Network Management',
    description: 'Environmental sensor deployment and data collection system',
    category: 'dmrv',
    icon: Wifi,
    path: '/modules/iot-sensor-network',
    featured: true
  },
  {
    id: 'climate-weather-station',
    slug: 'climate-weather-station',
    title: 'Climate & Weather Station Integration',
    description: 'Real-time weather data collection and climate pattern analysis',
    category: 'dmrv',
    icon: CloudRain,
    path: '/modules/climate-weather-station',
    featured: false
  },
  {
    id: 'drone-lidar-processing',
    slug: 'drone-lidar-processing',
    title: 'Drone & LiDAR Processing System',
    description: '3D forest structure analysis using drone-mounted LiDAR sensors',
    category: 'dmrv',
    icon: Camera,
    path: '/modules/drone-lidar-processing',
    featured: true
  },
  {
    id: 'carbon-sequestration-tracking',
    slug: 'carbon-sequestration-tracking',
    title: 'Carbon Sequestration Tracking',
    description: 'Real-time carbon sequestration measurement and verification',
    category: 'dmrv',
    icon: Activity,
    path: '/modules/carbon-sequestration-tracking',
    featured: true
  },
  {
    id: 'biodiversity-assessment',
    slug: 'biodiversity-assessment',
    title: 'Biodiversity Assessment Module',
    description: 'Wildlife monitoring and ecosystem health evaluation system',
    category: 'dmrv',
    icon: Eye,
    path: '/modules/biodiversity-assessment',
    featured: true
  },
  {
    id: 'automated-reporting',
    slug: 'automated-reporting-dmrv',
    title: 'Automated DMRV Reporting',
    description: 'Continuous automated reporting for regulatory compliance',
    category: 'dmrv',
    icon: FileCheck,
    path: '/modules/automated-reporting-dmrv',
    featured: true
  },
  {
    id: 'real-time-dashboard',
    slug: 'real-time-dashboard',
    title: 'Real-time Monitoring Dashboard',
    description: 'Live dashboard with forest metrics and alert systems',
    category: 'dmrv',
    icon: Monitor,
    path: '/modules/real-time-dashboard',
    featured: false
  },
  {
    id: 'verification-engine',
    slug: 'verification-engine',
    title: 'Independent Verification Engine',
    description: 'Third-party verification and audit trail management',
    category: 'dmrv',
    icon: ShieldCheck,
    path: '/modules/verification-engine',
    featured: false
  },
  {
    id: 'alert-notification-system',
    slug: 'alert-notification-system',
    title: 'Alert & Notification System',
    description: 'Real-time alerts for deforestation, fires, and anomalies',
    category: 'dmrv',
    icon: Bell,
    path: '/modules/alert-notification-system',
    featured: false
  },
  {
    id: 'data-integrity-blockchain',
    slug: 'data-integrity-blockchain',
    title: 'Data Integrity & Blockchain Ledger',
    description: 'Immutable data storage and blockchain-based audit trails',
    category: 'dmrv',
    icon: Database,
    path: '/modules/data-integrity-blockchain',
    featured: false
  },

  // MRV (8 modules)
  {
    id: 'field-data',
    slug: 'field-data-collection',
    title: 'Field Data Collection (Mobile/Web)',
    description: 'Mobile and web-based data collection tools for field work',
    category: 'mrv',
    icon: Smartphone,
    path: '/modules/field-data-collection',
    featured: true
  },
  {
    id: 'drone-missions',
    slug: 'drone-mission-planner',
    title: 'Drone Mission Planner & Ingestion',
    description: 'Plan, execute, and process drone surveillance missions',
    category: 'mrv',
    icon: Plane,
    path: '/modules/drone-mission-planner',
    featured: true
  },
  {
    id: 'satellite-imagery',
    slug: 'satellite-imagery-connector',
    title: 'Satellite Imagery Connector',
    description: 'Integration with satellite imagery providers and analysis',
    category: 'mrv',
    icon: Satellite,
    path: '/modules/satellite-imagery-connector',
    featured: true
  },
  {
    id: 'geospatial-processing',
    slug: 'geospatial-processing-data-lake',
    title: 'Geospatial Processing & Data Lake',
    description: 'Advanced geospatial data processing and storage',
    category: 'mrv',
    icon: Database,
    path: '/modules/geospatial-processing-data-lake',
    featured: false
  },
  {
    id: 'ai-models',
    slug: 'biomass-biodiversity-ai',
    title: 'Biomass & Biodiversity AI Models',
    description: 'Machine learning models for biomass and biodiversity analysis',
    category: 'mrv',
    icon: Brain,
    path: '/modules/biomass-biodiversity-ai',
    featured: true
  },
  {
    id: 'dmrv-engine',
    slug: 'dmrv-compliance-engine',
    title: 'DMRV Compliance Engine',
    description: 'Digital measurement, reporting, and verification engine',
    category: 'mrv',
    icon: FileCheck,
    path: '/modules/dmrv-compliance-engine',
    featured: true
  },
  {
    id: 'document-generation',
    slug: 'document-generation-pdd',
    title: 'Document Generation (PDD & Monitoring)',
    description: 'Automated project design document and monitoring report generation',
    category: 'mrv',
    icon: FileText,
    path: '/modules/document-generation-pdd',
    featured: false
  },
  {
    id: 'vvb-portal',
    slug: 'vvb-portal-verification',
    title: 'VVB Portal (Verification Body)',
    description: 'Verification and validation body portal for independent assessment',
    category: 'mrv',
    icon: CheckSquare,
    path: '/modules/vvb-portal-verification',
    featured: false
  },

  // Credits & Markets (6 modules)
  {
    id: 'registry-integration',
    slug: 'registry-integration-serials',
    title: 'Registry Integration (Serials & Issuance)',
    description: 'Integration with carbon credit registries and serial number management',
    category: 'credits',
    icon: Coins,
    path: '/modules/registry-integration-serials',
    featured: false
  },
  {
    id: 'credit-batching',
    slug: 'credit-batching-ledger',
    title: 'Credit Batching & Ledger',
    description: 'Credit batch management and immutable ledger tracking',
    category: 'credits',
    icon: Layers,
    path: '/modules/credit-batching-ledger',
    featured: false
  },
  {
    id: 'tokenization',
    slug: 'tokenization-smart-contracts',
    title: 'Tokenization & Smart Contracts (ERC-1155)',
    description: 'Blockchain tokenization of carbon credits with smart contracts',
    category: 'credits',
    icon: Link,
    path: '/modules/tokenization-smart-contracts',
    featured: true
  },
  {
    id: 'exchange-integration',
    slug: 'exchange-bridge-integrations',
    title: 'Exchange & Bridge Integrations',
    description: 'Integration with carbon credit exchanges and blockchain bridges',
    category: 'credits',
    icon: ArrowUpDown,
    path: '/modules/exchange-bridge-integrations',
    featured: false
  },
  {
    id: 'payouts',
    slug: 'payouts-benefit-distribution',
    title: 'Payouts & Benefit Distribution',
    description: 'Automated payment distribution to farmers and stakeholders',
    category: 'credits',
    icon: DollarSign,
    path: '/modules/payouts-benefit-distribution',
    featured: true
  },
  {
    id: 'esg-reporting',
    slug: 'esg-reporting-disclosures',
    title: 'ESG Reporting & Disclosures',
    description: 'Comprehensive ESG reporting and regulatory disclosures',
    category: 'credits',
    icon: BarChart3,
    path: '/modules/esg-reporting-disclosures',
    featured: false
  },

  // Compliance & Ops (10 modules)
  {
    id: 'compliance-privacy',
    slug: 'compliance-privacy-consent',
    title: 'Compliance, Privacy & Consent (GDPR/DPDP)',
    description: 'Data protection and privacy compliance management',
    category: 'compliance',
    icon: Lock,
    path: '/modules/compliance-privacy-consent',
    featured: false
  },
  {
    id: 'risk-integrity',
    slug: 'risk-integrity-aml-kyc',
    title: 'Risk & Integrity (AML/KYC/Fraud)',
    description: 'Anti-money laundering, KYC, and fraud prevention systems',
    category: 'compliance',
    icon: AlertTriangle,
    path: '/modules/risk-integrity-aml-kyc',
    featured: false
  },
  {
    id: 'observability',
    slug: 'observability-quality-monitoring',
    title: 'Observability & Quality (Data & Model)',
    description: 'Data quality monitoring and model performance observability',
    category: 'compliance',
    icon: Eye,
    path: '/modules/observability-quality-monitoring',
    featured: false
  },
  {
    id: 'notifications',
    slug: 'notifications-workflows',
    title: 'Notifications & Workflows',
    description: 'Automated notifications and workflow management system',
    category: 'compliance',
    icon: Bell,
    path: '/modules/notifications-workflows',
    featured: false
  },
  {
    id: 'gis-visualization',
    slug: 'gis-visualization-map-ui',
    title: 'GIS Visualization & Map UI',
    description: 'Interactive mapping and geospatial visualization tools',
    category: 'compliance',
    icon: Map,
    path: '/modules/gis-visualization-map-ui',
    featured: false
  },
  {
    id: 'financials',
    slug: 'financials-accounting',
    title: 'Financials & Accounting (Phase 2)',
    description: 'Financial management and accounting integration (future release)',
    category: 'compliance',
    icon: Calculator,
    path: '/modules/financials-accounting',
    featured: false
  },
  {
    id: 'content-knowledge',
    slug: 'content-knowledge-help',
    title: 'Content & Knowledge (Help/FAQs/Policies)',
    description: 'Knowledge base, help documentation, and policy management',
    category: 'compliance',
    icon: BookOpen,
    path: '/modules/content-knowledge-help',
    featured: false
  },
  {
    id: 'devops-tooling',
    slug: 'devops-tooling-environments',
    title: 'DevOps Tooling & Environments',
    description: 'Development operations tools and environment management',
    category: 'compliance',
    icon: Wrench,
    path: '/modules/devops-tooling-environments',
    featured: false
  },
  {
    id: 'security-key',
    slug: 'security-key-management',
    title: 'Security & Key Management',
    description: 'Cryptographic key management and security infrastructure',
    category: 'compliance',
    icon: ShieldCheck,
    path: '/modules/security-key-management',
    featured: false
  },
  {
    id: 'analytics-dashboards',
    slug: 'analytics-dashboards-exports',
    title: 'Analytics, Dashboards & Exports',
    description: 'Business intelligence, dashboards, and data export capabilities',
    category: 'compliance',
    icon: TrendingUp,
    path: '/modules/analytics-dashboards-exports',
    featured: false
  }
]

// Helper functions
export const getFeaturedModules = (): Module[] => {
  return modules.filter(module => module.featured)
}

export const getModulesByCategory = (category: string): Module[] => {
  if (category === 'all') return modules
  return modules.filter(module => module.category === category)
}

export const searchModules = (query: string): Module[] => {
  const lowercaseQuery = query.toLowerCase()
  return modules.filter(module => 
    module.title.toLowerCase().includes(lowercaseQuery) ||
    module.description.toLowerCase().includes(lowercaseQuery)
  )
}

export const getCategoryLabel = (category: string): string => {
  const labels = {
    core: 'Core',
    dmrv: 'DMRV (Digital MRV)',
    mrv: 'Traditional MRV',
    credits: 'Credits & Markets',
    compliance: 'Compliance & Ops',
    all: 'All Categories'
  }
  return labels[category as keyof typeof labels] || category
}
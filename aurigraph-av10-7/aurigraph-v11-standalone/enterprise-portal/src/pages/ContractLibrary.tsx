import { useState, useEffect, useCallback } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  Chip,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import {
  Refresh,
  Code,
  Description,
  AccountTree,
  TextFields,
  ExpandMore,
  Category,
  Verified,
  LocalGasStation,
  Security,
  Functions,
  Event,
  Gavel,
  BusinessCenter,
  Home,
  DirectionsCar,
  AccountBalance,
  Palette,
  Nature,
  Domain,
  Diamond,
  Agriculture,
  Copyright,
  Assessment,
  ContentCopy,
  Download,
  Visibility,
} from '@mui/icons-material'
import { apiService, safeApiCall } from '../services/api'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LibraryOverview {
  libraryVersion: string
  activeTemplateCount: number
  smartTemplateCount: number
  assetCategories: AssetCategoryInfo[]
  tokenStandards: TokenStandardInfo[]
}

interface AssetCategoryInfo {
  code: string
  displayName: string
  description: string
}

interface TokenStandardInfo {
  code: string
  name: string
  description: string
}

interface ActiveContractTemplate {
  templateId: string
  templateName: string
  description: string
  assetType: string
  category: string
  version: number
  requiredDocuments: RequiredDocument[]
  defaultRules: BusinessRule[]
  requiredVVBCount: number
  minimumVerificationLevel: string
  acceptedVVBTypes: string[]
  defaultContractDuration: string
  autoRenewal: boolean
  requiredApprovals: string[]
  supportedJurisdictions: string[]
  active: boolean
}

interface RequiredDocument {
  tokenType: string
  documentName: string
  description: string
  mandatory: boolean
  requiresVVBVerification: boolean
  validityPeriod: string | null
  acceptedFormats: string[]
}

interface BusinessRule {
  ruleId: string
  ruleName: string
  ruleType: string
  condition: string
  action: string
  priority: number
  autoExecute: boolean
}

interface SmartContractTemplate {
  templateId: string
  templateName: string
  description: string
  version: string
  assetType: string
  category: string
  tokenStandard: string
  fractionalizable: boolean
  maxFractions: number
  functions: ContractFunction[]
  events: ContractEvent[]
  accessControl: AccessControlRule[]
  gasEstimates: Record<string, number>
  deploymentGasEstimate: number
  upgradeable: boolean
  upgradePattern: string
  requiredCompliances: string[]
  supportedNetworks: string[]
  active: boolean
  audited: boolean
}

interface ContractFunction {
  functionId: string
  name: string
  description: string
  type: string
  visibility: string
  parameters: FunctionParameter[]
  returns: FunctionParameter[]
  payable: boolean
  modifiers: string[]
  gasEstimate: number
}

interface FunctionParameter {
  name: string
  type: string
  description: string
}

interface ContractEvent {
  eventId: string
  name: string
  description: string
  parameters: EventParameter[]
}

interface EventParameter {
  name: string
  type: string
  indexed: boolean
}

interface AccessControlRule {
  ruleId: string
  roleName: string
  description: string
  allowedFunctions: string[]
  condition: string
}

interface TopologyNode {
  id: string
  label: string
  type: string
  data: Record<string, any>
}

interface TopologyEdge {
  source: string
  target: string
  type: string
}

interface TopologyData {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
  stats: {
    totalNodes: number
    totalEdges: number
    categories: number
  }
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#FF6B6B',
  tertiary: '#4ECDC4',
  quaternary: '#FFD93D',
  success: '#00BFA5',
  warning: '#FFD93D',
  error: '#FF6B6B',
  info: '#4ECDC4',
}

const CATEGORY_ICONS: Record<string, any> = {
  REAL_ESTATE: Home,
  VEHICLES: DirectionsCar,
  COMMODITIES: Agriculture,
  INTELLECTUAL_PROPERTY: Copyright,
  FINANCIAL_INSTRUMENTS: AccountBalance,
  ART_COLLECTIBLES: Palette,
  INFRASTRUCTURE: Domain,
  ENVIRONMENTAL: Nature,
  OTHER: Category,
}

const TOKEN_STANDARD_COLORS: Record<string, string> = {
  'ERC-721': '#FF6B6B',
  'ERC-1155': '#4ECDC4',
  'ERC-20': '#FFD93D',
  'ERC-721A': '#FF9F43',
  'ERC-4626': '#A29BFE',
  'Custom': '#778CA3',
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`library-tabpanel-${index}`}
      aria-labelledby={`library-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ContractLibrary() {
  // State management
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Library data
  const [overview, setOverview] = useState<LibraryOverview | null>(null)
  const [activeTemplates, setActiveTemplates] = useState<ActiveContractTemplate[]>([])
  const [smartTemplates, setSmartTemplates] = useState<SmartContractTemplate[]>([])
  const [topology, setTopology] = useState<TopologyData | null>(null)

  // Selected items
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedActiveTemplate, setSelectedActiveTemplate] = useState<ActiveContractTemplate | null>(null)
  const [selectedSmartTemplate, setSelectedSmartTemplate] = useState<SmartContractTemplate | null>(null)

  // Dialog state
  const [textViewDialogOpen, setTextViewDialogOpen] = useState(false)
  const [textViewContent, setTextViewContent] = useState('')
  const [textViewTitle, setTextViewTitle] = useState('')

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const { data, success: apiSuccess } = await safeApiCall(
        () => apiService.get('/api/v12/library/overview'),
        null
      )

      if (apiSuccess && data) {
        setOverview(data)
      } else {
        // Mock data
        setOverview({
          libraryVersion: '1.0.0',
          activeTemplateCount: 27,
          smartTemplateCount: 27,
          assetCategories: [
            { code: 'REAL_ESTATE', displayName: 'Real Estate & Property', description: 'Property-based assets' },
            { code: 'VEHICLES', displayName: 'Vehicles & Transport', description: 'Transportation assets' },
            { code: 'COMMODITIES', displayName: 'Commodities', description: 'Raw materials and goods' },
            { code: 'INTELLECTUAL_PROPERTY', displayName: 'Intellectual Property', description: 'Patents, trademarks, copyrights' },
            { code: 'FINANCIAL_INSTRUMENTS', displayName: 'Financial Instruments', description: 'Bonds, equities, derivatives' },
            { code: 'ART_COLLECTIBLES', displayName: 'Art & Collectibles', description: 'Artwork and collectibles' },
            { code: 'INFRASTRUCTURE', displayName: 'Infrastructure', description: 'Public and private infrastructure' },
            { code: 'ENVIRONMENTAL', displayName: 'Environmental Assets', description: 'Carbon credits and rights' },
            { code: 'OTHER', displayName: 'Other Assets', description: 'Miscellaneous assets' },
          ],
          tokenStandards: [
            { code: 'ERC-721', name: 'Non-Fungible Token', description: 'Unique asset representation' },
            { code: 'ERC-1155', name: 'Multi-Token', description: 'Batch operations, semi-fungible' },
            { code: 'ERC-20', name: 'Fungible Token', description: 'Divisible, interchangeable units' },
          ],
        })
      }
    } catch (err) {
      console.error('Error fetching overview:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchActiveTemplates = useCallback(async () => {
    try {
      const { data, success: apiSuccess } = await safeApiCall(
        () => apiService.get('/api/v12/library/active/templates'),
        []
      )

      if (apiSuccess && data) {
        setActiveTemplates(data)
      } else {
        // Generate mock active templates
        const categories = ['REAL_ESTATE', 'VEHICLES', 'COMMODITIES', 'INTELLECTUAL_PROPERTY', 'FINANCIAL_INSTRUMENTS']
        const mockTemplates: ActiveContractTemplate[] = categories.flatMap((cat, i) => [
          {
            templateId: `TPL-${cat}-${i}`,
            templateName: `${cat.replace('_', ' ')} Contract`,
            description: `Standard template for ${cat.toLowerCase().replace('_', ' ')} tokenization`,
            assetType: cat,
            category: cat,
            version: 1,
            requiredDocuments: [
              { tokenType: 'TITLE_DEED', documentName: 'Title Deed', description: 'Proof of ownership', mandatory: true, requiresVVBVerification: true, validityPeriod: null, acceptedFormats: ['PDF', 'PNG'] },
              { tokenType: 'APPRAISAL', documentName: 'Valuation Report', description: 'Professional appraisal', mandatory: true, requiresVVBVerification: true, validityPeriod: '365 days', acceptedFormats: ['PDF'] },
            ],
            defaultRules: [
              { ruleId: 'R1', ruleName: 'Ownership Transfer', ruleType: 'TRANSFER', condition: 'verified == true', action: 'allow_transfer', priority: 1, autoExecute: true },
            ],
            requiredVVBCount: 2,
            minimumVerificationLevel: 'STANDARD',
            acceptedVVBTypes: ['PROPERTY_VALUATOR', 'LEGAL_VERIFIER'],
            defaultContractDuration: '365 days',
            autoRenewal: true,
            requiredApprovals: ['OWNER', 'VERIFIER'],
            supportedJurisdictions: ['US', 'EU', 'UK', 'SG'],
            active: true,
          },
        ])
        setActiveTemplates(mockTemplates)
      }
    } catch (err) {
      console.error('Error fetching active templates:', err)
    }
  }, [])

  const fetchSmartTemplates = useCallback(async () => {
    try {
      const { data, success: apiSuccess } = await safeApiCall(
        () => apiService.get('/api/v12/library/smart/templates'),
        []
      )

      if (apiSuccess && data) {
        setSmartTemplates(data)
      } else {
        // Generate mock smart templates
        const templates: SmartContractTemplate[] = [
          {
            templateId: 'SC-RE-100',
            templateName: 'Real Estate Token Contract',
            description: 'ERC-721 NFT for real estate assets',
            version: '1.0.0',
            assetType: 'REAL_ESTATE',
            category: 'REAL_ESTATE',
            tokenStandard: 'ERC-721',
            fractionalizable: true,
            maxFractions: 1000,
            functions: [
              { functionId: 'F1', name: 'mint', description: 'Mint new token', type: 'MINT', visibility: 'PUBLIC', parameters: [{ name: 'to', type: 'address', description: 'Recipient' }], returns: [{ name: 'tokenId', type: 'uint256', description: '' }], payable: false, modifiers: ['onlyOwner'], gasEstimate: 150000 },
              { functionId: 'F2', name: 'transfer', description: 'Transfer token', type: 'TRANSFER', visibility: 'PUBLIC', parameters: [{ name: 'to', type: 'address', description: 'Recipient' }, { name: 'tokenId', type: 'uint256', description: 'Token ID' }], returns: [], payable: false, modifiers: [], gasEstimate: 65000 },
            ],
            events: [
              { eventId: 'E1', name: 'Transfer', description: 'Emitted on transfer', parameters: [{ name: 'from', type: 'address', indexed: true }, { name: 'to', type: 'address', indexed: true }, { name: 'tokenId', type: 'uint256', indexed: true }] },
            ],
            accessControl: [
              { ruleId: 'AC1', roleName: 'ADMIN', description: 'Full access', allowedFunctions: ['mint', 'burn', 'pause'], condition: '' },
              { ruleId: 'AC2', roleName: 'OWNER', description: 'Token owner', allowedFunctions: ['transfer', 'approve'], condition: 'ownerOf(tokenId) == msg.sender' },
            ],
            gasEstimates: { mint: 150000, transfer: 65000, approve: 45000 },
            deploymentGasEstimate: 2500000,
            upgradeable: true,
            upgradePattern: 'UUPS',
            requiredCompliances: ['KYC', 'AML'],
            supportedNetworks: ['Ethereum', 'Polygon', 'Arbitrum'],
            active: true,
            audited: true,
          },
          {
            templateId: 'SC-CM-100',
            templateName: 'Commodity Token Contract',
            description: 'ERC-1155 Multi-Token for commodities',
            version: '1.0.0',
            assetType: 'COMMODITY',
            category: 'COMMODITIES',
            tokenStandard: 'ERC-1155',
            fractionalizable: true,
            maxFractions: 1000000,
            functions: [
              { functionId: 'F1', name: 'mintBatch', description: 'Batch mint tokens', type: 'MINT', visibility: 'PUBLIC', parameters: [{ name: 'to', type: 'address', description: 'Recipient' }, { name: 'ids', type: 'uint256[]', description: 'Token IDs' }, { name: 'amounts', type: 'uint256[]', description: 'Amounts' }], returns: [], payable: false, modifiers: ['onlyMinter'], gasEstimate: 200000 },
            ],
            events: [
              { eventId: 'E1', name: 'TransferBatch', description: 'Batch transfer', parameters: [{ name: 'operator', type: 'address', indexed: true }, { name: 'from', type: 'address', indexed: true }, { name: 'to', type: 'address', indexed: true }] },
            ],
            accessControl: [
              { ruleId: 'AC1', roleName: 'MINTER', description: 'Can mint tokens', allowedFunctions: ['mint', 'mintBatch'], condition: '' },
            ],
            gasEstimates: { mintBatch: 200000, transferBatch: 100000 },
            deploymentGasEstimate: 3000000,
            upgradeable: true,
            upgradePattern: 'Transparent Proxy',
            requiredCompliances: ['COMMODITY_STANDARDS'],
            supportedNetworks: ['Ethereum', 'Polygon'],
            active: true,
            audited: true,
          },
        ]
        setSmartTemplates(templates)
      }
    } catch (err) {
      console.error('Error fetching smart templates:', err)
    }
  }, [])

  const fetchTopology = useCallback(async () => {
    try {
      const { data, success: apiSuccess } = await safeApiCall(
        () => apiService.get('/api/v12/library/topology'),
        null
      )

      if (apiSuccess && data) {
        setTopology(data)
      } else {
        // Generate mock topology
        const nodes: TopologyNode[] = [
          { id: 'library', label: 'Contract Library', type: 'root', data: { version: '1.0.0', activeTemplates: 27, smartTemplates: 27 } },
          { id: 'cat-real_estate', label: 'Real Estate & Property', type: 'category', data: { code: 'REAL_ESTATE' } },
          { id: 'cat-vehicles', label: 'Vehicles & Transport', type: 'category', data: { code: 'VEHICLES' } },
          { id: 'cat-commodities', label: 'Commodities', type: 'category', data: { code: 'COMMODITIES' } },
          { id: 'active-TPL-RE-1', label: 'Real Estate Contract', type: 'active-template', data: { templateId: 'TPL-RE-1', requiredDocs: 7 } },
          { id: 'smart-SC-RE-100', label: 'Real Estate Token', type: 'smart-template', data: { templateId: 'SC-RE-100', tokenStandard: 'ERC-721' } },
        ]
        const edges: TopologyEdge[] = [
          { source: 'library', target: 'cat-real_estate', type: 'contains' },
          { source: 'library', target: 'cat-vehicles', type: 'contains' },
          { source: 'library', target: 'cat-commodities', type: 'contains' },
          { source: 'cat-real_estate', target: 'active-TPL-RE-1', type: 'active-contract' },
          { source: 'cat-real_estate', target: 'smart-SC-RE-100', type: 'smart-contract' },
        ]
        setTopology({ nodes, edges, stats: { totalNodes: nodes.length, totalEdges: edges.length, categories: 9 } })
      }
    } catch (err) {
      console.error('Error fetching topology:', err)
    }
  }, [])

  const fetchTextView = useCallback(async (type: 'active' | 'smart', templateId: string) => {
    setLoading(true)
    try {
      const { data, success: apiSuccess } = await safeApiCall(
        () => apiService.get(`/api/v12/library/text/${type}/${templateId}`, { responseType: 'text' }),
        ''
      )

      if (apiSuccess && data) {
        setTextViewContent(data)
      } else {
        // Generate mock text view
        if (type === 'active') {
          setTextViewContent(`
═══════════════════════════════════════════════════════════════
                    ACTIVE CONTRACT TEMPLATE
═══════════════════════════════════════════════════════════════

TEMPLATE INFORMATION
───────────────────────────────────────────────────────────────
  Template ID:     ${templateId}
  Template Name:   Real Estate Contract Template
  Description:     Standard template for real estate tokenization
  Version:         1
  Asset Type:      REAL_ESTATE (Real Estate Assets)
  Category:        Real Estate & Property
  Status:          ACTIVE

VVB VERIFICATION REQUIREMENTS
───────────────────────────────────────────────────────────────
  Required VVB Count:     2
  Minimum Level:          STANDARD
  Accepted VVB Types:     PROPERTY_VALUATOR, LEGAL_VERIFIER

WORKFLOW CONFIGURATION
───────────────────────────────────────────────────────────────
  Default Duration:       365 days
  Auto Renewal:           Yes
  Required Approvals:     OWNER, VERIFIER

REQUIRED DOCUMENTS
───────────────────────────────────────────────────────────────
  1. Title Deed
     Token Type:    TITLE_DEED
     Mandatory:     YES
     VVB Required:  YES
     Formats:       PDF, PNG, JPG

  2. Valuation Report
     Token Type:    APPRAISAL
     Mandatory:     YES
     VVB Required:  YES
     Valid For:     365 days
     Formats:       PDF

═══════════════════════════════════════════════════════════════
  Generated by Aurigraph V11 Contract Library
  Library Version: 1.0.0
═══════════════════════════════════════════════════════════════
`)
        } else {
          setTextViewContent(`
═══════════════════════════════════════════════════════════════
                    SMART CONTRACT TEMPLATE
═══════════════════════════════════════════════════════════════

TEMPLATE INFORMATION
───────────────────────────────────────────────────────────────
  Template ID:      ${templateId}
  Template Name:    Real Estate Token Contract
  Description:      ERC-721 NFT for real estate assets
  Version:          1.0.0
  Asset Type:       REAL_ESTATE (Real Estate Assets)
  Category:         Real Estate & Property
  Status:           ACTIVE
  Audited:          YES

TOKEN STANDARD
───────────────────────────────────────────────────────────────
  Standard:         ERC-721 (Non-Fungible Token)
  Description:      Unique asset representation
  Fractionalizable: Yes (max 1000 fractions)

CONTRACT FUNCTIONS
───────────────────────────────────────────────────────────────

  function mint(address to) public onlyOwner returns (uint256 tokenId)
    Type: MINT | Gas: 150000
    // Mint new token

  function transfer(address to, uint256 tokenId) public
    Type: TRANSFER | Gas: 65000
    // Transfer token

CONTRACT EVENTS
───────────────────────────────────────────────────────────────

  event Transfer(indexed address from, indexed address to, indexed uint256 tokenId);
    // Emitted on transfer

ACCESS CONTROL RULES
───────────────────────────────────────────────────────────────

  Role: ADMIN
    Description: Full access
    Allowed Functions: mint, burn, pause

  Role: OWNER
    Description: Token owner
    Allowed Functions: transfer, approve
    Condition: ownerOf(tokenId) == msg.sender

═══════════════════════════════════════════════════════════════
  Generated by Aurigraph V11 Contract Library
  Library Version: 1.0.0
═══════════════════════════════════════════════════════════════
`)
        }
      }
      setTextViewDialogOpen(true)
    } catch (err) {
      console.error('Error fetching text view:', err)
      setError('Failed to load text view')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOverview()
    fetchActiveTemplates()
    fetchSmartTemplates()
    fetchTopology()
  }, [fetchOverview, fetchActiveTemplates, fetchSmartTemplates, fetchTopology])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleRefresh = () => {
    fetchOverview()
    fetchActiveTemplates()
    fetchSmartTemplates()
    fetchTopology()
  }

  const handleViewActiveText = (template: ActiveContractTemplate) => {
    setTextViewTitle(`Active Contract: ${template.templateName}`)
    fetchTextView('active', template.templateId)
  }

  const handleViewSmartText = (template: SmartContractTemplate) => {
    setTextViewTitle(`Smart Contract: ${template.templateName}`)
    fetchTextView('smart', template.templateId)
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccess('Copied to clipboard!')
  }

  // ============================================================================
  // RENDER: OVERVIEW CARDS
  // ============================================================================

  const renderOverview = () => (
    <Grid container spacing={3}>
      {/* Library Stats */}
      <Grid item xs={12} md={4}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <AccountTree sx={{ fontSize: 40, color: THEME_COLORS.primary }} />
              <Box>
                <Typography variant="h4">{overview?.activeTemplateCount || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Contract Templates
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Business workflow contracts per asset category
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Code sx={{ fontSize: 40, color: THEME_COLORS.tertiary }} />
              <Box>
                <Typography variant="h4">{overview?.smartTemplateCount || 0}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Smart Contract Templates
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              ERC-compatible blockchain contracts
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Category sx={{ fontSize: 40, color: THEME_COLORS.quaternary }} />
              <Box>
                <Typography variant="h4">{overview?.assetCategories?.length || 9}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Asset Categories
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Library Version: {overview?.libraryVersion || '1.0.0'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Token Standards */}
      <Grid item xs={12}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Supported Token Standards</Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              {overview?.tokenStandards?.map((standard) => (
                <Chip
                  key={standard.code}
                  label={`${standard.code} - ${standard.name}`}
                  sx={{
                    bgcolor: TOKEN_STANDARD_COLORS[standard.code] || THEME_COLORS.info,
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  // ============================================================================
  // RENDER: TOPOLOGY VIEW
  // ============================================================================

  const renderTopologyView = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Library Topology</Typography>
              <Box display="flex" gap={1}>
                <Chip label={`${topology?.stats?.totalNodes || 0} Nodes`} size="small" />
                <Chip label={`${topology?.stats?.totalEdges || 0} Edges`} size="small" />
              </Box>
            </Box>

            {/* Category Tree */}
            {overview?.assetCategories?.map((category) => {
              const CategoryIcon = CATEGORY_ICONS[category.code] || Category
              const categoryActiveTemplates = activeTemplates.filter(t => t.category === category.code)
              const categorySmartTemplates = smartTemplates.filter(t => t.category === category.code)

              return (
                <Accordion key={category.code} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box display="flex" alignItems="center" gap={2} width="100%">
                      <CategoryIcon sx={{ color: THEME_COLORS.primary }} />
                      <Box flex={1}>
                        <Typography variant="subtitle1">{category.displayName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={`${categoryActiveTemplates.length} Active`}
                          size="small"
                          sx={{ bgcolor: THEME_COLORS.tertiary, color: 'white' }}
                        />
                        <Chip
                          label={`${categorySmartTemplates.length} Smart`}
                          size="small"
                          sx={{ bgcolor: THEME_COLORS.primary, color: 'white' }}
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Active Templates */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: THEME_COLORS.tertiary }}>
                          <Gavel sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          Active Contract Templates
                        </Typography>
                        {categoryActiveTemplates.length > 0 ? (
                          <List dense>
                            {categoryActiveTemplates.map((template) => (
                              <ListItem
                                key={template.templateId}
                                secondaryAction={
                                  <Box>
                                    <Tooltip title="View Text">
                                      <IconButton size="small" onClick={() => handleViewActiveText(template)}>
                                        <TextFields />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                }
                              >
                                <ListItemIcon>
                                  <Description sx={{ color: THEME_COLORS.tertiary }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={template.templateName}
                                  secondary={`${template.requiredDocuments?.length || 0} docs | ${template.requiredVVBCount} VVB required`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No templates in this category</Typography>
                        )}
                      </Grid>

                      {/* Smart Templates */}
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom sx={{ color: THEME_COLORS.primary }}>
                          <Code sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                          Smart Contract Templates
                        </Typography>
                        {categorySmartTemplates.length > 0 ? (
                          <List dense>
                            {categorySmartTemplates.map((template) => (
                              <ListItem
                                key={template.templateId}
                                secondaryAction={
                                  <Box>
                                    <Tooltip title="View Text">
                                      <IconButton size="small" onClick={() => handleViewSmartText(template)}>
                                        <TextFields />
                                      </IconButton>
                                    </Tooltip>
                                  </Box>
                                }
                              >
                                <ListItemIcon>
                                  <Code sx={{ color: THEME_COLORS.primary }} />
                                </ListItemIcon>
                                <ListItemText
                                  primary={template.templateName}
                                  secondary={
                                    <Box display="flex" gap={1} alignItems="center">
                                      <Chip
                                        label={template.tokenStandard}
                                        size="small"
                                        sx={{
                                          bgcolor: TOKEN_STANDARD_COLORS[template.tokenStandard] || THEME_COLORS.info,
                                          color: 'white',
                                          height: 20,
                                          fontSize: '0.65rem',
                                        }}
                                      />
                                      <Typography variant="caption">
                                        {template.functions?.length || 0} functions
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="body2" color="text.secondary">No templates in this category</Typography>
                        )}
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )
            })}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  // ============================================================================
  // RENDER: ACTIVE TEMPLATES LIST
  // ============================================================================

  const renderActiveTemplates = () => (
    <Grid container spacing={3}>
      {activeTemplates.map((template) => (
        <Grid item xs={12} md={6} key={template.templateId}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="h6">{template.templateName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {template.templateId}
                  </Typography>
                </Box>
                <Chip
                  label={template.active ? 'Active' : 'Inactive'}
                  color={template.active ? 'success' : 'default'}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                {template.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Required Documents</Typography>
                  <Typography variant="body2">{template.requiredDocuments?.length || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">VVB Required</Typography>
                  <Typography variant="body2">{template.requiredVVBCount}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Verification Level</Typography>
                  <Typography variant="body2">{template.minimumVerificationLevel || 'STANDARD'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Auto Renewal</Typography>
                  <Typography variant="body2">{template.autoRenewal ? 'Yes' : 'No'}</Typography>
                </Grid>
              </Grid>

              <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                {template.supportedJurisdictions?.slice(0, 4).map((j) => (
                  <Chip key={j} label={j} size="small" variant="outlined" />
                ))}
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  size="small"
                  startIcon={<TextFields />}
                  onClick={() => handleViewActiveText(template)}
                >
                  View Text
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  // ============================================================================
  // RENDER: SMART TEMPLATES LIST
  // ============================================================================

  const renderSmartTemplates = () => (
    <Grid container spacing={3}>
      {smartTemplates.map((template) => (
        <Grid item xs={12} md={6} key={template.templateId}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  <Typography variant="h6">{template.templateName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {template.templateId}
                  </Typography>
                </Box>
                <Box display="flex" gap={1}>
                  <Chip
                    label={template.tokenStandard}
                    size="small"
                    sx={{
                      bgcolor: TOKEN_STANDARD_COLORS[template.tokenStandard] || THEME_COLORS.info,
                      color: 'white',
                    }}
                  />
                  {template.audited && (
                    <Chip
                      icon={<Verified />}
                      label="Audited"
                      size="small"
                      color="success"
                    />
                  )}
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" paragraph>
                {template.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Functions</Typography>
                  <Typography variant="body2">{template.functions?.length || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Events</Typography>
                  <Typography variant="body2">{template.events?.length || 0}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Deployment Gas</Typography>
                  <Typography variant="body2">
                    <LocalGasStation sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    {template.deploymentGasEstimate?.toLocaleString() || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Fractionalizable</Typography>
                  <Typography variant="body2">
                    {template.fractionalizable ? `Yes (max ${template.maxFractions})` : 'No'}
                  </Typography>
                </Grid>
              </Grid>

              <Box display="flex" gap={1} mt={2} flexWrap="wrap">
                {template.supportedNetworks?.map((network) => (
                  <Chip key={network} label={network} size="small" variant="outlined" />
                ))}
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  size="small"
                  startIcon={<TextFields />}
                  onClick={() => handleViewSmartText(template)}
                >
                  View Text
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )

  // ============================================================================
  // RENDER: MAIN UI
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <AccountTree sx={{ fontSize: 40, color: THEME_COLORS.primary }} />
          <Box>
            <Typography variant="h4">Contract Library</Typography>
            <Typography variant="body2" color="text.secondary">
              Browse and manage contract templates
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Overview" icon={<Assessment />} iconPosition="start" />
        <Tab label="Topology View" icon={<AccountTree />} iconPosition="start" />
        <Tab label="Active Contracts" icon={<Gavel />} iconPosition="start" />
        <Tab label="Smart Contracts" icon={<Code />} iconPosition="start" />
      </Tabs>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        {renderOverview()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderTopologyView()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {renderActiveTemplates()}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {renderSmartTemplates()}
      </TabPanel>

      {/* Text View Dialog */}
      <Dialog
        open={textViewDialogOpen}
        onClose={() => setTextViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{textViewTitle}</Typography>
            <Box>
              <Tooltip title="Copy to Clipboard">
                <IconButton onClick={() => handleCopyToClipboard(textViewContent)}>
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper
            sx={{
              p: 2,
              bgcolor: '#1A1F3A',
              maxHeight: '60vh',
              overflow: 'auto',
            }}
          >
            <Typography
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#E0E0E0',
                m: 0,
              }}
            >
              {textViewContent}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTextViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Chip, Alert,
  CircularProgress, Paper, IconButton, Collapse, Tabs, Tab,
  List, ListItem, ListItemText, ListItemIcon, Divider, Breadcrumbs,
  Link, Tooltip, Badge, LinearProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  AccountTree, VerifiedUser, CheckCircle, Error as ErrorIcon,
  ExpandMore, ChevronRight, Business, AccountBalance, Token,
  Description, PlayArrow, ContentCopy, Security, Layers,
  CallSplit, Merge, TrendingUp, ArrowForward, Info, Visibility,
  Home, NavigateNext
} from '@mui/icons-material';
import { apiService, safeApiCall } from '../services/api';

// Color theme
const COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  warning: '#FFD93D',
  error: '#FF6B6B',
  success: '#00D084',
  purple: '#A855F7',
  blue: '#3B82F6',
  orange: '#F59E0B',
};

// Types for the RWA hierarchy
interface MerkleInfo {
  rootHash: string;
  leafHash: string;
  verified: boolean;
  lastVerified: string;
  proofPath?: { siblingHash: string; isLeft: boolean }[];
}

interface UnderlyingAsset {
  id: string;
  name: string;
  type: 'real-estate' | 'art' | 'commodities' | 'securities' | 'other';
  value: number;
  location: string;
  status: 'verified' | 'pending' | 'disputed';
  merkle: MerkleInfo;
  primaryAssets: PrimaryAsset[];
}

interface PrimaryAsset {
  id: string;
  name: string;
  underlyingAssetId: string;
  ownership: number; // percentage
  value: number;
  status: 'active' | 'locked' | 'transferred';
  merkle: MerkleInfo;
  secondaryAssets: SecondaryAsset[];
}

// Secondary Asset Categories as per your specification
type SecondaryAssetCategory =
  | 'class-a-shares'      // Equity shares
  | 'debt-notes'          // Debt instruments
  | 'owner-kyc'           // KYC documentation
  | 'tax-receipt'         // Tax receipts (transient, year-on-year)
  | 'photograph'          // Photos/videos
  | 'video'               // Video documentation
  | 'map-location'        // Geographic data
  | 'title-deed'          // Property title
  | 'agreement'           // Legal agreements
  | 'certificate'         // Certificates
  | 'third-party-verification'; // 3rd party verification

interface SecondaryAsset {
  id: string;
  name: string;
  primaryAssetId: string;
  category: SecondaryAssetCategory;
  fractionType: 'equity' | 'debt' | 'hybrid' | 'document' | 'verification';
  value: number;
  status: 'active' | 'matured' | 'defaulted' | 'expired' | 'pending-verification';
  isTransient: boolean;          // For items like tax receipts that change periodically
  validFrom?: string;            // Validity period start
  validUntil?: string;           // Validity period end (for transient items)
  requiresVerification: boolean; // If changes require 3rd party verification
  verificationStatus?: 'verified' | 'pending' | 'rejected' | 'expired';
  verifiedBy?: string;           // 3rd party verifier name
  verifiedAt?: string;           // Verification timestamp
  merkle: MerkleInfo;
  tokens: TokenAsset[];
}

// Derived token categories - income/output streams from composite tokens
type DerivedTokenCategory =
  | 'rental-income'      // Rent payments from real estate
  | 'crop-sale'          // Agricultural output
  | 'mining-output'      // Mining/extraction output
  | 'carbon-credits'     // Environmental credits
  | 'royalty-payment'    // IP/licensing royalties
  | 'dividend-payout'    // Dividend distributions
  | 'interest-payment'   // Interest from debt instruments
  | 'utility-token';     // Utility/service tokens

interface DerivedToken {
  id: string;
  symbol: string;
  name: string;
  parentCompositeTokenId: string;    // Linked to composite token
  linkedPrimaryAssetId: string;       // Linked to primary asset
  category: DerivedTokenCategory;
  totalSupply: number;
  circulatingSupply: number;
  price: number;
  // Income/output stream details
  streamFrequency: 'one-time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  lastStreamDate?: string;
  nextStreamDate?: string;
  totalStreamed: number;              // Total value streamed so far
  // Transactability
  isTransactable: boolean;            // Can be traded independently
  tradingRestrictions?: string[];     // Any trading restrictions
  merkle: MerkleInfo;
}

interface TokenAsset {
  id: string;
  symbol: string;
  name: string;
  secondaryAssetId: string;
  tokenType: 'primary' | 'secondary' | 'composite';
  totalSupply: number;
  circulatingSupply: number;
  price: number;
  // Composite token specific fields
  linkedPrimaryTokenId?: string;          // For composite tokens - linked to primary
  linkedSecondaryTokenIds?: string[];     // For composite tokens - linked secondary tokens
  derivedTokens?: DerivedToken[];         // Derived tokens (rents, crop sales, mining output, etc.)
  isTransient: boolean;                   // For secondary tokens that change periodically
  requiresVerificationOnChange: boolean;  // Major changes need 3rd party verification
  lastVerificationRequired?: string;      // When verification was last required
  merkle: MerkleInfo;
  contracts: ContractRef[];
}

// RBAC roles for contract access
type RBACRole = 'owner' | 'admin' | 'operator' | 'auditor' | 'viewer' | 'compliance-officer';

interface RBACPermission {
  role: RBACRole;
  permissions: ('read' | 'write' | 'execute' | 'approve' | 'audit')[];
  assignedTo: string[];  // wallet addresses or user IDs
}

interface ContractRef {
  id: string;
  name: string;
  type: 'smart' | 'ricardian' | 'hybrid';
  contractCategory: 'distribution' | 'compliance' | 'transfer' | 'governance' | 'escrow';
  status: 'draft' | 'active' | 'executed' | 'terminated' | 'paused';
  tokenId: string;
  value: number;
  // RBAC configuration
  rbacEnabled: boolean;
  rbacPermissions: RBACPermission[];
  requiresMultiSig: boolean;
  multiSigThreshold?: number;   // e.g., 2 of 3
  multiSigSigners?: string[];   // Required signers
  // Compliance fields
  complianceStatus: 'compliant' | 'pending-review' | 'non-compliant' | 'exempt';
  complianceChecks: string[];   // List of compliance checks passed
  lastComplianceCheck?: string;
  merkle: MerkleInfo;
  executions: ContractExecution[];
}

interface ContractExecution {
  id: string;
  contractId: string;
  timestamp: string;
  action: string;
  result: 'success' | 'failed' | 'pending';
  txHash: string;
  merkle: MerkleInfo;
}

// Navigation level types - added 'derived' for derived tokens from composite tokens
type NavigationLevel = 'underlying' | 'primary' | 'secondary' | 'token' | 'derived' | 'contract' | 'execution';

interface NavigationPath {
  level: NavigationLevel;
  id: string;
  name: string;
}

// Mock data generator for demonstration with full hierarchy
const generateMockData = (): UnderlyingAsset[] => {
  const createMerkle = (seed: string, verified = true): MerkleInfo => ({
    rootHash: `0x${seed}8f3a2b1c4d5e6f7a8b9c0d1e2f3a4b5c`,
    leafHash: `0x${seed}1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d`,
    verified,
    lastVerified: new Date().toISOString(),
  });

  return [
    {
      id: 'UA-001',
      name: 'Manhattan Commercial Tower',
      type: 'real-estate',
      value: 50000000,
      location: 'New York, USA',
      status: 'verified',
      merkle: createMerkle('ua001'),
      primaryAssets: [
        {
          id: 'PA-001',
          name: 'Tower Equity Holdings Trust',
          underlyingAssetId: 'UA-001',
          ownership: 100,
          value: 50000000,
          status: 'active',
          merkle: createMerkle('pa001'),
          secondaryAssets: [
            // Class A Shares
            {
              id: 'SA-001',
              name: 'Class A Equity Shares',
              primaryAssetId: 'PA-001',
              category: 'class-a-shares',
              fractionType: 'equity',
              value: 30000000,
              status: 'active',
              isTransient: false,
              requiresVerification: true,
              verificationStatus: 'verified',
              verifiedBy: 'Deloitte & Touche',
              verifiedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
              merkle: createMerkle('sa001'),
              tokens: [
                {
                  id: 'TK-001',
                  symbol: 'MCT-A',
                  name: 'Manhattan Class A Token',
                  secondaryAssetId: 'SA-001',
                  tokenType: 'primary',
                  totalSupply: 10000000,
                  circulatingSupply: 8500000,
                  price: 3.0,
                  isTransient: false,
                  requiresVerificationOnChange: true,
                  merkle: createMerkle('tk001'),
                  contracts: [
                    {
                      id: 'CT-001',
                      name: 'Dividend Distribution Contract',
                      type: 'hybrid',
                      contractCategory: 'distribution',
                      status: 'active',
                      tokenId: 'TK-001',
                      value: 5000000,
                      rbacEnabled: true,
                      rbacPermissions: [
                        { role: 'owner', permissions: ['read', 'write', 'execute', 'approve'], assignedTo: ['0xOwner1', '0xOwner2'] },
                        { role: 'admin', permissions: ['read', 'write', 'execute'], assignedTo: ['0xAdmin1'] },
                        { role: 'compliance-officer', permissions: ['read', 'audit', 'approve'], assignedTo: ['0xCompliance1'] },
                        { role: 'auditor', permissions: ['read', 'audit'], assignedTo: ['0xAuditor1', '0xAuditor2'] },
                      ],
                      requiresMultiSig: true,
                      multiSigThreshold: 2,
                      multiSigSigners: ['0xOwner1', '0xOwner2', '0xAdmin1'],
                      complianceStatus: 'compliant',
                      complianceChecks: ['AML', 'KYC', 'SEC-Reg-D', 'Accredited-Investor'],
                      lastComplianceCheck: new Date(Date.now() - 7 * 86400000).toISOString(),
                      merkle: createMerkle('ct001'),
                      executions: [
                        {
                          id: 'EX-001',
                          contractId: 'CT-001',
                          timestamp: new Date().toISOString(),
                          action: 'Q4 Dividend Distribution',
                          result: 'success',
                          txHash: '0xabc123def456789abc123def456789abc123def456789',
                          merkle: createMerkle('ex001'),
                        },
                        {
                          id: 'EX-002',
                          contractId: 'CT-001',
                          timestamp: new Date(Date.now() - 86400000).toISOString(),
                          action: 'Compliance Verification',
                          result: 'success',
                          txHash: '0xdef456abc789def456abc789def456abc789def456abc',
                          merkle: createMerkle('ex002'),
                        },
                      ],
                    },
                    {
                      id: 'CT-002',
                      name: 'Compliance Monitoring Contract',
                      type: 'smart',
                      contractCategory: 'compliance',
                      status: 'active',
                      tokenId: 'TK-001',
                      value: 0,
                      rbacEnabled: true,
                      rbacPermissions: [
                        { role: 'compliance-officer', permissions: ['read', 'write', 'execute', 'approve', 'audit'], assignedTo: ['0xCompliance1'] },
                        { role: 'auditor', permissions: ['read', 'audit'], assignedTo: ['0xAuditor1'] },
                      ],
                      requiresMultiSig: false,
                      complianceStatus: 'compliant',
                      complianceChecks: ['Regulatory-Reporting', 'Investor-Limits'],
                      merkle: createMerkle('ct002'),
                      executions: [],
                    },
                  ],
                },
              ],
            },
            // Debt Notes
            {
              id: 'SA-002',
              name: 'Senior Debt Notes',
              primaryAssetId: 'PA-001',
              category: 'debt-notes',
              fractionType: 'debt',
              value: 15000000,
              status: 'active',
              isTransient: false,
              requiresVerification: true,
              verificationStatus: 'verified',
              verifiedBy: 'KPMG',
              verifiedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
              merkle: createMerkle('sa002'),
              tokens: [
                {
                  id: 'TK-002',
                  symbol: 'MCT-DEBT',
                  name: 'Manhattan Debt Token',
                  secondaryAssetId: 'SA-002',
                  tokenType: 'secondary',
                  totalSupply: 5000000,
                  circulatingSupply: 4200000,
                  price: 3.0,
                  isTransient: false,
                  requiresVerificationOnChange: true,
                  merkle: createMerkle('tk002'),
                  contracts: [],
                },
              ],
            },
            // Owner KYC
            {
              id: 'SA-003',
              name: 'Owner KYC Documentation',
              primaryAssetId: 'PA-001',
              category: 'owner-kyc',
              fractionType: 'document',
              value: 0,
              status: 'active',
              isTransient: false,
              requiresVerification: true,
              verificationStatus: 'verified',
              verifiedBy: 'Jumio Identity',
              verifiedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
              merkle: createMerkle('sa003'),
              tokens: [
                {
                  id: 'TK-003',
                  symbol: 'MCT-KYC',
                  name: 'KYC Verification Token',
                  secondaryAssetId: 'SA-003',
                  tokenType: 'secondary',
                  totalSupply: 1,
                  circulatingSupply: 1,
                  price: 0,
                  isTransient: false,
                  requiresVerificationOnChange: true,
                  merkle: createMerkle('tk003'),
                  contracts: [],
                },
              ],
            },
            // Tax Receipt (Transient)
            {
              id: 'SA-004',
              name: 'Tax Receipt 2024',
              primaryAssetId: 'PA-001',
              category: 'tax-receipt',
              fractionType: 'document',
              value: 0,
              status: 'active',
              isTransient: true,
              validFrom: '2024-01-01T00:00:00Z',
              validUntil: '2024-12-31T23:59:59Z',
              requiresVerification: false,
              verificationStatus: 'verified',
              verifiedBy: 'IRS e-File',
              verifiedAt: new Date(Date.now() - 180 * 86400000).toISOString(),
              merkle: createMerkle('sa004'),
              tokens: [
                {
                  id: 'TK-004',
                  symbol: 'MCT-TAX24',
                  name: 'Tax Receipt 2024 Token',
                  secondaryAssetId: 'SA-004',
                  tokenType: 'secondary',
                  totalSupply: 1,
                  circulatingSupply: 1,
                  price: 0,
                  isTransient: true,
                  requiresVerificationOnChange: false,
                  merkle: createMerkle('tk004'),
                  contracts: [],
                },
              ],
            },
            // Property Photos/Videos
            {
              id: 'SA-005',
              name: 'Property Photography',
              primaryAssetId: 'PA-001',
              category: 'photograph',
              fractionType: 'document',
              value: 0,
              status: 'active',
              isTransient: true,
              validFrom: new Date(Date.now() - 30 * 86400000).toISOString(),
              requiresVerification: false,
              merkle: createMerkle('sa005'),
              tokens: [],
            },
            // Title Deed
            {
              id: 'SA-006',
              name: 'Property Title Deed',
              primaryAssetId: 'PA-001',
              category: 'title-deed',
              fractionType: 'document',
              value: 50000000,
              status: 'active',
              isTransient: false,
              requiresVerification: true,
              verificationStatus: 'verified',
              verifiedBy: 'NYC Land Registry',
              verifiedAt: new Date(Date.now() - 365 * 86400000).toISOString(),
              merkle: createMerkle('sa006'),
              tokens: [
                {
                  id: 'TK-005',
                  symbol: 'MCT-TITLE',
                  name: 'Title Deed Token',
                  secondaryAssetId: 'SA-006',
                  tokenType: 'secondary',
                  totalSupply: 1,
                  circulatingSupply: 1,
                  price: 0,
                  isTransient: false,
                  requiresVerificationOnChange: true,
                  merkle: createMerkle('tk005'),
                  contracts: [],
                },
              ],
            },
            // 3rd Party Verification
            {
              id: 'SA-007',
              name: 'Third Party Valuation',
              primaryAssetId: 'PA-001',
              category: 'third-party-verification',
              fractionType: 'verification',
              value: 50000000,
              status: 'active',
              isTransient: true,
              validFrom: new Date(Date.now() - 90 * 86400000).toISOString(),
              validUntil: new Date(Date.now() + 275 * 86400000).toISOString(),
              requiresVerification: false,
              verificationStatus: 'verified',
              verifiedBy: 'Jones Lang LaSalle',
              verifiedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
              merkle: createMerkle('sa007'),
              tokens: [
                {
                  id: 'TK-006',
                  symbol: 'MCT-VERIFY',
                  name: '3rd Party Verification Token',
                  secondaryAssetId: 'SA-007',
                  tokenType: 'secondary',
                  totalSupply: 1,
                  circulatingSupply: 1,
                  price: 0,
                  isTransient: true,
                  requiresVerificationOnChange: false,
                  merkle: createMerkle('tk006'),
                  contracts: [],
                },
              ],
            },
            // Composite Token (Links primary + secondaries)
            {
              id: 'SA-008',
              name: 'Composite Asset Bundle',
              primaryAssetId: 'PA-001',
              category: 'class-a-shares',
              fractionType: 'hybrid',
              value: 50000000,
              status: 'active',
              isTransient: false,
              requiresVerification: true,
              verificationStatus: 'verified',
              verifiedBy: 'PwC',
              merkle: createMerkle('sa008'),
              tokens: [
                {
                  id: 'TK-COMP',
                  symbol: 'MCT-COMPOSITE',
                  name: 'Manhattan Composite Token',
                  secondaryAssetId: 'SA-008',
                  tokenType: 'composite',
                  totalSupply: 2000000,
                  circulatingSupply: 1800000,
                  price: 25.0,
                  linkedPrimaryTokenId: 'TK-001',
                  linkedSecondaryTokenIds: ['TK-002', 'TK-003', 'TK-005', 'TK-006'],
                  // Derived tokens - income/output streams from the composite asset
                  derivedTokens: [
                    {
                      id: 'DT-RENT-001',
                      symbol: 'MCT-RENT',
                      name: 'Manhattan Rental Income Token',
                      parentCompositeTokenId: 'TK-COMP',
                      linkedPrimaryAssetId: 'PA-001',
                      category: 'rental-income',
                      totalSupply: 1000000,
                      circulatingSupply: 850000,
                      price: 0.50,
                      streamFrequency: 'monthly',
                      lastStreamDate: new Date(Date.now() - 15 * 86400000).toISOString(),
                      nextStreamDate: new Date(Date.now() + 15 * 86400000).toISOString(),
                      totalStreamed: 2500000,
                      isTransactable: true,
                      tradingRestrictions: ['Accredited-Investors-Only', 'No-Short-Selling'],
                      merkle: createMerkle('dtrent'),
                    },
                    {
                      id: 'DT-CARBON-001',
                      symbol: 'MCT-CARBON',
                      name: 'Manhattan Carbon Credits',
                      parentCompositeTokenId: 'TK-COMP',
                      linkedPrimaryAssetId: 'PA-001',
                      category: 'carbon-credits',
                      totalSupply: 50000,
                      circulatingSupply: 45000,
                      price: 25.0,
                      streamFrequency: 'annual',
                      lastStreamDate: new Date(Date.now() - 180 * 86400000).toISOString(),
                      nextStreamDate: new Date(Date.now() + 185 * 86400000).toISOString(),
                      totalStreamed: 100000,
                      isTransactable: true,
                      tradingRestrictions: ['Verified-Carbon-Registry'],
                      merkle: createMerkle('dtcarbon'),
                    },
                    {
                      id: 'DT-DIV-001',
                      symbol: 'MCT-DIV',
                      name: 'Manhattan Dividend Payout Token',
                      parentCompositeTokenId: 'TK-COMP',
                      linkedPrimaryAssetId: 'PA-001',
                      category: 'dividend-payout',
                      totalSupply: 500000,
                      circulatingSupply: 500000,
                      price: 1.0,
                      streamFrequency: 'quarterly',
                      lastStreamDate: new Date(Date.now() - 45 * 86400000).toISOString(),
                      nextStreamDate: new Date(Date.now() + 45 * 86400000).toISOString(),
                      totalStreamed: 1500000,
                      isTransactable: true,
                      tradingRestrictions: ['KYC-Required'],
                      merkle: createMerkle('dtdiv'),
                    },
                  ],
                  isTransient: false,
                  requiresVerificationOnChange: true,
                  lastVerificationRequired: new Date(Date.now() - 30 * 86400000).toISOString(),
                  merkle: createMerkle('tkcomp'),
                  contracts: [
                    {
                      id: 'CT-003',
                      name: 'Composite Asset Governance',
                      type: 'smart',
                      contractCategory: 'governance',
                      status: 'active',
                      tokenId: 'TK-COMP',
                      value: 50000000,
                      rbacEnabled: true,
                      rbacPermissions: [
                        { role: 'owner', permissions: ['read', 'write', 'execute', 'approve'], assignedTo: ['0xOwner1'] },
                        { role: 'admin', permissions: ['read', 'write', 'execute'], assignedTo: ['0xAdmin1', '0xAdmin2'] },
                        { role: 'compliance-officer', permissions: ['read', 'audit', 'approve'], assignedTo: ['0xCompliance1'] },
                      ],
                      requiresMultiSig: true,
                      multiSigThreshold: 3,
                      multiSigSigners: ['0xOwner1', '0xAdmin1', '0xAdmin2', '0xCompliance1'],
                      complianceStatus: 'compliant',
                      complianceChecks: ['AML', 'KYC', 'SEC-Reg-D', 'Composite-Integrity'],
                      merkle: createMerkle('ct003'),
                      executions: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'UA-002',
      name: 'Picasso Blue Period Collection',
      type: 'art',
      value: 15000000,
      location: 'London, UK',
      status: 'verified',
      merkle: createMerkle('ua002'),
      primaryAssets: [
        {
          id: 'PA-002',
          name: 'Picasso Art Trust',
          underlyingAssetId: 'UA-002',
          ownership: 100,
          value: 15000000,
          status: 'active',
          merkle: createMerkle('pa002'),
          secondaryAssets: [
            {
              id: 'SA-ART-001',
              name: 'Fractional Ownership Shares',
              primaryAssetId: 'PA-002',
              category: 'class-a-shares',
              fractionType: 'equity',
              value: 15000000,
              status: 'active',
              isTransient: false,
              requiresVerification: true,
              verificationStatus: 'verified',
              verifiedBy: "Christie's",
              merkle: createMerkle('saart001'),
              tokens: [],
            },
            {
              id: 'SA-ART-002',
              name: 'Authenticity Certificate',
              primaryAssetId: 'PA-002',
              category: 'certificate',
              fractionType: 'document',
              value: 0,
              status: 'active',
              isTransient: false,
              requiresVerification: true,
              verificationStatus: 'verified',
              verifiedBy: 'Picasso Foundation',
              merkle: createMerkle('saart002'),
              tokens: [],
            },
          ],
        },
      ],
    },
    {
      id: 'UA-003',
      name: 'Gold Bullion Reserve',
      type: 'commodities',
      value: 25000000,
      location: 'Zurich, Switzerland',
      status: 'verified',
      merkle: createMerkle('ua003'),
      primaryAssets: [],
    },
  ];
};

// Level icons
const levelIcons: Record<NavigationLevel, React.ReactNode> = {
  underlying: <Business />,
  primary: <AccountBalance />,
  secondary: <CallSplit />,
  token: <Token />,
  derived: <TrendingUp />,     // Derived tokens (income streams)
  contract: <Description />,
  execution: <PlayArrow />,
};

// Level colors
const levelColors: Record<NavigationLevel, string> = {
  underlying: COLORS.blue,
  primary: COLORS.purple,
  secondary: COLORS.orange,
  token: COLORS.primary,
  derived: '#10B981',          // Emerald for derived/income tokens
  contract: COLORS.warning,
  execution: COLORS.success,
};

// Level labels
const levelLabels: Record<NavigationLevel, string> = {
  underlying: 'Underlying Assets',
  primary: 'Primary Assets',
  secondary: 'Secondary Assets',
  token: 'Tokens',
  derived: 'Derived Tokens',   // Rents, crop sales, mining output, carbon credits
  contract: 'Active Contracts',
  execution: 'Executions',
};

const RWARegistryNavigation: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [underlyingAssets, setUnderlyingAssets] = useState<UnderlyingAsset[]>([]);
  const [navigationPath, setNavigationPath] = useState<NavigationPath[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [merkleDialogOpen, setMerkleDialogOpen] = useState(false);
  const [selectedMerkle, setSelectedMerkle] = useState<MerkleInfo | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Try to fetch from API first
        const result = await safeApiCall(
          () => apiService.getRWARegistry(),
          { assets: [], stats: {} }
        );

        if (result.success && result.data.assets?.length > 0) {
          // Transform API data to our format
          setUnderlyingAssets(result.data.assets);
        } else {
          // Use mock data for demonstration
          setUnderlyingAssets(generateMockData());
        }
        setError(null);
      } catch (err) {
        setError('Failed to load RWA registry data');
        setUnderlyingAssets(generateMockData());
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Get current level from navigation path
  const getCurrentLevel = (): NavigationLevel => {
    if (navigationPath.length === 0) return 'underlying';
    const lastPath = navigationPath[navigationPath.length - 1];
    return lastPath.level;
  };

  // Get items for current level
  const getCurrentItems = useCallback(() => {
    if (navigationPath.length === 0) {
      return underlyingAssets;
    }

    let current: any = underlyingAssets;
    for (const path of navigationPath) {
      if (path.level === 'underlying') {
        current = current.find((a: UnderlyingAsset) => a.id === path.id)?.primaryAssets || [];
      } else if (path.level === 'primary') {
        current = current.find((a: PrimaryAsset) => a.id === path.id)?.secondaryAssets || [];
      } else if (path.level === 'secondary') {
        current = current.find((a: SecondaryAsset) => a.id === path.id)?.tokens || [];
      } else if (path.level === 'token') {
        // For composite tokens, show derived tokens first, then contracts
        const token = current.find((a: TokenAsset) => a.id === path.id);
        if (token?.tokenType === 'composite' && token?.derivedTokens?.length > 0) {
          current = token.derivedTokens || [];
        } else {
          current = token?.contracts || [];
        }
      } else if (path.level === 'derived') {
        // From derived tokens, navigate to contracts of parent composite token
        // Find the parent token and get its contracts
        const parentPath = navigationPath.find(p => p.level === 'token');
        if (parentPath) {
          // Navigate back to find the token
          let tokens: any = underlyingAssets;
          for (const p of navigationPath) {
            if (p.level === 'underlying') {
              tokens = tokens.find((a: UnderlyingAsset) => a.id === p.id)?.primaryAssets || [];
            } else if (p.level === 'primary') {
              tokens = tokens.find((a: PrimaryAsset) => a.id === p.id)?.secondaryAssets || [];
            } else if (p.level === 'secondary') {
              tokens = tokens.find((a: SecondaryAsset) => a.id === p.id)?.tokens || [];
            } else if (p.level === 'token') {
              const parentToken = tokens.find((a: TokenAsset) => a.id === p.id);
              current = parentToken?.contracts || [];
              break;
            }
          }
        }
      } else if (path.level === 'contract') {
        current = current.find((a: ContractRef) => a.id === path.id)?.executions || [];
      }
    }
    return current || [];
  }, [navigationPath, underlyingAssets]);

  // Navigate to item
  const navigateToItem = (level: NavigationLevel, id: string, name: string) => {
    setNavigationPath([...navigationPath, { level, id, name }]);
    setSelectedItem(null);
  };

  // Navigate back to level
  const navigateToLevel = (index: number) => {
    if (index < 0) {
      setNavigationPath([]);
    } else {
      setNavigationPath(navigationPath.slice(0, index + 1));
    }
    setSelectedItem(null);
  };

  // Get next level - handles branching for composite tokens with derived tokens
  const getNextLevel = (currentLevel: NavigationLevel, item?: any): NavigationLevel | null => {
    // For composite tokens with derived tokens, the path branches:
    // token -> derived -> contract -> execution
    // For non-composite tokens: token -> contract -> execution
    if (currentLevel === 'token' && item?.tokenType === 'composite' && item?.derivedTokens?.length > 0) {
      return 'derived';
    }
    if (currentLevel === 'derived') {
      return 'contract';
    }

    const levels: NavigationLevel[] = ['underlying', 'primary', 'secondary', 'token', 'contract', 'execution'];
    const currentIndex = levels.indexOf(currentLevel);
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    return null;
  };

  // Show Merkle verification dialog
  const showMerkleDialog = (merkle: MerkleInfo) => {
    setSelectedMerkle(merkle);
    setMerkleDialogOpen(true);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Truncate hash
  const truncateHash = (hash: string, length: number = 16) => {
    return hash.length > length ? `${hash.substring(0, length)}...` : hash;
  };

  // Format value
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Render item card based on level
  const renderItemCard = (item: any, level: NavigationLevel) => {
    const nextLevel = getNextLevel(level, item);
    const hasChildren = nextLevel && (
      (level === 'underlying' && item.primaryAssets?.length > 0) ||
      (level === 'primary' && item.secondaryAssets?.length > 0) ||
      (level === 'secondary' && item.tokens?.length > 0) ||
      (level === 'token' && (item.derivedTokens?.length > 0 || item.contracts?.length > 0)) ||
      (level === 'derived' && true) || // Derived tokens always lead to contracts
      (level === 'contract' && item.executions?.length > 0)
    );

    const childCount =
      level === 'underlying' ? item.primaryAssets?.length :
      level === 'primary' ? item.secondaryAssets?.length :
      level === 'secondary' ? item.tokens?.length :
      level === 'token' ? (item.derivedTokens?.length || item.contracts?.length) :
      level === 'derived' ? 'View' :
      level === 'contract' ? item.executions?.length : 0;

    return (
      <Grid item xs={12} md={6} lg={4} key={item.id}>
        <Card
          sx={{
            background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
            border: `1px solid ${levelColors[level]}33`,
            transition: 'all 0.3s ease',
            cursor: hasChildren ? 'pointer' : 'default',
            '&:hover': {
              transform: hasChildren ? 'translateY(-4px)' : 'none',
              boxShadow: hasChildren ? `0 8px 24px ${levelColors[level]}33` : 'none',
              borderColor: levelColors[level],
            },
          }}
          onClick={() => hasChildren && nextLevel && navigateToItem(level, item.id, item.name || item.symbol)}
        >
          <CardContent>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: `${levelColors[level]}22`,
                  color: levelColors[level],
                }}>
                  {levelIcons[level]}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                    {item.name || item.symbol}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    {item.id}
                  </Typography>
                </Box>
              </Box>

              {/* Merkle verification badge */}
              <Tooltip title="View Merkle Proof">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    showMerkleDialog(item.merkle);
                  }}
                  sx={{
                    color: item.merkle?.verified ? COLORS.success : COLORS.error,
                    bgcolor: item.merkle?.verified ? `${COLORS.success}22` : `${COLORS.error}22`,
                  }}
                >
                  {item.merkle?.verified ? <VerifiedUser fontSize="small" /> : <ErrorIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>

            {/* Content based on level */}
            {level === 'underlying' && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label={item.type} size="small" sx={{ bgcolor: `${levelColors[level]}22`, color: levelColors[level] }} />
                  <Chip
                    label={item.status}
                    size="small"
                    sx={{
                      bgcolor: item.status === 'verified' ? `${COLORS.success}22` : `${COLORS.warning}22`,
                      color: item.status === 'verified' ? COLORS.success : COLORS.warning,
                    }}
                  />
                </Box>
                <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 700 }}>
                  {formatValue(item.value)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 1 }}>
                  {item.location}
                </Typography>
              </Box>
            )}

            {level === 'primary' && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Ownership</Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>{item.ownership}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={item.ownership}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '& .MuiLinearProgress-bar': { bgcolor: levelColors[level] },
                  }}
                />
                <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 600, mt: 2 }}>
                  {formatValue(item.value)}
                </Typography>
              </Box>
            )}

            {level === 'secondary' && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={item.category?.replace(/-/g, ' ').toUpperCase() || item.fractionType?.toUpperCase()}
                    size="small"
                    sx={{ bgcolor: `${levelColors[level]}22`, color: levelColors[level] }}
                  />
                  {item.isTransient && (
                    <Chip label="TRANSIENT" size="small" sx={{ bgcolor: `${COLORS.warning}22`, color: COLORS.warning }} />
                  )}
                  {item.requiresVerification && (
                    <Chip
                      label={item.verificationStatus?.toUpperCase() || 'UNVERIFIED'}
                      size="small"
                      sx={{
                        bgcolor: item.verificationStatus === 'verified' ? `${COLORS.success}22` : `${COLORS.error}22`,
                        color: item.verificationStatus === 'verified' ? COLORS.success : COLORS.error,
                      }}
                    />
                  )}
                </Box>
                {item.verifiedBy && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Verified By</Typography>
                    <Typography variant="body2" sx={{ color: '#fff' }}>{item.verifiedBy}</Typography>
                  </Box>
                )}
                {item.validUntil && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Valid Until</Typography>
                    <Typography variant="body2" sx={{ color: new Date(item.validUntil) < new Date() ? COLORS.error : '#fff' }}>
                      {new Date(item.validUntil).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
                <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 600 }}>
                  {item.value > 0 ? formatValue(item.value) : 'Document'}
                </Typography>
              </Box>
            )}

            {level === 'token' && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={item.tokenType.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: item.tokenType === 'composite' ? `${COLORS.purple}22` : `${levelColors[level]}22`,
                      color: item.tokenType === 'composite' ? COLORS.purple : levelColors[level],
                    }}
                  />
                  <Chip label={item.symbol} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} />
                  {item.isTransient && (
                    <Chip label="TRANSIENT" size="small" sx={{ bgcolor: `${COLORS.warning}22`, color: COLORS.warning }} />
                  )}
                  {item.requiresVerificationOnChange && (
                    <Chip label="VERIFY REQ" size="small" sx={{ bgcolor: `${COLORS.orange}22`, color: COLORS.orange }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Circulating</Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {(item.circulatingSupply / 1000000).toFixed(2)}M / {(item.totalSupply / 1000000).toFixed(2)}M
                  </Typography>
                </Box>
                {item.tokenType === 'composite' && item.linkedSecondaryTokenIds?.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Linked Tokens</Typography>
                    <Typography variant="body2" sx={{ color: COLORS.purple }}>
                      {item.linkedSecondaryTokenIds.length} secondary
                    </Typography>
                  </Box>
                )}
                {item.derivedTokens?.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Derived Tokens</Typography>
                    <Typography variant="body2" sx={{ color: levelColors.derived }}>
                      {item.derivedTokens.length} income streams
                    </Typography>
                  </Box>
                )}
                <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 600 }}>
                  ${item.price.toFixed(2)}
                </Typography>
              </Box>
            )}

            {level === 'derived' && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={item.category?.replace(/-/g, ' ').toUpperCase()}
                    size="small"
                    sx={{ bgcolor: `${levelColors[level]}22`, color: levelColors[level] }}
                  />
                  <Chip label={item.symbol} size="small" variant="outlined" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }} />
                  {item.isTransactable && (
                    <Chip label="TRADABLE" size="small" sx={{ bgcolor: `${COLORS.success}22`, color: COLORS.success }} />
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Stream Frequency</Typography>
                  <Typography variant="body2" sx={{ color: '#fff', textTransform: 'capitalize' }}>
                    {item.streamFrequency}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Streamed</Typography>
                  <Typography variant="body2" sx={{ color: COLORS.success }}>
                    {formatValue(item.totalStreamed || 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Next Stream</Typography>
                  <Typography variant="body2" sx={{ color: '#fff' }}>
                    {item.nextStreamDate ? new Date(item.nextStreamDate).toLocaleDateString() : 'N/A'}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 600, mt: 1 }}>
                  ${item.price?.toFixed(2) || '0.00'} / token
                </Typography>
                {item.tradingRestrictions?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      Restrictions: {item.tradingRestrictions.join(', ')}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {level === 'contract' && (
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip label={item.type?.toUpperCase()} size="small" sx={{ bgcolor: `${levelColors[level]}22`, color: levelColors[level] }} />
                  <Chip label={item.contractCategory?.toUpperCase()} size="small" sx={{ bgcolor: `${COLORS.blue}22`, color: COLORS.blue }} />
                  <Chip
                    label={item.status}
                    size="small"
                    sx={{
                      bgcolor: item.status === 'active' ? `${COLORS.success}22` : 'rgba(255,255,255,0.1)',
                      color: item.status === 'active' ? COLORS.success : 'rgba(255,255,255,0.6)',
                    }}
                  />
                  {item.rbacEnabled && (
                    <Chip label="RBAC" size="small" sx={{ bgcolor: `${COLORS.purple}22`, color: COLORS.purple }} />
                  )}
                  {item.requiresMultiSig && (
                    <Chip label={`${item.multiSigThreshold}-of-${item.multiSigSigners?.length || '?'}`} size="small" sx={{ bgcolor: `${COLORS.orange}22`, color: COLORS.orange }} />
                  )}
                </Box>
                {item.complianceStatus && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Compliance</Typography>
                    <Chip
                      label={item.complianceStatus.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor: item.complianceStatus === 'compliant' ? `${COLORS.success}22` : `${COLORS.warning}22`,
                        color: item.complianceStatus === 'compliant' ? COLORS.success : COLORS.warning,
                        height: 20,
                      }}
                    />
                  </Box>
                )}
                <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 600 }}>
                  {formatValue(item.value)}
                </Typography>
              </Box>
            )}

            {level === 'execution' && (
              <Box>
                <Chip
                  label={item.result.toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: item.result === 'success' ? `${COLORS.success}22` : `${COLORS.error}22`,
                    color: item.result === 'success' ? COLORS.success : COLORS.error,
                    mb: 2,
                  }}
                />
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                  {item.action}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 1 }}>
                  {new Date(item.timestamp).toLocaleString()}
                </Typography>
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                    {truncateHash(item.txHash, 20)}
                  </Typography>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); copyToClipboard(item.txHash); }}>
                    <ContentCopy fontSize="small" sx={{ color: 'rgba(255,255,255,0.4)' }} />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Children indicator */}
            {hasChildren && (
              <Box sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  {childCount} {levelLabels[nextLevel!]}
                </Typography>
                <ArrowForward sx={{ color: levelColors[level], fontSize: 18 }} />
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    );
  };

  // Render hierarchy flow visualization
  const renderHierarchyFlow = () => {
    // Include derived in the flow - shown as branching from token for composite tokens
    const levels: NavigationLevel[] = ['underlying', 'primary', 'secondary', 'token', 'derived', 'contract', 'execution'];
    const currentLevel = getCurrentLevel();

    return (
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
          RWA Lifecycle Hierarchy
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          {levels.map((level, index) => {
            const isActive = levels.indexOf(currentLevel) >= index;
            const isCurrent = level === currentLevel;

            return (
              <React.Fragment key={level}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    opacity: isActive ? 1 : 0.4,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '50%',
                      bgcolor: isCurrent ? levelColors[level] : `${levelColors[level]}33`,
                      color: isCurrent ? '#fff' : levelColors[level],
                      border: isCurrent ? `2px solid ${levelColors[level]}` : 'none',
                      boxShadow: isCurrent ? `0 0 16px ${levelColors[level]}66` : 'none',
                    }}
                  >
                    {levelIcons[level]}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isCurrent ? '#fff' : 'rgba(255,255,255,0.6)',
                      fontWeight: isCurrent ? 600 : 400,
                      textAlign: 'center',
                      fontSize: '0.65rem',
                    }}
                  >
                    {levelLabels[level]}
                  </Typography>
                </Box>
                {index < levels.length - 1 && (
                  <ChevronRight sx={{ color: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }} />
                )}
              </React.Fragment>
            );
          })}
        </Box>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentItems = getCurrentItems();
  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel(currentLevel);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Layers sx={{ color: COLORS.primary }} />
          RWA Registry Navigation
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Navigate through the complete asset lifecycle hierarchy with Merkle tree verification
        </Typography>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error} - Showing demonstration data
        </Alert>
      )}

      {/* Hierarchy Flow */}
      {renderHierarchyFlow()}

      {/* Breadcrumb Navigation */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <Breadcrumbs
          separator={<NavigateNext sx={{ color: 'rgba(255,255,255,0.4)' }} />}
          sx={{ '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' } }}
        >
          <Link
            component="button"
            underline="hover"
            onClick={() => navigateToLevel(-1)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: navigationPath.length === 0 ? COLORS.primary : 'rgba(255,255,255,0.7)',
              fontWeight: navigationPath.length === 0 ? 600 : 400,
            }}
          >
            <Home fontSize="small" />
            Underlying Assets
          </Link>
          {navigationPath.map((path, index) => (
            <Link
              key={path.id}
              component="button"
              underline="hover"
              onClick={() => navigateToLevel(index)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: index === navigationPath.length - 1 ? levelColors[getNextLevel(path.level) || 'underlying'] : 'rgba(255,255,255,0.7)',
                fontWeight: index === navigationPath.length - 1 ? 600 : 400,
              }}
            >
              {levelIcons[getNextLevel(path.level) || 'underlying']}
              {path.name}
            </Link>
          ))}
        </Breadcrumbs>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Current Level
              </Typography>
              <Typography variant="h6" sx={{ color: levelColors[nextLevel || currentLevel], fontWeight: 600 }}>
                {levelLabels[nextLevel || currentLevel]}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Items at Level
              </Typography>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                {currentItems.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Verified Items
              </Typography>
              <Typography variant="h6" sx={{ color: COLORS.success, fontWeight: 600 }}>
                {currentItems.filter((i: any) => i.merkle?.verified).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'rgba(26, 31, 58, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Navigation Depth
              </Typography>
              <Typography variant="h6" sx={{ color: COLORS.purple, fontWeight: 600 }}>
                {navigationPath.length + 1} / 6
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Items Grid */}
      {currentItems.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'rgba(26, 31, 58, 0.5)' }}>
          <Info sx={{ fontSize: 64, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            No {levelLabels[nextLevel || currentLevel]} found at this level
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigateToLevel(navigationPath.length - 2)}
            sx={{ mt: 2 }}
          >
            Go Back
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {currentItems.map((item: any) => renderItemCard(item, nextLevel || currentLevel))}
        </Grid>
      )}

      {/* Merkle Verification Dialog */}
      <Dialog
        open={merkleDialogOpen}
        onClose={() => setMerkleDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: '#1A1F3A', color: '#fff' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security sx={{ color: COLORS.primary }} />
          Merkle Tree Verification
        </DialogTitle>
        <DialogContent>
          {selectedMerkle && (
            <Box>
              <Alert
                severity={selectedMerkle.verified ? 'success' : 'error'}
                sx={{ mb: 3 }}
                icon={selectedMerkle.verified ? <CheckCircle /> : <ErrorIcon />}
              >
                {selectedMerkle.verified
                  ? 'This item has been cryptographically verified on the Merkle tree registry'
                  : 'Verification pending or failed - please contact support'}
              </Alert>

              <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        Root Hash
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontFamily: 'monospace', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {selectedMerkle.rootHash}
                          <IconButton size="small" onClick={() => copyToClipboard(selectedMerkle.rootHash)}>
                            <ContentCopy fontSize="small" sx={{ color: 'rgba(255,255,255,0.4)' }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        Leaf Hash
                      </TableCell>
                      <TableCell sx={{ color: '#fff', fontFamily: 'monospace', borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {selectedMerkle.leafHash}
                          <IconButton size="small" onClick={() => copyToClipboard(selectedMerkle.leafHash)}>
                            <ContentCopy fontSize="small" sx={{ color: 'rgba(255,255,255,0.4)' }} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        Verification Status
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Chip
                          label={selectedMerkle.verified ? 'VERIFIED' : 'UNVERIFIED'}
                          color={selectedMerkle.verified ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        Last Verified
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {new Date(selectedMerkle.lastVerified).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {selectedMerkle.proofPath && selectedMerkle.proofPath.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                    Proof Path ({selectedMerkle.proofPath.length} hops)
                  </Typography>
                  <List dense>
                    {selectedMerkle.proofPath.map((element, index) => (
                      <ListItem key={index} sx={{ bgcolor: 'rgba(255,255,255,0.03)', mb: 1, borderRadius: 1 }}>
                        <ListItemIcon>
                          <Chip
                            label={element.isLeft ? 'L' : 'R'}
                            size="small"
                            sx={{
                              bgcolor: element.isLeft ? `${COLORS.blue}22` : `${COLORS.purple}22`,
                              color: element.isLeft ? COLORS.blue : COLORS.purple,
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#fff' }}>
                              {element.siblingHash}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMerkleDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<VerifiedUser />}
            sx={{ bgcolor: COLORS.primary }}
          >
            Re-verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RWARegistryNavigation;

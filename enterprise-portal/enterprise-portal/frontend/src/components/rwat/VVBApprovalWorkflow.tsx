/**
 * VVB Approval Workflow Component
 *
 * Validation and Verification Body (VVB) approval workflow for real-world assets,
 * carbon credits, and compliance-driven tokenization. Implements independent
 * third-party verification with multi-stage approval process.
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Tabs,
  Tab,
  Avatar,
  Rating,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Cancel,
  Pending,
  Assignment,
  Description,
  VerifiedUser,
  Warning,
  Schedule,
  Refresh,
  Search,
  Pause,
  Visibility,
  Edit,
  Send,
  AssignmentTurnedIn,
  HourglassEmpty,
  ThumbUp,
  History,
} from '@mui/icons-material';

// Types for VVB Workflow
export type VVBStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'additional_info_required'
  | 'site_inspection'
  | 'verification_report'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type VerificationType =
  | 'carbon_credit'
  | 'renewable_energy'
  | 'sustainable_forestry'
  | 'water_conservation'
  | 'biodiversity'
  | 'social_impact'
  | 'rwa_real_estate'
  | 'rwa_commodities'
  | 'rwa_digital_art'        // Digital art, NFTs, digital collectibles
  | 'rwa_intellectual_property' // Patents, trademarks, copyrights
  | 'rwa_patent'             // Patent verification
  | 'rwa_trademark'          // Trademark verification
  | 'rwa_copyright'          // Copyright verification
  | 'rwa_nft'                // NFT authenticity verification
  // Banking & Trade Finance
  | 'banking_trade_finance'  // Letters of credit, trade receivables
  | 'banking_deposits'       // Bank deposits, CDs
  | 'banking_loans'          // Commercial loans, mortgages
  | 'banking_invoice_factoring' // Invoice financing
  | 'banking_supply_chain_finance' // Supply chain finance
  | 'banking_treasury'       // Treasury instruments
  | 'compliance_audit';

export interface VVBSubmission {
  id: string;
  projectName: string;
  projectDescription: string;
  verificationType: VerificationType;
  submittedBy: string;
  submittedAt: string;
  status: VVBStatus;
  assignedVVB: VVBOrganization | null;
  assignedAt?: string;
  estimatedCredits?: number;
  estimatedValue?: number;
  location: string;
  documents: VVBDocument[];
  comments: VVBComment[];
  timeline: VVBTimelineEvent[];
  verificationReport?: VerificationReport;
  certificate?: VVBCertificate;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
}

export interface VVBOrganization {
  id: string;
  name: string;
  accreditations: string[];
  specializations: VerificationType[];
  rating: number;
  completedVerifications: number;
  averageProcessingDays: number;
  contactEmail: string;
  country: string;
  active: boolean;
}

export interface VVBDocument {
  id: string;
  name: string;
  type: 'project_design' | 'monitoring_report' | 'methodology' | 'evidence' | 'certificate' | 'other';
  uploadedAt: string;
  uploadedBy: string;
  fileSize: number;
  status: 'pending_review' | 'approved' | 'rejected' | 'requires_update';
  comments?: string;
}

export interface VVBComment {
  id: string;
  author: string;
  authorRole: 'submitter' | 'vvb_reviewer' | 'admin';
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface VVBTimelineEvent {
  id: string;
  event: string;
  description: string;
  timestamp: string;
  actor: string;
  status: VVBStatus;
}

export interface VerificationReport {
  id: string;
  reportDate: string;
  reportedBy: string;
  findings: string;
  methodology: string;
  verifiedCredits: number;
  deductions: number;
  finalCredits: number;
  recommendation: 'approve' | 'reject' | 'conditional';
  conditions?: string[];
  attachments: string[];
}

export interface VVBCertificate {
  id: string;
  certificateNumber: string;
  issuedAt: string;
  expiresAt: string;
  verifiedCredits: number;
  registryId: string;
  blockchainTxHash: string;
}

// Workflow stages
const workflowStages: { status: VVBStatus; label: string; description: string }[] = [
  { status: 'draft', label: 'Draft', description: 'Initial submission preparation' },
  { status: 'submitted', label: 'Submitted', description: 'Awaiting VVB assignment' },
  { status: 'under_review', label: 'Under Review', description: 'VVB reviewing documentation' },
  { status: 'additional_info_required', label: 'Info Required', description: 'Additional information needed' },
  { status: 'site_inspection', label: 'Site Inspection', description: 'On-site verification (if required)' },
  { status: 'verification_report', label: 'Verification Report', description: 'Final report preparation' },
  { status: 'approved', label: 'Approved', description: 'Verification complete, credits issued' },
];

// Mock VVB Organizations
const mockVVBOrganizations: VVBOrganization[] = [
  {
    id: 'vvb_1',
    name: 'Bureau Veritas',
    accreditations: ['ISO 14064', 'CDM', 'VCS', 'Gold Standard'],
    specializations: ['carbon_credit', 'renewable_energy', 'sustainable_forestry'],
    rating: 4.8,
    completedVerifications: 1250,
    averageProcessingDays: 45,
    contactEmail: 'carbon@bureauveritas.com',
    country: 'France',
    active: true,
  },
  {
    id: 'vvb_2',
    name: 'DNV GL',
    accreditations: ['ISO 14064', 'CDM', 'VCS', 'GCC'],
    specializations: ['carbon_credit', 'renewable_energy', 'water_conservation'],
    rating: 4.9,
    completedVerifications: 980,
    averageProcessingDays: 38,
    contactEmail: 'climate@dnvgl.com',
    country: 'Norway',
    active: true,
  },
  {
    id: 'vvb_3',
    name: 'SGS SA',
    accreditations: ['ISO 14064', 'VCS', 'Plan Vivo'],
    specializations: ['carbon_credit', 'biodiversity', 'social_impact'],
    rating: 4.7,
    completedVerifications: 870,
    averageProcessingDays: 42,
    contactEmail: 'sustainability@sgs.com',
    country: 'Switzerland',
    active: true,
  },
  {
    id: 'vvb_4',
    name: 'Deloitte Real Estate Services',
    accreditations: ['RICS', 'IVSC', 'SOC 2'],
    specializations: ['rwa_real_estate', 'rwa_commodities', 'compliance_audit'],
    rating: 4.6,
    completedVerifications: 650,
    averageProcessingDays: 30,
    contactEmail: 'realestate@deloitte.com',
    country: 'USA',
    active: true,
  },
  {
    id: 'vvb_5',
    name: 'Verisart Digital Authentication',
    accreditations: ['ISO 27001', 'WIPO', 'Blockchain Certification'],
    specializations: ['rwa_digital_art', 'rwa_nft', 'rwa_copyright'],
    rating: 4.7,
    completedVerifications: 3200,
    averageProcessingDays: 14,
    contactEmail: 'verify@verisart.com',
    country: 'UK',
    active: true,
  },
  {
    id: 'vvb_6',
    name: 'WIPO IP Verification Services',
    accreditations: ['WIPO', 'USPTO', 'EPO', 'PCT'],
    specializations: ['rwa_intellectual_property', 'rwa_patent', 'rwa_trademark'],
    rating: 4.9,
    completedVerifications: 5600,
    averageProcessingDays: 21,
    contactEmail: 'ipverify@wipo.int',
    country: 'Switzerland',
    active: true,
  },
  {
    id: 'vvb_7',
    name: 'Christie\'s Art Authentication',
    accreditations: ['RICS', 'AAA', 'IFAR', 'Provenance Standards'],
    specializations: ['rwa_digital_art', 'rwa_nft', 'compliance_audit'],
    rating: 4.8,
    completedVerifications: 890,
    averageProcessingDays: 28,
    contactEmail: 'authentication@christies.com',
    country: 'UK',
    active: true,
  },
  {
    id: 'vvb_8',
    name: 'Patent Analytics International',
    accreditations: ['USPTO', 'EPO', 'JPO', 'CNIPA'],
    specializations: ['rwa_patent', 'rwa_intellectual_property', 'rwa_trademark'],
    rating: 4.6,
    completedVerifications: 2100,
    averageProcessingDays: 35,
    contactEmail: 'patents@patentanalytics.com',
    country: 'USA',
    active: true,
  },
  {
    id: 'vvb_9',
    name: 'KPMG Trade Finance Advisory',
    accreditations: ['ICC', 'Basel III', 'SWIFT', 'LMA'],
    specializations: ['banking_trade_finance', 'banking_loans', 'banking_supply_chain_finance'],
    rating: 4.9,
    completedVerifications: 4200,
    averageProcessingDays: 18,
    contactEmail: 'tradefinance@kpmg.com',
    country: 'UK',
    active: true,
  },
  {
    id: 'vvb_10',
    name: 'PwC Banking & Capital Markets',
    accreditations: ['Basel III', 'ISDA', 'SOC 2', 'ISO 27001'],
    specializations: ['banking_deposits', 'banking_treasury', 'banking_loans'],
    rating: 4.8,
    completedVerifications: 3800,
    averageProcessingDays: 21,
    contactEmail: 'banking@pwc.com',
    country: 'USA',
    active: true,
  },
  {
    id: 'vvb_11',
    name: 'Euler Hermes Credit Verification',
    accreditations: ['ICC', 'Berne Union', 'ICISA'],
    specializations: ['banking_invoice_factoring', 'banking_trade_finance', 'compliance_audit'],
    rating: 4.7,
    completedVerifications: 5100,
    averageProcessingDays: 14,
    contactEmail: 'verification@eulerhermes.com',
    country: 'Germany',
    active: true,
  },
];

// Mock submissions
const mockSubmissions: VVBSubmission[] = [
  {
    id: 'sub_1',
    projectName: 'Amazon Reforestation Project',
    projectDescription: 'Large-scale reforestation initiative in the Amazon basin covering 50,000 hectares',
    verificationType: 'carbon_credit',
    submittedBy: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    submittedAt: '2025-10-01T10:00:00Z',
    status: 'under_review',
    assignedVVB: mockVVBOrganizations[0] ?? null,
    assignedAt: '2025-10-03T14:00:00Z',
    estimatedCredits: 500000,
    estimatedValue: 12500000,
    location: 'Brazil, Amazon Basin',
    priority: 'high',
    dueDate: '2025-12-15T00:00:00Z',
    documents: [
      {
        id: 'doc_1',
        name: 'Project Design Document.pdf',
        type: 'project_design',
        uploadedAt: '2025-10-01T09:00:00Z',
        uploadedBy: 'Project Manager',
        fileSize: 2500000,
        status: 'approved',
      },
      {
        id: 'doc_2',
        name: 'Baseline Assessment.pdf',
        type: 'monitoring_report',
        uploadedAt: '2025-10-01T09:30:00Z',
        uploadedBy: 'Project Manager',
        fileSize: 1800000,
        status: 'pending_review',
      },
    ],
    comments: [
      {
        id: 'com_1',
        author: 'Bureau Veritas',
        authorRole: 'vvb_reviewer',
        content: 'Initial review completed. Requesting satellite imagery from 2024.',
        createdAt: '2025-10-10T11:00:00Z',
        isInternal: false,
      },
    ],
    timeline: [
      {
        id: 'tl_1',
        event: 'Submission Created',
        description: 'Project submitted for verification',
        timestamp: '2025-10-01T10:00:00Z',
        actor: 'Project Manager',
        status: 'submitted',
      },
      {
        id: 'tl_2',
        event: 'VVB Assigned',
        description: 'Bureau Veritas assigned as verification body',
        timestamp: '2025-10-03T14:00:00Z',
        actor: 'System',
        status: 'under_review',
      },
    ],
  },
  {
    id: 'sub_2',
    projectName: 'Manhattan Commercial Property',
    projectDescription: 'Class A office building tokenization with ESG compliance verification',
    verificationType: 'rwa_real_estate',
    submittedBy: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    submittedAt: '2025-10-15T08:00:00Z',
    status: 'approved',
    assignedVVB: mockVVBOrganizations[3] ?? null,
    assignedAt: '2025-10-16T10:00:00Z',
    estimatedCredits: 0,
    estimatedValue: 25000000,
    location: 'New York, USA',
    priority: 'medium',
    documents: [],
    comments: [],
    timeline: [],
    certificate: {
      id: 'cert_1',
      certificateNumber: 'VVB-2025-RWA-001234',
      issuedAt: '2025-11-01T00:00:00Z',
      expiresAt: '2026-11-01T00:00:00Z',
      verifiedCredits: 0,
      registryId: 'RWAT_RE_001',
      blockchainTxHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    },
  },
  {
    id: 'sub_3',
    projectName: 'Solar Farm Grid Integration',
    projectDescription: 'Renewable energy certificate verification for 100MW solar installation',
    verificationType: 'renewable_energy',
    submittedBy: '0x3Cd2aD206CCDa48DA06e7E4B69C4F3B4ba2f7956',
    submittedAt: '2025-11-01T14:00:00Z',
    status: 'submitted',
    assignedVVB: null,
    estimatedCredits: 175000,
    estimatedValue: 3500000,
    location: 'Texas, USA',
    priority: 'medium',
    documents: [],
    comments: [],
    timeline: [],
  },
];

const VVBApprovalWorkflow: React.FC = () => {
  const [submissions, setSubmissions] = useState<VVBSubmission[]>(mockSubmissions);
  const [vvbOrganizations] = useState<VVBOrganization[]>(mockVVBOrganizations);
  const [selectedSubmission, setSelectedSubmission] = useState<VVBSubmission | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [assignVVBDialogOpen, setAssignVVBDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VVBStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // New submission form state
  const [newSubmission, setNewSubmission] = useState({
    projectName: '',
    projectDescription: '',
    verificationType: 'carbon_credit' as VerificationType,
    location: '',
    estimatedCredits: 0,
    estimatedValue: 0,
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  // Stats calculations
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'submitted').length,
    inProgress: submissions.filter((s) =>
      ['under_review', 'additional_info_required', 'site_inspection', 'verification_report'].includes(s.status)
    ).length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    totalValue: submissions.reduce((sum, s) => sum + (s.estimatedValue || 0), 0),
    totalCredits: submissions.reduce((sum, s) => sum + (s.estimatedCredits || 0), 0),
  };

  const getStatusColor = (status: VVBStatus) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'submitted':
        return 'info';
      case 'under_review':
        return 'warning';
      case 'additional_info_required':
        return 'warning';
      case 'site_inspection':
        return 'secondary';
      case 'verification_report':
        return 'primary';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: VVBStatus) => {
    switch (status) {
      case 'draft':
        return <Edit fontSize="small" />;
      case 'submitted':
        return <Send fontSize="small" />;
      case 'under_review':
        return <HourglassEmpty fontSize="small" />;
      case 'additional_info_required':
        return <Warning fontSize="small" />;
      case 'site_inspection':
        return <Visibility fontSize="small" />;
      case 'verification_report':
        return <Description fontSize="small" />;
      case 'approved':
        return <CheckCircle fontSize="small" />;
      case 'rejected':
        return <Cancel fontSize="small" />;
      case 'suspended':
        return <Pause fontSize="small" />;
      default:
        return <Pending fontSize="small" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStageIndex = (status: VVBStatus): number => {
    const index = workflowStages.findIndex((s) => s.status === status);
    return index >= 0 ? index : 0;
  };

  const handleCreateSubmission = () => {
    const submission: VVBSubmission = {
      id: `sub_${Date.now()}`,
      ...newSubmission,
      submittedBy: '0xCurrentUser',
      submittedAt: new Date().toISOString(),
      status: 'draft',
      assignedVVB: null,
      documents: [],
      comments: [],
      timeline: [
        {
          id: `tl_${Date.now()}`,
          event: 'Submission Created',
          description: 'Draft submission created',
          timestamp: new Date().toISOString(),
          actor: 'Current User',
          status: 'draft',
        },
      ],
    };
    setSubmissions([submission, ...submissions]);
    setDialogOpen(false);
    setNewSubmission({
      projectName: '',
      projectDescription: '',
      verificationType: 'carbon_credit',
      location: '',
      estimatedCredits: 0,
      estimatedValue: 0,
      priority: 'medium',
    });
  };

  const handleAssignVVB = (vvb: VVBOrganization) => {
    if (!selectedSubmission) return;

    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === selectedSubmission.id
          ? {
              ...s,
              assignedVVB: vvb,
              assignedAt: new Date().toISOString(),
              status: 'under_review' as VVBStatus,
              timeline: [
                ...s.timeline,
                {
                  id: `tl_${Date.now()}`,
                  event: 'VVB Assigned',
                  description: `${vvb.name} assigned as verification body`,
                  timestamp: new Date().toISOString(),
                  actor: 'System',
                  status: 'under_review' as VVBStatus,
                },
              ],
            }
          : s
      )
    );
    setAssignVVBDialogOpen(false);
  };

  const handleStatusUpdate = (submissionId: string, newStatus: VVBStatus) => {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: newStatus,
              timeline: [
                ...s.timeline,
                {
                  id: `tl_${Date.now()}`,
                  event: `Status Updated to ${newStatus}`,
                  description: `Verification status changed to ${newStatus.replace('_', ' ')}`,
                  timestamp: new Date().toISOString(),
                  actor: 'Current User',
                  status: newStatus,
                },
              ],
            }
          : s
      )
    );
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesSearch =
      s.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">VVB Approval Workflow</Typography>
          <Typography variant="body2" color="textSecondary">
            Validation and Verification Body independent approval workflow
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          New Submission
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Badge badgeContent={stats.pending} color="info">
                <Assignment sx={{ fontSize: 32, color: 'info.main' }} />
              </Badge>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {stats.total}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total Submissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <HourglassEmpty sx={{ fontSize: 32, color: 'warning.main' }} />
              <Typography variant="h5" sx={{ mt: 1 }}>
                {stats.inProgress}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 32, color: 'success.main' }} />
              <Typography variant="h5" sx={{ mt: 1 }}>
                {stats.approved}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Cancel sx={{ fontSize: 32, color: 'error.main' }} />
              <Typography variant="h5" sx={{ mt: 1 }}>
                {stats.rejected}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="success.main">
                {formatCurrency(stats.totalValue)}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Total Value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" color="primary.main">
                {(stats.totalCredits / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Est. Credits
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label="All Submissions" />
            <Tab label="Pending Assignment" />
            <Tab label="In Review" />
            <Tab label="VVB Organizations" />
          </Tabs>
        </Box>

        <CardContent>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as VVBStatus | 'all')}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="under_review">Under Review</MenuItem>
                <MenuItem value="additional_info_required">Info Required</MenuItem>
                <MenuItem value="site_inspection">Site Inspection</MenuItem>
                <MenuItem value="verification_report">Verification Report</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<Refresh />} onClick={() => setSubmissions([...mockSubmissions])}>
              Refresh
            </Button>
          </Box>

          {/* Submissions Tab */}
          {activeTab < 3 && (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Assigned VVB</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Est. Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSubmissions
                    .filter((s) => {
                      if (activeTab === 1) return s.status === 'submitted' && !s.assignedVVB;
                      if (activeTab === 2)
                        return ['under_review', 'additional_info_required', 'site_inspection'].includes(s.status);
                      return true;
                    })
                    .map((submission) => (
                      <TableRow key={submission.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {submission.projectName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {submission.id}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={submission.verificationType.replace('_', ' ')}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{submission.location}</TableCell>
                        <TableCell>
                          {submission.assignedVVB ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>
                                {submission.assignedVVB.name.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">{submission.assignedVVB.name}</Typography>
                            </Box>
                          ) : (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setAssignVVBDialogOpen(true);
                              }}
                            >
                              Assign VVB
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(submission.status)}
                            label={submission.status.replace('_', ' ')}
                            size="small"
                            color={getStatusColor(submission.status) as any}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={submission.priority}
                            size="small"
                            color={getPriorityColor(submission.priority) as any}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(submission.estimatedValue || 0)}
                          </Typography>
                          {(submission.estimatedCredits ?? 0) > 0 && (
                            <Typography variant="caption" color="textSecondary">
                              {(submission.estimatedCredits ?? 0).toLocaleString()} credits
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSubmission(submission);
                                setDetailDialogOpen(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {submission.status === 'under_review' && (
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleStatusUpdate(submission.id, 'approved')}
                              >
                                <ThumbUp />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* VVB Organizations Tab */}
          {activeTab === 3 && (
            <Grid container spacing={2}>
              {vvbOrganizations.map((vvb) => (
                <Grid item xs={12} md={6} key={vvb.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                            {vvb.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">{vvb.name}</Typography>
                            <Typography variant="body2" color="textSecondary">
                              {vvb.country}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={vvb.active ? 'Active' : 'Inactive'}
                          color={vvb.active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Rating value={vvb.rating} precision={0.1} size="small" readOnly />
                          <Typography variant="body2">({vvb.rating})</Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {vvb.completedVerifications} verifications completed
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Avg. {vvb.averageProcessingDays} days processing time
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                          {vvb.accreditations.map((acc) => (
                            <Chip key={acc} label={acc} size="small" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Create Submission Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create VVB Submission</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                value={newSubmission.projectName}
                onChange={(e) => setNewSubmission({ ...newSubmission, projectName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Project Description"
                value={newSubmission.projectDescription}
                onChange={(e) => setNewSubmission({ ...newSubmission, projectDescription: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Verification Type</InputLabel>
                <Select
                  value={newSubmission.verificationType}
                  label="Verification Type"
                  onChange={(e) =>
                    setNewSubmission({ ...newSubmission, verificationType: e.target.value as VerificationType })
                  }
                >
                  <MenuItem value="carbon_credit">Carbon Credit</MenuItem>
                  <MenuItem value="renewable_energy">Renewable Energy</MenuItem>
                  <MenuItem value="sustainable_forestry">Sustainable Forestry</MenuItem>
                  <MenuItem value="water_conservation">Water Conservation</MenuItem>
                  <MenuItem value="biodiversity">Biodiversity</MenuItem>
                  <MenuItem value="social_impact">Social Impact</MenuItem>
                  <MenuItem value="rwa_real_estate">RWA - Real Estate</MenuItem>
                  <MenuItem value="rwa_commodities">RWA - Commodities</MenuItem>
                  <MenuItem value="compliance_audit">Compliance Audit</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={newSubmission.location}
                onChange={(e) => setNewSubmission({ ...newSubmission, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Credits"
                value={newSubmission.estimatedCredits}
                onChange={(e) => setNewSubmission({ ...newSubmission, estimatedCredits: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Estimated Value (USD)"
                value={newSubmission.estimatedValue}
                onChange={(e) => setNewSubmission({ ...newSubmission, estimatedValue: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newSubmission.priority}
                  label="Priority"
                  onChange={(e) =>
                    setNewSubmission({
                      ...newSubmission,
                      priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent',
                    })
                  }
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmission}
            disabled={!newSubmission.projectName || !newSubmission.location}
          >
            Create Submission
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign VVB Dialog */}
      <Dialog open={assignVVBDialogOpen} onClose={() => setAssignVVBDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Verification Body</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select a VVB to assign to: <strong>{selectedSubmission?.projectName}</strong>
          </Typography>
          <List>
            {vvbOrganizations
              .filter((vvb) => vvb.active && vvb.specializations.includes(selectedSubmission?.verificationType as any))
              .map((vvb) => (
                <ListItem
                  key={vvb.id}
                  component="div"
                  onClick={() => handleAssignVVB(vvb)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, borderRadius: 1, mb: 1 }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{vvb.name.charAt(0)}</Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={vvb.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating value={vvb.rating} size="small" readOnly />
                        <Typography variant="caption">({vvb.completedVerifications} verifications)</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignVVBDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Submission Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedSubmission && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {selectedSubmission.projectName}
                <Chip
                  icon={getStatusIcon(selectedSubmission.status)}
                  label={selectedSubmission.status.replace('_', ' ')}
                  color={getStatusColor(selectedSubmission.status) as any}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              {/* Workflow Progress */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Verification Progress
                </Typography>
                <Stepper activeStep={getStageIndex(selectedSubmission.status)} alternativeLabel>
                  {workflowStages.map((stage) => (
                    <Step key={stage.status}>
                      <StepLabel>{stage.label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Verification Type
                  </Typography>
                  <Typography variant="body1">
                    {selectedSubmission.verificationType.replace('_', ' ')}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Location
                  </Typography>
                  <Typography variant="body1">{selectedSubmission.location}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{selectedSubmission.projectDescription}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Estimated Value
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(selectedSubmission.estimatedValue || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Estimated Credits
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {(selectedSubmission.estimatedCredits || 0).toLocaleString()}
                  </Typography>
                </Grid>

                {selectedSubmission.assignedVVB && (
                  <Grid item xs={12}>
                    <Alert severity="info" icon={<VerifiedUser />}>
                      Assigned to <strong>{selectedSubmission.assignedVVB.name}</strong> on{' '}
                      {new Date(selectedSubmission.assignedAt!).toLocaleDateString()}
                    </Alert>
                  </Grid>
                )}

                {selectedSubmission.certificate && (
                  <Grid item xs={12}>
                    <Alert severity="success" icon={<AssignmentTurnedIn />}>
                      Certificate #{selectedSubmission.certificate.certificateNumber} issued on{' '}
                      {new Date(selectedSubmission.certificate.issuedAt).toLocaleDateString()}
                    </Alert>
                  </Grid>
                )}

                {/* Timeline */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    <History sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Activity Timeline
                  </Typography>
                  <List dense>
                    {selectedSubmission.timeline.map((event) => (
                      <ListItem key={event.id}>
                        <ListItemIcon>
                          <Schedule fontSize="small" color="action" />
                        </ListItemIcon>
                        <ListItemText
                          primary={event.event}
                          secondary={`${event.description} - ${new Date(event.timestamp).toLocaleString()}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {selectedSubmission.status === 'draft' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    handleStatusUpdate(selectedSubmission.id, 'submitted');
                    setDetailDialogOpen(false);
                  }}
                >
                  Submit for Verification
                </Button>
              )}
              {selectedSubmission.status === 'under_review' && (
                <>
                  <Button color="error" onClick={() => handleStatusUpdate(selectedSubmission.id, 'rejected')}>
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleStatusUpdate(selectedSubmission.id, 'approved')}
                  >
                    Approve
                  </Button>
                </>
              )}
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default VVBApprovalWorkflow;

/**
 * VVB Verification Management Component
 * Handles Validation/Verification Body (VVB) workflow for contracts
 *
 * Workflow States:
 * FULLY_SIGNED -> VVB_REVIEW -> VVB_APPROVED/VVB_REJECTED -> ACTIVE
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, Stepper, Step, StepLabel, IconButton,
  Tooltip, LinearProgress, Divider, Avatar, List, ListItem,
  ListItemText, ListItemAvatar, ListItemSecondaryAction
} from '@mui/material';
import {
  Send, CheckCircle, Cancel, Visibility, History, Refresh,
  HourglassEmpty, VerifiedUser, Assignment, ThumbUp, ThumbDown
} from '@mui/icons-material';

// ============================================================================
// TYPES
// ============================================================================

type VVBStatus = 'DRAFT' | 'FULLY_SIGNED' | 'VVB_REVIEW' | 'VVB_APPROVED' | 'VVB_REJECTED' | 'ACTIVE';

interface VVBVerificationRecord {
  id: string;
  contractId: string;
  contractName: string;
  status: VVBStatus;
  submittedBy: string;
  submittedAt: string;
  vvbReviewer?: string;
  reviewedAt?: string;
  comments?: string;
  rejectionReason?: string;
  parties: string[];
  value: number;
  type: 'ricardian' | 'smart' | 'hybrid';
}

interface VVBHistoryEntry {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
  details?: string;
  oldStatus: VVBStatus;
  newStatus: VVBStatus;
}

interface VVBSubmitRequest {
  contractId: string;
  notes?: string;
}

interface VVBReviewRequest {
  contractId: string;
  approved: boolean;
  comments: string;
  rejectionReason?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 2
};

const STATUS_COLORS: Record<VVBStatus, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  DRAFT: 'default',
  FULLY_SIGNED: 'warning',
  VVB_REVIEW: 'info',
  VVB_APPROVED: 'success',
  VVB_REJECTED: 'error',
  ACTIVE: 'success'
};

const STATUS_ICONS: Record<VVBStatus, React.ReactNode> = {
  DRAFT: <Assignment />,
  FULLY_SIGNED: <CheckCircle />,
  VVB_REVIEW: <HourglassEmpty />,
  VVB_APPROVED: <VerifiedUser />,
  VVB_REJECTED: <Cancel />,
  ACTIVE: <VerifiedUser />
};

const WORKFLOW_STEPS = ['Fully Signed', 'VVB Review', 'VVB Decision', 'Active'];

// ============================================================================
// MOCK DATA (for development - replace with API calls)
// ============================================================================

const MOCK_PENDING_VERIFICATIONS: VVBVerificationRecord[] = [
  {
    id: 'vvb-001',
    contractId: 'contract-001',
    contractName: 'Carbon Credit Purchase Agreement',
    status: 'VVB_REVIEW',
    submittedBy: 'alice@company.com',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    parties: ['Company A', 'Company B'],
    value: 250000,
    type: 'ricardian'
  },
  {
    id: 'vvb-002',
    contractId: 'contract-002',
    contractName: 'Supply Chain Agreement',
    status: 'VVB_REVIEW',
    submittedBy: 'bob@company.com',
    submittedAt: new Date(Date.now() - 172800000).toISOString(),
    parties: ['Supplier X', 'Retailer Y'],
    value: 500000,
    type: 'smart'
  },
  {
    id: 'vvb-003',
    contractId: 'contract-003',
    contractName: 'Token Vesting Agreement',
    status: 'FULLY_SIGNED',
    submittedBy: 'carol@company.com',
    submittedAt: new Date(Date.now() - 259200000).toISOString(),
    parties: ['StartupCo', 'Investor Group'],
    value: 1000000,
    type: 'hybrid'
  }
];

const MOCK_HISTORY: VVBHistoryEntry[] = [
  {
    id: 'hist-001',
    action: 'VVB_APPROVED',
    actor: 'vvb-reviewer@auditor.com',
    timestamp: new Date(Date.now() - 604800000).toISOString(),
    details: 'Contract meets all compliance requirements',
    oldStatus: 'VVB_REVIEW',
    newStatus: 'VVB_APPROVED'
  },
  {
    id: 'hist-002',
    action: 'VVB_REJECTED',
    actor: 'vvb-reviewer@auditor.com',
    timestamp: new Date(Date.now() - 1209600000).toISOString(),
    details: 'Missing required documentation',
    oldStatus: 'VVB_REVIEW',
    newStatus: 'VVB_REJECTED'
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

export const VVBVerification: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data state
  const [pendingVerifications, setPendingVerifications] = useState<VVBVerificationRecord[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VVBHistoryEntry[]>([]);
  const [selectedContract, setSelectedContract] = useState<VVBVerificationRecord | null>(null);

  // Dialog state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Form state
  const [submitNotes, setSubmitNotes] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [contractIdToSubmit, setContractIdToSubmit] = useState('');

  // Current user role - in production, get from auth context
  const [isVVBUser] = useState(true); // Toggle for demo purposes

  // ============================================================================
  // API CALLS
  // ============================================================================

  const fetchPendingVerifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // API call: GET /api/v12/vvb/pending
      // For now, use mock data
      // const response = await apiService.getVVBPending();
      // setPendingVerifications(response.verifications || []);

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      setPendingVerifications(MOCK_PENDING_VERIFICATIONS);
    } catch (err) {
      setError('Failed to fetch pending verifications');
      console.error('Error fetching pending verifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVerificationHistory = useCallback(async () => {
    setLoading(true);
    try {
      // API call: GET /api/v12/vvb/history
      // const response = await apiService.getVVBHistory();
      // setVerificationHistory(response.history || []);

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      setVerificationHistory(MOCK_HISTORY);
    } catch (err) {
      console.error('Error fetching verification history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContractVVBStatus = useCallback(async (contractId: string) => {
    try {
      // API call: GET /api/v12/vvb/contract/{contractId}/status
      // const response = await apiService.getVVBContractStatus(contractId);
      // return response;

      // Mock implementation
      const contract = MOCK_PENDING_VERIFICATIONS.find(v => v.contractId === contractId);
      return contract || null;
    } catch (err) {
      console.error('Error fetching contract VVB status:', err);
      return null;
    }
  }, []);

  const submitForVVBReview = useCallback(async (request: VVBSubmitRequest) => {
    setLoading(true);
    setError(null);
    try {
      // API call: POST /api/v12/vvb/contract/{contractId}/submit
      // const response = await apiService.submitForVVBReview(request);

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 800));

      // Simulate success
      setSuccess(`Contract ${request.contractId} submitted for VVB review`);
      setSubmitDialogOpen(false);
      setSubmitNotes('');
      setContractIdToSubmit('');

      // Refresh list
      fetchPendingVerifications();
    } catch (err) {
      setError('Failed to submit contract for VVB review');
      console.error('Error submitting for VVB review:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchPendingVerifications]);

  const reviewContract = useCallback(async (request: VVBReviewRequest) => {
    setLoading(true);
    setError(null);
    try {
      // API call: POST /api/v12/vvb/contract/{contractId}/review
      // const response = await apiService.reviewVVBContract(request);

      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 800));

      const action = request.approved ? 'approved' : 'rejected';
      setSuccess(`Contract ${request.contractId} has been ${action}`);
      setReviewDialogOpen(false);
      setReviewComments('');
      setRejectionReason('');
      setSelectedContract(null);

      // Refresh list
      fetchPendingVerifications();
    } catch (err) {
      setError(`Failed to ${request.approved ? 'approve' : 'reject'} contract`);
      console.error('Error reviewing contract:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchPendingVerifications]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    fetchPendingVerifications();
    fetchVerificationHistory();
  }, [fetchPendingVerifications, fetchVerificationHistory]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmitForReview = () => {
    if (!contractIdToSubmit.trim()) {
      setError('Please enter a contract ID');
      return;
    }
    submitForVVBReview({
      contractId: contractIdToSubmit,
      notes: submitNotes
    });
  };

  const handleApprove = () => {
    if (!selectedContract) return;
    reviewContract({
      contractId: selectedContract.contractId,
      approved: true,
      comments: reviewComments
    });
  };

  const handleReject = () => {
    if (!selectedContract) return;
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }
    reviewContract({
      contractId: selectedContract.contractId,
      approved: false,
      comments: reviewComments,
      rejectionReason
    });
  };

  const handleViewDetails = async (verification: VVBVerificationRecord) => {
    // Fetch latest status for the contract
    const latestStatus = await fetchContractVVBStatus(verification.contractId);
    setSelectedContract(latestStatus || verification);
    setDetailsDialogOpen(true);
  };

  const handleOpenReview = (verification: VVBVerificationRecord) => {
    setSelectedContract(verification);
    setReviewDialogOpen(true);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getActiveStep = (status: VVBStatus): number => {
    switch (status) {
      case 'FULLY_SIGNED': return 0;
      case 'VVB_REVIEW': return 1;
      case 'VVB_APPROVED':
      case 'VVB_REJECTED': return 2;
      case 'ACTIVE': return 3;
      default: return 0;
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: VVBStatus): string => {
    switch (status) {
      case 'FULLY_SIGNED': return 'Awaiting VVB Review';
      case 'VVB_REVIEW': return 'Under VVB Review';
      case 'VVB_APPROVED': return 'VVB Approved';
      case 'VVB_REJECTED': return 'VVB Rejected';
      case 'ACTIVE': return 'Active';
      default: return status;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: '#fff' }}>
          VVB Verification Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchPendingVerifications}
            disabled={loading}
            sx={{ color: '#00BFA5', borderColor: '#00BFA5' }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => setSubmitDialogOpen(true)}
            sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00A890' } }}
          >
            Submit for VVB Review
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
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

      {/* Loading */}
      {loading && <LinearProgress sx={{ mb: 2, bgcolor: 'rgba(0, 191, 165, 0.2)' }} />}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255, 152, 0, 0.2)', width: 50, height: 50 }}>
                  <HourglassEmpty sx={{ color: '#FF9800' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                    {pendingVerifications.filter(v => v.status === 'VVB_REVIEW').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Pending Review
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.2)', width: 50, height: 50 }}>
                  <CheckCircle sx={{ color: '#4CAF50' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                    {pendingVerifications.filter(v => v.status === 'FULLY_SIGNED').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Awaiting Submission
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.2)', width: 50, height: 50 }}>
                  <VerifiedUser sx={{ color: '#2196F3' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                    {verificationHistory.filter(h => h.action === 'VVB_APPROVED').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Approved (30d)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(244, 67, 54, 0.2)', width: 50, height: 50 }}>
                  <Cancel sx={{ color: '#F44336' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
                    {verificationHistory.filter(h => h.action === 'VVB_REJECTED').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Rejected (30d)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Card */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
                '& .Mui-selected': { color: '#00BFA5' },
                '& .MuiTabs-indicator': { bgcolor: '#00BFA5' }
              }}
            >
              <Tab label="Pending Verifications" />
              <Tab label="Verification History" />
              {isVVBUser && <Tab label="VVB Review Queue" />}
            </Tabs>
            <Button
              variant="text"
              startIcon={<History />}
              onClick={() => setHistoryDialogOpen(true)}
              sx={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Full History
            </Button>
          </Box>

          {/* Tab 0: Pending Verifications */}
          {activeTab === 0 && (
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Contract</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Type</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Parties</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Value</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Status</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Submitted</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingVerifications.map((verification) => (
                    <TableRow key={verification.id}>
                      <TableCell sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {verification.contractName}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Chip
                          label={verification.type}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(0, 191, 165, 0.2)',
                            color: '#00BFA5'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {verification.parties.join(', ')}
                      </TableCell>
                      <TableCell sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}>
                        ${verification.value.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Chip
                          icon={STATUS_ICONS[verification.status] as React.ReactElement}
                          label={getStatusLabel(verification.status)}
                          color={STATUS_COLORS[verification.status]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {formatDate(verification.submittedAt)}
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(verification)}
                            sx={{ color: '#00BFA5' }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {isVVBUser && verification.status === 'VVB_REVIEW' && (
                          <Tooltip title="Review">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenReview(verification)}
                              sx={{ color: '#FF9800' }}
                            >
                              <Assignment />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pendingVerifications.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ color: 'rgba(255,255,255,0.5)', py: 4 }}>
                        No pending verifications
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Tab 1: Verification History */}
          {activeTab === 1 && (
            <List sx={{ bgcolor: 'transparent' }}>
              {verificationHistory.map((entry) => (
                <ListItem
                  key={entry.id}
                  sx={{
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    '&:last-child': { borderBottom: 'none' }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{
                      bgcolor: entry.action === 'VVB_APPROVED'
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(244, 67, 54, 0.2)'
                    }}>
                      {entry.action === 'VVB_APPROVED' ? (
                        <ThumbUp sx={{ color: '#4CAF50' }} />
                      ) : (
                        <ThumbDown sx={{ color: '#F44336' }} />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ color: '#fff' }}>
                        Contract {entry.action === 'VVB_APPROVED' ? 'Approved' : 'Rejected'}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          {entry.details}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          By {entry.actor} - {formatDate(entry.timestamp)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Chip
                      label={`${entry.oldStatus} -> ${entry.newStatus}`}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              {verificationHistory.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No verification history"
                    sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}
                  />
                </ListItem>
              )}
            </List>
          )}

          {/* Tab 2: VVB Review Queue (VVB Users Only) */}
          {activeTab === 2 && isVVBUser && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                As a VVB reviewer, you can approve or reject contracts awaiting verification.
              </Alert>
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Contract</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Submitted By</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Value</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Days Pending</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingVerifications
                      .filter(v => v.status === 'VVB_REVIEW')
                      .map((verification) => {
                        const daysPending = Math.floor(
                          (Date.now() - new Date(verification.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        return (
                          <TableRow key={verification.id}>
                            <TableCell sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}>
                              {verification.contractName}
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.1)' }}>
                              {verification.submittedBy}
                            </TableCell>
                            <TableCell sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.1)' }}>
                              ${verification.value.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                              <Chip
                                label={`${daysPending} days`}
                                size="small"
                                color={daysPending > 3 ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => {
                                  setSelectedContract(verification);
                                  setReviewDialogOpen(true);
                                }}
                                sx={{ mr: 1 }}
                              >
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Submit for VVB Review Dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={() => setSubmitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F3A', color: '#fff' } }}
      >
        <DialogTitle>Submit Contract for VVB Review</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
            Submit a fully signed contract for Validation/Verification Body (VVB) review.
          </Typography>
          <TextField
            fullWidth
            label="Contract ID"
            value={contractIdToSubmit}
            onChange={(e) => setContractIdToSubmit(e.target.value)}
            margin="normal"
            placeholder="e.g., contract-001"
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            InputProps={{ sx: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            label="Notes (Optional)"
            value={submitNotes}
            onChange={(e) => setSubmitNotes(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            placeholder="Add any notes for the VVB reviewer..."
            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
            InputProps={{ sx: { color: '#fff' } }}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            Once submitted, the contract will enter VVB_REVIEW status and await approval.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitForReview}
            disabled={loading || !contractIdToSubmit.trim()}
            sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00A890' } }}
          >
            Submit for Review
          </Button>
        </DialogActions>
      </Dialog>

      {/* VVB Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F3A', color: '#fff' } }}
      >
        <DialogTitle>VVB Review: {selectedContract?.contractName}</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box>
              {/* Workflow Stepper */}
              <Stepper activeStep={getActiveStep(selectedContract.status)} sx={{ mb: 3, mt: 2 }}>
                {WORKFLOW_STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel
                      StepIconProps={{
                        sx: { color: '#00BFA5', '&.Mui-active': { color: '#00BFA5' } }
                      }}
                    >
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{label}</Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

              {/* Contract Details */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Contract ID
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>{selectedContract.contractId}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Type
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>{selectedContract.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Parties
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>{selectedContract.parties.join(', ')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Value
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>${selectedContract.value.toLocaleString()}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

              {/* Review Form */}
              <TextField
                fullWidth
                label="Review Comments"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                margin="normal"
                multiline
                rows={3}
                placeholder="Enter your review comments..."
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
              <TextField
                fullWidth
                label="Rejection Reason (required if rejecting)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                margin="normal"
                multiline
                rows={2}
                placeholder="If rejecting, explain why..."
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setReviewDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={handleReject}
            disabled={loading}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            onClick={handleApprove}
            disabled={loading}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contract Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F3A', color: '#fff' } }}
      >
        <DialogTitle>Contract Details</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box>
              {/* Workflow Stepper */}
              <Stepper activeStep={getActiveStep(selectedContract.status)} sx={{ mb: 3, mt: 2 }}>
                {WORKFLOW_STEPS.map((label) => (
                  <Step key={label}>
                    <StepLabel
                      StepIconProps={{
                        sx: { color: '#00BFA5', '&.Mui-active': { color: '#00BFA5' } }
                      }}
                    >
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{label}</Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Contract Name
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>{selectedContract.contractName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Contract ID
                  </Typography>
                  <Typography sx={{ color: '#fff', fontFamily: 'monospace' }}>
                    {selectedContract.contractId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Type
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>{selectedContract.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Status
                  </Typography>
                  <Box>
                    <Chip
                      icon={STATUS_ICONS[selectedContract.status] as React.ReactElement}
                      label={getStatusLabel(selectedContract.status)}
                      color={STATUS_COLORS[selectedContract.status]}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Parties
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>{selectedContract.parties.join(', ')}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Value
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>${selectedContract.value.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Submitted By
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>{selectedContract.submittedBy}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Submitted At
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>{formatDate(selectedContract.submittedAt)}</Typography>
                </Grid>
                {selectedContract.vvbReviewer && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        VVB Reviewer
                      </Typography>
                      <Typography sx={{ color: '#fff' }}>{selectedContract.vvbReviewer}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Reviewed At
                      </Typography>
                      <Typography sx={{ color: '#fff' }}>
                        {selectedContract.reviewedAt ? formatDate(selectedContract.reviewedAt) : '-'}
                      </Typography>
                    </Grid>
                  </>
                )}
                {selectedContract.rejectionReason && (
                  <Grid item xs={12}>
                    <Alert severity="error" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Rejection Reason:</Typography>
                      {selectedContract.rejectionReason}
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)} sx={{ color: '#00BFA5' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Full History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F3A', color: '#fff' } }}
      >
        <DialogTitle>Full Verification History</DialogTitle>
        <DialogContent>
          <List>
            {verificationHistory.map((entry) => (
              <ListItem
                key={entry.id}
                sx={{
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  '&:last-child': { borderBottom: 'none' }
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{
                    bgcolor: entry.action === 'VVB_APPROVED'
                      ? 'rgba(76, 175, 80, 0.2)'
                      : 'rgba(244, 67, 54, 0.2)'
                  }}>
                    {entry.action === 'VVB_APPROVED' ? (
                      <ThumbUp sx={{ color: '#4CAF50' }} />
                    ) : (
                      <ThumbDown sx={{ color: '#F44336' }} />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography sx={{ color: '#fff' }}>
                      Contract {entry.action === 'VVB_APPROVED' ? 'Approved' : 'Rejected'}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        {entry.details}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        By {entry.actor} - {formatDate(entry.timestamp)}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={`${entry.oldStatus} -> ${entry.newStatus}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)} sx={{ color: '#00BFA5' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VVBVerification;

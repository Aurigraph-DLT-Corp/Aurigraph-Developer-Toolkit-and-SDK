import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
} from '@mui/material';
import {
  CheckCircle as VerifiedIcon,
  Cancel as RejectedIcon,
  HourglassEmpty as PendingIcon,
  Schedule as ExpiredIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Gavel as GavelIcon,
  Security as SecurityIcon,
  VerifiedUser as VerifiedUserIcon,
  AccountBalance as RegulatorIcon,
  Timeline as TimelineIcon,
  Lock as LockIcon,
} from '@mui/icons-material';

// Types
type SignatureRole = 'OWNER' | 'PARTY' | 'WITNESS' | 'VVB' | 'REGULATOR';
type SignatureStatus = 'VERIFIED' | 'PENDING' | 'EXPIRED' | 'REJECTED';
type CollectionMode = 'SEQUENTIAL' | 'PARALLEL';

interface SignatureRequirement {
  id: string;
  role: SignatureRole;
  partyId: string;
  partyName: string;
  email: string;
  required: boolean;
  order?: number; // For sequential mode
}

interface Signature {
  id: string;
  partyId: string;
  partyName: string;
  role: SignatureRole;
  status: SignatureStatus;
  signedAt?: string;
  expiresAt?: string;
  signatureHash?: string;
  ipAddress?: string;
  verificationMethod?: string;
}

interface SignatureWorkflowStatus {
  contractId: string;
  contractName: string;
  collectionMode: CollectionMode;
  totalRequired: number;
  totalSigned: number;
  signatures: Signature[];
  currentStep?: number; // For sequential mode
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
}

interface Props {
  contractId: string;
  contractName?: string;
  onSignatureComplete?: (contractId: string) => void;
  readOnly?: boolean;
}

// Use window.location.origin for correct protocol detection (http vs https)
const getBaseUrl = () =>
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? window.location.origin
    : 'http://localhost:9003';
const API_BASE = `${getBaseUrl()}/api/v12/signatures`;

// Role configuration
const ROLE_CONFIG: Record<
  SignatureRole,
  { label: string; color: string; icon: React.ReactNode; description: string }
> = {
  OWNER: {
    label: 'Owner',
    color: '#1976d2',
    icon: <BusinessIcon />,
    description: 'Contract owner/initiator',
  },
  PARTY: {
    label: 'Party',
    color: '#9c27b0',
    icon: <PersonIcon />,
    description: 'Contract party/counterparty',
  },
  WITNESS: {
    label: 'Witness',
    color: '#ff9800',
    icon: <VerifiedUserIcon />,
    description: 'Independent witness',
  },
  VVB: {
    label: 'VVB',
    color: '#4caf50',
    icon: <SecurityIcon />,
    description: 'Validation/Verification Body',
  },
  REGULATOR: {
    label: 'Regulator',
    color: '#f44336',
    icon: <RegulatorIcon />,
    description: 'Regulatory authority',
  },
};

// Status configuration
const STATUS_CONFIG: Record<
  SignatureStatus,
  { label: string; color: 'success' | 'warning' | 'error' | 'default'; icon: React.ReactNode }
> = {
  VERIFIED: {
    label: 'Verified',
    color: 'success',
    icon: <VerifiedIcon sx={{ color: '#4caf50' }} />,
  },
  PENDING: {
    label: 'Pending',
    color: 'warning',
    icon: <PendingIcon sx={{ color: '#ff9800' }} />,
  },
  EXPIRED: {
    label: 'Expired',
    color: 'error',
    icon: <ExpiredIcon sx={{ color: '#f44336' }} />,
  },
  REJECTED: {
    label: 'Rejected',
    color: 'error',
    icon: <RejectedIcon sx={{ color: '#f44336' }} />,
  },
};

const SignatureWorkflow: React.FC<Props> = ({
  contractId,
  contractName,
  onSignatureComplete,
  readOnly = false,
}) => {
  const [workflowStatus, setWorkflowStatus] = useState<SignatureWorkflowStatus | null>(null);
  const [requirements, setRequirements] = useState<SignatureRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingSignature, setRequestingSignature] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState<Signature | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  // Fetch workflow status
  const fetchWorkflowStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/contract/${contractId}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch workflow status');
      }
      const data = await response.json();
      setWorkflowStatus(data);

      // Check if all signatures are complete
      if (data.status === 'COMPLETED' && onSignatureComplete) {
        onSignatureComplete(contractId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching status');
    }
  }, [contractId, onSignatureComplete]);

  // Fetch signature requirements
  const fetchRequirements = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/contract/${contractId}/requirements`);
      if (!response.ok) {
        throw new Error('Failed to fetch signature requirements');
      }
      const data = await response.json();
      setRequirements(data.requirements || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error fetching requirements');
    }
  }, [contractId]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchWorkflowStatus(), fetchRequirements()]);
      setLoading(false);
    };
    loadData();
  }, [fetchWorkflowStatus, fetchRequirements]);

  // Request signature from party
  const handleRequestSignature = async (partyId: string) => {
    setRequestingSignature(partyId);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/contract/${contractId}/request/${partyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: requestMessage || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request signature');
      }

      // Refresh status after request
      await fetchWorkflowStatus();
      setShowRequestDialog(false);
      setRequestMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request signature');
    } finally {
      setRequestingSignature(null);
    }
  };

  // Calculate progress
  const getProgress = (): number => {
    if (!workflowStatus) return 0;
    const { totalRequired, totalSigned } = workflowStatus;
    if (totalRequired === 0) return 0;
    return Math.round((totalSigned / totalRequired) * 100);
  };

  // Get signature for a requirement
  const getSignatureForRequirement = (requirement: SignatureRequirement): Signature | undefined => {
    return workflowStatus?.signatures.find((s) => s.partyId === requirement.partyId);
  };

  // Check if signature can be requested
  const canRequestSignature = (requirement: SignatureRequirement): boolean => {
    if (readOnly) return false;

    const signature = getSignatureForRequirement(requirement);
    if (signature?.status === 'VERIFIED') return false;

    // For sequential mode, check order
    if (workflowStatus?.collectionMode === 'SEQUENTIAL') {
      const currentStep = workflowStatus.currentStep || 1;
      return requirement.order === currentStep;
    }

    return true;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  // Render loading state
  if (loading) {
    return (
      <Card>
        <CardHeader title="Signature Workflow" />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error && !workflowStatus) {
    return (
      <Card>
        <CardHeader title="Signature Workflow" />
        <CardContent>
          <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GavelIcon />
              <Typography variant="h6">Signature Workflow</Typography>
            </Box>
          }
          subheader={contractName || workflowStatus?.contractName || `Contract: ${contractId}`}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={workflowStatus?.collectionMode === 'SEQUENTIAL' ? 'Sequential' : 'Parallel'}
                size="small"
                icon={workflowStatus?.collectionMode === 'SEQUENTIAL' ? <TimelineIcon /> : <LockIcon />}
                variant="outlined"
              />
              <Tooltip title="Refresh status">
                <IconButton onClick={fetchWorkflowStatus} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Progress Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Signature Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  {workflowStatus?.totalSigned || 0} of {workflowStatus?.totalRequired || 0} signatures
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  {getProgress()}%
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getProgress()}
              sx={{
                height: 12,
                borderRadius: 6,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 6,
                  backgroundColor: getProgress() === 100 ? '#4caf50' : '#1976d2',
                },
              }}
            />
          </Box>

          {/* Workflow Status */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="caption" color="textSecondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={workflowStatus?.status || 'Unknown'}
                      size="small"
                      color={
                        workflowStatus?.status === 'COMPLETED'
                          ? 'success'
                          : workflowStatus?.status === 'IN_PROGRESS'
                          ? 'primary'
                          : 'error'
                      }
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="caption" color="textSecondary">
                    Collection Mode
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {workflowStatus?.collectionMode === 'SEQUENTIAL' ? 'Sequential' : 'Parallel'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="caption" color="textSecondary">
                    Created
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {workflowStatus?.createdAt
                      ? new Date(workflowStatus.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5' }}>
                  <Typography variant="caption" color="textSecondary">
                    {workflowStatus?.collectionMode === 'SEQUENTIAL' ? 'Current Step' : 'Pending'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                    {workflowStatus?.collectionMode === 'SEQUENTIAL'
                      ? `Step ${workflowStatus.currentStep || 1} of ${workflowStatus.totalRequired}`
                      : `${(workflowStatus?.totalRequired || 0) - (workflowStatus?.totalSigned || 0)} remaining`}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Signature Requirements List */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Required Signatures
          </Typography>
          <List sx={{ bgcolor: 'background.paper' }}>
            {requirements.map((requirement, index) => {
              const signature = getSignatureForRequirement(requirement);
              const roleConfig = ROLE_CONFIG[requirement.role];
              const statusConfig = signature
                ? STATUS_CONFIG[signature.status]
                : STATUS_CONFIG.PENDING;

              return (
                <React.Fragment key={requirement.id}>
                  <ListItem
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { backgroundColor: 'action.hover' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          backgroundColor: signature?.status === 'VERIFIED' ? '#4caf50' : roleConfig.color,
                        }}
                      >
                        {signature?.status === 'VERIFIED' ? <VerifiedIcon /> : roleConfig.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {requirement.partyName}
                          </Typography>
                          <Chip
                            label={roleConfig.label}
                            size="small"
                            sx={{
                              backgroundColor: roleConfig.color,
                              color: 'white',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                          {requirement.required && (
                            <Chip label="Required" size="small" variant="outlined" sx={{ height: 20 }} />
                          )}
                          {workflowStatus?.collectionMode === 'SEQUENTIAL' && requirement.order && (
                            <Chip
                              label={`Step ${requirement.order}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" color="textSecondary">
                            {requirement.email}
                          </Typography>
                          {signature?.signedAt && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Signed: {formatTimestamp(signature.signedAt)}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          icon={statusConfig.icon as React.ReactElement}
                          label={statusConfig.label}
                          size="small"
                          color={statusConfig.color}
                          variant="outlined"
                        />
                        {signature?.status === 'VERIFIED' ? (
                          <Tooltip title="View signature details">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSignature(signature);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <VerifiedIcon color="success" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          canRequestSignature(requirement) && (
                            <Tooltip title="Request signature">
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={
                                  requestingSignature === requirement.partyId ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <SendIcon />
                                  )
                                }
                                disabled={requestingSignature === requirement.partyId}
                                onClick={() => {
                                  setSelectedSignature({
                                    id: '',
                                    partyId: requirement.partyId,
                                    partyName: requirement.partyName,
                                    role: requirement.role,
                                    status: 'PENDING',
                                  });
                                  setShowRequestDialog(true);
                                }}
                              >
                                Request
                              </Button>
                            </Tooltip>
                          )
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < requirements.length - 1 && <Box sx={{ height: 8 }} />}
                </React.Fragment>
              );
            })}
          </List>

          {/* Empty state */}
          {requirements.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="textSecondary">No signature requirements configured</Typography>
            </Box>
          )}

          {/* Completion Message */}
          {workflowStatus?.status === 'COMPLETED' && (
            <Alert severity="success" sx={{ mt: 3 }}>
              <AlertTitle>All Signatures Collected</AlertTitle>
              Contract signing workflow completed on {formatTimestamp(workflowStatus.completedAt)}.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Signature Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VerifiedIcon color="success" />
            Signature Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSignature && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">
                    Signer
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedSignature.partyName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">
                    Role
                  </Typography>
                  <Box>
                    <Chip
                      label={ROLE_CONFIG[selectedSignature.role].label}
                      size="small"
                      sx={{
                        backgroundColor: ROLE_CONFIG[selectedSignature.role].color,
                        color: 'white',
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">
                    Status
                  </Typography>
                  <Box>
                    <Chip
                      label={STATUS_CONFIG[selectedSignature.status].label}
                      size="small"
                      color={STATUS_CONFIG[selectedSignature.status].color}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">
                    Signed At
                  </Typography>
                  <Typography variant="body2">
                    {formatTimestamp(selectedSignature.signedAt)}
                  </Typography>
                </Grid>
                {selectedSignature.expiresAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Expires At
                    </Typography>
                    <Typography variant="body2">
                      {formatTimestamp(selectedSignature.expiresAt)}
                    </Typography>
                  </Grid>
                )}
                {selectedSignature.verificationMethod && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" color="textSecondary">
                      Verification Method
                    </Typography>
                    <Typography variant="body2">{selectedSignature.verificationMethod}</Typography>
                  </Grid>
                )}
              </Grid>

              {selectedSignature.signatureHash && (
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Signature Hash
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      fontSize: '0.75rem',
                      mt: 0.5,
                    }}
                  >
                    {selectedSignature.signatureHash}
                  </Typography>
                </Box>
              )}

              {selectedSignature.ipAddress && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    IP Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {selectedSignature.ipAddress}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Request Signature Dialog */}
      <Dialog open={showRequestDialog} onClose={() => setShowRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SendIcon color="primary" />
            Request Signature
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSignature && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Signature Request</AlertTitle>
                You are about to request a signature from{' '}
                <strong>{selectedSignature.partyName}</strong> ({ROLE_CONFIG[selectedSignature.role].label})
              </Alert>

              <TextField
                label="Optional Message"
                multiline
                rows={3}
                fullWidth
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Add a personalized message to include with the signature request..."
                variant="outlined"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRequestDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={
              requestingSignature ? <CircularProgress size={16} color="inherit" /> : <SendIcon />
            }
            disabled={!!requestingSignature}
            onClick={() => selectedSignature && handleRequestSignature(selectedSignature.partyId)}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SignatureWorkflow;

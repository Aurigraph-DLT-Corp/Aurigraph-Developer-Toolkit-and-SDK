import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle as VerifiedIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface VerificationStep {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  timestamp?: string;
}

interface MerkleProofPath {
  index: number;
  hash: string;
  sibling_hash: string;
  direction: string;
}

interface TokenTrace {
  trace_id: string;
  token_id: string;
  asset_id: string;
  asset_type: string;
  verification_status: 'PENDING' | 'IN_REVIEW' | 'VERIFIED' | 'REJECTED';
  proof_valid: boolean;
  asset_verified: boolean;
  merkle_proof_path: MerkleProofPath[];
  merkle_root_hash: string;
  last_verified_timestamp: string;
  next_verification_due: string;
  compliance_certifications: string[];
}

interface VerificationHistoryEntry {
  timestamp: string;
  status: 'VERIFIED' | 'FAILED' | 'IN_PROGRESS';
  details: string;
}

interface Props {
  tokenId?: string;
  tokenTrace?: TokenTrace;
  onVerify?: (tokenId: string) => void;
}

// Use window.location.origin for correct protocol detection (http vs https)
const getBaseUrl = () => typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : 'http://localhost:9003';
const API_BASE = `${getBaseUrl()}/api/v12/traceability`;

const TokenVerificationStatus: React.FC<Props> = ({ tokenId, tokenTrace, onVerify }) => {
  const [trace, setTrace] = useState<TokenTrace | null>(tokenTrace || null);
  const [loading, setLoading] = useState(!tokenTrace);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistoryEntry[]>([]);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);

  // Fetch token trace if tokenId provided
  useEffect(() => {
    if (tokenId && !tokenTrace) {
      fetchTokenTrace(tokenId);
    }
  }, [tokenId, tokenTrace]);

  // Initialize verification steps
  useEffect(() => {
    if (trace) {
      initializeVerificationSteps();
      loadVerificationHistory();
    }
  }, [trace]);

  const fetchTokenTrace = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/tokens/${id}`);
      if (!response.ok) throw new Error('Failed to fetch token trace');
      const data = await response.json();
      setTrace(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const initializeVerificationSteps = () => {
    if (!trace) return;

    const steps: VerificationStep[] = [
      {
        id: 1,
        name: 'Token Created',
        description: 'Token trace initialized and linked to asset',
        completed: trace.verification_status !== 'PENDING',
        timestamp: trace.token_creation_timestamp,
      },
      {
        id: 2,
        name: 'Asset Linked',
        description: 'Token linked to RWAT registry asset',
        completed: trace.verification_status !== 'PENDING' && trace.verification_status !== 'IN_REVIEW',
        timestamp: trace.last_verified_timestamp,
      },
      {
        id: 3,
        name: 'Merkle Proof Generated',
        description: 'Proof path generated from asset to merkle root',
        completed: trace.merkle_proof_path && trace.merkle_proof_path.length > 0,
        timestamp: trace.last_verified_timestamp,
      },
      {
        id: 4,
        name: 'Proof Validated',
        description: 'Merkle proof cryptographically verified',
        completed: trace.proof_valid,
        timestamp: trace.last_verified_timestamp,
      },
      {
        id: 5,
        name: 'Asset Verified',
        description: 'Asset backing confirmed and verified',
        completed: trace.asset_verified,
        timestamp: trace.last_verified_timestamp,
      },
    ];

    setVerificationSteps(steps);

    // Calculate progress
    const completedSteps = steps.filter(s => s.completed).length;
    setVerificationProgress((completedSteps / steps.length) * 100);
  };

  const loadVerificationHistory = () => {
    if (!trace || !trace.audit_trail) {
      setVerificationHistory([]);
      return;
    }

    const history = trace.audit_trail
      .filter(entry => entry.action === 'VERIFIED')
      .map(entry => ({
        timestamp: entry.timestamp,
        status: (entry.status === 'SUCCESS' ? 'VERIFIED' : 'FAILED') as 'VERIFIED' | 'FAILED' | 'IN_PROGRESS',
        details: entry.details,
      }))
      .slice(0, 10); // Last 10 verifications

    setVerificationHistory(history);
  };

  const handleVerify = async () => {
    if (!trace) return;

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/tokens/${trace.token_id}/verify-proof`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Verification failed');

      const result = await response.json();
      setTrace(prevTrace => ({
        ...prevTrace!,
        proof_valid: result.proof_valid,
        verification_status: result.verification_status,
        asset_verified: result.asset_verified,
        last_verified_timestamp: new Date().toISOString(),
      }));

      // Add to history
      setVerificationHistory(prev => [
        {
          timestamp: new Date().toISOString(),
          status: result.proof_valid ? 'VERIFIED' : 'FAILED',
          details: result.proof_valid ? 'Manual verification successful' : 'Manual verification failed',
        },
        ...prev,
      ]);

      if (onVerify) {
        onVerify(trace.token_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification error');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <VerifiedIcon sx={{ color: '#4caf50', fontSize: 24 }} />;
      case 'REJECTED':
        return <ErrorIcon sx={{ color: '#f44336', fontSize: 24 }} />;
      case 'IN_REVIEW':
        return <PendingIcon sx={{ color: '#ff9800', fontSize: 24 }} />;
      default:
        return <PendingIcon sx={{ color: '#9e9e9e', fontSize: 24 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return '#4caf50';
      case 'REJECTED':
        return '#f44336';
      case 'IN_REVIEW':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return 'Not yet';
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Token Verification Status" />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
            <Typography>Loading verification status...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!trace) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader title="Token Verification Status" />
        <CardContent>
          <Alert severity="warning">
            <AlertTitle>No Token Selected</AlertTitle>
            Please select a token to view verification status
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title={`Token Verification Status: ${trace.token_id}`}
          subheader={`Asset: ${trace.asset_id} (${trace.asset_type})`}
          action={
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleVerify}
              disabled={verifying}
              variant="outlined"
              size="small"
            >
              {verifying ? 'Verifying...' : 'Verify Now'}
            </Button>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Status Badge */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            {getStatusIcon(trace.verification_status)}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {trace.verification_status}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {trace.proof_valid ? 'Proof Valid' : 'Proof Invalid'}
              </Typography>
            </Box>
            <Chip
              label={trace.asset_verified ? 'Verified' : 'Not Verified'}
              color={trace.asset_verified ? 'success' : 'warning'}
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>

          {/* Progress */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">Verification Progress</Typography>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {Math.round(verificationProgress)}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={verificationProgress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          {/* Verification Steps */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Verification Steps
            </Typography>
            <Box sx={{ space: 1 }}>
              {verificationSteps.map((step, index) => (
                <Box key={step.id} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: step.completed ? '#4caf50' : '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {step.completed ? '✓' : step.id}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {step.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {step.description}
                      </Typography>
                    </Box>
                    {step.timestamp && (
                      <Typography variant="caption" sx={{ ml: 'auto', whiteSpace: 'nowrap' }}>
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </Typography>
                    )}
                  </Box>
                  {index < verificationSteps.length - 1 && (
                    <Box sx={{ ml: 12, height: 16, borderLeft: '2px solid #e0e0e0' }} />
                  )}
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Key Information */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Last Verified
              </Typography>
              <Typography variant="body2">{formatTimestamp(trace.last_verified_timestamp)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Next Verification Due
              </Typography>
              <Typography variant="body2">{formatTimestamp(trace.next_verification_due)}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Merkle Proof Nodes
              </Typography>
              <Typography variant="body2">{trace.merkle_proof_path?.length || 0} nodes</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="textSecondary">
                Certifications
              </Typography>
              <Typography variant="body2">{trace.compliance_certifications?.length || 0} certifications</Typography>
            </Grid>
          </Grid>

          {/* Merkle Root Hash */}
          <Box sx={{ mb: 3, p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="caption" color="textSecondary">
              Merkle Root Hash
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                mt: 0.5,
                fontSize: '0.75rem',
              }}
            >
              {trace.merkle_root_hash || 'N/A'}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setShowVerificationDetails(true)}
            >
              View Details
            </Button>
            {trace.merkle_proof_path && trace.merkle_proof_path.length > 0 && (
              <Button size="small" variant="outlined">
                View Proof Path
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Verification Details Dialog */}
      <Dialog
        open={showVerificationDetails}
        onClose={() => setShowVerificationDetails(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verification Details</DialogTitle>
        <DialogContent>
          {/* Verification Timeline */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Verification History
            </Typography>
            {verificationHistory.length > 0 ? (
              <List dense>
                {verificationHistory.map((entry, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor:
                                  entry.status === 'VERIFIED' ? '#4caf50' : entry.status === 'FAILED' ? '#f44336' : '#ff9800',
                              }}
                            />
                            {entry.status}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="caption" display="block">
                              {new Date(entry.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {entry.details}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    {index < verificationHistory.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Typography variant="caption" color="textSecondary">
                No verification history available
              </Typography>
            )}
          </Box>

          {/* Proof Validity Info */}
          <Alert severity={trace.proof_valid ? 'success' : 'warning'} sx={{ mb: 2 }}>
            <AlertTitle>Proof Validity</AlertTitle>
            {trace.proof_valid
              ? 'Merkle proof has been cryptographically validated'
              : 'Merkle proof validation failed or pending'}
          </Alert>

          {/* Asset Verification Info */}
          <Alert severity={trace.asset_verified ? 'success' : 'info'} sx={{ mb: 2 }}>
            <AlertTitle>Asset Status</AlertTitle>
            {trace.asset_verified ? 'Asset has been verified and linked to token' : 'Asset verification in progress'}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVerificationDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TokenVerificationStatus;

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Grid,
  Chip,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CopyToClipboard,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as VerifiedIcon,
  Error as ErrorIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExpandIcon,
} from '@mui/icons-material';

interface MerkleProofNode {
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
  verification_status: string;
  proof_valid: boolean;
  asset_verified: boolean;
  merkle_proof_path: MerkleProofNode[];
  merkle_root_hash: string;
  underlying_asset_hash: string;
  last_verified_timestamp: string;
}

interface Props {
  tokenId?: string;
  tokenTrace?: TokenTrace;
}

// Use window.location.origin for correct protocol detection (http vs https)
const getBaseUrl = () => typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : 'http://localhost:9003';
const API_BASE = `${getBaseUrl()}/api/v12/traceability`;

const MerkleProofViewer: React.FC<Props> = ({ tokenId, tokenTrace }) => {
  const [trace, setTrace] = useState<TokenTrace | null>(tokenTrace || null);
  const [loading, setLoading] = useState(!tokenTrace);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<MerkleProofNode | null>(null);
  const [expandedNode, setExpandedNode] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Fetch token trace if tokenId provided
  useEffect(() => {
    if (tokenId && !tokenTrace) {
      fetchTokenTrace(tokenId);
    }
  }, [tokenId, tokenTrace]);

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

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatHash = (hash: string, truncate: boolean = true) => {
    if (truncate && hash.length > 16) {
      return hash.substring(0, 8) + '...' + hash.substring(hash.length - 8);
    }
    return hash;
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'LEFT' ? '#2196f3' : '#ff9800';
  };

  const getDirectionLabel = (direction: string) => {
    return direction === 'LEFT' ? '↙ Left' : '↗ Right';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Merkle Proof Viewer" />
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <Typography>Loading merkle proof...</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!trace) {
    return (
      <Card>
        <CardHeader title="Merkle Proof Viewer" />
        <CardContent>
          <Alert severity="warning">
            <AlertTitle>No Token Selected</AlertTitle>
            Please select a token to view its merkle proof
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!trace.merkle_proof_path || trace.merkle_proof_path.length === 0) {
    return (
      <Card>
        <CardHeader title="Merkle Proof Viewer" />
        <CardContent>
          <Alert severity="info">
            <AlertTitle>No Proof Path</AlertTitle>
            This token does not have a merkle proof path yet. Verify the token to generate a proof.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const proofPath = trace.merkle_proof_path.sort((a, b) => a.index - b.index);

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={`Merkle Proof Path: ${trace.token_id}`}
        subheader={`${proofPath.length} nodes - Proof Valid: ${trace.proof_valid ? 'Yes' : 'No'}`}
      />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Proof Validity Alert */}
        <Alert
          severity={trace.proof_valid ? 'success' : 'warning'}
          icon={trace.proof_valid ? <VerifiedIcon /> : <ErrorIcon />}
          sx={{ mb: 3 }}
        >
          <AlertTitle>{trace.proof_valid ? 'Proof Valid' : 'Proof Invalid'}</AlertTitle>
          {trace.proof_valid
            ? 'Merkle proof has been cryptographically validated'
            : 'Proof validation failed or pending verification'}
        </Alert>

        {/* Hash Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Hash Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Underlying Asset Hash
                  </Typography>
                  <Tooltip title={copiedHash === trace.underlying_asset_hash ? 'Copied!' : 'Copy'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyHash(trace.underlying_asset_hash)}
                      sx={{ ml: 1 }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all',
                    display: 'block',
                  }}
                >
                  {trace.underlying_asset_hash}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" color="textSecondary">
                    Merkle Root Hash
                  </Typography>
                  <Tooltip title={copiedHash === trace.merkle_root_hash ? 'Copied!' : 'Copy'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopyHash(trace.merkle_root_hash)}
                      sx={{ ml: 1 }}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    wordBreak: 'break-all',
                    display: 'block',
                  }}
                >
                  {trace.merkle_root_hash}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Proof Path Visualization */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Proof Path Tree
          </Typography>

          {/* Visual Tree */}
          <Box sx={{ ml: 2, borderLeft: '2px solid #e0e0e0', pl: 2 }}>
            {/* Asset (Leaf) */}
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  backgroundColor: '#e8f5e9',
                  borderRadius: 1,
                  borderLeft: '3px solid #4caf50',
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#4caf50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  📄
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Asset (Leaf)
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'textSecondary' }}
                  >
                    {formatHash(trace.underlying_asset_hash, true)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ ml: 4, height: 20, borderLeft: '2px solid #ccc' }} />
            </Box>

            {/* Proof Nodes */}
            {proofPath.map((node, idx) => (
              <Box key={node.index} sx={{ mb: 3 }}>
                {/* Node */}
                <Box
                  onClick={() => setSelectedNode(node)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    backgroundColor: '#fff3e0',
                    borderRadius: 1,
                    borderLeft: `3px solid ${getDirectionColor(node.direction)}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: '#ffe0b2',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: getDirectionColor(node.direction),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {node.index}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Node {node.index}
                      </Typography>
                      <Chip label={getDirectionLabel(node.direction)} size="small" variant="outlined" />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ fontFamily: 'monospace', fontSize: '0.65rem', display: 'block' }}
                    >
                      {formatHash(node.hash, true)}
                    </Typography>
                  </Box>
                  <ExpandIcon fontSize="small" sx={{ opacity: 0.5 }} />
                </Box>

                {/* Connector */}
                {idx < proofPath.length - 1 && (
                  <Box sx={{ ml: 4, height: 20, borderLeft: '2px solid #ccc' }} />
                )}
              </Box>
            ))}

            {/* Root */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                backgroundColor: '#e3f2fd',
                borderRadius: 1,
                borderLeft: '3px solid #1976d2',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#1976d2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                🌳
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Merkle Root
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'textSecondary' }}
                >
                  {formatHash(trace.merkle_root_hash, true)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Detailed Table */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Proof Path Details
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Index</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Direction</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Hash</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sibling Hash</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proofPath.map(node => (
                  <TableRow key={node.index} hover>
                    <TableCell>{node.index}</TableCell>
                    <TableCell>
                      <Chip
                        label={getDirectionLabel(node.direction)}
                        size="small"
                        sx={{
                          backgroundColor: getDirectionColor(node.direction),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        {formatHash(node.hash, true)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        {formatHash(node.sibling_hash, true)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Copy hash">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyHash(node.hash)}
                          sx={{
                            opacity: copiedHash === node.hash ? 1 : 0.6,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedNode(node)}
                        >
                          <ExpandIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Statistics */}
        <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Total Nodes
              </Typography>
              <Typography variant="h6">{proofPath.length}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Left Nodes
              </Typography>
              <Typography variant="h6">{proofPath.filter(n => n.direction === 'LEFT').length}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Right Nodes
              </Typography>
              <Typography variant="h6">{proofPath.filter(n => n.direction === 'RIGHT').length}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="textSecondary">
                Tree Depth
              </Typography>
              <Typography variant="h6">{Math.ceil(Math.log2(proofPath.length))}</Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>

      {/* Node Details Dialog */}
      <Dialog
        open={!!selectedNode}
        onClose={() => setSelectedNode(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedNode && (
          <>
            <DialogTitle>Node {selectedNode.index} Details</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2, space: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Direction
                  </Typography>
                  <Chip
                    label={getDirectionLabel(selectedNode.direction)}
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      backgroundColor: getDirectionColor(selectedNode.direction),
                      color: 'white',
                    }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Node Hash
                  </Typography>
                  <Paper sx={{ p: 1.5, backgroundColor: '#f5f5f5', mt: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          wordBreak: 'break-all',
                          flex: 1,
                        }}
                      >
                        {selectedNode.hash}
                      </Typography>
                      <Tooltip title={copiedHash === selectedNode.hash ? 'Copied!' : 'Copy'}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyHash(selectedNode.hash)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="textSecondary">
                    Sibling Hash
                  </Typography>
                  <Paper sx={{ p: 1.5, backgroundColor: '#f5f5f5', mt: 0.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          wordBreak: 'break-all',
                          flex: 1,
                        }}
                      >
                        {selectedNode.sibling_hash}
                      </Typography>
                      <Tooltip title={copiedHash === selectedNode.sibling_hash ? 'Copied!' : 'Copy'}>
                        <IconButton
                          size="small"
                          onClick={() => handleCopyHash(selectedNode.sibling_hash)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </Box>

                <Alert severity="info">
                  <AlertTitle>How It Works</AlertTitle>
                  During proof validation, this node is combined with its sibling hash following the {' '}
                  <strong>{selectedNode.direction}</strong> direction to compute the parent node's hash in the merkle tree.
                </Alert>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedNode(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Card>
  );
};

export default MerkleProofViewer;

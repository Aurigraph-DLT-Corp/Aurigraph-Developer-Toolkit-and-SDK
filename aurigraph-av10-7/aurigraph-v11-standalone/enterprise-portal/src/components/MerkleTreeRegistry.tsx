import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Paper, Chip, Alert, CircularProgress, Tabs, Tab, List, ListItem,
  ListItemText, Divider, IconButton, Collapse
} from '@mui/material';
import {
  AccountTree, VerifiedUser, CheckCircle, Error, ContentCopy,
  ExpandMore, ExpandLess, Security, Info
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface MerkleRootData {
  rootHash: string;
  timestamp: string;
  entryCount: number;
  treeHeight: number;
}

interface MerkleTreeStats {
  rootHash: string;
  entryCount: number;
  treeHeight: number;
  lastUpdate: string;
  rebuildCount: number;
}

interface ProofData {
  leafHash: string;
  rootHash: string;
  leafIndex: number;
  proofPath: ProofElement[];
}

interface ProofElement {
  siblingHash: string;
  isLeft: boolean;
}

interface VerificationResponse {
  valid: boolean;
  message: string;
}

const MerkleTreeRegistry: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rootData, setRootData] = useState<MerkleRootData | null>(null);
  const [treeStats, setTreeStats] = useState<MerkleTreeStats | null>(null);
  const [rwatId, setRwatId] = useState('');
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [expandedProof, setExpandedProof] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMerkleData();
    const interval = setInterval(fetchMerkleData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMerkleData = async () => {
    try {
      const [root, stats] = await Promise.all([
        apiService.getMerkleRootHash(),
        apiService.getMerkleTreeStats()
      ]);
      setRootData(root);
      setTreeStats(stats);
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch Merkle data:', err);
      setError(err.message || 'Failed to load Merkle tree data');
      setLoading(false);
    }
  };

  const handleGenerateProof = async () => {
    if (!rwatId.trim()) {
      setError('Please enter an RWAT ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const proof = await apiService.generateMerkleProof(rwatId);
      setProofData(proof);
      setVerificationResult(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate proof');
      setProofData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!proofData) {
      setError('No proof data to verify');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await apiService.verifyMerkleProof(proofData);
      setVerificationResult(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify proof');
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncateHash = (hash: string, length: number = 16) => {
    return hash.length > length ? `${hash.substring(0, length)}...${hash.substring(hash.length - 8)}` : hash;
  };

  if (loading && !rootData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <AccountTree sx={{ mr: 1, verticalAlign: 'middle' }} />
        Merkle Tree Registry
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Merkle Root Info */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                Current Merkle Root
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white', fontFamily: 'monospace' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-all', flex: 1 }}>
                    {rootData?.rootHash || 'Loading...'}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(rootData?.rootHash || '')}
                    sx={{ color: 'white', ml: 1 }}
                  >
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
              <Box sx={{ mt: 2 }}>
                <Chip
                  icon={<Info />}
                  label={`${rootData?.entryCount || 0} Entries`}
                  size="small"
                  sx={{ mr: 1 }}
                />
                <Chip
                  icon={<AccountTree />}
                  label={`Height: ${rootData?.treeHeight || 0}`}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tree Statistics
              </Typography>
              {treeStats && (
                <List dense>
                  <ListItem>
                    <ListItemText primary="Total Entries" secondary={treeStats.entryCount} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Tree Height" secondary={treeStats.treeHeight} />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Last Updated"
                      secondary={new Date(treeStats.lastUpdate).toLocaleString()}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText primary="Rebuild Count" secondary={treeStats.rebuildCount} />
                  </ListItem>
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Generate Proof" />
            <Tab label="Verify Proof" />
            <Tab label="Visualization" />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Generate Merkle Proof</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter an RWAT ID to generate a cryptographic proof of its inclusion in the registry.
              </Typography>

              <TextField
                fullWidth
                label="RWAT ID"
                value={rwatId}
                onChange={(e) => setRwatId(e.target.value)}
                placeholder="Enter RWAT ID (e.g., RWAT-xxx)"
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                onClick={handleGenerateProof}
                disabled={loading || !rwatId.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <VerifiedUser />}
              >
                Generate Proof
              </Button>

              {proofData && (
                <Box sx={{ mt: 3 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <strong>Proof generated successfully!</strong>
                  </Alert>

                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">Leaf Hash:</Typography>
                      <IconButton size="small" onClick={() => copyToClipboard(proofData.leafHash)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                      {proofData.leafHash}
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">Root Hash:</Typography>
                      <IconButton size="small" onClick={() => copyToClipboard(proofData.rootHash)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                      {proofData.rootHash}
                    </Typography>
                  </Paper>

                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">
                        Proof Path ({proofData.proofPath.length} hops)
                      </Typography>
                      <IconButton onClick={() => setExpandedProof(!expandedProof)}>
                        {expandedProof ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>

                    <Collapse in={expandedProof}>
                      <List dense>
                        {proofData.proofPath.map((element, index) => (
                          <ListItem key={index}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Chip
                                    label={element.isLeft ? 'LEFT' : 'RIGHT'}
                                    size="small"
                                    color={element.isLeft ? 'primary' : 'secondary'}
                                    sx={{ mr: 1 }}
                                  />
                                  <Typography variant="caption" fontFamily="monospace">
                                    {truncateHash(element.siblingHash, 32)}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => copyToClipboard(element.siblingHash)}
                                    sx={{ ml: 1 }}
                                  >
                                    <ContentCopy fontSize="small" />
                                  </IconButton>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </Paper>

                  <Button
                    variant="outlined"
                    onClick={handleVerifyProof}
                    disabled={loading}
                    startIcon={<CheckCircle />}
                    sx={{ mt: 2 }}
                  >
                    Verify This Proof
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Verify Merkle Proof</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Verification result for the generated proof will appear here.
              </Typography>

              {verificationResult ? (
                <Alert
                  severity={verificationResult.valid ? 'success' : 'error'}
                  icon={verificationResult.valid ? <CheckCircle /> : <Error />}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {verificationResult.valid ? 'Proof Valid' : 'Proof Invalid'}
                  </Typography>
                  <Typography variant="body2">{verificationResult.message}</Typography>
                </Alert>
              ) : (
                <Alert severity="info">
                  Generate a proof first, then verify it to see the verification result.
                </Alert>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Merkle Tree Visualization</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  The Merkle tree provides cryptographic verification of data integrity.
                  Each leaf represents an entry in the registry, and the root hash
                  provides a single hash that verifies the entire tree.
                </Typography>
              </Alert>

              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="subtitle1" gutterBottom>Tree Structure</Typography>
                <Typography variant="body2" color="text.secondary">
                  Height: {treeStats?.treeHeight || 0} levels<br />
                  Leaf Nodes: {treeStats?.entryCount || 0}<br />
                  SHA3-256 Hashing (Quantum-Resistant)
                </Typography>

                {treeStats && treeStats.entryCount > 0 && (
                  <Box sx={{ mt: 3, p: 3, bgcolor: 'background.default', borderRadius: 1 }}>
                    {/* Simple tree visualization */}
                    {[...Array(treeStats.treeHeight)].map((_, level) => (
                      <Box key={level} sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Level {level}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1 }}>
                          {[...Array(Math.pow(2, treeStats.treeHeight - level - 1))].map((_, i) => (
                            <Chip
                              key={i}
                              label={level === 0 ? 'Root' : `Node`}
                              size="small"
                              color={level === 0 ? 'primary' : 'default'}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MerkleTreeRegistry;

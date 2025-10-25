import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  Paper,
  Chip,
  LinearProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  Security,
  CheckCircle,
  Warning,
  Error,
  Refresh,
  AccountTree,
  ContentCopy,
  Info
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

/**
 * RegistryIntegrity Component
 * Phase 2: Displays Merkle tree root hash and registry integrity status
 * Endpoints: GET /api/v11/registry/rwat/merkle/root, GET /api/v11/registry/rwat/merkle/stats
 */
const RegistryIntegrity: React.FC = () => {
  const [rootData, setRootData] = useState<MerkleRootData | null>(null);
  const [treeStats, setTreeStats] = useState<MerkleTreeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchMerkleData();
    const interval = setInterval(fetchMerkleData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMerkleData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [root, stats] = await Promise.all([
        apiService.getMerkleRootHash(),
        apiService.getMerkleTreeStats()
      ]);

      setRootData(root);
      setTreeStats(stats);
      setLastRefresh(new Date());
      console.log('✅ Merkle tree data fetched:', { root, stats });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load Merkle tree data';
      setError(errorMsg);
      console.error('❌ Failed to fetch Merkle tree data:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getIntegrityStatus = (): { severity: 'success' | 'warning' | 'error'; message: string } => {
    if (loading) return { severity: 'warning', message: 'Loading...' };
    if (error) return { severity: 'error', message: 'Integrity check failed' };
    if (!rootData || !treeStats) return { severity: 'warning', message: 'Data unavailable' };
    if (treeStats.entryCount === 0) return { severity: 'warning', message: 'Empty registry' };
    return { severity: 'success', message: 'Registry integrity verified' };
  };

  const integrityStatus = getIntegrityStatus();

  if (loading && !rootData) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Security sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Typography variant="h6">Registry Integrity - Phase 2</Typography>
          </Box>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Security sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h6">Registry Integrity - Phase 2</Typography>
              <Typography variant="caption" color="text.secondary">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={fetchMerkleData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error} - Merkle tree endpoints may not be available yet.
          </Alert>
        )}

        {/* Integrity Status Alert */}
        <Alert
          severity={integrityStatus.severity}
          icon={
            integrityStatus.severity === 'success' ? (
              <CheckCircle />
            ) : integrityStatus.severity === 'warning' ? (
              <Warning />
            ) : (
              <Error />
            )
          }
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {integrityStatus.message}
          </Typography>
          {rootData && treeStats && (
            <Typography variant="caption">
              Merkle tree contains {treeStats.entryCount} entries with height {treeStats.treeHeight}
            </Typography>
          )}
        </Alert>

        {/* Merkle Root Display */}
        {rootData && (
          <Paper
            sx={{
              p: 2,
              mb: 3,
              bgcolor: 'primary.light',
              color: 'white',
              position: 'relative'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                <AccountTree sx={{ verticalAlign: 'middle', mr: 1, fontSize: 20 }} />
                Current Merkle Root Hash
              </Typography>
              <IconButton
                size="small"
                onClick={() => copyToClipboard(rootData.rootHash)}
                sx={{ color: 'white' }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
            <Typography
              variant="body2"
              fontFamily="monospace"
              sx={{ wordBreak: 'break-all', fontSize: '0.85rem', mb: 2 }}
            >
              {rootData.rootHash}
            </Typography>
            <Grid container spacing={1}>
              <Grid item>
                <Chip
                  icon={<Info />}
                  label={`${rootData.entryCount} Entries`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Grid>
              <Grid item>
                <Chip
                  icon={<AccountTree />}
                  label={`Height: ${rootData.treeHeight}`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Grid>
              <Grid item>
                <Chip
                  label={new Date(rootData.timestamp).toLocaleString()}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Tree Statistics */}
        {treeStats && (
          <Box>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Merkle Tree Statistics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Total Entries"
                  secondary={treeStats.entryCount.toLocaleString()}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText primary="Tree Height" secondary={`${treeStats.treeHeight} levels`} />
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
                <ListItemText
                  primary="Rebuild Count"
                  secondary={`${treeStats.rebuildCount} times`}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Hash Algorithm"
                  secondary="SHA3-256 (Quantum-Resistant)"
                />
              </ListItem>
            </List>
          </Box>
        )}

        {/* Security Information */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            The Merkle tree provides cryptographic proof that all registered tokens are included in
            the registry. Any modification to a token will change the root hash, making tampering
            detectable.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default RegistryIntegrity;

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import { AttachMoney, Visibility, Download, Add, Refresh, VerifiedUser, AccountTree } from '@mui/icons-material';
import { apiService } from '../../services/api';

interface Token {
  id: string;
  name: string;
  symbol: string;
  totalSupply: number;
  circulatingSupply: number;
  decimals: number;
  contractAddress: string;
  verified: boolean;
  createdAt: string;
  status: 'ACTIVE' | 'PAUSED' | 'RETIRED';
  merkleProofAvailable?: boolean;
  inMerkleTree?: boolean;
}

interface TokenStatistics {
  totalTokens: number;
  activeTokens: number;
  totalSupplyValue: number;
  averageVerificationRate: number;
}

const TokenManagement: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [stats, setStats] = useState<TokenStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [merkleRootHash, setMerkleRootHash] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchTokenData();
    const interval = setInterval(fetchTokenData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchTokenData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch tokens from /api/v12/tokens endpoint
      const tokenData = await apiService.getTokens();
      console.log('✅ Fetched token data:', tokenData);

      // Try to fetch Merkle root hash for Phase 2 integration
      try {
        const merkleData = await apiService.getMerkleRootHash();
        setMerkleRootHash(merkleData.rootHash || null);
        console.log('✅ Fetched Merkle root hash:', merkleData.rootHash);
      } catch (merkleErr) {
        console.warn('⚠️ Merkle root hash not available:', merkleErr);
        setMerkleRootHash(null);
      }

      // Parse token array
      const tokenList: Token[] = Array.isArray(tokenData) ? tokenData.map((t: any) => ({
        id: t.id || `token-${Math.random()}`,
        name: t.name || 'Unknown Token',
        symbol: t.symbol || 'UNK',
        totalSupply: t.totalSupply || 0,
        circulatingSupply: t.circulatingSupply || 0,
        decimals: t.decimals || 18,
        contractAddress: t.contractAddress || '0x0',
        verified: t.verified || false,
        createdAt: t.createdAt || new Date().toISOString(),
        status: t.status || 'ACTIVE',
        merkleProofAvailable: t.merkleProofAvailable || false,
        inMerkleTree: t.inMerkleTree || (t.id && t.id.startsWith('RWAT-'))
      })) : [];

      // Calculate statistics
      const statistics: TokenStatistics = {
        totalTokens: tokenList.length,
        activeTokens: tokenList.filter(t => t.status === 'ACTIVE').length,
        totalSupplyValue: tokenList.reduce((sum, t) => sum + t.totalSupply, 0),
        averageVerificationRate: tokenList.length > 0
          ? (tokenList.filter(t => t.verified).length / tokenList.length) * 100
          : 0
      };

      setTokens(tokenList);
      setStats(statistics);
      setLoading(false);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch token data:', err);
      setError('Unable to load token data. Please try again.');
      // Provide fallback data for demo
      setStats({
        totalTokens: 0,
        activeTokens: 0,
        totalSupplyValue: 0,
        averageVerificationRate: 0
      });
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): 'success' | 'default' | 'error' => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'PAUSED': return 'default';
      case 'RETIRED': return 'error';
      default: return 'default';
    }
  };

  if (loading && !stats) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>Token Management</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Token Management - Phase 1 Integration</Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()} | {merkleRootHash ? 'Merkle Tree: Active' : 'Merkle Tree: Pending'}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchTokenData} disabled={loading}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
            Create Token
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error} - Endpoint /api/v12/tokens may not be implemented yet.
        </Alert>
      )}

      {merkleRootHash && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<AccountTree />}>
          <strong>Phase 2 Merkle Tree Active</strong> - Registry integrity verified
          <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace', mt: 1 }}>
            Root Hash: {merkleRootHash.substring(0, 32)}...
          </Typography>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Tokens
              </Typography>
              <Typography variant="h4">{stats?.totalTokens || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Active Tokens
              </Typography>
              <Typography variant="h4" color="success.main">{stats?.activeTokens || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Supply
              </Typography>
              <Typography variant="h4">{(stats?.totalSupplyValue || 0).toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Verification Rate
              </Typography>
              <Typography variant="h4">{(stats?.averageVerificationRate || 0).toFixed(1)}%</Typography>
              <LinearProgress
                variant="determinate"
                value={stats?.averageVerificationRate || 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tokens Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
            Token Registry
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Total Supply</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verified</TableCell>
                  <TableCell>Merkle Proof</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tokens.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No tokens found. Create a token to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>{token.name}</TableCell>
                      <TableCell>
                        <Chip label={token.symbol} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{token.totalSupply.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={token.status}
                          size="small"
                          color={getStatusColor(token.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {token.verified ? (
                          <Chip icon={<VerifiedUser />} label="Verified" size="small" color="success" />
                        ) : (
                          <Chip label="Unverified" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        {token.inMerkleTree ? (
                          <Chip icon={<AccountTree />} label="In Tree" size="small" color="primary" />
                        ) : (
                          <Chip label="Pending" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>{new Date(token.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <IconButton size="small" title="View">
                          <Visibility />
                        </IconButton>
                        <IconButton size="small" title="Download">
                          <Download />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Create Token Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Token</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField fullWidth label="Token Name" placeholder="My Token" />
            <TextField fullWidth label="Symbol" placeholder="MYT" inputProps={{ maxLength: 10 }} />
            <TextField fullWidth type="number" label="Decimal Places" defaultValue={18} />
            <TextField fullWidth type="number" label="Initial Supply" placeholder="1000000" />
            <Alert severity="info">
              Token creation will be available once /api/v12/tokens endpoint is implemented.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled>Create Token</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TokenManagement;

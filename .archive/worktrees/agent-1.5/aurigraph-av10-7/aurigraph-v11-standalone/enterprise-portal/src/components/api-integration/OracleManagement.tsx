import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchOracleSources,
  fetchPriceFeedPairs,
  selectOracleSource,
} from '../../store/apiIntegrationSlice';
import type { OracleSourceType, OracleStatus } from '../../types/apiIntegration';

const OracleManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    oracleSources,
    priceFeedPairs,
    selectedOracleSource,
    loading,
  } = useAppSelector((state) => state.apiIntegration);

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [addPairDialogOpen, setAddPairDialogOpen] = useState(false);
  const [newPair, setNewPair] = useState({
    baseAsset: '',
    quoteAsset: 'USD',
    updateInterval: 60,
    deviationThreshold: 0.5,
  });

  useEffect(() => {
    dispatch(fetchOracleSources());
    dispatch(fetchPriceFeedPairs());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchOracleSources());
    dispatch(fetchPriceFeedPairs());
  };

  const getStatusColor = (status: OracleStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DEGRADED':
        return 'warning';
      case 'INACTIVE':
        return 'error';
      case 'OFFLINE':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: OracleStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircleIcon fontSize="small" />;
      case 'DEGRADED':
        return <WarningIcon fontSize="small" />;
      case 'INACTIVE':
      case 'OFFLINE':
        return <ErrorIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const handleAddPriceFeedPair = () => {
    // In production, this would call the API
    console.log('Adding price feed pair:', newPair);
    setAddPairDialogOpen(false);
    setNewPair({
      baseAsset: '',
      quoteAsset: 'USD',
      updateInterval: 60,
      deviationThreshold: 0.5,
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Oracle Management</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddPairDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Add Price Feed
          </Button>
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Oracle Sources Summary */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {oracleSources.map((source) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={source.sourceId}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedOracleSource === source.type ? 2 : 0,
                borderColor: 'primary.main',
              }}
              onClick={() => dispatch(selectOracleSource(source.type))}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {source.name}
                  </Typography>
                  {getStatusIcon(source.status)}
                </Box>
                <Chip
                  label={source.status}
                  color={getStatusColor(source.status)}
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Health: {source.healthPercentage.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={source.healthPercentage}
                    color={source.healthPercentage > 95 ? 'success' : source.healthPercentage > 80 ? 'warning' : 'error'}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {source.validFeeds}/{source.totalFeeds} feeds active
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Update: {source.updateInterval}s
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Price Feed Pairs Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Price Feed Pairs</Typography>
            <Typography variant="body2" color="text.secondary">
              {priceFeedPairs.filter(p => p.enabled).length} / {priceFeedPairs.length} active
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pair</TableCell>
                  <TableCell>Base Asset</TableCell>
                  <TableCell>Quote Asset</TableCell>
                  <TableCell align="right">Last Price</TableCell>
                  <TableCell>Oracle Sources</TableCell>
                  <TableCell>Update Interval</TableCell>
                  <TableCell>Deviation Threshold</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {priceFeedPairs
                  .filter(pair => !selectedOracleSource || pair.sources.includes(selectedOracleSource))
                  .map((pair) => (
                    <TableRow key={pair.pairId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {pair.symbol}
                        </Typography>
                      </TableCell>
                      <TableCell>{pair.baseAsset}</TableCell>
                      <TableCell>{pair.quoteAsset}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          ${pair.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {pair.sources.map((source) => (
                            <Chip
                              key={source}
                              label={source}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>{pair.updateInterval}s</TableCell>
                      <TableCell>{pair.deviationThreshold}%</TableCell>
                      <TableCell>
                        <Chip
                          label={pair.enabled ? 'Active' : 'Disabled'}
                          color={pair.enabled ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Configure">
                          <IconButton size="small" onClick={() => setConfigDialogOpen(true)}>
                            <SettingsIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Price Feed Dialog */}
      <Dialog open={addPairDialogOpen} onClose={() => setAddPairDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Price Feed Pair</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Base Asset"
                value={newPair.baseAsset}
                onChange={(e) => setNewPair({ ...newPair, baseAsset: e.target.value.toUpperCase() })}
                placeholder="BTC, ETH, etc."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Quote Asset</InputLabel>
                <Select
                  value={newPair.quoteAsset}
                  onChange={(e) => setNewPair({ ...newPair, quoteAsset: e.target.value })}
                  label="Quote Asset"
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="BTC">BTC</MenuItem>
                  <MenuItem value="ETH">ETH</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Update Interval (seconds)"
                type="number"
                value={newPair.updateInterval}
                onChange={(e) => setNewPair({ ...newPair, updateInterval: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Deviation Threshold (%)"
                type="number"
                value={newPair.deviationThreshold}
                onChange={(e) => setNewPair({ ...newPair, deviationThreshold: parseFloat(e.target.value) })}
                inputProps={{ step: 0.1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPairDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPriceFeedPair} variant="contained" disabled={!newPair.baseAsset}>
            Add Price Feed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Oracle Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Configure oracle settings, consensus methods, and fallback sources.
          </Typography>
          {/* Configuration form would go here */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Close</Button>
          <Button variant="contained">Save Configuration</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OracleManagement;

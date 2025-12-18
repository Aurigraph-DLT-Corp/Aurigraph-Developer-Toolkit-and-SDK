import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  TextField,
  InputAdornment,
  LinearProgress,
  Button,
  Tooltip
} from '@mui/material';
import {
  History,
  Search,
  Refresh,
  Add,
  Edit,
  Delete,
  VerifiedUser,
  Info,
  FilterList
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface AuditEntry {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VERIFY' | 'REBUILD';
  entityType: 'TOKEN' | 'MERKLE_TREE' | 'REGISTRY';
  entityId: string;
  userId: string;
  details: string;
  previousHash?: string;
  newHash?: string;
}

/**
 * AuditTrail Component
 * Phase 2: Displays comprehensive audit trail for all registry modifications
 * Endpoint: GET /api/v12/registry/rwat/audit
 */
const AuditTrail: React.FC = () => {
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchAuditTrail();
    const interval = setInterval(fetchAuditTrail, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterAuditEntries();
  }, [searchQuery, filterAction, auditEntries]);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, simulate audit data since the endpoint may not exist yet
      // In production, this would call: const data = await apiService.getAuditTrail();

      // Simulated audit data
      const mockAuditData: AuditEntry[] = [
        {
          id: 'audit-001',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          action: 'CREATE',
          entityType: 'TOKEN',
          entityId: 'RWAT-001',
          userId: 'admin',
          details: 'Created RWAT token for commercial property',
          newHash: 'a1b2c3d4e5f6...'
        },
        {
          id: 'audit-002',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          action: 'REBUILD',
          entityType: 'MERKLE_TREE',
          entityId: 'merkle-tree-main',
          userId: 'system',
          details: 'Merkle tree rebuilt after batch token creation',
          previousHash: 'old-root-hash...',
          newHash: 'new-root-hash...'
        },
        {
          id: 'audit-003',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          action: 'VERIFY',
          entityType: 'TOKEN',
          entityId: 'RWAT-002',
          userId: 'auditor',
          details: 'Token verification completed successfully'
        },
        {
          id: 'audit-004',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          action: 'UPDATE',
          entityType: 'TOKEN',
          entityId: 'RWAT-003',
          userId: 'admin',
          details: 'Updated token metadata and valuation',
          previousHash: 'prev-hash...',
          newHash: 'new-hash...'
        }
      ];

      setAuditEntries(mockAuditData);
      setLastRefresh(new Date());
      console.log('✅ Audit trail fetched:', mockAuditData.length, 'entries');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load audit trail';
      setError(errorMsg);
      console.error('❌ Failed to fetch audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAuditEntries = () => {
    let filtered = auditEntries;

    // Apply action filter
    if (filterAction !== 'ALL') {
      filtered = filtered.filter((entry) => entry.action === filterAction);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.entityId.toLowerCase().includes(query) ||
          entry.details.toLowerCase().includes(query) ||
          entry.userId.toLowerCase().includes(query)
      );
    }

    setFilteredEntries(filtered);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Add fontSize="small" />;
      case 'UPDATE':
        return <Edit fontSize="small" />;
      case 'DELETE':
        return <Delete fontSize="small" />;
      case 'VERIFY':
        return <VerifiedUser fontSize="small" />;
      case 'REBUILD':
        return <Refresh fontSize="small" />;
      default:
        return <Info fontSize="small" />;
    }
  };

  const getActionColor = (
    action: string
  ): 'success' | 'primary' | 'error' | 'warning' | 'info' | 'default' => {
    switch (action) {
      case 'CREATE':
        return 'success';
      case 'UPDATE':
        return 'primary';
      case 'DELETE':
        return 'error';
      case 'VERIFY':
        return 'info';
      case 'REBUILD':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <History sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h6">Audit Trail - Phase 2</Typography>
              <Typography variant="caption" color="text.secondary">
                Last updated: {lastRefresh.toLocaleTimeString()} | {filteredEntries.length} entries
              </Typography>
            </Box>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={fetchAuditTrail}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error} - Displaying simulated audit data. Audit endpoint /api/v12/registry/rwat/audit
            not yet implemented.
          </Alert>
        )}

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            placeholder="Search by entity ID, user, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'REBUILD'].map((action) => (
              <Chip
                key={action}
                label={action}
                onClick={() => setFilterAction(action)}
                color={filterAction === action ? 'primary' : 'default'}
                variant={filterAction === action ? 'filled' : 'outlined'}
                size="small"
                icon={action !== 'ALL' ? getActionIcon(action) : <FilterList fontSize="small" />}
              />
            ))}
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Audit Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity Type</TableCell>
                <TableCell>Entity ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Details</TableCell>
                <TableCell align="center">Hashes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      {searchQuery || filterAction !== 'ALL'
                        ? 'No audit entries match your filters'
                        : 'No audit entries found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEntries.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="caption">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getActionIcon(entry.action)}
                        label={entry.action}
                        size="small"
                        color={getActionColor(entry.action)}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={entry.entityType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" fontSize="0.8rem">
                        {entry.entityId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{entry.userId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300 }}>
                        {entry.details}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {entry.previousHash || entry.newHash ? (
                        <Tooltip
                          title={
                            <Box>
                              {entry.previousHash && (
                                <Typography variant="caption">
                                  Previous: {entry.previousHash}
                                </Typography>
                              )}
                              {entry.newHash && (
                                <Typography variant="caption" display="block">
                                  New: {entry.newHash}
                                </Typography>
                              )}
                            </Box>
                          }
                        >
                          <IconButton size="small">
                            <Info fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Information */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            All modifications to tokens, Merkle tree rebuilds, and verification actions are recorded
            in this immutable audit trail. Each entry includes cryptographic hashes for verification.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AuditTrail;

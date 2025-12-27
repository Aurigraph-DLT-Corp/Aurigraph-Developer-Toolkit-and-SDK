/**
 * LeadDashboard Component
 *
 * Comprehensive lead management dashboard featuring:
 * - Lead list with search and filtering by status
 * - Lead scoring visualization
 * - Quick actions (assign, update status, create demo)
 * - Bulk operations support
 * - High-value lead highlighting
 * - Real-time status updates
 */

import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllLeads,
  setSearchQuery,
  setFilterStatus,
  updateLeadStatus,
} from '../../slices/leadSlice';
import { Lead, LeadStatus } from '../../services/CrmService';
import { AppDispatch, RootState } from '../../store';

const LeadDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { filteredLeads, status, error, searchQuery, filterStatus } = useSelector(
    (state: RootState) => state.leads
  );

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<LeadStatus | ''>('');

  useEffect(() => {
    dispatch(fetchAllLeads());
  }, [dispatch]);

  const getLeadStatusColor = (
    status: LeadStatus
  ): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case LeadStatus.NEW:
        return 'info';
      case LeadStatus.ENGAGED:
        return 'primary';
      case LeadStatus.QUALIFIED:
        return 'success';
      case LeadStatus.PROPOSAL_SENT:
        return 'warning';
      case LeadStatus.CONVERTED:
        return 'success';
      case LeadStatus.LOST:
        return 'error';
      default:
        return 'default';
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 75) return '#4caf50'; // High: Green
    if (score >= 50) return '#2196f3'; // Medium: Blue
    if (score >= 25) return '#ff9800'; // Low: Orange
    return '#f44336'; // Very Low: Red
  };

  const getScorePercentage = (score: number): number => {
    return Math.min((score / 100) * 100, 100);
  };

  const handleStatusChange = async () => {
    if (selectedLead && newStatus && newStatus !== '') {
      await dispatch(
        updateLeadStatus({ id: selectedLead.id, status: newStatus as LeadStatus })
      );
      setOpenStatusDialog(false);
      setNewStatus('');
    }
  };

  const stats = {
    total: filteredLeads.length,
    qualified: filteredLeads.filter((l) => l.status === LeadStatus.QUALIFIED).length,
    highValue: filteredLeads.filter((l) => l.leadScore >= 75).length,
    converted: filteredLeads.filter((l) => l.status === LeadStatus.CONVERTED).length,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Leads
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Qualified
              </Typography>
              <Typography variant="h4">{stats.qualified}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Value
              </Typography>
              <Typography variant="h4">{stats.highValue}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Converted
              </Typography>
              <Typography variant="h4">{stats.converted}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by name, email, company..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus || ''}
                label="Filter by Status"
                onChange={(e) =>
                  dispatch(setFilterStatus(e.target.value ? (e.target.value as LeadStatus) : null))
                }
              >
                <MenuItem value="">All Leads</MenuItem>
                <MenuItem value={LeadStatus.NEW}>New</MenuItem>
                <MenuItem value={LeadStatus.ENGAGED}>Engaged</MenuItem>
                <MenuItem value={LeadStatus.QUALIFIED}>Qualified</MenuItem>
                <MenuItem value={LeadStatus.PROPOSAL_SENT}>Proposal Sent</MenuItem>
                <MenuItem value={LeadStatus.CONVERTED}>Converted</MenuItem>
                <MenuItem value={LeadStatus.LOST}>Lost</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Leads Table */}
      <TableContainer component={Paper}>
        {status === 'loading' && <LinearProgress />}
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Company</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  {status === 'loading' ? (
                    <CircularProgress />
                  ) : (
                    <Typography color="textSecondary">No leads found</Typography>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  hover
                  sx={{
                    bgcolor:
                      lead.leadScore >= 75 ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {lead.firstName} {lead.lastName}
                      </Typography>
                      {lead.jobTitle && (
                        <Typography variant="caption" color="textSecondary">
                          {lead.jobTitle}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{lead.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{lead.companyName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 60, position: 'relative' }}>
                        <LinearProgress
                          variant="determinate"
                          value={getScorePercentage(lead.leadScore)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: getScoreColor(lead.leadScore),
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: getScoreColor(lead.leadScore),
                          minWidth: 35,
                        }}
                      >
                        {lead.leadScore}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={lead.status}
                      size="small"
                      color={getLeadStatusColor(lead.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedLead(lead);
                        setNewStatus(lead.status);
                        setOpenStatusDialog(true);
                      }}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
        <DialogTitle>Update Lead Status</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {selectedLead && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Lead:</strong> {selectedLead.firstName} {selectedLead.lastName}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Current Status:</strong> {selectedLead.status}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>New Status</InputLabel>
                <Select
                  value={newStatus}
                  label="New Status"
                  onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                >
                  {Object.values(LeadStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button
            onClick={handleStatusChange}
            variant="contained"
            sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LeadDashboard;

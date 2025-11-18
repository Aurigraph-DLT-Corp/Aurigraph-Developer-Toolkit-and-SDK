import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Download,
  Visibility,
  CheckCircle,
  Warning,
  Info,
} from '@mui/icons-material';

interface OwnershipRecord {
  id: string;
  assetId: string;
  assetName: string;
  previousOwner: string;
  currentOwner: string;
  transferDate: Date;
  reason: string;
  proofHash: string;
  verified: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const TraceabilityManagement: React.FC = () => {
  const [records, setRecords] = useState<OwnershipRecord[]>([
    {
      id: 'record_001',
      assetId: 'asset_001',
      assetName: 'Property at 123 Main St',
      previousOwner: 'John Smith',
      currentOwner: 'Jane Doe',
      transferDate: new Date('2025-01-15'),
      reason: 'Sale Transaction',
      proofHash: '0x7a3c9e2f1d4b8a6e5c2f9d1b3a5c7e9f',
      verified: true,
    },
    {
      id: 'record_002',
      assetId: 'asset_002',
      assetName: 'Commodity Shipment',
      previousOwner: 'Supplier Corp',
      currentOwner: 'Distribution Inc',
      transferDate: new Date('2025-01-20'),
      reason: 'Distribution Transfer',
      proofHash: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p',
      verified: true,
    },
  ]);
  const [tabValue, setTabValue] = useState(0);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OwnershipRecord | null>(null);

  const handleVerifyRecord = (recordId: string) => {
    setRecords(
      records.map((r) => (r.id === recordId ? { ...r, verified: true } : r))
    );
  };

  const handleExportReport = () => {
    const csv = [
      ['Asset', 'Previous Owner', 'Current Owner', 'Transfer Date', 'Verified'],
      ...records.map((r) => [
        r.assetName,
        r.previousOwner,
        r.currentOwner,
        r.transferDate.toLocaleDateString(),
        r.verified ? 'Yes' : 'No',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traceability-report-${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Traceability Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and verify asset ownership chains
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={handleExportReport}
          size="large"
        >
          Export Report
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={`All Records (${records.length})`} id="tab-0" aria-controls="tabpanel-0" />
          <Tab
            label={`Verified (${records.filter((r) => r.verified).length})`}
            id="tab-1"
            aria-controls="tabpanel-1"
          />
          <Tab
            label={`Pending (${records.filter((r) => !r.verified).length})`}
            id="tab-2"
            aria-controls="tabpanel-2"
          />
          <Tab label={`Analytics`} id="tab-3" aria-controls="tabpanel-3" />
        </Tabs>
      </Box>

      {/* All Records Tab */}
      <TabPanel value={tabValue} index={0}>
        {records.length === 0 ? (
          <Alert severity="info">No ownership records yet.</Alert>
        ) : (
          <>
            {/* Stats */}
            <Grid container spacing={3} mb={3}>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Records
                    </Typography>
                    <Typography variant="h4">{records.length}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Verified
                    </Typography>
                    <Typography variant="h4">
                      {records.filter((r) => r.verified).length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Verification Rate
                    </Typography>
                    <Typography variant="h4">
                      {records.length > 0
                        ? Math.round(
                            (records.filter((r) => r.verified).length / records.length) * 100
                          )
                        : 0}
                      %
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Unique Assets
                    </Typography>
                    <Typography variant="h4">
                      {new Set(records.map((r) => r.assetId)).size}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Records Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Asset</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Info fontSize="small" />
                          {record.assetName}
                        </Box>
                      </TableCell>
                      <TableCell>{record.previousOwner}</TableCell>
                      <TableCell>{record.currentOwner}</TableCell>
                      <TableCell>{record.transferDate.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.verified ? 'Verified' : 'Pending'}
                          size="small"
                          color={record.verified ? 'success' : 'warning'}
                          icon={record.verified ? <CheckCircle /> : <Warning />}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedRecord(record);
                              setViewDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {!record.verified && (
                          <Tooltip title="Verify">
                            <IconButton
                              size="small"
                              onClick={() => handleVerifyRecord(record.id)}
                            >
                              <CheckCircle />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </TabPanel>

      {/* Verified Tab */}
      <TabPanel value={tabValue} index={1}>
        {records.filter((r) => r.verified).length === 0 ? (
          <Alert severity="info">No verified records yet.</Alert>
        ) : (
          <Box>
            {records
              .filter((r) => r.verified)
              .map((record) => (
                <Card key={record.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box>
                        <Typography variant="h6">{record.assetName}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {record.previousOwner} → {record.currentOwner}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                          {record.transferDate.toLocaleString()}
                        </Typography>
                      </Box>
                      <CheckCircle color="success" />
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
        )}
      </TabPanel>

      {/* Pending Tab */}
      <TabPanel value={tabValue} index={2}>
        {records.filter((r) => !r.verified).length === 0 ? (
          <Alert severity="success">All records verified!</Alert>
        ) : (
          <Box>
            {records
              .filter((r) => !r.verified)
              .map((record) => (
                <Card key={record.id} sx={{ mb: 2, borderLeft: '4px solid #ff9800' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box flex={1}>
                        <Typography variant="h6">{record.assetName}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {record.previousOwner} → {record.currentOwner}
                        </Typography>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          Reason: {record.reason}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleVerifyRecord(record.id)}
                      >
                        Verify
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
        )}
      </TabPanel>

      {/* Analytics Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification Progress
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Verified Records</Typography>
                    <Typography variant="body2">
                      {records.filter((r) => r.verified).length}/{records.length}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      records.length > 0
                        ? (records.filter((r) => r.verified).length / records.length) * 100
                        : 0
                    }
                    sx={{ height: 10, borderRadius: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Transfers
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {records.slice(0, 5).map((record) => (
                    <Box key={record.id} sx={{ py: 1, borderBottom: '1px solid #e0e0e0' }}>
                      <Typography variant="body2">{record.assetName}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {record.transferDate.toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedRecord && (
          <>
            <DialogTitle>Ownership Record Details</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Asset
                  </Typography>
                  <Typography variant="body2">{selectedRecord.assetName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Previous Owner
                  </Typography>
                  <Typography variant="body2">{selectedRecord.previousOwner}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Current Owner
                  </Typography>
                  <Typography variant="body2">{selectedRecord.currentOwner}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Transfer Date
                  </Typography>
                  <Typography variant="body2">
                    {selectedRecord.transferDate.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Reason
                  </Typography>
                  <Typography variant="body2">{selectedRecord.reason}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Proof Hash
                  </Typography>
                  <Typography variant="caption" sx={{ wordBreak: 'break-all' }}>
                    {selectedRecord.proofHash}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Chip
                    label={selectedRecord.verified ? 'Verified' : 'Pending'}
                    color={selectedRecord.verified ? 'success' : 'warning'}
                    icon={selectedRecord.verified ? <CheckCircle /> : <Warning />}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default TraceabilityManagement;

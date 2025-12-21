import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, IconButton, Tooltip, FormControl, InputLabel,
  Select, MenuItem, Switch, FormControlLabel, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, LinearProgress,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider
} from '@mui/material';
import {
  Add, Schedule, Event, Cloud, PlayArrow, Stop, Check, Close,
  ExpandMore, Refresh, History, Settings, Warning, CheckCircle,
  Error, AccessTime, Code, Delete, Edit, ContentCopy
} from '@mui/icons-material';

// Trigger Types
type TriggerType = 'TIME_BASED' | 'EVENT_BASED' | 'ORACLE_BASED';
type TriggerStatus = 'enabled' | 'disabled' | 'error' | 'pending';

interface Trigger {
  id: string;
  contractId: string;
  name: string;
  type: TriggerType;
  status: TriggerStatus;
  condition: string;
  action: string;
  createdAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  // Type-specific configuration
  schedule?: string; // cron expression for TIME_BASED
  eventType?: string; // event name for EVENT_BASED
  oracleSource?: string; // oracle endpoint for ORACLE_BASED
  oracleCondition?: string; // condition for ORACLE_BASED
}

interface TriggerExecution {
  id: string;
  triggerId: string;
  executedAt: Date;
  status: 'success' | 'failed' | 'skipped';
  duration: number; // milliseconds
  gasUsed?: number;
  transactionHash?: string;
  error?: string;
  result?: string;
}

interface TriggerFormData {
  name: string;
  type: TriggerType;
  condition: string;
  action: string;
  schedule: string;
  eventType: string;
  oracleSource: string;
  oracleCondition: string;
}

interface TriggerManagementProps {
  contractId: string;
  contractName?: string;
}

const initialFormData: TriggerFormData = {
  name: '',
  type: 'TIME_BASED',
  condition: '',
  action: '',
  schedule: '0 0 * * *', // Daily at midnight
  eventType: '',
  oracleSource: '',
  oracleCondition: '',
};

// Mock API functions - replace with actual API calls
const triggerApi = {
  getTriggers: async (contractId: string): Promise<Trigger[]> => {
    const response = await fetch(`/api/v12/triggers/contract/${contractId}`);
    if (!response.ok) throw new Error('Failed to fetch triggers');
    const data = await response.json();
    return data.triggers || [];
  },

  registerTrigger: async (contractId: string, triggerData: Partial<Trigger>): Promise<Trigger> => {
    const response = await fetch(`/api/v12/triggers/contract/${contractId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(triggerData),
    });
    if (!response.ok) throw new Error('Failed to register trigger');
    return response.json();
  },

  getExecutions: async (triggerId: string): Promise<TriggerExecution[]> => {
    const response = await fetch(`/api/v12/triggers/${triggerId}/executions`);
    if (!response.ok) throw new Error('Failed to fetch executions');
    const data = await response.json();
    return data.executions || [];
  },

  testTrigger: async (triggerId: string): Promise<{ success: boolean; result?: string; error?: string }> => {
    const response = await fetch(`/api/v12/triggers/${triggerId}/test`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to test trigger');
    return response.json();
  },

  toggleTrigger: async (triggerId: string, enabled: boolean): Promise<void> => {
    const response = await fetch(`/api/v12/triggers/${triggerId}/${enabled ? 'enable' : 'disable'}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to toggle trigger');
  },

  deleteTrigger: async (triggerId: string): Promise<void> => {
    const response = await fetch(`/api/v12/triggers/${triggerId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete trigger');
  },
};

export const TriggerManagement: React.FC<TriggerManagementProps> = ({
  contractId,
  contractName = 'Contract',
}) => {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [executions, setExecutions] = useState<TriggerExecution[]>([]);
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [executionDialogOpen, setExecutionDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<TriggerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; result?: string; error?: string } | null>(null);

  // Load triggers on mount
  const loadTriggers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await triggerApi.getTriggers(contractId);
      setTriggers(data.map(t => ({
        ...t,
        createdAt: new Date(t.createdAt),
        lastExecuted: t.lastExecuted ? new Date(t.lastExecuted) : undefined,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load triggers');
      // Set empty array on error - no mock data
      setTriggers([]);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadTriggers();
  }, [loadTriggers]);

  // Load executions for selected trigger
  const loadExecutions = async (triggerId: string) => {
    try {
      const data = await triggerApi.getExecutions(triggerId);
      setExecutions(data.map(e => ({
        ...e,
        executedAt: new Date(e.executedAt),
      })));
    } catch (err) {
      console.error('Failed to load executions:', err);
      setExecutions([]);
    }
  };

  // Handle form input changes
  const handleFormChange = (field: keyof TriggerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Register new trigger
  const handleRegisterTrigger = async () => {
    setIsSubmitting(true);
    try {
      const triggerData: Partial<Trigger> = {
        name: formData.name,
        type: formData.type,
        condition: formData.condition,
        action: formData.action,
        status: 'enabled',
        executionCount: 0,
      };

      // Add type-specific fields
      if (formData.type === 'TIME_BASED') {
        triggerData.schedule = formData.schedule;
      } else if (formData.type === 'EVENT_BASED') {
        triggerData.eventType = formData.eventType;
      } else if (formData.type === 'ORACLE_BASED') {
        triggerData.oracleSource = formData.oracleSource;
        triggerData.oracleCondition = formData.oracleCondition;
      }

      await triggerApi.registerTrigger(contractId, triggerData);
      setRegisterDialogOpen(false);
      setFormData(initialFormData);
      await loadTriggers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register trigger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle trigger enabled/disabled
  const handleToggleTrigger = async (trigger: Trigger) => {
    try {
      const newStatus = trigger.status === 'enabled' ? false : true;
      await triggerApi.toggleTrigger(trigger.id, newStatus);
      setTriggers(prev => prev.map(t =>
        t.id === trigger.id
          ? { ...t, status: newStatus ? 'enabled' : 'disabled' }
          : t
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle trigger');
    }
  };

  // Test trigger
  const handleTestTrigger = async (trigger: Trigger) => {
    setSelectedTrigger(trigger);
    setTestDialogOpen(true);
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await triggerApi.testTrigger(trigger.id);
      setTestResult(result);
    } catch (err) {
      setTestResult({
        success: false,
        error: err instanceof Error ? err.message : 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // View executions
  const handleViewExecutions = async (trigger: Trigger) => {
    setSelectedTrigger(trigger);
    await loadExecutions(trigger.id);
    setExecutionDialogOpen(true);
  };

  // Delete trigger
  const handleDeleteTrigger = async (triggerId: string) => {
    if (!window.confirm('Are you sure you want to delete this trigger?')) return;
    try {
      await triggerApi.deleteTrigger(triggerId);
      setTriggers(prev => prev.filter(t => t.id !== triggerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete trigger');
    }
  };

  // Get trigger type icon
  const getTriggerTypeIcon = (type: TriggerType) => {
    switch (type) {
      case 'TIME_BASED':
        return <Schedule />;
      case 'EVENT_BASED':
        return <Event />;
      case 'ORACLE_BASED':
        return <Cloud />;
      default:
        return <Settings />;
    }
  };

  // Get status color
  const getStatusColor = (status: TriggerStatus): 'success' | 'default' | 'error' | 'warning' => {
    switch (status) {
      case 'enabled':
        return 'success';
      case 'disabled':
        return 'default';
      case 'error':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Statistics
  const stats = {
    total: triggers.length,
    enabled: triggers.filter(t => t.status === 'enabled').length,
    disabled: triggers.filter(t => t.status === 'disabled').length,
    errors: triggers.filter(t => t.status === 'error').length,
    totalExecutions: triggers.reduce((sum, t) => sum + t.executionCount, 0),
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Trigger Management - {contractName}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Triggers</Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Enabled</Typography>
              <Typography variant="h4" color="success.main">{stats.enabled}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Disabled</Typography>
              <Typography variant="h4" color="text.secondary">{stats.disabled}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Errors</Typography>
              <Typography variant="h4" color="error.main">{stats.errors}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Executions</Typography>
              <Typography variant="h4">{stats.totalExecutions.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Card */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="All Triggers" />
              <Tab label="Time-Based" />
              <Tab label="Event-Based" />
              <Tab label="Oracle-Based" />
            </Tabs>
            <Box>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={loadTriggers}
                sx={{ mr: 1 }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setRegisterDialogOpen(true)}
              >
                Register Trigger
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Executed</TableCell>
                    <TableCell>Executions</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {triggers
                    .filter(t => activeTab === 0 ||
                      (activeTab === 1 && t.type === 'TIME_BASED') ||
                      (activeTab === 2 && t.type === 'EVENT_BASED') ||
                      (activeTab === 3 && t.type === 'ORACLE_BASED')
                    )
                    .map(trigger => (
                      <TableRow key={trigger.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getTriggerTypeIcon(trigger.type)}
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {trigger.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                ID: {trigger.id.substring(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={trigger.type.replace('_', ' ')}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={trigger.condition}>
                            <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {trigger.type === 'TIME_BASED' && trigger.schedule}
                              {trigger.type === 'EVENT_BASED' && trigger.eventType}
                              {trigger.type === 'ORACLE_BASED' && trigger.oracleCondition}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={trigger.status}
                            size="small"
                            color={getStatusColor(trigger.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {trigger.lastExecuted ? (
                            <Box>
                              <Typography variant="body2">
                                {trigger.lastExecuted.toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {trigger.lastExecuted.toLocaleTimeString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Never
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {trigger.executionCount.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={trigger.status === 'enabled' ? 'Disable' : 'Enable'}>
                            <IconButton
                              size="small"
                              onClick={() => handleToggleTrigger(trigger)}
                              color={trigger.status === 'enabled' ? 'success' : 'default'}
                            >
                              {trigger.status === 'enabled' ? <Check /> : <Close />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Test Trigger">
                            <IconButton
                              size="small"
                              onClick={() => handleTestTrigger(trigger)}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Executions">
                            <IconButton
                              size="small"
                              onClick={() => handleViewExecutions(trigger)}
                            >
                              <History />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteTrigger(trigger.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  {triggers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Box py={4}>
                          <Typography color="textSecondary">
                            No triggers registered for this contract
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => setRegisterDialogOpen(true)}
                            sx={{ mt: 2 }}
                          >
                            Register First Trigger
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Register Trigger Dialog */}
      <Dialog
        open={registerDialogOpen}
        onClose={() => setRegisterDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Register New Trigger</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Trigger Name"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="e.g., Daily Settlement Check"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Trigger Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Trigger Type"
                  onChange={(e) => handleFormChange('type', e.target.value as TriggerType)}
                >
                  <MenuItem value="TIME_BASED">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Schedule fontSize="small" />
                      Time-Based (Cron Schedule)
                    </Box>
                  </MenuItem>
                  <MenuItem value="EVENT_BASED">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Event fontSize="small" />
                      Event-Based (Blockchain Events)
                    </Box>
                  </MenuItem>
                  <MenuItem value="ORACLE_BASED">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Cloud fontSize="small" />
                      Oracle-Based (External Data)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Time-Based Configuration */}
            {formData.type === 'TIME_BASED' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cron Schedule"
                  value={formData.schedule}
                  onChange={(e) => handleFormChange('schedule', e.target.value)}
                  placeholder="0 0 * * * (daily at midnight)"
                  helperText="Use standard cron syntax: minute hour day month weekday"
                />
                <Box mt={1}>
                  <Typography variant="caption" color="textSecondary">
                    Common schedules:
                  </Typography>
                  <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                    <Chip
                      label="Every minute"
                      size="small"
                      onClick={() => handleFormChange('schedule', '* * * * *')}
                    />
                    <Chip
                      label="Hourly"
                      size="small"
                      onClick={() => handleFormChange('schedule', '0 * * * *')}
                    />
                    <Chip
                      label="Daily"
                      size="small"
                      onClick={() => handleFormChange('schedule', '0 0 * * *')}
                    />
                    <Chip
                      label="Weekly"
                      size="small"
                      onClick={() => handleFormChange('schedule', '0 0 * * 0')}
                    />
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Event-Based Configuration */}
            {formData.type === 'EVENT_BASED' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Type"
                  value={formData.eventType}
                  onChange={(e) => handleFormChange('eventType', e.target.value)}
                  placeholder="e.g., Transfer, Approval, StateChange"
                  helperText="Enter the event name to listen for"
                />
              </Grid>
            )}

            {/* Oracle-Based Configuration */}
            {formData.type === 'ORACLE_BASED' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Oracle Source URL"
                    value={formData.oracleSource}
                    onChange={(e) => handleFormChange('oracleSource', e.target.value)}
                    placeholder="https://api.oracle.example/price"
                    helperText="Enter the oracle endpoint URL"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Trigger Condition"
                    value={formData.oracleCondition}
                    onChange={(e) => handleFormChange('oracleCondition', e.target.value)}
                    placeholder="value > 100 OR change_percent > 5"
                    helperText="Define the condition that triggers execution"
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Action Code"
                value={formData.action}
                onChange={(e) => handleFormChange('action', e.target.value)}
                placeholder="// JavaScript or contract function call"
                helperText="Define what happens when the trigger fires"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRegisterTrigger}
            disabled={isSubmitting || !formData.name || !formData.type}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <Add />}
          >
            {isSubmitting ? 'Registering...' : 'Register Trigger'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Execution History Dialog */}
      <Dialog
        open={executionDialogOpen}
        onClose={() => setExecutionDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Execution History - {selectedTrigger?.name}
        </DialogTitle>
        <DialogContent>
          {executions.length === 0 ? (
            <Box py={4} textAlign="center">
              <Typography color="textSecondary">
                No executions recorded for this trigger
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Executed At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Gas Used</TableCell>
                    <TableCell>Transaction</TableCell>
                    <TableCell>Result</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {executions.map(execution => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {execution.executedAt.toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {execution.executedAt.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={
                            execution.status === 'success' ? <CheckCircle /> :
                            execution.status === 'failed' ? <Error /> :
                            <Warning />
                          }
                          label={execution.status}
                          color={
                            execution.status === 'success' ? 'success' :
                            execution.status === 'failed' ? 'error' :
                            'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {execution.duration}ms
                      </TableCell>
                      <TableCell>
                        {execution.gasUsed?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell>
                        {execution.transactionHash ? (
                          <Tooltip title={execution.transactionHash}>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {execution.transactionHash.substring(0, 10)}...
                              <IconButton size="small">
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Typography>
                          </Tooltip>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {execution.error ? (
                          <Tooltip title={execution.error}>
                            <Typography variant="body2" color="error">
                              Error
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="success.main">
                            {execution.result || 'Completed'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecutionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Test Trigger Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Test Trigger - {selectedTrigger?.name}
        </DialogTitle>
        <DialogContent>
          {isTesting ? (
            <Box display="flex" flexDirection="column" alignItems="center" py={4}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Testing trigger condition...</Typography>
            </Box>
          ) : testResult ? (
            <Box py={2}>
              <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {testResult.success ? 'Trigger test passed!' : 'Trigger test failed'}
              </Alert>
              {testResult.result && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Test Result</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {testResult.result}
                      </Typography>
                    </Paper>
                  </AccordionDetails>
                </Accordion>
              )}
              {testResult.error && (
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography color="error">Error Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                        {testResult.error}
                      </Typography>
                    </Paper>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
          {!isTesting && selectedTrigger && (
            <Button
              variant="contained"
              onClick={() => handleTestTrigger(selectedTrigger)}
              startIcon={<PlayArrow />}
            >
              Run Test Again
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TriggerManagement;

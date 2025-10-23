// Demo Registration Component - User registration and demo setup
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, MenuItem, Typography, Box, Stepper, Step, StepLabel,
  FormControl, InputLabel, Select, Chip, IconButton, Paper, Alert
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

interface Channel {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE' | 'CONSORTIUM';
}

interface Node {
  id: string;
  name: string;
  type: 'VALIDATOR' | 'BUSINESS' | 'SLIM';
  endpoint: string;
  channelId: string;
}

interface DemoRegistration {
  userName: string;
  userEmail: string;
  demoName: string;
  description: string;
  channels: Channel[];
  validators: Node[];
  businessNodes: Node[];
  slimNodes: Node[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (demo: DemoRegistration) => void;
}

export const DemoRegistrationForm: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<DemoRegistration>({
    userName: '',
    userEmail: '',
    demoName: '',
    description: '',
    channels: [],
    validators: [],
    businessNodes: [],
    slimNodes: [],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [channelForm, setChannelForm] = useState({ name: '', type: 'PUBLIC' as const });
  const [nodeForm, setNodeForm] = useState({
    name: '',
    type: 'VALIDATOR' as const,
    endpoint: '',
    channelId: ''
  });
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkConfig, setBulkConfig] = useState({
    count: 5,
    type: 'VALIDATOR' as const,
    channelId: '',
    namePrefix: ''
  });

  const steps = ['User Info', 'Configure Channels', 'Configure Nodes', 'Review & Submit'];

  const validateStep = (): { valid: boolean; errors: string[] } => {
    const validationErrors: string[] = [];

    switch (activeStep) {
      case 0:
        if (!formData.userName.trim()) validationErrors.push('Name is required');
        if (!formData.userEmail.trim()) validationErrors.push('Email is required');
        if (!formData.demoName.trim()) validationErrors.push('Demo name is required');
        if (formData.userEmail && !/\S+@\S+\.\S+/.test(formData.userEmail)) {
          validationErrors.push('Email format is invalid');
        }
        break;
      case 1:
        if (formData.channels.length === 0) {
          validationErrors.push('At least one channel is required');
        }
        break;
      case 2:
        if (formData.validators.length === 0) {
          validationErrors.push('At least one validator node is required');
        }
        break;
      default:
        break;
    }

    return {
      valid: validationErrors.length === 0,
      errors: validationErrors
    };
  };

  const handleNext = () => {
    const validation = validateStep();
    if (validation.valid) {
      setErrors({});
      setActiveStep((prev) => prev + 1);
    } else {
      // Show validation errors
      const errorObj: { [key: string]: string } = {};
      validation.errors.forEach((err, idx) => {
        errorObj[`error_${idx}`] = err;
      });
      setErrors(errorObj);
    }
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep((prev) => prev - 1);
  };

  const addChannel = () => {
    if (channelForm.name) {
      const newChannel: Channel = {
        id: `channel_${Date.now()}`,
        name: channelForm.name,
        type: channelForm.type,
      };
      setFormData({ ...formData, channels: [...formData.channels, newChannel] });
      setChannelForm({ name: '', type: 'PUBLIC' });
    }
  };

  const removeChannel = (id: string) => {
    setFormData({
      ...formData,
      channels: formData.channels.filter((c) => c.id !== id),
      validators: formData.validators.filter((n) => n.channelId !== id),
      businessNodes: formData.businessNodes.filter((n) => n.channelId !== id),
      slimNodes: formData.slimNodes.filter((n) => n.channelId !== id),
    });
  };

  const addNode = () => {
    if (nodeForm.name && nodeForm.channelId) {
      const newNode: Node = {
        id: `node_${Date.now()}`,
        name: nodeForm.name,
        type: nodeForm.type,
        endpoint: nodeForm.endpoint || `https://node-${Date.now()}.demo.aurigraph.io`,
        channelId: nodeForm.channelId,
      };

      const updatedFormData = { ...formData };
      if (nodeForm.type === 'VALIDATOR') {
        updatedFormData.validators = [...formData.validators, newNode];
      } else if (nodeForm.type === 'BUSINESS') {
        updatedFormData.businessNodes = [...formData.businessNodes, newNode];
      } else {
        updatedFormData.slimNodes = [...formData.slimNodes, newNode];
      }
      setFormData(updatedFormData);
      setNodeForm({ name: '', type: 'VALIDATOR', endpoint: '', channelId: '' });
    }
  };

  const addBulkNodes = () => {
    if (!bulkConfig.channelId || bulkConfig.count < 1) {
      return;
    }

    const updatedFormData = { ...formData };
    const basePrefix = bulkConfig.namePrefix || bulkConfig.type.toLowerCase();
    const startTime = Date.now();

    for (let i = 0; i < bulkConfig.count; i++) {
      const newNode: Node = {
        id: `node_${startTime}_${i}`,
        name: `${basePrefix}-${i + 1}`,
        type: bulkConfig.type,
        endpoint: `https://${basePrefix.toLowerCase()}-${i + 1}.demo.aurigraph.io`,
        channelId: bulkConfig.channelId,
      };

      if (bulkConfig.type === 'VALIDATOR') {
        updatedFormData.validators = [...updatedFormData.validators, newNode];
      } else if (bulkConfig.type === 'BUSINESS') {
        updatedFormData.businessNodes = [...updatedFormData.businessNodes, newNode];
      } else {
        updatedFormData.slimNodes = [...updatedFormData.slimNodes, newNode];
      }
    }

    setFormData(updatedFormData);
    setBulkDialogOpen(false);
    setBulkConfig({ count: 5, type: 'VALIDATOR', channelId: '', namePrefix: '' });
  };

  const quickAddNodes = (count: number, type: Node['type']) => {
    if (formData.channels.length === 0) {
      return;
    }

    setBulkConfig({
      count,
      type,
      channelId: formData.channels[0].id,
      namePrefix: type.toLowerCase()
    });
    setBulkDialogOpen(true);
  };

  const removeNode = (id: string, type: Node['type']) => {
    const updatedFormData = { ...formData };
    if (type === 'VALIDATOR') {
      updatedFormData.validators = formData.validators.filter((n) => n.id !== id);
    } else if (type === 'BUSINESS') {
      updatedFormData.businessNodes = formData.businessNodes.filter((n) => n.id !== id);
    } else {
      updatedFormData.slimNodes = formData.slimNodes.filter((n) => n.id !== id);
    }
    setFormData(updatedFormData);
  };

  const handleSubmit = () => {
    onSubmit(formData);
    // Reset form
    setFormData({
      userName: '',
      userEmail: '',
      demoName: '',
      description: '',
      channels: [],
      validators: [],
      businessNodes: [],
      slimNodes: [],
    });
    setActiveStep(0);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Fill in your information to register a new demo environment
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Your Name"
                placeholder="Enter your full name"
                value={formData.userName}
                onChange={(e) => {
                  setFormData({ ...formData, userName: e.target.value });
                  setErrors({});
                }}
                error={!formData.userName.trim() && Object.keys(errors).length > 0}
                helperText={!formData.userName.trim() && Object.keys(errors).length > 0 ? 'Name is required' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                type="email"
                label="Your Email"
                placeholder="your.email@example.com"
                value={formData.userEmail}
                onChange={(e) => {
                  setFormData({ ...formData, userEmail: e.target.value });
                  setErrors({});
                }}
                error={!formData.userEmail.trim() && Object.keys(errors).length > 0}
                helperText={!formData.userEmail.trim() && Object.keys(errors).length > 0 ? 'Email is required' : 'We will use this to send you demo credentials'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Demo Name"
                placeholder="My Enterprise Demo"
                value={formData.demoName}
                onChange={(e) => {
                  setFormData({ ...formData, demoName: e.target.value });
                  setErrors({});
                }}
                error={!formData.demoName.trim() && Object.keys(errors).length > 0}
                helperText={!formData.demoName.trim() && Object.keys(errors).length > 0 ? 'Demo name is required' : 'Give your demo a descriptive name'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (Optional)"
                placeholder="Describe the purpose of this demo..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                helperText="Optional: Add details about what this demo will be used for"
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Configure Channels</Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Channel Name"
                    value={channelForm.name}
                    onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Channel Type</InputLabel>
                    <Select
                      value={channelForm.type}
                      label="Channel Type"
                      onChange={(e) => setChannelForm({ ...channelForm, type: e.target.value as any })}
                    >
                      <MenuItem value="PUBLIC">Public</MenuItem>
                      <MenuItem value="PRIVATE">Private</MenuItem>
                      <MenuItem value="CONSORTIUM">Consortium</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={addChannel}>
                    Add Channel
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {formData.channels.length > 0 ? (
              <Box>
                <Typography variant="subtitle1" gutterBottom>Channels ({formData.channels.length})</Typography>
                {formData.channels.map((channel) => (
                  <Paper key={channel.id} sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1"><strong>{channel.name}</strong></Typography>
                      <Chip label={channel.type} size="small" color="primary" />
                    </Box>
                    <IconButton onClick={() => removeChannel(channel.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Alert severity="info">Please add at least one channel to continue.</Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Configure Nodes</Typography>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setBulkDialogOpen(true)}
                disabled={formData.channels.length === 0}
              >
                Bulk Add Nodes
              </Button>
            </Box>

            {/* Quick Add Presets */}
            {formData.channels.length > 0 && (
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(0, 191, 165, 0.05)' }}>
                <Typography variant="subtitle2" gutterBottom>Quick Add Presets:</Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => quickAddNodes(5, 'VALIDATOR')}
                  >
                    +5 Validators
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => quickAddNodes(10, 'VALIDATOR')}
                  >
                    +10 Validators
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={() => quickAddNodes(5, 'BUSINESS')}
                  >
                    +5 Business
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={() => quickAddNodes(10, 'BUSINESS')}
                  >
                    +10 Business
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => quickAddNodes(5, 'SLIM')}
                  >
                    +5 Slim
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => quickAddNodes(10, 'SLIM')}
                  >
                    +10 Slim
                  </Button>
                </Box>
              </Paper>
            )}

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Add Single Node:</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Node Name"
                    value={nodeForm.name}
                    onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Node Type</InputLabel>
                    <Select
                      value={nodeForm.type}
                      label="Node Type"
                      onChange={(e) => setNodeForm({ ...nodeForm, type: e.target.value as any })}
                    >
                      <MenuItem value="VALIDATOR">Validator</MenuItem>
                      <MenuItem value="BUSINESS">Business</MenuItem>
                      <MenuItem value="SLIM">Slim</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Channel</InputLabel>
                    <Select
                      value={nodeForm.channelId}
                      label="Channel"
                      onChange={(e) => setNodeForm({ ...nodeForm, channelId: e.target.value })}
                    >
                      {formData.channels.map((ch) => (
                        <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={addNode}>
                    Add Node
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>Validators ({formData.validators.length})</Typography>
                {formData.validators.map((node) => (
                  <Paper key={node.id} sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{node.name}</Typography>
                    <IconButton size="small" onClick={() => removeNode(node.id, 'VALIDATOR')} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
                {formData.validators.length === 0 && <Alert severity="warning">At least 1 validator required</Alert>}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>Business Nodes ({formData.businessNodes.length})</Typography>
                {formData.businessNodes.map((node) => (
                  <Paper key={node.id} sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{node.name}</Typography>
                    <IconButton size="small" onClick={() => removeNode(node.id, 'BUSINESS')} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>Slim Nodes ({formData.slimNodes.length})</Typography>
                {formData.slimNodes.map((node) => (
                  <Paper key={node.id} sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{node.name}</Typography>
                    <IconButton size="small" onClick={() => removeNode(node.id, 'SLIM')} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Paper>
                ))}
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Your Demo Configuration</Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1"><strong>User Information</strong></Typography>
              <Typography>Name: {formData.userName}</Typography>
              <Typography>Email: {formData.userEmail}</Typography>
              <Typography>Demo: {formData.demoName}</Typography>
              <Typography>Description: {formData.description}</Typography>
            </Paper>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1"><strong>Channels ({formData.channels.length})</strong></Typography>
              {formData.channels.map((ch) => (
                <Chip key={ch.id} label={`${ch.name} (${ch.type})`} sx={{ mr: 1, mb: 1 }} />
              ))}
            </Paper>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1"><strong>Nodes</strong></Typography>
              <Typography>Validators: {formData.validators.length}</Typography>
              <Typography>Business Nodes: {formData.businessNodes.length}</Typography>
              <Typography>Slim Nodes: {formData.slimNodes.length}</Typography>
              <Typography><strong>Total Nodes: {formData.validators.length + formData.businessNodes.length + formData.slimNodes.length}</strong></Typography>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Register New Demo</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {renderStepContent()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        {activeStep < steps.length - 1 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {Object.keys(errors).length > 0 && (
              <Alert severity="error" sx={{ flex: 1 }}>
                {Object.values(errors).join(', ')}
              </Alert>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{ minWidth: '100px' }}
            >
              Next
            </Button>
          </Box>
        ) : (
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Register Demo
          </Button>
        )}
      </DialogActions>
    </Dialog>

    {/* Bulk Node Addition Dialog */}
    <Dialog
      open={bulkDialogOpen}
      onClose={() => setBulkDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Bulk Add Nodes</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Number of Nodes"
                value={bulkConfig.count}
                onChange={(e) => setBulkConfig({ ...bulkConfig, count: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1, max: 100 }}
                helperText="Enter how many nodes to create (1-100)"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Node Type</InputLabel>
                <Select
                  value={bulkConfig.type}
                  label="Node Type"
                  onChange={(e) => setBulkConfig({ ...bulkConfig, type: e.target.value as any })}
                >
                  <MenuItem value="VALIDATOR">Validator</MenuItem>
                  <MenuItem value="BUSINESS">Business</MenuItem>
                  <MenuItem value="SLIM">Slim</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Channel</InputLabel>
                <Select
                  value={bulkConfig.channelId}
                  label="Channel"
                  onChange={(e) => setBulkConfig({ ...bulkConfig, channelId: e.target.value })}
                >
                  {formData.channels.map((ch) => (
                    <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name Prefix (Optional)"
                placeholder="validator"
                value={bulkConfig.namePrefix}
                onChange={(e) => setBulkConfig({ ...bulkConfig, namePrefix: e.target.value })}
                helperText={`Nodes will be named: ${bulkConfig.namePrefix || bulkConfig.type.toLowerCase()}-1, ${bulkConfig.namePrefix || bulkConfig.type.toLowerCase()}-2, etc.`}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                This will create <strong>{bulkConfig.count}</strong> {bulkConfig.type.toLowerCase()} node(s) with auto-generated names and endpoints.
              </Alert>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={addBulkNodes}
          disabled={!bulkConfig.channelId || bulkConfig.count < 1}
        >
          Add {bulkConfig.count} Node{bulkConfig.count !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

// Demo Registration Component - User registration and demo setup
import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, MenuItem, Typography, Box, Stepper, Step, StepLabel,
  FormControl, InputLabel, Select, Chip, IconButton, Paper, Alert,
  Checkbox, FormControlLabel, FormGroup, Radio, RadioGroup, Divider,
  Card, CardContent, Tooltip
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, CheckCircle, Error as ErrorIcon,
  ShowChart as ChartIcon, TrendingUp as TradingIcon, Cloud as WeatherIcon,
  Sensors as IoTIcon, LocalShipping as SupplyChainIcon, AccountBalance as FinanceIcon,
  Security as SecurityIcon, Storage as StorageIcon
} from '@mui/icons-material';

// Available Data Feeds for External Integration (EI) Nodes
export const DATA_FEEDS = [
  { id: 'quantconnect', name: 'QuantConnect', icon: 'chart', description: 'Algorithmic trading data & equities', category: 'financial' },
  { id: 'chainlink', name: 'Chainlink', icon: 'security', description: 'Decentralized oracle price feeds', category: 'oracle' },
  { id: 'pyth', name: 'Pyth Network', icon: 'trading', description: 'High-fidelity financial market data', category: 'oracle' },
  { id: 'band-protocol', name: 'Band Protocol', icon: 'security', description: 'Cross-chain oracle data', category: 'oracle' },
  { id: 'coingecko', name: 'CoinGecko', icon: 'chart', description: 'Cryptocurrency market data', category: 'crypto' },
  { id: 'binance', name: 'Binance', icon: 'trading', description: 'Exchange trading data', category: 'crypto' },
  { id: 'alpaca', name: 'Alpaca Markets', icon: 'trading', description: 'Stock market trading API', category: 'financial' },
  { id: 'weather', name: 'Weather API', icon: 'weather', description: 'Global weather conditions', category: 'environmental' },
  { id: 'iot-sensors', name: 'IoT Sensors', icon: 'iot', description: 'Temperature, humidity, power data', category: 'environmental' },
  { id: 'supply-chain', name: 'Supply Chain', icon: 'supply', description: 'Shipment & logistics tracking', category: 'logistics' },
];

// Tokenization Modes
export const TOKENIZATION_MODES = [
  { id: 'live-feed', name: 'Live Data Feed', description: 'Tokenize real-time data streams from connected feeds', icon: 'chart' },
  { id: 'trades', name: 'Trade Execution', description: 'Tokenize executed trades and market transactions', icon: 'trading' },
  { id: 'hybrid', name: 'Hybrid Mode', description: 'Combine live feeds with trade tokenization', icon: 'storage' },
];

interface Channel {
  id: string;
  name: string;
  type: 'PUBLIC' | 'PRIVATE' | 'CONSORTIUM';
}

interface DataFeedConfig {
  feedId: string;
  enabled: boolean;
  refreshInterval: number; // seconds
}

interface EINodeExtended {
  id: string;
  name: string;
  type: 'SLIM';
  endpoint: string;
  channelId: string;
  dataFeeds: DataFeedConfig[];
}

interface Node {
  id: string;
  name: string;
  type: 'VALIDATOR' | 'BUSINESS' | 'SLIM';
  endpoint: string;
  channelId: string;
  dataFeeds?: DataFeedConfig[];
}

interface DemoRegistration {
  userName: string;
  userEmail: string;
  demoName: string;
  description: string;
  channels: Channel[];
  validators: Node[];
  businessNodes: Node[];
  eiNodes: Node[];
  // New fields for data feeds and tokenization
  tokenizationMode: 'live-feed' | 'trades' | 'hybrid';
  selectedDataFeeds: string[];
  tokenizationConfig: {
    autoStart: boolean;
    batchSize: number;
    merkleTreeEnabled: boolean;
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (demo: DemoRegistration) => void;
}

// Helper function to get icon component
const getDataFeedIcon = (iconType: string) => {
  switch (iconType) {
    case 'chart': return <ChartIcon />;
    case 'trading': return <TradingIcon />;
    case 'weather': return <WeatherIcon />;
    case 'iot': return <IoTIcon />;
    case 'supply': return <SupplyChainIcon />;
    case 'security': return <SecurityIcon />;
    case 'storage': return <StorageIcon />;
    default: return <ChartIcon />;
  }
};

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
    eiNodes: [],
    // New fields
    tokenizationMode: 'live-feed',
    selectedDataFeeds: ['quantconnect', 'chainlink'], // Default selections
    tokenizationConfig: {
      autoStart: true,
      batchSize: 100,
      merkleTreeEnabled: true,
    },
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

  const steps = ['User Info', 'Configure Channels', 'Configure Nodes', 'Data Feeds', 'Tokenization', 'Review & Submit'];

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
      case 3:
        if (formData.selectedDataFeeds.length === 0) {
          validationErrors.push('At least one data feed must be selected');
        }
        break;
      case 4:
        // Tokenization mode always has a default, so no validation needed
        break;
      default:
        break;
    }

    return {
      valid: validationErrors.length === 0,
      errors: validationErrors
    };
  };

  // Toggle data feed selection
  const toggleDataFeed = (feedId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDataFeeds: prev.selectedDataFeeds.includes(feedId)
        ? prev.selectedDataFeeds.filter(id => id !== feedId)
        : [...prev.selectedDataFeeds, feedId]
    }));
  };

  // Get category color
  const getCategoryColor = (category: string): "primary" | "secondary" | "success" | "warning" | "info" | "error" => {
    switch (category) {
      case 'financial': return 'primary';
      case 'oracle': return 'secondary';
      case 'crypto': return 'warning';
      case 'environmental': return 'success';
      case 'logistics': return 'info';
      default: return 'primary';
    }
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
      eiNodes: formData.eiNodes.filter((n) => n.channelId !== id),
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
        updatedFormData.eiNodes = [...formData.eiNodes, newNode];
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
        updatedFormData.eiNodes = [...updatedFormData.eiNodes, newNode];
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
      updatedFormData.eiNodes = formData.eiNodes.filter((n) => n.id !== id);
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
      eiNodes: [],
      tokenizationMode: 'live-feed',
      selectedDataFeeds: ['quantconnect', 'chainlink'],
      tokenizationConfig: {
        autoStart: true,
        batchSize: 100,
        merkleTreeEnabled: true,
      },
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
                <Typography variant="subtitle1" gutterBottom>External Integration (EI) Nodes ({formData.eiNodes.length})</Typography>
                {formData.eiNodes.map((node) => (
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
        // Data Feeds Selection Step
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Configure Data Feeds for External Integration (EI) Nodes</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Select the data feeds that your Slim nodes will connect to. Each Slim node will receive data from the selected feeds for tokenization.
            </Alert>

            {/* Category Filters */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" sx={{ width: '100%', mb: 1 }}>Filter by Category:</Typography>
              <Chip label="All" variant="outlined" onClick={() => {}} />
              <Chip label="Financial" color="primary" variant="outlined" />
              <Chip label="Oracle" color="secondary" variant="outlined" />
              <Chip label="Crypto" color="warning" variant="outlined" />
              <Chip label="Environmental" color="success" variant="outlined" />
              <Chip label="Logistics" color="info" variant="outlined" />
            </Box>

            {/* Data Feed Grid */}
            <Grid container spacing={2}>
              {DATA_FEEDS.map((feed) => (
                <Grid item xs={12} sm={6} md={4} key={feed.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: formData.selectedDataFeeds.includes(feed.id) ? 2 : 1,
                      borderColor: formData.selectedDataFeeds.includes(feed.id) ? 'primary.main' : 'divider',
                      bgcolor: formData.selectedDataFeeds.includes(feed.id) ? 'action.selected' : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': { boxShadow: 4 }
                    }}
                    onClick={() => toggleDataFeed(feed.id)}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getDataFeedIcon(feed.icon)}
                          <Typography variant="subtitle1" fontWeight="bold">{feed.name}</Typography>
                        </Box>
                        <Checkbox
                          checked={formData.selectedDataFeeds.includes(feed.id)}
                          onChange={() => toggleDataFeed(feed.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {feed.description}
                      </Typography>
                      <Chip
                        label={feed.category}
                        size="small"
                        color={getCategoryColor(feed.category)}
                        variant="outlined"
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Selected Feeds Summary */}
            <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Selected Data Feeds ({formData.selectedDataFeeds.length})</strong>
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {formData.selectedDataFeeds.map(feedId => {
                  const feed = DATA_FEEDS.find(f => f.id === feedId);
                  return feed ? (
                    <Chip
                      key={feedId}
                      label={feed.name}
                      onDelete={() => toggleDataFeed(feedId)}
                      color={getCategoryColor(feed.category)}
                    />
                  ) : null;
                })}
                {formData.selectedDataFeeds.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No data feeds selected</Typography>
                )}
              </Box>
            </Paper>
          </Box>
        );

      case 4:
        // Tokenization Mode Selection Step
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Configure Tokenization</Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Choose how you want to tokenize the data from your connected feeds.
            </Alert>

            {/* Tokenization Mode Selection */}
            <Typography variant="subtitle1" gutterBottom><strong>Tokenization Mode</strong></Typography>
            <RadioGroup
              value={formData.tokenizationMode}
              onChange={(e) => setFormData({ ...formData, tokenizationMode: e.target.value as any })}
            >
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {TOKENIZATION_MODES.map((mode) => (
                  <Grid item xs={12} md={4} key={mode.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        border: formData.tokenizationMode === mode.id ? 2 : 1,
                        borderColor: formData.tokenizationMode === mode.id ? 'primary.main' : 'divider',
                        bgcolor: formData.tokenizationMode === mode.id ? 'action.selected' : 'background.paper',
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: 2 }
                      }}
                      onClick={() => setFormData({ ...formData, tokenizationMode: mode.id as any })}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <FormControlLabel
                          value={mode.id}
                          control={<Radio />}
                          label=""
                          sx={{ m: 0 }}
                        />
                        {getDataFeedIcon(mode.icon)}
                        <Typography variant="subtitle1" fontWeight="bold">{mode.name}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {mode.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </RadioGroup>

            <Divider sx={{ my: 3 }} />

            {/* Additional Configuration */}
            <Typography variant="subtitle1" gutterBottom><strong>Additional Settings</strong></Typography>
            <Paper sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.tokenizationConfig.autoStart}
                        onChange={(e) => setFormData({
                          ...formData,
                          tokenizationConfig: { ...formData.tokenizationConfig, autoStart: e.target.checked }
                        })}
                      />
                    }
                    label="Auto-start tokenization when demo begins"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.tokenizationConfig.merkleTreeEnabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          tokenizationConfig: { ...formData.tokenizationConfig, merkleTreeEnabled: e.target.checked }
                        })}
                      />
                    }
                    label="Enable Merkle tree verification for tokenized data"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Batch Size (transactions per batch)"
                    value={formData.tokenizationConfig.batchSize}
                    onChange={(e) => setFormData({
                      ...formData,
                      tokenizationConfig: { ...formData.tokenizationConfig, batchSize: parseInt(e.target.value) || 100 }
                    })}
                    inputProps={{ min: 10, max: 1000 }}
                    helperText="Number of transactions to process per batch (10-1000)"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Mode-specific info */}
            <Alert severity="success" sx={{ mt: 3 }}>
              {formData.tokenizationMode === 'live-feed' && (
                <>
                  <strong>Live Data Feed Mode:</strong> Real-time data from {formData.selectedDataFeeds.length} connected feeds
                  will be continuously tokenized and recorded on the blockchain.
                </>
              )}
              {formData.tokenizationMode === 'trades' && (
                <>
                  <strong>Trade Execution Mode:</strong> Only executed trades and transactions from connected exchanges
                  will be tokenized, providing audit trails for financial operations.
                </>
              )}
              {formData.tokenizationMode === 'hybrid' && (
                <>
                  <strong>Hybrid Mode:</strong> Combines live data feeds with trade execution tokenization,
                  providing comprehensive coverage for both market data and trading activities.
                </>
              )}
            </Alert>
          </Box>
        );

      case 5:
        // Review Step
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review Your Demo Configuration</Typography>

            {/* User Info */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1"><strong>User Information</strong></Typography>
              <Typography>Name: {formData.userName}</Typography>
              <Typography>Email: {formData.userEmail}</Typography>
              <Typography>Demo: {formData.demoName}</Typography>
              <Typography>Description: {formData.description || '(none)'}</Typography>
            </Paper>

            {/* Channels */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1"><strong>Channels ({formData.channels.length})</strong></Typography>
              {formData.channels.map((ch) => (
                <Chip key={ch.id} label={`${ch.name} (${ch.type})`} sx={{ mr: 1, mb: 1 }} />
              ))}
            </Paper>

            {/* Nodes */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1"><strong>Nodes</strong></Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2">Validators: <strong>{formData.validators.length}</strong></Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">Business: <strong>{formData.businessNodes.length}</strong></Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2">Slim: <strong>{formData.eiNodes.length}</strong></Typography>
                </Grid>
              </Grid>
              <Divider sx={{ my: 1 }} />
              <Typography><strong>Total Nodes: {formData.validators.length + formData.businessNodes.length + formData.eiNodes.length}</strong></Typography>
            </Paper>

            {/* Data Feeds */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1"><strong>Data Feeds ({formData.selectedDataFeeds.length})</strong></Typography>
              <Box display="flex" gap={1} flexWrap="wrap" mt={1}>
                {formData.selectedDataFeeds.map(feedId => {
                  const feed = DATA_FEEDS.find(f => f.id === feedId);
                  return feed ? (
                    <Chip
                      key={feedId}
                      icon={getDataFeedIcon(feed.icon)}
                      label={feed.name}
                      color={getCategoryColor(feed.category)}
                      size="small"
                    />
                  ) : null;
                })}
              </Box>
            </Paper>

            {/* Tokenization */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1"><strong>Tokenization Settings</strong></Typography>
              <Grid container spacing={1} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    Mode: <Chip
                      label={TOKENIZATION_MODES.find(m => m.id === formData.tokenizationMode)?.name || formData.tokenizationMode}
                      color="primary"
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    Auto-start: {formData.tokenizationConfig.autoStart ? <Chip label="Yes" color="success" size="small" /> : <Chip label="No" size="small" />}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    Merkle Tree: {formData.tokenizationConfig.merkleTreeEnabled ? <Chip label="Enabled" color="success" size="small" /> : <Chip label="Disabled" size="small" />}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">Batch Size: {formData.tokenizationConfig.batchSize} transactions</Typography>
                </Grid>
              </Grid>
            </Paper>

            <Alert severity="success">
              <strong>Ready to Register!</strong> Click "Register Demo" to create your demo environment with the configuration above.
            </Alert>
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

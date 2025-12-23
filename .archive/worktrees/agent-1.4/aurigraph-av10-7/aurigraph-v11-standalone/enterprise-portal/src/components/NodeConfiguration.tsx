import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Business as BusinessIcon,
  CloudQueue as CloudQueueIcon,
  Api as ApiIcon,
} from '@mui/icons-material';

interface ExternalAPISource {
  id: string;
  name: string;
  type: 'Alpaca' | 'Weather' | 'Equity' | 'Crypto' | 'Custom';
  endpoint: string;
  enabled: boolean;
}

interface SlimNode {
  id: string;
  name: string;
  apiSources: ExternalAPISource[];
}

interface ValidatorNode {
  id: string;
  name: string;
  stake: number;
  votingPower: number;
}

interface BusinessNode {
  id: string;
  name: string;
  industry: string;
  participants: number;
}

interface ChannelConfig {
  channelId: string;
  channelName: string;
  consensusType: string;
  targetTPS: number;
}

interface NodeConfigurationProps {
  open: boolean;
  onClose: () => void;
  onSave: (config: {
    channel: ChannelConfig;
    validatorNodes: ValidatorNode[];
    businessNodes: BusinessNode[];
    slimNodes: SlimNode[];
  }) => void;
}

const defaultAPISources: ExternalAPISource[] = [
  { id: 'alpaca-1', name: 'Alpaca Trading API', type: 'Alpaca', endpoint: 'https://api.alpaca.markets/v2', enabled: false },
  { id: 'weather-1', name: 'OpenWeather API', type: 'Weather', endpoint: 'https://api.openweathermap.org/data/2.5', enabled: false },
  { id: 'equity-1', name: 'Alpha Vantage Equity', type: 'Equity', endpoint: 'https://www.alphavantage.co/query', enabled: false },
  { id: 'crypto-1', name: 'CoinGecko Crypto', type: 'Crypto', endpoint: 'https://api.coingecko.com/api/v3', enabled: false },
];

export const NodeConfiguration: React.FC<NodeConfigurationProps> = ({ open, onClose, onSave }) => {
  // Channel configuration state
  const [channelConfig, setChannelConfig] = useState<ChannelConfig>({
    channelId: 'main-channel',
    channelName: 'Main Channel',
    consensusType: 'HyperRAFT++',
    targetTPS: 2000000,
  });

  // Validator nodes state
  const [validatorNodes, setValidatorNodes] = useState<ValidatorNode[]>([
    { id: 'val-1', name: 'Validator Node 1', stake: 1000000, votingPower: 25 },
    { id: 'val-2', name: 'Validator Node 2', stake: 800000, votingPower: 20 },
    { id: 'val-3', name: 'Validator Node 3', stake: 750000, votingPower: 18 },
  ]);

  // Business nodes state
  const [businessNodes, setBusinessNodes] = useState<BusinessNode[]>([
    { id: 'biz-1', name: 'Financial Services Node', industry: 'Finance', participants: 50 },
    { id: 'biz-2', name: 'Healthcare Network', industry: 'Healthcare', participants: 30 },
  ]);

  // Slim nodes state
  const [slimNodes, setSlimNodes] = useState<SlimNode[]>([
    {
      id: 'slim-1',
      name: 'Trading Data Aggregator',
      apiSources: [
        { ...defaultAPISources[0], enabled: true },
        { ...defaultAPISources[2], enabled: true },
      ],
    },
    {
      id: 'slim-2',
      name: 'Weather & Crypto Monitor',
      apiSources: [
        { ...defaultAPISources[1], enabled: true },
        { ...defaultAPISources[3], enabled: true },
      ],
    },
  ]);

  const handleSave = () => {
    onSave({
      channel: channelConfig,
      validatorNodes,
      businessNodes,
      slimNodes,
    });
    onClose();
  };

  const addValidatorNode = () => {
    const newNode: ValidatorNode = {
      id: `val-${validatorNodes.length + 1}`,
      name: `Validator Node ${validatorNodes.length + 1}`,
      stake: 500000,
      votingPower: 10,
    };
    setValidatorNodes([...validatorNodes, newNode]);
  };

  const addBusinessNode = () => {
    const newNode: BusinessNode = {
      id: `biz-${businessNodes.length + 1}`,
      name: `Business Node ${businessNodes.length + 1}`,
      industry: 'Technology',
      participants: 10,
    };
    setBusinessNodes([...businessNodes, newNode]);
  };

  const addSlimNode = () => {
    const newNode: SlimNode = {
      id: `slim-${slimNodes.length + 1}`,
      name: `Slim Node ${slimNodes.length + 1}`,
      apiSources: [...defaultAPISources],
    };
    setSlimNodes([...slimNodes, newNode]);
  };

  const removeValidatorNode = (id: string) => {
    setValidatorNodes(validatorNodes.filter(node => node.id !== id));
  };

  const removeBusinessNode = (id: string) => {
    setBusinessNodes(businessNodes.filter(node => node.id !== id));
  };

  const removeSlimNode = (id: string) => {
    setSlimNodes(slimNodes.filter(node => node.id !== id));
  };

  const toggleAPISource = (slimNodeId: string, apiId: string) => {
    setSlimNodes(slimNodes.map(node => {
      if (node.id === slimNodeId) {
        return {
          ...node,
          apiSources: node.apiSources.map(api =>
            api.id === apiId ? { ...api, enabled: !api.enabled } : api
          ),
        };
      }
      return node;
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh', bgcolor: '#0A0E27' }
      }}
    >
      <DialogTitle sx={{ bgcolor: '#1A1F3A', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SettingsIcon />
        <Typography variant="h6">Network Configuration</Typography>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#0A0E27', pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Channel Configuration */}
          <Accordion defaultExpanded sx={{ bgcolor: '#1A1F3A', color: 'white' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00BFA5' }} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon sx={{ color: '#00BFA5' }} />
                <Typography variant="h6">Channel Configuration</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Channel ID"
                    value={channelConfig.channelId}
                    onChange={(e) => setChannelConfig({ ...channelConfig, channelId: e.target.value })}
                    variant="outlined"
                    InputLabelProps={{ style: { color: '#B0BEC5' } }}
                    InputProps={{ style: { color: 'white' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Channel Name"
                    value={channelConfig.channelName}
                    onChange={(e) => setChannelConfig({ ...channelConfig, channelName: e.target.value })}
                    variant="outlined"
                    InputLabelProps={{ style: { color: '#B0BEC5' } }}
                    InputProps={{ style: { color: 'white' } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel sx={{ color: '#B0BEC5' }}>Consensus Type</InputLabel>
                    <Select
                      value={channelConfig.consensusType}
                      onChange={(e) => setChannelConfig({ ...channelConfig, consensusType: e.target.value })}
                      label="Consensus Type"
                      sx={{ color: 'white' }}
                    >
                      <MenuItem value="HyperRAFT++">HyperRAFT++</MenuItem>
                      <MenuItem value="PBFT">PBFT</MenuItem>
                      <MenuItem value="PoS">Proof of Stake</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Target TPS"
                    type="number"
                    value={channelConfig.targetTPS}
                    onChange={(e) => setChannelConfig({ ...channelConfig, targetTPS: parseInt(e.target.value) })}
                    variant="outlined"
                    InputLabelProps={{ style: { color: '#B0BEC5' } }}
                    InputProps={{ style: { color: 'white' } }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Validator Nodes */}
          <Accordion defaultExpanded sx={{ bgcolor: '#1A1F3A', color: 'white' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00BFA5' }} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon sx={{ color: '#FF6B35' }} />
                <Typography variant="h6">Validator Nodes</Typography>
                <Chip label={validatorNodes.length} size="small" color="primary" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {validatorNodes.map((node) => (
                  <ListItem key={node.id} sx={{ bgcolor: '#0A0E27', mb: 1, borderRadius: 1 }}>
                    <ListItemText
                      primary={node.name}
                      secondary={`Stake: ${node.stake.toLocaleString()} | Voting Power: ${node.votingPower}%`}
                      secondaryTypographyProps={{ style: { color: '#B0BEC5' } }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => removeValidatorNode(node.id)} sx={{ color: '#FF6B35' }}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Button
                startIcon={<AddIcon />}
                onClick={addValidatorNode}
                variant="outlined"
                sx={{ mt: 2, color: '#00BFA5', borderColor: '#00BFA5' }}
              >
                Add Validator Node
              </Button>
            </AccordionDetails>
          </Accordion>

          {/* Business Nodes */}
          <Accordion defaultExpanded sx={{ bgcolor: '#1A1F3A', color: 'white' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00BFA5' }} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon sx={{ color: '#FFD700' }} />
                <Typography variant="h6">Business Nodes</Typography>
                <Chip label={businessNodes.length} size="small" color="warning" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {businessNodes.map((node) => (
                  <ListItem key={node.id} sx={{ bgcolor: '#0A0E27', mb: 1, borderRadius: 1 }}>
                    <ListItemText
                      primary={node.name}
                      secondary={`Industry: ${node.industry} | Participants: ${node.participants}`}
                      secondaryTypographyProps={{ style: { color: '#B0BEC5' } }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => removeBusinessNode(node.id)} sx={{ color: '#FF6B35' }}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
              <Button
                startIcon={<AddIcon />}
                onClick={addBusinessNode}
                variant="outlined"
                sx={{ mt: 2, color: '#FFD700', borderColor: '#FFD700' }}
              >
                Add Business Node
              </Button>
            </AccordionDetails>
          </Accordion>

          {/* Slim Nodes with External API Sources */}
          <Accordion defaultExpanded sx={{ bgcolor: '#1A1F3A', color: 'white' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00BFA5' }} />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudQueueIcon sx={{ color: '#4FC3F7' }} />
                <Typography variant="h6">Slim Nodes (External APIs)</Typography>
                <Chip label={slimNodes.length} size="small" color="info" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {slimNodes.map((slimNode) => (
                <Card key={slimNode.id} sx={{ bgcolor: '#0A0E27', mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: 'white' }}>
                        {slimNode.name}
                      </Typography>
                      <IconButton onClick={() => removeSlimNode(slimNode.id)} sx={{ color: '#FF6B35' }}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Typography variant="subtitle2" sx={{ color: '#B0BEC5', mb: 1 }}>
                      External API Sources:
                    </Typography>
                    <List dense>
                      {slimNode.apiSources.map((api) => (
                        <ListItem key={api.id}>
                          <ApiIcon sx={{ mr: 1, color: api.enabled ? '#00BFA5' : '#666' }} />
                          <ListItemText
                            primary={api.name}
                            secondary={`${api.type} - ${api.endpoint}`}
                            secondaryTypographyProps={{ style: { color: '#888', fontSize: '0.75rem' } }}
                          />
                          <Switch
                            edge="end"
                            checked={api.enabled}
                            onChange={() => toggleAPISource(slimNode.id, api.id)}
                            color="success"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addSlimNode}
                variant="outlined"
                sx={{ mt: 2, color: '#4FC3F7', borderColor: '#4FC3F7' }}
              >
                Add Slim Node
              </Button>
            </AccordionDetails>
          </Accordion>

        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: '#1A1F3A', p: 2 }}>
        <Button onClick={onClose} sx={{ color: '#B0BEC5' }}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}>
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NodeConfiguration;

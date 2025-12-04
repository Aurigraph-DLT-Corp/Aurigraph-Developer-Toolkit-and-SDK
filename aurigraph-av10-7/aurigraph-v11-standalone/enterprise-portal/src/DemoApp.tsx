// RWAT Live Demo - Real World Asset Tokenization Demonstration
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Button, Paper, Chip,
  LinearProgress, Alert, Avatar, CircularProgress, Stepper, Step, StepLabel,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from '@mui/material';
import {
  Token, PlayArrow, Pause, Refresh, CheckCircle, Speed, Security,
  AccountTree, ArrowForward, TrendingUp, Add, Visibility, Close
} from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DemoService, DemoRegistration } from './services/DemoService';

const API_BASE = 'https://dlt.aurigraph.io';

interface DemoInstance {
  id: string;
  demoName: string;
  channelName: string;
  status: string;
  validators: number;
  businessNodes: number;
  slimNodes: number;
  transactionCount: number;
  merkleTreeDepth: number;
  createdAt: string;
}

interface TokenizationMetric {
  timestamp: number;
  tokensCreated: number;
  assetsProcessed: number;
}

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 3,
};

const ACCENT_CARD = {
  background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
  borderRadius: 3,
  color: 'white'
};

export const DemoApp: React.FC = () => {
  const navigate = useNavigate();
  const [demos, setDemos] = useState<DemoInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickDemoRunning, setQuickDemoRunning] = useState(false);
  const [quickDemoId, setQuickDemoId] = useState<string | null>(null);
  const [tokenizationData, setTokenizationData] = useState<TokenizationMetric[]>([]);
  const [currentStats, setCurrentStats] = useState({ tokens: 0, assets: 0, tps: 0 });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDemoName, setNewDemoName] = useState('');
  const [message, setMessage] = useState('');

  // Tokenization steps for the demo
  const tokenizationSteps = [
    'Asset Registration',
    'Valuation & Verification',
    'Token Generation',
    'Blockchain Recording',
    'Marketplace Listing'
  ];
  const [activeStep, setActiveStep] = useState(0);

  // Load demos
  const loadDemos = useCallback(async () => {
    try {
      const allDemos = await DemoService.getAllDemos();
      const converted = allDemos.map((d: any) => ({
        ...d,
        validators: Array.isArray(d.validators) ? d.validators.length : d.validators || 0,
        businessNodes: Array.isArray(d.businessNodes) ? d.businessNodes.length : d.businessNodes || 0,
        slimNodes: Array.isArray(d.slimNodes) ? d.slimNodes.length : d.slimNodes || 0,
      }));
      setDemos(converted);

      // Check if quick demo is running
      const runningDemo = converted.find((d: DemoInstance) => d.status === 'RUNNING');
      if (runningDemo && quickDemoId === runningDemo.id) {
        setQuickDemoRunning(true);
      }
    } catch (error) {
      console.error('Failed to load demos:', error);
    }
  }, [quickDemoId]);

  useEffect(() => {
    loadDemos();
    const interval = setInterval(loadDemos, 5000);
    return () => clearInterval(interval);
  }, [loadDemos]);

  // Simulate tokenization metrics when demo is running
  useEffect(() => {
    if (!quickDemoRunning) return;

    const interval = setInterval(() => {
      setTokenizationData(prev => {
        const newData = [...prev.slice(-29), {
          timestamp: Date.now(),
          tokensCreated: Math.floor(Math.random() * 50) + 20,
          assetsProcessed: Math.floor(Math.random() * 10) + 5
        }];
        return newData;
      });

      setCurrentStats(prev => ({
        tokens: prev.tokens + Math.floor(Math.random() * 30) + 10,
        assets: prev.assets + Math.floor(Math.random() * 5) + 1,
        tps: Math.floor(Math.random() * 500) + 200
      }));

      // Progress through tokenization steps
      setActiveStep(prev => (prev + 1) % 5);
    }, 2000);

    return () => clearInterval(interval);
  }, [quickDemoRunning]);

  // One-click quick demo
  const startQuickDemo = async () => {
    setLoading(true);
    setMessage('');
    try {
      // Create a quick demo with defaults
      const registration: DemoRegistration = {
        demoName: `RWAT-Demo-${Date.now().toString(36)}`,
        channelName: `rwat-channel-${Date.now().toString(36)}`,
        validators: 3,
        businessNodes: 2,
        slimNodes: 5
      };

      const newDemo = await DemoService.registerDemo(registration);
      await DemoService.startDemo(newDemo.id);
      setQuickDemoId(newDemo.id);
      setQuickDemoRunning(true);
      setCurrentStats({ tokens: 0, assets: 0, tps: 0 });
      setTokenizationData([]);
      setActiveStep(0);
      setMessage('Demo started! Watch live tokenization in action.');
      loadDemos();
    } catch (error) {
      console.error('Failed to start quick demo:', error);
      setMessage('Failed to start demo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stopQuickDemo = async () => {
    if (!quickDemoId) return;
    try {
      await DemoService.stopDemo(quickDemoId);
      setQuickDemoRunning(false);
      setMessage('Demo stopped.');
      loadDemos();
    } catch (error) {
      console.error('Failed to stop demo:', error);
    }
  };

  const createCustomDemo = async () => {
    if (!newDemoName.trim()) return;
    setLoading(true);
    try {
      const registration: DemoRegistration = {
        demoName: newDemoName,
        channelName: `channel-${newDemoName.toLowerCase().replace(/\s+/g, '-')}`,
        validators: 3,
        businessNodes: 2,
        slimNodes: 5
      };
      await DemoService.registerDemo(registration);
      setCreateDialogOpen(false);
      setNewDemoName('');
      setMessage('Demo created successfully!');
      loadDemos();
    } catch (error) {
      console.error('Failed to create demo:', error);
      setMessage('Failed to create demo.');
    } finally {
      setLoading(false);
    }
  };

  const runningDemos = demos.filter(d => d.status === 'RUNNING');
  const totalTokens = demos.reduce((sum, d) => sum + (d.transactionCount || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      {/* Hero Section */}
      <Paper sx={{ ...ACCENT_CARD, p: 4, mb: 4 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
              RWAT Live Demo
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 3, fontWeight: 400 }}>
              Experience Real World Asset Tokenization in action. One click to start
              tokenizing assets on Aurigraph's enterprise blockchain.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {!quickDemoRunning ? (
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: '#1E40AF',
                    fontWeight: 700,
                    px: 4,
                    fontSize: '1rem',
                    '&:hover': { bgcolor: '#f0f4ff', color: '#1E40AF' },
                    '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.7)', color: '#1E40AF' }
                  }}
                  onClick={startQuickDemo}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                  disabled={loading}
                >
                  {loading ? 'Starting...' : 'Start Demo'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600, px: 4 }}
                  onClick={stopQuickDemo}
                  startIcon={<Pause />}
                >
                  Stop Demo
                </Button>
              )}
              <Button
                variant="outlined"
                size="large"
                sx={{ borderColor: 'white', color: 'white', fontWeight: 600, px: 4 }}
                onClick={() => navigate('/rwa/tokenize')}
                startIcon={<Token />}
              >
                Tokenize Real Asset
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{ borderColor: 'white', color: 'white', fontWeight: 600, px: 4 }}
                onClick={() => navigate('/demo/high-throughput')}
                startIcon={<Speed />}
              >
                High Throughput Demo
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>{currentStats.tokens}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Tokens Created</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>{currentStats.assets}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Assets Processed</Typography>
              </Box>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>{currentStats.tps}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>TPS</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {message && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      {/* Live Tokenization Progress */}
      {quickDemoRunning && (
        <Card sx={{ ...CARD_STYLE, mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              Live Tokenization Pipeline
            </Typography>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
              {tokenizationSteps.map((label, index) => (
                <Step key={label} completed={index < activeStep}>
                  <StepLabel sx={{
                    '& .MuiStepLabel-label': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiStepLabel-label.Mui-active': { color: '#2563EB' },
                    '& .MuiStepLabel-label.Mui-completed': { color: '#4ECDC4' }
                  }}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
              Real-time Tokenization Rate
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={tokenizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                  stroke="rgba(255,255,255,0.5)"
                />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{ background: '#1A1F3A', border: '1px solid rgba(255,255,255,0.1)' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="tokensCreated" stroke="#2563EB" fill="#2563EB" fillOpacity={0.3} name="Tokens Created" />
                <Area type="monotone" dataKey="assetsProcessed" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.3} name="Assets Processed" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#2563EB20', color: '#2563EB', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <PlayArrow sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#2563EB', fontWeight: 700 }}>{runningDemos.length}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Active Demos</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#4ECDC420', color: '#4ECDC4', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <Token sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 700 }}>{totalTokens}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Tokens</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#FFD93D20', color: '#FFD93D', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <AccountTree sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#FFD93D', fontWeight: 700 }}>{demos.length}</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Demo Channels</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Avatar sx={{ bgcolor: '#9B59B620', color: '#9B59B6', width: 56, height: 56, mx: 'auto', mb: 2 }}>
                <Security sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="h4" sx={{ color: '#9B59B6', fontWeight: 700 }}>100%</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Quantum Secure</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Demo Instances */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>Demo Channels</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadDemos}
              sx={{ color: '#2563EB', borderColor: '#2563EB' }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{ bgcolor: '#2563EB' }}
            >
              Create Demo
            </Button>
          </Box>
        </Box>

        {demos.length === 0 ? (
          <Card sx={{ ...CARD_STYLE, p: 4, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
              No demos yet
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 3 }}>
              Click "Start Demo" above to create your first RWAT tokenization demo
            </Typography>
            <Button
              variant="contained"
              onClick={startQuickDemo}
              startIcon={<PlayArrow />}
              sx={{ bgcolor: '#2563EB' }}
            >
              Start Your First Demo
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {demos.slice(0, 6).map((demo) => (
              <Grid item xs={12} md={4} key={demo.id}>
                <Card sx={{ ...CARD_STYLE, '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.2s' } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ color: '#fff' }} noWrap>
                        {demo.demoName}
                      </Typography>
                      <Chip
                        label={demo.status}
                        size="small"
                        sx={{
                          bgcolor: demo.status === 'RUNNING' ? '#2563EB20' : 'rgba(255,255,255,0.1)',
                          color: demo.status === 'RUNNING' ? '#2563EB' : 'rgba(255,255,255,0.6)'
                        }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Validators</Typography>
                        <Typography variant="body2" sx={{ color: '#4ECDC4' }}>{demo.validators}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Business</Typography>
                        <Typography variant="body2" sx={{ color: '#FFD93D' }}>{demo.businessNodes}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Slim</Typography>
                        <Typography variant="body2" sx={{ color: '#9B59B6' }}>{demo.slimNodes}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Tokens</Typography>
                        <Typography variant="body2" sx={{ color: '#2563EB' }}>{demo.transactionCount || 0}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {demo.status !== 'RUNNING' ? (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={() => DemoService.startDemo(demo.id).then(loadDemos)}
                          sx={{ bgcolor: '#2563EB', flex: 1 }}
                        >
                          Start
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Pause />}
                          onClick={() => DemoService.stopDemo(demo.id).then(loadDemos)}
                          sx={{ color: '#FFD93D', borderColor: '#FFD93D', flex: 1 }}
                        >
                          Stop
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/demo/${demo.id}`)}
                        sx={{ color: '#4ECDC4', borderColor: '#4ECDC4' }}
                      >
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* What You Can Tokenize */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>What Can Be Tokenized</Typography>
        <Grid container spacing={2}>
          {[
            { name: 'Real Estate', icon: '🏢', desc: 'Commercial & residential properties' },
            { name: 'Commodities', icon: '🥇', desc: 'Gold, silver, oil, and more' },
            { name: 'Art & Collectibles', icon: '🎨', desc: 'Fine art and rare collectibles' },
            { name: 'Carbon Credits', icon: '🌱', desc: 'Environmental offset tokens' },
            { name: 'IP & Patents', icon: '💡', desc: 'Intellectual property rights' },
            { name: 'Financial Assets', icon: '📊', desc: 'Bonds, securities, and funds' },
          ].map((cat) => (
            <Grid item xs={6} sm={4} md={2} key={cat.name}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                }}
                onClick={() => navigate('/rwa/tokenize')}
              >
                <Typography variant="h4" sx={{ mb: 1 }}>{cat.icon}</Typography>
                <Typography variant="body2" sx={{ color: '#2563EB', fontWeight: 600 }}>{cat.name}</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{cat.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA */}
      <Card sx={{ ...ACCENT_CARD, p: 3 }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Ready to tokenize real assets?
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Move beyond the demo. Start tokenizing your real-world assets with full compliance and instant settlement.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
            <Button
              variant="contained"
              size="large"
              sx={{ bgcolor: 'white', color: '#1E40AF', fontWeight: 600, px: 4 }}
              onClick={() => navigate('/rwa/tokenize')}
              endIcon={<ArrowForward />}
            >
              Tokenize Now
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Create Demo Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>
          Create New Demo
          <IconButton
            onClick={() => setCreateDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Demo Name"
            value={newDemoName}
            onChange={(e) => setNewDemoName(e.target.value)}
            placeholder="e.g., Real Estate Demo"
            margin="normal"
          />
          <Typography variant="caption" color="text.secondary">
            Default: 3 validators, 2 business nodes, 5 slim nodes
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={createCustomDemo}
            disabled={!newDemoName.trim() || loading}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DemoApp;

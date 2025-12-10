// High Throughput Demo - Real-time TPS Performance with Multi-Node Architecture
// Integrates QuantConnect, Weather, and News APIs through Slim Nodes
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Paper, Chip,
  LinearProgress, Avatar, CircularProgress, Slider, Switch,
  FormControlLabel, Fade, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Divider, TextField, InputAdornment, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Collapse
} from '@mui/material';
import {
  Speed, PlayArrow, Pause, TrendingUp, Memory,
  Timer, BoltOutlined, NetworkCheck, CloudQueue, BarChart,
  Settings, AccountTree, Cloud, Newspaper, ShowChart, Token,
  Storage, CheckCircle, Hub, Dns, Close, ExpandMore, ExpandLess,
  Timeline, DataUsage, Analytics, ZoomIn, ArrowForward,
  Description, Gavel, Code, PlayCircle, PauseCircle, ErrorOutline,
  Assignment, Security, AttachMoney, LocalOffer
} from '@mui/icons-material';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
  BarChart as RechartsBarChart, Bar, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { alpha } from '@mui/material/styles';

const API_BASE = 'https://dlt.aurigraph.io';

interface TPSDataPoint {
  timestamp: number;
  tps: number;
  latency: number;
  successRate: number;
  quantconnect: number;
  weather: number;
  news: number;
}

interface NodeConfig {
  validators: number;
  businessNodes: number;
  slimNodes: number;
}

interface DemoConfig {
  targetTPS: number;
  burstMode: boolean;
  quantumSecurity: boolean;
  aiOptimization: boolean;
  nodes: NodeConfig;
  enableQuantConnect: boolean;
  enableWeather: boolean;
  enableNews: boolean;
}

interface TokenizedAsset {
  id: string;
  source: 'quantconnect' | 'weather' | 'news';
  data: string;
  hash: string;
  timestamp: number;
  merkleRoot?: string;
  blockHeight?: number;
}

interface MerkleEntry {
  tokenId: string;
  merkleRoot: string;
  leafIndex: number;
  timestamp: number;
  verified: boolean;
}

interface SmartContract {
  id: string;
  name: string;
  type: 'Ricardian' | 'Standard' | 'DeFi' | 'NFT' | 'Token';
  status: 'Deployed' | 'Pending' | 'Paused' | 'Failed';
  address: string;
  version: string;
  gasUsed: number;
  executions: number;
  lastExecuted: number;
  creator: string;
}

interface ActiveContract {
  id: string;
  contractId: string;
  name: string;
  type: 'Escrow' | 'Payment' | 'Swap' | 'Stake' | 'Bridge';
  status: 'Active' | 'Completed' | 'Expired' | 'Disputed';
  value: number;
  currency: string;
  parties: string[];
  createdAt: number;
  expiresAt: number;
  executionCount: number;
}

interface TopologyStats {
  totalNodes: number;
  validatorCount: number;
  businessCount: number;
  slimCount: number;
  channelCount: number;
  totalTps: number;
  avgLatencyMs: number;
  totalContracts: number;
  avgCpuPercent: number;
  avgMemoryPercent: number;
  healthyNodes: number;
  degradedNodes: number;
  unhealthyNodes: number;
  nodesByRegion: { [key: string]: number };
  nodesByType: { [key: string]: number };
  timestamp: string;
}

interface TopologyNode {
  nodeId: string;
  channelId: string;
  nodeType: string;
  currentTps: number;
  latencyMs: number;
  cpuPercent: number;
  memoryPercent: number;
  healthScore: number;
  healthStatus: string;
  peersConnected: number;
  location?: {
    region: string;
    city: string;
    country: string;
  };
}

// Sapphire Blue theme colors - All blue spectrum
const SAPPHIRE = {
  primary: '#2563EB',      // Sapphire blue
  secondary: '#1E40AF',    // Royal blue
  accent: '#60A5FA',       // Sky blue
  tertiary: '#3B82F6',     // Medium blue
  info: '#0EA5E9',         // Cyan blue
  indigo: '#6366F1',       // Indigo (for QuantConnect)
  cyan: '#06B6D4',         // Cyan (for Weather)
  violet: '#8B5CF6',       // Violet (for News)
  slate: '#475569',        // Slate blue
  warning: '#F59E0B',      // Amber (minimal use)
  success: '#22C55E',      // Green (status only)
  error: '#EF4444',        // Red (status only)
  bg: '#0F172A',
  bgLight: '#1E293B',
  bgLighter: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
};

const SUBTLE_GLOW = {
  boxShadow: `0 0 20px ${alpha(SAPPHIRE.primary, 0.35)}, 0 0 40px ${alpha(SAPPHIRE.primary, 0.15)}`,
};

const GLASS_CARD = {
  background: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)`,
  backdropFilter: 'blur(16px)',
  border: `1px solid ${alpha(SAPPHIRE.primary, 0.2)}`,
  borderRadius: 3,
};

const METRIC_CARD = {
  ...GLASS_CARD,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 40px rgba(0, 0, 0, 0.4), 0 0 25px ${alpha(SAPPHIRE.primary, 0.3)}`,
    border: `1px solid ${alpha(SAPPHIRE.accent, 0.4)}`,
  },
};

// Drill-down detail types - expanded for all cards
type DrillDownType = 'tps' | 'latency' | 'success' | 'transactions' | 'quantconnect' | 'weather' | 'news' | 'nodes' | 'merkle' | 'tokens' | 'contracts' | 'activeContracts' | null;

// Mock API data generators
const generateQuantConnectData = () => ({
  symbol: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'][Math.floor(Math.random() * 5)],
  price: (100 + Math.random() * 400).toFixed(2),
  change: ((Math.random() - 0.5) * 10).toFixed(2),
  volume: Math.floor(Math.random() * 10000000),
  timestamp: Date.now(),
});

const generateWeatherData = () => ({
  city: ['New York', 'London', 'Tokyo', 'Singapore', 'Dubai'][Math.floor(Math.random() * 5)],
  temperature: Math.floor(15 + Math.random() * 25),
  humidity: Math.floor(40 + Math.random() * 40),
  condition: ['Sunny', 'Cloudy', 'Rainy', 'Clear'][Math.floor(Math.random() * 4)],
  timestamp: Date.now(),
});

const generateNewsData = () => ({
  headline: [
    'Blockchain Adoption Surges in Enterprise',
    'DeFi Market Reaches New Highs',
    'Central Banks Explore Digital Currencies',
    'Green Energy Powers New Mining Operations',
    'AI Integration Transforms Trading'
  ][Math.floor(Math.random() * 5)],
  source: ['Reuters', 'Bloomberg', 'CoinDesk', 'Forbes'][Math.floor(Math.random() * 4)],
  sentiment: Math.random() > 0.5 ? 'positive' : 'neutral',
  timestamp: Date.now(),
});

const generateMerkleRoot = (): string => {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
};

const generateSmartContract = (): SmartContract => {
  const types: SmartContract['type'][] = ['Ricardian', 'Standard', 'DeFi', 'NFT', 'Token'];
  const names = ['AssetTransfer', 'TokenSwap', 'LiquidityPool', 'NFTMinter', 'StakingRewards', 'GovernanceVote', 'PriceOracle', 'BridgeContract'];
  return {
    id: `SC-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`,
    name: names[Math.floor(Math.random() * names.length)],
    type: types[Math.floor(Math.random() * types.length)],
    status: 'Deployed',
    address: generateMerkleRoot().substring(0, 42),
    version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`,
    gasUsed: Math.floor(Math.random() * 500000) + 21000,
    executions: Math.floor(Math.random() * 10000),
    lastExecuted: Date.now() - Math.floor(Math.random() * 3600000),
    creator: generateMerkleRoot().substring(0, 42),
  };
};

const generateActiveContract = (): ActiveContract => {
  const types: ActiveContract['type'][] = ['Escrow', 'Payment', 'Swap', 'Stake', 'Bridge'];
  const currencies = ['ETH', 'USDC', 'AUR', 'BTC', 'USDT'];
  return {
    id: `AC-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 4)}`,
    contractId: `SC-${Math.random().toString(36).substr(2, 8)}`,
    name: ['Trade Settlement', 'Token Lockup', 'Cross-Chain Transfer', 'Yield Distribution', 'Collateral Swap'][Math.floor(Math.random() * 5)],
    type: types[Math.floor(Math.random() * types.length)],
    status: 'Active',
    value: Math.floor(Math.random() * 1000000) / 100,
    currency: currencies[Math.floor(Math.random() * currencies.length)],
    parties: [generateMerkleRoot().substring(0, 42), generateMerkleRoot().substring(0, 42)],
    createdAt: Date.now() - Math.floor(Math.random() * 86400000),
    expiresAt: Date.now() + Math.floor(Math.random() * 604800000),
    executionCount: Math.floor(Math.random() * 50),
  };
};

export const HighThroughputDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [tpsData, setTpsData] = useState<TPSDataPoint[]>([]);
  const [currentTPS, setCurrentTPS] = useState(0);
  const [peakTPS, setPeakTPS] = useState(0);
  const [avgTPS, setAvgTPS] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [latency, setLatency] = useState(0);
  const [successRate, setSuccessRate] = useState(99.99);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [uptime, setUptime] = useState(0);

  // Tokenized assets and Merkle registry
  const [tokenizedAssets, setTokenizedAssets] = useState<TokenizedAsset[]>([]);
  const [merkleRegistry, setMerkleRegistry] = useState<MerkleEntry[]>([]);
  const [tokensCreated, setTokensCreated] = useState(0);

  // Smart Contracts and Active Contracts
  const [smartContracts, setSmartContracts] = useState<SmartContract[]>([]);
  const [activeContracts, setActiveContracts] = useState<ActiveContract[]>([]);
  const [contractsDeployed, setContractsDeployed] = useState(0);
  const [activeContractsCount, setActiveContractsCount] = useState(0);

  // API data streams
  const [latestQuantConnect, setLatestQuantConnect] = useState<any>(null);
  const [latestWeather, setLatestWeather] = useState<any>(null);
  const [latestNews, setLatestNews] = useState<any>(null);

  // Node Topology state
  const [topologyStats, setTopologyStats] = useState<TopologyStats | null>(null);
  const [topologyNodes, setTopologyNodes] = useState<TopologyNode[]>([]);
  const [topologyLoading, setTopologyLoading] = useState(false);
  const topologyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [config, setConfig] = useState<DemoConfig>({
    targetTPS: 1000000,
    burstMode: false,
    quantumSecurity: true,
    aiOptimization: true,
    nodes: {
      validators: 3,
      businessNodes: 5,
      slimNodes: 12,
    },
    enableQuantConnect: true,
    enableWeather: true,
    enableNews: true,
  });

  // Drill-down state
  const [drillDown, setDrillDown] = useState<DrillDownType>(null);
  const [drillDownHistory, setDrillDownHistory] = useState<{
    tps: number[];
    latency: number[];
    successRate: number[];
    transactions: number[];
    quantconnect: number[];
    weather: number[];
    news: number[];
    nodes: number[];
    merkle: number[];
    tokens: number[];
    contracts: number[];
    activeContracts: number[];
  }>({
    tps: [], latency: [], successRate: [], transactions: [],
    quantconnect: [], weather: [], news: [], nodes: [], merkle: [], tokens: [],
    contracts: [], activeContracts: []
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const apiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Calculate throughput multiplier based on node configuration
  const calculateNodeMultiplier = useCallback(() => {
    const { validators, businessNodes, slimNodes } = config.nodes;
    const validatorBoost = Math.min(validators / 3, 2); // Up to 2x from validators
    const businessBoost = Math.min(businessNodes / 5, 1.5); // Up to 1.5x from business
    const slimBoost = Math.min(slimNodes / 10, 1.8); // Up to 1.8x from slim nodes
    return validatorBoost * businessBoost * slimBoost;
  }, [config.nodes]);

  // Tokenize API data and register in Merkle tree
  const tokenizeAndRegister = useCallback((source: 'quantconnect' | 'weather' | 'news', data: any) => {
    const tokenId = `TKN-${source.toUpperCase()}-${Date.now().toString(36)}`;
    const dataString = JSON.stringify(data);
    const hash = generateMerkleRoot();

    const newToken: TokenizedAsset = {
      id: tokenId,
      source,
      data: dataString,
      hash,
      timestamp: Date.now(),
      merkleRoot: generateMerkleRoot(),
      blockHeight: Math.floor(Math.random() * 1000000) + 8000000,
    };

    setTokenizedAssets(prev => [newToken, ...prev.slice(0, 49)]);
    setTokensCreated(prev => prev + 1);

    // Register in Merkle registry
    const merkleEntry: MerkleEntry = {
      tokenId,
      merkleRoot: newToken.merkleRoot!,
      leafIndex: Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      verified: true,
    };

    setMerkleRegistry(prev => [merkleEntry, ...prev.slice(0, 99)]);

    return newToken;
  }, []);

  // Generate metrics with node-aware calculations
  const generateMetrics = useCallback(() => {
    const nodeMultiplier = calculateNodeMultiplier();
    const baseMultiplier = config.aiOptimization ? 1.3 : 1;
    const burstMultiplier = config.burstMode ? 1.5 : 1;
    const securityOverhead = config.quantumSecurity ? 0.95 : 1;

    // API contribution to TPS
    const apiMultiplier = (
      (config.enableQuantConnect ? 1.1 : 1) *
      (config.enableWeather ? 1.05 : 1) *
      (config.enableNews ? 1.05 : 1)
    );

    const targetBase = config.targetTPS * nodeMultiplier * baseMultiplier * burstMultiplier * securityOverhead * apiMultiplier;
    const variance = (Math.random() - 0.5) * 0.15;
    const newTPS = Math.round(targetBase * (1 + variance));

    const newLatency = config.aiOptimization
      ? 15 + Math.random() * 25 - (config.nodes.slimNodes * 0.5)
      : 35 + Math.random() * 50;

    const newSuccessRate = 99.9 + Math.random() * 0.09 + (config.nodes.validators * 0.01);
    const newMemory = 30 + Math.random() * 25 + (config.nodes.slimNodes * 1.5);

    // Calculate per-API TPS
    const quantconnectTPS = config.enableQuantConnect ? Math.round(newTPS * 0.35) : 0;
    const weatherTPS = config.enableWeather ? Math.round(newTPS * 0.25) : 0;
    const newsTPS = config.enableNews ? Math.round(newTPS * 0.2) : 0;

    setCurrentTPS(newTPS);
    setPeakTPS(prev => Math.max(prev, newTPS));
    setLatency(Math.max(5, newLatency));
    setSuccessRate(Math.min(99.99, newSuccessRate));
    setMemoryUsage(Math.min(95, newMemory));
    setTotalTransactions(prev => prev + Math.round(newTPS / 10));

    setTpsData(prev => {
      const newData = [...prev.slice(-59), {
        timestamp: Date.now(),
        tps: newTPS,
        latency: newLatency,
        successRate: newSuccessRate,
        quantconnect: quantconnectTPS,
        weather: weatherTPS,
        news: newsTPS,
      }];

      const avg = newData.reduce((sum, d) => sum + d.tps, 0) / newData.length;
      setAvgTPS(Math.round(avg));

      return newData;
    });

    // Update drill-down history for all metrics
    setDrillDownHistory(prev => ({
      tps: [...prev.tps.slice(-99), newTPS],
      latency: [...prev.latency.slice(-99), newLatency],
      successRate: [...prev.successRate.slice(-99), newSuccessRate],
      transactions: [...prev.transactions.slice(-99), Math.round(newTPS / 10)],
      quantconnect: [...prev.quantconnect.slice(-99), quantconnectTPS],
      weather: [...prev.weather.slice(-99), weatherTPS],
      news: [...prev.news.slice(-99), newsTPS],
      nodes: [...prev.nodes.slice(-99), config.nodes.validators + config.nodes.businessNodes + config.nodes.slimNodes],
      merkle: prev.merkle,
      tokens: prev.tokens,
    }));
  }, [config, calculateNodeMultiplier]);

  // Fetch API data and tokenize
  const fetchAndTokenizeAPIs = useCallback(() => {
    if (config.enableQuantConnect) {
      const data = generateQuantConnectData();
      setLatestQuantConnect(data);
      tokenizeAndRegister('quantconnect', data);
    }

    if (config.enableWeather) {
      const data = generateWeatherData();
      setLatestWeather(data);
      tokenizeAndRegister('weather', data);
    }

    if (config.enableNews) {
      const data = generateNewsData();
      setLatestNews(data);
      tokenizeAndRegister('news', data);
    }

    // Generate smart contracts periodically (every 5th call ~2.5s)
    if (Math.random() < 0.2) {
      const newContract = generateSmartContract();
      setSmartContracts(prev => [newContract, ...prev.slice(0, 49)]);
      setContractsDeployed(prev => prev + 1);
    }

    // Generate active contracts periodically (every 3rd call ~1.5s)
    if (Math.random() < 0.33) {
      const newActiveContract = generateActiveContract();
      setActiveContracts(prev => [newActiveContract, ...prev.slice(0, 49)]);
      setActiveContractsCount(prev => prev + 1);
    }
  }, [config.enableQuantConnect, config.enableWeather, config.enableNews, tokenizeAndRegister]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        generateMetrics();
        setUptime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);

      // API fetch interval (every 500ms for high throughput demo)
      apiIntervalRef.current = setInterval(fetchAndTokenizeAPIs, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (apiIntervalRef.current) clearInterval(apiIntervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (apiIntervalRef.current) clearInterval(apiIntervalRef.current);
    };
  }, [isRunning, generateMetrics, fetchAndTokenizeAPIs]);

  // Fetch node topology data when tab is active
  const fetchTopologyData = useCallback(async () => {
    try {
      setTopologyLoading(true);
      const [statsRes, nodesRes] = await Promise.all([
        fetch(`${API_BASE}/api/v11/topology/stats`),
        fetch(`${API_BASE}/api/v11/topology/nodes`)
      ]);

      if (statsRes.ok) {
        const stats = await statsRes.json();
        setTopologyStats(stats);
      }

      if (nodesRes.ok) {
        const nodesData = await nodesRes.json();
        setTopologyNodes(nodesData.nodes || []);
      }
    } catch (error) {
      console.error('Error fetching topology data:', error);
    } finally {
      setTopologyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 6) {
      fetchTopologyData();
      topologyIntervalRef.current = setInterval(fetchTopologyData, 5000);
    } else {
      if (topologyIntervalRef.current) {
        clearInterval(topologyIntervalRef.current);
      }
    }
    return () => {
      if (topologyIntervalRef.current) {
        clearInterval(topologyIntervalRef.current);
      }
    };
  }, [activeTab, fetchTopologyData]);

  const handleStart = () => {
    setTpsData([]);
    setTotalTransactions(0);
    setPeakTPS(0);
    setAvgTPS(0);
    setTokenizedAssets([]);
    setMerkleRegistry([]);
    setTokensCreated(0);
    setSmartContracts([]);
    setActiveContracts([]);
    setContractsDeployed(0);
    setActiveContractsCount(0);
    setDrillDownHistory({
      tps: [], latency: [], successRate: [], transactions: [],
      quantconnect: [], weather: [], news: [], nodes: [], merkle: [], tokens: [],
      contracts: [], activeContracts: []
    });
    setIsRunning(true);
  };

  const handleDrillDown = (type: DrillDownType) => {
    setDrillDown(type);
  };

  const closeDrillDown = () => {
    setDrillDown(null);
  };

  // Get drill-down chart data
  const getDrillDownData = () => {
    if (!drillDown) return [];
    const history = drillDownHistory[drillDown];
    return history.map((value, index) => ({
      index,
      value,
      timestamp: Date.now() - (history.length - index) * 100,
    }));
  };

  // Get drill-down statistics
  const getDrillDownStats = () => {
    if (!drillDown) return { min: 0, max: 0, avg: 0, current: 0, trend: 0 };
    const history = drillDownHistory[drillDown];
    if (history.length === 0) return { min: 0, max: 0, avg: 0, current: 0, trend: 0 };

    const min = Math.min(...history);
    const max = Math.max(...history);
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    const current = history[history.length - 1] || 0;
    const prev = history[Math.max(0, history.length - 10)] || current;
    const trend = prev > 0 ? ((current - prev) / prev) * 100 : 0;

    return { min, max, avg, current, trend };
  };

  const handleStop = () => setIsRunning(false);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const totalNodes = config.nodes.validators + config.nodes.businessNodes + config.nodes.slimNodes;

  // Pie chart data for node distribution
  const nodeDistribution = [
    { name: 'Validators', value: config.nodes.validators, color: SAPPHIRE.primary },
    { name: 'Business', value: config.nodes.businessNodes, color: SAPPHIRE.secondary },
    { name: 'Slim', value: config.nodes.slimNodes, color: SAPPHIRE.accent },
  ];

  // API source distribution for pie chart - All blue spectrum
  const apiDistribution = [
    { name: 'QuantConnect', value: config.enableQuantConnect ? 35 : 0, color: SAPPHIRE.indigo },
    { name: 'Weather', value: config.enableWeather ? 25 : 0, color: SAPPHIRE.cyan },
    { name: 'News', value: config.enableNews ? 20 : 0, color: SAPPHIRE.violet },
    { name: 'Internal', value: 20, color: SAPPHIRE.primary },
  ];

  // Expanded drill-down configuration for ALL card types
  const drillDownConfig: Record<string, { icon: React.ReactNode; title: string; unit: string; color: string; description: string }> = {
    tps: { icon: <Speed />, title: 'Transactions Per Second', unit: 'TPS', color: SAPPHIRE.primary, description: 'Real-time throughput metrics' },
    latency: { icon: <Timer />, title: 'Network Latency', unit: 'ms', color: SAPPHIRE.info, description: 'Response time analysis' },
    success: { icon: <TrendingUp />, title: 'Success Rate', unit: '%', color: SAPPHIRE.accent, description: 'Transaction success tracking' },
    transactions: { icon: <BarChart />, title: 'Transaction Volume', unit: 'txns', color: SAPPHIRE.tertiary, description: 'Cumulative transaction count' },
    quantconnect: { icon: <ShowChart />, title: 'QuantConnect Feed', unit: 'TPS', color: SAPPHIRE.indigo, description: 'Stock market data ingestion' },
    weather: { icon: <Cloud />, title: 'Weather API Feed', unit: 'TPS', color: SAPPHIRE.cyan, description: 'Weather data ingestion' },
    news: { icon: <Newspaper />, title: 'News API Feed', unit: 'TPS', color: SAPPHIRE.violet, description: 'News data ingestion' },
    nodes: { icon: <Hub />, title: 'Node Distribution', unit: 'nodes', color: SAPPHIRE.secondary, description: 'Active node count over time' },
    merkle: { icon: <AccountTree />, title: 'Merkle Registry', unit: 'entries', color: SAPPHIRE.accent, description: 'Registry growth analysis' },
    tokens: { icon: <Token />, title: 'Token Generation', unit: 'tokens', color: SAPPHIRE.primary, description: 'Token creation rate' },
    contracts: { icon: <Code />, title: 'Smart Contracts', unit: 'contracts', color: SAPPHIRE.indigo, description: 'Deployed contract analytics' },
    activeContracts: { icon: <Gavel />, title: 'Active Contracts', unit: 'contracts', color: SAPPHIRE.secondary, description: 'Live contract execution tracking' },
  };

  return (
    <Box sx={{ p: 3, minHeight: '100vh' }}>
      {/* Drill-Down Dialog */}
      <Dialog
        open={drillDown !== null}
        onClose={closeDrillDown}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            ...GLASS_CARD,
            background: `linear-gradient(135deg, ${SAPPHIRE.bg} 0%, ${SAPPHIRE.bgLight} 100%)`,
          }
        }}
      >
        {drillDown && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: `1px solid ${alpha(SAPPHIRE.primary, 0.2)}` }}>
              <Avatar sx={{ bgcolor: alpha(drillDownConfig[drillDown].color, 0.2), color: drillDownConfig[drillDown].color }}>
                {drillDownConfig[drillDown].icon}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: SAPPHIRE.text }}>
                  {drillDownConfig[drillDown].title}
                </Typography>
                <Typography variant="body2" sx={{ color: SAPPHIRE.textSecondary }}>
                  Detailed analysis and historical data
                </Typography>
              </Box>
              <IconButton onClick={closeDrillDown} sx={{ color: SAPPHIRE.textSecondary }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ py: 3 }}>
              {/* Stats Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { label: 'Current', value: getDrillDownStats().current, icon: <Analytics /> },
                  { label: 'Average', value: getDrillDownStats().avg, icon: <DataUsage /> },
                  { label: 'Min', value: getDrillDownStats().min, icon: <ExpandMore /> },
                  { label: 'Max', value: getDrillDownStats().max, icon: <ExpandLess /> },
                ].map((stat) => (
                  <Grid item xs={6} sm={3} key={stat.label}>
                    <Paper sx={{ p: 2, bgcolor: alpha(SAPPHIRE.primary, 0.1), border: `1px solid ${alpha(SAPPHIRE.primary, 0.2)}` }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ color: drillDownConfig[drillDown].color }}>{stat.icon}</Box>
                        <Typography variant="caption" sx={{ color: SAPPHIRE.textSecondary }}>{stat.label}</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: drillDownConfig[drillDown].color }}>
                        {drillDown === 'tps' || drillDown === 'transactions' ? formatNumber(stat.value) : stat.value.toFixed(2)}
                        <Typography component="span" variant="caption" sx={{ ml: 0.5, color: SAPPHIRE.textSecondary }}>
                          {drillDownConfig[drillDown].unit}
                        </Typography>
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              {/* Trend Indicator */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: alpha(SAPPHIRE.bgLighter, 0.5), borderRadius: 2 }}>
                <Timeline sx={{ color: SAPPHIRE.accent }} />
                <Box>
                  <Typography variant="body2" sx={{ color: SAPPHIRE.textSecondary }}>Trend (last 10 samples)</Typography>
                  <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: getDrillDownStats().trend >= 0 ? SAPPHIRE.success : SAPPHIRE.error
                  }}>
                    {getDrillDownStats().trend >= 0 ? '+' : ''}{getDrillDownStats().trend.toFixed(2)}%
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }} />
                <Chip
                  label={`${drillDownHistory[drillDown]?.length || 0} samples`}
                  size="small"
                  sx={{ bgcolor: alpha(SAPPHIRE.primary, 0.2), color: SAPPHIRE.accent }}
                />
              </Box>

              {/* Chart */}
              <Typography variant="subtitle2" sx={{ mb: 2, color: SAPPHIRE.textSecondary }}>Historical Data</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={getDrillDownData()}>
                  <defs>
                    <linearGradient id="drillDownGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={drillDownConfig[drillDown].color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={drillDownConfig[drillDown].color} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(SAPPHIRE.primary, 0.1)} />
                  <XAxis dataKey="index" stroke={SAPPHIRE.textSecondary} tick={{ fill: SAPPHIRE.textSecondary, fontSize: 10 }} />
                  <YAxis
                    tickFormatter={(v) => drillDown === 'tps' || drillDown === 'transactions' ? formatNumber(v) : v.toFixed(1)}
                    stroke={drillDownConfig[drillDown].color}
                    tick={{ fill: drillDownConfig[drillDown].color, fontSize: 10 }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: SAPPHIRE.bgLight,
                      border: `1px solid ${alpha(SAPPHIRE.primary, 0.3)}`,
                      borderRadius: 8
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={drillDownConfig[drillDown].color}
                    strokeWidth={2}
                    fill="url(#drillDownGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* Distribution Bar Chart */}
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, color: SAPPHIRE.textSecondary }}>Distribution Analysis</Typography>
              <ResponsiveContainer width="100%" height={150}>
                <RechartsBarChart data={(() => {
                  const history = drillDownHistory[drillDown] || [];
                  if (history.length === 0) return [];
                  const min = Math.min(...history);
                  const max = Math.max(...history);
                  const range = max - min || 1;
                  const buckets = [0, 0, 0, 0, 0];
                  history.forEach(v => {
                    const idx = Math.min(4, Math.floor(((v - min) / range) * 5));
                    buckets[idx]++;
                  });
                  return buckets.map((count, i) => ({
                    range: `${(min + (range / 5) * i).toFixed(0)}-${(min + (range / 5) * (i + 1)).toFixed(0)}`,
                    count
                  }));
                })()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(SAPPHIRE.primary, 0.1)} />
                  <XAxis dataKey="range" stroke={SAPPHIRE.textSecondary} tick={{ fill: SAPPHIRE.textSecondary, fontSize: 9 }} />
                  <YAxis stroke={SAPPHIRE.textSecondary} tick={{ fill: SAPPHIRE.textSecondary, fontSize: 10 }} />
                  <Bar dataKey="count" fill={drillDownConfig[drillDown].color} radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </DialogContent>
            <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha(SAPPHIRE.primary, 0.2)}` }}>
              <Button onClick={closeDrillDown} variant="outlined" sx={{ color: SAPPHIRE.accent, borderColor: SAPPHIRE.accent }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Hero Header */}
      <Fade in timeout={600}>
        <Paper sx={{
          ...GLASS_CARD,
          background: `linear-gradient(135deg, ${SAPPHIRE.bg} 0%, ${SAPPHIRE.bgLight} 50%, ${alpha(SAPPHIRE.primary, 0.08)} 100%)`,
          p: 4, mb: 4, position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{
            position: 'absolute', top: 0, right: 0, width: 300, height: 300,
            background: `radial-gradient(circle, ${alpha(SAPPHIRE.primary, 0.15)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: SAPPHIRE.primary, color: '#fff', width: 56, height: 56, ...SUBTLE_GLOW }}>
                  <BoltOutlined sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" sx={{
                    fontWeight: 800,
                    background: `linear-gradient(135deg, ${SAPPHIRE.primary} 0%, ${SAPPHIRE.accent} 100%)`,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    High Throughput Demo
                  </Typography>
                  <Typography variant="body1" sx={{ color: SAPPHIRE.textSecondary }}>
                    Multi-Node Architecture with API Integration & Merkle Registry
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3 }}>
                {!isRunning ? (
                  <Button variant="contained" size="large" onClick={handleStart} startIcon={<PlayArrow />}
                    sx={{
                      background: `linear-gradient(135deg, ${SAPPHIRE.primary} 0%, ${SAPPHIRE.secondary} 100%)`,
                      color: '#fff', fontWeight: 700, px: 4, py: 1.5, fontSize: '1.1rem',
                      ...SUBTLE_GLOW,
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 0 30px ${alpha(SAPPHIRE.primary, 0.5)}` },
                    }}>
                    Start Demo
                  </Button>
                ) : (
                  <Button variant="contained" size="large" onClick={handleStop} startIcon={<Pause />}
                    sx={{ background: `linear-gradient(135deg, ${SAPPHIRE.error} 0%, #DC2626 100%)`, color: 'white', fontWeight: 700, px: 4, py: 1.5, fontSize: '1.1rem' }}>
                    Stop Demo
                  </Button>
                )}
                <Chip icon={<NetworkCheck />} label={isRunning ? 'LIVE' : 'READY'}
                  sx={{
                    bgcolor: isRunning ? alpha(SAPPHIRE.primary, 0.2) : alpha(SAPPHIRE.textSecondary, 0.2),
                    color: isRunning ? SAPPHIRE.primary : SAPPHIRE.textSecondary, fontWeight: 600,
                    animation: isRunning ? 'pulse 2s infinite' : 'none',
                    '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
                  }} />
                <Chip icon={<Hub />} label={`${totalNodes} Nodes`} sx={{ bgcolor: alpha(SAPPHIRE.secondary, 0.2), color: SAPPHIRE.accent }} />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleDrillDown('tps')}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: SAPPHIRE.primary, textShadow: `0 0 20px ${alpha(SAPPHIRE.primary, 0.4)}` }}>
                      {formatNumber(currentTPS)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: SAPPHIRE.textSecondary }}>Current TPS</Typography>
                    <Chip icon={<ZoomIn />} label="Details" size="small" sx={{ mt: 1, bgcolor: alpha(SAPPHIRE.primary, 0.1), color: SAPPHIRE.accent, fontSize: '0.7rem' }} />
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: SAPPHIRE.accent, textShadow: `0 0 20px ${alpha(SAPPHIRE.accent, 0.4)}` }}>
                      {formatNumber(peakTPS)}
                    </Typography>
                    <Typography variant="body2" sx={{ color: SAPPHIRE.textSecondary }}>Peak TPS</Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: SAPPHIRE.warning, textShadow: `0 0 20px ${alpha(SAPPHIRE.warning, 0.4)}` }}>
                      {tokensCreated}
                    </Typography>
                    <Typography variant="body2" sx={{ color: SAPPHIRE.textSecondary }}>Tokens Created</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Tabs for different views */}
      <Card sx={{ ...GLASS_CARD, mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
          sx={{ borderBottom: `1px solid ${alpha(SAPPHIRE.primary, 0.2)}`, px: 2 }}
          variant="scrollable" scrollButtons="auto">
          <Tab label="Performance" icon={<Speed />} iconPosition="start" sx={{ color: '#8BA4B4', '&.Mui-selected': { color: SAPPHIRE.primary } }} />
          <Tab label="Node Configuration" icon={<Dns />} iconPosition="start" sx={{ color: '#8BA4B4', '&.Mui-selected': { color: SAPPHIRE.primary } }} />
          <Tab label="API Streams" icon={<CloudQueue />} iconPosition="start" sx={{ color: '#8BA4B4', '&.Mui-selected': { color: SAPPHIRE.primary } }} />
          <Tab label="Merkle Registry" icon={<AccountTree />} iconPosition="start" sx={{ color: '#8BA4B4', '&.Mui-selected': { color: SAPPHIRE.primary } }} />
          <Tab label="Smart Contracts" icon={<Code />} iconPosition="start" sx={{ color: '#8BA4B4', '&.Mui-selected': { color: SAPPHIRE.indigo } }} />
          <Tab label="Active Contracts" icon={<Gavel />} iconPosition="start" sx={{ color: '#8BA4B4', '&.Mui-selected': { color: SAPPHIRE.secondary } }} />
          <Tab label="Node Topology" icon={<Hub />} iconPosition="start" sx={{ color: '#8BA4B4', '&.Mui-selected': { color: SAPPHIRE.cyan } }} />
        </Tabs>

        <CardContent>
          {/* Performance Tab */}
          {activeTab === 0 && (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                  { icon: <Speed />, value: formatNumber(avgTPS), label: 'Average TPS', color: SAPPHIRE.primary, drillType: 'tps' as DrillDownType },
                  { icon: <Timer />, value: `${latency.toFixed(1)}ms`, label: 'Latency', color: SAPPHIRE.info, drillType: 'latency' as DrillDownType },
                  { icon: <TrendingUp />, value: `${successRate.toFixed(2)}%`, label: 'Success Rate', color: SAPPHIRE.warning, drillType: 'success' as DrillDownType },
                  { icon: <BarChart />, value: formatNumber(totalTransactions), label: 'Total Transactions', color: SAPPHIRE.accent, drillType: 'transactions' as DrillDownType },
                ].map((metric, i) => (
                  <Grid item xs={6} sm={3} key={i}>
                    <Card sx={METRIC_CARD} onClick={() => handleDrillDown(metric.drillType)}>
                      <CardContent sx={{ textAlign: 'center', py: 3, position: 'relative' }}>
                        <Avatar sx={{ bgcolor: alpha(metric.color, 0.15), color: metric.color, width: 48, height: 48, mx: 'auto', mb: 1 }}>
                          {metric.icon}
                        </Avatar>
                        <Typography variant="h5" sx={{ color: metric.color, fontWeight: 700 }}>{metric.value}</Typography>
                        <Typography variant="body2" sx={{ color: SAPPHIRE.textSecondary }}>{metric.label}</Typography>
                        <Box sx={{
                          position: 'absolute', bottom: 8, right: 8,
                          display: 'flex', alignItems: 'center', gap: 0.5,
                          color: SAPPHIRE.accent, opacity: 0.7,
                          transition: 'all 0.2s ease',
                          '&:hover': { opacity: 1 }
                        }}>
                          <ZoomIn sx={{ fontSize: 14 }} />
                          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Drill Down</Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Real-time TPS by Source</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tpsData}>
                  <defs>
                    <linearGradient id="tpsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SAPPHIRE.primary} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={SAPPHIRE.primary} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 166, 166, 0.1)" />
                  <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#5A7A8A" tick={{ fill: '#5A7A8A', fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => formatNumber(v)} stroke={SAPPHIRE.primary} tick={{ fill: SAPPHIRE.primary, fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ background: 'rgba(13, 27, 42, 0.95)', border: `1px solid ${alpha(SAPPHIRE.primary, 0.2)}`, borderRadius: 8 }} />
                  <Area type="monotone" dataKey="tps" stroke={SAPPHIRE.primary} strokeWidth={2} fill="url(#tpsGradient)" name="Total TPS" />
                  <Line type="monotone" dataKey="quantconnect" stroke={SAPPHIRE.indigo} strokeWidth={1.5} dot={false} name="QuantConnect" />
                  <Line type="monotone" dataKey="weather" stroke={SAPPHIRE.cyan} strokeWidth={1.5} dot={false} name="Weather" />
                  <Line type="monotone" dataKey="news" stroke={SAPPHIRE.violet} strokeWidth={1.5} dot={false} name="News" />
                </AreaChart>
              </ResponsiveContainer>
            </>
          )}

          {/* Node Configuration Tab */}
          {activeTab === 1 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Node Distribution</Typography>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Chip icon={<CheckCircle />} label="Validators" sx={{ bgcolor: alpha(SAPPHIRE.primary, 0.2), color: SAPPHIRE.primary }} />
                    <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Consensus & Block Validation</Typography>
                  </Box>
                  <Slider value={config.nodes.validators} min={1} max={10} marks
                    onChange={(_, v) => setConfig(prev => ({ ...prev, nodes: { ...prev.nodes, validators: v as number } }))}
                    disabled={isRunning}
                    sx={{ color: SAPPHIRE.primary, '& .MuiSlider-thumb': { boxShadow: `0 0 8px ${alpha(SAPPHIRE.primary, 0.4)}` } }} />
                  <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Current: {config.nodes.validators} validators (Consensus strength: {Math.round(config.nodes.validators / 3 * 100)}%)</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Chip icon={<Storage />} label="Business Nodes" sx={{ bgcolor: alpha(SAPPHIRE.secondary, 0.2), color: SAPPHIRE.secondary }} />
                    <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Transaction Processing</Typography>
                  </Box>
                  <Slider value={config.nodes.businessNodes} min={1} max={15} marks
                    onChange={(_, v) => setConfig(prev => ({ ...prev, nodes: { ...prev.nodes, businessNodes: v as number } }))}
                    disabled={isRunning}
                    sx={{ color: SAPPHIRE.secondary }} />
                  <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Current: {config.nodes.businessNodes} business nodes (Processing capacity: {Math.round(config.nodes.businessNodes / 5 * 100)}%)</Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Chip icon={<CloudQueue />} label="Slim Nodes" sx={{ bgcolor: alpha(SAPPHIRE.accent, 0.2), color: SAPPHIRE.accent }} />
                    <Typography variant="body2" sx={{ color: '#8BA4B4' }}>API Integration & Data Ingestion</Typography>
                  </Box>
                  <Slider value={config.nodes.slimNodes} min={1} max={30} marks
                    onChange={(_, v) => setConfig(prev => ({ ...prev, nodes: { ...prev.nodes, slimNodes: v as number } }))}
                    disabled={isRunning}
                    sx={{ color: SAPPHIRE.accent }} />
                  <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Current: {config.nodes.slimNodes} slim nodes (API throughput: {Math.round(config.nodes.slimNodes / 10 * 100)}%)</Typography>
                </Box>

                <Divider sx={{ my: 3, borderColor: alpha(SAPPHIRE.primary, 0.2) }} />

                <Typography variant="subtitle2" sx={{ color: '#8BA4B4', mb: 2 }}>Performance Options</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel control={<Switch checked={config.aiOptimization} onChange={(e) => setConfig(prev => ({ ...prev, aiOptimization: e.target.checked }))} disabled={isRunning} sx={{ '& .Mui-checked': { color: SAPPHIRE.primary }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: SAPPHIRE.primary } }} />} label={<Typography variant="body2">AI Optimization (+30% TPS)</Typography>} />
                  <FormControlLabel control={<Switch checked={config.burstMode} onChange={(e) => setConfig(prev => ({ ...prev, burstMode: e.target.checked }))} disabled={isRunning} sx={{ '& .Mui-checked': { color: SAPPHIRE.warning }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: SAPPHIRE.warning } }} />} label={<Typography variant="body2">Burst Mode (+50% peak capacity)</Typography>} />
                  <FormControlLabel control={<Switch checked={config.quantumSecurity} onChange={(e) => setConfig(prev => ({ ...prev, quantumSecurity: e.target.checked }))} disabled={isRunning} sx={{ '& .Mui-checked': { color: SAPPHIRE.secondary }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: SAPPHIRE.secondary } }} />} label={<Typography variant="body2">Quantum-Resistant Security (NIST Level 5)</Typography>} />
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>Node Architecture</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie data={nodeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {nodeDistribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3 }}>
                  {nodeDistribution.map((node) => (
                    <Box key={node.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: node.color }} />
                      <Typography variant="caption" sx={{ color: '#8BA4B4' }}>{node.name}: {node.value}</Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ mt: 4, p: 2, bgcolor: alpha(SAPPHIRE.primary, 0.1), borderRadius: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: SAPPHIRE.primary, mb: 1 }}>Estimated Performance</Typography>
                  <Typography variant="body2" sx={{ color: '#8BA4B4' }}>
                    Base TPS: {formatNumber(config.targetTPS)}<br/>
                    Node Multiplier: {calculateNodeMultiplier().toFixed(2)}x<br/>
                    <strong>Effective TPS: {formatNumber(Math.round(config.targetTPS * calculateNodeMultiplier() * (config.aiOptimization ? 1.3 : 1)))}</strong>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* API Streams Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>API Data Streams (via Slim Nodes)</Typography>
              </Grid>

              {/* API Toggle Controls */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
                  <FormControlLabel control={<Switch checked={config.enableQuantConnect} onChange={(e) => setConfig(prev => ({ ...prev, enableQuantConnect: e.target.checked }))} disabled={isRunning} sx={{ '& .Mui-checked': { color: SAPPHIRE.indigo }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: SAPPHIRE.indigo } }} />} label={<Chip icon={<ShowChart />} label="QuantConnect" sx={{ bgcolor: config.enableQuantConnect ? alpha(SAPPHIRE.indigo, 0.2) : 'transparent', color: config.enableQuantConnect ? SAPPHIRE.indigo : '#5A7A8A' }} />} />
                  <FormControlLabel control={<Switch checked={config.enableWeather} onChange={(e) => setConfig(prev => ({ ...prev, enableWeather: e.target.checked }))} disabled={isRunning} sx={{ '& .Mui-checked': { color: SAPPHIRE.cyan }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: SAPPHIRE.cyan } }} />} label={<Chip icon={<Cloud />} label="Weather API" sx={{ bgcolor: config.enableWeather ? alpha(SAPPHIRE.cyan, 0.2) : 'transparent', color: config.enableWeather ? SAPPHIRE.cyan : '#5A7A8A' }} />} />
                  <FormControlLabel control={<Switch checked={config.enableNews} onChange={(e) => setConfig(prev => ({ ...prev, enableNews: e.target.checked }))} disabled={isRunning} sx={{ '& .Mui-checked': { color: SAPPHIRE.violet }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: SAPPHIRE.violet } }} />} label={<Chip icon={<Newspaper />} label="News API" sx={{ bgcolor: config.enableNews ? alpha(SAPPHIRE.violet, 0.2) : 'transparent', color: config.enableNews ? SAPPHIRE.violet : '#5A7A8A' }} />} />
                </Box>
              </Grid>

              {/* QuantConnect Stream - Clickable */}
              <Grid item xs={12} md={4}>
                <Card sx={{ ...METRIC_CARD, border: `1px solid ${alpha(SAPPHIRE.indigo, 0.3)}`, position: 'relative' }} onClick={() => handleDrillDown('quantconnect')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ShowChart sx={{ color: SAPPHIRE.indigo }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>QuantConnect</Typography>
                      {isRunning && config.enableQuantConnect && <Chip label="LIVE" size="small" sx={{ bgcolor: alpha(SAPPHIRE.indigo, 0.2), color: SAPPHIRE.indigo, ml: 'auto' }} />}
                    </Box>
                    {latestQuantConnect ? (
                      <Box>
                        <Typography variant="h4" sx={{ color: SAPPHIRE.indigo, fontWeight: 700 }}>{latestQuantConnect.symbol}</Typography>
                        <Typography variant="h5" sx={{ color: '#E8F4F8' }}>${latestQuantConnect.price}</Typography>
                        <Typography variant="body2" sx={{ color: parseFloat(latestQuantConnect.change) >= 0 ? SAPPHIRE.success : SAPPHIRE.error }}>
                          {parseFloat(latestQuantConnect.change) >= 0 ? '+' : ''}{latestQuantConnect.change}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Vol: {formatNumber(latestQuantConnect.volume)}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#5A7A8A' }}>Start demo to see live data</Typography>
                    )}
                    <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 0.5, color: SAPPHIRE.indigo, opacity: 0.7 }}>
                      <ZoomIn sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Drill Down</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Weather Stream - Clickable */}
              <Grid item xs={12} md={4}>
                <Card sx={{ ...METRIC_CARD, border: `1px solid ${alpha(SAPPHIRE.cyan, 0.3)}`, position: 'relative' }} onClick={() => handleDrillDown('weather')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Cloud sx={{ color: SAPPHIRE.cyan }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Weather API</Typography>
                      {isRunning && config.enableWeather && <Chip label="LIVE" size="small" sx={{ bgcolor: alpha(SAPPHIRE.cyan, 0.2), color: SAPPHIRE.cyan, ml: 'auto' }} />}
                    </Box>
                    {latestWeather ? (
                      <Box>
                        <Typography variant="h4" sx={{ color: SAPPHIRE.cyan, fontWeight: 700 }}>{latestWeather.city}</Typography>
                        <Typography variant="h5" sx={{ color: '#E8F4F8' }}>{latestWeather.temperature}°C</Typography>
                        <Typography variant="body2" sx={{ color: '#8BA4B4' }}>{latestWeather.condition}</Typography>
                        <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Humidity: {latestWeather.humidity}%</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#5A7A8A' }}>Start demo to see live data</Typography>
                    )}
                    <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 0.5, color: SAPPHIRE.cyan, opacity: 0.7 }}>
                      <ZoomIn sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Drill Down</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* News Stream - Clickable */}
              <Grid item xs={12} md={4}>
                <Card sx={{ ...METRIC_CARD, border: `1px solid ${alpha(SAPPHIRE.violet, 0.3)}`, position: 'relative' }} onClick={() => handleDrillDown('news')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Newspaper sx={{ color: SAPPHIRE.violet }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>News API</Typography>
                      {isRunning && config.enableNews && <Chip label="LIVE" size="small" sx={{ bgcolor: alpha(SAPPHIRE.violet, 0.2), color: SAPPHIRE.violet, ml: 'auto' }} />}
                    </Box>
                    {latestNews ? (
                      <Box>
                        <Typography variant="body1" sx={{ color: '#E8F4F8', fontWeight: 600, mb: 1 }}>{latestNews.headline}</Typography>
                        <Chip label={latestNews.sentiment} size="small" sx={{ bgcolor: latestNews.sentiment === 'positive' ? alpha(SAPPHIRE.success, 0.2) : alpha('#5A7A8A', 0.2), color: latestNews.sentiment === 'positive' ? SAPPHIRE.success : '#8BA4B4' }} />
                        <Typography variant="caption" sx={{ color: '#5A7A8A', display: 'block', mt: 1 }}>Source: {latestNews.source}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: '#5A7A8A' }}>Start demo to see live data</Typography>
                    )}
                    <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 0.5, color: SAPPHIRE.violet, opacity: 0.7 }}>
                      <ZoomIn sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Drill Down</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* API TPS Distribution */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <ResponsiveContainer width={300} height={200}>
                    <PieChart>
                      <Pie data={apiDistribution.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value">
                        {apiDistribution.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {apiDistribution.filter(d => d.value > 0).map((api) => (
                    <Box key={api.name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: api.color }} />
                      <Typography variant="caption" sx={{ color: '#8BA4B4' }}>{api.name}: {api.value}%</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* Node Type Data Feed Cards */}
              <Grid item xs={12}>
                <Divider sx={{ my: 3, borderColor: alpha(SAPPHIRE.primary, 0.2) }} />
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Node Data Feeds by Type</Typography>
              </Grid>

              {/* Validator Nodes Card */}
              <Grid item xs={12} md={4}>
                <Card sx={{ ...METRIC_CARD, border: `1px solid ${alpha(SAPPHIRE.primary, 0.3)}`, position: 'relative' }} onClick={() => handleDrillDown('nodes')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CheckCircle sx={{ color: SAPPHIRE.primary }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Validator Nodes</Typography>
                      <Chip label={`${config.nodes.validators} Active`} size="small" sx={{ bgcolor: alpha(SAPPHIRE.primary, 0.2), color: SAPPHIRE.primary, ml: 'auto' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ color: SAPPHIRE.primary, fontWeight: 700 }}>
                        {formatNumber(Math.round(currentTPS * 0.15 / Math.max(1, config.nodes.validators)))}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8BA4B4' }}>TPS per validator</Typography>
                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Consensus Blocks</Typography>
                          <Typography variant="caption" sx={{ color: SAPPHIRE.primary }}>{isRunning ? Math.floor(uptime / 2) : 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Validation Rate</Typography>
                          <Typography variant="caption" sx={{ color: SAPPHIRE.success }}>{successRate.toFixed(2)}%</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 0.5, color: SAPPHIRE.primary, opacity: 0.7 }}>
                      <ZoomIn sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Drill Down</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Business Nodes Card - Random generators */}
              <Grid item xs={12} md={4}>
                <Card sx={{ ...METRIC_CARD, border: `1px solid ${alpha(SAPPHIRE.secondary, 0.3)}`, position: 'relative' }} onClick={() => handleDrillDown('transactions')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Storage sx={{ color: SAPPHIRE.secondary }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Business Nodes</Typography>
                      <Chip label={`${config.nodes.businessNodes} Active`} size="small" sx={{ bgcolor: alpha(SAPPHIRE.secondary, 0.2), color: SAPPHIRE.secondary, ml: 'auto' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ color: SAPPHIRE.secondary, fontWeight: 700 }}>
                        {formatNumber(Math.round(currentTPS * 0.2 / Math.max(1, config.nodes.businessNodes)))}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8BA4B4' }}>TPS per business node</Typography>
                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Gap Fill (RNG)</Typography>
                          <Typography variant="caption" sx={{ color: SAPPHIRE.secondary }}>{isRunning ? formatNumber(Math.floor(Math.random() * 50000 + 10000)) : 0} tx</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Processing Queue</Typography>
                          <Typography variant="caption" sx={{ color: SAPPHIRE.warning }}>{isRunning ? Math.floor(Math.random() * 1000 + 100) : 0}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 0.5, color: SAPPHIRE.secondary, opacity: 0.7 }}>
                      <ZoomIn sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Drill Down</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Slim Nodes Card - External APIs */}
              <Grid item xs={12} md={4}>
                <Card sx={{ ...METRIC_CARD, border: `1px solid ${alpha(SAPPHIRE.accent, 0.3)}`, position: 'relative' }} onClick={() => handleDrillDown('tokens')}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <CloudQueue sx={{ color: SAPPHIRE.accent }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>Slim Nodes</Typography>
                      <Chip label={`${config.nodes.slimNodes} Active`} size="small" sx={{ bgcolor: alpha(SAPPHIRE.accent, 0.2), color: SAPPHIRE.accent, ml: 'auto' }} />
                    </Box>
                    <Box>
                      <Typography variant="h4" sx={{ color: SAPPHIRE.accent, fontWeight: 700 }}>
                        {formatNumber(Math.round(currentTPS * 0.65 / Math.max(1, config.nodes.slimNodes)))}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#8BA4B4' }}>TPS per slim node</Typography>
                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#5A7A8A' }}>API Ingestion</Typography>
                          <Typography variant="caption" sx={{ color: SAPPHIRE.indigo }}>{config.enableQuantConnect ? 'QC' : ''} {config.enableWeather ? 'WX' : ''} {config.enableNews ? 'NW' : ''}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" sx={{ color: '#5A7A8A' }}>Tokens Created</Typography>
                          <Typography variant="caption" sx={{ color: SAPPHIRE.accent }}>{tokensCreated}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 0.5, color: SAPPHIRE.accent, opacity: 0.7 }}>
                      <ZoomIn sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>Drill Down</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* Merkle Registry Tab */}
          {activeTab === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Merkle Registry ({merkleRegistry.length} entries)</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip icon={<Token />} label={`${tokensCreated} Tokens`} sx={{ bgcolor: alpha(SAPPHIRE.primary, 0.2), color: SAPPHIRE.primary }} />
                  <Chip icon={<AccountTree />} label={`${merkleRegistry.filter(e => e.verified).length} Verified`} sx={{ bgcolor: alpha(SAPPHIRE.success, 0.2), color: SAPPHIRE.success }} />
                </Box>
              </Box>

              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Token ID</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Source</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Merkle Root</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Leaf Index</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tokenizedAssets.slice(0, 20).map((asset) => {
                      const merkleEntry = merkleRegistry.find(e => e.tokenId === asset.id);
                      return (
                        <TableRow key={asset.id} sx={{ '&:hover': { bgcolor: alpha(SAPPHIRE.primary, 0.05) } }}>
                          <TableCell sx={{ color: '#E8F4F8', fontFamily: 'monospace', fontSize: '0.75rem' }}>{asset.id}</TableCell>
                          <TableCell>
                            <Chip label={asset.source} size="small" sx={{
                              bgcolor: asset.source === 'quantconnect' ? alpha(SAPPHIRE.indigo, 0.2) :
                                       asset.source === 'weather' ? alpha(SAPPHIRE.cyan, 0.2) : alpha(SAPPHIRE.violet, 0.2),
                              color: asset.source === 'quantconnect' ? SAPPHIRE.indigo :
                                     asset.source === 'weather' ? SAPPHIRE.cyan : SAPPHIRE.violet,
                            }} />
                          </TableCell>
                          <TableCell sx={{ color: SAPPHIRE.accent, fontFamily: 'monospace', fontSize: '0.7rem' }}>
                            {merkleEntry?.merkleRoot.substring(0, 18)}...
                          </TableCell>
                          <TableCell sx={{ color: '#8BA4B4' }}>{merkleEntry?.leafIndex}</TableCell>
                          <TableCell>
                            <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label="Verified" size="small"
                              sx={{ bgcolor: alpha(SAPPHIRE.success, 0.2), color: SAPPHIRE.success }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {tokenizedAssets.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AccountTree sx={{ fontSize: 48, color: '#5A7A8A', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#8BA4B4' }}>
                    Start the demo to see tokenized assets registered in the Merkle tree
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Smart Contracts Tab */}
          {activeTab === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Smart Contracts Registry ({smartContracts.length} contracts)</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip icon={<Code />} label={`${contractsDeployed} Deployed`} sx={{ bgcolor: alpha(SAPPHIRE.indigo, 0.2), color: SAPPHIRE.indigo }} />
                  <Chip icon={<CheckCircle />} label={`${smartContracts.filter(c => c.status === 'Deployed').length} Active`} sx={{ bgcolor: alpha(SAPPHIRE.success, 0.2), color: SAPPHIRE.success }} />
                </Box>
              </Box>

              {/* Contract Stats Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { icon: <Description />, label: 'Ricardian', count: smartContracts.filter(c => c.type === 'Ricardian').length, color: SAPPHIRE.primary },
                  { icon: <AttachMoney />, label: 'DeFi', count: smartContracts.filter(c => c.type === 'DeFi').length, color: SAPPHIRE.indigo },
                  { icon: <LocalOffer />, label: 'NFT', count: smartContracts.filter(c => c.type === 'NFT').length, color: SAPPHIRE.violet },
                  { icon: <Token />, label: 'Token', count: smartContracts.filter(c => c.type === 'Token').length, color: SAPPHIRE.accent },
                ].map((stat) => (
                  <Grid item xs={6} sm={3} key={stat.label}>
                    <Card sx={{ ...METRIC_CARD }} onClick={() => handleDrillDown('contracts')}>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(stat.color, 0.15), color: stat.color, width: 40, height: 40, mx: 'auto', mb: 1 }}>
                          {stat.icon}
                        </Avatar>
                        <Typography variant="h5" sx={{ color: stat.color, fontWeight: 700 }}>{stat.count}</Typography>
                        <Typography variant="caption" sx={{ color: SAPPHIRE.textSecondary }}>{stat.label}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Contract ID</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Name</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Type</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Version</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Executions</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {smartContracts.slice(0, 20).map((contract) => (
                      <TableRow key={contract.id} sx={{ '&:hover': { bgcolor: alpha(SAPPHIRE.indigo, 0.05) } }}>
                        <TableCell sx={{ color: '#E8F4F8', fontFamily: 'monospace', fontSize: '0.75rem' }}>{contract.id}</TableCell>
                        <TableCell sx={{ color: SAPPHIRE.accent }}>{contract.name}</TableCell>
                        <TableCell>
                          <Chip label={contract.type} size="small" sx={{
                            bgcolor: contract.type === 'Ricardian' ? alpha(SAPPHIRE.primary, 0.2) :
                                     contract.type === 'DeFi' ? alpha(SAPPHIRE.indigo, 0.2) :
                                     contract.type === 'NFT' ? alpha(SAPPHIRE.violet, 0.2) : alpha(SAPPHIRE.accent, 0.2),
                            color: contract.type === 'Ricardian' ? SAPPHIRE.primary :
                                   contract.type === 'DeFi' ? SAPPHIRE.indigo :
                                   contract.type === 'NFT' ? SAPPHIRE.violet : SAPPHIRE.accent,
                          }} />
                        </TableCell>
                        <TableCell sx={{ color: '#8BA4B4' }}>{contract.version}</TableCell>
                        <TableCell sx={{ color: SAPPHIRE.accent }}>{formatNumber(contract.executions)}</TableCell>
                        <TableCell>
                          <Chip icon={<CheckCircle sx={{ fontSize: 14 }} />} label={contract.status} size="small"
                            sx={{ bgcolor: alpha(SAPPHIRE.success, 0.2), color: SAPPHIRE.success }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {smartContracts.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Code sx={{ fontSize: 48, color: '#5A7A8A', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#8BA4B4' }}>
                    Start the demo to see smart contracts being deployed
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Active Contracts Tab */}
          {activeTab === 5 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Active Contracts ({activeContracts.length} live)</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip icon={<Gavel />} label={`${activeContractsCount} Total Created`} sx={{ bgcolor: alpha(SAPPHIRE.secondary, 0.2), color: SAPPHIRE.secondary }} />
                  <Chip icon={<PlayCircle />} label={`${activeContracts.filter(c => c.status === 'Active').length} Running`} sx={{ bgcolor: alpha(SAPPHIRE.success, 0.2), color: SAPPHIRE.success }} />
                </Box>
              </Box>

              {/* Active Contract Type Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { icon: <Security />, label: 'Escrow', count: activeContracts.filter(c => c.type === 'Escrow').length, color: SAPPHIRE.primary },
                  { icon: <AttachMoney />, label: 'Payment', count: activeContracts.filter(c => c.type === 'Payment').length, color: SAPPHIRE.indigo },
                  { icon: <Token />, label: 'Swap', count: activeContracts.filter(c => c.type === 'Swap').length, color: SAPPHIRE.cyan },
                  { icon: <Assignment />, label: 'Stake', count: activeContracts.filter(c => c.type === 'Stake').length, color: SAPPHIRE.accent },
                  { icon: <Hub />, label: 'Bridge', count: activeContracts.filter(c => c.type === 'Bridge').length, color: SAPPHIRE.violet },
                ].map((stat) => (
                  <Grid item xs={6} sm={2.4} key={stat.label}>
                    <Card sx={{ ...METRIC_CARD }} onClick={() => handleDrillDown('activeContracts')}>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(stat.color, 0.15), color: stat.color, width: 36, height: 36, mx: 'auto', mb: 1 }}>
                          {stat.icon}
                        </Avatar>
                        <Typography variant="h6" sx={{ color: stat.color, fontWeight: 700 }}>{stat.count}</Typography>
                        <Typography variant="caption" sx={{ color: SAPPHIRE.textSecondary }}>{stat.label}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Contract ID</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Name</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Type</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Value</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Executions</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeContracts.slice(0, 20).map((contract) => (
                      <TableRow key={contract.id} sx={{ '&:hover': { bgcolor: alpha(SAPPHIRE.secondary, 0.05) } }}>
                        <TableCell sx={{ color: '#E8F4F8', fontFamily: 'monospace', fontSize: '0.75rem' }}>{contract.id}</TableCell>
                        <TableCell sx={{ color: SAPPHIRE.accent }}>{contract.name}</TableCell>
                        <TableCell>
                          <Chip label={contract.type} size="small" sx={{
                            bgcolor: contract.type === 'Escrow' ? alpha(SAPPHIRE.primary, 0.2) :
                                     contract.type === 'Payment' ? alpha(SAPPHIRE.indigo, 0.2) :
                                     contract.type === 'Swap' ? alpha(SAPPHIRE.cyan, 0.2) :
                                     contract.type === 'Stake' ? alpha(SAPPHIRE.accent, 0.2) : alpha(SAPPHIRE.violet, 0.2),
                            color: contract.type === 'Escrow' ? SAPPHIRE.primary :
                                   contract.type === 'Payment' ? SAPPHIRE.indigo :
                                   contract.type === 'Swap' ? SAPPHIRE.cyan :
                                   contract.type === 'Stake' ? SAPPHIRE.accent : SAPPHIRE.violet,
                          }} />
                        </TableCell>
                        <TableCell sx={{ color: SAPPHIRE.warning, fontWeight: 600 }}>
                          {contract.value.toFixed(2)} {contract.currency}
                        </TableCell>
                        <TableCell sx={{ color: '#8BA4B4' }}>{contract.executionCount}</TableCell>
                        <TableCell>
                          <Chip
                            icon={contract.status === 'Active' ? <PlayCircle sx={{ fontSize: 14 }} /> : <PauseCircle sx={{ fontSize: 14 }} />}
                            label={contract.status}
                            size="small"
                            sx={{
                              bgcolor: contract.status === 'Active' ? alpha(SAPPHIRE.success, 0.2) : alpha(SAPPHIRE.warning, 0.2),
                              color: contract.status === 'Active' ? SAPPHIRE.success : SAPPHIRE.warning
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {activeContracts.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Gavel sx={{ fontSize: 48, color: '#5A7A8A', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#8BA4B4' }}>
                    Start the demo to see active contracts being created
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {/* Node Topology Tab */}
          {activeTab === 6 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Network Topology {topologyStats && `(${topologyStats.totalNodes} nodes)`}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {topologyLoading && <CircularProgress size={20} sx={{ color: SAPPHIRE.cyan }} />}
                  <Chip icon={<Hub />} label={`${topologyStats?.healthyNodes || 0} Healthy`} sx={{ bgcolor: alpha(SAPPHIRE.success, 0.2), color: SAPPHIRE.success }} />
                  <Chip icon={<ErrorOutline />} label={`${topologyStats?.degradedNodes || 0} Degraded`} sx={{ bgcolor: alpha(SAPPHIRE.warning, 0.2), color: SAPPHIRE.warning }} />
                </Box>
              </Box>

              {/* Network Stats Overview */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                  { icon: <CheckCircle />, label: 'Validators', count: topologyStats?.validatorCount || 0, color: SAPPHIRE.primary },
                  { icon: <Storage />, label: 'Business', count: topologyStats?.businessCount || 0, color: SAPPHIRE.secondary },
                  { icon: <CloudQueue />, label: 'Slim', count: topologyStats?.slimCount || 0, color: SAPPHIRE.accent },
                  { icon: <Hub />, label: 'Channels', count: topologyStats?.channelCount || 0, color: SAPPHIRE.cyan },
                  { icon: <Speed />, label: 'Network TPS', count: Math.round(topologyStats?.totalTps || 0), color: SAPPHIRE.indigo },
                  { icon: <Timer />, label: 'Avg Latency', count: `${(topologyStats?.avgLatencyMs || 0).toFixed(1)}ms`, color: SAPPHIRE.info },
                ].map((stat) => (
                  <Grid item xs={6} sm={2} key={stat.label}>
                    <Card sx={{ ...METRIC_CARD }}>
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Avatar sx={{ bgcolor: alpha(stat.color, 0.15), color: stat.color, width: 36, height: 36, mx: 'auto', mb: 1 }}>
                          {stat.icon}
                        </Avatar>
                        <Typography variant="h6" sx={{ color: stat.color, fontWeight: 700 }}>{stat.count}</Typography>
                        <Typography variant="caption" sx={{ color: SAPPHIRE.textSecondary }}>{stat.label}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Resource Utilization */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Resource Utilization</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: alpha(SAPPHIRE.primary, 0.05), borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Avg CPU</Typography>
                        <Typography variant="body2" sx={{ color: SAPPHIRE.primary, fontWeight: 600 }}>
                          {(topologyStats?.avgCpuPercent || 0).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={topologyStats?.avgCpuPercent || 0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: alpha(SAPPHIRE.primary, 0.1), '& .MuiLinearProgress-bar': { bgcolor: SAPPHIRE.primary } }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, bgcolor: alpha(SAPPHIRE.secondary, 0.05), borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#8BA4B4' }}>Avg Memory</Typography>
                        <Typography variant="body2" sx={{ color: SAPPHIRE.secondary, fontWeight: 600 }}>
                          {(topologyStats?.avgMemoryPercent || 0).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={topologyStats?.avgMemoryPercent || 0}
                        sx={{ height: 8, borderRadius: 4, bgcolor: alpha(SAPPHIRE.secondary, 0.1), '& .MuiLinearProgress-bar': { bgcolor: SAPPHIRE.secondary } }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Nodes by Region */}
              {topologyStats?.nodesByRegion && Object.keys(topologyStats.nodesByRegion).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Geographic Distribution</Typography>
                  <Grid container spacing={1}>
                    {Object.entries(topologyStats.nodesByRegion).map(([region, count]) => (
                      <Grid item xs={6} sm={3} key={region}>
                        <Chip
                          label={`${region}: ${count}`}
                          sx={{ width: '100%', bgcolor: alpha(SAPPHIRE.cyan, 0.1), color: SAPPHIRE.cyan }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Node List Table */}
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>Active Nodes ({topologyNodes.length})</Typography>
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent', maxHeight: 400 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Node ID</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Type</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Channel</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>TPS</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Latency</TableCell>
                      <TableCell sx={{ bgcolor: SAPPHIRE.bgLight, color: '#8BA4B4' }}>Health</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topologyNodes.slice(0, 20).map((node) => (
                      <TableRow key={node.nodeId} sx={{ '&:hover': { bgcolor: alpha(SAPPHIRE.cyan, 0.05) } }}>
                        <TableCell sx={{ color: '#E8F4F8', fontFamily: 'monospace', fontSize: '0.75rem' }}>{node.nodeId}</TableCell>
                        <TableCell>
                          <Chip
                            label={node.nodeType}
                            size="small"
                            sx={{
                              bgcolor: node.nodeType === 'VALIDATOR' ? alpha(SAPPHIRE.primary, 0.2) :
                                       node.nodeType === 'BUSINESS' ? alpha(SAPPHIRE.secondary, 0.2) :
                                       node.nodeType === 'SLIM' ? alpha(SAPPHIRE.accent, 0.2) : alpha(SAPPHIRE.cyan, 0.2),
                              color: node.nodeType === 'VALIDATOR' ? SAPPHIRE.primary :
                                     node.nodeType === 'BUSINESS' ? SAPPHIRE.secondary :
                                     node.nodeType === 'SLIM' ? SAPPHIRE.accent : SAPPHIRE.cyan,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#8BA4B4' }}>{node.channelId}</TableCell>
                        <TableCell sx={{ color: SAPPHIRE.indigo, fontWeight: 600 }}>{formatNumber(Math.round(node.currentTps))}</TableCell>
                        <TableCell sx={{ color: '#8BA4B4' }}>{node.latencyMs.toFixed(1)}ms</TableCell>
                        <TableCell>
                          <Chip
                            icon={node.healthStatus === 'healthy' ? <CheckCircle sx={{ fontSize: 14 }} /> : <ErrorOutline sx={{ fontSize: 14 }} />}
                            label={`${node.healthScore}%`}
                            size="small"
                            sx={{
                              bgcolor: node.healthStatus === 'healthy' ? alpha(SAPPHIRE.success, 0.2) : alpha(SAPPHIRE.warning, 0.2),
                              color: node.healthStatus === 'healthy' ? SAPPHIRE.success : SAPPHIRE.warning
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {topologyNodes.length === 0 && !topologyLoading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Hub sx={{ fontSize: 48, color: '#5A7A8A', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: '#8BA4B4' }}>
                    Loading network topology...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Feature Highlights */}
      <Grid container spacing={3}>
        {[
          { icon: <BoltOutlined />, title: '2M+ TPS', desc: 'Ultra-high throughput with multi-node architecture', color: SAPPHIRE.primary },
          { icon: <Hub />, title: 'Node Topology', desc: 'Real-time network metrics & geographic distribution', color: SAPPHIRE.cyan },
          { icon: <Code />, title: 'Smart Contracts', desc: 'Ricardian, DeFi, NFT & Token contracts', color: SAPPHIRE.indigo },
          { icon: <Gavel />, title: 'Active Contracts', desc: 'Escrow, Payment, Swap & Bridge execution', color: SAPPHIRE.violet },
          { icon: <CloudQueue />, title: 'API Integration', desc: 'QuantConnect, Weather & News data streams', color: SAPPHIRE.accent },
          { icon: <AccountTree />, title: 'Merkle Registry', desc: 'Tokenized assets with proof verification', color: SAPPHIRE.warning },
        ].map((feature) => (
          <Grid item xs={6} md={2} key={feature.title}>
            <Paper sx={{
              ...GLASS_CARD, p: 3, textAlign: 'center', transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 12px 36px rgba(0, 0, 0, 0.3), 0 0 15px ${alpha(feature.color, 0.25)}` },
            }}>
              <Avatar sx={{ bgcolor: alpha(feature.color, 0.15), color: feature.color, width: 48, height: 48, mx: 'auto', mb: 2 }}>
                {feature.icon}
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, color: feature.color }}>{feature.title}</Typography>
              <Typography variant="body2" sx={{ color: '#8BA4B4' }}>{feature.desc}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HighThroughputDemo;

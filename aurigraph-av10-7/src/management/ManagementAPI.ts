import express from 'express';
import cors from 'cors';
import { Logger } from '../core/Logger';
import { ChannelManager } from './ChannelManager';
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';

export class ManagementAPI {
  private logger: Logger;
  private app: express.Application;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private channelManager: ChannelManager;
  private clients: Set<WebSocket> = new Set();

  constructor() {
    this.logger = new Logger('ManagementAPI');
    this.app = express();
    this.channelManager = new ChannelManager();
    this.setupMiddleware();
    this.setupRoutes();
    this.channelManager.startMonitoring();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // Security headers
    this.app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      next();
    });
  }

  private setupRoutes(): void {
    // Serve management dashboard
    this.app.get('/', (req, res) => {
      res.send(this.getManagementDashboardHTML());
    });

    // Channel Management API
    this.app.get('/api/channels', (req, res) => {
      try {
        const channels = this.channelManager.getAllChannels();
        res.json({ success: true, channels });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.post('/api/channels', async (req, res) => {
      try {
        const channel = await this.channelManager.createChannel(req.body);
        res.json({ success: true, channel });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.put('/api/channels/:id', (req, res) => {
      try {
        const channel = this.channelManager.updateChannel(req.params.id, req.body);
        if (channel) {
          res.json({ success: true, channel });
        } else {
          res.status(404).json({ success: false, error: 'Channel not found' });
        }
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.delete('/api/channels/:id', async (req, res) => {
      try {
        const success = await this.channelManager.deleteChannel(req.params.id);
        res.json({ success });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Channel Operations
    this.app.post('/api/channels/:id/activate', async (req, res) => {
      try {
        const success = await this.channelManager.activateChannel(req.params.id);
        res.json({ success });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.post('/api/channels/:id/deactivate', async (req, res) => {
      try {
        const success = await this.channelManager.deactivateChannel(req.params.id);
        res.json({ success });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Validator Management API
    this.app.get('/api/validators', (req, res) => {
      try {
        const channelId = req.query.channel as string;
        const validators = channelId 
          ? this.channelManager.getValidatorsInChannel(channelId)
          : this.channelManager.getAllValidators();
        res.json({ success: true, validators });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.post('/api/validators', async (req, res) => {
      try {
        const { channelId, ...config } = req.body;
        const validator = await this.channelManager.createValidator(channelId, config);
        res.json({ success: true, validator });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.post('/api/validators/:id/start', async (req, res) => {
      try {
        const success = await this.channelManager.startValidator(req.params.id);
        res.json({ success });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.post('/api/validators/:id/stop', async (req, res) => {
      try {
        const success = await this.channelManager.stopValidator(req.params.id);
        res.json({ success });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Bulk validator creation
    this.app.post('/api/channels/:id/validators/bulk', async (req, res) => {
      try {
        const { count, startingPort } = req.body;
        const validators = await this.channelManager.createValidatorSet(req.params.id, count, startingPort);
        res.json({ success: true, validators });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Basic Node Management API
    this.app.get('/api/nodes', (req, res) => {
      try {
        const channelId = req.query.channel as string;
        const nodes = channelId 
          ? this.channelManager.getNodesInChannel(channelId)
          : this.channelManager.getAllNodes();
        res.json({ success: true, nodes });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.post('/api/nodes', async (req, res) => {
      try {
        const { channelId, ...config } = req.body;
        const node = await this.channelManager.createBasicNode(channelId, config);
        res.json({ success: true, node });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.post('/api/nodes/:id/start', async (req, res) => {
      try {
        const success = await this.channelManager.startBasicNode(req.params.id);
        res.json({ success });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.post('/api/nodes/:id/stop', async (req, res) => {
      try {
        const success = await this.channelManager.stopBasicNode(req.params.id);
        res.json({ success });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Bulk node creation
    this.app.post('/api/channels/:id/nodes/bulk', async (req, res) => {
      try {
        const { nodeTypes, startingPort } = req.body;
        const nodes = await this.channelManager.createNodeSet(req.params.id, nodeTypes, startingPort);
        res.json({ success: true, nodes });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Metrics API
    this.app.get('/api/metrics', (req, res) => {
      try {
        const channelId = req.query.channel as string;
        if (channelId) {
          const metrics = this.channelManager.getChannelMetrics(channelId);
          res.json({ success: true, metrics });
        } else {
          const allMetrics = this.channelManager.getAllChannelMetrics();
          res.json({ success: true, metrics: allMetrics });
        }
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.get('/api/overview', (req, res) => {
      try {
        const overview = this.channelManager.getSystemOverview();
        res.json({ success: true, overview });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Aurigraph DLT Management Dashboard',
        version: '10.36.0'
      });
    });
  }

  private getManagementDashboardHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurigraph DLT Management Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
            color: #fff;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(0, 0, 0, 0.5);
            padding: 20px;
            border-bottom: 2px solid #00ff88;
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 2.5em;
            background: linear-gradient(90deg, #00ff88, #00aaff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .nav-tabs {
            display: flex;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            margin: 20px;
            overflow: hidden;
        }
        
        .nav-tab {
            flex: 1;
            padding: 15px 20px;
            background: transparent;
            border: none;
            color: #888;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 1.1em;
        }
        
        .nav-tab.active {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
        }
        
        .nav-tab:hover {
            background: rgba(0, 255, 136, 0.1);
            color: #fff;
        }
        
        .tab-content {
            padding: 20px;
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(0, 255, 136, 0.2);
        }
        
        .card-title {
            font-size: 1.2em;
            color: #00aaff;
        }
        
        .status-badge {
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .status-active {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
        }
        
        .status-inactive {
            background: rgba(255, 170, 0, 0.2);
            color: #ffaa00;
        }
        
        .status-error {
            background: rgba(255, 68, 68, 0.2);
            color: #ff4444;
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9em;
            transition: all 0.3s;
            margin: 5px;
        }
        
        .btn-primary {
            background: #00ff88;
            color: #000;
        }
        
        .btn-primary:hover {
            background: #00cc6a;
            transform: translateY(-2px);
        }
        
        .btn-danger {
            background: #ff4444;
            color: #fff;
        }
        
        .btn-danger:hover {
            background: #cc2222;
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 5px;
            color: #ccc;
        }
        
        .form-control {
            width: 100%;
            padding: 10px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
        }
        
        .form-control:focus {
            outline: none;
            border-color: #00ff88;
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
        }
        
        .metrics-row {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        
        .metric-item {
            text-align: center;
            padding: 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
        }
        
        .metric-value {
            font-size: 1.5em;
            font-weight: bold;
            color: #00ff88;
        }
        
        .metric-label {
            font-size: 0.8em;
            color: #888;
            margin-top: 5px;
        }
        
        .node-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .node-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin-bottom: 5px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 5px;
            border-left: 3px solid #00ff88;
        }
        
        .node-info {
            flex: 1;
        }
        
        .node-actions {
            display: flex;
            gap: 5px;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 1000;
        }
        
        .modal.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: rgba(26, 31, 58, 0.95);
            border: 1px solid #00ff88;
            border-radius: 15px;
            padding: 30px;
            min-width: 500px;
            backdrop-filter: blur(10px);
        }
        
        .modal-header {
            font-size: 1.3em;
            color: #00aaff;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(0, 255, 136, 0.2);
            padding-bottom: 10px;
        }
        
        .loading {
            text-align: center;
            color: #888;
            padding: 20px;
        }
        
        .success-message {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            color: #00ff88;
        }
        
        .error-message {
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid #ff4444;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            color: #ff4444;
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="header">
            <h1>🏗️ Aurigraph DLT Management Dashboard</h1>
            <p>Multi-Channel Network Management | Quantum-Secured Infrastructure</p>
        </div>
        
        <div class="nav-tabs">
            <button class="nav-tab active" @click="activeTab = 'overview'">📊 Overview</button>
            <button class="nav-tab" @click="activeTab = 'channels'">🌐 Channels</button>
            <button class="nav-tab" @click="activeTab = 'validators'">🔥 Validators</button>
            <button class="nav-tab" @click="activeTab = 'nodes'">📡 Nodes</button>
            <button class="nav-tab" @click="activeTab = 'monitoring'">📈 Monitoring</button>
        </div>
        
        <!-- Overview Tab -->
        <div class="tab-content" :class="{active: activeTab === 'overview'}">
            <div class="cards-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">System Overview</div>
                    </div>
                    <div class="metrics-row" v-if="overview">
                        <div class="metric-item">
                            <div class="metric-value">{{ overview.channels?.total || 0 }}</div>
                            <div class="metric-label">Total Channels</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">{{ overview.validators?.total || 0 }}</div>
                            <div class="metric-label">Validators</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">{{ overview.nodes?.total || 0 }}</div>
                            <div class="metric-label">Basic Nodes</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">{{ formatTPS(overview.aggregateMetrics?.totalTPS || 0) }}</div>
                            <div class="metric-label">Total TPS</div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Quick Actions</div>
                    </div>
                    <button class="btn btn-primary" @click="showCreateChannelModal">➕ Create Channel</button>
                    <button class="btn btn-primary" @click="createTestEnvironment">🧪 Create TEST Environment</button>
                    <button class="btn btn-secondary" @click="refreshData">🔄 Refresh Data</button>
                </div>
            </div>
        </div>
        
        <!-- Channels Tab -->
        <div class="tab-content" :class="{active: activeTab === 'channels'}">
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Channel Management</div>
                    <button class="btn btn-primary" @click="showCreateChannelModal">➕ Create Channel</button>
                </div>
                
                <div v-if="channels.length === 0" class="loading">
                    No channels found. Create your first channel to get started.
                </div>
                
                <div v-for="channel in channels" :key="channel.id" class="card" style="margin-bottom: 15px;">
                    <div class="card-header">
                        <div>
                            <div class="card-title">{{ channel.name }} ({{ channel.id }})</div>
                            <div style="color: #888; font-size: 0.9em;">{{ channel.description }}</div>
                        </div>
                        <div class="status-badge" :class="'status-' + channel.status">{{ channel.status.toUpperCase() }}</div>
                    </div>
                    
                    <div class="metrics-row" v-if="getChannelMetrics(channel.id)">
                        <div class="metric-item">
                            <div class="metric-value">{{ formatTPS(getChannelMetrics(channel.id).totalTPS) }}</div>
                            <div class="metric-label">TPS</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">{{ getChannelMetrics(channel.id).activeValidators }}</div>
                            <div class="metric-label">Validators</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">{{ getChannelMetrics(channel.id).totalNodes }}</div>
                            <div class="metric-label">Total Nodes</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">{{ Math.round(getChannelMetrics(channel.id).averageLatency) }}ms</div>
                            <div class="metric-label">Latency</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 15px;">
                        <button class="btn btn-primary" v-if="channel.status === 'inactive'" 
                                @click="activateChannel(channel.id)">▶️ Activate</button>
                        <button class="btn btn-secondary" v-if="channel.status === 'active'" 
                                @click="deactivateChannel(channel.id)">⏸️ Deactivate</button>
                        <button class="btn btn-primary" @click="manageChannelNodes(channel.id)">⚙️ Manage Nodes</button>
                        <button class="btn btn-danger" @click="deleteChannel(channel.id)" 
                                v-if="channel.status === 'inactive'">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Create Channel Modal -->
        <div class="modal" :class="{show: showCreateChannel}">
            <div class="modal-content">
                <div class="modal-header">Create New Channel</div>
                <form @submit.prevent="createChannel">
                    <div class="form-group">
                        <label class="form-label">Channel ID</label>
                        <input type="text" class="form-control" v-model="newChannel.id" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Channel Name</label>
                        <input type="text" class="form-control" v-model="newChannel.name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" v-model="newChannel.description" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Environment</label>
                        <select class="form-control" v-model="newChannel.environment">
                            <option value="development">Development</option>
                            <option value="testing">Testing</option>
                            <option value="staging">Staging</option>
                            <option value="production">Production</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Target TPS</label>
                        <input type="number" class="form-control" v-model="newChannel.targetTPS" min="1000" step="1000">
                    </div>
                    <div class="form-group">
                        <label class="form-label">
                            <input type="checkbox" v-model="newChannel.quantumSecurity"> Quantum Security (Level 6)
                        </label>
                    </div>
                    <div style="margin-top: 20px;">
                        <button type="submit" class="btn btn-primary">Create Channel</button>
                        <button type="button" class="btn btn-secondary" @click="showCreateChannel = false">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
        
        <div v-if="message" :class="message.type + '-message'">{{ message.text }}</div>
    </div>
    
    <script>
        const { createApp } = Vue;
        
        createApp({
            data() {
                return {
                    activeTab: 'overview',
                    channels: [],
                    validators: [],
                    nodes: [],
                    metrics: [],
                    overview: null,
                    showCreateChannel: false,
                    newChannel: {
                        id: '',
                        name: '',
                        description: '',
                        environment: 'testing',
                        encryption: true,
                        quantumSecurity: true,
                        consensusType: 'HyperRAFT++',
                        targetTPS: 1000000,
                        maxNodes: 100
                    },
                    message: null
                }
            },
            
            async mounted() {
                await this.refreshData();
                setInterval(() => this.refreshData(), 10000); // Refresh every 10 seconds
            },
            
            methods: {
                async refreshData() {
                    try {
                        const [channelsRes, validatorsRes, nodesRes, overviewRes, metricsRes] = await Promise.all([
                            axios.get('/api/channels'),
                            axios.get('/api/validators'),
                            axios.get('/api/nodes'),
                            axios.get('/api/overview'),
                            axios.get('/api/metrics')
                        ]);
                        
                        this.channels = channelsRes.data.channels || [];
                        this.validators = validatorsRes.data.validators || [];
                        this.nodes = nodesRes.data.nodes || [];
                        this.overview = overviewRes.data.overview || {};
                        this.metrics = metricsRes.data.metrics || [];
                    } catch (error) {
                        console.error('Failed to refresh data:', error);
                    }
                },
                
                showCreateChannelModal() {
                    this.showCreateChannel = true;
                    this.newChannel = {
                        id: '',
                        name: '',
                        description: '',
                        environment: 'testing',
                        encryption: true,
                        quantumSecurity: true,
                        consensusType: 'HyperRAFT++',
                        targetTPS: 1000000,
                        maxNodes: 100
                    };
                },
                
                async createChannel() {
                    try {
                        const response = await axios.post('/api/channels', this.newChannel);
                        if (response.data.success) {
                            this.showMessage('Channel created successfully!', 'success');
                            this.showCreateChannel = false;
                            await this.refreshData();
                        }
                    } catch (error) {
                        this.showMessage('Failed to create channel: ' + error.response?.data?.error, 'error');
                    }
                },
                
                async activateChannel(channelId) {
                    try {
                        const response = await axios.post('/api/channels/' + channelId + '/activate');
                        if (response.data.success) {
                            this.showMessage('Channel activated successfully!', 'success');
                            await this.refreshData();
                        }
                    } catch (error) {
                        this.showMessage('Failed to activate channel: ' + error.response?.data?.error, 'error');
                    }
                },
                
                async deactivateChannel(channelId) {
                    try {
                        const response = await axios.post('/api/channels/' + channelId + '/deactivate');
                        if (response.data.success) {
                            this.showMessage('Channel deactivated successfully!', 'success');
                            await this.refreshData();
                        }
                    } catch (error) {
                        this.showMessage('Failed to deactivate channel: ' + error.response?.data?.error, 'error');
                    }
                },
                
                async deleteChannel(channelId) {
                    if (confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
                        try {
                            const response = await axios.delete('/api/channels/' + channelId);
                            if (response.data.success) {
                                this.showMessage('Channel deleted successfully!', 'success');
                                await this.refreshData();
                            }
                        } catch (error) {
                            this.showMessage('Failed to delete channel: ' + error.response?.data?.error, 'error');
                        }
                    }
                },
                
                async createTestEnvironment() {
                    try {
                        // Create TEST channel if it doesn't exist
                        let testChannel = this.channels.find(c => c.id === 'TEST');
                        if (!testChannel) {
                            await this.createChannel();
                        }
                        
                        // Create 5 validators
                        const validatorResponse = await axios.post('/api/channels/TEST/validators/bulk', {
                            count: 5,
                            startingPort: 8081
                        });
                        
                        // Create 20 basic nodes
                        const nodeResponse = await axios.post('/api/channels/TEST/nodes/bulk', {
                            nodeTypes: {
                                FULL: 8,
                                LIGHT: 7,
                                ARCHIVE: 2,
                                BRIDGE: 3
                            },
                            startingPort: 8101
                        });
                        
                        // Activate the channel
                        await this.activateChannel('TEST');
                        
                        this.showMessage('TEST environment created with 5 validators and 20 nodes!', 'success');
                        await this.refreshData();
                    } catch (error) {
                        this.showMessage('Failed to create TEST environment: ' + error.response?.data?.error, 'error');
                    }
                },
                
                manageChannelNodes(channelId) {
                    this.activeTab = 'validators';
                    // Could add channel filtering here
                },
                
                getChannelMetrics(channelId) {
                    return this.metrics.find(m => m.channelId === channelId) || {};
                },
                
                formatTPS(tps) {
                    if (tps >= 1000000) {
                        return (tps / 1000000).toFixed(1) + 'M';
                    } else if (tps >= 1000) {
                        return (tps / 1000).toFixed(0) + 'K';
                    }
                    return tps.toString();
                },
                
                showMessage(text, type) {
                    this.message = { text, type };
                    setTimeout(() => this.message = null, 5000);
                }
            }
        }).mount('#app');
    </script>
</body>
</html>`;
  }

  async start(port = 3040): Promise<void> {
    this.server = this.app.listen(port, () => {
      this.logger.info(`Aurigraph DLT Management Dashboard started on port ${port}`);
      this.logger.info(`Access dashboard at http://localhost:${port}`);
    });

    // Setup WebSocket for real-time updates
    this.wss = new WebSocketServer({ port: port + 1 });
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      this.logger.info('Management client connected');
      
      ws.on('close', () => {
        this.clients.delete(ws);
      });
    });

    // Start real-time updates
    setInterval(() => {
      const overview = this.channelManager.getSystemOverview();
      const metrics = this.channelManager.getAllChannelMetrics();
      
      this.broadcast({
        type: 'overview',
        data: overview
      });
      
      this.broadcast({
        type: 'metrics',
        data: metrics
      });
    }, 5000);
  }

  private broadcast(data: any): void {
    const message = JSON.stringify(data);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async stop(): Promise<void> {
    if (this.wss) {
      this.wss.close();
    }
    
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.logger.info('Management dashboard stopped');
          resolve();
        });
      });
    }
  }
}
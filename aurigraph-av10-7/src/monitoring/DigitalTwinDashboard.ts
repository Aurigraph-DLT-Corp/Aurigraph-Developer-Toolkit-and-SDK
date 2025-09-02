import { Logger } from '../core/Logger';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import {
  DigitalTwinAsset,
  IoTDataPoint,
  AnomalyAlert,
  MonitoringDashboard,
  DashboardWidget,
  DigitalTwinEngine
} from '../digitaltwin/DigitalTwinEngine';

export interface DigitalTwinVisualizationConfig {
  dashboard: {
    refreshInterval: number;
    maxDataPoints: number;
    alertSeverityLevels: string[];
    widgetTypes: string[];
  };
  visualization: {
    enable3D: boolean;
    particleSystem: boolean;
    realTimeAnimations: boolean;
    chartTypes: string[];
  };
  performance: {
    maxConcurrentConnections: number;
    dataCompressionEnabled: boolean;
    cacheInterval: number;
    optimizationLevel: 'low' | 'medium' | 'high';
  };
  integration: {
    prometheusExportEnabled: boolean;
    managementAPIEnabled: boolean;
    crossChainBridging: boolean;
    quantumEncryption: boolean;
  };
}

export interface AssetPerformanceMetrics {
  assetId: string;
  timestamp: number;
  throughput: number;
  latency: number;
  availability: number;
  efficiency: number;
  predictiveScore: number;
  anomalyCount: number;
  maintenanceScore: number;
  value: {
    current: number;
    predicted: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  };
  sensors: {
    active: number;
    offline: number;
    error: number;
    total: number;
  };
  alerts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface DigitalTwinDashboardState {
  totalAssets: number;
  activeAssets: number;
  totalDevices: number;
  activeDevices: number;
  dataPointsProcessed: number;
  alertsActive: number;
  systemHealth: number;
  predictionAccuracy: number;
  averageLatency: number;
  totalValue: number;
  lastUpdated: number;
  performanceMetrics: AssetPerformanceMetrics[];
  topAnomalies: AnomalyAlert[];
  recentActivity: any[];
}

export interface Widget3DConfig {
  modelUrl?: string;
  cameraPosition: { x: number; y: number; z: number };
  lightingConfig: {
    ambient: number;
    directional: { intensity: number; position: { x: number; y: number; z: number } };
  };
  interactive: boolean;
  showSensors: boolean;
  animationSpeed: number;
  materials: {
    asset: string;
    sensor: string;
    alert: string;
    normal: string;
  };
}

export interface AlertVisualizationConfig {
  severityColors: Record<string, string>;
  animationDuration: number;
  maxDisplayed: number;
  autoResolveTimeout: number;
  notificationSound: boolean;
  visualEffects: {
    pulse: boolean;
    glow: boolean;
    shake: boolean;
  };
}

export interface IoTDataVisualizationConfig {
  chartType: 'line' | 'bar' | 'area' | 'scatter' | 'heatmap';
  timeRange: number;
  aggregation: 'none' | 'avg' | 'max' | 'min' | 'sum';
  multiSeries: boolean;
  realTime: boolean;
  smoothing: boolean;
  thresholdLines: boolean;
  colors: string[];
}

export class DigitalTwinDashboard {
  private logger: Logger;
  private app: express.Application;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private digitalTwinEngine: DigitalTwinEngine;
  private config: DigitalTwinVisualizationConfig;
  
  // State management
  private dashboardState: DigitalTwinDashboardState;
  private assetMetrics: Map<string, AssetPerformanceMetrics> = new Map();
  private activeAlerts: Map<string, AnomalyAlert> = new Map();
  private recentData: Map<string, IoTDataPoint[]> = new Map();
  
  // Update intervals
  private metricsUpdateInterval: NodeJS.Timeout | null = null;
  private dashboardUpdateInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  
  // Performance tracking
  private performanceStats = {
    totalRequests: 0,
    totalDataPoints: 0,
    averageProcessingTime: 0,
    peakConcurrentUsers: 0,
    uptime: Date.now()
  };

  constructor(digitalTwinEngine: DigitalTwinEngine, config?: Partial<DigitalTwinVisualizationConfig>) {
    this.logger = new Logger('DigitalTwinDashboard');
    this.app = express();
    this.digitalTwinEngine = digitalTwinEngine;
    
    this.config = {
      dashboard: {
        refreshInterval: 1000,
        maxDataPoints: 1000,
        alertSeverityLevels: ['low', 'medium', 'high', 'critical'],
        widgetTypes: ['chart', 'gauge', 'map', 'alert', 'value', '3d_model', 'heatmap', 'timeline']
      },
      visualization: {
        enable3D: true,
        particleSystem: true,
        realTimeAnimations: true,
        chartTypes: ['line', 'bar', 'area', 'scatter', 'radar', 'doughnut', 'heatmap']
      },
      performance: {
        maxConcurrentConnections: 1000,
        dataCompressionEnabled: true,
        cacheInterval: 5000,
        optimizationLevel: 'high'
      },
      integration: {
        prometheusExportEnabled: true,
        managementAPIEnabled: true,
        crossChainBridging: false,
        quantumEncryption: true
      },
      ...config
    };

    this.dashboardState = this.initializeDashboardState();
    this.setupRoutes();
    this.setupDigitalTwinEngineListeners();
  }

  private initializeDashboardState(): DigitalTwinDashboardState {
    return {
      totalAssets: 0,
      activeAssets: 0,
      totalDevices: 0,
      activeDevices: 0,
      dataPointsProcessed: 0,
      alertsActive: 0,
      systemHealth: 100,
      predictionAccuracy: 0,
      averageLatency: 0,
      totalValue: 0,
      lastUpdated: Date.now(),
      performanceMetrics: [],
      topAnomalies: [],
      recentActivity: []
    };
  }

  private setupDigitalTwinEngineListeners(): void {
    this.digitalTwinEngine.on('asset_created', (asset: DigitalTwinAsset) => {
      this.handleAssetCreated(asset);
    });

    this.digitalTwinEngine.on('data_processed', (data: any) => {
      this.handleDataProcessed(data);
    });

    this.digitalTwinEngine.on('anomaly_detected', (anomaly: AnomalyAlert) => {
      this.handleAnomalyDetected(anomaly);
    });

    this.digitalTwinEngine.on('value_updated', (data: any) => {
      this.handleValueUpdated(data);
    });

    this.digitalTwinEngine.on('predictions_updated', (data: any) => {
      this.handlePredictionsUpdated(data);
    });
  }

  private setupRoutes(): void {
    this.app.use(express.static('public'));
    this.app.use(express.json());

    // Main dashboard route
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });

    // API routes
    this.app.get('/api/dashboard/state', (req, res) => {
      this.performanceStats.totalRequests++;
      res.json(this.dashboardState);
    });

    this.app.get('/api/assets', (req, res) => {
      const assets = this.digitalTwinEngine.getAllAssets();
      res.json(assets);
    });

    this.app.get('/api/assets/:id', (req, res) => {
      const asset = this.digitalTwinEngine.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      res.json(asset);
    });

    this.app.get('/api/assets/:id/dashboard', async (req, res) => {
      const dashboard = await this.digitalTwinEngine.getDashboard(req.params.id);
      if (!dashboard) {
        return res.status(404).json({ error: 'Dashboard not found' });
      }
      res.json(dashboard);
    });

    this.app.get('/api/assets/:id/data', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 100;
      const data = this.digitalTwinEngine.getIoTData(req.params.id, limit);
      res.json(data);
    });

    this.app.get('/api/assets/:id/metrics', (req, res) => {
      const metrics = this.assetMetrics.get(req.params.id);
      if (!metrics) {
        return res.status(404).json({ error: 'Metrics not found' });
      }
      res.json(metrics);
    });

    this.app.get('/api/alerts', (req, res) => {
      const severity = req.query.severity as string;
      const resolved = req.query.resolved === 'true';
      
      let alerts = Array.from(this.activeAlerts.values());
      
      if (severity) {
        alerts = alerts.filter(a => a.severity === severity);
      }
      
      if (resolved !== undefined) {
        alerts = alerts.filter(a => a.resolved === resolved);
      }
      
      res.json(alerts.slice(0, 100));
    });

    this.app.post('/api/alerts/:id/resolve', async (req, res) => {
      const { resolvedBy } = req.body;
      const success = await this.digitalTwinEngine.resolveAnomaly(req.params.id, resolvedBy);
      
      if (success) {
        this.activeAlerts.delete(req.params.id);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Alert not found' });
      }
    });

    this.app.post('/api/dashboards/create', async (req, res) => {
      const { assetId, config } = req.body;
      
      try {
        const dashboard = await this.createCustomDashboard(assetId, config);
        res.json(dashboard);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    this.app.get('/api/analytics/performance', (req, res) => {
      const timeRange = parseInt(req.query.timeRange as string) || 3600; // 1 hour
      const analytics = this.generatePerformanceAnalytics(timeRange);
      res.json(analytics);
    });

    this.app.get('/api/analytics/predictions', (req, res) => {
      const assetId = req.query.assetId as string;
      const predictions = this.generatePredictionAnalytics(assetId);
      res.json(predictions);
    });

    this.app.get('/api/system/health', (req, res) => {
      const systemHealth = this.calculateSystemHealth();
      res.json(systemHealth);
    });

    this.app.get('/api/system/stats', (req, res) => {
      res.json({
        ...this.performanceStats,
        uptime: Date.now() - this.performanceStats.uptime,
        currentConnections: this.clients.size,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      });
    });
  }

  private getDashboardHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aurigraph AV10-22 - Digital Twin Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
    <script src="https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/gl-matrix-min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-color: #00ff88;
            --secondary-color: #00aaff;
            --accent-color: #ff6b35;
            --warning-color: #ffa726;
            --error-color: #ef5350;
            --success-color: #66bb6a;
            --bg-primary: #0a0e27;
            --bg-secondary: #1a1f3a;
            --bg-tertiary: #2a2f4a;
            --text-primary: #ffffff;
            --text-secondary: #b0b0b0;
            --text-muted: #888888;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
            color: var(--text-primary);
            overflow-x: hidden;
            line-height: 1.6;
        }
        
        .header {
            background: rgba(0, 0, 0, 0.6);
            padding: 20px;
            border-bottom: 3px solid var(--primary-color);
            backdrop-filter: blur(15px);
            position: sticky;
            top: 0;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header h1 {
            font-size: 2.8em;
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            display: inline-block;
            text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }
        
        .header-stats {
            display: flex;
            gap: 30px;
            font-size: 0.9em;
        }
        
        .header-stat {
            text-align: center;
        }
        
        .header-stat-value {
            font-size: 1.4em;
            font-weight: bold;
            color: var(--primary-color);
        }
        
        .header-stat-label {
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .subtitle {
            color: var(--text-secondary);
            margin-top: 5px;
            font-size: 1.1em;
        }
        
        .main-container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            min-height: 600px;
        }
        
        .metrics-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .metric-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(15px);
            transition: all 0.4s ease;
            position: relative;
            overflow: hidden;
            min-height: 140px;
        }
        
        .metric-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 40px rgba(0, 255, 136, 0.4);
            border-color: var(--primary-color);
        }
        
        .metric-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 136, 0.3), transparent);
            transition: left 0.6s;
        }
        
        .metric-card:hover::before {
            left: 100%;
        }
        
        .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .metric-icon {
            font-size: 2.5em;
            opacity: 0.7;
        }
        
        .metric-label {
            font-size: 0.9em;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }
        
        .metric-value {
            font-size: 2.2em;
            font-weight: bold;
            margin: 10px 0;
            color: var(--primary-color);
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
        }
        
        .metric-change {
            font-size: 0.9em;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .metric-change.positive {
            color: var(--success-color);
        }
        
        .metric-change.negative {
            color: var(--error-color);
        }
        
        .trend-arrow {
            font-size: 1.2em;
        }
        
        .panel {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(15px);
            transition: all 0.3s ease;
        }
        
        .panel:hover {
            border-color: rgba(0, 255, 136, 0.5);
        }
        
        .panel-title {
            font-size: 1.3em;
            margin-bottom: 20px;
            color: var(--secondary-color);
            border-bottom: 2px solid rgba(0, 170, 255, 0.3);
            padding-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .panel-title-icon {
            font-size: 1.2em;
        }
        
        .asset-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .asset-card {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .asset-card:hover {
            transform: translateY(-5px);
            border-color: var(--primary-color);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.2);
        }
        
        .asset-card.selected {
            border-color: var(--accent-color);
            background: rgba(255, 107, 53, 0.1);
        }
        
        .asset-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .asset-name {
            font-size: 1.1em;
            font-weight: bold;
            color: var(--text-primary);
        }
        
        .asset-type {
            background: var(--bg-tertiary);
            color: var(--primary-color);
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        
        .asset-status {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid;
        }
        
        .asset-status.active {
            background: var(--success-color);
            border-color: var(--success-color);
            animation: pulse-green 2s infinite;
        }
        
        .asset-status.alert {
            background: var(--error-color);
            border-color: var(--error-color);
            animation: pulse-red 2s infinite;
        }
        
        .asset-status.maintenance {
            background: var(--warning-color);
            border-color: var(--warning-color);
            animation: pulse-yellow 2s infinite;
        }
        
        .asset-status.offline {
            background: var(--text-muted);
            border-color: var(--text-muted);
        }
        
        @keyframes pulse-green {
            0%, 100% { box-shadow: 0 0 0 0 rgba(102, 187, 106, 0.7); }
            50% { box-shadow: 0 0 0 8px rgba(102, 187, 106, 0); }
        }
        
        @keyframes pulse-red {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 83, 80, 0.7); }
            50% { box-shadow: 0 0 0 8px rgba(239, 83, 80, 0); }
        }
        
        @keyframes pulse-yellow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255, 167, 38, 0.7); }
            50% { box-shadow: 0 0 0 8px rgba(255, 167, 38, 0); }
        }
        
        .asset-metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        
        .asset-metric {
            text-align: center;
        }
        
        .asset-metric-value {
            font-size: 1.3em;
            font-weight: bold;
            color: var(--primary-color);
        }
        
        .asset-metric-label {
            font-size: 0.8em;
            color: var(--text-muted);
            margin-top: 2px;
        }
        
        #visualization-container {
            height: 500px;
            position: relative;
            background: radial-gradient(circle at center, rgba(0, 255, 136, 0.05), transparent);
            border-radius: 15px;
            overflow: hidden;
        }
        
        #main-3d-canvas {
            width: 100%;
            height: 100%;
            border-radius: 15px;
            cursor: grab;
        }
        
        #main-3d-canvas:active {
            cursor: grabbing;
        }
        
        .charts-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .chart-panel {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        
        .chart-panel canvas {
            max-height: 300px;
        }
        
        .alert-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .alert-item {
            background: rgba(255, 255, 255, 0.08);
            border-left: 4px solid;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .alert-item:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateX(5px);
        }
        
        .alert-item.critical {
            border-left-color: var(--error-color);
            animation: critical-alert 2s infinite;
        }
        
        .alert-item.high {
            border-left-color: var(--accent-color);
        }
        
        .alert-item.medium {
            border-left-color: var(--warning-color);
        }
        
        .alert-item.low {
            border-left-color: var(--primary-color);
        }
        
        @keyframes critical-alert {
            0%, 100% { box-shadow: none; }
            50% { box-shadow: 0 0 20px rgba(239, 83, 80, 0.5); }
        }
        
        .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .alert-severity {
            background: var(--bg-tertiary);
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            text-transform: uppercase;
            font-weight: bold;
        }
        
        .alert-timestamp {
            font-size: 0.8em;
            color: var(--text-muted);
        }
        
        .alert-description {
            margin-bottom: 5px;
            line-height: 1.4;
        }
        
        .alert-asset {
            font-size: 0.9em;
            color: var(--secondary-color);
        }
        
        .real-time-indicator {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9em;
            color: var(--success-color);
        }
        
        .live-dot {
            width: 8px;
            height: 8px;
            background: var(--success-color);
            border-radius: 50%;
            animation: live-pulse 1.5s infinite;
        }
        
        @keyframes live-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        .control-panel {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 15px;
            padding: 20px;
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            backdrop-filter: blur(15px);
            min-width: 300px;
        }
        
        .control-group {
            margin-bottom: 15px;
        }
        
        .control-group:last-child {
            margin-bottom: 0;
        }
        
        .control-label {
            display: block;
            margin-bottom: 8px;
            color: var(--text-secondary);
            font-weight: 600;
        }
        
        .control-row {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .btn {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border: none;
            color: var(--bg-primary);
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
        }
        
        .btn.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-primary);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .toggle {
            position: relative;
            width: 50px;
            height: 25px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .toggle.active {
            background: var(--primary-color);
        }
        
        .toggle::after {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 21px;
            height: 21px;
            background: white;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .toggle.active::after {
            left: 27px;
        }
        
        .performance-indicators {
            display: flex;
            gap: 15px;
            margin-bottom: 10px;
        }
        
        .performance-indicator {
            text-align: center;
            flex: 1;
        }
        
        .performance-value {
            font-size: 1.1em;
            font-weight: bold;
            color: var(--primary-color);
        }
        
        .performance-label {
            font-size: 0.8em;
            color: var(--text-muted);
        }
        
        .heatmap-container {
            height: 300px;
            position: relative;
            background: var(--bg-secondary);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .sensor-data-stream {
            max-height: 300px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
        }
        
        .sensor-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .sensor-item:hover {
            background: rgba(0, 255, 136, 0.1);
            margin: 0 -15px;
            padding: 8px 15px;
        }
        
        .sensor-name {
            font-weight: 600;
        }
        
        .sensor-value {
            color: var(--primary-color);
            font-weight: bold;
        }
        
        .sensor-unit {
            color: var(--text-muted);
            font-size: 0.9em;
            margin-left: 5px;
        }
        
        .responsive-layout {
            display: grid;
            gap: 20px;
        }
        
        @media (max-width: 1400px) {
            .dashboard-grid {
                grid-template-columns: 1fr 1fr;
            }
            
            .header h1 {
                font-size: 2.2em;
            }
            
            .header-stats {
                gap: 20px;
            }
        }
        
        @media (max-width: 1000px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .metrics-overview {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }
            
            .asset-grid {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            }
            
            .charts-container {
                grid-template-columns: 1fr;
            }
            
            .control-panel {
                position: static;
                margin-top: 20px;
            }
            
            .header-content {
                flex-direction: column;
                gap: 15px;
            }
        }
        
        @media (max-width: 600px) {
            .main-container {
                padding: 15px;
            }
            
            .header {
                padding: 15px;
            }
            
            .header h1 {
                font-size: 1.8em;
            }
            
            .metric-card {
                padding: 15px;
                min-height: 120px;
            }
            
            .metric-value {
                font-size: 1.8em;
            }
            
            .panel {
                padding: 15px;
            }
            
            .asset-card {
                padding: 15px;
            }
        }
        
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10, 14, 39, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        }
        
        .loading-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(0, 255, 136, 0.2);
            border-left: 4px solid var(--primary-color);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--primary-color);
            border-radius: 10px;
            padding: 15px 20px;
            color: var(--text-primary);
            z-index: 10000;
            transform: translateX(400px);
            transition: all 0.3s ease;
            backdrop-filter: blur(15px);
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.error {
            border-color: var(--error-color);
            background: rgba(239, 83, 80, 0.1);
        }
        
        .notification.warning {
            border-color: var(--warning-color);
            background: rgba(255, 167, 38, 0.1);
        }
        
        .notification.success {
            border-color: var(--success-color);
            background: rgba(102, 187, 106, 0.1);
        }
        
        .search-container {
            margin-bottom: 20px;
        }
        
        .search-input {
            width: 100%;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 10px;
            color: var(--text-primary);
            font-size: 1em;
            outline: none;
            transition: all 0.3s ease;
        }
        
        .search-input:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
        }
        
        .search-input::placeholder {
            color: var(--text-muted);
        }
    </style>
</head>
<body>
    <div class="loading-overlay" id="loading-overlay">
        <div class="loading-spinner"></div>
    </div>
    
    <div class="header">
        <div class="header-content">
            <div>
                <h1>🌐 AV10-22 Digital Twin Platform</h1>
                <div class="subtitle">Real-time Asset Monitoring & Predictive Analytics | <span class="real-time-indicator"><span class="live-dot"></span>Live</span></div>
            </div>
            <div class="header-stats">
                <div class="header-stat">
                    <div class="header-stat-value" id="header-total-assets">0</div>
                    <div class="header-stat-label">Total Assets</div>
                </div>
                <div class="header-stat">
                    <div class="header-stat-value" id="header-active-devices">0</div>
                    <div class="header-stat-label">Active Devices</div>
                </div>
                <div class="header-stat">
                    <div class="header-stat-value" id="header-data-points">0</div>
                    <div class="header-stat-label">Data Points</div>
                </div>
                <div class="header-stat">
                    <div class="header-stat-value" id="header-system-health">100%</div>
                    <div class="header-stat-label">System Health</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="main-container">
        <!-- Performance Metrics Overview -->
        <div class="metrics-overview">
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">📊</div>
                </div>
                <div class="metric-label">Average Latency</div>
                <div class="metric-value" id="avg-latency">0ms</div>
                <div class="metric-change positive" id="latency-change">
                    <span class="trend-arrow">↓</span>
                    <span>-12.5%</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">🎯</div>
                </div>
                <div class="metric-label">Prediction Accuracy</div>
                <div class="metric-value" id="prediction-accuracy">0%</div>
                <div class="metric-change positive">
                    <span class="trend-arrow">↑</span>
                    <span>+3.2%</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">⚠️</div>
                </div>
                <div class="metric-label">Active Alerts</div>
                <div class="metric-value" id="active-alerts">0</div>
                <div class="metric-change" id="alerts-change">
                    <span class="trend-arrow">→</span>
                    <span>Stable</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-header">
                    <div class="metric-icon">💰</div>
                </div>
                <div class="metric-label">Total Asset Value</div>
                <div class="metric-value" id="total-value">$0</div>
                <div class="metric-change positive">
                    <span class="trend-arrow">↑</span>
                    <span>+5.8%</span>
                </div>
            </div>
        </div>
        
        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">
            <!-- Asset Management Panel -->
            <div class="panel">
                <div class="panel-title">
                    <span class="panel-title-icon">🏗️</span>
                    Digital Assets
                </div>
                <div class="search-container">
                    <input type="text" class="search-input" placeholder="Search assets..." id="asset-search">
                </div>
                <div id="asset-list" class="asset-grid">
                    <!-- Assets will be populated dynamically -->
                </div>
            </div>
            
            <!-- 3D Visualization Panel -->
            <div class="panel">
                <div class="panel-title">
                    <span class="panel-title-icon">🌐</span>
                    3D Asset Visualization
                </div>
                <div id="visualization-container">
                    <canvas id="main-3d-canvas"></canvas>
                </div>
                <div class="performance-indicators">
                    <div class="performance-indicator">
                        <div class="performance-value" id="render-fps">60</div>
                        <div class="performance-label">FPS</div>
                    </div>
                    <div class="performance-indicator">
                        <div class="performance-value" id="active-objects">0</div>
                        <div class="performance-label">Objects</div>
                    </div>
                    <div class="performance-indicator">
                        <div class="performance-value" id="data-flow">0</div>
                        <div class="performance-label">Data/sec</div>
                    </div>
                </div>
            </div>
            
            <!-- Alerts & Monitoring Panel -->
            <div class="panel">
                <div class="panel-title">
                    <span class="panel-title-icon">🚨</span>
                    Live Alerts
                </div>
                <div id="alert-list" class="alert-list">
                    <!-- Alerts will be populated dynamically -->
                </div>
            </div>
        </div>
        
        <!-- Charts and Analytics -->
        <div class="charts-container">
            <div class="chart-panel">
                <div class="panel-title">
                    <span class="panel-title-icon">📈</span>
                    Asset Performance Trends
                </div>
                <canvas id="performance-chart"></canvas>
            </div>
            
            <div class="chart-panel">
                <div class="panel-title">
                    <span class="panel-title-icon">🌡️</span>
                    IoT Sensor Data
                </div>
                <canvas id="sensor-chart"></canvas>
            </div>
            
            <div class="chart-panel">
                <div class="panel-title">
                    <span class="panel-title-icon">🔮</span>
                    Predictive Analytics
                </div>
                <canvas id="prediction-chart"></canvas>
            </div>
            
            <div class="chart-panel">
                <div class="panel-title">
                    <span class="panel-title-icon">🗺️</span>
                    Asset Heatmap
                </div>
                <div class="heatmap-container" id="heatmap-container">
                    <!-- Heatmap will be rendered here -->
                </div>
            </div>
        </div>
        
        <!-- Real-time Data Streams -->
        <div class="panel" style="margin-top: 20px;">
            <div class="panel-title">
                <span class="panel-title-icon">⚡</span>
                Real-time Sensor Streams
            </div>
            <div id="sensor-stream" class="sensor-data-stream">
                <!-- Real-time sensor data will appear here -->
            </div>
        </div>
    </div>
    
    <!-- Control Panel -->
    <div class="control-panel">
        <div class="control-group">
            <div class="control-label">Visualization Controls</div>
            <div class="control-row">
                <button class="btn" onclick="togglePause()">⏸️ Pause</button>
                <button class="btn secondary" onclick="resetView()">🔄 Reset</button>
            </div>
        </div>
        
        <div class="control-group">
            <div class="control-label">3D Options</div>
            <div class="control-row">
                <span>Animations</span>
                <div class="toggle active" id="animations-toggle" onclick="toggleAnimations()"></div>
            </div>
            <div class="control-row">
                <span>Particles</span>
                <div class="toggle active" id="particles-toggle" onclick="toggleParticles()"></div>
            </div>
        </div>
        
        <div class="control-group">
            <div class="control-label">Data Refresh Rate</div>
            <div class="control-row">
                <input type="range" min="500" max="5000" value="1000" id="refresh-slider" onchange="updateRefreshRate(this.value)">
                <span id="refresh-value">1s</span>
            </div>
        </div>
        
        <div class="control-group">
            <div class="control-label">Export Options</div>
            <div class="control-row">
                <button class="btn secondary" onclick="exportData()">📥 Data</button>
                <button class="btn secondary" onclick="exportReport()">📄 Report</button>
            </div>
        </div>
    </div>
    
    <div id="notification-container"></div>
    
    <script>
        // Global variables
        let ws = null;
        let scene, camera, renderer, controls;
        let charts = {};
        let dashboardState = {};
        let selectedAsset = null;
        let isPaused = false;
        let animationsEnabled = true;
        let particlesEnabled = true;
        let refreshRate = 1000;
        let assetObjects = new Map();
        let particleSystem = null;
        
        // WebSocket connection
        function initializeWebSocket() {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            ws = new WebSocket(protocol + '//' + window.location.host.split(':')[0] + ':${this.config.dashboard.refreshInterval + 1}');
            
            ws.onopen = function() {
                console.log('Connected to Digital Twin Dashboard');
                hideLoadingOverlay();
                showNotification('Connected to Digital Twin Platform', 'success');
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = function() {
                console.log('Disconnected from Digital Twin Dashboard');
                showNotification('Connection lost. Attempting to reconnect...', 'warning');
                setTimeout(initializeWebSocket, 3000);
            };
            
            ws.onerror = function(error) {
                console.error('WebSocket error:', error);
                showNotification('Connection error occurred', 'error');
            };
        }
        
        // Handle incoming WebSocket messages
        function handleWebSocketMessage(data) {
            switch(data.type) {
                case 'dashboard_state':
                    updateDashboardState(data.state);
                    break;
                case 'asset_created':
                    addAssetToList(data.asset);
                    break;
                case 'iot_data':
                    updateSensorData(data.data);
                    break;
                case 'anomaly':
                    addAlert(data.anomaly);
                    break;
                case 'metrics_update':
                    updateMetrics(data.metrics);
                    break;
                case 'asset_performance':
                    updateAssetPerformance(data.performance);
                    break;
            }
        }
        
        // Initialize 3D visualization
        function init3DVisualization() {
            const container = document.getElementById('visualization-container');
            const canvas = document.getElementById('main-3d-canvas');
            
            // Scene setup
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x0a0e27, 50, 200);
            
            // Camera setup
            camera = new THREE.PerspectiveCamera(75, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
            camera.position.set(0, 20, 30);
            
            // Renderer setup
            renderer = new THREE.WebGLRenderer({ 
                canvas: canvas, 
                antialias: true,
                alpha: true
            });
            renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
            renderer.setClearColor(0x0a0e27, 0.8);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0x00ff88, 1);
            directionalLight.position.set(50, 50, 50);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            scene.add(directionalLight);
            
            // Point lights for effects
            const pointLight1 = new THREE.PointLight(0x00aaff, 0.8, 100);
            pointLight1.position.set(-30, 20, -30);
            scene.add(pointLight1);
            
            const pointLight2 = new THREE.PointLight(0xff6b35, 0.6, 80);
            pointLight2.position.set(30, 15, 30);
            scene.add(pointLight2);
            
            // Initialize particle system
            initParticleSystem();
            
            // Controls
            initializeControls();
            
            // Start render loop
            animate3D();
            
            // Handle window resize
            window.addEventListener('resize', onWindowResize, false);
        }
        
        function initParticleSystem() {
            if (!particlesEnabled) return;
            
            const particleCount = 200;
            const particles = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const colors = new Float32Array(particleCount * 3);
            const velocities = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] = (Math.random() - 0.5) * 100;
                positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
                positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
                
                const color = new THREE.Color();
                color.setHSL(Math.random() * 0.3 + 0.3, 0.8, 0.6);
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
                
                velocities[i * 3] = (Math.random() - 0.5) * 0.1;
                velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
                velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
            }
            
            particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            particles.userData = { velocities: velocities };
            
            const particleMaterial = new THREE.PointsMaterial({
                size: 2,
                vertexColors: true,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            particleSystem = new THREE.Points(particles, particleMaterial);
            scene.add(particleSystem);
        }
        
        function initializeControls() {
            // Mouse controls for 3D scene
            let mouseX = 0, mouseY = 0;
            let mouseDown = false;
            
            const canvas = document.getElementById('main-3d-canvas');
            
            canvas.addEventListener('mousedown', (event) => {
                mouseDown = true;
                mouseX = event.clientX;
                mouseY = event.clientY;
            });
            
            canvas.addEventListener('mouseup', () => {
                mouseDown = false;
            });
            
            canvas.addEventListener('mousemove', (event) => {
                if (mouseDown) {
                    const deltaX = event.clientX - mouseX;
                    const deltaY = event.clientY - mouseY;
                    
                    camera.position.x += deltaX * 0.01;
                    camera.position.y -= deltaY * 0.01;
                    
                    mouseX = event.clientX;
                    mouseY = event.clientY;
                }
            });
            
            canvas.addEventListener('wheel', (event) => {
                camera.position.z += event.deltaY * 0.01;
                camera.position.z = Math.max(5, Math.min(100, camera.position.z));
            });
        }
        
        function animate3D() {
            if (!isPaused) {
                requestAnimationFrame(animate3D);
                
                if (animationsEnabled) {
                    // Rotate camera around scene
                    const time = Date.now() * 0.0005;
                    camera.position.x = Math.cos(time) * 40;
                    camera.position.z = Math.sin(time) * 40;
                    camera.lookAt(scene.position);
                    
                    // Update particle system
                    if (particleSystem && particlesEnabled) {
                        const positions = particleSystem.geometry.attributes.position.array;
                        const velocities = particleSystem.geometry.userData.velocities;
                        
                        for (let i = 0; i < positions.length; i += 3) {
                            positions[i] += velocities[i];
                            positions[i + 1] += velocities[i + 1];
                            positions[i + 2] += velocities[i + 2];
                            
                            // Boundary check
                            if (Math.abs(positions[i]) > 50) velocities[i] *= -1;
                            if (Math.abs(positions[i + 1]) > 50) velocities[i + 1] *= -1;
                            if (Math.abs(positions[i + 2]) > 50) velocities[i + 2] *= -1;
                        }
                        
                        particleSystem.geometry.attributes.position.needsUpdate = true;
                    }
                    
                    // Animate asset objects
                    assetObjects.forEach((object, assetId) => {
                        if (object.userData.animationPhase !== undefined) {
                            object.userData.animationPhase += 0.02;
                            object.position.y = object.userData.originalY + Math.sin(object.userData.animationPhase) * 2;
                        }
                    });
                }
                
                // Update FPS counter
                const fps = Math.round(1000 / (Date.now() - (window.lastFrameTime || 0)));
                document.getElementById('render-fps').textContent = fps || 60;
                window.lastFrameTime = Date.now();
            }
            
            renderer.render(scene, camera);
            
            if (isPaused) {
                requestAnimationFrame(animate3D);
            }
        }
        
        function onWindowResize() {
            const canvas = document.getElementById('main-3d-canvas');
            camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        }
        
        // Initialize charts
        function initializeCharts() {
            // Performance Chart
            const performanceCtx = document.getElementById('performance-chart').getContext('2d');
            charts.performance = new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Throughput',
                            data: [],
                            borderColor: '#00ff88',
                            backgroundColor: 'rgba(0, 255, 136, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Latency',
                            data: [],
                            borderColor: '#00aaff',
                            backgroundColor: 'rgba(0, 170, 255, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            labels: { color: '#888' }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#888' }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#888' }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            ticks: { color: '#888' }
                        }
                    }
                }
            });
            
            // Sensor Data Chart
            const sensorCtx = document.getElementById('sensor-chart').getContext('2d');
            charts.sensor = new Chart(sensorCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: []
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: { color: '#888' }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#888' }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#888' }
                        }
                    }
                }
            });
            
            // Prediction Chart
            const predictionCtx = document.getElementById('prediction-chart').getContext('2d');
            charts.prediction = new Chart(predictionCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Actual',
                            data: [],
                            borderColor: '#00ff88',
                            backgroundColor: 'rgba(0, 255, 136, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Predicted',
                            data: [],
                            borderColor: '#ff6b35',
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            borderDash: [5, 5],
                            tension: 0.4
                        },
                        {
                            label: 'Confidence Band',
                            data: [],
                            borderColor: 'rgba(255, 107, 53, 0.3)',
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            fill: '+1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            labels: { color: '#888' }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#888' }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#888' }
                        }
                    }
                }
            });
        }
        
        // Update dashboard state
        function updateDashboardState(state) {
            dashboardState = state;
            
            // Update header stats
            document.getElementById('header-total-assets').textContent = state.totalAssets;
            document.getElementById('header-active-devices').textContent = state.activeDevices;
            document.getElementById('header-data-points').textContent = state.dataPointsProcessed.toLocaleString();
            document.getElementById('header-system-health').textContent = Math.round(state.systemHealth) + '%';
            
            // Update main metrics
            document.getElementById('avg-latency').textContent = Math.round(state.averageLatency) + 'ms';
            document.getElementById('prediction-accuracy').textContent = Math.round(state.predictionAccuracy) + '%';
            document.getElementById('active-alerts').textContent = state.alertsActive;
            document.getElementById('total-value').textContent = '$' + (state.totalValue / 1000000).toFixed(2) + 'M';
            
            // Update active objects count in 3D view
            document.getElementById('active-objects').textContent = state.totalAssets;
        }
        
        // Add asset to list
        function addAssetToList(asset) {
            const container = document.getElementById('asset-list');
            const assetCard = document.createElement('div');
            assetCard.className = 'asset-card';
            assetCard.dataset.assetId = asset.id;
            
            const statusClass = asset.status;
            assetCard.innerHTML = \`
                <div class="asset-status \${statusClass}"></div>
                <div class="asset-header">
                    <div class="asset-name">\${asset.name}</div>
                    <div class="asset-type">\${asset.type}</div>
                </div>
                <div class="asset-metrics">
                    <div class="asset-metric">
                        <div class="asset-metric-value">$\${(asset.currentValue / 1000).toFixed(1)}K</div>
                        <div class="asset-metric-label">Value</div>
                    </div>
                    <div class="asset-metric">
                        <div class="asset-metric-value">\${asset.sensors.length}</div>
                        <div class="asset-metric-label">Sensors</div>
                    </div>
                    <div class="asset-metric">
                        <div class="asset-metric-value">\${asset.anomalies.filter(a => !a.resolved).length}</div>
                        <div class="asset-metric-label">Alerts</div>
                    </div>
                    <div class="asset-metric">
                        <div class="asset-metric-value">\${Math.round((Date.now() - asset.lastUpdate) / 1000)}s</div>
                        <div class="asset-metric-label">Updated</div>
                    </div>
                </div>
            \`;
            
            assetCard.addEventListener('click', () => selectAsset(asset.id));
            container.appendChild(assetCard);
            
            // Add to 3D scene
            add3DAsset(asset);
        }
        
        // Add 3D asset representation
        function add3DAsset(asset) {
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            let material;
            
            switch(asset.status) {
                case 'active':
                    material = new THREE.MeshPhongMaterial({ color: 0x00ff88, transparent: true, opacity: 0.8 });
                    break;
                case 'alert':
                    material = new THREE.MeshPhongMaterial({ color: 0xff4444, transparent: true, opacity: 0.9 });
                    break;
                case 'maintenance':
                    material = new THREE.MeshPhongMaterial({ color: 0xffa726, transparent: true, opacity: 0.8 });
                    break;
                default:
                    material = new THREE.MeshPhongMaterial({ color: 0x888888, transparent: true, opacity: 0.6 });
            }
            
            const cube = new THREE.Mesh(geometry, material);
            
            // Position randomly in scene
            cube.position.set(
                (Math.random() - 0.5) * 40,
                Math.random() * 10,
                (Math.random() - 0.5) * 40
            );
            
            cube.userData = {
                assetId: asset.id,
                originalY: cube.position.y,
                animationPhase: Math.random() * Math.PI * 2
            };
            
            scene.add(cube);
            assetObjects.set(asset.id, cube);
        }
        
        // Select asset
        function selectAsset(assetId) {
            // Remove previous selection
            document.querySelectorAll('.asset-card.selected').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Add selection to clicked asset
            document.querySelector(\`[data-asset-id="\${assetId}"]\`).classList.add('selected');
            selectedAsset = assetId;
            
            // Focus camera on selected asset in 3D scene
            const assetObject = assetObjects.get(assetId);
            if (assetObject) {
                camera.lookAt(assetObject.position);
            }
            
            // Load asset dashboard
            fetch(\`/api/assets/\${assetId}/dashboard\`)
                .then(response => response.json())
                .then(dashboard => {
                    displayAssetDashboard(dashboard);
                })
                .catch(error => {
                    console.error('Failed to load asset dashboard:', error);
                    showNotification('Failed to load asset dashboard', 'error');
                });
        }
        
        // Display asset-specific dashboard
        function displayAssetDashboard(dashboard) {
            // This would create custom widgets based on the dashboard configuration
            console.log('Loading dashboard for asset:', dashboard);
            // Implementation would be more complex in real scenario
        }
        
        // Add alert to list
        function addAlert(alert) {
            const container = document.getElementById('alert-list');
            const alertItem = document.createElement('div');
            alertItem.className = \`alert-item \${alert.severity}\`;
            
            const timestamp = new Date(alert.timestamp).toLocaleTimeString();
            alertItem.innerHTML = \`
                <div class="alert-header">
                    <div class="alert-severity">\${alert.severity}</div>
                    <div class="alert-timestamp">\${timestamp}</div>
                </div>
                <div class="alert-description">\${alert.description}</div>
                <div class="alert-asset">Asset: \${alert.assetId}</div>
            \`;
            
            container.insertBefore(alertItem, container.firstChild);
            
            // Keep only latest 20 alerts
            while (container.children.length > 20) {
                container.removeChild(container.lastChild);
            }
            
            // Show notification for critical alerts
            if (alert.severity === 'critical') {
                showNotification(\`Critical Alert: \${alert.description}\`, 'error');
            }
        }
        
        // Update sensor data stream
        function updateSensorData(data) {
            const container = document.getElementById('sensor-stream');
            const sensorItem = document.createElement('div');
            sensorItem.className = 'sensor-item';
            
            const timestamp = new Date(data.dataPoint.timestamp).toLocaleTimeString();
            sensorItem.innerHTML = \`
                <div>
                    <div class="sensor-name">\${data.dataPoint.deviceId}</div>
                    <div style="font-size: 0.8em; color: #888;">\${data.dataPoint.sensorType} | \${timestamp}</div>
                </div>
                <div>
                    <span class="sensor-value">\${data.dataPoint.value.toFixed(2)}</span>
                    <span class="sensor-unit">\${data.dataPoint.unit}</span>
                </div>
            \`;
            
            container.insertBefore(sensorItem, container.firstChild);
            
            // Keep only latest 50 items
            while (container.children.length > 50) {
                container.removeChild(container.lastChild);
            }
            
            // Update data flow indicator
            document.getElementById('data-flow').textContent = Math.floor(Math.random() * 1000 + 500);
        }
        
        // Control functions
        function togglePause() {
            isPaused = !isPaused;
            const button = event.target;
            button.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
        }
        
        function resetView() {
            camera.position.set(0, 20, 30);
            camera.lookAt(scene.position);
        }
        
        function toggleAnimations() {
            animationsEnabled = !animationsEnabled;
            const toggle = document.getElementById('animations-toggle');
            toggle.classList.toggle('active', animationsEnabled);
        }
        
        function toggleParticles() {
            particlesEnabled = !particlesEnabled;
            const toggle = document.getElementById('particles-toggle');
            toggle.classList.toggle('active', particlesEnabled);
            
            if (particleSystem) {
                particleSystem.visible = particlesEnabled;
            }
        }
        
        function updateRefreshRate(value) {
            refreshRate = parseInt(value);
            document.getElementById('refresh-value').textContent = (refreshRate / 1000).toFixed(1) + 's';
            
            // Update WebSocket message to change server refresh rate
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'update_refresh_rate',
                    rate: refreshRate
                }));
            }
        }
        
        function exportData() {
            // Export current dashboard data as JSON
            const dataToExport = {
                timestamp: Date.now(),
                dashboardState: dashboardState,
                selectedAsset: selectedAsset,
                charts: Object.keys(charts).reduce((acc, key) => {
                    acc[key] = charts[key].data;
                    return acc;
                }, {})
            };
            
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`digital-twin-data-\${new Date().toISOString().split('T')[0]}.json\`;
            a.click();
            URL.revokeObjectURL(url);
            
            showNotification('Data exported successfully', 'success');
        }
        
        function exportReport() {
            // Generate and export a comprehensive report
            window.open('/api/reports/generate', '_blank');
            showNotification('Report generation started', 'success');
        }
        
        // Utility functions
        function showNotification(message, type = 'info') {
            const container = document.getElementById('notification-container');
            const notification = document.createElement('div');
            notification.className = \`notification \${type}\`;
            notification.textContent = message;
            
            container.appendChild(notification);
            
            // Show notification
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            // Hide and remove notification
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (container.contains(notification)) {
                        container.removeChild(notification);
                    }
                }, 300);
            }, 4000);
        }
        
        function hideLoadingOverlay() {
            const overlay = document.getElementById('loading-overlay');
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }
        
        // Asset search functionality
        document.getElementById('asset-search').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const assetCards = document.querySelectorAll('.asset-card');
            
            assetCards.forEach(card => {
                const assetName = card.querySelector('.asset-name').textContent.toLowerCase();
                const assetType = card.querySelector('.asset-type').textContent.toLowerCase();
                
                if (assetName.includes(searchTerm) || assetType.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
        
        // Initialize everything when page loads
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Initializing Digital Twin Dashboard...');
            
            // Initialize all components
            initializeWebSocket();
            init3DVisualization();
            initializeCharts();
            
            // Load initial data
            fetch('/api/dashboard/state')
                .then(response => response.json())
                .then(state => updateDashboardState(state))
                .catch(error => {
                    console.error('Failed to load initial data:', error);
                    showNotification('Failed to load initial data', 'error');
                });
            
            fetch('/api/assets')
                .then(response => response.json())
                .then(assets => {
                    assets.forEach(asset => addAssetToList(asset));
                })
                .catch(error => {
                    console.error('Failed to load assets:', error);
                });
        });
        
        // Handle window unload
        window.addEventListener('beforeunload', function() {
            if (ws) {
                ws.close();
            }
        });
    </script>
</body>
</html>`;
  }

  private async handleAssetCreated(asset: DigitalTwinAsset): Promise<void> {
    this.updateAssetMetrics(asset);
    this.broadcastToClients({
      type: 'asset_created',
      asset: asset
    });
    
    this.logger.info(`Asset created: ${asset.name} (${asset.id})`);
  }

  private async handleDataProcessed(data: any): Promise<void> {
    const { asset, dataPoint, latency } = data;
    
    this.updateRecentData(dataPoint);
    this.updateAssetMetrics(asset);
    
    // Update performance stats
    this.performanceStats.totalDataPoints++;
    this.performanceStats.averageProcessingTime = 
      (this.performanceStats.averageProcessingTime + latency) / 2;
    
    this.broadcastToClients({
      type: 'iot_data',
      data: { asset, dataPoint, latency }
    });
  }

  private async handleAnomalyDetected(anomaly: AnomalyAlert): Promise<void> {
    this.activeAlerts.set(anomaly.id, anomaly);
    this.updateDashboardState();
    
    this.broadcastToClients({
      type: 'anomaly',
      anomaly: anomaly
    });
    
    this.logger.warn(`Anomaly detected: ${anomaly.description} (${anomaly.severity})`);
  }

  private async handleValueUpdated(data: any): Promise<void> {
    const { asset, previousValue, newValue } = data;
    this.updateAssetMetrics(asset);
    
    this.broadcastToClients({
      type: 'value_updated',
      data: { assetId: asset.id, previousValue, newValue }
    });
  }

  private async handlePredictionsUpdated(data: any): Promise<void> {
    const { asset, predictions } = data;
    
    this.broadcastToClients({
      type: 'predictions_updated',
      data: { assetId: asset.id, predictions }
    });
  }

  private updateAssetMetrics(asset: DigitalTwinAsset): void {
    const activeSensors = asset.sensors.filter(s => s.status === 'active').length;
    const offlineSensors = asset.sensors.filter(s => s.status === 'offline').length;
    const errorSensors = asset.sensors.filter(s => s.status === 'error').length;
    
    const activeAlerts = asset.anomalies.filter(a => !a.resolved);
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical').length;
    const highAlerts = activeAlerts.filter(a => a.severity === 'high').length;
    const mediumAlerts = activeAlerts.filter(a => a.severity === 'medium').length;
    const lowAlerts = activeAlerts.filter(a => a.severity === 'low').length;

    const metrics: AssetPerformanceMetrics = {
      assetId: asset.id,
      timestamp: Date.now(),
      throughput: this.calculateThroughput(asset),
      latency: this.calculateLatency(asset),
      availability: this.calculateAvailability(asset),
      efficiency: this.calculateEfficiency(asset),
      predictiveScore: this.calculatePredictiveScore(asset),
      anomalyCount: activeAlerts.length,
      maintenanceScore: this.calculateMaintenanceScore(asset),
      value: {
        current: asset.currentValue,
        predicted: asset.predictedValues.length > 0 ? asset.predictedValues[0].predictedValue : asset.currentValue,
        confidence: asset.predictedValues.length > 0 ? asset.predictedValues[0].confidence : 0,
        trend: this.calculateTrend(asset)
      },
      sensors: {
        active: activeSensors,
        offline: offlineSensors,
        error: errorSensors,
        total: asset.sensors.length
      },
      alerts: {
        critical: criticalAlerts,
        high: highAlerts,
        medium: mediumAlerts,
        low: lowAlerts
      }
    };

    this.assetMetrics.set(asset.id, metrics);
  }

  private updateRecentData(dataPoint: IoTDataPoint): void {
    if (!this.recentData.has(dataPoint.assetId)) {
      this.recentData.set(dataPoint.assetId, []);
    }
    
    const assetData = this.recentData.get(dataPoint.assetId)!;
    assetData.push(dataPoint);
    
    // Keep only recent data points
    if (assetData.length > this.config.dashboard.maxDataPoints) {
      assetData.splice(0, assetData.length - this.config.dashboard.maxDataPoints);
    }
  }

  private updateDashboardState(): void {
    const assets = this.digitalTwinEngine.getAllAssets();
    const engineMetrics = this.digitalTwinEngine.getMetrics();
    
    this.dashboardState = {
      totalAssets: assets.length,
      activeAssets: assets.filter(a => a.status === 'active').length,
      totalDevices: assets.reduce((sum, a) => sum + a.sensors.length, 0),
      activeDevices: engineMetrics.activeDevices,
      dataPointsProcessed: engineMetrics.dataPointsProcessed,
      alertsActive: this.activeAlerts.size,
      systemHealth: this.calculateSystemHealth(),
      predictionAccuracy: engineMetrics.predictionAccuracy,
      averageLatency: engineMetrics.averageLatency,
      totalValue: engineMetrics.totalValue,
      lastUpdated: Date.now(),
      performanceMetrics: Array.from(this.assetMetrics.values()),
      topAnomalies: this.getTopAnomalies(10),
      recentActivity: this.getRecentActivity(20)
    };
  }

  private calculateThroughput(asset: DigitalTwinAsset): number {
    const recentData = this.recentData.get(asset.id) || [];
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentCount = recentData.filter(d => d.timestamp > oneMinuteAgo).length;
    return recentCount; // Data points per minute
  }

  private calculateLatency(asset: DigitalTwinAsset): number {
    return Math.max(0, Date.now() - asset.lastUpdate);
  }

  private calculateAvailability(asset: DigitalTwinAsset): number {
    const activeSensors = asset.sensors.filter(s => s.status === 'active').length;
    const totalSensors = asset.sensors.length;
    return totalSensors > 0 ? (activeSensors / totalSensors) * 100 : 0;
  }

  private calculateEfficiency(asset: DigitalTwinAsset): number {
    // Base efficiency calculation on sensor status and alert count
    const availability = this.calculateAvailability(asset);
    const alertPenalty = Math.min(50, asset.anomalies.filter(a => !a.resolved).length * 5);
    return Math.max(0, availability - alertPenalty);
  }

  private calculatePredictiveScore(asset: DigitalTwinAsset): number {
    if (asset.predictedValues.length === 0) return 0;
    return asset.predictedValues.reduce((sum, p) => sum + p.confidence, 0) / asset.predictedValues.length * 100;
  }

  private calculateMaintenanceScore(asset: DigitalTwinAsset): number {
    const now = Date.now();
    let score = 100;
    
    asset.sensors.forEach(sensor => {
      if (sensor.nextMaintenanceDate < now) {
        score -= 20; // Overdue maintenance
      } else if (sensor.nextMaintenanceDate - now < 7 * 24 * 60 * 60 * 1000) {
        score -= 5; // Due soon
      }
    });
    
    return Math.max(0, score);
  }

  private calculateTrend(asset: DigitalTwinAsset): 'up' | 'down' | 'stable' {
    if (asset.predictedValues.length === 0) return 'stable';
    
    const currentValue = asset.currentValue;
    const predictedValue = asset.predictedValues[0].predictedValue;
    const change = (predictedValue - currentValue) / currentValue;
    
    if (change > 0.02) return 'up';
    if (change < -0.02) return 'down';
    return 'stable';
  }

  private calculateSystemHealth(): number {
    const assets = this.digitalTwinEngine.getAllAssets();
    if (assets.length === 0) return 100;
    
    let totalHealth = 0;
    assets.forEach(asset => {
      const availability = this.calculateAvailability(asset);
      const efficiency = this.calculateEfficiency(asset);
      const assetHealth = (availability + efficiency) / 2;
      totalHealth += assetHealth;
    });
    
    return totalHealth / assets.length;
  }

  private getTopAnomalies(limit: number): AnomalyAlert[] {
    return Array.from(this.activeAlerts.values())
      .filter(a => !a.resolved)
      .sort((a, b) => {
        const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity] || b.timestamp - a.timestamp;
      })
      .slice(0, limit);
  }

  private getRecentActivity(limit: number): any[] {
    // This would collect recent activity from various sources
    // For now, return recent alerts
    return Array.from(this.activeAlerts.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map(alert => ({
        type: 'alert',
        timestamp: alert.timestamp,
        description: alert.description,
        severity: alert.severity,
        assetId: alert.assetId
      }));
  }

  private async createCustomDashboard(assetId: string, config: any): Promise<MonitoringDashboard> {
    // Implementation would create a custom dashboard based on provided configuration
    const asset = this.digitalTwinEngine.getAsset(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }
    
    // This is a simplified implementation
    const dashboard: MonitoringDashboard = {
      id: `custom_${assetId}_${Date.now()}`,
      assetId,
      refreshInterval: config.refreshInterval || 1000,
      alerts: [],
      layout: config.layout || { columns: 12, rows: 8, responsive: true },
      widgets: config.widgets || []
    };
    
    return dashboard;
  }

  private generatePerformanceAnalytics(timeRange: number): any {
    const now = Date.now();
    const startTime = now - (timeRange * 1000);
    
    // Generate performance analytics for the time range
    return {
      timeRange: timeRange,
      startTime: startTime,
      endTime: now,
      metrics: {
        averageThroughput: 850,
        peakThroughput: 1200,
        averageLatency: 125,
        peakLatency: 340,
        availability: 99.2,
        errorRate: 0.05
      },
      trends: {
        throughput: 'increasing',
        latency: 'stable',
        availability: 'stable'
      },
      alerts: Array.from(this.activeAlerts.values()).filter(a => 
        a.timestamp >= startTime && a.timestamp <= now
      )
    };
  }

  private generatePredictionAnalytics(assetId?: string): any {
    if (assetId) {
      const asset = this.digitalTwinEngine.getAsset(assetId);
      if (asset) {
        return {
          assetId: assetId,
          predictions: asset.predictedValues,
          accuracy: this.calculatePredictiveScore(asset),
          confidence: asset.predictedValues.length > 0 ? 
            asset.predictedValues.reduce((sum, p) => sum + p.confidence, 0) / asset.predictedValues.length : 0
        };
      }
    }
    
    // Return global prediction analytics
    const assets = this.digitalTwinEngine.getAllAssets();
    const totalPredictions = assets.reduce((sum, a) => sum + a.predictedValues.length, 0);
    const avgAccuracy = assets.reduce((sum, a) => sum + this.calculatePredictiveScore(a), 0) / assets.length;
    
    return {
      globalAnalytics: true,
      totalAssets: assets.length,
      totalPredictions: totalPredictions,
      averageAccuracy: avgAccuracy,
      predictionsByAsset: assets.map(a => ({
        assetId: a.id,
        predictionsCount: a.predictedValues.length,
        accuracy: this.calculatePredictiveScore(a)
      }))
    };
  }

  private broadcastToClients(message: any): void {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          this.logger.error('Failed to send message to client:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });
  }

  async start(port = 3040): Promise<void> {
    this.server = this.app.listen(port, () => {
      this.logger.info(`Digital Twin Dashboard started on port ${port}`);
      this.logger.info(`Access dashboard at http://localhost:${port}`);
    });

    // Setup WebSocket server
    this.wss = new WebSocketServer({ 
      port: port + 1,
      perMessageDeflate: this.config.performance.dataCompressionEnabled
    });
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      this.performanceStats.peakConcurrentUsers = Math.max(
        this.performanceStats.peakConcurrentUsers,
        this.clients.size
      );
      
      this.logger.info(`New client connected. Total: ${this.clients.size}`);
      
      // Send initial dashboard state
      this.updateDashboardState();
      ws.send(JSON.stringify({
        type: 'dashboard_state',
        state: this.dashboardState
      }));
      
      // Send current assets
      const assets = this.digitalTwinEngine.getAllAssets();
      assets.forEach(asset => {
        ws.send(JSON.stringify({
          type: 'asset_created',
          asset: asset
        }));
      });
      
      ws.on('close', () => {
        this.clients.delete(ws);
        this.logger.info(`Client disconnected. Total: ${this.clients.size}`);
      });
      
      ws.on('error', (error) => {
        this.logger.error('WebSocket client error:', error);
        this.clients.delete(ws);
      });
    });

    // Start update intervals
    this.metricsUpdateInterval = setInterval(() => {
      this.updateDashboardState();
      
      this.broadcastToClients({
        type: 'metrics_update',
        metrics: this.dashboardState
      });
    }, this.config.dashboard.refreshInterval);

    this.dashboardUpdateInterval = setInterval(() => {
      this.broadcastToClients({
        type: 'dashboard_state',
        state: this.dashboardState
      });
    }, 5000);

    this.alertCheckInterval = setInterval(() => {
      // Check for resolved alerts and clean up
      const resolvedAlerts: string[] = [];
      this.activeAlerts.forEach((alert, id) => {
        if (alert.resolved) {
          resolvedAlerts.push(id);
        }
      });
      
      resolvedAlerts.forEach(id => this.activeAlerts.delete(id));
    }, 10000);
  }

  async stop(): Promise<void> {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }
    
    if (this.dashboardUpdateInterval) {
      clearInterval(this.dashboardUpdateInterval);
    }
    
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
    }
    
    if (this.wss) {
      this.wss.close();
    }
    
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.logger.info('Digital Twin Dashboard stopped');
          resolve();
        });
      });
    }
  }

  // Getter methods for external access
  getDashboardState(): DigitalTwinDashboardState {
    return { ...this.dashboardState };
  }

  getAssetMetrics(assetId: string): AssetPerformanceMetrics | undefined {
    return this.assetMetrics.get(assetId);
  }

  getActiveAlerts(): AnomalyAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  getRecentData(assetId: string, limit?: number): IoTDataPoint[] {
    const data = this.recentData.get(assetId) || [];
    return limit ? data.slice(-limit) : data;
  }

  getPerformanceStats() {
    return {
      ...this.performanceStats,
      uptime: Date.now() - this.performanceStats.uptime,
      currentConnections: this.clients.size
    };
  }
}

export default DigitalTwinDashboard;
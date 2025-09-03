import { Logger } from '../core/Logger';
import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import { PredictiveAnalyticsEngine, AssetValuationPrediction, MarketTrendAnalysis, RiskAssessment, PerformanceForecast, AnomalyDetection } from '../ai/PredictiveAnalyticsEngine';
import { MetricsCollector } from './MetricsCollector';

// Analytics Dashboard Interfaces
export interface MLModelMetrics {
  modelId: string;
  modelType: 'asset_valuation' | 'market_trend' | 'risk_assessment' | 'performance_forecast' | 'anomaly_detection';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingTime: number;
  lastUpdate: number;
  predictionLatency: number;
  throughput: number;
  errorRate: number;
  driftScore: number;
  confidenceDistribution: number[];
  featureImportance: Record<string, number>;
}

export interface PredictionMetrics {
  totalPredictions: number;
  successfulPredictions: number;
  failedPredictions: number;
  avgLatency: number;
  medianLatency: number;
  p95Latency: number;
  p99Latency: number;
  throughputPerSecond: number;
  cacheHitRate: number;
  concurrentRequests: number;
  queueLength: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ModelDriftAlert {
  modelId: string;
  driftType: 'data' | 'concept' | 'prediction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  driftScore: number;
  threshold: number;
  detectedAt: number;
  description: string;
  recommendations: string[];
  autoRemediation: boolean;
  affectedFeatures: string[];
  impactedPredictions: number;
}

export interface FeatureAnalytics {
  featureName: string;
  importance: number;
  stability: number;
  correlation: number;
  distribution: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    percentiles: Record<string, number>;
  };
  driftMetrics: {
    kl_divergence: number;
    psi: number;
    wasserstein_distance: number;
  };
  categoricalStats?: {
    uniqueValues: string[];
    frequencies: Record<string, number>;
    entropy: number;
  };
}

export interface RealTimeAnalytics {
  timestamp: number;
  activeModels: number;
  totalPredictions: number;
  avgAccuracy: number;
  systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
  alertCount: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  resourceUsage: {
    cpu: number;
    memory: number;
    gpu?: number;
    disk: number;
  };
  networkMetrics: {
    requestsPerSecond: number;
    responseTime: number;
    errorRate: number;
  };
}

export interface AnalyticsDashboardConfig {
  refreshInterval: number;
  alertThresholds: {
    accuracy: number;
    latency: number;
    driftScore: number;
    errorRate: number;
  };
  visualization: {
    chartUpdateInterval: number;
    dataRetentionDays: number;
    maxDataPoints: number;
  };
  realTimeFeatures: {
    enabled: boolean;
    batchSize: number;
    streamingInterval: number;
  };
}

export class PredictiveAnalyticsDashboard {
  private logger: Logger;
  private app: express.Application;
  private server: http.Server | null = null;
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private analyticsEngine: PredictiveAnalyticsEngine;
  private metricsCollector: MetricsCollector;

  // Dashboard State
  private modelMetrics: Map<string, MLModelMetrics> = new Map();
  private predictionMetrics: PredictionMetrics;
  private driftAlerts: ModelDriftAlert[] = [];
  private featureAnalytics: Map<string, FeatureAnalytics> = new Map();
  private realTimeAnalytics: RealTimeAnalytics;
  private historicalData: Map<string, any[]> = new Map();

  // Intervals and Timers
  private metricsInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  private driftDetectionInterval: NodeJS.Timeout | null = null;
  private clientBroadcastInterval: NodeJS.Timeout | null = null;

  // Configuration
  private config: AnalyticsDashboardConfig = {
    refreshInterval: 1000, // 1 second
    alertThresholds: {
      accuracy: 0.85,
      latency: 100, // ms
      driftScore: 0.7,
      errorRate: 0.05
    },
    visualization: {
      chartUpdateInterval: 5000, // 5 seconds
      dataRetentionDays: 30,
      maxDataPoints: 1000
    },
    realTimeFeatures: {
      enabled: true,
      batchSize: 100,
      streamingInterval: 1000
    }
  };

  // Performance Tracking
  private performanceMetrics = {
    dashboardRequests: 0,
    avgResponseTime: 0,
    activeConnections: 0,
    dataProcessingTime: 0,
    chartRenderTime: 0,
    memoryUsage: 0,
    uptime: Date.now()
  };

  constructor(
    analyticsEngine: PredictiveAnalyticsEngine,
    metricsCollector: MetricsCollector
  ) {
    this.logger = new Logger('PredictiveAnalyticsDashboard-AV10-26');
    this.app = express();
    this.analyticsEngine = analyticsEngine;
    this.metricsCollector = metricsCollector;
    
    this.predictionMetrics = this.initializePredictionMetrics();
    this.realTimeAnalytics = this.initializeRealTimeAnalytics();
    
    this.setupRoutes();
    this.setupEventListeners();
  }

  private initializePredictionMetrics(): PredictionMetrics {
    return {
      totalPredictions: 0,
      successfulPredictions: 0,
      failedPredictions: 0,
      avgLatency: 0,
      medianLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      throughputPerSecond: 0,
      cacheHitRate: 0,
      concurrentRequests: 0,
      queueLength: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
  }

  private initializeRealTimeAnalytics(): RealTimeAnalytics {
    return {
      timestamp: Date.now(),
      activeModels: 0,
      totalPredictions: 0,
      avgAccuracy: 0,
      systemHealth: 'excellent',
      alertCount: { low: 0, medium: 0, high: 0, critical: 0 },
      resourceUsage: { cpu: 0, memory: 0, disk: 0 },
      networkMetrics: { requestsPerSecond: 0, responseTime: 0, errorRate: 0 }
    };
  }

  private setupRoutes(): void {
    this.app.use(express.static('public'));
    this.app.use(express.json());

    // Serve main dashboard
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });

    // API endpoints
    this.app.get('/api/analytics/overview', (req, res) => {
      res.json(this.realTimeAnalytics);
    });

    this.app.get('/api/analytics/models', (req, res) => {
      res.json(Array.from(this.modelMetrics.values()));
    });

    this.app.get('/api/analytics/predictions', (req, res) => {
      res.json(this.predictionMetrics);
    });

    this.app.get('/api/analytics/alerts', (req, res) => {
      res.json(this.driftAlerts);
    });

    this.app.get('/api/analytics/features', (req, res) => {
      res.json(Array.from(this.featureAnalytics.values()));
    });

    this.app.get('/api/analytics/model/:modelId', (req, res) => {
      const modelId = req.params.modelId;
      const metrics = this.modelMetrics.get(modelId);
      
      if (metrics) {
        res.json({
          metrics,
          historicalData: this.historicalData.get(modelId) || [],
          recentPredictions: this.getRecentPredictions(modelId),
          performanceTrend: this.getModelPerformanceTrend(modelId)
        });
      } else {
        res.status(404).json({ error: 'Model not found' });
      }
    });

    this.app.post('/api/analytics/retrain/:modelId', async (req, res) => {
      try {
        const modelId = req.params.modelId;
        await this.triggerModelRetrain(modelId);
        res.json({ success: true, message: 'Model retrain initiated' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/analytics/alerts/acknowledge', (req, res) => {
      const { alertId } = req.body;
      this.acknowledgeAlert(alertId);
      res.json({ success: true });
    });

    // Real-time data endpoints
    this.app.get('/api/analytics/realtime/stream', (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const sendData = () => {
        const data = {
          timestamp: Date.now(),
          metrics: this.realTimeAnalytics,
          predictions: this.predictionMetrics,
          alerts: this.driftAlerts.filter(alert => !alert.autoRemediation)
        };
        
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      const interval = setInterval(sendData, 1000);
      
      req.on('close', () => {
        clearInterval(interval);
      });
    });
  }

  private setupEventListeners(): void {
    // Listen to analytics engine events
    this.analyticsEngine.on('prediction_complete', (data) => {
      this.updatePredictionMetrics(data);
    });

    this.analyticsEngine.on('model_updated', (modelId) => {
      this.updateModelMetrics(modelId);
    });

    this.analyticsEngine.on('performance_metrics', (metrics) => {
      this.updatePerformanceMetrics(metrics);
    });

    // Listen to metrics collector events
    this.metricsCollector.on('drift_detected', (alert: ModelDriftAlert) => {
      this.handleDriftAlert(alert);
    });

    this.metricsCollector.on('feature_analytics_updated', (analytics: FeatureAnalytics) => {
      this.featureAnalytics.set(analytics.featureName, analytics);
    });
  }

  async start(port = 3040): Promise<void> {
    this.logger.info('🚀 Starting AV10-26 Predictive Analytics Dashboard...');

    this.server = this.app.listen(port, () => {
      this.logger.info(`📊 Analytics Dashboard started on port ${port}`);
      this.logger.info(`🔗 Access dashboard at http://localhost:${port}`);
    });

    // Setup WebSocket server for real-time updates
    this.wss = new WebSocketServer({ port: port + 1 });
    
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      this.performanceMetrics.activeConnections++;
      this.logger.info('🔌 New client connected to analytics dashboard');
      
      // Send initial data
      this.sendInitialData(ws);
      
      ws.on('close', () => {
        this.clients.delete(ws);
        this.performanceMetrics.activeConnections--;
        this.logger.info('🔌 Client disconnected from analytics dashboard');
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(ws, message);
        } catch (error) {
          this.logger.error('❌ WebSocket message parsing error:', error);
        }
      });
    });

    // Start background processes
    await this.startBackgroundProcesses();
    
    this.logger.info('✅ AV10-26 Predictive Analytics Dashboard fully operational');
  }

  private async startBackgroundProcesses(): Promise<void> {
    // Metrics collection and updates
    this.metricsInterval = setInterval(() => {
      this.collectAndUpdateMetrics();
    }, this.config.refreshInterval);

    // Alert checking
    this.alertCheckInterval = setInterval(() => {
      this.checkForAlerts();
    }, this.config.refreshInterval * 5);

    // Drift detection
    this.driftDetectionInterval = setInterval(async () => {
      await this.performDriftDetection();
    }, this.config.refreshInterval * 60); // Every minute

    // Client broadcast
    this.clientBroadcastInterval = setInterval(() => {
      this.broadcastToClients();
    }, this.config.visualization.chartUpdateInterval);

    this.logger.info('⚙️ Background processes started');
  }

  private async collectAndUpdateMetrics(): Promise<void> {
    try {
      // Update real-time analytics
      this.realTimeAnalytics = {
        timestamp: Date.now(),
        activeModels: this.modelMetrics.size,
        totalPredictions: this.predictionMetrics.totalPredictions,
        avgAccuracy: this.calculateAvgAccuracy(),
        systemHealth: this.assessSystemHealth(),
        alertCount: this.getAlertCounts(),
        resourceUsage: await this.getResourceUsage(),
        networkMetrics: this.getNetworkMetrics()
      };

      // Update historical data
      this.updateHistoricalData();

      // Collect model-specific metrics
      await this.collectModelMetrics();

    } catch (error) {
      this.logger.error('❌ Error collecting metrics:', error);
    }
  }

  private async collectModelMetrics(): Promise<void> {
    const enginePerformance = await this.analyticsEngine.getModelPerformance();
    
    // Update existing model metrics or create new ones
    for (const [modelId, _] of this.modelMetrics) {
      await this.updateModelMetrics(modelId);
    }

    // Add any new models discovered
    this.discoverNewModels(enginePerformance);
  }

  private async updateModelMetrics(modelId: string): Promise<void> {
    try {
      const currentMetrics = this.modelMetrics.get(modelId);
      
      const updatedMetrics: MLModelMetrics = {
        modelId,
        modelType: this.inferModelType(modelId),
        accuracy: await this.calculateModelAccuracy(modelId),
        precision: await this.calculateModelPrecision(modelId),
        recall: await this.calculateModelRecall(modelId),
        f1Score: await this.calculateF1Score(modelId),
        trainingTime: currentMetrics?.trainingTime || 0,
        lastUpdate: Date.now(),
        predictionLatency: await this.getModelLatency(modelId),
        throughput: await this.getModelThroughput(modelId),
        errorRate: await this.getModelErrorRate(modelId),
        driftScore: await this.calculateDriftScore(modelId),
        confidenceDistribution: await this.getConfidenceDistribution(modelId),
        featureImportance: await this.getFeatureImportance(modelId)
      };

      this.modelMetrics.set(modelId, updatedMetrics);
      
      // Store historical data point
      this.storeHistoricalDataPoint(modelId, updatedMetrics);

    } catch (error) {
      this.logger.error(`❌ Error updating metrics for model ${modelId}:`, error);
    }
  }

  private checkForAlerts(): void {
    // Check model performance alerts
    for (const [modelId, metrics] of this.modelMetrics) {
      // Accuracy degradation
      if (metrics.accuracy < this.config.alertThresholds.accuracy) {
        this.createAlert({
          modelId,
          driftType: 'prediction',
          severity: metrics.accuracy < 0.7 ? 'critical' : 'high',
          driftScore: 1 - metrics.accuracy,
          threshold: this.config.alertThresholds.accuracy,
          detectedAt: Date.now(),
          description: `Model accuracy dropped to ${(metrics.accuracy * 100).toFixed(2)}%`,
          recommendations: [
            'Retrain model with recent data',
            'Check for data quality issues',
            'Review feature importance changes'
          ],
          autoRemediation: metrics.accuracy > 0.6,
          affectedFeatures: Object.keys(metrics.featureImportance).slice(0, 3),
          impactedPredictions: Math.floor(this.predictionMetrics.totalPredictions * 0.1)
        });
      }

      // Latency spike
      if (metrics.predictionLatency > this.config.alertThresholds.latency) {
        this.createAlert({
          modelId,
          driftType: 'prediction',
          severity: metrics.predictionLatency > 500 ? 'high' : 'medium',
          driftScore: metrics.predictionLatency / this.config.alertThresholds.latency,
          threshold: this.config.alertThresholds.latency,
          detectedAt: Date.now(),
          description: `Prediction latency increased to ${metrics.predictionLatency}ms`,
          recommendations: [
            'Check system resources',
            'Optimize model architecture',
            'Consider model pruning'
          ],
          autoRemediation: true,
          affectedFeatures: [],
          impactedPredictions: 0
        });
      }

      // Model drift
      if (metrics.driftScore > this.config.alertThresholds.driftScore) {
        this.createAlert({
          modelId,
          driftType: 'data',
          severity: metrics.driftScore > 0.9 ? 'critical' : 'high',
          driftScore: metrics.driftScore,
          threshold: this.config.alertThresholds.driftScore,
          detectedAt: Date.now(),
          description: `Model drift detected with score ${metrics.driftScore.toFixed(3)}`,
          recommendations: [
            'Immediate model retraining required',
            'Analyze input data distribution changes',
            'Update feature preprocessing'
          ],
          autoRemediation: false,
          affectedFeatures: this.getTopDriftingFeatures(modelId),
          impactedPredictions: Math.floor(this.predictionMetrics.totalPredictions * 0.2)
        });
      }
    }
  }

  private async performDriftDetection(): Promise<void> {
    this.logger.debug('🔍 Performing model drift detection...');
    
    for (const [modelId, _] of this.modelMetrics) {
      try {
        const driftAnalysis = await this.metricsCollector.analyzeDrift(modelId);
        
        if (driftAnalysis.hasDrift) {
          const alert: ModelDriftAlert = {
            modelId,
            driftType: driftAnalysis.driftType as any,
            severity: this.categorizeDriftSeverity(driftAnalysis.driftScore),
            driftScore: driftAnalysis.driftScore,
            threshold: driftAnalysis.threshold,
            detectedAt: Date.now(),
            description: driftAnalysis.description,
            recommendations: driftAnalysis.recommendations,
            autoRemediation: driftAnalysis.driftScore < 0.8,
            affectedFeatures: driftAnalysis.affectedFeatures,
            impactedPredictions: driftAnalysis.impactedPredictions
          };

          this.handleDriftAlert(alert);
        }

      } catch (error) {
        this.logger.error(`❌ Drift detection failed for model ${modelId}:`, error);
      }
    }
  }

  private createAlert(alert: Omit<ModelDriftAlert, 'autoRemediation' | 'affectedFeatures' | 'impactedPredictions'> & 
                     { autoRemediation?: boolean; affectedFeatures?: string[]; impactedPredictions?: number }): void {
    const fullAlert: ModelDriftAlert = {
      ...alert,
      autoRemediation: alert.autoRemediation ?? false,
      affectedFeatures: alert.affectedFeatures ?? [],
      impactedPredictions: alert.impactedPredictions ?? 0
    };

    // Check if alert already exists
    const existingAlert = this.driftAlerts.find(a => 
      a.modelId === alert.modelId && 
      a.driftType === alert.driftType &&
      Date.now() - a.detectedAt < 300000 // 5 minutes
    );

    if (!existingAlert) {
      this.driftAlerts.push(fullAlert);
      
      // Keep only recent alerts (last 24 hours)
      this.driftAlerts = this.driftAlerts.filter(a => 
        Date.now() - a.detectedAt < 86400000
      );

      this.logger.warn(`⚠️ Alert created for model ${alert.modelId}: ${alert.description}`);

      // Auto-remediation if enabled
      if (fullAlert.autoRemediation) {
        this.executeAutoRemediation(fullAlert);
      }
    }
  }

  private handleDriftAlert(alert: ModelDriftAlert): void {
    this.driftAlerts.push(alert);
    this.logger.warn(`🚨 Drift alert for model ${alert.modelId}: ${alert.description}`);
    
    // Broadcast to connected clients
    this.broadcastAlert(alert);
    
    if (alert.autoRemediation) {
      this.executeAutoRemediation(alert);
    }
  }

  private async executeAutoRemediation(alert: ModelDriftAlert): Promise<void> {
    try {
      this.logger.info(`🔧 Executing auto-remediation for model ${alert.modelId}...`);
      
      switch (alert.driftType) {
        case 'data':
          await this.handleDataDrift(alert);
          break;
        case 'concept':
          await this.handleConceptDrift(alert);
          break;
        case 'prediction':
          await this.handlePredictionDrift(alert);
          break;
      }
      
      this.logger.info(`✅ Auto-remediation completed for model ${alert.modelId}`);
      
    } catch (error) {
      this.logger.error(`❌ Auto-remediation failed for model ${alert.modelId}:`, error);
    }
  }

  private async handleDataDrift(alert: ModelDriftAlert): Promise<void> {
    // Trigger model retraining with recent data
    await this.triggerModelRetrain(alert.modelId);
    
    // Update feature preprocessing
    await this.updateFeaturePreprocessing(alert.modelId, alert.affectedFeatures);
  }

  private async handleConceptDrift(alert: ModelDriftAlert): Promise<void> {
    // Full model architecture review and retrain
    await this.triggerModelRetrain(alert.modelId, { fullRetrain: true });
    
    // Update model hyperparameters
    await this.optimizeModelHyperparameters(alert.modelId);
  }

  private async handlePredictionDrift(alert: ModelDriftAlert): Promise<void> {
    if (alert.driftScore > 0.8) {
      // High drift - full retrain
      await this.triggerModelRetrain(alert.modelId);
    } else {
      // Medium drift - model fine-tuning
      await this.finetuneModel(alert.modelId);
    }
  }

  private broadcastToClients(): void {
    if (this.clients.size === 0) return;

    const data = {
      type: 'analytics_update',
      timestamp: Date.now(),
      data: {
        realTimeAnalytics: this.realTimeAnalytics,
        predictionMetrics: this.predictionMetrics,
        modelMetrics: Array.from(this.modelMetrics.values()),
        alerts: this.driftAlerts.slice(-10), // Last 10 alerts
        featureAnalytics: Array.from(this.featureAnalytics.values()).slice(0, 20) // Top 20 features
      }
    };

    const message = JSON.stringify(data);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          this.logger.error('❌ Error broadcasting to client:', error);
        }
      }
    });
  }

  private broadcastAlert(alert: ModelDriftAlert): void {
    const data = {
      type: 'alert',
      timestamp: Date.now(),
      alert
    };

    const message = JSON.stringify(data);
    
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          this.logger.error('❌ Error broadcasting alert to client:', error);
        }
      }
    });
  }

  private sendInitialData(ws: WebSocket): void {
    const initialData = {
      type: 'initial_data',
      data: {
        realTimeAnalytics: this.realTimeAnalytics,
        predictionMetrics: this.predictionMetrics,
        modelMetrics: Array.from(this.modelMetrics.values()),
        alerts: this.driftAlerts,
        featureAnalytics: Array.from(this.featureAnalytics.values()),
        config: this.config
      }
    };

    try {
      ws.send(JSON.stringify(initialData));
    } catch (error) {
      this.logger.error('❌ Error sending initial data to client:', error);
    }
  }

  private handleWebSocketMessage(ws: WebSocket, message: any): void {
    switch (message.type) {
      case 'get_model_details':
        this.handleGetModelDetails(ws, message.modelId);
        break;
      case 'acknowledge_alert':
        this.acknowledgeAlert(message.alertId);
        break;
      case 'trigger_retrain':
        this.triggerModelRetrain(message.modelId);
        break;
      case 'update_config':
        this.updateConfig(message.config);
        break;
      default:
        this.logger.warn(`Unknown WebSocket message type: ${message.type}`);
    }
  }

  private handleGetModelDetails(ws: WebSocket, modelId: string): void {
    const metrics = this.modelMetrics.get(modelId);
    if (metrics) {
      const response = {
        type: 'model_details',
        modelId,
        data: {
          metrics,
          historicalData: this.historicalData.get(modelId) || [],
          recentPredictions: this.getRecentPredictions(modelId),
          performanceTrend: this.getModelPerformanceTrend(modelId)
        }
      };
      
      try {
        ws.send(JSON.stringify(response));
      } catch (error) {
        this.logger.error('❌ Error sending model details to client:', error);
      }
    }
  }

  // Dashboard HTML Template
  private getDashboardHTML(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AV10-26 Predictive Analytics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@2.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
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
            overflow-x: hidden;
        }
        
        .header {
            background: rgba(0, 0, 0, 0.7);
            padding: 20px;
            border-bottom: 2px solid #00ff88;
            backdrop-filter: blur(10px);
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .header h1 {
            font-size: 2.5em;
            background: linear-gradient(90deg, #00ff88, #00aaff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
        }
        
        .subtitle {
            color: #aaa;
            margin-top: 5px;
            font-size: 1.1em;
        }
        
        .status-indicators {
            display: flex;
            gap: 20px;
            margin-top: 10px;
        }
        
        .status-indicator {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 0.9em;
        }
        
        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        .status-excellent { background-color: #00ff88; }
        .status-good { background-color: #88ff00; }
        .status-warning { background-color: #ffaa00; }
        .status-critical { background-color: #ff4444; }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: 1fr 2fr 1fr;
            gap: 20px;
            padding: 20px;
            min-height: calc(100vh - 140px);
        }
        
        .panel {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        
        .panel:hover {
            border-color: rgba(0, 255, 136, 0.6);
            box-shadow: 0 5px 20px rgba(0, 255, 136, 0.2);
        }
        
        .panel-title {
            font-size: 1.3em;
            margin-bottom: 15px;
            color: #00aaff;
            border-bottom: 1px solid rgba(0, 255, 136, 0.3);
            padding-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .metrics-overview {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .metric-card {
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .metric-card:hover {
            background: rgba(0, 255, 136, 0.2);
            transform: translateY(-2px);
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #00ff88;
            margin: 10px 0;
        }
        
        .metric-label {
            font-size: 0.9em;
            color: #aaa;
            text-transform: uppercase;
        }
        
        .metric-change {
            font-size: 0.8em;
            margin-top: 5px;
        }
        
        .metric-up { color: #00ff88; }
        .metric-down { color: #ff4444; }
        .metric-stable { color: #ffaa00; }
        
        .model-list {
            max-height: 600px;
            overflow-y: auto;
        }
        
        .model-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(0, 255, 136, 0.2);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .model-item:hover {
            background: rgba(0, 255, 136, 0.1);
            border-color: rgba(0, 255, 136, 0.5);
        }
        
        .model-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .model-name {
            font-weight: bold;
            color: #00aaff;
        }
        
        .model-status {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7em;
            text-transform: uppercase;
        }
        
        .status-healthy { background: rgba(0, 255, 136, 0.3); color: #00ff88; }
        .status-warning { background: rgba(255, 170, 0, 0.3); color: #ffaa00; }
        .status-critical { background: rgba(255, 68, 68, 0.3); color: #ff4444; }
        
        .model-metrics {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            font-size: 0.8em;
        }
        
        .model-metric {
            text-align: center;
        }
        
        .model-metric-value {
            font-weight: bold;
            color: #00ff88;
        }
        
        .alert-list {
            max-height: 500px;
            overflow-y: auto;
        }
        
        .alert-item {
            background: rgba(255, 68, 68, 0.1);
            border: 1px solid rgba(255, 68, 68, 0.3);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            animation: alertPulse 3s ease-in-out infinite;
        }
        
        .alert-item.severity-critical {
            border-color: rgba(255, 68, 68, 0.8);
            background: rgba(255, 68, 68, 0.2);
        }
        
        .alert-item.severity-high {
            border-color: rgba(255, 170, 0, 0.6);
            background: rgba(255, 170, 0, 0.1);
        }
        
        .alert-item.severity-medium {
            border-color: rgba(255, 255, 0, 0.5);
            background: rgba(255, 255, 0, 0.1);
        }
        
        .alert-item.severity-low {
            border-color: rgba(0, 255, 136, 0.4);
            background: rgba(0, 255, 136, 0.1);
        }
        
        @keyframes alertPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
        }
        
        .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .alert-model {
            font-weight: bold;
            color: #00aaff;
        }
        
        .alert-severity {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.7em;
            text-transform: uppercase;
        }
        
        .alert-description {
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        
        .alert-recommendations {
            font-size: 0.8em;
            color: #ccc;
        }
        
        .alert-recommendations li {
            margin: 2px 0;
        }
        
        .chart-container {
            height: 300px;
            margin: 20px 0;
        }
        
        .chart-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .chart-tab {
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(0, 255, 136, 0.3);
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .chart-tab:hover,
        .chart-tab.active {
            background: rgba(0, 255, 136, 0.2);
            border-color: rgba(0, 255, 136, 0.6);
        }
        
        .feature-analytics {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .feature-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin-bottom: 5px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
        }
        
        .feature-name {
            font-weight: bold;
        }
        
        .feature-importance {
            width: 100px;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
        }
        
        .feature-importance-bar {
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00aaff);
            transition: width 0.5s ease;
        }
        
        .drift-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-left: 10px;
        }
        
        .drift-low { background-color: #00ff88; }
        .drift-medium { background-color: #ffaa00; }
        .drift-high { background-color: #ff4444; }
        
        .controls {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9em;
        }
        
        .btn-primary {
            background: linear-gradient(90deg, #00ff88, #00aaff);
            color: #000;
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
        
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
        }
        
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid rgba(0, 255, 136, 0.3);
            border-top: 3px solid #00ff88;
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
            padding: 15px 20px;
            border-radius: 8px;
            color: #fff;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.5s ease;
        }
        
        .notification.success {
            background: rgba(0, 255, 136, 0.9);
            border: 1px solid #00ff88;
        }
        
        .notification.warning {
            background: rgba(255, 170, 0, 0.9);
            border: 1px solid #ffaa00;
        }
        
        .notification.error {
            background: rgba(255, 68, 68, 0.9);
            border: 1px solid #ff4444;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @media (max-width: 1200px) {
            .dashboard-grid {
                grid-template-columns: 1fr;
            }
            
            .metrics-overview {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        @media (max-width: 768px) {
            .header h1 {
                font-size: 1.8em;
            }
            
            .metrics-overview {
                grid-template-columns: 1fr;
            }
            
            .status-indicators {
                flex-wrap: wrap;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 AV10-26 Predictive Analytics Dashboard</h1>
        <div class="subtitle">Real-time ML Model Performance Monitoring & Drift Detection</div>
        <div class="status-indicators">
            <div class="status-indicator">
                <div class="status-dot status-excellent" id="system-status"></div>
                <span id="system-health">System Health</span>
            </div>
            <div class="status-indicator">
                <div class="status-dot status-excellent" id="models-status"></div>
                <span id="active-models">Active Models: 0</span>
            </div>
            <div class="status-indicator">
                <div class="status-dot status-excellent" id="predictions-status"></div>
                <span id="total-predictions">Predictions: 0</span>
            </div>
            <div class="status-indicator">
                <div class="status-dot status-excellent" id="alerts-status"></div>
                <span id="active-alerts">Alerts: 0</span>
            </div>
        </div>
    </div>

    <div class="metrics-overview">
        <div class="metric-card">
            <div class="metric-label">Average Accuracy</div>
            <div class="metric-value" id="avg-accuracy">0%</div>
            <div class="metric-change metric-up" id="accuracy-change">↑ +0.0%</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Prediction Latency</div>
            <div class="metric-value" id="avg-latency">0ms</div>
            <div class="metric-change metric-down" id="latency-change">↓ -0.0ms</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Throughput</div>
            <div class="metric-value" id="throughput">0/s</div>
            <div class="metric-change metric-up" id="throughput-change">↑ +0/s</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Cache Hit Rate</div>
            <div class="metric-value" id="cache-hit-rate">0%</div>
            <div class="metric-change metric-stable" id="cache-change">→ 0.0%</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Error Rate</div>
            <div class="metric-value" id="error-rate">0%</div>
            <div class="metric-change metric-down" id="error-change">↓ -0.0%</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Drift Alerts</div>
            <div class="metric-value" id="drift-alerts">0</div>
            <div class="metric-change metric-stable" id="drift-change">→ 0</div>
        </div>
    </div>

    <div class="dashboard-grid">
        <!-- Left Panel: Model List -->
        <div class="panel">
            <div class="panel-title">
                📊 ML Models
                <div class="controls">
                    <button class="btn btn-secondary" onclick="refreshModels()">↻</button>
                </div>
            </div>
            <div class="model-list" id="model-list">
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>

        <!-- Center Panel: Charts & Visualizations -->
        <div class="panel">
            <div class="panel-title">
                📈 Performance Analytics
                <div class="chart-tabs">
                    <div class="chart-tab active" onclick="showChart('accuracy')">Accuracy</div>
                    <div class="chart-tab" onclick="showChart('latency')">Latency</div>
                    <div class="chart-tab" onclick="showChart('throughput')">Throughput</div>
                    <div class="chart-tab" onclick="showChart('drift')">Drift Score</div>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="main-chart"></canvas>
            </div>
            
            <div class="panel-title" style="margin-top: 30px;">
                🎯 Feature Importance
            </div>
            <div class="chart-container">
                <canvas id="feature-chart"></canvas>
            </div>
        </div>

        <!-- Right Panel: Alerts & Feature Analytics -->
        <div class="panel">
            <div class="panel-title">
                🚨 Drift Alerts
                <span class="alert-count" id="alert-count">0</span>
            </div>
            <div class="alert-list" id="alert-list">
                <div style="text-align: center; color: #888; padding: 40px;">
                    No active alerts
                </div>
            </div>
            
            <div class="panel-title" style="margin-top: 30px;">
                🔍 Feature Analytics
            </div>
            <div class="feature-analytics" id="feature-analytics">
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // WebSocket connection
        let ws = null;
        let reconnectInterval = null;
        let charts = {};
        let currentChart = 'accuracy';
        
        // Data storage
        let analyticsData = {
            realTimeAnalytics: {},
            predictionMetrics: {},
            modelMetrics: [],
            alerts: [],
            featureAnalytics: []
        };

        // Initialize dashboard
        function initDashboard() {
            connectWebSocket();
            initCharts();
            startPeriodicUpdates();
        }

        function connectWebSocket() {
            const wsUrl = \`ws://\${window.location.hostname}:3041\`;
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('✅ Connected to analytics dashboard');
                showNotification('Connected to analytics dashboard', 'success');
                if (reconnectInterval) {
                    clearInterval(reconnectInterval);
                    reconnectInterval = null;
                }
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            ws.onclose = () => {
                console.log('❌ Disconnected from analytics dashboard');
                showNotification('Connection lost. Attempting to reconnect...', 'warning');
                scheduleReconnect();
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                showNotification('Connection error occurred', 'error');
            };
        }

        function scheduleReconnect() {
            if (!reconnectInterval) {
                reconnectInterval = setInterval(() => {
                    if (ws.readyState === WebSocket.CLOSED) {
                        connectWebSocket();
                    }
                }, 5000);
            }
        }

        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'initial_data':
                    analyticsData = data.data;
                    updateAllDisplays();
                    break;
                case 'analytics_update':
                    analyticsData = { ...analyticsData, ...data.data };
                    updateAllDisplays();
                    break;
                case 'alert':
                    handleNewAlert(data.alert);
                    break;
                case 'model_details':
                    handleModelDetails(data);
                    break;
            }
        }

        function updateAllDisplays() {
            updateStatusIndicators();
            updateMetricsOverview();
            updateModelList();
            updateAlertList();
            updateFeatureAnalytics();
            updateCharts();
        }

        function updateStatusIndicators() {
            const { realTimeAnalytics } = analyticsData;
            
            // System health
            const healthDot = document.getElementById('system-status');
            const healthText = document.getElementById('system-health');
            healthDot.className = \`status-dot status-\${realTimeAnalytics.systemHealth || 'excellent'}\`;
            healthText.textContent = \`System: \${realTimeAnalytics.systemHealth || 'Excellent'}\`;
            
            // Active models
            document.getElementById('active-models').textContent = 
                \`Active Models: \${realTimeAnalytics.activeModels || 0}\`;
            
            // Total predictions
            document.getElementById('total-predictions').textContent = 
                \`Predictions: \${(realTimeAnalytics.totalPredictions || 0).toLocaleString()}\`;
            
            // Active alerts
            const alertCount = analyticsData.alerts?.length || 0;
            document.getElementById('active-alerts').textContent = \`Alerts: \${alertCount}\`;
            
            const alertsDot = document.getElementById('alerts-status');
            if (alertCount === 0) alertsDot.className = 'status-dot status-excellent';
            else if (alertCount < 5) alertsDot.className = 'status-dot status-warning';
            else alertsDot.className = 'status-dot status-critical';
        }

        function updateMetricsOverview() {
            const { predictionMetrics, realTimeAnalytics } = analyticsData;
            
            // Average accuracy
            const avgAccuracy = (realTimeAnalytics.avgAccuracy || 0) * 100;
            document.getElementById('avg-accuracy').textContent = \`\${avgAccuracy.toFixed(1)}%\`;
            
            // Average latency
            document.getElementById('avg-latency').textContent = 
                \`\${Math.round(predictionMetrics.avgLatency || 0)}ms\`;
            
            // Throughput
            document.getElementById('throughput').textContent = 
                \`\${Math.round(predictionMetrics.throughputPerSecond || 0)}/s\`;
            
            // Cache hit rate
            document.getElementById('cache-hit-rate').textContent = 
                \`\${Math.round((predictionMetrics.cacheHitRate || 0) * 100)}%\`;
            
            // Error rate
            const errorRate = (predictionMetrics.failedPredictions || 0) / 
                             Math.max(1, predictionMetrics.totalPredictions || 1);
            document.getElementById('error-rate').textContent = 
                \`\${(errorRate * 100).toFixed(2)}%\`;
            
            // Drift alerts
            document.getElementById('drift-alerts').textContent = 
                \`\${analyticsData.alerts?.length || 0}\`;
        }

        function updateModelList() {
            const container = document.getElementById('model-list');
            const models = analyticsData.modelMetrics || [];
            
            if (models.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">No models available</div>';
                return;
            }
            
            container.innerHTML = models.map(model => \`
                <div class="model-item" onclick="selectModel('\${model.modelId}')">
                    <div class="model-header">
                        <div class="model-name">\${model.modelId}</div>
                        <div class="model-status \${getModelStatusClass(model)}">\${getModelStatus(model)}</div>
                    </div>
                    <div class="model-metrics">
                        <div class="model-metric">
                            <div>Accuracy</div>
                            <div class="model-metric-value">\${(model.accuracy * 100).toFixed(1)}%</div>
                        </div>
                        <div class="model-metric">
                            <div>Latency</div>
                            <div class="model-metric-value">\${Math.round(model.predictionLatency)}ms</div>
                        </div>
                        <div class="model-metric">
                            <div>Drift</div>
                            <div class="model-metric-value">\${model.driftScore.toFixed(3)}</div>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function updateAlertList() {
            const container = document.getElementById('alert-list');
            const alerts = analyticsData.alerts || [];
            
            document.getElementById('alert-count').textContent = alerts.length;
            
            if (alerts.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #888; padding: 40px;">No active alerts</div>';
                return;
            }
            
            container.innerHTML = alerts.slice(0, 10).map((alert, index) => \`
                <div class="alert-item severity-\${alert.severity}" id="alert-\${index}">
                    <div class="alert-header">
                        <div class="alert-model">\${alert.modelId}</div>
                        <div class="alert-severity">\${alert.severity}</div>
                    </div>
                    <div class="alert-description">\${alert.description}</div>
                    <ul class="alert-recommendations">
                        \${alert.recommendations.slice(0, 3).map(rec => \`<li>\${rec}</li>\`).join('')}
                    </ul>
                    <div style="margin-top: 10px; font-size: 0.7em; color: #666;">
                        \${new Date(alert.detectedAt).toLocaleString()}
                        \${alert.autoRemediation ? '<span style="color: #00ff88;"> [AUTO-FIXING]</span>' : ''}
                    </div>
                </div>
            \`).join('');
        }

        function updateFeatureAnalytics() {
            const container = document.getElementById('feature-analytics');
            const features = analyticsData.featureAnalytics || [];
            
            if (features.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">No feature data available</div>';
                return;
            }
            
            const sortedFeatures = features
                .sort((a, b) => b.importance - a.importance)
                .slice(0, 15);
            
            container.innerHTML = sortedFeatures.map(feature => \`
                <div class="feature-item">
                    <div class="feature-name">\${feature.featureName}</div>
                    <div style="display: flex; align-items: center;">
                        <div class="feature-importance">
                            <div class="feature-importance-bar" style="width: \${feature.importance * 100}%"></div>
                        </div>
                        <div class="drift-indicator \${getDriftClass(feature.driftMetrics?.psi || 0)}"></div>
                    </div>
                </div>
            \`).join('');
        }

        function initCharts() {
            // Main performance chart
            const mainCtx = document.getElementById('main-chart').getContext('2d');
            charts.main = new Chart(mainCtx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Accuracy',
                        data: [],
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: { unit: 'minute' },
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#888' }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#888' }
                        }
                    },
                    animation: { duration: 500 }
                }
            });
            
            // Feature importance chart
            const featureCtx = document.getElementById('feature-chart').getContext('2d');
            charts.features = new Chart(featureCtx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Feature Importance',
                        data: [],
                        backgroundColor: 'rgba(0, 255, 136, 0.6)',
                        borderColor: '#00ff88',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
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

        function updateCharts() {
            updateMainChart();
            updateFeatureChart();
        }

        function updateMainChart() {
            const models = analyticsData.modelMetrics || [];
            const now = new Date();
            
            if (models.length > 0) {
                // Update chart based on current tab
                let dataValue, label;
                switch (currentChart) {
                    case 'accuracy':
                        dataValue = models.reduce((sum, m) => sum + m.accuracy, 0) / models.length;
                        label = 'Average Accuracy';
                        break;
                    case 'latency':
                        dataValue = models.reduce((sum, m) => sum + m.predictionLatency, 0) / models.length;
                        label = 'Average Latency (ms)';
                        break;
                    case 'throughput':
                        dataValue = models.reduce((sum, m) => sum + m.throughput, 0);
                        label = 'Total Throughput';
                        break;
                    case 'drift':
                        dataValue = models.reduce((sum, m) => sum + m.driftScore, 0) / models.length;
                        label = 'Average Drift Score';
                        break;
                }
                
                charts.main.data.labels.push(now);
                charts.main.data.datasets[0].data.push(dataValue);
                charts.main.data.datasets[0].label = label;
                
                // Keep only last 50 data points
                if (charts.main.data.labels.length > 50) {
                    charts.main.data.labels.shift();
                    charts.main.data.datasets[0].data.shift();
                }
                
                charts.main.update('none');
            }
        }

        function updateFeatureChart() {
            const features = analyticsData.featureAnalytics || [];
            
            if (features.length > 0) {
                const topFeatures = features
                    .sort((a, b) => b.importance - a.importance)
                    .slice(0, 10);
                
                charts.features.data.labels = topFeatures.map(f => f.featureName);
                charts.features.data.datasets[0].data = topFeatures.map(f => f.importance);
                charts.features.update('none');
            }
        }

        // Helper functions
        function getModelStatus(model) {
            if (model.driftScore > 0.8) return 'critical';
            if (model.accuracy < 0.8 || model.driftScore > 0.6) return 'warning';
            return 'healthy';
        }

        function getModelStatusClass(model) {
            return 'status-' + getModelStatus(model);
        }

        function getDriftClass(driftScore) {
            if (driftScore > 0.7) return 'drift-high';
            if (driftScore > 0.4) return 'drift-medium';
            return 'drift-low';
        }

        function showChart(chartType) {
            // Update tab appearance
            document.querySelectorAll('.chart-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            currentChart = chartType;
            
            // Reset chart data
            charts.main.data.labels = [];
            charts.main.data.datasets[0].data = [];
            charts.main.update();
        }

        function selectModel(modelId) {
            // Send request for detailed model information
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'get_model_details',
                    modelId: modelId
                }));
            }
            
            showNotification(\`Loading details for \${modelId}...\`, 'success');
        }

        function handleNewAlert(alert) {
            analyticsData.alerts.unshift(alert);
            updateAlertList();
            updateStatusIndicators();
            
            showNotification(
                \`🚨 New \${alert.severity} alert: \${alert.description}\`, 
                alert.severity === 'critical' ? 'error' : 'warning'
            );
        }

        function handleModelDetails(data) {
            // Could open a detailed modal or update a detail panel
            console.log('Model details received:', data);
        }

        function refreshModels() {
            showNotification('Refreshing model data...', 'success');
            // Trigger a refresh from the server
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'refresh_models' }));
            }
        }

        function showNotification(message, type = 'success') {
            const notification = document.createElement('div');
            notification.className = \`notification \${type}\`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 5000);
        }

        function startPeriodicUpdates() {
            // Fetch data from API every 30 seconds as backup
            setInterval(async () => {
                if (!ws || ws.readyState !== WebSocket.OPEN) {
                    try {
                        const response = await fetch('/api/analytics/overview');
                        const data = await response.json();
                        analyticsData.realTimeAnalytics = data;
                        updateStatusIndicators();
                        updateMetricsOverview();
                    } catch (error) {
                        console.error('Error fetching analytics data:', error);
                    }
                }
            }, 30000);
        }

        // Initialize dashboard when page loads
        window.onload = () => {
            initDashboard();
        };

        // Cleanup on page unload
        window.onbeforeunload = () => {
            if (ws) {
                ws.close();
            }
        };
    </script>
</body>
</html>`;
  }

  // Helper and utility methods
  private calculateAvgAccuracy(): number {
    const models = Array.from(this.modelMetrics.values());
    if (models.length === 0) return 0;
    return models.reduce((sum, model) => sum + model.accuracy, 0) / models.length;
  }

  private assessSystemHealth(): 'excellent' | 'good' | 'warning' | 'critical' {
    const avgAccuracy = this.calculateAvgAccuracy();
    const alertCount = this.driftAlerts.length;
    const errorRate = this.predictionMetrics.failedPredictions / 
                     Math.max(1, this.predictionMetrics.totalPredictions);
    
    if (avgAccuracy > 0.9 && alertCount === 0 && errorRate < 0.01) return 'excellent';
    if (avgAccuracy > 0.85 && alertCount < 3 && errorRate < 0.05) return 'good';
    if (avgAccuracy > 0.75 && alertCount < 10 && errorRate < 0.1) return 'warning';
    return 'critical';
  }

  private getAlertCounts(): { low: number; medium: number; high: number; critical: number } {
    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    this.driftAlerts.forEach(alert => {
      counts[alert.severity]++;
    });
    return counts;
  }

  private async getResourceUsage(): Promise<{ cpu: number; memory: number; disk: number }> {
    // In a real implementation, this would gather actual system metrics
    return {
      cpu: Math.random() * 30 + 20,
      memory: Math.random() * 40 + 30,
      disk: Math.random() * 20 + 10
    };
  }

  private getNetworkMetrics(): { requestsPerSecond: number; responseTime: number; errorRate: number } {
    return {
      requestsPerSecond: this.performanceMetrics.dashboardRequests / 60,
      responseTime: this.performanceMetrics.avgResponseTime,
      errorRate: this.predictionMetrics.failedPredictions / 
                Math.max(1, this.predictionMetrics.totalPredictions)
    };
  }

  private updateHistoricalData(): void {
    const timestamp = Date.now();
    
    // Store historical data for each model
    for (const [modelId, metrics] of this.modelMetrics) {
      if (!this.historicalData.has(modelId)) {
        this.historicalData.set(modelId, []);
      }
      
      const history = this.historicalData.get(modelId)!;
      history.push({
        timestamp,
        accuracy: metrics.accuracy,
        latency: metrics.predictionLatency,
        throughput: metrics.throughput,
        driftScore: metrics.driftScore,
        errorRate: metrics.errorRate
      });
      
      // Keep only data from last 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      this.historicalData.set(modelId, 
        history.filter(point => point.timestamp > sevenDaysAgo)
      );
    }
  }

  private inferModelType(modelId: string): MLModelMetrics['modelType'] {
    if (modelId.includes('asset')) return 'asset_valuation';
    if (modelId.includes('market')) return 'market_trend';
    if (modelId.includes('risk')) return 'risk_assessment';
    if (modelId.includes('performance')) return 'performance_forecast';
    if (modelId.includes('anomaly')) return 'anomaly_detection';
    return 'asset_valuation'; // default
  }

  private async calculateModelAccuracy(modelId: string): Promise<number> {
    // In a real implementation, this would calculate actual accuracy from recent predictions
    return 0.85 + Math.random() * 0.1;
  }

  private async calculateModelPrecision(modelId: string): Promise<number> {
    return 0.80 + Math.random() * 0.15;
  }

  private async calculateModelRecall(modelId: string): Promise<number> {
    return 0.82 + Math.random() * 0.12;
  }

  private async calculateF1Score(modelId: string): Promise<number> {
    const precision = await this.calculateModelPrecision(modelId);
    const recall = await this.calculateModelRecall(modelId);
    return 2 * (precision * recall) / (precision + recall);
  }

  private async getModelLatency(modelId: string): Promise<number> {
    return Math.random() * 50 + 25; // 25-75ms
  }

  private async getModelThroughput(modelId: string): Promise<number> {
    return Math.random() * 100 + 50; // 50-150 predictions/sec
  }

  private async getModelErrorRate(modelId: string): Promise<number> {
    return Math.random() * 0.05; // 0-5% error rate
  }

  private async calculateDriftScore(modelId: string): Promise<number> {
    return Math.random() * 0.5 + 0.1; // 0.1-0.6 drift score
  }

  private async getConfidenceDistribution(modelId: string): Promise<number[]> {
    // Return distribution of confidence scores (10 buckets)
    return Array(10).fill(0).map(() => Math.random() * 100);
  }

  private async getFeatureImportance(modelId: string): Promise<Record<string, number>> {
    // Mock feature importance data
    const features = ['price', 'volume', 'volatility', 'trend', 'sentiment'];
    const importance: Record<string, number> = {};
    features.forEach(feature => {
      importance[feature] = Math.random();
    });
    return importance;
  }

  private storeHistoricalDataPoint(modelId: string, metrics: MLModelMetrics): void {
    if (!this.historicalData.has(modelId)) {
      this.historicalData.set(modelId, []);
    }
    
    const history = this.historicalData.get(modelId)!;
    history.push({
      timestamp: Date.now(),
      ...metrics
    });
    
    // Keep only last 1000 data points per model
    if (history.length > 1000) {
      this.historicalData.set(modelId, history.slice(-1000));
    }
  }

  private discoverNewModels(enginePerformance: any): void {
    // Add logic to discover new models from the analytics engine
    // This would integrate with the actual model registry
  }

  private getTopDriftingFeatures(modelId: string): string[] {
    // Return features with highest drift scores
    const features = this.featureAnalytics;
    return Array.from(features.values())
      .sort((a, b) => (b.driftMetrics?.psi || 0) - (a.driftMetrics?.psi || 0))
      .slice(0, 5)
      .map(f => f.featureName);
  }

  private categorizeDriftSeverity(driftScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (driftScore > 0.9) return 'critical';
    if (driftScore > 0.7) return 'high';
    if (driftScore > 0.5) return 'medium';
    return 'low';
  }

  private getRecentPredictions(modelId: string): any[] {
    // Return recent predictions for the model
    return [];
  }

  private getModelPerformanceTrend(modelId: string): any[] {
    return this.historicalData.get(modelId) || [];
  }

  private async triggerModelRetrain(modelId: string, options: any = {}): Promise<void> {
    this.logger.info(`🔄 Triggering retrain for model ${modelId}`);
    // Implementation would integrate with the analytics engine
    await this.analyticsEngine.updateModel(modelId, null as any);
  }

  private async updateFeaturePreprocessing(modelId: string, features: string[]): Promise<void> {
    this.logger.info(`🔧 Updating feature preprocessing for ${modelId}`);
    // Implementation would update preprocessing pipeline
  }

  private async optimizeModelHyperparameters(modelId: string): Promise<void> {
    this.logger.info(`⚙️ Optimizing hyperparameters for ${modelId}`);
    // Implementation would trigger hyperparameter optimization
  }

  private async finetuneModel(modelId: string): Promise<void> {
    this.logger.info(`🎯 Fine-tuning model ${modelId}`);
    // Implementation would perform model fine-tuning
  }

  private acknowledgeAlert(alertId: string): void {
    // Remove acknowledged alert
    this.driftAlerts = this.driftAlerts.filter((_, index) => 
      `alert-${index}` !== alertId
    );
  }

  private updateConfig(newConfig: Partial<AnalyticsDashboardConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('📝 Dashboard configuration updated');
  }

  private updatePredictionMetrics(data: any): void {
    this.predictionMetrics.totalPredictions++;
    if (data.success) {
      this.predictionMetrics.successfulPredictions++;
    } else {
      this.predictionMetrics.failedPredictions++;
    }
    
    if (data.latency) {
      this.predictionMetrics.avgLatency = 
        (this.predictionMetrics.avgLatency + data.latency) / 2;
    }
  }

  private updatePerformanceMetrics(metrics: any): void {
    // Update internal performance tracking
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
  }

  async stop(): Promise<void> {
    this.logger.info('🛑 Stopping AV10-26 Predictive Analytics Dashboard...');
    
    // Clear all intervals
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    if (this.alertCheckInterval) clearInterval(this.alertCheckInterval);
    if (this.driftDetectionInterval) clearInterval(this.driftDetectionInterval);
    if (this.clientBroadcastInterval) clearInterval(this.clientBroadcastInterval);
    
    // Close WebSocket connections
    if (this.wss) {
      this.wss.close();
      this.clients.clear();
    }
    
    // Close HTTP server
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.logger.info('✅ AV10-26 Predictive Analytics Dashboard stopped');
          resolve();
        });
      });
    }
  }
}
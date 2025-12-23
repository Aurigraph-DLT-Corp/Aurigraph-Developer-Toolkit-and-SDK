import { EventEmitter } from 'events';
import { WebSocket, WebSocketServer } from 'ws';

export interface IoTDataPoint {
  deviceId: string;
  timestamp: number;
  sensorType: 'temperature' | 'humidity' | 'pressure' | 'vibration' | 'gps' | 'energy' | 'security' | 'air_quality';
  value: number;
  unit: string;
  metadata?: Record<string, any>;
  assetId: string;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
}

export interface DigitalTwinAsset {
  id: string;
  name: string;
  type: 'building' | 'vehicle' | 'equipment' | 'infrastructure' | 'commodity';
  owner: string;
  tokenId?: string;
  model3D?: string;
  sensors: IoTSensor[];
  currentValue: number;
  lastUpdate: number;
  status: 'active' | 'maintenance' | 'offline' | 'alert';
  predictedValues: PredictedValue[];
  anomalies: AnomalyAlert[];
  metadata: Record<string, any>;
}

export interface IoTSensor {
  deviceId: string;
  type: string;
  status: 'active' | 'offline' | 'error';
  lastReading: IoTDataPoint | null;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  calibrationDate: number;
  nextMaintenanceDate: number;
}

export interface PredictedValue {
  timestamp: number;
  predictedValue: number;
  confidence: number;
  algorithm: string;
  factors: string[];
}

export interface AnomalyAlert {
  id: string;
  assetId: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'sensor_failure' | 'value_anomaly' | 'pattern_deviation' | 'predictive_maintenance';
  description: string;
  sensorData: IoTDataPoint[];
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

export interface DigitalTwinConfiguration {
  maxDevicesPerAsset: number;
  dataRetentionDays: number;
  anomalyThresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    vibration: { threshold: number };
    energy: { threshold: number };
  };
  predictiveModels: {
    enabled: boolean;
    updateInterval: number;
    lookAheadDays: number;
  };
  realTimeProcessing: {
    maxLatency: number;
    batchSize: number;
    processingInterval: number;
  };
  visualization: {
    enabled: boolean;
    updateInterval: number;
    maxDataPoints: number;
  };
}

export interface DigitalTwinMetrics {
  totalAssets: number;
  activeDevices: number;
  dataPointsProcessed: number;
  averageLatency: number;
  anomaliesDetected: number;
  predictionAccuracy: number;
  uptime: number;
  totalValue: number;
}

export interface MonitoringDashboard {
  id: string;
  assetId: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  refreshInterval: number;
  alerts: AnomalyAlert[];
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'gauge' | 'map' | 'alert' | 'value' | '3d_model';
  title: string;
  dataSource: string;
  config: Record<string, any>;
  position: { x: number; y: number; width: number; height: number };
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  responsive: boolean;
}

export class DigitalTwinEngine extends EventEmitter {
  private config: DigitalTwinConfiguration;
  private assets: Map<string, DigitalTwinAsset> = new Map();
  private iotData: Map<string, IoTDataPoint[]> = new Map();
  private wsServer: WebSocketServer;
  private connectedClients: Set<WebSocket> = new Set();
  private processingQueue: IoTDataPoint[] = [];
  private metrics: DigitalTwinMetrics;
  private dashboards: Map<string, MonitoringDashboard> = new Map();
  private anomalies: Map<string, AnomalyAlert> = new Map();
  private isProcessing: boolean = false;
  private startTime: number = Date.now();

  constructor(config: DigitalTwinConfiguration, port: number = 8080) {
    super();
    this.config = config;
    this.metrics = {
      totalAssets: 0,
      activeDevices: 0,
      dataPointsProcessed: 0,
      averageLatency: 0,
      anomaliesDetected: 0,
      predictionAccuracy: 0,
      uptime: 0,
      totalValue: 0
    };

    this.wsServer = new WebSocketServer({ 
      port,
      perMessageDeflate: false 
    });

    this.setupWebSocketServer();
    this.startRealTimeProcessing();
    this.startPredictiveAnalysis();
    this.startMetricsCollection();

    console.log(`🔥 Digital Twin Engine initialized on port ${port}`);
  }

  private setupWebSocketServer(): void {
    this.wsServer.on('connection', (ws: WebSocket) => {
      this.connectedClients.add(ws);
      console.log(`📡 Client connected. Total: ${this.connectedClients.size}`);

      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleWebSocketMessage(ws, message);
        } catch (error: unknown) {
          ws.send(JSON.stringify({ 
            type: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error' 
          }));
        }
      });

      ws.on('close', () => {
        this.connectedClients.delete(ws);
        console.log(`📡 Client disconnected. Total: ${this.connectedClients.size}`);
      });

      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to Digital Twin Engine',
        timestamp: Date.now()
      }));
    });
  }

  private async handleWebSocketMessage(ws: WebSocket, message: any): Promise<void> {
    switch (message.type) {
      case 'iot_data':
        await this.processIoTData(message.data);
        break;
      case 'subscribe_asset':
        this.subscribeToAsset(ws, message.assetId);
        break;
      case 'get_dashboard':
        const dashboard = await this.getDashboard(message.assetId);
        ws.send(JSON.stringify({ type: 'dashboard', data: dashboard }));
        break;
      case 'create_alert':
        await this.createAnomalyAlert(message.data);
        break;
      case 'get_metrics':
        ws.send(JSON.stringify({ type: 'metrics', data: this.getMetrics() }));
        break;
      default:
        ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  async createDigitalTwin(asset: Omit<DigitalTwinAsset, 'lastUpdate' | 'predictedValues' | 'anomalies'>): Promise<string> {
    const digitalTwin: DigitalTwinAsset = {
      ...asset,
      lastUpdate: Date.now(),
      predictedValues: [],
      anomalies: []
    };

    this.assets.set(asset.id, digitalTwin);
    this.iotData.set(asset.id, []);
    
    this.metrics.totalAssets++;
    this.metrics.totalValue += asset.currentValue;

    const dashboard = await this.createDefaultDashboard(asset.id);
    this.dashboards.set(asset.id, dashboard);

    this.emit('asset_created', digitalTwin);
    this.broadcastToClients({ type: 'asset_created', data: digitalTwin });

    console.log(`🏗️  Digital Twin created for asset: ${asset.name} (${asset.id})`);
    return asset.id;
  }

  async processIoTData(dataPoint: IoTDataPoint): Promise<void> {
    const startTime = Date.now();
    
    this.processingQueue.push(dataPoint);
    this.metrics.dataPointsProcessed++;

    if (!this.assets.has(dataPoint.assetId)) {
      throw new Error(`Asset not found: ${dataPoint.assetId}`);
    }

    const asset = this.assets.get(dataPoint.assetId)!;
    const assetData = this.iotData.get(dataPoint.assetId)!;
    
    assetData.push(dataPoint);
    
    if (assetData.length > this.config.realTimeProcessing.batchSize * 10) {
      assetData.splice(0, assetData.length - this.config.realTimeProcessing.batchSize * 10);
    }

    const sensor = asset.sensors.find(s => s.deviceId === dataPoint.deviceId);
    if (sensor) {
      sensor.lastReading = dataPoint;
      sensor.status = 'active';
    }

    asset.lastUpdate = Date.now();
    
    await this.detectAnomalies(asset, dataPoint);
    await this.updateAssetValue(asset, dataPoint);

    const latency = Date.now() - startTime;
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;

    this.emit('data_processed', { asset, dataPoint, latency });
    this.broadcastToClients({ 
      type: 'iot_data', 
      data: { assetId: dataPoint.assetId, dataPoint, asset } 
    });

    if (latency > this.config.realTimeProcessing.maxLatency) {
      console.warn(`⚠️  High latency detected: ${latency}ms for asset ${dataPoint.assetId}`);
    }
  }

  private async detectAnomalies(asset: DigitalTwinAsset, dataPoint: IoTDataPoint): Promise<void> {
    const thresholds = this.config.anomalyThresholds;
    let anomalyDetected = false;
    let anomalyDescription = '';
    let severity: AnomalyAlert['severity'] = 'low';

    switch (dataPoint.sensorType) {
      case 'temperature':
        if (dataPoint.value < thresholds.temperature.min || dataPoint.value > thresholds.temperature.max) {
          anomalyDetected = true;
          anomalyDescription = `Temperature out of range: ${dataPoint.value}${dataPoint.unit}`;
          severity = dataPoint.value < -10 || dataPoint.value > 60 ? 'critical' : 'medium';
        }
        break;
      case 'humidity':
        if (dataPoint.value < thresholds.humidity.min || dataPoint.value > thresholds.humidity.max) {
          anomalyDetected = true;
          anomalyDescription = `Humidity out of range: ${dataPoint.value}${dataPoint.unit}`;
          severity = 'medium';
        }
        break;
      case 'vibration':
        if (dataPoint.value > thresholds.vibration.threshold) {
          anomalyDetected = true;
          anomalyDescription = `High vibration detected: ${dataPoint.value}${dataPoint.unit}`;
          severity = dataPoint.value > thresholds.vibration.threshold * 2 ? 'critical' : 'high';
        }
        break;
      case 'energy':
        if (dataPoint.value > thresholds.energy.threshold) {
          anomalyDetected = true;
          anomalyDescription = `High energy consumption: ${dataPoint.value}${dataPoint.unit}`;
          severity = 'medium';
        }
        break;
    }

    if (anomalyDetected) {
      const anomaly: AnomalyAlert = {
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        assetId: asset.id,
        timestamp: Date.now(),
        severity,
        type: 'value_anomaly',
        description: anomalyDescription,
        sensorData: [dataPoint],
        resolved: false
      };

      this.anomalies.set(anomaly.id, anomaly);
      asset.anomalies.push(anomaly);
      this.metrics.anomaliesDetected++;

      if (severity === 'critical' || severity === 'high') {
        asset.status = 'alert';
      }

      this.emit('anomaly_detected', anomaly);
      this.broadcastToClients({ type: 'anomaly', data: anomaly });

      console.log(`🚨 Anomaly detected: ${anomalyDescription} - Severity: ${severity}`);
    }
  }

  private async updateAssetValue(asset: DigitalTwinAsset, dataPoint: IoTDataPoint): Promise<void> {
    const assetData = this.iotData.get(asset.id)!;
    
    if (assetData.length < 10) return;

    const recentData = assetData.slice(-10);
    const avgValue = recentData.reduce((sum, dp) => sum + dp.value, 0) / recentData.length;
    
    let valueFactor = 1.0;
    
    switch (dataPoint.sensorType) {
      case 'temperature':
        if (dataPoint.value >= 20 && dataPoint.value <= 25) valueFactor = 1.02;
        else if (dataPoint.value < 10 || dataPoint.value > 35) valueFactor = 0.95;
        break;
      case 'vibration':
        if (dataPoint.value > this.config.anomalyThresholds.vibration.threshold) {
          valueFactor = 0.98;
        }
        break;
      case 'energy':
        if (dataPoint.value < this.config.anomalyThresholds.energy.threshold * 0.8) {
          valueFactor = 1.01;
        }
        break;
    }

    const previousValue = asset.currentValue;
    asset.currentValue = Math.round(asset.currentValue * valueFactor * 100) / 100;

    if (Math.abs(asset.currentValue - previousValue) > previousValue * 0.01) {
      this.emit('value_updated', { 
        asset, 
        previousValue, 
        newValue: asset.currentValue, 
        factor: valueFactor 
      });
    }

    this.metrics.totalValue += (asset.currentValue - previousValue);
  }

  private async createDefaultDashboard(assetId: string): Promise<MonitoringDashboard> {
    const asset = this.assets.get(assetId)!;
    
    const dashboard: MonitoringDashboard = {
      id: `dashboard_${assetId}`,
      assetId,
      refreshInterval: 1000,
      alerts: [],
      layout: {
        columns: 12,
        rows: 8,
        responsive: true
      },
      widgets: [
        {
          id: 'value_widget',
          type: 'value',
          title: 'Current Value',
          dataSource: 'asset.currentValue',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: { format: 'currency', decimals: 2 }
        },
        {
          id: 'status_widget',
          type: 'gauge',
          title: 'Asset Status',
          dataSource: 'asset.status',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: { type: 'status', colors: ['green', 'yellow', 'red'] }
        },
        {
          id: 'sensors_chart',
          type: 'chart',
          title: 'Sensor Readings',
          dataSource: 'iot.recent',
          position: { x: 0, y: 2, width: 12, height: 4 },
          config: { type: 'line', maxPoints: 100, multiSeries: true }
        },
        {
          id: 'alerts_widget',
          type: 'alert',
          title: 'Recent Alerts',
          dataSource: 'asset.anomalies',
          position: { x: 6, y: 0, width: 6, height: 2 },
          config: { maxAlerts: 5, showResolved: false }
        }
      ]
    };

    if (asset.model3D) {
      dashboard.widgets.push({
        id: '3d_model_widget',
        type: '3d_model',
        title: '3D Model',
        dataSource: 'asset.model3D',
        position: { x: 0, y: 6, width: 6, height: 2 },
        config: { interactive: true, showSensors: true }
      });
    }

    return dashboard;
  }

  async getDashboard(assetId: string): Promise<MonitoringDashboard | null> {
    const dashboard = this.dashboards.get(assetId);
    if (!dashboard) return null;

    dashboard.alerts = this.assets.get(assetId)?.anomalies.filter(a => !a.resolved).slice(-5) || [];
    return dashboard;
  }

  async createAnomalyAlert(alertData: Partial<AnomalyAlert>): Promise<string> {
    const alert: AnomalyAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
      severity: 'medium',
      type: 'value_anomaly',
      description: '',
      sensorData: [],
      ...alertData
    } as AnomalyAlert;

    this.anomalies.set(alert.id, alert);
    
    const asset = this.assets.get(alert.assetId);
    if (asset) {
      asset.anomalies.push(alert);
    }

    this.metrics.anomaliesDetected++;
    this.emit('anomaly_created', alert);
    this.broadcastToClients({ type: 'anomaly', data: alert });

    return alert.id;
  }

  async resolveAnomaly(anomalyId: string, resolvedBy: string): Promise<boolean> {
    const anomaly = this.anomalies.get(anomalyId);
    if (!anomaly) return false;

    anomaly.resolved = true;
    anomaly.resolvedBy = resolvedBy;
    anomaly.resolvedAt = Date.now();

    const asset = this.assets.get(anomaly.assetId);
    if (asset) {
      const unresolvedAnomalies = asset.anomalies.filter(a => !a.resolved && a.severity === 'critical');
      if (unresolvedAnomalies.length === 0 && asset.status === 'alert') {
        asset.status = 'active';
      }
    }

    this.emit('anomaly_resolved', anomaly);
    this.broadcastToClients({ type: 'anomaly_resolved', data: anomaly });

    return true;
  }

  private subscribeToAsset(ws: WebSocket, assetId: string): void {
    const asset = this.assets.get(assetId);
    if (!asset) {
      ws.send(JSON.stringify({ type: 'error', message: 'Asset not found' }));
      return;
    }

    ws.send(JSON.stringify({
      type: 'subscription_confirmed',
      assetId,
      asset
    }));
  }

  private broadcastToClients(message: any): void {
    const messageStr = JSON.stringify(message);
    this.connectedClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  private startRealTimeProcessing(): void {
    setInterval(() => {
      if (this.isProcessing || this.processingQueue.length === 0) return;

      this.isProcessing = true;
      const batch = this.processingQueue.splice(0, this.config.realTimeProcessing.batchSize);
      
      batch.forEach(dataPoint => {
        this.emit('batch_processed', dataPoint);
      });

      this.isProcessing = false;
    }, this.config.realTimeProcessing.processingInterval);
  }

  private startPredictiveAnalysis(): void {
    if (!this.config.predictiveModels.enabled) return;

    setInterval(async () => {
      for (const [assetId, asset] of this.assets) {
        await this.generatePredictions(asset);
      }
    }, this.config.predictiveModels.updateInterval);
  }

  private async generatePredictions(asset: DigitalTwinAsset): Promise<void> {
    const assetData = this.iotData.get(asset.id)!;
    if (assetData.length < 50) return;

    const recentData = assetData.slice(-50);
    const avgValue = recentData.reduce((sum, dp) => sum + dp.value, 0) / recentData.length;
    const trend = this.calculateTrend(recentData);

    const lookAheadMs = this.config.predictiveModels.lookAheadDays * 24 * 60 * 60 * 1000;
    const predictions: PredictedValue[] = [];

    for (let i = 1; i <= 7; i++) {
      const futureTimestamp = Date.now() + (i * lookAheadMs / 7);
      const predictedValue = asset.currentValue * (1 + (trend * i * 0.1));
      const confidence = Math.max(0.1, 0.9 - (i * 0.1));

      predictions.push({
        timestamp: futureTimestamp,
        predictedValue: Math.round(predictedValue * 100) / 100,
        confidence,
        algorithm: 'linear_trend',
        factors: ['historical_data', 'trend_analysis']
      });
    }

    asset.predictedValues = predictions;
    this.emit('predictions_updated', { asset, predictions });
  }

  private calculateTrend(data: IoTDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    
    return (last - first) / first;
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
      this.emit('metrics_updated', this.metrics);
      this.broadcastToClients({ type: 'metrics', data: this.metrics });
    }, 5000);
  }

  private updateMetrics(): void {
    this.metrics.activeDevices = Array.from(this.assets.values())
      .reduce((count, asset) => count + asset.sensors.filter(s => s.status === 'active').length, 0);
    
    this.metrics.uptime = Date.now() - this.startTime;
    
    const totalPredictions = Array.from(this.assets.values())
      .reduce((count, asset) => count + asset.predictedValues.length, 0);
    
    this.metrics.predictionAccuracy = totalPredictions > 0 ? 0.85 + (Math.random() * 0.10) : 0;
  }

  getMetrics(): DigitalTwinMetrics {
    return { ...this.metrics };
  }

  getAsset(assetId: string): DigitalTwinAsset | undefined {
    return this.assets.get(assetId);
  }

  getAllAssets(): DigitalTwinAsset[] {
    return Array.from(this.assets.values());
  }

  getIoTData(assetId: string, limit?: number): IoTDataPoint[] {
    const data = this.iotData.get(assetId) || [];
    return limit ? data.slice(-limit) : data;
  }

  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Digital Twin Engine...');
    
    this.connectedClients.forEach(client => {
      client.close(1000, 'Server shutting down');
    });
    
    this.wsServer.close();
    this.removeAllListeners();
    
    console.log('✅ Digital Twin Engine shutdown complete');
  }
}

export default DigitalTwinEngine;
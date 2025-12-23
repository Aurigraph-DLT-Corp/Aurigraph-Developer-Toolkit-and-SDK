import { EventEmitter } from 'events';
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
        temperature: {
            min: number;
            max: number;
        };
        humidity: {
            min: number;
            max: number;
        };
        vibration: {
            threshold: number;
        };
        energy: {
            threshold: number;
        };
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
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export interface DashboardLayout {
    columns: number;
    rows: number;
    responsive: boolean;
}
export declare class DigitalTwinEngine extends EventEmitter {
    private config;
    private assets;
    private iotData;
    private wsServer;
    private connectedClients;
    private processingQueue;
    private metrics;
    private dashboards;
    private anomalies;
    private isProcessing;
    private startTime;
    constructor(config: DigitalTwinConfiguration, port?: number);
    private setupWebSocketServer;
    private handleWebSocketMessage;
    createDigitalTwin(asset: Omit<DigitalTwinAsset, 'lastUpdate' | 'predictedValues' | 'anomalies'>): Promise<string>;
    processIoTData(dataPoint: IoTDataPoint): Promise<void>;
    private detectAnomalies;
    private updateAssetValue;
    private createDefaultDashboard;
    getDashboard(assetId: string): Promise<MonitoringDashboard | null>;
    createAnomalyAlert(alertData: Partial<AnomalyAlert>): Promise<string>;
    resolveAnomaly(anomalyId: string, resolvedBy: string): Promise<boolean>;
    private subscribeToAsset;
    private broadcastToClients;
    private startRealTimeProcessing;
    private startPredictiveAnalysis;
    private generatePredictions;
    private calculateTrend;
    private startMetricsCollection;
    private updateMetrics;
    getMetrics(): DigitalTwinMetrics;
    getAsset(assetId: string): DigitalTwinAsset | undefined;
    getAllAssets(): DigitalTwinAsset[];
    getIoTData(assetId: string, limit?: number): IoTDataPoint[];
    shutdown(): Promise<void>;
}
export default DigitalTwinEngine;
//# sourceMappingURL=DigitalTwinEngine.d.ts.map
import { IoTDataPoint, AnomalyAlert, DigitalTwinEngine } from '../digitaltwin/DigitalTwinEngine';
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
    cameraPosition: {
        x: number;
        y: number;
        z: number;
    };
    lightingConfig: {
        ambient: number;
        directional: {
            intensity: number;
            position: {
                x: number;
                y: number;
                z: number;
            };
        };
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
export declare class DigitalTwinDashboard {
    private logger;
    private app;
    private server;
    private wss;
    private clients;
    private digitalTwinEngine;
    private config;
    private dashboardState;
    private assetMetrics;
    private activeAlerts;
    private recentData;
    private metricsUpdateInterval;
    private dashboardUpdateInterval;
    private alertCheckInterval;
    private performanceStats;
    constructor(digitalTwinEngine: DigitalTwinEngine, config?: Partial<DigitalTwinVisualizationConfig>);
    private initializeDashboardState;
    private setupDigitalTwinEngineListeners;
    private setupRoutes;
    private getDashboardHTML;
    private handleAssetCreated;
    private handleDataProcessed;
    private handleAnomalyDetected;
    private handleValueUpdated;
    private handlePredictionsUpdated;
    private updateAssetMetrics;
    private updateRecentData;
    private updateDashboardState;
    private calculateThroughput;
    private calculateLatency;
    private calculateAvailability;
    private calculateEfficiency;
    private calculatePredictiveScore;
    private calculateMaintenanceScore;
    private calculateTrend;
    private calculateSystemHealth;
    private getTopAnomalies;
    private getRecentActivity;
    private createCustomDashboard;
    private generatePerformanceAnalytics;
    private generatePredictionAnalytics;
    private broadcastToClients;
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
    getDashboardState(): DigitalTwinDashboardState;
    getAssetMetrics(assetId: string): AssetPerformanceMetrics | undefined;
    getActiveAlerts(): AnomalyAlert[];
    getRecentData(assetId: string, limit?: number): IoTDataPoint[];
    getPerformanceStats(): {
        uptime: number;
        currentConnections: number;
        totalRequests: number;
        totalDataPoints: number;
        averageProcessingTime: number;
        peakConcurrentUsers: number;
    };
}
export default DigitalTwinDashboard;
//# sourceMappingURL=DigitalTwinDashboard.d.ts.map
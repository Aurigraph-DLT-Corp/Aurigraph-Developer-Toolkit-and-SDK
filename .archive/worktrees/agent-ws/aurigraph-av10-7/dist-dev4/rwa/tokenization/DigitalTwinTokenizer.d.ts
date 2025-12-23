import { EventEmitter } from 'events';
import { Asset } from '../registry/AssetRegistry';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
import { HyperRAFTPlusPlusV2 } from '../../consensus/HyperRAFTPlusPlusV2';
export interface DigitalTwinToken {
    tokenId: string;
    assetId: string;
    twinId: string;
    iotDevices: IoTDevice[];
    sensorData: SensorReading[];
    analytics: TwinAnalytics;
    performance: PerformanceMetrics;
    maintenance: MaintenanceRecord[];
    created: Date;
    lastSync: Date;
}
export interface IoTDevice {
    deviceId: string;
    type: 'TEMPERATURE' | 'HUMIDITY' | 'PRESSURE' | 'VIBRATION' | 'LOCATION' | 'SECURITY' | 'ENERGY';
    manufacturer: string;
    model: string;
    location: string;
    status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'ERROR';
    lastPing: Date;
    batteryLevel?: number;
    firmwareVersion: string;
}
export interface SensorReading {
    deviceId: string;
    sensorType: string;
    value: number;
    unit: string;
    timestamp: Date;
    quality: number;
    anomaly: boolean;
    processed: boolean;
}
export interface TwinAnalytics {
    healthScore: number;
    performanceIndex: number;
    efficiencyRating: number;
    predictiveInsights: PredictiveInsight[];
    optimizationSuggestions: OptimizationSuggestion[];
    riskAssessment: RiskAssessment;
    lastAnalysis: Date;
}
export interface PredictiveInsight {
    type: 'MAINTENANCE' | 'PERFORMANCE' | 'VALUE' | 'RISK';
    prediction: string;
    confidence: number;
    timeframe: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    actionRequired: boolean;
}
export interface OptimizationSuggestion {
    category: 'ENERGY' | 'MAINTENANCE' | 'PERFORMANCE' | 'COST';
    suggestion: string;
    potentialSavings: number;
    implementationCost: number;
    paybackPeriod: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface RiskAssessment {
    overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    riskFactors: RiskFactor[];
    mitigationStrategies: string[];
    insuranceRecommendations: string[];
    lastAssessment: Date;
}
export interface RiskFactor {
    type: string;
    description: string;
    probability: number;
    impact: number;
    riskScore: number;
}
export interface PerformanceMetrics {
    uptime: number;
    efficiency: number;
    throughput: number;
    energyConsumption: number;
    maintenanceCost: number;
    valueGeneration: number;
    lastUpdated: Date;
}
export interface MaintenanceRecord {
    id: string;
    type: 'PREVENTIVE' | 'CORRECTIVE' | 'PREDICTIVE';
    description: string;
    cost: number;
    duration: number;
    performer: string;
    scheduledDate: Date;
    completedDate?: Date;
    outcome: string;
    nextMaintenance?: Date;
}
export declare class DigitalTwinTokenizer extends EventEmitter {
    private twins;
    private twinsByAsset;
    private iotDevices;
    private sensorReadings;
    private cryptoManager;
    private consensus;
    constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2);
    createDigitalTwin(asset: Asset, iotDevices: IoTDevice[]): Promise<string>;
    addSensorReading(deviceId: string, reading: Omit<SensorReading, 'deviceId' | 'processed'>): Promise<void>;
    updateTwinAnalytics(tokenId: string): Promise<void>;
    private calculateHealthScore;
    private calculatePerformanceIndex;
    private calculateEfficiencyRating;
    private generatePredictiveInsights;
    private generateOptimizationSuggestions;
    private assessRisks;
    private generateMitigationStrategies;
    private generateInsuranceRecommendations;
    private calculateValueTrend;
    private startRealTimeMonitoring;
    private simulateSensorData;
    private generateSimulatedReading;
    private handleAnomalyDetection;
    private schedulePredictiveMaintenance;
    getDigitalTwin(tokenId: string): Promise<DigitalTwinToken | null>;
    getTwinByAsset(assetId: string): Promise<DigitalTwinToken | null>;
    getRealtimeData(tokenId: string, hours?: number): Promise<SensorReading[]>;
    getTwinAnalytics(tokenId: string): Promise<TwinAnalytics | null>;
    generateTwinReport(tokenId: string): Promise<{
        summary: any;
        performance: PerformanceMetrics;
        insights: PredictiveInsight[];
        recommendations: OptimizationSuggestion[];
        risks: RiskAssessment;
    } | null>;
    private generateTwinId;
    private generateMaintenanceId;
}
//# sourceMappingURL=DigitalTwinTokenizer.d.ts.map
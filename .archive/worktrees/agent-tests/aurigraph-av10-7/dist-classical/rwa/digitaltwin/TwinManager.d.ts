import { EventEmitter } from 'events';
import { DigitalTwinToken } from '../tokenization/DigitalTwinTokenizer';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
export interface DigitalTwinLifecycle {
    twinId: string;
    assetId: string;
    currentPhase: TwinPhase;
    phaseHistory: PhaseRecord[];
    automation: AutomationSettings;
    integration: IntegrationStatus;
    monitoring: MonitoringConfiguration;
    maintenance: MaintenanceSchedule;
}
export declare enum TwinPhase {
    INITIALIZATION = "INITIALIZATION",
    DEPLOYMENT = "DEPLOYMENT",
    OPERATIONAL = "OPERATIONAL",
    OPTIMIZATION = "OPTIMIZATION",
    MAINTENANCE = "MAINTENANCE",
    DECOMMISSION = "DECOMMISSION"
}
export interface PhaseRecord {
    phase: TwinPhase;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    events: string[];
    performance: PhasePerformance;
}
export interface PhasePerformance {
    availability: number;
    dataQuality: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
}
export interface AutomationSettings {
    autoOptimization: boolean;
    autoMaintenance: boolean;
    autoScaling: boolean;
    anomalyResponse: 'ALERT_ONLY' | 'AUTO_CORRECT' | 'SHUTDOWN';
    learningEnabled: boolean;
    aiModelVersion: string;
}
export interface IntegrationStatus {
    iotPlatforms: PlatformConnection[];
    cloudServices: CloudService[];
    analyticsEngines: AnalyticsEngine[];
    externalApis: ExternalAPI[];
    lastSync: Date;
}
export interface PlatformConnection {
    platformId: string;
    name: string;
    type: 'AWS_IOT' | 'AZURE_IOT' | 'GOOGLE_IOT' | 'CUSTOM';
    endpoint: string;
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    deviceCount: number;
    lastHeartbeat: Date;
}
export interface CloudService {
    serviceId: string;
    provider: 'AWS' | 'AZURE' | 'GCP' | 'ALIBABA';
    serviceType: 'STORAGE' | 'COMPUTE' | 'ANALYTICS' | 'ML';
    region: string;
    status: string;
    cost: number;
}
export interface AnalyticsEngine {
    engineId: string;
    name: string;
    type: 'PREDICTIVE' | 'DESCRIPTIVE' | 'PRESCRIPTIVE' | 'REAL_TIME';
    accuracy: number;
    latency: number;
    enabled: boolean;
}
export interface ExternalAPI {
    apiId: string;
    name: string;
    endpoint: string;
    purpose: string;
    reliability: number;
    lastCall: Date;
}
export interface MonitoringConfiguration {
    realTimeEnabled: boolean;
    samplingRate: number;
    alertThresholds: AlertThreshold[];
    dashboards: DashboardConfig[];
    reporting: ReportingConfig;
    retention: DataRetentionPolicy;
}
export interface AlertThreshold {
    metric: string;
    condition: 'ABOVE' | 'BELOW' | 'EQUALS' | 'CHANGE_RATE';
    value: number;
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    action: string;
}
export interface DashboardConfig {
    dashboardId: string;
    name: string;
    widgets: DashboardWidget[];
    refreshRate: number;
    accessLevel: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
}
export interface DashboardWidget {
    widgetId: string;
    type: 'CHART' | 'GAUGE' | 'TABLE' | 'MAP' | 'ALERT';
    dataSource: string;
    configuration: Record<string, any>;
}
export interface ReportingConfig {
    automated: boolean;
    frequency: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    recipients: string[];
    format: 'PDF' | 'JSON' | 'CSV' | 'HTML';
    includeSections: string[];
}
export interface DataRetentionPolicy {
    rawData: number;
    aggregatedData: number;
    alertHistory: number;
    backupFrequency: 'HOURLY' | 'DAILY' | 'WEEKLY';
    compressionEnabled: boolean;
}
export interface MaintenanceSchedule {
    preventiveMaintenance: MaintenanceWindow[];
    predictiveMaintenance: PredictiveRule[];
    emergencyProcedures: EmergencyProcedure[];
    maintenanceHistory: MaintenanceEvent[];
}
export interface MaintenanceWindow {
    windowId: string;
    name: string;
    schedule: string;
    duration: number;
    tasks: MaintenanceTask[];
    autoExecute: boolean;
}
export interface MaintenanceTask {
    taskId: string;
    name: string;
    description: string;
    estimatedDuration: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    automatable: boolean;
}
export interface PredictiveRule {
    ruleId: string;
    condition: string;
    prediction: string;
    confidence: number;
    leadTime: number;
    action: string;
}
export interface EmergencyProcedure {
    procedureId: string;
    trigger: string;
    steps: string[];
    contactList: string[];
    escalationTime: number;
}
export interface MaintenanceEvent {
    eventId: string;
    type: 'PREVENTIVE' | 'PREDICTIVE' | 'EMERGENCY' | 'CORRECTIVE';
    startTime: Date;
    endTime?: Date;
    tasks: string[];
    outcome: string;
    cost: number;
}
export declare class TwinManager extends EventEmitter {
    private twins;
    private activeMonitoring;
    private analyticsEngines;
    private cryptoManager;
    constructor(cryptoManager: QuantumCryptoManagerV2);
    private initializeAnalyticsEngines;
    initializeTwin(twinToken: DigitalTwinToken): Promise<string>;
    startPhase(lifecycleId: string, phase: TwinPhase): Promise<void>;
    private executeInitializationPhase;
    private executeDeploymentPhase;
    private executeOperationalPhase;
    private executeOptimizationPhase;
    private executeMaintenancePhase;
    private setupIoTPlatforms;
    private setupCloudServices;
    private setupExternalAPIs;
    private createDefaultAlertThresholds;
    private createDefaultDashboards;
    private createMaintenanceWindows;
    private createPredictiveRules;
    private createEmergencyProcedures;
    private initializeIoTConnections;
    private setupRealTimeMonitoring;
    private initializeAnalytics;
    private startContinuousMonitoring;
    private enableAutoOptimization;
    private schedulePredictiveMaintenance;
    private performMonitoringCycle;
    private evaluateAlertThreshold;
    private executeAlertAction;
    private runOptimizationCycle;
    private evaluatePredictiveRules;
    private scheduleMaintenance;
    private restartTwinServices;
    getTwinLifecycle(twinId: string): Promise<DigitalTwinLifecycle | null>;
    getAllActiveTimings(): Promise<DigitalTwinLifecycle[]>;
    generateLifecycleReport(twinId: string): Promise<any>;
    private calculateTotalUptime;
    private calculateAverageMaintenanceCost;
    private calculateOptimizationImpact;
    private generateMaintenanceEventId;
    stopTwinManagement(twinId: string): Promise<void>;
}
//# sourceMappingURL=TwinManager.d.ts.map
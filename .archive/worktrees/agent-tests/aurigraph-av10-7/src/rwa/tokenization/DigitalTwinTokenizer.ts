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

export class DigitalTwinTokenizer extends EventEmitter {
  private twins: Map<string, DigitalTwinToken> = new Map();
  private twinsByAsset: Map<string, string> = new Map();
  private iotDevices: Map<string, IoTDevice> = new Map();
  private sensorReadings: Map<string, SensorReading[]> = new Map();
  private cryptoManager: QuantumCryptoManagerV2;
  private consensus: HyperRAFTPlusPlusV2;

  constructor(cryptoManager: QuantumCryptoManagerV2, consensus: HyperRAFTPlusPlusV2) {
    super();
    this.cryptoManager = cryptoManager;
    this.consensus = consensus;
  }

  async createDigitalTwin(asset: Asset, iotDevices: IoTDevice[]): Promise<string> {
    if (asset.verification.status !== 'VERIFIED') {
      throw new Error('Asset must be verified before digital twin creation');
    }

    if (this.twinsByAsset.has(asset.id)) {
      throw new Error('Digital twin already exists for this asset');
    }

    const twinId = await this.generateTwinId(asset);
    const tokenId = `DT-${twinId}`;

    // Register IoT devices
    for (const device of iotDevices) {
      this.iotDevices.set(device.deviceId, device);
      this.sensorReadings.set(device.deviceId, []);
    }

    const twin: DigitalTwinToken = {
      tokenId,
      assetId: asset.id,
      twinId,
      iotDevices,
      sensorData: [],
      analytics: {
        healthScore: 100,
        performanceIndex: 100,
        efficiencyRating: 100,
        predictiveInsights: [],
        optimizationSuggestions: [],
        riskAssessment: {
          overallRisk: 'LOW',
          riskFactors: [],
          mitigationStrategies: [],
          insuranceRecommendations: [],
          lastAssessment: new Date()
        },
        lastAnalysis: new Date()
      },
      performance: {
        uptime: 100,
        efficiency: 100,
        throughput: 0,
        energyConsumption: 0,
        maintenanceCost: 0,
        valueGeneration: asset.valuation.currentValue,
        lastUpdated: new Date()
      },
      maintenance: [],
      created: new Date(),
      lastSync: new Date()
    };

    // Submit to consensus
    await this.consensus.submitTransaction({
      type: 'DIGITAL_TWIN_CREATION',
      data: { assetId: asset.id, twinId, iotDevices: iotDevices.length },
      timestamp: Date.now()
    });

    this.twins.set(tokenId, twin);
    this.twinsByAsset.set(asset.id, tokenId);

    // Start real-time monitoring
    this.startRealTimeMonitoring(tokenId);

    this.emit('digitalTwinCreated', { tokenId, assetId: asset.id, twinId });
    
    return tokenId;
  }

  async addSensorReading(deviceId: string, reading: Omit<SensorReading, 'deviceId' | 'processed'>): Promise<void> {
    const device = this.iotDevices.get(deviceId);
    if (!device) {
      throw new Error('IoT device not found');
    }

    const sensorReading: SensorReading = {
      deviceId,
      ...reading,
      processed: false
    };

    // Store reading
    if (!this.sensorReadings.has(deviceId)) {
      this.sensorReadings.set(deviceId, []);
    }
    this.sensorReadings.get(deviceId)!.push(sensorReading);

    // Find associated twin
    const twin = Array.from(this.twins.values()).find(t => 
      t.iotDevices.some(d => d.deviceId === deviceId)
    );

    if (twin) {
      twin.sensorData.push(sensorReading);
      twin.lastSync = new Date();

      // Check for anomalies
      if (reading.anomaly) {
        await this.handleAnomalyDetection(twin.tokenId, sensorReading);
      }

      // Trigger analytics update
      await this.updateTwinAnalytics(twin.tokenId);
    }

    this.emit('sensorDataReceived', { deviceId, reading: sensorReading });
  }

  async updateTwinAnalytics(tokenId: string): Promise<void> {
    const twin = this.twins.get(tokenId);
    if (!twin) return;

    // Calculate health score based on sensor data
    const healthScore = this.calculateHealthScore(twin);
    
    // Calculate performance metrics
    const performanceIndex = this.calculatePerformanceIndex(twin);
    
    // Calculate efficiency rating
    const efficiencyRating = this.calculateEfficiencyRating(twin);

    // Generate predictive insights
    const insights = await this.generatePredictiveInsights(twin);
    
    // Generate optimization suggestions
    const optimizations = await this.generateOptimizationSuggestions(twin);
    
    // Update risk assessment
    const riskAssessment = await this.assessRisks(twin);

    twin.analytics = {
      healthScore,
      performanceIndex,
      efficiencyRating,
      predictiveInsights: insights,
      optimizationSuggestions: optimizations,
      riskAssessment,
      lastAnalysis: new Date()
    };

    // Update performance metrics
    twin.performance.lastUpdated = new Date();

    this.emit('analyticsUpdated', { tokenId, analytics: twin.analytics });
  }

  private calculateHealthScore(twin: DigitalTwinToken): number {
    if (twin.sensorData.length === 0) return 100;

    let totalScore = 0;
    let scoreCount = 0;

    // Analyze recent sensor data (last 24 hours)
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentData = twin.sensorData.filter(s => s.timestamp > cutoffTime);

    for (const reading of recentData) {
      let deviceScore = 100;
      
      // Penalize for anomalies
      if (reading.anomaly) deviceScore -= 30;
      
      // Consider data quality
      deviceScore *= (reading.quality / 100);
      
      totalScore += deviceScore;
      scoreCount++;
    }

    return scoreCount > 0 ? Math.max(0, Math.min(100, totalScore / scoreCount)) : 100;
  }

  private calculatePerformanceIndex(twin: DigitalTwinToken): number {
    // Simulate performance calculation based on sensor data and metrics
    let performanceIndex = 100;
    
    // Factor in device status
    const activeDevices = twin.iotDevices.filter(d => d.status === 'ACTIVE').length;
    const deviceRatio = activeDevices / twin.iotDevices.length;
    performanceIndex *= deviceRatio;

    // Factor in recent anomalies
    const recentAnomalies = twin.sensorData.filter(s => 
      s.anomaly && s.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length;
    
    if (recentAnomalies > 0) {
      performanceIndex -= Math.min(40, recentAnomalies * 10);
    }

    return Math.max(0, Math.min(100, performanceIndex));
  }

  private calculateEfficiencyRating(twin: DigitalTwinToken): number {
    // Simulate efficiency calculation
    const baseEfficiency = 90;
    const maintenanceCost = twin.performance.maintenanceCost;
    const valueGeneration = twin.performance.valueGeneration;
    
    if (valueGeneration > 0) {
      const costRatio = maintenanceCost / valueGeneration;
      return Math.max(20, Math.min(100, baseEfficiency - (costRatio * 100)));
    }
    
    return baseEfficiency;
  }

  private async generatePredictiveInsights(twin: DigitalTwinToken): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Predictive maintenance insights
    if (twin.analytics.healthScore < 80) {
      insights.push({
        type: 'MAINTENANCE',
        prediction: 'Maintenance required within 30 days based on declining health metrics',
        confidence: 85,
        timeframe: '30 days',
        impact: 'MEDIUM',
        actionRequired: true
      });
    }

    // Performance insights
    if (twin.analytics.performanceIndex < 70) {
      insights.push({
        type: 'PERFORMANCE',
        prediction: 'Performance degradation detected, optimization recommended',
        confidence: 78,
        timeframe: '7 days',
        impact: 'HIGH',
        actionRequired: true
      });
    }

    // Value insights
    const recentValueTrend = this.calculateValueTrend(twin);
    if (recentValueTrend < -5) {
      insights.push({
        type: 'VALUE',
        prediction: 'Asset value declining, intervention may be required',
        confidence: 72,
        timeframe: '14 days',
        impact: 'HIGH',
        actionRequired: true
      });
    }

    return insights;
  }

  private async generateOptimizationSuggestions(twin: DigitalTwinToken): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Energy optimization
    if (twin.performance.energyConsumption > 1000) {
      suggestions.push({
        category: 'ENERGY',
        suggestion: 'Install smart energy management system to reduce consumption by 20%',
        potentialSavings: twin.performance.energyConsumption * 0.2 * 0.12, // 20% savings at $0.12/kWh
        implementationCost: 5000,
        paybackPeriod: 18, // months
        priority: 'MEDIUM'
      });
    }

    // Maintenance optimization
    if (twin.maintenance.length > 5) {
      suggestions.push({
        category: 'MAINTENANCE',
        suggestion: 'Implement predictive maintenance schedule to reduce reactive repairs',
        potentialSavings: twin.performance.maintenanceCost * 0.3,
        implementationCost: 3000,
        paybackPeriod: 12,
        priority: 'HIGH'
      });
    }

    return suggestions;
  }

  private async assessRisks(twin: DigitalTwinToken): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    
    // Device failure risk
    const inactiveDevices = twin.iotDevices.filter(d => d.status !== 'ACTIVE').length;
    if (inactiveDevices > 0) {
      riskFactors.push({
        type: 'DEVICE_FAILURE',
        description: `${inactiveDevices} IoT devices inactive or in error state`,
        probability: (inactiveDevices / twin.iotDevices.length) * 100,
        impact: 70,
        riskScore: (inactiveDevices / twin.iotDevices.length) * 70
      });
    }

    // Performance risk
    if (twin.analytics.performanceIndex < 60) {
      riskFactors.push({
        type: 'PERFORMANCE_DEGRADATION',
        description: 'Significant performance degradation detected',
        probability: 80,
        impact: 60,
        riskScore: 48
      });
    }

    // Calculate overall risk
    const avgRiskScore = riskFactors.length > 0 
      ? riskFactors.reduce((sum, r) => sum + r.riskScore, 0) / riskFactors.length 
      : 0;

    let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (avgRiskScore > 50) overallRisk = 'HIGH';
    else if (avgRiskScore > 25) overallRisk = 'MEDIUM';

    return {
      overallRisk,
      riskFactors,
      mitigationStrategies: this.generateMitigationStrategies(riskFactors),
      insuranceRecommendations: this.generateInsuranceRecommendations(riskFactors),
      lastAssessment: new Date()
    };
  }

  private generateMitigationStrategies(riskFactors: RiskFactor[]): string[] {
    const strategies: string[] = [];
    
    for (const factor of riskFactors) {
      switch (factor.type) {
        case 'DEVICE_FAILURE':
          strategies.push('Install redundant IoT devices for critical monitoring points');
          strategies.push('Implement automated device health monitoring with alerts');
          break;
        case 'PERFORMANCE_DEGRADATION':
          strategies.push('Schedule immediate performance optimization review');
          strategies.push('Implement real-time performance monitoring dashboard');
          break;
      }
    }
    
    return Array.from(new Set(strategies)); // Remove duplicates
  }

  private generateInsuranceRecommendations(riskFactors: RiskFactor[]): string[] {
    const recommendations: string[] = [];
    
    if (riskFactors.some(r => r.type === 'DEVICE_FAILURE')) {
      recommendations.push('Equipment breakdown insurance for IoT devices');
    }
    
    if (riskFactors.some(r => r.riskScore > 40)) {
      recommendations.push('Comprehensive asset performance insurance');
    }
    
    return recommendations;
  }

  private calculateValueTrend(twin: DigitalTwinToken): number {
    // Simulate value trend calculation based on performance metrics
    const currentPerformance = twin.analytics.performanceIndex;
    const previousPerformance = 85; // Simulated historical average
    
    return ((currentPerformance - previousPerformance) / previousPerformance) * 100;
  }

  private startRealTimeMonitoring(tokenId: string): void {
    // Simulate real-time monitoring setup
    setInterval(async () => {
      await this.simulateSensorData(tokenId);
    }, 30000); // Every 30 seconds
  }

  private async simulateSensorData(tokenId: string): Promise<void> {
    const twin = this.twins.get(tokenId);
    if (!twin) return;

    for (const device of twin.iotDevices) {
      const reading = this.generateSimulatedReading(device);
      await this.addSensorReading(device.deviceId, reading);
    }
  }

  private generateSimulatedReading(device: IoTDevice): Omit<SensorReading, 'deviceId' | 'processed'> {
    let value: number;
    let unit: string;
    let anomaly = false;

    switch (device.type) {
      case 'TEMPERATURE':
        value = 20 + Math.random() * 10; // 20-30°C
        unit = '°C';
        anomaly = value > 35 || value < 5;
        break;
      case 'HUMIDITY':
        value = 40 + Math.random() * 20; // 40-60%
        unit = '%';
        anomaly = value > 80 || value < 20;
        break;
      case 'PRESSURE':
        value = 1000 + Math.random() * 50; // 1000-1050 hPa
        unit = 'hPa';
        anomaly = value > 1100 || value < 950;
        break;
      case 'VIBRATION':
        value = Math.random() * 10; // 0-10 mm/s
        unit = 'mm/s';
        anomaly = value > 15;
        break;
      case 'ENERGY':
        value = Math.random() * 1000; // 0-1000 kWh
        unit = 'kWh';
        anomaly = value > 1500;
        break;
      default:
        value = Math.random() * 100;
        unit = 'units';
        anomaly = Math.random() < 0.05; // 5% chance of anomaly
    }

    return {
      sensorType: device.type,
      value,
      unit,
      timestamp: new Date(),
      quality: 95 + Math.random() * 5, // 95-100% quality
      anomaly
    };
  }

  private async handleAnomalyDetection(tokenId: string, reading: SensorReading): Promise<void> {
    this.emit('anomalyDetected', { tokenId, deviceId: reading.deviceId, reading });
    
    // Auto-generate maintenance alert for critical anomalies
    if (reading.value > 100 || reading.quality < 80) {
      await this.schedulePredictiveMaintenance(tokenId, reading);
    }
  }

  private async schedulePredictiveMaintenance(tokenId: string, triggerReading: SensorReading): Promise<void> {
    const twin = this.twins.get(tokenId);
    if (!twin) return;

    const maintenanceRecord: MaintenanceRecord = {
      id: this.generateMaintenanceId(),
      type: 'PREDICTIVE',
      description: `Anomaly detected in ${triggerReading.sensorType} sensor - preventive maintenance scheduled`,
      cost: 500, // Estimated cost
      duration: 2, // 2 hours
      performer: 'AUTO_SCHEDULED',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      outcome: 'SCHEDULED'
    };

    twin.maintenance.push(maintenanceRecord);
    
    this.emit('maintenanceScheduled', { tokenId, maintenanceId: maintenanceRecord.id });
  }

  async getDigitalTwin(tokenId: string): Promise<DigitalTwinToken | null> {
    return this.twins.get(tokenId) || null;
  }

  async getTwinByAsset(assetId: string): Promise<DigitalTwinToken | null> {
    const tokenId = this.twinsByAsset.get(assetId);
    return tokenId ? this.twins.get(tokenId) || null : null;
  }

  async getRealtimeData(tokenId: string, hours: number = 24): Promise<SensorReading[]> {
    const twin = this.twins.get(tokenId);
    if (!twin) return [];

    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return twin.sensorData.filter(s => s.timestamp > cutoffTime);
  }

  async getTwinAnalytics(tokenId: string): Promise<TwinAnalytics | null> {
    const twin = this.twins.get(tokenId);
    return twin ? twin.analytics : null;
  }

  async generateTwinReport(tokenId: string): Promise<{
    summary: any;
    performance: PerformanceMetrics;
    insights: PredictiveInsight[];
    recommendations: OptimizationSuggestion[];
    risks: RiskAssessment;
  } | null> {
    const twin = this.twins.get(tokenId);
    if (!twin) return null;

    return {
      summary: {
        tokenId,
        assetId: twin.assetId,
        healthScore: twin.analytics.healthScore,
        activeDevices: twin.iotDevices.filter(d => d.status === 'ACTIVE').length,
        totalDevices: twin.iotDevices.length,
        lastSync: twin.lastSync
      },
      performance: twin.performance,
      insights: twin.analytics.predictiveInsights,
      recommendations: twin.analytics.optimizationSuggestions,
      risks: twin.analytics.riskAssessment
    };
  }

  private async generateTwinId(asset: Asset): Promise<string> {
    const timestamp = Date.now();
    const hash = await this.cryptoManager.hashData(asset.id);
    return `TWIN-${timestamp}-${hash.substring(0, 8)}`;
  }

  private generateMaintenanceId(): string {
    return `MAINT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
}
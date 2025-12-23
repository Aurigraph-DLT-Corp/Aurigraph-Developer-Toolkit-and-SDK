import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { IoTGateway } from './IoTGateway';
import { AIEngine } from '../ai/AIEngine';
import { OracleConnector } from './OracleConnector';
import { AlertSystem } from './AlertSystem';
import { 
  DigitalTwin, 
  RegisteredAsset, 
  IoTConnection, 
  SensorReading,
  AssetCategory,
  TimeSeriesData
} from './types';

export class DigitalTwinManager extends EventEmitter {
  private logger: Logger;
  private twins: Map<string, DigitalTwin> = new Map();
  private iotGateway: IoTGateway;
  private aiEngine: AIEngine;
  private oracleConnector: OracleConnector;
  private updateInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.logger = new Logger('DigitalTwinManager');
    this.iotGateway = new IoTGateway();
    this.aiEngine = new AIEngine();
    this.oracleConnector = new OracleConnector();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Digital Twin Manager...');
    
    await this.iotGateway.initialize();
    await this.aiEngine.initialize();
    await this.oracleConnector.initialize();
    
    this.startUpdateLoop();
    
    this.logger.info('Digital Twin Manager initialized');
  }

  async createDigitalTwin(asset: RegisteredAsset): Promise<DigitalTwin> {
    this.logger.info(`Creating digital twin for asset: ${asset.assetId}`);
    
    const twinId = this.generateTwinId(asset);
    
    const digitalTwin: DigitalTwin = {
      twinId: twinId,
      assetId: asset.assetId,
      assetCategory: asset.category,
      realTimeState: new Map(),
      historicalData: [],
      predictiveModels: await this.deployAIModels(asset.category),
      iotConnections: await this.setupIoTConnections(asset),
      alertSystem: new AlertSystem(this.getAlertThresholds(asset.category)),
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        syncFrequency: 5000,
        dataRetentionDays: 365
      }
    };
    
    await this.initializeDataStreams(digitalTwin, asset);
    await this.startMonitoring(digitalTwin);
    
    this.twins.set(twinId, digitalTwin);
    
    this.emit('digital-twin-created', {
      twinId: twinId,
      assetId: asset.assetId
    });
    
    return digitalTwin;
  }

  private async setupIoTConnections(asset: RegisteredAsset): Promise<IoTConnection[]> {
    const connections: IoTConnection[] = [];
    
    switch (asset.category) {
      case AssetCategory.REAL_ESTATE:
        connections.push(
          {
            connectionId: this.generateConnectionId(),
            sensorType: 'temperature',
            sensorId: `TEMP_${asset.assetId}`,
            protocol: 'MQTT',
            endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
            topic: `sensors/${asset.assetId}/temperature`,
            active: true
          },
          {
            connectionId: this.generateConnectionId(),
            sensorType: 'occupancy',
            sensorId: `OCC_${asset.assetId}`,
            protocol: 'MQTT',
            endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
            topic: `sensors/${asset.assetId}/occupancy`,
            active: true
          },
          {
            connectionId: this.generateConnectionId(),
            sensorType: 'energy',
            sensorId: `ENERGY_${asset.assetId}`,
            protocol: 'MQTT',
            endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
            topic: `sensors/${asset.assetId}/energy`,
            active: true
          },
          {
            connectionId: this.generateConnectionId(),
            sensorType: 'security',
            sensorId: `SEC_${asset.assetId}`,
            protocol: 'WebSocket',
            endpoint: 'wss://security.aurigraph.io',
            topic: `security/${asset.assetId}`,
            active: true
          }
        );
        break;
        
      case AssetCategory.CARBON_CREDIT:
        connections.push(
          {
            connectionId: this.generateConnectionId(),
            sensorType: 'co2_levels',
            sensorId: `CO2_${asset.assetId}`,
            protocol: 'MQTT',
            endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
            topic: `environment/${asset.assetId}/co2`,
            active: true
          },
          {
            connectionId: this.generateConnectionId(),
            sensorType: 'vegetation',
            sensorId: `VEG_${asset.assetId}`,
            protocol: 'HTTP',
            endpoint: 'https://satellite.aurigraph.io/api',
            topic: `vegetation/${asset.assetId}`,
            active: true
          }
        );
        break;
        
      case AssetCategory.COMMODITY:
        connections.push(
          {
            connectionId: this.generateConnectionId(),
            sensorType: 'weight',
            sensorId: `WEIGHT_${asset.assetId}`,
            protocol: 'MQTT',
            endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
            topic: `warehouse/${asset.assetId}/weight`,
            active: true
          },
          {
            connectionId: this.generateConnectionId(),
            sensorType: 'location',
            sensorId: `GPS_${asset.assetId}`,
            protocol: 'MQTT',
            endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
            topic: `tracking/${asset.assetId}/location`,
            active: true
          }
        );
        break;
    }
    
    return connections;
  }

  private async deployAIModels(category: AssetCategory): Promise<any[]> {
    const models = await this.aiEngine.getModelsForCategory(category);
    const deployedModels = [];
    
    for (const model of models) {
      const deployed = await this.aiEngine.deployModel(model);
      deployedModels.push(deployed);
    }
    
    return deployedModels;
  }

  private async initializeDataStreams(twin: DigitalTwin, asset: RegisteredAsset): Promise<void> {
    for (const connection of twin.iotConnections) {
      await this.iotGateway.establishConnection(connection);
      
      this.iotGateway.on(`data:${connection.connectionId}`, (data: SensorReading) => {
        this.processSensorData(twin, data);
      });
    }
    
    const oracleFeeds = await this.oracleConnector.getAvailableFeeds(asset.category);
    for (const feed of oracleFeeds) {
      await this.oracleConnector.subscribe(feed, (data) => {
        this.processOracleData(twin, data);
      });
    }
  }

  private async startMonitoring(twin: DigitalTwin): Promise<void> {
    this.logger.info(`Starting monitoring for digital twin: ${twin.twinId}`);
    
    for (const connection of twin.iotConnections) {
      if (connection.active) {
        await this.iotGateway.startDataCollection(connection.connectionId);
      }
    }
  }

  async updateDigitalTwin(twinId: string, sensorData: SensorReading[]): Promise<void> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Digital twin ${twinId} not found`);
    }
    
    for (const reading of sensorData) {
      twin.realTimeState.set(reading.sensorType, reading.value);
      
      twin.historicalData.push({
        timestamp: reading.timestamp,
        sensorType: reading.sensorType,
        value: reading.value,
        metadata: reading.metadata
      });
      
      if (twin.historicalData.length > 10000) {
        twin.historicalData.shift();
      }
    }
    
    const predictions = await this.aiEngine.generatePredictions(
      twin.predictiveModels,
      twin.historicalData
    );
    
    await this.checkAlerts(twin, sensorData, predictions);
    
    await this.updateBlockchainState(twin);
    
    twin.metadata.lastUpdated = new Date();
    
    this.emit('digital-twin-updated', {
      twinId: twinId,
      updates: sensorData.length
    });
  }

  private processSensorData(twin: DigitalTwin, reading: SensorReading): void {
    twin.realTimeState.set(reading.sensorType, reading.value);
    
    const timeSeriesData: TimeSeriesData = {
      timestamp: reading.timestamp,
      sensorType: reading.sensorType,
      value: reading.value,
      metadata: reading.metadata
    };
    
    twin.historicalData.push(timeSeriesData);
    
    if (twin.historicalData.length > 10000) {
      twin.historicalData.shift();
    }
    
    this.checkThresholds(twin, reading);
  }

  private processOracleData(twin: DigitalTwin, data: any): void {
    twin.realTimeState.set(data.feedType, data.value);
    
    this.emit('oracle-data-received', {
      twinId: twin.twinId,
      data: data
    });
  }

  private async checkAlerts(twin: DigitalTwin, sensorData: SensorReading[], predictions: any): Promise<void> {
    const alerts = await twin.alertSystem.checkAlerts(sensorData, predictions);
    
    for (const alert of alerts) {
      this.emit('alert', {
        twinId: twin.twinId,
        assetId: twin.assetId,
        alert: alert
      });
    }
  }

  private checkThresholds(twin: DigitalTwin, reading: SensorReading): void {
    const thresholds = twin.alertSystem.getThresholds(reading.sensorType);
    
    if (thresholds) {
      if (reading.value > thresholds.max || reading.value < thresholds.min) {
        this.emit('threshold-exceeded', {
          twinId: twin.twinId,
          sensorType: reading.sensorType,
          value: reading.value,
          thresholds: thresholds
        });
      }
    }
  }

  private async updateBlockchainState(twin: DigitalTwin): Promise<void> {
    const stateUpdate = {
      twinId: twin.twinId,
      timestamp: Date.now(),
      state: Object.fromEntries(twin.realTimeState),
      hash: this.calculateStateHash(twin.realTimeState)
    };
    
    this.emit('blockchain-update', stateUpdate);
  }

  private calculateStateHash(state: Map<string, any>): string {
    const stateString = JSON.stringify(Object.fromEntries(state));
    return require('crypto').createHash('sha256').update(stateString).digest('hex');
  }

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(async () => {
      for (const [twinId, twin] of this.twins) {
        try {
          await this.syncDigitalTwin(twin);
        } catch (error) {
          this.logger.error(`Failed to sync digital twin ${twinId}:`, error);
        }
      }
    }, 5000);
  }

  private async syncDigitalTwin(twin: DigitalTwin): Promise<void> {
    const latestData = await this.iotGateway.getLatestData(twin.iotConnections);
    
    if (latestData.length > 0) {
      await this.updateDigitalTwin(twin.twinId, latestData);
    }
  }

  async getDigitalTwin(twinId: string): Promise<DigitalTwin | undefined> {
    return this.twins.get(twinId);
  }

  async getDigitalTwinByAssetId(assetId: string): Promise<DigitalTwin | undefined> {
    for (const twin of this.twins.values()) {
      if (twin.assetId === assetId) {
        return twin;
      }
    }
    return undefined;
  }

  async updateDigitalTwinState(twinId: string, stateUpdate: any): Promise<void> {
    const twin = this.twins.get(twinId);
    if (!twin) {
      throw new Error(`Digital twin ${twinId} not found`);
    }
    
    for (const [key, value] of Object.entries(stateUpdate)) {
      twin.realTimeState.set(key, value);
    }
    
    twin.metadata.lastUpdated = new Date();
  }

  private generateTwinId(asset: RegisteredAsset): string {
    return `DT-${asset.assetId}-${Date.now()}`;
  }

  private generateConnectionId(): string {
    return `CONN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private getAlertThresholds(category: AssetCategory): any {
    switch (category) {
      case AssetCategory.REAL_ESTATE:
        return {
          temperature: { min: 10, max: 35 },
          humidity: { min: 30, max: 70 },
          energy: { max: 1000 }
        };
      case AssetCategory.CARBON_CREDIT:
        return {
          co2_levels: { min: 200, max: 1000 },
          vegetation_health: { min: 0.6, max: 1.0 }
        };
      case AssetCategory.COMMODITY:
        return {
          temperature: { min: -20, max: 40 },
          humidity: { min: 20, max: 80 }
        };
      default:
        return {};
    }
  }

  async stop(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    await this.iotGateway.stop();
    await this.aiEngine.stop();
    await this.oracleConnector.stop();
  }
}
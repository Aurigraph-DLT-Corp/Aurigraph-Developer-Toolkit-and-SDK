"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigitalTwinManager = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
const IoTGateway_1 = require("./IoTGateway");
const AIEngine_1 = require("../ai/AIEngine");
const OracleConnector_1 = require("./OracleConnector");
const AlertSystem_1 = require("./AlertSystem");
const types_1 = require("./types");
class DigitalTwinManager extends events_1.EventEmitter {
    logger;
    twins = new Map();
    iotGateway;
    aiEngine;
    oracleConnector;
    updateInterval;
    constructor() {
        super();
        this.logger = new Logger_1.Logger('DigitalTwinManager');
        this.iotGateway = new IoTGateway_1.IoTGateway();
        this.aiEngine = new AIEngine_1.AIEngine();
        this.oracleConnector = new OracleConnector_1.OracleConnector();
    }
    async initialize() {
        this.logger.info('Initializing Digital Twin Manager...');
        await this.iotGateway.initialize();
        await this.aiEngine.initialize();
        await this.oracleConnector.initialize();
        this.startUpdateLoop();
        this.logger.info('Digital Twin Manager initialized');
    }
    async createDigitalTwin(asset) {
        this.logger.info(`Creating digital twin for asset: ${asset.assetId}`);
        const twinId = this.generateTwinId(asset);
        const digitalTwin = {
            twinId: twinId,
            assetId: asset.assetId,
            assetCategory: asset.category,
            realTimeState: new Map(),
            historicalData: [],
            predictiveModels: await this.deployAIModels(asset.category),
            iotConnections: await this.setupIoTConnections(asset),
            alertSystem: new AlertSystem_1.AlertSystem(this.getAlertThresholds(asset.category)),
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
    async setupIoTConnections(asset) {
        const connections = [];
        switch (asset.category) {
            case types_1.AssetCategory.REAL_ESTATE:
                connections.push({
                    connectionId: this.generateConnectionId(),
                    sensorType: 'temperature',
                    sensorId: `TEMP_${asset.assetId}`,
                    protocol: 'MQTT',
                    endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
                    topic: `sensors/${asset.assetId}/temperature`,
                    active: true
                }, {
                    connectionId: this.generateConnectionId(),
                    sensorType: 'occupancy',
                    sensorId: `OCC_${asset.assetId}`,
                    protocol: 'MQTT',
                    endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
                    topic: `sensors/${asset.assetId}/occupancy`,
                    active: true
                }, {
                    connectionId: this.generateConnectionId(),
                    sensorType: 'energy',
                    sensorId: `ENERGY_${asset.assetId}`,
                    protocol: 'MQTT',
                    endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
                    topic: `sensors/${asset.assetId}/energy`,
                    active: true
                }, {
                    connectionId: this.generateConnectionId(),
                    sensorType: 'security',
                    sensorId: `SEC_${asset.assetId}`,
                    protocol: 'WebSocket',
                    endpoint: 'wss://security.aurigraph.io',
                    topic: `security/${asset.assetId}`,
                    active: true
                });
                break;
            case types_1.AssetCategory.CARBON_CREDIT:
                connections.push({
                    connectionId: this.generateConnectionId(),
                    sensorType: 'co2_levels',
                    sensorId: `CO2_${asset.assetId}`,
                    protocol: 'MQTT',
                    endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
                    topic: `environment/${asset.assetId}/co2`,
                    active: true
                }, {
                    connectionId: this.generateConnectionId(),
                    sensorType: 'vegetation',
                    sensorId: `VEG_${asset.assetId}`,
                    protocol: 'HTTP',
                    endpoint: 'https://satellite.aurigraph.io/api',
                    topic: `vegetation/${asset.assetId}`,
                    active: true
                });
                break;
            case types_1.AssetCategory.COMMODITY:
                connections.push({
                    connectionId: this.generateConnectionId(),
                    sensorType: 'weight',
                    sensorId: `WEIGHT_${asset.assetId}`,
                    protocol: 'MQTT',
                    endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
                    topic: `warehouse/${asset.assetId}/weight`,
                    active: true
                }, {
                    connectionId: this.generateConnectionId(),
                    sensorType: 'location',
                    sensorId: `GPS_${asset.assetId}`,
                    protocol: 'MQTT',
                    endpoint: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
                    topic: `tracking/${asset.assetId}/location`,
                    active: true
                });
                break;
        }
        return connections;
    }
    async deployAIModels(category) {
        const models = await this.aiEngine.getModelsForCategory(category);
        const deployedModels = [];
        for (const model of models) {
            const deployed = await this.aiEngine.deployModel(model);
            deployedModels.push(deployed);
        }
        return deployedModels;
    }
    async initializeDataStreams(twin, asset) {
        for (const connection of twin.iotConnections) {
            await this.iotGateway.establishConnection(connection);
            this.iotGateway.on(`data:${connection.connectionId}`, (data) => {
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
    async startMonitoring(twin) {
        this.logger.info(`Starting monitoring for digital twin: ${twin.twinId}`);
        for (const connection of twin.iotConnections) {
            if (connection.active) {
                await this.iotGateway.startDataCollection(connection.connectionId);
            }
        }
    }
    async updateDigitalTwin(twinId, sensorData) {
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
        const predictions = await this.aiEngine.generatePredictions(twin.predictiveModels, twin.historicalData);
        await this.checkAlerts(twin, sensorData, predictions);
        await this.updateBlockchainState(twin);
        twin.metadata.lastUpdated = new Date();
        this.emit('digital-twin-updated', {
            twinId: twinId,
            updates: sensorData.length
        });
    }
    processSensorData(twin, reading) {
        twin.realTimeState.set(reading.sensorType, reading.value);
        const timeSeriesData = {
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
    processOracleData(twin, data) {
        twin.realTimeState.set(data.feedType, data.value);
        this.emit('oracle-data-received', {
            twinId: twin.twinId,
            data: data
        });
    }
    async checkAlerts(twin, sensorData, predictions) {
        const alerts = await twin.alertSystem.checkAlerts(sensorData, predictions);
        for (const alert of alerts) {
            this.emit('alert', {
                twinId: twin.twinId,
                assetId: twin.assetId,
                alert: alert
            });
        }
    }
    checkThresholds(twin, reading) {
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
    async updateBlockchainState(twin) {
        const stateUpdate = {
            twinId: twin.twinId,
            timestamp: Date.now(),
            state: Object.fromEntries(twin.realTimeState),
            hash: this.calculateStateHash(twin.realTimeState)
        };
        this.emit('blockchain-update', stateUpdate);
    }
    calculateStateHash(state) {
        const stateString = JSON.stringify(Object.fromEntries(state));
        return require('crypto').createHash('sha256').update(stateString).digest('hex');
    }
    startUpdateLoop() {
        this.updateInterval = setInterval(async () => {
            for (const [twinId, twin] of this.twins) {
                try {
                    await this.syncDigitalTwin(twin);
                }
                catch (error) {
                    this.logger.error(`Failed to sync digital twin ${twinId}:`, error);
                }
            }
        }, 5000);
    }
    async syncDigitalTwin(twin) {
        const latestData = await this.iotGateway.getLatestData(twin.iotConnections);
        if (latestData.length > 0) {
            await this.updateDigitalTwin(twin.twinId, latestData);
        }
    }
    async getDigitalTwin(twinId) {
        return this.twins.get(twinId);
    }
    async getDigitalTwinByAssetId(assetId) {
        for (const twin of this.twins.values()) {
            if (twin.assetId === assetId) {
                return twin;
            }
        }
        return undefined;
    }
    async updateDigitalTwinState(twinId, stateUpdate) {
        const twin = this.twins.get(twinId);
        if (!twin) {
            throw new Error(`Digital twin ${twinId} not found`);
        }
        for (const [key, value] of Object.entries(stateUpdate)) {
            twin.realTimeState.set(key, value);
        }
        twin.metadata.lastUpdated = new Date();
    }
    generateTwinId(asset) {
        return `DT-${asset.assetId}-${Date.now()}`;
    }
    generateConnectionId() {
        return `CONN-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    getAlertThresholds(category) {
        switch (category) {
            case types_1.AssetCategory.REAL_ESTATE:
                return {
                    temperature: { min: 10, max: 35 },
                    humidity: { min: 30, max: 70 },
                    energy: { max: 1000 }
                };
            case types_1.AssetCategory.CARBON_CREDIT:
                return {
                    co2_levels: { min: 200, max: 1000 },
                    vegetation_health: { min: 0.6, max: 1.0 }
                };
            case types_1.AssetCategory.COMMODITY:
                return {
                    temperature: { min: -20, max: 40 },
                    humidity: { min: 20, max: 80 }
                };
            default:
                return {};
        }
    }
    async stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        await this.iotGateway.stop();
        await this.aiEngine.stop();
        await this.oracleConnector.stop();
    }
}
exports.DigitalTwinManager = DigitalTwinManager;
//# sourceMappingURL=DigitalTwinManager.js.map
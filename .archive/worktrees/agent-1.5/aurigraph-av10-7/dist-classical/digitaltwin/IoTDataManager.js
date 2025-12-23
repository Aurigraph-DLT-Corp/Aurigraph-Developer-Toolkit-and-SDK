"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IoTDataManager = void 0;
const events_1 = require("events");
const ws_1 = require("ws");
const mqtt = __importStar(require("mqtt"));
class IoTDataManager extends events_1.EventEmitter {
    config;
    devices = new Map();
    dataStreams = new Map();
    gateways = new Map();
    mqttClient = null;
    wsConnections = new Map();
    messageBuffer = [];
    processingQueue = [];
    isProcessing = false;
    metrics;
    constructor(config) {
        super();
        this.config = config;
        this.metrics = {
            messagesReceived: 0,
            messagesProcessed: 0,
            devicesConnected: 0,
            averageLatency: 0,
            dataRate: 0,
            errorCount: 0
        };
        this.initializeMQTT();
        this.startDataProcessing();
        this.startMetricsCollection();
        console.log('🌐 IoT Data Manager initialized');
    }
    initializeMQTT() {
        if (!this.config.mqtt.brokerUrl)
            return;
        try {
            this.mqttClient = mqtt.connect(this.config.mqtt.brokerUrl, {
                clientId: this.config.mqtt.clientId,
                username: this.config.mqtt.username,
                password: this.config.mqtt.password,
                keepalive: this.config.mqtt.keepAlive,
                clean: true,
                reconnectPeriod: 5000
            });
            this.mqttClient.on('connect', () => {
                console.log('📡 MQTT connected to broker');
                this.config.mqtt.topics.forEach(topic => {
                    this.mqttClient?.subscribe(topic, { qos: 1 });
                    console.log(`📋 Subscribed to MQTT topic: ${topic}`);
                });
            });
            this.mqttClient.on('message', (topic, payload) => {
                this.handleMQTTMessage(topic, payload);
            });
            this.mqttClient.on('error', (error) => {
                console.error('❌ MQTT error:', error);
                this.metrics.errorCount++;
                this.emit('mqtt_error', error);
            });
            this.mqttClient.on('disconnect', () => {
                console.log('📡 MQTT disconnected');
                this.emit('mqtt_disconnected');
            });
        }
        catch (error) {
            console.error('❌ Failed to initialize MQTT:', error);
            this.emit('initialization_error', error);
        }
    }
    handleMQTTMessage(topic, payload) {
        try {
            const message = JSON.parse(payload.toString());
            message.timestamp = message.timestamp || Date.now();
            this.metrics.messagesReceived++;
            this.messageBuffer.push(message);
            this.emit('message_received', { topic, message });
            // Update device last seen
            if (this.devices.has(message.deviceId)) {
                const device = this.devices.get(message.deviceId);
                device.lastSeen = Date.now();
                device.status = 'online';
            }
        }
        catch (error) {
            console.error('❌ Error parsing MQTT message:', error);
            this.metrics.errorCount++;
            this.emit('message_parse_error', { topic, error });
        }
    }
    async registerDevice(device) {
        this.devices.set(device.deviceId, device);
        this.metrics.devicesConnected++;
        console.log(`🔌 Device registered: ${device.deviceId} (${device.type})`);
        this.emit('device_registered', device);
        // Subscribe to device-specific MQTT topics
        if (this.mqttClient && device.protocol === 'mqtt') {
            const deviceTopic = `devices/${device.deviceId}/+`;
            this.mqttClient.subscribe(deviceTopic, { qos: 1 });
        }
    }
    async unregisterDevice(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device)
            return false;
        this.devices.delete(deviceId);
        this.metrics.devicesConnected--;
        // Remove device from gateways
        this.gateways.forEach(gateway => {
            const index = gateway.connectedDevices.indexOf(deviceId);
            if (index > -1) {
                gateway.connectedDevices.splice(index, 1);
            }
        });
        console.log(`🔌 Device unregistered: ${deviceId}`);
        this.emit('device_unregistered', device);
        return true;
    }
    async createDataStream(stream) {
        this.dataStreams.set(stream.streamId, stream);
        console.log(`📊 Data stream created: ${stream.streamId} for device ${stream.deviceId}`);
        this.emit('stream_created', stream);
    }
    async registerGateway(gateway) {
        this.gateways.set(gateway.gatewayId, gateway);
        console.log(`🌉 Gateway registered: ${gateway.name} (${gateway.gatewayId})`);
        this.emit('gateway_registered', gateway);
    }
    async sendCommand(deviceId, command, parameters) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error(`Device not found: ${deviceId}`);
        }
        const message = {
            deviceId,
            timestamp: Date.now(),
            messageType: 'command',
            payload: {
                command,
                parameters: parameters || {}
            }
        };
        switch (device.protocol) {
            case 'mqtt':
                return this.sendMQTTCommand(deviceId, message);
            case 'websocket':
                return this.sendWebSocketCommand(deviceId, message);
            case 'http':
                return this.sendHTTPCommand(deviceId, message);
            default:
                throw new Error(`Unsupported protocol: ${device.protocol}`);
        }
    }
    async sendMQTTCommand(deviceId, message) {
        if (!this.mqttClient) {
            throw new Error('MQTT client not initialized');
        }
        const topic = `devices/${deviceId}/commands`;
        const payload = JSON.stringify(message);
        return new Promise((resolve, reject) => {
            this.mqttClient.publish(topic, payload, { qos: 1 }, (error) => {
                if (error) {
                    console.error(`❌ MQTT command send error:`, error);
                    this.metrics.errorCount++;
                    reject(error);
                }
                else {
                    console.log(`📤 MQTT command sent to ${deviceId}: ${message.payload.command}`);
                    this.emit('command_sent', { deviceId, message });
                    resolve(true);
                }
            });
        });
    }
    async sendWebSocketCommand(deviceId, message) {
        const ws = this.wsConnections.get(deviceId);
        if (!ws || ws.readyState !== ws_1.WebSocket.OPEN) {
            throw new Error(`WebSocket connection not available for device: ${deviceId}`);
        }
        try {
            ws.send(JSON.stringify(message));
            console.log(`📤 WebSocket command sent to ${deviceId}: ${message.payload.command}`);
            this.emit('command_sent', { deviceId, message });
            return true;
        }
        catch (error) {
            console.error(`❌ WebSocket command send error:`, error);
            this.metrics.errorCount++;
            throw error;
        }
    }
    async sendHTTPCommand(deviceId, message) {
        const device = this.devices.get(deviceId);
        if (!device)
            return false;
        // This would typically use fetch or axios to send HTTP request
        // For now, just emit the command
        console.log(`📤 HTTP command would be sent to ${deviceId}: ${message.payload.command}`);
        this.emit('command_sent', { deviceId, message });
        return true;
    }
    startDataProcessing() {
        setInterval(() => {
            if (this.isProcessing || this.messageBuffer.length === 0)
                return;
            this.isProcessing = true;
            const batch = this.messageBuffer.splice(0, this.config.dataProcessing.batchSize);
            this.processBatch(batch).then(() => {
                this.isProcessing = false;
            }).catch((error) => {
                console.error('❌ Batch processing error:', error);
                this.metrics.errorCount++;
                this.isProcessing = false;
            });
        }, this.config.dataProcessing.processingInterval);
    }
    async processBatch(messages) {
        const startTime = Date.now();
        for (const message of messages) {
            await this.processMessage(message);
            this.metrics.messagesProcessed++;
        }
        const processingTime = Date.now() - startTime;
        this.metrics.averageLatency = (this.metrics.averageLatency + processingTime) / 2;
        this.emit('batch_processed', {
            messageCount: messages.length,
            processingTime,
            averageLatency: this.metrics.averageLatency
        });
    }
    async processMessage(message) {
        const device = this.devices.get(message.deviceId);
        if (!device) {
            console.warn(`⚠️  Message from unknown device: ${message.deviceId}`);
            return;
        }
        // Update device status based on message
        device.lastSeen = Date.now();
        if (device.status === 'offline') {
            device.status = 'online';
            this.emit('device_online', device);
        }
        // Process different message types
        switch (message.messageType) {
            case 'data':
                await this.processDataMessage(message, device);
                break;
            case 'status':
                await this.processStatusMessage(message, device);
                break;
            case 'alert':
                await this.processAlertMessage(message, device);
                break;
            case 'response':
                await this.processResponseMessage(message, device);
                break;
            default:
                console.warn(`⚠️  Unknown message type: ${message.messageType}`);
        }
        this.emit('message_processed', { message, device });
    }
    async processDataMessage(message, device) {
        // Convert IoT message to DigitalTwin IoTDataPoint format
        const dataPoint = {
            deviceId: message.deviceId,
            timestamp: message.timestamp,
            sensorType: this.inferSensorType(message.payload),
            value: this.extractValue(message.payload),
            unit: this.extractUnit(message.payload),
            assetId: device.metadata.location ? this.getAssetIdFromLocation(device.metadata.location) : 'unknown',
            location: device.metadata.location,
            metadata: message.metadata
        };
        this.emit('iot_data_point', dataPoint);
    }
    async processStatusMessage(message, device) {
        if (message.payload.batteryLevel !== undefined) {
            device.metadata.batteryLevel = message.payload.batteryLevel;
        }
        if (message.payload.signalStrength !== undefined) {
            device.metadata.signalStrength = message.payload.signalStrength;
        }
        if (message.payload.status) {
            device.status = message.payload.status;
        }
        this.emit('device_status_updated', { device, status: message.payload });
    }
    async processAlertMessage(message, device) {
        const alert = {
            deviceId: message.deviceId,
            timestamp: message.timestamp,
            severity: message.payload.severity || 'medium',
            type: message.payload.type || 'device_alert',
            description: message.payload.description || 'Device alert',
            resolved: false
        };
        this.emit('device_alert', { device, alert });
    }
    async processResponseMessage(message, device) {
        this.emit('command_response', {
            device,
            commandId: message.payload.commandId,
            response: message.payload.response,
            success: message.payload.success
        });
    }
    inferSensorType(payload) {
        if (payload.temperature !== undefined)
            return 'temperature';
        if (payload.humidity !== undefined)
            return 'humidity';
        if (payload.pressure !== undefined)
            return 'pressure';
        if (payload.vibration !== undefined)
            return 'vibration';
        if (payload.energy !== undefined || payload.power !== undefined)
            return 'energy';
        if (payload.latitude !== undefined && payload.longitude !== undefined)
            return 'gps';
        if (payload.motion !== undefined || payload.presence !== undefined)
            return 'security';
        if (payload.co2 !== undefined || payload.airQuality !== undefined)
            return 'air_quality';
        return 'unknown';
    }
    extractValue(payload) {
        const keys = ['value', 'temperature', 'humidity', 'pressure', 'vibration', 'energy', 'power'];
        for (const key of keys) {
            if (payload[key] !== undefined && typeof payload[key] === 'number') {
                return payload[key];
            }
        }
        return 0;
    }
    extractUnit(payload) {
        if (payload.unit)
            return payload.unit;
        if (payload.temperature !== undefined)
            return '°C';
        if (payload.humidity !== undefined)
            return '%';
        if (payload.pressure !== undefined)
            return 'hPa';
        if (payload.vibration !== undefined)
            return 'g';
        if (payload.energy !== undefined)
            return 'kWh';
        if (payload.power !== undefined)
            return 'W';
        return '';
    }
    getAssetIdFromLocation(location) {
        // This would typically map locations to assets using a spatial index
        // For now, return a placeholder
        return `asset_${Math.floor(location.latitude * 1000)}_${Math.floor(location.longitude * 1000)}`;
    }
    startMetricsCollection() {
        setInterval(() => {
            this.updateMetrics();
            this.emit('metrics_updated', this.metrics);
        }, 5000);
    }
    updateMetrics() {
        this.metrics.devicesConnected = this.devices.size;
        this.metrics.dataRate = this.metrics.messagesReceived / ((Date.now() - this.startTime) / 1000);
    }
    startTime = Date.now();
    async performDeviceDiscovery() {
        // This would implement actual device discovery protocols
        // For now, return mock discovered devices
        const discoveredDevices = [];
        this.emit('device_discovery_started');
        // Simulate discovery delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.emit('device_discovery_completed', discoveredDevices);
        return discoveredDevices;
    }
    async updateDeviceConfiguration(deviceId, configuration) {
        const device = this.devices.get(deviceId);
        if (!device)
            return false;
        device.configuration = { ...device.configuration, ...configuration };
        // Send configuration update command
        await this.sendCommand(deviceId, 'update_config', configuration);
        this.emit('device_configuration_updated', { device, configuration });
        return true;
    }
    getDeviceMetrics(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device)
            return null;
        return {
            deviceId,
            status: device.status,
            lastSeen: device.lastSeen,
            batteryLevel: device.metadata.batteryLevel,
            signalStrength: device.metadata.signalStrength,
            uptime: Date.now() - device.lastSeen,
            messageCount: this.messageBuffer.filter(m => m.deviceId === deviceId).length
        };
    }
    getSystemMetrics() {
        return {
            ...this.metrics,
            uptime: Date.now() - this.startTime,
            bufferedMessages: this.messageBuffer.length,
            queuedMessages: this.processingQueue.length,
            connectedDevices: this.devices.size,
            activeGateways: Array.from(this.gateways.values()).filter(g => g.status === 'active').length
        };
    }
    async shutdown() {
        console.log('🔄 Shutting down IoT Data Manager...');
        if (this.mqttClient) {
            this.mqttClient.end(true);
        }
        this.wsConnections.forEach(ws => {
            ws.close(1000, 'Manager shutting down');
        });
        this.removeAllListeners();
        console.log('✅ IoT Data Manager shutdown complete');
    }
}
exports.IoTDataManager = IoTDataManager;
exports.default = IoTDataManager;
//# sourceMappingURL=IoTDataManager.js.map
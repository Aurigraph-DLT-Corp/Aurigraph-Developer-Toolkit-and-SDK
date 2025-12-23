import { EventEmitter } from 'events';
export interface IoTDevice {
    deviceId: string;
    type: 'sensor' | 'actuator' | 'gateway' | 'controller';
    protocol: 'mqtt' | 'websocket' | 'http' | 'coap' | 'lorawan';
    status: 'online' | 'offline' | 'error' | 'maintenance';
    lastSeen: number;
    metadata: {
        manufacturer: string;
        model: string;
        firmwareVersion: string;
        batteryLevel?: number;
        signalStrength?: number;
        location?: {
            latitude: number;
            longitude: number;
            altitude?: number;
        };
    };
    capabilities: IoTCapability[];
    configuration: Record<string, any>;
}
export interface IoTCapability {
    name: string;
    type: 'read' | 'write' | 'subscribe';
    dataType: 'number' | 'string' | 'boolean' | 'object';
    unit?: string;
    range?: {
        min: number;
        max: number;
    };
    accuracy?: number;
    resolution?: number;
}
export interface IoTMessage {
    deviceId: string;
    timestamp: number;
    messageType: 'data' | 'status' | 'alert' | 'command' | 'response';
    payload: any;
    metadata?: Record<string, any>;
}
export interface DataStream {
    streamId: string;
    deviceId: string;
    sensorType: string;
    frequency: number;
    bufferSize: number;
    compression: boolean;
    encryption: boolean;
    quality: 'raw' | 'filtered' | 'processed';
}
export interface IoTGateway {
    gatewayId: string;
    name: string;
    location: string;
    connectedDevices: string[];
    protocols: string[];
    status: 'active' | 'inactive' | 'error';
    throughput: number;
    latency: number;
}
export interface IoTDataManagerConfig {
    mqtt: {
        brokerUrl: string;
        username?: string;
        password?: string;
        clientId: string;
        keepAlive: number;
        topics: string[];
    };
    websocket: {
        port: number;
        maxConnections: number;
    };
    http: {
        port: number;
        endpoints: string[];
    };
    dataProcessing: {
        batchSize: number;
        processingInterval: number;
        retentionPeriod: number;
        compressionEnabled: boolean;
    };
    security: {
        encryptionEnabled: boolean;
        authenticationRequired: boolean;
        certificatePath?: string;
    };
}
export declare class IoTDataManager extends EventEmitter {
    private config;
    private devices;
    private dataStreams;
    private gateways;
    private mqttClient;
    private wsConnections;
    private messageBuffer;
    private processingQueue;
    private isProcessing;
    private metrics;
    constructor(config: IoTDataManagerConfig);
    private initializeMQTT;
    private handleMQTTMessage;
    registerDevice(device: IoTDevice): Promise<void>;
    unregisterDevice(deviceId: string): Promise<boolean>;
    createDataStream(stream: DataStream): Promise<void>;
    registerGateway(gateway: IoTGateway): Promise<void>;
    sendCommand(deviceId: string, command: string, parameters?: Record<string, any>): Promise<boolean>;
    private sendMQTTCommand;
    private sendWebSocketCommand;
    private sendHTTPCommand;
    private startDataProcessing;
    private processBatch;
    private processMessage;
    private processDataMessage;
    private processStatusMessage;
    private processAlertMessage;
    private processResponseMessage;
    private inferSensorType;
    private extractValue;
    private extractUnit;
    private getAssetIdFromLocation;
    private startMetricsCollection;
    private updateMetrics;
    private startTime;
    performDeviceDiscovery(): Promise<IoTDevice[]>;
    updateDeviceConfiguration(deviceId: string, configuration: Record<string, any>): Promise<boolean>;
    getDeviceMetrics(deviceId: string): any;
    getSystemMetrics(): any;
    shutdown(): Promise<void>;
}
export default IoTDataManager;
//# sourceMappingURL=IoTDataManager.d.ts.map
import { EventEmitter } from 'events';
import { DigitalTwin, RegisteredAsset, SensorReading } from './types';
export declare class DigitalTwinManager extends EventEmitter {
    private logger;
    private twins;
    private iotGateway;
    private aiEngine;
    private oracleConnector;
    private updateInterval?;
    constructor();
    initialize(): Promise<void>;
    createDigitalTwin(asset: RegisteredAsset): Promise<DigitalTwin>;
    private setupIoTConnections;
    private deployAIModels;
    private initializeDataStreams;
    private startMonitoring;
    updateDigitalTwin(twinId: string, sensorData: SensorReading[]): Promise<void>;
    private processSensorData;
    private processOracleData;
    private checkAlerts;
    private checkThresholds;
    private updateBlockchainState;
    private calculateStateHash;
    private startUpdateLoop;
    private syncDigitalTwin;
    getDigitalTwin(twinId: string): Promise<DigitalTwin | undefined>;
    getDigitalTwinByAssetId(assetId: string): Promise<DigitalTwin | undefined>;
    updateDigitalTwinState(twinId: string, stateUpdate: any): Promise<void>;
    private generateTwinId;
    private generateConnectionId;
    private getAlertThresholds;
    stop(): Promise<void>;
}
//# sourceMappingURL=DigitalTwinManager.d.ts.map
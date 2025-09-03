import { IoTConnection, SensorReading } from './types';
import { EventEmitter } from 'events';
export declare class IoTGateway extends EventEmitter {
    private logger;
    constructor();
    initialize(): Promise<void>;
    establishConnection(connection: IoTConnection): Promise<void>;
    startDataCollection(connectionId: string): Promise<void>;
    getLatestData(connections: IoTConnection[]): Promise<SensorReading[]>;
    stop(): Promise<void>;
}
//# sourceMappingURL=IoTGateway.d.ts.map
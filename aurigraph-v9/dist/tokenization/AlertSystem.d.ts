import { SensorReading } from './types';
export declare class AlertSystem {
    private logger;
    private thresholds;
    constructor(thresholds: any);
    checkAlerts(sensorData: SensorReading[], predictions: any[]): Promise<any[]>;
    getThresholds(sensorType: string): any;
}
//# sourceMappingURL=AlertSystem.d.ts.map
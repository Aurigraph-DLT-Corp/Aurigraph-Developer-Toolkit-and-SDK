import { Logger } from '../utils/Logger';
import { SensorReading } from './types';

export class AlertSystem {
  private logger: Logger;
  private thresholds: any;

  constructor(thresholds: any) {
    this.logger = new Logger('AlertSystem');
    this.thresholds = thresholds;
  }

  async checkAlerts(sensorData: SensorReading[], predictions: any[]): Promise<any[]> {
    const alerts = [];
    
    for (const reading of sensorData) {
      const threshold = this.thresholds[reading.sensorType];
      if (threshold) {
        if (reading.value > threshold.max || reading.value < threshold.min) {
          alerts.push({
            type: 'threshold-exceeded',
            sensorType: reading.sensorType,
            value: reading.value,
            threshold: threshold,
            severity: 'HIGH',
            timestamp: reading.timestamp
          });
        }
      }
    }
    
    return alerts;
  }

  getThresholds(sensorType: string): any {
    return this.thresholds[sensorType];
  }
}
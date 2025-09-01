"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSystem = void 0;
const Logger_1 = require("../utils/Logger");
class AlertSystem {
    logger;
    thresholds;
    constructor(thresholds) {
        this.logger = new Logger_1.Logger('AlertSystem');
        this.thresholds = thresholds;
    }
    async checkAlerts(sensorData, predictions) {
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
    getThresholds(sensorType) {
        return this.thresholds[sensorType];
    }
}
exports.AlertSystem = AlertSystem;
//# sourceMappingURL=AlertSystem.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
class MonitoringService extends events_1.EventEmitter {
    logger;
    config;
    constructor(configManager) {
        super();
        this.logger = new Logger_1.Logger('MonitoringService');
        this.config = configManager.getMonitoringConfig();
    }
    async start() {
        this.logger.info('Starting Monitoring Service...');
    }
    async stop() {
        this.logger.info('Stopping Monitoring Service...');
    }
    recordTransaction(tx) {
        this.logger.debug('Recording transaction metrics', { txId: tx.txId });
    }
    recordBlock(block) {
        this.logger.debug('Recording block metrics', { blockHash: block.hash });
    }
    recordConsensusEvent(event) {
        this.logger.debug('Recording consensus event', { type: event.type });
    }
    recordError(error) {
        this.logger.error('Recording error', error);
    }
    recordHealthCheck(health) {
        this.logger.debug('Recording health check', { healthy: health.healthy });
    }
}
exports.MonitoringService = MonitoringService;
//# sourceMappingURL=MonitoringService.js.map
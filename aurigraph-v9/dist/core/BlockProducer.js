"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockProducer = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
class BlockProducer extends events_1.EventEmitter {
    logger;
    blockProductionEnabled = false;
    constructor(consensus, transactionProcessor, stateManager) {
        super();
        this.logger = new Logger_1.Logger('BlockProducer');
    }
    async start() {
        this.logger.info('Starting Block Producer...');
    }
    async stop() {
        this.logger.info('Stopping Block Producer...');
    }
    enableBlockProduction() {
        this.blockProductionEnabled = true;
        this.logger.info('Block production enabled');
    }
    disableBlockProduction() {
        this.blockProductionEnabled = false;
        this.logger.info('Block production disabled');
    }
}
exports.BlockProducer = BlockProducer;
//# sourceMappingURL=BlockProducer.js.map
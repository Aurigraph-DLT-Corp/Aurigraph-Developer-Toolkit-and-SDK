"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionProcessor = void 0;
const events_1 = require("events");
const Logger_1 = require("../utils/Logger");
class TransactionProcessor extends events_1.EventEmitter {
    logger;
    constructor(shardManager, stateManager) {
        super();
        this.logger = new Logger_1.Logger('TransactionProcessor');
    }
    async start() {
        this.logger.info('Starting Transaction Processor...');
    }
    async stop() {
        this.logger.info('Stopping Transaction Processor...');
    }
    async processTransaction(tx) {
        this.emit('transaction-validated', tx);
    }
    getPoolSize() {
        return Math.floor(Math.random() * 1000);
    }
}
exports.TransactionProcessor = TransactionProcessor;
//# sourceMappingURL=TransactionProcessor.js.map
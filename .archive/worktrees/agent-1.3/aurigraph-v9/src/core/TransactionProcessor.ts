import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { ShardManager } from '../consensus/ShardManager';
import { StateManager } from './StateManager';
import { Transaction } from '../consensus/types';

export class TransactionProcessor extends EventEmitter {
  private logger: Logger;

  constructor(shardManager: ShardManager, stateManager: StateManager) {
    super();
    this.logger = new Logger('TransactionProcessor');
  }

  async start(): Promise<void> {
    this.logger.info('Starting Transaction Processor...');
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Transaction Processor...');
  }

  async processTransaction(tx: Transaction): Promise<void> {
    this.emit('transaction-validated', tx);
  }

  getPoolSize(): number {
    return Math.floor(Math.random() * 1000);
  }
}
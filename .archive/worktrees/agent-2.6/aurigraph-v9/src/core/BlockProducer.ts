import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { RAFTConsensus } from '../consensus/RAFTConsensus';
import { TransactionProcessor } from './TransactionProcessor';
import { StateManager } from './StateManager';

export class BlockProducer extends EventEmitter {
  private logger: Logger;
  private blockProductionEnabled: boolean = false;

  constructor(
    consensus: RAFTConsensus,
    transactionProcessor: TransactionProcessor,
    stateManager: StateManager
  ) {
    super();
    this.logger = new Logger('BlockProducer');
  }

  async start(): Promise<void> {
    this.logger.info('Starting Block Producer...');
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Block Producer...');
  }

  enableBlockProduction(): void {
    this.blockProductionEnabled = true;
    this.logger.info('Block production enabled');
  }

  disableBlockProduction(): void {
    this.blockProductionEnabled = false;
    this.logger.info('Block production disabled');
  }
}
import { config } from 'dotenv';
import { AurigraphNode } from './node/AurigraphNode';
import { Logger } from './utils/Logger';
import { ConfigManager } from './core/ConfigManager';
import { NetworkManager } from './core/NetworkManager';
import { MonitoringService } from './monitoring/MonitoringService';

config();

const logger = new Logger('Main');

async function main() {
  try {
    logger.info('Starting Aurigraph V9 Node...');

    const configManager = new ConfigManager();
    await configManager.loadConfiguration();

    const nodeConfig = configManager.getNodeConfig();
    logger.info(`Node Type: ${nodeConfig.nodeType}`);
    logger.info(`Node ID: ${nodeConfig.nodeId}`);

    const monitoringService = new MonitoringService(configManager);
    await monitoringService.start();

    const networkManager = new NetworkManager(configManager);
    await networkManager.initialize();

    const node = new AurigraphNode(configManager, networkManager, monitoringService);
    await node.start();

    logger.info('Aurigraph V9 Node started successfully');

    process.on('SIGINT', async () => {
      logger.info('Shutting down Aurigraph Node...');
      await node.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down Aurigraph Node...');
      await node.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start Aurigraph Node:', error);
    process.exit(1);
  }
}

main().catch(console.error);
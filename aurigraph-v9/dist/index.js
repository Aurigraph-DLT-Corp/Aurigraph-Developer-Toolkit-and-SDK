"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const AurigraphNode_1 = require("./node/AurigraphNode");
const Logger_1 = require("./utils/Logger");
const ConfigManager_1 = require("./core/ConfigManager");
const NetworkManager_1 = require("./core/NetworkManager");
const MonitoringService_1 = require("./monitoring/MonitoringService");
(0, dotenv_1.config)();
const logger = new Logger_1.Logger('Main');
async function main() {
    try {
        logger.info('Starting Aurigraph V9 Node...');
        const configManager = new ConfigManager_1.ConfigManager();
        await configManager.loadConfiguration();
        const nodeConfig = configManager.getNodeConfig();
        logger.info(`Node Type: ${nodeConfig.nodeType}`);
        logger.info(`Node ID: ${nodeConfig.nodeId}`);
        const monitoringService = new MonitoringService_1.MonitoringService(configManager);
        await monitoringService.start();
        const networkManager = new NetworkManager_1.NetworkManager(configManager);
        await networkManager.initialize();
        const node = new AurigraphNode_1.AurigraphNode(configManager, networkManager, monitoringService);
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
    }
    catch (error) {
        logger.error('Failed to start Aurigraph Node:', error);
        process.exit(1);
    }
}
main().catch(console.error);
//# sourceMappingURL=index.js.map
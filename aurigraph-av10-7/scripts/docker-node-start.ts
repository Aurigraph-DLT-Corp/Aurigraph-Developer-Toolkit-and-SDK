import { ChannelManager } from '../src/management/ChannelManager';
import { Logger } from '../src/core/Logger';

async function startBasicNode() {
  const logger = new Logger('Docker-Node');
  const nodeId = process.env.NODE_ID || 'NODE-001';
  const nodeType = (process.env.NODE_TYPE || 'FULL') as 'FULL' | 'LIGHT' | 'ARCHIVE' | 'BRIDGE';
  const apiPort = parseInt(process.env.API_PORT || '8101');
  const channelName = process.env.CHANNEL_NAME || 'TEST';
  
  logger.info(`🌐 Starting containerized ${nodeType} node ${nodeId} in ${channelName} channel`);
  
  try {
    const channelManager = new ChannelManager();
    
    // Create basic node with proper config
    const nodeConfig = {
      id: nodeId,
      type: nodeType,
      port: apiPort,
      p2pPort: apiPort + 20000
    };
    
    const node = await channelManager.createBasicNode(channelName, nodeConfig);
    logger.info(`✅ ${nodeType} node ${nodeId} created successfully`);
    
    // Start HTTP API server
    const express = require('express');
    const app = express();
    app.use(express.json());
    
    // Fix CSP headers for font loading
    app.use((req: any, res: any, next: any) => {
      res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "font-src 'self' data: https: blob:; " +
        "style-src 'self' 'unsafe-inline' https:; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' ws: wss: https:;"
      );
      next();
    });
    
    app.get('/', (req: any, res: any) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Aurigraph Node ${nodeId}</title>
          <style>
            body { font-family: Arial, sans-serif; background: #0a0e27; color: #fff; padding: 2rem; }
            .header { text-align: center; margin-bottom: 2rem; }
            .status { background: rgba(0,255,136,0.1); padding: 1rem; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌐 Aurigraph Node ${nodeId}</h1>
            <p>Containerized DLT ${nodeType} Node</p>
          </div>
          <div class="status">
            <p><strong>Status:</strong> Active</p>
            <p><strong>Type:</strong> ${nodeType}</p>
            <p><strong>Channel:</strong> ${channelName}</p>
            <p><strong>Port:</strong> ${apiPort}</p>
            <p><strong>Security:</strong> Quantum Level 6</p>
          </div>
        </body>
        </html>
      `);
    });
    
    app.get('/health', (req: any, res: any) => {
      res.json({
        status: 'healthy',
        nodeId,
        nodeType,
        channelName,
        port: apiPort,
        timestamp: new Date().toISOString()
      });
    });
    
    app.get('/status', (req: any, res: any) => {
      res.json({
        node: node,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        containerized: true
      });
    });
    
    app.listen(apiPort, () => {
      logger.info(`📡 ${nodeType} Node API: http://localhost:${apiPort}`);
      logger.info(`🔗 P2P: port ${apiPort + 20000}`);
    });
    
    // Keep the process running
    process.on('SIGINT', () => {
      logger.info('🛑 Shutting down node...');
      process.exit(0);
    });
    
    // Heartbeat to keep alive
    setInterval(() => {
      logger.info(`💓 ${nodeType} node ${nodeId} heartbeat - Status: active`);
    }, 30000);
    
  } catch (error) {
    logger.error(`❌ Failed to start node: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

startBasicNode().catch(console.error);
import express from 'express';
import { AssetRegistry } from '../registry/AssetRegistry';
import { MCPInterface } from '../mcp/MCPInterface';
export declare class RWAWebInterface {
    private app;
    private logger;
    private assetRegistry;
    private mcpInterface;
    constructor(assetRegistry: AssetRegistry, mcpInterface: MCPInterface);
    private setupMiddleware;
    private setupRoutes;
    start(port?: number): Promise<void>;
    getApp(): express.Application;
}
//# sourceMappingURL=RWAWebInterface.d.ts.map
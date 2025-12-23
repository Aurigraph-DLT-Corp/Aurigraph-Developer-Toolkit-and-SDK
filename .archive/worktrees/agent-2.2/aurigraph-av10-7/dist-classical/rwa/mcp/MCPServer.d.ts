import { AssetRegistry } from '../registry/AssetRegistry';
import { AuditTrailManager } from '../audit/AuditTrailManager';
import { MultiAssetClassManager } from '../registry/MultiAssetClassManager';
export declare class MCPServer {
    private app;
    private mcpInterface;
    private reportingEngine;
    private port;
    constructor(assetRegistry: AssetRegistry, auditManager: AuditTrailManager, multiAssetManager: MultiAssetClassManager, port?: number);
    private setupMiddleware;
    private setupRoutes;
    start(): Promise<void>;
    stop(): Promise<void>;
    getServerStats(): any;
}
//# sourceMappingURL=MCPServer.d.ts.map
import { Router } from 'express';
import { AssetRegistry } from '../registry/AssetRegistry';
import { AuditTrailManager } from '../audit/AuditTrailManager';
import { MultiAssetClassManager } from '../registry/MultiAssetClassManager';
export declare class MCPRouter {
    private router;
    private mcpInterface;
    private auditManager;
    constructor(assetRegistry: AssetRegistry, auditManager: AuditTrailManager, multiAssetManager: MultiAssetClassManager);
    private setupRoutes;
    private validateAuthentication;
    private registerWebhook;
    private unregisterWebhook;
    getRouter(): Router;
}
//# sourceMappingURL=MCPRouter.d.ts.map
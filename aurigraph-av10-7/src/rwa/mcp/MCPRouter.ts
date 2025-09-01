import { Router } from 'express';
import { MCPInterface } from './MCPInterface';
import { MCPServer } from './MCPServer';
import { AssetRegistry } from '../registry/AssetRegistry';
import { AuditTrailManager } from '../audit/AuditTrailManager';
import { ReportingEngine } from '../reporting/ReportingEngine';
import { MultiAssetClassManager } from '../registry/MultiAssetClassManager';

export class MCPRouter {
    private router: Router;
    private mcpInterface: MCPInterface;
    private auditManager: AuditTrailManager;

    constructor(
        assetRegistry: AssetRegistry,
        auditManager: AuditTrailManager,
        multiAssetManager: MultiAssetClassManager
    ) {
        this.router = Router();
        this.auditManager = auditManager;
        this.mcpInterface = new MCPInterface(assetRegistry, auditManager);
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Authentication middleware
        this.router.use(async (req, res, next) => {
            try {
                const apiKey = req.headers['x-api-key'] as string;
                const clientId = req.headers['x-client-id'] as string;
                const signature = req.headers['x-signature'] as string;

                if (!apiKey || !clientId) {
                    return res.status(401).json({
                        error: {
                            code: 401,
                            message: 'Missing authentication headers'
                        }
                    });
                }

                // Validate authentication
                const isValid = await this.validateAuthentication(apiKey, clientId, signature, req.body);
                if (!isValid) {
                    await this.auditManager.logEvent(
                        'MCP_AUTH_FAILED',
                        'ACCESS',
                        'HIGH',
                        req.headers['x-request-id'] as string || 'unknown',
                        'MCP_REQUEST',
                        'AUTH_FAILED',
                        {
                            clientId,
                            path: req.path,
                            method: req.method,
                            ip: req.ip
                        },
                        { nodeId: 'mcp-router' }
                    );

                    return res.status(401).json({
                        error: {
                            code: 401,
                            message: 'Authentication failed'
                        }
                    });
                }

                next();
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: 'Authentication error'
                    }
                });
            }
        });

        // Asset endpoints
        this.router.get('/assets', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'assets.list',
                    params: req.query,
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        this.router.get('/assets/:assetId', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'assets.get',
                    params: { assetId: req.params.assetId },
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        this.router.post('/assets', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'assets.create',
                    params: req.body,
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.status(201).json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        // Tokenization endpoints
        this.router.post('/tokenization', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'tokenization.create',
                    params: req.body,
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.status(201).json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        this.router.get('/tokenization/:tokenizationId', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'tokenization.get',
                    params: { tokenizationId: req.params.tokenizationId },
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        this.router.post('/tokenization/transfer', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'tokenization.transfer',
                    params: req.body,
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        // Portfolio endpoints
        this.router.get('/portfolio', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'portfolio.get',
                    params: { clientId: req.query.clientId as string },
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        this.router.get('/portfolio/performance', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'portfolio.performance',
                    params: { clientId: req.query.clientId as string },
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        // Analytics endpoints
        this.router.get('/analytics/market', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'analytics.market',
                    params: { timeframe: req.query.timeframe as string },
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        this.router.get('/analytics/assets/:assetId', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'analytics.asset',
                    params: { assetId: req.params.assetId },
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        // Compliance endpoints
        this.router.get('/compliance/check', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'compliance.check',
                    params: {},
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        this.router.get('/compliance/report', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'compliance.report',
                    params: {
                        startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
                        endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined
                    },
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        // System endpoints
        this.router.get('/system/status', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'system.status',
                    params: {},
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        this.router.get('/system/metrics', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                const result = await this.mcpInterface.processRequest({
                    id: req.headers['x-request-id'] as string || require('crypto').randomUUID(),
                    method: 'system.metrics',
                    params: {},
                    apiKey: req.headers['x-api-key'] as string,
                    timestamp: Date.now(),
                    signature: req.headers['x-signature'] as string,
                    version: '2.0',
                    clientId
                });

                res.json(result);
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
        });

        // Webhook management endpoints
        this.router.post('/webhooks/register', async (req, res) => {
            try {
                const { url, events, secret } = req.body;
                const clientId = req.headers['x-client-id'] as string;

                const webhookId = await this.registerWebhook(clientId, url, events, secret);

                res.status(201).json({
                    webhookId,
                    status: 'REGISTERED',
                    url,
                    events
                });
            } catch (error) {
                res.status(400).json({
                    error: {
                        code: 400,
                        message: error instanceof Error ? error.message : 'Webhook registration failed'
                    }
                });
            }
        });

        this.router.delete('/webhooks/:webhookId', async (req, res) => {
            try {
                const clientId = req.headers['x-client-id'] as string;
                await this.unregisterWebhook(clientId, req.params.webhookId);

                res.json({
                    webhookId: req.params.webhookId,
                    status: 'UNREGISTERED'
                });
            } catch (error) {
                res.status(400).json({
                    error: {
                        code: 400,
                        message: error instanceof Error ? error.message : 'Webhook removal failed'
                    }
                });
            }
        });

        // Batch processing endpoint
        this.router.post('/batch', async (req, res) => {
            try {
                const { requests } = req.body;
                
                if (!Array.isArray(requests) || requests.length === 0) {
                    return res.status(400).json({
                        error: {
                            code: 400,
                            message: 'Invalid batch request format'
                        }
                    });
                }

                if (requests.length > 10) {
                    return res.status(400).json({
                        error: {
                            code: 400,
                            message: 'Batch size cannot exceed 10 requests'
                        }
                    });
                }

                const responses = await Promise.all(
                    requests.map((request: any) => 
                        this.mcpInterface.processRequest({
                            ...request,
                            apiKey: req.headers['x-api-key'] as string,
                            clientId: req.headers['x-client-id'] as string,
                            signature: req.headers['x-signature'] as string
                        })
                    )
                );

                res.json({
                    responses,
                    batchSize: requests.length,
                    timestamp: Date.now()
                });
            } catch (error) {
                res.status(500).json({
                    error: {
                        code: 500,
                        message: error instanceof Error ? error.message : 'Batch processing error'
                    }
                });
            }
        });

        // Real-time streaming endpoint info
        this.router.get('/stream/info', (req, res) => {
            res.json({
                websocket: {
                    url: `ws://localhost:${process.env.PORT || 3020}/api/rwa/v2/stream`,
                    protocols: ['aurigraph-mcp-v2'],
                    authentication: 'API_KEY_HEADER',
                    events: [
                        'asset.created',
                        'asset.updated',
                        'asset.valuationChanged',
                        'tokenization.created',
                        'tokenization.transferred',
                        'compliance.alert',
                        'system.statusChange'
                    ]
                },
                serverSentEvents: {
                    url: `http://localhost:${process.env.PORT || 3020}/api/rwa/v2/events`,
                    headers: ['X-API-Key', 'X-Client-ID'],
                    format: 'text/event-stream'
                }
            });
        });

        // Server-Sent Events endpoint
        this.router.get('/events', (req, res) => {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'X-API-Key, X-Client-ID'
            });

            const clientId = req.headers['x-client-id'] as string;

            // Send initial connection message
            res.write(`data: ${JSON.stringify({
                type: 'connection',
                message: 'Connected to Aurigraph RWA MCP stream',
                clientId,
                timestamp: Date.now()
            })}\n\n`);

            // Set up event listeners
            const eventHandler = (event: any) => {
                res.write(`event: ${event.type}\n`);
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            };

            this.mcpInterface.on('auditEvent', eventHandler);

            // Handle client disconnect
            req.on('close', () => {
                this.mcpInterface.removeListener('auditEvent', eventHandler);
            });

            // Keep connection alive
            const keepAlive = setInterval(() => {
                res.write(`data: ${JSON.stringify({
                    type: 'ping',
                    timestamp: Date.now()
                })}\n\n`);
            }, 30000); // Every 30 seconds

            req.on('close', () => {
                clearInterval(keepAlive);
            });
        });
    }

    private async validateAuthentication(
        apiKey: string,
        clientId: string,
        signature: string,
        requestBody: any
    ): Promise<boolean> {
        // This would implement proper signature validation
        // For now, just check if API key and client ID are provided
        return !!(apiKey && clientId);
    }

    private async registerWebhook(
        clientId: string,
        url: string,
        events: string[],
        secret: string
    ): Promise<string> {
        const webhookId = require('crypto').randomUUID();

        await this.auditManager.logEvent(
            'WEBHOOK_REGISTERED',
            'ACCESS',
            'MEDIUM',
            webhookId,
            'WEBHOOK',
            'REGISTER',
            {
                clientId,
                url,
                events,
                hasSecret: !!secret
            },
            { nodeId: 'mcp-router' }
        );

        return webhookId;
    }

    private async unregisterWebhook(clientId: string, webhookId: string): Promise<void> {
        await this.auditManager.logEvent(
            'WEBHOOK_UNREGISTERED',
            'ACCESS',
            'MEDIUM',
            webhookId,
            'WEBHOOK',
            'UNREGISTER',
            {
                clientId,
                webhookId
            },
            { nodeId: 'mcp-router' }
        );
    }

    getRouter(): Router {
        return this.router;
    }
}
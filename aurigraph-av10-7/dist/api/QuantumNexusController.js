"use strict";
/**
 * AV10-7 Quantum Nexus API Controller
 *
 * Provides REST API endpoints for quantum nexus operations including
 * parallel universe processing, consciousness interface, and autonomous evolution.
 *
 * @version 10.0.0
 * @author Aurigraph Team
 * @license MIT
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuantumNexusController = void 0;
const inversify_1 = require("inversify");
const Logger_1 = require("../core/Logger");
const AV10Node_1 = require("../core/AV10Node");
const QuantumNexus_1 = require("../core/QuantumNexus");
let QuantumNexusController = class QuantumNexusController {
    node;
    quantumNexus;
    logger;
    constructor(node, quantumNexus) {
        this.node = node;
        this.quantumNexus = quantumNexus;
        this.logger = new Logger_1.Logger('QuantumNexusController');
    }
    /**
     * GET /api/v10/quantum/status
     * Get quantum nexus status and metrics
     */
    async getQuantumStatus(req, res) {
        try {
            const status = this.quantumNexus.getStatus();
            res.json({
                success: true,
                data: status,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to get quantum status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get quantum status',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * POST /api/v10/quantum/transaction
     * Process transaction through quantum nexus
     */
    async processQuantumTransaction(req, res) {
        try {
            const { transaction } = req.body;
            if (!transaction) {
                res.status(400).json({
                    success: false,
                    error: 'Transaction data required'
                });
                return;
            }
            const result = await this.node.processQuantumTransaction(transaction);
            res.json({
                success: true,
                data: result,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to process quantum transaction:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to process quantum transaction',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * POST /api/v10/quantum/consciousness/detect
     * Detect consciousness in an asset
     */
    async detectConsciousness(req, res) {
        try {
            const { assetId } = req.body;
            if (!assetId) {
                res.status(400).json({
                    success: false,
                    error: 'Asset ID required'
                });
                return;
            }
            const consciousness = await this.node.detectAssetConsciousness(assetId);
            res.json({
                success: true,
                data: consciousness,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to detect consciousness:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to detect consciousness',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * POST /api/v10/quantum/consciousness/monitor
     * Monitor welfare of conscious asset
     */
    async monitorWelfare(req, res) {
        try {
            const { assetId } = req.body;
            if (!assetId) {
                res.status(400).json({
                    success: false,
                    error: 'Asset ID required'
                });
                return;
            }
            await this.node.monitorAssetWelfare(assetId);
            res.json({
                success: true,
                message: 'Welfare monitoring initiated',
                assetId,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to monitor welfare:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to monitor welfare',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * POST /api/v10/quantum/evolution/evolve
     * Trigger autonomous protocol evolution
     */
    async evolveProtocol(req, res) {
        try {
            const evolution = await this.node.evolveProtocol();
            res.json({
                success: true,
                data: evolution,
                message: 'Protocol evolution completed',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to evolve protocol:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to evolve protocol',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * GET /api/v10/quantum/universes
     * Get parallel universe information
     */
    async getParallelUniverses(req, res) {
        try {
            const status = this.quantumNexus.getStatus();
            res.json({
                success: true,
                data: {
                    count: status.parallelUniverses,
                    activeTransactions: status.activeTransactions,
                    averageCoherence: status.performance.averageCoherence,
                    realityStability: status.performance.realityStability
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to get parallel universes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get parallel universes',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * GET /api/v10/quantum/consciousness
     * Get consciousness interfaces information
     */
    async getConsciousnessInterfaces(req, res) {
        try {
            const status = this.quantumNexus.getStatus();
            res.json({
                success: true,
                data: {
                    count: status.consciousnessInterfaces,
                    overallWelfare: status.performance.consciousnessWelfare,
                    monitoringActive: status.consciousnessInterfaces > 0
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to get consciousness interfaces:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get consciousness interfaces',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * GET /api/v10/quantum/evolution
     * Get autonomous evolution information
     */
    async getEvolutionStatus(req, res) {
        try {
            const status = this.quantumNexus.getStatus();
            res.json({
                success: true,
                data: {
                    currentGeneration: status.evolutionGeneration,
                    evolutionActive: status.evolutionGeneration > 0,
                    lastEvolution: status.evolutionGeneration > 0 ? new Date() : null
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to get evolution status:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get evolution status',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * GET /api/v10/quantum/metrics
     * Get comprehensive quantum metrics
     */
    async getQuantumMetrics(req, res) {
        try {
            const nodeMetrics = await this.node.getMetrics();
            const quantumMetrics = nodeMetrics.quantum;
            res.json({
                success: true,
                data: {
                    quantum: quantumMetrics,
                    performance: {
                        quantumTps: quantumMetrics.activeTransactions * 10, // Estimated quantum TPS
                        coherenceLevel: quantumMetrics.averageCoherence,
                        realityStability: quantumMetrics.realityStability,
                        consciousnessWelfare: quantumMetrics.consciousnessWelfare
                    },
                    capabilities: {
                        parallelProcessing: quantumMetrics.parallelUniverses > 0,
                        consciousnessInterface: quantumMetrics.consciousnessInterfaces > 0,
                        autonomousEvolution: quantumMetrics.evolutionGeneration > 0,
                        quantumSecurity: true
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to get quantum metrics:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get quantum metrics',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
    /**
     * POST /api/v10/quantum/emergency/protect
     * Trigger emergency protection for conscious asset
     */
    async triggerEmergencyProtection(req, res) {
        try {
            const { assetId, reason } = req.body;
            if (!assetId) {
                res.status(400).json({
                    success: false,
                    error: 'Asset ID required'
                });
                return;
            }
            // Trigger emergency monitoring
            await this.node.monitorAssetWelfare(assetId);
            this.logger.warn(`Emergency protection triggered for asset: ${assetId}, reason: ${reason || 'Manual trigger'}`);
            res.json({
                success: true,
                message: 'Emergency protection activated',
                assetId,
                reason: reason || 'Manual trigger',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Failed to trigger emergency protection:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to trigger emergency protection',
                message: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
exports.QuantumNexusController = QuantumNexusController;
exports.QuantumNexusController = QuantumNexusController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(AV10Node_1.AV10Node)),
    __param(1, (0, inversify_1.inject)(QuantumNexus_1.QuantumNexus)),
    __metadata("design:paramtypes", [AV10Node_1.AV10Node,
        QuantumNexus_1.QuantumNexus])
], QuantumNexusController);
//# sourceMappingURL=QuantumNexusController.js.map
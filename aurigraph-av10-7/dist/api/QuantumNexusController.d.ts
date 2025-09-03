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
import { Request, Response } from 'express';
import { AV10Node } from '../core/AV10Node';
import { QuantumNexus } from '../core/QuantumNexus';
export declare class QuantumNexusController {
    private node;
    private quantumNexus;
    private logger;
    constructor(node: AV10Node, quantumNexus: QuantumNexus);
    /**
     * GET /api/v10/quantum/status
     * Get quantum nexus status and metrics
     */
    getQuantumStatus(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/v10/quantum/transaction
     * Process transaction through quantum nexus
     */
    processQuantumTransaction(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/v10/quantum/consciousness/detect
     * Detect consciousness in an asset
     */
    detectConsciousness(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/v10/quantum/consciousness/monitor
     * Monitor welfare of conscious asset
     */
    monitorWelfare(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/v10/quantum/evolution/evolve
     * Trigger autonomous protocol evolution
     */
    evolveProtocol(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/v10/quantum/universes
     * Get parallel universe information
     */
    getParallelUniverses(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/v10/quantum/consciousness
     * Get consciousness interfaces information
     */
    getConsciousnessInterfaces(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/v10/quantum/evolution
     * Get autonomous evolution information
     */
    getEvolutionStatus(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/v10/quantum/metrics
     * Get comprehensive quantum metrics
     */
    getQuantumMetrics(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/v10/quantum/emergency/protect
     * Trigger emergency protection for conscious asset
     */
    triggerEmergencyProtection(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=QuantumNexusController.d.ts.map
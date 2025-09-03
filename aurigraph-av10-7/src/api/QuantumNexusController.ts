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
import { injectable, inject } from 'inversify';
import { Logger } from '../core/Logger';
import { AV10Node } from '../core/AV10Node';
import { QuantumNexus } from '../core/QuantumNexus';

@injectable()
export class QuantumNexusController {
  private logger: Logger;

  constructor(
    @inject(AV10Node) private node: AV10Node,
    @inject(QuantumNexus) private quantumNexus: QuantumNexus
  ) {
    this.logger = new Logger('QuantumNexusController');
  }

  /**
   * GET /api/v10/quantum/status
   * Get quantum nexus status and metrics
   */
  async getQuantumStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = this.quantumNexus.getStatus();
      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
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
  async processQuantumTransaction(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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
  async detectConsciousness(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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
  async monitorWelfare(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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
  async evolveProtocol(req: Request, res: Response): Promise<void> {
    try {
      const evolution = await this.node.evolveProtocol();
      
      res.json({
        success: true,
        data: evolution,
        message: 'Protocol evolution completed',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
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
  async getParallelUniverses(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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
  async getConsciousnessInterfaces(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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
  async getEvolutionStatus(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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
  async getQuantumMetrics(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
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
  async triggerEmergencyProtection(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      this.logger.error('Failed to trigger emergency protection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger emergency protection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

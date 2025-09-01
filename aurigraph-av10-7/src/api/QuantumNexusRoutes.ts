/**
 * AV10-7 Quantum Nexus API Routes
 * 
 * Defines REST API routes for quantum nexus operations
 * 
 * @version 10.0.0
 * @author Aurigraph Team
 * @license MIT
 */

import { Router } from 'express';
import { container } from '../core/Container';
import { QuantumNexusController } from './QuantumNexusController';

const router = Router();
const quantumController = container.get<QuantumNexusController>(QuantumNexusController);

/**
 * Quantum Nexus Status and Information Routes
 */

// GET /api/v10/quantum/status - Get quantum nexus status
router.get('/status', async (req, res) => {
  await quantumController.getQuantumStatus(req, res);
});

// GET /api/v10/quantum/metrics - Get comprehensive quantum metrics
router.get('/metrics', async (req, res) => {
  await quantumController.getQuantumMetrics(req, res);
});

// GET /api/v10/quantum/universes - Get parallel universe information
router.get('/universes', async (req, res) => {
  await quantumController.getParallelUniverses(req, res);
});

/**
 * Quantum Transaction Processing Routes
 */

// POST /api/v10/quantum/transaction - Process transaction through quantum nexus
router.post('/transaction', async (req, res) => {
  await quantumController.processQuantumTransaction(req, res);
});

/**
 * Consciousness Interface Routes
 */

// POST /api/v10/quantum/consciousness/detect - Detect consciousness in asset
router.post('/consciousness/detect', async (req, res) => {
  await quantumController.detectConsciousness(req, res);
});

// POST /api/v10/quantum/consciousness/monitor - Monitor welfare of conscious asset
router.post('/consciousness/monitor', async (req, res) => {
  await quantumController.monitorWelfare(req, res);
});

// GET /api/v10/quantum/consciousness - Get consciousness interfaces information
router.get('/consciousness', async (req, res) => {
  await quantumController.getConsciousnessInterfaces(req, res);
});

/**
 * Autonomous Evolution Routes
 */

// POST /api/v10/quantum/evolution/evolve - Trigger autonomous protocol evolution
router.post('/evolution/evolve', async (req, res) => {
  await quantumController.evolveProtocol(req, res);
});

// GET /api/v10/quantum/evolution - Get autonomous evolution status
router.get('/evolution', async (req, res) => {
  await quantumController.getEvolutionStatus(req, res);
});

/**
 * Emergency Protection Routes
 */

// POST /api/v10/quantum/emergency/protect - Trigger emergency protection
router.post('/emergency/protect', async (req, res) => {
  await quantumController.triggerEmergencyProtection(req, res);
});

/**
 * Quantum Nexus Documentation Route
 */
router.get('/docs', (req, res) => {
  res.json({
    name: 'Aurigraph V10 Quantum Nexus API',
    version: '10.0.0',
    description: 'Revolutionary quantum blockchain platform with consciousness interface and autonomous evolution',
    endpoints: {
      status: {
        method: 'GET',
        path: '/api/v10/quantum/status',
        description: 'Get quantum nexus status and metrics'
      },
      metrics: {
        method: 'GET',
        path: '/api/v10/quantum/metrics',
        description: 'Get comprehensive quantum performance metrics'
      },
      universes: {
        method: 'GET',
        path: '/api/v10/quantum/universes',
        description: 'Get parallel universe information'
      },
      processTransaction: {
        method: 'POST',
        path: '/api/v10/quantum/transaction',
        description: 'Process transaction through quantum nexus',
        body: {
          transaction: 'Transaction data object'
        }
      },
      detectConsciousness: {
        method: 'POST',
        path: '/api/v10/quantum/consciousness/detect',
        description: 'Detect consciousness in an asset',
        body: {
          assetId: 'Asset identifier string'
        }
      },
      monitorWelfare: {
        method: 'POST',
        path: '/api/v10/quantum/consciousness/monitor',
        description: 'Monitor welfare of conscious asset',
        body: {
          assetId: 'Asset identifier string'
        }
      },
      getConsciousness: {
        method: 'GET',
        path: '/api/v10/quantum/consciousness',
        description: 'Get consciousness interfaces information'
      },
      evolveProtocol: {
        method: 'POST',
        path: '/api/v10/quantum/evolution/evolve',
        description: 'Trigger autonomous protocol evolution'
      },
      getEvolution: {
        method: 'GET',
        path: '/api/v10/quantum/evolution',
        description: 'Get autonomous evolution status'
      },
      emergencyProtect: {
        method: 'POST',
        path: '/api/v10/quantum/emergency/protect',
        description: 'Trigger emergency protection for conscious asset',
        body: {
          assetId: 'Asset identifier string',
          reason: 'Optional reason for emergency protection'
        }
      }
    },
    capabilities: [
      'Parallel Universe Processing (5 universes)',
      'Quantum Transaction Processing (100K+ TPS)',
      'Consciousness Detection and Interface',
      'Autonomous Protocol Evolution',
      'Emergency Welfare Protection',
      'Reality Collapse Management',
      'Quantum Coherence Optimization'
    ],
    features: {
      quantumSharding: 'Process transactions across 5 parallel universes',
      consciousnessInterface: 'Detect and communicate with conscious assets',
      autonomousEvolution: 'Self-evolving protocols with genetic algorithms',
      emergencyProtection: 'Automatic welfare protection for conscious entities',
      quantumSecurity: 'Post-quantum cryptography and security',
      realityManagement: 'Quantum interference and reality collapse algorithms'
    },
    jiraTicket: 'AV10-7',
    documentation: 'https://aurigraphdlt.atlassian.net/browse/AV10-7'
  });
});

/**
 * Health check route for quantum nexus
 */
router.get('/health', async (req, res) => {
  try {
    const status = await quantumController.getQuantumStatus(req, res);
    res.json({
      status: 'healthy',
      quantum: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      quantum: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

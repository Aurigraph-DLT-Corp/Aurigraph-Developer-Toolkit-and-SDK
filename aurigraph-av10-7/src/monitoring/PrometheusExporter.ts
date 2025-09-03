import { Registry, Counter, Gauge, Histogram, Summary, collectDefaultMetrics } from 'prom-client';
import { Logger } from '../core/Logger';
import express from 'express';
import http from 'http';

export interface MetricLabels {
  [key: string]: string | number;
}

export class PrometheusExporter {
  private logger: Logger;
  private registry: Registry;
  private server?: http.Server;
  
  // Platform-wide metrics
  private tpsGauge!: Gauge<string>;
  private latencyHistogram!: Histogram<string>;
  private activeNodesGauge!: Gauge<string>;
  private blockHeightGauge!: Gauge<string>;
  private transactionCounter!: Counter<string>;
  private errorCounter!: Counter<string>;
  
  // Smart Contract metrics
  private contractExecutionHistogram!: Histogram<string>;
  private contractCreationCounter!: Counter<string>;
  private contractVerificationGauge!: Gauge<string>;
  private governanceProposalsGauge!: Gauge<string>;
  
  // RWA metrics
  private tokenizedAssetsGauge!: Gauge<string>;
  private assetTransactionCounter!: Counter<string>;
  private complianceScoreGauge!: Gauge<string>;
  
  // Quantum Crypto metrics
  private quantumOperationsCounter!: Counter<string>;
  private ntruEncryptionsGauge!: Gauge<string>;
  private zkProofsCounter!: Counter<string>;
  private quantumSecurityLevelGauge!: Gauge<string>;
  
  // Node metrics
  private nodeStatusGauge!: Gauge<string>;
  private peerConnectionsGauge!: Gauge<string>;
  private shardMetricsGauge!: Gauge<string>;
  private resourceUsageGauge!: Gauge<string>;
  
  // Consensus metrics
  private consensusRoundHistogram!: Histogram<string>;
  private leaderElectionCounter!: Counter<string>;
  private validatorVotesGauge!: Gauge<string>;
  private consensusLatencySummary!: Summary<string>;
  
  // Cross-chain metrics
  private bridgeTransactionsCounter!: Counter<string>;
  private bridgeVolumeGauge!: Gauge<string>;
  private supportedChainsGauge!: Gauge<string>;
  
  // AI Optimizer metrics
  private aiOptimizationsCounter!: Counter<string>;
  private aiPerformanceGainGauge!: Gauge<string>;
  private aiPredictionsAccuracyGauge!: Gauge<string>;

  constructor() {
    this.logger = new Logger('PrometheusExporter');
    this.registry = new Registry();
    
    // Collect default metrics (CPU, memory, etc.)
    collectDefaultMetrics({ 
      register: this.registry,
      prefix: 'aurigraph_'
    });
    
    // Initialize all custom metrics
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Platform metrics
    this.tpsGauge = new Gauge({
      name: 'aurigraph_tps',
      help: 'Current transactions per second',
      labelNames: ['network', 'shard'],
      registers: [this.registry]
    });

    this.latencyHistogram = new Histogram({
      name: 'aurigraph_transaction_latency_ms',
      help: 'Transaction latency in milliseconds',
      labelNames: ['type', 'status'],
      buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
      registers: [this.registry]
    });

    this.activeNodesGauge = new Gauge({
      name: 'aurigraph_active_nodes',
      help: 'Number of active nodes',
      labelNames: ['node_type'],
      registers: [this.registry]
    });

    this.blockHeightGauge = new Gauge({
      name: 'aurigraph_block_height',
      help: 'Current blockchain height',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.transactionCounter = new Counter({
      name: 'aurigraph_transactions_total',
      help: 'Total number of transactions processed',
      labelNames: ['type', 'status'],
      registers: [this.registry]
    });

    this.errorCounter = new Counter({
      name: 'aurigraph_errors_total',
      help: 'Total number of errors',
      labelNames: ['component', 'error_type'],
      registers: [this.registry]
    });

    // Smart Contract metrics
    this.contractExecutionHistogram = new Histogram({
      name: 'aurigraph_contract_execution_time_ms',
      help: 'Smart contract execution time',
      labelNames: ['contract_type', 'method'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
      registers: [this.registry]
    });

    this.contractCreationCounter = new Counter({
      name: 'aurigraph_contracts_created_total',
      help: 'Total smart contracts created',
      labelNames: ['type', 'template'],
      registers: [this.registry]
    });

    this.contractVerificationGauge = new Gauge({
      name: 'aurigraph_contract_verification_score',
      help: 'Contract formal verification score',
      labelNames: ['contract_id'],
      registers: [this.registry]
    });

    this.governanceProposalsGauge = new Gauge({
      name: 'aurigraph_governance_proposals',
      help: 'Number of governance proposals',
      labelNames: ['status'],
      registers: [this.registry]
    });

    // RWA metrics
    this.tokenizedAssetsGauge = new Gauge({
      name: 'aurigraph_tokenized_assets',
      help: 'Number of tokenized assets',
      labelNames: ['asset_class', 'jurisdiction'],
      registers: [this.registry]
    });

    this.assetTransactionCounter = new Counter({
      name: 'aurigraph_asset_transactions_total',
      help: 'Total RWA transactions',
      labelNames: ['asset_class', 'operation'],
      registers: [this.registry]
    });

    this.complianceScoreGauge = new Gauge({
      name: 'aurigraph_compliance_score',
      help: 'Compliance score percentage',
      labelNames: ['jurisdiction', 'asset_class'],
      registers: [this.registry]
    });

    // Quantum Crypto metrics
    this.quantumOperationsCounter = new Counter({
      name: 'aurigraph_quantum_operations_total',
      help: 'Total quantum cryptographic operations',
      labelNames: ['algorithm', 'operation'],
      registers: [this.registry]
    });

    this.ntruEncryptionsGauge = new Gauge({
      name: 'aurigraph_ntru_encryptions_per_sec',
      help: 'NTRU encryptions per second',
      registers: [this.registry]
    });

    this.zkProofsCounter = new Counter({
      name: 'aurigraph_zk_proofs_total',
      help: 'Total zero-knowledge proofs generated',
      labelNames: ['proof_type'],
      registers: [this.registry]
    });

    this.quantumSecurityLevelGauge = new Gauge({
      name: 'aurigraph_quantum_security_level',
      help: 'Current quantum security level (1-6)',
      registers: [this.registry]
    });

    // Node metrics
    this.nodeStatusGauge = new Gauge({
      name: 'aurigraph_node_status',
      help: 'Node operational status (1=up, 0=down)',
      labelNames: ['node_id', 'node_type'],
      registers: [this.registry]
    });

    this.peerConnectionsGauge = new Gauge({
      name: 'aurigraph_peer_connections',
      help: 'Number of peer connections',
      labelNames: ['node_id'],
      registers: [this.registry]
    });

    this.shardMetricsGauge = new Gauge({
      name: 'aurigraph_shard_metrics',
      help: 'Shard performance metrics',
      labelNames: ['shard_id', 'metric_type'],
      registers: [this.registry]
    });

    this.resourceUsageGauge = new Gauge({
      name: 'aurigraph_resource_usage',
      help: 'Node resource usage',
      labelNames: ['node_id', 'resource_type'],
      registers: [this.registry]
    });

    // Consensus metrics
    this.consensusRoundHistogram = new Histogram({
      name: 'aurigraph_consensus_round_duration_ms',
      help: 'Consensus round duration',
      labelNames: ['round_type'],
      buckets: [10, 25, 50, 100, 250, 500, 1000],
      registers: [this.registry]
    });

    this.leaderElectionCounter = new Counter({
      name: 'aurigraph_leader_elections_total',
      help: 'Total leader elections',
      labelNames: ['result'],
      registers: [this.registry]
    });

    this.validatorVotesGauge = new Gauge({
      name: 'aurigraph_validator_votes',
      help: 'Validator voting participation',
      labelNames: ['validator_id'],
      registers: [this.registry]
    });

    this.consensusLatencySummary = new Summary({
      name: 'aurigraph_consensus_latency_ms',
      help: 'Consensus latency summary',
      labelNames: ['phase'],
      percentiles: [0.5, 0.9, 0.95, 0.99],
      registers: [this.registry]
    });

    // Cross-chain metrics
    this.bridgeTransactionsCounter = new Counter({
      name: 'aurigraph_bridge_transactions_total',
      help: 'Total cross-chain bridge transactions',
      labelNames: ['source_chain', 'target_chain'],
      registers: [this.registry]
    });

    this.bridgeVolumeGauge = new Gauge({
      name: 'aurigraph_bridge_volume_usd',
      help: 'Bridge transaction volume in USD',
      labelNames: ['chain'],
      registers: [this.registry]
    });

    this.supportedChainsGauge = new Gauge({
      name: 'aurigraph_supported_chains',
      help: 'Number of supported blockchain bridges',
      registers: [this.registry]
    });

    // AI Optimizer metrics
    this.aiOptimizationsCounter = new Counter({
      name: 'aurigraph_ai_optimizations_total',
      help: 'Total AI optimizations applied',
      labelNames: ['optimization_type'],
      registers: [this.registry]
    });

    this.aiPerformanceGainGauge = new Gauge({
      name: 'aurigraph_ai_performance_gain_percent',
      help: 'AI optimization performance gain percentage',
      labelNames: ['metric_type'],
      registers: [this.registry]
    });

    this.aiPredictionsAccuracyGauge = new Gauge({
      name: 'aurigraph_ai_predictions_accuracy',
      help: 'AI predictions accuracy percentage',
      labelNames: ['prediction_type'],
      registers: [this.registry]
    });
  }

  // Update methods for platform metrics
  updateTPS(value: number, network = 'mainnet', shard = 'primary'): void {
    this.tpsGauge.set({ network, shard }, value);
  }

  recordTransactionLatency(latencyMs: number, type = 'standard', status = 'success'): void {
    this.latencyHistogram.observe({ type, status }, latencyMs);
  }

  updateActiveNodes(nodeType: string, count: number): void {
    this.activeNodesGauge.set({ node_type: nodeType }, count);
  }

  updateBlockHeight(height: number, chain = 'aurigraph'): void {
    this.blockHeightGauge.set({ chain }, height);
  }

  incrementTransactions(type = 'standard', status = 'success'): void {
    this.transactionCounter.inc({ type, status });
  }

  incrementErrors(component: string, errorType: string): void {
    this.errorCounter.inc({ component, error_type: errorType });
  }

  // Smart Contract metrics updates
  recordContractExecution(durationMs: number, contractType: string, method: string): void {
    this.contractExecutionHistogram.observe({ contract_type: contractType, method }, durationMs);
  }

  incrementContractsCreated(type: string, template = 'custom'): void {
    this.contractCreationCounter.inc({ type, template });
  }

  updateContractVerification(contractId: string, score: number): void {
    this.contractVerificationGauge.set({ contract_id: contractId }, score);
  }

  updateGovernanceProposals(status: string, count: number): void {
    this.governanceProposalsGauge.set({ status }, count);
  }

  // RWA metrics updates
  updateTokenizedAssets(assetClass: string, jurisdiction: string, count: number): void {
    this.tokenizedAssetsGauge.set({ asset_class: assetClass, jurisdiction }, count);
  }

  incrementAssetTransactions(assetClass: string, operation: string): void {
    this.assetTransactionCounter.inc({ asset_class: assetClass, operation });
  }

  updateComplianceScore(jurisdiction: string, assetClass: string, score: number): void {
    this.complianceScoreGauge.set({ jurisdiction, asset_class: assetClass }, score);
  }

  // Quantum Crypto metrics updates
  incrementQuantumOperations(algorithm: string, operation: string): void {
    this.quantumOperationsCounter.inc({ algorithm, operation });
  }

  updateNTRUEncryptions(rate: number): void {
    this.ntruEncryptionsGauge.set(rate);
  }

  incrementZKProofs(proofType: string): void {
    this.zkProofsCounter.inc({ proof_type: proofType });
  }

  updateQuantumSecurityLevel(level: number): void {
    this.quantumSecurityLevelGauge.set(level);
  }

  // Node metrics updates
  updateNodeStatus(nodeId: string, nodeType: string, status: boolean): void {
    this.nodeStatusGauge.set({ node_id: nodeId, node_type: nodeType }, status ? 1 : 0);
  }

  updatePeerConnections(nodeId: string, count: number): void {
    this.peerConnectionsGauge.set({ node_id: nodeId }, count);
  }

  updateShardMetrics(shardId: string, metricType: string, value: number): void {
    this.shardMetricsGauge.set({ shard_id: shardId, metric_type: metricType }, value);
  }

  updateResourceUsage(nodeId: string, resourceType: string, value: number): void {
    this.resourceUsageGauge.set({ node_id: nodeId, resource_type: resourceType }, value);
  }

  // Consensus metrics updates
  recordConsensusRound(durationMs: number, roundType = 'normal'): void {
    this.consensusRoundHistogram.observe({ round_type: roundType }, durationMs);
  }

  incrementLeaderElections(result: string): void {
    this.leaderElectionCounter.inc({ result });
  }

  updateValidatorVotes(validatorId: string, votes: number): void {
    this.validatorVotesGauge.set({ validator_id: validatorId }, votes);
  }

  recordConsensusLatency(latencyMs: number, phase: string): void {
    this.consensusLatencySummary.observe({ phase }, latencyMs);
  }

  // Cross-chain metrics updates
  incrementBridgeTransactions(sourceChain: string, targetChain: string): void {
    this.bridgeTransactionsCounter.inc({ source_chain: sourceChain, target_chain: targetChain });
  }

  updateBridgeVolume(chain: string, volumeUSD: number): void {
    this.bridgeVolumeGauge.set({ chain }, volumeUSD);
  }

  updateSupportedChains(count: number): void {
    this.supportedChainsGauge.set(count);
  }

  // AI Optimizer metrics updates
  incrementAIOptimizations(optimizationType: string): void {
    this.aiOptimizationsCounter.inc({ optimization_type: optimizationType });
  }

  updateAIPerformanceGain(metricType: string, gainPercent: number): void {
    this.aiPerformanceGainGauge.set({ metric_type: metricType }, gainPercent);
  }

  updateAIPredictionsAccuracy(predictionType: string, accuracy: number): void {
    this.aiPredictionsAccuracyGauge.set({ prediction_type: predictionType }, accuracy);
  }

  // Start Prometheus metrics server
  async start(port = 9090): Promise<void> {
    const app = express();
    
    // Metrics endpoint
    app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', this.registry.contentType);
        const metrics = await this.registry.metrics();
        res.end(metrics);
      } catch (error) {
        res.status(500).end(error instanceof Error ? error.message : 'Unknown error');
      }
    });

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    this.server = app.listen(port, () => {
      this.logger.info(`Prometheus metrics exporter started on port ${port}`);
      this.logger.info(`Metrics available at http://localhost:${port}/metrics`);
    });
  }

  // Stop metrics server
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve) => {
        this.server!.close(() => {
          this.logger.info('Prometheus metrics exporter stopped');
          resolve();
        });
      });
    }
  }

  // Get registry for custom metrics
  getRegistry(): Registry {
    return this.registry;
  }

  // Export metrics as JSON
  async getMetricsJSON(): Promise<any> {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics;
  }
}
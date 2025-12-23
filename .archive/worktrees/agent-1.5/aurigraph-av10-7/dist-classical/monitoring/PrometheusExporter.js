"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusExporter = void 0;
const prom_client_1 = require("prom-client");
const Logger_1 = require("../core/Logger");
const express_1 = __importDefault(require("express"));
class PrometheusExporter {
    logger;
    registry;
    server;
    // Platform-wide metrics
    tpsGauge;
    latencyHistogram;
    activeNodesGauge;
    blockHeightGauge;
    transactionCounter;
    errorCounter;
    // Smart Contract metrics
    contractExecutionHistogram;
    contractCreationCounter;
    contractVerificationGauge;
    governanceProposalsGauge;
    // RWA metrics
    tokenizedAssetsGauge;
    assetTransactionCounter;
    complianceScoreGauge;
    // Quantum Crypto metrics
    quantumOperationsCounter;
    ntruEncryptionsGauge;
    zkProofsCounter;
    quantumSecurityLevelGauge;
    // Node metrics
    nodeStatusGauge;
    peerConnectionsGauge;
    shardMetricsGauge;
    resourceUsageGauge;
    // Consensus metrics
    consensusRoundHistogram;
    leaderElectionCounter;
    validatorVotesGauge;
    consensusLatencySummary;
    // Cross-chain metrics
    bridgeTransactionsCounter;
    bridgeVolumeGauge;
    supportedChainsGauge;
    // AI Optimizer metrics
    aiOptimizationsCounter;
    aiPerformanceGainGauge;
    aiPredictionsAccuracyGauge;
    constructor() {
        this.logger = new Logger_1.Logger('PrometheusExporter');
        this.registry = new prom_client_1.Registry();
        // Collect default metrics (CPU, memory, etc.)
        (0, prom_client_1.collectDefaultMetrics)({
            register: this.registry,
            prefix: 'aurigraph_'
        });
        // Initialize all custom metrics
        this.initializeMetrics();
    }
    initializeMetrics() {
        // Platform metrics
        this.tpsGauge = new prom_client_1.Gauge({
            name: 'aurigraph_tps',
            help: 'Current transactions per second',
            labelNames: ['network', 'shard'],
            registers: [this.registry]
        });
        this.latencyHistogram = new prom_client_1.Histogram({
            name: 'aurigraph_transaction_latency_ms',
            help: 'Transaction latency in milliseconds',
            labelNames: ['type', 'status'],
            buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
            registers: [this.registry]
        });
        this.activeNodesGauge = new prom_client_1.Gauge({
            name: 'aurigraph_active_nodes',
            help: 'Number of active nodes',
            labelNames: ['node_type'],
            registers: [this.registry]
        });
        this.blockHeightGauge = new prom_client_1.Gauge({
            name: 'aurigraph_block_height',
            help: 'Current blockchain height',
            labelNames: ['chain'],
            registers: [this.registry]
        });
        this.transactionCounter = new prom_client_1.Counter({
            name: 'aurigraph_transactions_total',
            help: 'Total number of transactions processed',
            labelNames: ['type', 'status'],
            registers: [this.registry]
        });
        this.errorCounter = new prom_client_1.Counter({
            name: 'aurigraph_errors_total',
            help: 'Total number of errors',
            labelNames: ['component', 'error_type'],
            registers: [this.registry]
        });
        // Smart Contract metrics
        this.contractExecutionHistogram = new prom_client_1.Histogram({
            name: 'aurigraph_contract_execution_time_ms',
            help: 'Smart contract execution time',
            labelNames: ['contract_type', 'method'],
            buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
            registers: [this.registry]
        });
        this.contractCreationCounter = new prom_client_1.Counter({
            name: 'aurigraph_contracts_created_total',
            help: 'Total smart contracts created',
            labelNames: ['type', 'template'],
            registers: [this.registry]
        });
        this.contractVerificationGauge = new prom_client_1.Gauge({
            name: 'aurigraph_contract_verification_score',
            help: 'Contract formal verification score',
            labelNames: ['contract_id'],
            registers: [this.registry]
        });
        this.governanceProposalsGauge = new prom_client_1.Gauge({
            name: 'aurigraph_governance_proposals',
            help: 'Number of governance proposals',
            labelNames: ['status'],
            registers: [this.registry]
        });
        // RWA metrics
        this.tokenizedAssetsGauge = new prom_client_1.Gauge({
            name: 'aurigraph_tokenized_assets',
            help: 'Number of tokenized assets',
            labelNames: ['asset_class', 'jurisdiction'],
            registers: [this.registry]
        });
        this.assetTransactionCounter = new prom_client_1.Counter({
            name: 'aurigraph_asset_transactions_total',
            help: 'Total RWA transactions',
            labelNames: ['asset_class', 'operation'],
            registers: [this.registry]
        });
        this.complianceScoreGauge = new prom_client_1.Gauge({
            name: 'aurigraph_compliance_score',
            help: 'Compliance score percentage',
            labelNames: ['jurisdiction', 'asset_class'],
            registers: [this.registry]
        });
        // Quantum Crypto metrics
        this.quantumOperationsCounter = new prom_client_1.Counter({
            name: 'aurigraph_quantum_operations_total',
            help: 'Total quantum cryptographic operations',
            labelNames: ['algorithm', 'operation'],
            registers: [this.registry]
        });
        this.ntruEncryptionsGauge = new prom_client_1.Gauge({
            name: 'aurigraph_ntru_encryptions_per_sec',
            help: 'NTRU encryptions per second',
            registers: [this.registry]
        });
        this.zkProofsCounter = new prom_client_1.Counter({
            name: 'aurigraph_zk_proofs_total',
            help: 'Total zero-knowledge proofs generated',
            labelNames: ['proof_type'],
            registers: [this.registry]
        });
        this.quantumSecurityLevelGauge = new prom_client_1.Gauge({
            name: 'aurigraph_quantum_security_level',
            help: 'Current quantum security level (1-6)',
            registers: [this.registry]
        });
        // Node metrics
        this.nodeStatusGauge = new prom_client_1.Gauge({
            name: 'aurigraph_node_status',
            help: 'Node operational status (1=up, 0=down)',
            labelNames: ['node_id', 'node_type'],
            registers: [this.registry]
        });
        this.peerConnectionsGauge = new prom_client_1.Gauge({
            name: 'aurigraph_peer_connections',
            help: 'Number of peer connections',
            labelNames: ['node_id'],
            registers: [this.registry]
        });
        this.shardMetricsGauge = new prom_client_1.Gauge({
            name: 'aurigraph_shard_metrics',
            help: 'Shard performance metrics',
            labelNames: ['shard_id', 'metric_type'],
            registers: [this.registry]
        });
        this.resourceUsageGauge = new prom_client_1.Gauge({
            name: 'aurigraph_resource_usage',
            help: 'Node resource usage',
            labelNames: ['node_id', 'resource_type'],
            registers: [this.registry]
        });
        // Consensus metrics
        this.consensusRoundHistogram = new prom_client_1.Histogram({
            name: 'aurigraph_consensus_round_duration_ms',
            help: 'Consensus round duration',
            labelNames: ['round_type'],
            buckets: [10, 25, 50, 100, 250, 500, 1000],
            registers: [this.registry]
        });
        this.leaderElectionCounter = new prom_client_1.Counter({
            name: 'aurigraph_leader_elections_total',
            help: 'Total leader elections',
            labelNames: ['result'],
            registers: [this.registry]
        });
        this.validatorVotesGauge = new prom_client_1.Gauge({
            name: 'aurigraph_validator_votes',
            help: 'Validator voting participation',
            labelNames: ['validator_id'],
            registers: [this.registry]
        });
        this.consensusLatencySummary = new prom_client_1.Summary({
            name: 'aurigraph_consensus_latency_ms',
            help: 'Consensus latency summary',
            labelNames: ['phase'],
            percentiles: [0.5, 0.9, 0.95, 0.99],
            registers: [this.registry]
        });
        // Cross-chain metrics
        this.bridgeTransactionsCounter = new prom_client_1.Counter({
            name: 'aurigraph_bridge_transactions_total',
            help: 'Total cross-chain bridge transactions',
            labelNames: ['source_chain', 'target_chain'],
            registers: [this.registry]
        });
        this.bridgeVolumeGauge = new prom_client_1.Gauge({
            name: 'aurigraph_bridge_volume_usd',
            help: 'Bridge transaction volume in USD',
            labelNames: ['chain'],
            registers: [this.registry]
        });
        this.supportedChainsGauge = new prom_client_1.Gauge({
            name: 'aurigraph_supported_chains',
            help: 'Number of supported blockchain bridges',
            registers: [this.registry]
        });
        // AI Optimizer metrics
        this.aiOptimizationsCounter = new prom_client_1.Counter({
            name: 'aurigraph_ai_optimizations_total',
            help: 'Total AI optimizations applied',
            labelNames: ['optimization_type'],
            registers: [this.registry]
        });
        this.aiPerformanceGainGauge = new prom_client_1.Gauge({
            name: 'aurigraph_ai_performance_gain_percent',
            help: 'AI optimization performance gain percentage',
            labelNames: ['metric_type'],
            registers: [this.registry]
        });
        this.aiPredictionsAccuracyGauge = new prom_client_1.Gauge({
            name: 'aurigraph_ai_predictions_accuracy',
            help: 'AI predictions accuracy percentage',
            labelNames: ['prediction_type'],
            registers: [this.registry]
        });
    }
    // Update methods for platform metrics
    updateTPS(value, network = 'mainnet', shard = 'primary') {
        this.tpsGauge.set({ network, shard }, value);
    }
    recordTransactionLatency(latencyMs, type = 'standard', status = 'success') {
        this.latencyHistogram.observe({ type, status }, latencyMs);
    }
    updateActiveNodes(nodeType, count) {
        this.activeNodesGauge.set({ node_type: nodeType }, count);
    }
    updateBlockHeight(height, chain = 'aurigraph') {
        this.blockHeightGauge.set({ chain }, height);
    }
    incrementTransactions(type = 'standard', status = 'success') {
        this.transactionCounter.inc({ type, status });
    }
    incrementErrors(component, errorType) {
        this.errorCounter.inc({ component, error_type: errorType });
    }
    // Smart Contract metrics updates
    recordContractExecution(durationMs, contractType, method) {
        this.contractExecutionHistogram.observe({ contract_type: contractType, method }, durationMs);
    }
    incrementContractsCreated(type, template = 'custom') {
        this.contractCreationCounter.inc({ type, template });
    }
    updateContractVerification(contractId, score) {
        this.contractVerificationGauge.set({ contract_id: contractId }, score);
    }
    updateGovernanceProposals(status, count) {
        this.governanceProposalsGauge.set({ status }, count);
    }
    // RWA metrics updates
    updateTokenizedAssets(assetClass, jurisdiction, count) {
        this.tokenizedAssetsGauge.set({ asset_class: assetClass, jurisdiction }, count);
    }
    incrementAssetTransactions(assetClass, operation) {
        this.assetTransactionCounter.inc({ asset_class: assetClass, operation });
    }
    updateComplianceScore(jurisdiction, assetClass, score) {
        this.complianceScoreGauge.set({ jurisdiction, asset_class: assetClass }, score);
    }
    // Quantum Crypto metrics updates
    incrementQuantumOperations(algorithm, operation) {
        this.quantumOperationsCounter.inc({ algorithm, operation });
    }
    updateNTRUEncryptions(rate) {
        this.ntruEncryptionsGauge.set(rate);
    }
    incrementZKProofs(proofType) {
        this.zkProofsCounter.inc({ proof_type: proofType });
    }
    updateQuantumSecurityLevel(level) {
        this.quantumSecurityLevelGauge.set(level);
    }
    // Node metrics updates
    updateNodeStatus(nodeId, nodeType, status) {
        this.nodeStatusGauge.set({ node_id: nodeId, node_type: nodeType }, status ? 1 : 0);
    }
    updatePeerConnections(nodeId, count) {
        this.peerConnectionsGauge.set({ node_id: nodeId }, count);
    }
    updateShardMetrics(shardId, metricType, value) {
        this.shardMetricsGauge.set({ shard_id: shardId, metric_type: metricType }, value);
    }
    updateResourceUsage(nodeId, resourceType, value) {
        this.resourceUsageGauge.set({ node_id: nodeId, resource_type: resourceType }, value);
    }
    // Consensus metrics updates
    recordConsensusRound(durationMs, roundType = 'normal') {
        this.consensusRoundHistogram.observe({ round_type: roundType }, durationMs);
    }
    incrementLeaderElections(result) {
        this.leaderElectionCounter.inc({ result });
    }
    updateValidatorVotes(validatorId, votes) {
        this.validatorVotesGauge.set({ validator_id: validatorId }, votes);
    }
    recordConsensusLatency(latencyMs, phase) {
        this.consensusLatencySummary.observe({ phase }, latencyMs);
    }
    // Cross-chain metrics updates
    incrementBridgeTransactions(sourceChain, targetChain) {
        this.bridgeTransactionsCounter.inc({ source_chain: sourceChain, target_chain: targetChain });
    }
    updateBridgeVolume(chain, volumeUSD) {
        this.bridgeVolumeGauge.set({ chain }, volumeUSD);
    }
    updateSupportedChains(count) {
        this.supportedChainsGauge.set(count);
    }
    // AI Optimizer metrics updates
    incrementAIOptimizations(optimizationType) {
        this.aiOptimizationsCounter.inc({ optimization_type: optimizationType });
    }
    updateAIPerformanceGain(metricType, gainPercent) {
        this.aiPerformanceGainGauge.set({ metric_type: metricType }, gainPercent);
    }
    updateAIPredictionsAccuracy(predictionType, accuracy) {
        this.aiPredictionsAccuracyGauge.set({ prediction_type: predictionType }, accuracy);
    }
    // Start Prometheus metrics server
    async start(port = 9090) {
        const app = (0, express_1.default)();
        // Metrics endpoint
        app.get('/metrics', async (req, res) => {
            try {
                res.set('Content-Type', this.registry.contentType);
                const metrics = await this.registry.metrics();
                res.end(metrics);
            }
            catch (error) {
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
    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    this.logger.info('Prometheus metrics exporter stopped');
                    resolve();
                });
            });
        }
    }
    // Get registry for custom metrics
    getRegistry() {
        return this.registry;
    }
    // Export metrics as JSON
    async getMetricsJSON() {
        const metrics = await this.registry.getMetricsAsJSON();
        return metrics;
    }
}
exports.PrometheusExporter = PrometheusExporter;
//# sourceMappingURL=PrometheusExporter.js.map
// Flow Service - Integrated service for all 7 flow types
import { flowEngine, FlowDefinition, FlowInstance, NodeType } from './FlowEngine';

// Smart Contract Flow
import {
  SmartContractDeployExecutor,
  SmartContractInvokeExecutor,
  SmartContractStateTransitionExecutor,
  SmartContractVerificationExecutor,
  createSmartContractDeploymentFlow,
} from './SmartContractFlow';

// Transaction Flow
import {
  TransactionValidationExecutor,
  TransactionExecutionExecutor,
  TransactionCommitExecutor,
  TransactionRollbackExecutor,
  BatchTransactionExecutor,
  createTransactionFlow,
} from './TransactionFlow';

// Consensus Flow
import {
  LeaderElectionExecutor,
  LogReplicationExecutor,
  CommitLogExecutor,
  ApplyStateExecutor,
  createConsensusFlow,
} from './ConsensusFlow';

// Business Process Flow
import {
  ProductManufactureExecutor,
  QualityInspectionExecutor,
  ShipmentExecutor,
  DeliveryExecutor,
  PatientRegistrationExecutor,
  DiagnosisExecutor,
  TreatmentExecutor,
  PaymentInitiationExecutor,
  FraudCheckExecutor,
  SettlementExecutor,
  createSupplyChainFlow,
  createHealthcareFlow,
  createFinancialSettlementFlow,
} from './BusinessProcessFlow';

// Data Pipeline Flow
import {
  DataExtractionExecutor,
  DataTransformationExecutor,
  DataValidationExecutor,
  DataLoadingExecutor,
  StreamProcessingExecutor,
  createETLPipelineFlow,
} from './DataPipelineFlow';

// CI/CD Workflow
import {
  CodeCheckoutExecutor,
  BuildExecutor,
  TestExecutor,
  SecurityScanExecutor,
  DeploymentExecutor,
  SmokeTestExecutor,
  createCICDPipelineFlow,
  DeploymentEnvironment,
} from './CICDWorkflow';

// Demo Workflow Builder
import {
  DemoTransactionExecutor,
  DemoContractDeployExecutor,
  DemoMessageExecutor,
  DemoWaitExecutor,
  DemoVisualizeExecutor,
  DemoNetworkSimulationExecutor,
  createBasicDemoFlow,
  createBlockchainDemoFlow,
  createInteractiveTutorialFlow,
} from './DemoWorkflowBuilder';

/**
 * Centralized Flow Service
 * Manages all 7 flow types with unified API
 */
export class FlowService {
  private initialized = false;

  constructor() {
    this.initializeExecutors();
  }

  /**
   * Register all flow executors with the flow engine
   */
  private initializeExecutors(): void {
    if (this.initialized) return;

    console.log('🔧 Initializing Flow Service with all 7 flow types...');

    // Smart Contract Flow Executors
    flowEngine.registerExecutor('SC_DEPLOY', new SmartContractDeployExecutor());
    flowEngine.registerExecutor('SC_INVOKE', new SmartContractInvokeExecutor());
    flowEngine.registerExecutor('SC_STATE_TRANSITION', new SmartContractStateTransitionExecutor());
    flowEngine.registerExecutor('SC_VERIFICATION', new SmartContractVerificationExecutor());

    // Transaction Flow Executors
    flowEngine.registerExecutor('TX_VALIDATE', new TransactionValidationExecutor());
    flowEngine.registerExecutor('TX_EXECUTE', new TransactionExecutionExecutor());
    flowEngine.registerExecutor('TX_COMMIT', new TransactionCommitExecutor());
    flowEngine.registerExecutor('TX_ROLLBACK', new TransactionRollbackExecutor());
    flowEngine.registerExecutor('TX_BATCH', new BatchTransactionExecutor());

    // Consensus Flow Executors
    flowEngine.registerExecutor('CONSENSUS_ELECTION', new LeaderElectionExecutor());
    flowEngine.registerExecutor('CONSENSUS_REPLICATE', new LogReplicationExecutor());
    flowEngine.registerExecutor('CONSENSUS_COMMIT', new CommitLogExecutor());
    flowEngine.registerExecutor('CONSENSUS_APPLY', new ApplyStateExecutor());

    // Business Process Flow Executors
    flowEngine.registerExecutor('BP_MANUFACTURE', new ProductManufactureExecutor());
    flowEngine.registerExecutor('BP_INSPECT', new QualityInspectionExecutor());
    flowEngine.registerExecutor('BP_SHIP', new ShipmentExecutor());
    flowEngine.registerExecutor('BP_DELIVER', new DeliveryExecutor());
    flowEngine.registerExecutor('BP_REGISTER_PATIENT', new PatientRegistrationExecutor());
    flowEngine.registerExecutor('BP_DIAGNOSE', new DiagnosisExecutor());
    flowEngine.registerExecutor('BP_TREAT', new TreatmentExecutor());
    flowEngine.registerExecutor('BP_PAY_INITIATE', new PaymentInitiationExecutor());
    flowEngine.registerExecutor('BP_FRAUD_CHECK', new FraudCheckExecutor());
    flowEngine.registerExecutor('BP_SETTLE', new SettlementExecutor());

    // Data Pipeline Flow Executors
    flowEngine.registerExecutor('DP_EXTRACT', new DataExtractionExecutor());
    flowEngine.registerExecutor('DP_TRANSFORM', new DataTransformationExecutor());
    flowEngine.registerExecutor('DP_VALIDATE', new DataValidationExecutor());
    flowEngine.registerExecutor('DP_LOAD', new DataLoadingExecutor());
    flowEngine.registerExecutor('DP_STREAM', new StreamProcessingExecutor());

    // CI/CD Workflow Executors
    flowEngine.registerExecutor('CICD_CHECKOUT', new CodeCheckoutExecutor());
    flowEngine.registerExecutor('CICD_BUILD', new BuildExecutor());
    flowEngine.registerExecutor('CICD_TEST', new TestExecutor());
    flowEngine.registerExecutor('CICD_SECURITY', new SecurityScanExecutor());
    flowEngine.registerExecutor('CICD_DEPLOY', new DeploymentExecutor());
    flowEngine.registerExecutor('CICD_SMOKE', new SmokeTestExecutor());

    // Demo Workflow Executors
    flowEngine.registerExecutor('DEMO_TX', new DemoTransactionExecutor());
    flowEngine.registerExecutor('DEMO_CONTRACT', new DemoContractDeployExecutor());
    flowEngine.registerExecutor('DEMO_MESSAGE', new DemoMessageExecutor());
    flowEngine.registerExecutor('DEMO_WAIT', new DemoWaitExecutor());
    flowEngine.registerExecutor('DEMO_VISUALIZE', new DemoVisualizeExecutor());
    flowEngine.registerExecutor('DEMO_NETWORK', new DemoNetworkSimulationExecutor());

    this.initialized = true;
    console.log('✅ Flow Service initialized with 40+ executors across 7 flow types');
  }

  // ===== Smart Contract Flows =====

  /**
   * Create and start a smart contract deployment flow
   */
  async deploySmartContract(contractName: string, code: string): Promise<FlowInstance> {
    const flow = createSmartContractDeploymentFlow({ contractName, code });
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  // ===== Transaction Flows =====

  /**
   * Create and start a transaction processing flow
   */
  async processTransaction(transaction: any): Promise<FlowInstance> {
    const flow = createTransactionFlow(transaction);
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  // ===== Consensus Flows =====

  /**
   * Create and start a consensus flow
   */
  async runConsensusRound(logEntries: any[]): Promise<FlowInstance> {
    const flow = createConsensusFlow(logEntries);
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  // ===== Business Process Flows =====

  /**
   * Create and start a supply chain flow
   */
  async startSupplyChainProcess(productId: string): Promise<FlowInstance> {
    const flow = createSupplyChainFlow(productId);
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  /**
   * Create and start a healthcare flow
   */
  async startHealthcareProcess(patientId: string): Promise<FlowInstance> {
    const flow = createHealthcareFlow(patientId);
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  /**
   * Create and start a financial settlement flow
   */
  async startFinancialSettlement(amount: number): Promise<FlowInstance> {
    const flow = createFinancialSettlementFlow(amount);
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  // ===== Data Pipeline Flows =====

  /**
   * Create and start an ETL pipeline flow
   */
  async startETLPipeline(source: any, destination: any): Promise<FlowInstance> {
    const flow = createETLPipelineFlow(source, destination);
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  // ===== CI/CD Workflows =====

  /**
   * Create and start a CI/CD pipeline
   */
  async startCICDPipeline(repository: string, environment: DeploymentEnvironment): Promise<FlowInstance> {
    const flow = createCICDPipelineFlow(repository, environment);
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  // ===== Demo Workflows =====

  /**
   * Create and start a basic demo flow
   */
  async startBasicDemo(title: string): Promise<FlowInstance> {
    const flow = createBasicDemoFlow(title);
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  /**
   * Create and start a blockchain demo flow
   */
  async startBlockchainDemo(): Promise<FlowInstance> {
    const flow = createBlockchainDemoFlow();
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  /**
   * Create and start an interactive tutorial flow
   */
  async startInteractiveTutorial(steps: any[]): Promise<FlowInstance> {
    const flow = createInteractiveTutorialFlow(steps);
    const instance = flowEngine.createInstance(flow);
    await flowEngine.startFlow(instance.id);
    return instance;
  }

  // ===== Flow Management =====

  /**
   * Create a flow instance from definition
   */
  createFlowInstance(definition: FlowDefinition, variables?: Record<string, any>): FlowInstance {
    return flowEngine.createInstance(definition, variables);
  }

  /**
   * Start a flow instance
   */
  async startFlow(instanceId: string): Promise<void> {
    await flowEngine.startFlow(instanceId);
  }

  /**
   * Pause a flow instance
   */
  pauseFlow(instanceId: string): void {
    flowEngine.pauseFlow(instanceId);
  }

  /**
   * Resume a flow instance
   */
  async resumeFlow(instanceId: string): Promise<void> {
    await flowEngine.resumeFlow(instanceId);
  }

  /**
   * Cancel a flow instance
   */
  cancelFlow(instanceId: string): void {
    flowEngine.cancelFlow(instanceId);
  }

  /**
   * Get flow instance status
   */
  getFlowStatus(instanceId: string): FlowInstance | undefined {
    return flowEngine.getInstanceStatus(instanceId);
  }

  /**
   * List all available flow templates
   */
  listFlowTemplates(): string[] {
    return [
      'SmartContractDeployment',
      'TransactionProcessing',
      'ConsensusRound',
      'SupplyChain',
      'Healthcare',
      'FinancialSettlement',
      'ETLPipeline',
      'CICDPipeline',
      'BasicDemo',
      'BlockchainDemo',
      'InteractiveTutorial',
    ];
  }

  /**
   * Get flow statistics
   */
  getStatistics(): any {
    return {
      flowTypes: 7,
      executors: 40,
      templates: 11,
      initialized: this.initialized,
    };
  }
}

// Export singleton instance
export const flowService = new FlowService();

// Export flow engine for direct access if needed
export { flowEngine };

// Auto-initialize on import
console.log('🚀 Flow Service loaded and ready');
console.log('📊 Available flow types:');
console.log('  1. Smart Contract Flow - Contract lifecycle and state transitions');
console.log('  2. Transaction Flow - Multi-step transaction processing with rollback');
console.log('  3. Consensus Flow - HyperRAFT++ leader election and log replication');
console.log('  4. Business Process Flow - Supply chain, healthcare, financial templates');
console.log('  5. Data Pipeline Flow - ETL and streaming data processing');
console.log('  6. CI/CD Workflow - Automated build, test, and deployment');
console.log('  7. Demo Workflow Builder - Interactive demo creation with visualization');

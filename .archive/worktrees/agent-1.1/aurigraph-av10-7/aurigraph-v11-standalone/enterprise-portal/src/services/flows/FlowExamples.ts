// Flow Examples - Demonstrations of all 7 flow types
import { flowService } from './FlowService';
import { DeploymentEnvironment } from './CICDWorkflow';

/**
 * Example 1: Smart Contract Deployment Flow
 */
export async function exampleSmartContractFlow() {
  console.log('\n========== Example 1: Smart Contract Deployment ==========');

  const instance = await flowService.deploySmartContract(
    'TokenContract',
    'contract Token { ... }'
  );

  console.log(`Flow Instance ID: ${instance.id}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Execution History: ${instance.executionHistory.length} steps`);

  return instance;
}

/**
 * Example 2: Transaction Processing Flow
 */
export async function exampleTransactionFlow() {
  console.log('\n========== Example 2: Transaction Processing ==========');

  const transaction = {
    id: `tx_${Date.now()}`,
    type: 'transfer',
    from: '0xabc123',
    to: '0xdef456',
    amount: 100,
    nonce: 1,
    signature: '0xsignature',
  };

  const instance = await flowService.processTransaction(transaction);

  console.log(`Transaction Flow Instance: ${instance.id}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Validation Result:`, instance.variables.validationResults);
  console.log(`Execution Result:`, instance.variables.executionResult);

  return instance;
}

/**
 * Example 3: Consensus Flow (HyperRAFT++)
 */
export async function exampleConsensusFlow() {
  console.log('\n========== Example 3: Consensus Flow (HyperRAFT++) ==========');

  const logEntries = [
    { term: 1, index: 1, command: 'CREATE_ACCOUNT', timestamp: new Date() },
    { term: 1, index: 2, command: 'TRANSFER_FUNDS', timestamp: new Date() },
    { term: 1, index: 3, command: 'UPDATE_BALANCE', timestamp: new Date() },
  ];

  const instance = await flowService.runConsensusRound(logEntries);

  console.log(`Consensus Flow Instance: ${instance.id}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Role:`, instance.variables.role);
  console.log(`Current Term:`, instance.variables.currentTerm);
  console.log(`Leader ID:`, instance.variables.leaderId || 'None');

  return instance;
}

/**
 * Example 4: Business Process - Supply Chain Flow
 */
export async function exampleSupplyChainFlow() {
  console.log('\n========== Example 4: Supply Chain Flow ==========');

  const productId = `prod_${Date.now()}`;
  const instance = await flowService.startSupplyChainProcess(productId);

  console.log(`Supply Chain Flow Instance: ${instance.id}`);
  console.log(`Product ID: ${productId}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Quality Check:`, instance.variables.qualityCheck);
  console.log(`Tracking ID:`, instance.variables.trackingId);

  return instance;
}

/**
 * Example 5: Business Process - Healthcare Flow
 */
export async function exampleHealthcareFlow() {
  console.log('\n========== Example 5: Healthcare Flow ==========');

  const patientId = `patient_${Date.now()}`;
  const instance = await flowService.startHealthcareProcess(patientId);

  console.log(`Healthcare Flow Instance: ${instance.id}`);
  console.log(`Patient ID: ${patientId}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Diagnosis:`, instance.variables.diagnosis);
  console.log(`Treatment Complete:`, instance.variables.treatmentComplete);

  return instance;
}

/**
 * Example 6: Business Process - Financial Settlement Flow
 */
export async function exampleFinancialFlow() {
  console.log('\n========== Example 6: Financial Settlement Flow ==========');

  const amount = 10000;
  const instance = await flowService.startFinancialSettlement(amount);

  console.log(`Financial Settlement Flow Instance: ${instance.id}`);
  console.log(`Amount: $${amount}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Payment ID:`, instance.variables.paymentId);
  console.log(`Fraud Check:`, instance.variables.fraudCheck ? 'PASSED' : 'FAILED');
  console.log(`Settled:`, instance.variables.settled);

  return instance;
}

/**
 * Example 7: Data Pipeline - ETL Flow
 */
export async function exampleETLPipelineFlow() {
  console.log('\n========== Example 7: ETL Data Pipeline Flow ==========');

  const source = { type: 'database', config: { connection: 'postgresql://...' } };
  const destination = { type: 'database', config: { connection: 'mongodb://...' } };

  const instance = await flowService.startETLPipeline(source, destination);

  console.log(`ETL Pipeline Flow Instance: ${instance.id}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Records Extracted:`, instance.variables.recordCount);
  console.log(`Records Transformed:`, instance.variables.transformedData?.length);
  console.log(`Validation Result:`, instance.variables.validationResult);
  console.log(`Load Result:`, instance.variables.loadResult);

  return instance;
}

/**
 * Example 8: CI/CD Pipeline Flow
 */
export async function exampleCICDFlow() {
  console.log('\n========== Example 8: CI/CD Pipeline Flow ==========');

  const repository = 'https://github.com/example/project';
  const environment = DeploymentEnvironment.STAGING;

  const instance = await flowService.startCICDPipeline(repository, environment);

  console.log(`CI/CD Pipeline Flow Instance: ${instance.id}`);
  console.log(`Repository: ${repository}`);
  console.log(`Target Environment: ${environment}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Commit:`, instance.variables.commit?.hash.substr(0, 8));
  console.log(`Build Result:`, instance.variables.buildResult);
  console.log(`Test Result:`, instance.variables.testResult);
  console.log(`Deployment:`, instance.variables.deployment);

  return instance;
}

/**
 * Example 9: Demo Workflow - Basic Demo
 */
export async function exampleBasicDemoFlow() {
  console.log('\n========== Example 9: Basic Demo Workflow ==========');

  const instance = await flowService.startBasicDemo('Getting Started with Aurigraph');

  console.log(`Basic Demo Flow Instance: ${instance.id}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Demo Transactions:`, instance.variables.demoTransactions?.length);
  console.log(`Visualization:`, instance.variables.currentVisualization);

  return instance;
}

/**
 * Example 10: Demo Workflow - Blockchain Demo
 */
export async function exampleBlockchainDemoFlow() {
  console.log('\n========== Example 10: Blockchain Demo Workflow ==========');

  const instance = await flowService.startBlockchainDemo();

  console.log(`Blockchain Demo Flow Instance: ${instance.id}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Network Simulation:`, instance.variables.networkSimulation);
  console.log(`Demo Contract:`, instance.variables.demoContract);
  console.log(`Demo Transactions:`, instance.variables.demoTransactions?.length);

  return instance;
}

/**
 * Example 11: Demo Workflow - Interactive Tutorial
 */
export async function exampleInteractiveTutorialFlow() {
  console.log('\n========== Example 11: Interactive Tutorial Workflow ==========');

  const tutorialSteps = [
    {
      id: 'step1',
      title: 'Introduction',
      description: 'Welcome to Aurigraph platform',
      action: 'SHOW_MESSAGE',
      config: { message: 'Welcome!', duration: 2000 },
    },
    {
      id: 'step2',
      title: 'Create Network',
      description: 'Set up a blockchain network',
      action: 'SIMULATE_NETWORK',
      config: { nodeCount: 3 },
    },
    {
      id: 'step3',
      title: 'Deploy Contract',
      description: 'Deploy your first smart contract',
      action: 'DEPLOY_CONTRACT',
      config: { contractName: 'HelloWorld' },
    },
    {
      id: 'step4',
      title: 'Create Transactions',
      description: 'Generate sample transactions',
      action: 'CREATE_TRANSACTION',
      config: { transactionCount: 5 },
    },
    {
      id: 'step5',
      title: 'Visualize Results',
      description: 'View transaction flow',
      action: 'VISUALIZE_DATA',
      config: { type: 'timeline' },
    },
  ];

  const instance = await flowService.startInteractiveTutorial(tutorialSteps);

  console.log(`Interactive Tutorial Flow Instance: ${instance.id}`);
  console.log(`Status: ${instance.status}`);
  console.log(`Steps Completed:`, instance.executionHistory.length);

  return instance;
}

/**
 * Run all flow examples
 */
export async function runAllFlowExamples() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║        Aurigraph Flow Skills - Complete Demonstration     ║');
  console.log('║                All 7 Flow Types + 11 Examples             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const results = [];

  try {
    results.push(await exampleSmartContractFlow());
    results.push(await exampleTransactionFlow());
    results.push(await exampleConsensusFlow());
    results.push(await exampleSupplyChainFlow());
    results.push(await exampleHealthcareFlow());
    results.push(await exampleFinancialFlow());
    results.push(await exampleETLPipelineFlow());
    results.push(await exampleCICDFlow());
    results.push(await exampleBasicDemoFlow());
    results.push(await exampleBlockchainDemoFlow());
    results.push(await exampleInteractiveTutorialFlow());

    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                 All Examples Completed!                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log(`Total Flows Executed: ${results.length}`);
    console.log(`Successful: ${results.filter((r) => r.status === 'COMPLETED').length}`);
    console.log(`Failed: ${results.filter((r) => r.status === 'FAILED').length}`);

    console.log('\n📊 Flow Statistics:');
    console.log(flowService.getStatistics());

    return results;
  } catch (error) {
    console.error('Error running flow examples:', error);
    throw error;
  }
}

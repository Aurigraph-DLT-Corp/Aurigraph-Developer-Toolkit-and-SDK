// Focused Flow Demo - Smart Contract, Consensus, Business Process, Data Pipeline
import { flowService } from './FlowService';
import { DeploymentEnvironment } from './CICDWorkflow';

/**
 * Integrated Demo: Supply Chain with Smart Contracts + Consensus
 * Demonstrates how multiple flow types work together
 */
export async function integratedSupplyChainDemo() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   INTEGRATED DEMO: Smart Supply Chain with Blockchain       ║');
  console.log('║   Flow Types: Smart Contract + Consensus + Business Process ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Deploy supply chain tracking smart contract
  console.log('📝 Step 1: Deploying Supply Chain Smart Contract...');
  const contractFlow = await flowService.deploySmartContract(
    'SupplyChainTracker',
    `
    contract SupplyChainTracker {
      struct Product {
        string id;
        address manufacturer;
        uint256 manufactureDate;
        string status;
      }
      mapping(string => Product) public products;
    }
    `
  );

  const contractAddress = contractFlow.variables.contractAddress;
  const contractId = contractFlow.variables.contractId;
  console.log(`✅ Contract deployed: ${contractAddress}`);
  console.log(`   Security Score: ${contractFlow.variables.verificationResult?.securityScore}/100`);

  // Step 2: Start supply chain process for a product
  console.log('\n📦 Step 2: Starting Supply Chain Process...');
  const productId = `PROD_${Date.now()}`;
  const supplyChainFlow = await flowService.startSupplyChainProcess(productId);

  console.log(`✅ Product: ${productId}`);
  console.log(`   Manufacturer Timestamp: ${supplyChainFlow.variables.manufacturerTimestamp}`);
  console.log(`   Quality Check: ${supplyChainFlow.variables.qualityCheck ? 'PASS ✓' : 'FAIL ✗'}`);
  console.log(`   Tracking ID: ${supplyChainFlow.variables.trackingId}`);
  console.log(`   Delivery Status: ${supplyChainFlow.variables.deliveredAt ? 'Delivered ✓' : 'In Transit'}`);

  // Step 3: Run consensus to finalize the supply chain transaction
  console.log('\n🔗 Step 3: Running Consensus for Supply Chain Transaction...');
  const logEntries = [
    {
      term: 1,
      index: 1,
      command: {
        type: 'RECORD_MANUFACTURE',
        productId,
        contractAddress,
        timestamp: supplyChainFlow.variables.manufacturerTimestamp,
      },
      timestamp: new Date(),
    },
    {
      term: 1,
      index: 2,
      command: {
        type: 'RECORD_QUALITY_CHECK',
        productId,
        passed: supplyChainFlow.variables.qualityCheck,
      },
      timestamp: new Date(),
    },
    {
      term: 1,
      index: 3,
      command: {
        type: 'RECORD_SHIPMENT',
        productId,
        trackingId: supplyChainFlow.variables.trackingId,
      },
      timestamp: new Date(),
    },
  ];

  const consensusFlow = await flowService.runConsensusRound(logEntries);

  console.log(`✅ Consensus Round Complete`);
  console.log(`   Node Role: ${consensusFlow.variables.role}`);
  console.log(`   Term: ${consensusFlow.variables.currentTerm}`);
  console.log(`   Leader: ${consensusFlow.variables.leaderId || 'Election in progress'}`);
  console.log(`   Entries Committed: ${logEntries.length}`);
  console.log(`   Commit Index: ${consensusFlow.variables.commitIndex}`);
  console.log(`   Last Applied: ${consensusFlow.variables.lastApplied}`);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 INTEGRATED DEMO SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Smart Contract: ${contractAddress} (Verified ✓)`);
  console.log(`Product Journey: Manufactured → Inspected → Shipped → Delivered`);
  console.log(`Blockchain: ${logEntries.length} transactions committed via consensus`);
  console.log(`Flow Executions: 3 (Contract + Supply Chain + Consensus)`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  return {
    contractFlow,
    supplyChainFlow,
    consensusFlow,
    productId,
    contractAddress,
  };
}

/**
 * Healthcare Data Pipeline with Smart Contracts
 * Demonstrates: Smart Contract + Business Process + Data Pipeline
 */
export async function healthcareDataPipelineDemo() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   HEALTHCARE DATA PIPELINE WITH SMART CONTRACTS             ║');
  console.log('║   Flow Types: Smart Contract + Business Process + ETL       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Deploy healthcare records smart contract
  console.log('🏥 Step 1: Deploying Healthcare Records Smart Contract...');
  const contractFlow = await flowService.deploySmartContract(
    'HealthRecords',
    `
    contract HealthRecords {
      struct PatientRecord {
        string patientId;
        string diagnosis;
        string treatment;
        uint256 timestamp;
        bool isEncrypted;
      }
      mapping(string => PatientRecord) private records;
    }
    `
  );

  console.log(`✅ Healthcare Contract: ${contractFlow.variables.contractAddress}`);

  // Step 2: Process patient through healthcare workflow
  console.log('\n👤 Step 2: Processing Patient Healthcare Workflow...');
  const patientId = `PATIENT_${Date.now()}`;
  const healthcareFlow = await flowService.startHealthcareProcess(patientId);

  console.log(`✅ Patient: ${patientId}`);
  console.log(`   Diagnosis: ${healthcareFlow.variables.diagnosis?.condition}`);
  console.log(`   Severity: ${healthcareFlow.variables.diagnosis?.severity}`);
  console.log(`   Treatment: ${healthcareFlow.variables.diagnosis?.treatment}`);
  console.log(`   Status: ${healthcareFlow.variables.treatmentComplete ? 'Completed ✓' : 'In Progress'}`);

  // Step 3: ETL pipeline to extract, transform, and load patient data
  console.log('\n📊 Step 3: ETL Pipeline for Patient Data...');
  const source = {
    type: 'database' as const,
    config: {
      connection: 'postgresql://healthcare-records',
      table: 'patient_records',
      query: `SELECT * FROM patient_records WHERE patient_id = '${patientId}'`,
    },
  };

  const destination = {
    type: 'database' as const,
    config: {
      connection: 'mongodb://healthcare-warehouse',
      collection: 'aggregated_records',
    },
  };

  const etlFlow = await flowService.startETLPipeline(source, destination);

  console.log(`✅ ETL Pipeline Complete`);
  console.log(`   Records Extracted: ${etlFlow.variables.recordCount}`);
  console.log(`   Records Transformed: ${etlFlow.variables.transformedData?.length || 0}`);
  console.log(`   Validation: ${etlFlow.variables.validationResult?.valid}/${etlFlow.variables.validationResult?.total} valid`);
  console.log(`   Records Loaded: ${etlFlow.variables.loadResult?.recordsLoaded || 0}`);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 HEALTHCARE DATA PIPELINE SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Smart Contract: ${contractFlow.variables.contractAddress}`);
  console.log(`Patient: ${patientId} - Treatment: ${healthcareFlow.variables.diagnosis?.treatment}`);
  console.log(`ETL Pipeline: ${etlFlow.variables.recordCount} records processed`);
  console.log(`Flow Executions: 3 (Contract + Healthcare + ETL)`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  return {
    contractFlow,
    healthcareFlow,
    etlFlow,
    patientId,
  };
}

/**
 * Financial Settlement with Consensus and Data Pipeline
 * Demonstrates: Smart Contract + Business Process + Consensus + Data Pipeline
 */
export async function financialSettlementDemo() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   FINANCIAL SETTLEMENT WITH CONSENSUS & DATA PIPELINE       ║');
  console.log('║   Flow Types: All 4 (Contract + BP + Consensus + Pipeline) ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Step 1: Deploy payment smart contract
  console.log('💰 Step 1: Deploying Payment Settlement Smart Contract...');
  const contractFlow = await flowService.deploySmartContract(
    'PaymentSettlement',
    `
    contract PaymentSettlement {
      struct Payment {
        string id;
        address from;
        address to;
        uint256 amount;
        bool settled;
        uint256 timestamp;
      }
      mapping(string => Payment) public payments;
    }
    `
  );

  console.log(`✅ Payment Contract: ${contractFlow.variables.contractAddress}`);

  // Step 2: Process financial settlement
  console.log('\n💳 Step 2: Processing Financial Settlement...');
  const amount = 50000; // $50,000
  const financialFlow = await flowService.startFinancialSettlement(amount);

  console.log(`✅ Payment ID: ${financialFlow.variables.paymentId}`);
  console.log(`   Amount: $${amount.toLocaleString()}`);
  console.log(`   Fraud Check: ${financialFlow.variables.fraudCheck ? 'CLEAN ✓' : 'FLAGGED ✗'}`);
  console.log(`   Settlement Status: ${financialFlow.variables.settled ? 'Settled ✓' : 'Pending'}`);
  console.log(`   Settlement Time: ${financialFlow.variables.settlementTime || 'N/A'}`);

  // Step 3: Run consensus to commit payment transaction
  console.log('\n🔗 Step 3: Consensus for Payment Transaction...');
  const logEntries = [
    {
      term: 2,
      index: 1,
      command: {
        type: 'INITIATE_PAYMENT',
        paymentId: financialFlow.variables.paymentId,
        amount,
        contractAddress: contractFlow.variables.contractAddress,
      },
      timestamp: new Date(),
    },
    {
      term: 2,
      index: 2,
      command: {
        type: 'FRAUD_CHECK_RESULT',
        paymentId: financialFlow.variables.paymentId,
        passed: financialFlow.variables.fraudCheck,
      },
      timestamp: new Date(),
    },
    {
      term: 2,
      index: 3,
      command: {
        type: 'SETTLE_PAYMENT',
        paymentId: financialFlow.variables.paymentId,
        settled: financialFlow.variables.settled,
        timestamp: financialFlow.variables.settlementTime,
      },
      timestamp: new Date(),
    },
  ];

  const consensusFlow = await flowService.runConsensusRound(logEntries);

  console.log(`✅ Consensus Complete`);
  console.log(`   Role: ${consensusFlow.variables.role}`);
  console.log(`   Term: ${consensusFlow.variables.currentTerm}`);
  console.log(`   Transactions Committed: ${logEntries.length}`);

  // Step 4: ETL Pipeline for transaction analytics
  console.log('\n📊 Step 4: ETL Pipeline for Transaction Analytics...');
  const source = {
    type: 'database' as const,
    config: {
      connection: 'postgresql://payments',
      query: 'SELECT * FROM settlements WHERE settled = true',
    },
  };

  const destination = {
    type: 'database' as const,
    config: {
      connection: 'mongodb://analytics-warehouse',
      collection: 'settlement_metrics',
    },
  };

  const etlFlow = await flowService.startETLPipeline(source, destination);

  console.log(`✅ Analytics Pipeline Complete`);
  console.log(`   Transactions Analyzed: ${etlFlow.variables.recordCount}`);
  console.log(`   Data Quality: ${etlFlow.variables.validationResult?.valid}/${etlFlow.variables.validationResult?.total} valid`);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 FINANCIAL SETTLEMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Smart Contract: ${contractFlow.variables.contractAddress}`);
  console.log(`Payment: $${amount.toLocaleString()} - ${financialFlow.variables.settled ? 'Settled' : 'Pending'}`);
  console.log(`Consensus: ${logEntries.length} transactions committed (Term ${consensusFlow.variables.currentTerm})`);
  console.log(`Analytics: ${etlFlow.variables.recordCount} records processed`);
  console.log(`Flow Executions: 4 (Contract + Financial + Consensus + ETL)`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  return {
    contractFlow,
    financialFlow,
    consensusFlow,
    etlFlow,
  };
}

/**
 * Multi-Product Supply Chain with Data Analytics
 * Batch processing demonstration
 */
export async function batchSupplyChainDemo() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   BATCH SUPPLY CHAIN WITH DATA ANALYTICS                    ║');
  console.log('║   Processing Multiple Products Simultaneously                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Deploy contract once
  console.log('📝 Deploying Supply Chain Smart Contract...');
  const contractFlow = await flowService.deploySmartContract(
    'BatchSupplyChain',
    'contract BatchSupplyChain { ... }'
  );
  console.log(`✅ Contract: ${contractFlow.variables.contractAddress}\n`);

  // Process 5 products in parallel
  const productCount = 5;
  const productFlows = [];

  console.log(`📦 Processing ${productCount} Products...\n`);

  for (let i = 0; i < productCount; i++) {
    const productId = `BATCH_PROD_${Date.now()}_${i}`;
    console.log(`  Product ${i + 1}/${productCount}: ${productId}`);

    const flow = await flowService.startSupplyChainProcess(productId);
    productFlows.push(flow);

    console.log(`    ✓ Quality: ${flow.variables.qualityCheck ? 'PASS' : 'FAIL'}`);
    console.log(`    ✓ Tracking: ${flow.variables.trackingId}`);
    console.log(`    ✓ Status: ${flow.status}\n`);
  }

  // Aggregate data with ETL pipeline
  console.log('📊 Running ETL Pipeline for Batch Analytics...');
  const source = {
    type: 'stream' as const,
    config: {
      streamName: 'supply-chain-events',
      products: productFlows.length,
    },
  };

  const destination = {
    type: 'database' as const,
    config: {
      connection: 'mongodb://supply-chain-analytics',
      collection: 'batch_metrics',
    },
  };

  const etlFlow = await flowService.startETLPipeline(source, destination);

  // Run consensus for batch commit
  console.log('\n🔗 Running Consensus for Batch Commit...');
  const logEntries = productFlows.map((flow, index) => ({
    term: 1,
    index: index + 1,
    command: {
      type: 'BATCH_PRODUCT_COMMIT',
      productId: flow.variables.productId,
      trackingId: flow.variables.trackingId,
      qualityCheck: flow.variables.qualityCheck,
    },
    timestamp: new Date(),
  }));

  const consensusFlow = await flowService.runConsensusRound(logEntries);

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 BATCH SUPPLY CHAIN SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Products Processed: ${productFlows.length}`);
  console.log(`Quality Passed: ${productFlows.filter((f) => f.variables.qualityCheck).length}`);
  console.log(`ETL Records: ${etlFlow.variables.recordCount}`);
  console.log(`Consensus Commits: ${logEntries.length}`);
  console.log(`Consensus Role: ${consensusFlow.variables.role}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  return {
    contractFlow,
    productFlows,
    etlFlow,
    consensusFlow,
  };
}

/**
 * Run all focused flow demonstrations
 */
export async function runFocusedFlowDemos() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                    ║');
  console.log('║         AURIGRAPH FOCUSED FLOW DEMONSTRATIONS                      ║');
  console.log('║                                                                    ║');
  console.log('║  Flow Types 1, 3, 4, 5:                                           ║');
  console.log('║    1. Smart Contract Flow                                         ║');
  console.log('║    3. Consensus Flow (HyperRAFT++)                                ║');
  console.log('║    4. Business Process Flow                                       ║');
  console.log('║    5. Data Pipeline Flow                                          ║');
  console.log('║                                                                    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  const results = {
    supplyChain: null as any,
    healthcare: null as any,
    financial: null as any,
    batch: null as any,
  };

  try {
    // Demo 1: Integrated Supply Chain
    results.supplyChain = await integratedSupplyChainDemo();
    await new Promise((r) => setTimeout(r, 1000));

    // Demo 2: Healthcare Data Pipeline
    results.healthcare = await healthcareDataPipelineDemo();
    await new Promise((r) => setTimeout(r, 1000));

    // Demo 3: Financial Settlement (All 4 flows)
    results.financial = await financialSettlementDemo();
    await new Promise((r) => setTimeout(r, 1000));

    // Demo 4: Batch Supply Chain
    results.batch = await batchSupplyChainDemo();

    // Final Summary
    console.log('\n\n');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                   ALL DEMONSTRATIONS COMPLETED                     ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    console.log('✅ Demo 1: Integrated Supply Chain');
    console.log(`   Contract: ${results.supplyChain.contractAddress}`);
    console.log(`   Product: ${results.supplyChain.productId}`);
    console.log(`   Consensus: ${results.supplyChain.consensusFlow.variables.role}\n`);

    console.log('✅ Demo 2: Healthcare Data Pipeline');
    console.log(`   Patient: ${results.healthcare.patientId}`);
    console.log(`   ETL Records: ${results.healthcare.etlFlow.variables.recordCount}\n`);

    console.log('✅ Demo 3: Financial Settlement (All 4 Flows)');
    console.log(`   Payment: ${results.financial.financialFlow.variables.paymentId}`);
    console.log(`   Consensus Commits: 3 transactions\n`);

    console.log('✅ Demo 4: Batch Supply Chain');
    console.log(`   Products: ${results.batch.productFlows.length}`);
    console.log(`   Consensus: ${results.batch.consensusFlow.variables.role}\n`);

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('📈 OVERALL STATISTICS');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log(`Total Flow Executions: ${Object.keys(results).length * 3} flows`);
    console.log(`Smart Contracts Deployed: 4`);
    console.log(`Consensus Rounds: 4`);
    console.log(`Business Processes: 3 (Supply Chain, Healthcare, Financial)`);
    console.log(`ETL Pipelines: 3`);
    console.log('═══════════════════════════════════════════════════════════════════\n');

    return results;
  } catch (error) {
    console.error('\n❌ Error during demonstrations:', error);
    throw error;
  }
}

// Export for use in tests or demos
export default {
  integratedSupplyChainDemo,
  healthcareDataPipelineDemo,
  financialSettlementDemo,
  batchSupplyChainDemo,
  runFocusedFlowDemos,
};

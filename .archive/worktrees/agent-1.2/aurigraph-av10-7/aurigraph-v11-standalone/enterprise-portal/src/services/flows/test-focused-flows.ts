// Test script for focused flow demonstrations
import { runFocusedFlowDemos } from './FocusedFlowDemo';

/**
 * Run all focused flow demonstrations
 * Tests: Smart Contract, Consensus, Business Process, Data Pipeline flows
 */
async function main() {
  try {
    console.log('Starting Focused Flow Demonstrations...\n');

    const results = await runFocusedFlowDemos();

    console.log('\n✅ All demonstrations completed successfully!');
    console.log('\nResults Summary:');
    console.log(JSON.stringify(
      {
        supplyChain: {
          productId: results.supplyChain.productId,
          contractAddress: results.supplyChain.contractAddress,
          consensusRole: results.supplyChain.consensusFlow.variables.role,
          flowStatuses: [
            results.supplyChain.contractFlow.status,
            results.supplyChain.supplyChainFlow.status,
            results.supplyChain.consensusFlow.status,
          ],
        },
        healthcare: {
          patientId: results.healthcare.patientId,
          diagnosis: results.healthcare.healthcareFlow.variables.diagnosis?.condition,
          etlRecords: results.healthcare.etlFlow.variables.recordCount,
          flowStatuses: [
            results.healthcare.contractFlow.status,
            results.healthcare.healthcareFlow.status,
            results.healthcare.etlFlow.status,
          ],
        },
        financial: {
          paymentId: results.financial.financialFlow.variables.paymentId,
          amount: 50000,
          settled: results.financial.financialFlow.variables.settled,
          consensusTerm: results.financial.consensusFlow.variables.currentTerm,
          flowStatuses: [
            results.financial.contractFlow.status,
            results.financial.financialFlow.status,
            results.financial.consensusFlow.status,
            results.financial.etlFlow.status,
          ],
        },
        batch: {
          productsProcessed: results.batch.productFlows.length,
          qualityPassed: results.batch.productFlows.filter((f: any) => f.variables.qualityCheck)
            .length,
          consensusCommits: results.batch.productFlows.length,
          flowStatuses: results.batch.productFlows.map((f: any) => f.status),
        },
      },
      null,
      2
    ));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error running demonstrations:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default main;

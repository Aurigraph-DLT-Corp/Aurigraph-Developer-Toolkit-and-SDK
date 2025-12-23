// Transaction Flow - Multi-step transaction orchestration with rollback support
import {
  FlowExecutor,
  FlowNode,
  FlowContext,
  FlowExecutionResult,
  FlowDefinition,
  FlowType,
  NodeType,
} from './FlowEngine';

export enum TransactionStatus {
  PENDING = 'PENDING',
  VALIDATING = 'VALIDATING',
  EXECUTING = 'EXECUTING',
  COMMITTING = 'COMMITTING',
  COMMITTED = 'COMMITTED',
  ROLLING_BACK = 'ROLLING_BACK',
  ROLLED_BACK = 'ROLLED_BACK',
  FAILED = 'FAILED',
}

export interface Transaction {
  id: string;
  type: string;
  from: string;
  to?: string;
  amount?: number;
  data?: any;
  nonce: number;
  signature?: string;
  status: TransactionStatus;
}

export interface TransactionBatch {
  id: string;
  transactions: Transaction[];
  merkleRoot?: string;
}

/**
 * Transaction Validation Executor
 */
export class TransactionValidationExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const transaction: Transaction = context.getVariable('transaction') || node.config.transaction;

    context.log(`Validating transaction: ${transaction.id}`);

    try {
      // Validate transaction fields
      const validationResults = {
        signatureValid: await this.validateSignature(transaction),
        balanceValid: await this.validateBalance(transaction),
        nonceValid: await this.validateNonce(transaction),
        formatValid: await this.validateFormat(transaction),
      };

      const allValid = Object.values(validationResults).every((v) => v);

      if (!allValid) {
        const failures = Object.entries(validationResults)
          .filter(([_, v]) => !v)
          .map(([k]) => k);
        throw new Error(`Validation failed: ${failures.join(', ')}`);
      }

      transaction.status = TransactionStatus.VALIDATING;
      context.setVariable('transaction', transaction);
      context.setVariable('validationResults', validationResults);

      context.log(`✅ Transaction validation passed`);

      return {
        success: true,
        output: validationResults,
        logs: [
          `Transaction validated successfully`,
          `Signature: ${validationResults.signatureValid ? '✓' : '✗'}`,
          `Balance: ${validationResults.balanceValid ? '✓' : '✗'}`,
          `Nonce: ${validationResults.nonceValid ? '✓' : '✗'}`,
          `Format: ${validationResults.formatValid ? '✓' : '✗'}`,
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        logs: [`Transaction validation failed: ${error.message}`],
      };
    }
  }

  private async validateSignature(tx: Transaction): Promise<boolean> {
    // Simulate signature validation
    await new Promise((resolve) => setTimeout(resolve, 10));
    return !!tx.signature;
  }

  private async validateBalance(tx: Transaction): Promise<boolean> {
    // Simulate balance check
    await new Promise((resolve) => setTimeout(resolve, 10));
    return (tx.amount || 0) >= 0;
  }

  private async validateNonce(tx: Transaction): Promise<boolean> {
    // Simulate nonce validation
    await new Promise((resolve) => setTimeout(resolve, 10));
    return tx.nonce >= 0;
  }

  private async validateFormat(tx: Transaction): Promise<boolean> {
    // Validate transaction format
    return !!(tx.id && tx.type && tx.from);
  }
}

/**
 * Transaction Execution Executor
 */
export class TransactionExecutionExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const transaction: Transaction = context.getVariable('transaction');

    context.log(`Executing transaction: ${transaction.id}`);

    try {
      transaction.status = TransactionStatus.EXECUTING;

      // Execute transaction based on type
      const execResult = await this.executeTransaction(transaction);

      transaction.status = TransactionStatus.COMMITTING;
      context.setVariable('transaction', transaction);
      context.setVariable('executionResult', execResult);

      context.log(`✅ Transaction executed successfully`);

      return {
        success: true,
        output: execResult,
        logs: [
          `Transaction executed`,
          `Type: ${transaction.type}`,
          `Gas used: ${execResult.gasUsed}`,
          `Block: ${execResult.blockNumber}`,
        ],
      };
    } catch (error: any) {
      transaction.status = TransactionStatus.FAILED;
      return {
        success: false,
        error: error.message,
        logs: [`Transaction execution failed: ${error.message}`],
      };
    }
  }

  private async executeTransaction(tx: Transaction): Promise<any> {
    // Simulate transaction execution
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 1,
      blockHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      gasUsed: Math.floor(Math.random() * 50000) + 21000,
      status: 'success',
      timestamp: new Date(),
    };
  }
}

/**
 * Transaction Commit Executor
 */
export class TransactionCommitExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const transaction: Transaction = context.getVariable('transaction');
    const execResult = context.getVariable('executionResult');

    context.log(`Committing transaction: ${transaction.id}`);

    try {
      // Commit transaction to blockchain
      await this.commitToBlockchain(transaction, execResult);

      transaction.status = TransactionStatus.COMMITTED;
      context.setVariable('transaction', transaction);

      context.log(`✅ Transaction committed to blockchain`);

      return {
        success: true,
        output: { committed: true, transactionHash: execResult.transactionHash },
        logs: [
          `Transaction committed successfully`,
          `Hash: ${execResult.transactionHash}`,
          `Block: ${execResult.blockNumber}`,
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        logs: [`Transaction commit failed: ${error.message}`],
      };
    }
  }

  private async commitToBlockchain(tx: Transaction, execResult: any): Promise<void> {
    // Simulate blockchain commit
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Transaction Rollback Executor
 */
export class TransactionRollbackExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const transaction: Transaction = context.getVariable('transaction');

    context.log(`Rolling back transaction: ${transaction.id}`);

    try {
      transaction.status = TransactionStatus.ROLLING_BACK;

      // Rollback transaction
      await this.rollbackTransaction(transaction);

      transaction.status = TransactionStatus.ROLLED_BACK;
      context.setVariable('transaction', transaction);

      context.log(`✅ Transaction rolled back successfully`);

      return {
        success: true,
        output: { rolledBack: true },
        logs: [`Transaction rolled back successfully`],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        logs: [`Transaction rollback failed: ${error.message}`],
      };
    }
  }

  private async rollbackTransaction(tx: Transaction): Promise<void> {
    // Simulate rollback
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/**
 * Batch Transaction Executor
 */
export class BatchTransactionExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const batch: TransactionBatch = context.getVariable('transactionBatch') || node.config.batch;

    context.log(`Processing transaction batch: ${batch.id} (${batch.transactions.length} txs)`);

    try {
      const results = [];

      for (const tx of batch.transactions) {
        context.log(`Processing transaction: ${tx.id}`);
        const result = await this.processTransaction(tx);
        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      context.setVariable('batchResults', results);
      context.setVariable('successCount', successCount);
      context.setVariable('failureCount', failureCount);

      context.log(`✅ Batch processing complete: ${successCount} success, ${failureCount} failed`);

      return {
        success: true,
        output: { results, successCount, failureCount },
        logs: [
          `Batch processed: ${batch.transactions.length} transactions`,
          `Successful: ${successCount}`,
          `Failed: ${failureCount}`,
        ],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        logs: [`Batch processing failed: ${error.message}`],
      };
    }
  }

  private async processTransaction(tx: Transaction): Promise<any> {
    // Simulate transaction processing
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      transactionId: tx.id,
      success: Math.random() > 0.1, // 90% success rate
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
    };
  }
}

/**
 * Create a standard transaction flow
 */
export function createTransactionFlow(transaction: Transaction): FlowDefinition {
  return {
    id: `tx_flow_${Date.now()}`,
    name: `Transaction Flow: ${transaction.id}`,
    type: FlowType.TRANSACTION,
    description: 'Multi-step transaction processing with validation and rollback',
    version: '1.0',
    nodes: [
      {
        id: 'start',
        type: NodeType.START,
        name: 'Start',
        config: {},
        position: { x: 100, y: 200 },
        inputs: [],
        outputs: ['validate'],
      },
      {
        id: 'validate',
        type: NodeType.TASK,
        name: 'Validate Transaction',
        config: { transaction },
        position: { x: 300, y: 200 },
        inputs: ['start'],
        outputs: ['decision'],
      },
      {
        id: 'decision',
        type: NodeType.DECISION,
        name: 'Validation OK?',
        config: {
          condition: 'context.getVariable("validationResults").signatureValid',
          branches: { true: 'execute', false: 'rollback' },
        },
        position: { x: 500, y: 200 },
        inputs: ['validate'],
        outputs: ['execute', 'rollback'],
      },
      {
        id: 'execute',
        type: NodeType.TASK,
        name: 'Execute Transaction',
        config: {},
        position: { x: 700, y: 100 },
        inputs: ['decision'],
        outputs: ['commit'],
      },
      {
        id: 'commit',
        type: NodeType.TASK,
        name: 'Commit to Blockchain',
        config: {},
        position: { x: 900, y: 100 },
        inputs: ['execute'],
        outputs: ['end_success'],
      },
      {
        id: 'rollback',
        type: NodeType.TASK,
        name: 'Rollback Transaction',
        config: {},
        position: { x: 700, y: 300 },
        inputs: ['decision'],
        outputs: ['end_failed'],
      },
      {
        id: 'end_success',
        type: NodeType.END,
        name: 'Success',
        config: {},
        position: { x: 1100, y: 100 },
        inputs: ['commit'],
        outputs: [],
      },
      {
        id: 'end_failed',
        type: NodeType.END,
        name: 'Failed',
        config: {},
        position: { x: 900, y: 300 },
        inputs: ['rollback'],
        outputs: [],
      },
    ],
    connections: [
      { id: 'c1', source: 'start', target: 'validate' },
      { id: 'c2', source: 'validate', target: 'decision' },
      { id: 'c3', source: 'decision', target: 'execute', condition: 'valid' },
      { id: 'c4', source: 'decision', target: 'rollback', condition: 'invalid' },
      { id: 'c5', source: 'execute', target: 'commit' },
      { id: 'c6', source: 'commit', target: 'end_success' },
      { id: 'c7', source: 'rollback', target: 'end_failed' },
    ],
    variables: { transaction },
    metadata: { flowType: 'TransactionProcessing' },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };
}

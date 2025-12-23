// Business Process Flow - Industry-specific workflow templates
import { FlowExecutor, FlowNode, FlowContext, FlowExecutionResult, FlowDefinition, FlowType, NodeType } from './FlowEngine';

export enum ProcessType {
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
  HEALTHCARE = 'HEALTHCARE',
  FINANCIAL_SETTLEMENT = 'FINANCIAL_SETTLEMENT',
  INSURANCE_CLAIM = 'INSURANCE_CLAIM',
  REAL_ESTATE = 'REAL_ESTATE',
}

// Supply Chain Executors
export class ProductManufactureExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const productId = node.config.productId || `prod_${Date.now()}`;
    context.log(`Manufacturing product: ${productId}`);
    await new Promise(r => setTimeout(r, 100));
    context.setVariable('productId', productId);
    context.setVariable('manufacturerTimestamp', new Date());
    return { success: true, output: { productId, status: 'manufactured' }, logs: [`Product ${productId} manufactured`] };
  }
}

export class QualityInspectionExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const productId = context.getVariable('productId');
    context.log(`Inspecting product: ${productId}`);
    await new Promise(r => setTimeout(r, 50));
    const passed = Math.random() > 0.1;
    context.setVariable('qualityCheck', passed);
    return { success: true, output: { productId, passed }, logs: [`Quality check: ${passed ? 'PASS' : 'FAIL'}`] };
  }
}

export class ShipmentExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const productId = context.getVariable('productId');
    const trackingId = `track_${Date.now()}`;
    context.log(`Shipping product: ${productId}`);
    await new Promise(r => setTimeout(r, 80));
    context.setVariable('trackingId', trackingId);
    context.setVariable('shippedAt', new Date());
    return { success: true, output: { productId, trackingId }, logs: [`Shipment initiated: ${trackingId}`] };
  }
}

export class DeliveryExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const productId = context.getVariable('productId');
    const trackingId = context.getVariable('trackingId');
    context.log(`Delivering product: ${productId}`);
    await new Promise(r => setTimeout(r, 100));
    context.setVariable('deliveredAt', new Date());
    return { success: true, output: { productId, trackingId, delivered: true }, logs: [`Product delivered successfully`] };
  }
}

// Healthcare Executors
export class PatientRegistrationExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const patientId = node.config.patientId || `patient_${Date.now()}`;
    context.log(`Registering patient: ${patientId}`);
    await new Promise(r => setTimeout(r, 50));
    context.setVariable('patientId', patientId);
    return { success: true, output: { patientId }, logs: [`Patient ${patientId} registered`] };
  }
}

export class DiagnosisExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const patientId = context.getVariable('patientId');
    context.log(`Diagnosing patient: ${patientId}`);
    await new Promise(r => setTimeout(r, 150));
    const diagnosis = { condition: 'Common Cold', severity: 'Mild', treatment: 'Rest and fluids' };
    context.setVariable('diagnosis', diagnosis);
    return { success: true, output: diagnosis, logs: [`Diagnosis complete: ${diagnosis.condition}`] };
  }
}

export class TreatmentExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const patientId = context.getVariable('patientId');
    const diagnosis = context.getVariable('diagnosis');
    context.log(`Treating patient: ${patientId}`);
    await new Promise(r => setTimeout(r, 200));
    context.setVariable('treatmentComplete', true);
    return { success: true, output: { treated: true }, logs: [`Treatment administered: ${diagnosis.treatment}`] };
  }
}

// Financial Settlement Executors
export class PaymentInitiationExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const amount = node.config.amount;
    const paymentId = `pay_${Date.now()}`;
    context.log(`Initiating payment: ${amount}`);
    await new Promise(r => setTimeout(r, 100));
    context.setVariable('paymentId', paymentId);
    context.setVariable('amount', amount);
    return { success: true, output: { paymentId, amount }, logs: [`Payment ${paymentId} initiated for ${amount}`] };
  }
}

export class FraudCheckExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const paymentId = context.getVariable('paymentId');
    context.log(`Checking for fraud: ${paymentId}`);
    await new Promise(r => setTimeout(r, 120));
    const fraudDetected = Math.random() > 0.95;
    context.setVariable('fraudCheck', !fraudDetected);
    return { success: true, output: { fraudDetected }, logs: [`Fraud check: ${fraudDetected ? 'FLAGGED' : 'CLEAN'}`] };
  }
}

export class SettlementExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const paymentId = context.getVariable('paymentId');
    const amount = context.getVariable('amount');
    context.log(`Settling payment: ${paymentId}`);
    await new Promise(r => setTimeout(r, 150));
    context.setVariable('settled', true);
    context.setVariable('settlementTime', new Date());
    return { success: true, output: { settled: true, amount }, logs: [`Payment settled: ${amount}`] };
  }
}

/**
 * Create Supply Chain workflow
 */
export function createSupplyChainFlow(productId: string): FlowDefinition {
  return {
    id: `sc_${Date.now()}`,
    name: 'Supply Chain Tracking',
    type: FlowType.BUSINESS_PROCESS,
    description: 'End-to-end supply chain from manufacturing to delivery',
    version: '1.0',
    nodes: [
      { id: 'start', type: NodeType.START, name: 'Start', config: {}, position: { x: 100, y: 200 }, inputs: [], outputs: ['manufacture'] },
      { id: 'manufacture', type: NodeType.TASK, name: 'Manufacture Product', config: { productId }, position: { x: 300, y: 200 }, inputs: ['start'], outputs: ['inspect'] },
      { id: 'inspect', type: NodeType.TASK, name: 'Quality Inspection', config: {}, position: { x: 500, y: 200 }, inputs: ['manufacture'], outputs: ['decision'] },
      { id: 'decision', type: NodeType.DECISION, name: 'Quality OK?', config: { condition: 'context.getVariable("qualityCheck")', branches: { true: 'ship', false: 'reject' } }, position: { x: 700, y: 200 }, inputs: ['inspect'], outputs: ['ship', 'reject'] },
      { id: 'ship', type: NodeType.TASK, name: 'Ship Product', config: {}, position: { x: 900, y: 100 }, inputs: ['decision'], outputs: ['deliver'] },
      { id: 'deliver', type: NodeType.TASK, name: 'Deliver to Customer', config: {}, position: { x: 1100, y: 100 }, inputs: ['ship'], outputs: ['end_success'] },
      { id: 'reject', type: NodeType.TASK, name: 'Reject Product', config: {}, position: { x: 900, y: 300 }, inputs: ['decision'], outputs: ['end_reject'] },
      { id: 'end_success', type: NodeType.END, name: 'Delivered', config: {}, position: { x: 1300, y: 100 }, inputs: ['deliver'], outputs: [] },
      { id: 'end_reject', type: NodeType.END, name: 'Rejected', config: {}, position: { x: 1100, y: 300 }, inputs: ['reject'], outputs: [] },
    ],
    connections: [
      { id: 'c1', source: 'start', target: 'manufacture' },
      { id: 'c2', source: 'manufacture', target: 'inspect' },
      { id: 'c3', source: 'inspect', target: 'decision' },
      { id: 'c4', source: 'decision', target: 'ship', condition: 'passed' },
      { id: 'c5', source: 'decision', target: 'reject', condition: 'failed' },
      { id: 'c6', source: 'ship', target: 'deliver' },
      { id: 'c7', source: 'deliver', target: 'end_success' },
      { id: 'c8', source: 'reject', target: 'end_reject' },
    ],
    variables: { productId },
    metadata: { processType: ProcessType.SUPPLY_CHAIN },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };
}

/**
 * Create Healthcare workflow
 */
export function createHealthcareFlow(patientId: string): FlowDefinition {
  return {
    id: `hc_${Date.now()}`,
    name: 'Healthcare Patient Flow',
    type: FlowType.BUSINESS_PROCESS,
    description: 'Patient registration, diagnosis, and treatment',
    version: '1.0',
    nodes: [
      { id: 'start', type: NodeType.START, name: 'Start', config: {}, position: { x: 100, y: 200 }, inputs: [], outputs: ['register'] },
      { id: 'register', type: NodeType.TASK, name: 'Register Patient', config: { patientId }, position: { x: 300, y: 200 }, inputs: ['start'], outputs: ['diagnose'] },
      { id: 'diagnose', type: NodeType.TASK, name: 'Diagnose', config: {}, position: { x: 500, y: 200 }, inputs: ['register'], outputs: ['treat'] },
      { id: 'treat', type: NodeType.TASK, name: 'Treatment', config: {}, position: { x: 700, y: 200 }, inputs: ['diagnose'], outputs: ['end'] },
      { id: 'end', type: NodeType.END, name: 'Complete', config: {}, position: { x: 900, y: 200 }, inputs: ['treat'], outputs: [] },
    ],
    connections: [
      { id: 'c1', source: 'start', target: 'register' },
      { id: 'c2', source: 'register', target: 'diagnose' },
      { id: 'c3', source: 'diagnose', target: 'treat' },
      { id: 'c4', source: 'treat', target: 'end' },
    ],
    variables: { patientId },
    metadata: { processType: ProcessType.HEALTHCARE },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };
}

/**
 * Create Financial Settlement workflow
 */
export function createFinancialSettlementFlow(amount: number): FlowDefinition {
  return {
    id: `fin_${Date.now()}`,
    name: 'Financial Settlement',
    type: FlowType.BUSINESS_PROCESS,
    description: 'Cross-border payment settlement with fraud detection',
    version: '1.0',
    nodes: [
      { id: 'start', type: NodeType.START, name: 'Start', config: {}, position: { x: 100, y: 200 }, inputs: [], outputs: ['initiate'] },
      { id: 'initiate', type: NodeType.TASK, name: 'Initiate Payment', config: { amount }, position: { x: 300, y: 200 }, inputs: ['start'], outputs: ['fraud'] },
      { id: 'fraud', type: NodeType.TASK, name: 'Fraud Check', config: {}, position: { x: 500, y: 200 }, inputs: ['initiate'], outputs: ['decision'] },
      { id: 'decision', type: NodeType.DECISION, name: 'Fraud Detected?', config: { condition: 'context.getVariable("fraudCheck")', branches: { true: 'settle', false: 'block' } }, position: { x: 700, y: 200 }, inputs: ['fraud'], outputs: ['settle', 'block'] },
      { id: 'settle', type: NodeType.TASK, name: 'Settle Payment', config: {}, position: { x: 900, y: 100 }, inputs: ['decision'], outputs: ['end_success'] },
      { id: 'block', type: NodeType.TASK, name: 'Block Payment', config: {}, position: { x: 900, y: 300 }, inputs: ['decision'], outputs: ['end_blocked'] },
      { id: 'end_success', type: NodeType.END, name: 'Settled', config: {}, position: { x: 1100, y: 100 }, inputs: ['settle'], outputs: [] },
      { id: 'end_blocked', type: NodeType.END, name: 'Blocked', config: {}, position: { x: 1100, y: 300 }, inputs: ['block'], outputs: [] },
    ],
    connections: [
      { id: 'c1', source: 'start', target: 'initiate' },
      { id: 'c2', source: 'initiate', target: 'fraud' },
      { id: 'c3', source: 'fraud', target: 'decision' },
      { id: 'c4', source: 'decision', target: 'settle', condition: 'clean' },
      { id: 'c5', source: 'decision', target: 'block', condition: 'flagged' },
      { id: 'c6', source: 'settle', target: 'end_success' },
      { id: 'c7', source: 'block', target: 'end_blocked' },
    ],
    variables: { amount },
    metadata: { processType: ProcessType.FINANCIAL_SETTLEMENT },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };
}

// Data Pipeline Flow - ETL and streaming data processing workflows
import { FlowExecutor, FlowNode, FlowContext, FlowExecutionResult, FlowDefinition, FlowType, NodeType } from './FlowEngine';

export enum PipelineStage {
  EXTRACT = 'EXTRACT',
  TRANSFORM = 'TRANSFORM',
  LOAD = 'LOAD',
  VALIDATE = 'VALIDATE',
}

export interface DataSource {
  type: 'database' | 'api' | 'file' | 'stream';
  config: Record<string, any>;
}

export interface DataTransformation {
  type: 'filter' | 'map' | 'aggregate' | 'join' | 'clean';
  config: Record<string, any>;
}

/** Data Extraction Executor */
export class DataExtractionExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const source: DataSource = node.config.source;
    context.log(`Extracting data from ${source.type}`);
    await new Promise(r => setTimeout(r, 150));

    const data = this.mockExtract(source);
    context.setVariable('extractedData', data);
    context.setVariable('recordCount', data.length);

    context.log(`✅ Extracted ${data.length} records from ${source.type}`);
    return {
      success: true,
      output: { recordCount: data.length, source: source.type },
      logs: [`Extracted ${data.length} records from ${source.type}`],
    };
  }

  private mockExtract(source: DataSource): any[] {
    const count = Math.floor(Math.random() * 1000) + 100;
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      timestamp: new Date(),
      value: Math.random() * 100,
      type: source.type,
    }));
  }
}

/** Data Transformation Executor */
export class DataTransformationExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const data = context.getVariable('extractedData') || [];
    const transformation: DataTransformation = node.config.transformation;

    context.log(`Transforming data: ${transformation.type}`);
    await new Promise(r => setTimeout(r, 200));

    const transformed = this.applyTransformation(data, transformation);
    context.setVariable('transformedData', transformed);

    context.log(`✅ Transformed ${data.length} → ${transformed.length} records`);
    return {
      success: true,
      output: { inputCount: data.length, outputCount: transformed.length },
      logs: [`Applied ${transformation.type} transformation: ${data.length} → ${transformed.length} records`],
    };
  }

  private applyTransformation(data: any[], transformation: DataTransformation): any[] {
    switch (transformation.type) {
      case 'filter':
        return data.filter((d) => d.value > 50);
      case 'map':
        return data.map((d) => ({ ...d, transformed: true }));
      case 'aggregate':
        return [{ total: data.length, sum: data.reduce((sum, d) => sum + d.value, 0) }];
      case 'clean':
        return data.filter((d) => d.value != null);
      default:
        return data;
    }
  }
}

/** Data Validation Executor */
export class DataValidationExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const data = context.getVariable('transformedData') || [];
    context.log(`Validating ${data.length} records`);
    await new Promise(r => setTimeout(r, 100));

    const validation = {
      total: data.length,
      valid: Math.floor(data.length * 0.95),
      invalid: Math.floor(data.length * 0.05),
      passed: true,
    };

    context.setVariable('validationResult', validation);
    context.log(`✅ Validation complete: ${validation.valid}/${validation.total} valid`);

    return {
      success: true,
      output: validation,
      logs: [`Validated ${data.length} records: ${validation.valid} valid, ${validation.invalid} invalid`],
    };
  }
}

/** Data Loading Executor */
export class DataLoadingExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const data = context.getVariable('transformedData') || [];
    const destination = node.config.destination;

    context.log(`Loading ${data.length} records to ${destination.type}`);
    await new Promise(r => setTimeout(r, 250));

    const loaded = {
      destination: destination.type,
      recordsLoaded: data.length,
      loadTime: new Date(),
    };

    context.setVariable('loadResult', loaded);
    context.log(`✅ Loaded ${data.length} records to ${destination.type}`);

    return {
      success: true,
      output: loaded,
      logs: [`Loaded ${data.length} records to ${destination.type}`],
    };
  }
}

/** Stream Processing Executor */
export class StreamProcessingExecutor implements FlowExecutor {
  async execute(node: FlowNode, context: FlowContext): Promise<FlowExecutionResult> {
    const streamConfig = node.config.stream;
    context.log(`Processing stream: ${streamConfig.name}`);

    // Simulate stream processing
    await new Promise(r => setTimeout(r, 300));

    const processed = {
      streamName: streamConfig.name,
      eventsProcessed: Math.floor(Math.random() * 10000) + 1000,
      throughput: Math.floor(Math.random() * 10000) + 1000,
      latency: Math.random() * 100,
    };

    context.setVariable('streamResult', processed);
    context.log(`✅ Processed ${processed.eventsProcessed} events from ${streamConfig.name}`);

    return {
      success: true,
      output: processed,
      logs: [
        `Stream processed: ${streamConfig.name}`,
        `Events: ${processed.eventsProcessed}`,
        `Throughput: ${processed.throughput} events/sec`,
        `Latency: ${processed.latency.toFixed(2)}ms`,
      ],
    };
  }
}

/** Create ETL Pipeline Flow */
export function createETLPipelineFlow(source: DataSource, destination: DataSource): FlowDefinition {
  return {
    id: `etl_${Date.now()}`,
    name: 'ETL Data Pipeline',
    type: FlowType.DATA_PIPELINE,
    description: 'Extract, Transform, Load data pipeline',
    version: '1.0',
    nodes: [
      { id: 'start', type: NodeType.START, name: 'Start Pipeline', config: {}, position: { x: 100, y: 200 }, inputs: [], outputs: ['extract'] },
      { id: 'extract', type: NodeType.TASK, name: 'Extract Data', config: { source }, position: { x: 300, y: 200 }, inputs: ['start'], outputs: ['transform'] },
      { id: 'transform', type: NodeType.TASK, name: 'Transform Data', config: { transformation: { type: 'filter', config: {} } }, position: { x: 500, y: 200 }, inputs: ['extract'], outputs: ['validate'] },
      { id: 'validate', type: NodeType.TASK, name: 'Validate Data', config: {}, position: { x: 700, y: 200 }, inputs: ['transform'], outputs: ['load'] },
      { id: 'load', type: NodeType.TASK, name: 'Load Data', config: { destination }, position: { x: 900, y: 200 }, inputs: ['validate'], outputs: ['end'] },
      { id: 'end', type: NodeType.END, name: 'Pipeline Complete', config: {}, position: { x: 1100, y: 200 }, inputs: ['load'], outputs: [] },
    ],
    connections: [
      { id: 'c1', source: 'start', target: 'extract' },
      { id: 'c2', source: 'extract', target: 'transform' },
      { id: 'c3', source: 'transform', target: 'validate' },
      { id: 'c4', source: 'validate', target: 'load' },
      { id: 'c5', source: 'load', target: 'end' },
    ],
    variables: {},
    metadata: { pipelineType: 'ETL', source: source.type, destination: destination.type },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
  };
}

/**
 * Demo Components Index
 *
 * Exports all live demo related components for easy imports
 */

// Simulation Warning Component
export { SimulationWarning, SimulationTag, DataSourceIndicator } from './SimulationWarning';
export type { SimulationWarningProps } from './SimulationWarning';

// Live Demo Common Components
export {
  LiveDemoMetrics,
  LiveDemoControls,
  LiveDemoNodeStatus,
  LiveDemoTransactionFeed,
  LiveDemoAPIData,
  LiveDemoConsensus,
  LiveDemoHeader,
} from './LiveDemoCommon';

export type {
  DemoMetrics,
  NodeStatus,
  Transaction,
  ExternalAPIData,
  ConsensusStatus,
  LiveDemoMetricsProps,
  LiveDemoControlsProps,
  LiveDemoNodeStatusProps,
  LiveDemoTransactionFeedProps,
  LiveDemoAPIDataProps,
  LiveDemoConsensusProps,
  LiveDemoHeaderProps,
} from './LiveDemoCommon';

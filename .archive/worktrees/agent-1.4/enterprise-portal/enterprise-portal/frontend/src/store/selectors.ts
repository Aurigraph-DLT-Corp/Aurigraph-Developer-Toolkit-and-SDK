/**
 * Redux Selectors with Reselect Memoization
 *
 * Memoized selectors for efficient state access and derived state computation
 */

import { createSelector } from 'reselect';
import type { RootState } from '../types/state';
import type {
  NodesByTypeSelector,
  SystemHealthSelector,
  PerformanceSummarySelector,
} from '../types/state';
import type { NodeType } from '../types/nodes';

// ============================================================================
// Base Selectors (Direct state access)
// ============================================================================

export const selectDemoAppState = (state: RootState) => state.demoApp;
export const selectSettingsState = (state: RootState) => state.settings;

// Demo App State
export const selectNodes = (state: RootState) => state.demoApp.nodes;
export const selectSelectedNodeId = (state: RootState) => state.demoApp.selectedNodeId;
export const selectSystemMetrics = (state: RootState) => state.demoApp.systemMetrics;
export const selectChartData = (state: RootState) => state.demoApp.chartData;
export const selectActiveDashboard = (state: RootState) => state.demoApp.activeDashboard;
export const selectSpatialViewMode = (state: RootState) => state.demoApp.spatialViewMode;
export const selectIsLoadingNodes = (state: RootState) => state.demoApp.isLoadingNodes;
export const selectIsLoadingMetrics = (state: RootState) => state.demoApp.isLoadingMetrics;
export const selectNodesError = (state: RootState) => state.demoApp.nodesError;
export const selectMetricsError = (state: RootState) => state.demoApp.metricsError;
export const selectWsConnected = (state: RootState) => state.demoApp.wsConnected;
export const selectWsReconnecting = (state: RootState) => state.demoApp.wsReconnecting;
export const selectWsReconnectAttempts = (state: RootState) => state.demoApp.wsReconnectAttempts;
export const selectDemoMode = (state: RootState) => state.demoApp.demoMode;

// Settings State
export const selectTheme = (state: RootState) => state.settings.theme;
export const selectNotifications = (state: RootState) => state.settings.notifications;
export const selectPerformanceSettings = (state: RootState) => state.settings.performance;
export const selectExternalFeeds = (state: RootState) => state.settings.externalFeeds;
export const selectApiBaseUrl = (state: RootState) => state.settings.apiBaseUrl;
export const selectWsUrl = (state: RootState) => state.settings.wsUrl;

// ============================================================================
// Memoized Selectors (Derived state with caching)
// ============================================================================

/**
 * Get the selected node object
 */
export const selectSelectedNode = createSelector(
  [selectNodes, selectSelectedNodeId],
  (nodes, selectedNodeId) => {
    return selectedNodeId ? nodes[selectedNodeId] : null;
  }
);

/**
 * Get all nodes as an array
 */
export const selectNodesArray = createSelector([selectNodes], (nodes) => {
  return Object.values(nodes);
});

/**
 * Get nodes grouped by type
 */
export const selectNodesByType = createSelector(
  [selectNodesArray],
  (nodesArray): NodesByTypeSelector => {
    return {
      channel: nodesArray.filter((node) => node.type === 'channel'),
      validator: nodesArray.filter((node) => node.type === 'validator'),
      business: nodesArray.filter((node) => node.type === 'business'),
      slim: nodesArray.filter((node) => node.type === 'slim'),
    };
  }
);

/**
 * Get nodes count by type
 */
export const selectNodesCountByType = createSelector([selectNodesByType], (nodesByType) => {
  return {
    channel: nodesByType.channel.length,
    validator: nodesByType.validator.length,
    business: nodesByType.business.length,
    slim: nodesByType.slim.length,
    total:
      nodesByType.channel.length +
      nodesByType.validator.length +
      nodesByType.business.length +
      nodesByType.slim.length,
  };
});

/**
 * Get active nodes (status === 'active')
 */
export const selectActiveNodes = createSelector([selectNodesArray], (nodesArray) => {
  return nodesArray.filter((node) => node.status === 'active');
});

/**
 * Get inactive nodes (status === 'inactive')
 */
export const selectInactiveNodes = createSelector([selectNodesArray], (nodesArray) => {
  return nodesArray.filter((node) => node.status === 'inactive');
});

/**
 * Get nodes with errors (status === 'error')
 */
export const selectErrorNodes = createSelector([selectNodesArray], (nodesArray) => {
  return nodesArray.filter((node) => node.status === 'error');
});

/**
 * Get system health status
 */
export const selectSystemHealth = createSelector(
  [selectSystemMetrics, selectWsConnected, selectErrorNodes],
  (systemMetrics, wsConnected, errorNodes): SystemHealthSelector => {
    // Check database health (assume UP if performance metrics exist)
    const database = !!systemMetrics.performance;

    // Check consensus health (assume UP if consensus stats exist)
    const consensus = !!systemMetrics.consensus;

    // Check network health (assume UP if network stats exist)
    const network = !!systemMetrics.network;

    // Overall health calculation
    let overall: 'healthy' | 'degraded' | 'critical';

    if (!wsConnected || errorNodes.length > 0) {
      overall = 'critical';
    } else if (!database || !consensus || !network) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      database,
      consensus,
      network,
      websocket: wsConnected,
    };
  }
);

/**
 * Get performance summary
 */
export const selectPerformanceSummary = createSelector(
  [selectSystemMetrics],
  (systemMetrics): PerformanceSummarySelector => {
    const performance = systemMetrics.performance;

    return {
      currentTps: performance?.tps || 0,
      avgTps: performance?.avgTps || 0,
      peakTps: performance?.peakTps || 0,
      totalTransactions: performance?.totalTransactions || 0,
      avgLatency: performance?.avgLatencyMs || 0,
      cpuUsage: performance?.cpuUsagePercent || 0,
      memoryUsage: performance?.memoryUsageMb || 0,
    };
  }
);

/**
 * Get consensus summary
 */
export const selectConsensusSummary = createSelector([selectSystemMetrics], (systemMetrics) => {
  const consensus = systemMetrics.consensus;

  return {
    currentTerm: consensus?.currentTerm || 0,
    blockHeight: consensus?.blockHeight || 0,
    leaderNodeId: consensus?.leaderNodeId || null,
    validatorCount: consensus?.validatorCount || 0,
    activeValidators: consensus?.activeValidators || 0,
    avgFinalityLatency: consensus?.avgFinalityLatencyMs || 0,
  };
});

/**
 * Get transaction summary
 */
export const selectTransactionSummary = createSelector([selectSystemMetrics], (systemMetrics) => {
  const transactions = systemMetrics.transactions;

  return {
    total: transactions?.totalTransactions || 0,
    confirmed: transactions?.confirmedTransactions || 0,
    pending: transactions?.pendingTransactions || 0,
    failed: transactions?.failedTransactions || 0,
    avgTxPerSecond: transactions?.avgTxPerSecond || 0,
  };
});

/**
 * Get chart data for TPS
 */
export const selectTpsChartData = createSelector([selectChartData], (chartData) => {
  return chartData.tps;
});

/**
 * Get chart data for latency
 */
export const selectLatencyChartData = createSelector([selectChartData], (chartData) => {
  return chartData.latency;
});

/**
 * Get chart data for consensus
 */
export const selectConsensusChartData = createSelector([selectChartData], (chartData) => {
  return chartData.consensus;
});

/**
 * Get chart data for transactions
 */
export const selectTransactionsChartData = createSelector([selectChartData], (chartData) => {
  return chartData.transactions;
});

/**
 * Check if any data is loading
 */
export const selectIsLoading = createSelector(
  [selectIsLoadingNodes, selectIsLoadingMetrics],
  (loadingNodes, loadingMetrics) => {
    return loadingNodes || loadingMetrics;
  }
);

/**
 * Check if any errors exist
 */
export const selectHasErrors = createSelector(
  [selectNodesError, selectMetricsError],
  (nodesError, metricsError) => {
    return !!nodesError || !!metricsError;
  }
);

/**
 * Get all errors as an array
 */
export const selectErrors = createSelector(
  [selectNodesError, selectMetricsError],
  (nodesError, metricsError) => {
    const errors: string[] = [];
    if (nodesError) errors.push(nodesError);
    if (metricsError) errors.push(metricsError);
    return errors;
  }
);

/**
 * Check if demo mode is enabled (from both slices)
 */
export const selectIsDemoMode = createSelector(
  [selectDemoMode, (state: RootState) => state.settings.demoMode],
  (demoAppDemoMode, settingsDemoMode) => {
    // Demo mode is enabled if either slice has it enabled
    return demoAppDemoMode || settingsDemoMode;
  }
);

/**
 * Get enabled external feeds
 */
export const selectEnabledExternalFeeds = createSelector([selectExternalFeeds], (externalFeeds) => {
  const enabled: string[] = [];
  if (externalFeeds.alpaca.enabled) enabled.push('alpaca');
  if (externalFeeds.weather.enabled) enabled.push('weather');
  if (externalFeeds.twitter.enabled) enabled.push('twitter');
  return enabled;
});

/**
 * Get theme mode (light or dark)
 */
export const selectThemeMode = createSelector([selectTheme], (theme) => {
  return theme.mode;
});

/**
 * Check if dark mode is enabled
 */
export const selectIsDarkMode = createSelector([selectThemeMode], (mode) => {
  return mode === 'dark';
});

/**
 * Get primary color
 */
export const selectPrimaryColor = createSelector([selectTheme], (theme) => {
  return theme.primaryColor;
});

/**
 * Get notification settings for display
 */
export const selectNotificationSettings = createSelector([selectNotifications], (notifications) => {
  return {
    enabled: notifications.enabled,
    sound: notifications.sound,
    position: notifications.position,
    duration: notifications.duration,
  };
});

/**
 * Get update intervals for performance optimization
 */
export const selectUpdateIntervals = createSelector([selectPerformanceSettings], (performance) => {
  return {
    chart: performance.chartUpdateInterval,
    metrics: performance.metricsUpdateInterval,
    maxDataPoints: performance.maxChartDataPoints,
  };
});

/**
 * Check if animations are enabled
 */
export const selectAnimationsEnabled = createSelector(
  [selectPerformanceSettings],
  (performance) => {
    return performance.enableAnimations;
  }
);

/**
 * Check if particle effects are enabled
 */
export const selectParticleEffectsEnabled = createSelector(
  [selectPerformanceSettings],
  (performance) => {
    return performance.enableParticleEffects;
  }
);

/**
 * Get nodes by specific type
 */
export const selectNodesBySpecificType = (nodeType: NodeType) =>
  createSelector([selectNodesArray], (nodesArray) => {
    return nodesArray.filter((node) => node.type === nodeType);
  });

/**
 * Get node by ID
 */
export const selectNodeById = (nodeId: string) =>
  createSelector([selectNodes], (nodes) => {
    return nodes[nodeId] || null;
  });

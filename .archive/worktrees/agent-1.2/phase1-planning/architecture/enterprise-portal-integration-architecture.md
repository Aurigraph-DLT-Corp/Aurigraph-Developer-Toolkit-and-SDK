# Enterprise Portal Integration Architecture
**Phase 1, Task 1.2.1 - Enterprise Portal Integration Architecture**
**Date**: October 9, 2025
**Project**: AV11-DEMO-MOBILE-2025
**Version**: 1.0

---

## Document Overview

This document defines the complete integration architecture for embedding the existing Real-Time Node Visualization Demo App (5,362 LOC vanilla JavaScript) into the Aurigraph V11 Enterprise Portal (React 18 + TypeScript + Redux + Material-UI). The architecture ensures seamless integration while maintaining code reusability for future mobile implementations.

---

## 1. Executive Summary

### Current State

**Demo App** (`/demo-app/`):
- **Technology**: Vanilla JavaScript (ES6 classes), Chart.js, WebSocket API
- **Architecture**: Event-driven, modular components (9 modules)
- **Lines of Code**: 5,362 (production-ready)
- **Status**: Fully functional standalone application

**Enterprise Portal** (`/aurigraph-v11-standalone/enterprise-portal/`):
- **Technology**: React 18.2, TypeScript 5.3, Vite 5.0, Material-UI 5.14, Redux Toolkit 2.0
- **Architecture**: Component-based with Redux state management
- **Status**: Partially implemented (channels, contracts, tokenization features)

### Integration Goals

1. **Embed Demo App**: Integrate all 9 demo app modules into the enterprise portal as React components
2. **State Management**: Unify state management using Redux Toolkit
3. **UI Consistency**: Apply Material-UI design system to demo app components
4. **API Integration**: Connect to V11 backend REST + WebSocket APIs
5. **Code Reusability**: Maintain module architecture for mobile app conversion
6. **Performance**: Achieve 2M+ TPS visualization capability

---

## 2. Integration Strategy

### 2.1 Three-Phase Integration Approach

#### Phase 1: Wrapper Integration (Quick Win - Week 1-2)
**Approach**: Wrap vanilla JS modules in React components using refs and lifecycle hooks
**Pros**:
- Fast implementation (3-5 days)
- Minimal code changes to demo app
- Immediate visual results
**Cons**:
- Not idiomatic React
- Harder to maintain long-term
- Limited state management integration

#### Phase 2: React Component Migration (Recommended - Week 3-6)
**Approach**: Rewrite demo app modules as React functional components with hooks
**Pros**:
- Idiomatic React architecture
- Full Redux integration
- Better performance
- Easier to maintain
**Cons**:
- More development time
- Requires rewriting business logic

#### Phase 3: TypeScript Hardening (Week 7-8)
**Approach**: Add TypeScript types to all migrated components
**Pros**:
- Type safety
- Better developer experience
- Production-ready code
**Cons**:
- Additional time investment

### 2.2 Recommended Path: Hybrid Approach

**Week 1-2**: Wrapper Integration for rapid prototyping
**Week 3-6**: React Component Migration for production
**Week 7-8**: TypeScript + Testing + Polish

---

## 3. Component Architecture

### 3.1 Demo App Module Mapping

| Demo App Module | Enterprise Portal Component | Integration Method | Priority |
|----------------|----------------------------|-------------------|----------|
| **ChannelNode** | `<ChannelNodePanel />` | React Component | High |
| **ValidatorNode** | `<ValidatorNodePanel />` | React Component | High |
| **BusinessNode** | `<BusinessNodePanel />` | React Component | High |
| **APIIntegrationNode** | `<APIFeedPanel />` | React Component | Medium |
| **GraphVisualizer** | `<RealtimeCharts />` | React Component + Recharts | High |
| **ScalabilityModesManager** | `<PerformanceModeSelector />` | React Component | High |
| **ConfigurationManager** | `<ConfigurationManager />` | React Component | Medium |
| **WebSocketManager** | `useWebSocket` hook | Custom Hook | High |
| **V11BackendClient** | API service layer | Service | High |
| **PanelUIComponents** | Material-UI components | N/A | Low |

### 3.2 Component Tree Structure

```
<App />
├── <Layout />
│   ├── <AppBar />
│   ├── <Drawer />
│   │   └── <Navigation />
│   └── <Routes />
│       ├── <Dashboard />                    [Existing]
│       ├── <DemoApp />                      [NEW - Main Integration Point]
│       │   ├── <DemoAppToolbar />          [NEW]
│       │   │   ├── <PlaybackControls />    [Start/Stop/Reset]
│       │   │   ├── <ConfigControls />      [Save/Load/Import/Export]
│       │   │   └── <PerformanceModeSelector />  [Educational/Dev/Staging/Prod]
│       │   │
│       │   ├── <DemoAppDashboard />        [NEW]
│       │   │   ├── <SystemMetricsCards />  [TPS, Nodes, Messages, Blocks]
│       │   │   └── <WebSocketStatus />     [Connection indicator]
│       │   │
│       │   ├── <RealtimeCharts />          [NEW - Replaces GraphVisualizer]
│       │   │   ├── <TPSLineChart />        [Recharts]
│       │   │   ├── <ConsensusChart />      [Multi-line]
│       │   │   ├── <APIFeedsChart />       [Bar chart]
│       │   │   └── <FinalityLatencyChart /> [Line chart]
│       │   │
│       │   ├── <NodesGrid />               [NEW - Replaces nodes-container]
│       │   │   ├── <ChannelNodePanel />    [Material-UI Card]
│       │   │   ├── <ValidatorNodePanel />  [Material-UI Card]
│       │   │   ├── <BusinessNodePanel />   [Material-UI Card]
│       │   │   └── <APIFeedPanel />        [Material-UI Card]
│       │   │
│       │   ├── <EventLog />                [NEW - System logs]
│       │   │
│       │   └── <ConfigurationDialog />     [NEW - Add/Edit nodes]
│       │       ├── <NodeTypeSelector />
│       │       ├── <NodeConfigForm />
│       │       └── <ConfigActions />
│       │
│       ├── <Transactions />                 [Existing]
│       ├── <Performance />                  [Existing]
│       ├── <NodeManagement />              [Existing - to be merged with DemoApp]
│       ├── <Analytics />                    [Existing]
│       └── <Settings />                     [Existing]
```

---

## 4. State Management Architecture

### 4.1 Redux Store Structure

```typescript
// store/index.ts
{
  auth: AuthState,              // Existing
  dashboard: DashboardState,     // Existing
  transactions: TransactionState, // Existing
  performance: PerformanceState,  // Existing

  // NEW: Demo App State
  demoApp: {
    running: boolean,
    nodes: {
      [nodeId: string]: NodeState
    },
    systemMetrics: {
      systemTPS: number,
      activeNodes: number,
      messagesRouted: number,
      blocksValidated: number,
      lastUpdate: number
    },
    performanceMode: 'educational' | 'development' | 'staging' | 'production',
    websocket: {
      connected: boolean,
      connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING',
      metrics: {
        messagesSent: number,
        messagesReceived: number,
        averageLatency: number,
        queuedMessages: number
      }
    },
    chartData: {
      tps: Array<{ time: string, value: number }>,
      consensus: Array<{ time: string, blocks: number, rounds: number }>,
      apiFeeds: Record<string, number>,
      finalityLatency: Array<{ time: string, value: number }>
    },
    eventLog: Array<{
      timestamp: string,
      message: string,
      level: 'info' | 'success' | 'warning' | 'error'
    }>,
    configuration: {
      currentConfigName: string | null,
      savedConfigs: Array<Configuration>
    }
  }
}
```

### 4.2 Redux Slices

#### demoAppSlice.ts (NEW)

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NodeState {
  id: string;
  type: 'channel' | 'validator' | 'business' | 'api-integration';
  name: string;
  enabled: boolean;
  state: string;
  metrics: Record<string, any>;
  config: Record<string, any>;
}

interface DemoAppState {
  running: boolean;
  nodes: Record<string, NodeState>;
  systemMetrics: {
    systemTPS: number;
    activeNodes: number;
    messagesRouted: number;
    blocksValidated: number;
    lastUpdate: number;
  };
  performanceMode: 'educational' | 'development' | 'staging' | 'production';
  websocket: {
    connected: boolean;
    connectionState: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';
    metrics: {
      messagesSent: number;
      messagesReceived: number;
      averageLatency: number;
      queuedMessages: number;
    };
  };
  chartData: {
    tps: Array<{ time: string; value: number }>;
    consensus: Array<{ time: string; blocks: number; rounds: number }>;
    apiFeeds: Record<string, number>;
    finalityLatency: Array<{ time: string; value: number }>;
  };
  eventLog: Array<{
    timestamp: string;
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
  }>;
  configuration: {
    currentConfigName: string | null;
    savedConfigs: Array<any>;
  };
}

const initialState: DemoAppState = {
  running: false,
  nodes: {},
  systemMetrics: {
    systemTPS: 0,
    activeNodes: 0,
    messagesRouted: 0,
    blocksValidated: 0,
    lastUpdate: Date.now()
  },
  performanceMode: 'educational',
  websocket: {
    connected: false,
    connectionState: 'DISCONNECTED',
    metrics: {
      messagesSent: 0,
      messagesReceived: 0,
      averageLatency: 0,
      queuedMessages: 0
    }
  },
  chartData: {
    tps: [],
    consensus: [],
    apiFeeds: {},
    finalityLatency: []
  },
  eventLog: [],
  configuration: {
    currentConfigName: null,
    savedConfigs: []
  }
};

const demoAppSlice = createSlice({
  name: 'demoApp',
  initialState,
  reducers: {
    // Demo control
    startDemo: (state) => {
      state.running = true;
      state.eventLog.unshift({
        timestamp: new Date().toLocaleTimeString(),
        message: '🚀 Demo started',
        level: 'success'
      });
    },

    stopDemo: (state) => {
      state.running = false;
      state.eventLog.unshift({
        timestamp: new Date().toLocaleTimeString(),
        message: '⏹ Demo stopped',
        level: 'info'
      });
    },

    resetDemo: (state) => {
      return initialState;
    },

    // Node management
    addNode: (state, action: PayloadAction<NodeState>) => {
      state.nodes[action.payload.id] = action.payload;
      state.systemMetrics.activeNodes = Object.keys(state.nodes).length;
    },

    removeNode: (state, action: PayloadAction<string>) => {
      delete state.nodes[action.payload];
      state.systemMetrics.activeNodes = Object.keys(state.nodes).length;
    },

    updateNodeState: (state, action: PayloadAction<{ nodeId: string; updates: Partial<NodeState> }>) => {
      const { nodeId, updates } = action.payload;
      if (state.nodes[nodeId]) {
        state.nodes[nodeId] = { ...state.nodes[nodeId], ...updates };
      }
    },

    updateNodeMetrics: (state, action: PayloadAction<{ nodeId: string; metrics: Record<string, any> }>) => {
      const { nodeId, metrics } = action.payload;
      if (state.nodes[nodeId]) {
        state.nodes[nodeId].metrics = metrics;
      }
    },

    // System metrics
    updateSystemMetrics: (state, action: PayloadAction<Partial<DemoAppState['systemMetrics']>>) => {
      state.systemMetrics = { ...state.systemMetrics, ...action.payload, lastUpdate: Date.now() };
    },

    // Performance mode
    setPerformanceMode: (state, action: PayloadAction<DemoAppState['performanceMode']>) => {
      state.performanceMode = action.payload;
      state.eventLog.unshift({
        timestamp: new Date().toLocaleTimeString(),
        message: `⚡ Switched to ${action.payload} mode`,
        level: 'info'
      });
    },

    // WebSocket
    setWebSocketConnected: (state, action: PayloadAction<boolean>) => {
      state.websocket.connected = action.payload;
      state.websocket.connectionState = action.payload ? 'CONNECTED' : 'DISCONNECTED';
    },

    setWebSocketState: (state, action: PayloadAction<DemoAppState['websocket']['connectionState']>) => {
      state.websocket.connectionState = action.payload;
    },

    updateWebSocketMetrics: (state, action: PayloadAction<Partial<DemoAppState['websocket']['metrics']>>) => {
      state.websocket.metrics = { ...state.websocket.metrics, ...action.payload };
    },

    // Chart data
    addTPSDataPoint: (state, action: PayloadAction<{ time: string; value: number }>) => {
      state.chartData.tps.push(action.payload);
      // Keep only last 60 data points (1 minute sliding window)
      if (state.chartData.tps.length > 60) {
        state.chartData.tps.shift();
      }
    },

    addConsensusDataPoint: (state, action: PayloadAction<{ time: string; blocks: number; rounds: number }>) => {
      state.chartData.consensus.push(action.payload);
      if (state.chartData.consensus.length > 60) {
        state.chartData.consensus.shift();
      }
    },

    updateAPIFeedsData: (state, action: PayloadAction<Record<string, number>>) => {
      state.chartData.apiFeeds = action.payload;
    },

    addFinalityDataPoint: (state, action: PayloadAction<{ time: string; value: number }>) => {
      state.chartData.finalityLatency.push(action.payload);
      if (state.chartData.finalityLatency.length > 60) {
        state.chartData.finalityLatency.shift();
      }
    },

    // Event log
    addLogEvent: (state, action: PayloadAction<{ message: string; level?: 'info' | 'success' | 'warning' | 'error' }>) => {
      state.eventLog.unshift({
        timestamp: new Date().toLocaleTimeString(),
        message: action.payload.message,
        level: action.payload.level || 'info'
      });
      // Keep only last 50 entries
      if (state.eventLog.length > 50) {
        state.eventLog = state.eventLog.slice(0, 50);
      }
    },

    // Configuration
    saveConfiguration: (state, action: PayloadAction<{ name: string; config: any }>) => {
      const existing = state.configuration.savedConfigs.find(c => c.name === action.payload.name);
      if (existing) {
        existing.config = action.payload.config;
        existing.modified = new Date().toISOString();
      } else {
        state.configuration.savedConfigs.push({
          name: action.payload.name,
          config: action.payload.config,
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        });
      }
      state.configuration.currentConfigName = action.payload.name;
    },

    loadConfiguration: (state, action: PayloadAction<string>) => {
      state.configuration.currentConfigName = action.payload;
    }
  }
});

export const {
  startDemo,
  stopDemo,
  resetDemo,
  addNode,
  removeNode,
  updateNodeState,
  updateNodeMetrics,
  updateSystemMetrics,
  setPerformanceMode,
  setWebSocketConnected,
  setWebSocketState,
  updateWebSocketMetrics,
  addTPSDataPoint,
  addConsensusDataPoint,
  updateAPIFeedsData,
  addFinalityDataPoint,
  addLogEvent,
  saveConfiguration,
  loadConfiguration
} = demoAppSlice.actions;

export default demoAppSlice.reducer;
```

---

## 5. API Integration Layer

### 5.1 Service Architecture

```typescript
// services/v11BackendService.ts
import axios, { AxiosInstance } from 'axios';

interface V11Config {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  cacheExpiry: number;
}

class V11BackendService {
  private client: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }>;
  private config: V11Config;

  constructor(config: Partial<V11Config> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:9003',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      cacheExpiry: config.cacheExpiry || 5000
    };

    this.client = axios.create({
      baseURL: `${this.config.baseUrl}/api/v11`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.cache = new Map();
  }

  // Health Check
  async getHealth(): Promise<any> {
    return this.cachedRequest('GET', '/health', {}, this.config.cacheExpiry);
  }

  // System Info
  async getInfo(): Promise<any> {
    return this.cachedRequest('GET', '/info', {}, this.config.cacheExpiry);
  }

  // Performance Stats
  async getPerformance(): Promise<any> {
    return this.request('GET', '/performance');
  }

  // Transaction Stats
  async getStats(): Promise<any> {
    return this.request('GET', '/stats');
  }

  // Consensus Nodes
  async getConsensusNodes(): Promise<any> {
    return this.request('GET', '/consensus/nodes');
  }

  // Consensus State
  async getConsensusState(): Promise<any> {
    return this.request('GET', '/consensus/state');
  }

  // Channels
  async getChannels(): Promise<any> {
    return this.request('GET', '/channels');
  }

  async createChannel(data: any): Promise<any> {
    return this.request('POST', '/channels', data);
  }

  async sendMessage(channelId: string, message: any): Promise<any> {
    return this.request('POST', `/channels/${channelId}/messages`, message);
  }

  // Transactions
  async submitTransaction(transaction: any): Promise<any> {
    return this.request('POST', '/transactions', transaction);
  }

  async getTransaction(txId: string): Promise<any> {
    return this.request('GET', `/transactions/${txId}`);
  }

  // Blockchain
  async getBlockchainHeight(): Promise<any> {
    return this.request('GET', '/blockchain/height');
  }

  async getBlock(height: number): Promise<any> {
    return this.request('GET', `/blockchain/blocks/${height}`);
  }

  // Backend availability check
  async isAvailable(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.status === 'HEALTHY';
    } catch {
      return false;
    }
  }

  // Private helpers
  private async request(method: string, path: string, data?: any): Promise<any> {
    let lastError;

    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const response = await this.client.request({
          method,
          url: path,
          data
        });

        return response.data;
      } catch (error: any) {
        lastError = error;

        // Don't retry 4xx errors
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.config.retryAttempts - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  private async cachedRequest(method: string, path: string, data?: any, ttl: number = 5000): Promise<any> {
    const cacheKey = `${method}:${path}`;
    const cached = this.cache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < ttl) {
      return cached.data;
    }

    const result = await this.request(method, path, data);

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default new V11BackendService();
```

### 5.2 WebSocket Hook

```typescript
// hooks/useWebSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from './index';
import {
  setWebSocketConnected,
  setWebSocketState,
  updateWebSocketMetrics,
  addLogEvent,
  updateSystemMetrics,
  updateNodeMetrics
} from '../store/demoAppSlice';

interface WebSocketConfig {
  url: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export const useWebSocket = (config: WebSocketConfig) => {
  const dispatch = useAppDispatch();
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const heartbeatTimer = useRef<number | null>(null);
  const reconnectTimer = useRef<number | null>(null);

  const {
    url,
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000
  } = config;

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    dispatch(setWebSocketState('CONNECTING'));
    dispatch(addLogEvent({ message: '🔌 Connecting to WebSocket...', level: 'info' }));

    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        reconnectAttempts.current = 0;
        dispatch(setWebSocketConnected(true));
        dispatch(addLogEvent({ message: '✅ WebSocket connected', level: 'success' }));

        // Start heartbeat
        startHeartbeat();
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        dispatch(addLogEvent({ message: '❌ WebSocket error', level: 'error' }));
      };

      ws.current.onclose = () => {
        dispatch(setWebSocketConnected(false));
        dispatch(addLogEvent({ message: '🔌 WebSocket disconnected', level: 'warning' }));

        stopHeartbeat();

        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          dispatch(setWebSocketState('RECONNECTING'));
          reconnectAttempts.current++;

          reconnectTimer.current = window.setTimeout(() => {
            dispatch(addLogEvent({
              message: `🔄 Reconnecting... attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`,
              level: 'info'
            }));
            connect();
          }, reconnectInterval);
        } else {
          dispatch(setWebSocketState('DISCONNECTED'));
          dispatch(addLogEvent({ message: '❌ Max reconnect attempts reached', level: 'error' }));
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      dispatch(setWebSocketState('DISCONNECTED'));
    }
  }, [url, dispatch, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    stopHeartbeat();

    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }

    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }

    reconnectAttempts.current = maxReconnectAttempts; // Prevent auto-reconnect
  }, [maxReconnectAttempts]);

  const send = useCallback((type: string, data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type,
        data,
        timestamp: Date.now(),
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      ws.current.send(JSON.stringify(message));
    }
  }, []);

  const subscribe = useCallback((channel: string, nodeId?: string) => {
    send('subscribe', { channel, nodeId });
  }, [send]);

  const unsubscribe = useCallback((channel: string, nodeId?: string) => {
    send('unsubscribe', { channel, nodeId });
  }, [send]);

  const startHeartbeat = useCallback(() => {
    heartbeatTimer.current = window.setInterval(() => {
      send('ping', { timestamp: Date.now() });
    }, heartbeatInterval);
  }, [send, heartbeatInterval]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  }, []);

  const handleMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'pong':
        // Update latency metrics
        const latency = Date.now() - message.data.timestamp;
        dispatch(updateWebSocketMetrics({ averageLatency: latency }));
        break;

      case 'node-update':
        // Update specific node metrics
        dispatch(updateNodeMetrics({
          nodeId: message.data.nodeId,
          metrics: message.data.metrics
        }));
        break;

      case 'system-metrics':
        // Update system-wide metrics
        dispatch(updateSystemMetrics({
          systemTPS: message.data.tps,
          activeNodes: message.data.activeNodes,
          messagesRouted: message.data.messagesRouted,
          blocksValidated: message.data.blocksValidated
        }));
        break;

      case 'consensus-update':
        dispatch(addLogEvent({
          message: `⚡ Consensus: ${message.data.currentLeader} is leader (term ${message.data.term})`,
          level: 'info'
        }));
        break;

      default:
        console.log('Unknown WebSocket message:', message);
    }
  }, [dispatch]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    isConnected: ws.current?.readyState === WebSocket.OPEN
  };
};
```

---

## 6. React Component Implementation

### 6.1 Main DemoApp Component

```typescript
// pages/DemoApp.tsx
import React, { useEffect, useState } from 'react';
import { Box, Grid, Paper } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  startDemo,
  stopDemo,
  resetDemo,
  addNode,
  updateSystemMetrics,
  addTPSDataPoint,
  addConsensusDataPoint
} from '../store/demoAppSlice';

import DemoAppToolbar from '../components/DemoApp/DemoAppToolbar';
import SystemMetricsCards from '../components/DemoApp/SystemMetricsCards';
import RealtimeCharts from '../components/DemoApp/RealtimeCharts';
import NodesGrid from '../components/DemoApp/NodesGrid';
import EventLog from '../components/DemoApp/EventLog';
import ConfigurationDialog from '../components/DemoApp/ConfigurationDialog';

const DemoApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const demoState = useAppSelector(state => state.demoApp);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  // WebSocket connection
  const { connect, disconnect, subscribe } = useWebSocket({
    url: 'ws://localhost:9003/ws',
    autoConnect: false
  });

  // Simulation timer
  useEffect(() => {
    if (!demoState.running) return;

    const interval = setInterval(() => {
      // Update TPS chart data
      const currentTPS = calculateTPS();
      dispatch(addTPSDataPoint({
        time: new Date().toLocaleTimeString(),
        value: currentTPS
      }));

      // Update consensus chart data
      const consensusData = getConsensusData();
      dispatch(addConsensusDataPoint({
        time: new Date().toLocaleTimeString(),
        blocks: consensusData.blocks,
        rounds: consensusData.rounds
      }));

      // Update system metrics
      dispatch(updateSystemMetrics({
        systemTPS: currentTPS
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [demoState.running, dispatch]);

  const handleStartDemo = () => {
    dispatch(startDemo());
    connect();
    subscribe('system-metrics');
    subscribe('node-updates');
  };

  const handleStopDemo = () => {
    dispatch(stopDemo());
    disconnect();
  };

  const handleResetDemo = () => {
    if (demoState.running) {
      handleStopDemo();
    }
    dispatch(resetDemo());
  };

  const calculateTPS = (): number => {
    // Calculate TPS based on active nodes
    const nodes = Object.values(demoState.nodes);
    let totalTPS = 0;

    nodes.forEach(node => {
      if (node.enabled && node.metrics.throughput) {
        totalTPS += node.metrics.throughput;
      }
    });

    return totalTPS;
  };

  const getConsensusData = () => {
    const validatorNodes = Object.values(demoState.nodes).filter(n => n.type === 'validator');

    let totalBlocks = 0;
    let totalRounds = 0;

    validatorNodes.forEach(node => {
      totalBlocks += node.metrics.blocksValidated || 0;
      totalRounds += node.metrics.consensusRounds || 0;
    });

    return { blocks: totalBlocks, rounds: totalRounds };
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Toolbar */}
      <DemoAppToolbar
        running={demoState.running}
        onStart={handleStartDemo}
        onStop={handleStopDemo}
        onReset={handleResetDemo}
        onOpenConfig={() => setConfigDialogOpen(true)}
      />

      {/* System Metrics Cards */}
      <SystemMetricsCards metrics={demoState.systemMetrics} />

      {/* Real-time Charts */}
      <RealtimeCharts chartData={demoState.chartData} />

      {/* Nodes Grid */}
      <NodesGrid nodes={demoState.nodes} />

      {/* Event Log */}
      <EventLog events={demoState.eventLog} />

      {/* Configuration Dialog */}
      <ConfigurationDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
      />
    </Box>
  );
};

export default DemoApp;
```

### 6.2 System Metrics Cards Component

```typescript
// components/DemoApp/SystemMetricsCards.tsx
import React from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, Router, Message, CheckCircle } from '@mui/icons-material';

interface SystemMetrics {
  systemTPS: number;
  activeNodes: number;
  messagesRouted: number;
  blocksValidated: number;
}

interface Props {
  metrics: SystemMetrics;
}

const SystemMetricsCards: React.FC<Props> = ({ metrics }) => {
  const cards = [
    {
      title: 'System TPS',
      value: metrics.systemTPS.toLocaleString(),
      subtitle: 'Transactions Per Second',
      icon: TrendingUp,
      color: '#4CAF50'
    },
    {
      title: 'Active Nodes',
      value: metrics.activeNodes,
      subtitle: 'Total Running Nodes',
      icon: Router,
      color: '#2196F3'
    },
    {
      title: 'Messages Routed',
      value: metrics.messagesRouted.toLocaleString(),
      subtitle: 'Total Messages Sent',
      icon: Message,
      color: '#FF9800'
    },
    {
      title: 'Blocks Validated',
      value: metrics.blocksValidated.toLocaleString(),
      subtitle: 'Consensus Confirmations',
      icon: CheckCircle,
      color: '#9C27B0'
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${card.color}15 0%, ${card.color}05 100%)`,
                border: `1px solid ${card.color}30`
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Icon sx={{ fontSize: 40, color: card.color, mr: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {card.title}
                  </Typography>
                </Box>
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

export default SystemMetricsCards;
```

### 6.3 Real-time Charts Component

```typescript
// components/DemoApp/RealtimeCharts.tsx
import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartData {
  tps: Array<{ time: string; value: number }>;
  consensus: Array<{ time: string; blocks: number; rounds: number }>;
  apiFeeds: Record<string, number>;
  finalityLatency: Array<{ time: string; value: number }>;
}

interface Props {
  chartData: ChartData;
}

const RealtimeCharts: React.FC<Props> = ({ chartData }) => {
  // Transform API feeds data for bar chart
  const apiFeedsData = Object.entries(chartData.apiFeeds).map(([name, value]) => ({
    name,
    calls: value
  }));

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {/* TPS Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 350 }}>
          <Typography variant="h6" gutterBottom>
            TPS (Transactions Per Second)
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartData.tps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4CAF50"
                strokeWidth={2}
                dot={false}
                animationDuration={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Consensus Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 350 }}>
          <Typography variant="h6" gutterBottom>
            Consensus Activity
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartData.consensus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
              <Legend />
              <Line
                type="monotone"
                dataKey="blocks"
                stroke="#9C27B0"
                strokeWidth={2}
                name="Blocks Validated"
                dot={false}
                animationDuration={0}
              />
              <Line
                type="monotone"
                dataKey="rounds"
                stroke="#FF9800"
                strokeWidth={2}
                name="Consensus Rounds"
                dot={false}
                animationDuration={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* API Feeds Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 350 }}>
          <Typography variant="h6" gutterBottom>
            API Feeds Activity
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={apiFeedsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
              <Bar dataKey="calls" fill="#2196F3" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Finality Latency Chart */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: 350 }}>
          <Typography variant="h6" gutterBottom>
            Finality Latency (ms)
          </Typography>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={chartData.finalityLatency}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333' }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00BCD4"
                strokeWidth={2}
                dot={false}
                animationDuration={0}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default RealtimeCharts;
```

---

## 7. Routing Integration

### 7.1 Updated App.tsx

```typescript
// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DemoApp from './pages/DemoApp';  // NEW
import Transactions from './pages/Transactions';
import Performance from './pages/Performance';
import NodeManagement from './pages/NodeManagement';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { useAppSelector } from './hooks';

function App() {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="demo" element={<DemoApp />} />  {/* NEW */}
          <Route path="transactions" element={<Transactions />} />
          <Route path="performance" element={<Performance />} />
          <Route path="nodes" element={<NodeManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
```

### 7.2 Navigation Menu Update

```typescript
// components/Layout.tsx - Add demo app to navigation
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Real-Time Demo', icon: <ShowChartIcon />, path: '/demo' },  // NEW
  { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
  { text: 'Performance', icon: <SpeedIcon />, path: '/performance' },
  { text: 'Nodes', icon: <RouterIcon />, path: '/nodes' },
  { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
];
```

---

## 8. Deployment Architecture

### 8.1 Docker Configuration

#### Dockerfile (Enterprise Portal)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source
COPY . .

# Build application
RUN npm run build

# Stage 2: Nginx Server
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### nginx.conf

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing - redirect all to index.html
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy to V11 backend
        location /api/v11/ {
            proxy_pass http://localhost:9003/api/v11/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket proxy
        location /ws {
            proxy_pass http://localhost:9003/ws;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400;
        }
    }
}
```

### 8.2 Docker Compose

```yaml
# docker-compose.portal.yml
version: '3.8'

services:
  # V11 Backend
  v11-backend:
    build:
      context: ./aurigraph-v11-standalone
      dockerfile: Dockerfile
    ports:
      - "9003:9003"
      - "9004:9004"
    environment:
      - QUARKUS_HTTP_PORT=9003
      - QUARKUS_GRPC_SERVER_PORT=9004
    networks:
      - aurigraph-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9003/q/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Enterprise Portal
  enterprise-portal:
    build:
      context: ./aurigraph-v11-standalone/enterprise-portal
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      v11-backend:
        condition: service_healthy
    networks:
      - aurigraph-network
    environment:
      - VITE_API_BASE_URL=http://v11-backend:9003
      - VITE_WS_URL=ws://v11-backend:9003/ws

networks:
  aurigraph-network:
    driver: bridge
```

### 8.3 Environment Configuration

#### .env.development

```bash
VITE_API_BASE_URL=http://localhost:9003
VITE_WS_URL=ws://localhost:9003/ws
VITE_DEMO_MODE=true
VITE_ENABLE_ANALYTICS=false
```

#### .env.production

```bash
VITE_API_BASE_URL=https://api.aurigraph.io
VITE_WS_URL=wss://api.aurigraph.io/ws
VITE_DEMO_MODE=false
VITE_ENABLE_ANALYTICS=true
VITE_SENTRY_DSN=https://...
```

---

## 9. Technology Stack Decisions

### 9.1 Frontend Technology Stack

| Category | Technology | Version | Justification |
|----------|-----------|---------|---------------|
| **Framework** | React | 18.2+ | Mature, performant, large ecosystem |
| **Language** | TypeScript | 5.3+ | Type safety, better DX, production-ready |
| **Build Tool** | Vite | 5.0+ | Fast HMR, modern build pipeline |
| **State Management** | Redux Toolkit | 2.0+ | Proven, scalable, DevTools support |
| **UI Library** | Material-UI | 5.14+ | Enterprise-grade, accessible, customizable |
| **Charts** | Recharts | 2.10+ | React-native, composable, performant |
| **HTTP Client** | Axios | 1.6+ | Interceptors, retry logic, TypeScript support |
| **Routing** | React Router | 6.20+ | Standard, nested routes, hooks-based |

### 9.2 State Management: Redux Toolkit vs. Context API

**Decision**: Use **Redux Toolkit** for demo app state

**Rationale**:

| Criteria | Redux Toolkit | Context API | Winner |
|----------|--------------|-------------|--------|
| **Scalability** | Excellent for large apps | Struggles with deep trees | Redux |
| **DevTools** | Redux DevTools (time-travel) | Limited debugging | Redux |
| **Performance** | Optimized updates | Re-renders entire subtree | Redux |
| **Middleware** | Built-in (thunks, sagas) | Manual implementation | Redux |
| **Learning Curve** | Steeper | Simpler | Context |
| **Boilerplate** | Minimal (with Toolkit) | Very minimal | Tie |
| **Persistence** | Easy (redux-persist) | Manual | Redux |
| **Testing** | Well-established patterns | More complex | Redux |

**Conclusion**: Redux Toolkit wins for a complex application with real-time updates, WebSocket integration, and future mobile app requirements.

### 9.3 Chart Library: Chart.js vs. Recharts

**Decision**: Use **Recharts** for React web, **Chart.js** as fallback

**Rationale**:

| Criteria | Recharts | Chart.js | Winner |
|----------|----------|----------|--------|
| **React Integration** | Native React components | Requires wrapper | Recharts |
| **Performance** | Good (SVG-based) | Excellent (Canvas-based) | Chart.js |
| **Customization** | Composable components | Configuration-based | Recharts |
| **Bundle Size** | Smaller (tree-shakeable) | Larger (monolithic) | Recharts |
| **Mobile Support** | Not mobile (web only) | Not mobile | Tie |
| **TypeScript** | Full support | Full support | Tie |
| **Real-time Updates** | Excellent | Excellent | Tie |

**Conclusion**: Recharts for React web portal, Victory Native for React Native mobile (separate implementation).

---

## 10. File Structure

### 10.1 Enterprise Portal Directory Structure

```
enterprise-portal/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── DemoApp/                    [NEW]
│   │   │   ├── DemoAppToolbar.tsx
│   │   │   ├── SystemMetricsCards.tsx
│   │   │   ├── RealtimeCharts.tsx
│   │   │   ├── NodesGrid.tsx
│   │   │   │   ├── ChannelNodePanel.tsx
│   │   │   │   ├── ValidatorNodePanel.tsx
│   │   │   │   ├── BusinessNodePanel.tsx
│   │   │   │   └── APIFeedPanel.tsx
│   │   │   ├── EventLog.tsx
│   │   │   ├── ConfigurationDialog.tsx
│   │   │   └── PerformanceModeSelector.tsx
│   │   ├── Layout.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ... (existing components)
│   │
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useWebSocket.ts             [NEW]
│   │   └── useV11Backend.ts            [NEW]
│   │
│   ├── pages/
│   │   ├── DemoApp.tsx                 [NEW]
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Performance.tsx
│   │   ├── NodeManagement.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   └── Login.tsx
│   │
│   ├── services/
│   │   ├── v11BackendService.ts        [NEW]
│   │   ├── api.ts                      [Existing]
│   │   └── ... (existing services)
│   │
│   ├── store/
│   │   ├── index.ts
│   │   ├── demoAppSlice.ts             [NEW]
│   │   ├── authSlice.ts
│   │   ├── dashboardSlice.ts
│   │   ├── transactionSlice.ts
│   │   └── performanceSlice.ts
│   │
│   ├── types/
│   │   ├── demoApp.ts                  [NEW]
│   │   ├── nodes.ts                    [NEW]
│   │   └── ... (existing types)
│   │
│   ├── utils/
│   │   ├── configurationManager.ts     [NEW - Ported from demo app]
│   │   ├── scalabilityModes.ts         [NEW - Ported from demo app]
│   │   └── ... (existing utils)
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env.development
├── .env.production
├── Dockerfile
├── nginx.conf
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 11. Migration Checklist

### 11.1 Phase 1: Foundation (Week 1-2)

- [ ] Create `demoAppSlice.ts` with complete state structure
- [ ] Implement `useWebSocket` custom hook
- [ ] Create `v11BackendService.ts` API client
- [ ] Add `/demo` route to `App.tsx`
- [ ] Create `DemoApp.tsx` main page component
- [ ] Implement `SystemMetricsCards.tsx` component
- [ ] Update navigation menu with demo app link

### 11.2 Phase 2: Core Components (Week 3-4)

- [ ] Implement `RealtimeCharts.tsx` with Recharts
- [ ] Create `ChannelNodePanel.tsx` component
- [ ] Create `ValidatorNodePanel.tsx` component
- [ ] Create `BusinessNodePanel.tsx` component
- [ ] Create `APIFeedPanel.tsx` component
- [ ] Implement `NodesGrid.tsx` layout component
- [ ] Create `EventLog.tsx` component

### 11.3 Phase 3: Advanced Features (Week 5-6)

- [ ] Implement `DemoAppToolbar.tsx` with all controls
- [ ] Create `ConfigurationDialog.tsx` for add/edit nodes
- [ ] Implement `PerformanceModeSelector.tsx`
- [ ] Port `ConfigurationManager` logic to TypeScript
- [ ] Port `ScalabilityModesManager` logic to TypeScript
- [ ] Implement configuration save/load/import/export
- [ ] Add WebSocket reconnection logic

### 11.4 Phase 4: Testing & Polish (Week 7-8)

- [ ] Write unit tests for Redux slices (80%+ coverage)
- [ ] Write component tests for all demo app components
- [ ] Write integration tests for WebSocket flow
- [ ] Add TypeScript types to all components
- [ ] Performance optimization (lazy loading, memoization)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Documentation (JSDoc, README updates)
- [ ] Docker deployment testing

---

## 12. API Integration Patterns

### 12.1 REST API Integration Pattern

```typescript
// Example: Fetching performance stats
import { useEffect } from 'react';
import { useAppDispatch } from '../hooks';
import v11BackendService from '../services/v11BackendService';
import { updateSystemMetrics, addLogEvent } from '../store/demoAppSlice';

export const useFetchPerformanceStats = (intervalMs: number = 5000) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await v11BackendService.getPerformance();

        dispatch(updateSystemMetrics({
          systemTPS: stats.transactionsPerSecond
        }));

        dispatch(addLogEvent({
          message: `📊 Performance: ${stats.transactionsPerSecond.toLocaleString()} TPS`,
          level: 'success'
        }));
      } catch (error) {
        console.error('Failed to fetch performance stats:', error);

        dispatch(addLogEvent({
          message: '❌ Failed to fetch performance stats',
          level: 'error'
        }));
      }
    };

    // Initial fetch
    fetchStats();

    // Poll every N seconds
    const interval = setInterval(fetchStats, intervalMs);

    return () => clearInterval(interval);
  }, [dispatch, intervalMs]);
};
```

### 12.2 WebSocket Integration Pattern

```typescript
// Example: Subscribing to node updates
import { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAppDispatch } from '../hooks';
import { updateNodeMetrics } from '../store/demoAppSlice';

export const useNodeUpdatesSubscription = (nodeId: string) => {
  const { subscribe, unsubscribe, isConnected } = useWebSocket({
    url: 'ws://localhost:9003/ws'
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to node updates
    subscribe('node-updates', nodeId);

    // Cleanup: unsubscribe on unmount
    return () => {
      unsubscribe('node-updates', nodeId);
    };
  }, [nodeId, isConnected, subscribe, unsubscribe]);
};
```

---

## 13. Code Examples

### 13.1 Channel Node Panel Component

```typescript
// components/DemoApp/NodesGrid/ChannelNodePanel.tsx
import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  LinearProgress
} from '@mui/material';
import {
  Router as RouterIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface ChannelNodePanelProps {
  node: {
    id: string;
    name: string;
    state: string;
    enabled: boolean;
    metrics: {
      activeConnections: number;
      throughput: number;
      totalMessagesSent: number;
      totalMessagesReceived: number;
      queueDepth: number;
      routingEfficiency: number;
    };
  };
  onPauseResume: (nodeId: string) => void;
  onViewDetails: (nodeId: string) => void;
}

const ChannelNodePanel: React.FC<ChannelNodePanelProps> = ({
  node,
  onPauseResume,
  onViewDetails
}) => {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'ROUTING': return 'success';
      case 'CONNECTED': return 'info';
      case 'OVERLOAD': return 'warning';
      case 'DISCONNECTED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card
      sx={{
        background: 'linear-gradient(135deg, #2196F315 0%, #2196F305 100%)',
        border: '1px solid #2196F330'
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <RouterIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div">
              {node.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Channel Node
            </Typography>
          </Box>
          <Chip
            label={node.state}
            color={getStateColor(node.state)}
            size="small"
          />
        </Box>

        {/* Metrics Grid */}
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                THROUGHPUT
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {node.metrics.throughput.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                msg/sec
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                CONNECTIONS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {node.metrics.activeConnections}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                active
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                MESSAGES SENT
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {node.metrics.totalMessagesSent.toLocaleString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={6}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                QUEUE DEPTH
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {node.metrics.queueDepth}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Routing Efficiency Progress Bar */}
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              ROUTING EFFICIENCY
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {node.metrics.routingEfficiency}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={node.metrics.routingEfficiency}
            sx={{ height: 6, borderRadius: 1 }}
          />
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          startIcon={node.enabled ? <PauseIcon /> : <PlayIcon />}
          onClick={() => onPauseResume(node.id)}
        >
          {node.enabled ? 'Pause' : 'Resume'}
        </Button>
        <Button
          size="small"
          startIcon={<InfoIcon />}
          onClick={() => onViewDetails(node.id)}
        >
          Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default ChannelNodePanel;
```

---

## 14. Performance Optimization

### 14.1 React Component Optimization

```typescript
// Memoization for expensive components
import React, { memo } from 'react';

const ChannelNodePanel = memo<ChannelNodePanelProps>(
  ({ node, onPauseResume, onViewDetails }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom equality check
    return (
      prevProps.node.id === nextProps.node.id &&
      prevProps.node.state === nextProps.node.state &&
      prevProps.node.metrics.throughput === nextProps.node.metrics.throughput
    );
  }
);
```

### 14.2 Redux Selector Optimization

```typescript
// Use reselect for memoized selectors
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Base selectors
const selectNodes = (state: RootState) => state.demoApp.nodes;
const selectPerformanceMode = (state: RootState) => state.demoApp.performanceMode;

// Memoized derived selector
export const selectActiveNodes = createSelector(
  [selectNodes],
  (nodes) => {
    return Object.values(nodes).filter(node => node.enabled);
  }
);

export const selectTotalTPS = createSelector(
  [selectActiveNodes],
  (activeNodes) => {
    return activeNodes.reduce((sum, node) => sum + (node.metrics.throughput || 0), 0);
  }
);
```

### 14.3 Chart Performance Optimization

```typescript
// Disable animations for real-time charts
<ResponsiveContainer width="100%" height="90%">
  <LineChart data={chartData.tps}>
    <Line
      type="monotone"
      dataKey="value"
      stroke="#4CAF50"
      strokeWidth={2}
      dot={false}
      isAnimationActive={false}  // Disable animation for performance
    />
  </LineChart>
</ResponsiveContainer>
```

---

## 15. Testing Strategy

### 15.1 Redux Slice Tests

```typescript
// store/demoAppSlice.test.ts
import demoAppReducer, {
  startDemo,
  stopDemo,
  addNode,
  updateNodeMetrics
} from './demoAppSlice';

describe('demoAppSlice', () => {
  const initialState = {
    running: false,
    nodes: {},
    systemMetrics: {
      systemTPS: 0,
      activeNodes: 0,
      messagesRouted: 0,
      blocksValidated: 0,
      lastUpdate: 0
    }
  };

  it('should handle startDemo', () => {
    const nextState = demoAppReducer(initialState, startDemo());
    expect(nextState.running).toBe(true);
    expect(nextState.eventLog).toHaveLength(1);
    expect(nextState.eventLog[0].message).toContain('Demo started');
  });

  it('should handle addNode', () => {
    const node = {
      id: 'node-1',
      type: 'channel',
      name: 'Channel 1',
      enabled: true,
      state: 'IDLE',
      metrics: {},
      config: {}
    };

    const nextState = demoAppReducer(initialState, addNode(node));
    expect(nextState.nodes['node-1']).toEqual(node);
    expect(nextState.systemMetrics.activeNodes).toBe(1);
  });

  it('should handle updateNodeMetrics', () => {
    const stateWithNode = {
      ...initialState,
      nodes: {
        'node-1': {
          id: 'node-1',
          type: 'channel',
          name: 'Channel 1',
          enabled: true,
          state: 'ROUTING',
          metrics: { throughput: 0 },
          config: {}
        }
      }
    };

    const nextState = demoAppReducer(
      stateWithNode,
      updateNodeMetrics({
        nodeId: 'node-1',
        metrics: { throughput: 1000 }
      })
    );

    expect(nextState.nodes['node-1'].metrics.throughput).toBe(1000);
  });
});
```

### 15.2 Component Tests

```typescript
// components/DemoApp/SystemMetricsCards.test.tsx
import { render, screen } from '@testing-library/react';
import SystemMetricsCards from './SystemMetricsCards';

describe('SystemMetricsCards', () => {
  const mockMetrics = {
    systemTPS: 1246392,
    activeNodes: 12,
    messagesRouted: 5000000,
    blocksValidated: 12345
  };

  it('should render all metric cards', () => {
    render(<SystemMetricsCards metrics={mockMetrics} />);

    expect(screen.getByText('System TPS')).toBeInTheDocument();
    expect(screen.getByText('Active Nodes')).toBeInTheDocument();
    expect(screen.getByText('Messages Routed')).toBeInTheDocument();
    expect(screen.getByText('Blocks Validated')).toBeInTheDocument();
  });

  it('should format TPS with locale string', () => {
    render(<SystemMetricsCards metrics={mockMetrics} />);
    expect(screen.getByText('1,246,392')).toBeInTheDocument();
  });

  it('should display active nodes count', () => {
    render(<SystemMetricsCards metrics={mockMetrics} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});
```

---

## 16. Security Considerations

### 16.1 API Key Storage (Future Feature)

```typescript
// When adding external API integrations (Alpaca, Weather, X.com)
// DO NOT store API keys in localStorage or Redux state

// CORRECT: Use secure environment variables
const alpacaApiKey = import.meta.env.VITE_ALPACA_API_KEY;

// INCORRECT: Never hardcode or store in client
const alpacaApiKey = 'AKIXXXXXXXX';  // ❌ BAD
localStorage.setItem('alpacaKey', apiKey);  // ❌ BAD
```

### 16.2 WebSocket Authentication (Future)

```typescript
// When adding authentication to WebSocket
const { connect } = useWebSocket({
  url: 'wss://api.aurigraph.io/ws',
  onConnect: (ws) => {
    // Send auth token after connection
    ws.send(JSON.stringify({
      type: 'authenticate',
      data: {
        token: getAuthToken()
      }
    }));
  }
});
```

---

## 17. Success Criteria

### 17.1 Technical Success Metrics

- ✅ All 9 demo app modules successfully integrated
- ✅ Redux state management fully functional
- ✅ Material-UI design system applied consistently
- ✅ Real-time charts rendering at 60 FPS
- ✅ WebSocket connection stable with auto-reconnect
- ✅ REST API integration with retry logic working
- ✅ Configuration save/load/import/export functional
- ✅ Performance mode switching operational
- ✅ TypeScript coverage 100%
- ✅ Test coverage 80%+
- ✅ Docker deployment successful
- ✅ Lighthouse performance score 90+

### 17.2 User Experience Success Metrics

- ✅ Page load time <3 seconds
- ✅ Chart updates every 1 second without lag
- ✅ UI remains responsive during 2M TPS simulation
- ✅ WebSocket reconnects within 5 seconds
- ✅ All interactions feel instant (<300ms response)
- ✅ Accessibility score (WCAG 2.1 AA) 100%
- ✅ Mobile responsive (tablet support)

---

## 18. Risks and Mitigation

### 18.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Redux state tree too large | High | Medium | Use normalized state, reselect memoization |
| Real-time updates cause re-renders | High | High | Memoization, shouldComponentUpdate, React.memo |
| WebSocket connection drops frequently | Medium | Medium | Exponential backoff, message queuing |
| Chart performance degrades with high TPS | High | Medium | Reduce data points (60 max), disable animations |
| TypeScript migration takes too long | Medium | Low | Incremental migration, allow `.tsx` + `.jsx` coexistence |

### 18.2 Integration Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Demo app modules don't fit React paradigm | High | Low | Wrapper components as fallback |
| Redux adds too much boilerplate | Medium | Low | Redux Toolkit reduces boilerplate significantly |
| Material-UI bundle size too large | Medium | Medium | Tree shaking, lazy loading, code splitting |
| V11 backend API not ready | High | Medium | Demo mode with mock data |

---

## 19. Future Enhancements

### 19.1 Phase 2 Features (Post-MVP)

1. **Spatial Dashboard (3D Visualization)**
   - Three.js or React Three Fiber for 3D node visualization
   - Force-directed graph layout
   - Interactive node dragging and zooming

2. **Advanced Analytics**
   - Historical data export (CSV, Excel)
   - Custom chart builder
   - Alerting and notifications

3. **Multi-user Features**
   - User accounts and authentication (Keycloak)
   - Cloud sync of configurations
   - Sharing configurations with other users

4. **Mobile App Integration**
   - Shared Redux logic between web and mobile
   - React Native version of portal
   - Flutter version of portal

---

## 20. Conclusion

This architecture document provides a complete blueprint for integrating the existing Real-Time Node Visualization Demo App into the Aurigraph V11 Enterprise Portal. The hybrid approach balances rapid prototyping with long-term maintainability, leveraging React best practices, Redux Toolkit for state management, and Material-UI for a consistent design system.

### Key Takeaways

1. **Modular Architecture**: Demo app modules map cleanly to React components
2. **State Management**: Redux Toolkit provides scalable state management
3. **API Integration**: V11 backend REST + WebSocket integration patterns defined
4. **Performance**: Optimizations ensure 60 FPS real-time updates at 2M+ TPS
5. **Reusability**: Component architecture supports future mobile conversion
6. **Deployment**: Docker + nginx configuration ready for production

### Next Steps

1. ✅ Complete Task 1.2.1: Enterprise Portal Integration Architecture (this document)
2. 🔄 Proceed to Task 1.2.2: Mobile App Architecture (Flutter + React Native)
3. 🔄 Begin implementation in Phase 2 (Weeks 1-8)

---

**Document Status**: ✅ Complete
**Prepared by**: Claude Code (Frontend Development Agent - FDA)
**Date**: October 9, 2025
**Version**: 1.0

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

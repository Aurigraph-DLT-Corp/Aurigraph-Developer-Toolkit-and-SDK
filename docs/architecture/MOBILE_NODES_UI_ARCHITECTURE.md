# Mobile Nodes UI Architecture Design

**Version**: 12.0.0
**Author**: Frontend Architecture Team
**Date**: December 2025
**JIRA**: AV11-547

## Executive Summary

This document outlines the UI architecture for Mobile Nodes (formerly Slim Nodes) in the Aurigraph V12 platform. Mobile Nodes provide lightweight, resource-efficient blockchain participation for mobile devices and edge deployments.

## 1. Overview

### 1.1 What are Mobile Nodes?

Mobile Nodes are lightweight blockchain nodes designed for:
- Mobile devices (iOS, Android)
- IoT edge devices
- Resource-constrained environments
- Quick synchronization requirements

### 1.2 Key Features

| Feature | Description |
|---------|-------------|
| Light Sync | Header-only synchronization |
| SPV Mode | Simplified Payment Verification |
| Low Memory | < 128MB RAM footprint |
| Quick Start | < 5 second startup time |
| Battery Efficient | Optimized for mobile power |

## 2. UI Architecture

### 2.1 Component Hierarchy

```
MobileNodeDashboard
├── NodeStatusWidget
│   ├── SyncProgressBar
│   ├── PeerCount
│   └── NetworkHealth
├── TransactionPanel
│   ├── SendTransaction
│   ├── TransactionHistory
│   └── PendingTransactions
├── WalletSection
│   ├── BalanceDisplay
│   ├── TokenList
│   └── QRCodeScanner
├── SettingsPanel
│   ├── NetworkSelector
│   ├── SyncModeToggle
│   └── NotificationSettings
└── NavigationBar
    ├── HomeTab
    ├── WalletTab
    ├── HistoryTab
    └── SettingsTab
```

### 2.2 State Management

```typescript
// Mobile Node State Structure
interface MobileNodeState {
  // Connection State
  connection: {
    status: 'connecting' | 'connected' | 'disconnected' | 'syncing';
    peerCount: number;
    latency: number;
    lastBlock: number;
  };

  // Sync State
  sync: {
    mode: 'light' | 'spv' | 'full';
    progress: number;
    headersDownloaded: number;
    estimatedTime: number;
  };

  // Wallet State
  wallet: {
    address: string;
    balance: BigNumber;
    tokens: TokenBalance[];
    pendingTx: Transaction[];
  };

  // Settings
  settings: {
    network: 'mainnet' | 'testnet';
    notifications: boolean;
    biometricAuth: boolean;
    autoSync: boolean;
  };
}
```

### 2.3 Component Specifications

#### NodeStatusWidget

```typescript
interface NodeStatusWidgetProps {
  status: ConnectionStatus;
  syncProgress: number;
  peerCount: number;
  blockHeight: number;
  onRefresh: () => void;
}

// Display states
const STATUS_COLORS = {
  connected: '#4CAF50',
  syncing: '#2196F3',
  connecting: '#FFC107',
  disconnected: '#F44336',
};
```

#### TransactionPanel

```typescript
interface TransactionPanelProps {
  wallet: WalletState;
  onSend: (tx: TransactionRequest) => Promise<string>;
  onReceive: () => void;
  history: Transaction[];
}

// Transaction flow
const TRANSACTION_STEPS = [
  'SELECT_RECIPIENT',
  'ENTER_AMOUNT',
  'REVIEW_FEES',
  'CONFIRM_BIOMETRIC',
  'BROADCAST',
  'COMPLETE',
];
```

## 3. Screen Designs

### 3.1 Home Screen

```
┌────────────────────────────┐
│  [Logo]  Aurigraph Mobile  │
├────────────────────────────┤
│                            │
│   ┌──────────────────┐     │
│   │  Node Status     │     │
│   │  ● Connected     │     │
│   │  Block: 15,234   │     │
│   │  Peers: 8        │     │
│   └──────────────────┘     │
│                            │
│   ┌──────────────────┐     │
│   │  Balance         │     │
│   │  1,234.56 AUR    │     │
│   │  ≈ $12,345.60    │     │
│   └──────────────────┘     │
│                            │
│   [Send]    [Receive]      │
│                            │
│   Recent Transactions      │
│   ├─ Received 100 AUR      │
│   ├─ Sent 50 AUR           │
│   └─ Staking Reward        │
│                            │
├────────────────────────────┤
│  [Home] [Wallet] [History] │
└────────────────────────────┘
```

### 3.2 Sync Progress Screen

```
┌────────────────────────────┐
│        Syncing...          │
├────────────────────────────┤
│                            │
│   ████████████░░░░ 75%     │
│                            │
│   Headers: 12,345 / 16,460 │
│   Blocks verified: 8,234   │
│                            │
│   Estimated time: 2 min    │
│                            │
│   Mode: Light Sync (SPV)   │
│                            │
│   [Switch to Full Sync]    │
│                            │
└────────────────────────────┘
```

## 4. API Integration

### 4.1 Mobile Node Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v12/mobile/status` | GET | Node status |
| `/api/v12/mobile/sync` | POST | Start sync |
| `/api/v12/mobile/peers` | GET | Peer list |
| `/api/v12/mobile/headers` | GET | Block headers |
| `/api/v12/mobile/spv/verify` | POST | SPV verification |

### 4.2 WebSocket Channels

```typescript
// Mobile-optimized WebSocket channels
const MOBILE_WS_CHANNELS = {
  STATUS: '/ws/mobile/status',        // Node status updates
  BLOCKS: '/ws/mobile/blocks',        // New block notifications
  TRANSACTIONS: '/ws/mobile/tx',      // Transaction confirmations
  BALANCE: '/ws/mobile/balance',      // Balance updates
};
```

## 5. Performance Requirements

### 5.1 Mobile Constraints

| Metric | Target |
|--------|--------|
| Initial Load | < 2 seconds |
| Sync Start | < 500ms |
| Memory Usage | < 100MB |
| Battery Impact | < 5%/hour active |
| Data Usage | < 50MB/day |

### 5.2 Offline Support

```typescript
// Offline capabilities
const OFFLINE_FEATURES = {
  VIEW_BALANCE: true,
  VIEW_HISTORY: true,
  PREPARE_TX: true,
  BROADCAST_TX: false,  // Requires connection
  VERIFY_SPV: false,    // Requires connection
};
```

## 6. Security Considerations

### 6.1 Key Management

- Private keys stored in secure enclave (iOS) / Keystore (Android)
- Biometric authentication for transactions
- Hardware security module integration
- Encrypted local storage

### 6.2 Network Security

- TLS 1.3 for all connections
- Certificate pinning
- Tor support (optional)
- VPN-friendly design

## 7. Implementation Plan

### Phase 1: Core Features (Sprint 1-2)
- [ ] Node status display
- [ ] Wallet integration
- [ ] Basic transactions
- [ ] Settings panel

### Phase 2: Sync Features (Sprint 3-4)
- [ ] Light sync implementation
- [ ] SPV verification
- [ ] Header chain validation
- [ ] Peer discovery UI

### Phase 3: Advanced Features (Sprint 5-6)
- [ ] QR code scanning
- [ ] Push notifications
- [ ] Widget support
- [ ] Deep linking

### Phase 4: Polish (Sprint 7-8)
- [ ] Performance optimization
- [ ] Accessibility
- [ ] Localization
- [ ] App store preparation

## 8. Technology Stack

### 8.1 Frontend Framework

- **React Native** for cross-platform development
- **TypeScript** for type safety
- **Zustand** for state management
- **React Query** for API caching

### 8.2 Native Modules

```typescript
// Required native modules
const NATIVE_MODULES = {
  SecureStorage: 'react-native-keychain',
  Biometrics: 'react-native-biometrics',
  Crypto: 'react-native-crypto',
  Bluetooth: 'react-native-ble-plx',  // For hardware wallet
};
```

## 9. Testing Strategy

### 9.1 Test Coverage

| Test Type | Coverage Target |
|-----------|-----------------|
| Unit Tests | 80% |
| Integration Tests | 70% |
| E2E Tests | 50% |
| Performance Tests | All critical paths |

### 9.2 Device Testing Matrix

| OS | Devices |
|----|---------|
| iOS | iPhone 12+, iPad |
| Android | Pixel 6+, Samsung S21+ |
| Tablets | iPad Pro, Galaxy Tab |

## 10. Appendix

### A. Component Library

Using Aurigraph Design System components:
- `AurButton`
- `AurCard`
- `AurInput`
- `AurProgress`
- `AurBadge`

### B. Color Palette

```css
:root {
  --mobile-primary: #6366F1;
  --mobile-success: #22C55E;
  --mobile-warning: #F59E0B;
  --mobile-error: #EF4444;
  --mobile-background: #0F172A;
  --mobile-surface: #1E293B;
}
```

### C. References

- [Aurigraph Design System](./DESIGN_SYSTEM.md)
- [Mobile Node Protocol](./MOBILE_NODE_PROTOCOL.md)
- [SPV Specification](./SPV_SPECIFICATION.md)

---

*Document generated for AV11-547: Mobile Nodes UI Architecture Design*

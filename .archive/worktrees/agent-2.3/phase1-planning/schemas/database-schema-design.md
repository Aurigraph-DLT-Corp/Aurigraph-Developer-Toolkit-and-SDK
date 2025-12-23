# Database Schema Design
**Phase 1, Task 1.2.3 - Database Schema Design**
**Date**: October 9, 2025
**Project**: AV11-DEMO-MOBILE-2025
**Version**: 1.0

---

## Document Overview

This document defines the complete database schema design for the Aurigraph DLT mobile applications (Flutter and React Native) and Enterprise Portal (React Web). The schema covers local storage, caching, and data persistence strategies across all three platforms with a focus on real-time performance, security, and cross-platform consistency.

---

## 1. Storage Strategy Overview

### 1.1 Platform-Specific Storage Technologies

#### Web (Enterprise Portal)
- **localStorage**: Configuration data, user preferences (5-10MB limit)
- **IndexedDB**: Large datasets, metrics cache, historical data (50MB+ capacity)
- **Session Storage**: Temporary session data (cleared on tab close)

#### Flutter Mobile
- **SharedPreferences**: User settings, small configuration data (<1MB per key)
- **Hive**: Node configurations, metrics cache (NoSQL, typed boxes, encryption support)
- **flutter_secure_storage**: API keys, sensitive credentials (Keychain on iOS, EncryptedSharedPreferences on Android)

#### React Native Mobile
- **AsyncStorage**: Configuration data, app settings (key-value, async API)
- **MMKV**: High-performance metrics cache (fast key-value storage with encryption)
- **react-native-keychain**: API keys, sensitive credentials (Keychain/Keystore)

### 1.2 Storage Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                       │
│                  (BLoC / Redux / Context)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Repository Layer                          │
│         (Business Logic, Caching, Validation)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼──────┐ ┌────▼──────────┐
│ Configuration│ │  Metrics  │ │ Secure Storage│
│   Storage    │ │   Cache   │ │  (API Keys)   │
└──────────────┘ └───────────┘ └───────────────┘
```

---

## 2. Core Data Models

### 2.1 Configuration Entity

**Purpose**: Store user-created node configurations

#### TypeScript Interface (Web/React Native)

```typescript
interface Configuration {
  id: string;                    // UUID v4
  name: string;                  // User-friendly name
  description?: string;          // Optional description
  created: string;               // ISO 8601 timestamp
  modified: string;              // ISO 8601 timestamp
  isDefault: boolean;            // Auto-load on startup
  performanceMode: PerformanceMode;
  nodes: NodeConfiguration[];    // Array of node configs
  version: string;               // Schema version (e.g., "1.0")
}

type PerformanceMode =
  | 'educational'    // 3K TPS
  | 'development'    // 30K TPS
  | 'staging'        // 300K TPS
  | 'production';    // 2M+ TPS

interface NodeConfiguration {
  id: string;                    // Unique node ID
  type: NodeType;
  name: string;
  enabled: boolean;
  config: ChannelConfig | ValidatorConfig | BusinessConfig | SlimConfig;
}

type NodeType = 'channel' | 'validator' | 'business' | 'slim';
```

#### Dart Class (Flutter)

```dart
class Configuration {
  final String id;
  final String name;
  final String? description;
  final DateTime created;
  final DateTime modified;
  final bool isDefault;
  final PerformanceMode performanceMode;
  final List<NodeConfiguration> nodes;
  final String version;

  Configuration({
    required this.id,
    required this.name,
    this.description,
    required this.created,
    required this.modified,
    required this.isDefault,
    required this.performanceMode,
    required this.nodes,
    this.version = '1.0',
  });

  // Serialization
  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'description': description,
    'created': created.toIso8601String(),
    'modified': modified.toIso8601String(),
    'isDefault': isDefault,
    'performanceMode': performanceMode.toString(),
    'nodes': nodes.map((n) => n.toJson()).toList(),
    'version': version,
  };

  factory Configuration.fromJson(Map<String, dynamic> json) => Configuration(
    id: json['id'] as String,
    name: json['name'] as String,
    description: json['description'] as String?,
    created: DateTime.parse(json['created'] as String),
    modified: DateTime.parse(json['modified'] as String),
    isDefault: json['isDefault'] as bool,
    performanceMode: PerformanceMode.values.byName(json['performanceMode']),
    nodes: (json['nodes'] as List)
        .map((e) => NodeConfiguration.fromJson(e as Map<String, dynamic>))
        .toList(),
    version: json['version'] as String? ?? '1.0',
  );
}

enum PerformanceMode {
  educational,   // 3K TPS
  development,   // 30K TPS
  staging,       // 300K TPS
  production     // 2M+ TPS
}
```

### 2.2 Node Configuration Models

#### Channel Node Configuration

```typescript
interface ChannelConfig {
  maxConnections: number;        // 10-500, default: 50
  routingAlgorithm: 'round-robin' | 'least-connections' | 'weighted';
  bufferSize: number;            // 1K-100K, default: 5000
  timeout: number;               // 5000-60000ms, default: 30000
}
```

```dart
class ChannelConfig {
  final int maxConnections;      // 10-500
  final RoutingAlgorithm routingAlgorithm;
  final int bufferSize;          // 1K-100K
  final int timeout;             // milliseconds

  const ChannelConfig({
    this.maxConnections = 50,
    this.routingAlgorithm = RoutingAlgorithm.roundRobin,
    this.bufferSize = 5000,
    this.timeout = 30000,
  });

  Map<String, dynamic> toJson() => {
    'maxConnections': maxConnections,
    'routingAlgorithm': routingAlgorithm.name,
    'bufferSize': bufferSize,
    'timeout': timeout,
  };
}

enum RoutingAlgorithm { roundRobin, leastConnections, weighted }
```

#### Validator Node Configuration

```typescript
interface ValidatorConfig {
  stakeAmount: number;           // Validator stake
  votingPower: number;           // 0.0-1.0
  consensusTimeout: number;      // 150-300ms, randomized
  maxBlockSize: number;          // Max transactions per block (default: 1M)
}
```

```dart
class ValidatorConfig {
  final double stakeAmount;
  final double votingPower;      // 0.0-1.0
  final int consensusTimeout;    // milliseconds
  final int maxBlockSize;        // transactions per block

  const ValidatorConfig({
    this.stakeAmount = 1000.0,
    this.votingPower = 1.0,
    this.consensusTimeout = 200,
    this.maxBlockSize = 1000000,
  });

  Map<String, dynamic> toJson() => {
    'stakeAmount': stakeAmount,
    'votingPower': votingPower,
    'consensusTimeout': consensusTimeout,
    'maxBlockSize': maxBlockSize,
  };
}
```

#### Business Node Configuration

```typescript
interface BusinessConfig {
  processingCapacity: number;    // TPS capacity
  queueSize: number;             // Transaction queue size
  batchSize: number;             // Transactions per batch
  parallelThreads: number;       // Processing threads
}
```

```dart
class BusinessConfig {
  final int processingCapacity;  // TPS capacity
  final int queueSize;
  final int batchSize;
  final int parallelThreads;

  const BusinessConfig({
    this.processingCapacity = 8000,
    this.queueSize = 10000,
    this.batchSize = 100,
    this.parallelThreads = 4,
  });

  Map<String, dynamic> toJson() => {
    'processingCapacity': processingCapacity,
    'queueSize': queueSize,
    'batchSize': batchSize,
    'parallelThreads': parallelThreads,
  };
}
```

#### Slim Node Configuration

```typescript
interface SlimConfig {
  feedType: 'alpaca' | 'weather' | 'twitter';
  updateFrequency: number;       // Milliseconds between updates
  apiKeyRef: string;             // Reference to secure storage (NOT the actual key)
  endpoint: string;              // API endpoint URL
  rateLimit: number;             // Requests per minute

  // Provider-specific configs
  alpaca?: {
    symbols: string[];           // ['AAPL', 'GOOGL', ...]
  };
  weather?: {
    locations: string[];         // ['New York', 'London', ...]
  };
  twitter?: {
    topics: string[];            // ['#blockchain', '#crypto', ...]
  };
}
```

```dart
class SlimConfig {
  final FeedType feedType;
  final int updateFrequency;     // milliseconds
  final String apiKeyRef;        // Reference only
  final String endpoint;
  final int rateLimit;

  // Provider-specific
  final List<String>? symbols;   // Alpaca
  final List<String>? locations; // Weather
  final List<String>? topics;    // Twitter

  const SlimConfig({
    required this.feedType,
    required this.updateFrequency,
    required this.apiKeyRef,
    required this.endpoint,
    required this.rateLimit,
    this.symbols,
    this.locations,
    this.topics,
  });

  Map<String, dynamic> toJson() => {
    'feedType': feedType.name,
    'updateFrequency': updateFrequency,
    'apiKeyRef': apiKeyRef,
    'endpoint': endpoint,
    'rateLimit': rateLimit,
    if (symbols != null) 'symbols': symbols,
    if (locations != null) 'locations': locations,
    if (topics != null) 'topics': topics,
  };
}

enum FeedType { alpaca, weather, twitter }
```

---

## 3. Settings Entity

**Purpose**: Store app-wide settings and preferences

### TypeScript Interface

```typescript
interface AppSettings {
  version: string;               // Settings schema version

  // V11 Backend Configuration
  v11Backend: {
    url: string;                 // HTTP URL (e.g., http://localhost:9003)
    wsUrl: string;               // WebSocket URL (e.g., ws://localhost:9003/ws)
    useDemo: boolean;            // Demo mode vs. live mode
    autoConnect: boolean;        // Auto-connect on startup
    timeout: number;             // Request timeout (ms)
  };

  // Performance Settings
  performanceMode: PerformanceMode;
  chartUpdateInterval: number;   // 1000-5000ms based on mode
  enableAnimations: boolean;     // Disable on low-end devices

  // UI Preferences
  theme: 'light' | 'dark' | 'system';
  defaultDashboard: 'spatial' | 'vizor';

  // Tutorial & Onboarding
  tutorialCompleted: boolean;
  lastOpenedVersion: string;     // App version

  // Notifications (future)
  notificationsEnabled: boolean;

  // Analytics & Crash Reporting
  analyticsEnabled: boolean;     // User opt-in
  crashReportingEnabled: boolean;
}
```

### Dart Class

```dart
class AppSettings {
  final String version;
  final V11BackendSettings v11Backend;
  final PerformanceMode performanceMode;
  final int chartUpdateInterval;
  final bool enableAnimations;
  final ThemeMode theme;
  final DashboardType defaultDashboard;
  final bool tutorialCompleted;
  final String lastOpenedVersion;
  final bool notificationsEnabled;
  final bool analyticsEnabled;
  final bool crashReportingEnabled;

  const AppSettings({
    this.version = '1.0',
    required this.v11Backend,
    this.performanceMode = PerformanceMode.development,
    this.chartUpdateInterval = 1000,
    this.enableAnimations = true,
    this.theme = ThemeMode.system,
    this.defaultDashboard = DashboardType.spatial,
    this.tutorialCompleted = false,
    this.lastOpenedVersion = '1.0.0',
    this.notificationsEnabled = false,
    this.analyticsEnabled = false,
    this.crashReportingEnabled = true,
  });

  Map<String, dynamic> toJson() => {
    'version': version,
    'v11Backend': v11Backend.toJson(),
    'performanceMode': performanceMode.name,
    'chartUpdateInterval': chartUpdateInterval,
    'enableAnimations': enableAnimations,
    'theme': theme.name,
    'defaultDashboard': defaultDashboard.name,
    'tutorialCompleted': tutorialCompleted,
    'lastOpenedVersion': lastOpenedVersion,
    'notificationsEnabled': notificationsEnabled,
    'analyticsEnabled': analyticsEnabled,
    'crashReportingEnabled': crashReportingEnabled,
  };
}

class V11BackendSettings {
  final String url;
  final String wsUrl;
  final bool useDemo;
  final bool autoConnect;
  final int timeout;

  const V11BackendSettings({
    this.url = 'http://localhost:9003',
    this.wsUrl = 'ws://localhost:9003/ws',
    this.useDemo = true,
    this.autoConnect = false,
    this.timeout = 30000,
  });

  Map<String, dynamic> toJson() => {
    'url': url,
    'wsUrl': wsUrl,
    'useDemo': useDemo,
    'autoConnect': autoConnect,
    'timeout': timeout,
  };
}

enum ThemeMode { light, dark, system }
enum DashboardType { spatial, vizor }
```

---

## 4. Metrics Cache Entity

**Purpose**: Cache real-time metrics for offline viewing and chart rendering

**TTL**: 5 minutes
**Max Size**: 10MB
**Update Frequency**: 1-5 seconds (based on performance mode)

### TypeScript Interface

```typescript
interface MetricsCache {
  timestamp: string;             // ISO 8601 timestamp of cache creation
  expiresAt: string;             // ISO 8601 timestamp of expiration

  // System-wide Metrics
  systemMetrics: {
    tps: number;                 // Current transactions per second
    totalTransactions: number;   // Cumulative transaction count
    activeNodes: number;         // Total active nodes
    consensusState: {
      currentLeader: string;     // Node ID of current leader
      term: number;              // Current consensus term
      blocksValidated: number;   // Total blocks validated
      participationRate: number; // 0.0-100.0
    };
    avgFinalityLatency: number;  // Average block finalization time (ms)
    efficiency: number;          // actual TPS / target TPS * 100
  };

  // Per-Node Metrics (keyed by node ID)
  nodeMetrics: Record<string, NodeMetrics>;

  // Chart Data (sliding window)
  chartData: {
    tps: TimeSeriesDataPoint[];           // 60 data points (1 minute)
    consensus: ConsensusChartData[];      // 60 data points
    apiFeeds: APIFeedChartData[];         // Per-provider stats
    finalityLatency: TimeSeriesDataPoint[]; // 60 data points
  };
}

interface NodeMetrics {
  nodeId: string;
  nodeType: NodeType;
  state: string;                 // Node-specific state (e.g., LEADER, ROUTING)
  throughput: number;            // TPS for this node
  totalMessages: number;         // Cumulative message count
  errorCount: number;
  lastUpdate: string;            // ISO 8601 timestamp

  // Type-specific metrics
  channel?: {
    activeConnections: number;
    routingEfficiency: number;   // sent/received ratio
    queueDepth: number;
  };
  validator?: {
    blocksValidated: number;
    votesReceived: number;
    votesCast: number;
    consensusRounds: number;
    role: 'LEADER' | 'FOLLOWER' | 'CANDIDATE';
  };
  business?: {
    transactionsProcessed: number;
    queueSize: number;
    successRate: number;         // 0.0-100.0
  };
  slim?: {
    feedRate: number;            // Data points per second
    apiCalls: number;
    apiErrors: number;
    latency: number;             // Average API latency (ms)
    successRate: number;
  };
}

interface TimeSeriesDataPoint {
  timestamp: string;             // ISO 8601 or Unix timestamp
  value: number;
}

interface ConsensusChartData {
  timestamp: string;
  blocksValidated: number;
  consensusRounds: number;
}

interface APIFeedChartData {
  provider: 'alpaca' | 'weather' | 'twitter';
  apiCalls: number;
  dataPoints: number;
  successRate: number;
}
```

### Dart Class (Hive TypeAdapter)

```dart
@HiveType(typeId: 0)
class MetricsCache extends HiveObject {
  @HiveField(0)
  DateTime timestamp;

  @HiveField(1)
  DateTime expiresAt;

  @HiveField(2)
  SystemMetrics systemMetrics;

  @HiveField(3)
  Map<String, NodeMetrics> nodeMetrics;

  @HiveField(4)
  ChartData chartData;

  MetricsCache({
    required this.timestamp,
    required this.expiresAt,
    required this.systemMetrics,
    required this.nodeMetrics,
    required this.chartData,
  });

  bool isExpired() => DateTime.now().isAfter(expiresAt);
}

@HiveType(typeId: 1)
class SystemMetrics {
  @HiveField(0)
  double tps;

  @HiveField(1)
  int totalTransactions;

  @HiveField(2)
  int activeNodes;

  @HiveField(3)
  ConsensusState consensusState;

  @HiveField(4)
  double avgFinalityLatency;

  @HiveField(5)
  double efficiency;

  SystemMetrics({
    required this.tps,
    required this.totalTransactions,
    required this.activeNodes,
    required this.consensusState,
    required this.avgFinalityLatency,
    required this.efficiency,
  });
}
```

---

## 5. API Keys Entity (Secure Storage)

**Purpose**: Store sensitive API credentials securely

**Storage**:
- Web: Memory only (not persisted), use environment variables for defaults
- Flutter: flutter_secure_storage (Keychain on iOS, EncryptedSharedPreferences on Android)
- React Native: react-native-keychain

### TypeScript Interface

```typescript
interface APIKeys {
  alpaca?: {
    key: string;                 // APCA-API-KEY-ID
    secret: string;              // APCA-API-SECRET-KEY
  };
  openweathermap?: string;       // API key
  twitter?: string;              // Bearer token
}

// NOTE: Never store in regular storage (localStorage/AsyncStorage)
// Always use secure storage APIs
```

### Dart Class (NOT serialized to Hive/SharedPreferences)

```dart
class APIKeys {
  final AlpacaAPIKey? alpaca;
  final String? openweathermap;
  final String? twitter;

  const APIKeys({
    this.alpaca,
    this.openweathermap,
    this.twitter,
  });

  // Store in flutter_secure_storage
  Future<void> saveToSecureStorage(FlutterSecureStorage storage) async {
    if (alpaca != null) {
      await storage.write(key: 'alpaca_key', value: alpaca!.key);
      await storage.write(key: 'alpaca_secret', value: alpaca!.secret);
    }
    if (openweathermap != null) {
      await storage.write(key: 'openweathermap_key', value: openweathermap);
    }
    if (twitter != null) {
      await storage.write(key: 'twitter_token', value: twitter);
    }
  }

  static Future<APIKeys> loadFromSecureStorage(FlutterSecureStorage storage) async {
    final alpacaKey = await storage.read(key: 'alpaca_key');
    final alpacaSecret = await storage.read(key: 'alpaca_secret');
    final weatherKey = await storage.read(key: 'openweathermap_key');
    final twitterToken = await storage.read(key: 'twitter_token');

    return APIKeys(
      alpaca: (alpacaKey != null && alpacaSecret != null)
          ? AlpacaAPIKey(key: alpacaKey, secret: alpacaSecret)
          : null,
      openweathermap: weatherKey,
      twitter: twitterToken,
    );
  }
}

class AlpacaAPIKey {
  final String key;
  final String secret;

  const AlpacaAPIKey({required this.key, required this.secret});
}
```

---

## 6. Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────┐
│                      Configuration                          │
├─────────────────────────────────────────────────────────────┤
│ PK: id (UUID)                                               │
│     name (String)                                           │
│     description? (String)                                   │
│     created (DateTime)                                      │
│     modified (DateTime)                                     │
│     isDefault (Boolean)                                     │
│     performanceMode (Enum)                                  │
│     version (String)                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ 1:N (One configuration has many nodes)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   NodeConfiguration                         │
├─────────────────────────────────────────────────────────────┤
│ PK: id (UUID)                                               │
│ FK: configurationId (UUID)                                  │
│     type (Enum: channel|validator|business|slim)           │
│     name (String)                                           │
│     enabled (Boolean)                                       │
│     config (Polymorphic: ChannelConfig | ValidatorConfig   │
│              | BusinessConfig | SlimConfig)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      AppSettings                            │
├─────────────────────────────────────────────────────────────┤
│ (Singleton - only one instance per app)                     │
│     version (String)                                        │
│     v11Backend (Object)                                     │
│     performanceMode (Enum)                                  │
│     chartUpdateInterval (Int)                               │
│     enableAnimations (Boolean)                              │
│     theme (Enum: light|dark|system)                         │
│     defaultDashboard (Enum: spatial|vizor)                  │
│     tutorialCompleted (Boolean)                             │
│     lastOpenedVersion (String)                              │
│     notificationsEnabled (Boolean)                          │
│     analyticsEnabled (Boolean)                              │
│     crashReportingEnabled (Boolean)                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     MetricsCache                            │
├─────────────────────────────────────────────────────────────┤
│ PK: timestamp (DateTime)                                    │
│     expiresAt (DateTime)                                    │
│     systemMetrics (Object)                                  │
│     nodeMetrics (Map<String, NodeMetrics>)                  │
│     chartData (Object)                                      │
│                                                              │
│ TTL: 5 minutes                                              │
│ Max Size: 10MB                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  APIKeys (Secure Storage)                   │
├─────────────────────────────────────────────────────────────┤
│ NOT stored in regular database                              │
│ Stored in:                                                  │
│ - iOS: Keychain                                             │
│ - Android: EncryptedSharedPreferences                       │
│ - Web: Memory only (environment variables for defaults)    │
│                                                              │
│     alpaca.key (String)                                     │
│     alpaca.secret (String)                                  │
│     openweathermap (String)                                 │
│     twitter (String)                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Platform-Specific Implementation

### 7.1 Web (React - Enterprise Portal)

#### Storage Implementation

**localStorage** (Configurations & Settings):
```typescript
class LocalStorageRepository {
  private readonly CONFIG_KEY = 'aurigraph_configs';
  private readonly SETTINGS_KEY = 'aurigraph_settings';

  // Save configuration
  async saveConfiguration(config: Configuration): Promise<void> {
    const existing = this.getAllConfigurations();
    const updated = existing.filter(c => c.id !== config.id);
    updated.push(config);

    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(updated));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete old configurations.');
      }
      throw error;
    }
  }

  // Load all configurations
  getAllConfigurations(): Configuration[] {
    const data = localStorage.getItem(this.CONFIG_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Save settings
  async saveSettings(settings: AppSettings): Promise<void> {
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  // Load settings
  getSettings(): AppSettings | null {
    const data = localStorage.getItem(this.SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Clear all data
  clear(): void {
    localStorage.removeItem(this.CONFIG_KEY);
    localStorage.removeItem(this.SETTINGS_KEY);
  }
}
```

**IndexedDB** (Metrics Cache):
```typescript
class MetricsCacheDB {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'AurigraphMetrics';
  private readonly DB_VERSION = 1;
  private readonly METRICS_STORE = 'metrics';

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.METRICS_STORE)) {
          const store = db.createObjectStore(this.METRICS_STORE, { keyPath: 'timestamp' });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });
  }

  async saveMetrics(metrics: MetricsCache): Promise<void> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.METRICS_STORE], 'readwrite');
      const store = transaction.objectStore(this.METRICS_STORE);
      const request = store.put(metrics);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLatestMetrics(): Promise<MetricsCache | null> {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.METRICS_STORE], 'readonly');
      const store = transaction.objectStore(this.METRICS_STORE);
      const request = store.openCursor(null, 'prev'); // Get latest

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          const metrics = cursor.value as MetricsCache;

          // Check if expired
          if (new Date(metrics.expiresAt) > new Date()) {
            resolve(metrics);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearExpired(): Promise<void> {
    if (!this.db) await this.open();

    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.METRICS_STORE], 'readwrite');
      const store = transaction.objectStore(this.METRICS_STORE);
      const index = store.index('expiresAt');
      const range = IDBKeyRange.upperBound(now);
      const request = index.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}
```

---

### 7.2 Flutter Mobile

#### Hive Setup

**Main Setup** (in `main.dart`):
```dart
import 'package:hive_flutter/hive_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Hive
  await Hive.initFlutter();

  // Register adapters
  Hive.registerAdapter(ConfigurationAdapter());
  Hive.registerAdapter(NodeConfigurationAdapter());
  Hive.registerAdapter(MetricsCacheAdapter());
  Hive.registerAdapter(SystemMetricsAdapter());

  // Open boxes
  await Hive.openBox<Configuration>('configurations');
  await Hive.openBox<AppSettings>('settings');
  await Hive.openBox<MetricsCache>('metrics_cache');

  runApp(MyApp());
}
```

#### Configuration Repository

```dart
class HiveConfigurationRepository {
  static const String _boxName = 'configurations';

  Box<Configuration> get _box => Hive.box<Configuration>(_boxName);

  // Save configuration
  Future<void> saveConfiguration(Configuration config) async {
    await _box.put(config.id, config);
  }

  // Get configuration by ID
  Configuration? getConfiguration(String id) {
    return _box.get(id);
  }

  // Get all configurations
  List<Configuration> getAllConfigurations() {
    return _box.values.toList();
  }

  // Get default configuration
  Configuration? getDefaultConfiguration() {
    return _box.values.firstWhereOrNull((c) => c.isDefault);
  }

  // Delete configuration
  Future<void> deleteConfiguration(String id) async {
    await _box.delete(id);
  }

  // Clear all configurations
  Future<void> clearAll() async {
    await _box.clear();
  }

  // Export to JSON
  List<Map<String, dynamic>> exportAllToJson() {
    return _box.values.map((c) => c.toJson()).toList();
  }

  // Import from JSON
  Future<void> importFromJson(List<Map<String, dynamic>> jsonList) async {
    for (final json in jsonList) {
      final config = Configuration.fromJson(json);
      await saveConfiguration(config);
    }
  }
}
```

#### Settings Repository

```dart
class HiveSettingsRepository {
  static const String _boxName = 'settings';
  static const String _settingsKey = 'app_settings';

  Box get _box => Hive.box(_boxName);

  // Save settings
  Future<void> saveSettings(AppSettings settings) async {
    await _box.put(_settingsKey, settings.toJson());
  }

  // Load settings
  AppSettings? getSettings() {
    final json = _box.get(_settingsKey);
    if (json == null) return null;
    return AppSettings.fromJson(json as Map<String, dynamic>);
  }

  // Get or create default settings
  Future<AppSettings> getOrCreateDefault() async {
    final existing = getSettings();
    if (existing != null) return existing;

    final defaultSettings = AppSettings(
      v11Backend: V11BackendSettings(),
    );
    await saveSettings(defaultSettings);
    return defaultSettings;
  }
}
```

#### Metrics Cache Repository (with TTL)

```dart
class HiveMetricsCacheRepository {
  static const String _boxName = 'metrics_cache';
  static const String _cacheKey = 'latest_metrics';
  static const Duration _ttl = Duration(minutes: 5);

  Box<MetricsCache> get _box => Hive.box<MetricsCache>(_boxName);

  // Save metrics with TTL
  Future<void> saveMetrics(MetricsCache metrics) async {
    final withExpiry = MetricsCache(
      timestamp: metrics.timestamp,
      expiresAt: DateTime.now().add(_ttl),
      systemMetrics: metrics.systemMetrics,
      nodeMetrics: metrics.nodeMetrics,
      chartData: metrics.chartData,
    );

    await _box.put(_cacheKey, withExpiry);
  }

  // Get latest metrics (null if expired)
  MetricsCache? getLatestMetrics() {
    final metrics = _box.get(_cacheKey);

    if (metrics == null) return null;
    if (metrics.isExpired()) {
      _box.delete(_cacheKey);
      return null;
    }

    return metrics;
  }

  // Clear cache
  Future<void> clearCache() async {
    await _box.clear();
  }

  // Get cache size
  int getCacheSize() {
    return _box.length;
  }
}
```

#### Secure Storage for API Keys

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureAPIKeyRepository {
  final _storage = const FlutterSecureStorage();

  // Alpaca API Keys
  Future<void> saveAlpacaKeys(String key, String secret) async {
    await _storage.write(key: 'alpaca_key', value: key);
    await _storage.write(key: 'alpaca_secret', value: secret);
  }

  Future<AlpacaAPIKey?> getAlpacaKeys() async {
    final key = await _storage.read(key: 'alpaca_key');
    final secret = await _storage.read(key: 'alpaca_secret');

    if (key == null || secret == null) return null;
    return AlpacaAPIKey(key: key, secret: secret);
  }

  // OpenWeatherMap API Key
  Future<void> saveWeatherKey(String key) async {
    await _storage.write(key: 'openweathermap_key', value: key);
  }

  Future<String?> getWeatherKey() async {
    return await _storage.read(key: 'openweathermap_key');
  }

  // Twitter Bearer Token
  Future<void> saveTwitterToken(String token) async {
    await _storage.write(key: 'twitter_token', value: token);
  }

  Future<String?> getTwitterToken() async {
    return await _storage.read(key: 'twitter_token');
  }

  // Clear all API keys
  Future<void> clearAllKeys() async {
    await _storage.deleteAll();
  }

  // Check if any keys are stored
  Future<bool> hasAnyKeys() async {
    final all = await _storage.readAll();
    return all.isNotEmpty;
  }
}
```

---

### 7.3 React Native Mobile

#### AsyncStorage Implementation

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AsyncStorageRepository {
  private readonly CONFIG_KEY = '@aurigraph/configs';
  private readonly SETTINGS_KEY = '@aurigraph/settings';

  // Save configuration
  async saveConfiguration(config: Configuration): Promise<void> {
    const existing = await this.getAllConfigurations();
    const updated = existing.filter(c => c.id !== config.id);
    updated.push(config);

    await AsyncStorage.setItem(this.CONFIG_KEY, JSON.stringify(updated));
  }

  // Load all configurations
  async getAllConfigurations(): Promise<Configuration[]> {
    const data = await AsyncStorage.getItem(this.CONFIG_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Get configuration by ID
  async getConfiguration(id: string): Promise<Configuration | null> {
    const all = await this.getAllConfigurations();
    return all.find(c => c.id === id) || null;
  }

  // Delete configuration
  async deleteConfiguration(id: string): Promise<void> {
    const existing = await this.getAllConfigurations();
    const updated = existing.filter(c => c.id !== id);
    await AsyncStorage.setItem(this.CONFIG_KEY, JSON.stringify(updated));
  }

  // Save settings
  async saveSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  // Load settings
  async getSettings(): Promise<AppSettings | null> {
    const data = await AsyncStorage.getItem(this.SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([this.CONFIG_KEY, this.SETTINGS_KEY]);
  }

  // Get storage info
  async getStorageInfo(): Promise<{ used: number; available: number }> {
    // AsyncStorage doesn't provide size info, approximate from data
    const allKeys = await AsyncStorage.getAllKeys();
    let totalSize = 0;

    for (const key of allKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
      }
    }

    return {
      used: totalSize,
      available: 5 * 1024 * 1024 - totalSize // Assuming 5MB limit
    };
  }
}
```

#### MMKV Storage for Metrics Cache

```typescript
import { MMKV } from 'react-native-mmkv';

class MMKVMetricsCacheRepository {
  private readonly storage = new MMKV({
    id: 'metrics-cache',
    encryptionKey: 'your-encryption-key-here' // Optional encryption
  });

  private readonly CACHE_KEY = 'latest_metrics';
  private readonly TTL_MS = 5 * 60 * 1000; // 5 minutes

  // Save metrics
  saveMetrics(metrics: MetricsCache): void {
    const withExpiry = {
      ...metrics,
      expiresAt: new Date(Date.now() + this.TTL_MS).toISOString()
    };

    this.storage.set(this.CACHE_KEY, JSON.stringify(withExpiry));
  }

  // Get latest metrics (null if expired)
  getLatestMetrics(): MetricsCache | null {
    const data = this.storage.getString(this.CACHE_KEY);
    if (!data) return null;

    const metrics = JSON.parse(data) as MetricsCache;

    // Check if expired
    if (new Date(metrics.expiresAt) < new Date()) {
      this.storage.delete(this.CACHE_KEY);
      return null;
    }

    return metrics;
  }

  // Clear cache
  clearCache(): void {
    this.storage.clearAll();
  }

  // Get cache size
  getCacheSize(): number {
    const data = this.storage.getString(this.CACHE_KEY);
    return data ? new Blob([data]).size : 0;
  }
}
```

#### Keychain for API Keys

```typescript
import * as Keychain from 'react-native-keychain';

class KeychainAPIKeyRepository {
  // Save Alpaca keys
  async saveAlpacaKeys(key: string, secret: string): Promise<void> {
    await Keychain.setInternetCredentials(
      'alpaca',
      key,
      secret
    );
  }

  // Get Alpaca keys
  async getAlpacaKeys(): Promise<{ key: string; secret: string } | null> {
    const credentials = await Keychain.getInternetCredentials('alpaca');

    if (!credentials) return null;

    return {
      key: credentials.username,
      secret: credentials.password
    };
  }

  // Save OpenWeatherMap key
  async saveWeatherKey(key: string): Promise<void> {
    await Keychain.setGenericPassword('openweathermap', key);
  }

  // Get OpenWeatherMap key
  async getWeatherKey(): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword();

    if (!credentials || credentials.username !== 'openweathermap') {
      return null;
    }

    return credentials.password;
  }

  // Save Twitter token
  async saveTwitterToken(token: string): Promise<void> {
    await Keychain.setGenericPassword('twitter', token);
  }

  // Get Twitter token
  async getTwitterToken(): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword();

    if (!credentials || credentials.username !== 'twitter') {
      return null;
    }

    return credentials.password;
  }

  // Clear all keys
  async clearAllKeys(): Promise<void> {
    await Keychain.resetGenericPassword();
    await Keychain.resetInternetCredentials('alpaca');
  }

  // Check if any keys stored
  async hasAnyKeys(): Promise<boolean> {
    const generic = await Keychain.getGenericPassword();
    const alpaca = await Keychain.getInternetCredentials('alpaca');

    return !!(generic || alpaca);
  }
}
```

---

## 8. Migration Strategy

### 8.1 Schema Versioning

All data entities include a `version` field to track schema changes.

```typescript
const CURRENT_SCHEMA_VERSION = '1.0';

interface Versioned {
  version: string;
}

// Example: Configuration with version
interface Configuration extends Versioned {
  version: string; // "1.0"
  // ... other fields
}
```

### 8.2 Migration Scripts

**Example: Migrate Configuration from v1.0 to v2.0**

```typescript
class ConfigurationMigration {
  migrate(config: any): Configuration {
    const version = config.version || '1.0';

    switch (version) {
      case '1.0':
        return this.migrateFrom1_0To2_0(config);
      case '2.0':
        return config as Configuration;
      default:
        throw new Error(`Unknown schema version: ${version}`);
    }
  }

  private migrateFrom1_0To2_0(config: any): Configuration {
    // Example: Add new field 'description' in v2.0
    return {
      ...config,
      version: '2.0',
      description: config.description || '', // Add default value
    };
  }
}
```

**Dart Migration Example**:

```dart
class ConfigurationMigration {
  Configuration migrate(Map<String, dynamic> json) {
    final version = json['version'] as String? ?? '1.0';

    switch (version) {
      case '1.0':
        return _migrateFrom1_0To2_0(json);
      case '2.0':
        return Configuration.fromJson(json);
      default:
        throw Exception('Unknown schema version: $version');
    }
  }

  Configuration _migrateFrom1_0To2_0(Map<String, dynamic> json) {
    // Add new field
    json['version'] = '2.0';
    json['description'] = json['description'] ?? '';

    return Configuration.fromJson(json);
  }
}
```

### 8.3 Backward Compatibility

**Goal**: Ensure older app versions can still read data (read-compatible, not write-compatible)

**Strategy**:
1. Never remove required fields
2. Add new fields as optional
3. Provide default values for new fields
4. Mark deprecated fields but don't remove them immediately

**Example**:

```typescript
// v1.0: Original schema
interface ConfigurationV1 {
  id: string;
  name: string;
  nodes: NodeConfiguration[];
}

// v2.0: Added new field (optional)
interface ConfigurationV2 extends ConfigurationV1 {
  description?: string;  // Optional - backward compatible
}

// v3.0: Removed deprecated field (breaking change, increment major version)
interface ConfigurationV3 {
  id: string;
  name: string;
  description: string;   // Now required
  nodes: NodeConfiguration[];
  // 'created' field removed (breaking change)
}
```

---

## 9. Size Limits and Performance Optimization

### 9.1 Storage Limits by Platform

| Platform | Technology | Limit | Notes |
|----------|-----------|-------|-------|
| Web | localStorage | 5-10MB | Varies by browser, shared across origin |
| Web | IndexedDB | 50MB+ | Increases with user permission, much larger capacity |
| Flutter | SharedPreferences | <1MB per key | Use Hive for larger data |
| Flutter | Hive | Limited by disk | Efficient for large datasets, ~1GB+ typical |
| React Native | AsyncStorage | 6MB | Android limit, iOS has no hard limit |
| React Native | MMKV | Limited by disk | Very fast, supports encryption |

### 9.2 Data Retention Policies

| Entity | Retention | Cleanup Strategy |
|--------|-----------|------------------|
| Configurations | Indefinite | User-initiated deletion only |
| Settings | Indefinite | Overwrite on change |
| Metrics Cache | 5 minutes | Auto-delete on expiry |
| Chart Data (in cache) | 1 minute (60 data points) | Sliding window, oldest removed |
| API Keys | Indefinite | User-initiated deletion |

### 9.3 Performance Optimization

#### Lazy Loading

**Goal**: Load only needed data, not entire database

```typescript
// BAD: Load all configurations at once
const allConfigs = await repository.getAllConfigurations();

// GOOD: Load by ID only when needed
const config = await repository.getConfiguration(configId);
```

#### Indexing (IndexedDB/Hive)

**IndexedDB Example**:
```typescript
// Create index on 'isDefault' field for fast lookup
const store = db.createObjectStore('configurations', { keyPath: 'id' });
store.createIndex('isDefault', 'isDefault', { unique: false });

// Fast query using index
const index = store.index('isDefault');
const request = index.get(true); // Get default configuration
```

**Hive Example**:
```dart
// No built-in indexes, but can create efficient filters
final defaultConfig = configBox.values.firstWhere(
  (c) => c.isDefault,
  orElse: () => null,
);
```

#### Batch Operations

**Goal**: Minimize I/O operations

```typescript
// BAD: Multiple separate writes
for (const config of configs) {
  await repository.saveConfiguration(config);
}

// GOOD: Batch write
await repository.saveConfigurations(configs);
```

#### Cache Warming

**Goal**: Pre-load frequently accessed data

```typescript
class DataPreloader {
  async preloadEssentialData(): Promise<void> {
    // Load in parallel
    await Promise.all([
      settingsRepository.getSettings(),
      configRepository.getDefaultConfiguration(),
      metricsCacheRepository.getLatestMetrics(),
    ]);
  }
}
```

---

## 10. Security Considerations

### 10.1 Encryption at Rest

#### Flutter - Hive Encryption

```dart
import 'package:hive_flutter/hive_flutter.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureHiveSetup {
  static Future<void> initialize() async {
    await Hive.initFlutter();

    // Generate or retrieve encryption key from secure storage
    final secureStorage = FlutterSecureStorage();
    var encryptionKeyString = await secureStorage.read(key: 'hive_encryption_key');

    if (encryptionKeyString == null) {
      final key = Hive.generateSecureKey();
      encryptionKeyString = base64Encode(key);
      await secureStorage.write(key: 'hive_encryption_key', value: encryptionKeyString);
    }

    final encryptionKey = base64Decode(encryptionKeyString);

    // Open encrypted box
    await Hive.openBox<Configuration>(
      'configurations',
      encryptionCipher: HiveAesCipher(encryptionKey),
    );
  }
}
```

#### React Native - MMKV Encryption

```typescript
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({
  id: 'secure-storage',
  encryptionKey: 'your-32-char-encryption-key'
});
```

### 10.2 API Key Security

**Rules**:
1. **Never** store API keys in regular storage (localStorage/AsyncStorage/Hive)
2. **Always** use secure storage (Keychain/Keystore/flutter_secure_storage)
3. **Never** log API keys in console or crash reports
4. **Always** mask API keys in UI (show last 4 characters only)

**Example - Masked Display**:

```typescript
function maskAPIKey(key: string): string {
  if (key.length <= 4) return '****';
  return '*'.repeat(key.length - 4) + key.slice(-4);
}

// Display: "**************a1b2"
console.log(maskAPIKey('pk_live_abc123xyz789a1b2'));
```

### 10.3 Data Export/Import Security

**Export**: Sanitize sensitive data before export

```typescript
class SecureExporter {
  exportConfiguration(config: Configuration): string {
    const sanitized = {
      ...config,
      nodes: config.nodes.map(node => ({
        ...node,
        config: node.type === 'slim'
          ? { ...node.config, apiKeyRef: '[REDACTED]' }
          : node.config
      }))
    };

    return JSON.stringify(sanitized, null, 2);
  }
}
```

**Import**: Validate and sanitize imported data

```typescript
class SecureImporter {
  async importConfiguration(jsonString: string): Promise<Configuration> {
    // Parse and validate
    const data = JSON.parse(jsonString);

    // Schema validation
    if (!this.isValidConfiguration(data)) {
      throw new Error('Invalid configuration schema');
    }

    // Sanitize: Remove any unexpected fields
    const sanitized = this.sanitizeConfiguration(data);

    return sanitized as Configuration;
  }

  private isValidConfiguration(data: any): boolean {
    return (
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      Array.isArray(data.nodes) &&
      data.nodes.every(this.isValidNodeConfiguration)
    );
  }

  private sanitizeConfiguration(data: any): any {
    // Allow only known fields
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      created: data.created,
      modified: data.modified,
      isDefault: data.isDefault,
      performanceMode: data.performanceMode,
      nodes: data.nodes.map(this.sanitizeNodeConfiguration),
      version: data.version || '1.0',
    };
  }
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

**Test Coverage**: All repository methods

**Example - Configuration Repository Test**:

```typescript
describe('ConfigurationRepository', () => {
  let repository: ConfigurationRepository;
  let mockStorage: jest.Mocked<any>;

  beforeEach(() => {
    mockStorage = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    };

    repository = new ConfigurationRepository(mockStorage);
  });

  it('should save configuration', async () => {
    const config: Configuration = {
      id: 'test-id',
      name: 'Test Config',
      created: '2025-10-09T00:00:00Z',
      modified: '2025-10-09T00:00:00Z',
      isDefault: false,
      performanceMode: 'development',
      nodes: [],
      version: '1.0',
    };

    await repository.saveConfiguration(config);

    expect(mockStorage.setItem).toHaveBeenCalledWith(
      '@aurigraph/configs',
      expect.stringContaining(config.id)
    );
  });

  it('should load configuration by ID', async () => {
    const config: Configuration = { /* ... */ };
    mockStorage.getItem.mockResolvedValue(JSON.stringify([config]));

    const loaded = await repository.getConfiguration('test-id');

    expect(loaded).toEqual(config);
  });

  it('should handle storage quota exceeded error', async () => {
    mockStorage.setItem.mockImplementation(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    await expect(
      repository.saveConfiguration({} as Configuration)
    ).rejects.toThrow('Storage quota exceeded');
  });
});
```

### 11.2 Integration Tests

**Test Scenarios**:
1. Save and load configuration across app restart
2. Metrics cache TTL expiration
3. Secure storage persistence (API keys survive app restart)
4. Migration from old schema to new schema
5. Export and import configuration (roundtrip)

**Example - Flutter Integration Test**:

```dart
void main() {
  late Box<Configuration> configBox;

  setUpAll(() async {
    await Hive.initFlutter();
    Hive.registerAdapter(ConfigurationAdapter());
    configBox = await Hive.openBox<Configuration>('test_configs');
  });

  tearDownAll(() async {
    await configBox.clear();
    await configBox.close();
  });

  testWidgets('Save and load configuration', (tester) async {
    final repository = HiveConfigurationRepository();

    final config = Configuration(
      id: 'test-id',
      name: 'Test Config',
      created: DateTime.now(),
      modified: DateTime.now(),
      isDefault: false,
      performanceMode: PerformanceMode.development,
      nodes: [],
    );

    // Save
    await repository.saveConfiguration(config);

    // Load
    final loaded = repository.getConfiguration('test-id');

    expect(loaded, isNotNull);
    expect(loaded!.name, equals('Test Config'));
  });

  testWidgets('Metrics cache TTL expiration', (tester) async {
    final repository = HiveMetricsCacheRepository();

    final metrics = MetricsCache(
      timestamp: DateTime.now(),
      expiresAt: DateTime.now().add(Duration(seconds: 1)),
      systemMetrics: SystemMetrics(/* ... */),
      nodeMetrics: {},
      chartData: ChartData(/* ... */),
    );

    await repository.saveMetrics(metrics);

    // Should be available immediately
    expect(repository.getLatestMetrics(), isNotNull);

    // Wait for expiration
    await Future.delayed(Duration(seconds: 2));

    // Should be null after expiration
    expect(repository.getLatestMetrics(), isNull);
  });
}
```

---

## 12. Monitoring and Debugging

### 12.1 Storage Usage Monitoring

**Goal**: Track storage consumption and warn users

```typescript
class StorageMonitor {
  async getStorageStats(): Promise<StorageStats> {
    const configSize = await this.getConfigurationStorageSize();
    const metricsSize = await this.getMetricsCacheSize();
    const totalSize = configSize + metricsSize;

    return {
      totalUsed: totalSize,
      configurations: configSize,
      metricsCache: metricsSize,
      available: this.getAvailableStorage() - totalSize,
      usagePercentage: (totalSize / this.getAvailableStorage()) * 100,
    };
  }

  private getAvailableStorage(): number {
    // Platform-specific limits
    if (Platform.isWeb) return 5 * 1024 * 1024; // 5MB for localStorage
    if (Platform.isIOS) return 100 * 1024 * 1024; // 100MB typical
    return 6 * 1024 * 1024; // 6MB for Android AsyncStorage
  }

  shouldWarnUser(stats: StorageStats): boolean {
    return stats.usagePercentage > 80; // Warn at 80% capacity
  }
}

interface StorageStats {
  totalUsed: number;
  configurations: number;
  metricsCache: number;
  available: number;
  usagePercentage: number;
}
```

### 12.2 Debug Logging

**Development Mode Only**:

```typescript
class StorageDebugLogger {
  log(operation: string, data: any): void {
    if (__DEV__) {
      console.log(`[Storage] ${operation}`, {
        timestamp: new Date().toISOString(),
        data,
        stackTrace: new Error().stack,
      });
    }
  }

  logError(operation: string, error: Error): void {
    console.error(`[Storage Error] ${operation}`, {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
    });
  }
}

// Usage
const logger = new StorageDebugLogger();

async function saveConfiguration(config: Configuration) {
  logger.log('saveConfiguration', { configId: config.id });

  try {
    await repository.saveConfiguration(config);
    logger.log('saveConfiguration:success', { configId: config.id });
  } catch (error) {
    logger.logError('saveConfiguration', error);
    throw error;
  }
}
```

---

## 13. Performance Benchmarks

### 13.1 Target Performance Metrics

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Save configuration | <50ms | 95th percentile |
| Load configuration | <30ms | 95th percentile |
| Save metrics cache | <100ms | 95th percentile |
| Load metrics cache | <50ms | 95th percentile |
| Query default config | <10ms | Average |
| Export configuration | <200ms | Average |
| Import configuration | <500ms | Average (includes validation) |

### 13.2 Benchmark Test

```typescript
class StorageBenchmark {
  async runBenchmarks(): Promise<BenchmarkResults> {
    const results: BenchmarkResults = {
      saveConfig: await this.benchmarkSaveConfig(),
      loadConfig: await this.benchmarkLoadConfig(),
      saveMetrics: await this.benchmarkSaveMetrics(),
      loadMetrics: await this.benchmarkLoadMetrics(),
    };

    return results;
  }

  private async benchmarkSaveConfig(): Promise<number> {
    const iterations = 100;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const config = this.generateTestConfig();

      const start = performance.now();
      await repository.saveConfiguration(config);
      const end = performance.now();

      times.push(end - start);
    }

    return this.calculateP95(times);
  }

  private calculateP95(times: number[]): number {
    const sorted = times.sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }
}

interface BenchmarkResults {
  saveConfig: number;
  loadConfig: number;
  saveMetrics: number;
  loadMetrics: number;
}
```

---

## 14. Deployment Checklist

### 14.1 Pre-deployment Validation

- [ ] All data models defined with TypeScript/Dart interfaces
- [ ] Schema versioning implemented
- [ ] Migration scripts created and tested
- [ ] Secure storage implemented for API keys
- [ ] Encryption at rest enabled (Hive/MMKV)
- [ ] TTL and expiration logic tested (metrics cache)
- [ ] Storage limits enforced with warnings
- [ ] Export/import functionality tested (roundtrip)
- [ ] Unit tests passing (80%+ coverage)
- [ ] Integration tests passing (save/load/migrate)
- [ ] Performance benchmarks meet targets
- [ ] Debug logging implemented (dev mode only)
- [ ] Storage monitoring dashboard ready

### 14.2 Production Configuration

**Web**:
```typescript
const productionConfig = {
  useIndexedDB: true,         // Use IndexedDB for large datasets
  encryptSensitiveData: true, // Encrypt API keys in memory
  maxStorageSize: 10 * 1024 * 1024, // 10MB
  enableDebugLogging: false,
};
```

**Flutter**:
```dart
const productionConfig = ProductionConfig(
  useHiveEncryption: true,
  encryptionKeySource: EncryptionKeySource.secureStorage,
  maxCacheSize: 10 * 1024 * 1024, // 10MB
  enableDebugLogging: false,
);
```

**React Native**:
```typescript
const productionConfig = {
  useMMKV: true,              // Use MMKV for performance
  encryptMMKV: true,
  useKeychain: true,          // Use Keychain for API keys
  maxStorageSize: 10 * 1024 * 1024, // 10MB
  enableDebugLogging: false,
};
```

---

## 15. Success Criteria

### Database Schema Design Acceptance Criteria

✅ **Complete Schema**: All entities defined (Configuration, Settings, MetricsCache, APIKeys)
✅ **Platform Coverage**: Web (localStorage + IndexedDB), Flutter (Hive + SecureStorage), React Native (AsyncStorage + MMKV + Keychain)
✅ **Data Models**: TypeScript interfaces and Dart classes defined with serialization
✅ **Security**: API keys in secure storage, encryption at rest enabled
✅ **Migration Strategy**: Schema versioning, migration scripts, backward compatibility
✅ **Size Limits**: Storage limits defined and enforced per platform
✅ **Performance**: Target metrics defined (save/load <50ms)
✅ **Testing**: Unit tests, integration tests, benchmark tests
✅ **Documentation**: Complete with ERD, examples, and best practices

---

## 16. Next Steps

**Completed**:
- ✅ Task 1.2.3: Database Schema Design (this document)

**Next Tasks**:
- 🔄 Task 1.3.1: Confirm Technology Stack
- 🔄 Task 2.1.1: Implement V11 Backend Client (uses schema)
- 🔄 Task 2.2.1: Implement Storage Repositories (Flutter/React Native/React)
- 🔄 Task 3.1.1: Build Configuration Management UI (uses schema)

---

## Appendix A: Full Example - Configuration Lifecycle

### A.1 Create and Save Configuration

**TypeScript (React/React Native)**:
```typescript
import { v4 as uuidv4 } from 'uuid';

const repository = new ConfigurationRepository();

// Create new configuration
const newConfig: Configuration = {
  id: uuidv4(),
  name: 'Production Test Setup',
  description: 'High-performance configuration for production testing',
  created: new Date().toISOString(),
  modified: new Date().toISOString(),
  isDefault: false,
  performanceMode: 'production',
  nodes: [
    {
      id: uuidv4(),
      type: 'channel',
      name: 'Channel Node 1',
      enabled: true,
      config: {
        maxConnections: 100,
        routingAlgorithm: 'round-robin',
        bufferSize: 10000,
        timeout: 30000,
      } as ChannelConfig,
    },
    {
      id: uuidv4(),
      type: 'validator',
      name: 'Validator Node 1',
      enabled: true,
      config: {
        stakeAmount: 10000,
        votingPower: 1.0,
        consensusTimeout: 200,
        maxBlockSize: 1000000,
      } as ValidatorConfig,
    },
  ],
  version: '1.0',
};

// Save to storage
await repository.saveConfiguration(newConfig);
console.log('Configuration saved:', newConfig.id);
```

**Dart (Flutter)**:
```dart
import 'package:uuid/uuid.dart';

final repository = HiveConfigurationRepository();

// Create new configuration
final newConfig = Configuration(
  id: Uuid().v4(),
  name: 'Production Test Setup',
  description: 'High-performance configuration for production testing',
  created: DateTime.now(),
  modified: DateTime.now(),
  isDefault: false,
  performanceMode: PerformanceMode.production,
  nodes: [
    NodeConfiguration(
      id: Uuid().v4(),
      type: NodeType.channel,
      name: 'Channel Node 1',
      enabled: true,
      config: ChannelConfig(
        maxConnections: 100,
        routingAlgorithm: RoutingAlgorithm.roundRobin,
        bufferSize: 10000,
        timeout: 30000,
      ),
    ),
    NodeConfiguration(
      id: Uuid().v4(),
      type: NodeType.validator,
      name: 'Validator Node 1',
      enabled: true,
      config: ValidatorConfig(
        stakeAmount: 10000,
        votingPower: 1.0,
        consensusTimeout: 200,
        maxBlockSize: 1000000,
      ),
    ),
  ],
  version: '1.0',
);

// Save to Hive
await repository.saveConfiguration(newConfig);
print('Configuration saved: ${newConfig.id}');
```

---

**Document Status**: ✅ Complete
**Prepared by**: BDA (Backend Development Agent) - Claude Code
**Date**: October 9, 2025
**Version**: 1.0

🤖 Generated with [Claude Code](https://claude.com/claude-code)

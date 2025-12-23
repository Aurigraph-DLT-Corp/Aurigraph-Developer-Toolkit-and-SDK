/// Business Node Models
///
/// Data models for Aurigraph Business Nodes

part of aurigraph_sdk;

/// Business Node State
enum BusinessNodeState {
  idle,
  processing,
  overloaded,
  paused,
  error,
  disconnected,
}

/// Business Node Priority
enum BusinessNodePriority {
  low,
  normal,
  high,
  critical,
}

/// Transaction Processing Strategy
enum ProcessingStrategy {
  fifo,           // First-In-First-Out
  lifo,           // Last-In-First-Out
  priority,       // Priority-based
  roundRobin,     // Round-robin distribution
  leastBusy,      // Send to least busy processor
}

/// Business Node Configuration
class BusinessNodeConfig {
  final String id;
  final String name;
  final int processingCapacity;        // Max transactions per second
  final int queueSize;                 // Max queue length
  final int batchSize;                 // Batch processing size
  final int parallelThreads;           // Number of parallel processors
  final ProcessingStrategy strategy;
  final int timeout;                   // Transaction timeout in seconds
  final bool autoRestart;              // Auto-restart on failure
  final Map<String, dynamic>? metadata;

  const BusinessNodeConfig({
    required this.id,
    required this.name,
    this.processingCapacity = 1000,
    this.queueSize = 10000,
    this.batchSize = 100,
    this.parallelThreads = 4,
    this.strategy = ProcessingStrategy.fifo,
    this.timeout = 30,
    this.autoRestart = true,
    this.metadata,
  });

  Map<String, dynamic> toMap() => {
    'id': id,
    'name': name,
    'processingCapacity': processingCapacity,
    'queueSize': queueSize,
    'batchSize': batchSize,
    'parallelThreads': parallelThreads,
    'strategy': strategy.name,
    'timeout': timeout,
    'autoRestart': autoRestart,
    'metadata': metadata,
  };

  factory BusinessNodeConfig.fromMap(Map<String, dynamic> map) =>
      BusinessNodeConfig(
        id: map['id'],
        name: map['name'],
        processingCapacity: map['processingCapacity'] ?? 1000,
        queueSize: map['queueSize'] ?? 10000,
        batchSize: map['batchSize'] ?? 100,
        parallelThreads: map['parallelThreads'] ?? 4,
        strategy: ProcessingStrategy.values.firstWhere(
          (s) => s.name == map['strategy'],
          orElse: () => ProcessingStrategy.fifo,
        ),
        timeout: map['timeout'] ?? 30,
        autoRestart: map['autoRestart'] ?? true,
        metadata: map['metadata'],
      );

  BusinessNodeConfig copyWith({
    String? id,
    String? name,
    int? processingCapacity,
    int? queueSize,
    int? batchSize,
    int? parallelThreads,
    ProcessingStrategy? strategy,
    int? timeout,
    bool? autoRestart,
    Map<String, dynamic>? metadata,
  }) {
    return BusinessNodeConfig(
      id: id ?? this.id,
      name: name ?? this.name,
      processingCapacity: processingCapacity ?? this.processingCapacity,
      queueSize: queueSize ?? this.queueSize,
      batchSize: batchSize ?? this.batchSize,
      parallelThreads: parallelThreads ?? this.parallelThreads,
      strategy: strategy ?? this.strategy,
      timeout: timeout ?? this.timeout,
      autoRestart: autoRestart ?? this.autoRestart,
      metadata: metadata ?? this.metadata,
    );
  }
}

/// Business Node Instance
class BusinessNode {
  final String id;
  final BusinessNodeConfig config;
  BusinessNodeState state;
  BusinessNodeMetrics metrics;
  DateTime createdAt;
  DateTime? lastUpdated;

  BusinessNode({
    required this.id,
    required this.config,
    this.state = BusinessNodeState.idle,
    BusinessNodeMetrics? metrics,
    DateTime? createdAt,
    this.lastUpdated,
  })  : metrics = metrics ?? BusinessNodeMetrics.empty(),
        createdAt = createdAt ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'id': id,
    'config': config.toMap(),
    'state': state.name,
    'metrics': metrics.toMap(),
    'createdAt': createdAt.toIso8601String(),
    'lastUpdated': lastUpdated?.toIso8601String(),
  };

  factory BusinessNode.fromMap(Map<String, dynamic> map) => BusinessNode(
    id: map['id'],
    config: BusinessNodeConfig.fromMap(map['config']),
    state: BusinessNodeState.values.firstWhere(
      (s) => s.name == map['state'],
      orElse: () => BusinessNodeState.idle,
    ),
    metrics: map['metrics'] != null
        ? BusinessNodeMetrics.fromMap(map['metrics'])
        : BusinessNodeMetrics.empty(),
    createdAt: DateTime.parse(map['createdAt']),
    lastUpdated: map['lastUpdated'] != null
        ? DateTime.parse(map['lastUpdated'])
        : null,
  );

  BusinessNode copyWith({
    String? id,
    BusinessNodeConfig? config,
    BusinessNodeState? state,
    BusinessNodeMetrics? metrics,
    DateTime? createdAt,
    DateTime? lastUpdated,
  }) {
    return BusinessNode(
      id: id ?? this.id,
      config: config ?? this.config,
      state: state ?? this.state,
      metrics: metrics ?? this.metrics,
      createdAt: createdAt ?? this.createdAt,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }
}

/// Business Node Metrics
class BusinessNodeMetrics {
  final int totalTransactions;
  final int successfulTransactions;
  final int failedTransactions;
  final int queuedTransactions;
  final int processingTransactions;
  final double currentTps;             // Current transactions per second
  final double averageTps;             // Average TPS
  final double peakTps;                // Peak TPS
  final double averageLatency;         // Average latency in ms
  final double cpuUsage;               // CPU usage percentage
  final double memoryUsage;            // Memory usage in MB
  final int activeThreads;
  final DateTime? lastTransactionTime;

  const BusinessNodeMetrics({
    this.totalTransactions = 0,
    this.successfulTransactions = 0,
    this.failedTransactions = 0,
    this.queuedTransactions = 0,
    this.processingTransactions = 0,
    this.currentTps = 0.0,
    this.averageTps = 0.0,
    this.peakTps = 0.0,
    this.averageLatency = 0.0,
    this.cpuUsage = 0.0,
    this.memoryUsage = 0.0,
    this.activeThreads = 0,
    this.lastTransactionTime,
  });

  factory BusinessNodeMetrics.empty() => const BusinessNodeMetrics();

  double get successRate =>
      totalTransactions > 0
          ? (successfulTransactions / totalTransactions) * 100
          : 0.0;

  double get queueUtilization =>
      queuedTransactions.toDouble();

  Map<String, dynamic> toMap() => {
    'totalTransactions': totalTransactions,
    'successfulTransactions': successfulTransactions,
    'failedTransactions': failedTransactions,
    'queuedTransactions': queuedTransactions,
    'processingTransactions': processingTransactions,
    'currentTps': currentTps,
    'averageTps': averageTps,
    'peakTps': peakTps,
    'averageLatency': averageLatency,
    'cpuUsage': cpuUsage,
    'memoryUsage': memoryUsage,
    'activeThreads': activeThreads,
    'lastTransactionTime': lastTransactionTime?.toIso8601String(),
  };

  factory BusinessNodeMetrics.fromMap(Map<String, dynamic> map) =>
      BusinessNodeMetrics(
        totalTransactions: map['totalTransactions'] ?? 0,
        successfulTransactions: map['successfulTransactions'] ?? 0,
        failedTransactions: map['failedTransactions'] ?? 0,
        queuedTransactions: map['queuedTransactions'] ?? 0,
        processingTransactions: map['processingTransactions'] ?? 0,
        currentTps: (map['currentTps'] ?? 0.0).toDouble(),
        averageTps: (map['averageTps'] ?? 0.0).toDouble(),
        peakTps: (map['peakTps'] ?? 0.0).toDouble(),
        averageLatency: (map['averageLatency'] ?? 0.0).toDouble(),
        cpuUsage: (map['cpuUsage'] ?? 0.0).toDouble(),
        memoryUsage: (map['memoryUsage'] ?? 0.0).toDouble(),
        activeThreads: map['activeThreads'] ?? 0,
        lastTransactionTime: map['lastTransactionTime'] != null
            ? DateTime.parse(map['lastTransactionTime'])
            : null,
      );

  BusinessNodeMetrics copyWith({
    int? totalTransactions,
    int? successfulTransactions,
    int? failedTransactions,
    int? queuedTransactions,
    int? processingTransactions,
    double? currentTps,
    double? averageTps,
    double? peakTps,
    double? averageLatency,
    double? cpuUsage,
    double? memoryUsage,
    int? activeThreads,
    DateTime? lastTransactionTime,
  }) {
    return BusinessNodeMetrics(
      totalTransactions: totalTransactions ?? this.totalTransactions,
      successfulTransactions: successfulTransactions ?? this.successfulTransactions,
      failedTransactions: failedTransactions ?? this.failedTransactions,
      queuedTransactions: queuedTransactions ?? this.queuedTransactions,
      processingTransactions: processingTransactions ?? this.processingTransactions,
      currentTps: currentTps ?? this.currentTps,
      averageTps: averageTps ?? this.averageTps,
      peakTps: peakTps ?? this.peakTps,
      averageLatency: averageLatency ?? this.averageLatency,
      cpuUsage: cpuUsage ?? this.cpuUsage,
      memoryUsage: memoryUsage ?? this.memoryUsage,
      activeThreads: activeThreads ?? this.activeThreads,
      lastTransactionTime: lastTransactionTime ?? this.lastTransactionTime,
    );
  }
}

/// Business Transaction
class BusinessTransaction {
  final String id;
  final String nodeId;
  final String from;
  final String to;
  final String amount;
  final BusinessNodePriority priority;
  final Map<String, dynamic>? data;
  final DateTime createdAt;
  final DateTime? processedAt;
  final String? errorMessage;

  const BusinessTransaction({
    required this.id,
    required this.nodeId,
    required this.from,
    required this.to,
    required this.amount,
    this.priority = BusinessNodePriority.normal,
    this.data,
    required this.createdAt,
    this.processedAt,
    this.errorMessage,
  });

  bool get isProcessed => processedAt != null;
  bool get hasFailed => errorMessage != null;

  Map<String, dynamic> toMap() => {
    'id': id,
    'nodeId': nodeId,
    'from': from,
    'to': to,
    'amount': amount,
    'priority': priority.name,
    'data': data,
    'createdAt': createdAt.toIso8601String(),
    'processedAt': processedAt?.toIso8601String(),
    'errorMessage': errorMessage,
  };

  factory BusinessTransaction.fromMap(Map<String, dynamic> map) =>
      BusinessTransaction(
        id: map['id'],
        nodeId: map['nodeId'],
        from: map['from'],
        to: map['to'],
        amount: map['amount'],
        priority: BusinessNodePriority.values.firstWhere(
          (p) => p.name == map['priority'],
          orElse: () => BusinessNodePriority.normal,
        ),
        data: map['data'],
        createdAt: DateTime.parse(map['createdAt']),
        processedAt: map['processedAt'] != null
            ? DateTime.parse(map['processedAt'])
            : null,
        errorMessage: map['errorMessage'],
      );
}

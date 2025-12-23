/// Business Node Manager
///
/// Manages business nodes for transaction processing

part of aurigraph_sdk;

/// Business Node Manager
class BusinessNodeManager {
  final NetworkManager _networkManager;
  final Map<String, BusinessNode> _nodes = {};
  final Map<String, Timer> _nodeTimers = {};
  final StreamController<BusinessNodeEvent> _eventController =
      StreamController<BusinessNodeEvent>.broadcast();

  BusinessNodeManager(this._networkManager);

  /// Stream of business node events
  Stream<BusinessNodeEvent> get events => _eventController.stream;

  /// Get all business nodes
  List<BusinessNode> get nodes => _nodes.values.toList();

  /// Get node by ID
  BusinessNode? getNode(String id) => _nodes[id];

  /// Create a new business node
  Future<BusinessNode> createNode(BusinessNodeConfig config) async {
    if (_nodes.containsKey(config.id)) {
      throw AurigraphException(
        'Business node with ID ${config.id} already exists',
      );
    }

    final node = BusinessNode(
      id: config.id,
      config: config,
      state: BusinessNodeState.idle,
      createdAt: DateTime.now(),
    );

    _nodes[config.id] = node;

    // Notify event
    _eventController.add(BusinessNodeEvent(
      type: BusinessNodeEventType.created,
      nodeId: node.id,
      node: node,
    ));

    // Save to persistent storage
    await _saveNodes();

    if (kDebugMode) {
      print('Business node created: ${node.id}');
    }

    return node;
  }

  /// Start a business node
  Future<void> startNode(String nodeId) async {
    final node = _nodes[nodeId];
    if (node == null) {
      throw AurigraphException('Business node not found: $nodeId');
    }

    if (node.state == BusinessNodeState.processing) {
      throw AurigraphException('Business node already running: $nodeId');
    }

    // Update state
    node.state = BusinessNodeState.processing;
    node.lastUpdated = DateTime.now();

    // Start processing simulation
    _startNodeSimulation(node);

    _eventController.add(BusinessNodeEvent(
      type: BusinessNodeEventType.started,
      nodeId: node.id,
      node: node,
    ));

    await _saveNodes();
  }

  /// Stop a business node
  Future<void> stopNode(String nodeId) async {
    final node = _nodes[nodeId];
    if (node == null) {
      throw AurigraphException('Business node not found: $nodeId');
    }

    // Stop simulation
    _nodeTimers[nodeId]?.cancel();
    _nodeTimers.remove(nodeId);

    // Update state
    node.state = BusinessNodeState.paused;
    node.lastUpdated = DateTime.now();

    _eventController.add(BusinessNodeEvent(
      type: BusinessNodeEventType.stopped,
      nodeId: node.id,
      node: node,
    ));

    await _saveNodes();
  }

  /// Delete a business node
  Future<void> deleteNode(String nodeId) async {
    final node = _nodes[nodeId];
    if (node == null) {
      throw AurigraphException('Business node not found: $nodeId');
    }

    // Stop simulation if running
    _nodeTimers[nodeId]?.cancel();
    _nodeTimers.remove(nodeId);

    // Remove node
    _nodes.remove(nodeId);

    _eventController.add(BusinessNodeEvent(
      type: BusinessNodeEventType.deleted,
      nodeId: nodeId,
      node: node,
    ));

    await _saveNodes();
  }

  /// Update node configuration
  Future<BusinessNode> updateNodeConfig(
    String nodeId,
    BusinessNodeConfig newConfig,
  ) async {
    final node = _nodes[nodeId];
    if (node == null) {
      throw AurigraphException('Business node not found: $nodeId');
    }

    final wasRunning = node.state == BusinessNodeState.processing;

    // Stop if running
    if (wasRunning) {
      await stopNode(nodeId);
    }

    // Update config
    final updatedNode = node.copyWith(
      config: newConfig,
      lastUpdated: DateTime.now(),
    );
    _nodes[nodeId] = updatedNode;

    // Restart if was running
    if (wasRunning) {
      await startNode(nodeId);
    }

    _eventController.add(BusinessNodeEvent(
      type: BusinessNodeEventType.updated,
      nodeId: nodeId,
      node: updatedNode,
    ));

    await _saveNodes();
    return updatedNode;
  }

  /// Submit transaction to business node
  Future<String> submitTransaction(BusinessTransaction transaction) async {
    final node = _nodes[transaction.nodeId];
    if (node == null) {
      throw AurigraphException('Business node not found: ${transaction.nodeId}');
    }

    if (node.state != BusinessNodeState.processing) {
      throw AurigraphException('Business node is not processing: ${transaction.nodeId}');
    }

    // Check queue capacity
    if (node.metrics.queuedTransactions >= node.config.queueSize) {
      throw AurigraphException('Business node queue is full: ${transaction.nodeId}');
    }

    // Update metrics
    node.metrics = node.metrics.copyWith(
      queuedTransactions: node.metrics.queuedTransactions + 1,
    );

    _eventController.add(BusinessNodeEvent(
      type: BusinessNodeEventType.transactionQueued,
      nodeId: node.id,
      node: node,
      transaction: transaction,
    ));

    return transaction.id;
  }

  /// Get node statistics
  Map<String, dynamic> getNodeStatistics(String nodeId) {
    final node = _nodes[nodeId];
    if (node == null) {
      throw AurigraphException('Business node not found: $nodeId');
    }

    return {
      'id': node.id,
      'name': node.config.name,
      'state': node.state.name,
      'uptime': node.lastUpdated != null
          ? DateTime.now().difference(node.createdAt).inSeconds
          : 0,
      'metrics': node.metrics.toMap(),
      'efficiency': _calculateEfficiency(node),
    };
  }

  /// Calculate node efficiency
  double _calculateEfficiency(BusinessNode node) {
    if (node.config.processingCapacity == 0) return 0.0;
    return (node.metrics.currentTps / node.config.processingCapacity) * 100;
  }

  /// Start node simulation (for demo purposes)
  void _startNodeSimulation(BusinessNode node) {
    // Cancel existing timer if any
    _nodeTimers[node.id]?.cancel();

    // Create new timer for simulation
    _nodeTimers[node.id] = Timer.periodic(
      const Duration(milliseconds: 1000),
      (_) => _simulateNodeActivity(node),
    );
  }

  /// Simulate node activity
  void _simulateNodeActivity(BusinessNode node) {
    if (node.state != BusinessNodeState.processing) return;

    // Simulate transaction processing
    final random = Random();

    // Calculate current TPS based on capacity
    final targetTps = node.config.processingCapacity * 0.7; // 70% of capacity
    final variance = targetTps * 0.2; // 20% variance
    final currentTps = targetTps + (random.nextDouble() * variance * 2 - variance);

    // Simulate transaction counts
    final processedCount = currentTps.toInt();
    final successRate = 0.95 + (random.nextDouble() * 0.05); // 95-100% success
    final successCount = (processedCount * successRate).toInt();
    final failedCount = processedCount - successCount;

    // Simulate resource usage
    final cpuUsage = 20.0 + (currentTps / node.config.processingCapacity * 60); // 20-80%
    final memoryUsage = 100.0 + (currentTps / 10); // Base 100MB + usage

    // Simulate queue
    final newQueued = random.nextInt(100);
    final currentQueued = max(0, node.metrics.queuedTransactions + newQueued - processedCount);

    // Update metrics
    final updatedMetrics = node.metrics.copyWith(
      totalTransactions: node.metrics.totalTransactions + processedCount,
      successfulTransactions: node.metrics.successfulTransactions + successCount,
      failedTransactions: node.metrics.failedTransactions + failedCount,
      queuedTransactions: currentQueued,
      processingTransactions: min(processedCount, node.config.parallelThreads),
      currentTps: currentTps,
      averageTps: (node.metrics.averageTps + currentTps) / 2,
      peakTps: max(node.metrics.peakTps, currentTps),
      averageLatency: 50.0 + random.nextDouble() * 100, // 50-150ms
      cpuUsage: cpuUsage,
      memoryUsage: memoryUsage,
      activeThreads: min(node.config.parallelThreads, processedCount),
      lastTransactionTime: DateTime.now(),
    );

    node.metrics = updatedMetrics;
    node.lastUpdated = DateTime.now();

    // Check for overload
    if (currentQueued > node.config.queueSize * 0.8) {
      node.state = BusinessNodeState.overloaded;
    } else if (node.state == BusinessNodeState.overloaded && currentQueued < node.config.queueSize * 0.5) {
      node.state = BusinessNodeState.processing;
    }

    _eventController.add(BusinessNodeEvent(
      type: BusinessNodeEventType.metricsUpdated,
      nodeId: node.id,
      node: node,
    ));
  }

  /// Load nodes from storage
  Future<void> loadNodes() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final nodesJson = prefs.getString('business_nodes');

      if (nodesJson != null) {
        final nodesList = jsonDecode(nodesJson) as List;
        for (final nodeMap in nodesList) {
          final node = BusinessNode.fromMap(nodeMap);
          _nodes[node.id] = node;

          // Restart nodes that were processing
          if (node.state == BusinessNodeState.processing) {
            _startNodeSimulation(node);
          }
        }

        if (kDebugMode) {
          print('Loaded ${_nodes.length} business nodes');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        print('Failed to load business nodes: $e');
      }
    }
  }

  /// Save nodes to storage
  Future<void> _saveNodes() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final nodesList = _nodes.values.map((node) => node.toMap()).toList();
      await prefs.setString('business_nodes', jsonEncode(nodesList));
    } catch (e) {
      if (kDebugMode) {
        print('Failed to save business nodes: $e');
      }
    }
  }

  /// Stop all nodes and cleanup
  Future<void> dispose() async {
    for (final nodeId in _nodes.keys.toList()) {
      _nodeTimers[nodeId]?.cancel();
    }
    _nodeTimers.clear();
    await _eventController.close();
  }
}

/// Business Node Event Type
enum BusinessNodeEventType {
  created,
  started,
  stopped,
  deleted,
  updated,
  metricsUpdated,
  transactionQueued,
  transactionProcessed,
  error,
}

/// Business Node Event
class BusinessNodeEvent {
  final BusinessNodeEventType type;
  final String nodeId;
  final BusinessNode? node;
  final BusinessTransaction? transaction;
  final String? errorMessage;

  const BusinessNodeEvent({
    required this.type,
    required this.nodeId,
    this.node,
    this.transaction,
    this.errorMessage,
  });
}

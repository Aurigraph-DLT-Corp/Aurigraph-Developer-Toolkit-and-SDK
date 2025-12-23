/// Business Node Widgets
///
/// UI components for Aurigraph Business Node management

part of aurigraph_sdk;

/// Business Node List View
class BusinessNodeListView extends StatefulWidget {
  const BusinessNodeListView({super.key});

  @override
  State<BusinessNodeListView> createState() => _BusinessNodeListViewState();
}

class _BusinessNodeListViewState extends State<BusinessNodeListView> {
  late StreamSubscription<BusinessNodeEvent> _eventSubscription;
  List<BusinessNode> _nodes = [];

  @override
  void initState() {
    super.initState();
    _loadNodes();
    _subscribeToEvents();
  }

  @override
  void dispose() {
    _eventSubscription.cancel();
    super.dispose();
  }

  Future<void> _loadNodes() async {
    final manager = AurigraphSDK.instance.businessNodeManager;
    setState(() {
      _nodes = manager.nodes;
    });
  }

  void _subscribeToEvents() {
    final manager = AurigraphSDK.instance.businessNodeManager;
    _eventSubscription = manager.events.listen((event) {
      setState(() {
        _nodes = manager.nodes;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Business Nodes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => _showCreateNodeDialog(context),
          ),
        ],
      ),
      body: _nodes.isEmpty
          ? _buildEmptyState()
          : RefreshIndicator(
              onRefresh: _loadNodes,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _nodes.length,
                itemBuilder: (context, index) {
                  return BusinessNodeCard(
                    node: _nodes[index],
                    onTap: () => _navigateToDetails(_nodes[index]),
                  );
                },
              ),
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.dns_outlined,
            size: 64,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'No Business Nodes',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Create a node to start processing transactions',
            style: TextStyle(
              color: Colors.grey[500],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => _showCreateNodeDialog(context),
            icon: const Icon(Icons.add),
            label: const Text('Create Business Node'),
          ),
        ],
      ),
    );
  }

  void _showCreateNodeDialog(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const BusinessNodeConfigScreen(),
      ),
    ).then((_) => _loadNodes());
  }

  void _navigateToDetails(BusinessNode node) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BusinessNodeDetailScreen(node: node),
      ),
    );
  }
}

/// Business Node Card
class BusinessNodeCard extends StatelessWidget {
  final BusinessNode node;
  final VoidCallback? onTap;

  const BusinessNodeCard({
    super.key,
    required this.node,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _buildStatusIndicator(),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          node.config.name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _getStatusText(),
                          style: TextStyle(
                            fontSize: 12,
                            color: _getStatusColor(),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildActionButton(context),
                ],
              ),
              const Divider(height: 24),
              Row(
                children: [
                  _buildMetricItem(
                    icon: Icons.speed,
                    label: 'TPS',
                    value: node.metrics.currentTps.toStringAsFixed(0),
                  ),
                  _buildMetricItem(
                    icon: Icons.queue,
                    label: 'Queue',
                    value: '${node.metrics.queuedTransactions}',
                  ),
                  _buildMetricItem(
                    icon: Icons.check_circle_outline,
                    label: 'Success',
                    value: '${node.metrics.successRate.toStringAsFixed(1)}%',
                  ),
                  _buildMetricItem(
                    icon: Icons.memory,
                    label: 'CPU',
                    value: '${node.metrics.cpuUsage.toStringAsFixed(0)}%',
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusIndicator() {
    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        color: _getStatusColor(),
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: _getStatusColor().withOpacity(0.5),
            blurRadius: 8,
            spreadRadius: 2,
          ),
        ],
      ),
    );
  }

  Color _getStatusColor() {
    switch (node.state) {
      case BusinessNodeState.processing:
        return Colors.green;
      case BusinessNodeState.overloaded:
        return Colors.orange;
      case BusinessNodeState.paused:
        return Colors.grey;
      case BusinessNodeState.error:
        return Colors.red;
      case BusinessNodeState.disconnected:
        return Colors.red[900]!;
      case BusinessNodeState.idle:
      default:
        return Colors.blue;
    }
  }

  String _getStatusText() {
    switch (node.state) {
      case BusinessNodeState.processing:
        return 'Processing';
      case BusinessNodeState.overloaded:
        return 'Overloaded';
      case BusinessNodeState.paused:
        return 'Paused';
      case BusinessNodeState.error:
        return 'Error';
      case BusinessNodeState.disconnected:
        return 'Disconnected';
      case BusinessNodeState.idle:
      default:
        return 'Idle';
    }
  }

  Widget _buildActionButton(BuildContext context) {
    IconData icon;
    VoidCallback? onPressed;
    Color color;

    if (node.state == BusinessNodeState.processing) {
      icon = Icons.pause;
      color = Colors.orange;
      onPressed = () async {
        await AurigraphSDK.instance.businessNodeManager.stopNode(node.id);
      };
    } else if (node.state == BusinessNodeState.paused || node.state == BusinessNodeState.idle) {
      icon = Icons.play_arrow;
      color = Colors.green;
      onPressed = () async {
        await AurigraphSDK.instance.businessNodeManager.startNode(node.id);
      };
    } else {
      icon = Icons.refresh;
      color = Colors.blue;
      onPressed = () async {
        await AurigraphSDK.instance.businessNodeManager.stopNode(node.id);
        await Future.delayed(const Duration(milliseconds: 500));
        await AurigraphSDK.instance.businessNodeManager.startNode(node.id);
      };
    }

    return IconButton(
      icon: Icon(icon, color: color),
      onPressed: onPressed,
    );
  }

  Widget _buildMetricItem({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}

/// Business Node Detail Screen
class BusinessNodeDetailScreen extends StatefulWidget {
  final BusinessNode node;

  const BusinessNodeDetailScreen({
    super.key,
    required this.node,
  });

  @override
  State<BusinessNodeDetailScreen> createState() => _BusinessNodeDetailScreenState();
}

class _BusinessNodeDetailScreenState extends State<BusinessNodeDetailScreen> {
  late StreamSubscription<BusinessNodeEvent> _eventSubscription;
  late BusinessNode _node;

  @override
  void initState() {
    super.initState();
    _node = widget.node;
    _subscribeToEvents();
  }

  @override
  void dispose() {
    _eventSubscription.cancel();
    super.dispose();
  }

  void _subscribeToEvents() {
    final manager = AurigraphSDK.instance.businessNodeManager;
    _eventSubscription = manager.events.listen((event) {
      if (event.nodeId == _node.id) {
        setState(() {
          _node = event.node ?? _node;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_node.config.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: _editConfiguration,
          ),
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: _deleteNode,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildStatusCard(),
          const SizedBox(height: 16),
          _buildMetricsCard(),
          const SizedBox(height: 16),
          _buildConfigurationCard(),
          const SizedBox(height: 16),
          _buildChartsCard(),
        ],
      ),
    );
  }

  Widget _buildStatusCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Status',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatusItem(
                    'State',
                    _node.state.name.toUpperCase(),
                    _getStateColor(_node.state),
                  ),
                ),
                Expanded(
                  child: _buildStatusItem(
                    'Uptime',
                    _formatUptime(_node.createdAt),
                    Colors.blue,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _toggleNodeState,
                icon: Icon(
                  _node.state == BusinessNodeState.processing
                      ? Icons.pause
                      : Icons.play_arrow,
                ),
                label: Text(
                  _node.state == BusinessNodeState.processing ? 'Pause' : 'Start',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Performance Metrics',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildMetricRow('Current TPS', '${_node.metrics.currentTps.toStringAsFixed(0)}'),
            _buildMetricRow('Average TPS', '${_node.metrics.averageTps.toStringAsFixed(0)}'),
            _buildMetricRow('Peak TPS', '${_node.metrics.peakTps.toStringAsFixed(0)}'),
            _buildMetricRow('Avg Latency', '${_node.metrics.averageLatency.toStringAsFixed(0)} ms'),
            const Divider(height: 24),
            _buildMetricRow('Total Transactions', '${_node.metrics.totalTransactions}'),
            _buildMetricRow('Successful', '${_node.metrics.successfulTransactions}'),
            _buildMetricRow('Failed', '${_node.metrics.failedTransactions}'),
            _buildMetricRow('Success Rate', '${_node.metrics.successRate.toStringAsFixed(2)}%'),
            const Divider(height: 24),
            _buildMetricRow('Queued', '${_node.metrics.queuedTransactions}'),
            _buildMetricRow('Processing', '${_node.metrics.processingTransactions}'),
            _buildMetricRow('Active Threads', '${_node.metrics.activeThreads}'),
            const Divider(height: 24),
            _buildMetricRow('CPU Usage', '${_node.metrics.cpuUsage.toStringAsFixed(1)}%'),
            _buildMetricRow('Memory Usage', '${_node.metrics.memoryUsage.toStringAsFixed(0)} MB'),
          ],
        ),
      ),
    );
  }

  Widget _buildConfigurationCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Configuration',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildConfigRow('Processing Capacity', '${_node.config.processingCapacity} TPS'),
            _buildConfigRow('Queue Size', '${_node.config.queueSize}'),
            _buildConfigRow('Batch Size', '${_node.config.batchSize}'),
            _buildConfigRow('Parallel Threads', '${_node.config.parallelThreads}'),
            _buildConfigRow('Strategy', _node.config.strategy.name),
            _buildConfigRow('Timeout', '${_node.config.timeout}s'),
            _buildConfigRow('Auto Restart', _node.config.autoRestart ? 'Yes' : 'No'),
          ],
        ),
      ),
    );
  }

  Widget _buildChartsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Real-time Charts',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            BusinessNodeMetricsChart(node: _node),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildMetricRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildConfigRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[600])),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Color _getStateColor(BusinessNodeState state) {
    switch (state) {
      case BusinessNodeState.processing:
        return Colors.green;
      case BusinessNodeState.overloaded:
        return Colors.orange;
      case BusinessNodeState.paused:
        return Colors.grey;
      case BusinessNodeState.error:
      case BusinessNodeState.disconnected:
        return Colors.red;
      case BusinessNodeState.idle:
      default:
        return Colors.blue;
    }
  }

  String _formatUptime(DateTime startTime) {
    final duration = DateTime.now().difference(startTime);
    if (duration.inDays > 0) {
      return '${duration.inDays}d ${duration.inHours % 24}h';
    } else if (duration.inHours > 0) {
      return '${duration.inHours}h ${duration.inMinutes % 60}m';
    } else {
      return '${duration.inMinutes}m';
    }
  }

  Future<void> _toggleNodeState() async {
    final manager = AurigraphSDK.instance.businessNodeManager;
    try {
      if (_node.state == BusinessNodeState.processing) {
        await manager.stopNode(_node.id);
      } else {
        await manager.startNode(_node.id);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _editConfiguration() async {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => BusinessNodeConfigScreen(node: _node),
      ),
    );
  }

  Future<void> _deleteNode() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Business Node'),
        content: Text('Are you sure you want to delete "${_node.config.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await AurigraphSDK.instance.businessNodeManager.deleteNode(_node.id);
        if (mounted) {
          Navigator.pop(context);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.toString()}')),
          );
        }
      }
    }
  }
}

/// Business Node Configuration Screen
class BusinessNodeConfigScreen extends StatefulWidget {
  final BusinessNode? node;

  const BusinessNodeConfigScreen({super.key, this.node});

  @override
  State<BusinessNodeConfigScreen> createState() => _BusinessNodeConfigScreenState();
}

class _BusinessNodeConfigScreenState extends State<BusinessNodeConfigScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _processingCapacityController;
  late TextEditingController _queueSizeController;
  late TextEditingController _batchSizeController;
  late TextEditingController _parallelThreadsController;
  late TextEditingController _timeoutController;
  late ProcessingStrategy _strategy;
  late bool _autoRestart;

  @override
  void initState() {
    super.initState();
    final config = widget.node?.config;
    _nameController = TextEditingController(text: config?.name ?? '');
    _processingCapacityController = TextEditingController(
      text: (config?.processingCapacity ?? 1000).toString(),
    );
    _queueSizeController = TextEditingController(
      text: (config?.queueSize ?? 10000).toString(),
    );
    _batchSizeController = TextEditingController(
      text: (config?.batchSize ?? 100).toString(),
    );
    _parallelThreadsController = TextEditingController(
      text: (config?.parallelThreads ?? 4).toString(),
    );
    _timeoutController = TextEditingController(
      text: (config?.timeout ?? 30).toString(),
    );
    _strategy = config?.strategy ?? ProcessingStrategy.fifo;
    _autoRestart = config?.autoRestart ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _processingCapacityController.dispose();
    _queueSizeController.dispose();
    _batchSizeController.dispose();
    _parallelThreadsController.dispose();
    _timeoutController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.node != null;

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Edit Business Node' : 'Create Business Node'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Node Name',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter a name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _processingCapacityController,
              decoration: const InputDecoration(
                labelText: 'Processing Capacity (TPS)',
                border: OutlineInputBorder(),
                helperText: 'Maximum transactions per second',
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter processing capacity';
                }
                final capacity = int.tryParse(value);
                if (capacity == null || capacity <= 0) {
                  return 'Please enter a valid positive number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _queueSizeController,
              decoration: const InputDecoration(
                labelText: 'Queue Size',
                border: OutlineInputBorder(),
                helperText: 'Maximum queue length',
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter queue size';
                }
                final size = int.tryParse(value);
                if (size == null || size <= 0) {
                  return 'Please enter a valid positive number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _batchSizeController,
              decoration: const InputDecoration(
                labelText: 'Batch Size',
                border: OutlineInputBorder(),
                helperText: 'Number of transactions per batch',
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter batch size';
                }
                final size = int.tryParse(value);
                if (size == null || size <= 0) {
                  return 'Please enter a valid positive number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _parallelThreadsController,
              decoration: const InputDecoration(
                labelText: 'Parallel Threads',
                border: OutlineInputBorder(),
                helperText: 'Number of parallel processors',
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter parallel threads';
                }
                final threads = int.tryParse(value);
                if (threads == null || threads <= 0) {
                  return 'Please enter a valid positive number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<ProcessingStrategy>(
              value: _strategy,
              decoration: const InputDecoration(
                labelText: 'Processing Strategy',
                border: OutlineInputBorder(),
              ),
              items: ProcessingStrategy.values.map((strategy) {
                return DropdownMenuItem(
                  value: strategy,
                  child: Text(_formatStrategyName(strategy)),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _strategy = value!;
                });
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _timeoutController,
              decoration: const InputDecoration(
                labelText: 'Timeout (seconds)',
                border: OutlineInputBorder(),
                helperText: 'Transaction timeout',
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter timeout';
                }
                final timeout = int.tryParse(value);
                if (timeout == null || timeout <= 0) {
                  return 'Please enter a valid positive number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('Auto Restart'),
              subtitle: const Text('Automatically restart on failure'),
              value: _autoRestart,
              onChanged: (value) {
                setState(() {
                  _autoRestart = value;
                });
              },
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _saveNode,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(isEditing ? 'Update Node' : 'Create Node'),
            ),
          ],
        ),
      ),
    );
  }

  String _formatStrategyName(ProcessingStrategy strategy) {
    switch (strategy) {
      case ProcessingStrategy.fifo:
        return 'FIFO (First-In-First-Out)';
      case ProcessingStrategy.lifo:
        return 'LIFO (Last-In-First-Out)';
      case ProcessingStrategy.priority:
        return 'Priority-based';
      case ProcessingStrategy.roundRobin:
        return 'Round-robin';
      case ProcessingStrategy.leastBusy:
        return 'Least Busy';
    }
  }

  Future<void> _saveNode() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final config = BusinessNodeConfig(
      id: widget.node?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
      name: _nameController.text,
      processingCapacity: int.parse(_processingCapacityController.text),
      queueSize: int.parse(_queueSizeController.text),
      batchSize: int.parse(_batchSizeController.text),
      parallelThreads: int.parse(_parallelThreadsController.text),
      strategy: _strategy,
      timeout: int.parse(_timeoutController.text),
      autoRestart: _autoRestart,
    );

    try {
      final manager = AurigraphSDK.instance.businessNodeManager;
      if (widget.node != null) {
        await manager.updateNodeConfig(widget.node!.id, config);
      } else {
        await manager.createNode(config);
      }

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }
}

/// Business Node Metrics Chart
class BusinessNodeMetricsChart extends StatefulWidget {
  final BusinessNode node;

  const BusinessNodeMetricsChart({super.key, required this.node});

  @override
  State<BusinessNodeMetricsChart> createState() => _BusinessNodeMetricsChartState();
}

class _BusinessNodeMetricsChartState extends State<BusinessNodeMetricsChart> {
  final List<double> _tpsHistory = [];
  final List<double> _latencyHistory = [];
  final int _maxDataPoints = 30;
  late StreamSubscription<BusinessNodeEvent> _eventSubscription;

  @override
  void initState() {
    super.initState();
    _subscribeToEvents();
  }

  @override
  void dispose() {
    _eventSubscription.cancel();
    super.dispose();
  }

  void _subscribeToEvents() {
    final manager = AurigraphSDK.instance.businessNodeManager;
    _eventSubscription = manager.events.listen((event) {
      if (event.nodeId == widget.node.id && event.type == BusinessNodeEventType.metricsUpdated) {
        setState(() {
          _tpsHistory.add(event.node?.metrics.currentTps ?? 0);
          _latencyHistory.add(event.node?.metrics.averageLatency ?? 0);

          if (_tpsHistory.length > _maxDataPoints) {
            _tpsHistory.removeAt(0);
          }
          if (_latencyHistory.length > _maxDataPoints) {
            _latencyHistory.removeAt(0);
          }
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildChart(
          'TPS',
          _tpsHistory,
          Colors.blue,
          'transactions/sec',
        ),
        const SizedBox(height: 24),
        _buildChart(
          'Latency',
          _latencyHistory,
          Colors.orange,
          'milliseconds',
        ),
      ],
    );
  }

  Widget _buildChart(
    String title,
    List<double> data,
    Color color,
    String unit,
  ) {
    if (data.isEmpty) {
      return Column(
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            height: 100,
            alignment: Alignment.center,
            child: Text(
              'No data yet',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
        ],
      );
    }

    final maxValue = data.reduce((a, b) => a > b ? a : b);
    final minValue = data.reduce((a, b) => a < b ? a : b);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(
              '${data.last.toStringAsFixed(1)} $unit',
              style: TextStyle(
                fontSize: 12,
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 100,
          child: CustomPaint(
            painter: _LineChartPainter(
              data: data,
              color: color,
              maxValue: maxValue,
              minValue: minValue,
            ),
            size: Size.infinite,
          ),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Min: ${minValue.toStringAsFixed(1)}',
              style: TextStyle(fontSize: 10, color: Colors.grey[600]),
            ),
            Text(
              'Max: ${maxValue.toStringAsFixed(1)}',
              style: TextStyle(fontSize: 10, color: Colors.grey[600]),
            ),
          ],
        ),
      ],
    );
  }
}

/// Line Chart Painter
class _LineChartPainter extends CustomPainter {
  final List<double> data;
  final Color color;
  final double maxValue;
  final double minValue;

  _LineChartPainter({
    required this.data,
    required this.color,
    required this.maxValue,
    required this.minValue,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (data.isEmpty) return;

    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final fillPaint = Paint()
      ..color = color.withOpacity(0.1)
      ..style = PaintingStyle.fill;

    final path = Path();
    final fillPath = Path();

    final stepX = size.width / (data.length - 1);
    final range = maxValue - minValue;

    for (var i = 0; i < data.length; i++) {
      final x = i * stepX;
      final normalizedValue = range > 0 ? (data[i] - minValue) / range : 0.5;
      final y = size.height - (normalizedValue * size.height);

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }

    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_LineChartPainter oldDelegate) {
    return oldDelegate.data != data;
  }
}

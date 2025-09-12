/// Aurigraph Flutter Demo App
/// 
/// Complete demo showcasing all SDK features

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:aurigraph_sdk/aurigraph_sdk.dart';

void main() {
  runApp(const AurigraphDemoApp());
}

class AurigraphDemoApp extends StatelessWidget {
  const AurigraphDemoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Aurigraph Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      darkTheme: ThemeData.dark().copyWith(
        primaryColor: Colors.blue,
        colorScheme: const ColorScheme.dark(
          primary: Colors.blue,
          secondary: Colors.green,
        ),
      ),
      home: const DemoHomePage(),
    );
  }
}

class DemoHomePage extends StatefulWidget {
  const DemoHomePage({super.key});

  @override
  State<DemoHomePage> createState() => _DemoHomePageState();
}

class _DemoHomePageState extends State<DemoHomePage> {
  bool _isInitialized = false;
  bool _isLoading = true;
  String _status = 'Initializing...';
  Wallet? _selectedWallet;
  String _balance = '0';
  List<Wallet> _wallets = [];
  int _selectedIndex = 0;
  ThemeMode _themeMode = ThemeMode.system;

  @override
  void initState() {
    super.initState();
    _initializeSDK();
  }

  Future<void> _initializeSDK() async {
    try {
      final config = AurigraphConfiguration(
        networkEndpoint: 'https://testnet-api.aurigraph.io',
        environment: Environment.testnet,
        enableBiometrics: true,
        enableOfflineMode: true,
        debugMode: true,
      );

      await AurigraphSDK.instance.initialize(config);
      
      setState(() {
        _isInitialized = true;
        _status = 'SDK initialized successfully!';
      });

      await _loadWallets();
    } catch (e) {
      setState(() {
        _status = 'Failed to initialize SDK: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadWallets() async {
    try {
      final wallets = await AurigraphSDK.instance.wallet.listWallets();
      setState(() {
        _wallets = wallets;
        if (wallets.isNotEmpty) {
          _selectedWallet = wallets.first;
          _loadBalance();
        }
      });
    } catch (e) {
      _showError('Failed to load wallets: $e');
    }
  }

  Future<void> _loadBalance() async {
    if (_selectedWallet == null) return;
    
    try {
      final balance = await AurigraphSDK.instance.transactions.getBalance(
        _selectedWallet!.address
      );
      setState(() {
        _balance = balance;
      });
    } catch (e) {
      print('Failed to load balance: $e');
    }
  }

  Future<void> _createWallet() async {
    try {
      final wallet = await AurigraphSDK.instance.wallet.createWallet(
        name: 'Demo Wallet ${DateTime.now().millisecondsSinceEpoch}',
        useBiometrics: true,
      );
      
      setState(() {
        _wallets.add(wallet);
        _selectedWallet = wallet;
      });
      
      _showSuccess('Wallet created: ${wallet.name}');
      await _loadBalance();
    } catch (e) {
      _showError('Failed to create wallet: $e');
    }
  }

  Future<void> _sendDemoTransaction() async {
    if (_selectedWallet == null) {
      _showError('Please select a wallet first');
      return;
    }

    try {
      final hash = await AurigraphSDK.instance.transactions.sendTransaction(
        from: _selectedWallet!.address,
        to: '0x742d35cc6cf34c39ee36670883c5e6547eeff93c', // Demo address
        amount: '0.001',
        walletId: _selectedWallet!.id,
        useBiometrics: true,
      );
      
      _showSuccess('Transaction sent: ${hash.substring(0, 20)}...');
      await _loadBalance();
    } catch (e) {
      _showError('Transaction failed: $e');
    }
  }

  Future<void> _initiateDemoBridge() async {
    try {
      final bridge = await AurigraphSDK.instance.bridge.initiate(
        BridgeRequest(
          fromChain: 'aurigraph',
          toChain: 'ethereum',
          amount: '10',
          recipientAddress: '0x742d35cc6cf34c39ee36670883c5e6547eeff93c',
        ),
      );
      
      _showSuccess('Bridge initiated: ${bridge.id}');
    } catch (e) {
      _showError('Bridge failed: $e');
    }
  }

  void _toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.light 
          ? ThemeMode.dark 
          : ThemeMode.light;
    });
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      themeMode: _themeMode,
      home: Scaffold(
        appBar: AppBar(
          title: const Text('Aurigraph Demo'),
          actions: [
            IconButton(
              icon: Icon(_themeMode == ThemeMode.light 
                  ? Icons.dark_mode 
                  : Icons.light_mode),
              onPressed: _toggleTheme,
            ),
          ],
        ),
        body: _isLoading
            ? const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Initializing Aurigraph SDK...'),
                  ],
                ),
              )
            : !_isInitialized
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: Colors.red,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _status,
                          style: const TextStyle(fontSize: 16),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _initializeSDK,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : IndexedStack(
                    index: _selectedIndex,
                    children: [
                      _buildWalletTab(),
                      _buildBridgeTab(),
                      _buildAnalyticsTab(),
                    ],
                  ),
        bottomNavigationBar: !_isInitialized
            ? null
            : BottomNavigationBar(
                currentIndex: _selectedIndex,
                onTap: (index) => setState(() => _selectedIndex = index),
                items: const [
                  BottomNavigationBarItem(
                    icon: Icon(Icons.account_balance_wallet),
                    label: 'Wallet',
                  ),
                  BottomNavigationBarItem(
                    icon: Icon(Icons.swap_horiz),
                    label: 'Bridge',
                  ),
                  BottomNavigationBarItem(
                    icon: Icon(Icons.analytics),
                    label: 'Analytics',
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildWalletTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'SDK Status',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(_status),
                  const SizedBox(height: 8),
                  Text('Version: ${AurigraphSDK.version}'),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Quick Actions
          const Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _createWallet,
                  icon: const Icon(Icons.add),
                  label: const Text('Create Wallet'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _sendDemoTransaction,
                  icon: const Icon(Icons.send),
                  label: const Text('Demo TX'),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Wallet Selection
          const Text(
            'Wallets',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          
          if (_wallets.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: Text('No wallets found. Create one to get started.'),
              ),
            )
          else
            ...wallets.map((wallet) => Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                title: Text(wallet.name),
                subtitle: Text(
                  '${wallet.address.substring(0, 20)}...\n'
                  'Created: ${wallet.createdAt.toLocal().toString().split(' ')[0]}',
                ),
                trailing: _selectedWallet?.id == wallet.id
                    ? const Icon(Icons.check_circle, color: Colors.green)
                    : null,
                onTap: () {
                  setState(() {
                    _selectedWallet = wallet;
                  });
                  _loadBalance();
                },
              ),
            )),
          
          if (_selectedWallet != null) ...[
            const SizedBox(height: 24),
            
            // Balance Display
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text(
                      'Balance',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$_balance AUR',
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildBridgeTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Cross-Chain Bridge',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Bridge Assets',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  const TextField(
                    decoration: InputDecoration(
                      labelText: 'Amount',
                      hintText: 'Enter amount to bridge',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 12),
                  
                  const TextField(
                    decoration: InputDecoration(
                      labelText: 'Recipient Address',
                      hintText: '0x742d35cc6cf34c3...',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('From Chain'),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.circle, color: Colors.blue, size: 16),
                                  SizedBox(width: 8),
                                  Text('Aurigraph'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Icon(Icons.arrow_forward),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('To Chain'),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                border: Border.all(color: Colors.grey),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.circle, color: Colors.purple, size: 16),
                                  SizedBox(width: 8),
                                  Text('Ethereum'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _initiateDemoBridge,
                      child: const Text('Initiate Bridge'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Supported Chains
          const Text(
            'Supported Chains',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              'Ethereum',
              'Polygon',
              'BSC',
              'Avalanche',
              'Solana',
              'Polkadot',
              'Cosmos',
              'NEAR',
            ].map((chain) => Chip(
              label: Text(chain),
              backgroundColor: Colors.blue.withOpacity(0.1),
            )).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildAnalyticsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Network Analytics',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          // Network Stats Cards
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Text(
                          'TPS',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          '1,247,503',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                        const SizedBox(height: 4),
                        LinearProgressIndicator(
                          value: 0.62,
                          backgroundColor: Colors.grey.withOpacity(0.3),
                          valueColor: const AlwaysStoppedAnimation<Color>(Colors.blue),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        const Text(
                          'Network Health',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          '99.8%',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                        const SizedBox(height: 4),
                        LinearProgressIndicator(
                          value: 0.998,
                          backgroundColor: Colors.grey.withOpacity(0.3),
                          valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Price Chart Placeholder
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Price Chart (24h)',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.show_chart, size: 48, color: Colors.grey),
                          SizedBox(height: 8),
                          Text(
                            'Price chart would be displayed here',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Portfolio Distribution Placeholder
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Portfolio Distribution',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.pie_chart, size: 48, color: Colors.grey),
                          SizedBox(height: 8),
                          Text(
                            'Portfolio pie chart would be displayed here',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
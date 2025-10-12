/// Aurigraph DLT Flutter SDK
/// 
/// A comprehensive Flutter plugin for Aurigraph V11 blockchain integration
/// with quantum-resistant cryptography, AI-driven consensus, and cross-chain support.
library aurigraph_sdk;

import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:crypto/crypto.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'src/aurigraph_sdk_platform_interface.dart';
part 'src/aurigraph_sdk_method_channel.dart';
part 'src/models.dart';
part 'src/wallet_manager.dart';
part 'src/transaction_manager.dart';
part 'src/bridge_manager.dart';
part 'src/crypto_manager.dart';
part 'src/network_manager.dart';
part 'src/business_node_models.dart';
part 'src/business_node_manager.dart';
part 'src/business_node_widgets.dart';

/// Main Aurigraph SDK class
class AurigraphSDK {
  static AurigraphSDK? _instance;
  static AurigraphSDK get instance => _instance ??= AurigraphSDK._();
  
  AurigraphSDK._();

  final AurigraphSdkPlatform _platform = AurigraphSdkPlatform.instance;
  
  bool _isInitialized = false;
  AurigraphConfiguration? _configuration;
  
  late WalletManager _walletManager;
  late TransactionManager _transactionManager;
  late BridgeManager _bridgeManager;
  late CryptoManager _cryptoManager;
  late NetworkManager _networkManager;
  late BusinessNodeManager _businessNodeManager;

  /// Check if SDK is initialized
  bool get isInitialized => _isInitialized;

  /// Get current configuration
  AurigraphConfiguration? get configuration => _configuration;

  /// Get SDK version
  static String get version => '11.0.0';

  /// Initialize the SDK with configuration
  Future<void> initialize(AurigraphConfiguration configuration) async {
    if (_isInitialized) {
      throw AurigraphException('SDK already initialized');
    }

    _configuration = configuration;
    
    // Initialize managers
    _cryptoManager = CryptoManager();
    _networkManager = NetworkManager(configuration);
    _walletManager = WalletManager(_cryptoManager);
    _transactionManager = TransactionManager(_networkManager, _cryptoManager);
    _bridgeManager = BridgeManager(_networkManager);
    _businessNodeManager = BusinessNodeManager(_networkManager);

    // Initialize platform-specific implementations
    await _platform.initialize(configuration.toMap());
    
    // Connect to network
    await _networkManager.connect();

    // Load business nodes
    await _businessNodeManager.loadNodes();

    _isInitialized = true;
    
    if (kDebugMode) {
      print('Aurigraph SDK initialized successfully');
    }
  }

  /// Get wallet manager instance
  WalletManager get wallet {
    _ensureInitialized();
    return _walletManager;
  }

  /// Get transaction manager instance
  TransactionManager get transactions {
    _ensureInitialized();
    return _transactionManager;
  }

  /// Get bridge manager instance
  BridgeManager get bridge {
    _ensureInitialized();
    return _bridgeManager;
  }

  /// Get crypto manager instance
  CryptoManager get crypto {
    _ensureInitialized();
    return _cryptoManager;
  }

  /// Get network manager instance
  NetworkManager get network {
    _ensureInitialized();
    return _networkManager;
  }

  /// Get business node manager instance
  BusinessNodeManager get businessNodeManager {
    _ensureInitialized();
    return _businessNodeManager;
  }

  /// Check biometric availability
  Future<BiometricType> getBiometricType() async {
    final LocalAuthentication localAuth = LocalAuthentication();
    
    final bool isAvailable = await localAuth.canCheckBiometrics;
    if (!isAvailable) return BiometricType.none;
    
    final List<BiometricType> availableBiometrics = 
        await localAuth.getAvailableBiometrics();
        
    if (availableBiometrics.contains(BiometricType.face)) {
      return BiometricType.face;
    } else if (availableBiometrics.contains(BiometricType.fingerprint)) {
      return BiometricType.fingerprint;
    } else if (availableBiometrics.contains(BiometricType.iris)) {
      return BiometricType.iris;
    }
    
    return BiometricType.none;
  }

  /// Authenticate with biometrics
  Future<bool> authenticateWithBiometrics({
    required String reason,
  }) async {
    final LocalAuthentication localAuth = LocalAuthentication();
    
    try {
      return await localAuth.authenticate(
        localizedFallbackTitle: 'Use Passcode',
        authMessages: const [
          AndroidAuthMessages(
            signInTitle: 'Biometric Authentication Required',
            cancelButton: 'Cancel',
          ),
          IOSAuthMessages(
            cancelButton: 'Cancel',
          ),
        ],
        options: AuthenticationOptions(
          biometricOnly: true,
          stickyAuth: true,
        ),
      );
    } catch (e) {
      if (kDebugMode) {
        print('Biometric authentication failed: $e');
      }
      return false;
    }
  }

  /// Get network status
  Future<NetworkStatus> getNetworkStatus() async {
    return await _networkManager.getNetworkStatus();
  }

  /// Shutdown SDK and cleanup resources
  Future<void> shutdown() async {
    if (!_isInitialized) return;

    await _businessNodeManager.dispose();
    await _networkManager.disconnect();
    await _platform.shutdown();

    _isInitialized = false;
    _configuration = null;

    if (kDebugMode) {
      print('Aurigraph SDK shut down');
    }
  }

  void _ensureInitialized() {
    if (!_isInitialized) {
      throw AurigraphException('SDK not initialized. Call initialize() first.');
    }
  }
}

/// SDK Configuration
class AurigraphConfiguration {
  final String networkEndpoint;
  final int grpcPort;
  final Environment environment;
  final bool enableBiometrics;
  final bool enableOfflineMode;
  final bool debugMode;

  const AurigraphConfiguration({
    this.networkEndpoint = 'https://api.aurigraph.io',
    this.grpcPort = 9004,
    this.environment = Environment.testnet,
    this.enableBiometrics = true,
    this.enableOfflineMode = true,
    this.debugMode = false,
  });

  Map<String, dynamic> toMap() => {
    'networkEndpoint': networkEndpoint,
    'grpcPort': grpcPort,
    'environment': environment.name,
    'enableBiometrics': enableBiometrics,
    'enableOfflineMode': enableOfflineMode,
    'debugMode': debugMode,
  };

  factory AurigraphConfiguration.fromMap(Map<String, dynamic> map) =>
      AurigraphConfiguration(
        networkEndpoint: map['networkEndpoint'] ?? 'https://api.aurigraph.io',
        grpcPort: map['grpcPort'] ?? 9004,
        environment: Environment.values.firstWhere(
          (e) => e.name == map['environment'],
          orElse: () => Environment.testnet,
        ),
        enableBiometrics: map['enableBiometrics'] ?? true,
        enableOfflineMode: map['enableOfflineMode'] ?? true,
        debugMode: map['debugMode'] ?? false,
      );
}

/// SDK Environment
enum Environment {
  mainnet,
  testnet,
  development,
}

/// Aurigraph SDK Exception
class AurigraphException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  const AurigraphException(this.message, [this.code, this.originalError]);

  @override
  String toString() => 'AurigraphException: $message${code != null ? ' ($code)' : ''}';
}
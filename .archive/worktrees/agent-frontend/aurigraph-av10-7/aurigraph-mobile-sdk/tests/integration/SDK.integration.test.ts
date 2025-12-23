/**
 * Integration tests for Aurigraph SDK
 * 
 * Tests the complete SDK workflow across platforms
 */

import { AurigraphSDK } from '@aurigraph/shared/AurigraphSDK';
import { TestEnvironment } from '../utils/TestEnvironment';
import { MockNetworkManager } from '../mocks/MockNetworkManager';

describe('Aurigraph SDK Integration Tests', () => {
  let sdk: AurigraphSDK;
  let testEnv: TestEnvironment;

  beforeAll(async () => {
    testEnv = new TestEnvironment();
    await testEnv.setup();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    sdk = new AurigraphSDK();
    await testEnv.reset();
  });

  afterEach(async () => {
    if (sdk.isInitialized) {
      await sdk.shutdown();
    }
  });

  describe('SDK Initialization', () => {
    it('should initialize SDK with valid configuration', async () => {
      const config = testEnv.getTestConfiguration();
      
      await sdk.initialize(config);
      
      expect(sdk.isInitialized).toBe(true);
      expect(sdk.configuration).toEqual(config);
    });

    it('should throw error for invalid configuration', async () => {
      const invalidConfig = {
        networkEndpoint: '', // Invalid empty endpoint
        environment: 'invalid' as any,
        grpcPort: -1, // Invalid port
      };

      await expect(sdk.initialize(invalidConfig))
        .rejects.toThrow('Invalid configuration');
    });

    it('should throw error when initializing twice', async () => {
      const config = testEnv.getTestConfiguration();
      
      await sdk.initialize(config);
      
      await expect(sdk.initialize(config))
        .rejects.toThrow('SDK already initialized');
    });
  });

  describe('Wallet Operations', () => {
    beforeEach(async () => {
      const config = testEnv.getTestConfiguration();
      await sdk.initialize(config);
    });

    it('should create wallet and perform full workflow', async () => {
      // Create wallet
      const wallet = await sdk.wallet().createWallet('Integration Test Wallet');
      
      expect(wallet).toBeDefined();
      expect(wallet.name).toBe('Integration Test Wallet');
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      
      // List wallets
      const wallets = await sdk.wallet().listWallets();
      expect(wallets).toContain(wallet);
      
      // Load wallet
      const loadedWallet = await sdk.wallet().loadWallet(wallet.id);
      expect(loadedWallet).toEqual(wallet);
      
      // Sign data
      const testData = Buffer.from('test message');
      const signature = await sdk.wallet().sign(testData);
      expect(signature).toBeDefined();
      expect(signature.length).toBeGreaterThan(0);
      
      // Export private key (requires auth in real implementation)
      const privateKey = await sdk.wallet().exportPrivateKey(wallet.id);
      expect(privateKey).toBeDefined();
      expect(privateKey.length).toBeGreaterThan(0);
    });

    it('should import wallet from private key', async () => {
      // Generate a key pair for testing
      const keyPair = await testEnv.generateTestKeyPair();
      
      const importedWallet = await sdk.wallet().importWallet(
        'Imported Test Wallet',
        keyPair.privateKey
      );
      
      expect(importedWallet).toBeDefined();
      expect(importedWallet.name).toBe('Imported Test Wallet');
      
      // Verify we can sign with imported wallet
      const testData = Buffer.from('test message');
      const signature = await sdk.wallet().sign(testData);
      expect(signature).toBeDefined();
    });

    it('should handle multiple wallets correctly', async () => {
      // Create multiple wallets
      const wallet1 = await sdk.wallet().createWallet('Wallet 1');
      const wallet2 = await sdk.wallet().createWallet('Wallet 2');
      const wallet3 = await sdk.wallet().createWallet('Wallet 3');
      
      // List all wallets
      const wallets = await sdk.wallet().listWallets();
      expect(wallets).toHaveLength(3);
      
      // Verify each wallet is unique
      const addresses = wallets.map(w => w.address);
      const uniqueAddresses = [...new Set(addresses)];
      expect(uniqueAddresses).toHaveLength(3);
      
      // Test switching between wallets
      await sdk.wallet().loadWallet(wallet2.id);
      const activeWallet = sdk.wallet().activeWallet;
      expect(activeWallet?.id).toBe(wallet2.id);
    });
  });

  describe('Transaction Operations', () => {
    let testWallet: any;

    beforeEach(async () => {
      const config = testEnv.getTestConfiguration();
      await sdk.initialize(config);
      
      // Create test wallet
      testWallet = await sdk.wallet().createWallet('Transaction Test Wallet');
    });

    it('should create and sign transaction', async () => {
      const transaction = await sdk.transactions().createTransaction(
        testWallet.address,
        '0x742d35cc6cf34c39ee36670883c5e6547eeff93c',
        '1.5',
        null,
        21000,
        '20'
      );
      
      expect(transaction).toBeDefined();
      expect(transaction.from).toBe(testWallet.address);
      expect(transaction.to).toBe('0x742d35cc6cf34c39ee36670883c5e6547eeff93c');
      expect(transaction.amount).toBe('1.5');
      expect(transaction.gasLimit).toBe(21000);
      
      // Sign transaction
      const signedTransaction = await sdk.transactions().signTransaction(
        transaction,
        testWallet,
        await sdk.wallet().exportPrivateKey(testWallet.id)
      );
      
      expect(signedTransaction).toBeDefined();
      expect(signedTransaction.signature).toBeDefined();
      expect(signedTransaction.hash).toBeDefined();
    });

    it('should estimate gas correctly', async () => {
      const gasEstimate = await sdk.transactions().estimateGas(
        testWallet.address,
        '0x742d35cc6cf34c39ee36670883c5e6547eeff93c',
        '1.0'
      );
      
      expect(gasEstimate).toBeGreaterThan(0);
      expect(gasEstimate).toBeLessThan(1000000); // Reasonable upper bound
    });

    it('should get current gas price', async () => {
      const gasPrice = await sdk.transactions().getGasPrice();
      
      expect(gasPrice).toBeDefined();
      expect(parseFloat(gasPrice)).toBeGreaterThan(0);
    });

    it('should handle transaction history', async () => {
      // Mock some transaction history
      testEnv.mockTransactionHistory(testWallet.address, [
        testEnv.createMockTransaction({
          from: testWallet.address,
          to: '0x123',
          amount: '1.0'
        }),
        testEnv.createMockTransaction({
          from: testWallet.address,
          to: '0x456',
          amount: '2.0'
        })
      ]);
      
      const history = await sdk.transactions().getTransactionHistory(
        testWallet.address,
        10,
        0
      );
      
      expect(history).toHaveLength(2);
      expect(history[0].from).toBe(testWallet.address);
      expect(history[1].from).toBe(testWallet.address);
    });
  });

  describe('Cross-Chain Bridge Operations', () => {
    beforeEach(async () => {
      const config = testEnv.getTestConfiguration();
      await sdk.initialize(config);
    });

    it('should get supported chains', async () => {
      const chains = await sdk.bridge().getSupportedChains();
      
      expect(chains).toBeDefined();
      expect(chains.length).toBeGreaterThan(0);
      expect(chains).toContain('ethereum');
      expect(chains).toContain('polygon');
    });

    it('should estimate bridge fees', async () => {
      const bridgeRequest = {
        fromChain: 'aurigraph',
        toChain: 'ethereum',
        amount: '100',
        recipientAddress: '0x742d35cc6cf34c39ee36670883c5e6547eeff93c'
      };
      
      const fee = await sdk.bridge().getBridgeFee(bridgeRequest);
      
      expect(fee).toBeDefined();
      expect(parseFloat(fee)).toBeGreaterThan(0);
    });

    it('should initiate bridge transaction', async () => {
      const bridgeRequest = {
        fromChain: 'aurigraph',
        toChain: 'ethereum',
        amount: '50',
        recipientAddress: '0x742d35cc6cf34c39ee36670883c5e6547eeff93c'
      };
      
      const bridgeTransaction = await sdk.bridge().initiateBridge(bridgeRequest);
      
      expect(bridgeTransaction).toBeDefined();
      expect(bridgeTransaction.id).toBeDefined();
      expect(bridgeTransaction.request).toEqual(bridgeRequest);
      expect(bridgeTransaction.status).toBe('initiated');
    });

    it('should track bridge transaction status', async () => {
      // Mock bridge transaction
      const bridgeId = 'test-bridge-123';
      testEnv.mockBridgeTransaction(bridgeId, {
        id: bridgeId,
        status: 'validated',
        sourceTransactionHash: '0xabc123',
        estimatedCompletionTime: new Date(Date.now() + 300000).toISOString()
      });
      
      const status = await sdk.bridge().getBridgeStatus(bridgeId);
      expect(status).toBe('validated');
      
      const bridgeTransaction = await sdk.bridge().getBridgeTransaction(bridgeId);
      expect(bridgeTransaction.id).toBe(bridgeId);
      expect(bridgeTransaction.status).toBe('validated');
    });
  });

  describe('Network and Offline Operations', () => {
    beforeEach(async () => {
      const config = testEnv.getTestConfiguration();
      await sdk.initialize(config);
    });

    it('should handle network status changes', async () => {
      const networkStatus = await sdk.getNetworkStatus();
      
      expect(networkStatus).toBeDefined();
      expect(typeof networkStatus.isConnected).toBe('boolean');
      expect(typeof networkStatus.isOfflineMode).toBe('boolean');
    });

    it('should store transactions offline when network unavailable', async () => {
      // Simulate network disconnection
      testEnv.simulateNetworkDisconnection();
      
      const testWallet = await sdk.wallet().createWallet('Offline Test Wallet');
      
      // Create and sign transaction while offline
      const transaction = await sdk.transactions().createTransaction(
        testWallet.address,
        '0x742d35cc6cf34c39ee36670883c5e6547eeff93c',
        '1.0'
      );
      
      const signedTransaction = await sdk.transactions().signTransaction(
        transaction,
        testWallet,
        await sdk.wallet().exportPrivateKey(testWallet.id)
      );
      
      // Attempt to broadcast while offline - should store offline
      const result = await sdk.transactions().broadcastTransaction(signedTransaction);
      expect(result).toBe(transaction.id); // Returns transaction ID when stored offline
      
      // Check offline transaction count
      const offlineCount = await sdk.transactions().getOfflineTransactionCount();
      expect(offlineCount).toBe(1);
      
      // Simulate network reconnection
      testEnv.simulateNetworkReconnection();
      
      // Process offline transactions
      await sdk.transactions().processOfflineTransactions();
      
      // Verify offline count decreased
      const newOfflineCount = await sdk.transactions().getOfflineTransactionCount();
      expect(newOfflineCount).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    beforeEach(async () => {
      const config = testEnv.getTestConfiguration();
      await sdk.initialize(config);
    });

    it('should handle multiple concurrent wallet operations', async () => {
      const startTime = Date.now();
      
      // Create multiple wallets concurrently
      const walletPromises = Array.from({ length: 10 }, (_, i) =>
        sdk.wallet().createWallet(`Concurrent Wallet ${i}`)
      );
      
      const wallets = await Promise.all(walletPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(wallets).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      // Verify all wallets are unique
      const addresses = wallets.map(w => w.address);
      const uniqueAddresses = [...new Set(addresses)];
      expect(uniqueAddresses).toHaveLength(10);
    });

    it('should handle rapid transaction signing', async () => {
      const testWallet = await sdk.wallet().createWallet('Performance Test Wallet');
      const privateKey = await sdk.wallet().exportPrivateKey(testWallet.id);
      
      const startTime = Date.now();
      
      // Sign multiple transactions rapidly
      const signPromises = Array.from({ length: 50 }, async (_, i) => {
        const transaction = await sdk.transactions().createTransaction(
          testWallet.address,
          '0x742d35cc6cf34c39ee36670883c5e6547eeff93c',
          '0.1',
          null,
          21000,
          '20'
        );
        
        return sdk.transactions().signTransaction(transaction, testWallet, privateKey);
      });
      
      const signedTransactions = await Promise.all(signPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(signedTransactions).toHaveLength(50);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      // Verify all signatures are unique
      const signatures = signedTransactions.map(tx => tx.signature.toString('hex'));
      const uniqueSignatures = [...new Set(signatures)];
      expect(uniqueSignatures).toHaveLength(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const invalidConfig = {
        networkEndpoint: 'invalid-url',
        environment: 'testnet' as const,
        grpcPort: 999999 // Invalid port
      };

      await expect(sdk.initialize(invalidConfig))
        .rejects.toThrow();
      
      expect(sdk.isInitialized).toBe(false);
    });

    it('should handle network errors in transactions', async () => {
      const config = testEnv.getTestConfiguration();
      await sdk.initialize(config);
      
      const testWallet = await sdk.wallet().createWallet('Error Test Wallet');
      
      // Simulate network error
      testEnv.simulateNetworkError('Connection timeout');
      
      const transaction = await sdk.transactions().createTransaction(
        testWallet.address,
        '0x742d35cc6cf34c39ee36670883c5e6547eeff93c',
        '1.0'
      );
      
      const signedTransaction = await sdk.transactions().signTransaction(
        transaction,
        testWallet,
        await sdk.wallet().exportPrivateKey(testWallet.id)
      );
      
      // Should store offline instead of throwing
      const result = await sdk.transactions().broadcastTransaction(signedTransaction);
      expect(result).toBe(transaction.id);
    });

    it('should handle authentication failures', async () => {
      const config = testEnv.getTestConfiguration();
      await sdk.initialize(config);
      
      const testWallet = await sdk.wallet().createWallet('Auth Test Wallet');
      
      // Simulate biometric authentication failure
      testEnv.simulateBiometricFailure();
      
      const testData = Buffer.from('test data');
      
      await expect(sdk.wallet().sign(testData, undefined, true))
        .rejects.toThrow('Biometric authentication failed');
    });
  });
});
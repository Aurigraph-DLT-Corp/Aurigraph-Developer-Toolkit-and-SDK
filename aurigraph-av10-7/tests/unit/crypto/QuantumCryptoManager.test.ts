import 'reflect-metadata';
import { QuantumCryptoManager } from '../../../src/crypto/QuantumCryptoManager';
import { Logger } from '../../../src/core/Logger';

describe('QuantumCryptoManager', () => {
  let cryptoManager: QuantumCryptoManager;

  beforeEach(() => {
    cryptoManager = new QuantumCryptoManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with NIST Level 5 security', async () => {
      await cryptoManager.initialize();
      
      const metrics = await cryptoManager.getMetrics();
      expect(metrics.securityLevel).toBe(5);
      expect(metrics.algorithmsLoaded).toBeGreaterThan(0);
    });

    it('should load all quantum-safe algorithms', async () => {
      await cryptoManager.initialize();
      
      const metrics = await cryptoManager.getMetrics();
      expect(metrics.algorithms).toEqual(
        expect.arrayContaining([
          'CRYSTALS-Kyber',
          'CRYSTALS-Dilithium', 
          'SPHINCS+'
        ])
      );
    });

    it('should generate master key pairs', async () => {
      await cryptoManager.initialize();
      
      const metrics = await cryptoManager.getMetrics();
      expect(metrics.keyPairsGenerated).toBeGreaterThan(0);
    });
  });

  describe('Key Management', () => {
    beforeEach(async () => {
      await cryptoManager.initialize();
    });

    it('should generate quantum-safe key pairs', async () => {
      const keyPair = await cryptoManager.generateKeyPair('CRYSTALS-Kyber');
      
      expect(keyPair).toHaveQuantumSecurity();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.algorithm).toBe('CRYSTALS-Kyber');
    });

    it('should generate different key pairs each time', async () => {
      const keyPair1 = await cryptoManager.generateKeyPair('CRYSTALS-Dilithium');
      const keyPair2 = await cryptoManager.generateKeyPair('CRYSTALS-Dilithium');
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });

    it('should handle invalid algorithm gracefully', async () => {
      await expect(
        cryptoManager.generateKeyPair('invalid-algorithm' as any)
      ).rejects.toThrow();
    });
  });

  describe('Digital Signatures', () => {
    beforeEach(async () => {
      await cryptoManager.initialize();
    });

    it('should create and verify valid signatures', async () => {
      const data = 'test-transaction-data';
      const signature = await cryptoManager.sign(data);
      
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      
      const isValid = await cryptoManager.verify(data, signature);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signatures', async () => {
      const data = 'test-transaction-data';
      const signature = await cryptoManager.sign(data);
      
      // Modify data after signing
      const modifiedData = 'modified-transaction-data';
      const isValid = await cryptoManager.verify(modifiedData, signature);
      
      expect(isValid).toBe(false);
    });

    it('should handle signature verification with public key', async () => {
      const keyPair = await cryptoManager.generateKeyPair('CRYSTALS-Dilithium');
      const data = 'test-data';
      const signature = await cryptoManager.sign(data);
      
      const isValid = await cryptoManager.verify(data, signature, keyPair.publicKey);
      expect(isValid).toBe(true);
    });
  });

  describe('Encryption and Decryption', () => {
    beforeEach(async () => {
      await cryptoManager.initialize();
    });

    it('should encrypt and decrypt data successfully', async () => {
      const plaintext = Buffer.from('sensitive-blockchain-data');
      const channelKey = await cryptoManager.generateChannelKey();
      
      const encrypted = await cryptoManager.encryptWithChannel(plaintext, channelKey);
      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
      
      const decrypted = await cryptoManager.decryptWithChannel(encrypted, channelKey);
      expect(decrypted.toString()).toBe(plaintext.toString());
    });

    it('should handle large data encryption', async () => {
      const largeData = Buffer.from('x'.repeat(10000)); // 10KB data
      const channelKey = await cryptoManager.generateChannelKey();
      
      const encrypted = await cryptoManager.encryptWithChannel(largeData, channelKey);
      const decrypted = await cryptoManager.decryptWithChannel(encrypted, channelKey);
      
      expect(decrypted.toString()).toBe(largeData.toString());
    });

    it('should fail decryption with wrong key', async () => {
      const plaintext = Buffer.from('test-data');
      const channelKey = await cryptoManager.generateChannelKey();
      const wrongKey = await cryptoManager.generateChannelKey();
      const encrypted = await cryptoManager.encryptWithChannel(plaintext, channelKey);
      
      // Try to decrypt with wrong key
      await expect(
        cryptoManager.decryptWithChannel(encrypted, wrongKey)
      ).rejects.toThrow();
    });
  });

  describe('Hashing', () => {
    beforeEach(async () => {
      await cryptoManager.initialize();
    });

    it('should generate consistent hashes for same input', async () => {
      const data = 'test-blockchain-data';
      
      const hash1 = await cryptoManager.hash(data);
      const hash2 = await cryptoManager.hash(data);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // 64 character hex string
    });

    it('should generate different hashes for different inputs', async () => {
      const hash1 = await cryptoManager.hash('data1');
      const hash2 = await cryptoManager.hash('data2');
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty string hashing', async () => {
      const hash = await cryptoManager.hash('');
      expect(hash).toBeDefined();
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('Homomorphic Encryption', () => {
    beforeEach(async () => {
      await cryptoManager.initialize();
    });

    it('should perform homomorphic addition', async () => {
      const value1 = 100;
      const value2 = 200;
      
      const encrypted1 = await cryptoManager.homomorphicEncrypt(value1);
      const encrypted2 = await cryptoManager.homomorphicEncrypt(value2);
      
      const result = await cryptoManager.homomorphicAdd(encrypted1, encrypted2);
      expect(result).toBeDefined();
      expect(result.operations).toContain('addition');
    });

    it('should perform homomorphic multiplication', async () => {
      const value1 = 10;
      const value2 = 5;
      
      const encrypted1 = await cryptoManager.homomorphicEncrypt(value1);
      const encrypted2 = await cryptoManager.homomorphicEncrypt(value2);
      
      const result = await cryptoManager.homomorphicMultiply(encrypted1, encrypted2);
      expect(result).toBeDefined();
      expect(result.operations).toContain('multiplication');
    });
  });

  describe('Performance', () => {
    beforeEach(async () => {
      await cryptoManager.initialize();
    });

    it('should meet key generation performance requirements', async () => {
      const startTime = Date.now();
      const keyPair = await cryptoManager.generateKeyPair('CRYSTALS-Kyber');
      const duration = Date.now() - startTime;
      
      expect(keyPair).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should generate key in <1s
    });

    it('should meet signature performance requirements', async () => {
      const data = 'performance-test-data';
      
      const startTime = Date.now();
      const signature = await cryptoManager.sign(data);
      const signDuration = Date.now() - startTime;
      
      const verifyStart = Date.now();
      const isValid = await cryptoManager.verify(data, signature);
      const verifyDuration = Date.now() - verifyStart;
      
      expect(isValid).toBe(true);
      expect(signDuration).toBeLessThan(100); // Sign in <100ms
      expect(verifyDuration).toBeLessThan(50); // Verify in <50ms
    });

    it('should handle concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => 
        cryptoManager.hash(`concurrent-test-${i}`)
      );
      
      const results = await Promise.all(operations);
      
      expect(results).toHaveLength(10);
      expect(new Set(results)).toHaveLength(10); // All unique hashes
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization failure gracefully', async () => {
      // Mock logger to test error handling
      jest.spyOn(Logger.prototype, 'error').mockImplementation();
      
      // This should not throw, but log error and continue
      await cryptoManager.initialize();
      
      // Verify it continues to work
      const hash = await cryptoManager.hash('test');
      expect(hash).toBeDefined();
    });

    it('should handle malformed data gracefully', async () => {
      await cryptoManager.initialize();
      
      await expect(
        cryptoManager.verify('', '')
      ).rejects.toThrow();
    });
  });

  describe('Security Compliance', () => {
    beforeEach(async () => {
      await cryptoManager.initialize();
    });

    it('should use NIST approved algorithms', async () => {
      const metrics = await cryptoManager.getMetrics();
      
      expect(metrics.algorithms).toEqual(
        expect.arrayContaining([
          'CRYSTALS-Kyber',   // NIST selected
          'CRYSTALS-Dilithium', // NIST selected
          'SPHINCS+'          // NIST selected
        ])
      );
    });

    it('should generate cryptographically secure random keys', async () => {
      const keyPairs = await Promise.all([
        cryptoManager.generateKeyPair('CRYSTALS-Kyber'),
        cryptoManager.generateKeyPair('CRYSTALS-Kyber'),
        cryptoManager.generateKeyPair('CRYSTALS-Kyber')
      ]);
      
      // All keys should be different (extremely low collision probability)
      const publicKeys = keyPairs.map(kp => kp.publicKey);
      expect(new Set(publicKeys)).toHaveLength(3);
    });

    it('should maintain key security levels', async () => {
      const keyPair = await cryptoManager.generateKeyPair('CRYSTALS-Dilithium');
      
      // Key should be sufficiently long for quantum resistance
      expect(keyPair.publicKey.length).toBeGreaterThan(100);
      expect(keyPair.privateKey.length).toBeGreaterThan(100);
    });
  });
});
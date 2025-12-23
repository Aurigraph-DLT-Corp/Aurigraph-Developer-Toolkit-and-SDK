/**
 * Unit tests for WalletManager
 */

import { WalletManager } from '@aurigraph/shared/WalletManager';
import { QuantumCryptoManager } from '@aurigraph/shared/QuantumCryptoManager';
import { SecureStorage } from '@aurigraph/shared/SecureStorage';

// Mock dependencies
jest.mock('@aurigraph/shared/QuantumCryptoManager');
jest.mock('@aurigraph/shared/SecureStorage');

describe('WalletManager', () => {
  let walletManager: WalletManager;
  let mockCryptoManager: jest.Mocked<QuantumCryptoManager>;
  let mockSecureStorage: jest.Mocked<SecureStorage>;

  beforeEach(() => {
    // Setup mocks
    mockCryptoManager = new QuantumCryptoManager({}) as jest.Mocked<QuantumCryptoManager>;
    mockSecureStorage = new SecureStorage() as jest.Mocked<SecureStorage>;
    
    // Mock crypto methods
    mockCryptoManager.generateKeyPair.mockResolvedValue({
      privateKey: Buffer.from('mock-private-key'),
      publicKey: Buffer.from('mock-public-key'),
      algorithm: 'CRYSTALS-Dilithium-5'
    });
    
    mockCryptoManager.deriveAddress.mockResolvedValue('0x742d35cc6cf34c39ee36670883c5e6547eeff93c');
    
    // Mock storage methods
    mockSecureStorage.store.mockResolvedValue();
    mockSecureStorage.retrieve.mockResolvedValue(Buffer.from('mock-data'));
    
    walletManager = new WalletManager(mockCryptoManager);
    (walletManager as any).secureStorage = mockSecureStorage;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a new wallet successfully', async () => {
      const walletName = 'Test Wallet';
      
      const wallet = await walletManager.createWallet(walletName);
      
      expect(wallet).toBeDefined();
      expect(wallet.name).toBe(walletName);
      expect(wallet.address).toBe('0x742d35cc6cf34c39ee36670883c5e6547eeff93c');
      expect(wallet.publicKey).toEqual(Buffer.from('mock-public-key'));
      expect(wallet.id).toBeDefined();
      expect(wallet.createdAt).toBeInstanceOf(Date);
      
      // Verify crypto manager was called
      expect(mockCryptoManager.generateKeyPair).toHaveBeenCalledTimes(1);
      expect(mockCryptoManager.deriveAddress).toHaveBeenCalledWith(Buffer.from('mock-public-key'));
      
      // Verify secure storage was called
      expect(mockSecureStorage.store).toHaveBeenCalledTimes(2); // private key + metadata
    });

    it('should create wallet with biometric authentication', async () => {
      const walletName = 'Biometric Wallet';
      
      const wallet = await walletManager.createWallet(walletName, undefined, true);
      
      expect(wallet).toBeDefined();
      expect(mockSecureStorage.store).toHaveBeenCalledWith(
        expect.stringContaining('private_key'),
        Buffer.from('mock-private-key'),
        undefined,
        true
      );
    });

    it('should handle key generation failure', async () => {
      mockCryptoManager.generateKeyPair.mockRejectedValue(new Error('Key generation failed'));
      
      await expect(walletManager.createWallet('Test Wallet')).rejects.toThrow('Key generation failed');
    });

    it('should handle storage failure', async () => {
      mockSecureStorage.store.mockRejectedValue(new Error('Storage failed'));
      
      await expect(walletManager.createWallet('Test Wallet')).rejects.toThrow('Storage failed');
    });
  });

  describe('importWallet', () => {
    const mockPrivateKey = Buffer.from('imported-private-key');
    const mockPublicKey = Buffer.from('derived-public-key');

    beforeEach(() => {
      mockCryptoManager.derivePublicKey.mockResolvedValue(mockPublicKey);
      mockCryptoManager.deriveAddress.mockResolvedValue('0x123456789abcdef');
    });

    it('should import wallet from private key', async () => {
      const walletName = 'Imported Wallet';
      
      const wallet = await walletManager.importWallet(walletName, mockPrivateKey);
      
      expect(wallet).toBeDefined();
      expect(wallet.name).toBe(walletName);
      expect(wallet.address).toBe('0x123456789abcdef');
      expect(wallet.publicKey).toEqual(mockPublicKey);
      
      expect(mockCryptoManager.derivePublicKey).toHaveBeenCalledWith(mockPrivateKey);
      expect(mockCryptoManager.deriveAddress).toHaveBeenCalledWith(mockPublicKey);
    });

    it('should handle invalid private key', async () => {
      mockCryptoManager.derivePublicKey.mockRejectedValue(new Error('Invalid private key'));
      
      await expect(walletManager.importWallet('Test', mockPrivateKey))
        .rejects.toThrow('Invalid private key');
    });
  });

  describe('loadWallet', () => {
    const mockWalletId = '123e4567-e89b-12d3-a456-426614174000';
    const mockWalletData = {
      id: mockWalletId,
      name: 'Test Wallet',
      address: '0x742d35cc6cf34c39ee36670883c5e6547eeff93c',
      publicKey: Buffer.from('mock-public-key'),
      createdAt: new Date()
    };

    it('should load existing wallet', async () => {
      mockSecureStorage.retrieve
        .mockResolvedValueOnce(Buffer.from(JSON.stringify(mockWalletData))) // metadata
        .mockResolvedValueOnce(Buffer.from('mock-private-key')); // private key verification

      const wallet = await walletManager.loadWallet(mockWalletId);
      
      expect(wallet).toEqual(expect.objectContaining({
        id: mockWalletId,
        name: 'Test Wallet',
        address: '0x742d35cc6cf34c39ee36670883c5e6547eeff93c'
      }));
    });

    it('should throw error if wallet not found', async () => {
      mockSecureStorage.retrieve.mockResolvedValue(null);
      
      await expect(walletManager.loadWallet(mockWalletId))
        .rejects.toThrow('Wallet not found');
    });

    it('should throw error if private key access fails', async () => {
      mockSecureStorage.retrieve
        .mockResolvedValueOnce(Buffer.from(JSON.stringify(mockWalletData))) // metadata
        .mockResolvedValueOnce(null); // private key fails
      
      await expect(walletManager.loadWallet(mockWalletId))
        .rejects.toThrow('Wallet is locked');
    });
  });

  describe('listWallets', () => {
    it('should return list of wallets', async () => {
      const walletIds = ['wallet1', 'wallet2'];
      const walletData1 = {
        id: 'wallet1',
        name: 'Wallet 1',
        address: '0x1234',
        publicKey: Buffer.from('key1'),
        createdAt: new Date()
      };
      const walletData2 = {
        id: 'wallet2',
        name: 'Wallet 2',
        address: '0x5678',
        publicKey: Buffer.from('key2'),
        createdAt: new Date()
      };

      mockSecureStorage.retrieve
        .mockResolvedValueOnce(Buffer.from(JSON.stringify(walletIds))) // wallet IDs
        .mockResolvedValueOnce(Buffer.from(JSON.stringify(walletData1))) // wallet 1 metadata
        .mockResolvedValueOnce(Buffer.from(JSON.stringify(walletData2))); // wallet 2 metadata

      const wallets = await walletManager.listWallets();
      
      expect(wallets).toHaveLength(2);
      expect(wallets[0].name).toBe('Wallet 1');
      expect(wallets[1].name).toBe('Wallet 2');
    });

    it('should return empty array if no wallets', async () => {
      mockSecureStorage.retrieve.mockResolvedValue(null);
      
      const wallets = await walletManager.listWallets();
      
      expect(wallets).toEqual([]);
    });
  });

  describe('deleteWallet', () => {
    const mockWalletId = '123e4567-e89b-12d3-a456-426614174000';

    it('should delete wallet successfully', async () => {
      mockSecureStorage.retrieve.mockResolvedValue(Buffer.from('mock-private-key')); // auth check
      mockSecureStorage.delete.mockResolvedValue();

      await walletManager.deleteWallet(mockWalletId);
      
      expect(mockSecureStorage.delete).toHaveBeenCalledTimes(2); // private key + metadata
    });

    it('should require authentication before deletion', async () => {
      mockSecureStorage.retrieve.mockResolvedValue(null); // auth fails
      
      await expect(walletManager.deleteWallet(mockWalletId))
        .rejects.toThrow('Wallet is locked');
    });
  });

  describe('sign', () => {
    const mockWalletId = '123e4567-e89b-12d3-a456-426614174000';
    const mockData = Buffer.from('data-to-sign');
    const mockSignature = Buffer.from('mock-signature');

    beforeEach(() => {
      (walletManager as any).currentWallet = {
        id: mockWalletId,
        name: 'Test Wallet',
        address: '0x742d35cc6cf34c39ee36670883c5e6547eeff93c'
      };
      
      mockCryptoManager.sign.mockResolvedValue(mockSignature);
    });

    it('should sign data successfully', async () => {
      mockSecureStorage.retrieve.mockResolvedValue(Buffer.from('mock-private-key'));
      
      const signature = await walletManager.sign(mockData);
      
      expect(signature).toEqual(mockSignature);
      expect(mockCryptoManager.sign).toHaveBeenCalledWith(
        mockData, 
        Buffer.from('mock-private-key')
      );
    });

    it('should throw error if no active wallet', async () => {
      (walletManager as any).currentWallet = null;
      
      await expect(walletManager.sign(mockData))
        .rejects.toThrow('Wallet not found');
    });

    it('should throw error if wallet is locked', async () => {
      mockSecureStorage.retrieve.mockResolvedValue(null);
      
      await expect(walletManager.sign(mockData))
        .rejects.toThrow('Wallet is locked');
    });
  });

  describe('exportPrivateKey', () => {
    const mockWalletId = '123e4567-e89b-12d3-a456-426614174000';
    const mockPrivateKey = Buffer.from('mock-private-key');

    it('should export private key with authentication', async () => {
      mockSecureStorage.retrieve.mockResolvedValue(mockPrivateKey);
      
      const exportedKey = await walletManager.exportPrivateKey(mockWalletId);
      
      expect(exportedKey).toEqual(mockPrivateKey);
    });

    it('should require authentication for export', async () => {
      mockSecureStorage.retrieve.mockResolvedValue(null);
      
      await expect(walletManager.exportPrivateKey(mockWalletId))
        .rejects.toThrow('Wallet is locked');
    });
  });
});

// Test utilities
export const TestUtils = {
  createMockWallet: (overrides: any = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Wallet',
    address: '0x742d35cc6cf34c39ee36670883c5e6547eeff93c',
    publicKey: Buffer.from('mock-public-key'),
    createdAt: new Date(),
    ...overrides
  }),

  createMockKeyPair: () => ({
    privateKey: Buffer.from('mock-private-key'),
    publicKey: Buffer.from('mock-public-key'),
    algorithm: 'CRYSTALS-Dilithium-5' as const
  }),

  async delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};
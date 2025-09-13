import Foundation
import CryptoKit
import LocalAuthentication
import Security

/**
 * Wallet Manager for Aurigraph SDK
 * 
 * Handles wallet creation, management, and secure storage with biometric authentication
 */
@available(iOS 14.0, *)
public class WalletManager {
    
    // MARK: - Properties
    
    private let cryptoManager: QuantumCryptoManager
    private let secureStorage: SecureStorage
    private var currentWallet: Wallet?
    
    // MARK: - Initialization
    
    internal init(cryptoManager: QuantumCryptoManager) {
        self.cryptoManager = cryptoManager
        self.secureStorage = SecureStorage()
    }
    
    // MARK: - Wallet Management
    
    /**
     * Create a new wallet with quantum-resistant cryptography
     */
    public func createWallet(
        name: String,
        passcode: String? = nil,
        useBiometrics: Bool = true
    ) async throws -> Wallet {
        let keyPair = try await cryptoManager.generateKeyPair()
        let address = try cryptoManager.deriveAddress(from: keyPair.publicKey)
        
        let wallet = Wallet(
            id: UUID(),
            name: name,
            address: address,
            publicKey: keyPair.publicKey,
            createdAt: Date()
        )
        
        // Store private key securely
        try await secureStorage.store(
            key: "wallet_\(wallet.id.uuidString)_private_key",
            data: keyPair.privateKey,
            passcode: passcode,
            useBiometrics: useBiometrics
        )
        
        // Store wallet metadata
        let walletData = try JSONEncoder().encode(wallet)
        try await secureStorage.store(
            key: "wallet_\(wallet.id.uuidString)_metadata",
            data: walletData,
            passcode: nil,
            useBiometrics: false
        )
        
        // Update wallet list
        var walletIds = try await getStoredWalletIds()
        walletIds.append(wallet.id.uuidString)
        let walletIdsData = try JSONEncoder().encode(walletIds)
        try await secureStorage.store(
            key: "wallet_ids",
            data: walletIdsData,
            passcode: nil,
            useBiometrics: false
        )
        
        self.currentWallet = wallet
        
        AurigraphLogger.info("Created wallet: \(wallet.name) with address: \(wallet.address)")
        
        return wallet
    }
    
    /**
     * Import wallet from private key
     */
    public func importWallet(
        name: String,
        privateKey: Data,
        passcode: String? = nil,
        useBiometrics: Bool = true
    ) async throws -> Wallet {
        let publicKey = try cryptoManager.derivePublicKey(from: privateKey)
        let address = try cryptoManager.deriveAddress(from: publicKey)
        
        let wallet = Wallet(
            id: UUID(),
            name: name,
            address: address,
            publicKey: publicKey,
            createdAt: Date()
        )
        
        // Store private key securely
        try await secureStorage.store(
            key: "wallet_\(wallet.id.uuidString)_private_key",
            data: privateKey,
            passcode: passcode,
            useBiometrics: useBiometrics
        )
        
        // Store wallet metadata
        let walletData = try JSONEncoder().encode(wallet)
        try await secureStorage.store(
            key: "wallet_\(wallet.id.uuidString)_metadata",
            data: walletData,
            passcode: nil,
            useBiometrics: false
        )
        
        // Update wallet list
        var walletIds = try await getStoredWalletIds()
        walletIds.append(wallet.id.uuidString)
        let walletIdsData = try JSONEncoder().encode(walletIds)
        try await secureStorage.store(
            key: "wallet_ids",
            data: walletIdsData,
            passcode: nil,
            useBiometrics: false
        )
        
        self.currentWallet = wallet
        
        AurigraphLogger.info("Imported wallet: \(wallet.name) with address: \(wallet.address)")
        
        return wallet
    }
    
    /**
     * Load wallet by ID
     */
    public func loadWallet(id: UUID, passcode: String? = nil, useBiometrics: Bool = true) async throws -> Wallet {
        // Load wallet metadata
        guard let walletData = try await secureStorage.retrieve(
            key: "wallet_\(id.uuidString)_metadata",
            passcode: nil,
            useBiometrics: false
        ) else {
            throw AurigraphError.walletNotFound
        }
        
        let wallet = try JSONDecoder().decode(Wallet.self, from: walletData)
        
        // Verify private key access
        guard let _ = try await secureStorage.retrieve(
            key: "wallet_\(id.uuidString)_private_key",
            passcode: passcode,
            useBiometrics: useBiometrics
        ) else {
            throw AurigraphError.walletLocked
        }
        
        self.currentWallet = wallet
        
        return wallet
    }
    
    /**
     * List all stored wallets
     */
    public func listWallets() async throws -> [Wallet] {
        let walletIds = try await getStoredWalletIds()
        var wallets: [Wallet] = []
        
        for walletId in walletIds {
            guard let walletData = try await secureStorage.retrieve(
                key: "wallet_\(walletId)_metadata",
                passcode: nil,
                useBiometrics: false
            ) else {
                continue
            }
            
            if let wallet = try? JSONDecoder().decode(Wallet.self, from: walletData) {
                wallets.append(wallet)
            }
        }
        
        return wallets
    }
    
    /**
     * Get current active wallet
     */
    public var activeWallet: Wallet? {
        return currentWallet
    }
    
    /**
     * Sign data with current wallet
     */
    public func sign(data: Data, passcode: String? = nil, useBiometrics: Bool = true) async throws -> Data {
        guard let wallet = currentWallet else {
            throw AurigraphError.walletNotFound
        }
        
        guard let privateKeyData = try await secureStorage.retrieve(
            key: "wallet_\(wallet.id.uuidString)_private_key",
            passcode: passcode,
            useBiometrics: useBiometrics
        ) else {
            throw AurigraphError.walletLocked
        }
        
        return try cryptoManager.sign(data: data, privateKey: privateKeyData)
    }
    
    /**
     * Export wallet private key (requires authentication)
     */
    public func exportPrivateKey(
        walletId: UUID,
        passcode: String? = nil,
        useBiometrics: Bool = true
    ) async throws -> Data {
        guard let privateKeyData = try await secureStorage.retrieve(
            key: "wallet_\(walletId.uuidString)_private_key",
            passcode: passcode,
            useBiometrics: useBiometrics
        ) else {
            throw AurigraphError.walletLocked
        }
        
        return privateKeyData
    }
    
    /**
     * Delete wallet permanently
     */
    public func deleteWallet(id: UUID, passcode: String? = nil, useBiometrics: Bool = true) async throws {
        // Verify access before deletion
        guard let _ = try await secureStorage.retrieve(
            key: "wallet_\(id.uuidString)_private_key",
            passcode: passcode,
            useBiometrics: useBiometrics
        ) else {
            throw AurigraphError.walletLocked
        }
        
        // Delete private key
        try await secureStorage.delete(key: "wallet_\(id.uuidString)_private_key")
        
        // Delete metadata
        try await secureStorage.delete(key: "wallet_\(id.uuidString)_metadata")
        
        // Update wallet list
        var walletIds = try await getStoredWalletIds()
        walletIds.removeAll { $0 == id.uuidString }
        let walletIdsData = try JSONEncoder().encode(walletIds)
        try await secureStorage.store(
            key: "wallet_ids",
            data: walletIdsData,
            passcode: nil,
            useBiometrics: false
        )
        
        // Clear current wallet if it was deleted
        if currentWallet?.id == id {
            currentWallet = nil
        }
        
        AurigraphLogger.info("Deleted wallet: \(id)")
    }
    
    // MARK: - Private Methods
    
    private func getStoredWalletIds() async throws -> [String] {
        guard let walletIdsData = try await secureStorage.retrieve(
            key: "wallet_ids",
            passcode: nil,
            useBiometrics: false
        ) else {
            return []
        }
        
        return try JSONDecoder().decode([String].self, from: walletIdsData)
    }
}

/**
 * Wallet model
 */
public struct Wallet: Codable, Identifiable, Equatable {
    public let id: UUID
    public let name: String
    public let address: String
    public let publicKey: Data
    public let createdAt: Date
    
    public static func == (lhs: Wallet, rhs: Wallet) -> Bool {
        return lhs.id == rhs.id
    }
}
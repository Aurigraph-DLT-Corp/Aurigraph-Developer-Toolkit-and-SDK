import Foundation
import CryptoKit
import LocalAuthentication
import Network

/**
 * Aurigraph DLT Mobile SDK for iOS
 * 
 * Main SDK class providing access to Aurigraph V11 blockchain functionality
 * with quantum-resistant cryptography, AI-driven consensus, and cross-chain interoperability.
 */
@available(iOS 14.0, *)
public class AurigraphSDK {
    
    // MARK: - Properties
    
    public static let shared = AurigraphSDK()
    
    private var isInitialized = false
    private var configuration: AurigraphConfiguration?
    private var networkManager: NetworkManager?
    private var walletManager: WalletManager?
    private var cryptoManager: QuantumCryptoManager?
    private var transactionManager: TransactionManager?
    private var bridgeManager: CrossChainBridgeManager?
    
    // MARK: - Initialization
    
    private init() {}
    
    /**
     * Initialize the Aurigraph SDK with configuration
     */
    public func initialize(configuration: AurigraphConfiguration) async throws {
        guard !isInitialized else {
            throw AurigraphError.alreadyInitialized
        }
        
        self.configuration = configuration
        
        // Initialize managers
        self.networkManager = NetworkManager(configuration: configuration)
        self.cryptoManager = QuantumCryptoManager(configuration: configuration)
        self.walletManager = WalletManager(cryptoManager: cryptoManager!)
        self.transactionManager = TransactionManager(networkManager: networkManager!, cryptoManager: cryptoManager!)
        self.bridgeManager = CrossChainBridgeManager(networkManager: networkManager!)
        
        // Connect to network
        try await networkManager?.connect()
        
        self.isInitialized = true
        
        AurigraphLogger.info("Aurigraph SDK initialized successfully")
    }
    
    /**
     * Get wallet manager instance
     */
    public func wallet() throws -> WalletManager {
        guard isInitialized, let walletManager = walletManager else {
            throw AurigraphError.notInitialized
        }
        return walletManager
    }
    
    /**
     * Get transaction manager instance
     */
    public func transactions() throws -> TransactionManager {
        guard isInitialized, let transactionManager = transactionManager else {
            throw AurigraphError.notInitialized
        }
        return transactionManager
    }
    
    /**
     * Get cross-chain bridge manager instance
     */
    public func bridge() throws -> CrossChainBridgeManager {
        guard isInitialized, let bridgeManager = bridgeManager else {
            throw AurigraphError.notInitialized
        }
        return bridgeManager
    }
    
    /**
     * Get SDK version
     */
    public static var version: String {
        return "11.0.0"
    }
    
    /**
     * Check if SDK supports biometric authentication
     */
    public static var supportsBiometricAuth: Bool {
        let context = LAContext()
        return context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
    }
    
    /**
     * Shutdown SDK and cleanup resources
     */
    public func shutdown() async {
        await networkManager?.disconnect()
        
        networkManager = nil
        walletManager = nil
        cryptoManager = nil
        transactionManager = nil
        bridgeManager = nil
        configuration = nil
        
        isInitialized = false
        
        AurigraphLogger.info("Aurigraph SDK shut down")
    }
}

/**
 * SDK Configuration
 */
public struct AurigraphConfiguration {
    public let networkEndpoint: String
    public let grpcPort: Int
    public let environment: Environment
    public let enableBiometrics: Bool
    public let enableOfflineMode: Bool
    public let debugMode: Bool
    
    public enum Environment: String, CaseIterable {
        case mainnet = "mainnet"
        case testnet = "testnet"
        case development = "development"
    }
    
    public init(
        networkEndpoint: String = "https://api.aurigraph.io",
        grpcPort: Int = 9004,
        environment: Environment = .testnet,
        enableBiometrics: Bool = true,
        enableOfflineMode: Bool = true,
        debugMode: Bool = false
    ) {
        self.networkEndpoint = networkEndpoint
        self.grpcPort = grpcPort
        self.environment = environment
        self.enableBiometrics = enableBiometrics
        self.enableOfflineMode = enableOfflineMode
        self.debugMode = debugMode
    }
}

/**
 * SDK Errors
 */
public enum AurigraphError: LocalizedError, CaseIterable {
    case notInitialized
    case alreadyInitialized
    case networkError
    case cryptographicError
    case biometricAuthenticationFailed
    case insufficientBalance
    case transactionFailed
    case bridgeOperationFailed
    case invalidAddress
    case invalidAmount
    case walletNotFound
    case walletLocked
    case operationTimeout
    
    public var errorDescription: String? {
        switch self {
        case .notInitialized:
            return "SDK not initialized. Call initialize() first."
        case .alreadyInitialized:
            return "SDK already initialized."
        case .networkError:
            return "Network connection error."
        case .cryptographicError:
            return "Cryptographic operation failed."
        case .biometricAuthenticationFailed:
            return "Biometric authentication failed."
        case .insufficientBalance:
            return "Insufficient balance for transaction."
        case .transactionFailed:
            return "Transaction failed to process."
        case .bridgeOperationFailed:
            return "Cross-chain bridge operation failed."
        case .invalidAddress:
            return "Invalid wallet address."
        case .invalidAmount:
            return "Invalid transaction amount."
        case .walletNotFound:
            return "Wallet not found."
        case .walletLocked:
            return "Wallet is locked."
        case .operationTimeout:
            return "Operation timed out."
        }
    }
}
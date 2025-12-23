import Foundation
import Network

/**
 * Transaction Manager for Aurigraph SDK
 * 
 * Handles transaction creation, signing, broadcasting, and monitoring
 */
@available(iOS 14.0, *)
public class TransactionManager {
    
    // MARK: - Properties
    
    private let networkManager: NetworkManager
    private let cryptoManager: QuantumCryptoManager
    private let offlineStorage: OfflineStorage
    private var pendingTransactions: [String: Transaction] = [:]
    
    // MARK: - Initialization
    
    internal init(networkManager: NetworkManager, cryptoManager: QuantumCryptoManager) {
        self.networkManager = networkManager
        self.cryptoManager = cryptoManager
        self.offlineStorage = OfflineStorage()
    }
    
    // MARK: - Transaction Creation
    
    /**
     * Create a new transaction
     */
    public func createTransaction(
        from: String,
        to: String,
        amount: Decimal,
        data: Data? = nil,
        gasLimit: UInt64 = 21000,
        gasPrice: Decimal? = nil
    ) async throws -> Transaction {
        
        // Validate addresses
        guard isValidAddress(from) else {
            throw AurigraphError.invalidAddress
        }
        guard isValidAddress(to) else {
            throw AurigraphError.invalidAddress
        }
        
        // Validate amount
        guard amount > 0 else {
            throw AurigraphError.invalidAmount
        }
        
        // Get current gas price if not provided
        let currentGasPrice: Decimal
        if let gasPrice = gasPrice {
            currentGasPrice = gasPrice
        } else {
            currentGasPrice = try await getGasPrice()
        }
        
        // Get nonce
        let nonce = try await getNonce(for: from)
        
        // Calculate total fee
        let totalFee = currentGasPrice * Decimal(gasLimit)
        
        let transaction = Transaction(
            id: UUID().uuidString,
            from: from,
            to: to,
            amount: amount,
            data: data,
            gasLimit: gasLimit,
            gasPrice: currentGasPrice,
            nonce: nonce,
            fee: totalFee,
            status: .created,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        AurigraphLogger.debug("Created transaction: \(transaction.id)")
        
        return transaction
    }
    
    /**
     * Sign transaction with wallet
     */
    public func signTransaction(
        _ transaction: Transaction,
        wallet: Wallet,
        privateKey: Data
    ) async throws -> SignedTransaction {
        
        // Create transaction hash
        let transactionData = try encodeTransaction(transaction)
        let hash = cryptoManager.sha256(data: transactionData)
        
        // Sign transaction
        let signature = try cryptoManager.sign(data: hash, privateKey: privateKey)
        
        let signedTransaction = SignedTransaction(
            transaction: transaction,
            signature: signature,
            hash: hash,
            signedAt: Date()
        )
        
        AurigraphLogger.debug("Signed transaction: \(transaction.id)")
        
        return signedTransaction
    }
    
    /**
     * Broadcast transaction to network
     */
    public func broadcastTransaction(_ signedTransaction: SignedTransaction) async throws -> String {
        do {
            let transactionHash = try await networkManager.broadcastTransaction(signedTransaction)
            
            // Update transaction status
            var updatedTransaction = signedTransaction.transaction
            updatedTransaction.status = .broadcasted
            updatedTransaction.hash = transactionHash
            updatedTransaction.updatedAt = Date()
            
            // Store in pending transactions
            pendingTransactions[transactionHash] = updatedTransaction
            
            AurigraphLogger.info("Broadcasted transaction: \(transactionHash)")
            
            return transactionHash
            
        } catch {
            // Store transaction for offline processing if network is unavailable
            if networkManager.isOfflineMode {
                try await offlineStorage.storeTransaction(signedTransaction)
                AurigraphLogger.info("Stored transaction offline: \(signedTransaction.transaction.id)")
                return signedTransaction.transaction.id
            }
            
            throw AurigraphError.transactionFailed
        }
    }
    
    /**
     * Send transaction (create, sign, and broadcast)
     */
    public func sendTransaction(
        from: String,
        to: String,
        amount: Decimal,
        wallet: Wallet,
        privateKey: Data,
        data: Data? = nil,
        gasLimit: UInt64 = 21000,
        gasPrice: Decimal? = nil
    ) async throws -> String {
        
        // Create transaction
        let transaction = try await createTransaction(
            from: from,
            to: to,
            amount: amount,
            data: data,
            gasLimit: gasLimit,
            gasPrice: gasPrice
        )
        
        // Sign transaction
        let signedTransaction = try await signTransaction(
            transaction,
            wallet: wallet,
            privateKey: privateKey
        )
        
        // Broadcast transaction
        return try await broadcastTransaction(signedTransaction)
    }
    
    // MARK: - Transaction Monitoring
    
    /**
     * Get transaction status
     */
    public func getTransactionStatus(_ transactionHash: String) async throws -> TransactionStatus {
        if let pendingTransaction = pendingTransactions[transactionHash] {
            return pendingTransaction.status
        }
        
        return try await networkManager.getTransactionStatus(transactionHash)
    }
    
    /**
     * Wait for transaction confirmation
     */
    public func waitForConfirmation(
        _ transactionHash: String,
        confirmations: UInt = 1,
        timeout: TimeInterval = 300
    ) async throws -> TransactionReceipt {
        let startTime = Date()
        
        while Date().timeIntervalSince(startTime) < timeout {
            let status = try await getTransactionStatus(transactionHash)
            
            if status == .confirmed {
                let receipt = try await getTransactionReceipt(transactionHash)
                if receipt.confirmations >= confirmations {
                    // Remove from pending transactions
                    pendingTransactions.removeValue(forKey: transactionHash)
                    return receipt
                }
            } else if status == .failed {
                throw AurigraphError.transactionFailed
            }
            
            // Wait before checking again
            try await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds
        }
        
        throw AurigraphError.operationTimeout
    }
    
    /**
     * Get transaction receipt
     */
    public func getTransactionReceipt(_ transactionHash: String) async throws -> TransactionReceipt {
        return try await networkManager.getTransactionReceipt(transactionHash)
    }
    
    /**
     * Get transaction history for address
     */
    public func getTransactionHistory(
        for address: String,
        limit: Int = 100,
        offset: Int = 0
    ) async throws -> [Transaction] {
        return try await networkManager.getTransactionHistory(
            address: address,
            limit: limit,
            offset: offset
        )
    }
    
    // MARK: - Balance Management
    
    /**
     * Get account balance
     */
    public func getBalance(for address: String) async throws -> Decimal {
        return try await networkManager.getBalance(address)
    }
    
    /**
     * Estimate gas for transaction
     */
    public func estimateGas(
        from: String,
        to: String,
        amount: Decimal,
        data: Data? = nil
    ) async throws -> UInt64 {
        return try await networkManager.estimateGas(
            from: from,
            to: to,
            amount: amount,
            data: data
        )
    }
    
    /**
     * Get current gas price
     */
    public func getGasPrice() async throws -> Decimal {
        return try await networkManager.getGasPrice()
    }
    
    // MARK: - Offline Operations
    
    /**
     * Process offline transactions when network becomes available
     */
    public func processOfflineTransactions() async throws {
        let offlineTransactions = try await offlineStorage.getStoredTransactions()
        
        for signedTransaction in offlineTransactions {
            do {
                let transactionHash = try await broadcastTransaction(signedTransaction)
                try await offlineStorage.removeTransaction(signedTransaction.transaction.id)
                
                AurigraphLogger.info("Processed offline transaction: \(transactionHash)")
            } catch {
                AurigraphLogger.error("Failed to process offline transaction: \(signedTransaction.transaction.id)")
            }
        }
    }
    
    /**
     * Get offline transaction count
     */
    public func getOfflineTransactionCount() async throws -> Int {
        let offlineTransactions = try await offlineStorage.getStoredTransactions()
        return offlineTransactions.count
    }
    
    // MARK: - Private Methods
    
    private func isValidAddress(_ address: String) -> Bool {
        // Basic validation - starts with 0x and 40 hex characters
        guard address.hasPrefix("0x"), address.count == 42 else {
            return false
        }
        
        let hexString = String(address.dropFirst(2))
        return hexString.allSatisfy { $0.isHexDigit }
    }
    
    private func getNonce(for address: String) async throws -> UInt64 {
        return try await networkManager.getNonce(address)
    }
    
    private func encodeTransaction(_ transaction: Transaction) throws -> Data {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(transaction)
    }
}

// MARK: - Supporting Types

/**
 * Transaction model
 */
public struct Transaction: Codable, Identifiable, Equatable {
    public let id: String
    public let from: String
    public let to: String
    public let amount: Decimal
    public let data: Data?
    public let gasLimit: UInt64
    public let gasPrice: Decimal
    public let nonce: UInt64
    public let fee: Decimal
    public var status: TransactionStatus
    public var hash: String?
    public let createdAt: Date
    public var updatedAt: Date
    
    public static func == (lhs: Transaction, rhs: Transaction) -> Bool {
        return lhs.id == rhs.id
    }
}

/**
 * Signed transaction model
 */
public struct SignedTransaction: Codable {
    public let transaction: Transaction
    public let signature: Data
    public let hash: Data
    public let signedAt: Date
}

/**
 * Transaction status
 */
public enum TransactionStatus: String, Codable, CaseIterable {
    case created = "created"
    case signed = "signed"
    case broadcasted = "broadcasted"
    case pending = "pending"
    case confirmed = "confirmed"
    case failed = "failed"
}

/**
 * Transaction receipt
 */
public struct TransactionReceipt: Codable {
    public let transactionHash: String
    public let blockNumber: UInt64
    public let blockHash: String
    public let gasUsed: UInt64
    public let effectiveGasPrice: Decimal
    public let status: TransactionStatus
    public let confirmations: UInt
    public let timestamp: Date
}
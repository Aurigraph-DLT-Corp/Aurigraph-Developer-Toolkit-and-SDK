import Foundation
import Network

/**
 * Network Manager for Aurigraph SDK
 * 
 * Handles all network communication with Aurigraph nodes via gRPC and HTTP
 */
@available(iOS 14.0, *)
public class NetworkManager {
    
    // MARK: - Properties
    
    private let configuration: AurigraphConfiguration
    private let grpcClient: GRPCClient
    private let httpClient: URLSession
    private let monitor: NWPathMonitor
    private let queue: DispatchQueue
    
    private(set) var isConnected = false
    private(set) var isOfflineMode = false
    
    // MARK: - Initialization
    
    internal init(configuration: AurigraphConfiguration) {
        self.configuration = configuration
        self.grpcClient = GRPCClient(configuration: configuration)
        self.httpClient = URLSession.shared
        self.monitor = NWPathMonitor()
        self.queue = DispatchQueue(label: "aurigraph.network.monitor")
        
        setupNetworkMonitoring()
    }
    
    // MARK: - Connection Management
    
    /**
     * Connect to Aurigraph network
     */
    public func connect() async throws {
        try await grpcClient.connect()
        isConnected = true
        AurigraphLogger.info("Connected to Aurigraph network")
    }
    
    /**
     * Disconnect from network
     */
    public func disconnect() async {
        await grpcClient.disconnect()
        isConnected = false
        AurigraphLogger.info("Disconnected from Aurigraph network")
    }
    
    // MARK: - Transaction Operations
    
    /**
     * Broadcast transaction to network
     */
    public func broadcastTransaction(_ signedTransaction: SignedTransaction) async throws -> String {
        return try await grpcClient.broadcastTransaction(signedTransaction)
    }
    
    /**
     * Get transaction status
     */
    public func getTransactionStatus(_ hash: String) async throws -> TransactionStatus {
        return try await grpcClient.getTransactionStatus(hash)
    }
    
    /**
     * Get transaction receipt
     */
    public func getTransactionReceipt(_ hash: String) async throws -> TransactionReceipt {
        return try await grpcClient.getTransactionReceipt(hash)
    }
    
    /**
     * Get account balance
     */
    public func getBalance(_ address: String) async throws -> Decimal {
        return try await grpcClient.getBalance(address)
    }
    
    /**
     * Get account nonce
     */
    public func getNonce(_ address: String) async throws -> UInt64 {
        return try await grpcClient.getNonce(address)
    }
    
    /**
     * Estimate gas for transaction
     */
    public func estimateGas(
        from: String,
        to: String,
        amount: Decimal,
        data: Data?
    ) async throws -> UInt64 {
        return try await grpcClient.estimateGas(
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
        return try await grpcClient.getGasPrice()
    }
    
    /**
     * Get transaction history
     */
    public func getTransactionHistory(
        address: String,
        limit: Int,
        offset: Int
    ) async throws -> [Transaction] {
        return try await grpcClient.getTransactionHistory(
            address: address,
            limit: limit,
            offset: offset
        )
    }
    
    // MARK: - Private Methods
    
    private func setupNetworkMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.handleNetworkPathUpdate(path)
            }
        }
        monitor.start(queue: queue)
    }
    
    private func handleNetworkPathUpdate(_ path: NWPath) {
        let wasOfflineMode = isOfflineMode
        isOfflineMode = path.status != .satisfied
        
        if wasOfflineMode && !isOfflineMode {
            // Network became available
            AurigraphLogger.info("Network connection restored")
            Task {
                // Process any offline transactions
                NotificationCenter.default.post(
                    name: .networkConnectionRestored,
                    object: nil
                )
            }
        } else if !wasOfflineMode && isOfflineMode {
            // Network became unavailable
            AurigraphLogger.info("Network connection lost - entering offline mode")
        }
    }
}

// MARK: - Notifications

extension Notification.Name {
    static let networkConnectionRestored = Notification.Name("networkConnectionRestored")
}
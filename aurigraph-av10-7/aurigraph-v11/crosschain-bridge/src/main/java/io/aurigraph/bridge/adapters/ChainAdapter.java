package io.aurigraph.bridge.adapters;

import io.aurigraph.bridge.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Universal Chain Adapter Interface
 * 
 * Provides a unified interface for interacting with different blockchain networks.
 * Each adapter implements chain-specific logic while maintaining a consistent API.
 * 
 * Supported Operations:
 * - Transaction monitoring and confirmation
 * - Multi-signature wallet operations
 * - HTLC deployment and management
 * - Fee estimation and optimization
 * - Health monitoring and status checks
 */
public interface ChainAdapter {

    /**
     * Gets the unique identifier for this chain
     */
    String getChainId();

    /**
     * Gets the human-readable name of this chain
     */
    String getChainName();

    /**
     * Gets the chain type (EVM, Substrate, Cosmos, etc.)
     */
    ChainType getChainType();

    /**
     * Checks if the chain adapter is active and healthy
     */
    boolean isActive();

    /**
     * Gets the average confirmation time for this chain (in milliseconds)
     */
    long getAverageConfirmationTime();

    /**
     * Gets the list of supported assets on this chain
     */
    List<String> getSupportedAssets();

    /**
     * Performs a health check on the chain connection
     */
    boolean healthCheck();

    /**
     * Estimates the transaction fee for a given operation
     */
    BigDecimal estimateTransactionFee(String asset, BigDecimal amount);

    /**
     * Checks if a transaction is confirmed with the required number of confirmations
     */
    boolean isTransactionConfirmed(String txHash, int requiredConfirmations);

    /**
     * Creates a multi-signature address from public keys
     */
    String createMultiSigAddress(List<java.security.PublicKey> publicKeys, int requiredSignatures);

    /**
     * Executes a multi-signature transaction
     */
    String executeMultiSigTransaction(MultiSigTransaction transaction, MultiSigWallet wallet);

    /**
     * Deploys an HTLC (Hash Time Lock Contract)
     */
    String deployHTLC(HTLCContract htlc);

    /**
     * Claims an HTLC with the secret
     */
    boolean claimHTLC(String contractAddress, byte[] secret);

    /**
     * Refunds an HTLC after timeout
     */
    boolean refundHTLC(String contractAddress);

    /**
     * Gets the status of an HTLC contract
     */
    HTLCStatus getHTLCStatus(String contractAddress);

    /**
     * Monitors transactions for the bridge
     */
    CompletableFuture<TransactionResult> monitorTransaction(String txHash);

    /**
     * Gets the current block height
     */
    long getCurrentBlockHeight();

    /**
     * Gets transaction details
     */
    TransactionInfo getTransactionInfo(String txHash);

    /**
     * Sends a raw transaction to the network
     */
    String sendTransaction(String signedTransaction);

    /**
     * Gets the balance of an address for a specific asset
     */
    BigDecimal getBalance(String address, String asset);

    /**
     * Chain-specific initialization
     */
    void initialize();

    /**
     * Cleanup resources when shutting down
     */
    void shutdown();

    // Enums and data classes

    enum ChainType {
        EVM,           // Ethereum Virtual Machine compatible
        SUBSTRATE,     // Polkadot/Kusama ecosystem
        COSMOS,        // Cosmos SDK based chains
        SOLANA,        // Solana runtime
        NEAR,          // NEAR Protocol
        ALGORAND,      // Algorand
        BITCOIN,       // Bitcoin-like chains
        CARDANO,       // Cardano
        STELLAR,       // Stellar network
        RIPPLE,        // XRP Ledger
        TRON,          // TRON network
        EOS,           // EOSIO
        TEZOS,         // Tezos
        FLOW,          // Flow blockchain
        APTOS,         // Aptos blockchain
        SUI            // Sui blockchain
    }

    enum HTLCStatus {
        DEPLOYED,
        CLAIMED,
        REFUNDED,
        EXPIRED,
        FAILED
    }

    class TransactionResult {
        private final String txHash;
        private final boolean success;
        private final String errorMessage;
        private final long blockNumber;
        private final int confirmations;

        public TransactionResult(String txHash, boolean success, String errorMessage, 
                               long blockNumber, int confirmations) {
            this.txHash = txHash;
            this.success = success;
            this.errorMessage = errorMessage;
            this.blockNumber = blockNumber;
            this.confirmations = confirmations;
        }

        // Getters
        public String getTxHash() { return txHash; }
        public boolean isSuccess() { return success; }
        public String getErrorMessage() { return errorMessage; }
        public long getBlockNumber() { return blockNumber; }
        public int getConfirmations() { return confirmations; }
    }

    class TransactionInfo {
        private final String txHash;
        private final String fromAddress;
        private final String toAddress;
        private final BigDecimal amount;
        private final String asset;
        private final long timestamp;
        private final int confirmations;
        private final boolean isSuccess;

        public TransactionInfo(String txHash, String fromAddress, String toAddress, 
                             BigDecimal amount, String asset, long timestamp, 
                             int confirmations, boolean isSuccess) {
            this.txHash = txHash;
            this.fromAddress = fromAddress;
            this.toAddress = toAddress;
            this.amount = amount;
            this.asset = asset;
            this.timestamp = timestamp;
            this.confirmations = confirmations;
            this.isSuccess = isSuccess;
        }

        // Getters
        public String getTxHash() { return txHash; }
        public String getFromAddress() { return fromAddress; }
        public String getToAddress() { return toAddress; }
        public BigDecimal getAmount() { return amount; }
        public String getAsset() { return asset; }
        public long getTimestamp() { return timestamp; }
        public int getConfirmations() { return confirmations; }
        public boolean isSuccess() { return isSuccess; }
    }
}

// Additional data structures that adapters use
class ChainInfo {
    private final String chainId;
    private final String chainName;
    private final ChainAdapter.ChainType chainType;
    private final boolean isActive;
    private final long averageConfirmationTime;
    private final List<String> supportedAssets;

    public ChainInfo(String chainId, String chainName, ChainAdapter.ChainType chainType,
                    boolean isActive, long averageConfirmationTime, List<String> supportedAssets) {
        this.chainId = chainId;
        this.chainName = chainName;
        this.chainType = chainType;
        this.isActive = isActive;
        this.averageConfirmationTime = averageConfirmationTime;
        this.supportedAssets = supportedAssets;
    }

    // Getters
    public String getChainId() { return chainId; }
    public String getChainName() { return chainName; }
    public ChainAdapter.ChainType getChainType() { return chainType; }
    public boolean isActive() { return isActive; }
    public long getAverageConfirmationTime() { return averageConfirmationTime; }
    public List<String> getSupportedAssets() { return supportedAssets; }
}

// Base adapter implementation with common functionality
abstract class BaseChainAdapter implements ChainAdapter {
    protected final String chainId;
    protected final String chainName;
    protected final ChainType chainType;
    protected final String rpcUrl;
    protected final int requiredConfirmations;
    protected volatile boolean active = false;
    protected volatile long lastHealthCheck = 0;

    protected BaseChainAdapter(String chainId, String chainName, ChainType chainType, 
                             String rpcUrl, int requiredConfirmations) {
        this.chainId = chainId;
        this.chainName = chainName;
        this.chainType = chainType;
        this.rpcUrl = rpcUrl;
        this.requiredConfirmations = requiredConfirmations;
    }

    @Override
    public String getChainId() {
        return chainId;
    }

    @Override
    public String getChainName() {
        return chainName;
    }

    @Override
    public ChainAdapter.ChainType getChainType() {
        return chainType;
    }

    @Override
    public boolean isActive() {
        return active;
    }

    @Override
    public boolean healthCheck() {
        try {
            // Basic connectivity check
            boolean healthy = performHealthCheck();
            active = healthy;
            lastHealthCheck = System.currentTimeMillis();
            return healthy;
        } catch (Exception e) {
            active = false;
            return false;
        }
    }

    @Override
    public void initialize() {
        // Base initialization logic
        active = healthCheck();
    }

    @Override
    public void shutdown() {
        active = false;
        // Cleanup resources
    }

    // Abstract methods that subclasses must implement
    protected abstract boolean performHealthCheck();
}
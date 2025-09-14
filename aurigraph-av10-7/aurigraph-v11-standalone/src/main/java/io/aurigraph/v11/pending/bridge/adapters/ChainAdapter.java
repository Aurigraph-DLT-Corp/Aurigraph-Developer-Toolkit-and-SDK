package io.aurigraph.v11.pending.bridge.adapters;

import io.aurigraph.v11.pending.bridge.models.BridgeTransaction;
import io.aurigraph.v11.pending.bridge.models.ChainInfo;
import io.smallrye.mutiny.Uni;
import java.math.BigDecimal;

/**
 * Chain Adapter Interface
 * 
 * Defines the contract for blockchain adapters in the Aurigraph cross-chain bridge system.
 * Each supported blockchain network must implement this interface to provide standardized
 * access to blockchain operations.
 * 
 * Features:
 * - Connection management and health monitoring
 * - Transaction submission and status tracking
 * - Balance queries for native and token assets
 * - Gas/fee estimation
 * - Atomic swap support
 * - Event monitoring capabilities
 */
public interface ChainAdapter {

    /**
     * Initialize the adapter and establish connection to the blockchain
     * @return Uni that completes when initialization is done
     */
    Uni<Void> initialize();

    /**
     * Get comprehensive information about this blockchain
     * @return ChainInfo containing network details
     */
    ChainInfo getChainInfo();

    /**
     * Submit a bridge transaction to the blockchain
     * @param transaction The bridge transaction to submit
     * @return Uni containing the transaction hash
     */
    Uni<String> submitTransaction(BridgeTransaction transaction);

    /**
     * Get the current status of a transaction
     * @param transactionHash The transaction hash to check
     * @return Uni containing the transaction status
     */
    // TODO: Define TransactionStatus enum/class
    // Uni<TransactionStatus> getTransactionStatus(String transactionHash);
    Uni<String> getTransactionStatus(String transactionHash);

    /**
     * Get the balance of an address
     * @param address The address to check
     * @param tokenContract Token contract address (null for native currency)
     * @return Uni containing the balance
     */
    Uni<BigDecimal> getBalance(String address, String tokenContract);

    /**
     * Estimate the gas/transaction fee for a bridge transaction
     * @param transaction The transaction to estimate fees for
     * @return Uni containing the estimated fee
     */
    Uni<BigDecimal> estimateGasFee(BridgeTransaction transaction);

    /**
     * Check if the adapter is healthy and connected
     * @return Uni containing health status
     */
    Uni<Boolean> isHealthy();

    /**
     * Get the unique chain identifier
     * @return Chain ID string
     */
    String getChainId();

    /**
     * Check if this chain supports atomic swaps
     * @return true if atomic swaps are supported
     */
    boolean supportsAtomicSwaps();

    /**
     * Create an atomic swap contract (if supported)
     * @param counterparty The counterparty address
     * @param amount The amount to swap
     * @param hashLock The hash lock for the swap
     * @param lockTime The time lock duration
     * @return Uni containing the swap contract transaction hash
     */
    default Uni<String> createAtomicSwapContract(String counterparty, BigDecimal amount, 
                                                 byte[] hashLock, long lockTime) {
        return Uni.createFrom().failure(
            new UnsupportedOperationException("Atomic swaps not supported on " + getChainId()));
    }

    /**
     * Transaction Status Information
     */
    class TransactionStatus {
        private final String transactionHash;
        private final TransactionStatusType status;
        private final int confirmations;
        private final int requiredConfirmations;
        private final long gasUsed;
        private final String errorMessage;
        private final long blockNumber;
        private final long timestamp;

        public TransactionStatus(String transactionHash, TransactionStatusType status,
                               int confirmations, int requiredConfirmations, long gasUsed,
                               String errorMessage, long blockNumber, long timestamp) {
            this.transactionHash = transactionHash;
            this.status = status;
            this.confirmations = confirmations;
            this.requiredConfirmations = requiredConfirmations;
            this.gasUsed = gasUsed;
            this.errorMessage = errorMessage;
            this.blockNumber = blockNumber;
            this.timestamp = timestamp;
        }

        // Getters
        public String getTransactionHash() { return transactionHash; }
        public TransactionStatusType getStatus() { return status; }
        public int getConfirmations() { return confirmations; }
        public int getRequiredConfirmations() { return requiredConfirmations; }
        public long getGasUsed() { return gasUsed; }
        public String getErrorMessage() { return errorMessage; }
        public long getBlockNumber() { return blockNumber; }
        public long getTimestamp() { return timestamp; }

        public boolean isConfirmed() {
            return confirmations >= requiredConfirmations && status == TransactionStatusType.CONFIRMED;
        }

        public double getConfirmationProgress() {
            return Math.min(1.0, (double) confirmations / requiredConfirmations);
        }
    }

    /**
     * Transaction Status Types
     */
    enum TransactionStatusType {
        PENDING("Transaction pending in mempool", false),
        CONFIRMING("Transaction being confirmed", false),
        CONFIRMED("Transaction confirmed", true),
        FAILED("Transaction failed", true),
        REJECTED("Transaction rejected", true);

        private final String description;
        private final boolean terminal;

        TransactionStatusType(String description, boolean terminal) {
            this.description = description;
            this.terminal = terminal;
        }

        public String getDescription() { return description; }
        public boolean isTerminal() { return terminal; }
        public boolean isSuccessful() { return this == CONFIRMED; }
        public boolean isFailure() { return this == FAILED || this == REJECTED; }
    }
}
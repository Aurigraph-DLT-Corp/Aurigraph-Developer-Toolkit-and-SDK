package io.aurigraph.v11.bridge.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;

/**
 * Cross-Chain Bridge Transaction Model
 * 
 * Represents a complete cross-chain transaction with all necessary metadata
 * for tracking, validation, and execution across multiple blockchain networks.
 * 
 * Features:
 * - Immutable design for thread safety
 * - Comprehensive tracking information
 * - Support for atomic swaps and lock-mint mechanisms
 * - Validator consensus tracking
 * - Fee breakdown and cost analysis
 * - Status progression and error handling
 */
public final class BridgeTransaction {

    private final String transactionId;
    private final String sourceChain;
    private final String targetChain;
    private final String sourceAddress;
    private final String targetAddress;
    private final String tokenContract;
    private final String tokenSymbol;
    private final BigDecimal amount;
    private final BigDecimal bridgeFee;
    private final BigDecimal gasFee;
    private final BigDecimal totalFee;
    private final BridgeTransactionStatus status;
    private final BridgeTransactionType type;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final Instant completedAt;
    private final String sourceTransactionHash;
    private final String targetTransactionHash;
    private final String swapId;
    private final byte[] hashLock;
    private final byte[] secret;
    private final long lockTime;
    private final int confirmations;
    private final int requiredConfirmations;
    private final BigDecimal actualSlippage;
    private final int validatorApprovals;
    private final int totalValidators;
    private final String errorMessage;
    private final Map<String, Object> metadata;
    private final boolean isHighValue;
    private final String securityScreeningId;
    private final double riskScore;

    @JsonCreator
    public BridgeTransaction(
            @JsonProperty("transactionId") String transactionId,
            @JsonProperty("sourceChain") String sourceChain,
            @JsonProperty("targetChain") String targetChain,
            @JsonProperty("sourceAddress") String sourceAddress,
            @JsonProperty("targetAddress") String targetAddress,
            @JsonProperty("tokenContract") String tokenContract,
            @JsonProperty("tokenSymbol") String tokenSymbol,
            @JsonProperty("amount") BigDecimal amount,
            @JsonProperty("bridgeFee") BigDecimal bridgeFee,
            @JsonProperty("gasFee") BigDecimal gasFee,
            @JsonProperty("totalFee") BigDecimal totalFee,
            @JsonProperty("status") BridgeTransactionStatus status,
            @JsonProperty("type") BridgeTransactionType type,
            @JsonProperty("createdAt") Instant createdAt,
            @JsonProperty("updatedAt") Instant updatedAt,
            @JsonProperty("completedAt") Instant completedAt,
            @JsonProperty("sourceTransactionHash") String sourceTransactionHash,
            @JsonProperty("targetTransactionHash") String targetTransactionHash,
            @JsonProperty("swapId") String swapId,
            @JsonProperty("hashLock") byte[] hashLock,
            @JsonProperty("secret") byte[] secret,
            @JsonProperty("lockTime") long lockTime,
            @JsonProperty("confirmations") int confirmations,
            @JsonProperty("requiredConfirmations") int requiredConfirmations,
            @JsonProperty("actualSlippage") BigDecimal actualSlippage,
            @JsonProperty("validatorApprovals") int validatorApprovals,
            @JsonProperty("totalValidators") int totalValidators,
            @JsonProperty("errorMessage") String errorMessage,
            @JsonProperty("metadata") Map<String, Object> metadata,
            @JsonProperty("isHighValue") boolean isHighValue,
            @JsonProperty("securityScreeningId") String securityScreeningId,
            @JsonProperty("riskScore") double riskScore) {
        
        this.transactionId = Objects.requireNonNull(transactionId, "Transaction ID cannot be null");
        this.sourceChain = Objects.requireNonNull(sourceChain, "Source chain cannot be null");
        this.targetChain = Objects.requireNonNull(targetChain, "Target chain cannot be null");
        this.sourceAddress = Objects.requireNonNull(sourceAddress, "Source address cannot be null");
        this.targetAddress = Objects.requireNonNull(targetAddress, "Target address cannot be null");
        this.tokenContract = tokenContract;
        this.tokenSymbol = Objects.requireNonNull(tokenSymbol, "Token symbol cannot be null");
        this.amount = Objects.requireNonNull(amount, "Amount cannot be null");
        this.bridgeFee = bridgeFee != null ? bridgeFee : BigDecimal.ZERO;
        this.gasFee = gasFee != null ? gasFee : BigDecimal.ZERO;
        this.totalFee = totalFee != null ? totalFee : this.bridgeFee.add(this.gasFee);
        this.status = Objects.requireNonNull(status, "Status cannot be null");
        this.type = Objects.requireNonNull(type, "Type cannot be null");
        this.createdAt = Objects.requireNonNull(createdAt, "Created at cannot be null");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
        this.completedAt = completedAt;
        this.sourceTransactionHash = sourceTransactionHash;
        this.targetTransactionHash = targetTransactionHash;
        this.swapId = swapId;
        this.hashLock = hashLock != null ? hashLock.clone() : null;
        this.secret = secret != null ? secret.clone() : null;
        this.lockTime = lockTime;
        this.confirmations = confirmations;
        this.requiredConfirmations = Math.max(requiredConfirmations, 1);
        this.actualSlippage = actualSlippage != null ? actualSlippage : BigDecimal.ZERO;
        this.validatorApprovals = validatorApprovals;
        this.totalValidators = totalValidators;
        this.errorMessage = errorMessage;
        this.metadata = metadata != null ? Map.copyOf(metadata) : Map.of();
        this.isHighValue = isHighValue;
        this.securityScreeningId = securityScreeningId;
        this.riskScore = riskScore;
    }

    // Builder pattern for easier construction
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String transactionId;
        private String sourceChain;
        private String targetChain;
        private String sourceAddress;
        private String targetAddress;
        private String tokenContract;
        private String tokenSymbol;
        private BigDecimal amount;
        private BigDecimal bridgeFee;
        private BigDecimal gasFee;
        private BigDecimal totalFee;
        private BridgeTransactionStatus status = BridgeTransactionStatus.INITIATED;
        private BridgeTransactionType type = BridgeTransactionType.LOCK_AND_MINT;
        private Instant createdAt = Instant.now();
        private Instant updatedAt;
        private Instant completedAt;
        private String sourceTransactionHash;
        private String targetTransactionHash;
        private String swapId;
        private byte[] hashLock;
        private byte[] secret;
        private long lockTime;
        private int confirmations;
        private int requiredConfirmations = 12;
        private BigDecimal actualSlippage;
        private int validatorApprovals;
        private int totalValidators;
        private String errorMessage;
        private Map<String, Object> metadata = Map.of();
        private boolean isHighValue;
        private String securityScreeningId;
        private double riskScore;

        public Builder transactionId(String transactionId) { this.transactionId = transactionId; return this; }
        public Builder sourceChain(String sourceChain) { this.sourceChain = sourceChain; return this; }
        public Builder targetChain(String targetChain) { this.targetChain = targetChain; return this; }
        public Builder sourceAddress(String sourceAddress) { this.sourceAddress = sourceAddress; return this; }
        public Builder targetAddress(String targetAddress) { this.targetAddress = targetAddress; return this; }
        public Builder tokenContract(String tokenContract) { this.tokenContract = tokenContract; return this; }
        public Builder tokenSymbol(String tokenSymbol) { this.tokenSymbol = tokenSymbol; return this; }
        public Builder amount(BigDecimal amount) { this.amount = amount; return this; }
        public Builder bridgeFee(BigDecimal bridgeFee) { this.bridgeFee = bridgeFee; return this; }
        public Builder gasFee(BigDecimal gasFee) { this.gasFee = gasFee; return this; }
        public Builder totalFee(BigDecimal totalFee) { this.totalFee = totalFee; return this; }
        public Builder status(BridgeTransactionStatus status) { this.status = status; return this; }
        public Builder type(BridgeTransactionType type) { this.type = type; return this; }
        public Builder createdAt(Instant createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(Instant updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder completedAt(Instant completedAt) { this.completedAt = completedAt; return this; }
        public Builder sourceTransactionHash(String sourceTransactionHash) { this.sourceTransactionHash = sourceTransactionHash; return this; }
        public Builder targetTransactionHash(String targetTransactionHash) { this.targetTransactionHash = targetTransactionHash; return this; }
        public Builder swapId(String swapId) { this.swapId = swapId; return this; }
        public Builder hashLock(byte[] hashLock) { this.hashLock = hashLock; return this; }
        public Builder secret(byte[] secret) { this.secret = secret; return this; }
        public Builder lockTime(long lockTime) { this.lockTime = lockTime; return this; }
        public Builder confirmations(int confirmations) { this.confirmations = confirmations; return this; }
        public Builder requiredConfirmations(int requiredConfirmations) { this.requiredConfirmations = requiredConfirmations; return this; }
        public Builder actualSlippage(BigDecimal actualSlippage) { this.actualSlippage = actualSlippage; return this; }
        public Builder validatorApprovals(int validatorApprovals) { this.validatorApprovals = validatorApprovals; return this; }
        public Builder totalValidators(int totalValidators) { this.totalValidators = totalValidators; return this; }
        public Builder errorMessage(String errorMessage) { this.errorMessage = errorMessage; return this; }
        public Builder metadata(Map<String, Object> metadata) { this.metadata = metadata; return this; }
        public Builder isHighValue(boolean isHighValue) { this.isHighValue = isHighValue; return this; }
        public Builder securityScreeningId(String securityScreeningId) { this.securityScreeningId = securityScreeningId; return this; }
        public Builder riskScore(double riskScore) { this.riskScore = riskScore; return this; }

        public BridgeTransaction build() {
            return new BridgeTransaction(
                transactionId, sourceChain, targetChain, sourceAddress, targetAddress,
                tokenContract, tokenSymbol, amount, bridgeFee, gasFee, totalFee,
                status, type, createdAt, updatedAt, completedAt,
                sourceTransactionHash, targetTransactionHash, swapId,
                hashLock, secret, lockTime, confirmations, requiredConfirmations,
                actualSlippage, validatorApprovals, totalValidators, errorMessage,
                metadata, isHighValue, securityScreeningId, riskScore
            );
        }
    }

    // Copy constructor for status updates
    public BridgeTransaction withStatus(BridgeTransactionStatus newStatus) {
        return new BridgeTransaction(
            transactionId, sourceChain, targetChain, sourceAddress, targetAddress,
            tokenContract, tokenSymbol, amount, bridgeFee, gasFee, totalFee,
            newStatus, type, createdAt, Instant.now(), 
            newStatus == BridgeTransactionStatus.COMPLETED ? Instant.now() : completedAt,
            sourceTransactionHash, targetTransactionHash, swapId,
            hashLock, secret, lockTime, confirmations, requiredConfirmations,
            actualSlippage, validatorApprovals, totalValidators, errorMessage,
            metadata, isHighValue, securityScreeningId, riskScore
        );
    }

    public BridgeTransaction withConfirmations(int newConfirmations) {
        return new BridgeTransaction(
            transactionId, sourceChain, targetChain, sourceAddress, targetAddress,
            tokenContract, tokenSymbol, amount, bridgeFee, gasFee, totalFee,
            status, type, createdAt, Instant.now(), completedAt,
            sourceTransactionHash, targetTransactionHash, swapId,
            hashLock, secret, lockTime, newConfirmations, requiredConfirmations,
            actualSlippage, validatorApprovals, totalValidators, errorMessage,
            metadata, isHighValue, securityScreeningId, riskScore
        );
    }

    public BridgeTransaction withError(String error) {
        return new BridgeTransaction(
            transactionId, sourceChain, targetChain, sourceAddress, targetAddress,
            tokenContract, tokenSymbol, amount, bridgeFee, gasFee, totalFee,
            BridgeTransactionStatus.FAILED, type, createdAt, Instant.now(), completedAt,
            sourceTransactionHash, targetTransactionHash, swapId,
            hashLock, secret, lockTime, confirmations, requiredConfirmations,
            actualSlippage, validatorApprovals, totalValidators, error,
            metadata, isHighValue, securityScreeningId, riskScore
        );
    }

    // Getters
    public String getTransactionId() { return transactionId; }
    public String getSourceChain() { return sourceChain; }
    public String getTargetChain() { return targetChain; }
    public String getSourceAddress() { return sourceAddress; }
    public String getTargetAddress() { return targetAddress; }
    public String getTokenContract() { return tokenContract; }
    public String getTokenSymbol() { return tokenSymbol; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getBridgeFee() { return bridgeFee; }
    public BigDecimal getGasFee() { return gasFee; }
    public BigDecimal getTotalFee() { return totalFee; }
    public BridgeTransactionStatus getStatus() { return status; }
    public BridgeTransactionType getType() { return type; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public Instant getCompletedAt() { return completedAt; }
    public String getSourceTransactionHash() { return sourceTransactionHash; }
    public String getTargetTransactionHash() { return targetTransactionHash; }
    public String getSwapId() { return swapId; }
    public byte[] getHashLock() { return hashLock != null ? hashLock.clone() : null; }
    public byte[] getSecret() { return secret != null ? secret.clone() : null; }
    public long getLockTime() { return lockTime; }
    public int getConfirmations() { return confirmations; }
    public int getRequiredConfirmations() { return requiredConfirmations; }
    public BigDecimal getActualSlippage() { return actualSlippage; }
    public int getValidatorApprovals() { return validatorApprovals; }
    public int getTotalValidators() { return totalValidators; }
    public String getErrorMessage() { return errorMessage; }
    public Map<String, Object> getMetadata() { return metadata; }
    public boolean isHighValue() { return isHighValue; }
    public String getSecurityScreeningId() { return securityScreeningId; }
    public double getRiskScore() { return riskScore; }

    // Utility methods
    public boolean isCompleted() {
        return status == BridgeTransactionStatus.COMPLETED;
    }

    public boolean isFailed() {
        return status == BridgeTransactionStatus.FAILED || status == BridgeTransactionStatus.REJECTED;
    }

    public boolean isPending() {
        return status == BridgeTransactionStatus.PENDING || status == BridgeTransactionStatus.CONFIRMING;
    }

    public boolean isFullyConfirmed() {
        return confirmations >= requiredConfirmations;
    }

    public double getProgressPercentage() {
        if (isCompleted()) return 100.0;
        if (isFailed()) return 0.0;
        return Math.min((double) confirmations / requiredConfirmations * 100.0, 95.0);
    }

    public long getElapsedTimeMs() {
        Instant endTime = completedAt != null ? completedAt : Instant.now();
        return java.time.Duration.between(createdAt, endTime).toMillis();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BridgeTransaction that = (BridgeTransaction) o;
        return Objects.equals(transactionId, that.transactionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(transactionId);
    }

    @Override
    public String toString() {
        return String.format("BridgeTransaction{id=%s, %s->%s, %s %s, status=%s}", 
            transactionId, sourceChain, targetChain, amount, tokenSymbol, status);
    }
}
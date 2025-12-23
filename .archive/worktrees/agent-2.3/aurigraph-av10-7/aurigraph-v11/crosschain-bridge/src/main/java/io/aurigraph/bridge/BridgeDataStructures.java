package io.aurigraph.bridge;

import java.math.BigDecimal;
import java.security.PublicKey;
import java.util.List;
import java.util.Set;

/**
 * Data structures for cross-chain bridge operations
 */

// Bridge Transaction related classes
public class BridgeTransaction {
    private String id;
    private String sourceChain;
    private String targetChain;
    private String asset;
    private BigDecimal amount;
    private String sender;
    private String recipient;
    private CrossChainBridgeService.BridgeStatus status;
    private long createdAt;
    private long completedAt;
    private String swapId;
    private String sourceTxHash;
    private String targetTxHash;
    private boolean consensusReached;
    private Set<String> validatorSignatures;
    private String errorMessage;

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private BridgeTransaction transaction = new BridgeTransaction();

        public Builder id(String id) { transaction.id = id; return this; }
        public Builder sourceChain(String sourceChain) { transaction.sourceChain = sourceChain; return this; }
        public Builder targetChain(String targetChain) { transaction.targetChain = targetChain; return this; }
        public Builder asset(String asset) { transaction.asset = asset; return this; }
        public Builder amount(BigDecimal amount) { transaction.amount = amount; return this; }
        public Builder sender(String sender) { transaction.sender = sender; return this; }
        public Builder recipient(String recipient) { transaction.recipient = recipient; return this; }
        public Builder status(CrossChainBridgeService.BridgeStatus status) { transaction.status = status; return this; }
        public Builder createdAt(long createdAt) { transaction.createdAt = createdAt; return this; }

        public BridgeTransaction build() { return transaction; }
    }

    // Getters and setters
    public String getId() { return id; }
    public String getSourceChain() { return sourceChain; }
    public String getTargetChain() { return targetChain; }
    public String getAsset() { return asset; }
    public BigDecimal getAmount() { return amount; }
    public String getSender() { return sender; }
    public String getRecipient() { return recipient; }
    public CrossChainBridgeService.BridgeStatus getStatus() { return status; }
    public long getCreatedAt() { return createdAt; }
    public long getCompletedAt() { return completedAt; }
    public String getSwapId() { return swapId; }
    public String getSourceTxHash() { return sourceTxHash; }
    public String getTargetTxHash() { return targetTxHash; }
    public boolean isConsensusReached() { return consensusReached; }
    public Set<String> getValidatorSignatures() { return validatorSignatures; }

    public void setStatus(CrossChainBridgeService.BridgeStatus status) { this.status = status; }
    public void setCompletedAt(long completedAt) { this.completedAt = completedAt; }
    public void setSwapId(String swapId) { this.swapId = swapId; }
    public void setSourceTxHash(String sourceTxHash) { this.sourceTxHash = sourceTxHash; }
    public void setTargetTxHash(String targetTxHash) { this.targetTxHash = targetTxHash; }
    public void setConsensusReached(boolean consensusReached) { this.consensusReached = consensusReached; }
    public void setValidatorSignatures(Set<String> validatorSignatures) { this.validatorSignatures = validatorSignatures; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

// Swap Pair class
public class SwapPair {
    private final String sourceChain;
    private final String targetChain;
    private final String sourceAsset;
    private final String targetAsset;

    public SwapPair(String sourceChain, String targetChain, String sourceAsset, String targetAsset) {
        this.sourceChain = sourceChain;
        this.targetChain = targetChain;
        this.sourceAsset = sourceAsset;
        this.targetAsset = targetAsset;
    }

    public String getSourceChain() { return sourceChain; }
    public String getTargetChain() { return targetChain; }
    public String getSourceAsset() { return sourceAsset; }
    public String getTargetAsset() { return targetAsset; }
    public String getAsset() { return sourceAsset; } // For compatibility
}

// HTLC Contract class
public class HTLCContract {
    private String swapId;
    private String chainId;
    private byte[] hashLock;
    private long timelock;
    private BigDecimal amount;
    private String asset;
    private String sender;
    private String recipient;
    private boolean isInitiator;

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private HTLCContract contract = new HTLCContract();

        public Builder swapId(String swapId) { contract.swapId = swapId; return this; }
        public Builder chainId(String chainId) { contract.chainId = chainId; return this; }
        public Builder hashLock(byte[] hashLock) { contract.hashLock = hashLock; return this; }
        public Builder timelock(long timelock) { contract.timelock = timelock; return this; }
        public Builder amount(BigDecimal amount) { contract.amount = amount; return this; }
        public Builder asset(String asset) { contract.asset = asset; return this; }
        public Builder sender(String sender) { contract.sender = sender; return this; }
        public Builder recipient(String recipient) { contract.recipient = recipient; return this; }
        public Builder isInitiator(boolean isInitiator) { contract.isInitiator = isInitiator; return this; }

        public HTLCContract build() { return contract; }
    }

    public String getSwapId() { return swapId; }
    public String getChainId() { return chainId; }
    public byte[] getHashLock() { return hashLock; }
    public long getTimelock() { return timelock; }
    public BigDecimal getAmount() { return amount; }
    public String getAsset() { return asset; }
    public String getSender() { return sender; }
    public String getRecipient() { return recipient; }
    public boolean isInitiator() { return isInitiator; }
}

// Atomic Swap classes
public class AtomicSwap {
    private String swapId;
    private String chainA;
    private String chainB;
    private String asset;
    private BigDecimal amount;
    private String partyA;
    private String partyB;
    private byte[] secret;
    private byte[] hashLock;
    private long initiatorTimelock;
    private long participantTimelock;
    private AtomicSwapManager.SwapStatus status;
    private long createdAt;
    private long completedAt;
    private String initiatorHTLC;
    private String participantHTLC;
    private String errorMessage;

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private AtomicSwap swap = new AtomicSwap();

        public Builder swapId(String swapId) { swap.swapId = swapId; return this; }
        public Builder chainA(String chainA) { swap.chainA = chainA; return this; }
        public Builder chainB(String chainB) { swap.chainB = chainB; return this; }
        public Builder asset(String asset) { swap.asset = asset; return this; }
        public Builder amount(BigDecimal amount) { swap.amount = amount; return this; }
        public Builder partyA(String partyA) { swap.partyA = partyA; return this; }
        public Builder partyB(String partyB) { swap.partyB = partyB; return this; }
        public Builder secret(byte[] secret) { swap.secret = secret; return this; }
        public Builder hashLock(byte[] hashLock) { swap.hashLock = hashLock; return this; }
        public Builder initiatorTimelock(long timelock) { swap.initiatorTimelock = timelock; return this; }
        public Builder participantTimelock(long timelock) { swap.participantTimelock = timelock; return this; }
        public Builder status(AtomicSwapManager.SwapStatus status) { swap.status = status; return this; }
        public Builder createdAt(long createdAt) { swap.createdAt = createdAt; return this; }

        public AtomicSwap build() { return swap; }
    }

    // Getters and setters
    public String getSwapId() { return swapId; }
    public String getChainA() { return chainA; }
    public String getChainB() { return chainB; }
    public String getAsset() { return asset; }
    public BigDecimal getAmount() { return amount; }
    public String getPartyA() { return partyA; }
    public String getPartyB() { return partyB; }
    public byte[] getSecret() { return secret; }
    public byte[] getHashLock() { return hashLock; }
    public long getInitiatorTimelock() { return initiatorTimelock; }
    public long getParticipantTimelock() { return participantTimelock; }
    public AtomicSwapManager.SwapStatus getStatus() { return status; }
    public long getCreatedAt() { return createdAt; }
    public long getCompletedAt() { return completedAt; }
    public String getInitiatorHTLC() { return initiatorHTLC; }
    public String getParticipantHTLC() { return participantHTLC; }
    public String getErrorMessage() { return errorMessage; }

    public void setStatus(AtomicSwapManager.SwapStatus status) { this.status = status; }
    public void setCompletedAt(long completedAt) { this.completedAt = completedAt; }
    public void setInitiatorHTLC(String initiatorHTLC) { this.initiatorHTLC = initiatorHTLC; }
    public void setParticipantHTLC(String participantHTLC) { this.participantHTLC = participantHTLC; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

public class AtomicSwapRequest {
    private String chainA;
    private String chainB;
    private String assetA;
    private BigDecimal amountA;
    private String partyA;
    private String partyB;

    // Getters and setters
    public String getChainA() { return chainA; }
    public String getChainB() { return chainB; }
    public String getAssetA() { return assetA; }
    public BigDecimal getAmountA() { return amountA; }
    public String getPartyA() { return partyA; }
    public String getPartyB() { return partyB; }

    public void setChainA(String chainA) { this.chainA = chainA; }
    public void setChainB(String chainB) { this.chainB = chainB; }
    public void setAssetA(String assetA) { this.assetA = assetA; }
    public void setAmountA(BigDecimal amountA) { this.amountA = amountA; }
    public void setPartyA(String partyA) { this.partyA = partyA; }
    public void setPartyB(String partyB) { this.partyB = partyB; }
}

public class AtomicSwapResult {
    private final String swapId;
    private final AtomicSwapManager.SwapStatus status;
    private final byte[] secret;
    private final byte[] hashLock;
    private final long estimatedTime;

    public AtomicSwapResult(String swapId, AtomicSwapManager.SwapStatus status, 
                          byte[] secret, byte[] hashLock, long estimatedTime) {
        this.swapId = swapId;
        this.status = status;
        this.secret = secret;
        this.hashLock = hashLock;
        this.estimatedTime = estimatedTime;
    }

    public String getSwapId() { return swapId; }
    public AtomicSwapManager.SwapStatus getStatus() { return status; }
    public byte[] getSecret() { return secret; }
    public byte[] getHashLock() { return hashLock; }
    public long getEstimatedTime() { return estimatedTime; }
}

// Multi-sig wallet classes
public class MultiSigWallet {
    private String chainId;
    private String address;
    private List<PublicKey> publicKeys;
    private int requiredSignatures;
    private int totalSigners;
    private long createdAt;
    private long updatedAt;

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private MultiSigWallet wallet = new MultiSigWallet();

        public Builder chainId(String chainId) { wallet.chainId = chainId; return this; }
        public Builder address(String address) { wallet.address = address; return this; }
        public Builder publicKeys(List<PublicKey> publicKeys) { wallet.publicKeys = publicKeys; return this; }
        public Builder requiredSignatures(int requiredSignatures) { wallet.requiredSignatures = requiredSignatures; return this; }
        public Builder totalSigners(int totalSigners) { wallet.totalSigners = totalSigners; return this; }
        public Builder createdAt(long createdAt) { wallet.createdAt = createdAt; return this; }

        public MultiSigWallet build() { return wallet; }
    }

    public String getChainId() { return chainId; }
    public String getAddress() { return address; }
    public List<PublicKey> getPublicKeys() { return publicKeys; }
    public int getRequiredSignatures() { return requiredSignatures; }
    public int getTotalSigners() { return totalSigners; }
    public long getCreatedAt() { return createdAt; }
    public long getUpdatedAt() { return updatedAt; }

    public void setAddress(String address) { this.address = address; }
    public void setPublicKeys(List<PublicKey> publicKeys) { this.publicKeys = publicKeys; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }
}

public class MultiSigTransaction {
    private String transactionId;
    private String walletAddress;
    private String chainId;
    private String recipient;
    private String asset;
    private BigDecimal amount;
    private String data;
    private int requiredSignatures;
    private long timelock;
    private MultiSigWalletService.TransactionStatus status;
    private long createdAt;
    private long executedAt;
    private String txHash;
    private List<TransactionSignature> signatures;
    private String errorMessage;
    private boolean emergencyTransaction;

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private MultiSigTransaction tx = new MultiSigTransaction();

        public Builder transactionId(String id) { tx.transactionId = id; return this; }
        public Builder walletAddress(String address) { tx.walletAddress = address; return this; }
        public Builder chainId(String chainId) { tx.chainId = chainId; return this; }
        public Builder recipient(String recipient) { tx.recipient = recipient; return this; }
        public Builder asset(String asset) { tx.asset = asset; return this; }
        public Builder amount(BigDecimal amount) { tx.amount = amount; return this; }
        public Builder data(String data) { tx.data = data; return this; }
        public Builder requiredSignatures(int required) { tx.requiredSignatures = required; return this; }
        public Builder timelock(long timelock) { tx.timelock = timelock; return this; }
        public Builder status(MultiSigWalletService.TransactionStatus status) { tx.status = status; return this; }
        public Builder createdAt(long createdAt) { tx.createdAt = createdAt; return this; }
        public Builder signatures(List<TransactionSignature> sigs) { tx.signatures = sigs; return this; }

        public MultiSigTransaction build() { return tx; }
    }

    // Getters and setters
    public String getTransactionId() { return transactionId; }
    public String getWalletAddress() { return walletAddress; }
    public String getChainId() { return chainId; }
    public String getRecipient() { return recipient; }
    public String getAsset() { return asset; }
    public BigDecimal getAmount() { return amount; }
    public String getData() { return data; }
    public int getRequiredSignatures() { return requiredSignatures; }
    public long getTimelock() { return timelock; }
    public MultiSigWalletService.TransactionStatus getStatus() { return status; }
    public long getCreatedAt() { return createdAt; }
    public long getExecutedAt() { return executedAt; }
    public String getTxHash() { return txHash; }
    public List<TransactionSignature> getSignatures() { return signatures; }
    public String getErrorMessage() { return errorMessage; }
    public boolean isEmergencyTransaction() { return emergencyTransaction; }

    public void setStatus(MultiSigWalletService.TransactionStatus status) { this.status = status; }
    public void setExecutedAt(long executedAt) { this.executedAt = executedAt; }
    public void setTxHash(String txHash) { this.txHash = txHash; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}

public class TransactionSignature {
    private final String validatorId;
    private final byte[] signatureData;
    private final long timestamp;

    public TransactionSignature(String validatorId, byte[] signatureData, long timestamp) {
        this.validatorId = validatorId;
        this.signatureData = signatureData;
        this.timestamp = timestamp;
    }

    public String getValidatorId() { return validatorId; }
    public byte[] getSignatureData() { return signatureData; }
    public long getTimestamp() { return timestamp; }
}

// Additional data structures for supporting services would continue here...
// Including metrics classes, validation classes, etc.
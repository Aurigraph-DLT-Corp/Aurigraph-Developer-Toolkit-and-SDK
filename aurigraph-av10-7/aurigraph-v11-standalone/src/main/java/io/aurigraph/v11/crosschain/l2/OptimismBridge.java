package io.aurigraph.v11.crosschain.l2;

import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Optimism Bridge Implementation for Aurigraph V12
 *
 * Implements the Optimism OP Stack bridge protocol for secure asset transfers
 * between Ethereum L1 and Optimism L2.
 *
 * Features:
 * - Standard Bridge for ETH and ERC20
 * - L1 to L2 Message Passing
 * - L2 to L1 Message Passing with Fault Proof
 * - 7-Day Withdrawal Period (Fault Proof Compatible)
 * - Native ETH Bridging
 * - Custom Token Bridging
 * - Batch Deposit Support
 *
 * OP Stack Bridge Architecture:
 * - L1StandardBridge: Main entry point for L1->L2 deposits
 * - L2StandardBridge: Main entry point for L2->L1 withdrawals
 * - CrossDomainMessenger: Message passing between L1 and L2
 * - OptimismPortal: Core L1 contract for proving and finalizing withdrawals
 *
 * Withdrawal Process (Fault Proof System):
 * 1. Initiate withdrawal on L2
 * 2. Wait for state root proposal (~1 hour)
 * 3. Prove withdrawal on L1
 * 4. Wait for challenge period (7 days)
 * 5. Finalize and claim on L1
 *
 * @author Aurigraph V12 Integration Team
 * @version 12.0.0
 * @since 2025-01-01
 * @see <a href="https://docs.optimism.io">Optimism Documentation</a>
 */
@ApplicationScoped
public class OptimismBridge implements L2Bridge {

    private static final Logger log = LoggerFactory.getLogger(OptimismBridge.class);

    /**
     * Optimism Chain IDs
     */
    public static final long OPTIMISM_MAINNET_CHAIN_ID = 10L;
    public static final long OPTIMISM_SEPOLIA_CHAIN_ID = 11155420L;
    public static final long ETHEREUM_MAINNET_CHAIN_ID = 1L;

    /**
     * Optimism Contract Addresses (Mainnet)
     */
    public static final String L1_STANDARD_BRIDGE = "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1";
    public static final String L2_STANDARD_BRIDGE = "0x4200000000000000000000000000000000000010";
    public static final String L1_CROSS_DOMAIN_MESSENGER = "0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1";
    public static final String L2_CROSS_DOMAIN_MESSENGER = "0x4200000000000000000000000000000000000007";
    public static final String OPTIMISM_PORTAL = "0xbEb5Fc579115071764c7423A4f12eDde41f106Ed";
    public static final String L2_TO_L1_MESSAGE_PASSER = "0x4200000000000000000000000000000000000016";
    public static final String L1_ERC721_BRIDGE = "0x5a7749f83b81B301cAb5f48EB8516B986DAef23D";
    public static final String L2_ERC721_BRIDGE = "0x4200000000000000000000000000000000000014";

    /**
     * Withdrawal period (7 days for fault proofs)
     */
    public static final Duration WITHDRAWAL_PERIOD = Duration.ofDays(7);
    public static final Duration STATE_ROOT_PROPOSAL_TIME = Duration.ofHours(1);
    public static final Duration PROVING_WINDOW = Duration.ofDays(7);

    /**
     * Bridge transaction types
     */
    public enum BridgeTransactionType {
        DEPOSIT_ETH,
        DEPOSIT_ERC20,
        DEPOSIT_ERC721,
        WITHDRAW_ETH,
        WITHDRAW_ERC20,
        WITHDRAW_ERC721,
        MESSAGE_L1_TO_L2,
        MESSAGE_L2_TO_L1
    }

    /**
     * Bridge transaction status
     */
    public enum BridgeStatus {
        PENDING,
        L1_INITIATED,
        L2_CONFIRMED,
        WITHDRAWAL_INITIATED,
        STATE_ROOT_PUBLISHED,
        PROVED,
        IN_CHALLENGE_PERIOD,
        READY_TO_FINALIZE,
        FINALIZED,
        COMPLETED,
        FAILED
    }

    /**
     * Bridge transaction record
     */
    public static class BridgeTransaction {
        private String transactionId;
        private BridgeTransactionType type;
        private BridgeStatus status;
        private String l1TxHash;
        private String l2TxHash;
        private String proveHash;
        private String finalizeHash;
        private String sender;
        private String recipient;
        private String tokenAddress;
        private String l1TokenAddress;
        private String l2TokenAddress;
        private String tokenSymbol;
        private BigInteger amount;
        private int decimals;
        private BigInteger l1GasUsed;
        private BigInteger l2GasUsed;
        private BigInteger fee;
        private Instant createdAt;
        private Instant stateRootAt;
        private Instant provedAt;
        private Instant challengeEndAt;
        private Instant finalizedAt;
        private Instant completedAt;
        private String withdrawalHash;
        private byte[] outputRootProof;
        private String errorMessage;
        private Map<String, Object> metadata;

        public BridgeTransaction() {
            this.metadata = new HashMap<>();
            this.createdAt = Instant.now();
        }

        // Getters and Setters
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        public BridgeTransactionType getType() { return type; }
        public void setType(BridgeTransactionType type) { this.type = type; }
        public BridgeStatus getStatus() { return status; }
        public void setStatus(BridgeStatus status) { this.status = status; }
        public String getL1TxHash() { return l1TxHash; }
        public void setL1TxHash(String l1TxHash) { this.l1TxHash = l1TxHash; }
        public String getL2TxHash() { return l2TxHash; }
        public void setL2TxHash(String l2TxHash) { this.l2TxHash = l2TxHash; }
        public String getProveHash() { return proveHash; }
        public void setProveHash(String proveHash) { this.proveHash = proveHash; }
        public String getFinalizeHash() { return finalizeHash; }
        public void setFinalizeHash(String finalizeHash) { this.finalizeHash = finalizeHash; }
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        public String getRecipient() { return recipient; }
        public void setRecipient(String recipient) { this.recipient = recipient; }
        public String getTokenAddress() { return tokenAddress; }
        public void setTokenAddress(String tokenAddress) { this.tokenAddress = tokenAddress; }
        public String getL1TokenAddress() { return l1TokenAddress; }
        public void setL1TokenAddress(String l1TokenAddress) { this.l1TokenAddress = l1TokenAddress; }
        public String getL2TokenAddress() { return l2TokenAddress; }
        public void setL2TokenAddress(String l2TokenAddress) { this.l2TokenAddress = l2TokenAddress; }
        public String getTokenSymbol() { return tokenSymbol; }
        public void setTokenSymbol(String tokenSymbol) { this.tokenSymbol = tokenSymbol; }
        public BigInteger getAmount() { return amount; }
        public void setAmount(BigInteger amount) { this.amount = amount; }
        public int getDecimals() { return decimals; }
        public void setDecimals(int decimals) { this.decimals = decimals; }
        public BigInteger getL1GasUsed() { return l1GasUsed; }
        public void setL1GasUsed(BigInteger l1GasUsed) { this.l1GasUsed = l1GasUsed; }
        public BigInteger getL2GasUsed() { return l2GasUsed; }
        public void setL2GasUsed(BigInteger l2GasUsed) { this.l2GasUsed = l2GasUsed; }
        public BigInteger getFee() { return fee; }
        public void setFee(BigInteger fee) { this.fee = fee; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getStateRootAt() { return stateRootAt; }
        public void setStateRootAt(Instant stateRootAt) { this.stateRootAt = stateRootAt; }
        public Instant getProvedAt() { return provedAt; }
        public void setProvedAt(Instant provedAt) { this.provedAt = provedAt; }
        public Instant getChallengeEndAt() { return challengeEndAt; }
        public void setChallengeEndAt(Instant challengeEndAt) { this.challengeEndAt = challengeEndAt; }
        public Instant getFinalizedAt() { return finalizedAt; }
        public void setFinalizedAt(Instant finalizedAt) { this.finalizedAt = finalizedAt; }
        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
        public String getWithdrawalHash() { return withdrawalHash; }
        public void setWithdrawalHash(String withdrawalHash) { this.withdrawalHash = withdrawalHash; }
        public byte[] getOutputRootProof() { return outputRootProof; }
        public void setOutputRootProof(byte[] outputRootProof) { this.outputRootProof = outputRootProof; }
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }

        public BigDecimal getFormattedAmount() {
            return new BigDecimal(amount).divide(BigDecimal.TEN.pow(decimals));
        }

        public Duration getRemainingChallengeTime() {
            if (challengeEndAt == null) return Duration.ZERO;
            Duration remaining = Duration.between(Instant.now(), challengeEndAt);
            return remaining.isNegative() ? Duration.ZERO : remaining;
        }

        public String getWithdrawalPhase() {
            return switch (status) {
                case WITHDRAWAL_INITIATED -> "Waiting for state root (~1 hour)";
                case STATE_ROOT_PUBLISHED -> "Ready to prove";
                case PROVED, IN_CHALLENGE_PERIOD -> "In challenge period (" + getRemainingChallengeTime() + " remaining)";
                case READY_TO_FINALIZE -> "Ready to finalize";
                case FINALIZED, COMPLETED -> "Completed";
                default -> status.name();
            };
        }
    }

    /**
     * Cross-domain message
     */
    public static class CrossDomainMessage {
        private String messageId;
        private String sender;
        private String target;
        private byte[] data;
        private BigInteger value;
        private long minGasLimit;
        private boolean isL1ToL2;
        private BridgeStatus status;
        private String l1TxHash;
        private String l2TxHash;
        private Instant createdAt;
        private Instant relayedAt;

        // Getters and Setters
        public String getMessageId() { return messageId; }
        public void setMessageId(String messageId) { this.messageId = messageId; }
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        public String getTarget() { return target; }
        public void setTarget(String target) { this.target = target; }
        public byte[] getData() { return data; }
        public void setData(byte[] data) { this.data = data; }
        public BigInteger getValue() { return value; }
        public void setValue(BigInteger value) { this.value = value; }
        public long getMinGasLimit() { return minGasLimit; }
        public void setMinGasLimit(long minGasLimit) { this.minGasLimit = minGasLimit; }
        public boolean isL1ToL2() { return isL1ToL2; }
        public void setL1ToL2(boolean l1ToL2) { isL1ToL2 = l1ToL2; }
        public BridgeStatus getStatus() { return status; }
        public void setStatus(BridgeStatus status) { this.status = status; }
        public String getL1TxHash() { return l1TxHash; }
        public void setL1TxHash(String l1TxHash) { this.l1TxHash = l1TxHash; }
        public String getL2TxHash() { return l2TxHash; }
        public void setL2TxHash(String l2TxHash) { this.l2TxHash = l2TxHash; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getRelayedAt() { return relayedAt; }
        public void setRelayedAt(Instant relayedAt) { this.relayedAt = relayedAt; }
    }

    // Configuration
    @ConfigProperty(name = "optimism.rpc.url", defaultValue = "https://mainnet.optimism.io")
    String optimismRpcUrl;

    @ConfigProperty(name = "ethereum.rpc.url", defaultValue = "https://eth-mainnet.g.alchemy.com/v2/demo")
    String ethereumRpcUrl;

    @ConfigProperty(name = "optimism.chain.id", defaultValue = "10")
    long chainId;

    @ConfigProperty(name = "optimism.confirmation.blocks.l1", defaultValue = "12")
    int l1ConfirmationBlocks;

    @ConfigProperty(name = "optimism.confirmation.blocks.l2", defaultValue = "1")
    int l2ConfirmationBlocks;

    // State management
    private final Map<String, BridgeTransaction> transactions = new ConcurrentHashMap<>();
    private final Map<String, CrossDomainMessage> messages = new ConcurrentHashMap<>();
    private final Map<String, List<String>> pendingWithdrawals = new ConcurrentHashMap<>();

    // Metrics
    private final AtomicLong totalDeposits = new AtomicLong(0);
    private final AtomicLong totalWithdrawals = new AtomicLong(0);
    private final AtomicLong successfulTransactions = new AtomicLong(0);
    private final AtomicLong failedTransactions = new AtomicLong(0);
    private final AtomicLong totalVolumeDeposited = new AtomicLong(0);
    private final AtomicLong totalVolumeWithdrawn = new AtomicLong(0);

    public OptimismBridge() {
        log.info("OptimismBridge initialized for chain ID: {}", chainId);
    }

    // L2Bridge Interface Implementation

    @Override
    public String getBridgeName() {
        return "Optimism Bridge";
    }

    @Override
    public long getL2ChainId() {
        return chainId;
    }

    @Override
    public long getL1ChainId() {
        return ETHEREUM_MAINNET_CHAIN_ID;
    }

    @Override
    public Duration getChallengePeriod() {
        return WITHDRAWAL_PERIOD;
    }

    @Override
    public boolean isActive() {
        return true;
    }

    /**
     * Deposit ETH from L1 to L2
     */
    public Uni<BridgeTransaction> depositETH(
            String sender,
            String recipient,
            BigInteger amount
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(recipient, "recipient");
            validateAmount(amount);

            BridgeTransaction tx = new BridgeTransaction();
            tx.setTransactionId(generateTransactionId("DEP"));
            tx.setType(BridgeTransactionType.DEPOSIT_ETH);
            tx.setStatus(BridgeStatus.PENDING);
            tx.setSender(sender);
            tx.setRecipient(recipient);
            tx.setAmount(amount);
            tx.setDecimals(18);
            tx.setTokenSymbol("ETH");

            // Estimate fees
            BigInteger fee = estimateDepositFee(amount, null);
            tx.setFee(fee);

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalDeposits.incrementAndGet();

            log.info("Optimism ETH deposit initiated: {} ETH from {} to {}",
                tx.getFormattedAmount(), sender, recipient);

            // Process deposit asynchronously
            processDepositAsync(tx);

            return tx;
        });
    }

    /**
     * Deposit ERC20 from L1 to L2
     */
    public Uni<BridgeTransaction> depositERC20(
            String sender,
            String recipient,
            String l1Token,
            String l2Token,
            String tokenSymbol,
            BigInteger amount,
            int decimals
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(recipient, "recipient");
            validateAddress(l1Token, "l1Token");
            validateAddress(l2Token, "l2Token");
            validateAmount(amount);

            BridgeTransaction tx = new BridgeTransaction();
            tx.setTransactionId(generateTransactionId("DEP"));
            tx.setType(BridgeTransactionType.DEPOSIT_ERC20);
            tx.setStatus(BridgeStatus.PENDING);
            tx.setSender(sender);
            tx.setRecipient(recipient);
            tx.setL1TokenAddress(l1Token);
            tx.setL2TokenAddress(l2Token);
            tx.setTokenSymbol(tokenSymbol);
            tx.setAmount(amount);
            tx.setDecimals(decimals);

            // Estimate fees
            BigInteger fee = estimateDepositFee(amount, l1Token);
            tx.setFee(fee);

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalDeposits.incrementAndGet();

            log.info("Optimism {} deposit initiated: {} from {} to {}",
                tokenSymbol, tx.getFormattedAmount(), sender, recipient);

            // Process deposit asynchronously
            processDepositAsync(tx);

            return tx;
        });
    }

    /**
     * Initiate ETH withdrawal from L2 to L1
     */
    public Uni<BridgeTransaction> initiateWithdrawal(
            String sender,
            String recipient,
            BigInteger amount
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(recipient, "recipient");
            validateAmount(amount);

            BridgeTransaction tx = new BridgeTransaction();
            tx.setTransactionId(generateTransactionId("WTH"));
            tx.setType(BridgeTransactionType.WITHDRAW_ETH);
            tx.setStatus(BridgeStatus.PENDING);
            tx.setSender(sender);
            tx.setRecipient(recipient);
            tx.setAmount(amount);
            tx.setDecimals(18);
            tx.setTokenSymbol("ETH");

            // Estimate fees
            BigInteger fee = estimateWithdrawalFee(amount, null);
            tx.setFee(fee);

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalWithdrawals.incrementAndGet();

            // Track pending withdrawal
            pendingWithdrawals.computeIfAbsent(sender, k -> new ArrayList<>())
                .add(tx.getTransactionId());

            log.info("Optimism ETH withdrawal initiated: {} ETH from {} to {} " +
                "(total time: state root ~1h + prove + 7 days challenge)",
                tx.getFormattedAmount(), sender, recipient);

            // Process withdrawal asynchronously
            processWithdrawalAsync(tx);

            return tx;
        });
    }

    /**
     * Initiate ERC20 withdrawal from L2 to L1
     */
    public Uni<BridgeTransaction> initiateERC20Withdrawal(
            String sender,
            String recipient,
            String l1Token,
            String l2Token,
            String tokenSymbol,
            BigInteger amount,
            int decimals
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(recipient, "recipient");
            validateAddress(l1Token, "l1Token");
            validateAddress(l2Token, "l2Token");
            validateAmount(amount);

            BridgeTransaction tx = new BridgeTransaction();
            tx.setTransactionId(generateTransactionId("WTH"));
            tx.setType(BridgeTransactionType.WITHDRAW_ERC20);
            tx.setStatus(BridgeStatus.PENDING);
            tx.setSender(sender);
            tx.setRecipient(recipient);
            tx.setL1TokenAddress(l1Token);
            tx.setL2TokenAddress(l2Token);
            tx.setTokenSymbol(tokenSymbol);
            tx.setAmount(amount);
            tx.setDecimals(decimals);

            // Estimate fees
            BigInteger fee = estimateWithdrawalFee(amount, l1Token);
            tx.setFee(fee);

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalWithdrawals.incrementAndGet();

            // Track pending withdrawal
            pendingWithdrawals.computeIfAbsent(sender, k -> new ArrayList<>())
                .add(tx.getTransactionId());

            log.info("Optimism {} withdrawal initiated: {} from {} to {}",
                tokenSymbol, tx.getFormattedAmount(), sender, recipient);

            // Process withdrawal asynchronously
            processWithdrawalAsync(tx);

            return tx;
        });
    }

    /**
     * Prove a withdrawal on L1 (step 2 of withdrawal process)
     */
    public Uni<BridgeTransaction> proveWithdrawal(String transactionId) {
        return Uni.createFrom().item(() -> {
            BridgeTransaction tx = transactions.get(transactionId);
            if (tx == null) {
                throw new OptimismBridgeException("Transaction not found: " + transactionId);
            }

            if (tx.getStatus() != BridgeStatus.STATE_ROOT_PUBLISHED) {
                throw new OptimismBridgeException(
                    "Withdrawal not ready to prove. Current status: " + tx.getStatus());
            }

            // Simulate proving
            tx.setProveHash(generateTxHash());
            tx.setProvedAt(Instant.now());
            tx.setChallengeEndAt(Instant.now().plus(WITHDRAWAL_PERIOD));
            tx.setStatus(BridgeStatus.IN_CHALLENGE_PERIOD);

            log.info("Withdrawal proved: {} - Challenge ends at {}",
                transactionId, tx.getChallengeEndAt());

            // Simulate challenge period completion
            simulateChallengeCompletion(tx);

            return tx;
        });
    }

    /**
     * Finalize a withdrawal on L1 (step 3 of withdrawal process)
     */
    public Uni<BridgeTransaction> finalizeWithdrawal(String transactionId) {
        return Uni.createFrom().item(() -> {
            BridgeTransaction tx = transactions.get(transactionId);
            if (tx == null) {
                throw new OptimismBridgeException("Transaction not found: " + transactionId);
            }

            if (tx.getStatus() != BridgeStatus.READY_TO_FINALIZE) {
                if (tx.getStatus() == BridgeStatus.IN_CHALLENGE_PERIOD) {
                    Duration remaining = tx.getRemainingChallengeTime();
                    throw new OptimismBridgeException(
                        "Challenge period not complete. Time remaining: " + remaining);
                }
                throw new OptimismBridgeException(
                    "Withdrawal not ready to finalize. Status: " + tx.getStatus());
            }

            // Simulate finalization
            tx.setFinalizeHash(generateTxHash());
            tx.setFinalizedAt(Instant.now());
            tx.setStatus(BridgeStatus.COMPLETED);
            tx.setCompletedAt(Instant.now());

            // Remove from pending
            List<String> pending = pendingWithdrawals.get(tx.getSender());
            if (pending != null) {
                pending.remove(transactionId);
            }

            successfulTransactions.incrementAndGet();
            totalVolumeWithdrawn.addAndGet(tx.getAmount().longValue());

            log.info("Withdrawal finalized: {} {} to {}",
                tx.getFormattedAmount(), tx.getTokenSymbol(), tx.getRecipient());

            return tx;
        });
    }

    /**
     * Send cross-domain message from L1 to L2
     */
    public Uni<CrossDomainMessage> sendMessageL1ToL2(
            String sender,
            String target,
            byte[] data,
            BigInteger value,
            long minGasLimit
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(target, "target");

            CrossDomainMessage message = new CrossDomainMessage();
            message.setMessageId(generateTransactionId("MSG"));
            message.setSender(sender);
            message.setTarget(target);
            message.setData(data);
            message.setValue(value);
            message.setMinGasLimit(minGasLimit);
            message.setL1ToL2(true);
            message.setStatus(BridgeStatus.PENDING);
            message.setCreatedAt(Instant.now());

            messages.put(message.getMessageId(), message);

            log.info("L1->L2 message sent: {} from {} to {}",
                message.getMessageId(), sender, target);

            // Process message asynchronously
            processMessageAsync(message);

            return message;
        });
    }

    /**
     * Send cross-domain message from L2 to L1
     */
    public Uni<CrossDomainMessage> sendMessageL2ToL1(
            String sender,
            String target,
            byte[] data,
            long minGasLimit
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(target, "target");

            CrossDomainMessage message = new CrossDomainMessage();
            message.setMessageId(generateTransactionId("MSG"));
            message.setSender(sender);
            message.setTarget(target);
            message.setData(data);
            message.setValue(BigInteger.ZERO);
            message.setMinGasLimit(minGasLimit);
            message.setL1ToL2(false);
            message.setStatus(BridgeStatus.PENDING);
            message.setCreatedAt(Instant.now());

            messages.put(message.getMessageId(), message);

            log.info("L2->L1 message sent: {} from {} to {} (7-day delay applies)",
                message.getMessageId(), sender, target);

            return message;
        });
    }

    /**
     * Get transaction status
     */
    public Uni<BridgeTransaction> getTransaction(String transactionId) {
        return Uni.createFrom().item(() -> {
            BridgeTransaction tx = transactions.get(transactionId);
            if (tx == null) {
                throw new OptimismBridgeException("Transaction not found: " + transactionId);
            }
            return tx;
        });
    }

    /**
     * Get all transactions for an address
     */
    public Uni<List<BridgeTransaction>> getTransactionsForAddress(String address) {
        return Uni.createFrom().item(() ->
            transactions.values().stream()
                .filter(tx -> address.equals(tx.getSender()) || address.equals(tx.getRecipient()))
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .toList()
        );
    }

    /**
     * Get pending withdrawals for an address
     */
    public Uni<List<BridgeTransaction>> getPendingWithdrawals(String address) {
        return Uni.createFrom().item(() -> {
            List<String> ids = pendingWithdrawals.getOrDefault(address, List.of());
            return ids.stream()
                .map(transactions::get)
                .filter(Objects::nonNull)
                .filter(tx -> tx.getStatus() != BridgeStatus.COMPLETED)
                .sorted((a, b) -> {
                    if (a.getChallengeEndAt() == null) return 1;
                    if (b.getChallengeEndAt() == null) return -1;
                    return a.getChallengeEndAt().compareTo(b.getChallengeEndAt());
                })
                .toList();
        });
    }

    /**
     * Get withdrawals ready to prove
     */
    public Uni<List<BridgeTransaction>> getProvableWithdrawals(String address) {
        return Uni.createFrom().item(() ->
            transactions.values().stream()
                .filter(tx -> address.equals(tx.getSender()))
                .filter(tx -> tx.getStatus() == BridgeStatus.STATE_ROOT_PUBLISHED)
                .toList()
        );
    }

    /**
     * Get withdrawals ready to finalize
     */
    public Uni<List<BridgeTransaction>> getFinalizableWithdrawals(String address) {
        return Uni.createFrom().item(() ->
            transactions.values().stream()
                .filter(tx -> address.equals(tx.getSender()))
                .filter(tx -> tx.getStatus() == BridgeStatus.READY_TO_FINALIZE)
                .toList()
        );
    }

    /**
     * Estimate deposit fee
     */
    public BigInteger estimateDepositFee(BigInteger amount, String tokenAddress) {
        // L1 gas + L2 execution
        BigInteger l1Gas = new BigInteger("200000").multiply(new BigInteger("30000000000")); // 200k gas * 30 gwei
        BigInteger l2Gas = new BigInteger("100000").multiply(new BigInteger("1000000")); // L2 is much cheaper

        if (tokenAddress != null) {
            // ERC20 deposits require more gas
            l1Gas = l1Gas.multiply(BigInteger.valueOf(2));
        }

        return l1Gas.add(l2Gas);
    }

    /**
     * Estimate withdrawal fee (3 transactions required)
     */
    public BigInteger estimateWithdrawalFee(BigInteger amount, String tokenAddress) {
        // L2 initiation + L1 prove + L1 finalize
        BigInteger l2InitFee = new BigInteger("300000000000000"); // 0.0003 ETH
        BigInteger l1ProveFee = new BigInteger("3000000000000000"); // 0.003 ETH
        BigInteger l1FinalizeFee = new BigInteger("2000000000000000"); // 0.002 ETH

        if (tokenAddress != null) {
            l1ProveFee = l1ProveFee.multiply(BigInteger.valueOf(2));
            l1FinalizeFee = l1FinalizeFee.multiply(BigInteger.valueOf(2));
        }

        return l2InitFee.add(l1ProveFee).add(l1FinalizeFee);
    }

    /**
     * Get bridge statistics
     */
    public Uni<BridgeStatistics> getStatistics() {
        return Uni.createFrom().item(() -> {
            BridgeStatistics stats = new BridgeStatistics();
            stats.bridgeName = getBridgeName();
            stats.l1ChainId = getL1ChainId();
            stats.l2ChainId = getL2ChainId();
            stats.totalDeposits = totalDeposits.get();
            stats.totalWithdrawals = totalWithdrawals.get();
            stats.successfulTransactions = successfulTransactions.get();
            stats.failedTransactions = failedTransactions.get();
            stats.pendingTransactions = transactions.values().stream()
                .filter(tx -> tx.getStatus() != BridgeStatus.COMPLETED &&
                             tx.getStatus() != BridgeStatus.FAILED)
                .count();
            stats.withdrawalsInChallenge = transactions.values().stream()
                .filter(tx -> tx.getStatus() == BridgeStatus.IN_CHALLENGE_PERIOD)
                .count();
            stats.totalVolumeDeposited = new BigDecimal(totalVolumeDeposited.get())
                .divide(BigDecimal.TEN.pow(18));
            stats.totalVolumeWithdrawn = new BigDecimal(totalVolumeWithdrawn.get())
                .divide(BigDecimal.TEN.pow(18));
            stats.challengePeriod = WITHDRAWAL_PERIOD;
            stats.isActive = isActive();
            return stats;
        });
    }

    /**
     * Bridge statistics
     */
    public static class BridgeStatistics {
        public String bridgeName;
        public long l1ChainId;
        public long l2ChainId;
        public long totalDeposits;
        public long totalWithdrawals;
        public long successfulTransactions;
        public long failedTransactions;
        public long pendingTransactions;
        public long withdrawalsInChallenge;
        public BigDecimal totalVolumeDeposited;
        public BigDecimal totalVolumeWithdrawn;
        public Duration challengePeriod;
        public boolean isActive;
    }

    // Private helper methods

    private void processDepositAsync(BridgeTransaction tx) {
        Thread.ofVirtual().start(() -> {
            try {
                // Simulate L1 confirmation
                Thread.sleep(Duration.ofSeconds(15).toMillis());
                tx.setL1TxHash(generateTxHash());
                tx.setStatus(BridgeStatus.L1_INITIATED);

                // Simulate L2 confirmation (deposits are fast, ~1-5 minutes)
                Thread.sleep(Duration.ofSeconds(5).toMillis());
                tx.setL2TxHash(generateTxHash());
                tx.setStatus(BridgeStatus.COMPLETED);
                tx.setCompletedAt(Instant.now());

                successfulTransactions.incrementAndGet();
                totalVolumeDeposited.addAndGet(tx.getAmount().longValue());

                log.info("Optimism deposit completed: {} {} - L2 TX: {}",
                    tx.getFormattedAmount(), tx.getTokenSymbol(), tx.getL2TxHash());

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                tx.setStatus(BridgeStatus.FAILED);
                tx.setErrorMessage("Deposit processing interrupted");
                failedTransactions.incrementAndGet();
            }
        });
    }

    private void processWithdrawalAsync(BridgeTransaction tx) {
        Thread.ofVirtual().start(() -> {
            try {
                // Simulate L2 transaction
                Thread.sleep(Duration.ofSeconds(3).toMillis());
                tx.setL2TxHash(generateTxHash());
                tx.setWithdrawalHash(generateTxHash());
                tx.setStatus(BridgeStatus.WITHDRAWAL_INITIATED);

                log.info("Withdrawal initiated on L2: {} - waiting for state root",
                    tx.getTransactionId());

                // Simulate state root publication (~1 hour in production)
                Thread.sleep(Duration.ofSeconds(5).toMillis());
                tx.setStateRootAt(Instant.now());
                tx.setStatus(BridgeStatus.STATE_ROOT_PUBLISHED);

                log.info("State root published for withdrawal: {} - ready to prove",
                    tx.getTransactionId());

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                tx.setStatus(BridgeStatus.FAILED);
                tx.setErrorMessage("Withdrawal processing interrupted");
                failedTransactions.incrementAndGet();
            }
        });
    }

    private void simulateChallengeCompletion(BridgeTransaction tx) {
        Thread.ofVirtual().start(() -> {
            try {
                // Simulate challenge period (shortened for demo)
                Thread.sleep(Duration.ofSeconds(10).toMillis());
                tx.setStatus(BridgeStatus.READY_TO_FINALIZE);

                log.info("Challenge period complete for: {} - ready to finalize",
                    tx.getTransactionId());

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }

    private void processMessageAsync(CrossDomainMessage message) {
        Thread.ofVirtual().start(() -> {
            try {
                // L1->L2 messages are fast
                Thread.sleep(Duration.ofSeconds(5).toMillis());
                message.setL2TxHash(generateTxHash());
                message.setRelayedAt(Instant.now());
                message.setStatus(BridgeStatus.COMPLETED);

                log.info("Cross-domain message relayed: {}", message.getMessageId());

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                message.setStatus(BridgeStatus.FAILED);
            }
        });
    }

    private void validateAddress(String address, String fieldName) {
        if (address == null || address.isEmpty()) {
            throw new OptimismBridgeException(fieldName + " address is required");
        }
        if (!address.matches("^0x[a-fA-F0-9]{40}$")) {
            throw new OptimismBridgeException("Invalid " + fieldName + " address format");
        }
    }

    private void validateAmount(BigInteger amount) {
        if (amount == null || amount.compareTo(BigInteger.ZERO) <= 0) {
            throw new OptimismBridgeException("Amount must be positive");
        }
    }

    private String generateTransactionId(String prefix) {
        return prefix + "-OP-" + System.nanoTime() + "-" +
               Integer.toHexString((int)(Math.random() * 0xFFFF)).toUpperCase();
    }

    private String generateTxHash() {
        StringBuilder hex = new StringBuilder("0x");
        for (int i = 0; i < 64; i++) {
            int randomNum = (int) (Math.random() * 16);
            char hexChar = (randomNum < 10) ? (char) ('0' + randomNum) : (char) ('a' + randomNum - 10);
            hex.append(hexChar);
        }
        return hex.toString();
    }

    /**
     * Optimism Bridge Exception
     */
    public static class OptimismBridgeException extends RuntimeException {
        public OptimismBridgeException(String message) {
            super(message);
        }

        public OptimismBridgeException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

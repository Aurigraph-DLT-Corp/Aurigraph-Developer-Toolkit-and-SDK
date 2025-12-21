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
 * Arbitrum Bridge Implementation for Aurigraph V12
 *
 * Implements the Arbitrum L1-L2 bridge protocol for secure asset transfers
 * between Ethereum L1 and Arbitrum One/Nova L2.
 *
 * Features:
 * - L1 to L2 Deposits (ETH and ERC20)
 * - L2 to L1 Withdrawals with Challenge Period
 * - Retryable Ticket Creation and Management
 * - Native ETH and ERC20 Token Bridging
 * - Message Passing between L1 and L2
 * - Batch Transaction Support
 * - Gas Price Estimation and Optimization
 *
 * Arbitrum Bridge Architecture:
 * - Inbox: L1 contract receiving deposit transactions
 * - Outbox: L1 contract for L2->L1 message execution
 * - Bridge: Core L1 contract managing bridge state
 * - Rollup: L1 contract for dispute resolution
 * - ArbSys: L2 precompile for L2->L1 communication
 *
 * Challenge Period:
 * - Arbitrum One: ~7 days for fraud proofs
 * - Fast Withdrawals: Available via liquidity providers
 *
 * @author Aurigraph V12 Integration Team
 * @version 12.0.0
 * @since 2025-01-01
 * @see <a href="https://developer.arbitrum.io">Arbitrum Documentation</a>
 */
@ApplicationScoped
public class ArbitrumBridge implements L2Bridge {

    private static final Logger log = LoggerFactory.getLogger(ArbitrumBridge.class);

    /**
     * Arbitrum Chain IDs
     */
    public static final long ARBITRUM_ONE_CHAIN_ID = 42161L;
    public static final long ARBITRUM_NOVA_CHAIN_ID = 42170L;
    public static final long ARBITRUM_SEPOLIA_CHAIN_ID = 421614L;
    public static final long ETHEREUM_MAINNET_CHAIN_ID = 1L;

    /**
     * Arbitrum Contract Addresses (Mainnet)
     */
    public static final String ARBITRUM_INBOX = "0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f";
    public static final String ARBITRUM_OUTBOX = "0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840";
    public static final String ARBITRUM_BRIDGE = "0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a";
    public static final String ARBITRUM_ROLLUP = "0x5eF0D09d1E6204141B4d37530808eD19f60FBa35";
    public static final String L1_GATEWAY_ROUTER = "0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef";
    public static final String L2_GATEWAY_ROUTER = "0x5288c571Fd7aD117beA99bF60FE0846C4E84F933";

    /**
     * Challenge period duration
     */
    public static final Duration CHALLENGE_PERIOD = Duration.ofDays(7);
    public static final Duration FAST_WITHDRAWAL_WAIT = Duration.ofMinutes(15);

    /**
     * Bridge transaction types
     */
    public enum BridgeTransactionType {
        DEPOSIT_ETH,
        DEPOSIT_ERC20,
        WITHDRAW_ETH,
        WITHDRAW_ERC20,
        MESSAGE_L1_TO_L2,
        MESSAGE_L2_TO_L1,
        RETRYABLE_TICKET
    }

    /**
     * Bridge transaction status
     */
    public enum BridgeStatus {
        PENDING,
        L1_CONFIRMED,
        L2_CONFIRMED,
        IN_CHALLENGE_PERIOD,
        CHALLENGE_PERIOD_COMPLETE,
        READY_TO_CLAIM,
        COMPLETED,
        FAILED,
        RETRYING
    }

    /**
     * Retryable ticket status
     */
    public enum RetryableStatus {
        CREATED,
        REDEEMED,
        EXPIRED,
        CANCELLED
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
        private String sender;
        private String recipient;
        private String tokenAddress;
        private String tokenSymbol;
        private BigInteger amount;
        private int decimals;
        private BigInteger l1GasUsed;
        private BigInteger l2GasUsed;
        private BigInteger fee;
        private Instant createdAt;
        private Instant confirmedAt;
        private Instant challengeEndAt;
        private Instant completedAt;
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
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        public String getRecipient() { return recipient; }
        public void setRecipient(String recipient) { this.recipient = recipient; }
        public String getTokenAddress() { return tokenAddress; }
        public void setTokenAddress(String tokenAddress) { this.tokenAddress = tokenAddress; }
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
        public Instant getConfirmedAt() { return confirmedAt; }
        public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }
        public Instant getChallengeEndAt() { return challengeEndAt; }
        public void setChallengeEndAt(Instant challengeEndAt) { this.challengeEndAt = challengeEndAt; }
        public Instant getCompletedAt() { return completedAt; }
        public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
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
    }

    /**
     * Retryable ticket for L1->L2 transactions
     */
    public static class RetryableTicket {
        private String ticketId;
        private String l1TxHash;
        private String sender;
        private String destination;
        private BigInteger l2CallValue;
        private BigInteger maxSubmissionCost;
        private BigInteger maxGas;
        private BigInteger gasPriceBid;
        private byte[] calldata;
        private RetryableStatus status;
        private Instant createdAt;
        private Instant expiresAt;
        private int retryCount;
        private String lastError;

        // Getters and Setters
        public String getTicketId() { return ticketId; }
        public void setTicketId(String ticketId) { this.ticketId = ticketId; }
        public String getL1TxHash() { return l1TxHash; }
        public void setL1TxHash(String l1TxHash) { this.l1TxHash = l1TxHash; }
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        public String getDestination() { return destination; }
        public void setDestination(String destination) { this.destination = destination; }
        public BigInteger getL2CallValue() { return l2CallValue; }
        public void setL2CallValue(BigInteger l2CallValue) { this.l2CallValue = l2CallValue; }
        public BigInteger getMaxSubmissionCost() { return maxSubmissionCost; }
        public void setMaxSubmissionCost(BigInteger maxSubmissionCost) { this.maxSubmissionCost = maxSubmissionCost; }
        public BigInteger getMaxGas() { return maxGas; }
        public void setMaxGas(BigInteger maxGas) { this.maxGas = maxGas; }
        public BigInteger getGasPriceBid() { return gasPriceBid; }
        public void setGasPriceBid(BigInteger gasPriceBid) { this.gasPriceBid = gasPriceBid; }
        public byte[] getCalldata() { return calldata; }
        public void setCalldata(byte[] calldata) { this.calldata = calldata; }
        public RetryableStatus getStatus() { return status; }
        public void setStatus(RetryableStatus status) { this.status = status; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Instant getExpiresAt() { return expiresAt; }
        public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
        public int getRetryCount() { return retryCount; }
        public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
        public String getLastError() { return lastError; }
        public void setLastError(String lastError) { this.lastError = lastError; }
    }

    // Configuration
    @ConfigProperty(name = "arbitrum.rpc.url", defaultValue = "https://arb1.arbitrum.io/rpc")
    String arbitrumRpcUrl;

    @ConfigProperty(name = "ethereum.rpc.url", defaultValue = "https://eth-mainnet.g.alchemy.com/v2/demo")
    String ethereumRpcUrl;

    @ConfigProperty(name = "arbitrum.chain.id", defaultValue = "42161")
    long chainId;

    @ConfigProperty(name = "arbitrum.confirmation.blocks.l1", defaultValue = "12")
    int l1ConfirmationBlocks;

    @ConfigProperty(name = "arbitrum.confirmation.blocks.l2", defaultValue = "1")
    int l2ConfirmationBlocks;

    // State management
    private final Map<String, BridgeTransaction> transactions = new ConcurrentHashMap<>();
    private final Map<String, RetryableTicket> retryableTickets = new ConcurrentHashMap<>();
    private final Map<String, List<String>> pendingWithdrawals = new ConcurrentHashMap<>();

    // Metrics
    private final AtomicLong totalDeposits = new AtomicLong(0);
    private final AtomicLong totalWithdrawals = new AtomicLong(0);
    private final AtomicLong successfulTransactions = new AtomicLong(0);
    private final AtomicLong failedTransactions = new AtomicLong(0);
    private final AtomicLong totalVolumeDeposited = new AtomicLong(0);
    private final AtomicLong totalVolumeWithdrawn = new AtomicLong(0);

    public ArbitrumBridge() {
        log.info("ArbitrumBridge initialized for chain ID: {}", chainId);
    }

    // L2Bridge Interface Implementation

    @Override
    public String getBridgeName() {
        return "Arbitrum Bridge";
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
        return CHALLENGE_PERIOD;
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

            log.info("ETH deposit initiated: {} ETH from {} to {}",
                tx.getFormattedAmount(), sender, recipient);

            // Process deposit asynchronously
            processDepositAsync(tx);

            return tx;
        });
    }

    /**
     * Deposit ERC20 token from L1 to L2
     */
    public Uni<BridgeTransaction> depositERC20(
            String sender,
            String recipient,
            String tokenAddress,
            String tokenSymbol,
            BigInteger amount,
            int decimals
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(recipient, "recipient");
            validateAddress(tokenAddress, "tokenAddress");
            validateAmount(amount);

            BridgeTransaction tx = new BridgeTransaction();
            tx.setTransactionId(generateTransactionId("DEP"));
            tx.setType(BridgeTransactionType.DEPOSIT_ERC20);
            tx.setStatus(BridgeStatus.PENDING);
            tx.setSender(sender);
            tx.setRecipient(recipient);
            tx.setTokenAddress(tokenAddress);
            tx.setTokenSymbol(tokenSymbol);
            tx.setAmount(amount);
            tx.setDecimals(decimals);

            // Estimate fees
            BigInteger fee = estimateDepositFee(amount, tokenAddress);
            tx.setFee(fee);

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalDeposits.incrementAndGet();

            log.info("{} deposit initiated: {} from {} to {}",
                tokenSymbol, tx.getFormattedAmount(), sender, recipient);

            // Process deposit asynchronously
            processDepositAsync(tx);

            return tx;
        });
    }

    /**
     * Withdraw ETH from L2 to L1
     */
    public Uni<BridgeTransaction> withdrawETH(
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

            log.info("ETH withdrawal initiated: {} ETH from {} to {} (challenge period: {})",
                tx.getFormattedAmount(), sender, recipient, CHALLENGE_PERIOD);

            // Process withdrawal asynchronously
            processWithdrawalAsync(tx);

            return tx;
        });
    }

    /**
     * Withdraw ERC20 token from L2 to L1
     */
    public Uni<BridgeTransaction> withdrawERC20(
            String sender,
            String recipient,
            String tokenAddress,
            String tokenSymbol,
            BigInteger amount,
            int decimals
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(recipient, "recipient");
            validateAddress(tokenAddress, "tokenAddress");
            validateAmount(amount);

            BridgeTransaction tx = new BridgeTransaction();
            tx.setTransactionId(generateTransactionId("WTH"));
            tx.setType(BridgeTransactionType.WITHDRAW_ERC20);
            tx.setStatus(BridgeStatus.PENDING);
            tx.setSender(sender);
            tx.setRecipient(recipient);
            tx.setTokenAddress(tokenAddress);
            tx.setTokenSymbol(tokenSymbol);
            tx.setAmount(amount);
            tx.setDecimals(decimals);

            // Estimate fees
            BigInteger fee = estimateWithdrawalFee(amount, tokenAddress);
            tx.setFee(fee);

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalWithdrawals.incrementAndGet();

            // Track pending withdrawal
            pendingWithdrawals.computeIfAbsent(sender, k -> new ArrayList<>())
                .add(tx.getTransactionId());

            log.info("{} withdrawal initiated: {} from {} to {} (challenge period: {})",
                tokenSymbol, tx.getFormattedAmount(), sender, recipient, CHALLENGE_PERIOD);

            // Process withdrawal asynchronously
            processWithdrawalAsync(tx);

            return tx;
        });
    }

    /**
     * Create a retryable ticket for L1->L2 message
     */
    public Uni<RetryableTicket> createRetryableTicket(
            String sender,
            String destination,
            BigInteger l2CallValue,
            BigInteger maxSubmissionCost,
            BigInteger maxGas,
            BigInteger gasPriceBid,
            byte[] calldata
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(destination, "destination");

            RetryableTicket ticket = new RetryableTicket();
            ticket.setTicketId(generateTransactionId("RTK"));
            ticket.setSender(sender);
            ticket.setDestination(destination);
            ticket.setL2CallValue(l2CallValue);
            ticket.setMaxSubmissionCost(maxSubmissionCost);
            ticket.setMaxGas(maxGas);
            ticket.setGasPriceBid(gasPriceBid);
            ticket.setCalldata(calldata);
            ticket.setStatus(RetryableStatus.CREATED);
            ticket.setCreatedAt(Instant.now());
            ticket.setExpiresAt(Instant.now().plus(Duration.ofDays(7)));
            ticket.setRetryCount(0);

            retryableTickets.put(ticket.getTicketId(), ticket);

            log.info("Retryable ticket created: {} from {} to {}",
                ticket.getTicketId(), sender, destination);

            return ticket;
        });
    }

    /**
     * Redeem a retryable ticket
     */
    public Uni<RetryableTicket> redeemRetryableTicket(String ticketId) {
        return Uni.createFrom().item(() -> {
            RetryableTicket ticket = retryableTickets.get(ticketId);
            if (ticket == null) {
                throw new ArbitrumBridgeException("Retryable ticket not found: " + ticketId);
            }

            if (ticket.getStatus() == RetryableStatus.REDEEMED) {
                throw new ArbitrumBridgeException("Ticket already redeemed");
            }

            if (Instant.now().isAfter(ticket.getExpiresAt())) {
                ticket.setStatus(RetryableStatus.EXPIRED);
                throw new ArbitrumBridgeException("Ticket has expired");
            }

            // Simulate redemption
            ticket.setStatus(RetryableStatus.REDEEMED);
            ticket.setRetryCount(ticket.getRetryCount() + 1);

            log.info("Retryable ticket redeemed: {}", ticketId);

            return ticket;
        });
    }

    /**
     * Claim a completed withdrawal after challenge period
     */
    public Uni<BridgeTransaction> claimWithdrawal(String transactionId) {
        return Uni.createFrom().item(() -> {
            BridgeTransaction tx = transactions.get(transactionId);
            if (tx == null) {
                throw new ArbitrumBridgeException("Transaction not found: " + transactionId);
            }

            if (tx.getType() != BridgeTransactionType.WITHDRAW_ETH &&
                tx.getType() != BridgeTransactionType.WITHDRAW_ERC20) {
                throw new ArbitrumBridgeException("Transaction is not a withdrawal");
            }

            if (tx.getStatus() != BridgeStatus.READY_TO_CLAIM) {
                if (tx.getStatus() == BridgeStatus.IN_CHALLENGE_PERIOD) {
                    Duration remaining = tx.getRemainingChallengeTime();
                    throw new ArbitrumBridgeException(
                        "Challenge period not complete. Time remaining: " + remaining);
                }
                throw new ArbitrumBridgeException(
                    "Withdrawal not ready to claim. Status: " + tx.getStatus());
            }

            // Simulate claim execution
            tx.setStatus(BridgeStatus.COMPLETED);
            tx.setCompletedAt(Instant.now());
            tx.setL1TxHash(generateTxHash());

            // Remove from pending
            List<String> pending = pendingWithdrawals.get(tx.getSender());
            if (pending != null) {
                pending.remove(transactionId);
            }

            successfulTransactions.incrementAndGet();
            totalVolumeWithdrawn.addAndGet(tx.getAmount().longValue());

            log.info("Withdrawal claimed: {} {} to {}",
                tx.getFormattedAmount(), tx.getTokenSymbol(), tx.getRecipient());

            return tx;
        });
    }

    /**
     * Get transaction status
     */
    public Uni<BridgeTransaction> getTransaction(String transactionId) {
        return Uni.createFrom().item(() -> {
            BridgeTransaction tx = transactions.get(transactionId);
            if (tx == null) {
                throw new ArbitrumBridgeException("Transaction not found: " + transactionId);
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
                .sorted((a, b) -> a.getChallengeEndAt().compareTo(b.getChallengeEndAt()))
                .toList();
        });
    }

    /**
     * Get withdrawals ready to claim
     */
    public Uni<List<BridgeTransaction>> getClaimableWithdrawals(String address) {
        return Uni.createFrom().item(() ->
            transactions.values().stream()
                .filter(tx -> address.equals(tx.getSender()))
                .filter(tx -> tx.getStatus() == BridgeStatus.READY_TO_CLAIM)
                .toList()
        );
    }

    /**
     * Estimate deposit fee
     */
    public BigInteger estimateDepositFee(BigInteger amount, String tokenAddress) {
        // Base fee + L2 execution cost
        BigInteger baseFee = new BigInteger("500000000000000"); // 0.0005 ETH
        BigInteger l2GasCost = new BigInteger("100000").multiply(new BigInteger("100000000")); // 100k gas * 0.1 gwei

        if (tokenAddress != null) {
            // ERC20 deposits require more gas
            l2GasCost = l2GasCost.multiply(BigInteger.valueOf(2));
        }

        return baseFee.add(l2GasCost);
    }

    /**
     * Estimate withdrawal fee
     */
    public BigInteger estimateWithdrawalFee(BigInteger amount, String tokenAddress) {
        // L2 fee + L1 execution cost (post challenge)
        BigInteger l2Fee = new BigInteger("200000000000000"); // 0.0002 ETH
        BigInteger l1Fee = new BigInteger("2000000000000000"); // 0.002 ETH for L1 execution

        if (tokenAddress != null) {
            // ERC20 withdrawals require more L1 gas
            l1Fee = l1Fee.multiply(BigInteger.valueOf(2));
        }

        return l2Fee.add(l1Fee);
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
            stats.totalVolumeDeposited = new BigDecimal(totalVolumeDeposited.get())
                .divide(BigDecimal.TEN.pow(18));
            stats.totalVolumeWithdrawn = new BigDecimal(totalVolumeWithdrawn.get())
                .divide(BigDecimal.TEN.pow(18));
            stats.challengePeriod = CHALLENGE_PERIOD;
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
                tx.setStatus(BridgeStatus.L1_CONFIRMED);

                // Simulate L2 confirmation (deposits are fast)
                Thread.sleep(Duration.ofSeconds(5).toMillis());
                tx.setL2TxHash(generateTxHash());
                tx.setStatus(BridgeStatus.COMPLETED);
                tx.setConfirmedAt(Instant.now());
                tx.setCompletedAt(Instant.now());

                successfulTransactions.incrementAndGet();
                totalVolumeDeposited.addAndGet(tx.getAmount().longValue());

                log.info("Deposit completed: {} {} - L2 TX: {}",
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
                Thread.sleep(Duration.ofSeconds(5).toMillis());
                tx.setL2TxHash(generateTxHash());
                tx.setStatus(BridgeStatus.L2_CONFIRMED);
                tx.setConfirmedAt(Instant.now());

                // Set challenge period end time
                tx.setChallengeEndAt(Instant.now().plus(CHALLENGE_PERIOD));
                tx.setStatus(BridgeStatus.IN_CHALLENGE_PERIOD);

                log.info("Withdrawal in challenge period: {} - ends at {}",
                    tx.getTransactionId(), tx.getChallengeEndAt());

                // Simulate challenge period (shortened for demo)
                Thread.sleep(Duration.ofSeconds(10).toMillis());

                tx.setStatus(BridgeStatus.READY_TO_CLAIM);

                log.info("Withdrawal ready to claim: {}", tx.getTransactionId());

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                tx.setStatus(BridgeStatus.FAILED);
                tx.setErrorMessage("Withdrawal processing interrupted");
                failedTransactions.incrementAndGet();
            }
        });
    }

    private void validateAddress(String address, String fieldName) {
        if (address == null || address.isEmpty()) {
            throw new ArbitrumBridgeException(fieldName + " address is required");
        }
        if (!address.matches("^0x[a-fA-F0-9]{40}$")) {
            throw new ArbitrumBridgeException("Invalid " + fieldName + " address format");
        }
    }

    private void validateAmount(BigInteger amount) {
        if (amount == null || amount.compareTo(BigInteger.ZERO) <= 0) {
            throw new ArbitrumBridgeException("Amount must be positive");
        }
    }

    private String generateTransactionId(String prefix) {
        return prefix + "-ARB-" + System.nanoTime() + "-" +
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
     * Arbitrum Bridge Exception
     */
    public static class ArbitrumBridgeException extends RuntimeException {
        public ArbitrumBridgeException(String message) {
            super(message);
        }

        public ArbitrumBridgeException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

package io.aurigraph.v11.crosschain.l2;

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
 * Base Bridge Implementation for Aurigraph V12
 *
 * Implements the Base (Coinbase L2) bridge protocol for secure asset transfers
 * between Ethereum L1 and Base L2.
 *
 * Base is built on the OP Stack (same as Optimism), so this implementation
 * reuses the Optimism bridge patterns with Base-specific configurations.
 *
 * Features:
 * - Standard Bridge for ETH and ERC20
 * - L1 to L2 Message Passing
 * - L2 to L1 Message Passing with Fault Proof
 * - 7-Day Withdrawal Period (OP Stack Standard)
 * - Native ETH Bridging (No WETH Required)
 * - ERC-20 Token Bridging via Gateway
 * - Coinbase Verification Integration
 * - Lower Fees than Ethereum Mainnet
 *
 * Base Network Features:
 * - Built on OP Stack (Optimism Bedrock)
 * - Sequencer operated by Coinbase
 * - Same security model as Optimism
 * - Native USDC support
 * - Coinbase custody integration
 *
 * @author Aurigraph V12 Integration Team
 * @version 12.0.0
 * @since 2025-01-01
 * @see <a href="https://docs.base.org">Base Documentation</a>
 */
@ApplicationScoped
public class BaseBridge implements L2Bridge {

    private static final Logger log = LoggerFactory.getLogger(BaseBridge.class);

    /**
     * Base Chain IDs
     */
    public static final long BASE_MAINNET_CHAIN_ID = 8453L;
    public static final long BASE_SEPOLIA_CHAIN_ID = 84532L;
    public static final long ETHEREUM_MAINNET_CHAIN_ID = 1L;

    /**
     * Base Contract Addresses (Mainnet)
     */
    public static final String L1_STANDARD_BRIDGE = "0x3154Cf16ccdb4C6d922629664174b904d80F2C35";
    public static final String L2_STANDARD_BRIDGE = "0x4200000000000000000000000000000000000010";
    public static final String L1_CROSS_DOMAIN_MESSENGER = "0x866E82a600A1414e583f7F13623F1aC5d58b0Afa";
    public static final String L2_CROSS_DOMAIN_MESSENGER = "0x4200000000000000000000000000000000000007";
    public static final String BASE_PORTAL = "0x49048044D57e1C92A77f79988d21Fa8fAF74E97e";
    public static final String L2_TO_L1_MESSAGE_PASSER = "0x4200000000000000000000000000000000000016";

    /**
     * Common Token Addresses on Base
     */
    public static final String USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    public static final String WETH_BASE = "0x4200000000000000000000000000000000000006";
    public static final String DAI_BASE = "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb";

    /**
     * Withdrawal period (7 days - same as Optimism)
     */
    public static final Duration WITHDRAWAL_PERIOD = Duration.ofDays(7);
    public static final Duration STATE_ROOT_PROPOSAL_TIME = Duration.ofHours(1);

    /**
     * Bridge transaction types
     */
    public enum BridgeTransactionType {
        DEPOSIT_ETH,
        DEPOSIT_ERC20,
        DEPOSIT_USDC,
        WITHDRAW_ETH,
        WITHDRAW_ERC20,
        WITHDRAW_USDC,
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
        private BigInteger l1Fee;
        private BigInteger l2Fee;
        private Instant createdAt;
        private Instant stateRootAt;
        private Instant provedAt;
        private Instant challengeEndAt;
        private Instant finalizedAt;
        private Instant completedAt;
        private String withdrawalHash;
        private String errorMessage;
        private boolean isCoinbaseVerified;
        private Map<String, Object> metadata;

        public BridgeTransaction() {
            this.metadata = new HashMap<>();
            this.createdAt = Instant.now();
            this.isCoinbaseVerified = false;
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
        public BigInteger getL1Fee() { return l1Fee; }
        public void setL1Fee(BigInteger l1Fee) { this.l1Fee = l1Fee; }
        public BigInteger getL2Fee() { return l2Fee; }
        public void setL2Fee(BigInteger l2Fee) { this.l2Fee = l2Fee; }
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
        public String getErrorMessage() { return errorMessage; }
        public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
        public boolean isCoinbaseVerified() { return isCoinbaseVerified; }
        public void setCoinbaseVerified(boolean coinbaseVerified) { isCoinbaseVerified = coinbaseVerified; }
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

        public BigDecimal getTotalFeeETH() {
            BigInteger total = (l1Fee != null ? l1Fee : BigInteger.ZERO)
                .add(l2Fee != null ? l2Fee : BigInteger.ZERO);
            return new BigDecimal(total).divide(BigDecimal.TEN.pow(18));
        }
    }

    // Configuration
    @ConfigProperty(name = "base.rpc.url", defaultValue = "https://mainnet.base.org")
    String baseRpcUrl;

    @ConfigProperty(name = "ethereum.rpc.url", defaultValue = "https://eth-mainnet.g.alchemy.com/v2/demo")
    String ethereumRpcUrl;

    @ConfigProperty(name = "base.chain.id", defaultValue = "8453")
    long chainId;

    @ConfigProperty(name = "base.confirmation.blocks.l1", defaultValue = "12")
    int l1ConfirmationBlocks;

    @ConfigProperty(name = "base.confirmation.blocks.l2", defaultValue = "1")
    int l2ConfirmationBlocks;

    // State management
    private final Map<String, BridgeTransaction> transactions = new ConcurrentHashMap<>();
    private final Map<String, List<String>> pendingWithdrawals = new ConcurrentHashMap<>();

    // Metrics
    private final AtomicLong totalDeposits = new AtomicLong(0);
    private final AtomicLong totalWithdrawals = new AtomicLong(0);
    private final AtomicLong successfulTransactions = new AtomicLong(0);
    private final AtomicLong failedTransactions = new AtomicLong(0);
    private final AtomicLong totalVolumeDeposited = new AtomicLong(0);
    private final AtomicLong totalVolumeWithdrawn = new AtomicLong(0);
    private final AtomicLong usdcVolume = new AtomicLong(0);

    public BaseBridge() {
        log.info("BaseBridge initialized for chain ID: {}", chainId);
    }

    // L2Bridge Interface Implementation

    @Override
    public String getBridgeName() {
        return "Base Bridge (Coinbase L2)";
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
     * Deposit ETH from L1 to Base
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

            // Estimate fees - Base has lower fees
            BigInteger[] fees = estimateDepositFees(amount, null);
            tx.setL1Fee(fees[0]);
            tx.setL2Fee(fees[1]);
            tx.setFee(fees[0].add(fees[1]));

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalDeposits.incrementAndGet();

            log.info("Base ETH deposit initiated: {} ETH from {} to {} (Fee: {} ETH)",
                tx.getFormattedAmount(), sender, recipient, tx.getTotalFeeETH());

            // Process deposit asynchronously
            processDepositAsync(tx);

            return tx;
        });
    }

    /**
     * Deposit ERC20 from L1 to Base
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
            BigInteger[] fees = estimateDepositFees(amount, l1Token);
            tx.setL1Fee(fees[0]);
            tx.setL2Fee(fees[1]);
            tx.setFee(fees[0].add(fees[1]));

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalDeposits.incrementAndGet();

            log.info("Base {} deposit initiated: {} from {} to {}",
                tokenSymbol, tx.getFormattedAmount(), sender, recipient);

            // Process deposit asynchronously
            processDepositAsync(tx);

            return tx;
        });
    }

    /**
     * Deposit USDC (native) from L1 to Base
     * Uses Circle's CCTP for native USDC bridging
     */
    public Uni<BridgeTransaction> depositUSDC(
            String sender,
            String recipient,
            BigInteger amount
    ) {
        return Uni.createFrom().item(() -> {
            validateAddress(sender, "sender");
            validateAddress(recipient, "recipient");
            validateAmount(amount);

            BridgeTransaction tx = new BridgeTransaction();
            tx.setTransactionId(generateTransactionId("USDC"));
            tx.setType(BridgeTransactionType.DEPOSIT_USDC);
            tx.setStatus(BridgeStatus.PENDING);
            tx.setSender(sender);
            tx.setRecipient(recipient);
            tx.setL2TokenAddress(USDC_BASE);
            tx.setTokenSymbol("USDC");
            tx.setAmount(amount);
            tx.setDecimals(6); // USDC has 6 decimals

            // USDC bridging has special fees
            BigInteger[] fees = estimateUSDCFees(amount);
            tx.setL1Fee(fees[0]);
            tx.setL2Fee(fees[1]);
            tx.setFee(fees[0].add(fees[1]));

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalDeposits.incrementAndGet();
            usdcVolume.addAndGet(amount.longValue());

            log.info("Base USDC deposit initiated: {} USDC from {} to {}",
                tx.getFormattedAmount(), sender, recipient);

            // Process deposit asynchronously
            processDepositAsync(tx);

            return tx;
        });
    }

    /**
     * Initiate ETH withdrawal from Base to L1
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
            BigInteger[] fees = estimateWithdrawalFees(amount, null);
            tx.setL1Fee(fees[0]);
            tx.setL2Fee(fees[1]);
            tx.setFee(fees[0].add(fees[1]));

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalWithdrawals.incrementAndGet();

            // Track pending withdrawal
            pendingWithdrawals.computeIfAbsent(sender, k -> new ArrayList<>())
                .add(tx.getTransactionId());

            log.info("Base ETH withdrawal initiated: {} ETH from {} to {} " +
                "(7-day challenge period applies)",
                tx.getFormattedAmount(), sender, recipient);

            // Process withdrawal asynchronously
            processWithdrawalAsync(tx);

            return tx;
        });
    }

    /**
     * Initiate ERC20 withdrawal from Base to L1
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
            BigInteger[] fees = estimateWithdrawalFees(amount, l1Token);
            tx.setL1Fee(fees[0]);
            tx.setL2Fee(fees[1]);
            tx.setFee(fees[0].add(fees[1]));

            // Store transaction
            transactions.put(tx.getTransactionId(), tx);
            totalWithdrawals.incrementAndGet();

            // Track pending withdrawal
            pendingWithdrawals.computeIfAbsent(sender, k -> new ArrayList<>())
                .add(tx.getTransactionId());

            log.info("Base {} withdrawal initiated: {} from {} to {}",
                tokenSymbol, tx.getFormattedAmount(), sender, recipient);

            // Process withdrawal asynchronously
            processWithdrawalAsync(tx);

            return tx;
        });
    }

    /**
     * Prove a withdrawal on L1
     */
    public Uni<BridgeTransaction> proveWithdrawal(String transactionId) {
        return Uni.createFrom().item(() -> {
            BridgeTransaction tx = transactions.get(transactionId);
            if (tx == null) {
                throw new BaseBridgeException("Transaction not found: " + transactionId);
            }

            if (tx.getStatus() != BridgeStatus.STATE_ROOT_PUBLISHED) {
                throw new BaseBridgeException(
                    "Withdrawal not ready to prove. Current status: " + tx.getStatus());
            }

            // Simulate proving
            tx.setProveHash(generateTxHash());
            tx.setProvedAt(Instant.now());
            tx.setChallengeEndAt(Instant.now().plus(WITHDRAWAL_PERIOD));
            tx.setStatus(BridgeStatus.IN_CHALLENGE_PERIOD);

            log.info("Base withdrawal proved: {} - Challenge ends at {}",
                transactionId, tx.getChallengeEndAt());

            // Simulate challenge period completion
            simulateChallengeCompletion(tx);

            return tx;
        });
    }

    /**
     * Finalize a withdrawal on L1
     */
    public Uni<BridgeTransaction> finalizeWithdrawal(String transactionId) {
        return Uni.createFrom().item(() -> {
            BridgeTransaction tx = transactions.get(transactionId);
            if (tx == null) {
                throw new BaseBridgeException("Transaction not found: " + transactionId);
            }

            if (tx.getStatus() != BridgeStatus.READY_TO_FINALIZE) {
                if (tx.getStatus() == BridgeStatus.IN_CHALLENGE_PERIOD) {
                    Duration remaining = tx.getRemainingChallengeTime();
                    throw new BaseBridgeException(
                        "Challenge period not complete. Time remaining: " + remaining);
                }
                throw new BaseBridgeException(
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

            log.info("Base withdrawal finalized: {} {} to {}",
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
                throw new BaseBridgeException("Transaction not found: " + transactionId);
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
     * Estimate deposit fees (L1 + L2)
     */
    public BigInteger[] estimateDepositFees(BigInteger amount, String tokenAddress) {
        // Base has lower L2 fees than Ethereum
        BigInteger l1Gas = new BigInteger("150000").multiply(new BigInteger("25000000000")); // 150k gas * 25 gwei
        BigInteger l2Gas = new BigInteger("100000").multiply(new BigInteger("100000")); // Very low L2 fees

        if (tokenAddress != null) {
            l1Gas = l1Gas.multiply(BigInteger.valueOf(2));
        }

        return new BigInteger[]{l1Gas, l2Gas};
    }

    /**
     * Estimate USDC bridging fees
     */
    public BigInteger[] estimateUSDCFees(BigInteger amount) {
        // USDC via CCTP has different fee structure
        BigInteger l1Fee = new BigInteger("300000000000000"); // 0.0003 ETH
        BigInteger l2Fee = new BigInteger("50000000000000"); // 0.00005 ETH
        return new BigInteger[]{l1Fee, l2Fee};
    }

    /**
     * Estimate withdrawal fees
     */
    public BigInteger[] estimateWithdrawalFees(BigInteger amount, String tokenAddress) {
        // L2 initiation + L1 prove + L1 finalize
        BigInteger l2Fee = new BigInteger("200000000000000"); // 0.0002 ETH (L2 is cheap)
        BigInteger l1Fee = new BigInteger("5000000000000000"); // 0.005 ETH (prove + finalize on L1)

        if (tokenAddress != null) {
            l1Fee = l1Fee.multiply(BigInteger.valueOf(2));
        }

        return new BigInteger[]{l1Fee, l2Fee};
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
            stats.usdcVolume = new BigDecimal(usdcVolume.get())
                .divide(BigDecimal.TEN.pow(6));
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
        public BigDecimal usdcVolume;
        public Duration challengePeriod;
        public boolean isActive;
    }

    // Private helper methods

    private void processDepositAsync(BridgeTransaction tx) {
        Thread.ofVirtual().start(() -> {
            try {
                // Simulate L1 confirmation
                Thread.sleep(Duration.ofSeconds(12).toMillis());
                tx.setL1TxHash(generateTxHash());
                tx.setStatus(BridgeStatus.L1_INITIATED);

                // Simulate L2 confirmation (deposits are fast on Base ~1-2 minutes)
                Thread.sleep(Duration.ofSeconds(3).toMillis());
                tx.setL2TxHash(generateTxHash());
                tx.setStatus(BridgeStatus.COMPLETED);
                tx.setCompletedAt(Instant.now());

                successfulTransactions.incrementAndGet();
                totalVolumeDeposited.addAndGet(tx.getAmount().longValue());

                log.info("Base deposit completed: {} {} - L2 TX: {}",
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
                Thread.sleep(Duration.ofSeconds(2).toMillis());
                tx.setL2TxHash(generateTxHash());
                tx.setWithdrawalHash(generateTxHash());
                tx.setStatus(BridgeStatus.WITHDRAWAL_INITIATED);

                log.info("Base withdrawal initiated on L2: {} - waiting for state root",
                    tx.getTransactionId());

                // Simulate state root publication
                Thread.sleep(Duration.ofSeconds(5).toMillis());
                tx.setStateRootAt(Instant.now());
                tx.setStatus(BridgeStatus.STATE_ROOT_PUBLISHED);

                log.info("State root published for Base withdrawal: {} - ready to prove",
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

                log.info("Challenge period complete for Base withdrawal: {} - ready to finalize",
                    tx.getTransactionId());

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }

    private void validateAddress(String address, String fieldName) {
        if (address == null || address.isEmpty()) {
            throw new BaseBridgeException(fieldName + " address is required");
        }
        if (!address.matches("^0x[a-fA-F0-9]{40}$")) {
            throw new BaseBridgeException("Invalid " + fieldName + " address format");
        }
    }

    private void validateAmount(BigInteger amount) {
        if (amount == null || amount.compareTo(BigInteger.ZERO) <= 0) {
            throw new BaseBridgeException("Amount must be positive");
        }
    }

    private String generateTransactionId(String prefix) {
        return prefix + "-BASE-" + System.nanoTime() + "-" +
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
     * Base Bridge Exception
     */
    public static class BaseBridgeException extends RuntimeException {
        public BaseBridgeException(String message) {
            super(message);
        }

        public BaseBridgeException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

package io.aurigraph.v11.services;

import io.aurigraph.v11.models.BridgeTransaction;
import io.aurigraph.v11.models.BridgeTransaction.*;
import io.aurigraph.v11.models.BridgeTransactionHistory;
import io.aurigraph.v11.models.BridgeTransactionHistory.*;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Bridge History Service
 * Provides cross-chain bridge transaction history with pagination and filtering
 *
 * @author Aurigraph V11
 * @version 11.1.0
 */
@ApplicationScoped
public class BridgeHistoryService {

    private static final Logger LOG = Logger.getLogger(BridgeHistoryService.class);

    private final List<BridgeTransaction> transactionDatabase = new ArrayList<>();
    private final Random random = new Random();

    private static final String[] CHAINS = {"Aurigraph", "Ethereum", "BSC", "Polygon", "Avalanche"};
    private static final String[] ASSETS = {"AUR", "ETH", "BNB", "MATIC", "AVAX", "USDT", "USDC", "DAI"};
    private static final String[] STATUSES = {"completed", "completed", "completed", "pending", "processing", "failed"};

    public BridgeHistoryService() {
        initializeTransactionHistory();
    }

    /**
     * Initialize simulated transaction history
     */
    private void initializeTransactionHistory() {
        LOG.info("Initializing bridge transaction history database...");

        for (int i = 0; i < 500; i++) {
            transactionDatabase.add(generateTransaction(i));
        }

        LOG.infof("Initialized %d bridge transactions", transactionDatabase.size());
    }

    /**
     * Generate a simulated bridge transaction
     */
    private BridgeTransaction generateTransaction(int index) {
        BridgeTransaction tx = new BridgeTransaction();

        String sourceChain = CHAINS[random.nextInt(CHAINS.length)];
        String targetChain;
        do {
            targetChain = CHAINS[random.nextInt(CHAINS.length)];
        } while (targetChain.equals(sourceChain));

        String asset = ASSETS[random.nextInt(ASSETS.length)];
        String status = STATUSES[random.nextInt(STATUSES.length)];

        tx.setTransactionId("btx-" + UUID.randomUUID().toString().substring(0, 16));
        tx.setBridgeId("bridge-" + targetChain.toLowerCase().substring(0, 3) + "-001");
        tx.setSourceChain(sourceChain);
        tx.setTargetChain(targetChain);
        tx.setUserAddress("0x" + generateRandomHex(40));

        // Asset info
        tx.setAsset(new AssetInfo(asset, asset + " Token", "0x" + generateRandomHex(40), 18));

        // Amount
        double amount = 1.0 + (random.nextDouble() * 10000.0);
        double price = 1.0 + (random.nextDouble() * 3000.0);
        tx.setAmount(String.format("%.6f", amount));
        tx.setAmountUsd(amount * price);

        tx.setStatus(status);

        // Timestamps
        tx.setTimestamps(generateTimestamps(status));

        // Source transaction
        tx.setSourceTransaction(generateChainTransaction(sourceChain, true));

        // Target transaction (only if completed)
        if ("completed".equals(status)) {
            tx.setTargetTransaction(generateChainTransaction(targetChain, false));
        }

        // Fees
        tx.setFees(generateFees(tx.getAmountUsd()));

        // Confirmations
        tx.setConfirmations(generateConfirmations(status));

        // Error (only for failed transactions)
        if ("failed".equals(status)) {
            tx.setError(new TransactionError("INSUFFICIENT_LIQUIDITY", "Insufficient liquidity on target chain"));
            tx.getError().setRetryCount(random.nextInt(3));
            tx.getError().setCanRetry(true);
        }

        return tx;
    }

    /**
     * Generate transaction timestamps
     */
    private TransactionTimestamps generateTimestamps(String status) {
        TransactionTimestamps ts = new TransactionTimestamps();

        Instant initiated = Instant.now().minusSeconds(random.nextInt(86400 * 7)); // Last 7 days
        ts.setInitiated(initiated);

        if ("completed".equals(status)) {
            ts.setSourceConfirmed(initiated.plusSeconds(30 + random.nextInt(60)));
            ts.setBridgeStarted(ts.getSourceConfirmed().plusSeconds(10 + random.nextInt(20)));
            ts.setBridgeCompleted(ts.getBridgeStarted().plusSeconds(15 + random.nextInt(30)));
            ts.setTargetConfirmed(ts.getBridgeCompleted().plusSeconds(30 + random.nextInt(60)));

            long duration = java.time.Duration.between(initiated, ts.getTargetConfirmed()).getSeconds();
            ts.setTotalDurationSeconds(duration);
        } else if ("processing".equals(status) || "pending".equals(status)) {
            ts.setSourceConfirmed(initiated.plusSeconds(30 + random.nextInt(60)));
            ts.setBridgeStarted(ts.getSourceConfirmed().plusSeconds(10 + random.nextInt(20)));
        } else if ("failed".equals(status)) {
            ts.setSourceConfirmed(initiated.plusSeconds(30 + random.nextInt(60)));
            long duration = java.time.Duration.between(initiated, ts.getSourceConfirmed()).getSeconds();
            ts.setTotalDurationSeconds(duration);
        }

        return ts;
    }

    /**
     * Generate chain transaction details
     */
    private ChainTransaction generateChainTransaction(String chain, boolean isSource) {
        ChainTransaction chainTx = new ChainTransaction();

        chainTx.setTransactionHash("0x" + generateRandomHex(64));
        chainTx.setBlockNumber(15000000 + random.nextInt(1000000));
        chainTx.setBlockHash("0x" + generateRandomHex(64));
        chainTx.setFromAddress("0x" + generateRandomHex(40));
        chainTx.setToAddress("0x" + generateRandomHex(40));
        chainTx.setGasUsed(50000 + random.nextInt(200000));
        chainTx.setGasPriceGwei(10.0 + (random.nextDouble() * 100.0));

        return chainTx;
    }

    /**
     * Generate transaction fees
     */
    private TransactionFees generateFees(double amountUsd) {
        TransactionFees fees = new TransactionFees();

        fees.setSourceGasFeeUsd(2.0 + (random.nextDouble() * 8.0));
        fees.setBridgeFeeUsd(amountUsd * (0.001 + (random.nextDouble() * 0.004))); // 0.1-0.5%
        fees.setTargetGasFeeUsd(1.5 + (random.nextDouble() * 6.0));

        double total = fees.getSourceGasFeeUsd() + fees.getBridgeFeeUsd() + fees.getTargetGasFeeUsd();
        fees.setTotalFeeUsd(total);
        fees.setFeePercentage((total / amountUsd) * 100.0);

        return fees;
    }

    /**
     * Generate confirmations info
     */
    private ConfirmationInfo generateConfirmations(String status) {
        ConfirmationInfo conf = new ConfirmationInfo();

        conf.setSourceRequiredConfirmations(12);
        conf.setTargetRequiredConfirmations(12);

        if ("completed".equals(status)) {
            conf.setSourceConfirmations(12 + random.nextInt(50));
            conf.setTargetConfirmations(12 + random.nextInt(50));
            conf.setFinalized(true);
        } else if ("processing".equals(status)) {
            conf.setSourceConfirmations(12 + random.nextInt(10));
            conf.setTargetConfirmations(random.nextInt(8));
            conf.setFinalized(false);
        } else if ("pending".equals(status)) {
            conf.setSourceConfirmations(random.nextInt(12));
            conf.setTargetConfirmations(0);
            conf.setFinalized(false);
        } else {
            conf.setSourceConfirmations(0);
            conf.setTargetConfirmations(0);
            conf.setFinalized(false);
        }

        return conf;
    }

    /**
     * Generate random hex string
     */
    private String generateRandomHex(int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(Integer.toHexString(random.nextInt(16)));
        }
        return sb.toString();
    }

    /**
     * Get transaction history with pagination and filters
     */
    public Uni<BridgeTransactionHistory> getTransactionHistory(
            int page, int pageSize,
            String sourceChain, String targetChain, String asset, String status,
            String userAddress, Double minAmount, Double maxAmount
    ) {
        return Uni.createFrom().item(() -> {
            // Apply filters
            List<BridgeTransaction> filtered = transactionDatabase.stream()
                    .filter(tx -> sourceChain == null || tx.getSourceChain().equalsIgnoreCase(sourceChain))
                    .filter(tx -> targetChain == null || tx.getTargetChain().equalsIgnoreCase(targetChain))
                    .filter(tx -> asset == null || tx.getAsset().getSymbol().equalsIgnoreCase(asset))
                    .filter(tx -> status == null || tx.getStatus().equalsIgnoreCase(status))
                    .filter(tx -> userAddress == null || tx.getUserAddress().equalsIgnoreCase(userAddress))
                    .filter(tx -> minAmount == null || tx.getAmountUsd() >= minAmount)
                    .filter(tx -> maxAmount == null || tx.getAmountUsd() <= maxAmount)
                    .sorted((a, b) -> b.getTimestamps().getInitiated().compareTo(a.getTimestamps().getInitiated()))
                    .collect(Collectors.toList());

            // Calculate pagination
            long totalRecords = filtered.size();
            int totalPages = (int) Math.ceil((double) totalRecords / pageSize);
            int startIndex = (page - 1) * pageSize;
            int endIndex = Math.min(startIndex + pageSize, filtered.size());

            List<BridgeTransaction> paginated = startIndex < filtered.size()
                    ? filtered.subList(startIndex, endIndex)
                    : new ArrayList<>();

            // Build response
            BridgeTransactionHistory history = new BridgeTransactionHistory();
            history.setTransactions(paginated);

            // Pagination info
            PaginationInfo pagination = new PaginationInfo();
            pagination.setPage(page);
            pagination.setPageSize(pageSize);
            pagination.setTotalPages(totalPages);
            pagination.setTotalRecords(totalRecords);
            pagination.setHasNext(page < totalPages);
            pagination.setHasPrevious(page > 1);
            history.setPagination(pagination);

            // Filters applied
            FiltersApplied filters = new FiltersApplied();
            filters.setSourceChain(sourceChain);
            filters.setTargetChain(targetChain);
            filters.setAsset(asset);
            filters.setStatus(status);
            filters.setUserAddress(userAddress);
            filters.setMinAmountUsd(minAmount);
            filters.setMaxAmountUsd(maxAmount);
            history.setFiltersApplied(filters);

            // Summary
            history.setSummary(calculateSummary(filtered));

            LOG.debugf("Retrieved %d transactions (page %d/%d, total: %d)",
                    paginated.size(), page, totalPages, totalRecords);

            return history;
        });
    }

    /**
     * Get transaction by ID
     */
    public Uni<BridgeTransaction> getTransactionById(String transactionId) {
        return Uni.createFrom().item(() ->
                transactionDatabase.stream()
                        .filter(tx -> tx.getTransactionId().equals(transactionId))
                        .findFirst()
                        .orElse(null)
        );
    }

    /**
     * Calculate history summary
     */
    private HistorySummary calculateSummary(List<BridgeTransaction> transactions) {
        HistorySummary summary = new HistorySummary();

        summary.setTotalTransactions(transactions.size());
        summary.setTotalVolumeUsd(transactions.stream()
                .mapToDouble(BridgeTransaction::getAmountUsd)
                .sum());
        summary.setCompletedCount(transactions.stream()
                .filter(tx -> "completed".equals(tx.getStatus()))
                .count());
        summary.setPendingCount(transactions.stream()
                .filter(tx -> "pending".equals(tx.getStatus()) || "processing".equals(tx.getStatus()))
                .count());
        summary.setFailedCount(transactions.stream()
                .filter(tx -> "failed".equals(tx.getStatus()))
                .count());

        double avgDuration = transactions.stream()
                .filter(tx -> "completed".equals(tx.getStatus()))
                .mapToLong(tx -> tx.getTimestamps().getTotalDurationSeconds())
                .average()
                .orElse(0.0);
        summary.setAverageDurationSeconds(avgDuration);

        return summary;
    }
}

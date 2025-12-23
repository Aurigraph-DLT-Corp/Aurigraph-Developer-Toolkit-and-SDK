package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.util.*;

/**
 * Statistics for fractional ownership of a token
 */
public class FractionalOwnershipStats {
    private final String tokenId;
    private final int totalShares;
    private final int shareHolderCount;
    private final BigDecimal shareValue;
    private final BigDecimal totalDividendsDistributed;
    private final List<ShareTransaction> transactionHistory;

    public FractionalOwnershipStats(String tokenId, int totalShares, int shareHolderCount,
                                   BigDecimal shareValue, BigDecimal totalDividendsDistributed,
                                   List<ShareTransaction> transactionHistory) {
        this.tokenId = tokenId;
        this.totalShares = totalShares;
        this.shareHolderCount = shareHolderCount;
        this.shareValue = shareValue;
        this.totalDividendsDistributed = totalDividendsDistributed;
        this.transactionHistory = new ArrayList<>(transactionHistory);
    }

    public BigDecimal getTotalAssetValue() {
        return shareValue.multiply(new BigDecimal(totalShares));
    }

    public BigDecimal getAverageSharesPerHolder() {
        if (shareHolderCount == 0) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(totalShares).divide(new BigDecimal(shareHolderCount), 2, 
                                                 java.math.RoundingMode.HALF_UP);
    }

    public int getTransactionCount() {
        return transactionHistory.size();
    }

    // Getters
    public String getTokenId() { return tokenId; }
    public int getTotalShares() { return totalShares; }
    public int getShareHolderCount() { return shareHolderCount; }
    public BigDecimal getShareValue() { return shareValue; }
    public BigDecimal getTotalDividendsDistributed() { return totalDividendsDistributed; }
    public List<ShareTransaction> getTransactionHistory() { return List.copyOf(transactionHistory); }
}
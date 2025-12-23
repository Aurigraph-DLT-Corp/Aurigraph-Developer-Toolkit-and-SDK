package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Represents a holder of fractional shares in an asset
 */
public class ShareHolder {
    private final String address;
    private int shareCount;
    private final Instant firstPurchaseDate;
    private Instant lastTransactionDate;
    private BigDecimal totalDividendsReceived;
    private List<SharePurchase> purchaseHistory;

    public ShareHolder(String address, int shareCount, Instant firstPurchaseDate) {
        this.address = address;
        this.shareCount = shareCount;
        this.firstPurchaseDate = firstPurchaseDate;
        this.lastTransactionDate = firstPurchaseDate;
        this.totalDividendsReceived = BigDecimal.ZERO;
        this.purchaseHistory = new ArrayList<>();
    }

    public void addShares(int shares) {
        this.shareCount += shares;
        this.lastTransactionDate = Instant.now();
    }

    public void reduceShares(int shares) {
        if (shares > this.shareCount) {
            throw new IllegalArgumentException("Cannot reduce more shares than owned");
        }
        this.shareCount -= shares;
        this.lastTransactionDate = Instant.now();
    }

    public void addDividendReceived(BigDecimal amount) {
        this.totalDividendsReceived = this.totalDividendsReceived.add(amount);
    }

    public void recordPurchase(int shares, BigDecimal pricePerShare, Instant purchaseDate) {
        SharePurchase purchase = new SharePurchase(shares, pricePerShare, purchaseDate);
        purchaseHistory.add(purchase);
        this.lastTransactionDate = purchaseDate;
    }

    // Getters
    public String getAddress() { return address; }
    public int getShareCount() { return shareCount; }
    public Instant getFirstPurchaseDate() { return firstPurchaseDate; }
    public Instant getLastTransactionDate() { return lastTransactionDate; }
    public BigDecimal getTotalDividendsReceived() { return totalDividendsReceived; }
    public List<SharePurchase> getPurchaseHistory() { return List.copyOf(purchaseHistory); }

    /**
     * Share purchase record
     */
    public static class SharePurchase {
        private final int shares;
        private final BigDecimal pricePerShare;
        private final Instant purchaseDate;

        public SharePurchase(int shares, BigDecimal pricePerShare, Instant purchaseDate) {
            this.shares = shares;
            this.pricePerShare = pricePerShare;
            this.purchaseDate = purchaseDate;
        }

        public int getShares() { return shares; }
        public BigDecimal getPricePerShare() { return pricePerShare; }
        public Instant getPurchaseDate() { return purchaseDate; }
        public BigDecimal getTotalValue() { return pricePerShare.multiply(new BigDecimal(shares)); }
    }
}
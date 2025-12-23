package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Represents a share transaction between parties
 */
public class ShareTransaction {
    private final String transactionId;
    private final String tokenId;
    private final String fromAddress;
    private final String toAddress;
    private final int shareCount;
    private final BigDecimal pricePerShare;
    private final Instant transactionDate;
    private final BigDecimal totalValue;

    public ShareTransaction(String transactionId, String tokenId, String fromAddress, 
                           String toAddress, int shareCount, BigDecimal pricePerShare, 
                           Instant transactionDate) {
        this.transactionId = transactionId;
        this.tokenId = tokenId;
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.shareCount = shareCount;
        this.pricePerShare = pricePerShare;
        this.transactionDate = transactionDate;
        this.totalValue = pricePerShare.multiply(new BigDecimal(shareCount));
    }

    // Getters
    public String getTransactionId() { return transactionId; }
    public String getTokenId() { return tokenId; }
    public String getFromAddress() { return fromAddress; }
    public String getToAddress() { return toAddress; }
    public int getShareCount() { return shareCount; }
    public BigDecimal getPricePerShare() { return pricePerShare; }
    public Instant getTransactionDate() { return transactionDate; }
    public BigDecimal getTotalValue() { return totalValue; }

    @Override
    public String toString() {
        return String.format("ShareTransaction{id='%s', token='%s', from='%s', to='%s', shares=%d, price=%s}",
            transactionId, tokenId, fromAddress, toAddress, shareCount, pricePerShare);
    }
}
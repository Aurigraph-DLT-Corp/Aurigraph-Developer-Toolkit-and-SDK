package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;

/**
 * Information about a shareholder's position
 */
public class ShareHolderInfo {
    private final String holderAddress;
    private final int shareCount;
    private final BigDecimal totalValue;
    private final BigDecimal ownershipPercentage;
    private final int votingPower;

    public ShareHolderInfo(String holderAddress, int shareCount, BigDecimal totalValue,
                          BigDecimal ownershipPercentage, int votingPower) {
        this.holderAddress = holderAddress;
        this.shareCount = shareCount;
        this.totalValue = totalValue;
        this.ownershipPercentage = ownershipPercentage;
        this.votingPower = votingPower;
    }

    // Getters
    public String getHolderAddress() { return holderAddress; }
    public int getShareCount() { return shareCount; }
    public BigDecimal getTotalValue() { return totalValue; }
    public BigDecimal getOwnershipPercentage() { return ownershipPercentage; }
    public int getVotingPower() { return votingPower; }

    @Override
    public String toString() {
        return String.format("ShareHolderInfo{address='%s', shares=%d, value=%s, ownership=%s%%}",
            holderAddress, shareCount, totalValue, ownershipPercentage);
    }
}
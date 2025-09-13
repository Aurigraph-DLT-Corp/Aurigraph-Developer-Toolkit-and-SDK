package io.aurigraph.v11.contracts.composite;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Owner Token (ERC-721) - Tracks ownership, transfer history, and ownership percentages
 * Part of composite token package - wAUR-OWNER-{ID}
 */
public class OwnerToken extends SecondaryToken {
    private String currentOwner;
    private BigDecimal ownershipPercentage;
    private List<OwnershipTransfer> transferHistory;
    private boolean isFractional;
    private Map<String, BigDecimal> shareholderMap; // For fractional ownership

    public OwnerToken(String tokenId, String compositeId, String currentOwner, 
                      BigDecimal ownershipPercentage, List<OwnershipTransfer> transferHistory) {
        super(tokenId, compositeId, SecondaryTokenType.OWNER);
        this.currentOwner = currentOwner;
        this.ownershipPercentage = ownershipPercentage;
        this.transferHistory = new ArrayList<>(transferHistory);
        this.isFractional = ownershipPercentage.compareTo(BigDecimal.valueOf(100)) < 0;
    }

    /**
     * Record a transfer of ownership
     */
    public void recordTransfer(String fromAddress, String toAddress) {
        recordTransfer(fromAddress, toAddress, ownershipPercentage);
    }

    /**
     * Record a fractional transfer
     */
    public void recordTransfer(String fromAddress, String toAddress, BigDecimal percentage) {
        OwnershipTransfer transfer = new OwnershipTransfer(
            fromAddress, toAddress, percentage, Instant.now(), 
            generateTransferHash(fromAddress, toAddress, percentage)
        );
        
        transferHistory.add(transfer);
        
        // Update current owner if full transfer
        if (percentage.equals(ownershipPercentage)) {
            this.currentOwner = toAddress;
        } else {
            // Handle fractional ownership
            this.isFractional = true;
            if (shareholderMap != null) {
                // Reduce from sender
                BigDecimal senderCurrent = shareholderMap.getOrDefault(fromAddress, BigDecimal.ZERO);
                shareholderMap.put(fromAddress, senderCurrent.subtract(percentage));
                
                // Add to receiver
                BigDecimal receiverCurrent = shareholderMap.getOrDefault(toAddress, BigDecimal.ZERO);
                shareholderMap.put(toAddress, receiverCurrent.add(percentage));
            }
        }
        
        setLastUpdated(Instant.now());
    }

    /**
     * Get ownership percentage for a specific address
     */
    public BigDecimal getOwnershipPercentage(String address) {
        if (!isFractional) {
            return address.equals(currentOwner) ? ownershipPercentage : BigDecimal.ZERO;
        }
        return shareholderMap != null ? shareholderMap.getOrDefault(address, BigDecimal.ZERO) : BigDecimal.ZERO;
    }

    /**
     * Check if address has voting rights
     */
    public boolean hasVotingRights(String address) {
        return getOwnershipPercentage(address).compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Calculate voting weight for address
     */
    public BigDecimal getVotingWeight(String address) {
        return getOwnershipPercentage(address);
    }

    /**
     * Get all shareholders (for fractional ownership)
     */
    public Map<String, BigDecimal> getAllShareholders() {
        return shareholderMap != null ? Map.copyOf(shareholderMap) : Map.of(currentOwner, ownershipPercentage);
    }

    @Override
    public void updateData(Map<String, Object> updateData) {
        if (updateData.containsKey("currentOwner")) {
            this.currentOwner = (String) updateData.get("currentOwner");
        }
        if (updateData.containsKey("ownershipPercentage")) {
            this.ownershipPercentage = new BigDecimal(updateData.get("ownershipPercentage").toString());
        }
        if (updateData.containsKey("isFractional")) {
            this.isFractional = (Boolean) updateData.get("isFractional");
        }
        setLastUpdated(Instant.now());
    }

    private String generateTransferHash(String from, String to, BigDecimal percentage) {
        return String.format("transfer-%s-%s-%s-%d", 
            from.substring(0, 8), to.substring(0, 8), 
            percentage.toString(), System.nanoTime());
    }

    // Getters
    public String getCurrentOwner() { return currentOwner; }
    public BigDecimal getOwnershipPercentage() { return ownershipPercentage; }
    public List<OwnershipTransfer> getTransferHistory() { return List.copyOf(transferHistory); }
    public boolean isFractional() { return isFractional; }

    // Setters
    public void setCurrentOwner(String currentOwner) { this.currentOwner = currentOwner; }
    public void setOwnershipPercentage(BigDecimal ownershipPercentage) { this.ownershipPercentage = ownershipPercentage; }
    public void setFractional(boolean fractional) { this.isFractional = fractional; }
    public void setShareholderMap(Map<String, BigDecimal> shareholderMap) { this.shareholderMap = shareholderMap; }
}

/**
 * Represents a single ownership transfer event
 */
class OwnershipTransfer {
    private final String fromAddress;
    private final String toAddress;
    private final BigDecimal percentage;
    private final Instant timestamp;
    private final String transactionHash;

    public OwnershipTransfer(String fromAddress, String toAddress, BigDecimal percentage, 
                           Instant timestamp, String transactionHash) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.percentage = percentage;
        this.timestamp = timestamp;
        this.transactionHash = transactionHash;
    }

    // Getters
    public String getFromAddress() { return fromAddress; }
    public String getToAddress() { return toAddress; }
    public BigDecimal getPercentage() { return percentage; }
    public Instant getTimestamp() { return timestamp; }
    public String getTransactionHash() { return transactionHash; }
}
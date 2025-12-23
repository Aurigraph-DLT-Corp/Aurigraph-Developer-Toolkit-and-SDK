package io.aurigraph.v11.contracts.rwa;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * RWA Token - Asset-backed wAUR tokens representing real-world assets
 * Features: Fractional ownership, quantum-safe security, real-time valuation
 */
public class RWAToken {
    
    @JsonProperty("tokenId")
    private String tokenId;
    
    @JsonProperty("assetId")
    private String assetId; // Unique identifier of the underlying asset
    
    @JsonProperty("assetType")
    private String assetType; // CARBON_CREDIT, REAL_ESTATE, FINANCIAL, etc.
    
    @JsonProperty("assetValue")
    private BigDecimal assetValue; // Current market value of underlying asset
    
    @JsonProperty("tokenSupply")
    private BigDecimal tokenSupply; // Total token supply for this asset
    
    @JsonProperty("ownerAddress")
    private String ownerAddress; // Current token owner
    
    @JsonProperty("digitalTwinId")
    private String digitalTwinId; // Associated digital twin ID
    
    @JsonProperty("createdAt")
    private Instant createdAt;
    
    @JsonProperty("lastTransferAt")
    private Instant lastTransferAt;
    
    @JsonProperty("lastValuationUpdate")
    private Instant lastValuationUpdate;
    
    @JsonProperty("burnedAt")
    private Instant burnedAt;
    
    @JsonProperty("status")
    private TokenStatus status;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    @JsonProperty("quantumSafe")
    private boolean quantumSafe = true;
    
    @JsonProperty("fractionSize")
    private BigDecimal fractionSize; // Size of each token fraction
    
    @JsonProperty("totalFractions")
    private long totalFractions; // Total number of fractions
    
    @JsonProperty("availableFractions")
    private long availableFractions; // Available fractions for trading
    
    @JsonProperty("yield")
    private BigDecimal currentYield; // Current yield/returns (if applicable)
    
    @JsonProperty("riskScore")
    private int riskScore; // AI-calculated risk score (1-10)
    
    @JsonProperty("liquidityScore")
    private double liquidityScore; // Liquidity assessment (0-100)
    
    @JsonProperty("verificationLevel")
    private VerificationLevel verificationLevel;
    
    @JsonProperty("regulatoryCompliance")
    private Set<String> regulatoryCompliance; // Compliance certifications
    
    @JsonProperty("transferHistory")
    private List<TokenTransfer> transferHistory;

    // Default constructor
    public RWAToken() {
        this.metadata = new HashMap<>();
        this.regulatoryCompliance = new HashSet<>();
        this.transferHistory = new ArrayList<>();
        this.status = TokenStatus.PENDING;
        this.verificationLevel = VerificationLevel.BASIC;
        this.currentYield = BigDecimal.ZERO;
        this.riskScore = 5; // Medium risk by default
        this.liquidityScore = 50.0; // Medium liquidity by default
    }

    // Builder pattern
    public static RWATokenBuilder builder() {
        return new RWATokenBuilder();
    }

    /**
     * Calculate token value per fraction
     */
    public BigDecimal getValuePerToken() {
        if (tokenSupply.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return assetValue.divide(tokenSupply, 8, java.math.RoundingMode.HALF_UP);
    }

    /**
     * Calculate total value owned by current holder
     */
    public BigDecimal getTotalOwnedValue() {
        return getValuePerToken().multiply(tokenSupply);
    }

    /**
     * Check if token represents full asset ownership
     */
    public boolean isFullOwnership() {
        return totalFractions == 1;
    }

    /**
     * Calculate ownership percentage
     */
    public BigDecimal getOwnershipPercentage() {
        if (totalFractions == 0) {
            return BigDecimal.ZERO;
        }
        return tokenSupply.divide(new BigDecimal(totalFractions), 4, java.math.RoundingMode.HALF_UP)
                         .multiply(new BigDecimal(100));
    }

    /**
     * Add transfer to history
     */
    public void addTransfer(String fromAddress, String toAddress, BigDecimal amount, String transactionHash) {
        TokenTransfer transfer = new TokenTransfer(
            fromAddress, toAddress, amount, Instant.now(), transactionHash
        );
        transferHistory.add(transfer);
        lastTransferAt = Instant.now();
    }

    /**
     * Update asset valuation
     */
    public void updateValuation(BigDecimal newValue, String source) {
        this.assetValue = newValue;
        this.lastValuationUpdate = Instant.now();
        
        // Add valuation source to metadata
        metadata.put("lastValuationSource", source);
        metadata.put("lastValuationUpdate", lastValuationUpdate.toString());
    }

    /**
     * Add regulatory compliance certification
     */
    public void addComplianceCertification(String certification) {
        regulatoryCompliance.add(certification);
        metadata.put("complianceUpdated", Instant.now().toString());
    }

    /**
     * Check if token is tradeable
     */
    public boolean isTradeable() {
        return status == TokenStatus.ACTIVE && 
               verificationLevel != VerificationLevel.NONE &&
               !regulatoryCompliance.isEmpty();
    }

    /**
     * Calculate annualized return
     */
    public BigDecimal getAnnualizedReturn() {
        if (currentYield == null || currentYield.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        
        // Simple annualization (actual calculation would be more complex)
        return currentYield.multiply(new BigDecimal(12)); // Assuming monthly yield
    }

    // Getters and setters
    public String getTokenId() { return tokenId; }
    public void setTokenId(String tokenId) { this.tokenId = tokenId; }
    
    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }
    
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    
    public BigDecimal getAssetValue() { return assetValue; }
    public void setAssetValue(BigDecimal assetValue) { this.assetValue = assetValue; }
    
    public BigDecimal getTokenSupply() { return tokenSupply; }
    public void setTokenSupply(BigDecimal tokenSupply) { this.tokenSupply = tokenSupply; }
    
    public String getOwnerAddress() { return ownerAddress; }
    public void setOwnerAddress(String ownerAddress) { this.ownerAddress = ownerAddress; }
    
    public String getDigitalTwinId() { return digitalTwinId; }
    public void setDigitalTwinId(String digitalTwinId) { this.digitalTwinId = digitalTwinId; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getLastTransferAt() { return lastTransferAt; }
    public void setLastTransferAt(Instant lastTransferAt) { this.lastTransferAt = lastTransferAt; }
    
    public Instant getLastValuationUpdate() { return lastValuationUpdate; }
    public void setLastValuationUpdate(Instant lastValuationUpdate) { this.lastValuationUpdate = lastValuationUpdate; }
    
    public Instant getBurnedAt() { return burnedAt; }
    public void setBurnedAt(Instant burnedAt) { this.burnedAt = burnedAt; }
    
    public TokenStatus getStatus() { return status; }
    public void setStatus(TokenStatus status) { this.status = status; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    public boolean isQuantumSafe() { return quantumSafe; }
    public void setQuantumSafe(boolean quantumSafe) { this.quantumSafe = quantumSafe; }
    
    public BigDecimal getFractionSize() { return fractionSize; }
    public void setFractionSize(BigDecimal fractionSize) { this.fractionSize = fractionSize; }
    
    public long getTotalFractions() { return totalFractions; }
    public void setTotalFractions(long totalFractions) { this.totalFractions = totalFractions; }
    
    public long getAvailableFractions() { return availableFractions; }
    public void setAvailableFractions(long availableFractions) { this.availableFractions = availableFractions; }
    
    public BigDecimal getCurrentYield() { return currentYield; }
    public void setCurrentYield(BigDecimal currentYield) { this.currentYield = currentYield; }
    
    public int getRiskScore() { return riskScore; }
    public void setRiskScore(int riskScore) { this.riskScore = riskScore; }
    
    public double getLiquidityScore() { return liquidityScore; }
    public void setLiquidityScore(double liquidityScore) { this.liquidityScore = liquidityScore; }
    
    public VerificationLevel getVerificationLevel() { return verificationLevel; }
    public void setVerificationLevel(VerificationLevel verificationLevel) { this.verificationLevel = verificationLevel; }
    
    public Set<String> getRegulatoryCompliance() { return regulatoryCompliance; }
    public void setRegulatoryCompliance(Set<String> regulatoryCompliance) { this.regulatoryCompliance = regulatoryCompliance; }
    
    public List<TokenTransfer> getTransferHistory() { return transferHistory; }
    public void setTransferHistory(List<TokenTransfer> transferHistory) { this.transferHistory = transferHistory; }

    @Override
    public String toString() {
        return String.format("RWAToken{id='%s', asset='%s', type='%s', value=%s, owner='%s', status=%s}",
            tokenId, assetId, assetType, assetValue, ownerAddress, status);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RWAToken rwaToken = (RWAToken) o;
        return Objects.equals(tokenId, rwaToken.tokenId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tokenId);
    }

    // Builder class
    public static class RWATokenBuilder {
        private RWAToken token = new RWAToken();
        
        public RWATokenBuilder tokenId(String tokenId) {
            token.tokenId = tokenId;
            return this;
        }
        
        public RWATokenBuilder assetId(String assetId) {
            token.assetId = assetId;
            return this;
        }
        
        public RWATokenBuilder assetType(String assetType) {
            token.assetType = assetType;
            return this;
        }
        
        public RWATokenBuilder assetValue(BigDecimal assetValue) {
            token.assetValue = assetValue;
            return this;
        }
        
        public RWATokenBuilder tokenSupply(BigDecimal tokenSupply) {
            token.tokenSupply = tokenSupply;
            return this;
        }
        
        public RWATokenBuilder ownerAddress(String ownerAddress) {
            token.ownerAddress = ownerAddress;
            return this;
        }
        
        public RWATokenBuilder digitalTwinId(String digitalTwinId) {
            token.digitalTwinId = digitalTwinId;
            return this;
        }
        
        public RWATokenBuilder metadata(Map<String, Object> metadata) {
            token.metadata = metadata != null ? metadata : new HashMap<>();
            return this;
        }
        
        public RWATokenBuilder status(TokenStatus status) {
            token.status = status;
            return this;
        }
        
        public RWATokenBuilder quantumSafe(boolean quantumSafe) {
            token.quantumSafe = quantumSafe;
            return this;
        }
        
        public RWATokenBuilder fractionSize(BigDecimal fractionSize) {
            token.fractionSize = fractionSize;
            return this;
        }
        
        public RWATokenBuilder totalFractions(long totalFractions) {
            token.totalFractions = totalFractions;
            return this;
        }
        
        public RWATokenBuilder currentYield(BigDecimal currentYield) {
            token.currentYield = currentYield;
            return this;
        }
        
        public RWATokenBuilder riskScore(int riskScore) {
            token.riskScore = riskScore;
            return this;
        }
        
        public RWATokenBuilder liquidityScore(double liquidityScore) {
            token.liquidityScore = liquidityScore;
            return this;
        }
        
        public RWATokenBuilder verificationLevel(VerificationLevel verificationLevel) {
            token.verificationLevel = verificationLevel;
            return this;
        }
        
        public RWATokenBuilder createdAt(Instant createdAt) {
            token.createdAt = createdAt;
            return this;
        }
        
        public RWAToken build() {
            // Set defaults
            if (token.createdAt == null) {
                token.createdAt = Instant.now();
            }
            if (token.metadata == null) {
                token.metadata = new HashMap<>();
            }
            if (token.regulatoryCompliance == null) {
                token.regulatoryCompliance = new HashSet<>();
            }
            if (token.transferHistory == null) {
                token.transferHistory = new ArrayList<>();
            }
            
            // Calculate fractions if not set
            if (token.totalFractions == 0 && token.fractionSize != null && 
                token.assetValue != null && token.fractionSize.compareTo(BigDecimal.ZERO) > 0) {
                token.totalFractions = token.assetValue.divide(token.fractionSize, 
                    java.math.RoundingMode.UP).longValue();
            }
            
            token.availableFractions = token.totalFractions;
            
            return token;
        }
    }
}

// Supporting enums and classes

enum TokenStatus {
    PENDING, ACTIVE, SUSPENDED, BURNED
}

enum VerificationLevel {
    NONE,       // No verification
    BASIC,      // Basic document verification
    ENHANCED,   // Enhanced due diligence
    CERTIFIED,  // Third-party certified
    AUDITED     // Full audit completed
}

class TokenTransfer {
    private final String fromAddress;
    private final String toAddress;
    private final BigDecimal amount;
    private final Instant timestamp;
    private final String transactionHash;

    public TokenTransfer(String fromAddress, String toAddress, BigDecimal amount, 
                        Instant timestamp, String transactionHash) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = timestamp;
        this.transactionHash = transactionHash;
    }

    // Getters
    public String getFromAddress() { return fromAddress; }
    public String getToAddress() { return toAddress; }
    public BigDecimal getAmount() { return amount; }
    public Instant getTimestamp() { return timestamp; }
    public String getTransactionHash() { return transactionHash; }

    @Override
    public String toString() {
        return String.format("TokenTransfer{from='%s', to='%s', amount=%s, time=%s}",
            fromAddress, toAddress, amount, timestamp);
    }
}
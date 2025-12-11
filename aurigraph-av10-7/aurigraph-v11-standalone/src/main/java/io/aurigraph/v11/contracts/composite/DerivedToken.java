package io.aurigraph.v11.contracts.composite;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

/**
 * Derived Token - Token derived from primary token with independent value
 *
 * Derived tokens represent fractional ownership, income streams, or collateral
 * positions derived from the primary token. They can be transferred independently.
 *
 * Derivation Types:
 * - FRACTIONAL_SHARE: Fractional ownership of the primary asset
 * - RENTAL_INCOME: Rights to rental income from the asset
 * - COLLATERAL: Collateralized position against the asset
 * - DIVIDEND: Rights to dividend/income distributions
 * - USAGE_RIGHTS: Rights to use the asset
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-601-05
 */
public class DerivedToken {

    private String tokenId;
    private String parentTokenId;        // Reference to PrimaryToken
    private String compositeId;          // Reference to CompositeToken
    private DerivationType derivationType;
    private String ownerAddress;
    private BigDecimal value;            // Current value
    private BigDecimal sharePercentage;  // For fractional shares (0-100)
    private String currency;             // Value currency (USD, EUR, etc.)
    private boolean transferable;        // Can be transferred independently
    private boolean active;              // Is this derivation active
    private Instant createdAt;
    private Instant expiresAt;           // Expiry for time-limited derivations
    private Map<String, Object> terms;   // Terms and conditions
    private Map<String, Object> metadata;

    /**
     * Derivation Type Enum
     */
    public enum DerivationType {
        FRACTIONAL_SHARE("FSH", "Fractional Share", true),
        RENTAL_INCOME("RNT", "Rental Income", true),
        COLLATERAL("COL", "Collateral Position", true),
        DIVIDEND("DIV", "Dividend Rights", true),
        USAGE_RIGHTS("USG", "Usage Rights", false),
        ROYALTY("ROY", "Royalty Rights", true),
        STAKING("STK", "Staking Position", true),
        LIQUIDITY("LIQ", "Liquidity Position", true);

        private final String prefix;
        private final String displayName;
        private final boolean hasValue;

        DerivationType(String prefix, String displayName, boolean hasValue) {
            this.prefix = prefix;
            this.displayName = displayName;
            this.hasValue = hasValue;
        }

        public String getPrefix() { return prefix; }
        public String getDisplayName() { return displayName; }
        public boolean hasValue() { return hasValue; }
    }

    private DerivedToken() {
        this.terms = new HashMap<>();
        this.metadata = new HashMap<>();
        this.transferable = true;
        this.active = true;
        this.createdAt = Instant.now();
    }

    /**
     * Builder pattern
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private DerivedToken token = new DerivedToken();

        public Builder tokenId(String tokenId) {
            token.tokenId = tokenId;
            return this;
        }

        public Builder parentTokenId(String parentTokenId) {
            token.parentTokenId = parentTokenId;
            return this;
        }

        public Builder compositeId(String compositeId) {
            token.compositeId = compositeId;
            return this;
        }

        public Builder derivationType(DerivationType derivationType) {
            token.derivationType = derivationType;
            return this;
        }

        public Builder ownerAddress(String ownerAddress) {
            token.ownerAddress = ownerAddress;
            return this;
        }

        public Builder value(BigDecimal value) {
            token.value = value;
            return this;
        }

        public Builder sharePercentage(BigDecimal sharePercentage) {
            token.sharePercentage = sharePercentage;
            return this;
        }

        public Builder currency(String currency) {
            token.currency = currency;
            return this;
        }

        public Builder transferable(boolean transferable) {
            token.transferable = transferable;
            return this;
        }

        public Builder active(boolean active) {
            token.active = active;
            return this;
        }

        public Builder expiresAt(Instant expiresAt) {
            token.expiresAt = expiresAt;
            return this;
        }

        public Builder addTerm(String key, Object value) {
            token.terms.put(key, value);
            return this;
        }

        public Builder addMetadata(String key, Object value) {
            token.metadata.put(key, value);
            return this;
        }

        public DerivedToken build() {
            if (token.tokenId == null) {
                token.tokenId = generateTokenId(token.derivationType, token.parentTokenId);
            }
            if (token.currency == null) {
                token.currency = "USD";
            }
            return token;
        }

        private String generateTokenId(DerivationType type, String parentId) {
            String prefix = type != null ? type.getPrefix() : "DT";
            String parentRef = parentId != null ? parentId.substring(0, Math.min(8, parentId.length())) : "unknown";
            return "DT-" + prefix + "-" + parentRef + "-" + System.currentTimeMillis() % 100000;
        }
    }

    /**
     * Transfer this derived token to a new owner
     */
    public void transfer(String newOwnerAddress) {
        if (!transferable) {
            throw new IllegalStateException("This derived token is not transferable");
        }
        if (!active) {
            throw new IllegalStateException("This derived token is not active");
        }
        this.ownerAddress = newOwnerAddress;
        this.metadata.put("lastTransferAt", Instant.now().toString());
    }

    /**
     * Deactivate this derived token
     */
    public void deactivate() {
        this.active = false;
        this.metadata.put("deactivatedAt", Instant.now().toString());
    }

    /**
     * Check if expired
     */
    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    /**
     * Calculate value based on parent token value and share percentage
     */
    public BigDecimal calculateValue(BigDecimal parentValue) {
        if (sharePercentage != null && parentValue != null) {
            return parentValue.multiply(sharePercentage).divide(BigDecimal.valueOf(100));
        }
        return value;
    }

    /**
     * Calculate hash for Merkle tree
     */
    public String calculateHash() {
        StringBuilder sb = new StringBuilder();
        sb.append(tokenId);
        sb.append(parentTokenId);
        sb.append(derivationType.name());
        sb.append(ownerAddress);
        sb.append(value != null ? value.toString() : "");
        sb.append(sharePercentage != null ? sharePercentage.toString() : "");
        sb.append(createdAt.toString());

        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(sb.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    // Getters
    public String getTokenId() { return tokenId; }
    public String getParentTokenId() { return parentTokenId; }
    public String getCompositeId() { return compositeId; }
    public DerivationType getDerivationType() { return derivationType; }
    public String getOwnerAddress() { return ownerAddress; }
    public BigDecimal getValue() { return value; }
    public BigDecimal getSharePercentage() { return sharePercentage; }
    public String getCurrency() { return currency; }
    public boolean isTransferable() { return transferable; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public Map<String, Object> getTerms() { return terms; }
    public Map<String, Object> getMetadata() { return metadata; }

    // Setters for value updates
    public void setValue(BigDecimal value) { this.value = value; }
    public void setSharePercentage(BigDecimal sharePercentage) { this.sharePercentage = sharePercentage; }
}

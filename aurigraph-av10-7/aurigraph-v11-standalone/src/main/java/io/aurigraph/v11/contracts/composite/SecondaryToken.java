package io.aurigraph.v11.contracts.composite;

import java.time.Instant;
import java.util.Map;

/**
 * Abstract base class for all secondary tokens in composite token packages
 * Follows ERC-1155 multi-token standard for efficient batch operations
 */
public abstract class SecondaryToken {
    protected String tokenId;
    protected String compositeId;
    protected SecondaryTokenType tokenType;
    protected Instant createdAt;
    protected Instant lastUpdated;
    protected boolean active;

    public SecondaryToken(String tokenId, String compositeId, SecondaryTokenType tokenType) {
        this.tokenId = tokenId;
        this.compositeId = compositeId;
        this.tokenType = tokenType;
        this.createdAt = Instant.now();
        this.lastUpdated = Instant.now();
        this.active = true;
    }

    // Abstract method for updating token-specific data
    public abstract void updateData(Map<String, Object> updateData);

    // Getters and setters
    public String getTokenId() { return tokenId; }
    public String getCompositeId() { return compositeId; }
    public SecondaryTokenType getTokenType() { return tokenType; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}

/**
 * Enumeration of secondary token types in composite packages
 */
enum SecondaryTokenType {
    OWNER,        // wAUR-OWNER-{ID} - Ownership and transfer history (ERC-721)
    COLLATERAL,   // wAUR-COLL-{ID}[] - Collateral assets and insurance (ERC-1155)
    MEDIA,        // wAUR-MEDIA-{ID}[] - Images, videos, documents (ERC-1155)
    VERIFICATION, // wAUR-VERIFY-{ID} - Third-party verification results (ERC-721)
    VALUATION,    // wAUR-VALUE-{ID} - Real-time pricing and market data (ERC-20)
    COMPLIANCE    // wAUR-COMPLY-{ID} - Regulatory compliance status (ERC-721)
}
package io.aurigraph.v11.contracts.composite.repository.postgres;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA Entity for persisting SecondaryToken records
 * Mapped to 'secondary_tokens' table
 *
 * Supports all secondary token types:
 * - OWNER: Ownership token with transfer history
 * - VERIFICATION: Verification status and results
 * - VALUATION: Current value and price history
 * - COLLATERAL: Collateral assets
 * - MEDIA: Media assets (documents, images)
 * - COMPLIANCE: Compliance status and data
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: PostgreSQL Persistence)
 * @author Aurigraph V12 Development Team
 */
@Entity
@Table(name = "secondary_tokens", indexes = {
    @Index(name = "idx_st_token_id", columnList = "token_id", unique = true),
    @Index(name = "idx_st_composite_id", columnList = "composite_id"),
    @Index(name = "idx_st_token_type", columnList = "token_type"),
    @Index(name = "idx_st_composite_type", columnList = "composite_id, token_type", unique = true)
})
public class SecondaryTokenEntity extends PanacheEntity {

    @Column(name = "token_id", nullable = false, unique = true, length = 100)
    public String tokenId;

    @Column(name = "composite_id", nullable = false, length = 100)
    public String compositeId;

    @Column(name = "token_type", nullable = false, length = 20)
    public String tokenType;  // OWNER, VERIFICATION, VALUATION, COLLATERAL, MEDIA, COMPLIANCE

    @Column(name = "data", columnDefinition = "TEXT")
    public String data;  // Generic data as JSON

    @Column(name = "type_data", columnDefinition = "TEXT")
    public String typeData;  // Type-specific data as JSON

    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt = Instant.now();

    @Column(name = "last_updated")
    public Instant lastUpdated = Instant.now();

    @PreUpdate
    public void updateTimestamp() {
        this.lastUpdated = Instant.now();
    }
}

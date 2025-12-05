package io.aurigraph.v11.contracts.composite.repository.postgres;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * JPA Entity for persisting CompositeToken records
 * Mapped to 'composite_tokens' table
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: PostgreSQL Persistence)
 * @author Aurigraph V12 Development Team
 */
@Entity
@Table(name = "composite_tokens", indexes = {
    @Index(name = "idx_ct_composite_id", columnList = "composite_id", unique = true),
    @Index(name = "idx_ct_asset_id", columnList = "asset_id"),
    @Index(name = "idx_ct_asset_type", columnList = "asset_type"),
    @Index(name = "idx_ct_owner", columnList = "owner_address"),
    @Index(name = "idx_ct_status", columnList = "status"),
    @Index(name = "idx_ct_verification_level", columnList = "verification_level")
})
public class CompositeTokenEntity extends PanacheEntity {

    @Column(name = "composite_id", nullable = false, unique = true, length = 100)
    public String compositeId;

    @Column(name = "asset_id", nullable = false, length = 200)
    public String assetId;

    @Column(name = "asset_type", nullable = false, length = 50)
    public String assetType;

    @Column(name = "asset_value", precision = 38, scale = 18)
    public BigDecimal assetValue;

    @Column(name = "owner_address", nullable = false, length = 100)
    public String ownerAddress;

    @Column(name = "status", nullable = false, length = 30)
    public String status;  // PENDING_VERIFICATION, VERIFIED, REJECTED, SUSPENDED, TRANSFERRED

    @Column(name = "verification_level", length = 20)
    public String verificationLevel;  // BASIC, STANDARD, ENHANCED, INSTITUTIONAL, CRITICAL

    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;  // JSON string of metadata

    @Column(name = "primary_token_id", length = 100)
    public String primaryTokenId;

    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    public Instant updatedAt = Instant.now();

    @Column(name = "verified_at")
    public Instant verifiedAt;

    @Column(name = "verification_workflow_id", length = 100)
    public String verificationWorkflowId;

    @Column(name = "hash", length = 200)
    public String hash;

    @PreUpdate
    public void updateTimestamp() {
        this.updatedAt = Instant.now();
    }
}

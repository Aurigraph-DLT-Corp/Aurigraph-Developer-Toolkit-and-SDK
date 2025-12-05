package io.aurigraph.v11.contracts.composite.repository.postgres;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * JPA Entity for persisting VerificationWorkflow records
 * Mapped to 'verification_workflows' table
 *
 * Stores complete verification workflow state including:
 * - Workflow status and progress
 * - Assigned verifiers
 * - Verification results
 * - Fee calculations
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: PostgreSQL Persistence)
 * @author Aurigraph V12 Development Team
 */
@Entity
@Table(name = "verification_workflows", indexes = {
    @Index(name = "idx_vw_workflow_id", columnList = "workflow_id", unique = true),
    @Index(name = "idx_vw_composite_id", columnList = "composite_id"),
    @Index(name = "idx_vw_status", columnList = "status"),
    @Index(name = "idx_vw_payer", columnList = "payer_address"),
    @Index(name = "idx_vw_created_at", columnList = "created_at")
})
public class VerificationWorkflowEntity extends PanacheEntity {

    @Column(name = "workflow_id", nullable = false, unique = true, length = 100)
    public String workflowId;

    @Column(name = "composite_id", nullable = false, length = 100)
    public String compositeId;

    @Column(name = "asset_type", nullable = false, length = 50)
    public String assetType;

    @Column(name = "required_level", nullable = false, length = 20)
    public String requiredLevel;  // BASIC, STANDARD, ENHANCED, INSTITUTIONAL, CRITICAL

    @Column(name = "status", nullable = false, length = 30)
    public String status;  // PENDING_VERIFIERS, IN_PROGRESS, PENDING_CONSENSUS, COMPLETED, REJECTED, CANCELLED, EXPIRED

    @Column(name = "payer_address", nullable = false, length = 100)
    public String payerAddress;

    @Column(name = "total_fee", precision = 38, scale = 18)
    public BigDecimal totalFee;

    @Column(name = "fee_paid")
    public boolean feePaid;

    @Column(name = "verifier_count")
    public int verifierCount;

    @Column(name = "required_consensus")
    public int requiredConsensus;

    @Column(name = "assigned_verifiers", columnDefinition = "TEXT")
    public String assignedVerifiers;  // JSON array of verifier IDs

    @Column(name = "verification_results", columnDefinition = "TEXT")
    public String verificationResults;  // JSON array of results

    @Column(name = "consensus_level", length = 20)
    public String consensusLevel;  // Final consensus verification level

    @Column(name = "consensus_message", columnDefinition = "TEXT")
    public String consensusMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt = Instant.now();

    @Column(name = "started_at")
    public Instant startedAt;

    @Column(name = "completed_at")
    public Instant completedAt;

    @Column(name = "expires_at")
    public Instant expiresAt;

    @PreUpdate
    public void updateTimestamp() {
        // No automatic update timestamp - workflow tracks specific events
    }
}

package io.aurigraph.v11.contracts.composite.repository.postgres;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA Entity for persisting VerificationAudit records
 * Mapped to 'verification_audits' table
 *
 * Stores audit trail entries for verification workflows.
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: PostgreSQL Persistence)
 * @author Aurigraph V12 Development Team
 */
@Entity
@Table(name = "verification_audits", indexes = {
    @Index(name = "idx_va_entry_id", columnList = "entry_id", unique = true),
    @Index(name = "idx_va_workflow_id", columnList = "workflow_id"),
    @Index(name = "idx_va_action", columnList = "action"),
    @Index(name = "idx_va_actor", columnList = "actor"),
    @Index(name = "idx_va_timestamp", columnList = "timestamp")
})
public class VerificationAuditEntity extends PanacheEntity {

    @Column(name = "entry_id", nullable = false, unique = true, length = 100)
    public String entryId;

    @Column(name = "workflow_id", nullable = false, length = 100)
    public String workflowId;

    @Column(name = "action", nullable = false, length = 30)
    public String action;  // INITIATED, VERIFIER_ASSIGNED, RESULT_SUBMITTED, CONSENSUS_REACHED, COMPLETED, etc.

    @Column(name = "actor", length = 200)
    public String actor;  // Verifier ID, system, or user who performed the action

    @Column(name = "details", columnDefinition = "TEXT")
    public String details;  // JSON details of the action

    @Column(name = "timestamp", nullable = false)
    public Instant timestamp = Instant.now();

    @Column(name = "previous_status", length = 30)
    public String previousStatus;

    @Column(name = "new_status", length = 30)
    public String newStatus;
}

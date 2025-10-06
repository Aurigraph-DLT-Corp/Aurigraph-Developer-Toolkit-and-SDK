package io.aurigraph.v11.contracts.rwa.compliance.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for storing AML screening records
 * AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
@Entity
@Table(name = "aml_screening_records", indexes = {
    @Index(name = "idx_aml_user_id", columnList = "user_id"),
    @Index(name = "idx_aml_risk_score", columnList = "risk_score"),
    @Index(name = "idx_aml_created", columnList = "created_at")
})
public class AMLScreeningRecord extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "user_id", nullable = false, length = 100)
    public String userId;

    @Column(name = "screening_id", unique = true, length = 100)
    public String screeningId;

    @Column(name = "jurisdiction", nullable = false, length = 10)
    public String jurisdiction;

    @Column(name = "risk_score", nullable = false)
    public Integer riskScore;

    @Column(name = "risk_level", nullable = false, length = 20)
    public String riskLevel;

    @Column(name = "pep_status", nullable = false)
    public Boolean pepStatus;

    @Column(name = "sanctions_hit", nullable = false)
    public Boolean sanctionsHit;

    @Column(name = "adverse_media", nullable = false)
    public Boolean adverseMedia;

    @Column(name = "screening_status", nullable = false, length = 20)
    public String screeningStatus;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "next_review_date")
    public LocalDateTime nextReviewDate;

    @Column(name = "flags", columnDefinition = "TEXT")
    public String flags; // JSON serialized list of flags

    @Column(name = "notes", columnDefinition = "TEXT")
    public String notes;

    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Static query methods
    public static AMLScreeningRecord findByUserId(String userId) {
        return find("userId = ?1 ORDER BY createdAt DESC", userId).firstResult();
    }

    public static java.util.List<AMLScreeningRecord> findHighRisk() {
        return find("riskLevel = 'HIGH' ORDER BY riskScore DESC, createdAt DESC").list();
    }

    public static java.util.List<AMLScreeningRecord> findByRiskLevel(String riskLevel) {
        return find("riskLevel = ?1 ORDER BY createdAt DESC", riskLevel).list();
    }

    public static java.util.List<AMLScreeningRecord> findDueForReview() {
        return find("nextReviewDate <= CURRENT_TIMESTAMP AND screeningStatus = 'ACTIVE'").list();
    }

    public static long countByRiskLevel(String riskLevel) {
        return count("riskLevel", riskLevel);
    }
}

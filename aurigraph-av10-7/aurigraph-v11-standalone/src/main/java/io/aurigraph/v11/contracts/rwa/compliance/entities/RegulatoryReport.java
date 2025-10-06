package io.aurigraph.v11.contracts.rwa.compliance.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for storing regulatory reports (CTR, SAR, etc.)
 * AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
@Entity
@Table(name = "regulatory_reports", indexes = {
    @Index(name = "idx_reg_report_type", columnList = "report_type"),
    @Index(name = "idx_reg_report_status", columnList = "status"),
    @Index(name = "idx_reg_jurisdiction", columnList = "jurisdiction"),
    @Index(name = "idx_reg_created", columnList = "created_at")
})
public class RegulatoryReport extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "report_id", unique = true, length = 100)
    public String reportId;

    @Column(name = "report_type", nullable = false, length = 50)
    public String reportType; // CTR, SAR, TRANSACTION_REPORT, AUDIT_REPORT

    @Column(name = "jurisdiction", nullable = false, length = 10)
    public String jurisdiction;

    @Column(name = "filing_period_start", nullable = false)
    public LocalDateTime filingPeriodStart;

    @Column(name = "filing_period_end", nullable = false)
    public LocalDateTime filingPeriodEnd;

    @Column(name = "status", nullable = false, length = 20)
    public String status; // DRAFT, PENDING_REVIEW, APPROVED, SUBMITTED, REJECTED

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "submitted_at")
    public LocalDateTime submittedAt;

    @Column(name = "submitted_by", length = 100)
    public String submittedBy;

    @Column(name = "approved_at")
    public LocalDateTime approvedAt;

    @Column(name = "approved_by", length = 100)
    public String approvedBy;

    @Column(name = "filing_reference", length = 200)
    public String filingReference;

    @Column(name = "regulator_name", length = 200)
    public String regulatorName;

    @Column(name = "report_data", columnDefinition = "TEXT")
    public String reportData; // JSON serialized report content

    @Column(name = "transaction_count")
    public Integer transactionCount;

    @Column(name = "total_volume")
    public String totalVolume;

    @Column(name = "suspicious_activity_count")
    public Integer suspiciousActivityCount;

    @Column(name = "attachments", columnDefinition = "TEXT")
    public String attachments; // JSON serialized list of attachment references

    @Column(name = "notes", columnDefinition = "TEXT")
    public String notes;

    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Static query methods
    public static java.util.List<RegulatoryReport> findByType(String reportType) {
        return find("reportType = ?1 ORDER BY createdAt DESC", reportType).list();
    }

    public static java.util.List<RegulatoryReport> findByStatus(String status) {
        return find("status = ?1 ORDER BY createdAt DESC", status).list();
    }

    public static java.util.List<RegulatoryReport> findByJurisdiction(String jurisdiction) {
        return find("jurisdiction = ?1 ORDER BY createdAt DESC", jurisdiction).list();
    }

    public static java.util.List<RegulatoryReport> findPendingSubmission() {
        return find("status IN ('APPROVED', 'PENDING_REVIEW') AND submittedAt IS NULL ORDER BY filingPeriodEnd ASC").list();
    }

    public static java.util.List<RegulatoryReport> findByPeriod(LocalDateTime start, LocalDateTime end) {
        return find("filingPeriodStart >= ?1 AND filingPeriodEnd <= ?2 ORDER BY filingPeriodStart DESC", start, end).list();
    }

    public static long countByStatusAndType(String status, String reportType) {
        return count("status = ?1 AND reportType = ?2", status, reportType);
    }
}

package io.aurigraph.v11.contracts.rwa.compliance.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Entity for storing KYC verification records
 * AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
@Entity
@Table(name = "kyc_verification_records", indexes = {
    @Index(name = "idx_kyc_user_id", columnList = "user_id"),
    @Index(name = "idx_kyc_status", columnList = "verification_status"),
    @Index(name = "idx_kyc_created", columnList = "created_at")
})
public class KYCVerificationRecord extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "user_id", nullable = false, length = 100)
    public String userId;

    @Column(name = "address", length = 500)
    public String address;

    @Column(name = "jurisdiction", nullable = false, length = 10)
    public String jurisdiction;

    @Column(name = "provider", nullable = false, length = 50)
    public String provider;

    @Column(name = "verification_status", nullable = false, length = 20)
    public String verificationStatus;

    @Column(name = "risk_level", length = 20)
    public String riskLevel;

    @Column(name = "verification_id", unique = true, length = 100)
    public String verificationId;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "expires_at")
    public LocalDateTime expiresAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "document_types", columnDefinition = "TEXT")
    public String documentTypes; // JSON serialized list

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    public String verificationNotes;

    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata; // JSON serialized metadata

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Static query methods for Panache pattern
    public static KYCVerificationRecord findByUserId(String userId) {
        return find("userId = ?1 ORDER BY createdAt DESC", userId).firstResult();
    }

    public static java.util.List<KYCVerificationRecord> findActiveByUserId(String userId) {
        return find("userId = ?1 AND verificationStatus = 'VERIFIED' AND expiresAt > CURRENT_TIMESTAMP ORDER BY createdAt DESC", userId).list();
    }

    public static java.util.List<KYCVerificationRecord> findExpiringSoon(int daysThreshold) {
        return find("verificationStatus = 'VERIFIED' AND expiresAt BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + ?1 DAY", daysThreshold).list();
    }

    public static long countByStatus(String status) {
        return count("verificationStatus", status);
    }
}

package io.aurigraph.v11.contracts.rwa.compliance.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity for storing sanctions screening records
 * AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
@Entity
@Table(name = "sanctions_screening_records", indexes = {
    @Index(name = "idx_sanctions_entity_id", columnList = "entity_id"),
    @Index(name = "idx_sanctions_entity_type", columnList = "entity_type"),
    @Index(name = "idx_sanctions_match_status", columnList = "match_status"),
    @Index(name = "idx_sanctions_created", columnList = "created_at")
})
public class SanctionsScreeningRecord extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "screening_id", unique = true, length = 100)
    public String screeningId;

    @Column(name = "entity_id", nullable = false, length = 100)
    public String entityId;

    @Column(name = "entity_type", nullable = false, length = 50)
    public String entityType; // USER, ADDRESS, TRANSACTION

    @Column(name = "entity_name", length = 500)
    public String entityName;

    @Column(name = "blockchain_address", length = 100)
    public String blockchainAddress;

    @Column(name = "match_status", nullable = false, length = 20)
    public String matchStatus; // NO_MATCH, POTENTIAL_MATCH, CONFIRMED_MATCH

    @Column(name = "match_confidence")
    public Double matchConfidence;

    @Column(name = "sanctions_lists", columnDefinition = "TEXT")
    public String sanctionsLists; // JSON serialized list of matched sanctions lists

    @Column(name = "matched_entities", columnDefinition = "TEXT")
    public String matchedEntities; // JSON serialized list of matched entities

    @Column(name = "risk_level", length = 20)
    public String riskLevel;

    @Column(name = "blocked", nullable = false)
    public Boolean blocked;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "reviewed_at")
    public LocalDateTime reviewedAt;

    @Column(name = "reviewed_by", length = 100)
    public String reviewedBy;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    public String reviewNotes;

    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Static query methods
    public static SanctionsScreeningRecord findByEntityId(String entityId) {
        return find("entityId = ?1 ORDER BY createdAt DESC", entityId).firstResult();
    }

    public static java.util.List<SanctionsScreeningRecord> findByAddress(String blockchainAddress) {
        return find("blockchainAddress = ?1 ORDER BY createdAt DESC", blockchainAddress).list();
    }

    public static java.util.List<SanctionsScreeningRecord> findMatches() {
        return find("matchStatus IN ('POTENTIAL_MATCH', 'CONFIRMED_MATCH') ORDER BY matchConfidence DESC, createdAt DESC").list();
    }

    public static java.util.List<SanctionsScreeningRecord> findBlocked() {
        return find("blocked = true ORDER BY createdAt DESC").list();
    }

    public static java.util.List<SanctionsScreeningRecord> findPendingReview() {
        return find("matchStatus = 'POTENTIAL_MATCH' AND reviewedAt IS NULL ORDER BY matchConfidence DESC").list();
    }

    public static long countByMatchStatus(String matchStatus) {
        return count("matchStatus", matchStatus);
    }
}

package io.aurigraph.v11.contracts.rwa.compliance.entities;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity for storing tax events (capital gains, income, etc.)
 * AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
@Entity
@Table(name = "tax_events", indexes = {
    @Index(name = "idx_tax_user_id", columnList = "user_id"),
    @Index(name = "idx_tax_year", columnList = "tax_year"),
    @Index(name = "idx_tax_event_type", columnList = "event_type"),
    @Index(name = "idx_tax_jurisdiction", columnList = "jurisdiction"),
    @Index(name = "idx_tax_created", columnList = "created_at")
})
public class TaxEvent extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "event_id", unique = true, length = 100)
    public String eventId;

    @Column(name = "user_id", nullable = false, length = 100)
    public String userId;

    @Column(name = "tax_year", nullable = false)
    public Integer taxYear;

    @Column(name = "event_type", nullable = false, length = 50)
    public String eventType; // CAPITAL_GAIN, CAPITAL_LOSS, INCOME, MINING_REWARD, STAKING_REWARD

    @Column(name = "jurisdiction", nullable = false, length = 10)
    public String jurisdiction;

    @Column(name = "asset_id", length = 100)
    public String assetId;

    @Column(name = "asset_symbol", length = 20)
    public String assetSymbol;

    @Column(name = "transaction_hash", length = 100)
    public String transactionHash;

    @Column(name = "acquisition_date")
    public LocalDateTime acquisitionDate;

    @Column(name = "disposal_date")
    public LocalDateTime disposalDate;

    @Column(name = "acquisition_price", precision = 20, scale = 8)
    public BigDecimal acquisitionPrice;

    @Column(name = "disposal_price", precision = 20, scale = 8)
    public BigDecimal disposalPrice;

    @Column(name = "quantity", precision = 20, scale = 8)
    public BigDecimal quantity;

    @Column(name = "cost_basis", precision = 20, scale = 8)
    public BigDecimal costBasis;

    @Column(name = "proceeds", precision = 20, scale = 8)
    public BigDecimal proceeds;

    @Column(name = "gain_loss", precision = 20, scale = 8)
    public BigDecimal gainLoss;

    @Column(name = "holding_period_days")
    public Integer holdingPeriodDays;

    @Column(name = "is_long_term")
    public Boolean isLongTerm;

    @Column(name = "cost_basis_method", length = 20)
    public String costBasisMethod; // FIFO, LIFO, HIFO, AVERAGE

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "reported_at")
    public LocalDateTime reportedAt;

    @Column(name = "form_reference", length = 100)
    public String formReference; // Reference to tax form (e.g., Form 8949, Schedule D)

    @Column(name = "notes", columnDefinition = "TEXT")
    public String notes;

    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Static query methods
    public static java.util.List<TaxEvent> findByUserAndYear(String userId, Integer taxYear) {
        return find("userId = ?1 AND taxYear = ?2 ORDER BY disposalDate DESC, createdAt DESC", userId, taxYear).list();
    }

    public static java.util.List<TaxEvent> findByUserAndYearAndType(String userId, Integer taxYear, String eventType) {
        return find("userId = ?1 AND taxYear = ?2 AND eventType = ?3 ORDER BY disposalDate DESC", userId, taxYear, eventType).list();
    }

    public static BigDecimal sumGainLossByUserAndYear(String userId, Integer taxYear) {
        return find("SELECT COALESCE(SUM(gainLoss), 0) FROM TaxEvent WHERE userId = ?1 AND taxYear = ?2", userId, taxYear).project(BigDecimal.class).firstResult();
    }

    public static BigDecimal sumGainLossByUserYearAndTerm(String userId, Integer taxYear, Boolean isLongTerm) {
        return find("SELECT COALESCE(SUM(gainLoss), 0) FROM TaxEvent WHERE userId = ?1 AND taxYear = ?2 AND isLongTerm = ?3", userId, taxYear, isLongTerm).project(BigDecimal.class).firstResult();
    }

    public static java.util.List<TaxEvent> findUnreported(String userId, Integer taxYear) {
        return find("userId = ?1 AND taxYear = ?2 AND reportedAt IS NULL ORDER BY disposalDate DESC", userId, taxYear).list();
    }

    public static long countByUserAndYear(String userId, Integer taxYear) {
        return count("userId = ?1 AND taxYear = ?2", userId, taxYear);
    }
}

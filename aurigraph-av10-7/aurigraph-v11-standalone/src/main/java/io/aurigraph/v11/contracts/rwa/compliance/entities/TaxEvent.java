package io.aurigraph.v11.contracts.rwa.compliance.entities;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tax Event Model for Aurigraph V11 - LevelDB Compatible
 *
 * Stores tax events (capital gains, income, etc.) for RWA compliance monitoring.
 *
 * LevelDB Storage: Uses eventId as primary key
 * JSON Serializable: All fields stored as JSON in LevelDB
 *
 * @version 4.0.0 (LevelDB Migration - Oct 8, 2025)
 * @since AV11-406: Real-World Asset (RWA) Compliance Monitoring
 */
public class TaxEvent {

    @JsonProperty("eventId")
    public String eventId;

    @JsonProperty("userId")
    public String userId;

    @JsonProperty("taxYear")
    public Integer taxYear;

    @JsonProperty("eventType")
    public String eventType; // CAPITAL_GAIN, CAPITAL_LOSS, INCOME, MINING_REWARD, STAKING_REWARD

    @JsonProperty("jurisdiction")
    public String jurisdiction;

    @JsonProperty("assetId")
    public String assetId;

    @JsonProperty("assetSymbol")
    public String assetSymbol;

    @JsonProperty("transactionHash")
    public String transactionHash;

    @JsonProperty("acquisitionDate")
    public LocalDateTime acquisitionDate;

    @JsonProperty("disposalDate")
    public LocalDateTime disposalDate;

    @JsonProperty("acquisitionPrice")
    public BigDecimal acquisitionPrice;

    @JsonProperty("disposalPrice")
    public BigDecimal disposalPrice;

    @JsonProperty("quantity")
    public BigDecimal quantity;

    @JsonProperty("costBasis")
    public BigDecimal costBasis;

    @JsonProperty("proceeds")
    public BigDecimal proceeds;

    @JsonProperty("gainLoss")
    public BigDecimal gainLoss;

    @JsonProperty("holdingPeriodDays")
    public Integer holdingPeriodDays;

    @JsonProperty("isLongTerm")
    public Boolean isLongTerm;

    @JsonProperty("costBasisMethod")
    public String costBasisMethod; // FIFO, LIFO, HIFO, AVERAGE

    @JsonProperty("createdAt")
    public LocalDateTime createdAt;

    @JsonProperty("reportedAt")
    public LocalDateTime reportedAt;

    @JsonProperty("formReference")
    public String formReference; // Reference to tax form (e.g., Form 8949, Schedule D)

    @JsonProperty("notes")
    public String notes;

    @JsonProperty("metadata")
    public String metadata;

    // Lifecycle methods
    public void ensureCreatedAt() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

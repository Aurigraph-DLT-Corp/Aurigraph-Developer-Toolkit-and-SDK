package io.aurigraph.v11.contracts.rwa.compliance.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * AML Screening Record Entity for RWA Compliance
 * Tracks anti-money laundering screening results for users
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AMLScreeningRecord {

    private String userId;
    private String screeningId;
    private String jurisdiction;
    private BigDecimal riskLevel;
    private BigDecimal riskScore;
    private Boolean sanctionsHit;
    private Boolean pepStatus;
    private Instant createdAt;
    private Instant updatedAt;

    /**
     * Ensure createdAt is populated
     */
    public void ensureCreatedAt() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}

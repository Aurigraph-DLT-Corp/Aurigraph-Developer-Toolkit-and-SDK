package io.aurigraph.v11.contracts.rwa.compliance.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

/**
 * KYC Verification Record Entity for RWA Compliance
 * Tracks know-your-customer verification results for users
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KYCVerificationRecord {

    private String userId;
    private String verificationId;
    private String jurisdiction;
    private String provider;
    private String status;
    private String documentType;
    private String referenceNumber;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant expiresAt;

    /**
     * Ensure createdAt is populated
     */
    public void ensureCreatedAt() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }
}

package io.aurigraph.v11.contracts.models;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Represents a digital signature on a contract
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContractSignature {

    private String signatureId;
    private String contractId;
    private String signerAddress;
    private String signerName;
    private String signatureData;
    private String signatureAlgorithm;
    private Instant signedAt;
    private String publicKey;
    private boolean verified;

    // Constructor for quick creation
    public ContractSignature(String signerAddress, String signatureData) {
        this.signerAddress = signerAddress;
        this.signatureData = signatureData;
        this.signedAt = Instant.now();
        this.verified = false;
    }
}

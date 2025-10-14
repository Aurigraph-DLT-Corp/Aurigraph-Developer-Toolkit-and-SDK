package io.aurigraph.v11.contracts.models;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.HashMap;

/**
 * Represents a party in a Ricardian contract
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContractParty {
    
    private String partyId;
    private String name;
    private String address;
    private String role; // e.g., "BUYER", "SELLER", "VALIDATOR", "WITNESS"
    private String publicKey;
    @Builder.Default
    private boolean kycVerified = false;
    @Builder.Default
    private boolean signatureRequired = true;
    private String jurisdiction;
    private String email;
    private String phone;
    private Instant createdAt;
    @Builder.Default
    private Map<String, String> metadata = new HashMap<>();
    
    // Constructor for quick creation
    public ContractParty(String partyId, String name, String address, String role) {
        this.partyId = partyId;
        this.name = name;
        this.address = address;
        this.role = role;
        this.createdAt = Instant.now();
        this.metadata = new HashMap<>();
    }
}
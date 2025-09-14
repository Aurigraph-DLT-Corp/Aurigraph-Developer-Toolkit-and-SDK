package io.aurigraph.v11.contracts.models;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignatureRequest {
    
    @NotBlank
    private String contractId;
    
    @NotBlank
    private String signerAddress;
    
    @NotBlank
    private String signature;
    
    @NotBlank
    private String messageHash;
    
    private String publicKey;
    
    private long timestamp;
    
    private String signatureAlgorithm = "Dilithium";
}
package io.aurigraph.v11.contracts.models;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
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
    
    @Builder.Default
    private String signatureAlgorithm = "Dilithium";
    
    private String privateKey;
    
    private List<String> witnesses;
}
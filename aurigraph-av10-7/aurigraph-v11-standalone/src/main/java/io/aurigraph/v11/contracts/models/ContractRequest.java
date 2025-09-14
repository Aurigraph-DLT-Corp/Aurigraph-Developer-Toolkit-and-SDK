package io.aurigraph.v11.contracts.models;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContractRequest {
    
    @NotBlank
    private String name;
    
    @NotBlank
    private String version;
    
    @NotBlank
    private String legalText;
    
    @NotBlank
    private String executableCode;
    
    @NotBlank
    private String jurisdiction;
    
    @NotBlank
    private String contractType;
    
    @NotBlank
    private String assetType;
    
    private List<ContractParty> parties;
    
    private List<ContractTerm> terms;
    
    private Map<String, Object> metadata;
    
    // Legacy fields for backward compatibility
    private String requesterAddress;
    private String signature;
    private long timestamp;
    private String nonce;
}
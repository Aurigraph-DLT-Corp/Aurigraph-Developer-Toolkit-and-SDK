package io.aurigraph.v11.contracts.models;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContractCreationRequest {
    
    @NotBlank
    private String contractName;
    
    @NotBlank
    private String contractType;
    
    @NotBlank
    private String templateId;
    
    private String description;
    
    @NotNull
    private Map<String, Object> parameters;
    
    @NotBlank
    private String creatorAddress;
    
    private BigDecimal value;
    
    private Instant expirationDate;
    
    private Map<String, String> metadata;
    
    @Builder.Default
    private boolean autoExecute = false;
    
    private String[] requiredSignatures;
    
    private String legalText;
    
    private String executableCode;
    
    private List<String> parties;
}
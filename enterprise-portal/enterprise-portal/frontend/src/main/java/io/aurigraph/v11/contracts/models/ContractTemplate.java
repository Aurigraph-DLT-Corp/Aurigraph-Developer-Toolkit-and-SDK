package io.aurigraph.v11.contracts.models;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContractTemplate {
    
    private String templateId;
    private String name;
    private String description;
    private String contractType;
    private String category;
    private String assetType;
    private String jurisdiction;
    private String legalText;
    private String sourceCode;
    private String bytecode;
    private String abi; // Application Binary Interface
    private Map<String, Object> defaultParameters;
    private String[] requiredParameters;
    private String version;
    private String author;
    private Instant createdAt;
    private Instant updatedAt;
    private boolean verified;
    private String verificationHash;
    @Builder.Default
    private List<TemplateVariable> variables = new ArrayList<>();
}
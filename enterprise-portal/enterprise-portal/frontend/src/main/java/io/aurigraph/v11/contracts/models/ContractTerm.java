package io.aurigraph.v11.contracts.models;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.HashMap;

/**
 * Represents a specific term or condition in a Ricardian contract
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContractTerm {
    
    private String termId;
    private String title;
    private String description;
    private String termType; // e.g., "PAYMENT", "DELIVERY", "PERFORMANCE", "PENALTY"
    private BigDecimal value;
    private String currency;
    private Instant effectiveDate;
    private Instant expirationDate;
    @Builder.Default
    private boolean mandatory = true;
    private String condition; // Condition that triggers this term
    private String penaltyClause;
    @Builder.Default
    private Map<String, Object> parameters = new HashMap<>();
    
    // Constructor for simple terms
    public ContractTerm(String termId, String title, String description, String termType) {
        this.termId = termId;
        this.title = title;
        this.description = description;
        this.termType = termType;
        this.parameters = new HashMap<>();
    }
}
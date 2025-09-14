package io.aurigraph.v11.contracts.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

/**
 * Represents a variable in a contract template
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TemplateVariable {
    
    private String name;
    private String type; // STRING, NUMBER, BOOLEAN, DATE, ADDRESS
    private String description;
    private boolean required = true;
    private Object defaultValue;
    private String validationPattern; // Regex pattern for validation
    private String example;
    private String category; // GROUP, PARTY, ASSET, FINANCIAL, etc.
    
    // Constructor for simple variables
    public TemplateVariable(String name, String type, String description, boolean required) {
        this.name = name;
        this.type = type;
        this.description = description;
        this.required = required;
    }
}
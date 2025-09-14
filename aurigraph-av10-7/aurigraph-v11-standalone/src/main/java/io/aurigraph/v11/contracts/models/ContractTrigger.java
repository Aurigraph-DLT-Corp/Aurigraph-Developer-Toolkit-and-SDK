package io.aurigraph.v11.contracts.models;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;
import java.util.HashMap;

/**
 * Represents a trigger that can execute contract logic
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContractTrigger {
    
    private String triggerId;
    private String name;
    private String description;
    private TriggerType type;
    private boolean enabled = true;
    private String condition; // The condition that activates this trigger
    private String action; // The action to execute when triggered
    private Map<String, Object> parameters = new HashMap<>();
    private Instant createdAt;
    private Instant lastTriggeredAt;
    private int triggerCount = 0;
    
    // Constructor for basic triggers
    public ContractTrigger(String triggerId, String name, TriggerType type, String condition, String action) {
        this.triggerId = triggerId;
        this.name = name;
        this.type = type;
        this.condition = condition;
        this.action = action;
        this.createdAt = Instant.now();
        this.parameters = new HashMap<>();
    }
}
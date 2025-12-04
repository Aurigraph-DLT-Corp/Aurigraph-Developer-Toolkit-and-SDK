package io.aurigraph.v11.demo.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

/**
 * Demo Data Transfer Object
 *
 * Plain Java object for filesystem storage and API responses.
 * Does not extend Panache entity - suitable for JSON serialization.
 *
 * @version 1.0.0 (Dec 4, 2025)
 * @author Backend Development Agent (BDA)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DemoDTO {

    public String id;
    public String demoName;
    public String userEmail;
    public String userName;
    public String description;
    public String status = "PENDING";
    public LocalDateTime createdAt = LocalDateTime.now();
    public LocalDateTime lastActivity = LocalDateTime.now();
    public LocalDateTime expiresAt;
    public int durationMinutes = 1440; // 24 hours default for persistent demos
    public boolean isAdminDemo = false;
    public long transactionCount = 0;
    public String merkleRoot;

    // JSON-stored configuration
    public String channelsJson;
    public String validatorsJson;
    public String businessNodesJson;
    public String slimNodesJson;

    // Data feeds and tokenization
    public String tokenizationMode = "live-feed";
    public String selectedDataFeedsJson;
    public String tokenizationConfigJson;

    public DemoDTO() {}

    /**
     * Create from existing Demo entity (for migration)
     */
    public static DemoDTO fromEntity(Demo demo) {
        DemoDTO dto = new DemoDTO();
        dto.id = demo.id;
        dto.demoName = demo.demoName;
        dto.userEmail = demo.userEmail;
        dto.userName = demo.userName;
        dto.description = demo.description;
        dto.status = demo.status != null ? demo.status.name() : "PENDING";
        dto.createdAt = demo.createdAt;
        dto.lastActivity = demo.lastActivity;
        dto.expiresAt = demo.expiresAt;
        dto.durationMinutes = demo.durationMinutes;
        dto.isAdminDemo = demo.isAdminDemo;
        dto.transactionCount = demo.transactionCount;
        dto.merkleRoot = demo.merkleRoot;
        dto.channelsJson = demo.channelsJson;
        dto.validatorsJson = demo.validatorsJson;
        dto.businessNodesJson = demo.businessNodesJson;
        dto.slimNodesJson = demo.slimNodesJson;
        dto.tokenizationMode = demo.tokenizationMode;
        dto.selectedDataFeedsJson = demo.selectedDataFeedsJson;
        dto.tokenizationConfigJson = demo.tokenizationConfigJson;
        return dto;
    }

    /**
     * Check if demo is expired
     */
    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Extend demo duration
     */
    public void extend(int additionalMinutes) {
        if (expiresAt != null) {
            this.expiresAt = this.expiresAt.plusMinutes(additionalMinutes);
        } else {
            this.expiresAt = LocalDateTime.now().plusMinutes(additionalMinutes);
        }
        this.durationMinutes += additionalMinutes;
        this.lastActivity = LocalDateTime.now();
    }

    /**
     * Mark as expired
     */
    public void expire() {
        this.status = "EXPIRED";
        this.lastActivity = LocalDateTime.now();
    }

    /**
     * Increment transaction count
     */
    public void addTransactions(long count) {
        this.transactionCount += count;
        this.lastActivity = LocalDateTime.now();
    }
}

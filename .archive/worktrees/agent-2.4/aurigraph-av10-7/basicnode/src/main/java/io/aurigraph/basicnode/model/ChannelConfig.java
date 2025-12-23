package io.aurigraph.basicnode.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Channel Configuration Model
 * Defines channel membership and participation settings
 */
public class ChannelConfig {
    
    public enum ChannelType {
        CONSENSUS,      // Consensus participation
        PROCESSING,     // Transaction processing
        GEOGRAPHIC,     // Regional operations
        PERFORMANCE,    // Performance-optimized
        SECURITY,       // Security-specialized
        SPECIALIZED     // Custom specialization
    }
    
    public enum SecurityLevel {
        STANDARD,       // Basic security
        HIGH,          // Enhanced security
        QUANTUM_LEVEL_6 // Quantum-native security
    }
    
    private String channelId;
    private String channelName;
    private ChannelType type;
    private SecurityLevel securityLevel;
    private String region;
    private String specialization;
    private boolean autoJoin = true;
    private int priority = 1; // 1-10, higher = more priority
    private int maxNodes = 100;
    private int minNodes = 3;
    private String platformUrl;
    private Map<String, Object> channelSettings = new HashMap<>();
    private List<String> capabilities = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime lastUpdated;
    private boolean active = true;
    
    public ChannelConfig() {
        this.createdAt = LocalDateTime.now();
        this.lastUpdated = LocalDateTime.now();
    }
    
    public ChannelConfig(String channelId, String channelName, ChannelType type) {
        this();
        this.channelId = channelId;
        this.channelName = channelName;
        this.type = type;
    }
    
    // Getters and Setters
    
    public String getChannelId() {
        return channelId;
    }
    
    public void setChannelId(String channelId) {
        this.channelId = channelId;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public String getChannelName() {
        return channelName;
    }
    
    public void setChannelName(String channelName) {
        this.channelName = channelName;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public ChannelType getType() {
        return type;
    }
    
    public void setType(ChannelType type) {
        this.type = type;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public SecurityLevel getSecurityLevel() {
        return securityLevel;
    }
    
    public void setSecurityLevel(SecurityLevel securityLevel) {
        this.securityLevel = securityLevel;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public String getRegion() {
        return region;
    }
    
    public void setRegion(String region) {
        this.region = region;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public String getSpecialization() {
        return specialization;
    }
    
    public void setSpecialization(String specialization) {
        this.specialization = specialization;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public boolean isAutoJoin() {
        return autoJoin;
    }
    
    public void setAutoJoin(boolean autoJoin) {
        this.autoJoin = autoJoin;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public int getPriority() {
        return priority;
    }
    
    public void setPriority(int priority) {
        this.priority = Math.max(1, Math.min(10, priority));
        this.lastUpdated = LocalDateTime.now();
    }
    
    public int getMaxNodes() {
        return maxNodes;
    }
    
    public void setMaxNodes(int maxNodes) {
        this.maxNodes = maxNodes;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public int getMinNodes() {
        return minNodes;
    }
    
    public void setMinNodes(int minNodes) {
        this.minNodes = minNodes;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public String getPlatformUrl() {
        return platformUrl;
    }
    
    public void setPlatformUrl(String platformUrl) {
        this.platformUrl = platformUrl;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public Map<String, Object> getChannelSettings() {
        return channelSettings;
    }
    
    public void setChannelSettings(Map<String, Object> channelSettings) {
        this.channelSettings = channelSettings;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public void addChannelSetting(String key, Object value) {
        this.channelSettings.put(key, value);
        this.lastUpdated = LocalDateTime.now();
    }
    
    public List<String> getCapabilities() {
        return capabilities;
    }
    
    public void setCapabilities(List<String> capabilities) {
        this.capabilities = capabilities;
        this.lastUpdated = LocalDateTime.now();
    }
    
    public void addCapability(String capability) {
        if (!this.capabilities.contains(capability)) {
            this.capabilities.add(capability);
            this.lastUpdated = LocalDateTime.now();
        }
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }
    
    public boolean isActive() {
        return active;
    }
    
    public void setActive(boolean active) {
        this.active = active;
        this.lastUpdated = LocalDateTime.now();
    }
    
    // Validation and utility methods
    
    public boolean isValid() {
        return channelId != null && !channelId.trim().isEmpty() &&
               channelName != null && !channelName.trim().isEmpty() &&
               type != null &&
               priority >= 1 && priority <= 10 &&
               maxNodes > 0 && minNodes > 0 && minNodes <= maxNodes;
    }
    
    public String getValidationErrors() {
        StringBuilder errors = new StringBuilder();
        
        if (channelId == null || channelId.trim().isEmpty()) {
            errors.append("Channel ID is required. ");
        }
        if (channelName == null || channelName.trim().isEmpty()) {
            errors.append("Channel name is required. ");
        }
        if (type == null) {
            errors.append("Channel type is required. ");
        }
        if (priority < 1 || priority > 10) {
            errors.append("Priority must be between 1-10. ");
        }
        if (maxNodes <= 0) {
            errors.append("Max nodes must be positive. ");
        }
        if (minNodes <= 0) {
            errors.append("Min nodes must be positive. ");
        }
        if (minNodes > maxNodes) {
            errors.append("Min nodes cannot exceed max nodes. ");
        }
        
        return errors.toString().trim();
    }
    
    public boolean hasCapability(String capability) {
        return capabilities.contains(capability);
    }
    
    public boolean isCompatibleWith(NodeConfig nodeConfig) {
        // Check if node capabilities match channel requirements
        if (type == ChannelType.PERFORMANCE) {
            return nodeConfig.getMaxMemoryMB() >= 256 && nodeConfig.getMaxCores() >= 1;
        }
        if (type == ChannelType.SECURITY && securityLevel == SecurityLevel.QUANTUM_LEVEL_6) {
            return nodeConfig.getCustomSettings().containsKey("quantum-enabled");
        }
        return true; // Basic compatibility for standard channels
    }
    
    @Override
    public String toString() {
        return "ChannelConfig{" +
                "channelId='" + channelId + '\'' +
                ", name='" + channelName + '\'' +
                ", type=" + type +
                ", securityLevel=" + securityLevel +
                ", region='" + region + '\'' +
                ", specialization='" + specialization + '\'' +
                ", priority=" + priority +
                ", nodes=" + minNodes + "-" + maxNodes +
                ", active=" + active +
                '}';
    }
}
package io.aurigraph.basicnode.model;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Node Configuration Model
 */
public class NodeConfig {
    
    private String nodeId;
    private String nodeName;
    private String networkMode = "mainnet"; // mainnet, testnet
    private String platformUrl = "http://localhost:3018";
    private int nodePort = 8080;
    private boolean autoUpdates = true;
    private boolean enableMonitoring = true;
    private int maxMemoryMB = 512;
    private int maxCores = 2;
    private Map<String, Object> customSettings = new HashMap<>();
    private LocalDateTime lastModified;
    
    public NodeConfig() {
        this.lastModified = LocalDateTime.now();
    }
    
    public NodeConfig(String nodeId) {
        this.nodeId = nodeId;
        this.nodeName = "Basic Node " + nodeId;
        this.lastModified = LocalDateTime.now();
    }
    
    // Getters and Setters
    
    public String getNodeId() {
        return nodeId;
    }
    
    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
        this.lastModified = LocalDateTime.now();
    }
    
    public String getNodeName() {
        return nodeName;
    }
    
    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
        this.lastModified = LocalDateTime.now();
    }
    
    public String getNetworkMode() {
        return networkMode;
    }
    
    public void setNetworkMode(String networkMode) {
        this.networkMode = networkMode;
        this.lastModified = LocalDateTime.now();
    }
    
    public String getPlatformUrl() {
        return platformUrl;
    }
    
    public void setPlatformUrl(String platformUrl) {
        this.platformUrl = platformUrl;
        this.lastModified = LocalDateTime.now();
    }
    
    public int getNodePort() {
        return nodePort;
    }
    
    public void setNodePort(int nodePort) {
        this.nodePort = nodePort;
        this.lastModified = LocalDateTime.now();
    }
    
    public boolean isAutoUpdates() {
        return autoUpdates;
    }
    
    public void setAutoUpdates(boolean autoUpdates) {
        this.autoUpdates = autoUpdates;
        this.lastModified = LocalDateTime.now();
    }
    
    public boolean isEnableMonitoring() {
        return enableMonitoring;
    }
    
    public void setEnableMonitoring(boolean enableMonitoring) {
        this.enableMonitoring = enableMonitoring;
        this.lastModified = LocalDateTime.now();
    }
    
    public int getMaxMemoryMB() {
        return maxMemoryMB;
    }
    
    public void setMaxMemoryMB(int maxMemoryMB) {
        this.maxMemoryMB = maxMemoryMB;
        this.lastModified = LocalDateTime.now();
    }
    
    public int getMaxCores() {
        return maxCores;
    }
    
    public void setMaxCores(int maxCores) {
        this.maxCores = maxCores;
        this.lastModified = LocalDateTime.now();
    }
    
    public Map<String, Object> getCustomSettings() {
        return customSettings;
    }
    
    public void setCustomSettings(Map<String, Object> customSettings) {
        this.customSettings = customSettings;
        this.lastModified = LocalDateTime.now();
    }
    
    public void addCustomSetting(String key, Object value) {
        this.customSettings.put(key, value);
        this.lastModified = LocalDateTime.now();
    }
    
    public LocalDateTime getLastModified() {
        return lastModified;
    }
    
    public void setLastModified(LocalDateTime lastModified) {
        this.lastModified = lastModified;
    }
    
    // Validation methods
    
    public boolean isValid() {
        return nodeId != null && !nodeId.trim().isEmpty() &&
               nodeName != null && !nodeName.trim().isEmpty() &&
               platformUrl != null && !platformUrl.trim().isEmpty() &&
               nodePort > 0 && nodePort < 65536 &&
               maxMemoryMB > 0 && maxMemoryMB <= 2048 &&
               maxCores > 0 && maxCores <= 8;
    }
    
    public String getValidationErrors() {
        StringBuilder errors = new StringBuilder();
        
        if (nodeId == null || nodeId.trim().isEmpty()) {
            errors.append("Node ID is required. ");
        }
        if (nodeName == null || nodeName.trim().isEmpty()) {
            errors.append("Node name is required. ");
        }
        if (platformUrl == null || platformUrl.trim().isEmpty()) {
            errors.append("Platform URL is required. ");
        }
        if (nodePort <= 0 || nodePort >= 65536) {
            errors.append("Node port must be between 1-65535. ");
        }
        if (maxMemoryMB <= 0 || maxMemoryMB > 2048) {
            errors.append("Max memory must be between 1-2048 MB. ");
        }
        if (maxCores <= 0 || maxCores > 8) {
            errors.append("Max cores must be between 1-8. ");
        }
        
        return errors.toString().trim();
    }
    
    @Override
    public String toString() {
        return "NodeConfig{" +
                "nodeId='" + nodeId + '\'' +
                ", nodeName='" + nodeName + '\'' +
                ", networkMode='" + networkMode + '\'' +
                ", platformUrl='" + platformUrl + '\'' +
                ", nodePort=" + nodePort +
                ", maxMemoryMB=" + maxMemoryMB +
                ", maxCores=" + maxCores +
                '}';
    }
}
package io.aurigraph.basicnode.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Node Status Model - Current operational status and metrics
 */
public class NodeStatus {
    
    private String nodeId;
    private String status = "INITIALIZING"; // INITIALIZING, STARTING, RUNNING, STOPPING, STOPPED, ERROR
    private LocalDateTime startTime;
    private LocalDateTime lastHealthCheck;
    private LocalDateTime lastPlatformSync;
    
    // Performance metrics
    private double memoryUsage = 0.0; // MB
    private double cpuUsage = 0.0; // Percentage
    private long uptime = 0; // Seconds
    
    // Platform connectivity
    private boolean platformConnected = false;
    private String platformVersion;
    private long lastSyncTimestamp = 0;
    
    // Alerts and notifications
    private List<String> alerts = new ArrayList<>();
    private List<String> notifications = new ArrayList<>();
    
    // Transaction statistics
    private long transactionsProcessed = 0;
    private long transactionsValidated = 0;
    private double avgTransactionTime = 0.0; // ms
    
    public NodeStatus() {
        this.startTime = LocalDateTime.now();
        this.lastHealthCheck = LocalDateTime.now();
    }
    
    // Getters and Setters
    
    public String getNodeId() {
        return nodeId;
    }
    
    public void setNodeId(String nodeId) {
        this.nodeId = nodeId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalDateTime getLastHealthCheck() {
        return lastHealthCheck;
    }
    
    public void setLastHealthCheck(LocalDateTime lastHealthCheck) {
        this.lastHealthCheck = lastHealthCheck;
    }
    
    public LocalDateTime getLastPlatformSync() {
        return lastPlatformSync;
    }
    
    public void setLastPlatformSync(LocalDateTime lastPlatformSync) {
        this.lastPlatformSync = lastPlatformSync;
    }
    
    public double getMemoryUsage() {
        return memoryUsage;
    }
    
    public void setMemoryUsage(double memoryUsage) {
        this.memoryUsage = memoryUsage;
    }
    
    public double getCpuUsage() {
        return cpuUsage;
    }
    
    public void setCpuUsage(double cpuUsage) {
        this.cpuUsage = cpuUsage;
    }
    
    public long getUptime() {
        if (startTime != null) {
            return java.time.Duration.between(startTime, LocalDateTime.now()).getSeconds();
        }
        return uptime;
    }
    
    public void setUptime(long uptime) {
        this.uptime = uptime;
    }
    
    public boolean isPlatformConnected() {
        return platformConnected;
    }
    
    public void setPlatformConnected(boolean platformConnected) {
        this.platformConnected = platformConnected;
    }
    
    public String getPlatformVersion() {
        return platformVersion;
    }
    
    public void setPlatformVersion(String platformVersion) {
        this.platformVersion = platformVersion;
    }
    
    public long getLastSyncTimestamp() {
        return lastSyncTimestamp;
    }
    
    public void setLastSyncTimestamp(long lastSyncTimestamp) {
        this.lastSyncTimestamp = lastSyncTimestamp;
    }
    
    public List<String> getAlerts() {
        return alerts;
    }
    
    public void setAlerts(List<String> alerts) {
        this.alerts = alerts;
    }
    
    public void addAlert(String alert) {
        this.alerts.add(alert);
        // Keep only last 10 alerts
        if (this.alerts.size() > 10) {
            this.alerts.remove(0);
        }
    }
    
    public List<String> getNotifications() {
        return notifications;
    }
    
    public void setNotifications(List<String> notifications) {
        this.notifications = notifications;
    }
    
    public void addNotification(String notification) {
        this.notifications.add(notification);
        // Keep only last 20 notifications
        if (this.notifications.size() > 20) {
            this.notifications.remove(0);
        }
    }
    
    public long getTransactionsProcessed() {
        return transactionsProcessed;
    }
    
    public void setTransactionsProcessed(long transactionsProcessed) {
        this.transactionsProcessed = transactionsProcessed;
    }
    
    public void incrementTransactionsProcessed() {
        this.transactionsProcessed++;
    }
    
    public long getTransactionsValidated() {
        return transactionsValidated;
    }
    
    public void setTransactionsValidated(long transactionsValidated) {
        this.transactionsValidated = transactionsValidated;
    }
    
    public void incrementTransactionsValidated() {
        this.transactionsValidated++;
    }
    
    public double getAvgTransactionTime() {
        return avgTransactionTime;
    }
    
    public void setAvgTransactionTime(double avgTransactionTime) {
        this.avgTransactionTime = avgTransactionTime;
    }
    
    // Utility methods
    
    public boolean isHealthy() {
        return "RUNNING".equals(status) && 
               memoryUsage <= 512 && 
               cpuUsage <= 200 &&
               alerts.size() < 5;
    }
    
    public String getHealthSummary() {
        if (isHealthy()) {
            return "Healthy - All systems operational";
        } else {
            return "Issues detected - Check alerts for details";
        }
    }
    
    public double getPerformanceScore() {
        double memoryScore = Math.max(0, 100 - (memoryUsage / 512 * 100));
        double cpuScore = Math.max(0, 100 - (cpuUsage / 200 * 100));
        double connectivityScore = platformConnected ? 100 : 0;
        
        return (memoryScore + cpuScore + connectivityScore) / 3.0;
    }
    
    @Override
    public String toString() {
        return "NodeStatus{" +
                "nodeId='" + nodeId + '\'' +
                ", status='" + status + '\'' +
                ", memoryUsage=" + String.format("%.1f", memoryUsage) + "MB" +
                ", cpuUsage=" + String.format("%.1f", cpuUsage) + "%" +
                ", platformConnected=" + platformConnected +
                ", uptime=" + getUptime() + "s" +
                '}';
    }
}
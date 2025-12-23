package io.aurigraph.basicnode.model;

/**
 * Resource Metrics Model - Performance and resource usage tracking
 */
public class ResourceMetrics {
    
    private double memoryUsageMB = 0.0;
    private double memoryPercentage = 0.0;
    private double cpuUsagePercent = 0.0;
    private double systemLoad = 0.0;
    private long lastUpdated = 0;
    
    // Network metrics
    private long bytesReceived = 0;
    private long bytesSent = 0;
    private int activeConnections = 0;
    
    // Performance metrics
    private double avgResponseTime = 0.0; // ms
    private long requestsPerSecond = 0;
    private double errorRate = 0.0; // percentage
    
    public ResourceMetrics() {
        this.lastUpdated = System.currentTimeMillis();
    }
    
    // Getters and Setters
    
    public double getMemoryUsageMB() {
        return memoryUsageMB;
    }
    
    public void setMemoryUsageMB(double memoryUsageMB) {
        this.memoryUsageMB = memoryUsageMB;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    public double getMemoryPercentage() {
        return memoryPercentage;
    }
    
    public void setMemoryPercentage(double memoryPercentage) {
        this.memoryPercentage = memoryPercentage;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    public double getCpuUsagePercent() {
        return cpuUsagePercent;
    }
    
    public void setCpuUsagePercent(double cpuUsagePercent) {
        this.cpuUsagePercent = cpuUsagePercent;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    public double getSystemLoad() {
        return systemLoad;
    }
    
    public void setSystemLoad(double systemLoad) {
        this.systemLoad = systemLoad;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    public long getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(long lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
    
    public long getBytesReceived() {
        return bytesReceived;
    }
    
    public void setBytesReceived(long bytesReceived) {
        this.bytesReceived = bytesReceived;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    public long getBytesSent() {
        return bytesSent;
    }
    
    public void setBytesSent(long bytesSent) {
        this.bytesSent = bytesSent;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    public int getActiveConnections() {
        return activeConnections;
    }
    
    public void setActiveConnections(int activeConnections) {
        this.activeConnections = activeConnections;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    public double getAvgResponseTime() {
        return avgResponseTime;
    }
    
    public void setAvgResponseTime(double avgResponseTime) {
        this.avgResponseTime = avgResponseTime;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    public long getRequestsPerSecond() {
        return requestsPerSecond;
    }
    
    public void setRequestsPerSecond(long requestsPerSecond) {
        this.requestsPerSecond = requestsPerSecond;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    public double getErrorRate() {
        return errorRate;
    }
    
    public void setErrorRate(double errorRate) {
        this.errorRate = errorRate;
        this.lastUpdated = System.currentTimeMillis();
    }
    
    // Utility methods
    
    public boolean isWithinLimits() {
        return memoryUsageMB <= 512 && cpuUsagePercent <= 200;
    }
    
    public String getPerformanceGrade() {
        if (memoryUsageMB > 512 || cpuUsagePercent > 200) {
            return "POOR";
        } else if (memoryUsageMB > 400 || cpuUsagePercent > 150) {
            return "FAIR";
        } else if (memoryUsageMB > 256 || cpuUsagePercent > 100) {
            return "GOOD";
        } else {
            return "EXCELLENT";
        }
    }
    
    public double getEfficiencyScore() {
        double memoryScore = Math.max(0, 100 - (memoryUsageMB / 512 * 100));
        double cpuScore = Math.max(0, 100 - (cpuUsagePercent / 200 * 100));
        return (memoryScore + cpuScore) / 2.0;
    }
    
    @Override
    public String toString() {
        return "ResourceMetrics{" +
                "memory=" + String.format("%.1f", memoryUsageMB) + "MB" +
                ", cpu=" + String.format("%.1f", cpuUsagePercent) + "%" +
                ", load=" + String.format("%.2f", systemLoad) +
                ", grade=" + getPerformanceGrade() +
                '}';
    }
}
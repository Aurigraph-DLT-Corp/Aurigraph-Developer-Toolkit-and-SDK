package io.aurigraph.basicnode.service;

import io.aurigraph.basicnode.model.NodeConfig;
import io.aurigraph.basicnode.model.NodeStatus;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.time.LocalDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

/**
 * Node Manager - Core node lifecycle and operations management
 */
@ApplicationScoped
public class NodeManager {
    
    private static final Logger logger = Logger.getLogger(NodeManager.class.getName());
    
    @Inject
    ResourceMonitor resourceMonitor;
    
    @Inject 
    APIGatewayConnector apiConnector;
    
    private NodeConfig nodeConfig;
    private NodeStatus nodeStatus;
    private ScheduledExecutorService scheduler;
    private String nodeId;
    private boolean initialized = false;
    
    public void initialize(String nodeId) {
        this.nodeId = nodeId;
        this.nodeConfig = new NodeConfig(nodeId);
        this.nodeStatus = new NodeStatus();
        this.scheduler = Executors.newScheduledThreadPool(2);
        
        // Initialize node status
        nodeStatus.setNodeId(nodeId);
        nodeStatus.setStartTime(LocalDateTime.now());
        nodeStatus.setStatus("STARTING");
        
        // Start periodic health checks
        startHealthChecks();
        
        // Start periodic platform sync
        startPlatformSync();
        
        this.initialized = true;
        nodeStatus.setStatus("RUNNING");
        
        logger.info("🎯 Node Manager initialized for: " + nodeId);
    }
    
    private void startHealthChecks() {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                performHealthCheck();
            } catch (Exception e) {
                logger.severe("❌ Health check failed: " + e.getMessage());
            }
        }, 10, 30, TimeUnit.SECONDS);
    }
    
    private void startPlatformSync() {
        scheduler.scheduleAtFixedRate(() -> {
            try {
                syncWithPlatform();
            } catch (Exception e) {
                logger.warning("⚠️ Platform sync failed: " + e.getMessage());
            }
        }, 30, 60, TimeUnit.SECONDS);
    }
    
    private void performHealthCheck() {
        // Update node status with current metrics
        var metrics = resourceMonitor.getCurrentMetrics();
        nodeStatus.setMemoryUsage(metrics.getMemoryUsageMB());
        nodeStatus.setCpuUsage(metrics.getCpuUsagePercent());
        nodeStatus.setLastHealthCheck(LocalDateTime.now());
        
        // Check if we're within performance requirements
        if (metrics.getMemoryUsageMB() > 512) {
            logger.warning("⚠️ Memory usage exceeds 512MB: " + metrics.getMemoryUsageMB() + "MB");
            nodeStatus.addAlert("High memory usage detected");
        }
        
        if (metrics.getCpuUsagePercent() > 200) { // 2 cores = 200%
            logger.warning("⚠️ CPU usage exceeds 2 cores: " + metrics.getCpuUsagePercent() + "%");
            nodeStatus.addAlert("High CPU usage detected");
        }
        
        logger.fine("💓 Health check completed - Memory: " + metrics.getMemoryUsageMB() + "MB, CPU: " + metrics.getCpuUsagePercent() + "%");
    }
    
    private void syncWithPlatform() {
        if (apiConnector.isConnected()) {
            try {
                // Send node status to platform
                apiConnector.sendNodeStatus(nodeStatus);
                
                // Get platform updates
                var platformStatus = apiConnector.getPlatformStatus();
                if (platformStatus != null) {
                    nodeStatus.setPlatformConnected(true);
                    nodeStatus.setLastPlatformSync(LocalDateTime.now());
                }
                
            } catch (Exception e) {
                nodeStatus.setPlatformConnected(false);
                logger.warning("🔌 Platform sync failed: " + e.getMessage());
            }
        } else {
            nodeStatus.setPlatformConnected(false);
        }
    }
    
    public NodeConfig getNodeConfig() {
        return nodeConfig;
    }
    
    public NodeStatus getNodeStatus() {
        return nodeStatus;
    }
    
    public boolean isInitialized() {
        return initialized;
    }
    
    public void updateConfig(NodeConfig newConfig) {
        this.nodeConfig = newConfig;
        logger.info("⚙️ Node configuration updated");
    }
    
    public void shutdown() {
        if (scheduler != null) {
            scheduler.shutdown();
            try {
                if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                    scheduler.shutdownNow();
                }
            } catch (InterruptedException e) {
                scheduler.shutdownNow();
            }
        }
        
        nodeStatus.setStatus("STOPPED");
        logger.info("🛑 Node Manager shutdown complete");
    }
}
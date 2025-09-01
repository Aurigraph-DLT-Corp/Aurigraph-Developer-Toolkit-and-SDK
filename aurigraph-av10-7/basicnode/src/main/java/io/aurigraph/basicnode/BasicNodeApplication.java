package io.aurigraph.basicnode;

import io.quarkus.runtime.Quarkus;
import io.quarkus.runtime.QuarkusApplication;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.runtime.annotations.QuarkusMain;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import io.aurigraph.basicnode.service.NodeManager;
import io.aurigraph.basicnode.service.APIGatewayConnector;
import io.aurigraph.basicnode.service.ResourceMonitor;
import io.aurigraph.basicnode.compliance.AV1017ComplianceManager;
import io.aurigraph.basicnode.compliance.PerformanceMonitor;
import java.util.logging.Logger;

/**
 * Aurigraph Basic Node Application
 * User-friendly node implementation with Docker + Quarkus
 */
@QuarkusMain
public class BasicNodeApplication {
    
    private static final Logger logger = Logger.getLogger(BasicNodeApplication.class.getName());
    
    public static void main(String[] args) {
        // AV10-17 System Properties
        System.setProperty("java.util.logging.manager", "org.jboss.logmanager.LogManager");
        System.setProperty("aurigraph.node.compliance", "AV10-17");
        System.setProperty("aurigraph.node.id", "basic-node-" + System.currentTimeMillis());
        
        logger.info("🌟 Launching AV10-17 Compliant Aurigraph Basic Node");
        logger.info("📐 Standards: Java 24 + Quarkus 3.26.1 + GraalVM");
        logger.info("🚀 Starting Aurigraph Basic Node...");
        
        Quarkus.run(BasicNodeRunner.class, args);
    }

    @ApplicationScoped
    public static class BasicNodeRunner implements QuarkusApplication {
        
        @ConfigProperty(name = "aurigraph.node.id", defaultValue = "basic-node-1")
        String nodeId;
        
        @ConfigProperty(name = "aurigraph.platform.url", defaultValue = "http://localhost:3018")
        String platformUrl;
        
        @ConfigProperty(name = "aurigraph.node.port", defaultValue = "8080")
        int nodePort;
        
        @Inject
        NodeManager nodeManager;
        
        @Inject
        APIGatewayConnector apiConnector;
        
        @Inject
        ResourceMonitor resourceMonitor;
        
        @Inject
        AV1017ComplianceManager complianceManager;
        
        @Inject
        PerformanceMonitor performanceMonitor;
        
        void onStart(@Observes StartupEvent ev) {
            logger.info("🔧 Initializing AV10-17 compliance framework...");
            
            // Initialize performance monitoring
            performanceMonitor.initializeMetrics();
            
            // Initialize compliance validation
            complianceManager.initializeCompliance();
            
            // Validate AV10-17 compliance
            boolean compliant = complianceManager.isAV1017Compliant();
            
            if (compliant) {
                logger.info("✅ AV10-17 COMPLIANCE: ALL REQUIREMENTS SATISFIED");
            } else {
                logger.severe("❌ AV10-17 COMPLIANCE: VIOLATIONS DETECTED");
                var report = complianceManager.generateComplianceReport();
                logger.severe("Compliance Score: " + String.format("%.2f", report.complianceScore) + "% (Required: 95%+)");
            }
            
            logger.info("🎯 AV10-17 node initialization completed");
        }

        @Override
        public int run(String... args) throws Exception {
            logger.info("═══════════════════════════════════════════════════════");
            logger.info("🌟 Aurigraph Basic Node v10.19.0-AV10-17");
            logger.info("═══════════════════════════════════════════════════════");
            logger.info("☕ Java: " + System.getProperty("java.version"));
            logger.info("⚡ Quarkus: 3.26.1");
            logger.info("🏗️ GraalVM Native: Enabled");
            logger.info("🔒 Compliance: AV10-17 Standards");
            logger.info("📋 Node ID: " + nodeId);
            logger.info("🌐 Platform URL: " + platformUrl);
            logger.info("🚪 Node Port: " + nodePort);
            logger.info("═══════════════════════════════════════════════════════");
            
            try {
                // Initialize resource monitoring
                resourceMonitor.startMonitoring();
                logger.info("✅ Resource monitoring started");
                
                // Initialize node manager
                nodeManager.initialize(nodeId);
                logger.info("✅ Node manager initialized");
                
                // Connect to AV10-18 platform
                boolean connected = apiConnector.connectToPlatform(platformUrl);
                if (connected) {
                    logger.info("✅ Connected to AV10-18 platform");
                } else {
                    logger.warning("⚠️ Failed to connect to platform - running in standalone mode");
                }
                
                logger.info("🎉 AV10-17 compliant basic node startup complete!");
                logger.info("📊 Web interface: http://localhost:" + nodePort);
                logger.info("📡 API endpoints: http://localhost:" + nodePort + "/api/*");
                logger.info("📈 Metrics: http://localhost:" + nodePort + "/metrics");
                logger.info("🏥 Health: http://localhost:" + nodePort + "/health");
                
                // Keep application running
                Quarkus.waitForExit();
                return 0;
                
            } catch (Exception e) {
                logger.severe("❌ Failed to start basic node: " + e.getMessage());
                e.printStackTrace();
                return 1;
            }
        }
    }
}
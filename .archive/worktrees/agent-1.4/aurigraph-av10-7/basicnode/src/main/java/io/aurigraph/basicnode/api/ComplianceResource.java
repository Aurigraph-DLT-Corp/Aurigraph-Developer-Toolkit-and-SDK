package io.aurigraph.basicnode.api;

import io.aurigraph.basicnode.compliance.AV1017ComplianceManager;
import io.aurigraph.basicnode.compliance.AV1017ValidationService;
import io.aurigraph.basicnode.compliance.PerformanceMonitor;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * AV10-17 Compliance API Resource
 * REST endpoints for compliance monitoring and validation
 * 
 * Endpoints:
 * - GET /compliance/status - Current compliance status
 * - GET /compliance/report - Detailed compliance report
 * - POST /compliance/validate - Trigger comprehensive validation
 * - GET /compliance/performance - Performance metrics
 * - GET /compliance/health - Health check with compliance info
 */
@Path("/compliance")
@Produces(MediaType.APPLICATION_JSON)
public class ComplianceResource {
    
    private static final Logger LOG = Logger.getLogger(ComplianceResource.class);
    
    @Inject
    AV1017ComplianceManager complianceManager;
    
    @Inject
    AV1017ValidationService validationService;
    
    @Inject
    PerformanceMonitor performanceMonitor;
    
    /**
     * Get current AV10-17 compliance status
     * Quick compliance check for monitoring systems
     */
    @GET
    @Path("/status")
    public Response getComplianceStatus() {
        try {
            boolean isCompliant = complianceManager.isAV1017Compliant();
            var report = complianceManager.generateComplianceReport();
            
            Map<String, Object> status = Map.of(
                "av1017_compliant", isCompliant,
                "compliance_score", report.complianceScore,
                "overall_status", report.overallStatus.toString(),
                "node_id", report.nodeId,
                "report_time", report.reportTime.toString(),
                "compliance_level", report.complianceLevel
            );
            
            return Response.ok(status).build();
            
        } catch (Exception e) {
            LOG.errorf("Failed to get compliance status: %s", e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to retrieve compliance status", 
                             "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Get detailed AV10-17 compliance report
     * Comprehensive compliance metrics for analysis
     */
    @GET
    @Path("/report")
    public Response getComplianceReport() {
        try {
            var complianceReport = complianceManager.generateComplianceReport();
            var performanceReport = performanceMonitor.generatePerformanceReport();
            
            Map<String, Object> detailedReport = Map.of(
                "compliance", complianceReport,
                "performance", performanceReport,
                "system_info", Map.of(
                    "java_version", System.getProperty("java.version"),
                    "java_vm", System.getProperty("java.vm.name"),
                    "os_name", System.getProperty("os.name"),
                    "os_arch", System.getProperty("os.arch"),
                    "available_processors", Runtime.getRuntime().availableProcessors(),
                    "max_memory_mb", Runtime.getRuntime().maxMemory() / (1024 * 1024),
                    "free_memory_mb", Runtime.getRuntime().freeMemory() / (1024 * 1024)
                )
            );
            
            return Response.ok(detailedReport).build();
            
        } catch (Exception e) {
            LOG.errorf("Failed to generate compliance report: %s", e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to generate compliance report", 
                             "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Trigger comprehensive AV10-17 validation
     * Runs all validation tests and returns detailed results
     */
    @POST
    @Path("/validate")
    public CompletableFuture<Response> triggerValidation() {
        try {
            LOG.info("🔍 Triggering comprehensive AV10-17 validation via API...");
            
            return validationService.performFullValidation()
                .thenApply(validationReport -> {
                    Map<String, Object> response = Map.of(
                        "validation_triggered", true,
                        "validation_type", validationReport.validationType,
                        "validation_time", validationReport.validationTime.toString(),
                        "validation_duration_ms", validationReport.validationDuration.toMillis(),
                        "compliance_score", validationReport.complianceScore,
                        "overall_compliant", validationReport.overallCompliant,
                        "validation_results", validationReport.validationResults,
                        "critical_failures", validationReport.criticalFailures
                    );
                    
                    return Response.ok(response).build();
                })
                .exceptionally(throwable -> {
                    LOG.errorf("Validation failed: %s", throwable.getMessage());
                    return Response.serverError()
                        .entity(Map.of("error", "Validation failed", 
                                     "message", throwable.getMessage()))
                        .build();
                });
                
        } catch (Exception e) {
            LOG.errorf("Failed to trigger validation: %s", e.getMessage());
            return CompletableFuture.completedFuture(
                Response.serverError()
                    .entity(Map.of("error", "Failed to trigger validation", 
                                 "message", e.getMessage()))
                    .build()
            );
        }
    }
    
    /**
     * Get current performance metrics
     * Real-time performance data for monitoring
     */
    @GET
    @Path("/performance")
    public Response getPerformanceMetrics() {
        try {
            var report = performanceMonitor.generatePerformanceReport();
            
            Map<String, Object> metrics = Map.of(
                "node_id", report.nodeId,
                "uptime_seconds", report.uptime.getSeconds(),
                "memory_usage_mb", report.memoryUsageMB,
                "cpu_usage_percent", report.cpuUsagePercent,
                "current_tps", report.currentTPS,
                "total_transactions", report.totalTransactions,
                "compliance_status", Map.of(
                    "memory_compliant", report.memoryCompliant,
                    "performance_compliant", report.performanceCompliant,
                    "uptime_compliant", report.uptimeCompliant,
                    "av1017_compliant", report.av1017Compliant
                ),
                "system_info", Map.of(
                    "java_version", report.javaVersion,
                    "jvm_name", report.jvmName,
                    "quarkus_version", report.quarkusVersion
                )
            );
            
            return Response.ok(metrics).build();
            
        } catch (Exception e) {
            LOG.errorf("Failed to get performance metrics: %s", e.getMessage());
            return Response.serverError()
                .entity(Map.of("error", "Failed to retrieve performance metrics", 
                             "message", e.getMessage()))
                .build();
        }
    }
    
    /**
     * Health check with compliance information
     * Standard health check endpoint with AV10-17 compliance status
     */
    @GET
    @Path("/health")
    public Response getHealthWithCompliance() {
        try {
            boolean isCompliant = complianceManager.isAV1017Compliant();
            var complianceReport = complianceManager.generateComplianceReport();
            var performanceReport = performanceMonitor.generatePerformanceReport();
            
            Map<String, Object> health = Map.of(
                "status", isCompliant ? "UP" : "DEGRADED",
                "av1017_compliant", isCompliant,
                "compliance_score", complianceReport.complianceScore,
                "checks", Map.of(
                    "memory", Map.of(
                        "status", performanceReport.memoryCompliant ? "UP" : "DOWN",
                        "usage_mb", performanceReport.memoryUsageMB,
                        "limit_mb", 512
                    ),
                    "performance", Map.of(
                        "status", performanceReport.performanceCompliant ? "UP" : "DEGRADED",
                        "current_tps", performanceReport.currentTPS,
                        "total_transactions", performanceReport.totalTransactions
                    ),
                    "uptime", Map.of(
                        "status", performanceReport.uptimeCompliant ? "UP" : "DEGRADED",
                        "uptime_seconds", performanceReport.uptime.getSeconds()
                    )
                ),
                "timestamp", java.time.Instant.now().toString()
            );
            
            Response.Status responseStatus = isCompliant ? 
                Response.Status.OK : Response.Status.SERVICE_UNAVAILABLE;
            
            return Response.status(responseStatus).entity(health).build();
            
        } catch (Exception e) {
            LOG.errorf("Health check failed: %s", e.getMessage());
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                .entity(Map.of(
                    "status", "DOWN",
                    "error", "Health check failed",
                    "message", e.getMessage(),
                    "timestamp", java.time.Instant.now().toString()
                ))
                .build();
        }
    }
    
    /**
     * Get AV10-17 specification summary
     * Returns the key requirements and standards
     */
    @GET
    @Path("/specification")
    public Response getAV1017Specification() {
        Map<String, Object> specification = Map.of(
            "av10_17_standards", Map.of(
                "java_version", "24",
                "quarkus_version", "3.26.1",
                "graalvm_native", "Required for production",
                "performance_targets", Map.of(
                    "tps_capability", "1,000,000+",
                    "startup_time", "Sub-second with native",
                    "memory_limit_basic", "512MB",
                    "memory_limit_validator", "1GB",
                    "uptime_target", "99.99%",
                    "latency_target", "<100ms"
                ),
                "security_requirements", Map.of(
                    "quantum_security_level", "Level 6",
                    "post_quantum_crypto", "CRYSTALS-Kyber, CRYSTALS-Dilithium",
                    "key_rotation", "24-hour automatic",
                    "audit_logging", "Immutable audit trails"
                ),
                "integration_requirements", Map.of(
                    "av10_18_platform", "Full platform integration",
                    "hyperraft_consensus", "HyperRAFT++ V2.0 participation",
                    "cross_chain_support", "100+ blockchain bridge compatibility",
                    "channel_architecture", "CONSENSUS, PROCESSING, GEOGRAPHIC, SECURITY, RWA"
                )
            ),
            "compliance_validation", Map.of(
                "required_score", "95%+",
                "critical_violations", "Zero tolerance",
                "monitoring_frequency", "Continuous",
                "reporting_frequency", "Daily automated reports"
            )
        );
        
        return Response.ok(specification).build();
    }
}
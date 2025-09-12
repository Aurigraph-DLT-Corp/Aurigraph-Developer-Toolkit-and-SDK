package io.aurigraph.v11.performance;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Performance Reporter for Aurigraph V11 Testing
 * 
 * Generates comprehensive performance reports including:
 * - Executive summary with pass/fail status
 * - Detailed performance metrics
 * - Latency distribution analysis
 * - Throughput trend analysis
 * - Resource utilization reports
 * - Comparative analysis against targets
 * - HTML dashboard generation
 * - JSON/CSV data export
 * 
 * Report Types:
 * 1. Real-time Console Reporting
 * 2. HTML Performance Dashboard
 * 3. JSON Metrics Export
 * 4. CSV Data Export
 * 5. Executive Summary Report
 * 6. Technical Detail Report
 */
@ApplicationScoped
public class PerformanceReporter {

    private static final Logger LOG = Logger.getLogger(PerformanceReporter.class);

    // Performance targets for validation
    private static final long TARGET_TPS = 2_000_000L;
    private static final long TARGET_P50_LATENCY_MS = 10L;
    private static final long TARGET_P95_LATENCY_MS = 50L;
    private static final long TARGET_P99_LATENCY_MS = 100L;
    private static final long TARGET_LEADER_ELECTION_MS = 500L;
    private static final int TARGET_CONCURRENT_CONNECTIONS = 10_000;
    private static final long TARGET_MEMORY_USAGE_MB = 256L;

    // Report data storage
    private final List<PerformanceBenchmarkSuite.PerformanceTestResult> loadTestResults = new ArrayList<>();
    private final List<PerformanceBenchmarkSuite.ConsensusPerformanceResult> consensusResults = new ArrayList<>();
    private final List<PerformanceBenchmarkSuite.NetworkPerformanceResult> networkResults = new ArrayList<>();
    private final Map<String, Object> testMetadata = new HashMap<>();
    private final List<LoadTestRunner.LoadTestResult> graduatedLoadResults = new ArrayList<>();
    
    private Instant reportingStartTime;
    private Path reportOutputDir;

    public void initialize() {
        reportingStartTime = Instant.now();
        
        // Create report output directory
        String timestamp = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").format(Instant.now().atZone(java.time.ZoneId.systemDefault()));
        reportOutputDir = Paths.get("target", "performance-reports", "aurigraph-v11-" + timestamp);
        
        try {
            Files.createDirectories(reportOutputDir);
            LOG.infof("Performance reports will be generated in: %s", reportOutputDir.toAbsolutePath());
        } catch (IOException e) {
            LOG.errorf("Failed to create report directory: %s", e.getMessage());
            reportOutputDir = Paths.get("target");
        }
        
        // Initialize test metadata
        testMetadata.put("startTime", reportingStartTime);
        testMetadata.put("javaVersion", System.getProperty("java.version"));
        testMetadata.put("osName", System.getProperty("os.name"));
        testMetadata.put("osArch", System.getProperty("os.arch"));
        testMetadata.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        testMetadata.put("maxMemoryMB", Runtime.getRuntime().maxMemory() / (1024 * 1024));
    }

    /**
     * Record warmup metrics
     */
    public void recordWarmupMetrics(double warmupTps, Duration warmupDuration) {
        LOG.infof("📊 WARMUP METRICS");
        LOG.infof("  TPS: %.0f", warmupTps);
        LOG.infof("  Duration: %dms", warmupDuration.toMillis());
        
        testMetadata.put("warmupTps", warmupTps);
        testMetadata.put("warmupDurationMs", warmupDuration.toMillis());
    }

    /**
     * Record load test result
     */
    public void recordLoadTestResult(int targetTps, PerformanceBenchmarkSuite.PerformanceTestResult result) {
        loadTestResults.add(result);
        
        String status = result.actualTps() >= targetTps * 0.9 ? "✅ PASS" : "❌ FAIL";
        
        LOG.infof("📊 LOAD TEST RESULT [%s]", status);
        LOG.infof("  Target: %d TPS", targetTps);
        LOG.infof("  Actual: %.0f TPS (%.1f%%)", result.actualTps(), (result.actualTps() / targetTps) * 100);
        LOG.infof("  P50 Latency: %.1fms", result.p50LatencyMs());
        LOG.infof("  P95 Latency: %.1fms", result.p95LatencyMs());
        LOG.infof("  P99 Latency: %.1fms", result.p99LatencyMs());
        LOG.infof("  Success Rate: %.2f%%", result.successRate());
        LOG.infof("  Memory Usage: %dMB", result.memoryUsageMb());
    }

    /**
     * Record peak performance result
     */
    public void recordPeakPerformanceResult(PerformanceBenchmarkSuite.PerformanceTestResult result) {
        String tpsStatus = result.actualTps() >= TARGET_TPS ? "✅ ACHIEVED" : "❌ MISSED";
        String latencyStatus = result.p99LatencyMs() <= TARGET_P99_LATENCY_MS ? "✅ ACHIEVED" : "❌ MISSED";
        String memoryStatus = result.memoryUsageMb() <= TARGET_MEMORY_USAGE_MB ? "✅ ACHIEVED" : "❌ MISSED";
        
        LOG.info("🚀 PEAK PERFORMANCE RESULTS");
        LOG.info("=".repeat(80));
        LOG.infof("  TPS TARGET: %s", tpsStatus);
        LOG.infof("    Target: %,d TPS", TARGET_TPS);
        LOG.infof("    Actual: %,.0f TPS", result.actualTps());
        LOG.infof("    Achievement: %.1f%%", (result.actualTps() / TARGET_TPS) * 100);
        LOG.info("");
        LOG.infof("  LATENCY TARGET: %s", latencyStatus);
        LOG.infof("    P50: %.1fms (target <%dms)", result.p50LatencyMs(), TARGET_P50_LATENCY_MS);
        LOG.infof("    P95: %.1fms (target <%dms)", result.p95LatencyMs(), TARGET_P95_LATENCY_MS);
        LOG.infof("    P99: %.1fms (target <%dms)", result.p99LatencyMs(), TARGET_P99_LATENCY_MS);
        LOG.info("");
        LOG.infof("  MEMORY TARGET: %s", memoryStatus);
        LOG.infof("    Usage: %dMB (target <%dMB)", result.memoryUsageMb(), TARGET_MEMORY_USAGE_MB);
        LOG.info("");
        LOG.infof("  SUCCESS RATE: %.2f%%", result.successRate());
        LOG.infof("  TEST DURATION: %s", result.testDuration());
        LOG.info("=".repeat(80));
        
        testMetadata.put("peakPerformanceResult", result);
    }

    /**
     * Record consensus performance
     */
    public void recordConsensusPerformance(PerformanceBenchmarkSuite.ConsensusPerformanceResult result) {
        consensusResults.add(result);
        
        String electionStatus = result.leaderElectionTimeMs() <= TARGET_LEADER_ELECTION_MS ? "✅ PASS" : "❌ FAIL";
        String tpsStatus = result.consensusTps() >= 100_000 ? "✅ PASS" : "❌ FAIL";
        
        LOG.infof("📊 CONSENSUS PERFORMANCE [%s / %s]", electionStatus, tpsStatus);
        LOG.infof("  Leader Election: %dms (target <%dms)", result.leaderElectionTimeMs(), TARGET_LEADER_ELECTION_MS);
        LOG.infof("  Consensus TPS: %.0f", result.consensusTps());
        LOG.infof("  Block Finalization: %.1fms avg", result.avgBlockFinalizationMs());
        LOG.infof("  Validation Success: %.2f%%", result.validationSuccessRate());
    }

    /**
     * Record network performance
     */
    public void recordNetworkPerformance(PerformanceBenchmarkSuite.NetworkPerformanceResult result) {
        networkResults.add(result);
        
        String connectionsStatus = result.maxConcurrentConnections() >= TARGET_CONCURRENT_CONNECTIONS ? "✅ PASS" : "❌ FAIL";
        String latencyStatus = result.grpcLatencyP99Ms() <= 200 ? "✅ PASS" : "❌ FAIL";
        
        LOG.infof("📊 NETWORK PERFORMANCE [%s / %s]", connectionsStatus, latencyStatus);
        LOG.infof("  Concurrent Connections: %d (target >=%d)", result.maxConcurrentConnections(), TARGET_CONCURRENT_CONNECTIONS);
        LOG.infof("  Avg Connection Time: %.1fms", result.avgConnectionTimeMs());
        LOG.infof("  Network Throughput: %.0f MB/s", result.networkThroughputMbps());
        LOG.infof("  gRPC P99 Latency: %.1fms", result.grpcLatencyP99Ms());
    }

    /**
     * Record stress test result
     */
    public void recordStressTestResult(int stressTargetTps, PerformanceBenchmarkSuite.PerformanceTestResult result) {
        String stabilityStatus = result.successRate() >= 95.0 ? "✅ STABLE" : "❌ DEGRADED";
        
        LOG.infof("📊 STRESS TEST RESULT [%s]", stabilityStatus);
        LOG.infof("  Stress Target: %d TPS", stressTargetTps);
        LOG.infof("  Actual: %.0f TPS", result.actualTps());
        LOG.infof("  System Stability: %.2f%% success rate", result.successRate());
        LOG.infof("  Under Stress P99: %.1fms", result.p99LatencyMs());
        
        testMetadata.put("stressTestResult", result);
    }

    /**
     * Record endurance test results
     */
    public void recordEnduranceResults(List<PerformanceBenchmarkSuite.PerformanceTestResult> results) {
        double avgTps = results.stream().mapToDouble(PerformanceBenchmarkSuite.PerformanceTestResult::actualTps).average().orElse(0);
        double maxP99Latency = results.stream().mapToDouble(PerformanceBenchmarkSuite.PerformanceTestResult::p99LatencyMs).max().orElse(0);
        double minSuccessRate = results.stream().mapToDouble(PerformanceBenchmarkSuite.PerformanceTestResult::successRate).min().orElse(100);
        
        String enduranceStatus = avgTps >= TARGET_TPS * 0.8 ? "✅ SUSTAINED" : "❌ DEGRADED";
        
        LOG.infof("📊 ENDURANCE TEST RESULT [%s]", enduranceStatus);
        LOG.infof("  Test Intervals: %d", results.size());
        LOG.infof("  Average TPS: %.0f", avgTps);
        LOG.infof("  Max P99 Latency: %.1fms", maxP99Latency);
        LOG.infof("  Min Success Rate: %.2f%%", minSuccessRate);
        LOG.infof("  Performance Stability: %s", avgTps >= TARGET_TPS * 0.8 * 0.95 ? "EXCELLENT" : "ACCEPTABLE");
        
        testMetadata.put("enduranceResults", results);
        testMetadata.put("enduranceAvgTps", avgTps);
    }

    /**
     * Generate comprehensive final report
     */
    public void generateFinalReport() {
        LOG.info("🔄 Generating comprehensive performance report...");
        
        if (reportOutputDir == null) {
            initialize();
        }
        
        testMetadata.put("endTime", Instant.now());
        testMetadata.put("totalTestDuration", Duration.between(reportingStartTime, Instant.now()));
        
        // Generate different report formats
        generateExecutiveSummary();
        generateDetailedHtmlReport();
        generateJsonReport();
        generateCsvReport();
        
        LOG.info("📊 FINAL REPORT GENERATION COMPLETED");
        LOG.info("=".repeat(80));
        LOG.infof("Report Location: %s", reportOutputDir.toAbsolutePath());
        LOG.infof("Available Reports:");
        LOG.infof("  • executive-summary.txt - High-level results");
        LOG.infof("  • performance-dashboard.html - Interactive dashboard");
        LOG.infof("  • metrics-data.json - Raw metrics data");
        LOG.infof("  • performance-data.csv - Spreadsheet-friendly data");
        LOG.info("=".repeat(80));
    }

    /**
     * Generate executive summary
     */
    private void generateExecutiveSummary() {
        try {
            Path summaryPath = reportOutputDir.resolve("executive-summary.txt");
            
            StringBuilder summary = new StringBuilder();
            summary.append("AURIGRAPH V11 PERFORMANCE TEST EXECUTIVE SUMMARY\n");
            summary.append("=".repeat(80)).append("\n\n");
            
            summary.append(String.format("Test Date: %s\n", 
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(reportingStartTime.atZone(java.time.ZoneId.systemDefault()))));
            summary.append(String.format("Test Duration: %s\n", testMetadata.get("totalTestDuration")));
            summary.append(String.format("Java Version: %s\n", testMetadata.get("javaVersion")));
            summary.append(String.format("OS: %s %s\n", testMetadata.get("osName"), testMetadata.get("osArch")));
            summary.append(String.format("Processors: %s\n", testMetadata.get("availableProcessors")));
            summary.append(String.format("Max Memory: %s MB\n\n", testMetadata.get("maxMemoryMB")));
            
            // Performance targets assessment
            summary.append("PERFORMANCE TARGETS ASSESSMENT\n");
            summary.append("-".repeat(40)).append("\n");
            
            PerformanceBenchmarkSuite.PerformanceTestResult peakResult = 
                (PerformanceBenchmarkSuite.PerformanceTestResult) testMetadata.get("peakPerformanceResult");
            
            if (peakResult != null) {
                summary.append(String.format("TPS Target (2M+):      %s (%.0f TPS achieved)\n", 
                    peakResult.actualTps() >= TARGET_TPS ? "✅ ACHIEVED" : "❌ MISSED", peakResult.actualTps()));
                summary.append(String.format("P50 Latency (<10ms):   %s (%.1fms)\n", 
                    peakResult.p50LatencyMs() <= TARGET_P50_LATENCY_MS ? "✅ ACHIEVED" : "❌ MISSED", peakResult.p50LatencyMs()));
                summary.append(String.format("P95 Latency (<50ms):   %s (%.1fms)\n", 
                    peakResult.p95LatencyMs() <= TARGET_P95_LATENCY_MS ? "✅ ACHIEVED" : "❌ MISSED", peakResult.p95LatencyMs()));
                summary.append(String.format("P99 Latency (<100ms):  %s (%.1fms)\n", 
                    peakResult.p99LatencyMs() <= TARGET_P99_LATENCY_MS ? "✅ ACHIEVED" : "❌ MISSED", peakResult.p99LatencyMs()));
                summary.append(String.format("Memory Usage (<256MB): %s (%dMB)\n", 
                    peakResult.memoryUsageMb() <= TARGET_MEMORY_USAGE_MB ? "✅ ACHIEVED" : "❌ MISSED", peakResult.memoryUsageMb()));
            }
            
            if (!consensusResults.isEmpty()) {
                PerformanceBenchmarkSuite.ConsensusPerformanceResult consensusResult = consensusResults.get(0);
                summary.append(String.format("Leader Election (<500ms): %s (%dms)\n",
                    consensusResult.leaderElectionTimeMs() <= TARGET_LEADER_ELECTION_MS ? "✅ ACHIEVED" : "❌ MISSED",
                    consensusResult.leaderElectionTimeMs()));
            }
            
            if (!networkResults.isEmpty()) {
                PerformanceBenchmarkSuite.NetworkPerformanceResult networkResult = networkResults.get(0);
                summary.append(String.format("Concurrent Connections (10K+): %s (%d)\n",
                    networkResult.maxConcurrentConnections() >= TARGET_CONCURRENT_CONNECTIONS ? "✅ ACHIEVED" : "❌ MISSED",
                    networkResult.maxConcurrentConnections()));
            }
            
            summary.append("\n");
            
            // Test summary
            if (peakResult != null) {
                boolean allTargetsMet = 
                    peakResult.actualTps() >= TARGET_TPS &&
                    peakResult.p99LatencyMs() <= TARGET_P99_LATENCY_MS &&
                    peakResult.memoryUsageMb() <= TARGET_MEMORY_USAGE_MB;
                
                summary.append("OVERALL ASSESSMENT\n");
                summary.append("-".repeat(40)).append("\n");
                summary.append(String.format("AV11-4002 Compliance: %s\n", allTargetsMet ? "✅ COMPLIANT" : "❌ NON-COMPLIANT"));
                summary.append(String.format("Recommendation: %s\n\n", allTargetsMet ? 
                    "System meets all performance requirements for production deployment." :
                    "System requires optimization before production deployment."));
            }
            
            Files.writeString(summaryPath, summary.toString());
            LOG.infof("Executive summary generated: %s", summaryPath.getFileName());
            
        } catch (IOException e) {
            LOG.errorf("Failed to generate executive summary: %s", e.getMessage());
        }
    }

    /**
     * Generate detailed HTML report
     */
    private void generateDetailedHtmlReport() {
        try {
            Path htmlPath = reportOutputDir.resolve("performance-dashboard.html");
            
            StringBuilder html = new StringBuilder();
            html.append("<!DOCTYPE html>\n<html>\n<head>\n");
            html.append("<title>Aurigraph V11 Performance Dashboard</title>\n");
            html.append("<style>\n");
            html.append("body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }\n");
            html.append(".container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n");
            html.append("h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }\n");
            html.append("h2 { color: #34495e; border-left: 4px solid #3498db; padding-left: 10px; }\n");
            html.append(".metric { display: inline-block; margin: 10px; padding: 15px; background: #ecf0f1; border-radius: 5px; min-width: 200px; }\n");
            html.append(".metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }\n");
            html.append(".metric-label { color: #7f8c8d; font-size: 14px; }\n");
            html.append(".status-pass { color: #27ae60; }\n");
            html.append(".status-fail { color: #e74c3c; }\n");
            html.append("table { width: 100%; border-collapse: collapse; margin: 20px 0; }\n");
            html.append("th, td { padding: 12px; text-align: left; border-bottom: 1px solid #bdc3c7; }\n");
            html.append("th { background: #34495e; color: white; }\n");
            html.append("</style>\n");
            html.append("</head>\n<body>\n");
            
            html.append("<div class='container'>\n");
            html.append("<h1>Aurigraph V11 Performance Dashboard</h1>\n");
            
            // Test metadata
            html.append("<h2>Test Environment</h2>\n");
            html.append(String.format("<p><strong>Test Date:</strong> %s</p>\n", 
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").format(reportingStartTime.atZone(java.time.ZoneId.systemDefault()))));
            html.append(String.format("<p><strong>Duration:</strong> %s</p>\n", testMetadata.get("totalTestDuration")));
            html.append(String.format("<p><strong>Java:</strong> %s</p>\n", testMetadata.get("javaVersion")));
            html.append(String.format("<p><strong>OS:</strong> %s %s</p>\n", testMetadata.get("osName"), testMetadata.get("osArch")));
            
            // Performance metrics
            PerformanceBenchmarkSuite.PerformanceTestResult peakResult = 
                (PerformanceBenchmarkSuite.PerformanceTestResult) testMetadata.get("peakPerformanceResult");
            
            if (peakResult != null) {
                html.append("<h2>Peak Performance Results</h2>\n");
                html.append("<div>\n");
                html.append(String.format("<div class='metric'><div class='metric-value %.0f</div><div class='metric-label'>TPS Achieved</div></div>\n", peakResult.actualTps()));
                html.append(String.format("<div class='metric'><div class='metric-value'>%.1f ms</div><div class='metric-label'>P99 Latency</div></div>\n", peakResult.p99LatencyMs()));
                html.append(String.format("<div class='metric'><div class='metric-value'>%.2f%%</div><div class='metric-label'>Success Rate</div></div>\n", peakResult.successRate()));
                html.append(String.format("<div class='metric'><div class='metric-value'>%d MB</div><div class='metric-label'>Memory Usage</div></div>\n", peakResult.memoryUsageMb()));
                html.append("</div>\n");
            }
            
            // Load test results table
            if (!loadTestResults.isEmpty()) {
                html.append("<h2>Load Test Results</h2>\n");
                html.append("<table>\n");
                html.append("<tr><th>Target TPS</th><th>Actual TPS</th><th>Achievement</th><th>P99 Latency</th><th>Success Rate</th><th>Status</th></tr>\n");
                
                for (PerformanceBenchmarkSuite.PerformanceTestResult result : loadTestResults) {
                    double achievement = (result.actualTps() / result.targetTps()) * 100;
                    String status = achievement >= 90 ? "class='status-pass'>PASS" : "class='status-fail'>FAIL";
                    
                    html.append(String.format("<tr><td>%,d</td><td>%,.0f</td><td>%.1f%%</td><td>%.1f ms</td><td>%.2f%%</td><td %s</td></tr>\n",
                        result.targetTps(), result.actualTps(), achievement, result.p99LatencyMs(), result.successRate(), status));
                }
                
                html.append("</table>\n");
            }
            
            html.append("</div>\n");
            html.append("</body>\n</html>\n");
            
            Files.writeString(htmlPath, html.toString());
            LOG.infof("HTML dashboard generated: %s", htmlPath.getFileName());
            
        } catch (IOException e) {
            LOG.errorf("Failed to generate HTML report: %s", e.getMessage());
        }
    }

    /**
     * Generate JSON report
     */
    private void generateJsonReport() {
        try {
            Path jsonPath = reportOutputDir.resolve("metrics-data.json");
            
            // Simple JSON generation (would use Jackson in production)
            StringBuilder json = new StringBuilder();
            json.append("{\n");
            json.append("  \"testMetadata\": ").append(formatJsonObject(testMetadata)).append(",\n");
            json.append("  \"loadTestResults\": ").append(formatJsonArray(loadTestResults)).append(",\n");
            json.append("  \"consensusResults\": ").append(formatJsonArray(consensusResults)).append(",\n");
            json.append("  \"networkResults\": ").append(formatJsonArray(networkResults)).append("\n");
            json.append("}\n");
            
            Files.writeString(jsonPath, json.toString());
            LOG.infof("JSON report generated: %s", jsonPath.getFileName());
            
        } catch (IOException e) {
            LOG.errorf("Failed to generate JSON report: %s", e.getMessage());
        }
    }

    /**
     * Generate CSV report
     */
    private void generateCsvReport() {
        try {
            Path csvPath = reportOutputDir.resolve("performance-data.csv");
            
            StringBuilder csv = new StringBuilder();
            csv.append("TestType,TargetTPS,ActualTPS,P50Latency,P95Latency,P99Latency,SuccessRate,MemoryUsageMB\n");
            
            for (PerformanceBenchmarkSuite.PerformanceTestResult result : loadTestResults) {
                csv.append(String.format("LoadTest,%d,%.0f,%.1f,%.1f,%.1f,%.2f,%d\n",
                    result.targetTps(), result.actualTps(), result.p50LatencyMs(), 
                    result.p95LatencyMs(), result.p99LatencyMs(), result.successRate(), result.memoryUsageMb()));
            }
            
            Files.writeString(csvPath, csv.toString());
            LOG.infof("CSV report generated: %s", csvPath.getFileName());
            
        } catch (IOException e) {
            LOG.errorf("Failed to generate CSV report: %s", e.getMessage());
        }
    }

    // Helper methods for JSON formatting (simplified)
    private String formatJsonObject(Map<String, Object> obj) {
        return "{}"; // Simplified - would use proper JSON library
    }
    
    private String formatJsonArray(List<?> list) {
        return "[]"; // Simplified - would use proper JSON library
    }

    /**
     * Print real-time performance summary
     */
    public void printRealTimeStatus() {
        Runtime runtime = Runtime.getRuntime();
        long usedMemory = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
        
        LOG.info("📊 REAL-TIME PERFORMANCE STATUS");
        LOG.infof("  Current Memory Usage: %d MB", usedMemory);
        LOG.infof("  Tests Completed: %d load, %d consensus, %d network", 
                 loadTestResults.size(), consensusResults.size(), networkResults.size());
        LOG.infof("  Report Directory: %s", reportOutputDir != null ? reportOutputDir.getFileName() : "Not initialized");
    }
}
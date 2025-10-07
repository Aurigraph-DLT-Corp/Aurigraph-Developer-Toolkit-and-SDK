package io.aurigraph.v11.services;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Smart Contract Verification Service
 *
 * Provides source code verification capabilities including:
 * - Contract source verification against deployed bytecode
 * - Bytecode comparison and matching
 * - Security vulnerability scanning
 * - Verification report generation
 * - Verification status tracking
 *
 * @author Backend Development Agent (BDA)
 * @version 11.0.0
 * @since Sprint 11
 */
@ApplicationScoped
public class ContractVerifier {

    private static final Logger LOGGER = LoggerFactory.getLogger(ContractVerifier.class);

    @Inject
    ContractCompiler contractCompiler;

    // Virtual thread executor for concurrent verification
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    // Verification cache
    private final Map<String, VerificationResult> verificationCache = new ConcurrentHashMap<>();

    // Verification statistics
    private long totalVerifications = 0;
    private long successfulVerifications = 0;
    private long failedVerifications = 0;

    /**
     * Verification Status enumeration
     */
    public enum VerificationStatus {
        VERIFIED,
        PARTIAL,
        FAILED,
        PENDING,
        INVALID
    }

    /**
     * Security Severity levels
     */
    public enum SecuritySeverity {
        CRITICAL,
        HIGH,
        MEDIUM,
        LOW,
        INFO
    }

    /**
     * Verification Result
     */
    public static class VerificationResult {
        private final String contractAddress;
        private final VerificationStatus status;
        private final boolean bytecodeMatch;
        private final double matchPercentage;
        private final String verifiedSourceHash;
        private final List<String> differences;
        private final List<SecurityIssue> securityIssues;
        private final Map<String, Object> metadata;
        private final Instant verifiedAt;
        private final String compilerVersion;

        public VerificationResult(String contractAddress, VerificationStatus status,
                                boolean bytecodeMatch, double matchPercentage,
                                String verifiedSourceHash, List<String> differences,
                                List<SecurityIssue> securityIssues, Map<String, Object> metadata,
                                Instant verifiedAt, String compilerVersion) {
            this.contractAddress = contractAddress;
            this.status = status;
            this.bytecodeMatch = bytecodeMatch;
            this.matchPercentage = matchPercentage;
            this.verifiedSourceHash = verifiedSourceHash;
            this.differences = differences != null ? new ArrayList<>(differences) : new ArrayList<>();
            this.securityIssues = securityIssues != null ? new ArrayList<>(securityIssues) : new ArrayList<>();
            this.metadata = metadata != null ? new HashMap<>(metadata) : new HashMap<>();
            this.verifiedAt = verifiedAt;
            this.compilerVersion = compilerVersion;
        }

        // Getters
        public String getContractAddress() { return contractAddress; }
        public VerificationStatus getStatus() { return status; }
        public boolean isBytecodeMatch() { return bytecodeMatch; }
        public double getMatchPercentage() { return matchPercentage; }
        public String getVerifiedSourceHash() { return verifiedSourceHash; }
        public List<String> getDifferences() { return new ArrayList<>(differences); }
        public List<SecurityIssue> getSecurityIssues() { return new ArrayList<>(securityIssues); }
        public Map<String, Object> getMetadata() { return new HashMap<>(metadata); }
        public Instant getVerifiedAt() { return verifiedAt; }
        public String getCompilerVersion() { return compilerVersion; }
    }

    /**
     * Security Issue found during verification
     */
    public static class SecurityIssue {
        private final String id;
        private final String title;
        private final String description;
        private final SecuritySeverity severity;
        private final int line;
        private final String code;
        private final String recommendation;
        private final List<String> references;

        public SecurityIssue(String id, String title, String description,
                           SecuritySeverity severity, int line, String code,
                           String recommendation, List<String> references) {
            this.id = id;
            this.title = title;
            this.description = description;
            this.severity = severity;
            this.line = line;
            this.code = code;
            this.recommendation = recommendation;
            this.references = references != null ? new ArrayList<>(references) : new ArrayList<>();
        }

        // Getters
        public String getId() { return id; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public SecuritySeverity getSeverity() { return severity; }
        public int getLine() { return line; }
        public String getCode() { return code; }
        public String getRecommendation() { return recommendation; }
        public List<String> getReferences() { return new ArrayList<>(references); }
    }

    /**
     * Verification Report
     */
    public static class VerificationReport {
        private final String contractAddress;
        private final VerificationResult verificationResult;
        private final List<SecurityIssue> criticalIssues;
        private final List<SecurityIssue> highIssues;
        private final List<SecurityIssue> mediumIssues;
        private final List<SecurityIssue> lowIssues;
        private final Map<String, Object> statistics;
        private final String overallRisk;
        private final List<String> recommendations;
        private final Instant generatedAt;

        public VerificationReport(String contractAddress, VerificationResult verificationResult,
                                List<SecurityIssue> criticalIssues, List<SecurityIssue> highIssues,
                                List<SecurityIssue> mediumIssues, List<SecurityIssue> lowIssues,
                                Map<String, Object> statistics, String overallRisk,
                                List<String> recommendations, Instant generatedAt) {
            this.contractAddress = contractAddress;
            this.verificationResult = verificationResult;
            this.criticalIssues = criticalIssues != null ? new ArrayList<>(criticalIssues) : new ArrayList<>();
            this.highIssues = highIssues != null ? new ArrayList<>(highIssues) : new ArrayList<>();
            this.mediumIssues = mediumIssues != null ? new ArrayList<>(mediumIssues) : new ArrayList<>();
            this.lowIssues = lowIssues != null ? new ArrayList<>(lowIssues) : new ArrayList<>();
            this.statistics = statistics != null ? new HashMap<>(statistics) : new HashMap<>();
            this.overallRisk = overallRisk;
            this.recommendations = recommendations != null ? new ArrayList<>(recommendations) : new ArrayList<>();
            this.generatedAt = generatedAt;
        }

        // Getters
        public String getContractAddress() { return contractAddress; }
        public VerificationResult getVerificationResult() { return verificationResult; }
        public List<SecurityIssue> getCriticalIssues() { return new ArrayList<>(criticalIssues); }
        public List<SecurityIssue> getHighIssues() { return new ArrayList<>(highIssues); }
        public List<SecurityIssue> getMediumIssues() { return new ArrayList<>(mediumIssues); }
        public List<SecurityIssue> getLowIssues() { return new ArrayList<>(lowIssues); }
        public Map<String, Object> getStatistics() { return new HashMap<>(statistics); }
        public String getOverallRisk() { return overallRisk; }
        public List<String> getRecommendations() { return new ArrayList<>(recommendations); }
        public Instant getGeneratedAt() { return generatedAt; }
    }

    /**
     * Verify contract source code against deployed bytecode
     *
     * @param contractAddress Deployed contract address
     * @param sourceCode Source code to verify
     * @param compilerVersion Compiler version used
     * @return VerificationResult with verification status
     */
    public Uni<VerificationResult> verifyContract(String contractAddress, String sourceCode,
                                                 String compilerVersion) {
        return Uni.createFrom().item(() -> {
            totalVerifications++;
            LOGGER.info("Verifying contract: {}", contractAddress);

            try {
                // Validate inputs
                if (contractAddress == null || contractAddress.trim().isEmpty()) {
                    throw new IllegalArgumentException("Contract address is required");
                }

                if (sourceCode == null || sourceCode.trim().isEmpty()) {
                    throw new IllegalArgumentException("Source code is required");
                }

                // Check cache
                String cacheKey = generateCacheKey(contractAddress, sourceCode, compilerVersion);
                if (verificationCache.containsKey(cacheKey)) {
                    LOGGER.debug("Returning cached verification result");
                    return verificationCache.get(cacheKey);
                }

                // Compile source code
                ContractCompiler.CompilationResult compilation = contractCompiler
                    .compileSolidity(sourceCode, compilerVersion, new HashMap<>())
                    .await().indefinitely();

                if (!compilation.isSuccess()) {
                    LOGGER.warn("Compilation failed during verification");
                    failedVerifications++;
                    return createFailedResult(contractAddress, "Compilation failed",
                        compilation.getErrors(), compilerVersion);
                }

                // Get deployed bytecode (simulated for now)
                String deployedBytecode = getDeployedBytecode(contractAddress);

                // Compare bytecode
                BytecodeComparison comparison = compareBytecode(deployedBytecode, compilation.getBytecode());

                // Perform security scan
                List<SecurityIssue> securityIssues = scanSecurityIssues(sourceCode);

                // Calculate source hash
                String sourceHash = calculateSourceHash(sourceCode);

                // Determine verification status
                VerificationStatus status = determineVerificationStatus(comparison, securityIssues);

                // Create metadata
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("bytecodeSize", compilation.getBytecode().length());
                metadata.put("deployedBytecodeSize", deployedBytecode.length());
                metadata.put("securityIssuesCount", securityIssues.size());
                metadata.put("criticalIssuesCount",
                    securityIssues.stream().filter(i -> i.getSeverity() == SecuritySeverity.CRITICAL).count());

                // Create verification result
                VerificationResult result = new VerificationResult(
                    contractAddress,
                    status,
                    comparison.isMatch(),
                    comparison.getMatchPercentage(),
                    sourceHash,
                    comparison.getDifferences(),
                    securityIssues,
                    metadata,
                    Instant.now(),
                    compilerVersion
                );

                // Cache result
                verificationCache.put(cacheKey, result);

                if (status == VerificationStatus.VERIFIED) {
                    successfulVerifications++;
                } else {
                    failedVerifications++;
                }

                LOGGER.info("Verification completed: {} ({}% match)", status, comparison.getMatchPercentage());
                return result;

            } catch (Exception e) {
                failedVerifications++;
                LOGGER.error("Verification failed with exception", e);
                return createFailedResult(contractAddress, "Verification error: " + e.getMessage(),
                    List.of(e.getMessage()), compilerVersion);
            }
        }).runSubscriptionOn(executor);
    }

    /**
     * Compare deployed bytecode with compiled bytecode
     *
     * @param deployedBytecode Deployed contract bytecode
     * @param compiledBytecode Compiled source bytecode
     * @return BytecodeComparison result
     */
    public BytecodeComparison compareBytecode(String deployedBytecode, String compiledBytecode) {
        LOGGER.debug("Comparing bytecode");

        List<String> differences = new ArrayList<>();

        // Normalize bytecode (remove 0x prefix if present)
        String deployed = normalizedBytecode(deployedBytecode);
        String compiled = normalizedBytecode(compiledBytecode);

        // Exact match check
        if (deployed.equals(compiled)) {
            return new BytecodeComparison(true, 100.0, differences);
        }

        // Calculate similarity percentage
        double similarity = calculateSimilarity(deployed, compiled);

        // Find differences
        if (similarity < 100.0) {
            differences.add(String.format("Length difference: deployed=%d, compiled=%d",
                deployed.length(), compiled.length()));

            if (deployed.length() != compiled.length()) {
                differences.add("Bytecode length mismatch");
            }

            // Check for metadata differences (often at the end)
            if (similarity > 95.0) {
                differences.add("Minor differences detected (likely metadata)");
            } else {
                differences.add("Significant bytecode differences detected");
            }
        }

        boolean isMatch = similarity >= 99.0; // Allow for minor metadata differences
        return new BytecodeComparison(isMatch, similarity, differences);
    }

    /**
     * Bytecode Comparison Result
     */
    public static class BytecodeComparison {
        private final boolean match;
        private final double matchPercentage;
        private final List<String> differences;

        public BytecodeComparison(boolean match, double matchPercentage, List<String> differences) {
            this.match = match;
            this.matchPercentage = matchPercentage;
            this.differences = differences != null ? new ArrayList<>(differences) : new ArrayList<>();
        }

        public boolean isMatch() { return match; }
        public double getMatchPercentage() { return matchPercentage; }
        public List<String> getDifferences() { return new ArrayList<>(differences); }
    }

    /**
     * Generate comprehensive verification report
     *
     * @param contractAddress Contract address to verify
     * @return VerificationReport with detailed analysis
     */
    public Uni<VerificationReport> generateVerificationReport(String contractAddress) {
        return Uni.createFrom().item(() -> {
            LOGGER.info("Generating verification report for: {}", contractAddress);

            // Get cached verification result
            VerificationResult verificationResult = null;
            for (Map.Entry<String, VerificationResult> entry : verificationCache.entrySet()) {
                if (entry.getValue().getContractAddress().equals(contractAddress)) {
                    verificationResult = entry.getValue();
                    break;
                }
            }

            if (verificationResult == null) {
                throw new IllegalStateException("Contract not verified yet: " + contractAddress);
            }

            // Categorize security issues by severity
            List<SecurityIssue> criticalIssues = new ArrayList<>();
            List<SecurityIssue> highIssues = new ArrayList<>();
            List<SecurityIssue> mediumIssues = new ArrayList<>();
            List<SecurityIssue> lowIssues = new ArrayList<>();

            for (SecurityIssue issue : verificationResult.getSecurityIssues()) {
                switch (issue.getSeverity()) {
                    case CRITICAL -> criticalIssues.add(issue);
                    case HIGH -> highIssues.add(issue);
                    case MEDIUM -> mediumIssues.add(issue);
                    case LOW -> lowIssues.add(issue);
                    default -> {}
                }
            }

            // Generate statistics
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalIssues", verificationResult.getSecurityIssues().size());
            statistics.put("criticalCount", criticalIssues.size());
            statistics.put("highCount", highIssues.size());
            statistics.put("mediumCount", mediumIssues.size());
            statistics.put("lowCount", lowIssues.size());
            statistics.put("bytecodeMatch", verificationResult.isBytecodeMatch());
            statistics.put("matchPercentage", verificationResult.getMatchPercentage());

            // Determine overall risk
            String overallRisk = determineOverallRisk(criticalIssues.size(), highIssues.size(),
                mediumIssues.size(), verificationResult.isBytecodeMatch());

            // Generate recommendations
            List<String> recommendations = generateRecommendations(criticalIssues, highIssues,
                mediumIssues, verificationResult.isBytecodeMatch());

            return new VerificationReport(
                contractAddress,
                verificationResult,
                criticalIssues,
                highIssues,
                mediumIssues,
                lowIssues,
                statistics,
                overallRisk,
                recommendations,
                Instant.now()
            );
        }).runSubscriptionOn(executor);
    }

    /**
     * Get verification statistics
     *
     * @return Map of verification statistics
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVerifications", totalVerifications);
        stats.put("successfulVerifications", successfulVerifications);
        stats.put("failedVerifications", failedVerifications);
        stats.put("successRate", totalVerifications > 0 ?
            (double) successfulVerifications / totalVerifications * 100 : 0);
        stats.put("cachedResults", verificationCache.size());
        return stats;
    }

    // Private helper methods

    /**
     * Scan source code for security issues
     */
    private List<SecurityIssue> scanSecurityIssues(String sourceCode) {
        List<SecurityIssue> issues = new ArrayList<>();

        // Check for tx.origin usage
        if (sourceCode.contains("tx.origin")) {
            issues.add(new SecurityIssue(
                "SEC-001",
                "Use of tx.origin",
                "tx.origin should not be used for authorization",
                SecuritySeverity.HIGH,
                findLine(sourceCode, "tx.origin"),
                "tx.origin",
                "Use msg.sender instead of tx.origin for authorization checks",
                List.of("https://swcregistry.io/docs/SWC-115")
            ));
        }

        // Check for selfdestruct
        if (sourceCode.contains("selfdestruct")) {
            issues.add(new SecurityIssue(
                "SEC-002",
                "Use of selfdestruct",
                "selfdestruct can lead to loss of contract functionality",
                SecuritySeverity.MEDIUM,
                findLine(sourceCode, "selfdestruct"),
                "selfdestruct",
                "Implement proper access control and consider alternatives to selfdestruct",
                List.of("https://consensys.github.io/smart-contract-best-practices/")
            ));
        }

        // Check for delegatecall
        if (sourceCode.contains("delegatecall")) {
            issues.add(new SecurityIssue(
                "SEC-003",
                "Use of delegatecall",
                "delegatecall can be dangerous if not properly secured",
                SecuritySeverity.CRITICAL,
                findLine(sourceCode, "delegatecall"),
                "delegatecall",
                "Ensure delegatecall targets are trusted and validated",
                List.of("https://swcregistry.io/docs/SWC-112")
            ));
        }

        // Check for unchecked external calls
        Pattern callPattern = Pattern.compile("\\.call\\{");
        Matcher matcher = callPattern.matcher(sourceCode);
        if (matcher.find()) {
            issues.add(new SecurityIssue(
                "SEC-004",
                "Unchecked external call",
                "External calls should be checked for success",
                SecuritySeverity.HIGH,
                findLine(sourceCode, ".call{"),
                ".call",
                "Check return value of external calls and handle failures",
                List.of("https://swcregistry.io/docs/SWC-104")
            ));
        }

        // Check for reentrancy patterns
        if (sourceCode.contains(".call") && sourceCode.contains("transfer")) {
            issues.add(new SecurityIssue(
                "SEC-005",
                "Potential reentrancy",
                "State changes after external calls can be vulnerable to reentrancy",
                SecuritySeverity.CRITICAL,
                0,
                "external call pattern",
                "Follow checks-effects-interactions pattern and use ReentrancyGuard",
                List.of("https://swcregistry.io/docs/SWC-107")
            ));
        }

        return issues;
    }

    /**
     * Find line number of pattern in source code
     */
    private int findLine(String sourceCode, String pattern) {
        String[] lines = sourceCode.split("\n");
        for (int i = 0; i < lines.length; i++) {
            if (lines[i].contains(pattern)) {
                return i + 1;
            }
        }
        return 0;
    }

    /**
     * Get deployed bytecode (simulated - would call blockchain in production)
     */
    private String getDeployedBytecode(String contractAddress) {
        // In production, this would call eth_getCode or equivalent
        // For now, simulate with a hash of the address
        return "0x" + calculateSourceHash(contractAddress);
    }

    /**
     * Normalize bytecode by removing prefixes and converting to lowercase
     */
    private String normalizedBytecode(String bytecode) {
        if (bytecode == null) return "";
        return bytecode.toLowerCase().replaceAll("^0x", "");
    }

    /**
     * Calculate similarity percentage between two strings
     */
    private double calculateSimilarity(String s1, String s2) {
        if (s1.equals(s2)) return 100.0;

        int maxLength = Math.max(s1.length(), s2.length());
        if (maxLength == 0) return 100.0;

        int distance = levenshteinDistance(s1, s2);
        return (1.0 - ((double) distance / maxLength)) * 100.0;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(Math.min(
                    dp[i - 1][j] + 1,      // deletion
                    dp[i][j - 1] + 1),     // insertion
                    dp[i - 1][j - 1] + cost // substitution
                );
            }
        }

        return dp[s1.length()][s2.length()];
    }

    /**
     * Calculate source code hash
     */
    private String calculateSourceHash(String source) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(source.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            return String.format("%08x", source.hashCode());
        }
    }

    /**
     * Generate cache key for verification results
     */
    private String generateCacheKey(String address, String source, String version) {
        return String.format("%s:%s:%s", address, calculateSourceHash(source), version);
    }

    /**
     * Determine verification status based on comparison and security issues
     */
    private VerificationStatus determineVerificationStatus(BytecodeComparison comparison,
                                                          List<SecurityIssue> securityIssues) {
        long criticalIssues = securityIssues.stream()
            .filter(i -> i.getSeverity() == SecuritySeverity.CRITICAL)
            .count();

        if (!comparison.isMatch()) {
            return VerificationStatus.FAILED;
        }

        if (criticalIssues > 0) {
            return VerificationStatus.PARTIAL;
        }

        return VerificationStatus.VERIFIED;
    }

    /**
     * Determine overall risk level
     */
    private String determineOverallRisk(int critical, int high, int medium, boolean bytecodeMatch) {
        if (!bytecodeMatch || critical > 0) {
            return "CRITICAL";
        }
        if (high > 2) {
            return "HIGH";
        }
        if (high > 0 || medium > 3) {
            return "MEDIUM";
        }
        return "LOW";
    }

    /**
     * Generate security recommendations
     */
    private List<String> generateRecommendations(List<SecurityIssue> critical,
                                                List<SecurityIssue> high,
                                                List<SecurityIssue> medium,
                                                boolean bytecodeMatch) {
        List<String> recommendations = new ArrayList<>();

        if (!bytecodeMatch) {
            recommendations.add("Bytecode does not match - investigate differences before deployment");
        }

        if (!critical.isEmpty()) {
            recommendations.add("URGENT: Address " + critical.size() + " critical security issue(s) immediately");
        }

        if (!high.isEmpty()) {
            recommendations.add("Address " + high.size() + " high-severity security issue(s) before production");
        }

        if (!medium.isEmpty()) {
            recommendations.add("Review and fix " + medium.size() + " medium-severity issue(s)");
        }

        recommendations.add("Conduct thorough testing before deployment");
        recommendations.add("Consider professional security audit for production contracts");

        return recommendations;
    }

    /**
     * Create failed verification result
     */
    private VerificationResult createFailedResult(String contractAddress, String reason,
                                                 List<String> errors, String compilerVersion) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("failureReason", reason);

        return new VerificationResult(
            contractAddress,
            VerificationStatus.FAILED,
            false,
            0.0,
            "",
            errors,
            new ArrayList<>(),
            metadata,
            Instant.now(),
            compilerVersion
        );
    }
}

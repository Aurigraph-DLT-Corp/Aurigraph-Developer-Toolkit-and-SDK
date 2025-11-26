package io.aurigraph.v11.services;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Smart Contract Compiler Service
 *
 * Provides compilation capabilities for smart contracts including:
 * - Solidity source compilation
 * - Syntax validation
 * - Gas estimation
 * - ABI generation
 * - Bytecode optimization
 *
 * Supports integration with Solc (Solidity Compiler) for EVM-compatible contracts.
 *
 * @author Backend Development Agent (BDA)
 * @version 11.0.0
 * @since Sprint 11
 */
@ApplicationScoped
public class ContractCompiler {

    private static final Logger LOGGER = LoggerFactory.getLogger(ContractCompiler.class);

    // Compiler configuration
    private static final String DEFAULT_SOLC_VERSION = "0.8.20";
    private static final long COMPILATION_TIMEOUT_SECONDS = 30;
    private static final int MAX_SOURCE_SIZE_BYTES = 1024 * 1024; // 1MB

    // Virtual thread executor for concurrent compilation
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    // Compilation cache to improve performance
    private final Map<String, CompilationResult> compilationCache = new ConcurrentHashMap<>();

    // Compiler statistics
    private long totalCompilations = 0;
    private long successfulCompilations = 0;
    private long failedCompilations = 0;

    /**
     * Compilation Result containing bytecode, ABI, and metadata
     */
    public static class CompilationResult {
        private final String bytecode;
        private final String abi;
        private final Map<String, Object> metadata;
        private final List<String> warnings;
        private final List<String> errors;
        private final boolean success;
        private final long compilationTimeMs;
        private final String compilerVersion;

        public CompilationResult(String bytecode, String abi, Map<String, Object> metadata,
                                List<String> warnings, List<String> errors, boolean success,
                                long compilationTimeMs, String compilerVersion) {
            this.bytecode = bytecode;
            this.abi = abi;
            this.metadata = metadata;
            this.warnings = warnings != null ? new ArrayList<>(warnings) : new ArrayList<>();
            this.errors = errors != null ? new ArrayList<>(errors) : new ArrayList<>();
            this.success = success;
            this.compilationTimeMs = compilationTimeMs;
            this.compilerVersion = compilerVersion;
        }

        // Getters
        public String getBytecode() { return bytecode; }
        public String getAbi() { return abi; }
        public Map<String, Object> getMetadata() { return metadata; }
        public List<String> getWarnings() { return new ArrayList<>(warnings); }
        public List<String> getErrors() { return new ArrayList<>(errors); }
        public boolean isSuccess() { return success; }
        public long getCompilationTimeMs() { return compilationTimeMs; }
        public String getCompilerVersion() { return compilerVersion; }
    }

    /**
     * Gas Estimation Result
     */
    public static class GasEstimation {
        private final long estimatedGas;
        private final long deploymentGas;
        private final long executionGas;
        private final Map<String, Long> functionGas;
        private final String riskLevel;

        public GasEstimation(long estimatedGas, long deploymentGas, long executionGas,
                            Map<String, Long> functionGas, String riskLevel) {
            this.estimatedGas = estimatedGas;
            this.deploymentGas = deploymentGas;
            this.executionGas = executionGas;
            this.functionGas = functionGas != null ? new HashMap<>(functionGas) : new HashMap<>();
            this.riskLevel = riskLevel;
        }

        // Getters
        public long getEstimatedGas() { return estimatedGas; }
        public long getDeploymentGas() { return deploymentGas; }
        public long getExecutionGas() { return executionGas; }
        public Map<String, Long> getFunctionGas() { return new HashMap<>(functionGas); }
        public String getRiskLevel() { return riskLevel; }
    }

    /**
     * Syntax Validation Result
     */
    public static class ValidationResult {
        private final boolean valid;
        private final List<SyntaxError> syntaxErrors;
        private final List<String> warnings;
        private final String sourceHash;

        public ValidationResult(boolean valid, List<SyntaxError> syntaxErrors,
                              List<String> warnings, String sourceHash) {
            this.valid = valid;
            this.syntaxErrors = syntaxErrors != null ? new ArrayList<>(syntaxErrors) : new ArrayList<>();
            this.warnings = warnings != null ? new ArrayList<>(warnings) : new ArrayList<>();
            this.sourceHash = sourceHash;
        }

        // Getters
        public boolean isValid() { return valid; }
        public List<SyntaxError> getSyntaxErrors() { return new ArrayList<>(syntaxErrors); }
        public List<String> getWarnings() { return new ArrayList<>(warnings); }
        public String getSourceHash() { return sourceHash; }
    }

    /**
     * Syntax Error details
     */
    public static class SyntaxError {
        private final int line;
        private final int column;
        private final String message;
        private final String severity;
        private final String code;

        public SyntaxError(int line, int column, String message, String severity, String code) {
            this.line = line;
            this.column = column;
            this.message = message;
            this.severity = severity;
            this.code = code;
        }

        // Getters
        public int getLine() { return line; }
        public int getColumn() { return column; }
        public String getMessage() { return message; }
        public String getSeverity() { return severity; }
        public String getCode() { return code; }
    }

    /**
     * Compile Solidity source code to bytecode and ABI
     *
     * @param sourceCode Solidity source code
     * @return CompilationResult containing bytecode, ABI, and metadata
     */
    public Uni<CompilationResult> compileSolidity(String sourceCode) {
        return compileSolidity(sourceCode, DEFAULT_SOLC_VERSION, new HashMap<>());
    }

    /**
     * Compile Solidity source code with specified compiler version and options
     *
     * @param sourceCode Solidity source code
     * @param compilerVersion Solidity compiler version (e.g., "0.8.20")
     * @param options Compilation options
     * @return CompilationResult containing bytecode, ABI, and metadata
     */
    public Uni<CompilationResult> compileSolidity(String sourceCode, String compilerVersion,
                                                 Map<String, Object> options) {
        return Uni.createFrom().item(() -> {
            long startTime = System.currentTimeMillis();
            totalCompilations++;

            try {
                LOGGER.info("Compiling Solidity contract with version: {}", compilerVersion);

                // Validate source code
                if (sourceCode == null || sourceCode.trim().isEmpty()) {
                    throw new IllegalArgumentException("Source code cannot be empty");
                }

                if (sourceCode.getBytes(StandardCharsets.UTF_8).length > MAX_SOURCE_SIZE_BYTES) {
                    throw new IllegalArgumentException("Source code exceeds maximum size limit");
                }

                // Generate source code hash for caching
                String sourceHash = generateSourceHash(sourceCode, compilerVersion, options);

                // Check cache
                if (compilationCache.containsKey(sourceHash)) {
                    LOGGER.debug("Returning cached compilation result");
                    return compilationCache.get(sourceHash);
                }

                // Validate syntax first
                ValidationResult validation = validateSyntax(sourceCode).await().indefinitely();
                if (!validation.isValid()) {
                    List<String> errorMessages = validation.getSyntaxErrors().stream()
                        .map(e -> String.format("Line %d:%d - %s", e.getLine(), e.getColumn(), e.getMessage()))
                        .toList();

                    failedCompilations++;
                    return new CompilationResult(null, null, null, validation.getWarnings(),
                        errorMessages, false, System.currentTimeMillis() - startTime, compilerVersion);
                }

                // Perform actual compilation
                CompilationResult result = performCompilation(sourceCode, compilerVersion, options, startTime);

                // Cache successful compilations
                if (result.isSuccess()) {
                    compilationCache.put(sourceHash, result);
                    successfulCompilations++;
                } else {
                    failedCompilations++;
                }

                LOGGER.info("Compilation completed in {}ms: {}", result.getCompilationTimeMs(),
                    result.isSuccess() ? "SUCCESS" : "FAILED");

                return result;

            } catch (Exception e) {
                failedCompilations++;
                LOGGER.error("Compilation failed with exception", e);
                return new CompilationResult(null, null, null, new ArrayList<>(),
                    List.of("Compilation error: " + e.getMessage()), false,
                    System.currentTimeMillis() - startTime, compilerVersion);
            }
        }).runSubscriptionOn(executor);
    }

    /**
     * Validate Solidity source code syntax without full compilation
     *
     * @param sourceCode Solidity source code
     * @return ValidationResult with syntax errors and warnings
     */
    public Uni<ValidationResult> validateSyntax(String sourceCode) {
        return Uni.createFrom().item(() -> {
            LOGGER.debug("Validating Solidity syntax");

            List<SyntaxError> errors = new ArrayList<>();
            List<String> warnings = new ArrayList<>();

            // Basic syntax validation
            if (sourceCode == null || sourceCode.trim().isEmpty()) {
                errors.add(new SyntaxError(0, 0, "Source code is empty", "ERROR", "EMPTY_SOURCE"));
                return new ValidationResult(false, errors, warnings, "");
            }

            // Check for pragma statement
            if (!sourceCode.contains("pragma solidity")) {
                warnings.add("Missing pragma solidity statement");
            }

            // Check for contract definition
            Pattern contractPattern = Pattern.compile("contract\\s+\\w+\\s*\\{");
            Matcher contractMatcher = contractPattern.matcher(sourceCode);
            if (!contractMatcher.find()) {
                errors.add(new SyntaxError(0, 0, "No contract definition found", "ERROR", "NO_CONTRACT"));
            }

            // Check for balanced braces
            long openBraces = sourceCode.chars().filter(c -> c == '{').count();
            long closeBraces = sourceCode.chars().filter(c -> c == '}').count();
            if (openBraces != closeBraces) {
                errors.add(new SyntaxError(0, 0,
                    String.format("Mismatched braces: %d open, %d close", openBraces, closeBraces),
                    "ERROR", "BRACE_MISMATCH"));
            }

            // Check for balanced parentheses
            long openParens = sourceCode.chars().filter(c -> c == '(').count();
            long closeParens = sourceCode.chars().filter(c -> c == ')').count();
            if (openParens != closeParens) {
                errors.add(new SyntaxError(0, 0,
                    String.format("Mismatched parentheses: %d open, %d close", openParens, closeParens),
                    "ERROR", "PAREN_MISMATCH"));
            }

            // Check for common security issues
            if (sourceCode.contains("tx.origin")) {
                warnings.add("Use of tx.origin detected - consider using msg.sender instead");
            }

            if (sourceCode.contains("selfdestruct")) {
                warnings.add("Use of selfdestruct detected - ensure proper access control");
            }

            String sourceHash = generateSimpleHash(sourceCode);
            boolean isValid = errors.isEmpty();

            LOGGER.debug("Syntax validation complete: {} errors, {} warnings", errors.size(), warnings.size());
            return new ValidationResult(isValid, errors, warnings, sourceHash);

        }).runSubscriptionOn(executor);
    }

    /**
     * Estimate gas costs for contract deployment and execution
     *
     * @param bytecode Compiled contract bytecode
     * @param params Constructor parameters
     * @return GasEstimation with deployment and execution costs
     */
    public Uni<GasEstimation> estimateGas(String bytecode, Map<String, Object> params) {
        return Uni.createFrom().item(() -> {
            LOGGER.debug("Estimating gas for contract deployment");

            // Calculate deployment gas (21000 base + ~200 per bytecode byte)
            long bytecodeSize = bytecode != null ? bytecode.length() / 2 : 0; // Hex string
            long deploymentGas = 21000 + (bytecodeSize * 200);

            // Estimate constructor gas based on parameters
            long constructorGas = params != null ? params.size() * 1000 : 0;

            // Estimate execution gas (average function call)
            long executionGas = 50000;

            // Estimate per-function gas
            Map<String, Long> functionGas = new HashMap<>();
            functionGas.put("constructor", constructorGas);
            functionGas.put("transfer", 21000L);
            functionGas.put("approve", 45000L);
            functionGas.put("mint", 75000L);
            functionGas.put("burn", 30000L);

            long totalEstimatedGas = deploymentGas + constructorGas;

            // Determine risk level based on gas costs
            String riskLevel;
            if (totalEstimatedGas < 100000) {
                riskLevel = "LOW";
            } else if (totalEstimatedGas < 500000) {
                riskLevel = "MEDIUM";
            } else {
                riskLevel = "HIGH";
            }

            LOGGER.debug("Gas estimation complete: {} total gas ({})", totalEstimatedGas, riskLevel);

            return new GasEstimation(totalEstimatedGas, deploymentGas, executionGas,
                functionGas, riskLevel);

        }).runSubscriptionOn(executor);
    }

    /**
     * Get compiler statistics
     *
     * @return Map of compiler statistics
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCompilations", totalCompilations);
        stats.put("successfulCompilations", successfulCompilations);
        stats.put("failedCompilations", failedCompilations);
        stats.put("successRate", totalCompilations > 0 ?
            (double) successfulCompilations / totalCompilations * 100 : 0);
        stats.put("cachedResults", compilationCache.size());
        return stats;
    }

    /**
     * Clear compilation cache
     */
    public void clearCache() {
        LOGGER.info("Clearing compilation cache ({} entries)", compilationCache.size());
        compilationCache.clear();
    }

    // Private helper methods

    /**
     * Perform actual compilation using solc or internal compiler
     */
    private CompilationResult performCompilation(String sourceCode, String compilerVersion,
                                                 Map<String, Object> options, long startTime) {
        List<String> warnings = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try {
            // Try to use solc if available, otherwise use internal compiler
            if (isSolcAvailable()) {
                return compileSolcExternal(sourceCode, compilerVersion, options, warnings, errors, startTime);
            } else {
                LOGGER.warn("Solc not available, using internal compiler simulation");
                return compileInternal(sourceCode, compilerVersion, warnings, startTime);
            }
        } catch (Exception e) {
            LOGGER.error("Compilation process failed", e);
            errors.add("Compilation error: " + e.getMessage());
            return new CompilationResult(null, null, null, warnings, errors, false,
                System.currentTimeMillis() - startTime, compilerVersion);
        }
    }

    /**
     * Check if solc compiler is available on the system
     */
    private boolean isSolcAvailable() {
        try {
            Process process = new ProcessBuilder("which", "solc").start();
            boolean completed = process.waitFor(2, TimeUnit.SECONDS);
            return completed && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Compile using external solc command
     */
    private CompilationResult compileSolcExternal(String sourceCode, String compilerVersion,
                                                  Map<String, Object> options,
                                                  List<String> warnings, List<String> errors,
                                                  long startTime) throws IOException, InterruptedException {
        // Create temporary source file
        Path tempFile = Files.createTempFile("contract_", ".sol");
        try {
            Files.writeString(tempFile, sourceCode, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

            // Build solc command
            List<String> command = new ArrayList<>();
            command.add("solc");
            command.add("--bin");
            command.add("--abi");
            command.add("--optimize");
            command.add(tempFile.toString());

            // Execute solc
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            // Read output
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            // Wait for completion
            boolean completed = process.waitFor(COMPILATION_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            if (!completed) {
                process.destroyForcibly();
                errors.add("Compilation timeout exceeded");
                return new CompilationResult(null, null, null, warnings, errors, false,
                    System.currentTimeMillis() - startTime, compilerVersion);
            }

            // Parse output
            String outputStr = output.toString();
            String bytecode = extractBytecode(outputStr);
            String abi = extractAbi(outputStr);

            if (bytecode != null && abi != null) {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("optimizer", true);
                metadata.put("sourceSize", sourceCode.length());
                metadata.put("bytecodeSize", bytecode.length() / 2);

                return new CompilationResult(bytecode, abi, metadata, warnings, errors, true,
                    System.currentTimeMillis() - startTime, compilerVersion);
            } else {
                errors.add("Failed to extract bytecode or ABI from compiler output");
                return new CompilationResult(null, null, null, warnings, errors, false,
                    System.currentTimeMillis() - startTime, compilerVersion);
            }

        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    /**
     * Internal compiler simulation (for when solc is not available)
     */
    private CompilationResult compileInternal(String sourceCode, String compilerVersion,
                                             List<String> warnings, long startTime) {
        LOGGER.debug("Using internal compiler simulation");

        // Generate simulated bytecode (for demonstration purposes)
        String simulatedBytecode = "0x" + generateSimpleHash(sourceCode);

        // Generate simulated ABI
        String simulatedAbi = generateSimulatedAbi(sourceCode);

        // Generate metadata
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("compiler", "aurigraph-internal");
        metadata.put("version", compilerVersion);
        metadata.put("sourceSize", sourceCode.length());
        metadata.put("optimization", "enabled");
        metadata.put("simulated", true);

        warnings.add("Using simulated compilation - install solc for production use");

        return new CompilationResult(simulatedBytecode, simulatedAbi, metadata, warnings,
            new ArrayList<>(), true, System.currentTimeMillis() - startTime, compilerVersion);
    }

    /**
     * Extract bytecode from solc output
     */
    private String extractBytecode(String output) {
        Pattern pattern = Pattern.compile("Binary:\\s*\\n([0-9a-fA-F]+)");
        Matcher matcher = pattern.matcher(output);
        if (matcher.find()) {
            return "0x" + matcher.group(1);
        }
        return null;
    }

    /**
     * Extract ABI from solc output
     */
    private String extractAbi(String output) {
        Pattern pattern = Pattern.compile("Contract JSON ABI\\s*\\n(\\[.*?\\])", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(output);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    /**
     * Generate simulated ABI from source code analysis
     */
    private String generateSimulatedAbi(String sourceCode) {
        StringBuilder abi = new StringBuilder("[");

        // Extract function signatures
        Pattern functionPattern = Pattern.compile("function\\s+(\\w+)\\s*\\([^)]*\\)");
        Matcher matcher = functionPattern.matcher(sourceCode);

        boolean first = true;
        while (matcher.find()) {
            if (!first) abi.append(",");
            first = false;

            String functionName = matcher.group(1);
            abi.append("{")
               .append("\"type\":\"function\",")
               .append("\"name\":\"").append(functionName).append("\",")
               .append("\"inputs\":[],")
               .append("\"outputs\":[]")
               .append("}");
        }

        abi.append("]");
        return abi.toString();
    }

    /**
     * Generate hash for source code caching
     */
    private String generateSourceHash(String sourceCode, String version, Map<String, Object> options) {
        String combined = sourceCode + version + options.toString();
        return generateSimpleHash(combined);
    }

    /**
     * Generate simple hash for strings
     */
    private String generateSimpleHash(String input) {
        int hash = input.hashCode();
        return String.format("%08x", hash).substring(0, 16);
    }
}

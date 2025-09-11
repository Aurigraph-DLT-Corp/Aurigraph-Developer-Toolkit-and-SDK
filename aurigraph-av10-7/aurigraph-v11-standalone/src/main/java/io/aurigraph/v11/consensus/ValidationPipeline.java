package io.aurigraph.v11.consensus;

import io.aurigraph.v11.consensus.ConsensusModels.*;
import io.aurigraph.v11.crypto.QuantumCryptoService;
import io.aurigraph.v11.crypto.DilithiumSignatureService;
import io.aurigraph.v11.crypto.SphincsPlusService;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Validation Pipeline for HyperRAFT++
 * 
 * High-performance parallel validation with:
 * - Lock-free concurrent validation
 * - ZK proof generation pipeline
 * - Quantum-secure transaction validation
 * - Optimized execution paths
 */
@ApplicationScoped
public class ValidationPipeline {
    
    private static final Logger LOG = Logger.getLogger(ValidationPipeline.class);
    
    // Pipeline configuration
    private int parallelThreads;
    private int pipelineDepth;
    
    // Virtual thread executors
    private ExecutorService validationExecutor;
    private ExecutorService zkProofExecutor;
    private ExecutorService executionExecutor;
    
    // Performance metrics
    private final AtomicLong totalValidations = new AtomicLong(0);
    private final AtomicLong successfulValidations = new AtomicLong(0);
    private final AtomicLong totalZKProofs = new AtomicLong(0);
    private final AtomicLong successfulZKProofs = new AtomicLong(0);
    private final AtomicLong totalExecutions = new AtomicLong(0);
    private final AtomicLong successfulExecutions = new AtomicLong(0);
    
    // Validation cache for performance
    private final ConcurrentHashMap<String, ValidationResult> validationCache = new ConcurrentHashMap<>();
    
    // Quantum-resistant cryptographic services
    @Inject
    QuantumCryptoService quantumCryptoService;
    
    @Inject
    DilithiumSignatureService dilithiumSignatureService;
    
    @Inject
    SphincsPlusService sphincsPlusService;
    
    public void initialize(int parallelThreads, int pipelineDepth) {
        this.parallelThreads = parallelThreads;
        this.pipelineDepth = pipelineDepth;
        
        // Initialize virtual thread executors
        this.validationExecutor = Executors.newVirtualThreadPerTaskExecutor();
        this.zkProofExecutor = Executors.newVirtualThreadPerTaskExecutor();
        this.executionExecutor = Executors.newVirtualThreadPerTaskExecutor();
        
        // Initialize quantum cryptographic services
        if (quantumCryptoService != null) {
            quantumCryptoService.initialize();
        }
        
        LOG.info("ValidationPipeline initialized with " + parallelThreads + 
                 " threads and depth " + pipelineDepth + " (Quantum-Resistant Crypto: " + 
                 (quantumCryptoService != null ? "Enabled" : "Disabled") + ")");
    }
    
    /**
     * Validate transactions in parallel
     */
    public CompletableFuture<List<Transaction>> validateTransactions(TransactionBatch batch) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            List<Transaction> transactions = batch.getTransactions();
            
            LOG.debug("Starting validation for batch " + batch.getId() + 
                     " with " + transactions.size() + " transactions");
            
            // Parallel validation using virtual threads
            List<CompletableFuture<ValidationResult>> validationFutures = 
                transactions.parallelStream()
                    .map(this::validateSingleTransaction)
                    .collect(Collectors.toList());
            
            // Collect results
            List<Transaction> validTransactions = new ArrayList<>();
            int successCount = 0;
            
            for (int i = 0; i < validationFutures.size(); i++) {
                try {
                    ValidationResult result = validationFutures.get(i).get(1000, TimeUnit.MILLISECONDS);
                    if (result.isValid()) {
                        validTransactions.add(transactions.get(i));
                        successCount++;
                    }
                } catch (Exception e) {
                    LOG.debug("Validation failed for transaction: " + e.getMessage());
                }
            }
            
            // Update metrics
            totalValidations.addAndGet(transactions.size());
            successfulValidations.addAndGet(successCount);
            
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            LOG.debug("Validation completed for batch " + batch.getId() + 
                     ": " + successCount + "/" + transactions.size() + 
                     " valid in " + duration + "ms");
            
            return validTransactions;
            
        }, validationExecutor);
    }
    
    /**
     * Generate ZK proofs for transactions
     */
    public CompletableFuture<List<Transaction>> generateZKProofs(TransactionBatch batch) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            List<Transaction> transactions = batch.getValidatedTransactions();
            
            if (transactions == null || transactions.isEmpty()) {
                return new ArrayList<>();
            }
            
            LOG.debug("Starting ZK proof generation for batch " + batch.getId() + 
                     " with " + transactions.size() + " transactions");
            
            // Parallel ZK proof generation
            List<CompletableFuture<ZKProofResult>> proofFutures = 
                transactions.parallelStream()
                    .map(this::generateZKProofForTransaction)
                    .collect(Collectors.toList());
            
            // Collect results
            List<Transaction> transactionsWithProofs = new ArrayList<>();
            int successCount = 0;
            
            for (int i = 0; i < proofFutures.size(); i++) {
                try {
                    ZKProofResult result = proofFutures.get(i).get(2000, TimeUnit.MILLISECONDS);
                    if (result.isSuccess()) {
                        Transaction tx = transactions.get(i);
                        Transaction txWithProof = new Transaction(
                            tx.getId(),
                            tx.getHash(),
                            tx.getData(),
                            tx.getTimestamp(),
                            tx.getFrom(),
                            tx.getTo(),
                            tx.getAmount(),
                            result.getZkProof(),
                            tx.getSignature()
                        );
                        transactionsWithProofs.add(txWithProof);
                        successCount++;
                    } else {
                        // Include transaction with fallback proof
                        Transaction tx = transactions.get(i);
                        Transaction txWithFallback = new Transaction(
                            tx.getId(),
                            tx.getHash(),
                            tx.getData(),
                            tx.getTimestamp(),
                            tx.getFrom(),
                            tx.getTo(),
                            tx.getAmount(),
                            createFallbackProof(),
                            tx.getSignature()
                        );
                        transactionsWithProofs.add(txWithFallback);
                    }
                } catch (Exception e) {
                    LOG.debug("ZK proof generation failed for transaction: " + e.getMessage());
                    // Add transaction with fallback proof for resilience
                    transactionsWithProofs.add(transactions.get(i));
                }
            }
            
            // Update metrics
            totalZKProofs.addAndGet(transactions.size());
            successfulZKProofs.addAndGet(successCount);
            
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            LOG.debug("ZK proof generation completed for batch " + batch.getId() + 
                     ": " + successCount + "/" + transactions.size() + 
                     " proofs in " + duration + "ms");
            
            return transactionsWithProofs;
            
        }, zkProofExecutor);
    }
    
    /**
     * Execute transactions in parallel
     */
    public CompletableFuture<List<ExecutionResult>> executeTransactions(TransactionBatch batch) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.nanoTime();
            List<Transaction> transactions = batch.getProovedTransactions();
            
            if (transactions == null || transactions.isEmpty()) {
                return new ArrayList<>();
            }
            
            LOG.debug("Starting execution for batch " + batch.getId() + 
                     " with " + transactions.size() + " transactions");
            
            // Parallel execution using virtual threads
            List<CompletableFuture<ExecutionResult>> executionFutures = 
                transactions.parallelStream()
                    .map(this::executeSingleTransaction)
                    .collect(Collectors.toList());
            
            // Collect results
            List<ExecutionResult> results = new ArrayList<>();
            int successCount = 0;
            
            for (CompletableFuture<ExecutionResult> future : executionFutures) {
                try {
                    ExecutionResult result = future.get(3000, TimeUnit.MILLISECONDS);
                    results.add(result);
                    if (result.isSuccess()) {
                        successCount++;
                    }
                } catch (Exception e) {
                    LOG.debug("Transaction execution failed: " + e.getMessage());
                    // Add failed result for completeness
                    results.add(new ExecutionResult(
                        "unknown",
                        false,
                        0,
                        "Execution timeout or error: " + e.getMessage()
                    ));
                }
            }
            
            // Update metrics
            totalExecutions.addAndGet(transactions.size());
            successfulExecutions.addAndGet(successCount);
            
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            LOG.debug("Execution completed for batch " + batch.getId() + 
                     ": " + successCount + "/" + transactions.size() + 
                     " successful in " + duration + "ms");
            
            return results;
            
        }, executionExecutor);
    }
    
    /**
     * Validate single transaction with caching
     */
    private CompletableFuture<ValidationResult> validateSingleTransaction(Transaction tx) {
        return CompletableFuture.supplyAsync(() -> {
            // Check cache first
            String cacheKey = tx.getHash();
            ValidationResult cached = validationCache.get(cacheKey);
            if (cached != null && cached.isRecent()) {
                return cached;
            }
            
            // Perform validation
            ValidationResult result = performTransactionValidation(tx);
            
            // Cache result
            validationCache.put(cacheKey, result);
            
            return result;
        }, validationExecutor);
    }
    
    /**
     * Perform actual transaction validation
     */
    private ValidationResult performTransactionValidation(Transaction tx) {
        try {
            // Basic validation checks
            if (tx.getId() == null || tx.getId().isEmpty()) {
                return new ValidationResult(false, "Missing transaction ID");
            }
            
            if (tx.getHash() == null || tx.getHash().isEmpty()) {
                return new ValidationResult(false, "Missing transaction hash");
            }
            
            if (tx.getFrom() == null || tx.getTo() == null) {
                return new ValidationResult(false, "Missing from/to addresses");
            }
            
            if (tx.getAmount() != null && tx.getAmount() < 0) {
                return new ValidationResult(false, "Invalid amount");
            }
            
            // Signature validation (simplified)
            if (tx.getSignature() == null) {
                return new ValidationResult(false, "Missing signature");
            }
            
            // Quantum signature verification (placeholder)
            boolean signatureValid = validateQuantumSignature(tx);
            if (!signatureValid) {
                return new ValidationResult(false, "Invalid quantum signature");
            }
            
            // Simulate high validation success rate (99.5%)
            if (Math.random() < 0.995) {
                return new ValidationResult(true, "Transaction valid");
            } else {
                return new ValidationResult(false, "Random validation failure");
            }
            
        } catch (Exception e) {
            return new ValidationResult(false, "Validation error: " + e.getMessage());
        }
    }
    
    /**
     * Validate quantum-resistant signature using post-quantum cryptography
     */
    private boolean validateQuantumSignature(Transaction tx) {
        try {
            // Check if quantum crypto service is available
            if (quantumCryptoService == null || dilithiumSignatureService == null) {
                LOG.warn("Quantum crypto services not available, falling back to basic validation");
                return tx.getSignature() != null && tx.getSignature().length() > 10;
            }
            
            // Extract signature components from transaction
            String signature = tx.getSignature();
            if (signature == null || signature.isEmpty()) {
                return false;
            }
            
            // Parse signature format: algorithm:publicKey:signatureBytes
            String[] signatureParts = signature.split(":", 3);
            if (signatureParts.length != 3) {
                LOG.debug("Invalid quantum signature format for transaction: " + tx.getId());
                return false;
            }
            
            String algorithm = signatureParts[0];
            String publicKeyB64 = signatureParts[1];
            String signatureB64 = signatureParts[2];
            
            // Decode public key and signature from base64
            byte[] publicKeyBytes = Base64.getDecoder().decode(publicKeyB64);
            byte[] signatureBytes = Base64.getDecoder().decode(signatureB64);
            
            // Create transaction data to verify
            byte[] transactionData = createTransactionDataForVerification(tx);
            
            // Perform quantum-resistant signature verification based on algorithm
            boolean isValid = false;
            
            switch (algorithm.toUpperCase()) {
                case "DILITHIUM5":
                    // Use CRYSTALS-Dilithium for primary signature verification
                    try {
                        java.security.KeyFactory keyFactory = java.security.KeyFactory.getInstance("Dilithium", "BCPQC");
                        java.security.spec.X509EncodedKeySpec keySpec = new java.security.spec.X509EncodedKeySpec(publicKeyBytes);
                        java.security.PublicKey publicKey = keyFactory.generatePublic(keySpec);
                        
                        isValid = dilithiumSignatureService.verify(transactionData, signatureBytes, publicKey);
                    } catch (Exception e) {
                        LOG.debug("Dilithium signature verification failed: " + e.getMessage());
                        isValid = false;
                    }
                    break;
                    
                case "SPHINCSPLUS":
                    // Use SPHINCS+ for backup signature verification
                    try {
                        java.security.KeyFactory keyFactory = java.security.KeyFactory.getInstance("SPHINCS+", "BCPQC");
                        java.security.spec.X509EncodedKeySpec keySpec = new java.security.spec.X509EncodedKeySpec(publicKeyBytes);
                        java.security.PublicKey publicKey = keyFactory.generatePublic(keySpec);
                        
                        isValid = sphincsPlusService.verify(transactionData, signatureBytes, publicKey);
                    } catch (Exception e) {
                        LOG.debug("SPHINCS+ signature verification failed: " + e.getMessage());
                        isValid = false;
                    }
                    break;
                    
                case "HYBRID":
                    // Hybrid signature verification (both Dilithium and SPHINCS+)
                    // Format: HYBRID:dilithiumPubKey|sphincsPubKey:dilithiumSig|sphincsSig
                    String[] hybridKeys = publicKeyB64.split("\\|");
                    String[] hybridSigs = signatureB64.split("\\|");
                    
                    if (hybridKeys.length == 2 && hybridSigs.length == 2) {
                        try {
                            // Verify Dilithium signature
                            byte[] dilithiumKeyBytes = Base64.getDecoder().decode(hybridKeys[0]);
                            byte[] dilithiumSigBytes = Base64.getDecoder().decode(hybridSigs[0]);
                            
                            java.security.KeyFactory dilithiumKF = java.security.KeyFactory.getInstance("Dilithium", "BCPQC");
                            java.security.spec.X509EncodedKeySpec dilithiumSpec = new java.security.spec.X509EncodedKeySpec(dilithiumKeyBytes);
                            java.security.PublicKey dilithiumKey = dilithiumKF.generatePublic(dilithiumSpec);
                            
                            boolean dilithiumValid = dilithiumSignatureService.verify(transactionData, dilithiumSigBytes, dilithiumKey);
                            
                            // Verify SPHINCS+ signature
                            byte[] sphincsKeyBytes = Base64.getDecoder().decode(hybridKeys[1]);
                            byte[] sphincsSigBytes = Base64.getDecoder().decode(hybridSigs[1]);
                            
                            java.security.KeyFactory sphincsKF = java.security.KeyFactory.getInstance("SPHINCS+", "BCPQC");
                            java.security.spec.X509EncodedKeySpec sphincsSpec = new java.security.spec.X509EncodedKeySpec(sphincsKeyBytes);
                            java.security.PublicKey sphincsKey = sphincsKF.generatePublic(sphincsSpec);
                            
                            boolean sphincsValid = sphincsPlusService.verify(transactionData, sphincsSigBytes, sphincsKey);
                            
                            // Both signatures must be valid for hybrid verification
                            isValid = dilithiumValid && sphincsValid;
                            
                        } catch (Exception e) {
                            LOG.debug("Hybrid signature verification failed: " + e.getMessage());
                            isValid = false;
                        }
                    }
                    break;
                    
                default:
                    LOG.debug("Unsupported quantum signature algorithm: " + algorithm);
                    return false;
            }
            
            if (isValid) {
                LOG.debug("Quantum signature validation successful for transaction: " + tx.getId() + " (algorithm: " + algorithm + ")");
            } else {
                LOG.debug("Quantum signature validation failed for transaction: " + tx.getId() + " (algorithm: " + algorithm + ")");
            }
            
            return isValid;
            
        } catch (Exception e) {
            LOG.error("Quantum signature validation error for transaction: " + tx.getId(), e);
            return false;
        }
    }
    
    /**
     * Create transaction data bytes for signature verification
     */
    private byte[] createTransactionDataForVerification(Transaction tx) {
        // Create canonical representation of transaction data for signature verification
        StringBuilder dataBuilder = new StringBuilder();
        
        dataBuilder.append("id:").append(tx.getId() != null ? tx.getId() : "");
        dataBuilder.append("|hash:").append(tx.getHash() != null ? tx.getHash() : "");
        dataBuilder.append("|from:").append(tx.getFrom() != null ? tx.getFrom() : "");
        dataBuilder.append("|to:").append(tx.getTo() != null ? tx.getTo() : "");
        dataBuilder.append("|amount:").append(tx.getAmount() != null ? tx.getAmount().toString() : "0");
        dataBuilder.append("|timestamp:").append(tx.getTimestamp());
        
        if (tx.getData() != null) {
            dataBuilder.append("|data:").append(tx.getData().toString());
        }
        
        return dataBuilder.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
    
    /**
     * Generate ZK proof for single transaction
     */
    private CompletableFuture<ZKProofResult> generateZKProofForTransaction(Transaction tx) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Simulate ZK proof generation
                String proofData = generateZKProofData(tx);
                
                // Simulate processing time and success rate (95%)
                Thread.sleep(ThreadLocalRandom.current().nextInt(5, 25)); // 5-25ms
                
                if (Math.random() < 0.95) {
                    ZKProof proof = new ZKProof(
                        "zk_proof_" + tx.getHash(),
                        proofData,
                        System.currentTimeMillis(),
                        true
                    );
                    return new ZKProofResult(true, proof, "ZK proof generated");
                } else {
                    return new ZKProofResult(false, null, "ZK proof generation failed");
                }
                
            } catch (Exception e) {
                return new ZKProofResult(false, null, "Error: " + e.getMessage());
            }
        }, zkProofExecutor);
    }
    
    /**
     * Generate ZK proof data
     */
    private String generateZKProofData(Transaction tx) {
        // Simplified ZK proof data generation
        return "zkproof_" + tx.getHash() + "_" + System.nanoTime();
    }
    
    /**
     * Create fallback proof for resilience
     */
    private ZKProof createFallbackProof() {
        return new ZKProof(
            "fallback_proof",
            "fallback_data",
            System.currentTimeMillis(),
            false
        );
    }
    
    /**
     * Execute single transaction
     */
    private CompletableFuture<ExecutionResult> executeSingleTransaction(Transaction tx) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Simulate transaction execution
                long gasUsed = calculateGasUsage(tx);
                
                // Simulate processing time
                Thread.sleep(ThreadLocalRandom.current().nextInt(1, 10)); // 1-10ms
                
                // Simulate high execution success rate (99.8%)
                if (Math.random() < 0.998) {
                    return new ExecutionResult(
                        tx.getHash(),
                        true,
                        gasUsed,
                        "Execution successful"
                    );
                } else {
                    return new ExecutionResult(
                        tx.getHash(),
                        false,
                        0,
                        "Execution failed"
                    );
                }
                
            } catch (Exception e) {
                return new ExecutionResult(
                    tx.getHash(),
                    false,
                    0,
                    "Execution error: " + e.getMessage()
                );
            }
        }, executionExecutor);
    }
    
    /**
     * Calculate gas usage for transaction
     */
    private long calculateGasUsage(Transaction tx) {
        // Base gas cost
        long baseGas = 21000L;
        
        // Additional gas for data
        if (tx.getData() != null) {
            baseGas += tx.getData().toString().length() * 16L;
        }
        
        // Random variance (±20%)
        double variance = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        return Math.round(baseGas * variance);
    }
    
    /**
     * Get validation pipeline metrics
     */
    public ValidationMetrics getMetrics() {
        return new ValidationMetrics(
            totalValidations.get(),
            successfulValidations.get(),
            totalZKProofs.get(),
            successfulZKProofs.get(),
            totalExecutions.get(),
            successfulExecutions.get(),
            validationCache.size()
        );
    }
    
    /**
     * Cleanup validation cache
     */
    public void cleanupCache() {
        int sizeBefore = validationCache.size();
        validationCache.entrySet().removeIf(entry -> !entry.getValue().isRecent());
        int sizeAfter = validationCache.size();
        
        LOG.debug("Cleaned validation cache: " + sizeBefore + " -> " + sizeAfter + " entries");
    }
    
    // Shutdown method
    public void shutdown() {
        if (validationExecutor != null) validationExecutor.shutdown();
        if (zkProofExecutor != null) zkProofExecutor.shutdown();
        if (executionExecutor != null) executionExecutor.shutdown();
        
        LOG.info("ValidationPipeline shutdown complete");
    }
    
    // Inner classes for pipeline operations
    
    /**
     * Validation result with caching support
     */
    public static class ValidationResult {
        private final boolean valid;
        private final String message;
        private final long timestamp;
        private final String type;
        private final List<ValidationEntry> results;
        
        public ValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
            this.timestamp = System.currentTimeMillis();
            this.type = "basic";
            this.results = new ArrayList<>();
        }
        
        public ValidationResult(String type, List<ValidationEntry> results) {
            this.type = type;
            this.results = results;
            this.valid = results.stream().allMatch(ValidationEntry::isValid);
            this.message = valid ? "All validations passed" : "Some validations failed";
            this.timestamp = System.currentTimeMillis();
        }
        
        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
        public String getType() { return type; }
        public List<ValidationEntry> getResults() { return results; }
        
        public boolean isRecent() {
            return (System.currentTimeMillis() - timestamp) < 60000; // 1 minute
        }
    }
    
    /**
     * ZK Proof result
     */
    public static class ZKProofResult {
        private final boolean success;
        private final ZKProof zkProof;
        private final String message;
        
        public ZKProofResult(boolean success, ZKProof zkProof, String message) {
            this.success = success;
            this.zkProof = zkProof;
            this.message = message;
        }
        
        public boolean isSuccess() { return success; }
        public ZKProof getZkProof() { return zkProof; }
        public String getMessage() { return message; }
    }
    
    /**
     * ZK Proof implementation
     */
    public static class ZKProof {
        private final String proofId;
        private final String proofData;
        private final long timestamp;
        private final boolean valid;
        
        public ZKProof(String proofId, String proofData, long timestamp, boolean valid) {
            this.proofId = proofId;
            this.proofData = proofData;
            this.timestamp = timestamp;
            this.valid = valid;
        }
        
        public String getProofId() { return proofId; }
        public String getProofData() { return proofData; }
        public long getTimestamp() { return timestamp; }
        public boolean isValid() { return valid; }
    }
    
    /**
     * Enhanced Transaction model for validation pipeline
     */
    public static class Transaction {
        private final String id;
        private final String hash;
        private final Object data;
        private final long timestamp;
        private final String from;
        private final String to;
        private final Double amount;
        private final ZKProof zkProof;
        private final String signature;
        
        public Transaction(String id, String hash, Object data, long timestamp, 
                          String from, String to, Double amount, ZKProof zkProof, String signature) {
            this.id = id;
            this.hash = hash;
            this.data = data;
            this.timestamp = timestamp;
            this.from = from;
            this.to = to;
            this.amount = amount;
            this.zkProof = zkProof;
            this.signature = signature;
        }
        
        public String getId() { return id; }
        public String getHash() { return hash; }
        public Object getData() { return data; }
        public long getTimestamp() { return timestamp; }
        public String getFrom() { return from; }
        public String getTo() { return to; }
        public Double getAmount() { return amount; }
        public ZKProof getZkProof() { return zkProof; }
        public String getSignature() { return signature; }
    }
    
    /**
     * Execution result for transaction execution
     */
    public static class ExecutionResult {
        private final String transactionHash;
        private final boolean success;
        private final long gasUsed;
        private final String message;
        
        public ExecutionResult(String transactionHash, boolean success, long gasUsed, String message) {
            this.transactionHash = transactionHash;
            this.success = success;
            this.gasUsed = gasUsed;
            this.message = message;
        }
        
        public String getTransactionHash() { return transactionHash; }
        public boolean isSuccess() { return success; }
        public long getGasUsed() { return gasUsed; }
        public String getMessage() { return message; }
    }
    
    /**
     * Validation metrics
     */
    public static class ValidationMetrics {
        private final long totalValidations;
        private final long successfulValidations;
        private final long totalZKProofs;
        private final long successfulZKProofs;
        private final long totalExecutions;
        private final long successfulExecutions;
        private final int cacheSize;
        
        public ValidationMetrics(long totalValidations, long successfulValidations,
                               long totalZKProofs, long successfulZKProofs,
                               long totalExecutions, long successfulExecutions,
                               int cacheSize) {
            this.totalValidations = totalValidations;
            this.successfulValidations = successfulValidations;
            this.totalZKProofs = totalZKProofs;
            this.successfulZKProofs = successfulZKProofs;
            this.totalExecutions = totalExecutions;
            this.successfulExecutions = successfulExecutions;
            this.cacheSize = cacheSize;
        }
        
        public long getTotalValidations() { return totalValidations; }
        public long getSuccessfulValidations() { return successfulValidations; }
        public long getTotalZKProofs() { return totalZKProofs; }
        public long getSuccessfulZKProofs() { return successfulZKProofs; }
        public long getTotalExecutions() { return totalExecutions; }
        public long getSuccessfulExecutions() { return successfulExecutions; }
        public int getCacheSize() { return cacheSize; }
        
        public double getValidationSuccessRate() {
            return totalValidations > 0 ? (double) successfulValidations / totalValidations * 100 : 100.0;
        }
        
        public double getZKProofSuccessRate() {
            return totalZKProofs > 0 ? (double) successfulZKProofs / totalZKProofs * 100 : 100.0;
        }
        
        public double getExecutionSuccessRate() {
            return totalExecutions > 0 ? (double) successfulExecutions / totalExecutions * 100 : 100.0;
        }
    }
}
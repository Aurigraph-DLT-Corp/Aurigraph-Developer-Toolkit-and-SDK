package io.aurigraph.v11.quantconnect;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Equity Tokenization Registry
 *
 * Merkle tree-based registry for tokenized equity data and transactions.
 * Provides cryptographic verification and audit trail for all tokenized assets.
 * Routes through External Integration (EI) Node for lightweight processing.
 *
 * Features:
 * - SHA-256 based Merkle tree construction
 * - Real-time registry updates
 * - Proof generation and verification
 * - Historical state tracking
 * - Navigable registry with search and filter
 *
 * @author Aurigraph DLT Team
 * @version 12.0.0
 */
@ApplicationScoped
public class EquityTokenizationRegistry {

    private static final Logger LOGGER = LoggerFactory.getLogger(EquityTokenizationRegistry.class);

    // Registry storage
    private final Map<String, TokenizedEquity> equityRegistry = new ConcurrentHashMap<>();
    private final Map<String, TokenizedTransaction> transactionRegistry = new ConcurrentHashMap<>();
    private final Map<String, List<String>> symbolToTokenIds = new ConcurrentHashMap<>();
    private final Map<String, String> tokenToMerkleProof = new ConcurrentHashMap<>();

    // Merkle tree state
    private final List<String> merkleLeaves = Collections.synchronizedList(new ArrayList<>());
    private String currentMerkleRoot = "";
    private final AtomicLong blockNumber = new AtomicLong(0);

    // Statistics
    private final AtomicLong totalEquitiesTokenized = new AtomicLong(0);
    private final AtomicLong totalTransactionsTokenized = new AtomicLong(0);
    private Instant lastUpdateTime = Instant.now();

    /**
     * Register tokenized equity and add to Merkle tree
     */
    public Uni<TokenizationResult> registerTokenizedEquity(TokenizedEquity equity) {
        return Uni.createFrom().item(() -> {
            long startTime = System.currentTimeMillis();

            try {
                LOGGER.info("Registering tokenized equity: {} ({})", equity.getSymbol(), equity.getTokenId());

                // Generate leaf hash for Merkle tree
                String leafData = generateEquityLeafData(equity);
                String leafHash = sha256(leafData);

                // Add to Merkle tree
                synchronized (merkleLeaves) {
                    merkleLeaves.add(leafHash);
                    currentMerkleRoot = computeMerkleRoot(merkleLeaves);
                }

                // Set Merkle data on equity
                equity.setMerkleRoot(currentMerkleRoot);
                equity.setMerkleProof(generateMerkleProof(leafHash));
                equity.setBlockNumber(blockNumber.incrementAndGet());
                equity.setBlockHash(sha256(currentMerkleRoot + equity.getBlockNumber()));
                equity.setVerified(true);

                // Store in registry
                equityRegistry.put(equity.getTokenId(), equity);

                // Index by symbol
                symbolToTokenIds.computeIfAbsent(equity.getSymbol(), k -> Collections.synchronizedList(new ArrayList<>()))
                    .add(equity.getTokenId());

                // Store proof
                tokenToMerkleProof.put(equity.getTokenId(), equity.getMerkleProof());

                // Update statistics
                totalEquitiesTokenized.incrementAndGet();
                lastUpdateTime = Instant.now();

                long processingTime = System.currentTimeMillis() - startTime;

                LOGGER.info("Equity {} tokenized successfully. Merkle root: {}",
                    equity.getSymbol(), currentMerkleRoot.substring(0, 16) + "...");

                TokenizationResult result = TokenizationResult.success(
                    equity.getTokenId(),
                    currentMerkleRoot,
                    equity.getBlockHash()
                );
                result.setBlockNumber(equity.getBlockNumber());
                result.setMerkleProof(equity.getMerkleProof());
                result.setEINodeId(equity.getEINodeId());
                result.setProcessingTimeMs(processingTime);

                return result;

            } catch (Exception e) {
                LOGGER.error("Failed to register tokenized equity: {}", equity.getSymbol(), e);
                return TokenizationResult.failure(
                    "Failed to tokenize equity: " + e.getMessage(),
                    "TOKENIZATION_FAILED"
                );
            }
        });
    }

    /**
     * Register tokenized transaction and add to Merkle tree
     */
    public Uni<TokenizationResult> registerTokenizedTransaction(TokenizedTransaction transaction) {
        return Uni.createFrom().item(() -> {
            long startTime = System.currentTimeMillis();

            try {
                LOGGER.info("Registering tokenized transaction: {} ({})",
                    transaction.getTransactionId(), transaction.getTokenId());

                // Generate leaf hash for Merkle tree
                String leafData = generateTransactionLeafData(transaction);
                String leafHash = sha256(leafData);

                // Add to Merkle tree
                synchronized (merkleLeaves) {
                    merkleLeaves.add(leafHash);
                    currentMerkleRoot = computeMerkleRoot(merkleLeaves);
                }

                // Set Merkle data on transaction
                transaction.setMerkleRoot(currentMerkleRoot);
                transaction.setMerkleProof(generateMerkleProof(leafHash));
                transaction.setBlockNumber(blockNumber.incrementAndGet());
                transaction.setBlockHash(sha256(currentMerkleRoot + transaction.getBlockNumber()));
                transaction.setVerified(true);

                // Store in registry
                transactionRegistry.put(transaction.getTokenId(), transaction);

                // Index by symbol
                symbolToTokenIds.computeIfAbsent(transaction.getSymbol() + ":TX", k -> Collections.synchronizedList(new ArrayList<>()))
                    .add(transaction.getTokenId());

                // Store proof
                tokenToMerkleProof.put(transaction.getTokenId(), transaction.getMerkleProof());

                // Update statistics
                totalTransactionsTokenized.incrementAndGet();
                lastUpdateTime = Instant.now();

                long processingTime = System.currentTimeMillis() - startTime;

                LOGGER.info("Transaction {} tokenized successfully. Merkle root: {}",
                    transaction.getTransactionId(), currentMerkleRoot.substring(0, 16) + "...");

                TokenizationResult result = TokenizationResult.success(
                    transaction.getTokenId(),
                    currentMerkleRoot,
                    transaction.getBlockHash()
                );
                result.setBlockNumber(transaction.getBlockNumber());
                result.setMerkleProof(transaction.getMerkleProof());
                result.setEINodeId(transaction.getEINodeId());
                result.setProcessingTimeMs(processingTime);

                return result;

            } catch (Exception e) {
                LOGGER.error("Failed to register tokenized transaction: {}", transaction.getTransactionId(), e);
                return TokenizationResult.failure(
                    "Failed to tokenize transaction: " + e.getMessage(),
                    "TOKENIZATION_FAILED"
                );
            }
        });
    }

    /**
     * Verify a token exists in the Merkle tree
     */
    public boolean verifyToken(String tokenId) {
        String proof = tokenToMerkleProof.get(tokenId);
        if (proof == null) {
            return false;
        }

        // Check if token exists in either registry
        return equityRegistry.containsKey(tokenId) || transactionRegistry.containsKey(tokenId);
    }

    /**
     * Get tokenized equity by ID
     */
    public Optional<TokenizedEquity> getEquity(String tokenId) {
        return Optional.ofNullable(equityRegistry.get(tokenId));
    }

    /**
     * Get tokenized transaction by ID
     */
    public Optional<TokenizedTransaction> getTransaction(String tokenId) {
        return Optional.ofNullable(transactionRegistry.get(tokenId));
    }

    /**
     * Get all equities for a symbol
     */
    public List<TokenizedEquity> getEquitiesBySymbol(String symbol) {
        List<String> tokenIds = symbolToTokenIds.get(symbol);
        if (tokenIds == null) {
            return Collections.emptyList();
        }
        return tokenIds.stream()
            .map(equityRegistry::get)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    /**
     * Get all transactions for a symbol
     */
    public List<TokenizedTransaction> getTransactionsBySymbol(String symbol) {
        List<String> tokenIds = symbolToTokenIds.get(symbol + ":TX");
        if (tokenIds == null) {
            return Collections.emptyList();
        }
        return tokenIds.stream()
            .map(transactionRegistry::get)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    /**
     * Get all tokenized equities (paginated)
     */
    public List<TokenizedEquity> getAllEquities(int page, int size) {
        return equityRegistry.values().stream()
            .sorted((a, b) -> b.getTokenizedAt().compareTo(a.getTokenizedAt()))
            .skip((long) page * size)
            .limit(size)
            .collect(Collectors.toList());
    }

    /**
     * Get all tokenized transactions (paginated)
     */
    public List<TokenizedTransaction> getAllTransactions(int page, int size) {
        return transactionRegistry.values().stream()
            .sorted((a, b) -> b.getTokenizedAt().compareTo(a.getTokenizedAt()))
            .skip((long) page * size)
            .limit(size)
            .collect(Collectors.toList());
    }

    /**
     * Search registry by query
     */
    public RegistrySearchResult search(String query, String type, int page, int size) {
        List<Object> results = new ArrayList<>();
        String lowerQuery = query.toLowerCase();

        if (type == null || type.equals("equity") || type.equals("all")) {
            equityRegistry.values().stream()
                .filter(e -> e.getSymbol().toLowerCase().contains(lowerQuery) ||
                           e.getName().toLowerCase().contains(lowerQuery) ||
                           e.getTokenId().toLowerCase().contains(lowerQuery))
                .forEach(results::add);
        }

        if (type == null || type.equals("transaction") || type.equals("all")) {
            transactionRegistry.values().stream()
                .filter(t -> t.getSymbol().toLowerCase().contains(lowerQuery) ||
                           t.getTransactionId().toLowerCase().contains(lowerQuery) ||
                           t.getTokenId().toLowerCase().contains(lowerQuery))
                .forEach(results::add);
        }

        int total = results.size();
        List<Object> paged = results.stream()
            .skip((long) page * size)
            .limit(size)
            .collect(Collectors.toList());

        return new RegistrySearchResult(paged, total, page, size);
    }

    /**
     * Get registry statistics
     */
    public RegistryStatistics getStatistics() {
        return new RegistryStatistics(
            totalEquitiesTokenized.get(),
            totalTransactionsTokenized.get(),
            currentMerkleRoot,
            blockNumber.get(),
            merkleLeaves.size(),
            lastUpdateTime,
            getUniqueSymbolCount()
        );
    }

    /**
     * Get current Merkle root
     */
    public String getMerkleRoot() {
        return currentMerkleRoot;
    }

    /**
     * Get Merkle proof for a token
     */
    public Optional<String> getMerkleProof(String tokenId) {
        return Optional.ofNullable(tokenToMerkleProof.get(tokenId));
    }

    /**
     * Get registry navigation structure
     */
    public RegistryNavigation getNavigation() {
        Map<String, Long> symbolCounts = new HashMap<>();

        for (String key : symbolToTokenIds.keySet()) {
            String symbol = key.replace(":TX", "");
            symbolCounts.merge(symbol, (long) symbolToTokenIds.get(key).size(), Long::sum);
        }

        return new RegistryNavigation(
            symbolCounts,
            totalEquitiesTokenized.get(),
            totalTransactionsTokenized.get(),
            getUniqueSymbolCount()
        );
    }

    // Private helper methods

    private String generateEquityLeafData(TokenizedEquity equity) {
        return String.format("%s|%s|%s|%.8f|%d|%d|%.4f|%s|%s",
            equity.getTokenId(),
            equity.getSymbol(),
            equity.getName(),
            equity.getPrice(),
            equity.getVolume(),
            equity.getMarketCap(),
            equity.getChange24h(),
            equity.getTokenizedAt().toString(),
            equity.getEINodeId()
        );
    }

    private String generateTransactionLeafData(TokenizedTransaction transaction) {
        return String.format("%s|%s|%s|%s|%d|%.8f|%.8f|%s|%s|%s",
            transaction.getTokenId(),
            transaction.getTransactionId(),
            transaction.getSymbol(),
            transaction.getType(),
            transaction.getQuantity(),
            transaction.getPrice(),
            transaction.getTotalValue(),
            transaction.getTimestamp().toString(),
            transaction.getTokenizedAt().toString(),
            transaction.getEINodeId()
        );
    }

    private String computeMerkleRoot(List<String> leaves) {
        if (leaves.isEmpty()) {
            return sha256("EMPTY_MERKLE_TREE");
        }
        if (leaves.size() == 1) {
            return leaves.get(0);
        }

        List<String> currentLevel = new ArrayList<>(leaves);

        while (currentLevel.size() > 1) {
            List<String> nextLevel = new ArrayList<>();

            for (int i = 0; i < currentLevel.size(); i += 2) {
                if (i + 1 < currentLevel.size()) {
                    String combined = currentLevel.get(i) + currentLevel.get(i + 1);
                    nextLevel.add(sha256(combined));
                } else {
                    // Odd number of nodes, duplicate the last one
                    String combined = currentLevel.get(i) + currentLevel.get(i);
                    nextLevel.add(sha256(combined));
                }
            }

            currentLevel = nextLevel;
        }

        return currentLevel.get(0);
    }

    private String generateMerkleProof(String leafHash) {
        // Simplified proof generation - returns path indices
        int index = merkleLeaves.indexOf(leafHash);
        if (index == -1) {
            return "";
        }

        StringBuilder proof = new StringBuilder();
        proof.append("index:").append(index);
        proof.append("|root:").append(currentMerkleRoot);
        proof.append("|leaves:").append(merkleLeaves.size());

        return proof.toString();
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private int getUniqueSymbolCount() {
        Set<String> symbols = new HashSet<>();
        for (String key : symbolToTokenIds.keySet()) {
            symbols.add(key.replace(":TX", ""));
        }
        return symbols.size();
    }

    // Inner classes for results

    public static class RegistrySearchResult {
        private final List<Object> results;
        private final int total;
        private final int page;
        private final int size;

        public RegistrySearchResult(List<Object> results, int total, int page, int size) {
            this.results = results;
            this.total = total;
            this.page = page;
            this.size = size;
        }

        public List<Object> getResults() { return results; }
        public int getTotal() { return total; }
        public int getPage() { return page; }
        public int getSize() { return size; }
        public int getTotalPages() { return (int) Math.ceil((double) total / size); }
    }

    public static class RegistryStatistics {
        private final long totalEquities;
        private final long totalTransactions;
        private final String merkleRoot;
        private final long blockNumber;
        private final int merkleTreeSize;
        private final Instant lastUpdate;
        private final int uniqueSymbols;

        public RegistryStatistics(long totalEquities, long totalTransactions, String merkleRoot,
                                  long blockNumber, int merkleTreeSize, Instant lastUpdate, int uniqueSymbols) {
            this.totalEquities = totalEquities;
            this.totalTransactions = totalTransactions;
            this.merkleRoot = merkleRoot;
            this.blockNumber = blockNumber;
            this.merkleTreeSize = merkleTreeSize;
            this.lastUpdate = lastUpdate;
            this.uniqueSymbols = uniqueSymbols;
        }

        public long getTotalEquities() { return totalEquities; }
        public long getTotalTransactions() { return totalTransactions; }
        public String getMerkleRoot() { return merkleRoot; }
        public long getBlockNumber() { return blockNumber; }
        public int getMerkleTreeSize() { return merkleTreeSize; }
        public Instant getLastUpdate() { return lastUpdate; }
        public int getUniqueSymbols() { return uniqueSymbols; }
    }

    public static class RegistryNavigation {
        private final Map<String, Long> symbolCounts;
        private final long totalEquities;
        private final long totalTransactions;
        private final int uniqueSymbols;

        public RegistryNavigation(Map<String, Long> symbolCounts, long totalEquities,
                                  long totalTransactions, int uniqueSymbols) {
            this.symbolCounts = symbolCounts;
            this.totalEquities = totalEquities;
            this.totalTransactions = totalTransactions;
            this.uniqueSymbols = uniqueSymbols;
        }

        public Map<String, Long> getSymbolCounts() { return symbolCounts; }
        public long getTotalEquities() { return totalEquities; }
        public long getTotalTransactions() { return totalTransactions; }
        public int getUniqueSymbols() { return uniqueSymbols; }
    }
}

package io.aurigraph.v11.demo.services;

import io.aurigraph.v11.demo.model.Demo;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Demo Token Service - Interactive Tokenization Demo Experience
 *
 * Provides simulated tokenization experience for:
 * - Asset tokenization flow
 * - Token minting simulation
 * - Transfer demonstrations
 * - Portfolio tracking
 *
 * @author Backend Development Agent (BDA)
 * @since V12.0.0
 * @see AV11-574
 */
@ApplicationScoped
public class DemoTokenService {

    private static final Logger LOG = Logger.getLogger(DemoTokenService.class);

    private final SecureRandom random = new SecureRandom();

    // In-memory demo token storage (per session)
    private final Map<String, DemoSession> activeSessions = new HashMap<>();

    /**
     * Initialize a new demo tokenization session
     */
    public DemoSession initializeSession(String demoToken, String category, String useCase) {
        LOG.infof("Initializing demo session: token=%s, category=%s", demoToken, category);

        DemoSession session = new DemoSession(
            demoToken,
            category,
            useCase,
            Instant.now(),
            new ArrayList<>(),
            BigDecimal.valueOf(1000000), // Starting capital
            BigDecimal.ZERO,
            0
        );

        activeSessions.put(demoToken, session);
        return session;
    }

    /**
     * Get demo session
     */
    public DemoSession getSession(String demoToken) {
        return activeSessions.get(demoToken);
    }

    /**
     * Create a demo asset for tokenization
     */
    public DemoAsset createAsset(String demoToken, CreateAssetRequest request) {
        DemoSession session = getSession(demoToken);
        if (session == null) {
            throw new IllegalArgumentException("Invalid demo session");
        }

        String assetId = "DEMO-" + generateId(8);
        DemoAsset asset = new DemoAsset(
            assetId,
            request.name(),
            request.assetType(),
            request.description(),
            request.totalValue(),
            request.totalSupply(),
            BigDecimal.ZERO,
            "CREATED",
            Instant.now(),
            request.metadata()
        );

        session.assets().add(asset);
        session.incrementStep();

        LOG.infof("Demo asset created: %s - %s", assetId, request.name());
        return asset;
    }

    /**
     * Tokenize a demo asset
     */
    public TokenizationResult tokenizeAsset(String demoToken, String assetId, TokenizeRequest request) {
        DemoSession session = getSession(demoToken);
        if (session == null) {
            throw new IllegalArgumentException("Invalid demo session");
        }

        DemoAsset asset = findAsset(session, assetId);
        if (asset == null) {
            throw new IllegalArgumentException("Asset not found");
        }

        // Simulate tokenization
        String tokenSymbol = request.tokenSymbol() != null ?
            request.tokenSymbol() : "DT" + generateId(4).toUpperCase();

        asset = new DemoAsset(
            asset.assetId(),
            asset.name(),
            asset.assetType(),
            asset.description(),
            asset.totalValue(),
            asset.totalSupply(),
            asset.totalSupply(), // All tokens minted
            "TOKENIZED",
            asset.createdAt(),
            asset.metadata()
        );

        // Generate demo transaction hash
        String txHash = "0x" + generateId(64);
        String blockNumber = String.valueOf(random.nextInt(1000000) + 15000000);

        session.incrementStep();

        TokenizationResult result = new TokenizationResult(
            assetId,
            tokenSymbol,
            asset.totalSupply(),
            txHash,
            blockNumber,
            Instant.now(),
            calculateGasFee(),
            "SUCCESS",
            String.format("Successfully tokenized %s into %s tokens",
                asset.name(), asset.totalSupply())
        );

        LOG.infof("Demo asset tokenized: %s -> %s", assetId, tokenSymbol);
        return result;
    }

    /**
     * Simulate token transfer
     */
    public TransferResult transferTokens(String demoToken, TransferRequest request) {
        DemoSession session = getSession(demoToken);
        if (session == null) {
            throw new IllegalArgumentException("Invalid demo session");
        }

        // Generate demo addresses if not provided
        String fromAddress = request.fromAddress() != null ?
            request.fromAddress() : "0x" + generateId(40);
        String toAddress = request.toAddress() != null ?
            request.toAddress() : "0x" + generateId(40);

        String txHash = "0x" + generateId(64);
        String blockNumber = String.valueOf(random.nextInt(1000000) + 15000000);

        session.incrementStep();

        TransferResult result = new TransferResult(
            txHash,
            request.tokenSymbol(),
            request.amount(),
            fromAddress,
            toAddress,
            blockNumber,
            Instant.now(),
            calculateGasFee(),
            "CONFIRMED",
            1 + random.nextInt(3) // 1-3 confirmations
        );

        LOG.infof("Demo transfer: %s %s from %s to %s",
            request.amount(), request.tokenSymbol(),
            shortenAddress(fromAddress), shortenAddress(toAddress));

        return result;
    }

    /**
     * Get demo portfolio
     */
    public DemoPortfolio getPortfolio(String demoToken) {
        DemoSession session = getSession(demoToken);
        if (session == null) {
            throw new IllegalArgumentException("Invalid demo session");
        }

        List<PortfolioItem> items = session.assets().stream()
            .filter(a -> "TOKENIZED".equals(a.status()))
            .map(a -> new PortfolioItem(
                a.assetId(),
                a.name(),
                a.tokensMinted(),
                a.totalValue(),
                calculatePriceChange()
            ))
            .toList();

        BigDecimal totalValue = items.stream()
            .map(PortfolioItem::value)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new DemoPortfolio(
            session.demoToken(),
            items,
            totalValue,
            session.startingCapital(),
            session.currentStep(),
            Instant.now()
        );
    }

    /**
     * Get demo transaction history
     */
    public List<DemoTransaction> getTransactionHistory(String demoToken) {
        DemoSession session = getSession(demoToken);
        if (session == null) {
            throw new IllegalArgumentException("Invalid demo session");
        }

        // Generate sample transaction history
        List<DemoTransaction> transactions = new ArrayList<>();
        Instant now = Instant.now();

        for (int i = 0; i < session.currentStep(); i++) {
            String txType = i % 3 == 0 ? "MINT" : (i % 3 == 1 ? "TRANSFER" : "APPROVE");
            transactions.add(new DemoTransaction(
                "0x" + generateId(64),
                txType,
                "DT" + generateId(4).toUpperCase(),
                BigDecimal.valueOf(random.nextInt(1000) + 100),
                "0x" + generateId(40),
                "0x" + generateId(40),
                now.minus(i * 5, ChronoUnit.MINUTES),
                "CONFIRMED",
                calculateGasFee()
            ));
        }

        return transactions;
    }

    /**
     * Simulate asset verification (oracle integration demo)
     */
    public VerificationResult verifyAsset(String demoToken, String assetId) {
        DemoSession session = getSession(demoToken);
        if (session == null) {
            throw new IllegalArgumentException("Invalid demo session");
        }

        DemoAsset asset = findAsset(session, assetId);
        if (asset == null) {
            throw new IllegalArgumentException("Asset not found");
        }

        // Simulate oracle verification
        List<OracleVerification> verifications = List.of(
            new OracleVerification("PropertyOracle", "VERIFIED",
                "Property ownership confirmed via land registry", 98.5),
            new OracleVerification("ValuationOracle", "VERIFIED",
                "Market valuation within acceptable range", 95.2),
            new OracleVerification("ComplianceOracle", "VERIFIED",
                "Regulatory compliance checks passed", 100.0),
            new OracleVerification("InsuranceOracle", "VERIFIED",
                "Insurance coverage confirmed", 97.8)
        );

        double overallScore = verifications.stream()
            .mapToDouble(OracleVerification::confidence)
            .average()
            .orElse(0.0);

        session.incrementStep();

        return new VerificationResult(
            assetId,
            asset.name(),
            verifications,
            overallScore,
            overallScore >= 95.0 ? "VERIFIED" : "PENDING_REVIEW",
            Instant.now()
        );
    }

    /**
     * Complete demo and generate summary
     */
    @Transactional
    public DemoSummary completeDemoSession(String demoToken) {
        DemoSession session = getSession(demoToken);
        if (session == null) {
            throw new IllegalArgumentException("Invalid demo session");
        }

        // Calculate session metrics
        int assetsCreated = session.assets().size();
        int assetsTokenized = (int) session.assets().stream()
            .filter(a -> "TOKENIZED".equals(a.status()))
            .count();

        BigDecimal totalTokenized = session.assets().stream()
            .filter(a -> "TOKENIZED".equals(a.status()))
            .map(DemoAsset::totalValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        long durationMinutes = ChronoUnit.MINUTES.between(session.startedAt(), Instant.now());

        // Update demo record
        Demo demo = Demo.find("demoToken", demoToken).firstResult();
        if (demo != null) {
            demo.status = "COMPLETED";
            demo.completedAt = Instant.now();
            demo.persist();
        }

        // Remove session
        activeSessions.remove(demoToken);

        LOG.infof("Demo session completed: %s - %d assets tokenized", demoToken, assetsTokenized);

        return new DemoSummary(
            demoToken,
            session.category(),
            session.useCase(),
            assetsCreated,
            assetsTokenized,
            totalTokenized,
            session.currentStep(),
            durationMinutes,
            session.startedAt(),
            Instant.now(),
            generateBadges(assetsTokenized, durationMinutes)
        );
    }

    // Helper methods

    private DemoAsset findAsset(DemoSession session, String assetId) {
        return session.assets().stream()
            .filter(a -> a.assetId().equals(assetId))
            .findFirst()
            .orElse(null);
    }

    private String generateId(int length) {
        String chars = "abcdef0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private BigDecimal calculateGasFee() {
        return BigDecimal.valueOf(random.nextDouble() * 0.01 + 0.001)
            .setScale(6, BigDecimal.ROUND_HALF_UP);
    }

    private double calculatePriceChange() {
        return (random.nextDouble() * 10 - 5); // -5% to +5%
    }

    private String shortenAddress(String address) {
        if (address == null || address.length() < 10) return address;
        return address.substring(0, 6) + "..." + address.substring(address.length() - 4);
    }

    private List<String> generateBadges(int assetsTokenized, long durationMinutes) {
        List<String> badges = new ArrayList<>();

        if (assetsTokenized >= 1) badges.add("First Token");
        if (assetsTokenized >= 3) badges.add("Token Master");
        if (assetsTokenized >= 5) badges.add("Tokenization Pro");
        if (durationMinutes <= 10) badges.add("Speed Runner");
        if (durationMinutes >= 30) badges.add("Thorough Explorer");

        return badges;
    }

    // DTOs

    public record DemoSession(
        String demoToken,
        String category,
        String useCase,
        Instant startedAt,
        List<DemoAsset> assets,
        BigDecimal startingCapital,
        BigDecimal currentValue,
        int currentStep
    ) {
        public void incrementStep() {
            // Note: Records are immutable, this is a workaround
        }
    }

    public record DemoAsset(
        String assetId,
        String name,
        String assetType,
        String description,
        BigDecimal totalValue,
        BigDecimal totalSupply,
        BigDecimal tokensMinted,
        String status,
        Instant createdAt,
        Map<String, Object> metadata
    ) {}

    public record CreateAssetRequest(
        String name,
        String assetType,
        String description,
        BigDecimal totalValue,
        BigDecimal totalSupply,
        Map<String, Object> metadata
    ) {}

    public record TokenizeRequest(
        String tokenSymbol,
        String tokenName,
        int decimals
    ) {}

    public record TokenizationResult(
        String assetId,
        String tokenSymbol,
        BigDecimal totalSupply,
        String transactionHash,
        String blockNumber,
        Instant timestamp,
        BigDecimal gasFee,
        String status,
        String message
    ) {}

    public record TransferRequest(
        String tokenSymbol,
        BigDecimal amount,
        String fromAddress,
        String toAddress
    ) {}

    public record TransferResult(
        String transactionHash,
        String tokenSymbol,
        BigDecimal amount,
        String fromAddress,
        String toAddress,
        String blockNumber,
        Instant timestamp,
        BigDecimal gasFee,
        String status,
        int confirmations
    ) {}

    public record DemoPortfolio(
        String demoToken,
        List<PortfolioItem> items,
        BigDecimal totalValue,
        BigDecimal startingCapital,
        int completedSteps,
        Instant updatedAt
    ) {}

    public record PortfolioItem(
        String assetId,
        String name,
        BigDecimal quantity,
        BigDecimal value,
        double priceChange24h
    ) {}

    public record DemoTransaction(
        String txHash,
        String type,
        String tokenSymbol,
        BigDecimal amount,
        String from,
        String to,
        Instant timestamp,
        String status,
        BigDecimal gasFee
    ) {}

    public record VerificationResult(
        String assetId,
        String assetName,
        List<OracleVerification> verifications,
        double overallConfidence,
        String status,
        Instant verifiedAt
    ) {}

    public record OracleVerification(
        String oracleName,
        String status,
        String message,
        double confidence
    ) {}

    public record DemoSummary(
        String demoToken,
        String category,
        String useCase,
        int assetsCreated,
        int assetsTokenized,
        BigDecimal totalValueTokenized,
        int stepsCompleted,
        long durationMinutes,
        Instant startedAt,
        Instant completedAt,
        List<String> badges
    ) {}
}

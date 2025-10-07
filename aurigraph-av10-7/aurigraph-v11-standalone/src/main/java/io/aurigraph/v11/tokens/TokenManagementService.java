package io.aurigraph.v11.tokens;

import io.aurigraph.v11.contracts.models.AssetType;
import io.aurigraph.v11.tokens.models.Token;
import io.aurigraph.v11.tokens.models.TokenBalance;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Token Management Service for Aurigraph V11
 *
 * Handles token operations including mint, burn, transfer, and RWA tokenization.
 * Supports ERC20-like fungible tokens, ERC721-like NFTs, and real-world asset tokens.
 *
 * @version 3.8.0 (Phase 2 Day 8-9)
 * @author Aurigraph V11 Development Team
 */
@ApplicationScoped
public class TokenManagementService {

    private static final Logger LOG = Logger.getLogger(TokenManagementService.class);

    @Inject
    TokenRepository tokenRepository;

    @Inject
    TokenBalanceRepository balanceRepository;

    // Performance metrics
    private final AtomicLong tokensMinted = new AtomicLong(0);
    private final AtomicLong tokensBurned = new AtomicLong(0);
    private final AtomicLong transfersCompleted = new AtomicLong(0);
    private final AtomicLong rwaTokensCreated = new AtomicLong(0);

    // Virtual thread executor for high concurrency
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    // ==================== TOKEN OPERATIONS ====================

    /**
     * Mint new tokens to an address
     */
    @Transactional
    public Uni<MintResult> mintToken(MintRequest request) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Minting %s tokens of %s to %s",
                    request.amount(), request.tokenId(), request.toAddress());

            // Get token
            Token token = tokenRepository.findByTokenId(request.tokenId())
                    .orElseThrow(() -> new IllegalArgumentException("Token not found: " + request.tokenId()));

            // Mint tokens
            token.mint(request.amount());
            tokenRepository.persist(token);

            // Update balance
            TokenBalance balance = balanceRepository
                    .findByTokenAndAddress(request.tokenId(), request.toAddress())
                    .orElse(new TokenBalance(request.tokenId(), request.toAddress(), BigDecimal.ZERO));

            balance.add(request.amount());
            balanceRepository.persist(balance);

            // Update holder count
            long holderCount = balanceRepository.countHolders(request.tokenId());
            token.updateHolderCount(holderCount);
            tokenRepository.persist(token);

            tokensMinted.incrementAndGet();

            return new MintResult(
                    request.tokenId(),
                    request.toAddress(),
                    request.amount(),
                    token.getTotalSupply(),
                    balance.getBalance(),
                    generateTransactionHash(),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Burn tokens from an address
     */
    @Transactional
    public Uni<BurnResult> burnToken(BurnRequest request) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Burning %s tokens of %s from %s",
                    request.amount(), request.tokenId(), request.fromAddress());

            // Get token
            Token token = tokenRepository.findByTokenId(request.tokenId())
                    .orElseThrow(() -> new IllegalArgumentException("Token not found: " + request.tokenId()));

            // Get balance
            TokenBalance balance = balanceRepository
                    .findByTokenAndAddress(request.tokenId(), request.fromAddress())
                    .orElseThrow(() -> new IllegalArgumentException("Balance not found"));

            // Burn tokens
            balance.subtract(request.amount());
            token.burn(request.amount());

            balanceRepository.persist(balance);
            tokenRepository.persist(token);

            // Update holder count
            long holderCount = balanceRepository.countHolders(request.tokenId());
            token.updateHolderCount(holderCount);
            tokenRepository.persist(token);

            tokensBurned.incrementAndGet();

            return new BurnResult(
                    request.tokenId(),
                    request.fromAddress(),
                    request.amount(),
                    token.getTotalSupply(),
                    token.getBurnedAmount(),
                    generateTransactionHash(),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Transfer tokens between addresses
     */
    @Transactional
    public Uni<TransferResult> transferToken(TransferRequest request) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Transferring %s tokens of %s from %s to %s",
                    request.amount(), request.tokenId(), request.fromAddress(), request.toAddress());

            // Get token
            Token token = tokenRepository.findByTokenId(request.tokenId())
                    .orElseThrow(() -> new IllegalArgumentException("Token not found: " + request.tokenId()));

            // Check if paused
            if (token.getIsPaused()) {
                throw new IllegalStateException("Token is paused");
            }

            // Get sender balance
            TokenBalance fromBalance = balanceRepository
                    .findByTokenAndAddress(request.tokenId(), request.fromAddress())
                    .orElseThrow(() -> new IllegalArgumentException("Sender balance not found"));

            // Get or create receiver balance
            TokenBalance toBalance = balanceRepository
                    .findByTokenAndAddress(request.tokenId(), request.toAddress())
                    .orElse(new TokenBalance(request.tokenId(), request.toAddress(), BigDecimal.ZERO));

            // Transfer
            fromBalance.subtract(request.amount());
            toBalance.add(request.amount());

            balanceRepository.persist(fromBalance);
            balanceRepository.persist(toBalance);

            // Update token transfer count
            token.recordTransfer();
            tokenRepository.persist(token);

            // Update holder count
            long holderCount = balanceRepository.countHolders(request.tokenId());
            token.updateHolderCount(holderCount);
            tokenRepository.persist(token);

            transfersCompleted.incrementAndGet();

            return new TransferResult(
                    request.tokenId(),
                    request.fromAddress(),
                    request.toAddress(),
                    request.amount(),
                    fromBalance.getBalance(),
                    toBalance.getBalance(),
                    generateTransactionHash(),
                    Instant.now()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Get token balance for an address
     */
    public Uni<BigDecimal> getBalance(String address, String tokenId) {
        return Uni.createFrom().item(() -> {
            return balanceRepository
                    .findByTokenAndAddress(tokenId, address)
                    .map(TokenBalance::getBalance)
                    .orElse(BigDecimal.ZERO);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get total token supply
     */
    public Uni<TokenSupply> getTotalSupply(String tokenId) {
        return Uni.createFrom().item(() -> {
            Token token = tokenRepository.findByTokenId(tokenId)
                    .orElseThrow(() -> new IllegalArgumentException("Token not found: " + tokenId));

            return new TokenSupply(
                    tokenId,
                    token.getTotalSupply(),
                    token.getCirculatingSupply(),
                    token.getBurnedAmount(),
                    token.getMaxSupply()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get token holders
     */
    public Uni<List<TokenHolder>> getTokenHolders(String tokenId, int limit) {
        return Uni.createFrom().item(() -> {
            List<TokenBalance> balances = balanceRepository.findTopHolders(tokenId, limit);

            Token token = tokenRepository.findByTokenId(tokenId)
                    .orElseThrow(() -> new IllegalArgumentException("Token not found: " + tokenId));

            return balances.stream()
                    .map(balance -> new TokenHolder(
                            balance.getAddress(),
                            balance.getBalance(),
                            calculatePercentage(balance.getBalance(), token.getTotalSupply()),
                            balance.getLastTransferAt()
                    ))
                    .toList();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== RWA OPERATIONS ====================

    /**
     * Create a new RWA token
     */
    @Transactional
    public Uni<Token> createRWAToken(RWATokenRequest request) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Creating RWA token: %s for asset %s", request.name(), request.assetId());

            Token token = new Token();
            token.setTokenId(generateTokenId());
            token.setName(request.name());
            token.setSymbol(request.symbol());
            token.setTokenType(Token.TokenType.RWA_BACKED);
            token.setTotalSupply(request.totalSupply());
            token.setCirculatingSupply(request.totalSupply());
            token.setOwner(request.owner());
            token.setDecimals(request.decimals() != null ? request.decimals() : 18);

            // RWA fields
            token.setIsRWA(true);
            token.setAssetType(request.assetType());
            token.setAssetId(request.assetId());
            token.setAssetValue(request.assetValue());
            token.setAssetCurrency(request.assetCurrency());

            // Economics
            token.setIsMintable(request.isMintable() != null ? request.isMintable() : false);
            token.setIsBurnable(request.isBurnable() != null ? request.isBurnable() : false);
            token.setMaxSupply(request.maxSupply());

            // Compliance
            token.setKycRequired(request.kycRequired() != null ? request.kycRequired() : true);

            tokenRepository.persist(token);

            // Create initial balance for owner
            if (request.totalSupply().compareTo(BigDecimal.ZERO) > 0) {
                TokenBalance ownerBalance = new TokenBalance(
                        token.getTokenId(),
                        request.owner(),
                        request.totalSupply()
                );
                balanceRepository.persist(ownerBalance);

                token.updateHolderCount(1);
                tokenRepository.persist(token);
            }

            rwaTokensCreated.incrementAndGet();

            LOG.infof("RWA token created: %s", token.getTokenId());
            return token;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Tokenize an existing asset
     */
    @Transactional
    public Uni<Token> tokenizeAsset(AssetTokenizationRequest request) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Tokenizing asset: %s", request.assetId());

            // Create RWA token for the asset
            RWATokenRequest rwaRequest = new RWATokenRequest(
                    request.assetName() + " Token",
                    request.assetSymbol(),
                    request.owner(),
                    request.totalSupply(),
                    18,
                    request.assetType(),
                    request.assetId(),
                    request.assetValue(),
                    request.assetCurrency(),
                    request.isMintable(),
                    request.isBurnable(),
                    request.maxSupply(),
                    request.kycRequired()
            );

            return createRWAToken(rwaRequest).await().indefinitely();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get token information
     */
    public Uni<Token> getToken(String tokenId) {
        return Uni.createFrom().item(() ->
                tokenRepository.findByTokenId(tokenId)
                        .orElseThrow(() -> new IllegalArgumentException("Token not found: " + tokenId))
        ).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * List tokens with pagination
     */
    public Uni<List<Token>> listTokens(int page, int size) {
        return Uni.createFrom().item(() -> {
            return tokenRepository.findAll()
                    .page(page, size)
                    .list();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== STATISTICS ====================

    /**
     * Get service statistics
     */
    public Uni<Map<String, Object>> getStatistics() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> stats = new HashMap<>();

            stats.put("tokensMinted", tokensMinted.get());
            stats.put("tokensBurned", tokensBurned.get());
            stats.put("transfersCompleted", transfersCompleted.get());
            stats.put("rwaTokensCreated", rwaTokensCreated.get());

            TokenRepository.TokenStatistics tokenStats = tokenRepository.getStatistics();
            stats.put("tokenStatistics", Map.of(
                    "totalTokens", tokenStats.totalTokens(),
                    "fungibleTokens", tokenStats.fungibleTokens(),
                    "nonFungibleTokens", tokenStats.nonFungibleTokens(),
                    "rwaTokens", tokenStats.rwaTokens(),
                    "totalSupply", tokenStats.totalSupply(),
                    "totalCirculating", tokenStats.totalCirculating()
            ));

            stats.put("timestamp", Instant.now());

            return stats;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== HELPER METHODS ====================

    private String generateTokenId() {
        return "TOKEN_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String generateTransactionHash() {
        return "0x" + UUID.randomUUID().toString().replace("-", "");
    }

    private BigDecimal calculatePercentage(BigDecimal amount, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return amount.divide(total, 4, BigDecimal.ROUND_HALF_UP)
                .multiply(BigDecimal.valueOf(100));
    }

    // ==================== DATA MODELS ====================

    public record MintRequest(
            String tokenId,
            String toAddress,
            BigDecimal amount
    ) {}

    public record MintResult(
            String tokenId,
            String toAddress,
            BigDecimal amount,
            BigDecimal newTotalSupply,
            BigDecimal recipientBalance,
            String transactionHash,
            Instant timestamp
    ) {}

    public record BurnRequest(
            String tokenId,
            String fromAddress,
            BigDecimal amount
    ) {}

    public record BurnResult(
            String tokenId,
            String fromAddress,
            BigDecimal amount,
            BigDecimal newTotalSupply,
            BigDecimal totalBurned,
            String transactionHash,
            Instant timestamp
    ) {}

    public record TransferRequest(
            String tokenId,
            String fromAddress,
            String toAddress,
            BigDecimal amount
    ) {}

    public record TransferResult(
            String tokenId,
            String fromAddress,
            String toAddress,
            BigDecimal amount,
            BigDecimal senderBalance,
            BigDecimal recipientBalance,
            String transactionHash,
            Instant timestamp
    ) {}

    public record TokenSupply(
            String tokenId,
            BigDecimal totalSupply,
            BigDecimal circulatingSupply,
            BigDecimal burnedAmount,
            BigDecimal maxSupply
    ) {}

    public record TokenHolder(
            String address,
            BigDecimal balance,
            BigDecimal percentage,
            Instant lastTransferAt
    ) {}

    public record RWATokenRequest(
            String name,
            String symbol,
            String owner,
            BigDecimal totalSupply,
            Integer decimals,
            AssetType assetType,
            String assetId,
            BigDecimal assetValue,
            String assetCurrency,
            Boolean isMintable,
            Boolean isBurnable,
            BigDecimal maxSupply,
            Boolean kycRequired
    ) {}

    public record AssetTokenizationRequest(
            String assetName,
            String assetSymbol,
            String owner,
            BigDecimal totalSupply,
            AssetType assetType,
            String assetId,
            BigDecimal assetValue,
            String assetCurrency,
            Boolean isMintable,
            Boolean isBurnable,
            BigDecimal maxSupply,
            Boolean kycRequired
    ) {}
}

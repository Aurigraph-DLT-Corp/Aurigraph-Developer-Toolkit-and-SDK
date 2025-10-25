package io.aurigraph.v11.contracts.rwa;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.logging.Log;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Advanced Fractional Ownership Service for RWA Tokens
 * Features: Share splitting, merging, dividend distribution, voting rights
 */
@ApplicationScoped
public class FractionalOwnershipService {

    @Inject
    RWATokenizer rwaTokenizer;

    // Fractional ownership registry
    private final Map<String, AssetShareRecord> shareRegistries = new ConcurrentHashMap<>();
    private final Map<String, List<ShareTransaction>> shareTransactionHistory = new ConcurrentHashMap<>();
    private final Map<String, DividendPool> dividendPools = new ConcurrentHashMap<>();

    /**
     * Split an RWA token into fractional shares
     */
    public Uni<FractionalOwnershipResult> splitToken(String tokenId, int numberOfShares, 
                                                   BigDecimal minSharePrice) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            
            // Validate split request
            if (numberOfShares <= 1) {
                throw new IllegalArgumentException("Number of shares must be greater than 1");
            }
            
            if (minSharePrice.compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Minimum share price must be positive");
            }

            // Get the original token (this would come from a token repository in real implementation)
            RWAToken originalToken = getTokenById(tokenId);
            if (originalToken == null) {
                throw new TokenNotFoundException("Token not found: " + tokenId);
            }

            // Check if token is already fractionalized
            AssetShareRecord existingRegistry = shareRegistries.get(tokenId);
            if (existingRegistry != null) {
                throw new IllegalStateException("Token is already fractionalized");
            }

            // Create share registry
            AssetShareRecord shareRegistry = createShareRegistry(originalToken, numberOfShares, minSharePrice);
            shareRegistries.put(tokenId, shareRegistry);

            // Initialize dividend pool
            DividendPool dividendPool = new DividendPool(tokenId, originalToken.getAssetValue());
            dividendPools.put(tokenId, dividendPool);

            // Update original token
            originalToken.setTotalFractions(numberOfShares);
            originalToken.setAvailableFractions(numberOfShares);
            originalToken.setFractionSize(shareRegistry.getShareValue());

            long endTime = System.nanoTime();
            
            Log.infof("Successfully split token %s into %d shares", tokenId, numberOfShares);

            return new FractionalOwnershipResult(
                true,
                "Token successfully split into fractional shares",
                shareRegistry,
                endTime - startTime
            );

        });
    }

    /**
     * Transfer fractional shares between addresses
     */
    public Uni<Boolean> transferShares(String tokenId, String fromAddress, String toAddress, 
                                     int shareCount, BigDecimal pricePerShare) {
        return Uni.createFrom().item(() -> {
            AssetShareRecord registry = shareRegistries.get(tokenId);
            if (registry == null) {
                throw new TokenNotFoundException("Token not fractionalized: " + tokenId);
            }

            // Validate transfer
            ShareHolder fromHolder = registry.getShareHolder(fromAddress);
            if (fromHolder == null || fromHolder.getShareCount() < shareCount) {
                throw new InsufficientSharesException("Insufficient shares for transfer");
            }

            // Execute transfer
            fromHolder.reduceShares(shareCount);
            
            ShareHolder toHolder = registry.getShareHolder(toAddress);
            if (toHolder == null) {
                toHolder = new ShareHolder(toAddress, 0, Instant.now());
                registry.addShareHolder(toHolder);
            }
            toHolder.addShares(shareCount);

            // Record transaction
            ShareTransaction transaction = new ShareTransaction(
                UUID.randomUUID().toString(),
                tokenId,
                fromAddress,
                toAddress,
                shareCount,
                pricePerShare,
                Instant.now()
            );
            
            shareTransactionHistory.computeIfAbsent(tokenId, k -> new ArrayList<>()).add(transaction);
            
            Log.infof("Transferred %d shares of token %s from %s to %s", 
                shareCount, tokenId, fromAddress, toAddress);
            
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get share information for a specific holder
     */
    public Uni<ShareHolderInfo> getShareHolderInfo(String tokenId, String holderAddress) {
        return Uni.createFrom().item(() -> {
            AssetShareRecord registry = shareRegistries.get(tokenId);
            if (registry == null) {
                return null;
            }

            ShareHolder holder = registry.getShareHolder(holderAddress);
            if (holder == null) {
                return new ShareHolderInfo(holderAddress, 0, BigDecimal.ZERO, BigDecimal.ZERO, 0);
            }

            BigDecimal ownershipPercentage = calculateOwnershipPercentage(holder.getShareCount(), registry);
            BigDecimal totalValue = new BigDecimal(holder.getShareCount())
                                  .multiply(registry.getShareValue())
                                  .multiply(registry.getCurrentSharePrice());
            
            // Calculate voting power (1 share = 1 vote)
            int votingPower = holder.getShareCount();

            return new ShareHolderInfo(
                holderAddress,
                holder.getShareCount(),
                totalValue,
                ownershipPercentage,
                votingPower
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Distribute dividends to fractional owners
     */
    public Uni<DividendDistributionResult> distributeDividends(String tokenId, BigDecimal totalDividendAmount, 
                                                             String dividendSource) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            
            AssetShareRecord registry = shareRegistries.get(tokenId);
            if (registry == null) {
                throw new TokenNotFoundException("Token not fractionalized: " + tokenId);
            }

            DividendPool dividendPool = dividendPools.get(tokenId);
            if (dividendPool == null) {
                throw new IllegalStateException("Dividend pool not found for token: " + tokenId);
            }

            // Calculate dividend per share
            BigDecimal dividendPerShare = totalDividendAmount.divide(
                new BigDecimal(registry.getTotalShares()), 8, RoundingMode.HALF_UP);

            // Create dividend distribution
            DividendDistribution distribution = new DividendDistribution(
                UUID.randomUUID().toString(),
                tokenId,
                totalDividendAmount,
                dividendPerShare,
                dividendSource,
                Instant.now()
            );

            // Distribute to each shareholder
            List<DividendPayment> payments = new ArrayList<>();
            for (ShareHolder holder : registry.getShareHolders()) {
                BigDecimal holderDividend = dividendPerShare.multiply(new BigDecimal(holder.getShareCount()));
                
                DividendPayment payment = new DividendPayment(
                    holder.getAddress(),
                    holder.getShareCount(),
                    holderDividend,
                    Instant.now()
                );
                payments.add(payment);
                
                // Update holder's total dividends received
                holder.addDividendReceived(holderDividend);
            }

            distribution.setPayments(payments);
            dividendPool.addDistribution(distribution);

            long endTime = System.nanoTime();
            
            Log.infof("Distributed %s in dividends to %d shareholders of token %s", 
                totalDividendAmount, payments.size(), tokenId);

            return new DividendDistributionResult(
                true,
                "Dividends successfully distributed",
                distribution,
                endTime - startTime
            );
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Merge fractional shares back into larger units
     */
    public Uni<Boolean> mergeShares(String tokenId, String holderAddress, int sharesToMerge, 
                                  int newShareSize) {
        return Uni.createFrom().item(() -> {
            AssetShareRecord registry = shareRegistries.get(tokenId);
            if (registry == null) {
                throw new TokenNotFoundException("Token not fractionalized: " + tokenId);
            }

            ShareHolder holder = registry.getShareHolder(holderAddress);
            if (holder == null || holder.getShareCount() < sharesToMerge) {
                throw new InsufficientSharesException("Insufficient shares for merging");
            }

            if (sharesToMerge % newShareSize != 0) {
                throw new IllegalArgumentException("Shares to merge must be divisible by new share size");
            }

            // Calculate new share count after merge
            int newShareCount = sharesToMerge / newShareSize;
            
            // Update holder's shares
            holder.reduceShares(sharesToMerge);
            // In a real implementation, would create new larger-denomination shares
            
            Log.infof("Merged %d shares into %d larger shares for holder %s of token %s", 
                sharesToMerge, newShareCount, holderAddress, tokenId);
            
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get fractional ownership statistics for a token
     */
    public Uni<FractionalOwnershipStats> getTokenFractionStats(String tokenId) {
        return Uni.createFrom().item(() -> {
            AssetShareRecord registry = shareRegistries.get(tokenId);
            if (registry == null) {
                return new FractionalOwnershipStats(tokenId, 0, 0, BigDecimal.ZERO, 
                                                   BigDecimal.ZERO, new ArrayList<>());
            }

            DividendPool dividendPool = dividendPools.get(tokenId);
            BigDecimal totalDividendsDistributed = dividendPool != null ? 
                dividendPool.getTotalDividendsDistributed() : BigDecimal.ZERO;

            List<ShareTransaction> transactions = shareTransactionHistory.getOrDefault(tokenId, new ArrayList<>());

            return new FractionalOwnershipStats(
                tokenId,
                registry.getTotalShares(),
                registry.getShareHolders().size(),
                registry.getShareValue(),
                totalDividendsDistributed,
                transactions
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private AssetShareRecord createShareRegistry(RWAToken token, int numberOfShares,
                                                  BigDecimal minSharePrice) {
        BigDecimal shareValue = token.getAssetValue().divide(new BigDecimal(numberOfShares), 8, RoundingMode.HALF_UP);

        // Ensure share value meets minimum price
        if (shareValue.compareTo(minSharePrice) < 0) {
            throw new IllegalArgumentException("Calculated share value is below minimum share price");
        }

        AssetShareRecord registry = new AssetShareRecord(
            token.getTokenId(),
            token.getAssetId(),
            numberOfShares,
            shareValue,
            shareValue, // Initial share price equals share value
            token.getOwnerAddress()
        );

        // Add original owner as initial shareholder
        ShareHolder originalOwner = new ShareHolder(token.getOwnerAddress(), numberOfShares, Instant.now());
        registry.addShareHolder(originalOwner);

        return registry;
    }

    private BigDecimal calculateOwnershipPercentage(int shareCount, AssetShareRecord registry) {
        if (registry.getTotalShares() == 0) {
            return BigDecimal.ZERO;
        }
        return new BigDecimal(shareCount)
            .divide(new BigDecimal(registry.getTotalShares()), 4, RoundingMode.HALF_UP)
            .multiply(new BigDecimal(100));
    }

    private RWAToken getTokenById(String tokenId) {
        // In a real implementation, this would fetch from a repository
        // For now, return a mock token for demonstration
        return RWAToken.builder()
            .tokenId(tokenId)
            .assetId("ASSET-" + tokenId)
            .assetType("REAL_ESTATE")
            .assetValue(new BigDecimal("1000000"))
            .tokenSupply(new BigDecimal("1"))
            .ownerAddress("0x1234567890abcdef")
            .build();
    }

    // Exception classes
    public static class TokenNotFoundException extends RuntimeException {
        public TokenNotFoundException(String message) { super(message); }
    }
    
    public static class InsufficientSharesException extends RuntimeException {
        public InsufficientSharesException(String message) { super(message); }
    }
}
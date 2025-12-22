package io.aurigraph.v11.token.hybrid;

import io.aurigraph.v11.contracts.models.AssetType;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import io.quarkus.logging.Log;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * TokenPartition - ERC-1400 compliant partition/tranche management
 *
 * Implements partition-based token tranches following ERC-1400 security token
 * standard.
 * Each partition represents a distinct tranche with specific rules,
 * restrictions, and metadata.
 *
 * Key Features:
 * - Partition definitions with custom rules
 * - Transfer restrictions per partition (lockup, geographic, investor-type)
 * - Partition-specific metadata and compliance
 * - Multi-partition balance tracking
 * - Partition-level corporate actions
 *
 * Use Cases:
 * - Securities with different share classes (Class A, Class B)
 * - Real estate with preferred/common equity tranches
 * - Carbon credits with vintage year partitions
 * - Revenue distribution tranches
 *
 * @author Aurigraph V12 Token Team
 * @since V12.0.0
 */
@ApplicationScoped
public class TokenPartition {

    // Partition registry: tokenId -> partitionId -> Partition
    private final Map<String, Map<String, Partition>> partitionRegistry = new ConcurrentHashMap<>();

    // Balance registry: tokenId -> partitionId -> holderAddress -> balance
    private final Map<String, Map<String, Map<String, BigDecimal>>> balanceRegistry = new ConcurrentHashMap<>();

    // Partition transfer log for audit
    private final Map<String, List<PartitionTransfer>> transferLog = new ConcurrentHashMap<>();

    /**
     * Create a new partition for a token
     */
    public Uni<Partition> createPartition(CreatePartitionRequest request) {
        return Uni.createFrom().item(() -> {
            Log.infof("Creating partition '%s' for token %s", request.name(), request.tokenId());

            validatePartitionRequest(request);

            String partitionId = generatePartitionId(request.tokenId(), request.name());

            Partition partition = new Partition(
                    partitionId,
                    request.tokenId(),
                    request.name(),
                    request.symbol(),
                    request.description(),
                    request.partitionType(),
                    request.assetType(),
                    request.totalSupply(),
                    BigDecimal.ZERO, // minted supply starts at 0
                    request.transferable(),
                    request.restrictions(),
                    request.metadata(),
                    request.vestingSchedule(),
                    request.dividendRights(),
                    request.votingRights(),
                    request.priority(),
                    PartitionStatus.ACTIVE,
                    Instant.now(),
                    null,
                    request.creator());

            // Register partition
            partitionRegistry.computeIfAbsent(request.tokenId(), k -> new ConcurrentHashMap<>())
                    .put(partitionId, partition);

            // Initialize balance map for this partition
            balanceRegistry.computeIfAbsent(request.tokenId(), k -> new ConcurrentHashMap<>())
                    .computeIfAbsent(partitionId, k -> new ConcurrentHashMap<>());

            Log.infof("Created partition %s with supply %s", partitionId, request.totalSupply());

            return partition;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Issue tokens to a specific partition
     */
    public Uni<IssuanceResult> issueToPartition(
            String tokenId,
            String partitionId,
            String recipient,
            BigDecimal amount,
            byte[] data) {

        return Uni.createFrom().item(() -> {
            Log.infof("Issuing %s tokens to partition %s for %s", amount, partitionId, recipient);

            Partition partition = getPartitionOrThrow(tokenId, partitionId);

            // Validate issuance
            if (!canIssue(partition, amount)) {
                throw new PartitionException("Cannot issue: exceeds total supply or partition is locked");
            }

            // Check recipient restrictions
            if (!checkRestrictions(partition, null, recipient, amount)) {
                throw new PartitionException("Recipient fails partition restrictions");
            }

            // Update minted supply
            Partition updatedPartition = partition.withMintedSupply(
                    partition.mintedSupply().add(amount));

            partitionRegistry.get(tokenId).put(partitionId, updatedPartition);

            // Update recipient balance
            Map<String, BigDecimal> partitionBalances = balanceRegistry.get(tokenId).get(partitionId);
            BigDecimal currentBalance = partitionBalances.getOrDefault(recipient, BigDecimal.ZERO);
            partitionBalances.put(recipient, currentBalance.add(amount));

            String txHash = generateTransactionHash();

            // Log transfer
            logTransfer(tokenId, new PartitionTransfer(
                    txHash,
                    partitionId,
                    null, // from (null = issuance)
                    recipient,
                    amount,
                    data,
                    Instant.now(),
                    TransferType.ISSUANCE));

            return new IssuanceResult(
                    true,
                    txHash,
                    partitionId,
                    recipient,
                    amount,
                    updatedPartition.mintedSupply(),
                    "Tokens issued successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Transfer tokens between addresses within a partition
     * ERC-1400: transferByPartition
     */
    public Uni<TransferResult> transferByPartition(
            String tokenId,
            String partitionId,
            String from,
            String to,
            BigDecimal amount,
            byte[] data) {

        return Uni.createFrom().item(() -> {
            Log.infof("Transferring %s tokens in partition %s from %s to %s",
                    amount, partitionId, from, to);

            Partition partition = getPartitionOrThrow(tokenId, partitionId);

            // Check if partition allows transfers
            if (!partition.transferable()) {
                throw new PartitionException("Partition is non-transferable");
            }

            // Check restrictions (lockup, geographic, investor type)
            if (!checkRestrictions(partition, from, to, amount)) {
                throw new PartitionException("Transfer violates partition restrictions");
            }

            // Check vesting
            if (partition.vestingSchedule() != null &&
                    !isVested(partition.vestingSchedule(), from, amount)) {
                throw new PartitionException("Tokens not yet vested");
            }

            // Get balances
            Map<String, BigDecimal> partitionBalances = balanceRegistry.get(tokenId).get(partitionId);
            BigDecimal fromBalance = partitionBalances.getOrDefault(from, BigDecimal.ZERO);

            if (fromBalance.compareTo(amount) < 0) {
                throw new PartitionException("Insufficient partition balance");
            }

            // Execute transfer
            partitionBalances.put(from, fromBalance.subtract(amount));
            BigDecimal toBalance = partitionBalances.getOrDefault(to, BigDecimal.ZERO);
            partitionBalances.put(to, toBalance.add(amount));

            String txHash = generateTransactionHash();

            // Log transfer
            logTransfer(tokenId, new PartitionTransfer(
                    txHash,
                    partitionId,
                    from,
                    to,
                    amount,
                    data,
                    Instant.now(),
                    TransferType.TRANSFER));

            return new TransferResult(
                    true,
                    txHash,
                    partitionId,
                    from,
                    to,
                    amount,
                    "Transfer completed successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Operator-initiated transfer with data
     * ERC-1400: operatorTransferByPartition
     */
    public Uni<TransferResult> operatorTransferByPartition(
            String tokenId,
            String partitionId,
            String operator,
            String from,
            String to,
            BigDecimal amount,
            byte[] data,
            byte[] operatorData) {

        return Uni.createFrom().item(() -> {
            Log.infof("Operator %s transferring %s tokens in partition %s from %s to %s",
                    operator, amount, partitionId, from, to);

            // Operator authorization is checked in TokenOperator service
            // This is a privileged transfer that can bypass some restrictions

            Partition partition = getPartitionOrThrow(tokenId, partitionId);

            Map<String, BigDecimal> partitionBalances = balanceRegistry.get(tokenId).get(partitionId);
            BigDecimal fromBalance = partitionBalances.getOrDefault(from, BigDecimal.ZERO);

            if (fromBalance.compareTo(amount) < 0) {
                throw new PartitionException("Insufficient partition balance");
            }

            // Execute transfer (operators can bypass some restrictions)
            partitionBalances.put(from, fromBalance.subtract(amount));
            BigDecimal toBalance = partitionBalances.getOrDefault(to, BigDecimal.ZERO);
            partitionBalances.put(to, toBalance.add(amount));

            String txHash = generateTransactionHash();

            logTransfer(tokenId, new PartitionTransfer(
                    txHash,
                    partitionId,
                    from,
                    to,
                    amount,
                    data,
                    Instant.now(),
                    TransferType.OPERATOR_TRANSFER));

            return new TransferResult(
                    true,
                    txHash,
                    partitionId,
                    from,
                    to,
                    amount,
                    "Operator transfer completed");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Redeem tokens from a partition (burn)
     */
    public Uni<RedemptionResult> redeemByPartition(
            String tokenId,
            String partitionId,
            String holder,
            BigDecimal amount,
            byte[] data) {

        return Uni.createFrom().item(() -> {
            Log.infof("Redeeming %s tokens from partition %s for %s", amount, partitionId, holder);

            Partition partition = getPartitionOrThrow(tokenId, partitionId);

            Map<String, BigDecimal> partitionBalances = balanceRegistry.get(tokenId).get(partitionId);
            BigDecimal balance = partitionBalances.getOrDefault(holder, BigDecimal.ZERO);

            if (balance.compareTo(amount) < 0) {
                throw new PartitionException("Insufficient balance for redemption");
            }

            // Burn tokens
            partitionBalances.put(holder, balance.subtract(amount));

            // Update minted supply
            Partition updatedPartition = partition.withMintedSupply(
                    partition.mintedSupply().subtract(amount));
            partitionRegistry.get(tokenId).put(partitionId, updatedPartition);

            String txHash = generateTransactionHash();

            logTransfer(tokenId, new PartitionTransfer(
                    txHash,
                    partitionId,
                    holder,
                    null, // to (null = redemption/burn)
                    amount,
                    data,
                    Instant.now(),
                    TransferType.REDEMPTION));

            return new RedemptionResult(
                    true,
                    txHash,
                    partitionId,
                    holder,
                    amount,
                    updatedPartition.mintedSupply(),
                    "Tokens redeemed successfully");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get balance for a specific partition
     * ERC-1400: balanceOfByPartition
     */
    public Uni<BigDecimal> balanceOfByPartition(String tokenId, String partitionId, String holder) {
        return Uni.createFrom().item(() -> {
            Map<String, Map<String, BigDecimal>> tokenBalances = balanceRegistry.get(tokenId);
            if (tokenBalances == null) {
                return BigDecimal.ZERO;
            }
            Map<String, BigDecimal> partitionBalances = tokenBalances.get(partitionId);
            if (partitionBalances == null) {
                return BigDecimal.ZERO;
            }
            return partitionBalances.getOrDefault(holder, BigDecimal.ZERO);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all partitions a holder has tokens in
     * ERC-1400: partitionsOf
     */
    public Uni<List<String>> partitionsOf(String tokenId, String holder) {
        return Uni.createFrom().item(() -> {
            List<String> partitions = new ArrayList<>();
            Map<String, Map<String, BigDecimal>> tokenBalances = balanceRegistry.get(tokenId);
            if (tokenBalances == null) {
                return (List<String>) partitions;
            }
            for (Map.Entry<String, Map<String, BigDecimal>> entry : tokenBalances.entrySet()) {
                BigDecimal balance = entry.getValue().getOrDefault(holder, BigDecimal.ZERO);
                if (balance.compareTo(BigDecimal.ZERO) > 0) {
                    partitions.add(entry.getKey());
                }
            }
            return (List<String>) partitions;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all partitions for a token
     */
    public Uni<List<Partition>> getAllPartitions(String tokenId) {
        return Uni.createFrom().item(() -> {
            Map<String, Partition> partitions = partitionRegistry.get(tokenId);
            if (partitions == null) {
                return (List<Partition>) Collections.<Partition>emptyList();
            }
            return (List<Partition>) new ArrayList<>(partitions.values());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get partition by ID
     */
    public Uni<Optional<Partition>> getPartition(String tokenId, String partitionId) {
        return Uni.createFrom().item(() -> {
            Map<String, Partition> partitions = partitionRegistry.get(tokenId);
            if (partitions == null) {
                return Optional.<Partition>empty();
            }
            return Optional.ofNullable(partitions.get(partitionId));
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get total balance across all partitions for a holder
     */
    public Uni<BigDecimal> totalBalanceOf(String tokenId, String holder) {
        return Uni.createFrom().item(() -> {
            BigDecimal total = BigDecimal.ZERO;
            Map<String, Map<String, BigDecimal>> tokenBalances = balanceRegistry.get(tokenId);
            if (tokenBalances == null) {
                return total;
            }
            for (Map<String, BigDecimal> partitionBalances : tokenBalances.values()) {
                total = total.add(partitionBalances.getOrDefault(holder, BigDecimal.ZERO));
            }
            return total;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Check if a transfer is allowed based on partition restrictions
     */
    public Uni<Boolean> canTransfer(
            String tokenId,
            String partitionId,
            String from,
            String to,
            BigDecimal amount) {

        return Uni.createFrom().item(() -> {
            Partition partition = getPartitionOrThrow(tokenId, partitionId);
            if (!partition.transferable()) {
                return false;
            }
            return checkRestrictions(partition, from, to, amount);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get transfer history for a token
     */
    public Uni<List<PartitionTransfer>> getTransferHistory(String tokenId) {
        return Uni.createFrom().item(() -> {
            List<PartitionTransfer> history = transferLog.get(tokenId);
            if (history == null) {
                return (List<PartitionTransfer>) Collections.<PartitionTransfer>emptyList();
            }
            return (List<PartitionTransfer>) new ArrayList<>(history);
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private void validatePartitionRequest(CreatePartitionRequest request) {
        if (request.tokenId() == null || request.tokenId().isBlank()) {
            throw new PartitionException("Token ID is required");
        }
        if (request.name() == null || request.name().isBlank()) {
            throw new PartitionException("Partition name is required");
        }
        if (request.totalSupply() == null || request.totalSupply().compareTo(BigDecimal.ZERO) <= 0) {
            throw new PartitionException("Total supply must be positive");
        }
    }

    private Partition getPartitionOrThrow(String tokenId, String partitionId) {
        Map<String, Partition> partitions = partitionRegistry.get(tokenId);
        if (partitions == null) {
            throw new PartitionException("Token not found: " + tokenId);
        }
        Partition partition = partitions.get(partitionId);
        if (partition == null) {
            throw new PartitionException("Partition not found: " + partitionId);
        }
        return partition;
    }

    private boolean canIssue(Partition partition, BigDecimal amount) {
        if (partition.status() != PartitionStatus.ACTIVE) {
            return false;
        }
        BigDecimal newMinted = partition.mintedSupply().add(amount);
        return newMinted.compareTo(partition.totalSupply()) <= 0;
    }

    private boolean checkRestrictions(Partition partition, String from, String to, BigDecimal amount) {
        if (partition.restrictions() == null || partition.restrictions().isEmpty()) {
            return true;
        }

        for (TransferRestriction restriction : partition.restrictions()) {
            if (!restriction.isAllowed(from, to, amount)) {
                return false;
            }
        }
        return true;
    }

    private boolean isVested(VestingSchedule schedule, String holder, BigDecimal amount) {
        if (schedule == null) {
            return true;
        }
        // Check if tokens are vested based on schedule
        Instant now = Instant.now();
        if (now.isBefore(schedule.cliffDate())) {
            return false;
        }
        // Simplified: after cliff, all tokens are vested
        return true;
    }

    private String generatePartitionId(String tokenId, String name) {
        return "PART-" + tokenId.substring(0, Math.min(8, tokenId.length())) +
                "-" + name.toUpperCase().replaceAll("[^A-Z0-9]", "").substring(0, Math.min(4, name.length())) +
                "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String generateTransactionHash() {
        return "0x" + UUID.randomUUID().toString().replace("-", "");
    }

    private void logTransfer(String tokenId, PartitionTransfer transfer) {
        transferLog.computeIfAbsent(tokenId, k -> Collections.synchronizedList(new ArrayList<>()))
                .add(transfer);
    }

    // Record types for ERC-1400 partition management

    /**
     * Partition definition - represents a token tranche with specific rules
     */
    public record Partition(
            String partitionId,
            String tokenId,
            String name,
            String symbol,
            String description,
            PartitionType partitionType,
            AssetType assetType,
            BigDecimal totalSupply,
            BigDecimal mintedSupply,
            boolean transferable,
            List<TransferRestriction> restrictions,
            Map<String, Object> metadata,
            VestingSchedule vestingSchedule,
            DividendRights dividendRights,
            VotingRights votingRights,
            int priority, // For liquidation preference
            PartitionStatus status,
            Instant createdAt,
            Instant lockedUntil,
            String creator) {
        public Partition withMintedSupply(BigDecimal newMintedSupply) {
            return new Partition(
                    partitionId, tokenId, name, symbol, description, partitionType, assetType,
                    totalSupply, newMintedSupply, transferable, restrictions, metadata,
                    vestingSchedule, dividendRights, votingRights, priority, status,
                    createdAt, lockedUntil, creator);
        }
    }

    /**
     * Request to create a new partition
     */
    public record CreatePartitionRequest(
            String tokenId,
            String name,
            String symbol,
            String description,
            PartitionType partitionType,
            AssetType assetType,
            BigDecimal totalSupply,
            boolean transferable,
            List<TransferRestriction> restrictions,
            Map<String, Object> metadata,
            VestingSchedule vestingSchedule,
            DividendRights dividendRights,
            VotingRights votingRights,
            int priority,
            String creator) {
    }

    /**
     * Partition types following security token standards
     */
    public enum PartitionType {
        COMMON, // Common equity/shares
        PREFERRED, // Preferred shares with priority
        CONVERTIBLE, // Convertible to another partition
        RESTRICTED, // Subject to transfer restrictions
        VESTING, // Subject to vesting schedule
        LOCKED, // Temporarily locked
        REVENUE_SHARE, // Revenue sharing tranche
        DIVIDEND, // Dividend-bearing tranche
        VOTING, // Voting rights tranche
        NON_VOTING, // No voting rights
        CLASS_A, // Class A shares
        CLASS_B, // Class B shares
        VINTAGE // For carbon credits - vintage year
    }

    /**
     * Partition status
     */
    public enum PartitionStatus {
        DRAFT, // Not yet active
        ACTIVE, // Active and tradeable
        PAUSED, // Temporarily paused
        LOCKED, // Locked for corporate action
        RETIRED, // No longer active
        MERGED // Merged into another partition
    }

    /**
     * Transfer restriction types
     */
    public record TransferRestriction(
            RestrictionType type,
            String description,
            Map<String, Object> parameters,
            Instant validFrom,
            Instant validUntil) {
        public boolean isAllowed(String from, String to, BigDecimal amount) {
            // Check if restriction is currently active
            Instant now = Instant.now();
            if (validFrom != null && now.isBefore(validFrom)) {
                return true; // Not yet active
            }
            if (validUntil != null && now.isAfter(validUntil)) {
                return true; // Expired
            }

            // Apply restriction logic based on type
            return switch (type) {
                case LOCKUP -> false; // Transfers blocked during lockup
                case GEOGRAPHIC -> checkGeographic(to);
                case INVESTOR_TYPE -> checkInvestorType(to);
                case MAX_HOLDERS -> checkMaxHolders();
                case MIN_HOLDING_PERIOD -> checkHoldingPeriod(from);
                case MAX_TRANSFER_AMOUNT -> amount.compareTo((BigDecimal) parameters.get("maxAmount")) <= 0;
                case WHITELIST_ONLY -> checkWhitelist(to);
                case BLACKLIST -> !checkBlacklist(to);
                case NONE -> true;
            };
        }

        private boolean checkGeographic(String to) {
            // Would check against geographic restrictions
            return true;
        }

        private boolean checkInvestorType(String to) {
            // Would check if investor is accredited/qualified
            return true;
        }

        private boolean checkMaxHolders() {
            // Would check current holder count
            return true;
        }

        private boolean checkHoldingPeriod(String from) {
            // Would check holding duration
            return true;
        }

        private boolean checkWhitelist(String to) {
            @SuppressWarnings("unchecked")
            List<String> whitelist = (List<String>) parameters.getOrDefault("whitelist", Collections.emptyList());
            return whitelist.contains(to);
        }

        private boolean checkBlacklist(String to) {
            @SuppressWarnings("unchecked")
            List<String> blacklist = (List<String>) parameters.getOrDefault("blacklist", Collections.emptyList());
            return blacklist.contains(to);
        }
    }

    /**
     * Types of transfer restrictions
     */
    public enum RestrictionType {
        NONE,
        LOCKUP, // Time-based lockup
        GEOGRAPHIC, // Geographic restrictions
        INVESTOR_TYPE, // Accredited investor only
        MAX_HOLDERS, // Maximum number of holders
        MIN_HOLDING_PERIOD, // Minimum holding period
        MAX_TRANSFER_AMOUNT, // Maximum transfer amount
        WHITELIST_ONLY, // Only whitelisted addresses
        BLACKLIST // Blacklisted addresses blocked
    }

    /**
     * Vesting schedule for tokens
     */
    public record VestingSchedule(
            Instant startDate,
            Instant cliffDate,
            Instant endDate,
            BigDecimal totalAmount,
            BigDecimal cliffAmount,
            VestingType vestingType,
            int vestingPeriodDays,
            Map<String, BigDecimal> vestedAmounts // holder -> vested amount
    ) {
    }

    /**
     * Vesting types
     */
    public enum VestingType {
        LINEAR, // Linear vesting over time
        CLIFF, // All at cliff date
        GRADED, // Graded/stepped vesting
        MILESTONE // Milestone-based vesting
    }

    /**
     * Dividend rights for partition
     */
    public record DividendRights(
            boolean entitled,
            BigDecimal dividendRate, // Annual rate
            DividendType dividendType,
            int priority, // Priority for preferred dividends
            boolean cumulative, // Cumulative unpaid dividends
            BigDecimal preferredAmount // Fixed preferred dividend amount
    ) {
    }

    /**
     * Dividend types
     */
    public enum DividendType {
        FIXED, // Fixed dividend amount
        VARIABLE, // Variable based on profits
        CUMULATIVE, // Cumulative preferred
        NON_CUMULATIVE, // Non-cumulative preferred
        PARTICIPATING // Participating in additional dividends
    }

    /**
     * Voting rights for partition
     */
    public record VotingRights(
            boolean hasVotingRights,
            int votesPerToken, // Votes per token (e.g., 1, 10 for super-voting)
            List<String> votingMatters // What matters can vote on
    ) {
    }

    /**
     * Transfer types for audit log
     */
    public enum TransferType {
        ISSUANCE,
        TRANSFER,
        OPERATOR_TRANSFER,
        REDEMPTION,
        FORCE_TRANSFER
    }

    /**
     * Partition transfer record for audit
     */
    public record PartitionTransfer(
            String txHash,
            String partitionId,
            String from,
            String to,
            BigDecimal amount,
            byte[] data,
            Instant timestamp,
            TransferType type) {
    }

    /**
     * Issuance result
     */
    public record IssuanceResult(
            boolean success,
            String txHash,
            String partitionId,
            String recipient,
            BigDecimal amount,
            BigDecimal newMintedSupply,
            String message) {
    }

    /**
     * Transfer result
     */
    public record TransferResult(
            boolean success,
            String txHash,
            String partitionId,
            String from,
            String to,
            BigDecimal amount,
            String message) {
    }

    /**
     * Redemption result
     */
    public record RedemptionResult(
            boolean success,
            String txHash,
            String partitionId,
            String holder,
            BigDecimal amount,
            BigDecimal remainingSupply,
            String message) {
    }

    /**
     * Partition exception
     */
    public static class PartitionException extends RuntimeException {
        public PartitionException(String message) {
            super(message);
        }
    }
}

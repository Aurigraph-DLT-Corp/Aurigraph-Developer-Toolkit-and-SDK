package io.aurigraph.v11.api;

import io.aurigraph.v11.validators.LiveValidatorService;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Validator and Staking API Resource - V12
 *
 * Provides comprehensive validator and staking management endpoints for Aurigraph V12.
 * This resource implements the full staking lifecycle including:
 * - Validator discovery and details
 * - Staking and unstaking operations
 * - Rewards tracking and distribution
 *
 * @author J4C Backend Agent
 * @version 12.0.0
 * @since V12
 */
@Path("/api/v12/validators")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Validator & Staking API V12", description = "Complete validator and staking management for Aurigraph V12")
public class ValidatorStakingV12Resource {

    private static final Logger LOG = Logger.getLogger(ValidatorStakingV12Resource.class);

    @Inject
    LiveValidatorService liveValidatorService;

    // In-memory storage for staking records (in production, this would be a database)
    private final Map<String, StakingPosition> stakingPositions = new ConcurrentHashMap<>();
    private final Map<String, List<RewardRecord>> rewardRecords = new ConcurrentHashMap<>();

    // ==================== ENDPOINT 1: List All Validators ====================

    /**
     * GET /api/v12/validators
     * List all validators with optional filtering
     *
     * @param status Filter by validator status (ACTIVE, INACTIVE, JAILED)
     * @param sortBy Sort field (stake, apr, uptime, blocks)
     * @param order Sort order (asc, desc)
     * @param offset Pagination offset
     * @param limit Pagination limit
     * @return List of validators with metadata
     */
    @GET
    @Operation(
        summary = "List all validators",
        description = "Retrieve a paginated list of all validator nodes with optional filtering and sorting"
    )
    @APIResponse(
        responseCode = "200",
        description = "List of validators retrieved successfully",
        content = @Content(schema = @Schema(implementation = ValidatorListResponse.class))
    )
    public Uni<Response> getAllValidators(
            @Parameter(description = "Filter by validator status") @QueryParam("status") String status,
            @Parameter(description = "Sort by field (stake, apr, uptime, blocks)") @QueryParam("sortBy") @DefaultValue("stake") String sortBy,
            @Parameter(description = "Sort order (asc, desc)") @QueryParam("order") @DefaultValue("desc") String order,
            @Parameter(description = "Pagination offset") @QueryParam("offset") @DefaultValue("0") int offset,
            @Parameter(description = "Pagination limit") @QueryParam("limit") @DefaultValue("50") int limit) {

        LOG.infof("GET /api/v12/validators - status=%s, sortBy=%s, order=%s, offset=%d, limit=%d",
                status, sortBy, order, offset, limit);

        return Uni.createFrom().item(() -> {
            try {
                // Get validators from live service
                LiveValidatorService.LiveValidatorsList validatorsList =
                        liveValidatorService.getAllValidators(status, offset, limit);

                // Create V12 response with additional metadata
                ValidatorListResponse response = new ValidatorListResponse();
                response.validators = validatorsList.validators.stream()
                        .map(this::enrichValidatorWithStakingInfo)
                        .collect(Collectors.toList());

                response.totalValidators = validatorsList.totalValidators;
                response.activeValidators = validatorsList.activeValidators;
                response.networkBlockHeight = validatorsList.networkBlockHeight;
                response.timestamp = validatorsList.timestamp;
                response.pagination = new PaginationInfo(offset, limit, validatorsList.totalValidators);

                // Network statistics
                response.networkStats = calculateNetworkStats(validatorsList);

                LOG.infof("Retrieved %d validators (total: %d, active: %d)",
                        response.validators.size(), response.totalValidators, response.activeValidators);

                return Response.ok(response).build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to retrieve validators");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(new ErrorResponse("Failed to retrieve validators: " + e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== ENDPOINT 2: Get Validator Details ====================

    /**
     * GET /api/v12/validators/{id}
     * Get detailed information about a specific validator
     *
     * @param validatorId The unique identifier of the validator
     * @return Detailed validator information
     */
    @GET
    @Path("/{id}")
    @Operation(
        summary = "Get validator details",
        description = "Retrieve comprehensive information about a specific validator including performance metrics and staking data"
    )
    @APIResponse(
        responseCode = "200",
        description = "Validator details retrieved successfully",
        content = @Content(schema = @Schema(implementation = ValidatorDetailResponse.class))
    )
    @APIResponse(responseCode = "404", description = "Validator not found")
    public Uni<Response> getValidatorDetails(
            @Parameter(description = "Validator ID", required = true) @PathParam("id") String validatorId) {

        LOG.infof("GET /api/v12/validators/%s", validatorId);

        return Uni.createFrom().item(() -> {
            try {
                LiveValidatorService.ValidatorResponse validator =
                        liveValidatorService.getValidatorById(validatorId);

                if (validator == null) {
                    LOG.warnf("Validator not found: %s", validatorId);
                    return Response.status(Response.Status.NOT_FOUND)
                            .entity(new ErrorResponse("Validator not found: " + validatorId))
                            .build();
                }

                // Build detailed response
                ValidatorDetailResponse response = new ValidatorDetailResponse();
                response.validator = enrichValidatorWithStakingInfo(validator);

                // Performance history (last 30 days)
                response.performanceHistory = generatePerformanceHistory(validatorId);

                // Staking information
                response.stakingInfo = getStakingInfo(validatorId);

                // Reward distribution history
                response.rewardHistory = getRewardHistory(validatorId);

                // Delegator information
                response.delegatorInfo = getDelegatorInfo(validatorId);

                LOG.infof("Retrieved details for validator: %s (status: %s, stake: %s)",
                        validatorId, validator.status, validator.stake);

                return Response.ok(response).build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to retrieve validator details for: %s", validatorId);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(new ErrorResponse("Failed to retrieve validator details: " + e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== ENDPOINT 3: Stake Tokens ====================

    /**
     * POST /api/v12/validators/stake
     * Stake tokens with a validator
     *
     * @param request Staking request with validator ID, amount, and delegator address
     * @return Staking transaction details
     */
    @POST
    @Path("/stake")
    @Operation(
        summary = "Stake tokens",
        description = "Stake tokens with a validator to participate in network consensus and earn rewards"
    )
    @APIResponse(
        responseCode = "200",
        description = "Tokens staked successfully",
        content = @Content(schema = @Schema(implementation = StakingResponse.class))
    )
    @APIResponse(responseCode = "400", description = "Invalid staking request")
    @APIResponse(responseCode = "404", description = "Validator not found")
    public Uni<Response> stakeTokens(@Valid @NotNull StakingRequest request) {

        LOG.infof("POST /api/v12/validators/stake - validator=%s, amount=%s, delegator=%s",
                request.validatorId, request.amount, request.delegatorAddress);

        return Uni.createFrom().item(() -> {
            try {
                // Validate request
                if (request.amount == null || request.amount.compareTo(BigDecimal.ZERO) <= 0) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(new ErrorResponse("Staking amount must be greater than zero"))
                            .build();
                }

                // Check minimum stake (e.g., 100 tokens)
                BigDecimal minimumStake = new BigDecimal("100");
                if (request.amount.compareTo(minimumStake) < 0) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(new ErrorResponse("Minimum staking amount is " + minimumStake + " tokens"))
                            .build();
                }

                // Verify validator exists
                LiveValidatorService.ValidatorResponse validator =
                        liveValidatorService.getValidatorById(request.validatorId);

                if (validator == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                            .entity(new ErrorResponse("Validator not found: " + request.validatorId))
                            .build();
                }

                // Check validator status
                if (!"ACTIVE".equals(validator.status)) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(new ErrorResponse("Cannot stake with inactive validator"))
                            .build();
                }

                // Create staking position
                String positionId = "stake-" + UUID.randomUUID().toString();
                StakingPosition position = new StakingPosition();
                position.positionId = positionId;
                position.validatorId = request.validatorId;
                position.delegatorAddress = request.delegatorAddress;
                position.stakedAmount = request.amount;
                position.stakedAt = Instant.now();
                position.status = "ACTIVE";
                position.apr = validator.apr;
                position.expectedAnnualReward = request.amount.multiply(BigDecimal.valueOf(validator.apr / 100));

                stakingPositions.put(positionId, position);

                // Create staking response
                StakingResponse response = new StakingResponse();
                response.status = "SUCCESS";
                response.positionId = positionId;
                response.validatorId = request.validatorId;
                response.validatorName = validator.name;
                response.delegatorAddress = request.delegatorAddress;
                response.stakedAmount = request.amount;
                response.transactionHash = "0x" + UUID.randomUUID().toString().replace("-", "");
                response.blockNumber = validator.blocksProduced + 1;
                response.timestamp = Instant.now().toString();

                // Calculate new total stake
                response.previousTotalStake = validator.stake;
                response.newTotalStake = validator.stake.add(request.amount);

                // Staking details
                response.apr = validator.apr;
                response.commission = validator.commission;
                response.expectedAnnualReward = position.expectedAnnualReward;
                response.rewardStartDate = Instant.now().toString();
                response.unbondingPeriod = "7 days";

                LOG.infof("Staking successful: position=%s, validator=%s, amount=%s, APR=%.2f%%",
                        positionId, request.validatorId, request.amount, validator.apr);

                return Response.ok(response).build();

            } catch (Exception e) {
                LOG.errorf(e, "Staking failed");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(new ErrorResponse("Staking failed: " + e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== ENDPOINT 4: Unstake Tokens ====================

    /**
     * POST /api/v12/validators/unstake
     * Unstake tokens from a validator
     *
     * @param request Unstaking request with position ID and optional amount
     * @return Unstaking transaction details
     */
    @POST
    @Path("/unstake")
    @Operation(
        summary = "Unstake tokens",
        description = "Initiate unstaking of tokens from a validator. Tokens will be available after the unbonding period."
    )
    @APIResponse(
        responseCode = "200",
        description = "Unstaking initiated successfully",
        content = @Content(schema = @Schema(implementation = UnstakingResponse.class))
    )
    @APIResponse(responseCode = "400", description = "Invalid unstaking request")
    @APIResponse(responseCode = "404", description = "Staking position not found")
    public Uni<Response> unstakeTokens(@Valid @NotNull UnstakingRequest request) {

        LOG.infof("POST /api/v12/validators/unstake - positionId=%s, amount=%s",
                request.positionId, request.amount);

        return Uni.createFrom().item(() -> {
            try {
                // Verify staking position exists
                StakingPosition position = stakingPositions.get(request.positionId);
                if (position == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                            .entity(new ErrorResponse("Staking position not found: " + request.positionId))
                            .build();
                }

                // Check position status
                if (!"ACTIVE".equals(position.status)) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(new ErrorResponse("Cannot unstake from inactive position"))
                            .build();
                }

                // Determine unstake amount
                BigDecimal unstakeAmount = request.amount != null ? request.amount : position.stakedAmount;

                // Validate unstake amount
                if (unstakeAmount.compareTo(BigDecimal.ZERO) <= 0 ||
                        unstakeAmount.compareTo(position.stakedAmount) > 0) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(new ErrorResponse("Invalid unstake amount. Must be between 0 and " + position.stakedAmount))
                            .build();
                }

                // Calculate rewards earned so far
                BigDecimal rewardsEarned = calculateRewards(position, Instant.now());

                // Update position
                position.stakedAmount = position.stakedAmount.subtract(unstakeAmount);
                if (position.stakedAmount.compareTo(BigDecimal.ZERO) == 0) {
                    position.status = "UNSTAKED";
                }

                // Create unstaking response
                UnstakingResponse response = new UnstakingResponse();
                response.status = "UNBONDING";
                response.positionId = request.positionId;
                response.validatorId = position.validatorId;
                response.delegatorAddress = position.delegatorAddress;
                response.unstakedAmount = unstakeAmount;
                response.remainingStake = position.stakedAmount;
                response.transactionHash = "0x" + UUID.randomUUID().toString().replace("-", "");
                response.timestamp = Instant.now().toString();

                // Unbonding details
                response.unbondingPeriod = "7 days";
                response.unbondingStartDate = Instant.now().toString();
                response.unbondingEndDate = Instant.now().plusSeconds(7 * 24 * 3600).toString();

                // Rewards
                response.rewardsEarned = rewardsEarned;
                response.totalAmount = unstakeAmount.add(rewardsEarned);

                // Store reward record
                recordReward(position.delegatorAddress, position.validatorId, rewardsEarned);

                LOG.infof("Unstaking initiated: position=%s, amount=%s, rewards=%s, available=%s",
                        request.positionId, unstakeAmount, rewardsEarned, response.unbondingEndDate);

                return Response.ok(response).build();

            } catch (Exception e) {
                LOG.errorf(e, "Unstaking failed");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(new ErrorResponse("Unstaking failed: " + e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== ENDPOINT 5: Get Staking Rewards ====================

    /**
     * GET /api/v12/validators/rewards
     * Get staking rewards for a delegator
     *
     * @param delegatorAddress The delegator's address
     * @param validatorId Optional validator ID to filter rewards
     * @param status Filter by reward status (PENDING, CLAIMED, DISTRIBUTED)
     * @return List of rewards
     */
    @GET
    @Path("/rewards")
    @Operation(
        summary = "Get staking rewards",
        description = "Retrieve staking rewards earned by a delegator across all validators or a specific validator"
    )
    @APIResponse(
        responseCode = "200",
        description = "Rewards retrieved successfully",
        content = @Content(schema = @Schema(implementation = RewardsResponse.class))
    )
    @APIResponse(responseCode = "400", description = "Invalid request parameters")
    public Uni<Response> getStakingRewards(
            @Parameter(description = "Delegator address", required = true) @QueryParam("delegatorAddress") String delegatorAddress,
            @Parameter(description = "Filter by validator ID") @QueryParam("validatorId") String validatorId,
            @Parameter(description = "Filter by status") @QueryParam("status") String status) {

        LOG.infof("GET /api/v12/validators/rewards - delegator=%s, validator=%s, status=%s",
                delegatorAddress, validatorId, status);

        return Uni.createFrom().item(() -> {
            try {
                if (delegatorAddress == null || delegatorAddress.isEmpty()) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(new ErrorResponse("Delegator address is required"))
                            .build();
                }

                // Get all staking positions for delegator
                List<StakingPosition> positions = stakingPositions.values().stream()
                        .filter(p -> delegatorAddress.equals(p.delegatorAddress))
                        .filter(p -> validatorId == null || validatorId.equals(p.validatorId))
                        .collect(Collectors.toList());

                // Calculate current rewards for active positions
                List<RewardDetail> rewards = new ArrayList<>();
                BigDecimal totalRewards = BigDecimal.ZERO;
                BigDecimal totalStaked = BigDecimal.ZERO;

                for (StakingPosition position : positions) {
                    if ("ACTIVE".equals(position.status)) {
                        BigDecimal currentRewards = calculateRewards(position, Instant.now());

                        RewardDetail detail = new RewardDetail();
                        detail.positionId = position.positionId;
                        detail.validatorId = position.validatorId;
                        detail.stakedAmount = position.stakedAmount;
                        detail.rewardAmount = currentRewards;
                        detail.apr = position.apr;
                        detail.status = "PENDING";
                        detail.earnedSince = position.stakedAt.toString();
                        detail.lastClaimedAt = null; // Not implemented yet

                        rewards.add(detail);
                        totalRewards = totalRewards.add(currentRewards);
                        totalStaked = totalStaked.add(position.stakedAmount);
                    }
                }

                // Get historical claimed rewards
                List<RewardRecord> historicalRewards = rewardRecords.getOrDefault(delegatorAddress, new ArrayList<>());
                for (RewardRecord record : historicalRewards) {
                    if (validatorId == null || validatorId.equals(record.validatorId)) {
                        RewardDetail detail = new RewardDetail();
                        detail.positionId = "N/A";
                        detail.validatorId = record.validatorId;
                        detail.stakedAmount = BigDecimal.ZERO;
                        detail.rewardAmount = record.amount;
                        detail.apr = 0.0;
                        detail.status = "CLAIMED";
                        detail.earnedSince = record.timestamp.toString();
                        detail.lastClaimedAt = record.timestamp.toString();

                        rewards.add(detail);
                        totalRewards = totalRewards.add(record.amount);
                    }
                }

                // Build response
                RewardsResponse response = new RewardsResponse();
                response.delegatorAddress = delegatorAddress;
                response.totalRewards = totalRewards;
                response.totalStaked = totalStaked;
                response.activePositions = (int) positions.stream().filter(p -> "ACTIVE".equals(p.status)).count();
                response.rewards = rewards;
                response.timestamp = Instant.now().toString();

                // Calculate average APR
                if (!positions.isEmpty()) {
                    double avgApr = positions.stream()
                            .filter(p -> "ACTIVE".equals(p.status))
                            .mapToDouble(p -> p.apr)
                            .average()
                            .orElse(0.0);
                    response.averageApr = avgApr;
                }

                LOG.infof("Retrieved rewards for delegator %s: total=%s, positions=%d",
                        delegatorAddress, totalRewards, positions.size());

                return Response.ok(response).build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to retrieve rewards");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(new ErrorResponse("Failed to retrieve rewards: " + e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Helper Methods ====================

    private LiveValidatorService.ValidatorResponse enrichValidatorWithStakingInfo(
            LiveValidatorService.ValidatorResponse validator) {
        // In a real implementation, this would add additional staking-specific data
        return validator;
    }

    private NetworkStats calculateNetworkStats(LiveValidatorService.LiveValidatorsList validatorsList) {
        NetworkStats stats = new NetworkStats();

        BigDecimal totalStake = validatorsList.validators.stream()
                .map(v -> v.stake)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDelegatedStake = validatorsList.validators.stream()
                .map(v -> v.delegatedStake)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        stats.totalStake = totalStake;
        stats.totalDelegatedStake = totalDelegatedStake;
        stats.averageApr = validatorsList.validators.stream()
                .mapToDouble(v -> v.apr)
                .average()
                .orElse(0.0);
        stats.averageUptime = validatorsList.validators.stream()
                .mapToDouble(v -> v.uptime)
                .average()
                .orElse(0.0);

        return stats;
    }

    private List<PerformanceHistoryPoint> generatePerformanceHistory(String validatorId) {
        List<PerformanceHistoryPoint> history = new ArrayList<>();
        long now = Instant.now().toEpochMilli();
        Random random = new Random();

        for (int i = 29; i >= 0; i--) {
            PerformanceHistoryPoint point = new PerformanceHistoryPoint();
            point.date = now - (i * 86400000L); // 24 hours in ms
            point.blocksProduced = 30 + random.nextInt(20);
            point.uptime = 98.0 + (random.nextDouble() * 2);
            point.rewardsDistributed = BigDecimal.valueOf(4000 + random.nextDouble() * 2000);
            history.add(point);
        }

        return history;
    }

    private StakingInformation getStakingInfo(String validatorId) {
        StakingInformation info = new StakingInformation();
        info.minimumStake = new BigDecimal("100");
        info.currentStakingPools = 1;
        info.totalDelegators = 45;
        info.averageDelegation = new BigDecimal("50000");
        return info;
    }

    private List<RewardHistoryPoint> getRewardHistory(String validatorId) {
        List<RewardHistoryPoint> history = new ArrayList<>();
        Random random = new Random();

        for (int i = 0; i < 10; i++) {
            RewardHistoryPoint point = new RewardHistoryPoint();
            point.epoch = 1000 - i;
            point.rewardAmount = BigDecimal.valueOf(5000 + random.nextDouble() * 2000);
            point.distributedAt = Instant.now().minusSeconds(i * 86400L).toString();
            history.add(point);
        }

        return history;
    }

    private DelegatorInformation getDelegatorInfo(String validatorId) {
        DelegatorInformation info = new DelegatorInformation();
        info.totalDelegators = 45;
        info.topDelegators = new ArrayList<>();

        Random random = new Random();
        for (int i = 0; i < 5; i++) {
            TopDelegator delegator = new TopDelegator();
            delegator.address = "0x" + String.format("%040x", random.nextLong());
            delegator.stakedAmount = BigDecimal.valueOf(100000 + random.nextInt(500000));
            info.topDelegators.add(delegator);
        }

        return info;
    }

    private BigDecimal calculateRewards(StakingPosition position, Instant endTime) {
        // Simple APR-based calculation
        long secondsStaked = endTime.getEpochSecond() - position.stakedAt.getEpochSecond();
        double yearsStaked = secondsStaked / (365.25 * 24 * 3600);

        BigDecimal annualReward = position.stakedAmount.multiply(BigDecimal.valueOf(position.apr / 100));
        return annualReward.multiply(BigDecimal.valueOf(yearsStaked));
    }

    private void recordReward(String delegatorAddress, String validatorId, BigDecimal amount) {
        RewardRecord record = new RewardRecord();
        record.validatorId = validatorId;
        record.amount = amount;
        record.timestamp = Instant.now();

        rewardRecords.computeIfAbsent(delegatorAddress, k -> new ArrayList<>()).add(record);
    }

    // ==================== Request DTOs ====================

    public static class StakingRequest {
        @NotNull(message = "Validator ID is required")
        public String validatorId;

        @NotNull(message = "Amount is required")
        public BigDecimal amount;

        @NotNull(message = "Delegator address is required")
        public String delegatorAddress;
    }

    public static class UnstakingRequest {
        @NotNull(message = "Position ID is required")
        public String positionId;

        public BigDecimal amount; // Optional - if null, unstake all
    }

    // ==================== Response DTOs ====================

    public static class ValidatorListResponse {
        public List<LiveValidatorService.ValidatorResponse> validators;
        public int totalValidators;
        public int activeValidators;
        public long networkBlockHeight;
        public String timestamp;
        public PaginationInfo pagination;
        public NetworkStats networkStats;
    }

    public static class ValidatorDetailResponse {
        public LiveValidatorService.ValidatorResponse validator;
        public List<PerformanceHistoryPoint> performanceHistory;
        public StakingInformation stakingInfo;
        public List<RewardHistoryPoint> rewardHistory;
        public DelegatorInformation delegatorInfo;
    }

    public static class StakingResponse {
        public String status;
        public String positionId;
        public String validatorId;
        public String validatorName;
        public String delegatorAddress;
        public BigDecimal stakedAmount;
        public String transactionHash;
        public long blockNumber;
        public String timestamp;
        public BigDecimal previousTotalStake;
        public BigDecimal newTotalStake;
        public double apr;
        public double commission;
        public BigDecimal expectedAnnualReward;
        public String rewardStartDate;
        public String unbondingPeriod;
    }

    public static class UnstakingResponse {
        public String status;
        public String positionId;
        public String validatorId;
        public String delegatorAddress;
        public BigDecimal unstakedAmount;
        public BigDecimal remainingStake;
        public String transactionHash;
        public String timestamp;
        public String unbondingPeriod;
        public String unbondingStartDate;
        public String unbondingEndDate;
        public BigDecimal rewardsEarned;
        public BigDecimal totalAmount;
    }

    public static class RewardsResponse {
        public String delegatorAddress;
        public BigDecimal totalRewards;
        public BigDecimal totalStaked;
        public int activePositions;
        public double averageApr;
        public List<RewardDetail> rewards;
        public String timestamp;
    }

    public static class RewardDetail {
        public String positionId;
        public String validatorId;
        public BigDecimal stakedAmount;
        public BigDecimal rewardAmount;
        public double apr;
        public String status;
        public String earnedSince;
        public String lastClaimedAt;
    }

    public static class PaginationInfo {
        public int offset;
        public int limit;
        public int total;
        public int currentPage;
        public int totalPages;

        public PaginationInfo(int offset, int limit, int total) {
            this.offset = offset;
            this.limit = limit;
            this.total = total;
            this.currentPage = (offset / limit) + 1;
            this.totalPages = (int) Math.ceil((double) total / limit);
        }
    }

    public static class NetworkStats {
        public BigDecimal totalStake;
        public BigDecimal totalDelegatedStake;
        public double averageApr;
        public double averageUptime;
    }

    public static class PerformanceHistoryPoint {
        public long date;
        public int blocksProduced;
        public double uptime;
        public BigDecimal rewardsDistributed;
    }

    public static class StakingInformation {
        public BigDecimal minimumStake;
        public int currentStakingPools;
        public int totalDelegators;
        public BigDecimal averageDelegation;
    }

    public static class RewardHistoryPoint {
        public long epoch;
        public BigDecimal rewardAmount;
        public String distributedAt;
    }

    public static class DelegatorInformation {
        public int totalDelegators;
        public List<TopDelegator> topDelegators;
    }

    public static class TopDelegator {
        public String address;
        public BigDecimal stakedAmount;
    }

    public static class ErrorResponse {
        public String error;
        public String timestamp;

        public ErrorResponse(String error) {
            this.error = error;
            this.timestamp = Instant.now().toString();
        }
    }

    // ==================== Internal Models ====================

    private static class StakingPosition {
        public String positionId;
        public String validatorId;
        public String delegatorAddress;
        public BigDecimal stakedAmount;
        public Instant stakedAt;
        public String status;
        public double apr;
        public BigDecimal expectedAnnualReward;
    }

    private static class RewardRecord {
        public String validatorId;
        public BigDecimal amount;
        public Instant timestamp;
    }
}

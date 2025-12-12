package io.aurigraph.v11.referral;

import jakarta.annotation.security.PermitAll;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Referral Program API Resource
 *
 * Provides endpoints for the user referral program:
 * - User profile management
 * - Referral code generation
 * - Referral tracking and statistics
 * - Reward management
 * - Leaderboard
 *
 * @author Aurigraph Development Team
 * @version 12.0.0
 */
@Path("/api/v12/referral")
@ApplicationScoped
@PermitAll
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ReferralResource {

    private static final Logger LOG = Logger.getLogger(ReferralResource.class);

    // Mock data storage (in production, use database)
    private static final Map<String, UserProfile> users = new HashMap<>();
    private static final Map<String, List<Referral>> referrals = new HashMap<>();
    private static final List<RewardTier> rewardTiers = new ArrayList<>();

    static {
        // Initialize reward tiers
        rewardTiers.add(new RewardTier("bronze", 0, 100, 0));
        rewardTiers.add(new RewardTier("silver", 5, 150, 250));
        rewardTiers.add(new RewardTier("gold", 10, 200, 500));
        rewardTiers.add(new RewardTier("platinum", 25, 250, 1000));
        rewardTiers.add(new RewardTier("diamond", 50, 300, 2500));

        // Initialize mock user
        UserProfile mockUser = new UserProfile();
        mockUser.id = "user-001";
        mockUser.username = "john.blockchain";
        mockUser.email = "john@aurigraph.io";
        mockUser.fullName = "John Anderson";
        mockUser.walletAddress = "0x742d35Cc6634C0532925a3b8...";
        mockUser.role = "User";
        mockUser.status = "active";
        mockUser.joinedAt = "2025-01-15";
        mockUser.referralCode = "AUR-JOH-2025";
        mockUser.tier = "gold";
        mockUser.totalReferrals = 12;
        mockUser.totalRewards = 2400;
        mockUser.pendingRewards = 300;
        users.put(mockUser.id, mockUser);

        // Initialize mock referrals
        List<Referral> mockReferrals = new ArrayList<>();
        mockReferrals.add(new Referral("1", "alice.smith", "alice@example.com", "completed", "2025-11-01", 200, "paid"));
        mockReferrals.add(new Referral("2", "bob.jones", "bob@example.com", "active", "2025-11-15", 200, "processing"));
        mockReferrals.add(new Referral("3", "carol.white", "carol@example.com", "pending", "2025-12-01", 200, "pending"));
        mockReferrals.add(new Referral("4", "david.brown", "david@example.com", "completed", "2025-10-20", 200, "paid"));
        mockReferrals.add(new Referral("5", "eva.green", "eva@example.com", "completed", "2025-10-25", 200, "paid"));
        referrals.put(mockUser.id, mockReferrals);
    }

    /**
     * Get user profile with referral information
     */
    @GET
    @Path("/profile/{userId}")
    public Response getUserProfile(@PathParam("userId") String userId) {
        LOG.infof("Getting profile for user: %s", userId);

        UserProfile user = users.get(userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "User not found"))
                .build();
        }

        return Response.ok(user).build();
    }

    /**
     * Get current user's profile (demo mode)
     */
    @GET
    @Path("/profile")
    public Response getCurrentUserProfile() {
        // In demo mode, return the mock user
        UserProfile user = users.get("user-001");
        return Response.ok(user).build();
    }

    /**
     * Update user profile
     */
    @PUT
    @Path("/profile/{userId}")
    public Response updateProfile(@PathParam("userId") String userId, UserProfile updates) {
        LOG.infof("Updating profile for user: %s", userId);

        UserProfile user = users.get(userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "User not found"))
                .build();
        }

        // Update allowed fields
        if (updates.fullName != null) user.fullName = updates.fullName;
        if (updates.email != null) user.email = updates.email;
        if (updates.walletAddress != null) user.walletAddress = updates.walletAddress;

        return Response.ok(Map.of(
            "success", true,
            "message", "Profile updated successfully",
            "profile", user
        )).build();
    }

    /**
     * Get user's referral code
     */
    @GET
    @Path("/code/{userId}")
    public Response getReferralCode(@PathParam("userId") String userId) {
        UserProfile user = users.get(userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "User not found"))
                .build();
        }

        return Response.ok(Map.of(
            "referralCode", user.referralCode,
            "referralLink", "https://dlt.aurigraph.io/signup?ref=" + user.referralCode,
            "tier", user.tier,
            "rewardPerReferral", getRewardForTier(user.tier)
        )).build();
    }

    /**
     * Generate new referral code
     */
    @POST
    @Path("/code/generate/{userId}")
    public Response generateReferralCode(@PathParam("userId") String userId) {
        UserProfile user = users.get(userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "User not found"))
                .build();
        }

        // Generate new code
        String newCode = "AUR-" + user.username.substring(0, 3).toUpperCase() + "-" +
                        String.format("%04d", new Random().nextInt(10000));
        user.referralCode = newCode;

        return Response.ok(Map.of(
            "success", true,
            "referralCode", newCode,
            "referralLink", "https://dlt.aurigraph.io/signup?ref=" + newCode
        )).build();
    }

    /**
     * Get user's referrals list
     */
    @GET
    @Path("/list/{userId}")
    public Response getReferrals(@PathParam("userId") String userId) {
        LOG.infof("Getting referrals for user: %s", userId);

        List<Referral> userReferrals = referrals.getOrDefault(userId, new ArrayList<>());

        return Response.ok(Map.of(
            "userId", userId,
            "count", userReferrals.size(),
            "referrals", userReferrals
        )).build();
    }

    /**
     * Get referral statistics for a user
     */
    @GET
    @Path("/stats/{userId}")
    public Response getReferralStats(@PathParam("userId") String userId) {
        UserProfile user = users.get(userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "User not found"))
                .build();
        }

        List<Referral> userReferrals = referrals.getOrDefault(userId, new ArrayList<>());

        long completedCount = userReferrals.stream().filter(r -> "completed".equals(r.status)).count();
        long pendingCount = userReferrals.stream().filter(r -> "pending".equals(r.status)).count();
        long activeCount = userReferrals.stream().filter(r -> "active".equals(r.status)).count();

        // Calculate next tier progress
        RewardTier currentTier = getTierByName(user.tier);
        RewardTier nextTier = getNextTier(user.tier);

        return Response.ok(Map.of(
            "totalReferrals", user.totalReferrals,
            "completedReferrals", completedCount,
            "pendingReferrals", pendingCount,
            "activeReferrals", activeCount,
            "totalRewards", user.totalRewards,
            "pendingRewards", user.pendingRewards,
            "currentTier", user.tier,
            "rewardPerReferral", currentTier.rewardPerReferral,
            "nextTier", nextTier != null ? Map.of(
                "name", nextTier.name,
                "requiredReferrals", nextTier.minReferrals,
                "remainingReferrals", nextTier.minReferrals - user.totalReferrals
            ) : null
        )).build();
    }

    /**
     * Submit a new referral (when someone signs up with a referral code)
     */
    @POST
    @Path("/submit")
    public Response submitReferral(ReferralSubmission submission) {
        LOG.infof("Processing referral submission for code: %s", submission.referralCode);

        // Find user with this referral code
        UserProfile referrer = users.values().stream()
            .filter(u -> u.referralCode.equals(submission.referralCode))
            .findFirst()
            .orElse(null);

        if (referrer == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Invalid referral code"))
                .build();
        }

        // Create new referral
        Referral newReferral = new Referral(
            UUID.randomUUID().toString(),
            submission.username,
            submission.email,
            "pending",
            LocalDateTime.now().format(DateTimeFormatter.ISO_DATE),
            getRewardForTier(referrer.tier),
            "pending"
        );

        // Add to referrer's list
        referrals.computeIfAbsent(referrer.id, k -> new ArrayList<>()).add(newReferral);
        referrer.totalReferrals++;
        referrer.pendingRewards += newReferral.rewardAmount;

        // Update tier if necessary
        updateUserTier(referrer);

        return Response.status(Response.Status.CREATED).entity(Map.of(
            "success", true,
            "message", "Referral submitted successfully",
            "referralId", newReferral.id,
            "referrer", referrer.username,
            "bonusForNewUser", 100 // Signup bonus for referred user
        )).build();
    }

    /**
     * Send email invitation
     */
    @POST
    @Path("/invite")
    public Response sendInvite(InviteRequest request) {
        LOG.infof("Sending invite to: %s from user: %s", request.email, request.userId);

        // In production, this would send an actual email
        // For now, just return success

        return Response.ok(Map.of(
            "success", true,
            "message", "Invitation sent to " + request.email,
            "referralLink", "https://dlt.aurigraph.io/signup?ref=" + request.referralCode
        )).build();
    }

    /**
     * Get leaderboard
     */
    @GET
    @Path("/leaderboard")
    public Response getLeaderboard(@QueryParam("limit") @DefaultValue("10") int limit) {
        List<Map<String, Object>> leaderboard = new ArrayList<>();

        // Mock leaderboard data
        leaderboard.add(createLeaderEntry(1, "crypto_king", 156, 31200, "diamond"));
        leaderboard.add(createLeaderEntry(2, "blockchain_wizard", 98, 19600, "diamond"));
        leaderboard.add(createLeaderEntry(3, "token_master", 67, 13400, "diamond"));
        leaderboard.add(createLeaderEntry(4, "defi_explorer", 45, 9000, "platinum"));
        leaderboard.add(createLeaderEntry(5, "web3_pioneer", 38, 7600, "platinum"));
        leaderboard.add(createLeaderEntry(6, "john.blockchain", 12, 2400, "gold"));
        leaderboard.add(createLeaderEntry(7, "smart_investor", 10, 2000, "gold"));
        leaderboard.add(createLeaderEntry(8, "chain_builder", 8, 1600, "silver"));
        leaderboard.add(createLeaderEntry(9, "node_runner", 6, 1200, "silver"));
        leaderboard.add(createLeaderEntry(10, "crypto_newbie", 3, 300, "bronze"));

        return Response.ok(Map.of(
            "leaderboard", leaderboard.subList(0, Math.min(limit, leaderboard.size())),
            "totalParticipants", 1234,
            "lastUpdated", Instant.now().toString()
        )).build();
    }

    /**
     * Get reward tiers information
     */
    @GET
    @Path("/tiers")
    public Response getRewardTiers() {
        return Response.ok(Map.of(
            "tiers", rewardTiers,
            "currentPromotion", Map.of(
                "name", "Holiday Bonus",
                "description", "Double rewards for all referrals until Jan 31, 2026",
                "multiplier", 2.0,
                "endDate", "2026-01-31"
            )
        )).build();
    }

    /**
     * Request reward withdrawal
     */
    @POST
    @Path("/withdraw")
    public Response requestWithdrawal(WithdrawalRequest request) {
        LOG.infof("Processing withdrawal request for user: %s, amount: %d", request.userId, request.amount);

        UserProfile user = users.get(request.userId);
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "User not found"))
                .build();
        }

        int availableBalance = user.totalRewards - user.pendingRewards;
        if (request.amount > availableBalance) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of(
                    "error", "Insufficient balance",
                    "available", availableBalance,
                    "requested", request.amount
                ))
                .build();
        }

        // Process withdrawal (in production, integrate with payment system)
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        return Response.ok(Map.of(
            "success", true,
            "transactionId", transactionId,
            "amount", request.amount,
            "destination", request.walletAddress,
            "status", "processing",
            "estimatedCompletion", "24-48 hours"
        )).build();
    }

    // Helper methods

    private int getRewardForTier(String tier) {
        return rewardTiers.stream()
            .filter(t -> t.name.equals(tier))
            .findFirst()
            .map(t -> t.rewardPerReferral)
            .orElse(100);
    }

    private RewardTier getTierByName(String name) {
        return rewardTiers.stream()
            .filter(t -> t.name.equals(name))
            .findFirst()
            .orElse(rewardTiers.get(0));
    }

    private RewardTier getNextTier(String currentTier) {
        int currentIndex = -1;
        for (int i = 0; i < rewardTiers.size(); i++) {
            if (rewardTiers.get(i).name.equals(currentTier)) {
                currentIndex = i;
                break;
            }
        }
        return currentIndex < rewardTiers.size() - 1 ? rewardTiers.get(currentIndex + 1) : null;
    }

    private void updateUserTier(UserProfile user) {
        for (int i = rewardTiers.size() - 1; i >= 0; i--) {
            if (user.totalReferrals >= rewardTiers.get(i).minReferrals) {
                String newTier = rewardTiers.get(i).name;
                if (!newTier.equals(user.tier)) {
                    user.tier = newTier;
                    user.totalRewards += rewardTiers.get(i).bonusReward;
                    LOG.infof("User %s upgraded to %s tier!", user.username, newTier);
                }
                break;
            }
        }
    }

    private Map<String, Object> createLeaderEntry(int rank, String username, int referrals, int rewards, String tier) {
        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("rank", rank);
        entry.put("username", username);
        entry.put("referrals", referrals);
        entry.put("rewards", rewards);
        entry.put("tier", tier);
        return entry;
    }

    // DTOs

    public static class UserProfile {
        public String id;
        public String username;
        public String email;
        public String fullName;
        public String walletAddress;
        public String role;
        public String status;
        public String joinedAt;
        public String referralCode;
        public String tier;
        public int totalReferrals;
        public int totalRewards;
        public int pendingRewards;
    }

    public static class Referral {
        public String id;
        public String referredUser;
        public String email;
        public String status;
        public String signupDate;
        public int rewardAmount;
        public String rewardStatus;

        public Referral() {}

        public Referral(String id, String referredUser, String email, String status,
                       String signupDate, int rewardAmount, String rewardStatus) {
            this.id = id;
            this.referredUser = referredUser;
            this.email = email;
            this.status = status;
            this.signupDate = signupDate;
            this.rewardAmount = rewardAmount;
            this.rewardStatus = rewardStatus;
        }
    }

    public static class RewardTier {
        public String name;
        public int minReferrals;
        public int rewardPerReferral;
        public int bonusReward;

        public RewardTier(String name, int minReferrals, int rewardPerReferral, int bonusReward) {
            this.name = name;
            this.minReferrals = minReferrals;
            this.rewardPerReferral = rewardPerReferral;
            this.bonusReward = bonusReward;
        }
    }

    public static class ReferralSubmission {
        public String referralCode;
        public String username;
        public String email;
    }

    public static class InviteRequest {
        public String userId;
        public String email;
        public String referralCode;
    }

    public static class WithdrawalRequest {
        public String userId;
        public int amount;
        public String walletAddress;
    }
}

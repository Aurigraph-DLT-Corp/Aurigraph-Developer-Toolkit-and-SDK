package io.aurigraph.v11.user;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.ValidationException;
import org.jboss.logging.Logger;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * UserInterestService - Business logic for tracking user interests and interactions
 *
 * Captures user engagement with various use cases for follow-up purposes.
 * Calculates priority levels based on engagement signals.
 *
 * @author Backend Development Agent (BDA)
 * @since V12.0.0
 */
@ApplicationScoped
public class UserInterestService {

    private static final Logger LOG = Logger.getLogger(UserInterestService.class);

    @Inject
    UserService userService;

    /**
     * Record a new user interest/interaction
     */
    @Transactional
    public UserInterest recordInterest(
        UUID userId,
        String category,
        String useCase,
        UserInterest.ActionType actionType,
        String source,
        String sessionId,
        String ipAddress,
        String userAgent,
        String metadata
    ) {
        LOG.infof("Recording interest for user %s: %s/%s (%s)", userId, category, useCase, actionType);

        User user = User.findById(userId);
        if (user == null) {
            throw new ValidationException("User not found: " + userId);
        }

        UserInterest interest = new UserInterest();
        interest.user = user;
        interest.category = category.toUpperCase();
        interest.useCase = useCase;
        interest.actionType = actionType;
        interest.source = source;
        interest.sessionId = sessionId;
        interest.ipHash = hashIpAddress(ipAddress);
        interest.userAgent = truncate(userAgent, 255);
        interest.metadata = metadata;
        interest.priority = calculatePriority(actionType, category);

        interest.persist();

        // Check if this user's engagement pattern indicates high priority
        updateUserPriorityIfNeeded(userId);

        return interest;
    }

    /**
     * Get all interests for a user
     */
    public List<UserInterest> getUserInterests(UUID userId) {
        return UserInterest.findByUserId(userId);
    }

    /**
     * Get recent interests for a user
     */
    public List<UserInterest> getRecentInterests(UUID userId, int limit) {
        return UserInterest.findRecentByUser(userId, limit);
    }

    /**
     * Get interests by category
     */
    public List<UserInterest> getInterestsByCategory(String category) {
        return UserInterest.findByCategory(category.toUpperCase());
    }

    /**
     * Get user interests by category
     */
    public List<UserInterest> getUserInterestsByCategory(UUID userId, String category) {
        return UserInterest.findByUserAndCategory(userId, category.toUpperCase());
    }

    /**
     * Get high priority leads not yet followed up
     */
    public List<UserInterest> getHighPriorityLeads() {
        return UserInterest.findHighPriorityNotFollowedUp();
    }

    /**
     * Get urgent leads requiring immediate follow-up
     */
    public List<UserInterest> getUrgentLeads() {
        return UserInterest.findUrgentNotFollowedUp();
    }

    /**
     * Mark an interest as followed up
     */
    @Transactional
    public UserInterest markFollowedUp(UUID interestId, String notes) {
        UserInterest interest = UserInterest.findById(interestId);
        if (interest == null) {
            throw new ValidationException("Interest not found: " + interestId);
        }

        interest.followUpCompleted = true;
        interest.followUpNotes = notes;
        interest.persist();

        return interest;
    }

    /**
     * Update priority for an interest
     */
    @Transactional
    public UserInterest updatePriority(UUID interestId, UserInterest.Priority priority) {
        UserInterest interest = UserInterest.findById(interestId);
        if (interest == null) {
            throw new ValidationException("Interest not found: " + interestId);
        }

        interest.priority = priority;
        interest.persist();

        return interest;
    }

    /**
     * Get analytics summary for a category
     */
    public Map<String, Object> getCategoryAnalytics(String category) {
        String upperCategory = category.toUpperCase();
        List<UserInterest> interests = UserInterest.findByCategory(upperCategory);

        Map<String, Object> analytics = new LinkedHashMap<>();
        analytics.put("category", upperCategory);
        analytics.put("totalInteractions", interests.size());
        analytics.put("uniqueUsers", interests.stream()
            .map(i -> i.user.id)
            .distinct()
            .count());

        // Count by action type
        Map<UserInterest.ActionType, Long> actionCounts = interests.stream()
            .collect(Collectors.groupingBy(
                i -> i.actionType,
                Collectors.counting()
            ));
        analytics.put("actionBreakdown", actionCounts);

        // Count by priority
        Map<UserInterest.Priority, Long> priorityCounts = interests.stream()
            .collect(Collectors.groupingBy(
                i -> i.priority,
                Collectors.counting()
            ));
        analytics.put("priorityBreakdown", priorityCounts);

        // Pending follow-ups
        long pendingFollowUps = interests.stream()
            .filter(i -> !i.followUpCompleted &&
                        (i.priority == UserInterest.Priority.HIGH ||
                         i.priority == UserInterest.Priority.URGENT))
            .count();
        analytics.put("pendingFollowUps", pendingFollowUps);

        return analytics;
    }

    /**
     * Get overall analytics summary
     */
    public Map<String, Object> getOverallAnalytics() {
        Map<String, Object> analytics = new LinkedHashMap<>();

        // Total interests
        long totalInterests = UserInterest.count();
        analytics.put("totalInteractions", totalInterests);

        // Unique users
        analytics.put("uniqueUsers", UserInterest.find("SELECT DISTINCT u.user.id FROM UserInterest u")
            .list().size());

        // By category
        Map<String, Long> categoryBreakdown = new LinkedHashMap<>();
        for (String cat : Arrays.asList(
            UserInterest.Categories.TOKENIZATION,
            UserInterest.Categories.RWA,
            UserInterest.Categories.CARBON_CREDITS,
            UserInterest.Categories.DEFI,
            UserInterest.Categories.SMART_CONTRACTS,
            UserInterest.Categories.ENTERPRISE
        )) {
            categoryBreakdown.put(cat, UserInterest.countByCategory(cat));
        }
        analytics.put("categoryBreakdown", categoryBreakdown);

        // Urgent/high priority pending
        analytics.put("urgentPendingFollowUps", UserInterest.findUrgentNotFollowedUp().size());
        analytics.put("highPriorityPendingFollowUps", UserInterest.findHighPriorityNotFollowedUp().size());

        // Recent activity (last 24 hours)
        Instant yesterday = Instant.now().minus(24, ChronoUnit.HOURS);
        analytics.put("last24HoursInteractions",
            UserInterest.count("createdAt > ?1", yesterday));

        return analytics;
    }

    /**
     * Get user engagement score
     */
    public Map<String, Object> getUserEngagementScore(UUID userId) {
        List<UserInterest> interests = UserInterest.findByUserId(userId);

        Map<String, Object> engagement = new LinkedHashMap<>();
        engagement.put("userId", userId);
        engagement.put("totalInteractions", interests.size());

        // Calculate engagement score (0-100)
        int score = 0;
        Set<String> categories = new HashSet<>();
        Set<String> useCases = new HashSet<>();

        for (UserInterest interest : interests) {
            categories.add(interest.category);
            useCases.add(interest.useCase);

            // Points by action type
            score += switch (interest.actionType) {
                case VIEW -> 1;
                case CLICK -> 2;
                case DEMO_START -> 5;
                case DEMO_COMPLETE -> 15;
                case INQUIRY -> 20;
                case DOWNLOAD -> 10;
                case SHARE -> 8;
                case BOOKMARK -> 5;
                case SIGNUP_INTENT -> 25;
                case CONTACT_REQUEST -> 30;
            };
        }

        // Bonus for diversity
        score += categories.size() * 5;
        score += useCases.size() * 3;

        // Cap at 100
        score = Math.min(score, 100);

        engagement.put("engagementScore", score);
        engagement.put("categoriesExplored", categories.size());
        engagement.put("useCasesViewed", useCases.size());
        engagement.put("topCategories", categories);

        // Engagement level
        String level;
        if (score >= 80) level = "HOT_LEAD";
        else if (score >= 60) level = "WARM_LEAD";
        else if (score >= 40) level = "ENGAGED";
        else if (score >= 20) level = "INTERESTED";
        else level = "BROWSING";

        engagement.put("engagementLevel", level);

        return engagement;
    }

    /**
     * Calculate priority based on action type and category
     */
    private UserInterest.Priority calculatePriority(UserInterest.ActionType actionType, String category) {
        // High-value actions
        if (actionType == UserInterest.ActionType.CONTACT_REQUEST ||
            actionType == UserInterest.ActionType.SIGNUP_INTENT) {
            return UserInterest.Priority.URGENT;
        }

        if (actionType == UserInterest.ActionType.INQUIRY ||
            actionType == UserInterest.ActionType.DEMO_COMPLETE) {
            return UserInterest.Priority.HIGH;
        }

        if (actionType == UserInterest.ActionType.DEMO_START ||
            actionType == UserInterest.ActionType.DOWNLOAD) {
            return UserInterest.Priority.NORMAL;
        }

        return UserInterest.Priority.LOW;
    }

    /**
     * Check user's overall engagement and update priority if needed
     */
    @Transactional
    private void updateUserPriorityIfNeeded(UUID userId) {
        List<UserInterest> recentInterests = UserInterest.find(
            "user.id = ?1 AND createdAt > ?2 ORDER BY createdAt DESC",
            userId,
            Instant.now().minus(1, ChronoUnit.HOURS)
        ).list();

        // If user has 5+ interactions in the last hour, mark latest as HIGH priority
        if (recentInterests.size() >= 5) {
            UserInterest latest = recentInterests.get(0);
            if (latest.priority == UserInterest.Priority.LOW ||
                latest.priority == UserInterest.Priority.NORMAL) {
                latest.priority = UserInterest.Priority.HIGH;
                latest.persist();
                LOG.infof("Elevated priority for user %s due to high engagement", userId);
            }
        }
    }

    /**
     * Hash IP address for privacy
     */
    private String hashIpAddress(String ipAddress) {
        if (ipAddress == null || ipAddress.isEmpty()) {
            return null;
        }

        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(ipAddress.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            LOG.warn("Failed to hash IP address", e);
            return null;
        }
    }

    /**
     * Truncate string to max length
     */
    private String truncate(String str, int maxLength) {
        if (str == null) return null;
        return str.length() <= maxLength ? str : str.substring(0, maxLength);
    }
}

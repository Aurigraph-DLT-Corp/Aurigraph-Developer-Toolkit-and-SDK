package io.aurigraph.v11.user;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * UserInterest Entity - Tracks user interactions with use cases for follow-up
 *
 * Captures which features, demos, and use cases users are interested in.
 * Used for lead generation, follow-up marketing, and user engagement analytics.
 *
 * @author Backend Development Agent (BDA)
 * @since V12.0.0
 */
@Entity
@Table(name = "user_interests", indexes = {
    @Index(name = "idx_user_interests_user_id", columnList = "user_id"),
    @Index(name = "idx_user_interests_category", columnList = "category"),
    @Index(name = "idx_user_interests_use_case", columnList = "use_case"),
    @Index(name = "idx_user_interests_created_at", columnList = "created_at")
})
public class UserInterest extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    /**
     * Category of interest (e.g., TOKENIZATION, RWA, DEFI, CARBON_CREDITS, etc.)
     */
    @NotBlank(message = "Category is required")
    @Size(max = 50)
    @Column(name = "category", nullable = false, length = 50)
    public String category;

    /**
     * Specific use case within the category
     */
    @NotBlank(message = "Use case is required")
    @Size(max = 100)
    @Column(name = "use_case", nullable = false, length = 100)
    public String useCase;

    /**
     * Action type (VIEW, CLICK, DEMO_START, DEMO_COMPLETE, INQUIRY, DOWNLOAD, etc.)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 30)
    public ActionType actionType = ActionType.VIEW;

    /**
     * Optional metadata as JSON (e.g., page URL, session duration, form data)
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    public String metadata;

    /**
     * Source of the interaction (e.g., dashboard, demo_page, email_campaign)
     */
    @Size(max = 100)
    @Column(name = "source", length = 100)
    public String source;

    /**
     * Session ID for grouping related interactions
     */
    @Column(name = "session_id", length = 100)
    public String sessionId;

    /**
     * IP address for geolocation (hashed for privacy)
     */
    @Size(max = 64)
    @Column(name = "ip_hash", length = 64)
    public String ipHash;

    /**
     * User agent for device analytics
     */
    @Size(max = 255)
    @Column(name = "user_agent", length = 255)
    public String userAgent;

    /**
     * Priority level for follow-up (calculated based on engagement)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    public Priority priority = Priority.NORMAL;

    /**
     * Whether follow-up has been completed
     */
    @Column(name = "follow_up_completed", nullable = false)
    public boolean followUpCompleted = false;

    /**
     * Notes from follow-up (for sales/marketing team)
     */
    @Column(name = "follow_up_notes", columnDefinition = "TEXT")
    public String followUpNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    public Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    public Instant updatedAt;

    /**
     * Pre-persist callback
     */
    @PrePersist
    public void prePersist() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    /**
     * Pre-update callback
     */
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }

    /**
     * Action types for user interactions
     */
    public enum ActionType {
        VIEW,               // Viewed a page/feature
        CLICK,              // Clicked on a specific element
        DEMO_START,         // Started a demo
        DEMO_COMPLETE,      // Completed a demo
        INQUIRY,            // Submitted an inquiry form
        DOWNLOAD,           // Downloaded documentation/resources
        SHARE,              // Shared content
        BOOKMARK,           // Bookmarked/saved for later
        SIGNUP_INTENT,      // Showed intent to sign up
        CONTACT_REQUEST     // Requested to be contacted
    }

    /**
     * Priority levels for follow-up
     */
    public enum Priority {
        LOW,        // General browsing
        NORMAL,     // Standard interest
        HIGH,       // Strong engagement signals
        URGENT      // Hot lead - immediate follow-up needed
    }

    /**
     * Common use case categories
     */
    public static class Categories {
        public static final String TOKENIZATION = "TOKENIZATION";
        public static final String RWA = "REAL_WORLD_ASSETS";
        public static final String CARBON_CREDITS = "CARBON_CREDITS";
        public static final String DEFI = "DEFI";
        public static final String SMART_CONTRACTS = "SMART_CONTRACTS";
        public static final String RICARDIAN_CONTRACTS = "RICARDIAN_CONTRACTS";
        public static final String ORACLE_SERVICES = "ORACLE_SERVICES";
        public static final String CROSS_CHAIN = "CROSS_CHAIN";
        public static final String IDENTITY = "IDENTITY";
        public static final String ENTERPRISE = "ENTERPRISE";
        public static final String DEVELOPER = "DEVELOPER";
        public static final String GENERAL = "GENERAL";
    }

    // Finder methods using Panache

    public static List<UserInterest> findByUser(User user) {
        return list("user", user);
    }

    public static List<UserInterest> findByUserId(UUID userId) {
        return list("user.id", userId);
    }

    public static List<UserInterest> findByCategory(String category) {
        return list("category", category);
    }

    public static List<UserInterest> findByUseCase(String useCase) {
        return list("useCase", useCase);
    }

    public static List<UserInterest> findHighPriorityNotFollowedUp() {
        return list("priority = ?1 AND followUpCompleted = false", Priority.HIGH);
    }

    public static List<UserInterest> findUrgentNotFollowedUp() {
        return list("priority = ?1 AND followUpCompleted = false", Priority.URGENT);
    }

    public static List<UserInterest> findByUserAndCategory(UUID userId, String category) {
        return list("user.id = ?1 AND category = ?2", userId, category);
    }

    public static long countByCategory(String category) {
        return count("category", category);
    }

    public static long countByUseCase(String useCase) {
        return count("useCase", useCase);
    }

    public static List<UserInterest> findRecentByUser(UUID userId, int limit) {
        return find("user.id = ?1 ORDER BY createdAt DESC", userId)
            .page(0, limit)
            .list();
    }
}

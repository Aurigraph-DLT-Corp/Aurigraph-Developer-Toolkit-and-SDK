package io.aurigraph.v11.user;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * UseCaseFeedback Entity - Tracks user likes and comments on use cases
 *
 * Allows users to engage with use cases through likes and comments.
 * Used for community engagement and prioritizing popular use cases.
 *
 * @author Backend Development Agent (BDA)
 * @since V12.0.0
 */
@Entity
@Table(name = "use_case_feedback", indexes = {
    @Index(name = "idx_ucf_user_id", columnList = "user_id"),
    @Index(name = "idx_ucf_use_case", columnList = "use_case_id"),
    @Index(name = "idx_ucf_type", columnList = "feedback_type"),
    @Index(name = "idx_ucf_created_at", columnList = "created_at")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_ucf_user_usecase_like", columnNames = {"user_id", "use_case_id", "feedback_type"})
})
public class UseCaseFeedback extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", updatable = false, nullable = false)
    public UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    public User user;

    /**
     * Use case identifier (e.g., "commercial_property", "verified_credits")
     */
    @NotBlank(message = "Use case ID is required")
    @Size(max = 100)
    @Column(name = "use_case_id", nullable = false, length = 100)
    public String useCaseId;

    /**
     * Category of the use case
     */
    @NotBlank(message = "Category is required")
    @Size(max = 50)
    @Column(name = "category", nullable = false, length = 50)
    public String category;

    /**
     * Type of feedback
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "feedback_type", nullable = false, length = 20)
    public FeedbackType feedbackType;

    /**
     * Comment text (only for COMMENT type)
     */
    @Size(max = 2000)
    @Column(name = "comment_text", length = 2000)
    public String commentText;

    /**
     * Rating (1-5 stars, optional)
     */
    @Column(name = "rating")
    public Integer rating;

    /**
     * Parent comment ID (for nested replies)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    public UseCaseFeedback parentComment;

    /**
     * Whether the comment is visible (for moderation)
     */
    @Column(name = "is_visible", nullable = false)
    public boolean isVisible = true;

    /**
     * Whether the feedback is edited
     */
    @Column(name = "is_edited", nullable = false)
    public boolean isEdited = false;

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
     * Feedback types
     */
    public enum FeedbackType {
        LIKE,           // User liked the use case
        COMMENT,        // User commented on the use case
        RATING          // User rated the use case
    }

    // Finder methods

    public static List<UseCaseFeedback> findByUserId(UUID userId) {
        return list("user.id", userId);
    }

    public static List<UseCaseFeedback> findByUseCase(String useCaseId) {
        return list("useCaseId", useCaseId);
    }

    public static List<UseCaseFeedback> findLikesByUseCase(String useCaseId) {
        return list("useCaseId = ?1 AND feedbackType = ?2", useCaseId, FeedbackType.LIKE);
    }

    public static List<UseCaseFeedback> findCommentsByUseCase(String useCaseId) {
        return list("useCaseId = ?1 AND feedbackType = ?2 AND isVisible = true ORDER BY createdAt DESC",
            useCaseId, FeedbackType.COMMENT);
    }

    public static long countLikesByUseCase(String useCaseId) {
        return count("useCaseId = ?1 AND feedbackType = ?2", useCaseId, FeedbackType.LIKE);
    }

    public static long countCommentsByUseCase(String useCaseId) {
        return count("useCaseId = ?1 AND feedbackType = ?2 AND isVisible = true",
            useCaseId, FeedbackType.COMMENT);
    }

    public static UseCaseFeedback findUserLike(UUID userId, String useCaseId) {
        return find("user.id = ?1 AND useCaseId = ?2 AND feedbackType = ?3",
            userId, useCaseId, FeedbackType.LIKE).firstResult();
    }

    public static boolean hasUserLiked(UUID userId, String useCaseId) {
        return count("user.id = ?1 AND useCaseId = ?2 AND feedbackType = ?3",
            userId, useCaseId, FeedbackType.LIKE) > 0;
    }

    public static List<UseCaseFeedback> findTopLikedUseCases(int limit) {
        return find("SELECT useCaseId, COUNT(*) as likeCount FROM UseCaseFeedback " +
            "WHERE feedbackType = ?1 GROUP BY useCaseId ORDER BY likeCount DESC", FeedbackType.LIKE)
            .page(0, limit)
            .list();
    }

    public static Double getAverageRating(String useCaseId) {
        return find("SELECT AVG(rating) FROM UseCaseFeedback " +
            "WHERE useCaseId = ?1 AND feedbackType = ?2 AND rating IS NOT NULL",
            useCaseId, FeedbackType.RATING).project(Double.class).firstResult();
    }
}

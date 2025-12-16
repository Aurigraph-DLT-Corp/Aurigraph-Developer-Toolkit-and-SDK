package io.aurigraph.v11.user;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.ValidationException;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.stream.Collectors;

/**
 * UseCaseFeedbackService - Business logic for likes, comments, and ratings
 *
 * Provides community engagement features for use cases.
 * Supports likes, comments with nested replies, and star ratings.
 *
 * @author Backend Development Agent (BDA)
 * @since V12.0.0
 */
@ApplicationScoped
public class UseCaseFeedbackService {

    private static final Logger LOG = Logger.getLogger(UseCaseFeedbackService.class);

    @Inject
    UserService userService;

    /**
     * Add a like to a use case
     */
    @Transactional
    public UseCaseFeedback likeUseCase(UUID userId, String useCaseId, String category) {
        LOG.infof("User %s liking use case %s", userId, useCaseId);

        // Check if already liked
        if (UseCaseFeedback.hasUserLiked(userId, useCaseId)) {
            throw new ValidationException("User has already liked this use case");
        }

        User user = User.findById(userId);
        if (user == null) {
            throw new ValidationException("User not found: " + userId);
        }

        UseCaseFeedback feedback = new UseCaseFeedback();
        feedback.user = user;
        feedback.useCaseId = useCaseId;
        feedback.category = category.toUpperCase();
        feedback.feedbackType = UseCaseFeedback.FeedbackType.LIKE;

        feedback.persist();
        return feedback;
    }

    /**
     * Remove a like from a use case
     */
    @Transactional
    public boolean unlikeUseCase(UUID userId, String useCaseId) {
        LOG.infof("User %s unliking use case %s", userId, useCaseId);

        UseCaseFeedback like = UseCaseFeedback.findUserLike(userId, useCaseId);
        if (like == null) {
            return false;
        }

        like.delete();
        return true;
    }

    /**
     * Toggle like status
     */
    @Transactional
    public Map<String, Object> toggleLike(UUID userId, String useCaseId, String category) {
        Map<String, Object> result = new HashMap<>();

        if (UseCaseFeedback.hasUserLiked(userId, useCaseId)) {
            unlikeUseCase(userId, useCaseId);
            result.put("liked", false);
        } else {
            likeUseCase(userId, useCaseId, category);
            result.put("liked", true);
        }

        result.put("likeCount", UseCaseFeedback.countLikesByUseCase(useCaseId));
        return result;
    }

    /**
     * Add a comment to a use case
     */
    @Transactional
    public UseCaseFeedback addComment(UUID userId, String useCaseId, String category, String commentText, UUID parentId) {
        LOG.infof("User %s commenting on use case %s", userId, useCaseId);

        if (commentText == null || commentText.trim().isEmpty()) {
            throw new ValidationException("Comment text is required");
        }

        if (commentText.length() > 2000) {
            throw new ValidationException("Comment exceeds maximum length of 2000 characters");
        }

        User user = User.findById(userId);
        if (user == null) {
            throw new ValidationException("User not found: " + userId);
        }

        UseCaseFeedback feedback = new UseCaseFeedback();
        feedback.user = user;
        feedback.useCaseId = useCaseId;
        feedback.category = category.toUpperCase();
        feedback.feedbackType = UseCaseFeedback.FeedbackType.COMMENT;
        feedback.commentText = commentText.trim();

        // Handle nested replies
        if (parentId != null) {
            UseCaseFeedback parent = UseCaseFeedback.findById(parentId);
            if (parent == null) {
                throw new ValidationException("Parent comment not found: " + parentId);
            }
            if (parent.feedbackType != UseCaseFeedback.FeedbackType.COMMENT) {
                throw new ValidationException("Cannot reply to a non-comment feedback");
            }
            feedback.parentComment = parent;
        }

        feedback.persist();
        return feedback;
    }

    /**
     * Edit a comment
     */
    @Transactional
    public UseCaseFeedback editComment(UUID commentId, UUID userId, String newText) {
        UseCaseFeedback comment = UseCaseFeedback.findById(commentId);
        if (comment == null) {
            throw new ValidationException("Comment not found: " + commentId);
        }

        if (!comment.user.id.equals(userId)) {
            throw new ValidationException("Cannot edit another user's comment");
        }

        if (comment.feedbackType != UseCaseFeedback.FeedbackType.COMMENT) {
            throw new ValidationException("Can only edit comments");
        }

        comment.commentText = newText.trim();
        comment.isEdited = true;
        comment.persist();

        return comment;
    }

    /**
     * Delete a comment (soft delete by hiding)
     */
    @Transactional
    public boolean deleteComment(UUID commentId, UUID userId, boolean isAdmin) {
        UseCaseFeedback comment = UseCaseFeedback.findById(commentId);
        if (comment == null) {
            return false;
        }

        if (!isAdmin && !comment.user.id.equals(userId)) {
            throw new ValidationException("Cannot delete another user's comment");
        }

        comment.isVisible = false;
        comment.persist();
        return true;
    }

    /**
     * Add or update a rating
     */
    @Transactional
    public UseCaseFeedback rateUseCase(UUID userId, String useCaseId, String category, int rating) {
        LOG.infof("User %s rating use case %s with %d stars", userId, useCaseId, rating);

        if (rating < 1 || rating > 5) {
            throw new ValidationException("Rating must be between 1 and 5");
        }

        User user = User.findById(userId);
        if (user == null) {
            throw new ValidationException("User not found: " + userId);
        }

        // Check for existing rating
        UseCaseFeedback existing = UseCaseFeedback.find(
            "user.id = ?1 AND useCaseId = ?2 AND feedbackType = ?3",
            userId, useCaseId, UseCaseFeedback.FeedbackType.RATING
        ).firstResult();

        if (existing != null) {
            existing.rating = rating;
            existing.persist();
            return existing;
        }

        UseCaseFeedback feedback = new UseCaseFeedback();
        feedback.user = user;
        feedback.useCaseId = useCaseId;
        feedback.category = category.toUpperCase();
        feedback.feedbackType = UseCaseFeedback.FeedbackType.RATING;
        feedback.rating = rating;

        feedback.persist();
        return feedback;
    }

    /**
     * Get comments for a use case (with nested structure)
     */
    public List<CommentDTO> getComments(String useCaseId) {
        List<UseCaseFeedback> allComments = UseCaseFeedback.findCommentsByUseCase(useCaseId);

        // Build nested structure
        Map<UUID, CommentDTO> commentMap = new LinkedHashMap<>();
        List<CommentDTO> rootComments = new ArrayList<>();

        // First pass: create all DTOs
        for (UseCaseFeedback comment : allComments) {
            CommentDTO dto = toCommentDTO(comment);
            commentMap.put(comment.id, dto);
        }

        // Second pass: build hierarchy
        for (UseCaseFeedback comment : allComments) {
            CommentDTO dto = commentMap.get(comment.id);
            if (comment.parentComment != null) {
                CommentDTO parent = commentMap.get(comment.parentComment.id);
                if (parent != null) {
                    parent.replies.add(dto);
                }
            } else {
                rootComments.add(dto);
            }
        }

        return rootComments;
    }

    /**
     * Get feedback summary for a use case
     */
    public FeedbackSummary getFeedbackSummary(String useCaseId, UUID currentUserId) {
        long likes = UseCaseFeedback.countLikesByUseCase(useCaseId);
        long comments = UseCaseFeedback.countCommentsByUseCase(useCaseId);
        Double avgRating = UseCaseFeedback.getAverageRating(useCaseId);
        boolean userLiked = currentUserId != null && UseCaseFeedback.hasUserLiked(currentUserId, useCaseId);

        // Get user's rating if exists
        Integer userRating = null;
        if (currentUserId != null) {
            UseCaseFeedback userRatingFeedback = UseCaseFeedback.find(
                "user.id = ?1 AND useCaseId = ?2 AND feedbackType = ?3",
                currentUserId, useCaseId, UseCaseFeedback.FeedbackType.RATING
            ).firstResult();
            if (userRatingFeedback != null) {
                userRating = userRatingFeedback.rating;
            }
        }

        return new FeedbackSummary(
            useCaseId,
            likes,
            comments,
            avgRating != null ? avgRating : 0.0,
            userLiked,
            userRating
        );
    }

    /**
     * Get trending use cases by engagement
     */
    public List<TrendingUseCase> getTrendingUseCases(int limit) {
        // Get likes per use case
        List<Object[]> likeCounts = UseCaseFeedback.find(
            "SELECT useCaseId, category, COUNT(*) FROM UseCaseFeedback " +
            "WHERE feedbackType = ?1 GROUP BY useCaseId, category ORDER BY COUNT(*) DESC",
            UseCaseFeedback.FeedbackType.LIKE
        ).page(0, limit).project(Object[].class).list();

        return likeCounts.stream()
            .map(row -> {
                String useCaseId = (String) row[0];
                String category = (String) row[1];
                Long likeCount = (Long) row[2];
                Long commentCount = UseCaseFeedback.countCommentsByUseCase(useCaseId);
                Double avgRating = UseCaseFeedback.getAverageRating(useCaseId);

                return new TrendingUseCase(
                    useCaseId,
                    category,
                    likeCount,
                    commentCount,
                    avgRating != null ? avgRating : 0.0
                );
            })
            .collect(Collectors.toList());
    }

    /**
     * Moderate a comment (admin only)
     */
    @Transactional
    public UseCaseFeedback moderateComment(UUID commentId, boolean visible) {
        UseCaseFeedback comment = UseCaseFeedback.findById(commentId);
        if (comment == null) {
            throw new ValidationException("Comment not found: " + commentId);
        }

        comment.isVisible = visible;
        comment.persist();
        return comment;
    }

    /**
     * Convert entity to comment DTO
     */
    private CommentDTO toCommentDTO(UseCaseFeedback comment) {
        return new CommentDTO(
            comment.id,
            comment.user.id,
            comment.user.username,
            comment.commentText,
            comment.isEdited,
            comment.createdAt,
            new ArrayList<>()
        );
    }

    // DTOs

    public record CommentDTO(
        UUID id,
        UUID userId,
        String username,
        String text,
        boolean edited,
        java.time.Instant createdAt,
        List<CommentDTO> replies
    ) {}

    public record FeedbackSummary(
        String useCaseId,
        long likes,
        long comments,
        double averageRating,
        boolean userLiked,
        Integer userRating
    ) {}

    public record TrendingUseCase(
        String useCaseId,
        String category,
        long likes,
        long comments,
        double averageRating
    ) {}
}

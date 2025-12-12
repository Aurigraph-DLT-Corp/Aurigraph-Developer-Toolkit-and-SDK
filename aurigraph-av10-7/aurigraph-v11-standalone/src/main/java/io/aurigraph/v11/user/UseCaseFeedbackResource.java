package io.aurigraph.v11.user;

import io.smallrye.mutiny.Uni;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.ValidationException;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * UseCaseFeedbackResource - REST API for use case likes and comments
 *
 * Allows authenticated users to like and comment on use cases.
 * Provides community engagement features.
 *
 * @author Backend Development Agent (BDA)
 * @since V12.0.0
 */
@Path("/api/v12/feedback")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UseCaseFeedbackResource {

    private static final Logger LOG = Logger.getLogger(UseCaseFeedbackResource.class);

    @Inject
    JwtService jwtService;

    /**
     * Like a use case (toggle - like/unlike)
     * POST /api/v12/feedback/like
     * Requires: Any authenticated user
     */
    @POST
    @Path("/like")
    @RolesAllowed({"ADMIN", "DEVOPS", "USER"})
    @Transactional
    public Uni<Response> toggleLike(
        @Valid LikeRequest request,
        @Context HttpHeaders headers
    ) {
        return Uni.createFrom().item(() -> {
            try {
                UUID userId = extractUserIdFromToken(headers.getHeaderString(HttpHeaders.AUTHORIZATION));
                User user = User.findById(userId);

                if (user == null) {
                    return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(new ErrorResponse("User not found"))
                        .build();
                }

                // Check if already liked
                UseCaseFeedback existingLike = UseCaseFeedback.findUserLike(userId, request.useCaseId());

                if (existingLike != null) {
                    // Unlike - remove the like
                    existingLike.delete();
                    LOG.infof("User %s unliked use case %s", userId, request.useCaseId());

                    return Response.ok(new LikeResponse(
                        request.useCaseId(),
                        false,
                        UseCaseFeedback.countLikesByUseCase(request.useCaseId())
                    )).build();
                } else {
                    // Like - add new like
                    UseCaseFeedback like = new UseCaseFeedback();
                    like.user = user;
                    like.useCaseId = request.useCaseId();
                    like.category = request.category();
                    like.feedbackType = UseCaseFeedback.FeedbackType.LIKE;
                    like.persist();

                    LOG.infof("User %s liked use case %s", userId, request.useCaseId());

                    return Response.ok(new LikeResponse(
                        request.useCaseId(),
                        true,
                        UseCaseFeedback.countLikesByUseCase(request.useCaseId())
                    )).build();
                }
            } catch (ValidationException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Add a comment to a use case
     * POST /api/v12/feedback/comment
     * Requires: Any authenticated user
     */
    @POST
    @Path("/comment")
    @RolesAllowed({"ADMIN", "DEVOPS", "USER"})
    @Transactional
    public Uni<Response> addComment(
        @Valid CommentRequest request,
        @Context HttpHeaders headers
    ) {
        return Uni.createFrom().item(() -> {
            try {
                UUID userId = extractUserIdFromToken(headers.getHeaderString(HttpHeaders.AUTHORIZATION));
                User user = User.findById(userId);

                if (user == null) {
                    return Response.status(Response.Status.UNAUTHORIZED)
                        .entity(new ErrorResponse("User not found"))
                        .build();
                }

                UseCaseFeedback comment = new UseCaseFeedback();
                comment.user = user;
                comment.useCaseId = request.useCaseId();
                comment.category = request.category();
                comment.feedbackType = UseCaseFeedback.FeedbackType.COMMENT;
                comment.commentText = request.commentText();
                comment.rating = request.rating();

                // Handle reply to parent comment
                if (request.parentCommentId() != null) {
                    UseCaseFeedback parent = UseCaseFeedback.findById(UUID.fromString(request.parentCommentId()));
                    if (parent != null) {
                        comment.parentComment = parent;
                    }
                }

                comment.persist();
                LOG.infof("User %s commented on use case %s", userId, request.useCaseId());

                return Response.status(Response.Status.CREATED)
                    .entity(toCommentResponse(comment))
                    .build();
            } catch (ValidationException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get feedback summary for a use case
     * GET /api/v12/feedback/use-case/{useCaseId}
     * Public endpoint
     */
    @GET
    @Path("/use-case/{useCaseId}")
    public Uni<Response> getUseCaseFeedback(
        @PathParam("useCaseId") String useCaseId,
        @Context HttpHeaders headers
    ) {
        return Uni.createFrom().item(() -> {
            long likeCount = UseCaseFeedback.countLikesByUseCase(useCaseId);
            long commentCount = UseCaseFeedback.countCommentsByUseCase(useCaseId);
            Double avgRating = UseCaseFeedback.getAverageRating(useCaseId);

            // Check if current user has liked (if authenticated)
            boolean userHasLiked = false;
            String authHeader = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                try {
                    UUID userId = extractUserIdFromToken(authHeader);
                    userHasLiked = UseCaseFeedback.hasUserLiked(userId, useCaseId);
                } catch (Exception ignored) {}
            }

            List<UseCaseFeedback> comments = UseCaseFeedback.findCommentsByUseCase(useCaseId);
            List<CommentResponse> commentResponses = comments.stream()
                .filter(c -> c.parentComment == null) // Only top-level comments
                .map(this::toCommentResponse)
                .collect(Collectors.toList());

            UseCaseFeedbackSummary summary = new UseCaseFeedbackSummary(
                useCaseId,
                likeCount,
                commentCount,
                avgRating,
                userHasLiked,
                commentResponses
            );

            return Response.ok(summary).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get comments for a use case
     * GET /api/v12/feedback/use-case/{useCaseId}/comments
     * Public endpoint
     */
    @GET
    @Path("/use-case/{useCaseId}/comments")
    public Uni<Response> getComments(
        @PathParam("useCaseId") String useCaseId,
        @QueryParam("page") @DefaultValue("0") int page,
        @QueryParam("size") @DefaultValue("20") int size
    ) {
        return Uni.createFrom().item(() -> {
            List<UseCaseFeedback> comments = UseCaseFeedback
                .find("useCaseId = ?1 AND feedbackType = ?2 AND isVisible = true AND parentComment IS NULL ORDER BY createdAt DESC",
                    useCaseId, UseCaseFeedback.FeedbackType.COMMENT)
                .page(page, size)
                .list();

            List<CommentResponse> responses = comments.stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());

            return Response.ok(responses).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update a comment
     * PUT /api/v12/feedback/comment/{id}
     * Requires: Owner of the comment
     */
    @PUT
    @Path("/comment/{id}")
    @RolesAllowed({"ADMIN", "DEVOPS", "USER"})
    @Transactional
    public Uni<Response> updateComment(
        @PathParam("id") String id,
        @Valid UpdateCommentRequest request,
        @Context HttpHeaders headers
    ) {
        return Uni.createFrom().item(() -> {
            try {
                UUID userId = extractUserIdFromToken(headers.getHeaderString(HttpHeaders.AUTHORIZATION));
                UUID commentId = UUID.fromString(id);

                UseCaseFeedback comment = UseCaseFeedback.findById(commentId);
                if (comment == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Comment not found"))
                        .build();
                }

                // Only owner can edit (or admin)
                User user = User.findById(userId);
                if (!comment.user.id.equals(userId) && !"ADMIN".equals(user.role.name)) {
                    return Response.status(Response.Status.FORBIDDEN)
                        .entity(new ErrorResponse("You can only edit your own comments"))
                        .build();
                }

                comment.commentText = request.commentText();
                comment.isEdited = true;
                comment.persist();

                return Response.ok(toCommentResponse(comment)).build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Invalid comment ID"))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Delete a comment
     * DELETE /api/v12/feedback/comment/{id}
     * Requires: Owner of the comment or ADMIN
     */
    @DELETE
    @Path("/comment/{id}")
    @RolesAllowed({"ADMIN", "DEVOPS", "USER"})
    @Transactional
    public Uni<Response> deleteComment(
        @PathParam("id") String id,
        @Context HttpHeaders headers
    ) {
        return Uni.createFrom().item(() -> {
            try {
                UUID userId = extractUserIdFromToken(headers.getHeaderString(HttpHeaders.AUTHORIZATION));
                UUID commentId = UUID.fromString(id);

                UseCaseFeedback comment = UseCaseFeedback.findById(commentId);
                if (comment == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Comment not found"))
                        .build();
                }

                // Only owner can delete (or admin)
                User user = User.findById(userId);
                if (!comment.user.id.equals(userId) && !"ADMIN".equals(user.role.name)) {
                    return Response.status(Response.Status.FORBIDDEN)
                        .entity(new ErrorResponse("You can only delete your own comments"))
                        .build();
                }

                comment.delete();
                return Response.noContent().build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Invalid comment ID"))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get popular use cases by likes
     * GET /api/v12/feedback/popular
     * Public endpoint
     */
    @GET
    @Path("/popular")
    public Uni<Response> getPopularUseCases(
        @QueryParam("limit") @DefaultValue("10") int limit
    ) {
        return Uni.createFrom().item(() -> {
            // Get aggregated like counts per use case
            List<Object[]> results = UseCaseFeedback
                .find("SELECT useCaseId, category, COUNT(*) as likeCount FROM UseCaseFeedback " +
                    "WHERE feedbackType = ?1 GROUP BY useCaseId, category ORDER BY likeCount DESC",
                    UseCaseFeedback.FeedbackType.LIKE)
                .page(0, limit)
                .project(Object[].class)
                .list();

            List<PopularUseCase> popular = results.stream()
                .map(r -> new PopularUseCase(
                    (String) r[0],
                    (String) r[1],
                    ((Number) r[2]).longValue()
                ))
                .collect(Collectors.toList());

            return Response.ok(popular).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get user's feedback activity
     * GET /api/v12/feedback/me
     * Requires: Authenticated user
     */
    @GET
    @Path("/me")
    @RolesAllowed({"ADMIN", "DEVOPS", "USER"})
    public Uni<Response> getMyFeedback(@Context HttpHeaders headers) {
        return Uni.createFrom().item(() -> {
            UUID userId = extractUserIdFromToken(headers.getHeaderString(HttpHeaders.AUTHORIZATION));

            List<UseCaseFeedback> feedback = UseCaseFeedback.findByUserId(userId);

            List<String> likedUseCases = feedback.stream()
                .filter(f -> f.feedbackType == UseCaseFeedback.FeedbackType.LIKE)
                .map(f -> f.useCaseId)
                .collect(Collectors.toList());

            List<CommentResponse> myComments = feedback.stream()
                .filter(f -> f.feedbackType == UseCaseFeedback.FeedbackType.COMMENT)
                .map(this::toCommentResponse)
                .collect(Collectors.toList());

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("likedUseCases", likedUseCases);
            response.put("comments", myComments);
            response.put("totalLikes", likedUseCases.size());
            response.put("totalComments", myComments.size());

            return Response.ok(response).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    private UUID extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ValidationException("Missing or invalid authorization header");
        }
        String userId = jwtService.getUserIdFromToken(authHeader.substring(7));
        if (userId == null) {
            throw new ValidationException("Invalid token - could not extract user ID");
        }
        return UUID.fromString(userId);
    }

    private CommentResponse toCommentResponse(UseCaseFeedback comment) {
        // Get replies
        List<CommentResponse> replies = UseCaseFeedback
            .find("parentComment.id = ?1 AND isVisible = true ORDER BY createdAt ASC", comment.id)
            .<UseCaseFeedback>list()
            .stream()
            .map(this::toCommentResponse)
            .collect(Collectors.toList());

        return new CommentResponse(
            comment.id,
            comment.user.id,
            comment.user.username,
            comment.useCaseId,
            comment.category,
            comment.commentText,
            comment.rating,
            comment.isEdited,
            comment.createdAt,
            comment.updatedAt,
            replies
        );
    }

    // Request/Response DTOs
    public record LikeRequest(String useCaseId, String category) {}
    public record CommentRequest(
        String useCaseId,
        String category,
        String commentText,
        Integer rating,
        String parentCommentId
    ) {}
    public record UpdateCommentRequest(String commentText) {}

    public record LikeResponse(String useCaseId, boolean liked, long totalLikes) {}
    public record CommentResponse(
        UUID id,
        UUID userId,
        String username,
        String useCaseId,
        String category,
        String commentText,
        Integer rating,
        boolean isEdited,
        Instant createdAt,
        Instant updatedAt,
        List<CommentResponse> replies
    ) {}

    public record UseCaseFeedbackSummary(
        String useCaseId,
        long likeCount,
        long commentCount,
        Double averageRating,
        boolean userHasLiked,
        List<CommentResponse> comments
    ) {}

    public record PopularUseCase(String useCaseId, String category, long likeCount) {}
    public record ErrorResponse(String message) {}
}

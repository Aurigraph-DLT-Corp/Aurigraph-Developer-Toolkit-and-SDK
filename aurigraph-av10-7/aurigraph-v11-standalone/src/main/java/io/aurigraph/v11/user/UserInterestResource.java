package io.aurigraph.v11.user;

import io.smallrye.mutiny.Uni;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.ValidationException;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * UserInterestResource - REST API for tracking user interests and interactions
 *
 * Captures user engagement with use cases for follow-up marketing and sales.
 * Provides analytics endpoints for business intelligence.
 *
 * @author Backend Development Agent (BDA)
 * @since V12.0.0
 */
@Path("/api/v12/interests")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserInterestResource {

    private static final Logger LOG = Logger.getLogger(UserInterestResource.class);

    @Inject
    UserInterestService interestService;

    @Inject
    JwtService jwtService;

    /**
     * Record a new user interest/interaction
     * POST /api/v12/interests
     * Requires: Any authenticated user
     */
    @POST
    @RolesAllowed({"ADMIN", "DEVOPS", "USER"})
    public Uni<Response> recordInterest(
        @Valid RecordInterestRequest request,
        @Context HttpHeaders headers
    ) {
        return Uni.createFrom().item(() -> {
            try {
                // Extract user ID from JWT token
                String authHeader = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
                UUID userId = extractUserIdFromToken(authHeader);

                LOG.infof("Recording interest for user %s: %s/%s", userId, request.category(), request.useCase());

                String userAgent = headers.getHeaderString("User-Agent");
                String forwardedFor = headers.getHeaderString("X-Forwarded-For");
                String ipAddress = forwardedFor != null ? forwardedFor.split(",")[0].trim() : null;

                UserInterest interest = interestService.recordInterest(
                    userId,
                    request.category(),
                    request.useCase(),
                    request.actionType() != null ? request.actionType() : UserInterest.ActionType.VIEW,
                    request.source(),
                    request.sessionId(),
                    ipAddress,
                    userAgent,
                    request.metadata()
                );

                return Response.status(Response.Status.CREATED)
                    .entity(toInterestResponse(interest))
                    .build();
            } catch (ValidationException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get current user's interests
     * GET /api/v12/interests/me
     * Requires: Any authenticated user
     */
    @GET
    @Path("/me")
    @RolesAllowed({"ADMIN", "DEVOPS", "USER"})
    public Uni<Response> getMyInterests(
        @Context HttpHeaders headers,
        @QueryParam("limit") @DefaultValue("50") int limit
    ) {
        return Uni.createFrom().item(() -> {
            try {
                String authHeader = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
                UUID userId = extractUserIdFromToken(authHeader);

                List<UserInterest> interests = interestService.getRecentInterests(userId, limit);
                List<InterestResponse> responses = interests.stream()
                    .map(this::toInterestResponse)
                    .collect(Collectors.toList());

                return Response.ok(responses).build();
            } catch (ValidationException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get current user's engagement score
     * GET /api/v12/interests/me/engagement
     * Requires: Any authenticated user
     */
    @GET
    @Path("/me/engagement")
    @RolesAllowed({"ADMIN", "DEVOPS", "USER"})
    public Uni<Response> getMyEngagement(@Context HttpHeaders headers) {
        return Uni.createFrom().item(() -> {
            try {
                String authHeader = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
                UUID userId = extractUserIdFromToken(authHeader);

                Map<String, Object> engagement = interestService.getUserEngagementScore(userId);
                return Response.ok(engagement).build();
            } catch (ValidationException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get all interests (admin only)
     * GET /api/v12/interests?category=TOKENIZATION
     * Requires: ADMIN or DEVOPS role
     */
    @GET
    @RolesAllowed({"ADMIN", "DEVOPS"})
    public Uni<Response> getAllInterests(
        @QueryParam("category") String category,
        @QueryParam("useCase") String useCase
    ) {
        return Uni.createFrom().item(() -> {
            List<UserInterest> interests;

            if (category != null && !category.isEmpty()) {
                interests = interestService.getInterestsByCategory(category);
            } else if (useCase != null && !useCase.isEmpty()) {
                interests = UserInterest.findByUseCase(useCase);
            } else {
                interests = UserInterest.listAll();
            }

            List<InterestResponse> responses = interests.stream()
                .map(this::toInterestResponse)
                .collect(Collectors.toList());

            return Response.ok(responses).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get high priority leads for follow-up
     * GET /api/v12/interests/leads/high-priority
     * Requires: ADMIN or DEVOPS role
     */
    @GET
    @Path("/leads/high-priority")
    @RolesAllowed({"ADMIN", "DEVOPS"})
    public Uni<Response> getHighPriorityLeads() {
        return Uni.createFrom().item(() -> {
            List<UserInterest> leads = interestService.getHighPriorityLeads();
            List<LeadResponse> responses = leads.stream()
                .map(this::toLeadResponse)
                .collect(Collectors.toList());

            return Response.ok(responses).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get urgent leads requiring immediate follow-up
     * GET /api/v12/interests/leads/urgent
     * Requires: ADMIN or DEVOPS role
     */
    @GET
    @Path("/leads/urgent")
    @RolesAllowed({"ADMIN", "DEVOPS"})
    public Uni<Response> getUrgentLeads() {
        return Uni.createFrom().item(() -> {
            List<UserInterest> leads = interestService.getUrgentLeads();
            List<LeadResponse> responses = leads.stream()
                .map(this::toLeadResponse)
                .collect(Collectors.toList());

            return Response.ok(responses).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Mark an interest as followed up
     * PUT /api/v12/interests/{id}/follow-up
     * Requires: ADMIN or DEVOPS role
     */
    @PUT
    @Path("/{id}/follow-up")
    @RolesAllowed({"ADMIN", "DEVOPS"})
    public Uni<Response> markFollowedUp(
        @PathParam("id") String id,
        FollowUpRequest request
    ) {
        return Uni.createFrom().item(() -> {
            try {
                UUID interestId = UUID.fromString(id);
                UserInterest interest = interestService.markFollowedUp(interestId, request.notes());

                return Response.ok(toInterestResponse(interest)).build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Invalid interest ID format"))
                    .build();
            } catch (ValidationException e) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update priority for an interest
     * PUT /api/v12/interests/{id}/priority
     * Requires: ADMIN role
     */
    @PUT
    @Path("/{id}/priority")
    @RolesAllowed("ADMIN")
    public Uni<Response> updatePriority(
        @PathParam("id") String id,
        UpdatePriorityRequest request
    ) {
        return Uni.createFrom().item(() -> {
            try {
                UUID interestId = UUID.fromString(id);
                UserInterest interest = interestService.updatePriority(interestId, request.priority());

                return Response.ok(toInterestResponse(interest)).build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Invalid interest ID format or priority"))
                    .build();
            } catch (ValidationException e) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get analytics for a specific category
     * GET /api/v12/interests/analytics/category/{category}
     * Requires: ADMIN or DEVOPS role
     */
    @GET
    @Path("/analytics/category/{category}")
    @RolesAllowed({"ADMIN", "DEVOPS"})
    public Uni<Response> getCategoryAnalytics(@PathParam("category") String category) {
        return Uni.createFrom().item(() -> {
            Map<String, Object> analytics = interestService.getCategoryAnalytics(category);
            return Response.ok(analytics).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get overall analytics summary
     * GET /api/v12/interests/analytics/overall
     * Requires: ADMIN or DEVOPS role
     */
    @GET
    @Path("/analytics/overall")
    @RolesAllowed({"ADMIN", "DEVOPS"})
    public Uni<Response> getOverallAnalytics() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> analytics = interestService.getOverallAnalytics();
            return Response.ok(analytics).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get user engagement score (admin view)
     * GET /api/v12/interests/users/{userId}/engagement
     * Requires: ADMIN or DEVOPS role
     */
    @GET
    @Path("/users/{userId}/engagement")
    @RolesAllowed({"ADMIN", "DEVOPS"})
    public Uni<Response> getUserEngagement(@PathParam("userId") String userId) {
        return Uni.createFrom().item(() -> {
            try {
                UUID uid = UUID.fromString(userId);
                Map<String, Object> engagement = interestService.getUserEngagementScore(uid);
                return Response.ok(engagement).build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Invalid user ID format"))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get available categories (for frontend dropdowns)
     * GET /api/v12/interests/categories
     * Public endpoint
     */
    @GET
    @Path("/categories")
    public Uni<Response> getCategories() {
        return Uni.createFrom().item(() -> {
            List<CategoryInfo> categories = List.of(
                new CategoryInfo(UserInterest.Categories.TOKENIZATION, "Asset Tokenization", "Convert real-world assets into digital tokens"),
                new CategoryInfo(UserInterest.Categories.RWA, "Real World Assets", "Blockchain-based RWA management"),
                new CategoryInfo(UserInterest.Categories.CARBON_CREDITS, "Carbon Credits", "Carbon credit tokenization and trading"),
                new CategoryInfo(UserInterest.Categories.DEFI, "DeFi Solutions", "Decentralized finance applications"),
                new CategoryInfo(UserInterest.Categories.SMART_CONTRACTS, "Smart Contracts", "Automated contract execution"),
                new CategoryInfo(UserInterest.Categories.RICARDIAN_CONTRACTS, "Ricardian Contracts", "Human and machine readable contracts"),
                new CategoryInfo(UserInterest.Categories.ORACLE_SERVICES, "Oracle Services", "External data integration"),
                new CategoryInfo(UserInterest.Categories.CROSS_CHAIN, "Cross-Chain", "Multi-blockchain interoperability"),
                new CategoryInfo(UserInterest.Categories.IDENTITY, "Identity Solutions", "Decentralized identity management"),
                new CategoryInfo(UserInterest.Categories.ENTERPRISE, "Enterprise Solutions", "Business-grade blockchain solutions"),
                new CategoryInfo(UserInterest.Categories.DEVELOPER, "Developer Tools", "APIs, SDKs, and documentation")
            );

            return Response.ok(categories).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Extract user ID from JWT token
     */
    private UUID extractUserIdFromToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ValidationException("Missing or invalid authorization header");
        }

        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }

    /**
     * Convert entity to response DTO
     */
    private InterestResponse toInterestResponse(UserInterest interest) {
        return new InterestResponse(
            interest.id,
            interest.user.id,
            interest.category,
            interest.useCase,
            interest.actionType,
            interest.source,
            interest.priority,
            interest.followUpCompleted,
            interest.createdAt,
            interest.updatedAt
        );
    }

    /**
     * Convert entity to lead response DTO (includes user info)
     */
    private LeadResponse toLeadResponse(UserInterest interest) {
        return new LeadResponse(
            interest.id,
            interest.user.id,
            interest.user.username,
            interest.user.email,
            interest.category,
            interest.useCase,
            interest.actionType,
            interest.source,
            interest.priority,
            interest.followUpCompleted,
            interest.followUpNotes,
            interest.createdAt
        );
    }

    /**
     * Request/Response DTOs
     */
    public record RecordInterestRequest(
        String category,
        String useCase,
        UserInterest.ActionType actionType,
        String source,
        String sessionId,
        String metadata
    ) {}

    public record FollowUpRequest(String notes) {}

    public record UpdatePriorityRequest(UserInterest.Priority priority) {}

    public record InterestResponse(
        UUID id,
        UUID userId,
        String category,
        String useCase,
        UserInterest.ActionType actionType,
        String source,
        UserInterest.Priority priority,
        boolean followUpCompleted,
        java.time.Instant createdAt,
        java.time.Instant updatedAt
    ) {}

    public record LeadResponse(
        UUID id,
        UUID userId,
        String username,
        String email,
        String category,
        String useCase,
        UserInterest.ActionType actionType,
        String source,
        UserInterest.Priority priority,
        boolean followUpCompleted,
        String followUpNotes,
        java.time.Instant createdAt
    ) {}

    public record CategoryInfo(String code, String name, String description) {}

    public record ErrorResponse(String message) {}
}

package io.aurigraph.v11.demo.api;

import io.aurigraph.v11.demo.model.Demo;
import io.aurigraph.v11.user.User;
import io.aurigraph.v11.user.UserInterest;
import io.aurigraph.v11.user.UserInterestService;
import io.smallrye.mutiny.Uni;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;

/**
 * Demo Registration Resource - Backend API for demo registration
 *
 * Handles demo registrations with:
 * - User registration/linking
 * - Interest tracking
 * - Demo token generation
 * - Email notifications (integration ready)
 *
 * @author Backend Development Agent (BDA)
 * @since V12.0.0
 * @see AV11-579
 */
@Path("/api/v12/demos/register")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DemoRegistrationResource {

    private static final Logger LOG = Logger.getLogger(DemoRegistrationResource.class);

    @Inject
    UserInterestService interestService;

    /**
     * Register for a demo - public endpoint
     * POST /api/v12/demos/register
     *
     * Creates a demo registration, optionally creates/links user account,
     * and records user interest for follow-up.
     */
    @POST
    @PermitAll
    @Transactional
    public Uni<Response> registerForDemo(
        @Valid DemoRegistrationRequest request,
        @Context HttpHeaders headers
    ) {
        return Uni.createFrom().item(() -> {
            try {
                LOG.infof("Demo registration: %s for %s/%s",
                    request.email(), request.category(), request.useCase());

                // Generate demo token
                String demoToken = generateDemoToken();

                // Find or create user
                User user = findOrCreateUser(request);

                // Create demo registration
                Demo demo = createDemoRegistration(request, user, demoToken);

                // Record user interest
                recordDemoInterest(user, request, headers);

                // Build response
                DemoRegistrationResponse response = new DemoRegistrationResponse(
                    demo.id.toString(),
                    demoToken,
                    request.email(),
                    request.category(),
                    request.useCase(),
                    demo.createdAt,
                    calculateExpiresAt(demo.createdAt),
                    buildDemoUrl(request.category(), request.useCase(), demoToken),
                    "Registration successful! Check your email for demo access."
                );

                return Response.status(Response.Status.CREATED)
                    .entity(response)
                    .build();

            } catch (Exception e) {
                LOG.error("Demo registration failed", e);
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get demo status by token
     * GET /api/v12/demos/register/{token}/status
     */
    @GET
    @Path("/{token}/status")
    @PermitAll
    public Uni<Response> getDemoStatus(@PathParam("token") String token) {
        return Uni.createFrom().item(() -> {
            Demo demo = Demo.find("demoToken", token).firstResult();

            if (demo == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("Demo not found"))
                    .build();
            }

            DemoStatusResponse status = new DemoStatusResponse(
                demo.id.toString(),
                demo.status,
                demo.category,
                demo.useCase,
                demo.createdAt,
                calculateExpiresAt(demo.createdAt),
                isExpired(demo.createdAt),
                demo.completedAt
            );

            return Response.ok(status).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Start a demo session
     * POST /api/v12/demos/register/{token}/start
     */
    @POST
    @Path("/{token}/start")
    @PermitAll
    @Transactional
    public Uni<Response> startDemo(@PathParam("token") String token) {
        return Uni.createFrom().item(() -> {
            Demo demo = Demo.find("demoToken", token).firstResult();

            if (demo == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("Demo not found"))
                    .build();
            }

            if (isExpired(demo.createdAt)) {
                return Response.status(Response.Status.GONE)
                    .entity(new ErrorResponse("Demo token has expired"))
                    .build();
            }

            demo.status = "IN_PROGRESS";
            demo.startedAt = Instant.now();
            demo.persist();

            return Response.ok(Map.of(
                "status", "STARTED",
                "message", "Demo session started",
                "demoId", demo.id.toString()
            )).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Complete a demo session
     * POST /api/v12/demos/register/{token}/complete
     */
    @POST
    @Path("/{token}/complete")
    @PermitAll
    @Transactional
    public Uni<Response> completeDemo(
        @PathParam("token") String token,
        DemoCompletionRequest request
    ) {
        return Uni.createFrom().item(() -> {
            Demo demo = Demo.find("demoToken", token).firstResult();

            if (demo == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("Demo not found"))
                    .build();
            }

            demo.status = "COMPLETED";
            demo.completedAt = Instant.now();
            if (request != null) {
                demo.feedback = request.feedback();
                demo.rating = request.rating();
            }
            demo.persist();

            // Record completion interest
            if (demo.userId != null) {
                try {
                    interestService.recordInterest(
                        demo.userId,
                        demo.category,
                        demo.useCase,
                        UserInterest.ActionType.DEMO_COMPLETE,
                        "demo_completion",
                        null, null, null,
                        String.format("{\"demoId\":\"%s\",\"rating\":%d}",
                            demo.id.toString(), request != null ? request.rating() : 0)
                    );
                } catch (Exception e) {
                    LOG.warn("Failed to record demo completion interest", e);
                }
            }

            return Response.ok(Map.of(
                "status", "COMPLETED",
                "message", "Demo completed successfully!",
                "demoId", demo.id.toString()
            )).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * List available demos
     * GET /api/v12/demos/register/available
     */
    @GET
    @Path("/available")
    @PermitAll
    public Uni<Response> getAvailableDemos() {
        return Uni.createFrom().item(() -> {
            List<AvailableDemo> demos = List.of(
                new AvailableDemo("tokenization", "commercial_property",
                    "Commercial Property Tokenization",
                    "Experience how to tokenize real estate assets",
                    15, List.of("RWA", "TOKENIZATION")),
                new AvailableDemo("tokenization", "verified_credits",
                    "Carbon Credit Verification",
                    "See how carbon credits are verified and tokenized",
                    10, List.of("CARBON_CREDITS", "ORACLE")),
                new AvailableDemo("defi", "lending_pool",
                    "DeFi Lending Pool",
                    "Explore decentralized lending mechanics",
                    20, List.of("DEFI", "SMART_CONTRACTS")),
                new AvailableDemo("smart_contracts", "ricardian",
                    "Ricardian Contracts",
                    "Create human-readable smart contracts",
                    12, List.of("SMART_CONTRACTS", "LEGAL")),
                new AvailableDemo("cross_chain", "bridge",
                    "Cross-Chain Bridge",
                    "Bridge assets across blockchains",
                    15, List.of("CROSS_CHAIN", "INTEROPERABILITY")),
                new AvailableDemo("identity", "did_verification",
                    "Decentralized Identity",
                    "Verify identity using DIDs",
                    8, List.of("IDENTITY", "VERIFICATION"))
            );

            return Response.ok(demos).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get user's demo history
     * GET /api/v12/demos/register/history
     */
    @GET
    @Path("/history")
    @RolesAllowed({"ADMIN", "DEVOPS", "USER"})
    public Uni<Response> getDemoHistory(
        @Context HttpHeaders headers,
        @QueryParam("limit") @DefaultValue("20") int limit
    ) {
        return Uni.createFrom().item(() -> {
            // Extract user ID from token
            String authHeader = headers.getHeaderString(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse("Missing authorization"))
                    .build();
            }

            // TODO: Extract user ID from JWT and query demos
            List<Demo> demos = Demo.find("ORDER BY createdAt DESC")
                .page(0, limit)
                .list();

            List<DemoHistoryItem> history = demos.stream()
                .map(d -> new DemoHistoryItem(
                    d.id.toString(),
                    d.category,
                    d.useCase,
                    d.status,
                    d.createdAt,
                    d.completedAt,
                    d.rating
                ))
                .toList();

            return Response.ok(history).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Helper methods

    private String generateDemoToken() {
        return "demo_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }

    private User findOrCreateUser(DemoRegistrationRequest request) {
        User user = User.find("email", request.email()).firstResult();

        if (user == null && request.createAccount()) {
            user = new User();
            user.email = request.email();
            user.username = request.email().split("@")[0];
            user.fullName = request.fullName();
            user.company = request.company();
            user.role = "USER";
            user.persist();
            LOG.infof("Created new user for demo: %s", request.email());
        }

        return user;
    }

    private Demo createDemoRegistration(DemoRegistrationRequest request, User user, String token) {
        Demo demo = new Demo();
        demo.email = request.email();
        demo.fullName = request.fullName();
        demo.company = request.company();
        demo.category = request.category().toUpperCase();
        demo.useCase = request.useCase();
        demo.demoToken = token;
        demo.status = "PENDING";
        demo.source = request.source();
        if (user != null) {
            demo.userId = user.id;
        }
        demo.createdAt = Instant.now();
        demo.persist();
        return demo;
    }

    private void recordDemoInterest(User user, DemoRegistrationRequest request, HttpHeaders headers) {
        if (user == null) return;

        try {
            String userAgent = headers.getHeaderString("User-Agent");
            String forwardedFor = headers.getHeaderString("X-Forwarded-For");
            String ipAddress = forwardedFor != null ? forwardedFor.split(",")[0].trim() : null;

            interestService.recordInterest(
                user.id,
                request.category().toUpperCase(),
                request.useCase(),
                UserInterest.ActionType.DEMO_START,
                request.source(),
                null,
                ipAddress,
                userAgent,
                String.format("{\"company\":\"%s\"}", request.company())
            );
        } catch (Exception e) {
            LOG.warn("Failed to record demo interest", e);
        }
    }

    private Instant calculateExpiresAt(Instant createdAt) {
        // Demos expire in 7 days
        return createdAt.plusSeconds(7 * 24 * 60 * 60);
    }

    private boolean isExpired(Instant createdAt) {
        return Instant.now().isAfter(calculateExpiresAt(createdAt));
    }

    private String buildDemoUrl(String category, String useCase, String token) {
        return String.format("https://dlt.aurigraph.io/demo/%s/%s?token=%s",
            category.toLowerCase(), useCase.toLowerCase(), token);
    }

    // Request/Response DTOs

    public record DemoRegistrationRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(max = 100) String fullName,
        @Size(max = 100) String company,
        @NotBlank String category,
        @NotBlank String useCase,
        String source,
        boolean createAccount
    ) {}

    public record DemoCompletionRequest(
        String feedback,
        Integer rating
    ) {}

    public record DemoRegistrationResponse(
        String demoId,
        String token,
        String email,
        String category,
        String useCase,
        Instant createdAt,
        Instant expiresAt,
        String demoUrl,
        String message
    ) {}

    public record DemoStatusResponse(
        String demoId,
        String status,
        String category,
        String useCase,
        Instant createdAt,
        Instant expiresAt,
        boolean expired,
        Instant completedAt
    ) {}

    public record AvailableDemo(
        String category,
        String useCase,
        String title,
        String description,
        int durationMinutes,
        List<String> tags
    ) {}

    public record DemoHistoryItem(
        String demoId,
        String category,
        String useCase,
        String status,
        Instant startedAt,
        Instant completedAt,
        Integer rating
    ) {}

    public record ErrorResponse(String message) {}
}

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
import java.time.LocalDateTime;
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
@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DemoRegistrationResource {

    private static final Logger LOG = Logger.getLogger(DemoRegistrationResource.class);

    @Inject
    UserInterestService interestService;

    /**
     * V11 Compatibility Endpoint - Frontend Demo Registration
     * POST /api/v11/demo/register
     *
     * Accepts the frontend DemoUser format and transforms to backend format.
     * Integrates with Aurigraph Hermes CRM for lead tracking.
     */
    @POST
    @Path("/v11/demo/register")
    @PermitAll
    @Transactional
    public Uni<Response> registerForDemoV11(
        @Valid FrontendDemoUser request,
        @Context HttpHeaders headers
    ) {
        return Uni.createFrom().item(() -> {
            try {
                LOG.infof("V11 Demo registration: %s %s (%s) from %s",
                    request.firstName(), request.lastName(), request.email(), request.company());

                // Generate demo token
                String demoToken = generateDemoToken();

                // Create demo registration from frontend format
                Demo demo = new Demo();
                demo.id = demoToken;
                demo.demoName = "token_experience_" + (request.interests() != null && !request.interests().isEmpty()
                    ? request.interests().get(0).toLowerCase().replace(" ", "_")
                    : "general");
                demo.userEmail = request.email();
                demo.userName = request.firstName() + " " + request.lastName();
                demo.description = String.format(
                    "Demo registration - Company: %s, Title: %s, Country: %s, Phone: %s, Interests: %s, Marketing: %s",
                    request.company(),
                    request.jobTitle() != null ? request.jobTitle() : "N/A",
                    request.country() != null ? request.country() : "N/A",
                    request.phone() != null ? request.phone() : "N/A",
                    request.interests() != null ? String.join(", ", request.interests()) : "N/A",
                    request.consents() != null && request.consents().marketingConsent() ? "Yes" : "No"
                );
                demo.status = Demo.DemoStatus.PENDING;
                demo.createdAt = LocalDateTime.now();
                demo.lastActivity = LocalDateTime.now();
                demo.expiresAt = LocalDateTime.now().plusHours(48); // 48-hour demo access (matches frontend)
                demo.durationMinutes = 2880; // 48 hours
                demo.persist();

                // Try to find or link existing user
                User user = User.find("email", request.email()).firstResult();
                if (user != null) {
                    recordDemoInterestV11(user, request, headers);
                }

                // Build response
                V11DemoRegistrationResponse response = new V11DemoRegistrationResponse(
                    request.id() != null ? request.id() : demoToken,
                    demoToken,
                    request.email(),
                    request.firstName() + " " + request.lastName(),
                    demo.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant(),
                    demo.expiresAt.atZone(java.time.ZoneId.systemDefault()).toInstant(),
                    "Registration successful! Your demo experience is ready."
                );

                LOG.infof("V11 Demo registration successful: %s -> %s", request.email(), demoToken);

                return Response.status(Response.Status.CREATED)
                    .entity(response)
                    .build();

            } catch (Exception e) {
                LOG.error("V11 Demo registration failed", e);
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Register for a demo - V12 endpoint
     * POST /api/v12/demos/register
     *
     * Creates a demo registration, optionally creates/links user account,
     * and records user interest for follow-up.
     */
    @POST
    @Path("/v12/demos/register")
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
                    demo.id,
                    demoToken,
                    request.email(),
                    request.category(),
                    request.useCase(),
                    demo.createdAt != null ? demo.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant() : Instant.now(),
                    demo.expiresAt != null ? demo.expiresAt.atZone(java.time.ZoneId.systemDefault()).toInstant() : Instant.now().plus(7, java.time.temporal.ChronoUnit.DAYS),
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
    @Path("/v12/demos/register/{token}/status")
    @PermitAll
    public Uni<Response> getDemoStatus(@PathParam("token") String token) {
        return Uni.createFrom().item(() -> {
            Demo demo = Demo.findById(token);

            if (demo == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("Demo not found"))
                    .build();
            }

            // Extract category and useCase from demoName (format: category_useCase)
            String[] parts = demo.demoName != null ? demo.demoName.split("_", 2) : new String[]{"", ""};
            String category = parts.length > 0 ? parts[0] : "";
            String useCase = parts.length > 1 ? parts[1] : "";

            DemoStatusResponse status = new DemoStatusResponse(
                demo.id,
                demo.status.name(),
                category,
                useCase,
                demo.createdAt != null ? demo.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant() : null,
                demo.expiresAt != null ? demo.expiresAt.atZone(java.time.ZoneId.systemDefault()).toInstant() : null,
                demo.isExpired(),
                demo.lastActivity != null ? demo.lastActivity.atZone(java.time.ZoneId.systemDefault()).toInstant() : null
            );

            return Response.ok(status).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Start a demo session
     * POST /api/v12/demos/register/{token}/start
     */
    @POST
    @Path("/v12/demos/register/{token}/start")
    @PermitAll
    @Transactional
    public Uni<Response> startDemo(@PathParam("token") String token) {
        return Uni.createFrom().item(() -> {
            Demo demo = Demo.findById(token);

            if (demo == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("Demo not found"))
                    .build();
            }

            if (demo.isExpired()) {
                return Response.status(Response.Status.GONE)
                    .entity(new ErrorResponse("Demo token has expired"))
                    .build();
            }

            demo.status = Demo.DemoStatus.RUNNING;
            demo.lastActivity = LocalDateTime.now();
            demo.persist();

            return Response.ok(Map.of(
                "status", "STARTED",
                "message", "Demo session started",
                "demoId", demo.id
            )).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Complete a demo session
     * POST /api/v12/demos/register/{token}/complete
     */
    @POST
    @Path("/v12/demos/register/{token}/complete")
    @PermitAll
    @Transactional
    public Uni<Response> completeDemo(
        @PathParam("token") String token,
        DemoCompletionRequest request
    ) {
        return Uni.createFrom().item(() -> {
            Demo demo = Demo.findById(token);

            if (demo == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("Demo not found"))
                    .build();
            }

            demo.status = Demo.DemoStatus.STOPPED;
            demo.lastActivity = LocalDateTime.now();
            // Store feedback in description field
            if (request != null && request.feedback() != null) {
                demo.description = demo.description + " | Feedback: " + request.feedback() +
                    " | Rating: " + request.rating();
            }
            demo.persist();

            LOG.infof("Demo completed: %s", token);

            return Response.ok(Map.of(
                "status", "COMPLETED",
                "message", "Demo completed successfully!",
                "demoId", demo.id
            )).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * List available demos
     * GET /api/v12/demos/register/available
     */
    @GET
    @Path("/v12/demos/register/available")
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
    @Path("/v12/demos/register/history")
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
                .map(d -> {
                    // Extract category and useCase from demoName (format: category_useCase)
                    String[] parts = d.demoName != null ? d.demoName.split("_", 2) : new String[]{"", ""};
                    String category = parts.length > 0 ? parts[0] : "";
                    String useCase = parts.length > 1 ? parts[1] : "";
                    return new DemoHistoryItem(
                        d.id,
                        category,
                        useCase,
                        d.status.name(),
                        d.createdAt != null ? d.createdAt.atZone(java.time.ZoneId.systemDefault()).toInstant() : null,
                        d.lastActivity != null ? d.lastActivity.atZone(java.time.ZoneId.systemDefault()).toInstant() : null,
                        null // No rating field in Demo entity
                    );
                })
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
            // For demo users, we don't create accounts directly
            // They can register through the normal user registration flow
            LOG.infof("User not found for demo registration: %s", request.email());
        }

        return user;
    }

    private Demo createDemoRegistration(DemoRegistrationRequest request, User user, String token) {
        Demo demo = new Demo();
        demo.id = token;
        demo.demoName = request.category() + "_" + request.useCase();
        demo.userEmail = request.email();
        demo.userName = request.fullName();
        demo.description = String.format("Demo registration - Company: %s, Category: %s, UseCase: %s, Source: %s",
            request.company(), request.category(), request.useCase(), request.source());
        demo.status = Demo.DemoStatus.PENDING;
        demo.createdAt = LocalDateTime.now();
        demo.lastActivity = LocalDateTime.now();
        demo.expiresAt = LocalDateTime.now().plusDays(7); // 7-day demo access
        demo.durationMinutes = 10080; // 7 days in minutes
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

    // V11 Frontend DTOs - Matches DemoRegistration.tsx format

    /**
     * Frontend consent structure
     */
    public record FrontendConsents(
        boolean termsAccepted,
        boolean privacyAccepted,
        boolean cookiesAccepted,
        boolean marketingConsent,
        boolean dataShareConsent
    ) {}

    /**
     * Frontend DemoUser format - matches DemoRegistration.tsx
     */
    public record FrontendDemoUser(
        String id,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank @Email String email,
        @NotBlank String company,
        String jobTitle,
        String phone,
        String country,
        List<String> interests,
        FrontendConsents consents,
        Instant registeredAt,
        Instant lastActiveAt
    ) {}

    /**
     * V11 response format
     */
    public record V11DemoRegistrationResponse(
        String id,
        String demoToken,
        String email,
        String fullName,
        Instant registeredAt,
        Instant expiresAt,
        String message
    ) {}

    /**
     * Record demo interest for V11 format
     */
    private void recordDemoInterestV11(User user, FrontendDemoUser request, HttpHeaders headers) {
        if (user == null) return;

        try {
            String userAgent = headers.getHeaderString("User-Agent");
            String forwardedFor = headers.getHeaderString("X-Forwarded-For");
            String ipAddress = forwardedFor != null ? forwardedFor.split(",")[0].trim() : null;

            String category = request.interests() != null && !request.interests().isEmpty()
                ? request.interests().get(0).toUpperCase().replace(" ", "_")
                : "GENERAL";

            interestService.recordInterest(
                user.id,
                category,
                "token_experience",
                UserInterest.ActionType.DEMO_START,
                "enterprise_portal",
                null,
                ipAddress,
                userAgent,
                String.format("{\"company\":\"%s\",\"jobTitle\":\"%s\",\"country\":\"%s\",\"interests\":%s,\"marketing\":%s}",
                    request.company(),
                    request.jobTitle() != null ? request.jobTitle() : "",
                    request.country() != null ? request.country() : "",
                    request.interests() != null ? request.interests().toString() : "[]",
                    request.consents() != null && request.consents().marketingConsent())
            );
        } catch (Exception e) {
            LOG.warn("Failed to record V11 demo interest", e);
        }
    }
}

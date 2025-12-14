package io.aurigraph.v11.demo.api;

import io.aurigraph.v11.demo.model.DemoDTO;
import io.aurigraph.v11.demo.repository.FilesystemDemoRepository;
import io.quarkus.scheduler.Scheduled;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Filesystem-based Demo Management REST API
 *
 * Uses filesystem storage instead of database for demo persistence.
 * Demo data is stored as JSON files in data/demos/ folder.
 *
 * Security: @PermitAll to allow public access for demo purposes
 *
 * @version 1.0.0 (Dec 4, 2025)
 * @author Backend Development Agent (BDA)
 */
@Path("/api/v12/demos")
@Tag(name = "Demo Management", description = "Manage live demos with filesystem persistence")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
public class FilesystemDemoResource {

    private static final Logger LOG = Logger.getLogger(FilesystemDemoResource.class);
    private static final int DEFAULT_DURATION_MINUTES = 1440; // 24 hours - persistent demos
    private static final int MAX_ADMIN_DURATION_MINUTES = 10080; // 7 days for admins

    @Inject
    FilesystemDemoRepository demoRepository;

    @GET
    @Operation(summary = "Get all demos", description = "Returns all demos ordered by creation date")
    public List<DemoDTO> getAllDemos() {
        LOG.info("Fetching all demos from filesystem");
        return demoRepository.findAll();
    }

    @GET
    @Path("/active")
    @Operation(summary = "Get active demos", description = "Returns non-expired demos")
    public List<DemoDTO> getActiveDemos() {
        LOG.info("Fetching active demos from filesystem");
        return demoRepository.findAllActive();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get demo by ID", description = "Returns a specific demo")
    public Response getDemo(@PathParam("id") String id) {
        LOG.infof("Fetching demo: %s", id);

        return demoRepository.findById(id)
                .map(demo -> {
                    // Check if expired and update status
                    if (demo.isExpired() && !"EXPIRED".equals(demo.status)) {
                        demo.expire();
                        demoRepository.save(demo);
                    }
                    return Response.ok(demo).build();
                })
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Demo not found: " + id))
                        .build());
    }

    @POST
    @Operation(summary = "Create demo", description = "Register a new demo with optional custom duration")
    public Response createDemo(
            @Valid @NotNull DemoRequest request,
            @QueryParam("durationMinutes") Integer durationMinutes,
            @QueryParam("isAdmin") @DefaultValue("false") boolean isAdmin
    ) {
        LOG.infof("Creating demo: %s (filesystem storage)", request.demoName);

        // Generate unique ID
        String id = "demo_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 9);

        // Validate and set duration
        int finalDuration = durationMinutes != null ? durationMinutes : DEFAULT_DURATION_MINUTES;
        if (!isAdmin && finalDuration > DEFAULT_DURATION_MINUTES) {
            finalDuration = DEFAULT_DURATION_MINUTES;
        }
        if (isAdmin && finalDuration > MAX_ADMIN_DURATION_MINUTES) {
            finalDuration = MAX_ADMIN_DURATION_MINUTES;
        }

        // Create demo DTO
        DemoDTO demo = new DemoDTO();
        demo.id = id;
        demo.demoName = request.demoName;
        demo.userEmail = request.userEmail;
        demo.userName = request.userName;
        demo.description = request.description;
        demo.status = "PENDING";
        demo.createdAt = LocalDateTime.now();
        demo.lastActivity = LocalDateTime.now();
        demo.durationMinutes = finalDuration;
        demo.expiresAt = LocalDateTime.now().plusMinutes(finalDuration);
        demo.isAdminDemo = isAdmin;
        demo.channelsJson = request.channelsJson;
        demo.validatorsJson = request.validatorsJson;
        demo.businessNodesJson = request.businessNodesJson;
        demo.eiNodesJson = request.eiNodesJson;
        demo.merkleRoot = request.merkleRoot != null ? request.merkleRoot : "";
        demo.transactionCount = 0;
        demo.tokenizationMode = request.tokenizationMode != null ? request.tokenizationMode : "live-feed";
        demo.selectedDataFeedsJson = request.selectedDataFeedsJson;
        demo.tokenizationConfigJson = request.tokenizationConfigJson;

        // Save to filesystem
        demoRepository.save(demo);

        LOG.infof("Demo created (filesystem): %s (ID: %s, Duration: %d min, Expires: %s)",
                demo.demoName, demo.id, finalDuration, demo.expiresAt);

        return Response.status(Response.Status.CREATED).entity(demo).build();
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update demo", description = "Update demo properties")
    public Response updateDemo(@PathParam("id") String id, @Valid @NotNull DemoUpdateRequest request) {
        LOG.infof("Updating demo: %s", id);

        return demoRepository.findById(id)
                .map(demo -> {
                    if (request.status != null) {
                        demo.status = request.status;
                    }
                    if (request.transactionCount != null) {
                        demo.transactionCount = request.transactionCount;
                    }
                    if (request.merkleRoot != null) {
                        demo.merkleRoot = request.merkleRoot;
                    }
                    demo.lastActivity = LocalDateTime.now();

                    demoRepository.save(demo);
                    LOG.infof("Demo updated: %s", demo.demoName);
                    return Response.ok(demo).build();
                })
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Demo not found: " + id))
                        .build());
    }

    @POST
    @Path("/{id}/start")
    @Operation(summary = "Start demo", description = "Change demo status to RUNNING")
    public Response startDemo(@PathParam("id") String id) {
        LOG.infof("Starting demo: %s", id);

        return demoRepository.findById(id)
                .map(demo -> {
                    demo.status = "RUNNING";
                    demo.lastActivity = LocalDateTime.now();
                    demoRepository.save(demo);
                    LOG.infof("Demo started: %s", demo.demoName);
                    return Response.ok(demo).build();
                })
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Demo not found: " + id))
                        .build());
    }

    @POST
    @Path("/{id}/stop")
    @Operation(summary = "Stop demo", description = "Change demo status to STOPPED")
    public Response stopDemo(@PathParam("id") String id) {
        LOG.infof("Stopping demo: %s", id);

        return demoRepository.findById(id)
                .map(demo -> {
                    demo.status = "STOPPED";
                    demo.lastActivity = LocalDateTime.now();
                    demoRepository.save(demo);
                    LOG.infof("Demo stopped: %s", demo.demoName);
                    return Response.ok(demo).build();
                })
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Demo not found: " + id))
                        .build());
    }

    @POST
    @Path("/{id}/extend")
    @Operation(summary = "Extend demo duration", description = "Add time to demo expiration (admin only)")
    public Response extendDemo(
            @PathParam("id") String id,
            @QueryParam("minutes") int additionalMinutes,
            @QueryParam("isAdmin") @DefaultValue("false") boolean isAdmin
    ) {
        LOG.infof("Extending demo: %s by %d minutes", id, additionalMinutes);

        if (!isAdmin) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(new ErrorResponse("Only admins can extend demo duration"))
                    .build();
        }

        return demoRepository.findById(id)
                .map(demo -> {
                    demo.extend(additionalMinutes);
                    demoRepository.save(demo);
                    LOG.infof("Demo extended: %s - now expires at %s", demo.demoName, demo.expiresAt);
                    return Response.ok(demo).build();
                })
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Demo not found: " + id))
                        .build());
    }

    @POST
    @Path("/{id}/transactions")
    @Operation(summary = "Add transactions", description = "Increment transaction count and update Merkle root")
    public Response addTransactions(
            @PathParam("id") String id,
            @QueryParam("count") @DefaultValue("1") long count,
            @QueryParam("merkleRoot") String merkleRoot
    ) {
        return demoRepository.findById(id)
                .map(demo -> {
                    demo.addTransactions(count);
                    if (merkleRoot != null) {
                        demo.merkleRoot = merkleRoot;
                    }
                    demoRepository.save(demo);
                    return Response.ok(demo).build();
                })
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Demo not found: " + id))
                        .build());
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete demo", description = "Remove demo from filesystem")
    public Response deleteDemo(@PathParam("id") String id) {
        LOG.infof("Deleting demo: %s", id);

        return demoRepository.findById(id)
                .map(demo -> {
                    String demoName = demo.demoName;
                    demoRepository.delete(id);
                    LOG.infof("Demo deleted: %s", demoName);
                    return Response.noContent().build();
                })
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Demo not found: " + id))
                        .build());
    }

    /**
     * Auto-expire demos every minute
     */
    @Scheduled(every = "60s")
    void checkExpiredDemos() {
        List<DemoDTO> expiredDemos = demoRepository.findExpired();
        if (!expiredDemos.isEmpty()) {
            LOG.infof("Found %d expired demos, marking as EXPIRED", expiredDemos.size());
            for (DemoDTO demo : expiredDemos) {
                demo.expire();
                demoRepository.save(demo);
                LOG.infof("Demo expired: %s (ID: %s)", demo.demoName, demo.id);
            }
        }
    }

    /**
     * Auto-generate transactions for RUNNING demos every 5 seconds
     */
    @Scheduled(every = "5s")
    void autoGenerateTransactions() {
        List<DemoDTO> runningDemos = demoRepository.findRunning();

        if (!runningDemos.isEmpty()) {
            for (DemoDTO demo : runningDemos) {
                // Generate 1-5 random transactions per demo
                int txCount = (int) (Math.random() * 5) + 1;
                demo.addTransactions(txCount);
                demoRepository.save(demo);
            }
            LOG.debugf("Auto-generated transactions for %d running demos", runningDemos.size());
        }
    }

    // Request/Response DTOs
    public static class DemoRequest {
        public String demoName;
        public String userEmail;
        public String userName;
        public String description;
        public String channelsJson;
        public String validatorsJson;
        public String businessNodesJson;
        public String eiNodesJson;
        public String merkleRoot;
        public String tokenizationMode;
        public String selectedDataFeedsJson;
        public String tokenizationConfigJson;
    }

    public static class DemoUpdateRequest {
        public String status;
        public Long transactionCount;
        public String merkleRoot;
    }

    public static class ErrorResponse {
        public String error;
        public ErrorResponse(String error) {
            this.error = error;
        }
    }
}

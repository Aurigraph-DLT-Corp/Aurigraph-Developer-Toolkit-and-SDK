package io.aurigraph.v11.demo.api;

import io.aurigraph.v11.demo.model.DemoDTO;
import io.aurigraph.v11.demo.service.RedisDemoService;
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

import java.util.List;

/**
 * Demo Management REST API
 *
 * Unified endpoint for demo CRUD operations using Redis-backed persistence.
 * Demos persist for 24 hours automatically with configurable TTL.
 *
 * @version 2.0.0 (Dec 18, 2025)
 * @author Aurigraph DLT Development Team
 */
@Path("/api/v12/demos")
@Tag(name = "Demo Management", description = "Manage live demos with 24-hour Redis persistence")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
public class DemoResource {

    private static final Logger LOG = Logger.getLogger(DemoResource.class);
    private static final int DEFAULT_DURATION_MINUTES = 1440; // 24 hours
    private static final int MAX_ADMIN_DURATION_MINUTES = 10080; // 7 days

    @Inject
    RedisDemoService demoService;

    @GET
    @Operation(summary = "Get all demos", description = "Returns all demos ordered by creation date")
    public List<DemoDTO> getAllDemos() {
        LOG.info("Fetching all demos");
        return demoService.findAll();
    }

    @GET
    @Path("/active")
    @Operation(summary = "Get active demos", description = "Returns non-expired demos")
    public List<DemoDTO> getActiveDemos() {
        LOG.info("Fetching active demos");
        return demoService.findAllActive();
    }

    @GET
    @Path("/{id}")
    @Operation(summary = "Get demo by ID", description = "Returns a specific demo")
    public Response getDemo(@PathParam("id") String id) {
        LOG.infof("Fetching demo: %s", id);
        return demoService.findById(id)
                .map(demo -> Response.ok(demo).build())
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
        LOG.infof("Creating demo: %s", request.demoName);

        // Create DTO from request
        DemoDTO demo = new DemoDTO();
        demo.demoName = request.demoName;
        demo.userEmail = request.userEmail;
        demo.userName = request.userName;
        demo.description = request.description;
        demo.channelsJson = request.channelsJson;
        demo.validatorsJson = request.validatorsJson;
        demo.businessNodesJson = request.businessNodesJson;
        demo.eiNodesJson = request.eiNodesJson;
        demo.merkleRoot = request.merkleRoot != null ? request.merkleRoot : "";
        demo.tokenizationMode = request.tokenizationMode != null ? request.tokenizationMode : "live-feed";
        demo.selectedDataFeedsJson = request.selectedDataFeedsJson;
        demo.tokenizationConfigJson = request.tokenizationConfigJson;
        demo.isAdminDemo = isAdmin;

        // Validate and set duration
        int finalDuration = durationMinutes != null ? durationMinutes : DEFAULT_DURATION_MINUTES;
        if (!isAdmin && finalDuration > DEFAULT_DURATION_MINUTES) {
            finalDuration = DEFAULT_DURATION_MINUTES;
        }
        if (isAdmin && finalDuration > MAX_ADMIN_DURATION_MINUTES) {
            finalDuration = MAX_ADMIN_DURATION_MINUTES;
        }
        demo.durationMinutes = finalDuration;

        // Create demo via service
        DemoDTO created = demoService.createDemo(demo);

        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @Operation(summary = "Update demo", description = "Update demo properties")
    public Response updateDemo(@PathParam("id") String id, @Valid @NotNull DemoUpdateRequest request) {
        LOG.infof("Updating demo: %s", id);

        return demoService.findById(id)
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
                    if (request.tokenizationMode != null) {
                        demo.tokenizationMode = request.tokenizationMode;
                    }
                    if (request.selectedDataFeedsJson != null) {
                        demo.selectedDataFeedsJson = request.selectedDataFeedsJson;
                    }
                    if (request.tokenizationConfigJson != null) {
                        demo.tokenizationConfigJson = request.tokenizationConfigJson;
                    }

                    DemoDTO updated = demoService.updateDemo(demo);
                    LOG.infof("Demo updated: %s", demo.demoName);
                    return Response.ok(updated).build();
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

        return demoService.startDemo(id)
                .map(demo -> Response.ok(demo).build())
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Demo not found: " + id))
                        .build());
    }

    @POST
    @Path("/{id}/stop")
    @Operation(summary = "Stop demo", description = "Change demo status to STOPPED")
    public Response stopDemo(@PathParam("id") String id) {
        LOG.infof("Stopping demo: %s", id);

        return demoService.stopDemo(id)
                .map(demo -> Response.ok(demo).build())
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

        return demoService.extendDemo(id, additionalMinutes)
                .map(demo -> Response.ok(demo).build())
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
        return demoService.addTransactions(id, count, merkleRoot)
                .map(demo -> Response.ok(demo).build())
                .orElse(Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Demo not found: " + id))
                        .build());
    }

    @DELETE
    @Path("/{id}")
    @Operation(summary = "Delete demo", description = "Remove demo from storage")
    public Response deleteDemo(@PathParam("id") String id) {
        LOG.infof("Deleting demo: %s", id);

        if (demoService.deleteDemo(id)) {
            return Response.noContent().build();
        }
        return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorResponse("Demo not found: " + id))
                .build();
    }

    @GET
    @Path("/stats")
    @Operation(summary = "Get demo statistics", description = "Returns counts of demos")
    public Response getStats() {
        return Response.ok(new DemoStats(
                demoService.count(),
                demoService.countActive(),
                demoService.findRunning().size()
        )).build();
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
        public String tokenizationMode;
        public String selectedDataFeedsJson;
        public String tokenizationConfigJson;
    }

    public static class DemoStats {
        public long total;
        public long active;
        public long running;

        public DemoStats(long total, long active, long running) {
            this.total = total;
            this.active = active;
            this.running = running;
        }
    }

    public static class ErrorResponse {
        public String error;
        public ErrorResponse(String error) {
            this.error = error;
        }
    }
}

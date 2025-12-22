package io.aurigraph.v11.api;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Platform Status API Resource
 * 
 * Provides system status and health information for the dashboard.
 * 
 * @author Aurigraph DLT Platform
 * @version 12.0.0
 * @since December 22, 2025
 */
@Path("/api/v11/status")
@Tag(name = "Platform Status", description = "Platform status and health endpoints")
@Produces(MediaType.APPLICATION_JSON)
public class PlatformStatusResource {

    @GET
    @Operation(summary = "Get platform status", description = "Returns current platform status and version information")
    @APIResponse(responseCode = "200", description = "Status retrieved successfully")
    public Response getPlatformStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "OPERATIONAL");
        status.put("version", "12.0.0");
        status.put("environment", "production");
        status.put("timestamp", Instant.now().toString());
        status.put("uptime", "running");
        status.put("services", Map.of(
                "blockchain", "healthy",
                "consensus", "healthy",
                "storage", "healthy",
                "api", "healthy"));

        return Response.ok(status).build();
    }
}

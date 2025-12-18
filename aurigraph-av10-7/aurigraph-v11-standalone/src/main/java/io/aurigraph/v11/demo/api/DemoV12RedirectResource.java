package io.aurigraph.v11.demo.api;

import jakarta.annotation.security.PermitAll;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.net.URI;

/**
 * V12 Demo API Redirect
 *
 * Redirects all /api/v12/demos requests to /api/v11/demos for backward compatibility.
 * This endpoint will be removed in a future release.
 *
 * @version 1.0.0 (Dec 18, 2025)
 * @deprecated Use /api/v11/demos instead
 */
@Path("/api/v12/demos")
@Tag(name = "Demo Management (Deprecated)", description = "Redirects to /api/v11/demos - use v11 endpoint directly")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@PermitAll
@Deprecated
public class DemoV12RedirectResource {

    @GET
    @Operation(summary = "Redirects to v11", description = "Redirects to /api/v11/demos")
    public Response getAllDemos() {
        return Response.status(Response.Status.MOVED_PERMANENTLY)
                .location(URI.create("/api/v11/demos"))
                .header("X-Deprecated", "Use /api/v11/demos instead")
                .build();
    }

    @GET
    @Path("/{path:.*}")
    @Operation(summary = "Redirects to v11", description = "Redirects all paths to /api/v11/demos")
    public Response redirectPath(@PathParam("path") String path) {
        return Response.status(Response.Status.MOVED_PERMANENTLY)
                .location(URI.create("/api/v11/demos/" + path))
                .header("X-Deprecated", "Use /api/v11/demos instead")
                .build();
    }

    @POST
    @Operation(summary = "Redirects to v11", description = "Redirects POST to /api/v11/demos")
    public Response createDemo(String body) {
        return Response.status(Response.Status.TEMPORARY_REDIRECT)
                .location(URI.create("/api/v11/demos"))
                .header("X-Deprecated", "Use /api/v11/demos instead")
                .build();
    }
}

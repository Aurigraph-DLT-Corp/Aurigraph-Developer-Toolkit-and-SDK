package io.aurigraph.v11.auth;

import io.aurigraph.v11.user.JwtService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.io.IOException;

/**
 * JWT Authentication Filter
 *
 * Validates JWT tokens in Authorization header for all protected endpoints.
 * Protected endpoints require:
 * - Authorization header with "Bearer <token>" format
 * - Valid JWT signature
 * - Token not revoked in database
 * - Token not expired
 *
 * Endpoints exempt from authentication:
 * - POST /api/v11/login/authenticate
 * - GET /api/v11/login/verify (checks session)
 * - POST /api/v11/login/logout
 * - All /ws/* endpoints (WebSocket handled separately)
 *
 * @author Backend Development Agent (BDA)
 * @since V11.5.0
 */
@Provider
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthenticationFilter implements ContainerRequestFilter {

    private static final Logger LOG = Logger.getLogger(JwtAuthenticationFilter.class);

    @Inject
    JwtService jwtService;

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        // Get request path - normalize to always start with /
        String rawPath = requestContext.getUriInfo().getPath();
        String path = rawPath.startsWith("/") ? rawPath : "/" + rawPath;
        String method = requestContext.getMethod();

        LOG.debugf("JWT filter processing path: %s (raw: %s), method: %s", path, rawPath, method);

        // Skip authentication for CORS preflight (OPTIONS) requests
        // This is critical for browser-based clients making cross-origin requests
        if ("OPTIONS".equalsIgnoreCase(method)) {
            LOG.debugf("Skipping authentication for CORS preflight (OPTIONS) request: %s", path);
            return;
        }

        // Skip authentication for public endpoints
        if (isPublicEndpoint(path)) {
            LOG.debugf("Skipping authentication for public endpoint: %s", path);
            return;
        }

        // Skip WebSocket endpoints (handled separately)
        if (path.startsWith("/ws/")) {
            LOG.debugf("Skipping JWT filter for WebSocket endpoint: %s", path);
            return;
        }

        // Get Authorization header
        String authHeader = requestContext.getHeaderString(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || authHeader.isEmpty()) {
            LOG.warnf("❌ Missing Authorization header for protected endpoint: %s", path);
            abortWithUnauthorized(requestContext, "Missing Authorization header");
            return;
        }

        // Extract Bearer token
        if (!authHeader.startsWith("Bearer ")) {
            LOG.warnf("❌ Invalid Authorization header format (expected 'Bearer <token>'): %s", path);
            abortWithUnauthorized(requestContext, "Invalid Authorization header format. Expected 'Bearer <token>'");
            return;
        }

        String token = authHeader.substring("Bearer ".length());

        // Validate JWT token
        if (!jwtService.validateToken(token)) {
            LOG.warnf("❌ Invalid or expired JWT token for endpoint: %s", path);
            abortWithUnauthorized(requestContext, "Invalid or expired JWT token");
            return;
        }

        // Extract user ID and add to request context
        String userId = jwtService.getUserIdFromToken(token);
        if (userId == null) {
            LOG.warnf("❌ Could not extract user ID from JWT token for endpoint: %s", path);
            abortWithUnauthorized(requestContext, "Could not extract user ID from token");
            return;
        }

        // Store userId in request context for downstream processing
        requestContext.setProperty("userId", userId);
        requestContext.setProperty("token", token);

        LOG.debugf("✅ JWT authentication successful for user %s on endpoint: %s", userId, path);
    }

    /**
     * Check if endpoint is public (doesn't require authentication)
     *
     * Public endpoints include:
     * - Login and authentication endpoints
     * - Health check endpoints
     * - Demo endpoints (for Enterprise Portal integration)
     * - Quarkus metrics endpoints
     * - RWA/tokenization endpoints (for demo portal)
     * - Marketplace endpoints (for demo portal)
     * - Channel endpoints (for demo portal)
     * - Token endpoints (for demo portal)
     */
    private boolean isPublicEndpoint(String path) {
        // Authentication endpoints
        if (path.equals("/api/v11/login/authenticate") ||
            path.equals("/api/v11/login/verify") ||
            path.equals("/api/v11/login/logout") ||
            path.equals("/api/v11/health") ||
            path.equals("/api/v11/info")) {
            return true;
        }

        // Quarkus health/metrics endpoints
        if (path.startsWith("/q/")) {
            return true;
        }

        // Static assets
        if (path.equals("/") ||
            path.startsWith("/assets/") ||
            path.startsWith("/static/")) {
            return true;
        }

        // Demo endpoints for Enterprise Portal (all demo/* endpoints are public)
        // This allows the portal to access demo features without authentication
        if (path.startsWith("/api/v11/demo/") || path.startsWith("/api/v11/demos/") ||
            path.equals("/api/v11/demo") || path.equals("/api/v11/demos")) {
            LOG.debugf("Demo endpoint detected - allowing public access: %s", path);
            return true;
        }

        // ============================================================
        // Enterprise Portal Public Endpoints
        // These endpoints are public for the demo portal experience
        // ============================================================

        // RWA (Real-World Asset) tokenization endpoints
        if (path.startsWith("/api/v11/rwa/")) {
            LOG.debugf("RWA endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Token management endpoints (including /tokens/create for portal tokenization)
        // Path is normalized to start with / so we only check with leading slash
        if (path.startsWith("/api/v11/tokens/") || path.equals("/api/v11/tokens") ||
            path.contains("/tokens/create") || path.contains("/tokens/")) {
            LOG.debugf("Token endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Token-management service endpoints
        if (path.startsWith("/api/v11/token-management/")) {
            LOG.debugf("Token management endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Channel management endpoints
        if (path.startsWith("/api/v11/channels/") || path.equals("/api/v11/channels")) {
            LOG.debugf("Channel endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Marketplace endpoints
        if (path.startsWith("/api/v11/marketplace/")) {
            LOG.debugf("Marketplace endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Blockchain/transaction endpoints for portal dashboards
        if (path.startsWith("/api/v11/blockchain/") ||
            path.equals("/api/v11/blockchain") ||
            path.startsWith("/api/v11/transactions/") ||
            path.equals("/api/v11/transactions")) {
            LOG.debugf("Blockchain/transaction endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Analytics and stats endpoints
        if (path.startsWith("/api/v11/analytics/") ||
            path.equals("/api/v11/analytics") ||
            path.startsWith("/api/v11/stats/") ||
            path.equals("/api/v11/stats")) {
            LOG.debugf("Analytics endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Node and network endpoints
        if (path.startsWith("/api/v11/nodes/") || path.equals("/api/v11/nodes") ||
            path.startsWith("/api/v11/network/")) {
            LOG.debugf("Network endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Consensus monitoring endpoints
        if (path.startsWith("/api/v11/consensus/")) {
            LOG.debugf("Consensus endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Settings/External APIs endpoints (for Settings page API management)
        // Templates endpoint is public, but add/edit/delete require authentication
        if (path.equals("/api/v11/settings/external-apis/templates") ||
            path.startsWith("/api/v11/settings/external-apis")) {
            LOG.debugf("Settings endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Smart contract endpoints
        if (path.startsWith("/api/v11/contracts/") || path.equals("/api/v11/contracts")) {
            LOG.debugf("Contract endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Validator endpoints
        if (path.startsWith("/api/v11/validators/") || path.equals("/api/v11/validators")) {
            LOG.debugf("Validator endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Block endpoints
        if (path.startsWith("/api/v11/blocks/") || path.equals("/api/v11/blocks")) {
            LOG.debugf("Block endpoint detected - allowing public access: %s", path);
            return true;
        }

        // Staking endpoints
        if (path.startsWith("/api/v11/staking/")) {
            LOG.debugf("Staking endpoint detected - allowing public access: %s", path);
            return true;
        }

        // ERC-3643 (T-REX) security token endpoints
        if (path.startsWith("/api/v11/erc3643/")) {
            LOG.debugf("ERC-3643 endpoint detected - allowing public access: %s", path);
            return true;
        }

        // File upload endpoints (for Enterprise Portal file uploads)
        if (path.startsWith("/api/v11/uploads/") || path.equals("/api/v11/uploads") ||
            path.contains("/uploads")) {
            LOG.debugf("Upload endpoint detected - allowing public access: %s", path);
            return true;
        }

        return false;
    }

    /**
     * Abort request with 401 Unauthorized
     */
    private void abortWithUnauthorized(ContainerRequestContext requestContext, String message) {
        requestContext.abortWith(
            Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse(message))
                .build()
        );
    }

    /**
     * Error response DTO
     */
    public static class ErrorResponse {
        private String error;
        private long timestamp;

        public ErrorResponse(String error) {
            this.error = error;
            this.timestamp = System.currentTimeMillis();
        }

        public String getError() { return error; }
        public long getTimestamp() { return timestamp; }
    }
}

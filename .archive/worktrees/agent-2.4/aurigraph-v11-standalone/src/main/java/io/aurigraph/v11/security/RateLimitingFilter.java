package io.aurigraph.v11.security;

import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.net.URI;

/**
 * Rate Limiting Filter for Aurigraph V11
 * 
 * Automatically applies rate limiting to all incoming requests to prevent
 * abuse and ensure fair resource usage. Works in conjunction with
 * SecurityConfiguration to provide DDoS protection.
 * 
 * Features:
 * - Per-IP rate limiting
 * - Per-endpoint rate limiting
 * - Burst capacity handling
 * - Automatic IP blacklisting for excessive requests
 * - Request size validation
 */
@Provider
public class RateLimitingFilter implements ContainerRequestFilter {
    
    private static final Logger LOG = Logger.getLogger(RateLimitingFilter.class);
    
    @Inject
    SecurityConfiguration securityConfiguration;
    
    @Override
    public void filter(ContainerRequestContext requestContext) {
        try {
            // Extract client IP address
            String clientIP = getClientIP(requestContext);
            String endpoint = requestContext.getUriInfo().getPath();
            
            // Validate request size
            String contentLengthHeader = requestContext.getHeaderString("Content-Length");
            if (contentLengthHeader != null) {
                try {
                    long contentLength = Long.parseLong(contentLengthHeader);
                    if (!securityConfiguration.validateRequestSize(contentLength)) {
                        abortRequest(requestContext, "Request size too large", 
                                   Response.Status.BAD_REQUEST);
                        return;
                    }
                } catch (NumberFormatException e) {
                    LOG.debug("Invalid Content-Length header: " + contentLengthHeader);
                }
            }
            
            // Apply rate limiting
            if (securityConfiguration.isRateLimited(clientIP, endpoint)) {
                LOG.debug("Rate limiting applied to IP: " + clientIP + " for endpoint: " + endpoint);
                abortRequest(requestContext, "Rate limit exceeded", 
                           Response.Status.TOO_MANY_REQUESTS);
                return;
            }
            
            // Request is allowed to proceed
            LOG.debug("Request allowed from IP: " + clientIP + " to endpoint: " + endpoint);
            
        } catch (Exception e) {
            LOG.error("Error in rate limiting filter", e);
            // In case of error, allow the request to proceed rather than fail
            // This ensures availability even if security components have issues
        }
    }
    
    /**
     * Extract client IP address from request headers
     */
    private String getClientIP(ContainerRequestContext requestContext) {
        // Check X-Forwarded-For header first (for load balancers/proxies)
        String xForwardedFor = requestContext.getHeaderString("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            // Take the first IP in the chain (original client)
            String[] ips = xForwardedFor.split(",");
            String clientIP = ips[0].trim();
            if (isValidIPAddress(clientIP)) {
                return clientIP;
            }
        }
        
        // Check X-Real-IP header
        String xRealIP = requestContext.getHeaderString("X-Real-IP");
        if (xRealIP != null && !xRealIP.trim().isEmpty() && isValidIPAddress(xRealIP)) {
            return xRealIP;
        }
        
        // Fallback to request URI host (may not be actual client IP in proxied environments)
        URI requestUri = requestContext.getUriInfo().getRequestUri();
        if (requestUri != null && requestUri.getHost() != null) {
            return requestUri.getHost();
        }
        
        // Final fallback
        return "unknown";
    }
    
    /**
     * Basic IP address validation
     */
    private boolean isValidIPAddress(String ip) {
        if (ip == null || ip.trim().isEmpty()) {
            return false;
        }
        
        // Basic IPv4 validation
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            try {
                for (String part : parts) {
                    int num = Integer.parseInt(part);
                    if (num < 0 || num > 255) {
                        return false;
                    }
                }
                return true;
            } catch (NumberFormatException e) {
                return false;
            }
        }
        
        // Basic IPv6 validation (simplified)
        if (ip.contains(":")) {
            return ip.split(":").length <= 8; // Very basic check
        }
        
        return false;
    }
    
    /**
     * Abort request with specific error response
     */
    private void abortRequest(ContainerRequestContext requestContext, String message, Response.Status status) {
        Response response = Response.status(status)
                .entity(new ErrorResponse(status.getStatusCode(), message, System.currentTimeMillis()))
                .header("Content-Type", "application/json")
                .header("X-Aurigraph-Security", "request-blocked")
                .build();
        
        requestContext.abortWith(response);
    }
    
    /**
     * Error response structure for blocked requests
     */
    public static class ErrorResponse {
        public final int status;
        public final String message;
        public final long timestamp;
        public final String error;
        
        public ErrorResponse(int status, String message, long timestamp) {
            this.status = status;
            this.message = message;
            this.timestamp = timestamp;
            this.error = status == 429 ? "Too Many Requests" : "Bad Request";
        }
        
        // Getters for JSON serialization
        public int getStatus() { return status; }
        public String getMessage() { return message; }
        public long getTimestamp() { return timestamp; }
        public String getError() { return error; }
    }
}
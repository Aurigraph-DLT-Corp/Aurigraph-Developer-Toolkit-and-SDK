package io.aurigraph.v11.security;

import jakarta.inject.Inject;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

import java.util.Map;

/**
 * Security Headers Filter for Aurigraph V11
 * 
 * Automatically applies security headers to all HTTP responses to enhance
 * security posture and prevent common web vulnerabilities.
 * 
 * Applied Headers:
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - X-XSS-Protection: 1; mode=block
 * - Strict-Transport-Security: HSTS for HTTPS
 * - Content-Security-Policy: CSP for XSS prevention
 * - Referrer-Policy: Control referrer information
 * - Permissions-Policy: Control browser features
 */
@Provider
public class SecurityHeadersFilter implements ContainerResponseFilter {
    
    private static final Logger LOG = Logger.getLogger(SecurityHeadersFilter.class);
    
    @Inject
    SecurityConfiguration securityConfiguration;
    
    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        try {
            // Get security headers from configuration
            Map<String, String> securityHeaders = securityConfiguration.getSecurityHeaders();
            
            // Apply all security headers to the response
            for (Map.Entry<String, String> header : securityHeaders.entrySet()) {
                responseContext.getHeaders().add(header.getKey(), header.getValue());
            }
            
            // Add custom Aurigraph security header
            responseContext.getHeaders().add("X-Aurigraph-Security", "quantum-resistant-v11");
            responseContext.getHeaders().add("X-Powered-By", "Aurigraph-V11-Quantum");
            
            LOG.debug("Applied security headers to response for: " + requestContext.getUriInfo().getPath());
            
        } catch (Exception e) {
            LOG.error("Error applying security headers", e);
            // Don't fail the request due to security header issues
        }
    }
}
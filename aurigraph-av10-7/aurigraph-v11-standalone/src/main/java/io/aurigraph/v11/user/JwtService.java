package io.aurigraph.v11.user;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JwtService - JWT token generation and validation
 *
 * Generates signed JWT tokens for authenticated users.
 * Uses HMAC-SHA256 for token signing.
 *
 * @author Backend Development Agent (BDA)
 * @since V11.4.0
 */
@ApplicationScoped
public class JwtService {

    private static final Logger LOG = Logger.getLogger(JwtService.class);

    // Secret key for signing (minimum 256 bits for HMAC-SHA256)
    private static final String SECRET_KEY = "aurigraph-v11-secret-key-minimum-256-bits-for-hmac-sha256-security";

    // Token expiration: 24 hours
    private static final long TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000;

    /**
     * Generate JWT token for authenticated user
     */
    public String generateToken(User user) {
        try {
            long now = System.currentTimeMillis();
            Date expiryDate = new Date(now + TOKEN_EXPIRATION_MS);

            String token = Jwts.builder()
                .setSubject(user.id.toString())
                .claim("username", user.username)
                .claim("email", user.email)
                .claim("role", user.role.name)
                .claim("status", user.status.toString())
                .setIssuedAt(new Date(now))
                .setExpiration(expiryDate)
                .signWith(
                    Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8)),
                    SignatureAlgorithm.HS256
                )
                .compact();

            LOG.infof("JWT token generated for user: %s (expires in 24 hours)", user.username);
            return token;
        } catch (Exception e) {
            LOG.errorf("Error generating JWT token for user %s: %s", user.username, e.getMessage());
            throw new RuntimeException("Failed to generate JWT token", e);
        }
    }

    /**
     * Validate JWT token
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            LOG.debugf("Invalid JWT token: %s", e.getMessage());
            return false;
        }
    }

    /**
     * Extract user ID from JWT token
     */
    public String getUserIdFromToken(String token) {
        try {
            return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
        } catch (JwtException e) {
            LOG.debugf("Error extracting user ID from token: %s", e.getMessage());
            return null;
        }
    }
}

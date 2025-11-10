package io.aurigraph.v11.auth;

import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.inject.Inject;
import io.aurigraph.v11.user.User;
import io.aurigraph.v11.session.SessionService;
import org.jboss.logging.Logger;
import io.quarkus.elytron.security.common.BcryptUtil;

import java.util.*;

/**
 * User Authentication Resource
 *
 * Provides authentication endpoints for the enterprise portal.
 * This resource bridges the frontend expectations (/api/v11/users/authenticate)
 * with the existing LoginResource implementation.
 *
 * Endpoints:
 * - POST /api/v11/users/authenticate - Authenticate user and return session
 * - GET /api/v11/users/me - Get current user info
 * - POST /api/v11/users/logout - Logout user
 */
@Path("/api/v11/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserAuthenticationResource {
    private static final Logger LOG = Logger.getLogger(UserAuthenticationResource.class);

    @Inject
    SessionService sessionService;

    /**
     * Authenticate user with credentials
     *
     * @param request Authentication request containing username and password
     * @return Authentication response with session ID and user info
     */
    @POST
    @Path("/authenticate")
    public Response authenticate(AuthenticationRequest request) {
        try {
            // Validate input
            if (request.getUsername() == null || request.getUsername().isBlank() ||
                request.getPassword() == null || request.getPassword().isBlank()) {
                LOG.warn("Authentication failed: Missing username or password");
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Username and password are required"))
                    .build();
            }

            LOG.debugf("Authentication attempt for username: %s", request.getUsername());

            // Query user from database
            User user = User.findByUsername(request.getUsername());
            if (user == null) {
                LOG.warnf("Authentication failed: User not found - %s", request.getUsername());
                return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse("Invalid credentials"))
                    .build();
            }

            LOG.debugf("User found: %s (email: %s)", user.username, user.email);

            // Verify password using BCrypt
            boolean passwordMatches = BcryptUtil.matches(request.getPassword(), user.passwordHash);
            LOG.debugf("Password verification result: %b", passwordMatches);

            if (!passwordMatches) {
                LOG.warnf("Authentication failed: Invalid password for user - %s", request.getUsername());
                return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse("Invalid credentials"))
                    .build();
            }

            // Create session
            Map<String, Object> userData = new HashMap<>();
            userData.put("userId", user.id);
            userData.put("username", user.username);
            userData.put("email", user.email);
            userData.put("role", user.role != null ? user.role.name : "USER");

            String sessionId = sessionService.createSession(request.getUsername(), userData);
            LOG.infof("Authentication successful: %s (Session: %s)", request.getUsername(), sessionId);

            // Return authentication response with user info
            AuthenticationResponse response = new AuthenticationResponse(
                sessionId,
                user.id.toString(),
                request.getUsername(),
                user.email,
                user.role != null ? user.role.name : "USER",
                true,
                "Authentication successful"
            );

            return Response.ok(response)
                .header("Set-Cookie", "session_id=" + sessionId + "; Path=/; HttpOnly; Max-Age=28800; SameSite=Strict")
                .header("X-Session-Id", sessionId)
                .build();

        } catch (Exception e) {
            LOG.errorf(e, "Authentication error");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Authentication failed: " + e.getMessage()))
                .build();
        }
    }

    /**
     * Get current authenticated user info
     *
     * @param sessionId Session ID from cookie
     * @return User information
     */
    @GET
    @Path("/me")
    public Response getCurrentUser(@CookieParam("session_id") String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            LOG.warn("Get current user failed: No session ID");
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("No session"))
                .build();
        }

        SessionService.SessionData session = sessionService.getSession(sessionId);
        if (session == null) {
            LOG.warnf("Get current user failed: Invalid session - %s", sessionId);
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("Invalid or expired session"))
                .build();
        }

        User user = User.findByUsername(session.getUsername());
        if (user == null) {
            LOG.warnf("Get current user failed: User not found - %s", session.getUsername());
            return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorResponse("User not found"))
                .build();
        }

        CurrentUserResponse response = new CurrentUserResponse(
            user.id.toString(),
            user.username,
            user.email,
            user.role != null ? user.role.name : "USER",
            session.getUserData()
        );

        return Response.ok(response).build();
    }

    /**
     * Logout user and invalidate session
     *
     * @param sessionId Session ID from cookie
     * @return Logout response
     */
    @POST
    @Path("/logout")
    public Response logout(@CookieParam("session_id") String sessionId) {
        try {
            if (sessionId != null && !sessionId.isBlank()) {
                sessionService.invalidateSession(sessionId);
                LOG.infof("User logged out successfully (Session: %s)", sessionId);
            }

            SuccessResponse response = new SuccessResponse("Logged out successfully");
            return Response.ok(response)
                .header("Set-Cookie", "session_id=; Path=/; Max-Age=0; HttpOnly")
                .build();
        } catch (Exception e) {
            LOG.errorf(e, "Logout error");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Logout failed: " + e.getMessage()))
                .build();
        }
    }

    /**
     * Verify session validity
     *
     * @param sessionId Session ID from cookie
     * @return Session validity response
     */
    @GET
    @Path("/verify-session")
    public Response verifySession(@CookieParam("session_id") String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            LOG.debug("Session verification failed: No session ID");
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("No session"))
                .build();
        }

        SessionService.SessionData session = sessionService.getSession(sessionId);
        if (session == null) {
            LOG.warnf("Session verification failed: Invalid session - %s", sessionId);
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("Invalid or expired session"))
                .build();
        }

        VerifySessionResponse response = new VerifySessionResponse(
            sessionId,
            session.getUsername(),
            true,
            "Session is valid"
        );

        return Response.ok(response).build();
    }

    // ========== DTOs ==========

    /**
     * Authentication request DTO
     */
    public static class AuthenticationRequest {
        private String username;
        private String password;

        public AuthenticationRequest() {}

        public AuthenticationRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    /**
     * Authentication response DTO with user info
     */
    public static class AuthenticationResponse {
        private String sessionId;
        private String userId;
        private String username;
        private String email;
        private String role;
        private boolean success;
        private String message;

        public AuthenticationResponse(String sessionId, String userId, String username,
                                     String email, String role, boolean success, String message) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.role = role;
            this.success = success;
            this.message = message;
        }

        public String getSessionId() { return sessionId; }
        public String getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }

    /**
     * Current user response DTO
     */
    public static class CurrentUserResponse {
        private String id;
        private String username;
        private String email;
        private String role;
        private Map<String, Object> userData;

        public CurrentUserResponse(String id, String username, String email, String role, Map<String, Object> userData) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.role = role;
            this.userData = userData;
        }

        public String getId() { return id; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public Map<String, Object> getUserData() { return userData; }
    }

    /**
     * Verify session response DTO
     */
    public static class VerifySessionResponse {
        private String sessionId;
        private String username;
        private boolean valid;
        private String message;

        public VerifySessionResponse(String sessionId, String username, boolean valid, String message) {
            this.sessionId = sessionId;
            this.username = username;
            this.valid = valid;
            this.message = message;
        }

        public String getSessionId() { return sessionId; }
        public String getUsername() { return username; }
        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
    }

    /**
     * Error response DTO
     */
    public static class ErrorResponse {
        private String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() { return error; }
    }

    /**
     * Success response DTO
     */
    public static class SuccessResponse {
        private String message;

        public SuccessResponse(String message) {
            this.message = message;
        }

        public String getMessage() { return message; }
    }
}

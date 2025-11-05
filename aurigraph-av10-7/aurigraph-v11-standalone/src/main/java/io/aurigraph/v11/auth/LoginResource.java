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

@Path("/api/v11/login")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class LoginResource {
    private static final Logger LOG = Logger.getLogger(LoginResource.class);

    @Inject
    SessionService sessionService;

    @POST
    @Path("/authenticate")
    public Response authenticate(LoginRequest request) {
        try {
            // Validate input
            if (request.getUsername() == null || request.getUsername().isBlank() ||
                request.getPassword() == null || request.getPassword().isBlank()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Username and password are required"))
                    .build();
            }

            LOG.debugf("Login attempt for username: %s", request.getUsername());

            // Query user from database using Panache
            User user = User.findByUsername(request.getUsername());
            if (user == null) {
                LOG.warnf("Login failed: User not found - %s", request.getUsername());
                LOG.debugf("Available users in database:");
                long totalUsers = User.count();
                LOG.debugf("Total users in database: %d", totalUsers);
                return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse("Invalid credentials"))
                    .build();
            }

            LOG.debugf("User found: %s (email: %s, hash: %s)", user.username, user.email,
                user.passwordHash != null ? user.passwordHash.substring(0, Math.min(20, user.passwordHash.length())) + "..." : "NULL");

            // Verify password using BCrypt
            boolean passwordMatches = BcryptUtil.matches(request.getPassword(), user.passwordHash);
            LOG.debugf("Password match result: %b", passwordMatches);

            if (!passwordMatches) {
                LOG.warnf("Login failed: Invalid password for user - %s", request.getUsername());
                return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse("Invalid credentials"))
                    .build();
            }

            // Create session
            Map<String, Object> userData = new HashMap<>();
            userData.put("userId", user.id);
            userData.put("email", user.email);
            userData.put("role", user.role != null ? user.role.name : "USER");

            String sessionId = sessionService.createSession(request.getUsername(), userData);

            LOG.infof("Login successful: %s (Session: %s)", request.getUsername(), sessionId);

            // Return response with session cookie
            LoginResponse response = new LoginResponse(
                sessionId,
                request.getUsername(),
                true,
                "Login successful"
            );

            return Response.ok(response)
                .header("Set-Cookie", "session_id=" + sessionId + "; Path=/; HttpOnly; Max-Age=28800")
                .build();

        } catch (Exception e) {
            LOG.errorf(e, "Login error for user %s", request.getUsername());
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse("Login failed: " + e.getMessage()))
                .build();
        }
    }

    @GET
    @Path("/verify")
    public Response verifySession(@CookieParam("session_id") String sessionId) {
        if (sessionId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("No session"))
                .build();
        }

        SessionService.SessionData session = sessionService.getSession(sessionId);
        if (session == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(new ErrorResponse("Invalid or expired session"))
                .build();
        }

        return Response.ok(new SessionResponse(
            sessionId,
            session.getUsername(),
            session.getUserData()
        )).build();
    }

    @POST
    @Path("/logout")
    public Response logout(@CookieParam("session_id") String sessionId) {
        if (sessionId != null) {
            sessionService.invalidateSession(sessionId);
        }
        return Response.ok(new SuccessResponse("Logged out successfully"))
            .header("Set-Cookie", "session_id=; Path=/; Max-Age=0")
            .build();
    }

    // DTOs
    public static class LoginRequest {
        private String username;
        private String password;

        public LoginRequest() {}

        public LoginRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginResponse {
        private String sessionId;
        private String username;
        private boolean success;
        private String message;

        public LoginResponse(String sessionId, String username, boolean success, String message) {
            this.sessionId = sessionId;
            this.username = username;
            this.success = success;
            this.message = message;
        }

        public String getSessionId() { return sessionId; }
        public String getUsername() { return username; }
        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }

    public static class SessionResponse {
        private String sessionId;
        private String username;
        private Map<String, Object> userData;

        public SessionResponse(String sessionId, String username, Map<String, Object> userData) {
            this.sessionId = sessionId;
            this.username = username;
            this.userData = userData;
        }

        public String getSessionId() { return sessionId; }
        public String getUsername() { return username; }
        public Map<String, Object> getUserData() { return userData; }
    }

    public static class ErrorResponse {
        private String error;

        public ErrorResponse(String error) {
            this.error = error;
        }

        public String getError() { return error; }
    }

    public static class SuccessResponse {
        private String message;

        public SuccessResponse(String message) {
            this.message = message;
        }

        public String getMessage() { return message; }
    }
}

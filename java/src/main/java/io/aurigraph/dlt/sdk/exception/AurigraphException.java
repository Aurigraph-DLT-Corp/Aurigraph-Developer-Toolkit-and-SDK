package io.aurigraph.dlt.sdk.exception;

import java.util.Map;

/**
 * Base exception thrown by the Aurigraph DLT SDK.
 *
 * <p>All V12 errors conform to RFC 7807 (application/problem+json). The parsed
 * problem body is exposed via {@link #getProblem()}.
 */
public class AurigraphException extends RuntimeException {

    private final int statusCode;
    private final Map<String, Object> problem;
    private final String url;

    public AurigraphException(String message, int statusCode, Map<String, Object> problem, String url) {
        super(message);
        this.statusCode = statusCode;
        this.problem = problem;
        this.url = url;
    }

    public AurigraphException(String message, int statusCode, Map<String, Object> problem, String url, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
        this.problem = problem;
        this.url = url;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public Map<String, Object> getProblem() {
        return problem;
    }

    public String getUrl() {
        return url;
    }

    public String getErrorCode() {
        if (problem == null) return null;
        Object v = problem.get("errorCode");
        return v != null ? v.toString() : null;
    }

    public String getTraceId() {
        if (problem == null) return null;
        Object v = problem.get("traceId");
        return v != null ? v.toString() : null;
    }

    // ── Typed subclasses ──────────────────────────────────────────────────────

    /** HTTP 4xx — application-level validation error. Not retryable. */
    public static class ClientError extends AurigraphException {
        public ClientError(String message, int statusCode, Map<String, Object> problem, String url) {
            super(message, statusCode, problem, url);
        }
    }

    /** HTTP 5xx — server error. Retryable. */
    public static class ServerError extends AurigraphException {
        public ServerError(String message, int statusCode, Map<String, Object> problem, String url) {
            super(message, statusCode, problem, url);
        }
    }

    /** Network error, timeout, or abort. Retryable. */
    public static class NetworkError extends AurigraphException {
        public NetworkError(String message, String url, Throwable cause) {
            super(message, 0, null, url, cause);
        }
    }

    /** Invalid SDK configuration (missing baseUrl, etc.). */
    public static class ConfigError extends AurigraphException {
        public ConfigError(String message) {
            super(message, 0, null, null);
        }
    }
}

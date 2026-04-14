package io.aurigraph.sdk.errors

import io.aurigraph.sdk.models.ProblemDetails

/**
 * Sealed exception hierarchy for all errors raised by the Aurigraph SDK.
 *
 * Uses RFC 7807 [ProblemDetails] when available from the server.
 */
sealed class AurigraphError(message: String, cause: Throwable? = null) : Exception(message, cause) {

    /**
     * HTTP 4xx client error with an RFC 7807 problem body.
     *
     * @property problem Parsed problem details from the server response.
     */
    class ClientError(val problem: ProblemDetails) :
        AurigraphError(problem.detail ?: problem.title ?: "Client error (${problem.status})")

    /**
     * HTTP 5xx server error with an RFC 7807 problem body.
     *
     * @property problem Parsed problem details from the server response.
     */
    class ServerError(val problem: ProblemDetails) :
        AurigraphError(problem.detail ?: problem.title ?: "Server error (${problem.status})")

    /**
     * Network-level failure (connection refused, timeout, DNS, etc.).
     */
    class NetworkError(cause: Throwable) :
        AurigraphError("Network error: ${cause.message}", cause)

    /**
     * SDK configuration error (missing baseUrl, invalid parameters, etc.).
     */
    class ConfigError(message: String) : AurigraphError(message)
}

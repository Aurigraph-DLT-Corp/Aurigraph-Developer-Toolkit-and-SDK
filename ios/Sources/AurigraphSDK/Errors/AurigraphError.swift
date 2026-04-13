import Foundation

/// Errors thrown by the Aurigraph SDK.
public enum AurigraphError: Error, Equatable, Sendable {
    /// A network-level error (DNS, timeout, connection refused).
    case network(String)

    /// The server returned a non-2xx status code.
    /// If the body was RFC 7807 `application/problem+json`, `problem` is populated.
    case server(status: Int, message: String, problem: ProblemDetails?)

    /// JSON decoding failed.
    case decoding(String)

    /// Client misconfiguration (e.g. missing baseURL).
    case configuration(String)

    // MARK: - Equatable

    public static func == (lhs: AurigraphError, rhs: AurigraphError) -> Bool {
        switch (lhs, rhs) {
        case let (.network(a), .network(b)):
            return a == b
        case let (.server(s1, m1, _), .server(s2, m2, _)):
            return s1 == s2 && m1 == m2
        case let (.decoding(a), .decoding(b)):
            return a == b
        case let (.configuration(a), .configuration(b)):
            return a == b
        default:
            return false
        }
    }
}

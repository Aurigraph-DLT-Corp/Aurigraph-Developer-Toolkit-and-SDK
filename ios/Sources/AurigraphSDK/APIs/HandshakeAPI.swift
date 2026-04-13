import Foundation

/// SDK Handshake Protocol — bootstrap, heartbeat, capabilities, and config.
///
/// The handshake establishes the SDK session with the platform:
/// 1. `hello()` — bootstrap call returning approved scopes and rate limits
/// 2. `heartbeat()` — keep-alive ping (recommended every 5 minutes)
/// 3. `capabilities()` — list endpoints this app is permitted to call
/// 4. `config()` — lightweight refresh of scopes and rate limits
public struct HandshakeAPI: Sendable {

    private let client: AurigraphClient

    init(client: AurigraphClient) {
        self.client = client
    }

    /// Bootstrap handshake — returns server metadata, approved scopes, rate limits.
    public func hello() async throws -> HelloResponse {
        try await client.get("/sdk/handshake/hello")
    }

    /// Keep-alive heartbeat. Call periodically (default interval from HelloResponse).
    public func heartbeat(clientVersion: String? = nil) async throws -> HeartbeatResponse {
        struct HeartbeatRequest: Encodable {
            let clientVersion: String?
            let timestamp: String
        }
        let body = HeartbeatRequest(
            clientVersion: clientVersion,
            timestamp: ISO8601DateFormatter().string(from: Date())
        )
        return try await client.post("/sdk/handshake/heartbeat", body: body)
    }

    /// List all endpoints this app is permitted to call.
    public func capabilities() async throws -> CapabilitiesResponse {
        try await client.get("/sdk/handshake/capabilities")
    }

    /// Lightweight config refresh (scopes, rate limits).
    public func config() async throws -> ConfigResponse {
        try await client.get("/sdk/handshake/config")
    }
}

import Foundation

/// Main entry point for the Aurigraph DLT iOS SDK.
///
/// Uses Swift concurrency (`async/await`) and `actor` isolation for thread safety.
/// All HTTP is handled via Foundation `URLSession` — zero external dependencies.
///
/// ```swift
/// let client = AurigraphClient(configuration: .init(
///     baseURL: URL(string: "https://dlt.aurigraph.io")!,
///     apiKey: "your-api-key",
///     appId: "your-app-id"
/// ))
///
/// let health = try await client.health()
/// let assets = try await client.assets.listByUseCase("UC_GOLD")
/// ```
public actor AurigraphClient {

    // MARK: - Configuration

    /// SDK configuration.
    public struct Configuration: Sendable {
        /// Platform base URL (e.g. `https://dlt.aurigraph.io`).
        public var baseURL: URL

        /// API key for `Authorization: ApiKey <appId>:<apiKey>` auth.
        public var apiKey: String?

        /// Application ID (UUID) issued during 3rd-party registration.
        public var appId: String?

        /// Optional OAuth2/Keycloak JWT (sent as `Authorization: Bearer ...`).
        public var jwtToken: String?

        /// Per-request timeout. Default: 30 seconds.
        public var timeout: TimeInterval

        public init(
            baseURL: URL,
            apiKey: String? = nil,
            appId: String? = nil,
            jwtToken: String? = nil,
            timeout: TimeInterval = 30
        ) {
            self.baseURL = baseURL
            self.apiKey = apiKey
            self.appId = appId
            self.jwtToken = jwtToken
            self.timeout = timeout
        }
    }

    // MARK: - Properties

    private let configuration: Configuration
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    /// The base API path appended to all requests.
    private let apiPrefix = "/api/v11"

    // MARK: - Init

    public init(configuration: Configuration) {
        self.configuration = configuration

        let sessionConfig = URLSessionConfiguration.default
        sessionConfig.timeoutIntervalForRequest = configuration.timeout
        sessionConfig.httpAdditionalHeaders = [
            "Accept": "application/json",
            "Content-Type": "application/json",
        ]
        self.session = URLSession(configuration: sessionConfig)

        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    /// Initializer that accepts a custom URLSession (for testing with mock protocols).
    internal init(configuration: Configuration, session: URLSession) {
        self.configuration = configuration
        self.session = session
        self.decoder = JSONDecoder()
        self.encoder = JSONEncoder()
    }

    // MARK: - Namespace APIs

    /// Asset-agnostic operations (use cases, assets, channels, public ledger).
    public nonisolated var assets: AssetsAPI { AssetsAPI(client: self) }

    /// SDK handshake protocol (hello, heartbeat, capabilities, config).
    public nonisolated var handshake: HandshakeAPI { HandshakeAPI(client: self) }

    /// GDPR data export and erasure.
    public nonisolated var gdpr: GdprAPI { GdprAPI(client: self) }

    // MARK: - Top-Level Convenience

    /// Check platform health.
    public func health() async throws -> HealthResponse {
        try await get("/health")
    }

    /// Get platform statistics (TPS, active nodes, block height).
    public func stats() async throws -> PlatformStats {
        try await get("/stats")
    }

    // MARK: - Internal HTTP Methods

    /// Perform a GET request and decode the response.
    func get<T: Decodable>(_ path: String) async throws -> T {
        let request = try buildRequest(method: "GET", path: path)
        return try await execute(request)
    }

    /// Perform a GET request and return raw bytes.
    func getRaw(_ path: String) async throws -> Data {
        let request = try buildRequest(method: "GET", path: path)
        let (data, response) = try await performRequest(request)
        try validateResponse(response, data: data)
        return data
    }

    /// Perform a POST request with an encodable body and decode the response.
    func post<T: Decodable, B: Encodable>(_ path: String, body: B) async throws -> T {
        var request = try buildRequest(method: "POST", path: path)
        request.httpBody = try encoder.encode(body)
        return try await execute(request)
    }

    /// Perform a DELETE request and decode the response.
    func delete<T: Decodable>(_ path: String) async throws -> T {
        let request = try buildRequest(method: "DELETE", path: path)
        return try await execute(request)
    }

    // MARK: - Private Helpers

    private func buildRequest(method: String, path: String) throws -> URLRequest {
        guard var components = URLComponents(url: configuration.baseURL, resolvingAgainstBaseURL: false) else {
            throw AurigraphError.configuration("Invalid baseURL: \(configuration.baseURL)")
        }

        // Append /api/v11 prefix if the path doesn't already include it
        let fullPath = path.hasPrefix(apiPrefix) ? path : apiPrefix + path
        components.path = fullPath

        guard let url = components.url else {
            throw AurigraphError.configuration("Could not construct URL for path: \(path)")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method

        // Auth: prefer appId+apiKey combo, fallback to JWT, fallback to apiKey-only
        if let appId = configuration.appId, let apiKey = configuration.apiKey {
            request.setValue("ApiKey \(appId):\(apiKey)", forHTTPHeaderField: "Authorization")
        } else if let jwt = configuration.jwtToken {
            request.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
        } else if let apiKey = configuration.apiKey {
            request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        }

        return request
    }

    private func execute<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await performRequest(request)
        try validateResponse(response, data: data)

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw AurigraphError.decoding("Failed to decode \(T.self): \(error.localizedDescription)")
        }
    }

    private func performRequest(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await session.data(for: request)
        } catch {
            throw AurigraphError.network(error.localizedDescription)
        }
    }

    private func validateResponse(_ response: URLResponse, data: Data) throws {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AurigraphError.network("Response is not an HTTP response")
        }

        let status = httpResponse.statusCode
        guard (200..<300).contains(status) else {
            // Attempt to parse RFC 7807 problem details
            let problem = try? decoder.decode(ProblemDetails.self, from: data)
            let message = problem?.detail
                ?? problem?.title
                ?? String(data: data, encoding: .utf8)
                ?? "HTTP \(status)"
            throw AurigraphError.server(status: status, message: message, problem: problem)
        }
    }
}

import XCTest
@testable import AurigraphSDK

// MARK: - Mock URLProtocol

final class MockURLProtocol: URLProtocol {
    /// Map of path suffix -> (statusCode, responseBody)
    nonisolated(unsafe) static var responses: [String: (Int, Data)] = [:]

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        let path = request.url?.path ?? ""
        let (status, data) = Self.findResponse(for: path)

        let response = HTTPURLResponse(
            url: request.url!,
            statusCode: status,
            httpVersion: "HTTP/1.1",
            headerFields: ["Content-Type": "application/json"]
        )!

        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: data)
        client?.urlProtocolDidFinishLoading(self)
    }

    override func stopLoading() {}

    private static func findResponse(for path: String) -> (Int, Data) {
        // Try exact match first, then suffix match
        if let exact = responses[path] { return exact }
        for (key, value) in responses where path.hasSuffix(key) {
            return value
        }
        return (404, Data("{\"detail\":\"Not Found\"}".utf8))
    }

    static func reset() { responses = [:] }
}

// MARK: - Helper

private func makeClient() -> AurigraphClient {
    let config = URLSessionConfiguration.ephemeral
    config.protocolClasses = [MockURLProtocol.self]
    let session = URLSession(configuration: config)

    return AurigraphClient(
        configuration: .init(
            baseURL: URL(string: "https://test.aurigraph.io")!,
            apiKey: "test-key",
            appId: "test-app-id"
        ),
        session: session
    )
}

// MARK: - Tests

final class AurigraphClientTests: XCTestCase {

    override func setUp() {
        super.setUp()
        MockURLProtocol.reset()
    }

    // MARK: 1. Client initialization

    func testClientInitialization() async {
        let client = AurigraphClient(configuration: .init(
            baseURL: URL(string: "https://dlt.aurigraph.io")!,
            apiKey: "key-123",
            appId: "app-456",
            timeout: 15
        ))
        // Actor is created without throwing — configuration is valid
        XCTAssertNotNil(client)
    }

    // MARK: 2. Health endpoint

    func testHealthReturnsResponse() async throws {
        let json = """
        {"status":"HEALTHY","durationMs":8,"version":"12.1.34","timestamp":"2026-04-12T10:00:00Z"}
        """
        MockURLProtocol.responses["/api/v11/health"] = (200, Data(json.utf8))

        let client = makeClient()
        let health = try await client.health()

        XCTAssertEqual(health.status, "HEALTHY")
        XCTAssertEqual(health.durationMs, 8)
        XCTAssertEqual(health.version, "12.1.34")
    }

    // MARK: 3. Stats endpoint

    func testStatsReturnsResponse() async throws {
        let json = """
        {"tps":1920000,"activeNodes":37,"blockHeight":485200,"totalTransactions":9500000}
        """
        MockURLProtocol.responses["/api/v11/stats"] = (200, Data(json.utf8))

        let client = makeClient()
        let stats = try await client.stats()

        XCTAssertEqual(stats.activeNodes, 37)
        XCTAssertGreaterThan(stats.tps, 1_000_000)
        XCTAssertEqual(stats.blockHeight, 485200)
    }

    // MARK: 4. Assets — listByUseCase

    func testAssetsListByUseCase() async throws {
        let json = """
        [
            {"id":"asset-001","name":"Gold Bar A","assetType":"COMMODITY","useCaseId":"UC_GOLD","status":"ACTIVE"},
            {"id":"asset-002","name":"Gold Bar B","assetType":"COMMODITY","useCaseId":"UC_GOLD","status":"ACTIVE"}
        ]
        """
        MockURLProtocol.responses["/api/v11/rwa/assets"] = (200, Data(json.utf8))

        let client = makeClient()
        let assets = try await client.assets.listByUseCase("UC_GOLD")

        XCTAssertEqual(assets.count, 2)
        XCTAssertEqual(assets[0].id, "asset-001")
        XCTAssertEqual(assets[0].useCaseId, "UC_GOLD")
    }

    // MARK: 5. Server error — RFC 7807

    func testServerErrorParsesRFC7807() async throws {
        let json = """
        {
            "type":"https://aurigraph.io/errors/not-found",
            "title":"Not Found",
            "status":404,
            "detail":"Asset xyz not found",
            "errorCode":"ASSET_NOT_FOUND",
            "traceId":"abc-123"
        }
        """
        MockURLProtocol.responses["/api/v11/rwa/assets/xyz"] = (404, Data(json.utf8))

        let client = makeClient()

        do {
            _ = try await client.assets.getAsset("xyz")
            XCTFail("Expected AurigraphError.server")
        } catch let error as AurigraphError {
            guard case let .server(status, message, problem) = error else {
                XCTFail("Expected .server error, got \(error)")
                return
            }
            XCTAssertEqual(status, 404)
            XCTAssertTrue(message.contains("not found"))
            XCTAssertEqual(problem?.errorCode, "ASSET_NOT_FOUND")
            XCTAssertEqual(problem?.traceId, "abc-123")
        }
    }

    // MARK: 6. Handshake hello

    func testHandshakeHello() async throws {
        let json = """
        {
            "appId":"test-app-id","appName":"TestApp","did":"did:aurigraph:test",
            "status":"ACTIVE","serverVersion":"12.1.34","protocolVersion":"1.2.0",
            "approvedScopes":["assets:read","health:read"],
            "requestedScopes":["assets:read","health:read","gdpr:write"],
            "pendingScopes":["gdpr:write"],
            "rateLimit":{"requestsPerMinute":600,"burstSize":100},
            "heartbeatIntervalMs":300000,
            "features":{"gdpr":true,"graphql":false},
            "nextHeartbeatAt":"2026-04-12T10:05:00Z"
        }
        """
        MockURLProtocol.responses["/api/v11/sdk/handshake/hello"] = (200, Data(json.utf8))

        let client = makeClient()
        let hello = try await client.handshake.hello()

        XCTAssertEqual(hello.appId, "test-app-id")
        XCTAssertEqual(hello.approvedScopes, ["assets:read", "health:read"])
        XCTAssertEqual(hello.rateLimit.requestsPerMinute, 600)
        XCTAssertEqual(hello.features["gdpr"], true)
    }

    // MARK: 7. GDPR erasure

    func testGdprErasure() async throws {
        let json = """
        {"userId":"user-42","erasedAt":"2026-04-12T10:00:00Z","status":"COMPLETED","receiptId":"rcpt-001"}
        """
        MockURLProtocol.responses["/api/v11/gdpr/erasure/user-42"] = (200, Data(json.utf8))

        let client = makeClient()
        let receipt = try await client.gdpr.requestErasure(userId: "user-42")

        XCTAssertEqual(receipt.userId, "user-42")
        XCTAssertEqual(receipt.status, "COMPLETED")
        XCTAssertEqual(receipt.receiptId, "rcpt-001")
    }

    // MARK: 8. Decoding error

    func testDecodingErrorOnMalformedJSON() async throws {
        MockURLProtocol.responses["/api/v11/health"] = (200, Data("not json".utf8))

        let client = makeClient()

        do {
            _ = try await client.health()
            XCTFail("Expected AurigraphError.decoding")
        } catch let error as AurigraphError {
            guard case .decoding = error else {
                XCTFail("Expected .decoding error, got \(error)")
                return
            }
        }
    }
}

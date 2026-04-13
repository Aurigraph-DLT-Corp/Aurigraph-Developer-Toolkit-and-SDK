import Foundation

/// Asset-agnostic API for querying use cases, assets, and public ledgers.
///
/// Works with ANY asset type (Gold, Carbon, Real Estate, IP, etc.).
/// Asset-specific behavior is driven by the `useCaseId` parameter.
public struct AssetsAPI: Sendable {

    private let client: AurigraphClient

    init(client: AurigraphClient) {
        self.client = client
    }

    // MARK: - Use Cases

    /// List all registered use cases (UC_GOLD, UC_CARBON, UC_REAL_ESTATE, etc.).
    public func listUseCases() async throws -> [UseCase] {
        try await client.get("/use-cases")
    }

    /// Get a specific use case by ID.
    public func getUseCase(_ useCaseId: String) async throws -> UseCase {
        try await client.get("/use-cases/\(useCaseId)")
    }

    // MARK: - Assets

    /// List all assets, optionally filtered by use case.
    public func listByUseCase(_ useCaseId: String? = nil) async throws -> [Asset] {
        var path = "/rwa/assets"
        if let useCaseId {
            path += "?useCase=\(useCaseId)"
        }
        return try await client.get(path)
    }

    /// List assets belonging to a specific channel.
    public func listByChannel(_ channelId: String) async throws -> [Asset] {
        try await client.get("/rwa/assets?channelId=\(channelId)")
    }

    /// Get a single asset by ID.
    public func getAsset(_ assetId: String) async throws -> Asset {
        try await client.get("/rwa/assets/\(assetId)")
    }

    /// Get the public ledger for a specific use case.
    public func getPublicLedger(_ useCaseId: String) async throws -> [Asset] {
        try await client.get("/use-cases/\(useCaseId)/assets")
    }

    // MARK: - Channels

    /// List channels.
    public func listChannels() async throws -> [Channel] {
        try await client.get("/channels")
    }
}

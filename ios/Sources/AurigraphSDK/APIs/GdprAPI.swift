import Foundation

/// GDPR operations — data export, download, and erasure requests.
///
/// Implements GDPR Articles 17 (right to erasure) and 20 (data portability).
public struct GdprAPI: Sendable {

    private let client: AurigraphClient

    init(client: AurigraphClient) {
        self.client = client
    }

    /// Export all user data as a structured payload (GDPR Article 20).
    public func exportUserData(userId: String) async throws -> GdprExportPayload {
        try await client.get("/gdpr/export/\(userId)")
    }

    /// Download user data as raw bytes (GDPR Article 20 portable format).
    public func downloadUserData(userId: String) async throws -> Data {
        try await client.getRaw("/gdpr/download/\(userId)")
    }

    /// Request erasure of all personal data (GDPR Article 17 — right to be forgotten).
    public func requestErasure(userId: String) async throws -> ErasureReceipt {
        try await client.delete("/gdpr/erasure/\(userId)")
    }
}

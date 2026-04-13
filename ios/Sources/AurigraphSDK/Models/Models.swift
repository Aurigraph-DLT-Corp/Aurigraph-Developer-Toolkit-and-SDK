import Foundation

// MARK: - Platform

/// Response from `GET /api/v11/health`.
public struct HealthResponse: Codable, Sendable {
    public let status: String
    public let durationMs: Int?
    public let version: String?
    public let timestamp: String?

    public init(status: String, durationMs: Int? = nil, version: String? = nil, timestamp: String? = nil) {
        self.status = status
        self.durationMs = durationMs
        self.version = version
        self.timestamp = timestamp
    }
}

/// Response from `GET /api/v11/stats`.
public struct PlatformStats: Codable, Sendable {
    public let tps: Double
    public let activeNodes: Int
    public let blockHeight: Int
    public let totalTransactions: Int?
    public let uptime: Double?

    public init(tps: Double, activeNodes: Int, blockHeight: Int, totalTransactions: Int? = nil, uptime: Double? = nil) {
        self.tps = tps
        self.activeNodes = activeNodes
        self.blockHeight = blockHeight
        self.totalTransactions = totalTransactions
        self.uptime = uptime
    }
}

// MARK: - Assets

/// A registered use case (UC_GOLD, UC_CARBON, UC_REAL_ESTATE, etc.).
public struct UseCase: Codable, Sendable, Identifiable {
    public let id: String
    public let name: String
    public let description: String?
    public let status: String?

    public init(id: String, name: String, description: String? = nil, status: String? = nil) {
        self.id = id
        self.name = name
        self.description = description
        self.status = status
    }
}

/// A tokenized asset on the platform.
public struct Asset: Codable, Sendable, Identifiable {
    public let id: String
    public let name: String?
    public let assetType: String?
    public let useCaseId: String?
    public let channelId: String?
    public let status: String?
    public let metadata: [String: String]?

    public init(id: String, name: String? = nil, assetType: String? = nil,
                useCaseId: String? = nil, channelId: String? = nil,
                status: String? = nil, metadata: [String: String]? = nil) {
        self.id = id
        self.name = name
        self.assetType = assetType
        self.useCaseId = useCaseId
        self.channelId = channelId
        self.status = status
        self.metadata = metadata
    }
}

/// A platform channel.
public struct Channel: Codable, Sendable, Identifiable {
    public let id: String
    public let name: String?
    public let channelType: String?
    public let status: String?

    public init(id: String, name: String? = nil, channelType: String? = nil, status: String? = nil) {
        self.id = id
        self.name = name
        self.channelType = channelType
        self.status = status
    }
}

// MARK: - Handshake Protocol

/// Response from `GET /api/v11/sdk/handshake/hello`.
public struct HelloResponse: Codable, Sendable {
    public let appId: String
    public let appName: String
    public let did: String
    public let status: String
    public let serverVersion: String
    public let protocolVersion: String
    public let approvedScopes: [String]
    public let requestedScopes: [String]
    public let pendingScopes: [String]
    public let rateLimit: HandshakeRateLimit
    public let heartbeatIntervalMs: Int
    public let features: [String: Bool]
    public let nextHeartbeatAt: String
}

/// Rate-limit policy from the handshake.
public struct HandshakeRateLimit: Codable, Sendable {
    public let requestsPerMinute: Int
    public let burstSize: Int

    public init(requestsPerMinute: Int, burstSize: Int) {
        self.requestsPerMinute = requestsPerMinute
        self.burstSize = burstSize
    }
}

/// Response from `POST /api/v11/sdk/handshake/heartbeat`.
public struct HeartbeatResponse: Codable, Sendable {
    public let receivedAt: String
    public let nextHeartbeatAt: String
    public let status: String
}

/// Response from `GET /api/v11/sdk/handshake/capabilities`.
public struct CapabilitiesResponse: Codable, Sendable {
    public let appId: String
    public let approvedScopes: [String]
    public let endpoints: [CapabilityEndpoint]
    public let totalEndpoints: Int
}

/// A single capability endpoint descriptor.
public struct CapabilityEndpoint: Codable, Sendable {
    public let method: String
    public let path: String
    public let requiredScope: String
    public let description: String
}

/// Response from `GET /api/v11/sdk/handshake/config`.
public struct ConfigResponse: Codable, Sendable {
    public let appId: String
    public let status: String
    public let approvedScopes: [String]
    public let pendingScopes: [String]
    public let rateLimit: HandshakeRateLimit
    public let lastUpdatedAt: String
}

// MARK: - GDPR

/// Structured export of all user data (GDPR Article 20).
public struct GdprExportPayload: Codable, Sendable {
    public let userId: String
    public let exportedAt: String
    public let data: [String: AnyCodable]?

    public init(userId: String, exportedAt: String, data: [String: AnyCodable]? = nil) {
        self.userId = userId
        self.exportedAt = exportedAt
        self.data = data
    }
}

/// Receipt confirming data erasure (GDPR Article 17).
public struct ErasureReceipt: Codable, Sendable {
    public let userId: String
    public let erasedAt: String
    public let status: String
    public let receiptId: String?

    public init(userId: String, erasedAt: String, status: String, receiptId: String? = nil) {
        self.userId = userId
        self.erasedAt = erasedAt
        self.status = status
        self.receiptId = receiptId
    }
}

// MARK: - RFC 7807 Problem Details

/// RFC 7807 `application/problem+json` error envelope.
public struct ProblemDetails: Codable, Sendable, Equatable {
    public let type: String?
    public let title: String?
    public let status: Int?
    public let detail: String?
    public let instance: String?
    public let errorCode: String?
    public let traceId: String?
    public let requestId: String?
    public let service: String?
    public let timestamp: String?

    public init(type: String? = nil, title: String? = nil, status: Int? = nil,
                detail: String? = nil, instance: String? = nil, errorCode: String? = nil,
                traceId: String? = nil, requestId: String? = nil,
                service: String? = nil, timestamp: String? = nil) {
        self.type = type
        self.title = title
        self.status = status
        self.detail = detail
        self.instance = instance
        self.errorCode = errorCode
        self.traceId = traceId
        self.requestId = requestId
        self.service = service
        self.timestamp = timestamp
    }
}

// MARK: - AnyCodable (lightweight type-erased wrapper)

/// Minimal type-erased Codable wrapper for heterogeneous JSON values.
public struct AnyCodable: Codable, Sendable {
    public let value: Any

    public init(_ value: Any) {
        self.value = value
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            value = NSNull()
        } else if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map(\.value)
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues(\.value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON type")
        }
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch value {
        case is NSNull:
            try container.encodeNil()
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        default:
            try container.encodeNil()
        }
    }
}

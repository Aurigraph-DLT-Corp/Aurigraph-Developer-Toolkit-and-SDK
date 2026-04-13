# Aurigraph iOS SDK

Swift SDK for the Aurigraph DLT V12 platform (V11 API). Zero external dependencies — uses Foundation `URLSession` with Swift concurrency (`async/await`).

## Requirements

- iOS 16+ / macOS 13+
- Swift 5.9+
- Xcode 15+

## Installation

### Swift Package Manager

Add to your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK.git", from: "1.2.0")
]
```

Then add `"AurigraphSDK"` to your target's dependencies.

Or in Xcode: File > Add Package Dependencies > paste the repository URL.

## Quick Start

```swift
import AurigraphSDK

let client = AurigraphClient(configuration: .init(
    baseURL: URL(string: "https://dlt.aurigraph.io")!,
    apiKey: "your-api-key",
    appId: "your-app-id"
))

// Platform health
let health = try await client.health()
print("Status: \(health.status)")

// Platform stats
let stats = try await client.stats()
print("TPS: \(stats.tps), Nodes: \(stats.activeNodes)")

// SDK Handshake
let hello = try await client.handshake.hello()
print("Scopes: \(hello.approvedScopes)")

// List assets by use case
let goldAssets = try await client.assets.listByUseCase("UC_GOLD")

// GDPR data export
let export = try await client.gdpr.exportUserData(userId: "user-123")
```

## API Reference

### `AurigraphClient`

| Method | Description |
|--------|-------------|
| `health()` | Platform health check |
| `stats()` | TPS, active nodes, block height |

### `client.assets` (AssetsAPI)

| Method | Description |
|--------|-------------|
| `listUseCases()` | All registered use cases |
| `getUseCase(_:)` | Single use case by ID |
| `listByUseCase(_:)` | Assets filtered by use case |
| `listByChannel(_:)` | Assets filtered by channel |
| `getAsset(_:)` | Single asset by ID |
| `getPublicLedger(_:)` | Public ledger for a use case |
| `listChannels()` | All channels |

### `client.handshake` (HandshakeAPI)

| Method | Description |
|--------|-------------|
| `hello()` | Bootstrap handshake |
| `heartbeat(clientVersion:)` | Keep-alive ping |
| `capabilities()` | Permitted endpoints |
| `config()` | Refresh scopes and rate limits |

### `client.gdpr` (GdprAPI)

| Method | Description |
|--------|-------------|
| `exportUserData(userId:)` | GDPR Article 20 data export |
| `downloadUserData(userId:)` | Portable format download |
| `requestErasure(userId:)` | GDPR Article 17 erasure |

## Error Handling

All errors are thrown as `AurigraphError`:

```swift
do {
    let asset = try await client.assets.getAsset("xyz")
} catch let error as AurigraphError {
    switch error {
    case .network(let message):
        print("Network error: \(message)")
    case .server(let status, let message, let problem):
        print("Server \(status): \(message)")
        if let code = problem?.errorCode {
            print("Error code: \(code)")
        }
    case .decoding(let message):
        print("Decode error: \(message)")
    case .configuration(let message):
        print("Config error: \(message)")
    }
}
```

Server errors parse RFC 7807 `application/problem+json` responses into `ProblemDetails` with `errorCode`, `traceId`, and other fields.

## License

Copyright 2024-2026 Aurigraph DLT Corp. All rights reserved.

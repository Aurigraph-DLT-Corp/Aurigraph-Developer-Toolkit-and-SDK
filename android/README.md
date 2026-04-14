# Aurigraph Android/Kotlin SDK

Pure Kotlin JVM SDK for the [Aurigraph DLT](https://dlt.aurigraph.io) platform. Works on Android AND server-side Kotlin -- no Android-specific dependencies.

## Installation

Add the dependency to your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("io.aurigraph:aurigraph-sdk:1.0.0")
}
```

Or include the module directly:

```kotlin
// settings.gradle.kts
include(":aurigraph-sdk")
```

## Quickstart

```kotlin
import io.aurigraph.sdk.AurigraphClient
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val client = AurigraphClient.builder()
        .baseUrl("https://dlt.aurigraph.io")
        .apiKey("your-api-key")
        .appId("your-app-id")
        .timeout(30)
        .maxRetries(2)
        .build()

    // Platform health
    val health = client.health()
    println("Status: ${health.status}, Version: ${health.version}")

    // Platform stats
    val stats = client.stats()
    println("TPS: ${stats.tps}, Active Nodes: ${stats.activeNodes}")

    // List assets by use case
    val goldAssets = client.assets.listByUseCase("UC_GOLD")
    println("Gold assets: $goldAssets")

    // SDK handshake
    val hello = client.handshake.hello()
    println("App: ${hello.appName}, Scopes: ${hello.approvedScopes}")

    client.close()
}
```

## API Namespaces

| Namespace | Access | Description |
|-----------|--------|-------------|
| `assets` | `client.assets` | Use cases, RWA assets, public ledgers, derived tokens |
| `handshake` | `client.handshake` | SDK bootstrap, heartbeat, capabilities, config |
| `gdpr` | `client.gdpr` | Data export, download, erasure (GDPR Art. 17/20) |
| `tier` | `client.tier` | Partner tier, usage stats, quotas, upgrades |
| `governance` | `client.governance` | Proposals, voting, treasury |
| `wallet` | `client.wallet` | Balances, transfers, transaction history |
| `compliance` | `client.compliance` | Frameworks, assessments |
| `nodes` | `client.nodes` | Node listing, registration, metrics |
| `channels` | `client.channels` | Channel listing and details |
| `transactions` | `client.transactions` | Submit, get, list recent |
| `dmrv` | `client.dmrv` | DMRV event recording, batch, audit trail |
| `contracts` | `client.contracts` | Deploy, invoke, query smart contracts |
| `graphql` | `client.graphql` | Flexible GraphQL queries |

## Error Handling

The SDK uses a sealed exception hierarchy with RFC 7807 problem details:

```kotlin
import io.aurigraph.sdk.errors.AurigraphError

try {
    val asset = client.assets.get("unknown-id")
} catch (e: AurigraphError.ClientError) {
    // HTTP 4xx -- e.problem contains RFC 7807 details
    println("Error: ${e.problem.errorCode} - ${e.problem.detail}")
} catch (e: AurigraphError.ServerError) {
    // HTTP 5xx -- retries exhausted
    println("Server error: ${e.problem.detail}")
} catch (e: AurigraphError.NetworkError) {
    // Connection failure, timeout, DNS error
    println("Network error: ${e.message}")
} catch (e: AurigraphError.ConfigError) {
    // SDK misconfiguration
    println("Config error: ${e.message}")
}
```

## Tech Stack

- **Kotlin 1.9.24** -- modern Kotlin idioms (data classes, sealed classes, coroutines)
- **kotlinx.serialization 1.6.3** -- compile-time safe JSON serialization
- **OkHttp 4.12.0** -- battle-tested HTTP client
- **kotlinx.coroutines 1.8.1** -- structured concurrency with `suspend` functions
- Automatic retry with exponential backoff on 5xx/network errors

## License

Copyright 2026 Aurigraph DLT Corp. All rights reserved.

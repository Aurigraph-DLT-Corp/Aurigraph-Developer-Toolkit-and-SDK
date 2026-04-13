# Getting Started with Aurigraph DLT

Get from zero to your first API call in under 5 minutes.

## What is Aurigraph DLT?

Aurigraph DLT is a high-performance distributed ledger platform designed for real-world asset (RWA) tokenization. It supports 15+ asset classes (gold, carbon credits, real estate, intellectual property, and more) through a single, unified API.

Key capabilities:

- **1.9M+ TPS** throughput with HyperRAFT++ consensus
- **Quantum-resistant cryptography** (NIST Level 5, ML-DSA-87/ML-KEM-1024)
- **Asset-agnostic design** -- one API for all asset types
- **Multi-channel architecture** -- ASSET, TRANSACTION, and BRIDGE channels
- **GDPR compliance** built in -- data export and right-to-erasure
- **Ricardian smart contracts** with legally binding clauses

## Prerequisites

1. An Aurigraph SDK application registered at [dlt.aurigraph.io](https://dlt.aurigraph.io)
2. Your **App ID** and **API Key** (provided during registration)
3. One of: Java 21+, Node.js 18+, Python 3.10+, or Rust 1.70+

## Step 1: Install the SDK

=== "Java"

    ```xml
    <dependency>
        <groupId>io.aurigraph.dlt</groupId>
        <artifactId>aurigraph-sdk</artifactId>
        <version>1.2.0</version>
    </dependency>
    ```

=== "TypeScript"

    ```bash
    npm install @aurigraph/dlt-sdk
    ```

=== "Python"

    ```bash
    pip install aurigraph-sdk
    ```

=== "Rust"

    ```toml
    [dependencies]
    aurigraph-dlt-sdk = "0.1"
    tokio = { version = "1", features = ["full"] }
    ```

## Step 2: Create a Client

=== "Java"

    ```java
    import io.aurigraph.dlt.sdk.AurigraphClient;

    AurigraphClient client = AurigraphClient.builder()
        .baseUrl("https://dlt.aurigraph.io")
        .apiKey("your-app-id", "your-raw-key")
        .build();
    ```

=== "TypeScript"

    ```typescript
    import { AurigraphClient } from '@aurigraph/dlt-sdk';

    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      apiKey: process.env.AURIGRAPH_API_KEY,
      appId: process.env.AURIGRAPH_APP_ID,
    });
    ```

=== "Python"

    ```python
    from aurigraph_sdk import AurigraphClient

    client = AurigraphClient(
        base_url="https://dlt.aurigraph.io",
        api_key="your-raw-key",
        app_id="your-app-id",
    )
    ```

=== "Rust"

    ```rust
    use aurigraph_sdk::AurigraphClient;

    let client = AurigraphClient::builder()
        .base_url("https://dlt.aurigraph.io")
        .api_key("your-app-id", "your-raw-key")
        .build()?;
    ```

## Step 3: Check Platform Health

=== "Java"

    ```java
    var health = client.health();
    System.out.println("Status: " + health.getStatus());
    // Output: Status: UP

    var stats = client.stats();
    System.out.println("TPS: " + stats.getTps());
    System.out.println("Active Nodes: " + stats.getActiveNodes());
    ```

=== "TypeScript"

    ```typescript
    const health = await client.health.get();
    console.log(`Status: ${health.status}`);

    const stats = await client.stats.get();
    console.log(`TPS: ${stats.tps}`);
    console.log(`Active Nodes: ${stats.activeNodes}`);
    ```

=== "Python"

    ```python
    health = client.health()
    print(f"Status: {health.status}")

    stats = client.stats()
    print(f"TPS: {stats.tps}")
    print(f"Active Nodes: {stats.active_nodes}")
    ```

=== "Rust"

    ```rust
    let health = client.health().await?;
    println!("Status: {}", health.status);

    let stats = client.stats().await?;
    println!("TPS: {:?}", stats.tps);
    ```

## Step 4: Query Assets

The SDK uses an asset-agnostic design. All 15+ use cases are accessed through the same `assets` namespace:

=== "Java"

    ```java
    // List all registered use cases
    var useCases = client.assets().listUseCases();
    useCases.forEach(uc -> System.out.println(uc.getId() + ": " + uc.getName()));

    // Query gold assets specifically
    var goldAssets = client.assets().listByUseCase("UC_GOLD");
    System.out.println("Gold assets: " + goldAssets);

    // Query by asset type
    var commodities = client.assets().listByType("COMMODITY");

    // Query by channel
    var channelAssets = client.assets().listByChannel("enterprise-channel");
    ```

=== "TypeScript"

    ```typescript
    const useCases = await client.assets.listUseCases();
    useCases.forEach(uc => console.log(`${uc.id}: ${uc.name}`));

    const gold = await client.assets.listByUseCase('UC_GOLD');
    const commodities = await client.assets.listByType('COMMODITY');
    const channelAssets = await client.assets.listByChannel('enterprise-channel');
    ```

=== "Python"

    ```python
    use_cases = client.assets.list_use_cases()
    for uc in use_cases:
        print(f"{uc.id}: {uc.name}")

    gold = client.assets.list_by_use_case("UC_GOLD")
    commodities = client.assets.list_by_type("COMMODITY")
    channel_assets = client.assets.list_by_channel("enterprise-channel")
    ```

=== "Rust"

    ```rust
    let use_cases = client.assets().list_use_cases().await?;
    let gold = client.assets().list_by_use_case("UC_GOLD").await?;
    ```

## Step 5: Perform the Handshake

The SDK handshake protocol establishes your application's identity and retrieves its permissions:

=== "Java"

    ```java
    // Initial handshake -- returns server metadata + your app permissions
    var hello = client.sdk().hello();
    System.out.println("Platform: " + hello.platformVersion());
    System.out.println("Tier: " + hello.tierName());

    // Periodic heartbeat (or use autoHeartbeat in builder)
    var heartbeat = client.sdk().heartbeat("aurigraph-java-sdk/1.2.0");
    System.out.println("Server time: " + heartbeat.serverTime());
    ```

=== "TypeScript"

    ```typescript
    const hello = await client.sdk.hello();
    console.log(`Platform: ${hello.platformVersion}`);

    const heartbeat = await client.sdk.heartbeat('aurigraph-ts-sdk/1.2.0');
    ```

=== "Python"

    ```python
    hello = client.handshake.hello()
    print(f"Platform: {hello['platformVersion']}")

    heartbeat = client.handshake.heartbeat("aurigraph-python-sdk/1.2.0")
    ```

=== "Rust"

    ```rust
    let hello = client.handshake().hello().await?;
    println!("Platform: {}", hello.platform_version);
    ```

## Next Steps

- [Authentication](authentication.md) -- deep dive into auth methods
- [Asset-Agnostic Design](asset-agnostic-design.md) -- understand the unified query model
- [Tier System](tier-system.md) -- understand rate limits and quotas
- [API Reference](api-reference/assets.md) -- full method reference for all namespaces
- [Error Handling](error-handling.md) -- handle errors gracefully with RFC 7807

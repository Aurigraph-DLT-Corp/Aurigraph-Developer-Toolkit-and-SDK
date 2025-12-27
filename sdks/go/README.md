# Aurigraph Go SDK

Official Go SDK for Aurigraph V11 blockchain. High-performance synchronous client for interacting with the Aurigraph network.

## Features

- 🚀 High-performance synchronous HTTP client
- 🔐 API key authentication support
- 📦 Zero external dependencies (pure Go stdlib)
- ⚡ Context-based timeout and cancellation
- 🧪 Thread-safe concurrent operations
- 📊 Full transaction and account management
- 🔗 Block chain querying capabilities

## Installation

```bash
go get github.com/aurigraph-dlt-corp/aurigraph-sdk-go
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    aurigraph "github.com/aurigraph-dlt-corp/aurigraph-sdk-go"
)

func main() {
    // Create client
    client := aurigraph.NewClient(&aurigraph.ClientConfig{
        BaseURL: "https://dlt.aurigraph.io/api/v11",
        APIKey:  "sk_...",
        Timeout: 30000,
    })

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()

    // Connect to network
    if err := client.Connect(ctx); err != nil {
        log.Fatalf("Failed to connect: %v", err)
    }
    defer client.Disconnect(ctx)

    // Get account information
    account, err := client.GetAccount(ctx, "auri1...")
    if err != nil {
        log.Fatalf("Failed to get account: %v", err)
    }

    fmt.Printf("Address: %s\n", account.Address)
    fmt.Printf("Balance: %s\n", account.Balance)
    fmt.Printf("Nonce: %d\n", account.Nonce)
}
```

## Core Types

### ClientConfig

```go
type ClientConfig struct {
    BaseURL string // API base URL (required)
    APIKey  string // API authentication key (optional)
    Timeout int    // Request timeout in milliseconds (default: 30000)
}
```

### Account

```go
type Account struct {
    Address   string
    Balance   string
    Nonce     int64
    PublicKey string
}
```

### Transaction

```go
type Transaction struct {
    Hash      string
    From      string
    To        string
    Amount    string
    Nonce     int64
    Timestamp int64
    Status    string // "pending", "confirmed", "failed"
}
```

## API Methods

### Connection Management

#### Connect
Establishes connection to the Aurigraph network and verifies health.

```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

if err := client.Connect(ctx); err != nil {
    log.Fatal(err)
}
```

#### Disconnect
Closes the connection and cleans up resources.

```go
client.Disconnect(context.Background())
```

#### IsConnected
Checks if the client is currently connected.

```go
if client.IsConnected() {
    // Safe to make requests
}
```

### Account Operations

#### GetAccount
Retrieves full account information including balance, nonce, and public key.

```go
account, err := client.GetAccount(ctx, "auri1xyz...")
if err != nil {
    log.Fatal(err)
}
fmt.Println(account.Balance)
```

#### GetBalance
Retrieves only the balance for an address.

```go
balance, err := client.GetBalance(ctx, "auri1xyz...")
if err != nil {
    log.Fatal(err)
}
fmt.Println(balance)
```

### Transaction Operations

#### SubmitTransaction
Submits a transaction to the network.

```go
tx := map[string]interface{}{
    "from":   "auri1xxx...",
    "to":     "auri1yyy...",
    "amount": "100",
    "nonce":  1,
}

result, err := client.SubmitTransaction(ctx, tx)
if err != nil {
    log.Fatal(err)
}
fmt.Println(result.Hash)
```

#### GetTransaction
Retrieves transaction details by hash.

```go
tx, err := client.GetTransaction(ctx, "0x123abc...")
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Status: %s\n", tx.Status)
```

### Blockchain Operations

#### GetLatestBlock
Retrieves the latest block on the blockchain.

```go
block, err := client.GetLatestBlock(ctx)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("Height: %d\n", block.Height)
```

## Testing

Run the test suite:

```bash
go test ./...
```

With coverage:

```bash
go test -cover ./...
```

## Best Practices

1. **Use Contexts**: Always pass context for timeout management
   ```go
   ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
   defer cancel()
   ```

2. **Check Connection**: Verify connection before operations
   ```go
   if !client.IsConnected() {
       return fmt.Errorf("not connected")
   }
   ```

3. **Handle Errors**: Always check for errors
   ```go
   account, err := client.GetAccount(ctx, address)
   if err != nil {
       // Handle error appropriately
       return err
   }
   ```

4. **Connection Management**: Use defer to ensure cleanup
   ```go
   if err := client.Connect(ctx); err != nil {
       return err
   }
   defer client.Disconnect(ctx)
   ```

5. **Concurrent Operations**: The client is thread-safe for concurrent requests
   ```go
   // Safe to use from multiple goroutines
   go client.GetAccount(ctx, "auri1xxx...")
   go client.GetAccount(ctx, "auri1yyy...")
   ```

## Error Handling

All methods return errors that can be checked:

```go
account, err := client.GetAccount(ctx, "auri1xyz...")
if err != nil {
    switch err {
    case context.DeadlineExceeded:
        // Handle timeout
    case context.Canceled:
        // Handle cancellation
    default:
        // Handle other errors
    }
}
```

## Performance

- **Connection**: <100ms typical
- **Account Query**: <50ms typical
- **Transaction Submit**: <100ms typical
- **Block Query**: <50ms typical

## Compatibility

- Go 1.21+
- All platforms: Linux, macOS, Windows

## License

Apache License 2.0 - See LICENSE file for details

## Support

For issues, questions, or contributions:
- GitHub: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- Documentation: https://docs.aurigraph.io
- Issues: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues

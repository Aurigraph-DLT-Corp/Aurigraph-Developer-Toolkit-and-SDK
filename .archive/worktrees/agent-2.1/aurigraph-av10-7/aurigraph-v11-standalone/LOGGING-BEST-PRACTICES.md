# Logging Best Practices for Aurigraph V11

## Overview

This document outlines best practices for logging in the Aurigraph V11 platform to ensure efficient troubleshooting, performance monitoring, and security auditing through the ELK stack.

---

## Table of Contents

1. [Logging Levels](#logging-levels)
2. [Structured Logging](#structured-logging)
3. [Correlation IDs](#correlation-ids)
4. [Performance Considerations](#performance-considerations)
5. [Security and Privacy](#security-and-privacy)
6. [Log Categories](#log-categories)
7. [Examples](#examples)

---

## Logging Levels

### Level Guidelines

**ERROR (Critical)**
- Use for: Exceptions, failed operations, data loss scenarios
- Action required: Immediate investigation
- Examples:
  - Transaction processing failures
  - Database connection errors
  - Consensus failures
  - Security breaches

**WARN (Warning)**
- Use for: Degraded performance, retries, fallbacks
- Action required: Review and monitor
- Examples:
  - Slow requests (>1s)
  - Failed authentication attempts
  - Cache misses
  - Retry attempts

**INFO (Informational)**
- Use for: Normal operations, business events
- Action required: None (informational only)
- Examples:
  - HTTP requests/responses
  - Transaction submissions
  - Service startup/shutdown
  - Configuration changes

**DEBUG (Detailed)**
- Use for: Detailed flow, variable values
- Action required: Development/troubleshooting only
- Examples:
  - Method entry/exit
  - Variable states
  - Detailed transaction flow
  - Cache operations

---

## Structured Logging

### Always Use Structured Data

**BAD:**
```java
LOG.info("User alice submitted transaction tx123 for amount 100.0");
```

**GOOD:**
```java
loggingService.logTransaction("tx123", "SUBMITTED",
    Map.of("from", "alice", "to", "bob", "amount", 100.0));
```

### Why Structured Logging?

1. **Searchability**: Easy to query in Elasticsearch
2. **Aggregation**: Can sum, average, and count numeric fields
3. **Filtering**: Filter by specific fields without regex
4. **Consistency**: Same format across all services

---

## Correlation IDs

### Request Tracing

Always include correlation IDs for distributed tracing:

```java
@Inject
LoggingService loggingService;

public void handleRequest(String txId) {
    String correlationId = loggingService.generateCorrelationId();
    loggingService.setCorrelationId(correlationId);

    try {
        // Process request
        loggingService.logTransaction(txId, "PROCESSING",
            Map.of("correlationId", correlationId));

        // ... business logic ...

    } finally {
        loggingService.clearCorrelationId();
    }
}
```

### Cross-Service Tracing

When calling external services, pass correlation ID:

```java
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(externalServiceUrl))
    .header("X-Correlation-ID", correlationId)
    .build();
```

---

## Performance Considerations

### Avoid Logging in Hot Paths

**BAD:**
```java
for (int i = 0; i < 1000000; i++) {
    LOG.debug("Processing iteration " + i);  // 1M log statements!
    processTransaction();
}
```

**GOOD:**
```java
long startTime = System.nanoTime();
for (int i = 0; i < 1000000; i++) {
    processTransaction();
}
long duration = System.nanoTime() - startTime;
loggingService.logPerformance("batch_processing",
    duration / 1_000_000.0, 1000000 / (duration / 1_000_000_000.0));
```

### Use Conditional Logging

```java
if (LOG.isDebugEnabled()) {
    LOG.debug("Expensive debug calculation: " + expensiveOperation());
}
```

### Async Logging

Quarkus JSON logging is already async. For additional performance:

```properties
quarkus.log.console.async=true
quarkus.log.file.async=true
quarkus.log.async.queue-length=10000
quarkus.log.async.overflow=BLOCK
```

---

## Security and Privacy

### Never Log Sensitive Data

**PROHIBITED:**
- Passwords or API keys
- Private keys or certificates
- Credit card numbers
- Personal identifiable information (PII)
- Session tokens

**BAD:**
```java
LOG.info("User login: username=" + username + ", password=" + password);
```

**GOOD:**
```java
loggingService.logSecurity("LOGIN", username, "authenticate", true,
    Map.of("ipAddress", remoteAddr, "userAgent", userAgent));
```

### Mask Sensitive Data

If you must log partial data:

```java
String maskedCardNumber = cardNumber.substring(0, 4) + "****" +
                         cardNumber.substring(cardNumber.length() - 4);
LOG.info("Payment processed: card=" + maskedCardNumber);
```

### Sanitize User Input

```java
String sanitizedInput = input.replaceAll("[^a-zA-Z0-9-_]", "");
LOG.info("Processing user input: " + sanitizedInput);
```

---

## Log Categories

### Transaction Logging

```java
@Inject
LoggingService loggingService;

public void submitTransaction(String txId, String from, String to, double amount) {
    Map<String, Object> metadata = new HashMap<>();
    metadata.put("from", from);
    metadata.put("to", to);
    metadata.put("amount", amount);
    metadata.put("timestamp", System.currentTimeMillis());

    loggingService.logTransaction(txId, "SUBMITTED", metadata);

    try {
        // Process transaction
        processTransaction(txId, from, to, amount);
        loggingService.logTransaction(txId, "CONFIRMED", metadata);
    } catch (Exception e) {
        loggingService.logError("Transaction failed", e,
            Map.of("txId", txId, "from", from, "to", to));
    }
}
```

### Consensus Logging

```java
public void handleConsensusEvent(String operation, String nodeId, long term) {
    loggingService.logConsensus(operation, nodeId, term,
        Map.of(
            "state", currentState,
            "commitIndex", commitIndex,
            "lastApplied", lastApplied
        ));
}
```

### Cryptography Logging

```java
public byte[] encryptData(byte[] data) {
    long startTime = System.nanoTime();
    boolean success = false;

    try {
        byte[] encrypted = cipher.encrypt(data);
        success = true;
        return encrypted;
    } finally {
        long duration = System.nanoTime() - startTime;
        loggingService.logCrypto("ENCRYPT", "CRYSTALS-Kyber", duration, success);
    }
}
```

### Bridge Logging

```java
public void transferCrossChain(String bridgeId, String sourceChain,
                               String destChain, double amount) {
    Map<String, Object> metadata = new HashMap<>();
    metadata.put("amount", amount);
    metadata.put("status", "INITIATED");

    loggingService.logBridge(bridgeId, sourceChain, destChain,
                            "TRANSFER_INITIATED", metadata);

    // ... bridge logic ...
}
```

### Performance Logging

```java
public void executeBatch(List<Transaction> batch) {
    long startTime = System.nanoTime();
    int processed = 0;

    try {
        for (Transaction tx : batch) {
            processTransaction(tx);
            processed++;
        }
    } finally {
        long duration = System.nanoTime() - startTime;
        double durationMs = duration / 1_000_000.0;
        double tps = processed / (durationMs / 1000.0);

        loggingService.logPerformance("batch_execution", durationMs, tps);
    }
}
```

### Security Logging

```java
public boolean authenticate(String userId, String password) {
    boolean success = false;
    String remoteAddr = getRemoteAddress();

    try {
        success = authService.authenticate(userId, password);
        return success;
    } finally {
        loggingService.logSecurity("AUTHENTICATION", userId, "login", success,
            Map.of("remoteAddr", remoteAddr, "timestamp", System.currentTimeMillis()));
    }
}
```

---

## Examples

### Complete Request Logging

```java
@Path("/api/v11/transactions")
public class TransactionResource {

    @Inject
    LoggingService loggingService;

    @Inject
    TransactionService transactionService;

    @POST
    @Path("/submit")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    public Uni<TransactionResponse> submitTransaction(TransactionRequest request) {
        String correlationId = loggingService.generateCorrelationId();
        loggingService.setCorrelationId(correlationId);

        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();

            try {
                // Log request
                loggingService.logTransaction(request.getTxId(), "RECEIVED",
                    Map.of(
                        "from", request.getFrom(),
                        "to", request.getTo(),
                        "amount", request.getAmount(),
                        "correlationId", correlationId
                    ));

                // Process transaction
                String txId = transactionService.processTransaction(
                    request.getTxId(), request.getAmount());

                // Log success
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                loggingService.logTransaction(txId, "COMPLETED",
                    Map.of("durationMs", duration, "correlationId", correlationId));

                return new TransactionResponse(txId, "SUCCESS");

            } catch (Exception e) {
                // Log error
                loggingService.logError("Transaction failed", e,
                    Map.of(
                        "txId", request.getTxId(),
                        "correlationId", correlationId,
                        "request", request
                    ));
                throw e;
            } finally {
                loggingService.clearCorrelationId();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }
}
```

### Error Handling with Context

```java
public void processWithRetry(String txId) {
    int maxRetries = 3;
    int attempt = 0;

    while (attempt < maxRetries) {
        attempt++;
        try {
            processTransaction(txId);

            if (attempt > 1) {
                loggingService.logWarning("Transaction succeeded after retry",
                    Map.of("txId", txId, "attempt", attempt));
            }
            return;

        } catch (Exception e) {
            if (attempt >= maxRetries) {
                loggingService.logError("Transaction failed after max retries", e,
                    Map.of("txId", txId, "attempts", maxRetries));
                throw e;
            } else {
                loggingService.logWarning("Transaction retry",
                    Map.of("txId", txId, "attempt", attempt,
                           "maxRetries", maxRetries, "error", e.getMessage()));
            }
        }
    }
}
```

---

## Log Analysis Queries

### Elasticsearch Queries

**Find all errors in last hour:**
```json
GET /aurigraph-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        {"term": {"log_level": "ERROR"}},
        {"range": {"@timestamp": {"gte": "now-1h"}}}
      ]
    }
  }
}
```

**Calculate average TPS:**
```json
GET /aurigraph-performance-*/_search
{
  "size": 0,
  "query": {
    "range": {"@timestamp": {"gte": "now-1h"}}
  },
  "aggs": {
    "avg_tps": {
      "avg": {"field": "transactions_per_second"}
    }
  }
}
```

**Find slow requests (>1s):**
```json
GET /aurigraph-logs-*/_search
{
  "query": {
    "bool": {
      "must": [
        {"term": {"log_category": "HTTP"}},
        {"range": {"duration_ms": {"gte": 1000}}}
      ]
    }
  },
  "sort": [{"duration_ms": "desc"}]
}
```

---

## Monitoring and Alerting

### Set Up Alerts in Kibana

1. **High Error Rate Alert**
   - Condition: Error count > 100 in 5 minutes
   - Action: Send email/Slack notification

2. **Slow Response Alert**
   - Condition: Average response time > 1s
   - Action: Send notification

3. **Failed Authentication Alert**
   - Condition: Failed login attempts > 10 in 1 minute
   - Action: Security team notification

---

## Performance Impact

### Logging Overhead

Properly configured logging should add < 5% overhead:

- **JSON serialization**: ~0.1ms per log entry
- **File I/O**: Async buffered, minimal impact
- **Network shipping**: Async to Logstash

### Optimization Tips

1. Use appropriate log levels (INFO in production)
2. Avoid string concatenation in log statements
3. Use structured logging (pre-formatted JSON)
4. Configure async handlers
5. Implement log sampling for high-volume operations

### Log Sampling Example

```java
private final AtomicLong counter = new AtomicLong(0);

public void logSampled(String message, Map<String, Object> context) {
    // Log every 100th occurrence
    if (counter.incrementAndGet() % 100 == 0) {
        loggingService.logDebug(message, context);
    }
}
```

---

## Log Rotation and Retention

### File Rotation (application.properties)

```properties
quarkus.log.file.rotation.max-file-size=100M
quarkus.log.file.rotation.max-backup-index=10
quarkus.log.file.rotation.rotate-on-boot=true
```

### Elasticsearch Retention

- **Hot tier**: Last 7 days (fast SSD storage)
- **Warm tier**: 7-30 days (slower storage)
- **Delete**: After 30 days

Configure via ILM policy (see ELK-SETUP-GUIDE.md)

---

## Compliance and Auditing

### Audit Log Requirements

For regulatory compliance, ensure:

1. **Immutability**: Logs cannot be modified after creation
2. **Retention**: Keep audit logs for required period (7 years for financial)
3. **Access Control**: Restrict log access to authorized personnel
4. **Encryption**: Encrypt logs at rest and in transit

### Audit Log Example

```java
loggingService.logSecurity("AUDIT", userId, "data_access",
    true, Map.of(
        "resource", "customer_data",
        "operation", "READ",
        "recordId", recordId,
        "timestamp", System.currentTimeMillis(),
        "ipAddress", remoteAddr
    ));
```

---

## Additional Resources

- [Quarkus Logging Guide](https://quarkus.io/guides/logging)
- [Elasticsearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Kibana Query Language (KQL)](https://www.elastic.co/guide/en/kibana/current/kuery-query.html)
- [ELK Stack Best Practices](https://www.elastic.co/blog/best-practices-for-elasticsearch-logging)

---

## Summary Checklist

- [ ] Use appropriate log levels (ERROR, WARN, INFO, DEBUG)
- [ ] Always use structured logging with LoggingService
- [ ] Include correlation IDs for request tracing
- [ ] Never log sensitive data (passwords, keys, PII)
- [ ] Avoid logging in tight loops
- [ ] Use conditional logging for expensive operations
- [ ] Include context in error logs
- [ ] Monitor log volume and performance impact
- [ ] Set up alerts for critical errors
- [ ] Configure proper log retention policies

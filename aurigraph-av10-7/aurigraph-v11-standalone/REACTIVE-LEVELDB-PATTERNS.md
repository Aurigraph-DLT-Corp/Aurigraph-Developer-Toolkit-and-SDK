# Reactive LevelDB Refactoring Patterns

**Quick Reference Guide for Service Layer Migration**

---

## Pattern 1: Simple Query (No Side Effects)

### OLD (Blocking Panache)
```java
public Uni<BigDecimal> getBalance(String address, String tokenId) {
    return Uni.createFrom().item(() -> {
        return balanceRepository
                .findByTokenAndAddress(tokenId, address)
                .map(TokenBalance::getBalance)
                .orElse(BigDecimal.ZERO);
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}
```

### NEW (Reactive LevelDB)
```java
public Uni<BigDecimal> getBalance(String address, String tokenId) {
    return balanceRepository.findByTokenAndAddress(tokenId, address)
            .map(optBalance -> optBalance
                    .map(TokenBalance::getBalance)
                    .orElse(BigDecimal.ZERO));
}
```

**Key Changes:**
- Remove `Uni.createFrom().item(() -> {})`
- Remove `.runSubscriptionOn()`
- Direct reactive chain from repository
- Handle Optional in map stage

---

## Pattern 2: Single Entity Update

### OLD (Blocking Panache)
```java
@Transactional
public Uni<Token> updateToken(String tokenId, UpdateRequest request) {
    return Uni.createFrom().item(() -> {
        Token token = tokenRepository.findByTokenId(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Not found"));

        token.updateProperties(request);
        tokenRepository.persist(token);

        return token;
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}
```

### NEW (Reactive LevelDB)
```java
public Uni<Token> updateToken(String tokenId, UpdateRequest request) {
    return tokenRepository.findByTokenId(tokenId)
            .flatMap(optToken -> {
                if (optToken.isEmpty()) {
                    return Uni.createFrom().failure(
                            new IllegalArgumentException("Not found"));
                }

                Token token = optToken.get();
                token.updateProperties(request);

                return tokenRepository.persist(token);
            });
}
```

**Key Changes:**
- Remove `@Transactional`
- Use `flatMap` for chained operations
- Convert exceptions to `Uni.createFrom().failure()`
- Return persisted entity directly

---

## Pattern 3: Multiple Entity Updates (Sequential)

### OLD (Blocking Panache)
```java
@Transactional
public Uni<TransferResult> transfer(TransferRequest request) {
    return Uni.createFrom().item(() -> {
        Token token = tokenRepository.findByTokenId(request.tokenId())
                .orElseThrow(() -> new IllegalArgumentException("Token not found"));

        TokenBalance fromBalance = balanceRepository
                .findByTokenAndAddress(request.tokenId(), request.from())
                .orElseThrow(() -> new IllegalArgumentException("From balance not found"));

        TokenBalance toBalance = balanceRepository
                .findByTokenAndAddress(request.tokenId(), request.to())
                .orElse(new TokenBalance(...));

        // Update balances
        fromBalance.subtract(request.amount());
        toBalance.add(request.amount());

        // Persist changes
        balanceRepository.persist(fromBalance);
        balanceRepository.persist(toBalance);

        // Update token
        token.recordTransfer();
        tokenRepository.persist(token);

        return new TransferResult(...);
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}
```

### NEW (Reactive LevelDB)
```java
public Uni<TransferResult> transfer(TransferRequest request) {
    return tokenRepository.findByTokenId(request.tokenId())
            .flatMap(optToken -> {
                if (optToken.isEmpty()) {
                    return Uni.createFrom().failure(
                            new IllegalArgumentException("Token not found"));
                }

                Token token = optToken.get();

                return balanceRepository.findByTokenAndAddress(request.tokenId(), request.from())
                        .flatMap(optFromBalance -> {
                            if (optFromBalance.isEmpty()) {
                                return Uni.createFrom().failure(
                                        new IllegalArgumentException("From balance not found"));
                            }

                            TokenBalance fromBalance = optFromBalance.get();

                            return balanceRepository.findByTokenAndAddress(request.tokenId(), request.to())
                                    .flatMap(optToBalance -> {
                                        TokenBalance toBalance = optToBalance.orElse(new TokenBalance(...));

                                        // Update balances
                                        fromBalance.subtract(request.amount());
                                        toBalance.add(request.amount());

                                        // Persist both balances reactively
                                        return balanceRepository.persist(fromBalance)
                                                .flatMap(savedFrom ->
                                                        balanceRepository.persist(toBalance)
                                                                .flatMap(savedTo -> {
                                                                    // Update token
                                                                    token.recordTransfer();

                                                                    return tokenRepository.persist(token)
                                                                            .map(savedToken ->
                                                                                    new TransferResult(...)
                                                                            );
                                                                })
                                                );
                                    });
                        });
            });
}
```

**Key Changes:**
- Nest `flatMap` calls for sequential operations
- Each persist operation returns a `Uni` that feeds the next operation
- Final operation uses `map` (not `flatMap`) to return result
- All error handling converts to `Uni.createFrom().failure()`

---

## Pattern 4: Conditional Logic with Side Effects

### OLD (Blocking Panache)
```java
@Transactional
public Uni<Token> createRWAToken(RWATokenRequest request) {
    return Uni.createFrom().item(() -> {
        Token token = new Token();
        // ... setup token properties

        tokenRepository.persist(token);

        // Conditional balance creation
        if (request.totalSupply().compareTo(BigDecimal.ZERO) > 0) {
            TokenBalance ownerBalance = new TokenBalance(...);
            balanceRepository.persist(ownerBalance);

            token.updateHolderCount(1);
            tokenRepository.persist(token);
        }

        return token;
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}
```

### NEW (Reactive LevelDB)
```java
public Uni<Token> createRWAToken(RWATokenRequest request) {
    Token token = new Token();
    // ... setup token properties

    return tokenRepository.persist(token)
            .flatMap(savedToken -> {
                // Conditional balance creation
                if (request.totalSupply().compareTo(BigDecimal.ZERO) > 0) {
                    TokenBalance ownerBalance = new TokenBalance(...);

                    return balanceRepository.persist(ownerBalance)
                            .flatMap(savedBalance -> {
                                savedToken.updateHolderCount(1);
                                return tokenRepository.persist(savedToken);
                            });
                } else {
                    return Uni.createFrom().item(savedToken);
                }
            });
}
```

**Key Changes:**
- Persist entity first, then handle conditionals in `flatMap`
- Use `Uni.createFrom().item()` for the "else" branch
- Nest additional operations inside conditional blocks

---

## Pattern 5: Query with Aggregation

### OLD (Blocking Panache)
```java
public Uni<List<TokenHolder>> getTokenHolders(String tokenId, int limit) {
    return Uni.createFrom().item(() -> {
        List<TokenBalance> balances = balanceRepository.findTopHolders(tokenId, limit);

        Token token = tokenRepository.findByTokenId(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Token not found"));

        return balances.stream()
                .map(balance -> new TokenHolder(
                        balance.getAddress(),
                        balance.getBalance(),
                        calculatePercentage(balance.getBalance(), token.getTotalSupply()),
                        balance.getLastTransferAt()
                ))
                .toList();
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}
```

### NEW (Reactive LevelDB)
```java
public Uni<List<TokenHolder>> getTokenHolders(String tokenId, int limit) {
    return tokenRepository.findByTokenId(tokenId)
            .flatMap(optToken -> {
                if (optToken.isEmpty()) {
                    return Uni.createFrom().failure(
                            new IllegalArgumentException("Token not found"));
                }
                Token token = optToken.get();

                return balanceRepository.findTopHolders(tokenId, limit)
                        .map(balances -> balances.stream()
                                .map(balance -> new TokenHolder(
                                        balance.getAddress(),
                                        balance.getBalance(),
                                        calculatePercentage(balance.getBalance(), token.getTotalSupply()),
                                        balance.getLastTransferAt()
                                ))
                                .toList());
            });
}
```

**Key Changes:**
- Fetch token first, then fetch balances in `flatMap`
- Use `map` (not `flatMap`) for stream transformations
- Close with final `.toList()`

---

## Pattern 6: Statistics Aggregation

### OLD (Blocking Panache)
```java
public Uni<Map<String, Object>> getStatistics() {
    return Uni.createFrom().item(() -> {
        Map<String, Object> stats = new HashMap<>();

        TokenRepository.TokenStatistics tokenStats = tokenRepository.getStatistics();
        stats.put("tokenStatistics", Map.of(
                "totalTokens", tokenStats.totalTokens(),
                "fungibleTokens", tokenStats.fungibleTokens(),
                ...
        ));

        stats.put("timestamp", Instant.now());

        return stats;
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}
```

### NEW (Reactive LevelDB)
```java
public Uni<Map<String, Object>> getStatistics() {
    return tokenRepository.getStatistics()
            .map(tokenStats -> {
                Map<String, Object> stats = new HashMap<>();

                stats.put("tokenStatistics", Map.of(
                        "totalTokens", tokenStats.totalTokens(),
                        "fungibleTokens", tokenStats.fungibleTokens(),
                        ...
                ));

                stats.put("timestamp", Instant.now());

                return stats;
            });
}
```

**Key Changes:**
- Repository method already returns `Uni<>`
- Use `map` to transform statistics into response format
- No need for `flatMap` since no additional async operations

---

## Common Patterns Summary

| Pattern | Use Case | Primary Operators |
|---------|----------|-------------------|
| Simple Query | Read-only, no side effects | `map`, `orElse` |
| Single Update | Modify one entity | `flatMap` → `persist` |
| Multiple Updates | Modify multiple entities | Nested `flatMap` chains |
| Conditional Logic | If/else with async ops | `flatMap` with `Uni.createFrom().item()` |
| Aggregation | Combine multiple queries | `flatMap` → `map` |
| Statistics | Repository aggregations | `map` only |

---

## Error Handling Patterns

### Convert Exceptions to Failures
```java
// OLD
Token token = repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Not found"));

// NEW
return repository.findById(id)
        .flatMap(opt -> opt.isEmpty()
                ? Uni.createFrom().failure(new IllegalArgumentException("Not found"))
                : Uni.createFrom().item(opt.get()));

// OR (cleaner)
return repository.findById(id)
        .flatMap(opt -> {
            if (opt.isEmpty()) {
                return Uni.createFrom().failure(new IllegalArgumentException("Not found"));
            }
            // Continue processing...
        });
```

### Validation Checks
```java
// Reactive validation in chain
return repository.findById(id)
        .flatMap(optEntity -> {
            if (optEntity.isEmpty()) {
                return Uni.createFrom().failure(new IllegalArgumentException("Entity not found"));
            }

            Entity entity = optEntity.get();

            if (entity.isInvalid()) {
                return Uni.createFrom().failure(new IllegalStateException("Entity is invalid"));
            }

            // Continue processing...
            return repository.persist(entity);
        });
```

---

## Repository Method Signatures

All LevelDB repository methods return reactive types:

```java
// Query methods
Uni<Optional<Entity>> findById(String id)
Uni<List<Entity>> findBy(Predicate<Entity> predicate)
Uni<List<Entity>> listAll()
Uni<Long> count()
Uni<Long> countBy(Predicate<Entity> predicate)

// Persistence methods
Uni<Entity> persist(Entity entity)
Uni<Void> delete(Entity entity)
Uni<Boolean> deleteById(String id)

// Batch operations
Uni<Void> batchWrite(List<Entity> entities, List<String> deleteKeys)
```

---

## Refactoring Checklist

When refactoring a service method:

- [ ] Remove `@Transactional` annotation
- [ ] Remove `Uni.createFrom().item(() -> { ... })`
- [ ] Remove `.runSubscriptionOn(r -> Thread.startVirtualThread(r))`
- [ ] Convert `.orElseThrow()` to `Uni.createFrom().failure()`
- [ ] Use `flatMap` for chained async operations
- [ ] Use `map` for final transformations
- [ ] Handle Optional with `.isEmpty()` checks
- [ ] Test compilation with `./mvnw clean compile`
- [ ] Verify all business logic preserved

---

## Performance Considerations

### Good Practices
1. **Minimize flatMap depth:** Try to keep chains < 5 levels deep
2. **Avoid blocking calls:** Never use `.await().indefinitely()` in reactive chains
3. **Batch operations:** Use repository batch methods when updating multiple entities
4. **Cache frequently accessed data:** Use Caffeine cache for hot data

### Anti-Patterns to Avoid
```java
// DON'T: Blocking in reactive chain
.flatMap(entity -> {
    SomeResult result = someBlockingCall(); // BAD!
    return Uni.createFrom().item(result);
})

// DO: Keep it reactive
.flatMap(entity -> someReactiveCall())

// DON'T: Multiple sequential awaits
Entity1 e1 = repo1.findById(id).await().indefinitely(); // BAD!
Entity2 e2 = repo2.findById(id).await().indefinitely(); // BAD!

// DO: Compose reactively
return repo1.findById(id)
        .flatMap(e1 -> repo2.findById(id)
                .map(e2 -> combine(e1, e2)));
```

---

## Testing Reactive Methods

### Unit Test Example
```java
@Test
void testMintToken() {
    // Setup
    Token token = new Token();
    token.setTokenId("TOKEN_123");

    when(tokenRepository.findByTokenId("TOKEN_123"))
            .thenReturn(Uni.createFrom().item(Optional.of(token)));
    when(tokenRepository.persist(any()))
            .thenReturn(Uni.createFrom().item(token));
    when(balanceRepository.findByTokenAndAddress(anyString(), anyString()))
            .thenReturn(Uni.createFrom().item(Optional.empty()));
    when(balanceRepository.persist(any()))
            .thenReturn(Uni.createFrom().item(new TokenBalance()));
    when(balanceRepository.countHolders(anyString()))
            .thenReturn(Uni.createFrom().item(1L));

    // Execute
    MintResult result = service.mintToken(new MintRequest("TOKEN_123", "addr1", BigDecimal.TEN))
            .await().indefinitely();

    // Verify
    assertNotNull(result);
    assertEquals("TOKEN_123", result.tokenId());
}
```

---

**End of Quick Reference Guide**
**Use these patterns for consistent reactive LevelDB refactoring across all service layers**

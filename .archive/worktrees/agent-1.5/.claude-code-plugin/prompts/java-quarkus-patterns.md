# Java + Quarkus Development Patterns for Aurigraph

This prompt provides best practices and patterns for developing Aurigraph services using Java 21, Quarkus 3.x, and reactive programming.

## Context

Aurigraph V11 uses:
- **Java 21** with Virtual Threads
- **Quarkus 3.28+** with reactive programming (Mutiny)
- **GraalVM** native compilation
- **gRPC** and REST for APIs
- **Reactive Streams** for high throughput

## Core Patterns

### 1. Reactive REST Endpoints

Use `Uni` and `Multi` for non-blocking operations:

```java
@Path("/api/v11/resource")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MyResource {

    @Inject
    MyService service;

    // Single item response
    @GET
    @Path("/{id}")
    public Uni<ResponseType> getById(@PathParam("id") String id) {
        return service.findById(id)
            .onItem().ifNull().failWith(() -> new NotFoundException("Not found"))
            .onFailure().recoverWithItem(error -> handleError(error));
    }

    // Stream response
    @GET
    @Path("/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    public Multi<EventType> streamEvents() {
        return service.streamEvents()
            .onItem().transform(this::enrichEvent);
    }

    // Async processing
    @POST
    public Uni<Response> create(RequestType request) {
        return service.create(request)
            .map(result -> Response.status(201).entity(result).build());
    }
}
```

### 2. Service Layer with Virtual Threads

```java
@ApplicationScoped
public class MyService {

    // Run on virtual threads for blocking operations
    @RunOnVirtualThread
    public Uni<Result> processBlockingOperation(Input input) {
        return Uni.createFrom().item(() -> {
            // Blocking operation here (DB call, file I/O, etc.)
            return performBlockingWork(input);
        });
    }

    // Pure reactive operation
    public Uni<Result> processReactive(Input input) {
        return reactiveClient.process(input)
            .onItem().transform(this::mapToResult)
            .onFailure().retry().atMost(3);
    }

    // Parallel processing
    public Uni<List<Result>> processMultiple(List<Input> inputs) {
        List<Uni<Result>> unis = inputs.stream()
            .map(this::processReactive)
            .collect(Collectors.toList());

        return Uni.combine().all().unis(unis).combinedWith(results ->
            results.stream()
                .map(r -> (Result) r)
                .collect(Collectors.toList())
        );
    }
}
```

### 3. gRPC Service Implementation

```java
@GrpcService
public class MyGrpcService implements MyServiceGrpc.MyServiceImplBase {

    @Inject
    BusinessLogic logic;

    @Override
    public Uni<Response> process(Request request) {
        return logic.process(request)
            .onItem().transform(result -> Response.newBuilder()
                .setResult(result)
                .build())
            .onFailure().recoverWithItem(error ->
                Response.newBuilder()
                    .setError(error.getMessage())
                    .build()
            );
    }

    @Override
    public Multi<StreamResponse> streamData(StreamRequest request) {
        return logic.streamData(request)
            .onItem().transform(item -> StreamResponse.newBuilder()
                .setData(item)
                .build());
    }
}
```

### 4. Database Access with Hibernate Reactive

```java
@ApplicationScoped
public class EntityRepository {

    @Inject
    Mutiny.SessionFactory sessionFactory;

    public Uni<Entity> findById(Long id) {
        return sessionFactory.withSession(session ->
            session.find(Entity.class, id)
        );
    }

    public Uni<List<Entity>> findAll() {
        return sessionFactory.withSession(session ->
            session.createQuery("FROM Entity", Entity.class)
                .getResultList()
        );
    }

    @Transactional
    public Uni<Entity> save(Entity entity) {
        return sessionFactory.withTransaction((session, tx) ->
            session.persist(entity)
                .replaceWith(entity)
        );
    }

    public Uni<Long> count() {
        return sessionFactory.withSession(session ->
            session.createQuery("SELECT COUNT(e) FROM Entity e", Long.class)
                .getSingleResult()
        );
    }
}
```

### 5. Error Handling

```java
public class GlobalExceptionHandler {

    @ServerExceptionMapper
    public Response handleNotFoundException(NotFoundException ex) {
        return Response.status(404)
            .entity(new ErrorResponse("NOT_FOUND", ex.getMessage()))
            .build();
    }

    @ServerExceptionMapper
    public Response handleValidationException(ValidationException ex) {
        return Response.status(400)
            .entity(new ErrorResponse("VALIDATION_ERROR", ex.getMessage()))
            .build();
    }

    @ServerExceptionMapper
    public Response handleGenericException(Exception ex) {
        Log.error("Unexpected error", ex);
        return Response.status(500)
            .entity(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"))
            .build();
    }
}
```

### 6. Configuration Injection

```java
@ApplicationScoped
public class MyService {

    @ConfigProperty(name = "app.feature.enabled", defaultValue = "false")
    boolean featureEnabled;

    @ConfigProperty(name = "app.max.connections")
    int maxConnections;

    @ConfigProperty(name = "app.timeout.seconds")
    Optional<Integer> timeoutSeconds;

    // Use injected config
    public void doSomething() {
        if (featureEnabled) {
            // Feature logic
        }
    }
}
```

### 7. Caching

```java
@ApplicationScoped
public class CachedService {

    // Cache for 10 minutes
    @CacheResult(cacheName = "my-cache")
    public Uni<Result> getExpensiveData(@CacheKey String key) {
        return computeExpensiveData(key);
    }

    // Invalidate cache
    @CacheInvalidate(cacheName = "my-cache")
    public Uni<Void> update(@CacheKey String key, Data data) {
        return performUpdate(key, data);
    }

    // Invalidate all
    @CacheInvalidateAll(cacheName = "my-cache")
    public Uni<Void> clearAll() {
        return Uni.createFrom().voidItem();
    }
}
```

### 8. Health Checks

```java
@Readiness
public class MyHealthCheck implements HealthCheck {

    @Inject
    MyService service;

    @Override
    public HealthCheckResponse call() {
        boolean isHealthy = service.checkHealth();

        return HealthCheckResponse.named("my-service")
            .status(isHealthy)
            .withData("connections", service.getActiveConnections())
            .withData("uptime", service.getUptimeSeconds())
            .build();
    }
}
```

### 9. Performance Optimization

```java
@ApplicationScoped
public class OptimizedService {

    // Batch processing
    public Uni<List<Result>> processBatch(List<Input> inputs) {
        // Process in chunks for memory efficiency
        int chunkSize = 1000;
        List<List<Input>> chunks = partition(inputs, chunkSize);

        return Multi.createFrom().iterable(chunks)
            .onItem().transformToUniAndMerge(chunk ->
                processChunk(chunk)
            )
            .collect().asList();
    }

    // Connection pooling
    @Inject
    @ConfigProperty(name = "quarkus.datasource.reactive.max-size", defaultValue = "20")
    int maxPoolSize;

    // Object pooling for high-frequency allocations
    private final ObjectPool<HeavyObject> objectPool =
        new ObjectPool<>(() -> new HeavyObject(), 100);

    public Uni<Result> processWithPooling() {
        HeavyObject obj = objectPool.borrowObject();
        try {
            return processWithObject(obj);
        } finally {
            objectPool.returnObject(obj);
        }
    }
}
```

### 10. Testing Patterns

```java
@QuarkusTest
public class MyResourceTest {

    @Test
    public void testGetEndpoint() {
        given()
            .when().get("/api/v11/resource/123")
            .then()
            .statusCode(200)
            .body("id", equalTo("123"));
    }

    @Test
    public void testPostEndpoint() {
        RequestType request = new RequestType("test");

        given()
            .contentType(MediaType.APPLICATION_JSON)
            .body(request)
            .when().post("/api/v11/resource")
            .then()
            .statusCode(201);
    }

    @InjectMock
    MyService mockService;

    @Test
    public void testWithMock() {
        when(mockService.process(any()))
            .thenReturn(Uni.createFrom().item(expectedResult));

        // Test logic
    }
}
```

## Performance Guidelines

1. **Use Virtual Threads** for blocking I/O operations
2. **Batch operations** when processing multiple items
3. **Stream large results** instead of loading all at once
4. **Cache expensive computations** with appropriate TTL
5. **Use connection pooling** with proper sizing
6. **Monitor GC** and tune heap settings for target load
7. **Prefer Uni/Multi** over CompletableFuture for better composition
8. **Use @RunOnVirtualThread** judiciously - only for blocking operations

## Native Compilation Considerations

```java
// Register classes for reflection
@RegisterForReflection
public class MyEntity {
    // Entity fields
}

// Register resources
@RegisterForReflection(targets = {
    MyClass1.class,
    MyClass2.class
})

// Avoid reflection-heavy libraries in hot paths
// Prefer compile-time code generation where possible
```

## Common Pitfalls

1. ❌ **Blocking on Uni/Multi**: Don't call `.await()` in reactive code
2. ❌ **Mixing blocking and reactive**: Use `@RunOnVirtualThread` properly
3. ❌ **Large object allocation**: Use object pooling for high-frequency objects
4. ❌ **Unbounded streams**: Always apply backpressure
5. ❌ **Synchronous logging**: Use async appenders for high throughput
6. ❌ **Not handling failures**: Always add `.onFailure()` handlers
7. ❌ **Forgetting transactions**: Use `@Transactional` for data modifications

## Checklist

When implementing a new service:
- [ ] Use reactive types (Uni/Multi)
- [ ] Add proper error handling
- [ ] Implement health checks
- [ ] Add configuration injection
- [ ] Write unit and integration tests
- [ ] Consider caching for expensive operations
- [ ] Profile memory usage under load
- [ ] Test native compilation
- [ ] Document API with OpenAPI annotations
- [ ] Monitor performance metrics

## Resources

- Quarkus Reactive Guide: https://quarkus.io/guides/mutiny-primer
- Virtual Threads: https://quarkus.io/guides/virtual-threads
- gRPC: https://quarkus.io/guides/grpc-getting-started
- Native Compilation: https://quarkus.io/guides/building-native-image

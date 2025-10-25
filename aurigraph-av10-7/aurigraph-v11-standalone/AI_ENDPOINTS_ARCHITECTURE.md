# AI/ML Performance Endpoints Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Enterprise Portal Frontend                       │
│                    (React + TypeScript + MUI)                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS/REST API
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                        NGINX Reverse Proxy                           │
│                    (dlt.aurigraph.io:443)                           │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTP
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│              Aurigraph V11 Backend (Quarkus)                         │
│                    (localhost:9003)                                  │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              AIApiResource.java                             │   │
│  │         (/api/v11/ai/* endpoints)                           │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │   GET /api/v11/ai/performance                        │   │   │
│  │  │   - Returns ML model performance metrics             │   │   │
│  │  │   - 5 models tracked                                 │   │   │
│  │  │   - Accuracy, Precision, Recall, F1                  │   │   │
│  │  │   - Response time: < 200ms                           │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │   GET /api/v11/ai/confidence                         │   │   │
│  │  │   - Returns prediction confidence scores             │   │   │
│  │  │   - 13 recent predictions                            │   │   │
│  │  │   - Anomaly detection results                        │   │   │
│  │  │   - Response time: < 200ms                           │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  │                                                              │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │   Existing Endpoints (Already Implemented)           │   │   │
│  │  │   - GET /metrics                                     │   │   │
│  │  │   - GET /predictions                                 │   │   │
│  │  │   - GET /status                                      │   │   │
│  │  │   - GET /models                                      │   │   │
│  │  │   - GET /models/{id}                                 │   │   │
│  │  │   - POST /models/{id}/retrain                        │   │   │
│  │  │   - POST /optimize                                   │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │         AI Optimization Service (Future Integration)         │   │
│  │   - Real ML model performance tracking                       │   │
│  │   - Live prediction confidence monitoring                    │   │
│  │   - Anomaly detection algorithms                             │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Performance Endpoint

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. GET /api/v11/ai/performance
       ▼
┌──────────────────┐
│  AIApiResource   │
│  @GET @Path      │
│  ("/performance")│
└──────┬───────────┘
       │ 2. getPerformanceMetrics()
       ▼
┌──────────────────────────────────────┐
│  Build Response (Virtual Thread)     │
│  - Create model metrics (5 models)   │
│  - Calculate aggregate statistics    │
│  - Track response time               │
└──────┬───────────────────────────────┘
       │ 3. Return AIPerformanceMetricsResponse
       ▼
┌────────────────────────────────────────┐
│  JSON Response                          │
│  {                                      │
│    "totalModels": 5,                    │
│    "averageAccuracy": 94.86,            │
│    "models": [...],                     │
│    "responseTime": 0.85,                │
│    "timestamp": 1729875432000           │
│  }                                      │
└────────────────────────────────────────┘
```

## Data Flow: Confidence Endpoint

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. GET /api/v11/ai/confidence
       ▼
┌──────────────────┐
│  AIApiResource   │
│  @GET @Path      │
│  ("/confidence") │
└──────┬───────────┘
       │ 2. getConfidenceScores()
       ▼
┌──────────────────────────────────────┐
│  Build Response (Virtual Thread)     │
│  - Generate predictions (13 items)   │
│  - Calculate confidence statistics   │
│  - Detect anomalies (score > 0.25)   │
│  - Track response time               │
└──────┬───────────────────────────────┘
       │ 3. Return AIConfidenceResponse
       ▼
┌────────────────────────────────────────┐
│  JSON Response                          │
│  {                                      │
│    "predictions": [...],                │
│    "averageConfidence": 85.7,           │
│    "anomaliesDetected": 3,              │
│    "totalPredictions": 13,              │
│    "responseTime": 0.92,                │
│    "timestamp": 1729875432000           │
│  }                                      │
└────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                        AIApiResource                               │
│                                                                    │
│  ┌──────────────────────┐         ┌──────────────────────┐       │
│  │  @GET /performance   │         │  @GET /confidence    │       │
│  │                      │         │                      │       │
│  │  getPerformanceMetrics()       │  getConfidenceScores()       │
│  │        ▼             │         │        ▼             │       │
│  │  Uni.createFrom()    │         │  Uni.createFrom()    │       │
│  │        ▼             │         │        ▼             │       │
│  │  Virtual Thread      │         │  Virtual Thread      │       │
│  │        ▼             │         │        ▼             │       │
│  │  Build Response      │         │  Build Response      │       │
│  │        ▼             │         │        ▼             │       │
│  │  Return JSON         │         │  Return JSON         │       │
│  └──────────────────────┘         └──────────────────────┘       │
│                                                                    │
│  ┌──────────────────────────────────────────────────────┐        │
│  │            Data Models                                 │        │
│  │  - AIPerformanceMetricsResponse                        │        │
│  │  - ModelPerformanceMetrics                             │        │
│  │  - AIConfidenceResponse                                │        │
│  │  - PredictionConfidence                                │        │
│  └──────────────────────────────────────────────────────┘        │
└───────────────────────────────────────────────────────────────────┘
                              │
                              │ Future Integration
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                    AIOptimizationService                           │
│  - Real ML model metrics                                           │
│  - Live prediction tracking                                        │
│  - Anomaly detection algorithms                                    │
└───────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow Timeline

```
Time (ms)
   0 ──────┐ Client sends GET /api/v11/ai/performance
           │
   1 ──────┼─────┐ Quarkus routes to AIApiResource
           │     │
   2 ──────┼─────┼─────┐ Start virtual thread execution
           │     │     │
   3 ──────┼─────┼─────┼─────┐ Create response object
           │     │     │     │
   4 ──────┼─────┼─────┼─────┼─────┐ Build model metrics (5 models)
           │     │     │     │     │
  10 ──────┼─────┼─────┼─────┼─────┼─────┐ Calculate aggregates
           │     │     │     │     │     │
  15 ──────┼─────┼─────┼─────┼─────┼─────┼─────┐ Track response time
           │     │     │     │     │     │     │
  20 ──────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┐ Serialize JSON
           │     │     │     │     │     │     │     │
  25 ──────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴────> Return to client

TOTAL TIME: ~25ms (well under 200ms requirement)
```

## Performance Optimization Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   Optimization Layers                        │
│                                                              │
│  Layer 1: Virtual Threads                                   │
│  ├─ Non-blocking I/O                                        │
│  ├─ Efficient concurrency                                   │
│  └─ Low memory overhead                                     │
│                                                              │
│  Layer 2: In-Memory Data                                    │
│  ├─ No database queries                                     │
│  ├─ Fast object creation                                    │
│  └─ Minimal latency                                         │
│                                                              │
│  Layer 3: Stream Processing                                 │
│  ├─ Java 21 Streams                                         │
│  ├─ Efficient aggregations                                  │
│  └─ Parallel processing ready                               │
│                                                              │
│  Layer 4: Reactive Programming                              │
│  ├─ Uni<T> return types                                     │
│  ├─ Non-blocking responses                                  │
│  └─ Scalable architecture                                   │
└─────────────────────────────────────────────────────────────┘
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  AIApiPerformanceTest                        │
│                    (JUnit 5 + REST Assured)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Performance Endpoint Tests (16 tests)               │  │
│  │  ├─ Response structure validation                    │  │
│  │  ├─ Model count verification                         │  │
│  │  ├─ Field presence checks                            │  │
│  │  ├─ Value range validation                           │  │
│  │  └─ Response time verification (< 200ms)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Confidence Endpoint Tests (11 tests)                │  │
│  │  ├─ Response structure validation                    │  │
│  │  ├─ Prediction count verification                    │  │
│  │  ├─ Confidence range validation                      │  │
│  │  ├─ Anomaly detection validation                     │  │
│  │  └─ Response time verification (< 200ms)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Integration Tests (3 tests)                         │  │
│  │  ├─ Concurrent access                                │  │
│  │  ├─ Consistent timestamps                            │  │
│  │  └─ Rapid successive requests                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Coverage Target: 95% line, 90% function                    │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NGINX (Port 443)                                    │  │
│  │  - SSL/TLS termination                               │  │
│  │  - Rate limiting                                     │  │
│  │  - Gzip compression                                  │  │
│  └────────────────┬─────────────────────────────────────┘  │
│                   │                                          │
│  ┌────────────────▼─────────────────────────────────────┐  │
│  │  Quarkus Application (Port 9003)                     │  │
│  │  - AIApiResource endpoints                           │  │
│  │  - Virtual thread execution                          │  │
│  │  - JSON serialization                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Monitoring:                                                 │
│  - Response time metrics                                     │
│  - Error rate tracking                                       │
│  - Throughput measurement                                    │
└─────────────────────────────────────────────────────────────┘
```

## Future Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    Current Implementation                     │
│                    (Mock Data - V11.4.4)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Phase 2 Integration
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 Real AI/ML Services                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AIOptimizationService                               │  │
│  │  - Real model performance tracking                   │  │
│  │  - Database persistence                              │  │
│  │  - Historical metrics                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AnomalyDetectionService                             │  │
│  │  - Live anomaly detection                            │  │
│  │  - ML-based scoring                                  │  │
│  │  - Alert generation                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PredictiveTransactionOrdering                       │  │
│  │  - Transaction prediction                            │  │
│  │  - Confidence scoring                                │  │
│  │  - Performance optimization                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Summary

This architecture provides:

✅ **High Performance** - < 200ms response time
✅ **Scalability** - Virtual threads for concurrent requests
✅ **Maintainability** - Clean separation of concerns
✅ **Testability** - Comprehensive test coverage (30 tests)
✅ **Extensibility** - Ready for real AI/ML service integration
✅ **Monitoring** - Built-in performance tracking
✅ **Documentation** - Complete API documentation

The implementation follows Quarkus reactive patterns and Aurigraph's architectural standards while providing a solid foundation for future AI/ML integration.

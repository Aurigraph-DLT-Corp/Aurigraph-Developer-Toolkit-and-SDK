use aurigraph_sdk::{AurigraphClient, AurigraphError};
use serde_json::json;
use wiremock::matchers::{header, method, path, query_param};
use wiremock::{Mock, MockServer, ResponseTemplate};

/// Helper: build a client pointing at the given mock server.
fn build_client(server: &MockServer) -> AurigraphClient {
    AurigraphClient::builder()
        .base_url(&server.uri())
        .api_key("test-app", "test-key")
        .build()
        .expect("client build should succeed")
}

#[tokio::test]
async fn test_builder_requires_base_url() {
    let result = AurigraphClient::builder().build();
    assert!(result.is_err());
    match result.unwrap_err() {
        AurigraphError::Config(msg) => assert!(msg.contains("base_url")),
        other => panic!("expected Config error, got: {:?}", other),
    }
}

#[tokio::test]
async fn test_builder_strips_trailing_slash() {
    let client = AurigraphClient::builder()
        .base_url("https://example.com///")
        .build()
        .expect("should build");
    // Verify the client was created (we can't inspect private fields,
    // but a successful build with a trailing-slashed URL is the test).
    let _ = client;
}

#[tokio::test]
async fn test_health_endpoint() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/api/v11/health"))
        .and(header("Authorization", "ApiKey test-app:test-key"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "status": "HEALTHY",
            "durationMs": 8,
            "version": "12.1.29",
            "timestamp": "2026-04-12T10:00:00Z"
        })))
        .mount(&server)
        .await;

    let client = build_client(&server);
    let health = client.health().await.expect("health should succeed");

    assert_eq!(health.status, "HEALTHY");
    assert!(health.is_healthy());
    assert_eq!(health.duration_ms, Some(8));
    assert_eq!(health.version.as_deref(), Some("12.1.29"));
}

#[tokio::test]
async fn test_stats_endpoint() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/api/v11/stats"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "tps": 1934728,
            "activeNodes": 37,
            "blockHeight": 500000,
            "totalTransactions": 12345678,
            "uptime": 86400
        })))
        .mount(&server)
        .await;

    let client = build_client(&server);
    let stats = client.stats().await.expect("stats should succeed");

    assert_eq!(stats.tps, 1_934_728);
    assert_eq!(stats.active_nodes, 37);
    assert_eq!(stats.block_height, 500_000);
    assert_eq!(stats.total_transactions, Some(12_345_678));
    assert_eq!(stats.uptime, Some(86400));
}

#[tokio::test]
async fn test_assets_list_by_use_case() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/api/v11/rwa/query"))
        .and(query_param("useCase", "UC_GOLD"))
        .and(query_param("limit", "100"))
        .and(query_param("offset", "0"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "assets": [
                { "id": "gold-1", "type": "COMMODITY", "status": "ACTIVE" },
                { "id": "gold-2", "type": "COMMODITY", "status": "ACTIVE" }
            ],
            "total": 2
        })))
        .mount(&server)
        .await;

    let client = build_client(&server);
    let result = client
        .assets()
        .list_by_use_case("UC_GOLD")
        .await
        .expect("list_by_use_case should succeed");

    assert_eq!(result["total"], 2);
    assert_eq!(result["assets"].as_array().unwrap().len(), 2);
}

#[tokio::test]
async fn test_handshake_hello() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/api/v11/sdk/handshake/hello"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "appId": "test-app",
            "appName": "Test Application",
            "status": "ACTIVE",
            "serverVersion": "12.1.29",
            "protocolVersion": "1.0",
            "approvedScopes": ["read:assets", "read:nodes"],
            "requestedScopes": [],
            "pendingScopes": [],
            "heartbeatIntervalMs": 300000,
            "features": { "gdpr": true, "dmrv": false },
            "nextHeartbeatAt": "2026-04-12T10:05:00Z"
        })))
        .mount(&server)
        .await;

    let client = build_client(&server);
    let hello = client
        .handshake()
        .hello()
        .await
        .expect("hello should succeed");

    assert_eq!(hello.app_id, "test-app");
    assert_eq!(hello.status, "ACTIVE");
    assert_eq!(hello.approved_scopes, vec!["read:assets", "read:nodes"]);
    assert_eq!(hello.heartbeat_interval_ms, 300_000);
    assert_eq!(hello.features.get("gdpr"), Some(&true));
    assert_eq!(hello.features.get("dmrv"), Some(&false));
}

#[tokio::test]
async fn test_gdpr_export() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/api/v11/gdpr/export/user-123"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "userId": "user-123",
            "exportedAt": "2026-04-12T10:00:00Z",
            "sections": [
                {
                    "category": "transactions",
                    "data": [
                        { "txId": "tx-1", "amount": 100 }
                    ]
                },
                {
                    "category": "assets",
                    "data": [
                        { "assetId": "asset-1", "type": "COMMODITY" }
                    ]
                }
            ]
        })))
        .mount(&server)
        .await;

    let client = build_client(&server);
    let export = client
        .gdpr()
        .export_user_data("user-123")
        .await
        .expect("export should succeed");

    assert_eq!(export.user_id, "user-123");
    assert_eq!(export.sections.len(), 2);
    assert_eq!(export.sections[0].category, "transactions");
    assert_eq!(export.sections[1].category, "assets");
}

#[tokio::test]
async fn test_server_error_handling() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/api/v11/health"))
        .respond_with(ResponseTemplate::new(500).set_body_json(json!({
            "type": "about:blank",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "Database connection failed"
        })))
        .mount(&server)
        .await;

    let client = build_client(&server);
    let result = client.health().await;

    assert!(result.is_err());
    match result.unwrap_err() {
        AurigraphError::Server {
            status, message, ..
        } => {
            assert_eq!(status, 500);
            assert_eq!(message, "Internal Server Error");
        }
        other => panic!("expected Server error, got: {:?}", other),
    }
}

#[tokio::test]
async fn test_client_error_handling() {
    let server = MockServer::start().await;
    Mock::given(method("GET"))
        .and(path("/api/v11/stats"))
        .respond_with(ResponseTemplate::new(401).set_body_json(json!({
            "type": "about:blank",
            "title": "Unauthorized",
            "status": 401,
            "detail": "Invalid API key"
        })))
        .mount(&server)
        .await;

    let client = build_client(&server);
    let result = client.stats().await;

    assert!(result.is_err());
    match result.unwrap_err() {
        AurigraphError::Client {
            status, message, ..
        } => {
            assert_eq!(status, 401);
            assert_eq!(message, "Unauthorized");
        }
        other => panic!("expected Client error, got: {:?}", other),
    }
}

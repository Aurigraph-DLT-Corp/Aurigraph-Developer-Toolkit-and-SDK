//! SDK handshake namespace for `/api/v11/sdk/handshake/*` endpoints.
//!
//! The handshake protocol is the first thing an SDK application calls
//! after construction. It establishes identity, retrieves permissions,
//! and starts the heartbeat cadence.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! // Bootstrap — get server metadata + app permissions
//! let hello = client.handshake().hello().await?;
//! println!("Connected as: {} ({})", hello.app_id, hello.status);
//!
//! // Heartbeat — call every 5 minutes
//! let hb = client.handshake().heartbeat().await?;
//! println!("Next heartbeat at: {:?}", hb.next_heartbeat_at);
//!
//! // Capabilities — what endpoints can this app access?
//! let caps = client.handshake().capabilities().await?;
//! println!("Available endpoints: {}", caps.total_endpoints);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;
use crate::models::{
    CapabilitiesResponse, ConfigResponse, HeartbeatRequest, HeartbeatResponse, HelloResponse,
};

/// SDK Handshake API namespace.
///
/// Obtained via [`AurigraphClient::handshake()`].
pub struct HandshakeApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> HandshakeApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// Bootstrap call -- returns full server metadata and app permissions.
    ///
    /// Calls `GET /api/v11/sdk/handshake/hello`.
    pub async fn hello(&self) -> Result<HelloResponse> {
        self.client.get("/sdk/handshake/hello").await
    }

    /// Liveness ping -- call every 5 minutes to maintain session.
    ///
    /// Calls `POST /api/v11/sdk/handshake/heartbeat`.
    pub async fn heartbeat(&self) -> Result<HeartbeatResponse> {
        let body = HeartbeatRequest {
            client_version: self.client.client_version().to_string(),
            timestamp: chrono_now_iso8601(),
        };
        self.client.post("/sdk/handshake/heartbeat", &body).await
    }

    /// Returns the endpoint list filtered by this app's approved scopes.
    ///
    /// Calls `GET /api/v11/sdk/handshake/capabilities`.
    pub async fn capabilities(&self) -> Result<CapabilitiesResponse> {
        self.client.get("/sdk/handshake/capabilities").await
    }

    /// Lightweight refresh -- detects scope/status changes since last hello.
    ///
    /// Calls `GET /api/v11/sdk/handshake/config`.
    pub async fn config(&self) -> Result<ConfigResponse> {
        self.client.get("/sdk/handshake/config").await
    }
}

/// Generate a basic ISO-8601 timestamp without pulling in the `chrono` crate.
///
/// Uses `SystemTime` for a lightweight timestamp. Format: seconds since epoch
/// as a string (the server accepts any reasonable timestamp format).
fn chrono_now_iso8601() -> String {
    // Use a simple approach: epoch seconds. The server is lenient about format.
    let duration = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}Z", duration.as_secs())
}

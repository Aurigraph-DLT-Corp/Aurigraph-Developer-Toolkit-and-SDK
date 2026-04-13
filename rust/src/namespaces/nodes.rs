//! Node management namespace for `/api/v11/nodes/*` endpoints.
//!
//! Provides node listing, metrics, stats, and registration.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! let nodes = client.nodes().list().await?;
//! println!("Nodes: {}", nodes);
//!
//! let metrics = client.nodes().metrics().await?;
//! println!("Active nodes: {}", metrics["activeNodes"]);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// Nodes API namespace.
///
/// Obtained via [`AurigraphClient::nodes()`].
#[derive(Debug)]
pub struct NodesApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> NodesApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// List all registered network nodes.
    ///
    /// Calls `GET /api/v11/nodes`.
    pub async fn list(&self) -> Result<serde_json::Value> {
        self.client.get("/nodes").await
    }

    /// Get a specific node by ID.
    ///
    /// Calls `GET /api/v11/nodes/{node_id}`.
    pub async fn get(&self, node_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/nodes/{}", node_id))
            .await
    }

    /// Get aggregate node metrics (total, active, validator count, status).
    ///
    /// Calls `GET /api/v11/nodes/metrics`.
    pub async fn metrics(&self) -> Result<serde_json::Value> {
        self.client.get("/nodes/metrics").await
    }

    /// Get node statistics.
    ///
    /// Calls `GET /api/v11/nodes/stats`.
    pub async fn stats(&self) -> Result<serde_json::Value> {
        self.client.get("/nodes/stats").await
    }

    /// Register a new node on the network.
    ///
    /// Calls `POST /api/v11/nodes/register`.
    pub async fn register(
        &self,
        name: &str,
        node_type: &str,
        host: &str,
        port: u16,
    ) -> Result<serde_json::Value> {
        let body = serde_json::json!({
            "name": name,
            "type": node_type,
            "host": host,
            "port": port,
        });
        self.client.post("/nodes/register", &body).await
    }
}

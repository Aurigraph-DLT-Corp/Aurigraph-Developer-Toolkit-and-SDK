//! GraphQL gateway namespace for `/api/v11/graphql` endpoint.
//!
//! Provides raw GraphQL queries and pre-built convenience queries
//! for common data shapes (channels, assets, contracts, node metrics).
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! // Raw query
//! let result = client.graphql().query("{ channels { id name status } }", None).await?;
//! println!("Channels: {}", result);
//!
//! // Pre-built convenience query
//! let channels = client.graphql().query_channels().await?;
//! println!("Channels: {}", channels);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// GraphQL API namespace.
///
/// Obtained via [`AurigraphClient::graphql()`].
#[derive(Debug)]
pub struct GraphQLApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> GraphQLApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// Execute a raw GraphQL query.
    ///
    /// Calls `POST /api/v11/graphql`.
    pub async fn query(
        &self,
        query: &str,
        variables: Option<&serde_json::Value>,
    ) -> Result<serde_json::Value> {
        let mut body = serde_json::json!({ "query": query });
        if let Some(vars) = variables {
            body["variables"] = vars.clone();
        }
        self.client.post("/graphql", &body).await
    }

    /// Query all channels.
    ///
    /// Pre-built convenience query: `{ channels { id name type status } }`.
    pub async fn query_channels(&self) -> Result<serde_json::Value> {
        self.query("{ channels { id name type status } }", None)
            .await
    }

    /// Query all assets with basic fields.
    ///
    /// Pre-built convenience query: `{ assets { id type status useCaseId } }`.
    pub async fn query_assets(&self) -> Result<serde_json::Value> {
        self.query("{ assets { id type status useCaseId } }", None)
            .await
    }

    /// Query all active contracts.
    ///
    /// Pre-built convenience query: `{ contracts { id template status createdAt } }`.
    pub async fn query_contracts(&self) -> Result<serde_json::Value> {
        self.query(
            "{ contracts { id template status createdAt } }",
            None,
        )
        .await
    }

    /// Query node metrics.
    ///
    /// Pre-built convenience query: `{ nodeMetrics { totalNodes activeNodes validatorCount networkStatus } }`.
    pub async fn query_node_metrics(&self) -> Result<serde_json::Value> {
        self.query(
            "{ nodeMetrics { totalNodes activeNodes validatorCount networkStatus } }",
            None,
        )
        .await
    }
}

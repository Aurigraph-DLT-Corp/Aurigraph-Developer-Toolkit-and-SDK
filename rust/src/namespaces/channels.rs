//! Channel management namespace for `/api/v11/channels/*` endpoints.
//!
//! Provides channel listing and detail retrieval.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! let channels = client.channels().list().await?;
//! println!("Channels: {}", channels);
//!
//! let channel = client.channels().get("ch-1").await?;
//! println!("Channel: {}", channel);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// Channels API namespace.
///
/// Obtained via [`AurigraphClient::channels()`].
#[derive(Debug)]
pub struct ChannelsApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> ChannelsApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// List all channels on the network.
    ///
    /// Calls `GET /api/v11/channels`.
    pub async fn list(&self) -> Result<serde_json::Value> {
        self.client.get("/channels").await
    }

    /// Get a specific channel by ID.
    ///
    /// Calls `GET /api/v11/channels/{channel_id}`.
    pub async fn get(&self, channel_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/channels/{}", channel_id))
            .await
    }
}

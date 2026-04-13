//! DMRV (Digital Measurement, Reporting, and Verification) namespace
//! for `/api/v11/dmrv/*` endpoints.
//!
//! Provides event recording, retrieval, and batch operations.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! let event = client.dmrv().record_event("asset-1", "MEASUREMENT", &serde_json::json!({"co2": 42.5})).await?;
//! println!("Recorded: {}", event);
//!
//! let events = client.dmrv().get_events("asset-1").await?;
//! println!("Events: {}", events);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// DMRV API namespace.
///
/// Obtained via [`AurigraphClient::dmrv()`].
#[derive(Debug)]
pub struct DmrvApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> DmrvApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// Record a single DMRV event for an asset.
    ///
    /// Calls `POST /api/v11/dmrv/events`.
    pub async fn record_event(
        &self,
        asset_id: &str,
        event_type: &str,
        data: &serde_json::Value,
    ) -> Result<serde_json::Value> {
        let body = serde_json::json!({
            "assetId": asset_id,
            "eventType": event_type,
            "data": data,
        });
        self.client.post("/dmrv/events", &body).await
    }

    /// Get all DMRV events for an asset.
    ///
    /// Calls `GET /api/v11/dmrv/events/{asset_id}`.
    pub async fn get_events(&self, asset_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/dmrv/events/{}", asset_id))
            .await
    }

    /// Record multiple DMRV events in a single batch.
    ///
    /// Calls `POST /api/v11/dmrv/events/batch`.
    pub async fn batch_record(
        &self,
        events: &[serde_json::Value],
    ) -> Result<serde_json::Value> {
        let body = serde_json::json!({ "events": events });
        self.client.post("/dmrv/events/batch", &body).await
    }
}

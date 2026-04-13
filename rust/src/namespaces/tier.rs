//! SDK tier management namespace for `/api/v11/sdk/tier/*` endpoints.
//!
//! Provides partner tier inspection, usage tracking, quota checks,
//! and tier upgrade requests.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! let tier = client.tier().get_partner_tier().await?;
//! println!("Current tier: {}", tier["tier"]);
//!
//! let usage = client.tier().get_usage().await?;
//! println!("API calls today: {}", usage["apiCallsToday"]);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// SDK Tier API namespace.
///
/// Obtained via [`AurigraphClient::tier()`].
#[derive(Debug)]
pub struct TierApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> TierApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// Get the current partner tier configuration.
    ///
    /// Calls `GET /api/v11/sdk/tier`.
    pub async fn get_partner_tier(&self) -> Result<serde_json::Value> {
        self.client.get("/sdk/tier").await
    }

    /// Get SDK usage statistics for the current billing period.
    ///
    /// Calls `GET /api/v11/sdk/tier/usage`.
    pub async fn get_usage(&self) -> Result<serde_json::Value> {
        self.client.get("/sdk/tier/usage").await
    }

    /// Get remaining mint and DMRV quota for the current billing period.
    ///
    /// Calls `GET /api/v11/sdk/tier/quota`.
    pub async fn get_quota(&self) -> Result<serde_json::Value> {
        self.client.get("/sdk/tier/quota").await
    }

    /// Request an upgrade to a higher tier.
    ///
    /// Calls `POST /api/v11/sdk/tier/upgrade`.
    pub async fn request_upgrade(&self, target_tier: &str) -> Result<serde_json::Value> {
        let body = serde_json::json!({ "targetTier": target_tier });
        self.client.post("/sdk/tier/upgrade", &body).await
    }
}

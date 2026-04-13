//! Asset-agnostic namespace for `/api/v11/rwa` and `/api/v11/use-cases` endpoints.
//!
//! Works with **any** asset type -- Gold, Carbon, Real Estate, IP, etc.
//! Asset-specific behavior is driven by the `useCaseId` field, not by
//! separate API classes.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! // List all use cases
//! let use_cases = client.assets().list_use_cases().await?;
//!
//! // Filter assets by use case
//! let gold_assets = client.assets().list_by_use_case("UC_GOLD").await?;
//!
//! // Get a single asset
//! let asset = client.assets().get("asset-uuid").await?;
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;
use crate::models::UseCase;

/// Asset-agnostic API namespace.
///
/// Obtained via [`AurigraphClient::assets()`].
pub struct AssetsApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> AssetsApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    // ── Use Cases ────────────────────────────────────────────────────────────

    /// List all registered use cases (UC_GOLD, UC_CARBON, UC_REAL_ESTATE, etc.)
    ///
    /// Calls `GET /api/v11/use-cases`.
    pub async fn list_use_cases(&self) -> Result<Vec<UseCase>> {
        self.client.get("/use-cases").await
    }

    /// Get a specific use case by ID.
    ///
    /// Calls `GET /api/v11/use-cases/{use_case_id}`.
    pub async fn get_use_case(&self, use_case_id: &str) -> Result<UseCase> {
        self.client
            .get(&format!("/use-cases/{}", use_case_id))
            .await
    }

    // ── Assets (generic) ─────────────────────────────────────────────────────

    /// Query assets with optional filters. Returns paginated results.
    ///
    /// Calls `GET /api/v11/rwa/query?...`.
    pub async fn query(
        &self,
        use_case: Option<&str>,
        asset_type: Option<&str>,
        status: Option<&str>,
        channel_id: Option<&str>,
        limit: u32,
        offset: u32,
    ) -> Result<serde_json::Value> {
        let mut path = format!("/rwa/query?limit={}&offset={}", limit, offset);
        if let Some(uc) = use_case {
            path.push_str(&format!("&useCase={}", uc));
        }
        if let Some(t) = asset_type {
            path.push_str(&format!("&type={}", t));
        }
        if let Some(s) = status {
            path.push_str(&format!("&status={}", s));
        }
        if let Some(ch) = channel_id {
            path.push_str(&format!("&channelId={}", ch));
        }
        self.client.get(&path).await
    }

    /// List all RWA assets across all use cases (default pagination: 100, offset 0).
    ///
    /// Shorthand for `query(None, None, None, None, 100, 0)`.
    pub async fn list(&self) -> Result<serde_json::Value> {
        self.query(None, None, None, None, 100, 0).await
    }

    /// Get a single asset by ID (any asset type).
    ///
    /// Calls `GET /api/v11/rwa/assets/{asset_id}`.
    pub async fn get(&self, asset_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/rwa/assets/{}", asset_id))
            .await
    }

    /// List assets filtered by use case (e.g., "UC_GOLD", "UC_CARBON").
    ///
    /// Shorthand for `query(Some(use_case_id), None, None, None, 100, 0)`.
    pub async fn list_by_use_case(&self, use_case_id: &str) -> Result<serde_json::Value> {
        self.query(Some(use_case_id), None, None, None, 100, 0)
            .await
    }

    /// List assets filtered by channel ID.
    ///
    /// Shorthand for `query(None, None, None, Some(channel_id), 100, 0)`.
    pub async fn list_by_channel(&self, channel_id: &str) -> Result<serde_json::Value> {
        self.query(None, None, None, Some(channel_id), 100, 0)
            .await
    }

    /// List assets filtered by asset type (e.g., "COMMODITY", "REAL_ESTATE").
    ///
    /// Shorthand for `query(None, Some(asset_type), None, None, 100, 0)`.
    pub async fn list_by_type(&self, asset_type: &str) -> Result<serde_json::Value> {
        self.query(None, Some(asset_type), None, None, 100, 0)
            .await
    }

    /// Get use case summary with asset counts per use case.
    ///
    /// Calls `GET /api/v11/rwa/query/use-cases`.
    pub async fn use_case_summary(&self) -> Result<serde_json::Value> {
        self.client.get("/rwa/query/use-cases").await
    }

    /// Get type summary with asset counts per asset type.
    ///
    /// Calls `GET /api/v11/rwa/query/types`.
    pub async fn type_summary(&self) -> Result<serde_json::Value> {
        self.client.get("/rwa/query/types").await
    }

    // ── Multi-Channel Assignments ────────────────────────────────────────────

    /// List all channels an asset is assigned to (many-to-many).
    ///
    /// Calls `GET /api/v11/asset-channels/{asset_id}`.
    pub async fn channels_for_asset(&self, asset_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/asset-channels/{}", asset_id))
            .await
    }

    /// List all assets in a channel.
    ///
    /// Calls `GET /api/v11/asset-channels/channel/{channel_id}`.
    pub async fn assets_in_channel(&self, channel_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/asset-channels/channel/{}", channel_id))
            .await
    }

    // ── Compliance ───────────────────────────────────────────────────────────

    /// Get compliance status for an asset against a specific framework.
    ///
    /// Calls `GET /api/v11/rwa/{asset_id}/compliance/{framework}`.
    pub async fn get_compliance_status(
        &self,
        asset_id: &str,
        framework: &str,
    ) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/rwa/{}/compliance/{}", asset_id, framework))
            .await
    }

    // ── Secondary Tokens ─────────────────────────────────────────────────────

    /// List derived/secondary tokens for an asset.
    ///
    /// Calls `GET /api/v11/rwa/{asset_id}/derived-tokens`.
    pub async fn list_derived_tokens(&self, asset_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/rwa/{}/derived-tokens", asset_id))
            .await
    }

    // ── Public Ledger ────────────────────────────────────────────────────────

    /// Get the public ledger for a specific use case.
    ///
    /// Routes to the appropriate endpoint based on use case ID:
    /// - `UC_GOLD` -> `/rwa/gold/public/ledger`
    /// - `UC_PROVENEWS` -> `/provenews/contracts`
    /// - Others -> `/use-cases/{id}/assets`
    pub async fn get_public_ledger(&self, use_case_id: &str) -> Result<serde_json::Value> {
        let path = match use_case_id {
            "UC_GOLD" => "/rwa/gold/public/ledger".to_string(),
            "UC_PROVENEWS" => "/provenews/contracts".to_string(),
            _ => format!("/use-cases/{}/assets", use_case_id),
        };
        self.client.get(&path).await
    }

    // ── Contracts ────────────────────────────────────────────────────────────

    /// List active contracts for a use case.
    ///
    /// Calls `GET /api/v11/use-cases/{use_case_id}/contracts`.
    pub async fn list_contracts(&self, use_case_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/use-cases/{}/contracts", use_case_id))
            .await
    }
}

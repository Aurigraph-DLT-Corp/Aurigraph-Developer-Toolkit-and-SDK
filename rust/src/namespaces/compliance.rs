//! Regulatory compliance namespace for `/api/v11/compliance/*` endpoints.
//!
//! Provides framework listing, assessment execution, and result retrieval.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! let frameworks = client.compliance().list_frameworks().await?;
//! println!("Frameworks: {}", frameworks);
//!
//! let result = client.compliance().assess("asset-1", "MiCA").await?;
//! println!("Assessment: {}", result);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// Compliance API namespace.
///
/// Obtained via [`AurigraphClient::compliance()`].
#[derive(Debug)]
pub struct ComplianceApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> ComplianceApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// List all available compliance frameworks.
    ///
    /// Calls `GET /api/v11/compliance/frameworks`.
    pub async fn list_frameworks(&self) -> Result<serde_json::Value> {
        self.client.get("/compliance/frameworks").await
    }

    /// Get details of a specific compliance framework.
    ///
    /// Calls `GET /api/v11/compliance/frameworks/{framework_id}`.
    pub async fn get_framework(&self, framework_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/compliance/frameworks/{}", framework_id))
            .await
    }

    /// Run a compliance assessment for an asset against a framework.
    ///
    /// Calls `POST /api/v11/compliance/assess`.
    pub async fn assess(
        &self,
        asset_id: &str,
        framework: &str,
    ) -> Result<serde_json::Value> {
        let body = serde_json::json!({
            "assetId": asset_id,
            "framework": framework,
        });
        self.client.post("/compliance/assess", &body).await
    }

    /// Get all compliance assessments for an asset.
    ///
    /// Calls `GET /api/v11/compliance/assessments/{asset_id}`.
    pub async fn get_assessments(&self, asset_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/compliance/assessments/{}", asset_id))
            .await
    }
}

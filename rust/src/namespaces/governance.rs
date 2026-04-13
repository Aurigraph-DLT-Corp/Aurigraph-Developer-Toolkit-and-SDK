//! On-chain governance namespace for `/api/v11/governance/*` endpoints.
//!
//! Provides proposal listing, voting, and treasury inspection.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! let proposals = client.governance().list_proposals().await?;
//! println!("Active proposals: {}", proposals);
//!
//! let receipt = client.governance().vote("prop-1", "FOR").await?;
//! println!("Vote receipt: {}", receipt);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// Governance API namespace.
///
/// Obtained via [`AurigraphClient::governance()`].
#[derive(Debug)]
pub struct GovernanceApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> GovernanceApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// List all governance proposals.
    ///
    /// Calls `GET /api/v11/governance/proposals`.
    pub async fn list_proposals(&self) -> Result<serde_json::Value> {
        self.client.get("/governance/proposals").await
    }

    /// Get a single governance proposal by ID.
    ///
    /// Calls `GET /api/v11/governance/proposals/{proposal_id}`.
    pub async fn get_proposal(&self, proposal_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/governance/proposals/{}", proposal_id))
            .await
    }

    /// Cast a vote on a governance proposal.
    ///
    /// Calls `POST /api/v11/governance/proposals/{proposal_id}/vote`.
    pub async fn vote(&self, proposal_id: &str, vote: &str) -> Result<serde_json::Value> {
        let body = serde_json::json!({ "vote": vote });
        self.client
            .post(
                &format!("/governance/proposals/{}/vote", proposal_id),
                &body,
            )
            .await
    }

    /// Get governance treasury statistics.
    ///
    /// Calls `GET /api/v11/governance/treasury`.
    pub async fn get_treasury(&self) -> Result<serde_json::Value> {
        self.client.get("/governance/treasury").await
    }
}

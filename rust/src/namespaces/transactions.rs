//! Transaction namespace for `/api/v11/transactions/*` endpoints.
//!
//! Provides transaction submission, retrieval, and recent listing.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! let tx = client.transactions().submit("TRANSFER", "from-addr", "to-addr", 100.0).await?;
//! println!("Submitted: {}", tx);
//!
//! let recent = client.transactions().list_recent(10).await?;
//! println!("Recent: {}", recent);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// Transactions API namespace.
///
/// Obtained via [`AurigraphClient::transactions()`].
#[derive(Debug)]
pub struct TransactionsApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> TransactionsApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// Submit a new transaction.
    ///
    /// Calls `POST /api/v11/transactions`.
    pub async fn submit(
        &self,
        tx_type: &str,
        from: &str,
        to: &str,
        amount: f64,
    ) -> Result<serde_json::Value> {
        let body = serde_json::json!({
            "type": tx_type,
            "fromAddress": from,
            "toAddress": to,
            "amount": amount,
        });
        self.client.post("/transactions", &body).await
    }

    /// Get a transaction by hash.
    ///
    /// Calls `GET /api/v11/transactions/{tx_hash}`.
    pub async fn get(&self, tx_hash: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/transactions/{}", tx_hash))
            .await
    }

    /// List recent transactions.
    ///
    /// Calls `GET /api/v11/transactions/recent?limit={limit}`.
    pub async fn list_recent(&self, limit: u32) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/transactions/recent?limit={}", limit))
            .await
    }
}

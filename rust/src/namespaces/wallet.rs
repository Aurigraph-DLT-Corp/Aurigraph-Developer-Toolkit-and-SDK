//! Wallet management namespace for `/api/v11/wallet/*` endpoints.
//!
//! Provides balance queries, token transfers, and transaction history.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! let balance = client.wallet().get_balance("0xabc123").await?;
//! println!("Balance: {}", balance);
//!
//! let receipt = client.wallet().transfer("0xabc", "0xdef", 100.0).await?;
//! println!("Transfer: {}", receipt);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// Wallet API namespace.
///
/// Obtained via [`AurigraphClient::wallet()`].
#[derive(Debug)]
pub struct WalletApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> WalletApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// Get wallet balance for an address.
    ///
    /// Calls `GET /api/v11/wallet/{address}/balance`.
    pub async fn get_balance(&self, address: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/wallet/{}/balance", address))
            .await
    }

    /// Transfer tokens between addresses.
    ///
    /// Calls `POST /api/v11/wallet/transfer`.
    pub async fn transfer(
        &self,
        from: &str,
        to: &str,
        amount: f64,
    ) -> Result<serde_json::Value> {
        let body = serde_json::json!({
            "fromAddress": from,
            "toAddress": to,
            "amount": amount,
        });
        self.client.post("/wallet/transfer", &body).await
    }

    /// Get transaction history for an address.
    ///
    /// Calls `GET /api/v11/wallet/{address}/history`.
    pub async fn get_history(&self, address: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/wallet/{}/history", address))
            .await
    }
}

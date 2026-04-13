//! Smart contract and Ricardian contract namespace for `/api/v11/contracts/*` endpoints.
//!
//! Provides contract deployment, invocation, and retrieval.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! let deployed = client.contracts().deploy("RicardianLease", &serde_json::json!({"tenant": "Alice"})).await?;
//! println!("Deployed: {}", deployed);
//!
//! let contract = client.contracts().get("contract-1").await?;
//! println!("Contract: {}", contract);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;

/// Contracts API namespace.
///
/// Obtained via [`AurigraphClient::contracts()`].
#[derive(Debug)]
pub struct ContractsApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> ContractsApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// Deploy a new smart contract or Ricardian contract.
    ///
    /// Calls `POST /api/v11/contracts/deploy`.
    pub async fn deploy(
        &self,
        template: &str,
        params: &serde_json::Value,
    ) -> Result<serde_json::Value> {
        let body = serde_json::json!({
            "template": template,
            "parameters": params,
        });
        self.client.post("/contracts/deploy", &body).await
    }

    /// Invoke a function on a deployed contract.
    ///
    /// Calls `POST /api/v11/contracts/{contract_id}/invoke`.
    pub async fn invoke(
        &self,
        contract_id: &str,
        function: &str,
        args: &serde_json::Value,
    ) -> Result<serde_json::Value> {
        let body = serde_json::json!({
            "function": function,
            "arguments": args,
        });
        self.client
            .post(&format!("/contracts/{}/invoke", contract_id), &body)
            .await
    }

    /// Get a contract by ID.
    ///
    /// Calls `GET /api/v11/contracts/{contract_id}`.
    pub async fn get(&self, contract_id: &str) -> Result<serde_json::Value> {
        self.client
            .get(&format!("/contracts/{}", contract_id))
            .await
    }
}

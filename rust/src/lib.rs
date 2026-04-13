//! # Aurigraph SDK
//!
//! Official Rust SDK for the Aurigraph DLT V12 platform (V11 API).
//!
//! ## Quickstart
//!
//! ```rust,no_run
//! use aurigraph_sdk::AurigraphClient;
//!
//! #[tokio::main]
//! async fn main() -> aurigraph_sdk::Result<()> {
//!     let client = AurigraphClient::builder()
//!         .base_url("https://dlt.aurigraph.io")
//!         .api_key("my-app-id", "my-api-key")
//!         .build()?;
//!
//!     let health = client.health().await?;
//!     println!("Status: {}", health.status);
//!
//!     let stats = client.stats().await?;
//!     println!("TPS: {}, Active Nodes: {}", stats.tps, stats.active_nodes);
//!
//!     let use_cases = client.assets().list_use_cases().await?;
//!     println!("Use cases: {:?}", use_cases);
//!
//!     Ok(())
//! }
//! ```

pub mod client;
pub mod error;
pub mod models;
pub mod namespaces;

pub use client::{AurigraphClient, AurigraphClientBuilder};
pub use error::{AurigraphError, Result};

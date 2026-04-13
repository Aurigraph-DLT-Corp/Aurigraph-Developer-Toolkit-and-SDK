//! GDPR namespace for `/api/v11/gdpr/*` endpoints.
//!
//! Provides GDPR Article 17 (right to erasure) and Article 20
//! (data portability) operations.
//!
//! # Example
//!
//! ```rust,no_run
//! # async fn example(client: &aurigraph_sdk::AurigraphClient) -> aurigraph_sdk::Result<()> {
//! // Export user data (Article 20 -- data portability)
//! let export = client.gdpr().export_user_data("user-123").await?;
//! println!("Exported {} sections for user {}", export.sections.len(), export.user_id);
//!
//! // Request erasure (Article 17 -- right to be forgotten)
//! let receipt = client.gdpr().request_erasure("user-123").await?;
//! println!("Erasure request {}: {}", receipt.tracking_id, receipt.status);
//! # Ok(())
//! # }
//! ```

use crate::client::AurigraphClient;
use crate::error::Result;
use crate::models::{ErasureReceipt, GdprExportPayload};

/// GDPR API namespace.
///
/// Obtained via [`AurigraphClient::gdpr()`].
pub struct GdprApi<'a> {
    client: &'a AurigraphClient,
}

impl<'a> GdprApi<'a> {
    pub(crate) fn new(client: &'a AurigraphClient) -> Self {
        Self { client }
    }

    /// Export all user data for the given user ID (GDPR Article 20 -- data portability).
    ///
    /// Calls `GET /api/v11/gdpr/export/{user_id}`.
    ///
    /// The `user_id` is URL-encoded automatically.
    pub async fn export_user_data(&self, user_id: &str) -> Result<GdprExportPayload> {
        let encoded = urlencoded(user_id);
        self.client
            .get(&format!("/gdpr/export/{}", encoded))
            .await
    }

    /// Request erasure of all user data (GDPR Article 17 -- right to be forgotten).
    ///
    /// Calls `DELETE /api/v11/gdpr/erasure/{user_id}`.
    ///
    /// The `user_id` is URL-encoded automatically.
    pub async fn request_erasure(&self, user_id: &str) -> Result<ErasureReceipt> {
        let encoded = urlencoded(user_id);
        self.client
            .delete(&format!("/gdpr/erasure/{}", encoded))
            .await
    }
}

/// Minimal percent-encoding for URL path segments.
///
/// Encodes spaces, `@`, `#`, `?`, `&`, `=`, `/`, `%`, and `+`.
fn urlencoded(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    for b in input.bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(b as char);
            }
            _ => {
                out.push('%');
                out.push_str(&format!("{:02X}", b));
            }
        }
    }
    out
}

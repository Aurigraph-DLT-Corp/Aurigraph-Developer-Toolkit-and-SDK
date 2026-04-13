//! Main client for the Aurigraph DLT V11 API.
//!
//! Use [`AurigraphClient::builder()`] to construct a client instance.

use crate::error::{AurigraphError, Result};
use crate::models::{HealthResponse, PlatformStats};
use crate::namespaces::{AssetsApi, GdprApi, HandshakeApi};
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, AUTHORIZATION, CONTENT_TYPE};
use serde::de::DeserializeOwned;
use serde::Serialize;
use std::collections::HashMap;
use std::time::Duration;

/// The API path prefix for all V11 endpoints.
const API_PREFIX: &str = "/api/v11";

/// Client for the Aurigraph DLT V12 platform (V11 API).
///
/// # Example
///
/// ```rust,no_run
/// use aurigraph_sdk::AurigraphClient;
///
/// # async fn example() -> aurigraph_sdk::Result<()> {
/// let client = AurigraphClient::builder()
///     .base_url("https://dlt.aurigraph.io")
///     .api_key("my-app-id", "my-api-key")
///     .build()?;
///
/// let health = client.health().await?;
/// assert!(health.is_healthy());
/// # Ok(())
/// # }
/// ```
pub struct AurigraphClient {
    base_url: String,
    api_key: Option<String>,
    app_id: Option<String>,
    jwt_token: Option<String>,
    client_version: String,
    client: reqwest::Client,
}

impl AurigraphClient {
    /// Returns a new [`AurigraphClientBuilder`] for constructing a client.
    pub fn builder() -> AurigraphClientBuilder {
        AurigraphClientBuilder::default()
    }

    /// Check platform health.
    ///
    /// Calls `GET /api/v11/health`.
    pub async fn health(&self) -> Result<HealthResponse> {
        self.get("/health").await
    }

    /// Get platform statistics (TPS, active nodes, block height, etc.)
    ///
    /// Calls `GET /api/v11/stats`.
    pub async fn stats(&self) -> Result<PlatformStats> {
        self.get("/stats").await
    }

    /// Access the asset-agnostic Assets API namespace.
    ///
    /// Provides operations on `/api/v11/rwa/*` and `/api/v11/use-cases/*`.
    pub fn assets(&self) -> AssetsApi<'_> {
        AssetsApi::new(self)
    }

    /// Access the SDK Handshake API namespace.
    ///
    /// Provides operations on `/api/v11/sdk/handshake/*`.
    pub fn handshake(&self) -> HandshakeApi<'_> {
        HandshakeApi::new(self)
    }

    /// Access the GDPR API namespace.
    ///
    /// Provides operations on `/api/v11/gdpr/*`.
    pub fn gdpr(&self) -> GdprApi<'_> {
        GdprApi::new(self)
    }

    /// Returns the client version string.
    pub fn client_version(&self) -> &str {
        &self.client_version
    }

    // ── Internal HTTP helpers ────────────────────────────────────────────────

    /// Perform a GET request and deserialize the JSON response.
    pub(crate) async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        let url = self.build_url(path);
        let resp = self
            .client
            .get(&url)
            .headers(self.auth_headers())
            .send()
            .await?;
        self.handle_response(resp).await
    }

    /// Perform a POST request with a JSON body and deserialize the response.
    pub(crate) async fn post<T: DeserializeOwned, B: Serialize>(
        &self,
        path: &str,
        body: &B,
    ) -> Result<T> {
        let url = self.build_url(path);
        let resp = self
            .client
            .post(&url)
            .headers(self.auth_headers())
            .json(body)
            .send()
            .await?;
        self.handle_response(resp).await
    }

    /// Perform a DELETE request and deserialize the JSON response.
    pub(crate) async fn delete<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        let url = self.build_url(path);
        let resp = self
            .client
            .delete(&url)
            .headers(self.auth_headers())
            .send()
            .await?;
        self.handle_response(resp).await
    }

    /// Build the full URL for an API path.
    fn build_url(&self, path: &str) -> String {
        let separator = if path.starts_with('/') { "" } else { "/" };
        format!("{}{}{}{}", self.base_url, API_PREFIX, separator, path)
    }

    /// Build authentication headers based on configured credentials.
    ///
    /// Precedence:
    /// 1. JWT Bearer token
    /// 2. Paired API key (`Authorization: ApiKey {appId}:{apiKey}`)
    fn auth_headers(&self) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
        headers.insert(ACCEPT, HeaderValue::from_static("application/json"));

        if let Some(ref jwt) = self.jwt_token {
            if let Ok(val) = HeaderValue::from_str(&format!("Bearer {}", jwt)) {
                headers.insert(AUTHORIZATION, val);
            }
        } else if let (Some(ref app_id), Some(ref api_key)) = (&self.app_id, &self.api_key) {
            if let Ok(val) = HeaderValue::from_str(&format!("ApiKey {}:{}", app_id, api_key)) {
                headers.insert(AUTHORIZATION, val);
            }
        }

        headers
    }

    /// Handle an HTTP response, returning the deserialized body or an error.
    async fn handle_response<T: DeserializeOwned>(
        &self,
        resp: reqwest::Response,
    ) -> Result<T> {
        let status = resp.status().as_u16();
        let body = resp.text().await.map_err(AurigraphError::Network)?;

        if (200..300).contains(&status) {
            serde_json::from_str(&body).map_err(|e| {
                AurigraphError::Serialization(format!(
                    "failed to deserialize response: {} (body: {})",
                    e,
                    &body[..body.len().min(200)]
                ))
            })
        } else {
            // Attempt to parse RFC 7807 problem details from the error body.
            let problem: Option<HashMap<String, serde_json::Value>> =
                serde_json::from_str(&body).ok();

            let message = problem
                .as_ref()
                .and_then(|p| p.get("title"))
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown error")
                .to_string();

            if (400..500).contains(&status) {
                Err(AurigraphError::Client {
                    status,
                    message,
                    problem,
                })
            } else {
                Err(AurigraphError::Server {
                    status,
                    message,
                    problem,
                })
            }
        }
    }
}

/// Builder for constructing an [`AurigraphClient`].
///
/// # Example
///
/// ```rust,no_run
/// use aurigraph_sdk::AurigraphClient;
///
/// # fn example() -> aurigraph_sdk::Result<()> {
/// let client = AurigraphClient::builder()
///     .base_url("https://dlt.aurigraph.io")
///     .api_key("my-app-id", "my-api-key")
///     .timeout(std::time::Duration::from_secs(30))
///     .build()?;
/// # Ok(())
/// # }
/// ```
#[derive(Default)]
pub struct AurigraphClientBuilder {
    base_url: Option<String>,
    api_key: Option<String>,
    app_id: Option<String>,
    jwt_token: Option<String>,
    client_version: Option<String>,
    timeout: Option<Duration>,
}

impl AurigraphClientBuilder {
    /// Set the base URL for the Aurigraph DLT API (e.g., `https://dlt.aurigraph.io`).
    ///
    /// **Required.** Trailing slashes are stripped automatically.
    pub fn base_url(mut self, url: &str) -> Self {
        self.base_url = Some(url.trim_end_matches('/').to_string());
        self
    }

    /// Set the paired API key credentials.
    ///
    /// Produces the header `Authorization: ApiKey {app_id}:{api_key}`,
    /// matching the backend `SdkApiKeyAuthFilter`.
    pub fn api_key(mut self, app_id: &str, api_key: &str) -> Self {
        self.app_id = Some(app_id.to_string());
        self.api_key = Some(api_key.to_string());
        self
    }

    /// Set a JWT bearer token for authentication.
    ///
    /// Takes precedence over API key authentication if both are set.
    pub fn jwt_token(mut self, token: &str) -> Self {
        self.jwt_token = Some(token.to_string());
        self
    }

    /// Set the client version string (sent in heartbeat requests).
    ///
    /// Defaults to `"aurigraph-rust-sdk/0.1.0"`.
    pub fn client_version(mut self, version: &str) -> Self {
        self.client_version = Some(version.to_string());
        self
    }

    /// Set the HTTP request timeout.
    ///
    /// Defaults to 10 seconds.
    pub fn timeout(mut self, timeout: Duration) -> Self {
        self.timeout = Some(timeout);
        self
    }

    /// Build the [`AurigraphClient`].
    ///
    /// # Errors
    ///
    /// Returns [`AurigraphError::Config`] if `base_url` is not set.
    pub fn build(self) -> Result<AurigraphClient> {
        let base_url = self
            .base_url
            .ok_or_else(|| AurigraphError::Config("base_url is required".into()))?;

        let timeout = self.timeout.unwrap_or(Duration::from_secs(10));

        let client = reqwest::Client::builder()
            .timeout(timeout)
            .build()
            .map_err(AurigraphError::Network)?;

        Ok(AurigraphClient {
            base_url,
            api_key: self.api_key,
            app_id: self.app_id,
            jwt_token: self.jwt_token,
            client_version: self
                .client_version
                .unwrap_or_else(|| "aurigraph-rust-sdk/0.1.0".to_string()),
            client,
        })
    }
}

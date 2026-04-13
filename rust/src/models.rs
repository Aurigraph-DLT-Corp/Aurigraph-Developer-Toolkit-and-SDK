//! Data models for the Aurigraph DLT V11 API.
//!
//! All models use `#[serde(rename_all = "camelCase")]` to match the
//! camelCase JSON output from the Java/Quarkus backend.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ── Platform ─────────────────────────────────────────────────────────────────

/// Response from `GET /api/v11/health`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HealthResponse {
    /// Health status string (e.g., "HEALTHY", "UP", "DEGRADED").
    pub status: String,
    /// Health check duration in milliseconds.
    #[serde(default)]
    pub duration_ms: Option<u64>,
    /// Platform version string.
    #[serde(default)]
    pub version: Option<String>,
    /// ISO-8601 timestamp of the health check.
    #[serde(default)]
    pub timestamp: Option<String>,
}

impl HealthResponse {
    /// Returns `true` if the platform reports a healthy status.
    pub fn is_healthy(&self) -> bool {
        self.status.eq_ignore_ascii_case("HEALTHY") || self.status.eq_ignore_ascii_case("UP")
    }
}

/// Response from `GET /api/v11/stats`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformStats {
    /// Transactions per second.
    pub tps: u64,
    /// Number of currently active nodes.
    pub active_nodes: u32,
    /// Current block height.
    pub block_height: u64,
    /// Total transactions processed (lifetime).
    #[serde(default)]
    pub total_transactions: Option<u64>,
    /// Platform uptime in seconds.
    #[serde(default)]
    pub uptime: Option<u64>,
}

// ── Use Cases & Assets ───────────────────────────────────────────────────────

/// A registered use case (UC_GOLD, UC_CARBON, UC_REAL_ESTATE, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UseCase {
    /// Use case identifier (e.g., "UC_GOLD").
    pub id: String,
    /// Human-readable name.
    pub name: String,
    /// Category grouping.
    #[serde(default)]
    pub category: Option<String>,
    /// Description of the use case.
    #[serde(default)]
    pub description: Option<String>,
    /// Number of assets registered under this use case.
    #[serde(default)]
    pub asset_count: Option<u32>,
    /// Number of active contracts under this use case.
    #[serde(default)]
    pub contract_count: Option<u32>,
}

/// A generic asset record (asset-agnostic — works for any RWA type).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Asset {
    /// Unique asset identifier.
    pub id: String,
    /// Asset type (e.g., "COMMODITY", "REAL_ESTATE", "IP").
    #[serde(default, rename = "type")]
    pub asset_type: Option<String>,
    /// Associated use case ID.
    #[serde(default)]
    pub use_case_id: Option<String>,
    /// Current status.
    #[serde(default)]
    pub status: Option<String>,
    /// Channel the asset is registered in.
    #[serde(default)]
    pub channel_id: Option<String>,
    /// Additional asset-specific metadata.
    #[serde(default)]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

// ── Channels ─────────────────────────────────────────────────────────────────

/// A DLT channel.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Channel {
    /// Channel identifier.
    pub channel_id: String,
    /// Human-readable channel name.
    pub name: String,
    /// Channel type.
    #[serde(default, rename = "type")]
    pub channel_type: Option<String>,
    /// Channel description.
    #[serde(default)]
    pub description: Option<String>,
    /// Stakeholders participating in the channel.
    #[serde(default)]
    pub stakeholders: Vec<ChannelStakeholder>,
    /// ISO-8601 creation timestamp.
    #[serde(default)]
    pub created_at: Option<String>,
}

/// A stakeholder within a channel.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChannelStakeholder {
    /// Node identifier.
    pub node_id: String,
    /// Role within the channel.
    pub role: String,
    /// ISO-8601 join timestamp.
    #[serde(default)]
    pub joined_at: Option<String>,
}

// ── Handshake ────────────────────────────────────────────────────────────────

/// Bootstrap response from `GET /api/v11/sdk/handshake/hello`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HelloResponse {
    /// Authenticated application ID.
    pub app_id: String,
    /// Application name.
    #[serde(default)]
    pub app_name: Option<String>,
    /// Decentralized identifier.
    #[serde(default)]
    pub did: Option<String>,
    /// Application status.
    pub status: String,
    /// Server version string.
    #[serde(default)]
    pub server_version: Option<String>,
    /// Protocol version.
    #[serde(default)]
    pub protocol_version: Option<String>,
    /// Scopes approved for this application.
    #[serde(default)]
    pub approved_scopes: Vec<String>,
    /// Scopes requested but not yet approved.
    #[serde(default)]
    pub requested_scopes: Vec<String>,
    /// Scopes pending approval.
    #[serde(default)]
    pub pending_scopes: Vec<String>,
    /// Rate limit configuration.
    #[serde(default)]
    pub rate_limit: Option<RateLimit>,
    /// Recommended heartbeat interval in milliseconds.
    #[serde(default)]
    pub heartbeat_interval_ms: u64,
    /// Feature flags.
    #[serde(default)]
    pub features: HashMap<String, bool>,
    /// ISO-8601 timestamp for the next expected heartbeat.
    #[serde(default)]
    pub next_heartbeat_at: Option<String>,
}

/// Rate limit configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RateLimit {
    /// Maximum requests per minute.
    pub requests_per_minute: u32,
    /// Burst size allowance.
    pub burst_size: u32,
}

/// Response from `POST /api/v11/sdk/handshake/heartbeat`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeartbeatResponse {
    /// ISO-8601 timestamp when the heartbeat was received.
    pub received_at: String,
    /// ISO-8601 timestamp for the next expected heartbeat.
    #[serde(default)]
    pub next_heartbeat_at: Option<String>,
    /// Heartbeat acknowledgement status.
    pub status: String,
}

/// Response from `GET /api/v11/sdk/handshake/capabilities`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilitiesResponse {
    /// Authenticated application ID.
    pub app_id: String,
    /// Approved scopes.
    #[serde(default)]
    pub approved_scopes: Vec<String>,
    /// Available endpoints filtered by scope.
    #[serde(default)]
    pub endpoints: Vec<CapabilityEndpoint>,
    /// Total number of endpoints available.
    #[serde(default)]
    pub total_endpoints: u32,
}

/// A single API endpoint descriptor within capabilities.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityEndpoint {
    /// HTTP method (GET, POST, PUT, DELETE).
    pub method: String,
    /// Endpoint path.
    pub path: String,
    /// Scope required to access this endpoint.
    #[serde(default)]
    pub required_scope: Option<String>,
    /// Human-readable description.
    #[serde(default)]
    pub description: Option<String>,
}

/// Response from `GET /api/v11/sdk/handshake/config`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigResponse {
    /// Authenticated application ID.
    pub app_id: String,
    /// Current application status.
    pub status: String,
    /// Approved scopes.
    #[serde(default)]
    pub approved_scopes: Vec<String>,
    /// Pending scopes.
    #[serde(default)]
    pub pending_scopes: Vec<String>,
    /// Rate limit configuration.
    #[serde(default)]
    pub rate_limit: Option<RateLimit>,
    /// ISO-8601 timestamp of last config update.
    #[serde(default)]
    pub last_updated_at: Option<String>,
}

// ── GDPR ─────────────────────────────────────────────────────────────────────

/// GDPR data export payload containing all user data sections.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GdprExportPayload {
    /// The user whose data was exported.
    pub user_id: String,
    /// ISO-8601 timestamp of the export.
    #[serde(default)]
    pub exported_at: Option<String>,
    /// Categorized data sections.
    #[serde(default)]
    pub sections: Vec<DataSection>,
}

/// A categorized section of user data within a GDPR export.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataSection {
    /// Category label (e.g., "transactions", "assets", "identity").
    pub category: String,
    /// Records within this category.
    #[serde(default)]
    pub data: Vec<HashMap<String, serde_json::Value>>,
}

/// Receipt confirming a GDPR erasure request has been accepted.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ErasureReceipt {
    /// Tracking ID for the erasure request.
    pub tracking_id: String,
    /// Status of the erasure request (e.g., "ACCEPTED", "PROCESSING").
    pub status: String,
    /// ISO-8601 timestamp when the erasure was requested.
    #[serde(default)]
    pub requested_at: Option<String>,
}

// ── RFC 7807 Problem Details ─────────────────────────────────────────────────

/// RFC 7807 problem details response.
///
/// Returned by the Aurigraph API on error responses with
/// `Content-Type: application/problem+json`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProblemDetails {
    /// A URI reference identifying the problem type.
    #[serde(default, rename = "type")]
    pub problem_type: Option<String>,
    /// Short human-readable summary.
    #[serde(default)]
    pub title: Option<String>,
    /// HTTP status code.
    #[serde(default)]
    pub status: Option<u16>,
    /// Human-readable explanation specific to this occurrence.
    #[serde(default)]
    pub detail: Option<String>,
    /// URI reference identifying the specific occurrence.
    #[serde(default)]
    pub instance: Option<String>,
    /// Aurigraph error code.
    #[serde(default)]
    pub error_code: Option<String>,
    /// Distributed trace identifier.
    #[serde(default)]
    pub trace_id: Option<String>,
    /// Request identifier.
    #[serde(default)]
    pub request_id: Option<String>,
    /// Service that generated the error.
    #[serde(default)]
    pub service: Option<String>,
    /// ISO-8601 timestamp of the error.
    #[serde(default)]
    pub timestamp: Option<String>,
}

// ── Heartbeat Request (internal) ─────────────────────────────────────────────

/// Body for `POST /api/v11/sdk/handshake/heartbeat`.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HeartbeatRequest {
    pub client_version: String,
    pub timestamp: String,
}

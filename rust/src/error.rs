use std::collections::HashMap;

/// Errors that can occur when interacting with the Aurigraph DLT API.
#[derive(thiserror::Error, Debug)]
pub enum AurigraphError {
    /// Network-level error (connection refused, timeout, DNS failure, etc.)
    #[error("network error: {0}")]
    Network(#[from] reqwest::Error),

    /// Server returned an HTTP 5xx error.
    #[error("server error: {status} - {message}")]
    Server {
        status: u16,
        message: String,
        /// RFC 7807 problem details, if the server returned them.
        problem: Option<HashMap<String, serde_json::Value>>,
    },

    /// Client-side error (HTTP 4xx) — invalid request, unauthorized, not found, etc.
    #[error("client error: {status} - {message}")]
    Client {
        status: u16,
        message: String,
        /// RFC 7807 problem details, if the server returned them.
        problem: Option<HashMap<String, serde_json::Value>>,
    },

    /// Configuration error (missing base URL, invalid builder state, etc.)
    #[error("config error: {0}")]
    Config(String),

    /// JSON serialization/deserialization error.
    #[error("serialization error: {0}")]
    Serialization(String),
}

/// A specialized `Result` type for Aurigraph SDK operations.
pub type Result<T> = std::result::Result<T, AurigraphError>;

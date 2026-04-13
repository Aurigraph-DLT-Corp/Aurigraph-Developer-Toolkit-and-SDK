//! API namespace modules.
//!
//! Each namespace groups related API operations. Access them via the
//! corresponding method on [`crate::AurigraphClient`]:
//!
//! - [`AssetsApi`] — `client.assets()` — asset-agnostic RWA operations
//! - [`HandshakeApi`] — `client.handshake()` — SDK handshake protocol
//! - [`GdprApi`] — `client.gdpr()` — GDPR data export and erasure

pub mod assets;
pub mod gdpr;
pub mod handshake;

pub use assets::AssetsApi;
pub use gdpr::GdprApi;
pub use handshake::HandshakeApi;

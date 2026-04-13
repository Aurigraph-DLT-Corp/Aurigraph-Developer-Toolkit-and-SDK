"""Pydantic models for Aurigraph DLT V12 (V11 API) responses.

All models use ``extra="allow"`` to tolerate unknown fields from future
API versions without breaking existing SDK consumers.
"""

from __future__ import annotations

from pydantic import AliasGenerator, BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

# All models accept both camelCase (from API JSON) and snake_case (Pythonic).
# alias_generator maps snake_case fields to camelCase aliases for deserialization.
_BASE_CONFIG = ConfigDict(
    extra="allow",
    populate_by_name=True,
    alias_generator=AliasGenerator(validation_alias=to_camel),
)


# ── Health & Stats ────────────────────────────────────────────────────────────


class HealthResponse(BaseModel):
    """GET /api/v11/health response."""

    model_config = _BASE_CONFIG

    status: str = ""
    version: str | None = None
    uptime: str | None = None
    node_count: int | None = None


class PlatformStats(BaseModel):
    """GET /api/v11/stats response."""

    model_config = _BASE_CONFIG

    tps: float | None = None
    total_transactions: int | None = None
    active_nodes: int | None = None
    total_channels: int | None = None
    block_height: int | None = None
    network_status: str | None = None


# ── Nodes ─────────────────────────────────────────────────────────────────────


class NodeInfo(BaseModel):
    """Single node information."""

    model_config = _BASE_CONFIG

    node_id: str | None = None
    name: str | None = None
    type: str | None = None
    status: str | None = None
    host: str | None = None
    port: int | None = None


class NodeMetrics(BaseModel):
    """GET /api/v11/nodes/metrics response."""

    model_config = _BASE_CONFIG

    total_nodes: int | None = None
    active_nodes: int | None = None
    validator_count: int | None = None
    network_status: str | None = None


# ── Channels ──────────────────────────────────────────────────────────────────


class Channel(BaseModel):
    """Channel information."""

    model_config = _BASE_CONFIG

    id: str | None = None
    name: str | None = None
    type: str | None = None
    status: str | None = None


# ── Transactions ──────────────────────────────────────────────────────────────


class Transaction(BaseModel):
    """Transaction record."""

    model_config = _BASE_CONFIG

    tx_hash: str | None = None
    type: str | None = None
    status: str | None = None
    timestamp: str | None = None
    from_address: str | None = None
    to_address: str | None = None
    amount: float | None = None


# ── GDPR ──────────────────────────────────────────────────────────────────────


class DataSection(BaseModel):
    """A section of exported user data."""

    model_config = _BASE_CONFIG

    section: str = ""
    records: int = 0


class GdprExportPayload(BaseModel):
    """GET /api/v11/gdpr/export/{userId} response."""

    model_config = _BASE_CONFIG

    user_id: str = ""
    exported_at: str | None = None
    sections: list[DataSection] = []


class ErasureReceipt(BaseModel):
    """DELETE /api/v11/gdpr/erasure/{userId} response."""

    model_config = _BASE_CONFIG

    user_id: str = ""
    erased_at: str | None = None
    status: str = ""


# ── GraphQL ───────────────────────────────────────────────────────────────────


class GraphQLError(BaseModel):
    """A single GraphQL error."""

    model_config = _BASE_CONFIG

    message: str = ""
    path: list[str] | None = None


class GraphQLResponse(BaseModel):
    """POST /api/v11/graphql response."""

    model_config = _BASE_CONFIG

    data: dict | None = None  # type: ignore[type-arg]
    errors: list[GraphQLError] | None = None


# ── Tier / Partner ────────────────────────────────────────────────────────────


class TierConfig(BaseModel):
    """Partner tier configuration."""

    model_config = _BASE_CONFIG

    tier: str = ""
    name: str | None = None
    rate_limit: int | None = None
    mint_monthly_limit: int | None = None


class UsageStats(BaseModel):
    """SDK usage statistics."""

    model_config = _BASE_CONFIG

    api_calls_today: int = 0
    api_calls_month: int = 0
    mints_month: int = 0


class MintQuota(BaseModel):
    """Remaining mint quota for the current billing period."""

    model_config = _BASE_CONFIG

    mint_monthly_limit: int = -1
    mint_monthly_remaining: int = -1
    dmrv_daily_limit: int = -1
    dmrv_daily_remaining: int = -1


class UpgradeRequest(BaseModel):
    """Tier upgrade request response."""

    model_config = _BASE_CONFIG

    request_id: str | None = None
    target_tier: str = ""
    status: str = ""


class PartnerProfile(BaseModel):
    """Partner profile information."""

    model_config = _BASE_CONFIG

    app_id: str | None = None
    name: str | None = None
    tier: str | None = None
    status: str | None = None


# ── Governance ────────────────────────────────────────────────────────────────


class Proposal(BaseModel):
    """Governance proposal."""

    model_config = _BASE_CONFIG

    id: str | None = None
    title: str | None = None
    status: str | None = None
    votes_for: int | None = None
    votes_against: int | None = None


class VoteReceipt(BaseModel):
    """Vote receipt."""

    model_config = _BASE_CONFIG

    proposal_id: str | None = None
    vote: str | None = None
    tx_hash: str | None = None


class TreasuryStats(BaseModel):
    """Governance treasury statistics."""

    model_config = _BASE_CONFIG

    total_balance: float | None = None
    pending_proposals: int | None = None


# ── Wallet ────────────────────────────────────────────────────────────────────


class WalletBalance(BaseModel):
    """Wallet balance."""

    model_config = _BASE_CONFIG

    address: str = ""
    balance: float = 0.0
    currency: str | None = None


class TransferRequest(BaseModel):
    """Wallet transfer request payload."""

    model_config = _BASE_CONFIG

    from_address: str = ""
    to_address: str = ""
    amount: float = 0.0
    currency: str | None = None


class TransferReceipt(BaseModel):
    """Wallet transfer receipt."""

    model_config = _BASE_CONFIG

    tx_hash: str | None = None
    status: str | None = None
    timestamp: str | None = None


# ── Compliance ────────────────────────────────────────────────────────────────


class ComplianceFramework(BaseModel):
    """Compliance framework definition."""

    model_config = _BASE_CONFIG

    id: str | None = None
    name: str | None = None
    jurisdiction: str | None = None
    category: str | None = None


class AssessmentResult(BaseModel):
    """Compliance assessment result."""

    model_config = _BASE_CONFIG

    asset_id: str | None = None
    framework: str | None = None
    status: str | None = None
    score: float | None = None
    findings: list[str] | None = None


# ── Handshake ─────────────────────────────────────────────────────────────────


class HelloResponse(BaseModel):
    """GET /api/v11/sdk/handshake/hello response."""

    model_config = _BASE_CONFIG

    platform_version: str | None = None
    api_version: str | None = None
    status: str | None = None
    app_id: str | None = None
    tier: str | None = None


class HeartbeatResponse(BaseModel):
    """POST /api/v11/sdk/handshake/heartbeat response."""

    model_config = _BASE_CONFIG

    ack: bool = False
    server_time: str | None = None


class CapabilitiesResponse(BaseModel):
    """GET /api/v11/sdk/handshake/capabilities response."""

    model_config = _BASE_CONFIG

    endpoints: list[str] | None = None
    scopes: list[str] | None = None


class ConfigResponse(BaseModel):
    """GET /api/v11/sdk/handshake/config response."""

    model_config = _BASE_CONFIG

    status: str | None = None
    tier: str | None = None
    scopes: list[str] | None = None

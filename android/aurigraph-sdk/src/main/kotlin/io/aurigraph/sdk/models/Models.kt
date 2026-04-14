package io.aurigraph.sdk.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject

// ── Platform ─────────────────────────────────────────────────────────────────

/** Response from `GET /api/v11/health`. */
@Serializable
data class HealthResponse(
    val status: String,
    @SerialName("durationMs") val durationMs: Int? = null,
    val version: String? = null,
    val timestamp: String? = null,
)

/** Response from `GET /api/v11/stats`. */
@Serializable
data class PlatformStats(
    val tps: Double = 0.0,
    @SerialName("activeNodes") val activeNodes: Int = 0,
    @SerialName("blockHeight") val blockHeight: Int = 0,
    @SerialName("totalTransactions") val totalTransactions: Int? = null,
    val uptime: Double? = null,
)

// ── Nodes ────────────────────────────────────────────────────────────────────

/** A single node in the network. */
@Serializable
data class NodeInfo(
    val id: String = "",
    val name: String? = null,
    @SerialName("nodeType") val nodeType: String? = null,
    val status: String? = null,
    val host: String? = null,
    val port: Int? = null,
    val metadata: JsonObject? = null,
)

/** Aggregate node metrics from `GET /api/v11/nodes/metrics`. */
@Serializable
data class NodeMetrics(
    @SerialName("totalNodes") val totalNodes: Int = 0,
    @SerialName("activeNodes") val activeNodes: Int = 0,
    @SerialName("validatorCount") val validatorCount: Int = 0,
    @SerialName("networkStatus") val networkStatus: String? = null,
)

/** Node registration request. */
@Serializable
data class NodeRegisterRequest(
    val name: String,
    @SerialName("nodeType") val nodeType: String,
    val host: String,
    val port: Int,
    val metadata: JsonObject? = null,
)

// ── Channels ─────────────────────────────────────────────────────────────────

/** A platform channel. */
@Serializable
data class Channel(
    val id: String = "",
    val name: String? = null,
    @SerialName("channelType") val channelType: String? = null,
    val status: String? = null,
)

// ── Transactions ─────────────────────────────────────────────────────────────

/** A blockchain transaction. */
@Serializable
data class Transaction(
    val id: String = "",
    val hash: String? = null,
    val type: String? = null,
    val status: String? = null,
    val timestamp: String? = null,
    val data: JsonObject? = null,
)

/** Request to submit a transaction. */
@Serializable
data class TransactionSubmitRequest(
    val type: String,
    val data: JsonObject,
    @SerialName("channelId") val channelId: String? = null,
)

/** Receipt returned after submitting a transaction. */
@Serializable
data class TransactionReceipt(
    @SerialName("transactionId") val transactionId: String = "",
    val hash: String? = null,
    val status: String? = null,
    val timestamp: String? = null,
)

// ── Assets / Use Cases ───────────────────────────────────────────────────────

/** A registered use case (UC_GOLD, UC_CARBON, UC_REAL_ESTATE, etc.). */
@Serializable
data class UseCase(
    val id: String = "",
    val name: String = "",
    val description: String? = null,
    val status: String? = null,
)

/** A tokenized asset on the platform. */
@Serializable
data class Asset(
    val id: String = "",
    val name: String? = null,
    @SerialName("assetType") val assetType: String? = null,
    @SerialName("useCaseId") val useCaseId: String? = null,
    @SerialName("channelId") val channelId: String? = null,
    val status: String? = null,
    val metadata: JsonObject? = null,
)

// ── Handshake Protocol ───────────────────────────────────────────────────────

/** Response from `GET /api/v11/sdk/handshake/hello`. */
@Serializable
data class HelloResponse(
    @SerialName("appId") val appId: String = "",
    @SerialName("appName") val appName: String = "",
    val did: String = "",
    val status: String = "",
    @SerialName("serverVersion") val serverVersion: String = "",
    @SerialName("protocolVersion") val protocolVersion: String = "",
    @SerialName("approvedScopes") val approvedScopes: List<String> = emptyList(),
    @SerialName("requestedScopes") val requestedScopes: List<String> = emptyList(),
    @SerialName("pendingScopes") val pendingScopes: List<String> = emptyList(),
    @SerialName("rateLimit") val rateLimit: HandshakeRateLimit = HandshakeRateLimit(),
    @SerialName("heartbeatIntervalMs") val heartbeatIntervalMs: Int = 300_000,
    val features: Map<String, Boolean> = emptyMap(),
    @SerialName("nextHeartbeatAt") val nextHeartbeatAt: String = "",
)

/** Rate-limit policy from the handshake. */
@Serializable
data class HandshakeRateLimit(
    @SerialName("requestsPerMinute") val requestsPerMinute: Int = 60,
    @SerialName("burstSize") val burstSize: Int = 10,
)

/** Response from `POST /api/v11/sdk/handshake/heartbeat`. */
@Serializable
data class HeartbeatResponse(
    @SerialName("receivedAt") val receivedAt: String = "",
    @SerialName("nextHeartbeatAt") val nextHeartbeatAt: String = "",
    val status: String = "",
)

/** Heartbeat request body. */
@Serializable
data class HeartbeatRequest(
    @SerialName("clientVersion") val clientVersion: String? = null,
    val timestamp: String = "",
)

/** Response from `GET /api/v11/sdk/handshake/capabilities`. */
@Serializable
data class CapabilitiesResponse(
    @SerialName("appId") val appId: String = "",
    @SerialName("approvedScopes") val approvedScopes: List<String> = emptyList(),
    val endpoints: List<CapabilityEndpoint> = emptyList(),
    @SerialName("totalEndpoints") val totalEndpoints: Int = 0,
)

/** A single capability endpoint descriptor. */
@Serializable
data class CapabilityEndpoint(
    val method: String = "",
    val path: String = "",
    @SerialName("requiredScope") val requiredScope: String = "",
    val description: String = "",
)

/** Response from `GET /api/v11/sdk/handshake/config`. */
@Serializable
data class ConfigResponse(
    @SerialName("appId") val appId: String = "",
    val status: String = "",
    @SerialName("approvedScopes") val approvedScopes: List<String> = emptyList(),
    @SerialName("pendingScopes") val pendingScopes: List<String> = emptyList(),
    @SerialName("rateLimit") val rateLimit: HandshakeRateLimit = HandshakeRateLimit(),
    @SerialName("lastUpdatedAt") val lastUpdatedAt: String = "",
)

// ── GDPR ─────────────────────────────────────────────────────────────────────

/** Structured export of all user data (GDPR Article 20). */
@Serializable
data class GdprExportPayload(
    @SerialName("userId") val userId: String = "",
    @SerialName("exportedAt") val exportedAt: String = "",
    val data: JsonObject? = null,
)

/** Data section within a GDPR export. */
@Serializable
data class DataSection(
    val name: String = "",
    @SerialName("recordCount") val recordCount: Int = 0,
    val entries: List<JsonObject> = emptyList(),
)

/** Receipt confirming data erasure (GDPR Article 17). */
@Serializable
data class ErasureReceipt(
    @SerialName("userId") val userId: String = "",
    @SerialName("erasedAt") val erasedAt: String = "",
    val status: String = "",
    @SerialName("receiptId") val receiptId: String? = null,
)

// ── GraphQL ──────────────────────────────────────────────────────────────────

/** GraphQL query request body. */
@Serializable
data class GraphQLRequest(
    val query: String,
    val variables: JsonObject? = null,
)

/** GraphQL response envelope. */
@Serializable
data class GraphQLResponse(
    val data: JsonObject? = null,
    val errors: List<GraphQLError>? = null,
)

/** A single GraphQL error. */
@Serializable
data class GraphQLError(
    val message: String = "",
    val locations: List<GraphQLErrorLocation>? = null,
    val path: List<String>? = null,
)

/** Source location of a GraphQL error. */
@Serializable
data class GraphQLErrorLocation(
    val line: Int = 0,
    val column: Int = 0,
)

// ── Tier ─────────────────────────────────────────────────────────────────────

/** Partner tier configuration. */
@Serializable
data class TierConfig(
    val tier: String = "",
    val name: String = "",
    @SerialName("rateLimit") val rateLimit: Int = 0,
    val features: List<String> = emptyList(),
    @SerialName("maxAssets") val maxAssets: Int = 0,
)

/** API usage statistics. */
@Serializable
data class UsageStats(
    @SerialName("requestsToday") val requestsToday: Int = 0,
    @SerialName("requestsThisMonth") val requestsThisMonth: Int = 0,
    @SerialName("averageLatencyMs") val averageLatencyMs: Double = 0.0,
    @SerialName("topEndpoints") val topEndpoints: List<String> = emptyList(),
)

/** Mint quota for the partner. */
@Serializable
data class MintQuota(
    val total: Int = 0,
    val used: Int = 0,
    val remaining: Int = 0,
    @SerialName("resetsAt") val resetsAt: String? = null,
)

/** Tier upgrade request. */
@Serializable
data class UpgradeRequest(
    @SerialName("targetTier") val targetTier: String,
    val reason: String? = null,
)

/** Tier upgrade response. */
@Serializable
data class UpgradeResponse(
    val status: String = "",
    @SerialName("requestId") val requestId: String? = null,
    val message: String? = null,
)

// ── Governance ───────────────────────────────────────────────────────────────

/** A governance proposal. */
@Serializable
data class Proposal(
    val id: String = "",
    val title: String? = null,
    val description: String? = null,
    val status: String? = null,
    @SerialName("createdAt") val createdAt: String? = null,
    @SerialName("votesFor") val votesFor: Int = 0,
    @SerialName("votesAgainst") val votesAgainst: Int = 0,
)

/** Vote request body. */
@Serializable
data class VoteRequest(
    val approve: Boolean,
)

/** Receipt confirming a governance vote. */
@Serializable
data class VoteReceipt(
    @SerialName("proposalId") val proposalId: String = "",
    val vote: String? = null,
    @SerialName("recordedAt") val recordedAt: String? = null,
    val status: String? = null,
)

/** Governance treasury statistics. */
@Serializable
data class TreasuryStats(
    @SerialName("totalBalance") val totalBalance: Double = 0.0,
    val currency: String? = null,
    @SerialName("activeProposals") val activeProposals: Int = 0,
    @SerialName("totalDisbursed") val totalDisbursed: Double = 0.0,
)

// ── Wallet ───────────────────────────────────────────────────────────────────

/** Wallet balance for an address. */
@Serializable
data class WalletBalance(
    val address: String = "",
    val balance: Double = 0.0,
    val currency: String? = null,
    @SerialName("lastUpdated") val lastUpdated: String? = null,
)

/** Token transfer request. */
@Serializable
data class TransferRequest(
    val from: String,
    val to: String,
    val amount: Double,
    val currency: String? = null,
    val memo: String? = null,
)

/** Receipt confirming a token transfer. */
@Serializable
data class TransferReceipt(
    @SerialName("transferId") val transferId: String = "",
    val status: String? = null,
    val hash: String? = null,
    val timestamp: String? = null,
)

// ── Compliance ───────────────────────────────────────────────────────────────

/** A compliance framework definition. */
@Serializable
data class ComplianceFramework(
    val id: String = "",
    val name: String = "",
    val description: String? = null,
    val jurisdiction: String? = null,
    val version: String? = null,
)

/** Request to run a compliance assessment. */
@Serializable
data class AssessmentRequest(
    @SerialName("assetId") val assetId: String,
    val framework: String,
)

/** Result of a compliance assessment. */
@Serializable
data class AssessmentResult(
    @SerialName("assessmentId") val assessmentId: String = "",
    @SerialName("assetId") val assetId: String = "",
    val framework: String = "",
    val status: String = "",
    val score: Double? = null,
    val findings: List<String> = emptyList(),
    val timestamp: String? = null,
)

// ── DMRV ─────────────────────────────────────────────────────────────────────

/** A DMRV measurement event. */
@Serializable
data class DmrvEvent(
    val id: String? = null,
    @SerialName("contractId") val contractId: String? = null,
    @SerialName("deviceId") val deviceId: String? = null,
    @SerialName("eventType") val eventType: String = "",
    val value: Double = 0.0,
    val unit: String? = null,
    val timestamp: String? = null,
    val metadata: JsonObject? = null,
)

/** Receipt confirming a DMRV event recording. */
@Serializable
data class DmrvReceipt(
    @SerialName("eventId") val eventId: String = "",
    val status: String = "",
    val timestamp: String? = null,
)

/** Receipt for a batch of DMRV events. */
@Serializable
data class BatchReceipt(
    val accepted: Int = 0,
    val rejected: Int = 0,
    val receipts: List<DmrvReceipt> = emptyList(),
    val errors: List<BatchError> = emptyList(),
) {
    /** Error detail for a single rejected event in a batch. */
    @Serializable
    data class BatchError(
        val index: Int = 0,
        val message: String = "",
        @SerialName("errorCode") val errorCode: String? = null,
    )
}

// ── Contracts ────────────────────────────────────────────────────────────────

/** Contract deployment request. */
@Serializable
data class ContractDeployRequest(
    @SerialName("templateId") val templateId: String,
    val parameters: JsonObject? = null,
    @SerialName("channelId") val channelId: String? = null,
)

/** Contract invocation request. */
@Serializable
data class ContractInvokeRequest(
    val method: String,
    val args: JsonObject? = null,
)

/** Deployed contract information. */
@Serializable
data class ContractInfo(
    val id: String = "",
    @SerialName("templateId") val templateId: String? = null,
    val status: String? = null,
    @SerialName("deployedAt") val deployedAt: String? = null,
    val metadata: JsonObject? = null,
)

/** Result of a contract invocation. */
@Serializable
data class ContractInvokeResult(
    @SerialName("contractId") val contractId: String = "",
    val result: JsonObject? = null,
    val status: String? = null,
    val timestamp: String? = null,
)

// ── RFC 7807 Problem Details ─────────────────────────────────────────────────

/** RFC 7807 `application/problem+json` error envelope. */
@Serializable
data class ProblemDetails(
    val type: String? = null,
    val title: String? = null,
    val status: Int? = null,
    val detail: String? = null,
    val instance: String? = null,
    @SerialName("errorCode") val errorCode: String? = null,
    @SerialName("traceId") val traceId: String? = null,
    @SerialName("requestId") val requestId: String? = null,
    val service: String? = null,
    val timestamp: String? = null,
)

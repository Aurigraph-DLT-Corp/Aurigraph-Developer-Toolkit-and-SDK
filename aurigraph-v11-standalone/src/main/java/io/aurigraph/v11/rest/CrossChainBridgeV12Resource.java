package io.aurigraph.v11.rest;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * Cross-Chain Bridge V12 REST API Resource
 * Provides endpoints for cross-chain asset transfers and bridge management
 *
 * Supported Chains:
 * - Ethereum (ETH)
 * - Polygon (MATIC)
 * - Binance Smart Chain (BSC)
 * - Avalanche (AVAX)
 * - Solana (SOL)
 *
 * @author Aurigraph J4C Agent
 * @version 12.0.0
 */
@Path("/api/v12/bridge")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Cross-Chain Bridge V12", description = "Cross-chain asset transfer and bridge management APIs")
public class CrossChainBridgeV12Resource {

    private static final Logger LOG = Logger.getLogger(CrossChainBridgeV12Resource.class);

    // Bridge state tracking
    private final Instant bridgeStartTime = Instant.now();
    private final AtomicLong totalTransfersProcessed = new AtomicLong(0);
    private final Map<String, TransferRecord> transferHistory = new ConcurrentHashMap<>();
    private final Map<String, ChainStatus> chainStatuses = new ConcurrentHashMap<>();
    private final Map<String, BigDecimal> chainLockedAmounts = new ConcurrentHashMap<>();

    // Supported blockchain configurations
    private static final List<SupportedChain> SUPPORTED_CHAINS = List.of(
        new SupportedChain("ethereum", "Ethereum", "mainnet", "evm", 12, new BigDecimal("0.001"), true),
        new SupportedChain("polygon", "Polygon", "mainnet", "evm", 128, new BigDecimal("0.0001"), true),
        new SupportedChain("bsc", "Binance Smart Chain", "mainnet", "evm", 15, new BigDecimal("0.0005"), true),
        new SupportedChain("avalanche", "Avalanche C-Chain", "mainnet", "evm", 1, new BigDecimal("0.0002"), true),
        new SupportedChain("solana", "Solana", "mainnet-beta", "solana", 32, new BigDecimal("0.00001"), true)
    );

    public CrossChainBridgeV12Resource() {
        // Initialize chain statuses
        SUPPORTED_CHAINS.forEach(chain -> {
            chainStatuses.put(chain.id(), new ChainStatus(chain.id(), true, 0, Instant.now()));
            chainLockedAmounts.put(chain.id(), BigDecimal.ZERO);
        });
        LOG.info("Cross-Chain Bridge V12 initialized with " + SUPPORTED_CHAINS.size() + " supported chains");
    }

    /**
     * GET /api/v12/bridge/status - Get bridge health status
     */
    @GET
    @Path("/status")
    @Operation(
        summary = "Get bridge health status",
        description = "Returns comprehensive health metrics for the cross-chain bridge including uptime, connected chains, and transfer statistics"
    )
    @APIResponse(
        responseCode = "200",
        description = "Bridge status retrieved successfully",
        content = @Content(schema = @Schema(implementation = BridgeStatus.class))
    )
    public Response getBridgeStatus() {
        LOG.debug("Fetching bridge status");

        long uptimeSeconds = Instant.now().getEpochSecond() - bridgeStartTime.getEpochSecond();
        long connectedChains = chainStatuses.values().stream()
            .filter(ChainStatus::connected)
            .count();
        long pendingTransfers = transferHistory.values().stream()
            .filter(t -> "PENDING".equals(t.status()) || "PROCESSING".equals(t.status()))
            .count();
        BigDecimal totalLocked = chainLockedAmounts.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BridgeStatus status = new BridgeStatus(
            true,
            connectedChains,
            pendingTransfers,
            totalLocked.toPlainString() + " USD",
            uptimeSeconds,
            totalTransfersProcessed.get(),
            "V12.0.0",
            System.currentTimeMillis()
        );

        LOG.info("Bridge status: " + connectedChains + " chains connected, " +
                pendingTransfers + " pending transfers, uptime: " + uptimeSeconds + "s");

        return Response.ok(status).build();
    }

    /**
     * GET /api/v12/bridge/chains - List supported chains
     */
    @GET
    @Path("/chains")
    @Operation(
        summary = "List supported blockchain networks",
        description = "Returns detailed information about all supported blockchain networks including their status, confirmations required, and fees"
    )
    @APIResponse(
        responseCode = "200",
        description = "Chain list retrieved successfully",
        content = @Content(schema = @Schema(implementation = ChainsResponse.class))
    )
    public Response getSupportedChains() {
        LOG.debug("Fetching supported chains");

        List<ChainInfo> chains = SUPPORTED_CHAINS.stream()
            .map(sc -> {
                ChainStatus status = chainStatuses.get(sc.id());
                return new ChainInfo(
                    sc.id(),
                    sc.name(),
                    sc.type(),
                    status != null && status.connected() ? "ACTIVE" : "INACTIVE",
                    sc.confirmations(),
                    sc.baseFee().toPlainString() + " ETH"
                );
            })
            .collect(Collectors.toList());

        ChainsResponse response = new ChainsResponse(
            chains.size(),
            chains,
            System.currentTimeMillis()
        );

        LOG.info("Returning " + chains.size() + " supported chains");
        return Response.ok(response).build();
    }

    /**
     * POST /api/v12/bridge/transfer - Initiate cross-chain transfer
     */
    @POST
    @Path("/transfer")
    @Operation(
        summary = "Initiate cross-chain asset transfer",
        description = "Creates a new cross-chain transfer request. The transfer will be processed asynchronously and requires proof verification."
    )
    @APIResponse(
        responseCode = "200",
        description = "Transfer initiated successfully",
        content = @Content(schema = @Schema(implementation = TransferResponse.class))
    )
    @APIResponse(
        responseCode = "400",
        description = "Invalid transfer request"
    )
    public Response initiateTransfer(TransferRequest request) {
        LOG.info("Initiating transfer: " + request.amount() + " " + request.asset() +
                " from " + request.sourceChain() + " to " + request.targetChain());

        // Validate chains
        if (!isChainSupported(request.sourceChain())) {
            LOG.warn("Source chain not supported: " + request.sourceChain());
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("Source chain not supported: " + request.sourceChain()))
                .build();
        }

        if (!isChainSupported(request.targetChain())) {
            LOG.warn("Target chain not supported: " + request.targetChain());
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("Target chain not supported: " + request.targetChain()))
                .build();
        }

        if (request.sourceChain().equals(request.targetChain())) {
            LOG.warn("Source and target chains cannot be the same");
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("Source and target chains must be different"))
                .build();
        }

        // Validate amount
        BigDecimal amount;
        try {
            amount = new BigDecimal(request.amount());
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new NumberFormatException("Amount must be positive");
            }
        } catch (NumberFormatException e) {
            LOG.warn("Invalid amount: " + request.amount());
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse("Invalid amount: " + request.amount()))
                .build();
        }

        // Calculate fees
        BigDecimal sourceFee = getChainFee(request.sourceChain());
        BigDecimal targetFee = getChainFee(request.targetChain());
        BigDecimal totalFee = sourceFee.add(targetFee);

        // Estimate transfer time (based on confirmations)
        int sourceConfirmations = getChainConfirmations(request.sourceChain());
        int targetConfirmations = getChainConfirmations(request.targetChain());
        long estimatedTimeSeconds = (sourceConfirmations + targetConfirmations) * 15L; // ~15s per block

        // Generate transfer ID
        String transferId = "tx_" + UUID.randomUUID().toString();

        // Create transfer record
        TransferRecord record = new TransferRecord(
            transferId,
            request.sourceChain(),
            request.targetChain(),
            request.asset(),
            amount,
            request.recipient(),
            "PENDING",
            totalFee,
            Instant.now(),
            null,
            null,
            null
        );

        transferHistory.put(transferId, record);
        totalTransfersProcessed.incrementAndGet();

        // Update locked amounts
        chainLockedAmounts.compute(request.sourceChain(),
            (k, v) -> v != null ? v.add(amount) : amount);

        TransferResponse response = new TransferResponse(
            transferId,
            "PENDING",
            estimatedTimeSeconds,
            totalFee.toPlainString() + " ETH",
            true,
            "Transfer request created successfully. Please submit proof for verification.",
            System.currentTimeMillis()
        );

        LOG.info("Transfer initiated: " + transferId + " - Fee: " + totalFee + " ETH, ETA: " +
                estimatedTimeSeconds + "s");

        return Response.ok(response).build();
    }

    /**
     * GET /api/v12/bridge/history - Get transfer history
     */
    @GET
    @Path("/history")
    @Operation(
        summary = "Get transfer history",
        description = "Retrieves paginated transfer history with optional filters for address, chain, and status"
    )
    @APIResponse(
        responseCode = "200",
        description = "Transfer history retrieved successfully",
        content = @Content(schema = @Schema(implementation = TransferHistoryResponse.class))
    )
    public Response getTransferHistory(
        @Parameter(description = "Filter by address") @QueryParam("address") String address,
        @Parameter(description = "Filter by chain ID") @QueryParam("chain") String chain,
        @Parameter(description = "Filter by status") @QueryParam("status") String status,
        @Parameter(description = "Page number (0-based)") @QueryParam("page") @DefaultValue("0") int page,
        @Parameter(description = "Page size") @QueryParam("size") @DefaultValue("20") int size
    ) {
        LOG.debug("Fetching transfer history - address: " + address + ", chain: " + chain +
                 ", status: " + status + ", page: " + page + ", size: " + size);

        // Filter transfers
        List<TransferHistoryItem> filtered = transferHistory.values().stream()
            .filter(t -> address == null || address.equals(t.recipient()))
            .filter(t -> chain == null || chain.equals(t.sourceChain()) || chain.equals(t.targetChain()))
            .filter(t -> status == null || status.equalsIgnoreCase(t.status()))
            .sorted((t1, t2) -> t2.timestamp().compareTo(t1.timestamp())) // Most recent first
            .map(t -> new TransferHistoryItem(
                t.transferId(),
                t.sourceChain(),
                t.targetChain(),
                t.amount().toPlainString() + " " + t.asset(),
                t.status(),
                t.timestamp().toEpochMilli(),
                t.completedAt() != null ? t.completedAt().toEpochMilli() : null
            ))
            .collect(Collectors.toList());

        // Paginate
        int totalItems = filtered.size();
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, totalItems);

        if (fromIndex >= totalItems) {
            filtered = List.of();
        } else {
            filtered = filtered.subList(fromIndex, toIndex);
        }

        TransferHistoryResponse response = new TransferHistoryResponse(
            filtered,
            totalItems,
            page,
            size,
            (totalItems + size - 1) / size, // Total pages
            System.currentTimeMillis()
        );

        LOG.info("Returning " + filtered.size() + " transfers (page " + page + " of " +
                response.totalPages() + ")");

        return Response.ok(response).build();
    }

    /**
     * POST /api/v12/bridge/verify - Verify cross-chain proof
     */
    @POST
    @Path("/verify")
    @Operation(
        summary = "Verify cross-chain transfer proof",
        description = "Verifies the cryptographic proof for a cross-chain transfer and updates transfer status"
    )
    @APIResponse(
        responseCode = "200",
        description = "Proof verification completed",
        content = @Content(schema = @Schema(implementation = VerificationResponse.class))
    )
    @APIResponse(
        responseCode = "404",
        description = "Transfer not found"
    )
    public Response verifyProof(VerificationRequest request) {
        LOG.info("Verifying proof for transfer: " + request.transferId());

        TransferRecord transfer = transferHistory.get(request.transferId());

        if (transfer == null) {
            LOG.warn("Transfer not found: " + request.transferId());
            return Response.status(Response.Status.NOT_FOUND)
                .entity(new ErrorResponse("Transfer not found: " + request.transferId()))
                .build();
        }

        long verificationStartTime = System.currentTimeMillis();

        // Simulate proof verification (mock implementation)
        boolean isValid = verifyMockProof(request.proof(), request.sourceBlockHash(), transfer);
        long verificationTime = System.currentTimeMillis() - verificationStartTime;

        String details;
        if (isValid) {
            // Update transfer status
            TransferRecord updatedTransfer = new TransferRecord(
                transfer.transferId(),
                transfer.sourceChain(),
                transfer.targetChain(),
                transfer.asset(),
                transfer.amount(),
                transfer.recipient(),
                "COMPLETED",
                transfer.fee(),
                transfer.timestamp(),
                Instant.now(),
                request.sourceBlockHash(),
                request.proof()
            );
            transferHistory.put(transfer.transferId(), updatedTransfer);

            // Release locked amount
            chainLockedAmounts.compute(transfer.sourceChain(),
                (k, v) -> v != null ? v.subtract(transfer.amount()) : BigDecimal.ZERO);

            details = "Proof verified successfully. Transfer completed. " +
                     "Block: " + request.sourceBlockHash() + ", " +
                     "Amount: " + transfer.amount() + " " + transfer.asset();

            LOG.info("Proof verified successfully for transfer: " + request.transferId());
        } else {
            // Update transfer status to failed
            TransferRecord failedTransfer = new TransferRecord(
                transfer.transferId(),
                transfer.sourceChain(),
                transfer.targetChain(),
                transfer.asset(),
                transfer.amount(),
                transfer.recipient(),
                "FAILED",
                transfer.fee(),
                transfer.timestamp(),
                Instant.now(),
                request.sourceBlockHash(),
                request.proof()
            );
            transferHistory.put(transfer.transferId(), failedTransfer);

            details = "Proof verification failed. Invalid proof or block hash. Transfer marked as failed.";

            LOG.warn("Proof verification failed for transfer: " + request.transferId());
        }

        VerificationResponse response = new VerificationResponse(
            isValid,
            verificationTime,
            details,
            request.sourceBlockHash(),
            isValid ? "COMPLETED" : "FAILED",
            System.currentTimeMillis()
        );

        return Response.ok(response).build();
    }

    // Helper methods

    private boolean isChainSupported(String chainId) {
        return SUPPORTED_CHAINS.stream().anyMatch(c -> c.id().equals(chainId));
    }

    private BigDecimal getChainFee(String chainId) {
        return SUPPORTED_CHAINS.stream()
            .filter(c -> c.id().equals(chainId))
            .findFirst()
            .map(SupportedChain::baseFee)
            .orElse(BigDecimal.ZERO);
    }

    private int getChainConfirmations(String chainId) {
        return SUPPORTED_CHAINS.stream()
            .filter(c -> c.id().equals(chainId))
            .findFirst()
            .map(SupportedChain::confirmations)
            .orElse(12);
    }

    /**
     * Mock proof verification implementation
     * In production, this would verify Merkle proofs, SPV proofs, or light client proofs
     */
    private boolean verifyMockProof(String proof, String blockHash, TransferRecord transfer) {
        // Mock verification logic
        // In real implementation, this would:
        // 1. Verify Merkle proof against block hash
        // 2. Validate transaction inclusion
        // 3. Check signature validity
        // 4. Verify chain consensus

        if (proof == null || proof.isEmpty() || blockHash == null || blockHash.isEmpty()) {
            return false;
        }

        // Simple mock: proof must contain transfer ID and be at least 64 chars (simulated hash)
        return proof.contains(transfer.transferId()) && proof.length() >= 64;
    }

    // Data classes for requests and responses

    public record TransferRequest(
        String sourceChain,
        String targetChain,
        String asset,
        String amount,
        String recipient
    ) {}

    public record VerificationRequest(
        String transferId,
        String proof,
        String sourceBlockHash
    ) {}

    public record BridgeStatus(
        boolean healthy,
        long connectedChains,
        long pendingTransfers,
        String totalLocked,
        long uptime,
        long totalTransfersProcessed,
        String version,
        long timestamp
    ) {}

    public record ChainsResponse(
        int totalChains,
        List<ChainInfo> chains,
        long timestamp
    ) {}

    public record ChainInfo(
        String id,
        String name,
        String type,
        String status,
        int confirmations,
        String fee
    ) {}

    public record TransferResponse(
        String transferId,
        String status,
        long estimatedTime,
        String fee,
        boolean proofRequired,
        String message,
        long timestamp
    ) {}

    public record TransferHistoryResponse(
        List<TransferHistoryItem> transfers,
        int totalItems,
        int page,
        int size,
        int totalPages,
        long timestamp
    ) {}

    public record TransferHistoryItem(
        String id,
        String source,
        String target,
        String amount,
        String status,
        long timestamp,
        Long completedAt
    ) {}

    public record VerificationResponse(
        boolean valid,
        long verificationTime,
        String details,
        String blockHash,
        String transferStatus,
        long timestamp
    ) {}

    public record ErrorResponse(
        String error
    ) {}

    // Internal data structures

    private record SupportedChain(
        String id,
        String name,
        String network,
        String type,
        int confirmations,
        BigDecimal baseFee,
        boolean active
    ) {}

    private record ChainStatus(
        String chainId,
        boolean connected,
        long lastHeartbeat,
        Instant connectedAt
    ) {}

    private record TransferRecord(
        String transferId,
        String sourceChain,
        String targetChain,
        String asset,
        BigDecimal amount,
        String recipient,
        String status,
        BigDecimal fee,
        Instant timestamp,
        Instant completedAt,
        String sourceBlockHash,
        String proof
    ) {}
}

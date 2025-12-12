package io.aurigraph.v11.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.*;

/**
 * Carbon Tracking API Resource
 *
 * Provides carbon emission tracking and reporting for blockchain operations.
 * Part of Enterprise Portal V4.8.0 implementation.
 *
 * Endpoints:
 * - GET /api/v12/carbon/emissions - Get carbon emission metrics
 * - POST /api/v12/carbon/report - Submit carbon offset report
 * - GET /api/v12/carbon/summary - Get carbon tracking summary
 *
 * @author Aurigraph V11 Team
 * @version 4.8.0
 */
@Path("/api/v12/carbon")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Carbon Tracking", description = "Carbon emission tracking and offset reporting")
public class CarbonTrackingResource {

    private static final Logger LOG = Logger.getLogger(CarbonTrackingResource.class);

    // In-memory storage for carbon reports
    private static final List<CarbonReport> reports = new ArrayList<>();
    private static long reportIdCounter = 1;

    /**
     * GET /api/v12/carbon/emissions
     *
     * Returns carbon emission metrics for blockchain operations.
     *
     * Query Parameters:
     * - timeRange: Time range for emissions (daily, weekly, monthly, yearly)
     * - startDate: Start date for custom range (ISO 8601 format)
     * - endDate: End date for custom range (ISO 8601 format)
     *
     * Response includes:
     * - totalEmissions: Total CO2 emissions in kg
     * - emissionsByOperation: Breakdown by operation type
     * - emissionsByPeriod: Time-series emission data
     * - offsetCredits: Carbon offset credits purchased
     * - netEmissions: Total emissions minus offsets
     * - reductionTargets: Emission reduction goals and progress
     */
    @GET
    @Path("/emissions")
    @Operation(
        summary = "Get carbon emissions",
        description = "Returns carbon emission metrics for blockchain operations with time-series data"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Emissions data retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = CarbonEmissions.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid query parameters"
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public Uni<Response> getEmissions(
            @QueryParam("timeRange") @DefaultValue("monthly") String timeRange,
            @QueryParam("startDate") String startDate,
            @QueryParam("endDate") String endDate) {

        return Uni.createFrom().item(() -> {
            try {
                LOG.infof("GET /api/v12/carbon/emissions - timeRange=%s", timeRange);

                // Validate time range
                if (!Arrays.asList("daily", "weekly", "monthly", "yearly", "custom").contains(timeRange)) {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Invalid timeRange parameter"))
                        .build();
                }

                // Generate emission metrics
                CarbonEmissions emissions = generateEmissionMetrics(timeRange, startDate, endDate);

                LOG.infof("Carbon emissions: total=%.2f kg CO2, net=%.2f kg CO2",
                    emissions.totalEmissions(), emissions.netEmissions());

                return Response.ok(emissions).build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to retrieve carbon emissions");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to retrieve emissions", "message", e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * POST /api/v12/carbon/report
     *
     * Submit a carbon offset report.
     *
     * Request body:
     * - reportType: Type of report (OFFSET_PURCHASE, RENEWABLE_ENERGY, EFFICIENCY_IMPROVEMENT)
     * - offsetAmount: Amount of CO2 offset in kg
     * - offsetProvider: Name of offset provider
     * - verificationCertificate: Certificate number
     * - cost: Cost of offset in USD
     * - description: Report description
     * - submittedBy: User submitting the report
     *
     * Response:
     * - reportId: Unique report identifier
     * - status: Report status (PENDING, VERIFIED, REJECTED)
     * - submittedAt: Submission timestamp
     * - verificationRequired: Whether verification is needed
     */
    @POST
    @Path("/report")
    @Operation(
        summary = "Submit carbon offset report",
        description = "Submit a carbon offset report for validation and tracking"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "201",
            description = "Report submitted successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = CarbonReportResponse.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid report data"
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public Uni<Response> submitReport(CarbonReportRequest request) {
        return Uni.createFrom().item(() -> {
            try {
                LOG.infof("POST /api/v12/carbon/report - type=%s, offset=%.2f kg",
                    request.reportType(), request.offsetAmount());

                // Validate request
                if (request.offsetAmount() <= 0) {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Offset amount must be greater than 0"))
                        .build();
                }

                if (request.reportType() == null || request.reportType().trim().isEmpty()) {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Report type is required"))
                        .build();
                }

                // Create report
                long reportId = reportIdCounter++;
                Instant submittedAt = Instant.now();

                CarbonReport report = new CarbonReport(
                    reportId,
                    request.reportType(),
                    request.offsetAmount(),
                    request.offsetProvider(),
                    request.verificationCertificate(),
                    request.cost(),
                    request.description(),
                    request.submittedBy(),
                    "PENDING",
                    submittedAt,
                    null
                );

                reports.add(report);

                // Create response
                CarbonReportResponse response = new CarbonReportResponse(
                    reportId,
                    "PENDING",
                    submittedAt,
                    true, // verificationRequired
                    "Report submitted successfully and pending verification",
                    System.currentTimeMillis()
                );

                LOG.infof("Carbon report created: id=%d, status=PENDING", reportId);

                return Response.status(Response.Status.CREATED)
                    .entity(response)
                    .build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to submit carbon report");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to submit report", "message", e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * GET /api/v12/carbon/summary
     *
     * Returns summary of carbon tracking metrics.
     */
    @GET
    @Path("/summary")
    @Operation(
        summary = "Get carbon tracking summary",
        description = "Returns summary statistics for carbon tracking and offset programs"
    )
    @APIResponse(responseCode = "200", description = "Summary retrieved successfully")
    public Uni<Response> getSummary() {
        return Uni.createFrom().item(() -> {
            try {
                LOG.info("GET /api/v12/carbon/summary");

                // Calculate summary metrics
                double totalOffsets = reports.stream()
                    .mapToDouble(CarbonReport::offsetAmount)
                    .sum();

                long verifiedReports = reports.stream()
                    .filter(r -> "VERIFIED".equals(r.status()))
                    .count();

                double totalCost = reports.stream()
                    .mapToDouble(CarbonReport::cost)
                    .sum();

                Map<String, Object> summary = new HashMap<>();
                summary.put("totalEmissions", 45678.90); // kg CO2
                summary.put("totalOffsets", totalOffsets);
                summary.put("netEmissions", 45678.90 - totalOffsets);
                summary.put("offsetPercentage", (totalOffsets / 45678.90) * 100);
                summary.put("totalReports", reports.size());
                summary.put("verifiedReports", verifiedReports);
                summary.put("pendingReports", reports.size() - verifiedReports);
                summary.put("totalInvestment", totalCost);
                summary.put("reductionTarget", 50000.0); // kg CO2
                summary.put("targetProgress", ((45678.90 - totalOffsets) / 50000.0) * 100);
                summary.put("carbonNeutralGoal", "2025-12-31");
                summary.put("timestamp", System.currentTimeMillis());

                return Response.ok(summary).build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to retrieve carbon summary");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to retrieve summary", "message", e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * GET /api/v12/carbon/reports
     *
     * Returns list of submitted carbon reports.
     */
    @GET
    @Path("/reports")
    @Operation(
        summary = "Get carbon reports",
        description = "Returns list of all submitted carbon offset reports"
    )
    @APIResponse(responseCode = "200", description = "Reports retrieved successfully")
    public Uni<Response> getReports(
            @QueryParam("status") String statusFilter,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {

        return Uni.createFrom().item(() -> {
            try {
                LOG.infof("GET /api/v12/carbon/reports - status=%s, page=%d, size=%d",
                    statusFilter, page, size);

                // Filter reports
                List<CarbonReport> filteredReports = reports.stream()
                    .filter(r -> statusFilter == null || r.status().equals(statusFilter))
                    .sorted((r1, r2) -> r2.submittedAt().compareTo(r1.submittedAt()))
                    .toList();

                // Paginate
                int totalReports = filteredReports.size();
                int totalPages = (int) Math.ceil((double) totalReports / size);
                int fromIndex = page * size;
                int toIndex = Math.min(fromIndex + size, totalReports);

                List<CarbonReport> paginatedReports = filteredReports.subList(
                    Math.min(fromIndex, totalReports),
                    Math.min(toIndex, totalReports)
                );

                Map<String, Object> response = new HashMap<>();
                response.put("reports", paginatedReports);
                response.put("totalReports", totalReports);
                response.put("page", page);
                response.put("size", size);
                response.put("totalPages", totalPages);
                response.put("hasNext", page + 1 < totalPages);
                response.put("hasPrevious", page > 0);
                response.put("timestamp", System.currentTimeMillis());

                return Response.ok(response).build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to retrieve carbon reports");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to retrieve reports", "message", e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== PER-TRANSACTION CARBON FOOTPRINT ====================

    /**
     * GET /api/v12/carbon/transaction/{txId}
     *
     * Returns carbon footprint for a specific transaction.
     * Target: <0.17 grams CO2 per transaction (Aurigraph DLT whitepaper spec)
     */
    @GET
    @Path("/transaction/{txId}")
    @Operation(
        summary = "Get transaction carbon footprint",
        description = "Returns carbon footprint metrics for a specific transaction"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Carbon footprint retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = TransactionCarbonFootprint.class)
            )
        ),
        @APIResponse(responseCode = "404", description = "Transaction not found"),
        @APIResponse(responseCode = "500", description = "Internal server error")
    })
    public Uni<Response> getTransactionCarbonFootprint(@PathParam("txId") String txId) {
        return Uni.createFrom().item(() -> {
            try {
                LOG.infof("GET /api/v12/carbon/transaction/%s", txId);

                if (txId == null || txId.trim().isEmpty()) {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Transaction ID is required"))
                        .build();
                }

                // Calculate carbon footprint for transaction
                // Base energy: ~0.0001 kWh per transaction (optimized HyperRAFT++)
                // Grid carbon intensity varies by region (50-800 gCO2/kWh)
                double baseEnergyKWh = 0.0001;
                double carbonIntensity = 200.0; // gCO2/kWh (average)
                double carbonFootprintGrams = baseEnergyKWh * carbonIntensity;

                // Adjust for transaction complexity
                double complexityFactor = calculateComplexityFactor(txId);
                carbonFootprintGrams *= complexityFactor;

                TransactionCarbonFootprint footprint = new TransactionCarbonFootprint(
                    txId,
                    Math.round(carbonFootprintGrams * 1000.0) / 1000.0, // gCO2 (3 decimal places)
                    baseEnergyKWh * complexityFactor,
                    carbonIntensity,
                    "HyperRAFT++ Consensus",
                    complexityFactor > 1.5 ? "HIGH" : (complexityFactor > 1.0 ? "MEDIUM" : "LOW"),
                    carbonFootprintGrams < 0.17 ? "ULTRA_GREEN" : (carbonFootprintGrams < 1.0 ? "GREEN" : "STANDARD"),
                    carbonFootprintGrams < 0.17,
                    Map.of(
                        "bitcoin_equivalent", carbonFootprintGrams / 700000.0, // Bitcoin ~700kg per tx
                        "ethereum_equivalent", carbonFootprintGrams / 35000.0, // Ethereum ~35g per tx
                        "visa_equivalent", carbonFootprintGrams / 0.4 // Visa ~0.4g per tx
                    ),
                    System.currentTimeMillis()
                );

                return Response.ok(footprint).build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to retrieve transaction carbon footprint");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to retrieve carbon footprint", "message", e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * GET /api/v12/carbon/channel/{channelId}
     *
     * Returns carbon footprint metrics for a specific channel.
     */
    @GET
    @Path("/channel/{channelId}")
    @Operation(
        summary = "Get channel carbon footprint",
        description = "Returns carbon footprint metrics for all transactions in a channel"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Channel carbon footprint retrieved successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ChannelCarbonFootprint.class)
            )
        ),
        @APIResponse(responseCode = "404", description = "Channel not found"),
        @APIResponse(responseCode = "500", description = "Internal server error")
    })
    public Uni<Response> getChannelCarbonFootprint(
            @PathParam("channelId") String channelId,
            @QueryParam("startTime") Long startTime,
            @QueryParam("endTime") Long endTime) {
        return Uni.createFrom().item(() -> {
            try {
                LOG.infof("GET /api/v12/carbon/channel/%s", channelId);

                if (channelId == null || channelId.trim().isEmpty()) {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Channel ID is required"))
                        .build();
                }

                // Calculate channel carbon metrics (mock data for demo)
                long transactionCount = 10000 + (long)(Math.random() * 50000);
                double avgCarbonPerTx = 0.015 + (Math.random() * 0.015); // 0.015-0.03 gCO2
                double totalCarbonGrams = transactionCount * avgCarbonPerTx;
                double totalEnergyKWh = (transactionCount * 0.0001);

                // Carbon offset calculation
                double offsetCreditsApplied = Math.random() * totalCarbonGrams * 0.5;
                double netCarbon = totalCarbonGrams - offsetCreditsApplied;

                ChannelCarbonFootprint footprint = new ChannelCarbonFootprint(
                    channelId,
                    transactionCount,
                    Math.round(totalCarbonGrams * 100.0) / 100.0, // gCO2
                    Math.round(avgCarbonPerTx * 1000.0) / 1000.0, // gCO2 per tx
                    Math.round(totalEnergyKWh * 10000.0) / 10000.0, // kWh
                    Math.round(offsetCreditsApplied * 100.0) / 100.0,
                    Math.round(netCarbon * 100.0) / 100.0,
                    netCarbon <= 0 ? "CARBON_NEUTRAL" : (avgCarbonPerTx < 0.17 ? "ULTRA_GREEN" : "GREEN"),
                    startTime != null ? startTime : System.currentTimeMillis() - (24 * 60 * 60 * 1000),
                    endTime != null ? endTime : System.currentTimeMillis(),
                    List.of(
                        new CarbonBreakdown("Consensus", totalCarbonGrams * 0.35),
                        new CarbonBreakdown("Transaction Processing", totalCarbonGrams * 0.25),
                        new CarbonBreakdown("State Storage", totalCarbonGrams * 0.20),
                        new CarbonBreakdown("Network Communication", totalCarbonGrams * 0.15),
                        new CarbonBreakdown("Cryptographic Operations", totalCarbonGrams * 0.05)
                    ),
                    System.currentTimeMillis()
                );

                return Response.ok(footprint).build();

            } catch (Exception e) {
                LOG.errorf(e, "Failed to retrieve channel carbon footprint");
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", "Failed to retrieve channel carbon footprint", "message", e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Calculate transaction complexity factor based on tx ID
     */
    private double calculateComplexityFactor(String txId) {
        // Simple hash-based complexity (in production, analyze actual transaction)
        int hashCode = Math.abs(txId.hashCode());
        double baseFactor = 1.0;

        if (txId.contains("smart") || txId.contains("contract")) {
            baseFactor = 1.5; // Smart contract execution
        } else if (txId.contains("batch") || txId.contains("multi")) {
            baseFactor = 1.3; // Batch transaction
        } else if (txId.contains("transfer")) {
            baseFactor = 0.8; // Simple transfer
        }

        return baseFactor * (0.9 + (hashCode % 100) / 500.0);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Generate carbon emission metrics
     */
    private CarbonEmissions generateEmissionMetrics(String timeRange, String startDate, String endDate) {
        // Mock emission data (in production, calculate from actual blockchain operations)
        Map<String, Double> emissionsByOperation = new HashMap<>();
        emissionsByOperation.put("consensusValidation", 12345.67);
        emissionsByOperation.put("transactionProcessing", 8901.23);
        emissionsByOperation.put("stateStorage", 6543.21);
        emissionsByOperation.put("networkCommunication", 5432.10);
        emissionsByOperation.put("cryptographicOperations", 4567.89);
        emissionsByOperation.put("smartContractExecution", 3456.78);
        emissionsByOperation.put("dataReplication", 2345.67);
        emissionsByOperation.put("monitoring", 1234.56);
        emissionsByOperation.put("other", 1852.79);

        double totalEmissions = emissionsByOperation.values().stream()
            .mapToDouble(Double::doubleValue)
            .sum();

        // Time-series data
        List<EmissionPeriod> emissionsByPeriod = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            emissionsByPeriod.add(new EmissionPeriod(
                "2024-" + String.format("%02d", i + 1),
                3500.0 + (i * 250.5),
                300.0 + (i * 25.5),
                3200.0 + (i * 225.0)
            ));
        }

        // Offset credits
        double offsetCredits = reports.stream()
            .filter(r -> "VERIFIED".equals(r.status()))
            .mapToDouble(CarbonReport::offsetAmount)
            .sum();

        // Reduction targets
        Map<String, Object> reductionTargets = new HashMap<>();
        reductionTargets.put("targetYear", 2025);
        reductionTargets.put("baselineEmissions", 50000.0);
        reductionTargets.put("targetEmissions", 25000.0);
        reductionTargets.put("reductionPercentage", 50.0);
        reductionTargets.put("currentProgress", ((50000.0 - totalEmissions) / 50000.0) * 100);

        return new CarbonEmissions(
            totalEmissions,
            emissionsByOperation,
            emissionsByPeriod,
            offsetCredits,
            totalEmissions - offsetCredits,
            reductionTargets,
            timeRange,
            System.currentTimeMillis()
        );
    }

    // ==================== DATA MODELS ====================

    /**
     * Carbon emissions response
     */
    public record CarbonEmissions(
        double totalEmissions,
        Map<String, Double> emissionsByOperation,
        List<EmissionPeriod> emissionsByPeriod,
        double offsetCredits,
        double netEmissions,
        Map<String, Object> reductionTargets,
        String timeRange,
        long timestamp
    ) {}

    /**
     * Emission period data
     */
    public record EmissionPeriod(
        String period,
        double emissions,
        double offsets,
        double netEmissions
    ) {}

    /**
     * Carbon report request
     */
    public record CarbonReportRequest(
        String reportType,
        double offsetAmount,
        String offsetProvider,
        String verificationCertificate,
        double cost,
        String description,
        String submittedBy
    ) {}

    /**
     * Carbon report response
     */
    public record CarbonReportResponse(
        long reportId,
        String status,
        Instant submittedAt,
        boolean verificationRequired,
        String message,
        long timestamp
    ) {}

    /**
     * Carbon report entity
     */
    public record CarbonReport(
        long reportId,
        String reportType,
        double offsetAmount,
        String offsetProvider,
        String verificationCertificate,
        double cost,
        String description,
        String submittedBy,
        String status,
        Instant submittedAt,
        Instant verifiedAt
    ) {}

    /**
     * Per-transaction carbon footprint response
     * Target: <0.17 grams CO2 per transaction (Aurigraph DLT whitepaper spec)
     */
    public record TransactionCarbonFootprint(
        String transactionId,
        double carbonFootprintGrams,    // CO2 in grams
        double energyConsumedKWh,       // Energy in kWh
        double carbonIntensity,         // gCO2/kWh grid intensity
        String consensusProtocol,       // HyperRAFT++
        String complexityLevel,         // LOW, MEDIUM, HIGH
        String sustainabilityRating,    // ULTRA_GREEN (<0.17g), GREEN (<1g), STANDARD
        boolean meetsWhitepaperTarget,  // <0.17g CO2 target
        Map<String, Double> comparison, // vs Bitcoin, Ethereum, Visa
        long timestamp
    ) {}

    /**
     * Per-channel carbon footprint response
     */
    public record ChannelCarbonFootprint(
        String channelId,
        long transactionCount,
        double totalCarbonGrams,        // Total CO2 in grams
        double avgCarbonPerTxGrams,     // Average per transaction
        double totalEnergyKWh,          // Total energy consumed
        double offsetCreditsApplied,    // Offset credits used
        double netCarbonGrams,          // Net after offsets
        String sustainabilityStatus,    // CARBON_NEUTRAL, ULTRA_GREEN, GREEN
        long startTime,
        long endTime,
        List<CarbonBreakdown> breakdown, // By operation type
        long timestamp
    ) {}

    /**
     * Carbon breakdown by operation type
     */
    public record CarbonBreakdown(
        String operationType,           // Consensus, Transaction Processing, etc.
        double carbonGrams              // CO2 in grams
    ) {}
}

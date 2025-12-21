package io.aurigraph.v11.rest;

import io.aurigraph.v11.contracts.TriggerExecutionService;
import io.aurigraph.v11.contracts.TriggerExecutionService.ConditionEvaluationResult;
import io.aurigraph.v11.contracts.models.ContractProgramming.ExecutionRecord;
import io.aurigraph.v11.contracts.models.ContractProgramming.ProgrammableTrigger;
import io.aurigraph.v11.contracts.models.ContractProgramming.TriggerType;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.*;

/**
 * TriggerExecutionResource - REST API for ActiveContract Trigger Management
 *
 * Provides comprehensive REST endpoints for:
 * - Trigger registration and lifecycle management
 * - Trigger enable/disable operations
 * - Trigger execution history retrieval
 * - Trigger condition testing
 * - Available trigger types listing
 *
 * @version 12.0.0
 * @since Sprint 7 - Trigger Execution REST API
 * @author J4C Development Agent
 */
@Path("/api/v12/triggers")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Trigger Execution", description = "ActiveContract trigger management and execution APIs")
public class TriggerExecutionResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(TriggerExecutionResource.class);

    @Inject
    TriggerExecutionService triggerExecutionService;

    // ==================== Trigger Registration ====================

    /**
     * Register a new trigger for a contract
     *
     * POST /api/v12/triggers/contract/{contractId}/register
     *
     * @param contractId Contract ID to register trigger for
     * @param trigger Trigger configuration
     * @return Registered trigger with generated ID
     */
    @POST
    @Path("/contract/{contractId}/register")
    @Operation(
        summary = "Register new trigger",
        description = "Registers a new programmable trigger for a specific contract. " +
                      "Supports time-based, event-based, oracle-based, and other trigger types."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Trigger registered successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = ProgrammableTrigger.class)
            )
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid trigger configuration"
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found"
        ),
        @APIResponse(
            responseCode = "500",
            description = "Internal server error"
        )
    })
    public Uni<Response> registerTrigger(
            @Parameter(description = "Contract ID", required = true, example = "CONTRACT-001")
            @PathParam("contractId") String contractId,
            @RequestBody(
                description = "Trigger configuration to register",
                required = true,
                content = @Content(schema = @Schema(implementation = ProgrammableTrigger.class))
            )
            ProgrammableTrigger trigger
    ) {
        LOGGER.info("REST: Register trigger for contract: {}", contractId);

        if (trigger == null) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Trigger configuration is required"))
                    .build()
            );
        }

        return triggerExecutionService.registerTrigger(contractId, trigger)
            .map(registered -> {
                LOGGER.info("Trigger registered: {} for contract: {}", registered.getTriggerId(), contractId);
                return Response.ok(registered).build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to register trigger for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("Failed to register trigger: " + error.getMessage()))
                    .build();
            });
    }

    // ==================== Get Triggers ====================

    /**
     * Get all triggers for a contract
     *
     * GET /api/v12/triggers/contract/{contractId}
     *
     * @param contractId Contract ID
     * @return List of triggers
     */
    @GET
    @Path("/contract/{contractId}")
    @Operation(
        summary = "Get triggers for contract",
        description = "Retrieves all registered triggers for a specific contract"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Triggers retrieved successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(type = SchemaType.ARRAY, implementation = ProgrammableTrigger.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "Contract not found"
        )
    })
    public Uni<Response> getTriggersForContract(
            @Parameter(description = "Contract ID", required = true, example = "CONTRACT-001")
            @PathParam("contractId") String contractId
    ) {
        LOGGER.info("REST: Get triggers for contract: {}", contractId);

        return triggerExecutionService.listTriggers(contractId)
            .map(triggers -> {
                Map<String, Object> response = new LinkedHashMap<>();
                response.put("contractId", contractId);
                response.put("triggers", triggers);
                response.put("count", triggers.size());
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get triggers for contract {}: {}", contractId, error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse("Failed to get triggers: " + error.getMessage()))
                    .build();
            });
    }

    // ==================== Delete Trigger ====================

    /**
     * Delete a trigger
     *
     * DELETE /api/v12/triggers/{triggerId}
     *
     * @param triggerId Trigger ID
     * @param contractId Contract ID (query param for context)
     * @return Success or failure status
     */
    @DELETE
    @Path("/{triggerId}")
    @Operation(
        summary = "Delete trigger",
        description = "Removes a trigger from a contract. Requires contractId as query parameter."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Trigger deleted successfully"
        ),
        @APIResponse(
            responseCode = "404",
            description = "Trigger not found"
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid request - contractId required"
        )
    })
    public Uni<Response> deleteTrigger(
            @Parameter(description = "Trigger ID", required = true, example = "TRIG-ABC123")
            @PathParam("triggerId") String triggerId,
            @Parameter(description = "Contract ID", required = true, example = "CONTRACT-001")
            @QueryParam("contractId") String contractId
    ) {
        LOGGER.info("REST: Delete trigger: {} for contract: {}", triggerId, contractId);

        if (contractId == null || contractId.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("contractId query parameter is required"))
                    .build()
            );
        }

        return triggerExecutionService.removeTrigger(contractId, triggerId)
            .map(removed -> {
                if (removed) {
                    LOGGER.info("Trigger deleted: {} from contract: {}", triggerId, contractId);
                    Map<String, Object> response = new LinkedHashMap<>();
                    response.put("triggerId", triggerId);
                    response.put("contractId", contractId);
                    response.put("deleted", true);
                    response.put("timestamp", Instant.now().toString());
                    return Response.ok(response).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Trigger not found: " + triggerId))
                        .build();
                }
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to delete trigger {}: {}", triggerId, error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to delete trigger: " + error.getMessage()))
                    .build();
            });
    }

    // ==================== Enable Trigger ====================

    /**
     * Enable a trigger
     *
     * POST /api/v12/triggers/{triggerId}/enable
     *
     * @param triggerId Trigger ID
     * @param contractId Contract ID (query param)
     * @return Updated trigger
     */
    @POST
    @Path("/{triggerId}/enable")
    @Operation(
        summary = "Enable trigger",
        description = "Enables a previously disabled trigger, allowing it to execute when conditions are met"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Trigger enabled successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = ProgrammableTrigger.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "Trigger not found"
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid request"
        )
    })
    public Uni<Response> enableTrigger(
            @Parameter(description = "Trigger ID", required = true, example = "TRIG-ABC123")
            @PathParam("triggerId") String triggerId,
            @Parameter(description = "Contract ID", required = true, example = "CONTRACT-001")
            @QueryParam("contractId") String contractId
    ) {
        LOGGER.info("REST: Enable trigger: {} for contract: {}", triggerId, contractId);

        if (contractId == null || contractId.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("contractId query parameter is required"))
                    .build()
            );
        }

        return triggerExecutionService.getTrigger(contractId, triggerId)
            .map(trigger -> {
                trigger.setEnabled(true);
                LOGGER.info("Trigger enabled: {} for contract: {}", triggerId, contractId);

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("triggerId", triggerId);
                response.put("contractId", contractId);
                response.put("enabled", true);
                response.put("trigger", trigger);
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to enable trigger {}: {}", triggerId, error.getMessage());
                if (error.getMessage() != null && error.getMessage().contains("not found")) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Trigger not found: " + triggerId))
                        .build();
                }
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to enable trigger: " + error.getMessage()))
                    .build();
            });
    }

    // ==================== Disable Trigger ====================

    /**
     * Disable a trigger
     *
     * POST /api/v12/triggers/{triggerId}/disable
     *
     * @param triggerId Trigger ID
     * @param contractId Contract ID (query param)
     * @return Updated trigger
     */
    @POST
    @Path("/{triggerId}/disable")
    @Operation(
        summary = "Disable trigger",
        description = "Disables a trigger, preventing it from executing until re-enabled"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Trigger disabled successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = ProgrammableTrigger.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "Trigger not found"
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid request"
        )
    })
    public Uni<Response> disableTrigger(
            @Parameter(description = "Trigger ID", required = true, example = "TRIG-ABC123")
            @PathParam("triggerId") String triggerId,
            @Parameter(description = "Contract ID", required = true, example = "CONTRACT-001")
            @QueryParam("contractId") String contractId
    ) {
        LOGGER.info("REST: Disable trigger: {} for contract: {}", triggerId, contractId);

        if (contractId == null || contractId.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("contractId query parameter is required"))
                    .build()
            );
        }

        return triggerExecutionService.getTrigger(contractId, triggerId)
            .map(trigger -> {
                trigger.setEnabled(false);
                LOGGER.info("Trigger disabled: {} for contract: {}", triggerId, contractId);

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("triggerId", triggerId);
                response.put("contractId", contractId);
                response.put("enabled", false);
                response.put("trigger", trigger);
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to disable trigger {}: {}", triggerId, error.getMessage());
                if (error.getMessage() != null && error.getMessage().contains("not found")) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Trigger not found: " + triggerId))
                        .build();
                }
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to disable trigger: " + error.getMessage()))
                    .build();
            });
    }

    // ==================== Get Execution History ====================

    /**
     * Get trigger execution history
     *
     * GET /api/v12/triggers/{triggerId}/executions
     *
     * @param triggerId Trigger ID
     * @param contractId Contract ID (query param)
     * @param limit Maximum number of records to return
     * @return List of execution records
     */
    @GET
    @Path("/{triggerId}/executions")
    @Operation(
        summary = "Get trigger execution history",
        description = "Retrieves the execution history for a specific trigger, including success/failure status and outputs"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Execution history retrieved successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(type = SchemaType.ARRAY, implementation = ExecutionRecord.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "Trigger not found"
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid request"
        )
    })
    public Uni<Response> getTriggerExecutionHistory(
            @Parameter(description = "Trigger ID", required = true, example = "TRIG-ABC123")
            @PathParam("triggerId") String triggerId,
            @Parameter(description = "Contract ID", required = true, example = "CONTRACT-001")
            @QueryParam("contractId") String contractId,
            @Parameter(description = "Maximum number of records", example = "50")
            @QueryParam("limit") @DefaultValue("50") int limit
    ) {
        LOGGER.info("REST: Get execution history for trigger: {} contract: {}", triggerId, contractId);

        if (contractId == null || contractId.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("contractId query parameter is required"))
                    .build()
            );
        }

        // Validate limit
        if (limit < 1 || limit > 1000) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("limit must be between 1 and 1000"))
                    .build()
            );
        }

        return triggerExecutionService.getTriggerExecutionHistory(contractId, triggerId)
            .map(history -> {
                // Apply limit
                List<ExecutionRecord> limitedHistory = history.size() > limit
                    ? history.subList(0, limit)
                    : history;

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("triggerId", triggerId);
                response.put("contractId", contractId);
                response.put("executions", limitedHistory);
                response.put("count", limitedHistory.size());
                response.put("totalCount", history.size());
                response.put("timestamp", Instant.now().toString());
                return Response.ok(response).build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get execution history for trigger {}: {}", triggerId, error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to get execution history: " + error.getMessage()))
                    .build();
            });
    }

    // ==================== Test Trigger Conditions ====================

    /**
     * Test trigger conditions without executing
     *
     * POST /api/v12/triggers/{triggerId}/test
     *
     * @param triggerId Trigger ID
     * @param contractId Contract ID (query param)
     * @param testContext Optional test context/parameters
     * @return Condition evaluation result
     */
    @POST
    @Path("/{triggerId}/test")
    @Operation(
        summary = "Test trigger conditions",
        description = "Evaluates the trigger conditions without actually executing the trigger actions. " +
                      "Useful for debugging and validation."
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Conditions tested successfully",
            content = @Content(
                mediaType = MediaType.APPLICATION_JSON,
                schema = @Schema(implementation = ConditionEvaluationResult.class)
            )
        ),
        @APIResponse(
            responseCode = "404",
            description = "Trigger not found"
        ),
        @APIResponse(
            responseCode = "400",
            description = "Invalid request"
        )
    })
    public Uni<Response> testTriggerConditions(
            @Parameter(description = "Trigger ID", required = true, example = "TRIG-ABC123")
            @PathParam("triggerId") String triggerId,
            @Parameter(description = "Contract ID", required = true, example = "CONTRACT-001")
            @QueryParam("contractId") String contractId,
            @RequestBody(
                description = "Optional test context parameters",
                content = @Content(schema = @Schema(implementation = Map.class))
            )
            Map<String, Object> testContext
    ) {
        LOGGER.info("REST: Test conditions for trigger: {} contract: {}", triggerId, contractId);

        if (contractId == null || contractId.isEmpty()) {
            return Uni.createFrom().item(
                Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse("contractId query parameter is required"))
                    .build()
            );
        }

        return triggerExecutionService.evaluateConditions(contractId, triggerId)
            .map(result -> {
                LOGGER.info("Condition test result for trigger {}: {}", triggerId, result.isOverallResult());

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("triggerId", triggerId);
                response.put("contractId", contractId);
                response.put("testResult", result);
                response.put("conditionsMet", result.isOverallResult());
                response.put("reason", result.getReason());
                response.put("testedAt", Instant.now().toString());

                if (testContext != null && !testContext.isEmpty()) {
                    response.put("testContext", testContext);
                }

                return Response.ok(response).build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to test conditions for trigger {}: {}", triggerId, error.getMessage());
                if (error.getMessage() != null && error.getMessage().contains("not found")) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse("Trigger not found: " + triggerId))
                        .build();
                }
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse("Failed to test conditions: " + error.getMessage()))
                    .build();
            });
    }

    // ==================== Get Available Trigger Types ====================

    /**
     * Get available trigger types
     *
     * GET /api/v12/triggers/types
     *
     * @return List of available trigger types with descriptions
     */
    @GET
    @Path("/types")
    @Operation(
        summary = "Get available trigger types",
        description = "Returns all available trigger types supported by the platform with descriptions"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Trigger types retrieved successfully"
        )
    })
    public Response getAvailableTriggerTypes() {
        LOGGER.info("REST: Get available trigger types");

        List<Map<String, Object>> triggerTypes = new ArrayList<>();

        // TIME_BASED
        Map<String, Object> timeBased = new LinkedHashMap<>();
        timeBased.put("type", "TIME_BASED");
        timeBased.put("name", "Time-Based Trigger");
        timeBased.put("description", "Triggers at specific date/time or at regular intervals using cron expressions");
        timeBased.put("requiredFields", List.of("cronExpression or scheduledAt or intervalSeconds"));
        timeBased.put("example", Map.of(
            "name", "Daily Report Trigger",
            "type", "TIME_BASED",
            "cronExpression", "0 0 9 * * ?",
            "description", "Executes every day at 9 AM"
        ));
        triggerTypes.add(timeBased);

        // EVENT_BASED
        Map<String, Object> eventBased = new LinkedHashMap<>();
        eventBased.put("type", "EVENT_BASED");
        eventBased.put("name", "Event-Based Trigger");
        eventBased.put("description", "Triggers when a specific blockchain event occurs");
        eventBased.put("requiredFields", List.of("eventType"));
        eventBased.put("optionalFields", List.of("eventFilters"));
        eventBased.put("example", Map.of(
            "name", "Transfer Event Trigger",
            "type", "EVENT_BASED",
            "eventType", "TOKEN_TRANSFER",
            "eventFilters", Map.of("minAmount", "1000")
        ));
        triggerTypes.add(eventBased);

        // ORACLE_BASED
        Map<String, Object> oracleBased = new LinkedHashMap<>();
        oracleBased.put("type", "ORACLE_BASED");
        oracleBased.put("name", "Oracle-Based Trigger");
        oracleBased.put("description", "Triggers when oracle data meets specified conditions");
        oracleBased.put("requiredFields", List.of("oracleId"));
        oracleBased.put("optionalFields", List.of("oracleCondition", "oracleThreshold"));
        oracleBased.put("example", Map.of(
            "name", "Price Alert Trigger",
            "type", "ORACLE_BASED",
            "oracleId", "CHAINLINK_ETH_USD",
            "oracleCondition", ">",
            "oracleThreshold", 3000
        ));
        triggerTypes.add(oracleBased);

        // SIGNATURE_BASED
        Map<String, Object> signatureBased = new LinkedHashMap<>();
        signatureBased.put("type", "SIGNATURE_BASED");
        signatureBased.put("name", "Signature-Based Trigger");
        signatureBased.put("description", "Triggers when multi-party signatures are collected");
        signatureBased.put("requiredFields", List.of("requiredSignatures"));
        signatureBased.put("example", Map.of(
            "name", "Multi-Sig Approval Trigger",
            "type", "SIGNATURE_BASED",
            "requiredSignatures", 3
        ));
        triggerTypes.add(signatureBased);

        // RWA_BASED
        Map<String, Object> rwaBased = new LinkedHashMap<>();
        rwaBased.put("type", "RWA_BASED");
        rwaBased.put("name", "RWA-Based Trigger");
        rwaBased.put("description", "Triggers based on real-world asset events");
        rwaBased.put("requiredFields", List.of("assetType", "eventType"));
        rwaBased.put("example", Map.of(
            "name", "Asset Valuation Trigger",
            "type", "RWA_BASED",
            "assetType", "REAL_ESTATE",
            "eventType", "VALUATION_UPDATE"
        ));
        triggerTypes.add(rwaBased);

        // THRESHOLD_BASED
        Map<String, Object> thresholdBased = new LinkedHashMap<>();
        thresholdBased.put("type", "THRESHOLD_BASED");
        thresholdBased.put("name", "Threshold-Based Trigger");
        thresholdBased.put("description", "Triggers when a value crosses a specified threshold");
        thresholdBased.put("requiredFields", List.of("thresholdValue", "thresholdOperator", "thresholdField"));
        thresholdBased.put("example", Map.of(
            "name", "Balance Threshold Trigger",
            "type", "THRESHOLD_BASED",
            "thresholdField", "balance",
            "thresholdOperator", ">",
            "thresholdValue", 10000
        ));
        triggerTypes.add(thresholdBased);

        // MANUAL
        Map<String, Object> manual = new LinkedHashMap<>();
        manual.put("type", "MANUAL");
        manual.put("name", "Manual Trigger");
        manual.put("description", "Requires explicit user action to activate");
        manual.put("requiredFields", List.of());
        manual.put("example", Map.of(
            "name", "Manual Release Trigger",
            "type", "MANUAL",
            "description", "Manually triggered fund release"
        ));
        triggerTypes.add(manual);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("triggerTypes", triggerTypes);
        response.put("count", triggerTypes.size());
        response.put("version", "12.0.0");
        response.put("timestamp", Instant.now().toString());

        return Response.ok(response).build();
    }

    // ==================== Health Check ====================

    /**
     * Health check for trigger execution service
     *
     * GET /api/v12/triggers/health
     *
     * @return Health status
     */
    @GET
    @Path("/health")
    @Operation(
        summary = "Trigger service health",
        description = "Check if the trigger execution service is operational"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Service is healthy"
        )
    })
    public Response healthCheck() {
        LOGGER.debug("REST: Trigger service health check");

        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        health.put("service", "TriggerExecutionService");
        health.put("version", "12.0.0");
        health.put("timestamp", Instant.now().toString());

        // Add metrics if available
        try {
            Map<String, Long> metrics = triggerExecutionService.getMetrics();
            health.put("metrics", metrics);
        } catch (Exception e) {
            LOGGER.warn("Failed to get trigger metrics: {}", e.getMessage());
            health.put("metrics", Map.of("warning", "Metrics temporarily unavailable"));
        }

        return Response.ok(health).build();
    }

    // ==================== Metrics ====================

    /**
     * Get trigger execution metrics
     *
     * GET /api/v12/triggers/metrics
     *
     * @return Trigger execution metrics
     */
    @GET
    @Path("/metrics")
    @Operation(
        summary = "Get trigger metrics",
        description = "Returns trigger execution metrics including success/failure counts"
    )
    @APIResponses({
        @APIResponse(
            responseCode = "200",
            description = "Metrics retrieved successfully"
        )
    })
    public Response getTriggerMetrics() {
        LOGGER.info("REST: Get trigger metrics");

        Map<String, Object> response = new LinkedHashMap<>();

        try {
            Map<String, Long> metrics = triggerExecutionService.getMetrics();
            response.put("metrics", metrics);
            response.put("status", "success");
        } catch (Exception e) {
            LOGGER.warn("Failed to get trigger metrics: {}", e.getMessage());
            response.put("metrics", Map.of(
                "triggersRegistered", 0L,
                "triggersExecuted", 0L,
                "triggersSucceeded", 0L,
                "triggersFailed", 0L
            ));
            response.put("status", "partial");
            response.put("warning", "Some metrics may be unavailable");
        }

        response.put("timestamp", Instant.now().toString());
        return Response.ok(response).build();
    }

    // ==================== Helper Classes ====================

    /**
     * Error response DTO
     */
    @Schema(description = "Error response")
    public static class ErrorResponse {
        @Schema(description = "Error message")
        private String error;

        @Schema(description = "Error timestamp")
        private String timestamp;

        public ErrorResponse() {
            this.timestamp = Instant.now().toString();
        }

        public ErrorResponse(String error) {
            this.error = error;
            this.timestamp = Instant.now().toString();
        }

        public String getError() {
            return error;
        }

        public void setError(String error) {
            this.error = error;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }
}

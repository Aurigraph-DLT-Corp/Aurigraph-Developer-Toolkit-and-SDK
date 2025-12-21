package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.ContractProgramming;
import io.aurigraph.v11.contracts.models.ContractProgramming.ProgrammableTrigger;
import io.aurigraph.v11.contracts.models.ContractProgramming.ExecutionRecord;
import io.aurigraph.v11.contracts.TriggerExecutionService.ConditionEvaluationResult;
import io.aurigraph.v11.contracts.TriggerSchedulerService.ScheduledTriggerInfo;
import io.aurigraph.v11.contracts.TriggerSchedulerService.SchedulerStatus;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * TriggerExecutionResource - REST API for ActiveContract Trigger Management
 *
 * Provides comprehensive REST endpoints for:
 * - Trigger CRUD operations
 * - Trigger execution (manual and test)
 * - Trigger scheduling management
 * - Execution history and audit trail
 * - Condition evaluation
 * - Event and oracle handling
 *
 * Base path: /api/v12/contracts/{contractId}/triggers
 *
 * @version 12.0.0
 * @since Sprint 7 - Trigger Execution Engine
 * @author J4C Development Agent
 */
@Path("/api/v12/contracts/{contractId}/triggers")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TriggerExecutionResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(TriggerExecutionResource.class);

    @Inject
    TriggerExecutionService triggerExecutionService;

    @Inject
    TriggerSchedulerService triggerSchedulerService;

    // ==================== Trigger CRUD Operations ====================

    /**
     * List all triggers for a contract
     *
     * GET /api/v12/contracts/{contractId}/triggers
     *
     * @param contractId Contract ID
     * @return List of triggers
     */
    @GET
    public Uni<Response> listTriggers(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: List triggers for contract: {}", contractId);

        return triggerExecutionService.listTriggers(contractId)
            .map(triggers -> Response.ok(Map.of(
                "contractId", contractId,
                "triggers", triggers,
                "count", triggers.size(),
                "timestamp", Instant.now().toString()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to list triggers: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Get a specific trigger
     *
     * GET /api/v12/contracts/{contractId}/triggers/{triggerId}
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Trigger details
     */
    @GET
    @Path("/{triggerId}")
    public Uni<Response> getTrigger(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId) {
        LOGGER.info("REST: Get trigger {} for contract: {}", triggerId, contractId);

        return triggerExecutionService.getTrigger(contractId, triggerId)
            .map(trigger -> Response.ok(trigger).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get trigger: {}", error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Add a new trigger to a contract
     *
     * POST /api/v12/contracts/{contractId}/triggers
     *
     * @param contractId Contract ID
     * @param trigger Trigger configuration
     * @return Created trigger
     */
    @POST
    public Uni<Response> addTrigger(
            @PathParam("contractId") String contractId,
            ProgrammableTrigger trigger) {
        LOGGER.info("REST: Add trigger '{}' to contract: {}", trigger.getName(), contractId);

        return triggerExecutionService.registerTrigger(contractId, trigger)
            .map(registered -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "message", "Trigger registered successfully",
                    "trigger", registered,
                    "contractId", contractId
                ))
                .build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to add trigger: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Update an existing trigger
     *
     * PUT /api/v12/contracts/{contractId}/triggers/{triggerId}
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @param trigger Updated trigger configuration
     * @return Updated trigger
     */
    @PUT
    @Path("/{triggerId}")
    public Uni<Response> updateTrigger(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId,
            ProgrammableTrigger trigger) {
        LOGGER.info("REST: Update trigger {} for contract: {}", triggerId, contractId);

        return triggerExecutionService.updateTrigger(contractId, triggerId, trigger)
            .map(updated -> Response.ok(Map.of(
                "message", "Trigger updated successfully",
                "trigger", updated
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to update trigger: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Remove a trigger
     *
     * DELETE /api/v12/contracts/{contractId}/triggers/{triggerId}
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Success status
     */
    @DELETE
    @Path("/{triggerId}")
    public Uni<Response> removeTrigger(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId) {
        LOGGER.info("REST: Remove trigger {} from contract: {}", triggerId, contractId);

        return triggerExecutionService.removeTrigger(contractId, triggerId)
            .map(removed -> {
                if (removed) {
                    return Response.ok(Map.of(
                        "message", "Trigger removed successfully",
                        "triggerId", triggerId,
                        "contractId", contractId
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(errorResponse("Trigger not found"))
                        .build();
                }
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to remove trigger: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    // ==================== Trigger Execution ====================

    /**
     * Test trigger execution (dry run without side effects)
     *
     * POST /api/v12/contracts/{contractId}/triggers/{triggerId}/test
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @param context Optional execution context
     * @return Test execution result
     */
    @POST
    @Path("/{triggerId}/test")
    public Uni<Response> testTrigger(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId,
            Map<String, Object> context) {
        LOGGER.info("REST: Test trigger {} for contract: {}", triggerId, contractId);

        // First evaluate conditions
        return triggerExecutionService.evaluateConditions(contractId, triggerId)
            .map(evalResult -> {
                Map<String, Object> testResult = new HashMap<>();
                testResult.put("triggerId", triggerId);
                testResult.put("contractId", contractId);
                testResult.put("testMode", true);
                testResult.put("conditionEvaluation", evalResult);
                testResult.put("wouldExecute", evalResult.isOverallResult());
                testResult.put("timestamp", Instant.now().toString());

                if (evalResult.isOverallResult()) {
                    testResult.put("message", "Trigger conditions met - would execute");
                } else {
                    testResult.put("message", "Trigger conditions not met - " + evalResult.getReason());
                }

                return Response.ok(testResult).build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to test trigger: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Execute a trigger manually
     *
     * POST /api/v12/contracts/{contractId}/triggers/{triggerId}/execute
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @param request Execution request with optional context and force flag
     * @return Execution result
     */
    @POST
    @Path("/{triggerId}/execute")
    public Uni<Response> executeTrigger(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId,
            TriggerExecutionRequest request) {
        LOGGER.info("REST: Execute trigger {} for contract: {}", triggerId, contractId);

        boolean forceExecution = request != null && request.isForce();
        Map<String, Object> context = request != null && request.getContext() != null
            ? request.getContext() : new HashMap<>();

        return triggerExecutionService.executeTrigger(contractId, triggerId, forceExecution, context)
            .map(record -> Response.ok(Map.of(
                "message", "Trigger executed",
                "execution", record,
                "status", record.getStatus().toString()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to execute trigger: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Evaluate conditions for a trigger
     *
     * POST /api/v12/contracts/{contractId}/triggers/{triggerId}/evaluate
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Condition evaluation result
     */
    @POST
    @Path("/{triggerId}/evaluate")
    public Uni<Response> evaluateConditions(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId) {
        LOGGER.info("REST: Evaluate conditions for trigger {} in contract: {}", triggerId, contractId);

        return triggerExecutionService.evaluateConditions(contractId, triggerId)
            .map(result -> Response.ok(result).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to evaluate conditions: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    // ==================== Execution History ====================

    /**
     * Get execution history for all triggers in a contract
     *
     * GET /api/v12/contracts/{contractId}/triggers/history
     *
     * @param contractId Contract ID
     * @param limit Maximum number of records (optional)
     * @return Execution history
     */
    @GET
    @Path("/history")
    public Uni<Response> getExecutionHistory(
            @PathParam("contractId") String contractId,
            @QueryParam("limit") @DefaultValue("100") int limit) {
        LOGGER.info("REST: Get execution history for contract: {}", contractId);

        return triggerExecutionService.getExecutionHistory(contractId)
            .map(history -> {
                List<ExecutionRecord> limitedHistory = history.size() > limit
                    ? history.subList(0, limit)
                    : history;

                return Response.ok(Map.of(
                    "contractId", contractId,
                    "history", limitedHistory,
                    "total", history.size(),
                    "returned", limitedHistory.size(),
                    "timestamp", Instant.now().toString()
                )).build();
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get execution history: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Get execution history for a specific trigger
     *
     * GET /api/v12/contracts/{contractId}/triggers/{triggerId}/history
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Trigger execution history
     */
    @GET
    @Path("/{triggerId}/history")
    public Uni<Response> getTriggerExecutionHistory(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId) {
        LOGGER.info("REST: Get execution history for trigger {} in contract: {}", triggerId, contractId);

        return triggerExecutionService.getTriggerExecutionHistory(contractId, triggerId)
            .map(history -> Response.ok(Map.of(
                "contractId", contractId,
                "triggerId", triggerId,
                "history", history,
                "count", history.size(),
                "timestamp", Instant.now().toString()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to get trigger history: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    // ==================== Scheduling ====================

    /**
     * Schedule a time-based trigger
     *
     * POST /api/v12/contracts/{contractId}/triggers/{triggerId}/schedule
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @param request Schedule request with cron or interval
     * @return Schedule info
     */
    @POST
    @Path("/{triggerId}/schedule")
    public Uni<Response> scheduleTrigger(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId,
            ScheduleRequest request) {
        LOGGER.info("REST: Schedule trigger {} for contract: {}", triggerId, contractId);

        // First get the trigger
        return triggerExecutionService.getTrigger(contractId, triggerId)
            .flatMap(trigger -> {
                // Update schedule if provided
                if (request != null) {
                    if (request.getCronExpression() != null) {
                        trigger.setCronExpression(request.getCronExpression());
                    }
                    if (request.getIntervalSeconds() > 0) {
                        trigger.setIntervalSeconds(request.getIntervalSeconds());
                    }
                    if (request.getScheduledAt() != null) {
                        trigger.setScheduledAt(request.getScheduledAt());
                    }
                }

                return triggerSchedulerService.scheduleTrigger(contractId, trigger);
            })
            .map(info -> Response.ok(Map.of(
                "message", "Trigger scheduled successfully",
                "schedule", info
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to schedule trigger: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Unschedule a trigger
     *
     * DELETE /api/v12/contracts/{contractId}/triggers/{triggerId}/schedule
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Success status
     */
    @DELETE
    @Path("/{triggerId}/schedule")
    public Uni<Response> unscheduleTrigger(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId) {
        LOGGER.info("REST: Unschedule trigger {} for contract: {}", triggerId, contractId);

        return triggerSchedulerService.unscheduleTrigger(contractId, triggerId)
            .map(removed -> {
                if (removed) {
                    return Response.ok(Map.of(
                        "message", "Trigger unscheduled successfully",
                        "triggerId", triggerId
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(errorResponse("Trigger schedule not found"))
                        .build();
                }
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to unschedule trigger: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Get schedule info for a trigger
     *
     * GET /api/v12/contracts/{contractId}/triggers/{triggerId}/schedule
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Schedule info
     */
    @GET
    @Path("/{triggerId}/schedule")
    public Response getScheduleInfo(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId) {
        LOGGER.info("REST: Get schedule info for trigger {} in contract: {}", triggerId, contractId);

        ScheduledTriggerInfo info = triggerSchedulerService.getScheduledTriggerInfo(contractId, triggerId);
        if (info == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(errorResponse("Trigger is not scheduled"))
                .build();
        }
        return Response.ok(info).build();
    }

    /**
     * List all scheduled triggers for a contract
     *
     * GET /api/v12/contracts/{contractId}/triggers/scheduled
     *
     * @param contractId Contract ID
     * @return List of scheduled triggers
     */
    @GET
    @Path("/scheduled")
    public Uni<Response> listScheduledTriggers(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: List scheduled triggers for contract: {}", contractId);

        return triggerSchedulerService.listScheduledTriggers(contractId)
            .map(scheduled -> Response.ok(Map.of(
                "contractId", contractId,
                "scheduledTriggers", scheduled,
                "count", scheduled.size(),
                "timestamp", Instant.now().toString()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to list scheduled triggers: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Pause a scheduled trigger
     *
     * POST /api/v12/contracts/{contractId}/triggers/{triggerId}/pause
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Updated schedule info
     */
    @POST
    @Path("/{triggerId}/pause")
    public Uni<Response> pauseTrigger(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId) {
        LOGGER.info("REST: Pause trigger {} for contract: {}", triggerId, contractId);

        return triggerSchedulerService.pauseTrigger(contractId, triggerId)
            .map(info -> {
                if (info != null) {
                    return Response.ok(Map.of(
                        "message", "Trigger paused",
                        "schedule", info
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(errorResponse("Trigger schedule not found"))
                        .build();
                }
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to pause trigger: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Resume a paused trigger
     *
     * POST /api/v12/contracts/{contractId}/triggers/{triggerId}/resume
     *
     * @param contractId Contract ID
     * @param triggerId Trigger ID
     * @return Updated schedule info
     */
    @POST
    @Path("/{triggerId}/resume")
    public Uni<Response> resumeTrigger(
            @PathParam("contractId") String contractId,
            @PathParam("triggerId") String triggerId) {
        LOGGER.info("REST: Resume trigger {} for contract: {}", triggerId, contractId);

        return triggerSchedulerService.resumeTrigger(contractId, triggerId)
            .map(info -> {
                if (info != null) {
                    return Response.ok(Map.of(
                        "message", "Trigger resumed",
                        "schedule", info
                    )).build();
                } else {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(errorResponse("Trigger schedule not found"))
                        .build();
                }
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to resume trigger: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    // ==================== Events and Oracle ====================

    /**
     * Handle a blockchain event
     *
     * POST /api/v12/triggers/events
     *
     * @param request Event data
     * @return Execution results
     */
    @POST
    @Path("/events")
    public Uni<Response> handleEvent(EventRequest request) {
        LOGGER.info("REST: Handle event: {}", request.getEventType());

        return triggerExecutionService.handleEvent(request.getEventType(), request.getEventData())
            .map(records -> Response.ok(Map.of(
                "message", "Event processed",
                "eventType", request.getEventType(),
                "triggersExecuted", records.size(),
                "executions", records,
                "timestamp", Instant.now().toString()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to handle event: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    /**
     * Handle an oracle data update
     *
     * POST /api/v12/triggers/oracle
     *
     * @param request Oracle update data
     * @return Execution results
     */
    @POST
    @Path("/oracle")
    public Uni<Response> handleOracleUpdate(OracleUpdateRequest request) {
        LOGGER.info("REST: Handle oracle update: {}", request.getOracleId());

        return triggerExecutionService.handleOracleUpdate(request.getOracleId(), request.getData())
            .map(records -> Response.ok(Map.of(
                "message", "Oracle update processed",
                "oracleId", request.getOracleId(),
                "triggersExecuted", records.size(),
                "executions", records,
                "timestamp", Instant.now().toString()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Failed to handle oracle update: {}", error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(errorResponse(error.getMessage()))
                    .build();
            });
    }

    // ==================== Metrics and Status ====================

    /**
     * Get trigger execution metrics
     *
     * GET /api/v12/triggers/metrics
     *
     * @return Metrics
     */
    @GET
    @Path("/metrics")
    public Response getMetrics() {
        LOGGER.debug("REST: Get trigger metrics");

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("execution", triggerExecutionService.getMetrics());
        metrics.put("scheduler", triggerSchedulerService.getMetrics());
        metrics.put("timestamp", Instant.now().toString());

        return Response.ok(metrics).build();
    }

    /**
     * Get scheduler status
     *
     * GET /api/v12/triggers/scheduler/status
     *
     * @return Scheduler status
     */
    @GET
    @Path("/scheduler/status")
    public Response getSchedulerStatus() {
        LOGGER.debug("REST: Get scheduler status");

        SchedulerStatus status = triggerSchedulerService.getStatus();
        return Response.ok(status).build();
    }

    /**
     * Pause the scheduler
     *
     * POST /api/v12/triggers/scheduler/pause
     *
     * @return Status
     */
    @POST
    @Path("/scheduler/pause")
    public Response pauseScheduler() {
        LOGGER.info("REST: Pause scheduler");

        triggerSchedulerService.pauseScheduler();
        return Response.ok(Map.of(
            "message", "Scheduler paused",
            "status", triggerSchedulerService.getStatus()
        )).build();
    }

    /**
     * Resume the scheduler
     *
     * POST /api/v12/triggers/scheduler/resume
     *
     * @return Status
     */
    @POST
    @Path("/scheduler/resume")
    public Response resumeScheduler() {
        LOGGER.info("REST: Resume scheduler");

        triggerSchedulerService.resumeScheduler();
        return Response.ok(Map.of(
            "message", "Scheduler resumed",
            "status", triggerSchedulerService.getStatus()
        )).build();
    }

    /**
     * Health check for trigger service
     *
     * GET /api/v12/triggers/health
     *
     * @return Health status
     */
    @GET
    @Path("/health")
    public Response healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "TriggerExecutionEngine");
        health.put("version", "12.0.0");
        health.put("schedulerEnabled", triggerSchedulerService.isSchedulerEnabled());
        health.put("schedulerPaused", triggerSchedulerService.isSchedulerPaused());
        health.put("timestamp", Instant.now().toString());

        return Response.ok(health).build();
    }

    // ==================== Helper Methods ====================

    private Map<String, Object> errorResponse(String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("error", true);
        error.put("message", message);
        error.put("timestamp", Instant.now().toString());
        return error;
    }

    // ==================== Request DTOs ====================

    /**
     * Request for manual trigger execution
     */
    public static class TriggerExecutionRequest {
        private boolean force = false;
        private Map<String, Object> context;

        public boolean isForce() { return force; }
        public void setForce(boolean force) { this.force = force; }
        public Map<String, Object> getContext() { return context; }
        public void setContext(Map<String, Object> context) { this.context = context; }
    }

    /**
     * Request for scheduling a trigger
     */
    public static class ScheduleRequest {
        private String cronExpression;
        private long intervalSeconds;
        private Instant scheduledAt;

        public String getCronExpression() { return cronExpression; }
        public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }
        public long getIntervalSeconds() { return intervalSeconds; }
        public void setIntervalSeconds(long intervalSeconds) { this.intervalSeconds = intervalSeconds; }
        public Instant getScheduledAt() { return scheduledAt; }
        public void setScheduledAt(Instant scheduledAt) { this.scheduledAt = scheduledAt; }
    }

    /**
     * Request for event handling
     */
    public static class EventRequest {
        private String eventType;
        private Map<String, Object> eventData = new HashMap<>();

        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public Map<String, Object> getEventData() { return eventData; }
        public void setEventData(Map<String, Object> eventData) { this.eventData = eventData; }
    }

    /**
     * Request for oracle update handling
     */
    public static class OracleUpdateRequest {
        private String oracleId;
        private Map<String, Object> data = new HashMap<>();

        public String getOracleId() { return oracleId; }
        public void setOracleId(String oracleId) { this.oracleId = oracleId; }
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
    }
}

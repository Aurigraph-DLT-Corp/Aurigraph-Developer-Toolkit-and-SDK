package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.FileInputStream;
import java.util.*;

/**
 * ActiveContract Wizard REST Resource
 *
 * Provides endpoints for the multi-step Ricardian contract wizard.
 *
 * Wizard Flow:
 * 1. POST /wizard/start - Create new wizard session
 * 2. POST /wizard/{sessionId}/upload - Upload document
 * 3. GET/PUT /wizard/{sessionId}/prose - Edit prose section
 * 4. GET/PUT /wizard/{sessionId}/parameters - Configure parameters
 * 5. GET/PUT /wizard/{sessionId}/programming - Define triggers/actions
 * 6. GET /wizard/{sessionId}/preview - Full preview with fee estimate
 * 7. POST /wizard/{sessionId}/finalize - Create contract
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
@Path("/api/v12/contracts/wizard")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ActiveContractWizardResource {

    private static final Logger LOG = Logger.getLogger(ActiveContractWizardResource.class);

    @Inject
    ActiveContractWizardService wizardService;

    @Inject
    ActiveContractFeeService feeService;

    // ==================== Session Management ====================

    /**
     * Start a new wizard session
     * POST /api/v12/contracts/wizard/start
     */
    @POST
    @Path("/start")
    public Response startWizard(@QueryParam("userId") String userId) {
        LOG.info("Starting new wizard session");

        if (userId == null || userId.isBlank()) {
            userId = "anonymous-" + UUID.randomUUID().toString().substring(0, 8);
        }

        ActiveContractWizardService.WizardSession session = wizardService.createSession(userId);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("sessionId", session.getSessionId());
        response.put("contractId", session.getContractId());
        response.put("currentStep", session.getCurrentStep().name());
        response.put("expiresAt", session.getExpiresAt().toString());

        // Wizard steps guide
        List<Map<String, String>> steps = new ArrayList<>();
        steps.add(Map.of("step", "1", "name", "Document Upload", "endpoint", "POST /wizard/{sessionId}/upload"));
        steps.add(Map.of("step", "2", "name", "Prose Editing", "endpoint", "GET/PUT /wizard/{sessionId}/prose"));
        steps.add(Map.of("step", "3", "name", "Parameters", "endpoint", "GET/PUT /wizard/{sessionId}/parameters"));
        steps.add(Map.of("step", "4", "name", "Programming", "endpoint", "GET/PUT /wizard/{sessionId}/programming"));
        steps.add(Map.of("step", "5", "name", "Preview", "endpoint", "GET /wizard/{sessionId}/preview"));
        steps.add(Map.of("step", "6", "name", "Finalize", "endpoint", "POST /wizard/{sessionId}/finalize"));
        response.put("steps", steps);

        return Response.ok(response).build();
    }

    /**
     * Get session status
     * GET /api/v12/contracts/wizard/{sessionId}
     */
    @GET
    @Path("/{sessionId}")
    public Response getSession(@PathParam("sessionId") String sessionId) {
        try {
            ActiveContractWizardService.WizardSession session = wizardService.getSession(sessionId);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("sessionId", session.getSessionId());
            response.put("contractId", session.getContractId());
            response.put("currentStep", session.getCurrentStep().name());
            response.put("progress", Map.of(
                "proseCompleted", session.isProseCompleted(),
                "parametersCompleted", session.isParametersCompleted(),
                "programmingCompleted", session.isProgrammingCompleted()
            ));
            response.put("createdAt", session.getCreatedAt().toString());
            response.put("updatedAt", session.getUpdatedAt().toString());
            response.put("expiresAt", session.getExpiresAt().toString());

            return Response.ok(response).build();

        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Delete session
     * DELETE /api/v12/contracts/wizard/{sessionId}
     */
    @DELETE
    @Path("/{sessionId}")
    public Response deleteSession(@PathParam("sessionId") String sessionId) {
        wizardService.deleteSession(sessionId);
        return Response.ok(Map.of("success", true, "message", "Session deleted")).build();
    }

    // ==================== Step 1: Document Upload ====================

    /**
     * Upload document
     * POST /api/v12/contracts/wizard/{sessionId}/upload
     */
    @POST
    @Path("/{sessionId}/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadDocument(
            @PathParam("sessionId") String sessionId,
            @RestForm("file") FileUpload file) {

        LOG.infof("Uploading document for session %s", sessionId);

        try {
            if (file == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "No file provided"))
                    .build();
            }

            String fileName = file.fileName();
            String contentType = file.contentType();
            long fileSize = file.size();

            // Validate file type
            if (!isValidDocumentType(fileName, contentType)) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid file type. Supported: PDF, DOC, DOCX, TXT"))
                    .build();
            }

            // Upload document
            ActiveContractWizardService.WizardSession session = wizardService.uploadDocument(
                sessionId, fileName, contentType,
                new FileInputStream(file.uploadedFile().toFile()), fileSize
            );

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("sessionId", sessionId);
            response.put("fileName", fileName);
            response.put("fileSize", fileSize);
            response.put("currentStep", session.getCurrentStep().name());
            response.put("nextStep", "Edit prose at PUT /wizard/" + sessionId + "/prose");

            return Response.ok(response).build();

        } catch (Exception e) {
            LOG.error("Document upload failed", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", "Upload failed: " + e.getMessage()))
                .build();
        }
    }

    /**
     * Upload document as JSON (base64 encoded)
     * POST /api/v12/contracts/wizard/{sessionId}/upload/json
     */
    @POST
    @Path("/{sessionId}/upload/json")
    public Response uploadDocumentJson(
            @PathParam("sessionId") String sessionId,
            Map<String, Object> request) {

        LOG.infof("Uploading document (JSON) for session %s", sessionId);

        try {
            String fileName = (String) request.get("fileName");
            String contentType = (String) request.getOrDefault("contentType", "text/plain");
            String content = (String) request.get("content");

            if (content == null || content.isBlank()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Content is required"))
                    .build();
            }

            byte[] bytes;
            if (request.containsKey("base64") && Boolean.TRUE.equals(request.get("base64"))) {
                bytes = Base64.getDecoder().decode(content);
            } else {
                bytes = content.getBytes();
            }

            ActiveContractWizardService.WizardSession session = wizardService.uploadDocument(
                sessionId, fileName, contentType,
                new java.io.ByteArrayInputStream(bytes), bytes.length
            );

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("sessionId", sessionId);
            response.put("fileName", fileName);
            response.put("fileSize", bytes.length);
            response.put("currentStep", session.getCurrentStep().name());

            return Response.ok(response).build();

        } catch (Exception e) {
            LOG.error("Document upload failed", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", "Upload failed: " + e.getMessage()))
                .build();
        }
    }

    private boolean isValidDocumentType(String fileName, String contentType) {
        if (fileName == null) return false;
        String lower = fileName.toLowerCase();
        return lower.endsWith(".pdf") || lower.endsWith(".doc") ||
               lower.endsWith(".docx") || lower.endsWith(".txt") ||
               (contentType != null && contentType.contains("text"));
    }

    // ==================== Step 2: Prose Editing ====================

    /**
     * Get prose section
     * GET /api/v12/contracts/wizard/{sessionId}/prose
     */
    @GET
    @Path("/{sessionId}/prose")
    public Response getProse(@PathParam("sessionId") String sessionId) {
        try {
            ContractProse prose = wizardService.getProse(sessionId);
            return Response.ok(prose).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Update prose section
     * PUT /api/v12/contracts/wizard/{sessionId}/prose
     */
    @PUT
    @Path("/{sessionId}/prose")
    public Response updateProse(
            @PathParam("sessionId") String sessionId,
            ContractProse prose) {

        LOG.infof("Updating prose for session %s", sessionId);

        try {
            ActiveContractWizardService.WizardSession session = wizardService.updateProse(sessionId, prose);

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("sessionId", sessionId);
            response.put("clauseCount", prose.getTotalClauseCount());
            response.put("scheduleCount", prose.getSchedules().size());
            response.put("currentStep", session.getCurrentStep().name());

            return Response.ok(response).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Add a clause to prose
     * POST /api/v12/contracts/wizard/{sessionId}/prose/clauses
     */
    @POST
    @Path("/{sessionId}/prose/clauses")
    public Response addClause(
            @PathParam("sessionId") String sessionId,
            Map<String, Object> request) {

        try {
            String number = (String) request.get("number");
            String title = (String) request.get("title");
            String text = (String) request.get("text");
            String typeStr = (String) request.getOrDefault("type", "STANDARD");

            ContractProse.ClauseType type = ContractProse.ClauseType.valueOf(typeStr);
            ContractProse prose = wizardService.addClause(sessionId, number, title, text, type);

            return Response.ok(Map.of(
                "success", true,
                "clauseCount", prose.getTotalClauseCount()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Add a schedule to prose
     * POST /api/v12/contracts/wizard/{sessionId}/prose/schedules
     */
    @POST
    @Path("/{sessionId}/prose/schedules")
    public Response addSchedule(
            @PathParam("sessionId") String sessionId,
            Map<String, Object> request) {

        try {
            String number = (String) request.get("number");
            String title = (String) request.get("title");
            String content = (String) request.get("content");

            ContractProse prose = wizardService.addSchedule(sessionId, number, title, content);

            return Response.ok(Map.of(
                "success", true,
                "scheduleCount", prose.getSchedules().size()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Complete prose editing
     * POST /api/v12/contracts/wizard/{sessionId}/prose/complete
     */
    @POST
    @Path("/{sessionId}/prose/complete")
    public Response completeProse(@PathParam("sessionId") String sessionId) {
        try {
            ActiveContractWizardService.WizardSession session = wizardService.completeProseEditing(sessionId);

            return Response.ok(Map.of(
                "success", true,
                "currentStep", session.getCurrentStep().name(),
                "nextStep", "Configure parameters at PUT /wizard/" + sessionId + "/parameters"
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // ==================== Step 3: Parameters Configuration ====================

    /**
     * Get parameters section
     * GET /api/v12/contracts/wizard/{sessionId}/parameters
     */
    @GET
    @Path("/{sessionId}/parameters")
    public Response getParameters(@PathParam("sessionId") String sessionId) {
        try {
            ContractParameters params = wizardService.getParameters(sessionId);
            return Response.ok(params).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Update parameters section
     * PUT /api/v12/contracts/wizard/{sessionId}/parameters
     */
    @PUT
    @Path("/{sessionId}/parameters")
    public Response updateParameters(
            @PathParam("sessionId") String sessionId,
            ContractParameters parameters) {

        LOG.infof("Updating parameters for session %s", sessionId);

        try {
            ActiveContractWizardService.WizardSession session = wizardService.updateParameters(sessionId, parameters);

            return Response.ok(Map.of(
                "success", true,
                "sessionId", sessionId,
                "partyCount", parameters.getParties().size(),
                "currentStep", session.getCurrentStep().name()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Add a party
     * POST /api/v12/contracts/wizard/{sessionId}/parameters/parties
     */
    @POST
    @Path("/{sessionId}/parameters/parties")
    public Response addParty(
            @PathParam("sessionId") String sessionId,
            Map<String, Object> request) {

        try {
            String name = (String) request.get("name");
            String address = (String) request.get("address");
            String roleStr = (String) request.getOrDefault("role", "OWNER");

            ContractParameters.PartyRole role = ContractParameters.PartyRole.valueOf(roleStr);
            ContractParameters params = wizardService.addParty(sessionId, name, address, role);

            return Response.ok(Map.of(
                "success", true,
                "partyCount", params.getParties().size()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Add a data source (EI node)
     * POST /api/v12/contracts/wizard/{sessionId}/parameters/data-sources
     */
    @POST
    @Path("/{sessionId}/parameters/data-sources")
    public Response addDataSource(
            @PathParam("sessionId") String sessionId,
            Map<String, Object> request) {

        try {
            String name = (String) request.get("name");
            String typeStr = (String) request.getOrDefault("type", "EI_NODE");
            String eiNodeId = (String) request.get("eiNodeId");
            String endpoint = (String) request.get("endpoint");

            ContractParameters.DataSourceType type = ContractParameters.DataSourceType.valueOf(typeStr);
            ContractParameters params = wizardService.addDataSource(sessionId, name, type, eiNodeId, endpoint);

            return Response.ok(Map.of(
                "success", true,
                "dataSourceCount", params.getDataSources().size()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Complete parameters configuration
     * POST /api/v12/contracts/wizard/{sessionId}/parameters/complete
     */
    @POST
    @Path("/{sessionId}/parameters/complete")
    public Response completeParameters(@PathParam("sessionId") String sessionId) {
        try {
            ActiveContractWizardService.WizardSession session = wizardService.completeParameters(sessionId);

            return Response.ok(Map.of(
                "success", true,
                "currentStep", session.getCurrentStep().name(),
                "nextStep", "Configure programming at PUT /wizard/" + sessionId + "/programming"
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // ==================== Step 4: Programming Configuration ====================

    /**
     * Get programming section
     * GET /api/v12/contracts/wizard/{sessionId}/programming
     */
    @GET
    @Path("/{sessionId}/programming")
    public Response getProgramming(@PathParam("sessionId") String sessionId) {
        try {
            ContractProgramming prog = wizardService.getProgramming(sessionId);
            return Response.ok(prog).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Update programming section
     * PUT /api/v12/contracts/wizard/{sessionId}/programming
     */
    @PUT
    @Path("/{sessionId}/programming")
    public Response updateProgramming(
            @PathParam("sessionId") String sessionId,
            ContractProgramming programming) {

        LOG.infof("Updating programming for session %s", sessionId);

        try {
            ActiveContractWizardService.WizardSession session = wizardService.updateProgramming(sessionId, programming);

            return Response.ok(Map.of(
                "success", true,
                "sessionId", sessionId,
                "triggerCount", programming.getTriggers().size(),
                "actionCount", programming.getActions().size(),
                "currentStep", session.getCurrentStep().name()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Add a trigger
     * POST /api/v12/contracts/wizard/{sessionId}/programming/triggers
     */
    @POST
    @Path("/{sessionId}/programming/triggers")
    public Response addTrigger(
            @PathParam("sessionId") String sessionId,
            Map<String, Object> request) {

        try {
            String name = (String) request.get("name");
            String typeStr = (String) request.getOrDefault("type", "TIME_BASED");

            ContractProgramming.TriggerType type = ContractProgramming.TriggerType.valueOf(typeStr);

            @SuppressWarnings("unchecked")
            Map<String, Object> config = (Map<String, Object>) request.get("config");

            ContractProgramming prog = wizardService.addTrigger(sessionId, name, type, config);

            return Response.ok(Map.of(
                "success", true,
                "triggerCount", prog.getTriggers().size(),
                "latestTriggerId", prog.getTriggers().get(prog.getTriggers().size() - 1).getTriggerId()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Add an action
     * POST /api/v12/contracts/wizard/{sessionId}/programming/actions
     */
    @POST
    @Path("/{sessionId}/programming/actions")
    public Response addAction(
            @PathParam("sessionId") String sessionId,
            Map<String, Object> request) {

        try {
            String name = (String) request.get("name");
            String typeStr = (String) request.getOrDefault("type", "NOTIFICATION");

            ContractProgramming.ActionType type = ContractProgramming.ActionType.valueOf(typeStr);

            @SuppressWarnings("unchecked")
            Map<String, Object> config = (Map<String, Object>) request.get("config");

            ContractProgramming prog = wizardService.addAction(sessionId, name, type, config);

            return Response.ok(Map.of(
                "success", true,
                "actionCount", prog.getActions().size(),
                "latestActionId", prog.getActions().get(prog.getActions().size() - 1).getActionId()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Link trigger to actions
     * POST /api/v12/contracts/wizard/{sessionId}/programming/triggers/{triggerId}/link
     */
    @POST
    @Path("/{sessionId}/programming/triggers/{triggerId}/link")
    public Response linkTriggerToActions(
            @PathParam("sessionId") String sessionId,
            @PathParam("triggerId") String triggerId,
            Map<String, Object> request) {

        try {
            @SuppressWarnings("unchecked")
            List<String> actionIds = (List<String>) request.get("actionIds");

            ContractProgramming prog = wizardService.linkTriggerToActions(sessionId, triggerId, actionIds);

            return Response.ok(Map.of(
                "success", true,
                "triggerId", triggerId,
                "linkedActionCount", actionIds.size()
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Complete programming configuration
     * POST /api/v12/contracts/wizard/{sessionId}/programming/complete
     */
    @POST
    @Path("/{sessionId}/programming/complete")
    public Response completeProgramming(@PathParam("sessionId") String sessionId) {
        try {
            ActiveContractWizardService.WizardSession session = wizardService.completeProgramming(sessionId);

            return Response.ok(Map.of(
                "success", true,
                "currentStep", session.getCurrentStep().name(),
                "nextStep", "Preview contract at GET /wizard/" + sessionId + "/preview"
            )).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // ==================== Step 5: Preview ====================

    /**
     * Get full contract preview with fee estimate
     * GET /api/v12/contracts/wizard/{sessionId}/preview
     */
    @GET
    @Path("/{sessionId}/preview")
    public Response getPreview(@PathParam("sessionId") String sessionId) {
        try {
            Map<String, Object> preview = wizardService.getPreview(sessionId);
            return Response.ok(preview).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    // ==================== Step 6: Finalize ====================

    /**
     * Finalize and create the contract
     * POST /api/v12/contracts/wizard/{sessionId}/finalize
     */
    @POST
    @Path("/{sessionId}/finalize")
    public Response finalizeContract(@PathParam("sessionId") String sessionId) {
        LOG.infof("Finalizing contract for session %s", sessionId);

        try {
            Map<String, Object> result = wizardService.finalizeContract(sessionId);
            return Response.ok(result).build();

        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        } catch (Exception e) {
            LOG.error("Finalization failed", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(Map.of("error", "Finalization failed: " + e.getMessage()))
                .build();
        }
    }

    // ==================== Fee Endpoints ====================

    /**
     * Get fee estimate for session
     * GET /api/v12/contracts/wizard/{sessionId}/fees
     */
    @GET
    @Path("/{sessionId}/fees")
    public Response getFeeEstimate(@PathParam("sessionId") String sessionId) {
        try {
            ActiveContractWizardService.WizardSession session = wizardService.getSession(sessionId);
            if (session.getFeeId() == null) {
                return Response.ok(Map.of(
                    "message", "No fee estimate yet. Complete more wizard steps."
                )).build();
            }

            Map<String, Object> summary = feeService.getFeeSummary(session.getFeeId());
            return Response.ok(summary).build();

        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Apply discount code
     * POST /api/v12/contracts/wizard/{sessionId}/fees/discount
     */
    @POST
    @Path("/{sessionId}/fees/discount")
    public Response applyDiscount(
            @PathParam("sessionId") String sessionId,
            Map<String, Object> request) {

        try {
            ActiveContractWizardService.WizardSession session = wizardService.getSession(sessionId);
            if (session.getFeeId() == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "No fee estimate to apply discount to"))
                    .build();
            }

            String code = (String) request.get("code");
            feeService.applyDiscountCode(session.getFeeId(), code);

            Map<String, Object> summary = feeService.getFeeSummary(session.getFeeId());
            return Response.ok(summary).build();

        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", e.getMessage()))
                .build();
        }
    }

    /**
     * Get fee rate schedule
     * GET /api/v12/contracts/wizard/fees/rates
     */
    @GET
    @Path("/fees/rates")
    public Response getFeeRates() {
        return Response.ok(feeService.getFeeRateSchedule()).build();
    }
}

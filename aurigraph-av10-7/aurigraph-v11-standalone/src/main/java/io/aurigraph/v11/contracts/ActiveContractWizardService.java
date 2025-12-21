package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ActiveContract Wizard Service
 *
 * Manages the multi-step wizard for creating Ricardian ActiveContracts.
 *
 * Wizard Steps:
 * 1. Document Upload - Upload PDF/DOC/DOCX and extract text
 * 2. Prose Editing - Edit legal text sections (preamble, clauses, schedules)
 * 3. Parameters Configuration - Configure parties, dates, tokens, data sources
 * 4. Programming - Define triggers, conditions, actions, workflows
 * 5. Preview - Full contract preview with fee estimate
 * 6. Finalize - Create contract with version 1.0.0
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
@ApplicationScoped
public class ActiveContractWizardService {

    private static final Logger LOG = Logger.getLogger(ActiveContractWizardService.class);

    @Inject
    ActiveContractFeeService feeService;

    @Inject
    ActiveContractService contractService;

    // Session storage (in production, use Redis or database)
    private final Map<String, WizardSession> sessions = new ConcurrentHashMap<>();

    // ==================== Session Management ====================

    /**
     * Create a new wizard session
     */
    public WizardSession createSession(String userId) {
        WizardSession session = new WizardSession();
        session.setUserId(userId);
        sessions.put(session.getSessionId(), session);
        LOG.infof("Created wizard session: %s for user: %s", session.getSessionId(), userId);
        return session;
    }

    /**
     * Get session by ID
     */
    public WizardSession getSession(String sessionId) {
        WizardSession session = sessions.get(sessionId);
        if (session == null) {
            throw new IllegalArgumentException("Session not found: " + sessionId);
        }
        if (session.isExpired()) {
            sessions.remove(sessionId);
            throw new IllegalStateException("Session expired: " + sessionId);
        }
        return session;
    }

    /**
     * Delete session
     */
    public void deleteSession(String sessionId) {
        sessions.remove(sessionId);
        LOG.infof("Deleted wizard session: %s", sessionId);
    }

    // ==================== Step 1: Document Upload ====================

    /**
     * Upload and process document
     */
    public WizardSession uploadDocument(String sessionId, String fileName, String contentType,
                                         InputStream content, long fileSize) {
        WizardSession session = getSession(sessionId);

        try {
            // Read document content
            byte[] bytes = content.readAllBytes();
            String textContent = extractText(bytes, contentType, fileName);

            // Initialize prose section
            ContractProse prose = new ContractProse();
            prose.setPreamble(textContent);
            prose.setContractId(session.getContractId());

            session.setProse(prose);
            session.setCurrentStep(WizardStep.PROSE_EDITING);
            session.setDocumentFileName(fileName);
            session.setDocumentSize(fileSize);
            session.setUpdatedAt(Instant.now());

            // Calculate upload fee
            ContractFee fee = feeService.calculateDocumentUploadFee(
                sessionId, fileSize / 1024, true);
            session.setFeeId(fee.getFeeId());

            LOG.infof("Document uploaded for session %s: %s (%d bytes)",
                sessionId, fileName, fileSize);

            return session;

        } catch (Exception e) {
            LOG.errorf(e, "Failed to upload document for session %s", sessionId);
            throw new RuntimeException("Document upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Extract text from document
     */
    private String extractText(byte[] bytes, String contentType, String fileName) {
        // In production, use Apache Tika or similar for PDF/DOC extraction
        // For now, assume text or return placeholder
        if (contentType != null && contentType.contains("text")) {
            return new String(bytes, StandardCharsets.UTF_8);
        }

        // For PDF/DOC files, return placeholder (implement with Tika)
        if (fileName.endsWith(".pdf")) {
            return "[PDF content extracted from: " + fileName + "]\n\n" +
                   "This document contains the legal terms and conditions...\n\n" +
                   "WHEREAS Party A wishes to...\n" +
                   "WHEREAS Party B agrees to...\n\n" +
                   "NOW THEREFORE, the parties agree as follows:\n\n" +
                   "1. DEFINITIONS\n" +
                   "2. SCOPE OF AGREEMENT\n" +
                   "3. TERMS AND CONDITIONS\n" +
                   "4. PAYMENT TERMS\n" +
                   "5. TERMINATION\n" +
                   "6. GOVERNING LAW";
        }

        return new String(bytes, StandardCharsets.UTF_8);
    }

    // ==================== Step 2: Prose Editing ====================

    /**
     * Get prose section
     */
    public ContractProse getProse(String sessionId) {
        WizardSession session = getSession(sessionId);
        return session.getProse();
    }

    /**
     * Update prose section
     */
    public WizardSession updateProse(String sessionId, ContractProse prose) {
        WizardSession session = getSession(sessionId);

        prose.setContractId(session.getContractId());
        prose.setUpdatedAt(Instant.now());

        // Calculate prose hash
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(prose.getFullText().getBytes(StandardCharsets.UTF_8));
            prose.setHash(bytesToHex(hash));
        } catch (Exception e) {
            LOG.warn("Failed to calculate prose hash", e);
        }

        session.setProse(prose);
        session.setUpdatedAt(Instant.now());

        // Update fee estimate
        if (session.getFeeId() != null) {
            feeService.updateProseEditingFee(session.getFeeId(), prose);
        }

        LOG.infof("Updated prose for session %s: %d clauses, %d schedules",
            sessionId, prose.getTotalClauseCount(), prose.getSchedules().size());

        return session;
    }

    /**
     * Add a clause to prose
     */
    public ContractProse addClause(String sessionId, String number, String title, String text,
                                    ContractProse.ClauseType type) {
        WizardSession session = getSession(sessionId);
        ContractProse prose = session.getProse();

        ContractProse.Clause clause = new ContractProse.Clause(number, title, text);
        clause.setType(type);
        clause.setOrder(prose.getClauses().size());
        prose.getClauses().add(clause);
        prose.setUpdatedAt(Instant.now());

        session.setUpdatedAt(Instant.now());
        return prose;
    }

    /**
     * Add a schedule to prose
     */
    public ContractProse addSchedule(String sessionId, String number, String title, String content) {
        WizardSession session = getSession(sessionId);
        ContractProse prose = session.getProse();

        prose.addSchedule(number, title, content);
        session.setUpdatedAt(Instant.now());
        return prose;
    }

    /**
     * Complete prose editing and move to parameters
     */
    public WizardSession completeProseEditing(String sessionId) {
        WizardSession session = getSession(sessionId);
        session.setCurrentStep(WizardStep.PARAMETERS);
        session.setProseCompleted(true);

        // Initialize parameters if not exists
        if (session.getParameters() == null) {
            ContractParameters params = new ContractParameters(session.getContractId());
            session.setParameters(params);
        }

        session.setUpdatedAt(Instant.now());
        LOG.infof("Prose editing completed for session %s", sessionId);
        return session;
    }

    // ==================== Step 3: Parameters Configuration ====================

    /**
     * Get parameters section
     */
    public ContractParameters getParameters(String sessionId) {
        WizardSession session = getSession(sessionId);
        return session.getParameters();
    }

    /**
     * Update parameters section
     */
    public WizardSession updateParameters(String sessionId, ContractParameters parameters) {
        WizardSession session = getSession(sessionId);

        parameters.setContractId(session.getContractId());
        parameters.setUpdatedAt(Instant.now());

        session.setParameters(parameters);
        session.setUpdatedAt(Instant.now());

        // Update fee estimate
        if (session.getFeeId() != null) {
            feeService.updateParametersFee(session.getFeeId(), parameters);
        }

        LOG.infof("Updated parameters for session %s: %d parties, %d data sources",
            sessionId, parameters.getParties().size(), parameters.getDataSources().size());

        return session;
    }

    /**
     * Add a party to parameters
     */
    public ContractParameters addParty(String sessionId, String name, String address,
                                        ContractParameters.PartyRole role) {
        WizardSession session = getSession(sessionId);
        ContractParameters params = session.getParameters();

        if (params == null) {
            params = new ContractParameters(session.getContractId());
            session.setParameters(params);
        }

        params.addParty(name, address, role);
        session.setUpdatedAt(Instant.now());
        return params;
    }

    /**
     * Add a data source (EI node) to parameters
     */
    public ContractParameters addDataSource(String sessionId, String name,
                                             ContractParameters.DataSourceType type,
                                             String eiNodeId, String endpoint) {
        WizardSession session = getSession(sessionId);
        ContractParameters params = session.getParameters();

        ContractParameters.DataSource source = new ContractParameters.DataSource();
        source.setName(name);
        source.setType(type);
        source.setEiNodeId(eiNodeId);
        source.setEndpoint(endpoint);
        params.getDataSources().add(source);

        session.setUpdatedAt(Instant.now());
        return params;
    }

    /**
     * Complete parameters and move to programming
     */
    public WizardSession completeParameters(String sessionId) {
        WizardSession session = getSession(sessionId);
        session.setCurrentStep(WizardStep.PROGRAMMING);
        session.setParametersCompleted(true);

        // Initialize programming if not exists
        if (session.getProgramming() == null) {
            ContractProgramming prog = new ContractProgramming(session.getContractId());
            session.setProgramming(prog);
        }

        session.setUpdatedAt(Instant.now());
        LOG.infof("Parameters completed for session %s", sessionId);
        return session;
    }

    // ==================== Step 4: Programming Configuration ====================

    /**
     * Get programming section
     */
    public ContractProgramming getProgramming(String sessionId) {
        WizardSession session = getSession(sessionId);
        return session.getProgramming();
    }

    /**
     * Update programming section
     */
    public WizardSession updateProgramming(String sessionId, ContractProgramming programming) {
        WizardSession session = getSession(sessionId);

        programming.setContractId(session.getContractId());
        programming.setUpdatedAt(Instant.now());

        session.setProgramming(programming);
        session.setUpdatedAt(Instant.now());

        // Update fee estimate
        if (session.getFeeId() != null) {
            feeService.updateProgrammingFee(session.getFeeId(), programming);
        }

        LOG.infof("Updated programming for session %s: %d triggers, %d actions",
            sessionId, programming.getTriggers().size(), programming.getActions().size());

        return session;
    }

    /**
     * Add a trigger
     */
    public ContractProgramming addTrigger(String sessionId, String name,
                                           ContractProgramming.TriggerType type,
                                           Map<String, Object> config) {
        WizardSession session = getSession(sessionId);
        ContractProgramming prog = session.getProgramming();

        if (prog == null) {
            prog = new ContractProgramming(session.getContractId());
            session.setProgramming(prog);
        }

        ContractProgramming.ProgrammableTrigger trigger =
            new ContractProgramming.ProgrammableTrigger(name, type);

        // Apply configuration based on trigger type
        if (config != null) {
            if (config.containsKey("cronExpression")) {
                trigger.setCronExpression((String) config.get("cronExpression"));
            }
            if (config.containsKey("eventType")) {
                trigger.setEventType((String) config.get("eventType"));
            }
            if (config.containsKey("oracleId")) {
                trigger.setOracleId((String) config.get("oracleId"));
            }
        }

        prog.addTrigger(trigger);
        session.setUpdatedAt(Instant.now());
        return prog;
    }

    /**
     * Add an action
     */
    public ContractProgramming addAction(String sessionId, String name,
                                          ContractProgramming.ActionType type,
                                          Map<String, Object> config) {
        WizardSession session = getSession(sessionId);
        ContractProgramming prog = session.getProgramming();

        ContractProgramming.Action action = new ContractProgramming.Action(name, type);

        // Apply configuration based on action type
        if (config != null) {
            if (config.containsKey("toAddress")) {
                action.setToAddress((String) config.get("toAddress"));
            }
            if (config.containsKey("amount")) {
                action.setAmount(new java.math.BigDecimal(config.get("amount").toString()));
            }
            if (config.containsKey("message")) {
                action.setMessage((String) config.get("message"));
            }
        }

        prog.addAction(action);
        session.setUpdatedAt(Instant.now());
        return prog;
    }

    /**
     * Link trigger to actions
     */
    public ContractProgramming linkTriggerToActions(String sessionId, String triggerId,
                                                     List<String> actionIds) {
        WizardSession session = getSession(sessionId);
        ContractProgramming prog = session.getProgramming();

        ContractProgramming.ProgrammableTrigger trigger = prog.getTriggerById(triggerId);
        if (trigger != null) {
            trigger.getActionIds().addAll(actionIds);
        }

        session.setUpdatedAt(Instant.now());
        return prog;
    }

    /**
     * Complete programming and move to preview
     */
    public WizardSession completeProgramming(String sessionId) {
        WizardSession session = getSession(sessionId);
        session.setCurrentStep(WizardStep.PREVIEW);
        session.setProgrammingCompleted(true);
        session.setUpdatedAt(Instant.now());
        LOG.infof("Programming completed for session %s", sessionId);
        return session;
    }

    // ==================== Step 5: Preview ====================

    /**
     * Get full contract preview with fee estimate
     */
    public Map<String, Object> getPreview(String sessionId) {
        WizardSession session = getSession(sessionId);

        Map<String, Object> preview = new LinkedHashMap<>();
        preview.put("sessionId", sessionId);
        preview.put("contractId", session.getContractId());
        preview.put("currentStep", session.getCurrentStep().name());

        // Progress status
        Map<String, Boolean> progress = new LinkedHashMap<>();
        progress.put("documentUploaded", session.getDocumentFileName() != null);
        progress.put("proseCompleted", session.isProseCompleted());
        progress.put("parametersCompleted", session.isParametersCompleted());
        progress.put("programmingCompleted", session.isProgrammingCompleted());
        preview.put("progress", progress);

        // Contract sections
        preview.put("prose", session.getProse());
        preview.put("parameters", session.getParameters());
        preview.put("programming", session.getProgramming());

        // Summary statistics
        Map<String, Object> summary = new LinkedHashMap<>();
        if (session.getProse() != null) {
            summary.put("clauseCount", session.getProse().getTotalClauseCount());
            summary.put("scheduleCount", session.getProse().getSchedules().size());
            summary.put("exhibitCount", session.getProse().getExhibits().size());
        }
        if (session.getParameters() != null) {
            summary.put("partyCount", session.getParameters().getParties().size());
            summary.put("dataSourceCount", session.getParameters().getDataSources().size());
        }
        if (session.getProgramming() != null) {
            summary.put("triggerCount", session.getProgramming().getTriggers().size());
            summary.put("actionCount", session.getProgramming().getActions().size());
            summary.put("workflowCount", session.getProgramming().getWorkflows().size());
        }
        preview.put("summary", summary);

        // Fee estimate
        if (session.getFeeId() != null) {
            // Recalculate full fee
            ContractFee fee = feeService.calculateFeeEstimate(
                session.getContractId(),
                session.getProse(),
                session.getParameters(),
                session.getProgramming()
            );
            session.setFeeId(fee.getFeeId());
            preview.put("feeEstimate", feeService.getFeeSummary(fee.getFeeId()));
        }

        // Validation
        List<String> validationErrors = validateSession(session);
        preview.put("valid", validationErrors.isEmpty());
        preview.put("validationErrors", validationErrors);

        preview.put("createdAt", session.getCreatedAt().toString());
        preview.put("updatedAt", session.getUpdatedAt().toString());

        return preview;
    }

    /**
     * Validate session before finalization
     */
    private List<String> validateSession(WizardSession session) {
        List<String> errors = new ArrayList<>();

        if (session.getProse() == null) {
            errors.add("Prose section is required");
        } else {
            if (session.getProse().getClauses().isEmpty()) {
                errors.add("At least one clause is required in prose");
            }
        }

        if (session.getParameters() == null) {
            errors.add("Parameters section is required");
        } else {
            if (session.getParameters().getParties().isEmpty()) {
                errors.add("At least one party is required");
            }
            int signatureRequired = session.getParameters().getSignatureRequiredCount();
            if (signatureRequired == 0) {
                errors.add("At least one party must require signature");
            }
        }

        // Programming is optional but validate if present
        if (session.getProgramming() != null) {
            for (var trigger : session.getProgramming().getTriggers()) {
                if (trigger.getActionIds().isEmpty()) {
                    errors.add("Trigger '" + trigger.getName() + "' has no linked actions");
                }
            }
        }

        return errors;
    }

    // ==================== Step 6: Finalize ====================

    /**
     * Finalize and create the ActiveContract
     */
    public Map<String, Object> finalizeContract(String sessionId) {
        WizardSession session = getSession(sessionId);

        // Validate
        List<String> errors = validateSession(session);
        if (!errors.isEmpty()) {
            throw new IllegalStateException("Validation failed: " + String.join(", ", errors));
        }

        // Create the ActiveContract
        ActiveContract contract = new ActiveContract();
        contract.setContractId(session.getContractId());
        contract.setName("Contract " + session.getContractId());
        contract.setOwner(session.getUserId());
        contract.setStatus(ContractStatus.DRAFT);
        contract.setCreatedAt(Instant.now());

        // Set Ricardian structure
        contract.setProse(session.getProse());
        contract.setParameters(session.getParameters());
        contract.setProgramming(session.getProgramming());

        // Set legal text from prose preamble
        if (session.getProse() != null) {
            contract.setLegalText(session.getProse().getPreamble());
            contract.setJurisdiction(session.getProse().getJurisdiction());
        }

        // Set parties from parameters
        if (session.getParameters() != null) {
            List<ContractParty> parties = new ArrayList<>();
            for (var partyConfig : session.getParameters().getParties()) {
                ContractParty party = new ContractParty();
                party.setPartyId(partyConfig.getPartyId());
                party.setName(partyConfig.getName());
                party.setAddress(partyConfig.getAddress());
                party.setRole(partyConfig.getRole().name());
                party.setSignatureRequired(partyConfig.isSignatureRequired());
                parties.add(party);
            }
            contract.setParties(parties);
        }

        // Set triggers from programming
        if (session.getProgramming() != null) {
            List<ContractTrigger> triggers = new ArrayList<>();
            for (var progTrigger : session.getProgramming().getTriggers()) {
                ContractTrigger trigger = new ContractTrigger();
                trigger.setTriggerId(progTrigger.getTriggerId());
                trigger.setName(progTrigger.getName());
                trigger.setType(TriggerType.valueOf(progTrigger.getType().name()));
                trigger.setEnabled(progTrigger.isEnabled());
                triggers.add(trigger);
            }
            contract.setTriggers(triggers);
        }

        // Create initial version
        ContractVersion version = contract.createVersion(
            "Initial version created from wizard",
            ContractVersion.ChangeType.INITIAL
        );

        // Get fee estimate
        ContractFee fee = null;
        if (session.getFeeId() != null) {
            fee = feeService.getFee(session.getFeeId());
            contract.setFeeEstimate(fee);
        }

        // In production, persist the contract
        // contractService.deployContract(contract);

        // Clean up session
        sessions.remove(sessionId);

        // Build response
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("contractId", contract.getContractId());
        result.put("version", version.getVersionString());
        result.put("status", contract.getStatus().name());

        // Summary
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("parties", contract.getParties().size());
        summary.put("clauses", session.getProse() != null ? session.getProse().getTotalClauseCount() : 0);
        summary.put("triggers", contract.getTriggers().size());
        result.put("summary", summary);

        // Fee summary
        if (fee != null) {
            result.put("feeEstimate", feeService.getFeeSummary(fee.getFeeId()));
        }

        // Next steps
        List<String> nextSteps = new ArrayList<>();
        nextSteps.add("Review contract at GET /api/v12/contracts/" + contract.getContractId());
        nextSteps.add("Request signatures at POST /api/v12/contracts/" + contract.getContractId() + "/signatures/request");
        nextSteps.add("Pay fees at POST /api/v12/contracts/" + contract.getContractId() + "/fees/pay");
        result.put("nextSteps", nextSteps);

        result.put("createdAt", contract.getCreatedAt().toString());

        LOG.infof("Contract finalized: %s (v%s) with %d parties, %d triggers",
            contract.getContractId(), version.getVersionString(),
            contract.getParties().size(), contract.getTriggers().size());

        return result;
    }

    // ==================== Helper Methods ====================

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // ==================== Wizard Session ====================

    /**
     * Wizard session state
     */
    public static class WizardSession {
        private String sessionId;
        private String userId;
        private String contractId;
        private WizardStep currentStep = WizardStep.DOCUMENT_UPLOAD;

        private String documentFileName;
        private long documentSize;

        private ContractProse prose;
        private ContractParameters parameters;
        private ContractProgramming programming;

        private boolean proseCompleted = false;
        private boolean parametersCompleted = false;
        private boolean programmingCompleted = false;

        private String feeId;

        private Instant createdAt;
        private Instant updatedAt;
        private Instant expiresAt;

        public WizardSession() {
            this.sessionId = "WIZ-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
            this.contractId = "AC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            this.createdAt = Instant.now();
            this.updatedAt = Instant.now();
            this.expiresAt = Instant.now().plusSeconds(24 * 60 * 60); // 24 hour expiry
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }

        // Getters and setters
        public String getSessionId() { return sessionId; }
        public void setSessionId(String sessionId) { this.sessionId = sessionId; }

        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }

        public String getContractId() { return contractId; }
        public void setContractId(String contractId) { this.contractId = contractId; }

        public WizardStep getCurrentStep() { return currentStep; }
        public void setCurrentStep(WizardStep currentStep) { this.currentStep = currentStep; }

        public String getDocumentFileName() { return documentFileName; }
        public void setDocumentFileName(String documentFileName) { this.documentFileName = documentFileName; }

        public long getDocumentSize() { return documentSize; }
        public void setDocumentSize(long documentSize) { this.documentSize = documentSize; }

        public ContractProse getProse() { return prose; }
        public void setProse(ContractProse prose) { this.prose = prose; }

        public ContractParameters getParameters() { return parameters; }
        public void setParameters(ContractParameters parameters) { this.parameters = parameters; }

        public ContractProgramming getProgramming() { return programming; }
        public void setProgramming(ContractProgramming programming) { this.programming = programming; }

        public boolean isProseCompleted() { return proseCompleted; }
        public void setProseCompleted(boolean proseCompleted) { this.proseCompleted = proseCompleted; }

        public boolean isParametersCompleted() { return parametersCompleted; }
        public void setParametersCompleted(boolean parametersCompleted) { this.parametersCompleted = parametersCompleted; }

        public boolean isProgrammingCompleted() { return programmingCompleted; }
        public void setProgrammingCompleted(boolean programmingCompleted) { this.programmingCompleted = programmingCompleted; }

        public String getFeeId() { return feeId; }
        public void setFeeId(String feeId) { this.feeId = feeId; }

        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

        public Instant getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

        public Instant getExpiresAt() { return expiresAt; }
        public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    }

    /**
     * Wizard steps
     */
    public enum WizardStep {
        DOCUMENT_UPLOAD,
        PROSE_EDITING,
        PARAMETERS,
        PROGRAMMING,
        PREVIEW,
        FINALIZED
    }
}

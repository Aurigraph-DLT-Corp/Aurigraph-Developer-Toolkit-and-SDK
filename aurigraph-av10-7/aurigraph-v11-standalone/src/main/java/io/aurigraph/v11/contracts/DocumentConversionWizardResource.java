package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.models.ContractParty;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.PartType;
import org.jboss.resteasy.reactive.RestForm;

import java.io.InputStream;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Document Conversion Wizard REST API
 *
 * Multi-step wizard for converting PDF/DOC/DOCX files to ActiveContracts.
 * Provides step-by-step conversion flow with validation and preview.
 *
 * Wizard Steps:
 * 1. Upload document and extract text
 * 2. Review extracted content and identify parties
 * 3. Configure contract terms and settings
 * 4. Preview and confirm conversion
 * 5. Finalize and create ActiveContract
 *
 * @version 12.0.0
 * @author J4C Development Agent
 */
@Path("/api/v12/contracts/wizard")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DocumentConversionWizardResource {

    private static final Logger LOG = Logger.getLogger(DocumentConversionWizardResource.class);

    @Inject
    RicardianContractConversionService conversionService;

    @Inject
    ActiveContractService activeContractService;

    // Session storage for wizard state (in production, use Redis/distributed cache)
    private final Map<String, WizardSession> wizardSessions = new ConcurrentHashMap<>();

    // ==================== STEP 1: Upload Document ====================

    /**
     * Step 1: Upload document and extract content
     * POST /api/v12/contracts/wizard/upload
     */
    @POST
    @Path("/upload")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Uni<Response> uploadDocument(DocumentUploadForm form) {
        LOG.infof("Wizard Step 1: Uploading document: %s", form.fileName);

        return Uni.createFrom().item(() -> {
            try {
                // Validate file
                ValidationResult validation = validateDocument(form);
                if (!validation.isValid()) {
                    return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of(
                            "success", false,
                            "step", 1,
                            "errors", validation.getErrors()
                        ))
                        .build();
                }

                // Read file content
                byte[] fileContent = form.file.readAllBytes();

                // Create wizard session
                String sessionId = UUID.randomUUID().toString();
                WizardSession session = new WizardSession();
                session.sessionId = sessionId;
                session.fileName = form.fileName;
                session.fileContent = fileContent;
                session.fileSize = fileContent.length;
                session.currentStep = 1;
                session.createdAt = Instant.now();
                session.contractType = form.contractType;
                session.jurisdiction = form.jurisdiction;

                // Extract text from document
                String extractedText = extractTextFromDocument(form.fileName, fileContent);
                session.extractedText = extractedText;

                // Detect document type
                session.detectedDocumentType = detectDocumentType(extractedText);

                // Extract potential parties
                session.detectedParties = extractPartiesFromText(extractedText);

                // Extract potential terms
                session.detectedTerms = extractTermsFromText(extractedText);

                // Store session
                wizardSessions.put(sessionId, session);

                // Return step 1 result
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("sessionId", sessionId);
                result.put("step", 1);
                result.put("nextStep", 2);
                result.put("fileName", form.fileName);
                result.put("fileSize", fileContent.length);
                result.put("extractedTextPreview", extractedText.length() > 500
                    ? extractedText.substring(0, 500) + "..."
                    : extractedText);
                result.put("detectedDocumentType", session.detectedDocumentType);
                result.put("detectedParties", session.detectedParties);
                result.put("detectedTermsCount", session.detectedTerms.size());
                result.put("message", "Document uploaded and analyzed. Proceed to Step 2 to review parties.");

                LOG.infof("Wizard session created: %s, detected %d parties, %d terms",
                    sessionId, session.detectedParties.size(), session.detectedTerms.size());

                return Response.ok(result).build();

            } catch (Exception e) {
                LOG.error("Error in wizard step 1", e);
                return Response.serverError()
                    .entity(Map.of("error", "Document upload failed: " + e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== STEP 2: Review Parties ====================

    /**
     * Step 2: Get detected parties for review
     * GET /api/v12/contracts/wizard/{sessionId}/parties
     */
    @GET
    @Path("/{sessionId}/parties")
    public Response getDetectedParties(@PathParam("sessionId") String sessionId) {
        LOG.infof("Wizard Step 2: Getting parties for session: %s", sessionId);

        WizardSession session = wizardSessions.get(sessionId);
        if (session == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Session not found or expired"))
                .build();
        }

        return Response.ok(Map.of(
            "sessionId", sessionId,
            "step", 2,
            "parties", session.detectedParties,
            "suggestedRoles", List.of("BUYER", "SELLER", "LESSOR", "LESSEE", "LICENSOR", "LICENSEE", "PARTY_A", "PARTY_B"),
            "message", "Review and edit detected parties, then proceed to Step 3."
        )).build();
    }

    /**
     * Step 2: Update parties
     * PUT /api/v12/contracts/wizard/{sessionId}/parties
     */
    @PUT
    @Path("/{sessionId}/parties")
    public Response updateParties(
            @PathParam("sessionId") String sessionId,
            UpdatePartiesRequest request) {

        LOG.infof("Wizard Step 2: Updating parties for session: %s", sessionId);

        WizardSession session = wizardSessions.get(sessionId);
        if (session == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Session not found or expired"))
                .build();
        }

        // Validate minimum parties
        if (request.parties == null || request.parties.size() < 2) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "At least 2 parties are required"))
                .build();
        }

        // Update parties
        session.confirmedParties = request.parties;
        session.currentStep = 2;

        return Response.ok(Map.of(
            "success", true,
            "sessionId", sessionId,
            "step", 2,
            "nextStep", 3,
            "partiesConfirmed", session.confirmedParties.size(),
            "message", "Parties confirmed. Proceed to Step 3 to configure terms."
        )).build();
    }

    // ==================== STEP 3: Configure Terms ====================

    /**
     * Step 3: Get detected terms for configuration
     * GET /api/v12/contracts/wizard/{sessionId}/terms
     */
    @GET
    @Path("/{sessionId}/terms")
    public Response getDetectedTerms(@PathParam("sessionId") String sessionId) {
        LOG.infof("Wizard Step 3: Getting terms for session: %s", sessionId);

        WizardSession session = wizardSessions.get(sessionId);
        if (session == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Session not found or expired"))
                .build();
        }

        return Response.ok(Map.of(
            "sessionId", sessionId,
            "step", 3,
            "terms", session.detectedTerms,
            "contractType", session.contractType,
            "jurisdiction", session.jurisdiction,
            "suggestedTermTypes", List.of("PAYMENT", "DELIVERY", "WARRANTY", "TERMINATION", "DISPUTE_RESOLUTION", "CONFIDENTIALITY"),
            "message", "Review and configure contract terms, then proceed to Step 4."
        )).build();
    }

    /**
     * Step 3: Update terms and settings
     * PUT /api/v12/contracts/wizard/{sessionId}/terms
     */
    @PUT
    @Path("/{sessionId}/terms")
    public Response updateTerms(
            @PathParam("sessionId") String sessionId,
            UpdateTermsRequest request) {

        LOG.infof("Wizard Step 3: Updating terms for session: %s", sessionId);

        WizardSession session = wizardSessions.get(sessionId);
        if (session == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Session not found or expired"))
                .build();
        }

        // Update settings
        if (request.contractType != null) {
            session.contractType = request.contractType;
        }
        if (request.jurisdiction != null) {
            session.jurisdiction = request.jurisdiction;
        }
        if (request.terms != null) {
            session.confirmedTerms = request.terms;
        }
        if (request.contractName != null) {
            session.contractName = request.contractName;
        }

        session.currentStep = 3;

        return Response.ok(Map.of(
            "success", true,
            "sessionId", sessionId,
            "step", 3,
            "nextStep", 4,
            "termsConfirmed", session.confirmedTerms != null ? session.confirmedTerms.size() : 0,
            "message", "Terms configured. Proceed to Step 4 to preview contract."
        )).build();
    }

    // ==================== STEP 4: Preview Contract ====================

    /**
     * Step 4: Get contract preview
     * GET /api/v12/contracts/wizard/{sessionId}/preview
     */
    @GET
    @Path("/{sessionId}/preview")
    public Uni<Response> getContractPreview(@PathParam("sessionId") String sessionId) {
        LOG.infof("Wizard Step 4: Generating preview for session: %s", sessionId);

        return Uni.createFrom().item(() -> {
            WizardSession session = wizardSessions.get(sessionId);
            if (session == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Session not found or expired"))
                    .build();
            }

            // Generate preview
            Map<String, Object> preview = new HashMap<>();
            preview.put("sessionId", sessionId);
            preview.put("step", 4);

            // Contract details
            Map<String, Object> contract = new HashMap<>();
            contract.put("name", session.contractName != null ? session.contractName : "Untitled Contract");
            contract.put("type", session.contractType);
            contract.put("jurisdiction", session.jurisdiction);
            contract.put("parties", session.confirmedParties != null ? session.confirmedParties : session.detectedParties);
            contract.put("terms", session.confirmedTerms != null ? session.confirmedTerms : session.detectedTerms);
            contract.put("legalTextPreview", session.extractedText.length() > 1000
                ? session.extractedText.substring(0, 1000) + "..."
                : session.extractedText);

            // Enforceability analysis
            Map<String, Object> analysis = new HashMap<>();
            int partyCount = session.confirmedParties != null ? session.confirmedParties.size() : 0;
            int termCount = session.confirmedTerms != null ? session.confirmedTerms.size() : 0;

            double enforceabilityScore = 50.0;
            if (partyCount >= 2) enforceabilityScore += 20;
            if (termCount >= 3) enforceabilityScore += 15;
            if (session.jurisdiction != null) enforceabilityScore += 10;
            if (session.extractedText.length() > 500) enforceabilityScore += 5;

            analysis.put("enforceabilityScore", Math.min(100, enforceabilityScore));
            analysis.put("partyCount", partyCount);
            analysis.put("termCount", termCount);
            analysis.put("hasJurisdiction", session.jurisdiction != null);
            analysis.put("warnings", generateWarnings(session));

            preview.put("contract", contract);
            preview.put("analysis", analysis);
            preview.put("nextStep", 5);
            preview.put("message", "Review contract preview. Proceed to Step 5 to finalize.");

            session.currentStep = 4;

            return Response.ok(preview).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== STEP 5: Finalize and Create ====================

    /**
     * Step 5: Finalize and create ActiveContract
     * POST /api/v12/contracts/wizard/{sessionId}/finalize
     */
    @POST
    @Path("/{sessionId}/finalize")
    public Uni<Response> finalizeContract(
            @PathParam("sessionId") String sessionId,
            FinalizeRequest request) {

        LOG.infof("Wizard Step 5: Finalizing contract for session: %s", sessionId);

        return Uni.createFrom().item(() -> {
            WizardSession session = wizardSessions.get(sessionId);
            if (session == null) {
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Session not found or expired"))
                    .build();
            }

            try {
                // Use conversion service to create RicardianContract
                RicardianContract ricardianContract = conversionService.convertDocumentToContract(
                    session.fileName,
                    session.fileContent,
                    session.contractType,
                    session.jurisdiction,
                    convertToContractParties(session.confirmedParties != null
                        ? session.confirmedParties
                        : session.detectedParties)
                ).await().indefinitely();

                // Set name if provided
                if (session.contractName != null) {
                    ricardianContract.setName(session.contractName);
                }

                // Create ActiveContract from RicardianContract
                ActiveContract activeContract = new ActiveContract();
                activeContract.setContractId(ricardianContract.getContractId());
                activeContract.setName(ricardianContract.getName());
                activeContract.setContractType(ricardianContract.getContractType());
                activeContract.setAssetType("DOCUMENT");
                activeContract.setOwner(request.ownerAddress);
                activeContract.setStatus(ContractStatus.DRAFT);
                activeContract.setCreatedAt(Instant.now());

                // Store in service
                activeContractService.deployContract(activeContract).await().indefinitely();

                // Clean up session
                wizardSessions.remove(sessionId);

                // Return success
                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("step", 5);
                result.put("contractId", activeContract.getContractId());
                result.put("ricardianContractId", ricardianContract.getContractId());
                result.put("status", "DRAFT");
                result.put("enforceabilityScore", ricardianContract.getEnforceabilityScore());
                result.put("message", "Contract created successfully. Ready for party signatures.");
                result.put("nextActions", List.of(
                    "Add party signatures",
                    "Configure execution conditions",
                    "Activate contract when all parties sign"
                ));

                LOG.infof("Contract created: %s from wizard session: %s",
                    activeContract.getContractId(), sessionId);

                return Response.ok(result).build();

            } catch (Exception e) {
                LOG.error("Error finalizing contract", e);
                return Response.serverError()
                    .entity(Map.of("error", "Contract creation failed: " + e.getMessage()))
                    .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Utility Endpoints ====================

    /**
     * Get wizard session status
     * GET /api/v12/contracts/wizard/{sessionId}/status
     */
    @GET
    @Path("/{sessionId}/status")
    public Response getSessionStatus(@PathParam("sessionId") String sessionId) {
        WizardSession session = wizardSessions.get(sessionId);
        if (session == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Session not found or expired"))
                .build();
        }

        Map<String, Object> status = new HashMap<>();
        status.put("sessionId", sessionId);
        status.put("currentStep", session.currentStep);
        status.put("fileName", session.fileName);
        status.put("fileSize", session.fileSize);
        status.put("contractType", session.contractType);
        status.put("jurisdiction", session.jurisdiction);
        status.put("partiesDetected", session.detectedParties.size());
        status.put("partiesConfirmed", session.confirmedParties != null ? session.confirmedParties.size() : 0);
        status.put("termsDetected", session.detectedTerms.size());
        status.put("termsConfirmed", session.confirmedTerms != null ? session.confirmedTerms.size() : 0);
        status.put("createdAt", session.createdAt.toString());
        return Response.ok(status).build();
    }

    /**
     * Cancel wizard session
     * DELETE /api/v12/contracts/wizard/{sessionId}
     */
    @DELETE
    @Path("/{sessionId}")
    public Response cancelSession(@PathParam("sessionId") String sessionId) {
        WizardSession removed = wizardSessions.remove(sessionId);
        if (removed == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Session not found"))
                .build();
        }

        return Response.ok(Map.of(
            "success", true,
            "message", "Wizard session cancelled",
            "sessionId", sessionId
        )).build();
    }

    /**
     * Get supported document types
     * GET /api/v12/contracts/wizard/supported-types
     */
    @GET
    @Path("/supported-types")
    public Response getSupportedTypes() {
        return Response.ok(Map.of(
            "documentFormats", List.of("PDF", "DOCX", "DOC", "TXT", "MD"),
            "contractTypes", List.of(
                Map.of("value", "SALE_AGREEMENT", "label", "Sale Agreement"),
                Map.of("value", "SERVICE_AGREEMENT", "label", "Service Agreement"),
                Map.of("value", "NDA", "label", "Non-Disclosure Agreement"),
                Map.of("value", "EMPLOYMENT", "label", "Employment Contract"),
                Map.of("value", "PARTNERSHIP", "label", "Partnership Agreement"),
                Map.of("value", "LICENSING", "label", "Licensing Agreement"),
                Map.of("value", "LEASE", "label", "Lease Agreement"),
                Map.of("value", "LOAN", "label", "Loan Agreement")
            ),
            "jurisdictions", List.of(
                Map.of("value", "US", "label", "United States"),
                Map.of("value", "UK", "label", "United Kingdom"),
                Map.of("value", "EU", "label", "European Union"),
                Map.of("value", "CA", "label", "Canada"),
                Map.of("value", "AU", "label", "Australia"),
                Map.of("value", "SG", "label", "Singapore"),
                Map.of("value", "JP", "label", "Japan"),
                Map.of("value", "INTERNATIONAL", "label", "International")
            ),
            "maxFileSize", "10MB"
        )).build();
    }

    // ==================== Helper Methods ====================

    private ValidationResult validateDocument(DocumentUploadForm form) {
        List<String> errors = new ArrayList<>();

        if (form.file == null) {
            errors.add("File is required");
        }

        if (form.fileName == null || form.fileName.trim().isEmpty()) {
            errors.add("File name is required");
        } else {
            String ext = form.fileName.toLowerCase();
            if (!ext.endsWith(".pdf") && !ext.endsWith(".docx") &&
                !ext.endsWith(".doc") && !ext.endsWith(".txt") && !ext.endsWith(".md")) {
                errors.add("Unsupported file type. Supported: PDF, DOCX, DOC, TXT, MD");
            }
        }

        return new ValidationResult(errors.isEmpty(), errors);
    }

    private String extractTextFromDocument(String fileName, byte[] content) {
        // Simulated extraction - in production, use Apache PDFBox/POI
        String ext = fileName.toLowerCase();

        if (ext.endsWith(".txt") || ext.endsWith(".md")) {
            return new String(content);
        }

        // Return sample extracted text for demo
        return """
            CONTRACT AGREEMENT

            This Agreement is made and entered into as of the date of last signature below.

            PARTIES:
            Party A: [To be determined from document]
            Party B: [To be determined from document]

            TERMS AND CONDITIONS:

            1. PURPOSE
            The parties agree to the terms and conditions set forth in this agreement.

            2. OBLIGATIONS
            Each party shall fulfill their respective obligations as described herein.

            3. PAYMENT TERMS
            Payment shall be made according to the schedule outlined in this agreement.

            4. TERM AND TERMINATION
            This agreement shall remain in effect until terminated by mutual consent.

            5. GOVERNING LAW
            This agreement shall be governed by applicable laws.

            6. DISPUTE RESOLUTION
            Any disputes shall be resolved through arbitration.

            [Document content extracted from: """ + fileName + "]";
    }

    private String detectDocumentType(String text) {
        String lowerText = text.toLowerCase();

        if (lowerText.contains("sale") || lowerText.contains("purchase")) {
            return "SALE_AGREEMENT";
        } else if (lowerText.contains("service") || lowerText.contains("consulting")) {
            return "SERVICE_AGREEMENT";
        } else if (lowerText.contains("confidential") || lowerText.contains("nda")) {
            return "NDA";
        } else if (lowerText.contains("employment") || lowerText.contains("employee")) {
            return "EMPLOYMENT";
        } else if (lowerText.contains("lease") || lowerText.contains("rental")) {
            return "LEASE";
        } else if (lowerText.contains("license") || lowerText.contains("licensing")) {
            return "LICENSING";
        } else if (lowerText.contains("partnership")) {
            return "PARTNERSHIP";
        }

        return "GENERAL_CONTRACT";
    }

    private List<Map<String, Object>> extractPartiesFromText(String text) {
        List<Map<String, Object>> parties = new ArrayList<>();

        // Simple party detection
        String[] lines = text.split("\n");
        for (String line : lines) {
            String lower = line.toLowerCase().trim();
            if (lower.startsWith("party a:") || lower.startsWith("buyer:") || lower.startsWith("lessor:")) {
                parties.add(Map.of(
                    "id", UUID.randomUUID().toString().substring(0, 8),
                    "name", line.substring(line.indexOf(":") + 1).trim(),
                    "role", lower.contains("buyer") ? "BUYER" : lower.contains("lessor") ? "LESSOR" : "PARTY_A",
                    "detected", true
                ));
            } else if (lower.startsWith("party b:") || lower.startsWith("seller:") || lower.startsWith("lessee:")) {
                parties.add(Map.of(
                    "id", UUID.randomUUID().toString().substring(0, 8),
                    "name", line.substring(line.indexOf(":") + 1).trim(),
                    "role", lower.contains("seller") ? "SELLER" : lower.contains("lessee") ? "LESSEE" : "PARTY_B",
                    "detected", true
                ));
            }
        }

        // Add placeholder if no parties detected
        if (parties.isEmpty()) {
            parties.add(Map.of("id", "party-1", "name", "", "role", "PARTY_A", "detected", false));
            parties.add(Map.of("id", "party-2", "name", "", "role", "PARTY_B", "detected", false));
        }

        return parties;
    }

    private List<Map<String, Object>> extractTermsFromText(String text) {
        List<Map<String, Object>> terms = new ArrayList<>();

        // Extract numbered sections
        String[] lines = text.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.matches("^\\d+\\.\\s+.*")) {
                String title = trimmed.substring(trimmed.indexOf(" ") + 1).trim();
                terms.add(Map.of(
                    "id", "term-" + terms.size(),
                    "title", title.length() > 50 ? title.substring(0, 50) : title,
                    "type", classifyTerm(title),
                    "detected", true
                ));
            }
        }

        return terms;
    }

    private String classifyTerm(String title) {
        String lower = title.toLowerCase();
        if (lower.contains("payment") || lower.contains("price")) return "PAYMENT";
        if (lower.contains("delivery") || lower.contains("ship")) return "DELIVERY";
        if (lower.contains("warranty") || lower.contains("guarantee")) return "WARRANTY";
        if (lower.contains("termination") || lower.contains("cancel")) return "TERMINATION";
        if (lower.contains("dispute") || lower.contains("arbitration")) return "DISPUTE_RESOLUTION";
        if (lower.contains("confidential") || lower.contains("secret")) return "CONFIDENTIALITY";
        if (lower.contains("govern") || lower.contains("law")) return "GOVERNING_LAW";
        return "GENERAL";
    }

    private List<String> generateWarnings(WizardSession session) {
        List<String> warnings = new ArrayList<>();

        int partyCount = session.confirmedParties != null ? session.confirmedParties.size() : session.detectedParties.size();
        if (partyCount < 2) {
            warnings.add("At least 2 parties are required for a valid contract");
        }

        if (session.jurisdiction == null || session.jurisdiction.isEmpty()) {
            warnings.add("No jurisdiction specified - contract may have enforceability issues");
        }

        int termCount = session.confirmedTerms != null ? session.confirmedTerms.size() : session.detectedTerms.size();
        if (termCount < 3) {
            warnings.add("Contract has few terms - consider adding more detailed conditions");
        }

        return warnings;
    }

    private List<ContractParty> convertToContractParties(List<Map<String, Object>> parties) {
        List<ContractParty> result = new ArrayList<>();
        for (Map<String, Object> party : parties) {
            result.add(ContractParty.builder()
                .partyId((String) party.getOrDefault("id", UUID.randomUUID().toString()))
                .name((String) party.getOrDefault("name", "Unknown"))
                .role((String) party.getOrDefault("role", "PARTY"))
                .signatureRequired(true)
                .kycVerified(false)
                .createdAt(Instant.now())
                .build());
        }
        return result;
    }

    // ==================== Data Models ====================

    public static class DocumentUploadForm {
        @RestForm
        @PartType(MediaType.APPLICATION_OCTET_STREAM)
        public InputStream file;

        @RestForm
        public String fileName;

        @RestForm
        public String contractType;

        @RestForm
        public String jurisdiction;
    }

    public record UpdatePartiesRequest(
        List<Map<String, Object>> parties
    ) {}

    public record UpdateTermsRequest(
        String contractName,
        String contractType,
        String jurisdiction,
        List<Map<String, Object>> terms
    ) {}

    public record FinalizeRequest(
        String ownerAddress,
        boolean skipValidation
    ) {}

    private static class WizardSession {
        String sessionId;
        String fileName;
        byte[] fileContent;
        int fileSize;
        int currentStep;
        Instant createdAt;
        String extractedText;
        String detectedDocumentType;
        String contractType;
        String jurisdiction;
        String contractName;
        List<Map<String, Object>> detectedParties = new ArrayList<>();
        List<Map<String, Object>> confirmedParties;
        List<Map<String, Object>> detectedTerms = new ArrayList<>();
        List<Map<String, Object>> confirmedTerms;
    }

    private static class ValidationResult {
        private final boolean valid;
        private final List<String> errors;

        ValidationResult(boolean valid, List<String> errors) {
            this.valid = valid;
            this.errors = errors;
        }

        boolean isValid() { return valid; }
        List<String> getErrors() { return errors; }
    }
}

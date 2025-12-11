package io.aurigraph.v11.contracts.composite.api;

import io.aurigraph.v11.contracts.composite.*;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST API Resource for Contract Library
 *
 * Provides endpoints for browsing and managing:
 * - Active Contract Templates (business workflow contracts)
 * - Smart Contract Templates (ERC-compatible blockchain contracts)
 *
 * @version 1.0.0
 * @since AV11-700
 */
@Path("/api/v11/library")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Contract Library", description = "Contract template library management")
public class ContractLibraryResource {

    @Inject
    ContractLibraryService libraryService;

    // ==================== LIBRARY OVERVIEW ====================

    @GET
    @Path("/overview")
    @Operation(summary = "Get library overview with statistics")
    public Response getLibraryOverview() {
        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("libraryVersion", ContractLibraryService.LIBRARY_VERSION);
        overview.put("activeTemplateCount", libraryService.getAllActiveTemplates().size());
        overview.put("smartTemplateCount", libraryService.getAllSmartTemplates().size());
        overview.put("assetCategories", Arrays.stream(ActiveContractTemplate.AssetCategory.values())
            .map(c -> Map.of(
                "code", c.name(),
                "displayName", c.getDisplayName(),
                "description", c.getDescription()
            ))
            .collect(Collectors.toList()));
        overview.put("tokenStandards", Arrays.stream(SmartContractTemplate.TokenStandard.values())
            .map(s -> Map.of(
                "code", s.getCode(),
                "name", s.getName(),
                "description", s.getDescription()
            ))
            .collect(Collectors.toList()));
        return Response.ok(overview).build();
    }

    // ==================== ACTIVE CONTRACT TEMPLATES ====================

    @GET
    @Path("/active/templates")
    @Operation(summary = "List all Active Contract templates")
    public Response getAllActiveTemplates() {
        List<ActiveContractTemplate> templates = libraryService.getAllActiveTemplates();
        return Response.ok(templates).build();
    }

    @GET
    @Path("/active/templates/{templateId}")
    @Operation(summary = "Get Active Contract template by ID")
    public Response getActiveTemplate(@PathParam("templateId") String templateId) {
        Optional<ActiveContractTemplate> template = libraryService.getActiveTemplate(templateId);
        if (template.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Template not found", "templateId", templateId))
                .build();
        }
        return Response.ok(template.get()).build();
    }

    @GET
    @Path("/active/templates/category/{category}")
    @Operation(summary = "Get Active Contract templates by category")
    public Response getActiveTemplatesByCategory(
            @PathParam("category") ActiveContractTemplate.AssetCategory category) {
        List<ActiveContractTemplate> templates = libraryService.getActiveTemplatesByCategory(category);
        return Response.ok(templates).build();
    }

    @GET
    @Path("/active/templates/asset-type/{assetType}")
    @Operation(summary = "Get Active Contract template for asset type")
    public Response getActiveTemplateForAssetType(@PathParam("assetType") AssetType assetType) {
        Optional<ActiveContractTemplate> template = libraryService.getActiveTemplateForAssetType(assetType);
        if (template.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "No template for asset type", "assetType", assetType.name()))
                .build();
        }
        return Response.ok(template.get()).build();
    }

    @GET
    @Path("/active/templates/{templateId}/versions")
    @Operation(summary = "Get version history for Active Contract template")
    public Response getActiveTemplateVersions(@PathParam("templateId") String templateId) {
        List<String> versions = libraryService.getActiveTemplateVersionHistory(templateId);
        return Response.ok(Map.of(
            "templateId", templateId,
            "versions", versions,
            "latestVersion", versions.isEmpty() ? "N/A" : versions.get(0)
        )).build();
    }

    @GET
    @Path("/active/templates/{templateId}/required-documents")
    @Operation(summary = "Get required documents for Active Contract template")
    public Response getActiveTemplateRequiredDocuments(@PathParam("templateId") String templateId) {
        Optional<ActiveContractTemplate> template = libraryService.getActiveTemplate(templateId);
        if (template.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Template not found", "templateId", templateId))
                .build();
        }

        List<Map<String, Object>> docs = template.get().getRequiredDocuments().stream()
            .map(doc -> {
                Map<String, Object> docInfo = new LinkedHashMap<>();
                docInfo.put("tokenType", doc.getTokenType().name());
                docInfo.put("documentName", doc.getDocumentName());
                docInfo.put("description", doc.getDescription());
                docInfo.put("mandatory", doc.isMandatory());
                docInfo.put("requiresVerification", doc.isRequiresVVBVerification());
                docInfo.put("validityPeriod", doc.getValidityPeriod() != null ?
                    doc.getValidityPeriod().toDays() + " days" : "No expiry");
                docInfo.put("acceptedFormats", doc.getAcceptedFormats());
                return docInfo;
            })
            .collect(Collectors.toList());

        return Response.ok(Map.of(
            "templateId", templateId,
            "templateName", template.get().getTemplateName(),
            "requiredDocuments", docs,
            "mandatoryCount", docs.stream().filter(d -> (Boolean) d.get("mandatory")).count(),
            "optionalCount", docs.stream().filter(d -> !(Boolean) d.get("mandatory")).count()
        )).build();
    }

    // ==================== SMART CONTRACT TEMPLATES ====================

    @GET
    @Path("/smart/templates")
    @Operation(summary = "List all Smart Contract templates")
    public Response getAllSmartTemplates() {
        List<SmartContractTemplate> templates = libraryService.getAllSmartTemplates();
        return Response.ok(templates).build();
    }

    @GET
    @Path("/smart/templates/{templateId}")
    @Operation(summary = "Get Smart Contract template by ID")
    public Response getSmartTemplate(@PathParam("templateId") String templateId) {
        Optional<SmartContractTemplate> template = libraryService.getSmartTemplate(templateId);
        if (template.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Template not found", "templateId", templateId))
                .build();
        }
        return Response.ok(template.get()).build();
    }

    @GET
    @Path("/smart/templates/category/{category}")
    @Operation(summary = "Get Smart Contract templates by category")
    public Response getSmartTemplatesByCategory(
            @PathParam("category") ActiveContractTemplate.AssetCategory category) {
        List<SmartContractTemplate> templates = libraryService.getSmartTemplatesByCategory(category);
        return Response.ok(templates).build();
    }

    @GET
    @Path("/smart/templates/token-standard/{standard}")
    @Operation(summary = "Get Smart Contract templates by token standard")
    public Response getSmartTemplatesByTokenStandard(
            @PathParam("standard") SmartContractTemplate.TokenStandard standard) {
        List<SmartContractTemplate> templates = libraryService.getSmartTemplatesByTokenStandard(standard);
        return Response.ok(templates).build();
    }

    @GET
    @Path("/smart/templates/asset-type/{assetType}")
    @Operation(summary = "Get Smart Contract template for asset type")
    public Response getSmartTemplateForAssetType(@PathParam("assetType") AssetType assetType) {
        Optional<SmartContractTemplate> template = libraryService.getSmartTemplateForAssetType(assetType);
        if (template.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "No template for asset type", "assetType", assetType.name()))
                .build();
        }
        return Response.ok(template.get()).build();
    }

    @GET
    @Path("/smart/templates/{templateId}/functions")
    @Operation(summary = "Get functions defined in Smart Contract template")
    public Response getSmartTemplateFunctions(@PathParam("templateId") String templateId) {
        Optional<SmartContractTemplate> template = libraryService.getSmartTemplate(templateId);
        if (template.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Template not found", "templateId", templateId))
                .build();
        }

        List<Map<String, Object>> functions = template.get().getFunctions().stream()
            .map(func -> {
                Map<String, Object> funcInfo = new LinkedHashMap<>();
                funcInfo.put("functionId", func.getFunctionId());
                funcInfo.put("name", func.getName());
                funcInfo.put("description", func.getDescription());
                funcInfo.put("type", func.getType().name());
                funcInfo.put("visibility", func.getVisibility().name());
                funcInfo.put("payable", func.isPayable());
                funcInfo.put("gasEstimate", func.getGasEstimate());
                funcInfo.put("modifiers", Arrays.asList(func.getModifiers()));
                funcInfo.put("parameters", func.getParameters().stream()
                    .map(p -> Map.of(
                        "name", p.getName(),
                        "type", p.getType(),
                        "description", p.getDescription() != null ? p.getDescription() : ""
                    ))
                    .collect(Collectors.toList()));
                funcInfo.put("returns", func.getReturns().stream()
                    .map(r -> Map.of("name", r.getName(), "type", r.getType()))
                    .collect(Collectors.toList()));
                return funcInfo;
            })
            .collect(Collectors.toList());

        return Response.ok(Map.of(
            "templateId", templateId,
            "templateName", template.get().getTemplateName(),
            "tokenStandard", template.get().getTokenStandard().getCode(),
            "functions", functions,
            "totalFunctions", functions.size()
        )).build();
    }

    @GET
    @Path("/smart/templates/{templateId}/gas-estimates")
    @Operation(summary = "Get gas estimates for Smart Contract template")
    public Response getSmartTemplateGasEstimates(@PathParam("templateId") String templateId) {
        Optional<SmartContractTemplate> template = libraryService.getSmartTemplate(templateId);
        if (template.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Template not found", "templateId", templateId))
                .build();
        }

        SmartContractTemplate t = template.get();
        return Response.ok(Map.of(
            "templateId", templateId,
            "templateName", t.getTemplateName(),
            "deploymentGas", t.getDeploymentGasEstimate(),
            "functionGasEstimates", t.getGasEstimates(),
            "totalEstimatedGas", t.estimateTotalGas()
        )).build();
    }

    @GET
    @Path("/smart/templates/{templateId}/events")
    @Operation(summary = "Get events defined in Smart Contract template")
    public Response getSmartTemplateEvents(@PathParam("templateId") String templateId) {
        Optional<SmartContractTemplate> template = libraryService.getSmartTemplate(templateId);
        if (template.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Template not found", "templateId", templateId))
                .build();
        }

        List<Map<String, Object>> events = template.get().getEvents().stream()
            .map(event -> {
                Map<String, Object> eventInfo = new LinkedHashMap<>();
                eventInfo.put("eventId", event.getEventId());
                eventInfo.put("name", event.getName());
                eventInfo.put("description", event.getDescription());
                eventInfo.put("parameters", event.getParameters().stream()
                    .map(p -> Map.of(
                        "name", p.getName(),
                        "type", p.getType(),
                        "indexed", p.isIndexed()
                    ))
                    .collect(Collectors.toList()));
                return eventInfo;
            })
            .collect(Collectors.toList());

        return Response.ok(Map.of(
            "templateId", templateId,
            "templateName", template.get().getTemplateName(),
            "events", events
        )).build();
    }

    // ==================== TOPOLOGY VIEW ====================

    @GET
    @Path("/topology")
    @Operation(summary = "Get complete library topology for visualization")
    public Response getLibraryTopology() {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        // Root node
        nodes.add(Map.of(
            "id", "library",
            "label", "Contract Library",
            "type", "root",
            "data", Map.of(
                "version", ContractLibraryService.LIBRARY_VERSION,
                "activeTemplates", libraryService.getAllActiveTemplates().size(),
                "smartTemplates", libraryService.getAllSmartTemplates().size()
            )
        ));

        // Category nodes
        for (ActiveContractTemplate.AssetCategory category : ActiveContractTemplate.AssetCategory.values()) {
            String categoryId = "cat-" + category.name().toLowerCase();
            nodes.add(Map.of(
                "id", categoryId,
                "label", category.getDisplayName(),
                "type", "category",
                "data", Map.of(
                    "code", category.name(),
                    "description", category.getDescription()
                )
            ));
            edges.add(Map.of(
                "source", "library",
                "target", categoryId,
                "type", "contains"
            ));

            // Active templates for this category
            List<ActiveContractTemplate> activeTemplates = libraryService.getActiveTemplatesByCategory(category);
            for (ActiveContractTemplate template : activeTemplates) {
                String activeId = "active-" + template.getTemplateId();
                nodes.add(Map.of(
                    "id", activeId,
                    "label", template.getTemplateName(),
                    "type", "active-template",
                    "data", Map.of(
                        "templateId", template.getTemplateId(),
                        "assetType", template.getAssetType().name(),
                        "requiredDocs", template.getRequiredDocuments().size(),
                        "vvbCount", template.getRequiredVVBCount()
                    )
                ));
                edges.add(Map.of(
                    "source", categoryId,
                    "target", activeId,
                    "type", "active-contract"
                ));
            }

            // Smart templates for this category
            List<SmartContractTemplate> smartTemplates = libraryService.getSmartTemplatesByCategory(category);
            for (SmartContractTemplate template : smartTemplates) {
                String smartId = "smart-" + template.getTemplateId();
                nodes.add(Map.of(
                    "id", smartId,
                    "label", template.getTemplateName(),
                    "type", "smart-template",
                    "data", Map.of(
                        "templateId", template.getTemplateId(),
                        "assetType", template.getAssetType().name(),
                        "tokenStandard", template.getTokenStandard().getCode(),
                        "functions", template.getFunctions().size(),
                        "fractionalizable", template.isFractionalizable()
                    )
                ));
                edges.add(Map.of(
                    "source", categoryId,
                    "target", smartId,
                    "type", "smart-contract"
                ));
            }
        }

        return Response.ok(Map.of(
            "nodes", nodes,
            "edges", edges,
            "stats", Map.of(
                "totalNodes", nodes.size(),
                "totalEdges", edges.size(),
                "categories", ActiveContractTemplate.AssetCategory.values().length
            )
        )).build();
    }

    @GET
    @Path("/topology/category/{category}")
    @Operation(summary = "Get topology for specific category")
    public Response getCategoryTopology(
            @PathParam("category") ActiveContractTemplate.AssetCategory category) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        List<Map<String, Object>> edges = new ArrayList<>();

        // Category root node
        String categoryId = "cat-" + category.name().toLowerCase();
        nodes.add(Map.of(
            "id", categoryId,
            "label", category.getDisplayName(),
            "type", "category",
            "data", Map.of(
                "code", category.name(),
                "description", category.getDescription()
            )
        ));

        // Active templates
        List<ActiveContractTemplate> activeTemplates = libraryService.getActiveTemplatesByCategory(category);
        for (ActiveContractTemplate template : activeTemplates) {
            String activeId = "active-" + template.getTemplateId();
            nodes.add(Map.of(
                "id", activeId,
                "label", template.getTemplateName(),
                "type", "active-template",
                "data", Map.of(
                    "templateId", template.getTemplateId(),
                    "assetType", template.getAssetType().name(),
                    "requiredDocs", template.getRequiredDocuments().size(),
                    "vvbCount", template.getRequiredVVBCount(),
                    "rules", template.getDefaultRules().size()
                )
            ));
            edges.add(Map.of(
                "source", categoryId,
                "target", activeId,
                "type", "active-contract"
            ));

            // Document nodes
            for (ActiveContractTemplate.RequiredDocument doc : template.getRequiredDocuments()) {
                String docId = activeId + "-doc-" + doc.getTokenType().name().toLowerCase();
                nodes.add(Map.of(
                    "id", docId,
                    "label", doc.getDocumentName(),
                    "type", "document",
                    "data", Map.of(
                        "tokenType", doc.getTokenType().name(),
                        "mandatory", doc.isMandatory(),
                        "requiresVVB", doc.isRequiresVVBVerification()
                    )
                ));
                edges.add(Map.of(
                    "source", activeId,
                    "target", docId,
                    "type", doc.isMandatory() ? "requires" : "optional"
                ));
            }
        }

        // Smart templates
        List<SmartContractTemplate> smartTemplates = libraryService.getSmartTemplatesByCategory(category);
        for (SmartContractTemplate template : smartTemplates) {
            String smartId = "smart-" + template.getTemplateId();
            nodes.add(Map.of(
                "id", smartId,
                "label", template.getTemplateName(),
                "type", "smart-template",
                "data", Map.of(
                    "templateId", template.getTemplateId(),
                    "assetType", template.getAssetType().name(),
                    "tokenStandard", template.getTokenStandard().getCode(),
                    "functions", template.getFunctions().size()
                )
            ));
            edges.add(Map.of(
                "source", categoryId,
                "target", smartId,
                "type", "smart-contract"
            ));

            // Function nodes
            for (SmartContractTemplate.ContractFunction func : template.getFunctions()) {
                String funcId = smartId + "-func-" + func.getName().toLowerCase();
                nodes.add(Map.of(
                    "id", funcId,
                    "label", func.getName(),
                    "type", "function",
                    "data", Map.of(
                        "functionType", func.getType().name(),
                        "visibility", func.getVisibility().name(),
                        "payable", func.isPayable(),
                        "gasEstimate", func.getGasEstimate()
                    )
                ));
                edges.add(Map.of(
                    "source", smartId,
                    "target", funcId,
                    "type", "has-function"
                ));
            }
        }

        return Response.ok(Map.of(
            "category", category.name(),
            "displayName", category.getDisplayName(),
            "nodes", nodes,
            "edges", edges
        )).build();
    }

    // ==================== TEXT VIEW ====================

    @GET
    @Path("/text/active/{templateId}")
    @Operation(summary = "Get Active Contract template as formatted text")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getActiveTemplateAsText(@PathParam("templateId") String templateId) {
        Optional<ActiveContractTemplate> templateOpt = libraryService.getActiveTemplate(templateId);
        if (templateOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity("Template not found: " + templateId)
                .build();
        }

        ActiveContractTemplate template = templateOpt.get();
        StringBuilder sb = new StringBuilder();

        sb.append("═══════════════════════════════════════════════════════════════\n");
        sb.append("                    ACTIVE CONTRACT TEMPLATE\n");
        sb.append("═══════════════════════════════════════════════════════════════\n\n");

        sb.append("TEMPLATE INFORMATION\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        sb.append(String.format("  Template ID:     %s\n", template.getTemplateId()));
        sb.append(String.format("  Template Name:   %s\n", template.getTemplateName()));
        sb.append(String.format("  Description:     %s\n", template.getDescription()));
        sb.append(String.format("  Version:         %d\n", template.getVersion()));
        sb.append(String.format("  Asset Type:      %s (%s)\n",
            template.getAssetType().name(), template.getAssetType().getDisplayName()));
        sb.append(String.format("  Category:        %s\n", template.getCategory().getDisplayName()));
        sb.append(String.format("  Status:          %s\n", template.isActive() ? "ACTIVE" : "INACTIVE"));
        sb.append("\n");

        sb.append("VVB VERIFICATION REQUIREMENTS\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        sb.append(String.format("  Required VVB Count:     %d\n", template.getRequiredVVBCount()));
        sb.append(String.format("  Minimum Level:          %s\n", template.getMinimumVerificationLevel()));
        sb.append(String.format("  Accepted VVB Types:     %s\n",
            String.join(", ", template.getAcceptedVVBTypes())));
        sb.append("\n");

        sb.append("WORKFLOW CONFIGURATION\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        sb.append(String.format("  Default Duration:       %s\n",
            template.getDefaultContractDuration() != null ?
                template.getDefaultContractDuration().toDays() + " days" : "Not specified"));
        sb.append(String.format("  Auto Renewal:           %s\n",
            template.isAutoRenewal() ? "Yes" : "No"));
        sb.append(String.format("  Required Approvals:     %s\n",
            template.getRequiredApprovals().isEmpty() ? "None" :
                String.join(", ", template.getRequiredApprovals())));
        sb.append("\n");

        sb.append("JURISDICTION SUPPORT\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        if (template.getSupportedJurisdictions().isEmpty()) {
            sb.append("  All jurisdictions supported (no restrictions)\n");
        } else {
            for (String jurisdiction : template.getSupportedJurisdictions()) {
                sb.append(String.format("  • %s\n", jurisdiction));
            }
        }
        sb.append("\n");

        sb.append("REQUIRED DOCUMENTS\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        int docIndex = 1;
        for (ActiveContractTemplate.RequiredDocument doc : template.getRequiredDocuments()) {
            sb.append(String.format("  %d. %s\n", docIndex++, doc.getDocumentName()));
            sb.append(String.format("     Token Type:    %s\n", doc.getTokenType().name()));
            sb.append(String.format("     Mandatory:     %s\n", doc.isMandatory() ? "YES" : "No"));
            sb.append(String.format("     VVB Required:  %s\n",
                doc.isRequiresVVBVerification() ? "YES" : "No"));
            if (doc.getValidityPeriod() != null) {
                sb.append(String.format("     Valid For:     %d days\n",
                    doc.getValidityPeriod().toDays()));
            }
            sb.append(String.format("     Formats:       %s\n",
                String.join(", ", doc.getAcceptedFormats())));
            sb.append("\n");
        }

        sb.append("DEFAULT BUSINESS RULES\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        if (template.getDefaultRules().isEmpty()) {
            sb.append("  No default business rules defined\n");
        } else {
            int ruleIndex = 1;
            for (ActiveContract.BusinessRule rule : template.getDefaultRules()) {
                sb.append(String.format("  %d. [%s] %s\n", ruleIndex++,
                    rule.getRuleType(), rule.getRuleName()));
                sb.append(String.format("     Condition: %s\n", rule.getCondition()));
                sb.append(String.format("     Action:    %s\n", rule.getAction()));
                sb.append(String.format("     Priority:  %d | Auto-execute: %s\n",
                    rule.getPriority(), rule.isAutoExecute() ? "Yes" : "No"));
                sb.append("\n");
            }
        }

        sb.append("═══════════════════════════════════════════════════════════════\n");
        sb.append("  Generated by Aurigraph V11 Contract Library\n");
        sb.append("  Library Version: " + ContractLibraryService.LIBRARY_VERSION + "\n");
        sb.append("═══════════════════════════════════════════════════════════════\n");

        return Response.ok(sb.toString()).build();
    }

    @GET
    @Path("/text/smart/{templateId}")
    @Operation(summary = "Get Smart Contract template as formatted text")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getSmartTemplateAsText(@PathParam("templateId") String templateId) {
        Optional<SmartContractTemplate> templateOpt = libraryService.getSmartTemplate(templateId);
        if (templateOpt.isEmpty()) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity("Template not found: " + templateId)
                .build();
        }

        SmartContractTemplate template = templateOpt.get();
        StringBuilder sb = new StringBuilder();

        sb.append("═══════════════════════════════════════════════════════════════\n");
        sb.append("                    SMART CONTRACT TEMPLATE\n");
        sb.append("═══════════════════════════════════════════════════════════════\n\n");

        sb.append("TEMPLATE INFORMATION\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        sb.append(String.format("  Template ID:      %s\n", template.getTemplateId()));
        sb.append(String.format("  Template Name:    %s\n", template.getTemplateName()));
        sb.append(String.format("  Description:      %s\n", template.getDescription()));
        sb.append(String.format("  Version:          %s\n", template.getVersion()));
        sb.append(String.format("  Asset Type:       %s (%s)\n",
            template.getAssetType().name(), template.getAssetType().getDisplayName()));
        sb.append(String.format("  Category:         %s\n", template.getCategory().getDisplayName()));
        sb.append(String.format("  Status:           %s\n", template.isActive() ? "ACTIVE" : "INACTIVE"));
        sb.append(String.format("  Audited:          %s\n", template.isAudited() ? "YES" : "No"));
        sb.append("\n");

        sb.append("TOKEN STANDARD\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        sb.append(String.format("  Standard:         %s (%s)\n",
            template.getTokenStandard().getCode(), template.getTokenStandard().getName()));
        sb.append(String.format("  Description:      %s\n",
            template.getTokenStandard().getDescription()));
        sb.append(String.format("  Fractionalizable: %s\n",
            template.isFractionalizable() ? "Yes (max " + template.getMaxFractions() + " fractions)" : "No"));
        sb.append("\n");

        sb.append("UPGRADE CONFIGURATION\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        sb.append(String.format("  Upgradeable:      %s\n", template.isUpgradeable() ? "Yes" : "No"));
        if (template.isUpgradeable() && template.getUpgradePattern() != null) {
            sb.append(String.format("  Pattern:          %s\n",
                template.getUpgradePattern().getName()));
            sb.append(String.format("  Pattern Desc:     %s\n",
                template.getUpgradePattern().getDescription()));
        }
        sb.append("\n");

        sb.append("GAS ESTIMATES\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        sb.append(String.format("  Deployment:       %s gas\n",
            template.getDeploymentGasEstimate()));
        sb.append(String.format("  Total Estimated:  %s gas\n", template.estimateTotalGas()));
        sb.append("\n");

        sb.append("SUPPORTED NETWORKS\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        for (String network : template.getSupportedNetworks()) {
            sb.append(String.format("  • %s\n", network));
        }
        sb.append("\n");

        sb.append("CONTRACT FUNCTIONS\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        for (SmartContractTemplate.ContractFunction func : template.getFunctions()) {
            sb.append(String.format("\n  function %s(", func.getName()));
            String params = func.getParameters().stream()
                .map(p -> p.getType() + " " + p.getName())
                .collect(Collectors.joining(", "));
            sb.append(params);
            sb.append(")");
            if (func.getVisibility() != SmartContractTemplate.ContractFunction.Visibility.PUBLIC) {
                sb.append(" " + func.getVisibility().name().toLowerCase());
            }
            if (func.isPayable()) {
                sb.append(" payable");
            }
            if (func.getModifiers().length > 0) {
                sb.append(" " + String.join(" ", func.getModifiers()));
            }
            if (!func.getReturns().isEmpty()) {
                String returns = func.getReturns().stream()
                    .map(r -> r.getType())
                    .collect(Collectors.joining(", "));
                sb.append(" returns (" + returns + ")");
            }
            sb.append("\n");
            sb.append(String.format("    Type: %s | Gas: %s\n",
                func.getType(), func.getGasEstimate()));
            if (func.getDescription() != null) {
                sb.append(String.format("    // %s\n", func.getDescription()));
            }
        }
        sb.append("\n");

        sb.append("CONTRACT EVENTS\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        for (SmartContractTemplate.ContractEvent event : template.getEvents()) {
            sb.append(String.format("\n  event %s(", event.getName()));
            String params = event.getParameters().stream()
                .map(p -> (p.isIndexed() ? "indexed " : "") + p.getType() + " " + p.getName())
                .collect(Collectors.joining(", "));
            sb.append(params);
            sb.append(");\n");
            if (event.getDescription() != null) {
                sb.append(String.format("    // %s\n", event.getDescription()));
            }
        }
        sb.append("\n");

        sb.append("ACCESS CONTROL RULES\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        for (SmartContractTemplate.AccessControlRule rule : template.getAccessControl()) {
            sb.append(String.format("\n  Role: %s\n", rule.getRoleName()));
            if (rule.getDescription() != null) {
                sb.append(String.format("    Description: %s\n", rule.getDescription()));
            }
            sb.append(String.format("    Allowed Functions: %s\n",
                String.join(", ", rule.getAllowedFunctions())));
            if (rule.getCondition() != null) {
                sb.append(String.format("    Condition: %s\n", rule.getCondition()));
            }
        }
        sb.append("\n");

        sb.append("COMPLIANCE REQUIREMENTS\n");
        sb.append("───────────────────────────────────────────────────────────────\n");
        for (String compliance : template.getRequiredCompliances()) {
            sb.append(String.format("  • %s\n", compliance));
        }
        sb.append("\n");

        sb.append("═══════════════════════════════════════════════════════════════\n");
        sb.append("  Generated by Aurigraph V11 Contract Library\n");
        sb.append("  Library Version: " + ContractLibraryService.LIBRARY_VERSION + "\n");
        sb.append("═══════════════════════════════════════════════════════════════\n");

        return Response.ok(sb.toString()).build();
    }

    @GET
    @Path("/text/all")
    @Operation(summary = "Get all templates as formatted text index")
    @Produces(MediaType.TEXT_PLAIN)
    public Response getAllTemplatesAsText() {
        StringBuilder sb = new StringBuilder();

        sb.append("═══════════════════════════════════════════════════════════════\n");
        sb.append("              AURIGRAPH CONTRACT LIBRARY INDEX\n");
        sb.append("═══════════════════════════════════════════════════════════════\n");
        sb.append(String.format("  Library Version: %s\n", ContractLibraryService.LIBRARY_VERSION));
        sb.append(String.format("  Total Templates: %d Active + %d Smart = %d Total\n\n",
            libraryService.getAllActiveTemplates().size(),
            libraryService.getAllSmartTemplates().size(),
            libraryService.getAllActiveTemplates().size() + libraryService.getAllSmartTemplates().size()
        ));

        for (ActiveContractTemplate.AssetCategory category : ActiveContractTemplate.AssetCategory.values()) {
            List<ActiveContractTemplate> activeTemplates = libraryService.getActiveTemplatesByCategory(category);
            List<SmartContractTemplate> smartTemplates = libraryService.getSmartTemplatesByCategory(category);

            if (activeTemplates.isEmpty() && smartTemplates.isEmpty()) continue;

            sb.append("───────────────────────────────────────────────────────────────\n");
            sb.append(String.format("  %s\n", category.getDisplayName().toUpperCase()));
            sb.append(String.format("  %s\n", category.getDescription()));
            sb.append("───────────────────────────────────────────────────────────────\n\n");

            sb.append("  ACTIVE CONTRACT TEMPLATES:\n");
            for (ActiveContractTemplate template : activeTemplates) {
                sb.append(String.format("    [%s] %s\n",
                    template.getTemplateId(), template.getTemplateName()));
                sb.append(String.format("        Asset: %s | Docs: %d | VVB: %d required\n",
                    template.getAssetType().name(),
                    template.getRequiredDocuments().size(),
                    template.getRequiredVVBCount()
                ));
            }
            sb.append("\n");

            sb.append("  SMART CONTRACT TEMPLATES:\n");
            for (SmartContractTemplate template : smartTemplates) {
                sb.append(String.format("    [%s] %s\n",
                    template.getTemplateId(), template.getTemplateName()));
                sb.append(String.format("        Standard: %s | Functions: %d | Fractional: %s\n",
                    template.getTokenStandard().getCode(),
                    template.getFunctions().size(),
                    template.isFractionalizable() ? "Yes" : "No"
                ));
            }
            sb.append("\n");
        }

        sb.append("═══════════════════════════════════════════════════════════════\n");
        sb.append("  Use /api/v11/library/text/active/{id} for Active Contract details\n");
        sb.append("  Use /api/v11/library/text/smart/{id} for Smart Contract details\n");
        sb.append("═══════════════════════════════════════════════════════════════\n");

        return Response.ok(sb.toString()).build();
    }
}

package io.aurigraph.v11.api;

import io.aurigraph.v11.contracts.composite.*;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.quarkus.logging.Log;

import java.time.Instant;
import java.util.*;

/**
 * Composite Contract REST API
 *
 * Provides endpoints for managing Active Contracts with:
 * - Workflow state management (DRAFT -> PENDING_APPROVAL -> ACTIVE -> TERMINATED)
 * - Binding to Composite Tokens
 * - RBAC (Role-Based Access Control)
 * - Business rules management
 * - Traceability and audit logging
 *
 * This is the new composite-aware Active Contract API as per AV11-603.
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-603-02
 */
@Path("/api/v11/contracts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CompositeContractResource {

    @Inject
    TopologyService topologyService;

    @Inject
    CompositeTokenFactory compositeTokenFactory;

    /**
     * Create a new Active Contract
     *
     * POST /api/v11/contracts
     */
    @POST
    public Uni<Response> createContract(ContractCreateRequest request) {
        Log.infof("Creating new active contract for owner: %s", request.ownerAddress);

        ActiveContract contract = ActiveContract.builder()
            .ownerAddress(request.ownerAddress)
            .representativeAddress(request.representativeAddress)
            .compositeTokenId(request.compositeTokenId)
            .effectiveDate(request.effectiveDate != null ? Instant.parse(request.effectiveDate) : Instant.now())
            .expirationDate(request.expirationDate != null ? Instant.parse(request.expirationDate) : null)
            .ruleTemplateId(request.ruleTemplateId)
            .registryId(request.registryId)
            .build();

        // Add traceability link if binding to composite token
        if (request.compositeTokenId != null) {
            contract.addTraceabilityLink("CompositeToken", request.compositeTokenId, "BINDS_TO");
        }

        // Register the contract
        topologyService.registerContract(contract);

        return Uni.createFrom().item(Response.ok(Map.of(
            "success", true,
            "contractId", contract.getContractId(),
            "status", contract.getStatus().name(),
            "message", "Contract created successfully"
        )).build());
    }

    /**
     * Get contract by ID
     *
     * GET /api/v11/contracts/{contractId}
     */
    @GET
    @Path("/{contractId}")
    public Response getContract(@PathParam("contractId") String contractId) {
        ActiveContract contract = topologyService.getContract(contractId);

        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found: " + contractId))
                .build();
        }

        return Response.ok(buildContractResponse(contract)).build();
    }

    /**
     * List contracts by owner
     *
     * GET /api/v11/contracts?owner={ownerAddress}
     */
    @GET
    public Response listContracts(
            @QueryParam("owner") String ownerAddress,
            @QueryParam("status") String status) {

        List<ActiveContract> contracts;

        if (ownerAddress != null) {
            contracts = topologyService.getContractsByOwner(ownerAddress);
        } else if (status != null) {
            try {
                ActiveContract.ContractStatus contractStatus = ActiveContract.ContractStatus.valueOf(status.toUpperCase());
                contracts = topologyService.getContractsByStatus(contractStatus);
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid status: " + status))
                    .build();
            }
        } else {
            // Return all contracts (would limit in production)
            contracts = topologyService.getContractsByStatus(ActiveContract.ContractStatus.ACTIVE);
        }

        return Response.ok(Map.of(
            "contracts", contracts.stream().map(this::buildContractSummary).toList(),
            "count", contracts.size()
        )).build();
    }

    /**
     * Bind contract to composite token
     *
     * POST /api/v11/contracts/{contractId}/bind
     */
    @POST
    @Path("/{contractId}/bind")
    public Uni<Response> bindToCompositeToken(
            @PathParam("contractId") String contractId,
            BindRequest request) {

        Log.infof("Binding contract %s to composite token %s", contractId, request.compositeTokenId);

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Uni.createFrom().item(
                Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", "Contract not found"))
                    .build()
            );
        }

        // Verify composite token exists
        return compositeTokenFactory.getCompositeToken(request.compositeTokenId)
            .map(compositeToken -> {
                if (compositeToken == null) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Composite token not found"))
                        .build();
                }

                // Add traceability link
                contract.addTraceabilityLink("CompositeToken", request.compositeTokenId, "BINDS_TO");

                // Update composite token with contract reference
                compositeToken.setActiveContractId(contractId);

                return Response.ok(Map.of(
                    "success", true,
                    "contractId", contractId,
                    "compositeTokenId", request.compositeTokenId,
                    "message", "Contract bound to composite token successfully"
                )).build();
            });
    }

    /**
     * Transition workflow state
     *
     * POST /api/v11/contracts/{contractId}/transition
     */
    @POST
    @Path("/{contractId}/transition")
    public Response transitionWorkflow(
            @PathParam("contractId") String contractId,
            @HeaderParam("X-User-Address") String userAddress,
            TransitionRequest request) {

        if (userAddress == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(Map.of("error", "X-User-Address header required"))
                .build();
        }

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        try {
            ActiveContract.ContractStatus newStatus = ActiveContract.ContractStatus.valueOf(request.newStatus.toUpperCase());

            // Check if transition is valid
            if (!contract.canTransitionTo(newStatus)) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "error", "Invalid transition",
                        "currentStatus", contract.getStatus().name(),
                        "requestedStatus", newStatus.name()
                    ))
                    .build();
            }

            boolean success = contract.transition(newStatus, userAddress, request.reason);

            if (success) {
                return Response.ok(Map.of(
                    "success", true,
                    "contractId", contractId,
                    "previousStatus", request.newStatus,
                    "newStatus", contract.getStatus().name(),
                    "message", "Workflow transitioned successfully"
                )).build();
            } else {
                return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("error", "Transition denied - insufficient permissions"))
                    .build();
            }
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid status: " + request.newStatus))
                .build();
        }
    }

    /**
     * Submit contract for approval
     *
     * POST /api/v11/contracts/{contractId}/submit-for-approval
     */
    @POST
    @Path("/{contractId}/submit-for-approval")
    public Response submitForApproval(
            @PathParam("contractId") String contractId,
            @HeaderParam("X-User-Address") String userAddress) {

        if (userAddress == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(Map.of("error", "X-User-Address header required"))
                .build();
        }

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        boolean success = contract.submitForApproval(userAddress);

        if (success) {
            return Response.ok(Map.of(
                "success", true,
                "contractId", contractId,
                "status", contract.getStatus().name(),
                "message", "Contract submitted for VVB verification"
            )).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Cannot submit contract in current state"))
                .build();
        }
    }

    /**
     * Activate contract (after VVB verification)
     *
     * POST /api/v11/contracts/{contractId}/activate
     */
    @POST
    @Path("/{contractId}/activate")
    public Response activateContract(
            @PathParam("contractId") String contractId,
            @HeaderParam("X-User-Address") String userAddress) {

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        if (!contract.isVvbVerified()) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Contract requires VVB verification before activation"))
                .build();
        }

        boolean success = contract.activate(userAddress != null ? userAddress : contract.getOwnerAddress());

        if (success) {
            return Response.ok(Map.of(
                "success", true,
                "contractId", contractId,
                "status", contract.getStatus().name(),
                "message", "Contract activated successfully"
            )).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Cannot activate contract"))
                .build();
        }
    }

    /**
     * Suspend contract
     *
     * POST /api/v11/contracts/{contractId}/suspend
     */
    @POST
    @Path("/{contractId}/suspend")
    public Response suspendContract(
            @PathParam("contractId") String contractId,
            @HeaderParam("X-User-Address") String userAddress,
            SuspendRequest request) {

        if (userAddress == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(Map.of("error", "X-User-Address header required"))
                .build();
        }

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        boolean success = contract.suspend(userAddress, request.reason);

        if (success) {
            return Response.ok(Map.of(
                "success", true,
                "contractId", contractId,
                "status", contract.getStatus().name(),
                "message", "Contract suspended"
            )).build();
        } else {
            return Response.status(Response.Status.FORBIDDEN)
                .entity(Map.of("error", "Cannot suspend contract"))
                .build();
        }
    }

    /**
     * Resume suspended contract
     *
     * POST /api/v11/contracts/{contractId}/resume
     */
    @POST
    @Path("/{contractId}/resume")
    public Response resumeContract(
            @PathParam("contractId") String contractId,
            @HeaderParam("X-User-Address") String userAddress) {

        if (userAddress == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(Map.of("error", "X-User-Address header required"))
                .build();
        }

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        boolean success = contract.resume(userAddress, "Resumed by user");

        if (success) {
            return Response.ok(Map.of(
                "success", true,
                "contractId", contractId,
                "status", contract.getStatus().name(),
                "message", "Contract resumed"
            )).build();
        } else {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Cannot resume contract"))
                .build();
        }
    }

    /**
     * Terminate contract
     *
     * POST /api/v11/contracts/{contractId}/terminate
     */
    @POST
    @Path("/{contractId}/terminate")
    public Response terminateContract(
            @PathParam("contractId") String contractId,
            @HeaderParam("X-User-Address") String userAddress,
            TerminateRequest request) {

        if (userAddress == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(Map.of("error", "X-User-Address header required"))
                .build();
        }

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        boolean success = contract.terminate(userAddress, request.reason);

        if (success) {
            return Response.ok(Map.of(
                "success", true,
                "contractId", contractId,
                "status", contract.getStatus().name(),
                "message", "Contract terminated"
            )).build();
        } else {
            return Response.status(Response.Status.FORBIDDEN)
                .entity(Map.of("error", "Cannot terminate contract - insufficient permissions"))
                .build();
        }
    }

    /**
     * Record VVB verification
     *
     * POST /api/v11/contracts/{contractId}/vvb-verify
     */
    @POST
    @Path("/{contractId}/vvb-verify")
    public Response recordVVBVerification(
            @PathParam("contractId") String contractId,
            @HeaderParam("X-Verifier-Id") String verifierId,
            VVBVerifyRequest request) {

        if (verifierId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(Map.of("error", "X-Verifier-Id header required"))
                .build();
        }

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        contract.recordVVBVerification(verifierId, request.approved);

        return Response.ok(Map.of(
            "success", true,
            "contractId", contractId,
            "verifierId", verifierId,
            "approved", request.approved,
            "vvbVerified", contract.isVvbVerified(),
            "message", request.approved ? "VVB verification approved" : "VVB verification rejected"
        )).build();
    }

    // ==================== RBAC Endpoints ====================

    /**
     * Assign role to address
     *
     * POST /api/v11/contracts/{contractId}/roles/assign
     */
    @POST
    @Path("/{contractId}/roles/assign")
    public Response assignRole(
            @PathParam("contractId") String contractId,
            @HeaderParam("X-User-Address") String userAddress,
            RoleAssignRequest request) {

        if (userAddress == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                .entity(Map.of("error", "X-User-Address header required"))
                .build();
        }

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        try {
            ActiveContract.ContractRole role = ActiveContract.ContractRole.valueOf(request.role.toUpperCase());
            contract.assignRole(request.address, role, userAddress);

            return Response.ok(Map.of(
                "success", true,
                "contractId", contractId,
                "address", request.address,
                "role", role.name(),
                "message", "Role assigned successfully"
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid role: " + request.role))
                .build();
        }
    }

    /**
     * Get roles for contract
     *
     * GET /api/v11/contracts/{contractId}/roles
     */
    @GET
    @Path("/{contractId}/roles")
    public Response getRoles(@PathParam("contractId") String contractId) {
        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        Map<String, ActiveContract.ContractRole> roles = contract.getRoleAssignments();
        List<Map<String, Object>> rolesList = new ArrayList<>();

        for (Map.Entry<String, ActiveContract.ContractRole> entry : roles.entrySet()) {
            rolesList.add(Map.of(
                "address", entry.getKey(),
                "role", entry.getValue().name(),
                "description", entry.getValue().getDescription(),
                "permissions", entry.getValue().getPermissions().stream()
                    .map(Enum::name).toList()
            ));
        }

        return Response.ok(Map.of(
            "contractId", contractId,
            "roles", rolesList,
            "count", rolesList.size()
        )).build();
    }

    /**
     * Check permission
     *
     * GET /api/v11/contracts/{contractId}/roles/{address}/can/{permission}
     */
    @GET
    @Path("/{contractId}/roles/{address}/can/{permission}")
    public Response checkPermission(
            @PathParam("contractId") String contractId,
            @PathParam("address") String address,
            @PathParam("permission") String permission) {

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        try {
            ActiveContract.Permission perm = ActiveContract.Permission.valueOf(permission.toUpperCase());
            boolean hasPermission = contract.hasPermission(address, perm);

            return Response.ok(Map.of(
                "address", address,
                "permission", permission,
                "allowed", hasPermission,
                "role", contract.getRole(address) != null ? contract.getRole(address).name() : "NONE"
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid permission: " + permission))
                .build();
        }
    }

    // ==================== Business Rules Endpoints ====================

    /**
     * Add business rule
     *
     * POST /api/v11/contracts/{contractId}/rules
     */
    @POST
    @Path("/{contractId}/rules")
    public Response addBusinessRule(
            @PathParam("contractId") String contractId,
            BusinessRuleRequest request) {

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        try {
            ActiveContract.BusinessRule.RuleType ruleType =
                ActiveContract.BusinessRule.RuleType.valueOf(request.ruleType.toUpperCase());

            ActiveContract.BusinessRule rule = new ActiveContract.BusinessRule(
                UUID.randomUUID().toString(),
                request.ruleName,
                ruleType
            );
            rule.setCondition(request.condition);
            rule.setAction(request.action);
            rule.setPriority(request.priority != null ? request.priority : 0);

            contract.addBusinessRule(rule);

            return Response.ok(Map.of(
                "success", true,
                "contractId", contractId,
                "ruleId", rule.getRuleId(),
                "message", "Business rule added successfully"
            )).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", "Invalid rule type: " + request.ruleType))
                .build();
        }
    }

    /**
     * Get business rules
     *
     * GET /api/v11/contracts/{contractId}/rules
     */
    @GET
    @Path("/{contractId}/rules")
    public Response getBusinessRules(
            @PathParam("contractId") String contractId,
            @QueryParam("type") String ruleType) {

        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        List<ActiveContract.BusinessRule> rules;
        if (ruleType != null) {
            try {
                ActiveContract.BusinessRule.RuleType type =
                    ActiveContract.BusinessRule.RuleType.valueOf(ruleType.toUpperCase());
                rules = contract.getActiveRulesByType(type);
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", "Invalid rule type"))
                    .build();
            }
        } else {
            rules = contract.getBusinessRules();
        }

        return Response.ok(Map.of(
            "contractId", contractId,
            "rules", rules.stream().map(r -> Map.of(
                "ruleId", r.getRuleId(),
                "ruleName", r.getRuleName(),
                "ruleType", r.getRuleType().name(),
                "condition", r.getCondition() != null ? r.getCondition() : "",
                "action", r.getAction() != null ? r.getAction() : "",
                "priority", r.getPriority(),
                "active", r.isActive()
            )).toList(),
            "count", rules.size()
        )).build();
    }

    // ==================== Audit and Traceability ====================

    /**
     * Get workflow history
     *
     * GET /api/v11/contracts/{contractId}/workflow-history
     */
    @GET
    @Path("/{contractId}/workflow-history")
    public Response getWorkflowHistory(@PathParam("contractId") String contractId) {
        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        return Response.ok(Map.of(
            "contractId", contractId,
            "currentStatus", contract.getStatus().name(),
            "history", contract.getWorkflowHistory().stream().map(t -> Map.of(
                "from", t.getFromStatus() != null ? t.getFromStatus().name() : "N/A",
                "to", t.getToStatus().name(),
                "initiatedBy", t.getInitiatedBy() != null ? t.getInitiatedBy() : "system",
                "reason", t.getReason(),
                "timestamp", t.getTimestamp().toString()
            )).toList()
        )).build();
    }

    /**
     * Get access audit log
     *
     * GET /api/v11/contracts/{contractId}/audit-log
     */
    @GET
    @Path("/{contractId}/audit-log")
    public Response getAuditLog(@PathParam("contractId") String contractId) {
        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        return Response.ok(Map.of(
            "contractId", contractId,
            "auditLog", contract.getAccessAuditLog().stream().map(a -> Map.of(
                "entryId", a.getEntryId(),
                "userAddress", a.getUserAddress(),
                "action", a.getAction(),
                "permission", a.getPermission().name(),
                "allowed", a.isAllowed(),
                "timestamp", a.getTimestamp().toString()
            )).toList()
        )).build();
    }

    /**
     * Get traceability links
     *
     * GET /api/v11/contracts/{contractId}/traceability
     */
    @GET
    @Path("/{contractId}/traceability")
    public Response getTraceabilityLinks(@PathParam("contractId") String contractId) {
        ActiveContract contract = topologyService.getContract(contractId);
        if (contract == null) {
            return Response.status(Response.Status.NOT_FOUND)
                .entity(Map.of("error", "Contract not found"))
                .build();
        }

        return Response.ok(Map.of(
            "contractId", contractId,
            "links", contract.getTraceabilityLinks().stream().map(l -> Map.of(
                "linkId", l.getLinkId(),
                "targetType", l.getTargetType(),
                "targetId", l.getTargetId(),
                "relationship", l.getRelationship(),
                "createdAt", l.getCreatedAt().toString()
            )).toList()
        )).build();
    }

    /**
     * Get service statistics
     *
     * GET /api/v11/contracts/stats
     */
    @GET
    @Path("/stats")
    public Response getStats() {
        return Response.ok(topologyService.getStats()).build();
    }

    /**
     * Health check
     */
    @GET
    @Path("/health")
    public Response health() {
        return Response.ok(Map.of(
            "status", "healthy",
            "service", "Composite Contract API",
            "version", "12.1.0"
        )).build();
    }

    // ==================== Helper Methods ====================

    private Map<String, Object> buildContractResponse(ActiveContract contract) {
        Map<String, Object> response = new HashMap<>();
        response.put("contractId", contract.getContractId());
        response.put("compositeTokenId", contract.getCompositeTokenId());
        response.put("version", contract.getVersion());
        response.put("ownerAddress", contract.getOwnerAddress());
        response.put("representativeAddress", contract.getRepresentativeAddress());
        response.put("status", contract.getStatus().name());
        response.put("statusDescription", contract.getStatus().getDescription());
        response.put("vvbVerified", contract.isVvbVerified());
        response.put("vvbVerifierId", contract.getVvbVerifierId());
        response.put("createdAt", contract.getCreatedAt().toString());
        response.put("effectiveDate", contract.getEffectiveDate() != null ? contract.getEffectiveDate().toString() : null);
        response.put("expirationDate", contract.getExpirationDate() != null ? contract.getExpirationDate().toString() : null);
        response.put("lastUpdated", contract.getLastUpdated().toString());
        response.put("roleCount", contract.getRoleAssignments().size());
        response.put("ruleCount", contract.getBusinessRules().size());
        response.put("registryId", contract.getRegistryId());
        return response;
    }

    private Map<String, Object> buildContractSummary(ActiveContract contract) {
        return Map.of(
            "contractId", contract.getContractId(),
            "status", contract.getStatus().name(),
            "ownerAddress", contract.getOwnerAddress(),
            "vvbVerified", contract.isVvbVerified(),
            "createdAt", contract.getCreatedAt().toString()
        );
    }
}

// ==================== Request DTOs ====================

class ContractCreateRequest {
    public String ownerAddress;
    public String representativeAddress;
    public String compositeTokenId;
    public String effectiveDate;
    public String expirationDate;
    public String ruleTemplateId;
    public String registryId;
}

class BindRequest {
    public String compositeTokenId;
}

class TransitionRequest {
    public String newStatus;
    public String reason;
}

class SuspendRequest {
    public String reason;
}

class TerminateRequest {
    public String reason;
}

class VVBVerifyRequest {
    public boolean approved;
    public String comments;
}

class RoleAssignRequest {
    public String address;
    public String role;
}

class BusinessRuleRequest {
    public String ruleName;
    public String ruleType;
    public String condition;
    public String action;
    public Integer priority;
}

package io.aurigraph.v11.identity;

import io.aurigraph.v11.crypto.DilithiumSignatureService;
import io.aurigraph.v11.identity.did.AurigraphDIDMethod;
import io.aurigraph.v11.identity.did.DIDDocument;
import io.aurigraph.v11.identity.did.DIDResolver;
import io.aurigraph.v11.identity.vc.VerifiableCredential;
import io.aurigraph.v11.identity.vc.VerifiableCredentialService;
import io.aurigraph.v11.identity.vc.VerifiablePresentation;
import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.parameters.RequestBody;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.security.KeyPair;
import java.time.Instant;
import java.util.*;

/**
 * DID and Verifiable Credentials REST Resource
 *
 * Provides REST API for Decentralized Identity operations:
 * - DID lifecycle (create, resolve, update, deactivate)
 * - Verifiable Credential issuance and verification
 * - Verifiable Presentation creation
 *
 * Endpoints:
 * - POST /api/v12/did - Create DID
 * - GET /api/v12/did/{did} - Resolve DID
 * - PUT /api/v12/did/{did} - Update DID
 * - DELETE /api/v12/did/{did} - Deactivate DID
 * - POST /api/v12/vc/issue - Issue credential
 * - POST /api/v12/vc/verify - Verify credential
 * - POST /api/v12/vp/create - Create presentation
 * - POST /api/v12/vp/verify - Verify presentation
 *
 * @version 12.0.0
 * @author Compliance & Audit Agent (CAA)
 */
@Path("/api/v12")
@ApplicationScoped
@Tag(name = "Decentralized Identity", description = "DID and Verifiable Credentials operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DIDResource {

    private static final Logger LOG = Logger.getLogger(DIDResource.class);

    @Inject
    AurigraphDIDMethod aurigraphDIDMethod;

    @Inject
    DIDResolver didResolver;

    @Inject
    VerifiableCredentialService vcService;

    @Inject
    DilithiumSignatureService dilithiumService;

    // ==================== DID Endpoints ====================

    /**
     * Create a new DID
     * POST /api/v12/did
     */
    @POST
    @Path("/did")
    @Operation(summary = "Create DID", description = "Create a new Aurigraph Decentralized Identifier")
    @APIResponses({
            @APIResponse(responseCode = "201", description = "DID created successfully"),
            @APIResponse(responseCode = "400", description = "Invalid request"),
            @APIResponse(responseCode = "500", description = "Internal server error")
    })
    public Uni<Response> createDID(
            @RequestBody(description = "DID creation request") DIDCreateRequest request) {

        LOG.infof("Creating DID on network: %s", request.network);

        return Uni.createFrom().item(() -> {
            try {
                // Validate request
                String network = request.network != null ? request.network : "mainnet";
                AurigraphDIDMethod.DIDKeyType keyType = parseKeyType(request.keyType);

                // Create DID with keys if no public key provided
                if (request.publicKey == null || request.publicKey.isEmpty()) {
                    AurigraphDIDMethod.DIDCreationResultWithKeys result =
                            aurigraphDIDMethod.createDIDWithKeys(network);

                    DIDCreateResponse response = new DIDCreateResponse();
                    response.did = result.getDid();
                    response.document = result.getDocument();
                    response.createdAt = Instant.now().toString();
                    response.network = network;
                    response.success = true;
                    response.message = "DID created successfully with auto-generated keys";

                    return Response.status(Response.Status.CREATED).entity(response).build();
                }

                // Create DID with provided public key
                List<AurigraphDIDMethod.ServiceEndpointRequest> services = null;
                if (request.services != null && !request.services.isEmpty()) {
                    services = request.services.stream()
                            .map(s -> new AurigraphDIDMethod.ServiceEndpointRequest(s.id, s.type, s.endpoint))
                            .toList();
                }

                AurigraphDIDMethod.DIDCreationResult result =
                        aurigraphDIDMethod.createDID(network, request.publicKey, services, keyType);

                DIDCreateResponse response = new DIDCreateResponse();
                response.did = result.getDid();
                response.document = result.getDocument();
                response.createdAt = result.getCreatedAt().toString();
                response.network = network;
                response.durationMs = result.getDurationMs();
                response.success = true;
                response.message = "DID created successfully";

                return Response.status(Response.Status.CREATED).entity(response).build();

            } catch (AurigraphDIDMethod.DIDAlreadyExistsException e) {
                return Response.status(Response.Status.CONFLICT)
                        .entity(errorResponse("DID already exists", e.getMessage()))
                        .build();
            } catch (IllegalArgumentException e) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(errorResponse("Invalid request", e.getMessage()))
                        .build();
            } catch (Exception e) {
                LOG.error("Failed to create DID", e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(errorResponse("DID creation failed", e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Resolve a DID
     * GET /api/v12/did/{did}
     */
    @GET
    @Path("/did/{did}")
    @Operation(summary = "Resolve DID", description = "Resolve a DID to its DID Document")
    @APIResponses({
            @APIResponse(responseCode = "200", description = "DID resolved successfully"),
            @APIResponse(responseCode = "404", description = "DID not found"),
            @APIResponse(responseCode = "410", description = "DID deactivated")
    })
    public Uni<Response> resolveDID(
            @Parameter(description = "The DID to resolve") @PathParam("did") String did) {

        LOG.infof("Resolving DID: %s", did);

        return Uni.createFrom().item(() -> {
            try {
                DIDResolver.ResolutionResult result = didResolver.resolve(did);

                DIDResolveResponse response = new DIDResolveResponse();
                response.did = did;
                response.document = result.getDocument();
                response.metadata = result.getMetadata();
                response.durationMs = result.getDurationMs();
                response.cacheHit = result.isCacheHit();

                if (!result.isSuccess()) {
                    if (result.getMetadata() != null && "notFound".equals(result.getMetadata().getError())) {
                        return Response.status(Response.Status.NOT_FOUND)
                                .entity(response)
                                .build();
                    }
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(response)
                            .build();
                }

                if (result.isDeactivated()) {
                    return Response.status(Response.Status.GONE)
                            .entity(response)
                            .build();
                }

                return Response.ok(response).build();

            } catch (Exception e) {
                LOG.error("Failed to resolve DID: " + did, e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(errorResponse("DID resolution failed", e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Update a DID Document
     * PUT /api/v12/did/{did}
     */
    @PUT
    @Path("/did/{did}")
    @Operation(summary = "Update DID", description = "Update a DID Document")
    @APIResponses({
            @APIResponse(responseCode = "200", description = "DID updated successfully"),
            @APIResponse(responseCode = "404", description = "DID not found"),
            @APIResponse(responseCode = "403", description = "Unauthorized")
    })
    public Uni<Response> updateDID(
            @Parameter(description = "The DID to update") @PathParam("did") String did,
            @RequestBody(description = "DID update request") DIDUpdateRequest request) {

        LOG.infof("Updating DID: %s", did);

        return Uni.createFrom().item(() -> {
            try {
                AurigraphDIDMethod.DIDUpdateRequest updates = new AurigraphDIDMethod.DIDUpdateRequest();

                if (request.addServices != null) {
                    List<DIDDocument.ServiceEndpoint> services = new ArrayList<>();
                    for (ServiceEndpointDTO s : request.addServices) {
                        DIDDocument.ServiceEndpoint se = new DIDDocument.ServiceEndpoint();
                        se.setId(s.id);
                        se.setType(s.type);
                        se.setServiceEndpoint(s.endpoint);
                        services.add(se);
                    }
                    updates.setAddServices(services);
                }

                if (request.removeServices != null) {
                    updates.setRemoveServices(request.removeServices);
                }

                // In production, proof would come from the request
                byte[] proof = new byte[32];
                new java.security.SecureRandom().nextBytes(proof);

                AurigraphDIDMethod.DIDUpdateResult result = aurigraphDIDMethod.update(did, updates, proof);

                DIDUpdateResponse response = new DIDUpdateResponse();
                response.did = result.getDid();
                response.document = result.getDocument();
                response.previousVersion = result.getPreviousVersion();
                response.newVersion = result.getNewVersion();
                response.updatedAt = result.getUpdatedAt().toString();
                response.durationMs = result.getDurationMs();
                response.success = true;

                return Response.ok(response).build();

            } catch (AurigraphDIDMethod.DIDNotFoundException e) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(errorResponse("DID not found", e.getMessage()))
                        .build();
            } catch (AurigraphDIDMethod.DIDAuthorizationException e) {
                return Response.status(Response.Status.FORBIDDEN)
                        .entity(errorResponse("Unauthorized", e.getMessage()))
                        .build();
            } catch (Exception e) {
                LOG.error("Failed to update DID: " + did, e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(errorResponse("DID update failed", e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Deactivate a DID
     * DELETE /api/v12/did/{did}
     */
    @DELETE
    @Path("/did/{did}")
    @Operation(summary = "Deactivate DID", description = "Deactivate a DID (cannot be undone)")
    @APIResponses({
            @APIResponse(responseCode = "200", description = "DID deactivated successfully"),
            @APIResponse(responseCode = "404", description = "DID not found"),
            @APIResponse(responseCode = "403", description = "Unauthorized")
    })
    public Uni<Response> deactivateDID(
            @Parameter(description = "The DID to deactivate") @PathParam("did") String did) {

        LOG.infof("Deactivating DID: %s", did);

        return Uni.createFrom().item(() -> {
            try {
                // In production, proof would come from authorization header
                byte[] proof = new byte[32];
                new java.security.SecureRandom().nextBytes(proof);

                AurigraphDIDMethod.DIDDeactivationResult result = aurigraphDIDMethod.deactivate(did, proof);

                return Response.ok(Map.of(
                        "did", result.getDid(),
                        "deactivatedAt", result.getDeactivatedAt().toString(),
                        "durationMs", result.getDurationMs(),
                        "success", true,
                        "message", "DID deactivated successfully"
                )).build();

            } catch (AurigraphDIDMethod.DIDNotFoundException e) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(errorResponse("DID not found", e.getMessage()))
                        .build();
            } catch (Exception e) {
                LOG.error("Failed to deactivate DID: " + did, e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(errorResponse("DID deactivation failed", e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Verifiable Credential Endpoints ====================

    /**
     * Issue a Verifiable Credential
     * POST /api/v12/vc/issue
     */
    @POST
    @Path("/vc/issue")
    @Operation(summary = "Issue Credential", description = "Issue a new Verifiable Credential")
    @APIResponses({
            @APIResponse(responseCode = "201", description = "Credential issued successfully"),
            @APIResponse(responseCode = "400", description = "Invalid request")
    })
    public Uni<Response> issueCredential(
            @RequestBody(description = "Credential issuance request") VCIssueRequest request) {

        LOG.infof("Issuing credential type %s for subject %s", request.credentialType, request.subjectDid);

        return Uni.createFrom().item(() -> {
            try {
                // Generate issuer key pair for signing
                KeyPair keyPair = dilithiumService.generateKeyPair();

                // Set up issuance options
                VerifiableCredentialService.IssuanceOptions options =
                        new VerifiableCredentialService.IssuanceOptions();
                if (request.expirationDate != null) {
                    options.setExpirationDate(Instant.parse(request.expirationDate));
                }
                if (request.issuerName != null) {
                    options.setIssuerName(request.issuerName);
                }

                // Issue the credential
                VerifiableCredentialService.IssuanceResult result = vcService.issueCredential(
                        request.issuerDid,
                        request.subjectDid,
                        request.credentialType,
                        request.claims,
                        keyPair.getPrivate(),
                        options,
                        VerifiableCredentialService.SignatureType.DILITHIUM
                );

                if (!result.isSuccess()) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(errorResponse("Issuance failed", result.error()))
                            .build();
                }

                VCIssueResponse response = new VCIssueResponse();
                response.credentialId = result.credentialId();
                response.credential = result.credential();
                response.issuedAt = result.issuedAt().toString();
                response.durationMs = result.durationMs();
                response.success = true;

                return Response.status(Response.Status.CREATED).entity(response).build();

            } catch (Exception e) {
                LOG.error("Failed to issue credential", e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(errorResponse("Credential issuance failed", e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Verify a Verifiable Credential
     * POST /api/v12/vc/verify
     */
    @POST
    @Path("/vc/verify")
    @Operation(summary = "Verify Credential", description = "Verify a Verifiable Credential")
    @APIResponses({
            @APIResponse(responseCode = "200", description = "Verification completed")
    })
    public Uni<Response> verifyCredential(
            @RequestBody(description = "Credential to verify") VerifiableCredential credential) {

        LOG.infof("Verifying credential: %s", credential.getId());

        return Uni.createFrom().item(() -> {
            try {
                VerifiableCredentialService.VerificationResult result = vcService.verifyCredential(credential);

                VCVerifyResponse response = new VCVerifyResponse();
                response.credentialId = result.credentialId();
                response.valid = result.isValid();
                response.errors = result.errors();
                response.warnings = result.warnings();
                response.verifiedAt = result.verifiedAt().toString();
                response.durationMs = result.durationMs();

                return Response.ok(response).build();

            } catch (Exception e) {
                LOG.error("Failed to verify credential", e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(errorResponse("Verification failed", e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Revoke a Verifiable Credential
     * POST /api/v12/vc/{credentialId}/revoke
     */
    @POST
    @Path("/vc/{credentialId}/revoke")
    @Operation(summary = "Revoke Credential", description = "Revoke a Verifiable Credential")
    @APIResponses({
            @APIResponse(responseCode = "200", description = "Credential revoked successfully"),
            @APIResponse(responseCode = "404", description = "Credential not found")
    })
    public Uni<Response> revokeCredential(
            @Parameter(description = "Credential ID to revoke") @PathParam("credentialId") String credentialId,
            @RequestBody(description = "Revocation request") VCRevokeRequest request) {

        LOG.infof("Revoking credential: %s", credentialId);

        return Uni.createFrom().item(() -> {
            try {
                VerifiableCredentialService.RevocationResult result =
                        vcService.revokeCredential(credentialId, request.reason, request.revokerDid);

                if (!result.isSuccess()) {
                    return Response.status(Response.Status.BAD_REQUEST)
                            .entity(errorResponse("Revocation failed", result.error()))
                            .build();
                }

                return Response.ok(Map.of(
                        "credentialId", credentialId,
                        "revoked", true,
                        "reason", request.reason,
                        "revokedAt", result.entry().getRevokedAt().toString(),
                        "success", true
                )).build();

            } catch (Exception e) {
                LOG.error("Failed to revoke credential: " + credentialId, e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(errorResponse("Revocation failed", e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Verifiable Presentation Endpoints ====================

    /**
     * Create a Verifiable Presentation
     * POST /api/v12/vp/create
     */
    @POST
    @Path("/vp/create")
    @Operation(summary = "Create Presentation", description = "Create a Verifiable Presentation")
    @APIResponses({
            @APIResponse(responseCode = "201", description = "Presentation created successfully"),
            @APIResponse(responseCode = "400", description = "Invalid request")
    })
    public Uni<Response> createPresentation(
            @RequestBody(description = "Presentation creation request") VPCreateRequest request) {

        LOG.infof("Creating presentation for holder: %s", request.holderDid);

        return Uni.createFrom().item(() -> {
            try {
                // Get credentials
                List<VerifiableCredential> credentials = new ArrayList<>();
                for (String credentialId : request.credentialIds) {
                    Optional<VerifiableCredential> vc = vcService.getCredential(credentialId);
                    if (vc.isEmpty()) {
                        return Response.status(Response.Status.BAD_REQUEST)
                                .entity(errorResponse("Credential not found", credentialId))
                                .build();
                    }
                    credentials.add(vc.get());
                }

                // Create presentation
                VerifiablePresentation presentation =
                        VerifiablePresentation.createFromCredentials(request.holderDid, credentials);

                // Add proof
                VerifiablePresentation.PresentationProof proof = new VerifiablePresentation.PresentationProof(
                        "DilithiumSignature2023",
                        request.holderDid + "#key-1",
                        request.challenge,
                        request.domain
                );
                proof.setProofValue("z" + Base64.getEncoder().encodeToString(new byte[256])); // Placeholder
                presentation.setProof(proof);

                VPCreateResponse response = new VPCreateResponse();
                response.presentationId = presentation.getId();
                response.presentation = presentation;
                response.createdAt = Instant.now().toString();
                response.success = true;

                return Response.status(Response.Status.CREATED).entity(response).build();

            } catch (Exception e) {
                LOG.error("Failed to create presentation", e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(errorResponse("Presentation creation failed", e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Verify a Verifiable Presentation
     * POST /api/v12/vp/verify
     */
    @POST
    @Path("/vp/verify")
    @Operation(summary = "Verify Presentation", description = "Verify a Verifiable Presentation")
    @APIResponses({
            @APIResponse(responseCode = "200", description = "Verification completed")
    })
    public Uni<Response> verifyPresentation(
            @RequestBody(description = "Presentation to verify") VerifiablePresentation presentation) {

        LOG.infof("Verifying presentation: %s", presentation.getId());

        return Uni.createFrom().item(() -> {
            try {
                List<String> errors = new ArrayList<>();
                List<String> warnings = new ArrayList<>();

                // Validate presentation structure
                VerifiablePresentation.ValidationResult structureResult = presentation.validate();
                if (!structureResult.isValid()) {
                    errors.addAll(structureResult.errors());
                }

                // Verify each credential
                for (VerifiableCredential credential : presentation.getCredentials()) {
                    VerifiableCredentialService.VerificationResult vcResult =
                            vcService.verifyCredential(credential);
                    if (!vcResult.isValid()) {
                        for (String error : vcResult.errors()) {
                            errors.add("Credential " + credential.getId() + ": " + error);
                        }
                    }
                    warnings.addAll(vcResult.warnings());
                }

                // Verify holder binding
                if (!presentation.isHolderSubjectOfAllCredentials()) {
                    warnings.add("Holder is not the subject of all credentials");
                }

                VPVerifyResponse response = new VPVerifyResponse();
                response.presentationId = presentation.getId();
                response.valid = errors.isEmpty();
                response.errors = errors;
                response.warnings = warnings;
                response.credentialsVerified = presentation.getCredentialCount();
                response.verifiedAt = Instant.now().toString();

                return Response.ok(response).build();

            } catch (Exception e) {
                LOG.error("Failed to verify presentation", e);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(errorResponse("Verification failed", e.getMessage()))
                        .build();
            }
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Statistics Endpoint ====================

    /**
     * Get DID and VC statistics
     * GET /api/v12/identity/stats
     */
    @GET
    @Path("/identity/stats")
    @Operation(summary = "Get Identity Statistics", description = "Get DID and VC statistics")
    @APIResponse(responseCode = "200", description = "Statistics retrieved successfully")
    public Uni<Response> getStatistics() {
        return Uni.createFrom().item(() -> {
            Map<String, Object> stats = new LinkedHashMap<>();

            // DID statistics
            Map<String, Object> didStats = new LinkedHashMap<>();
            didStats.put("totalDIDs", aurigraphDIDMethod.getAllDIDs().size());
            didStats.put("byNetwork", aurigraphDIDMethod.getDIDCountByNetwork());
            stats.put("dids", didStats);

            // Resolver statistics
            DIDResolver.ResolverStatistics resolverStats = didResolver.getStatistics();
            Map<String, Object> resolverStatsMap = new LinkedHashMap<>();
            resolverStatsMap.put("totalResolutions", resolverStats.totalResolutions());
            resolverStatsMap.put("cacheHits", resolverStats.cacheHits());
            resolverStatsMap.put("cacheMisses", resolverStats.cacheMisses());
            resolverStatsMap.put("hitRate", String.format("%.2f%%", resolverStats.hitRate() * 100));
            stats.put("resolver", resolverStatsMap);

            // VC statistics
            VerifiableCredentialService.ServiceStatistics vcStats = vcService.getStatistics();
            Map<String, Object> vcStatsMap = new LinkedHashMap<>();
            vcStatsMap.put("issuedCredentials", vcStats.issuedCredentials());
            vcStatsMap.put("verifiedCredentials", vcStats.verifiedCredentials());
            vcStatsMap.put("revokedCredentials", vcStats.revokedCredentials());
            vcStatsMap.put("failedVerifications", vcStats.failedVerifications());
            stats.put("credentials", vcStatsMap);

            stats.put("timestamp", System.currentTimeMillis());

            return Response.ok(stats).build();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Helper Methods ====================

    private AurigraphDIDMethod.DIDKeyType parseKeyType(String keyType) {
        if (keyType == null) {
            return AurigraphDIDMethod.DIDKeyType.DILITHIUM;
        }
        return switch (keyType.toLowerCase()) {
            case "ed25519" -> AurigraphDIDMethod.DIDKeyType.ED25519;
            case "hybrid" -> AurigraphDIDMethod.DIDKeyType.HYBRID;
            default -> AurigraphDIDMethod.DIDKeyType.DILITHIUM;
        };
    }

    private Map<String, Object> errorResponse(String error, String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", false);
        response.put("error", error);
        response.put("message", message);
        response.put("timestamp", System.currentTimeMillis());
        return response;
    }

    // ==================== Request/Response DTOs ====================

    public static class DIDCreateRequest {
        public String network;
        public String publicKey;
        public String keyType;
        public List<ServiceEndpointDTO> services;
    }

    public static class ServiceEndpointDTO {
        public String id;
        public String type;
        public Object endpoint;
    }

    public static class DIDCreateResponse {
        public String did;
        public DIDDocument document;
        public String createdAt;
        public String network;
        public long durationMs;
        public boolean success;
        public String message;
    }

    public static class DIDResolveResponse {
        public String did;
        public DIDDocument document;
        public DIDResolver.ResolutionMetadata metadata;
        public long durationMs;
        public boolean cacheHit;
    }

    public static class DIDUpdateRequest {
        public List<ServiceEndpointDTO> addServices;
        public List<String> removeServices;
        public List<VerificationMethodDTO> addVerificationMethods;
        public List<String> removeVerificationMethods;
    }

    public static class VerificationMethodDTO {
        public String id;
        public String type;
        public String publicKeyMultibase;
    }

    public static class DIDUpdateResponse {
        public String did;
        public DIDDocument document;
        public String previousVersion;
        public String newVersion;
        public String updatedAt;
        public long durationMs;
        public boolean success;
    }

    public static class VCIssueRequest {
        public String issuerDid;
        public String subjectDid;
        public String credentialType;
        public Map<String, Object> claims;
        public String expirationDate;
        public String issuerName;
    }

    public static class VCIssueResponse {
        public String credentialId;
        public VerifiableCredential credential;
        public String issuedAt;
        public long durationMs;
        public boolean success;
    }

    public static class VCVerifyResponse {
        public String credentialId;
        public boolean valid;
        public List<String> errors;
        public List<String> warnings;
        public String verifiedAt;
        public long durationMs;
    }

    public static class VCRevokeRequest {
        public String reason;
        public String revokerDid;
    }

    public static class VPCreateRequest {
        public String holderDid;
        public List<String> credentialIds;
        public String challenge;
        public String domain;
    }

    public static class VPCreateResponse {
        public String presentationId;
        public VerifiablePresentation presentation;
        public String createdAt;
        public boolean success;
    }

    public static class VPVerifyResponse {
        public String presentationId;
        public boolean valid;
        public List<String> errors;
        public List<String> warnings;
        public int credentialsVerified;
        public String verifiedAt;
    }
}

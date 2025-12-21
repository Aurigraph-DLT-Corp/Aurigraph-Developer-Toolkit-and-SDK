package io.aurigraph.v11.contracts;

import io.aurigraph.v11.contracts.EINodeDataService.*;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

/**
 * EI Node Data REST API Resource
 *
 * Provides REST endpoints for External Integration Node data management:
 * - Register data sources (stakeholder, EI node)
 * - Push and fetch data
 * - Validate and attest data
 * - Get tokenized data
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
@Path("/api/v12/contracts/{contractId}/data")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class EINodeDataResource {

    private static final Logger LOGGER = LoggerFactory.getLogger(EINodeDataResource.class);

    @Inject
    EINodeDataService eiNodeDataService;

    /**
     * Register stakeholder data source and push initial data
     *
     * POST /api/v12/contracts/{contractId}/data/stakeholder
     *
     * Request body:
     * {
     *   "stakeholderId": "SH-001",
     *   "dataType": "CARBON",
     *   "data": { "credits": 1000, "vintage": 2024 }
     * }
     *
     * @param contractId Contract ID
     * @param request Stakeholder data request
     * @return Created data record
     */
    @POST
    @Path("/stakeholder")
    public Uni<Response> registerStakeholderData(
            @PathParam("contractId") String contractId,
            StakeholderDataRequest request
    ) {
        LOGGER.info("REST: Register stakeholder data for contract {}: {}", contractId, request.getStakeholderId());

        return eiNodeDataService.registerStakeholderData(
                contractId,
                request.getStakeholderId(),
                request.getDataType(),
                request.getData()
            )
            .map(record -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "status", "registered",
                    "dataRecord", record
                )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Stakeholder data registration failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Register EI node data source and push data
     *
     * POST /api/v12/contracts/{contractId}/data/ei-node
     *
     * Request body:
     * {
     *   "eiNodeId": "EI-BINANCE-001",
     *   "type": "CRYPTO_EXCHANGE",
     *   "endpoint": "https://api.binance.com",
     *   "data": { "symbol": "BTC/USDT", "price": 45000 }
     * }
     *
     * @param contractId Contract ID
     * @param request EI Node data request
     * @return Created data record
     */
    @POST
    @Path("/ei-node")
    public Uni<Response> registerEINodeData(
            @PathParam("contractId") String contractId,
            EINodeDataRequest request
    ) {
        LOGGER.info("REST: Register EI node data for contract {}: {}", contractId, request.getEiNodeId());

        // First register the data source
        DataSourceType sourceType = mapStringToDataSourceType(request.getType());

        return eiNodeDataService.registerDataSource(contractId, request.getEiNodeId(), sourceType, request.getEndpoint())
            .flatMap(source -> {
                // Then push the data
                if (request.getData() != null && !request.getData().isEmpty()) {
                    return eiNodeDataService.pushData(contractId, request.getEiNodeId(), request.getData())
                        .map(record -> Response.status(Response.Status.CREATED)
                            .entity(Map.of(
                                "status", "registered",
                                "dataSource", source,
                                "dataRecord", record
                            )).build());
                }
                return Uni.createFrom().item(Response.status(Response.Status.CREATED)
                    .entity(Map.of(
                        "status", "registered",
                        "dataSource", source
                    )).build());
            })
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("EI Node data registration failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get all data sources for a contract
     *
     * GET /api/v12/contracts/{contractId}/data/sources
     *
     * @param contractId Contract ID
     * @return List of data sources
     */
    @GET
    @Path("/sources")
    public Uni<Response> getDataSources(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get data sources for contract {}", contractId);

        return eiNodeDataService.getDataSources(contractId)
            .map(sources -> Response.ok(Map.of(
                "contractId", contractId,
                "sources", sources,
                "count", sources.size()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Get data sources failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Fetch data for a contract
     *
     * GET /api/v12/contracts/{contractId}/data?eiNodeId=xxx
     *
     * @param contractId Contract ID
     * @param eiNodeId Optional EI Node ID filter
     * @return Data from EI nodes
     */
    @GET
    public Uni<Response> fetchData(
            @PathParam("contractId") String contractId,
            @QueryParam("eiNodeId") String eiNodeId
    ) {
        LOGGER.info("REST: Fetch data for contract {}, eiNodeId: {}", contractId, eiNodeId);

        return eiNodeDataService.fetchData(contractId, eiNodeId)
            .map(data -> Response.ok(Map.of(
                "contractId", contractId,
                "data", data
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Fetch data failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Push data from EI node
     *
     * POST /api/v12/contracts/{contractId}/data/push
     *
     * Request body:
     * {
     *   "eiNodeId": "EI-001",
     *   "data": { "value": 123, "timestamp": "2024-01-01T00:00:00Z" }
     * }
     *
     * @param contractId Contract ID
     * @param request Data push request
     * @return Created data record
     */
    @POST
    @Path("/push")
    public Uni<Response> pushData(
            @PathParam("contractId") String contractId,
            DataPushRequest request
    ) {
        LOGGER.info("REST: Push data from EI node {} to contract {}", request.getEiNodeId(), contractId);

        return eiNodeDataService.pushData(contractId, request.getEiNodeId(), request.getData())
            .map(record -> Response.status(Response.Status.CREATED)
                .entity(Map.of(
                    "status", "pushed",
                    "dataRecord", record
                )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Push data failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Validate submitted data
     *
     * POST /api/v12/contracts/{contractId}/data/validate
     *
     * Request body:
     * {
     *   "dataId": "DATA-001"
     * }
     *
     * @param contractId Contract ID
     * @param request Validation request
     * @return Validation result
     */
    @POST
    @Path("/validate")
    public Uni<Response> validateData(
            @PathParam("contractId") String contractId,
            DataValidationRequest request
    ) {
        LOGGER.info("REST: Validate data {} for contract {}", request.getDataId(), contractId);

        return eiNodeDataService.validateData(contractId, request.getDataId())
            .map(result -> Response.ok(Map.of(
                "status", result.isValid() ? "valid" : "invalid",
                "validation", result
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Data validation failed: {}", error.getMessage());
                if (error instanceof DataRecordNotFoundException) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Request VVB attestation for data
     *
     * POST /api/v12/contracts/{contractId}/data/attest
     *
     * Request body:
     * {
     *   "dataId": "DATA-001"
     * }
     *
     * @param contractId Contract ID
     * @param request Attestation request
     * @return Data attestation
     */
    @POST
    @Path("/attest")
    public Uni<Response> attestData(
            @PathParam("contractId") String contractId,
            DataValidationRequest request
    ) {
        LOGGER.info("REST: Attest data {} for contract {}", request.getDataId(), contractId);

        return eiNodeDataService.attestData(contractId, request.getDataId())
            .map(attestation -> Response.ok(Map.of(
                "status", "attested",
                "attestation", attestation
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Data attestation failed: {}", error.getMessage());
                if (error instanceof DataRecordNotFoundException) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Tokenize validated data
     *
     * POST /api/v12/contracts/{contractId}/data/tokenize
     *
     * Request body:
     * {
     *   "dataId": "DATA-001"
     * }
     *
     * @param contractId Contract ID
     * @param request Tokenization request
     * @return Tokenized data
     */
    @POST
    @Path("/tokenize")
    public Uni<Response> tokenizeData(
            @PathParam("contractId") String contractId,
            DataValidationRequest request
    ) {
        LOGGER.info("REST: Tokenize data {} for contract {}", request.getDataId(), contractId);

        return eiNodeDataService.tokenizeData(contractId, request.getDataId())
            .map(tokenized -> Response.ok(Map.of(
                "status", "tokenized",
                "tokenizedData", tokenized
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Data tokenization failed: {}", error.getMessage());
                if (error instanceof DataRecordNotFoundException) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get tokenized data for a contract
     *
     * GET /api/v12/contracts/{contractId}/data/tokenized
     *
     * @param contractId Contract ID
     * @return List of tokenized data
     */
    @GET
    @Path("/tokenized")
    public Uni<Response> getTokenizedData(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get tokenized data for contract {}", contractId);

        return eiNodeDataService.getTokenizedData(contractId)
            .map(tokenized -> Response.ok(Map.of(
                "contractId", contractId,
                "tokenizedData", tokenized,
                "count", tokenized.size()
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Get tokenized data failed: {}", error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get data record by ID
     *
     * GET /api/v12/contracts/{contractId}/data/record/{dataId}
     *
     * @param contractId Contract ID
     * @param dataId Data record ID
     * @return Data record
     */
    @GET
    @Path("/record/{dataId}")
    public Uni<Response> getDataRecord(
            @PathParam("contractId") String contractId,
            @PathParam("dataId") String dataId
    ) {
        LOGGER.info("REST: Get data record {} for contract {}", dataId, contractId);

        return eiNodeDataService.getDataRecord(dataId)
            .map(record -> Response.ok(record).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Get data record failed: {}", error.getMessage());
                if (error instanceof DataRecordNotFoundException) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get data attestation
     *
     * GET /api/v12/contracts/{contractId}/data/attestation/{dataId}
     *
     * @param contractId Contract ID
     * @param dataId Data record ID
     * @return Data attestation
     */
    @GET
    @Path("/attestation/{dataId}")
    public Uni<Response> getDataAttestation(
            @PathParam("contractId") String contractId,
            @PathParam("dataId") String dataId
    ) {
        LOGGER.info("REST: Get data attestation for {} in contract {}", dataId, contractId);

        return eiNodeDataService.getDataAttestation(dataId)
            .map(attestation -> Response.ok(attestation).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.error("Get data attestation failed: {}", error.getMessage());
                if (error instanceof DataAttestationNotFoundException) {
                    return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", error.getMessage()))
                        .build();
                }
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", error.getMessage()))
                    .build();
            });
    }

    /**
     * Get EI Node data service metrics
     *
     * GET /api/v12/contracts/{contractId}/data/metrics
     *
     * @return Metrics
     */
    @GET
    @Path("/metrics")
    public Response getMetrics(@PathParam("contractId") String contractId) {
        LOGGER.info("REST: Get EI Node data metrics");
        return Response.ok(eiNodeDataService.getMetrics()).build();
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private DataSourceType mapStringToDataSourceType(String type) {
        if (type == null) return DataSourceType.IOT;
        return switch (type.toUpperCase()) {
            case "CRYPTO_EXCHANGE", "CRYPTO", "EXCHANGE" -> DataSourceType.CRYPTO_EXCHANGE;
            case "CARBON_REGISTRY", "CARBON", "REGISTRY" -> DataSourceType.CARBON_REGISTRY;
            case "ORACLE" -> DataSourceType.ORACLE;
            default -> DataSourceType.IOT;
        };
    }

    // ============================================
    // REQUEST CLASSES
    // ============================================

    /**
     * EI Node Data Request
     */
    public static class EINodeDataRequest {
        private String eiNodeId;
        private String type;
        private String endpoint;
        private Map<String, Object> data;

        public String getEiNodeId() { return eiNodeId; }
        public void setEiNodeId(String eiNodeId) { this.eiNodeId = eiNodeId; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
    }
}

package io.aurigraph.v11.smartcontract;

import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Smart Contract REST API Resource
 *
 * Provides RESTful endpoints for smart contract operations on Aurigraph DLT.
 * Supports deployment, execution, querying, and management of smart contracts.
 *
 * @version 11.2.1
 * @since 2025-10-12
 */
@Path("/api/v12/contracts")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Smart Contracts", description = "Smart Contract SDK API")
public class SmartContractResource {

    private static final Logger LOGGER = Logger.getLogger(SmartContractResource.class.getName());

    @Inject
    SmartContractService contractService;

    /**
     * Deploy a new smart contract
     *
     * POST /api/v12/contracts/deploy
     */
    @POST
    @Path("/deploy")
    @Operation(
        summary = "Deploy Smart Contract",
        description = "Deploy a new smart contract to the Aurigraph blockchain"
    )
    public Uni<Response> deployContract(SmartContract contract) {
        LOGGER.info("API: Deploying smart contract: " + contract.getName());

        return contractService.deployContract(contract)
            .map(deployed -> Response.ok(Map.of(
                "success", true,
                "message", "Contract deployed successfully",
                "contract", deployed
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.severe("Failed to deploy contract: " + error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage()
                    ))
                    .build();
            });
    }

    /**
     * Execute a smart contract method
     *
     * POST /api/v12/contracts/{contractId}/execute
     */
    @POST
    @Path("/{contractId}/execute")
    @Operation(
        summary = "Execute Contract Method",
        description = "Execute a method on a deployed smart contract"
    )
    public Uni<Response> executeContract(
            @PathParam("contractId") String contractId,
            Map<String, Object> request
    ) {
        String method = (String) request.get("method");
        @SuppressWarnings("unchecked")
        Map<String, Object> parameters = (Map<String, Object>) request.getOrDefault("parameters", Map.of());
        String caller = (String) request.getOrDefault("caller", "anonymous");

        LOGGER.info(String.format("API: Executing contract %s, method: %s", contractId, method));

        return contractService.executeContract(contractId, method, parameters, caller)
            .map(execution -> Response.ok(Map.of(
                "success", true,
                "message", "Contract executed successfully",
                "execution", execution
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.severe("Failed to execute contract: " + error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage()
                    ))
                    .build();
            });
    }

    /**
     * Get contract by ID
     *
     * GET /api/v12/contracts/{contractId}
     */
    @GET
    @Path("/{contractId}")
    @Operation(
        summary = "Get Contract",
        description = "Retrieve smart contract details by ID"
    )
    public Uni<Response> getContract(@PathParam("contractId") String contractId) {
        LOGGER.info("API: Getting contract: " + contractId);

        return contractService.getContract(contractId)
            .map(contract -> Response.ok(Map.of(
                "success", true,
                "contract", contract
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.severe("Failed to get contract: " + error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage()
                    ))
                    .build();
            });
    }

    /**
     * List all contracts
     *
     * GET /api/v12/contracts
     */
    @GET
    @Operation(
        summary = "List Contracts",
        description = "Retrieve all deployed smart contracts"
    )
    public Uni<Response> listContracts(@QueryParam("owner") String owner) {
        LOGGER.info("API: Listing contracts" + (owner != null ? " for owner: " + owner : ""));

        Uni<List<SmartContract>> contractsUni = owner != null
            ? contractService.listContractsByOwner(owner)
            : contractService.listContracts();

        return contractsUni
            .map(contracts -> Response.ok(Map.of(
                "success", true,
                "count", contracts.size(),
                "contracts", contracts
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.severe("Failed to list contracts: " + error.getMessage());
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage()
                    ))
                    .build();
            });
    }

    /**
     * Get contract execution history
     *
     * GET /api/v12/contracts/{contractId}/executions
     */
    @GET
    @Path("/{contractId}/executions")
    @Operation(
        summary = "Get Execution History",
        description = "Retrieve execution history for a smart contract"
    )
    public Uni<Response> getExecutionHistory(@PathParam("contractId") String contractId) {
        LOGGER.info("API: Getting execution history for contract: " + contractId);

        return contractService.getExecutionHistory(contractId)
            .map(history -> Response.ok(Map.of(
                "success", true,
                "contractId", contractId,
                "count", history.size(),
                "executions", history
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.severe("Failed to get execution history: " + error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage()
                    ))
                    .build();
            });
    }

    /**
     * Get execution by ID
     *
     * GET /api/v12/contracts/executions/{executionId}
     */
    @GET
    @Path("/executions/{executionId}")
    @Operation(
        summary = "Get Execution",
        description = "Retrieve execution details by ID"
    )
    public Uni<Response> getExecution(@PathParam("executionId") String executionId) {
        LOGGER.info("API: Getting execution: " + executionId);

        return contractService.getExecution(executionId)
            .map(execution -> Response.ok(Map.of(
                "success", true,
                "execution", execution
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.severe("Failed to get execution: " + error.getMessage());
                return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage()
                    ))
                    .build();
            });
    }

    /**
     * Update contract state
     *
     * PUT /api/v12/contracts/{contractId}/state
     */
    @PUT
    @Path("/{contractId}/state")
    @Operation(
        summary = "Update Contract State",
        description = "Update the state of a smart contract"
    )
    public Uni<Response> updateContractState(
            @PathParam("contractId") String contractId,
            Map<String, Object> newState
    ) {
        LOGGER.info("API: Updating state for contract: " + contractId);

        return contractService.updateContractState(contractId, newState)
            .map(contract -> Response.ok(Map.of(
                "success", true,
                "message", "Contract state updated",
                "contract", contract
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.severe("Failed to update contract state: " + error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage()
                    ))
                    .build();
            });
    }

    /**
     * Pause contract
     *
     * POST /api/v12/contracts/{contractId}/pause
     */
    @POST
    @Path("/{contractId}/pause")
    @Operation(
        summary = "Pause Contract",
        description = "Pause execution of a smart contract"
    )
    public Uni<Response> pauseContract(@PathParam("contractId") String contractId) {
        LOGGER.info("API: Pausing contract: " + contractId);

        return contractService.pauseContract(contractId)
            .map(contract -> Response.ok(Map.of(
                "success", true,
                "message", "Contract paused",
                "contract", contract
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.severe("Failed to pause contract: " + error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage()
                    ))
                    .build();
            });
    }

    /**
     * Resume contract
     *
     * POST /api/v12/contracts/{contractId}/resume
     */
    @POST
    @Path("/{contractId}/resume")
    @Operation(
        summary = "Resume Contract",
        description = "Resume execution of a paused smart contract"
    )
    public Uni<Response> resumeContract(@PathParam("contractId") String contractId) {
        LOGGER.info("API: Resuming contract: " + contractId);

        return contractService.resumeContract(contractId)
            .map(contract -> Response.ok(Map.of(
                "success", true,
                "message", "Contract resumed",
                "contract", contract
            )).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.severe("Failed to resume contract: " + error.getMessage());
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                        "success", false,
                        "error", error.getMessage()
                    ))
                    .build();
            });
    }

    /**
     * Get SDK info
     *
     * GET /api/v12/contracts/sdk/info
     */
    @GET
    @Path("/sdk/info")
    @Operation(
        summary = "SDK Information",
        description = "Get Smart Contract SDK information and capabilities"
    )
    public Response getSdkInfo() {
        return Response.ok(Map.of(
            "success", true,
            "sdk", Map.of(
                "name", "Aurigraph Smart Contract SDK",
                "version", "12.0.0",
                "platform", "Aurigraph DLT",
                "supportedLanguages", List.of("SOLIDITY", "JAVA", "JAVASCRIPT", "WASM", "PYTHON"),
                "features", List.of(
                    "Contract Deployment",
                    "Method Execution",
                    "State Management",
                    "Gas Metering",
                    "Execution History",
                    "Contract Pause/Resume"
                ),
                "endpoints", Map.of(
                    "deploy", "POST /api/v12/contracts/deploy",
                    "execute", "POST /api/v12/contracts/{contractId}/execute",
                    "getContract", "GET /api/v12/contracts/{contractId}",
                    "listContracts", "GET /api/v12/contracts",
                    "getExecutions", "GET /api/v12/contracts/{contractId}/executions",
                    "statistics", "GET /api/v12/contracts/statistics"
                )
            )
        )).build();
    }

    /**
     * Get contract statistics
     *
     * GET /api/v12/contracts/statistics
     */
    @GET
    @Path("/statistics")
    @Operation(
        summary = "Get Contract Statistics",
        description = "Retrieve statistics about deployed smart contracts"
    )
    public Uni<Response> getStatistics() {
        LOGGER.info("API: Getting contract statistics");

        return contractService.getStatistics()
            .map(stats -> Response.ok(stats).build())
            .onFailure().recoverWithItem(error -> {
                LOGGER.warning("Failed to get statistics, returning defaults: " + error.getMessage());
                return Response.ok(Map.of(
                    "totalContracts", 0,
                    "activeContracts", 0,
                    "totalExecutions", 0,
                    "successRate", 0.0
                )).build();
            });
    }

    /**
     * Get contract templates
     *
     * GET /api/v12/contracts/templates
     */
    @GET
    @Path("/templates")
    @Operation(
        summary = "Get Contract Templates",
        description = "Retrieve available smart contract templates for deployment"
    )
    public Response getTemplates() {
        LOGGER.info("API: Getting contract templates");

        List<Map<String, Object>> templates = List.of(
            Map.of(
                "id", "template-erc20",
                "name", "Token Contract",
                "description", "ERC20-compatible token contract with minting and burning",
                "category", "DeFi",
                "complexity", "simple",
                "estimatedGas", 250000,
                "parameters", List.of(
                    Map.of("name", "name", "type", "string", "description", "Token name", "required", true),
                    Map.of("name", "symbol", "type", "string", "description", "Token symbol", "required", true),
                    Map.of("name", "totalSupply", "type", "uint256", "description", "Initial supply", "required", true)
                )
            ),
            Map.of(
                "id", "template-rwa",
                "name", "RWA Asset Registry",
                "description", "Real-world asset tokenization with fractional ownership",
                "category", "RWA",
                "complexity", "complex",
                "estimatedGas", 750000,
                "parameters", List.of(
                    Map.of("name", "assetName", "type", "string", "description", "Asset name", "required", true),
                    Map.of("name", "assetValue", "type", "uint256", "description", "Total asset value", "required", true),
                    Map.of("name", "shares", "type", "uint256", "description", "Number of shares", "required", true)
                )
            ),
            Map.of(
                "id", "template-supply-chain",
                "name", "Supply Chain Tracker",
                "description", "Track products through supply chain with provenance",
                "category", "Supply Chain",
                "complexity", "medium",
                "estimatedGas", 450000,
                "parameters", List.of(
                    Map.of("name", "productId", "type", "string", "description", "Product identifier", "required", true),
                    Map.of("name", "origin", "type", "string", "description", "Origin location", "required", true)
                )
            ),
            Map.of(
                "id", "template-nft",
                "name", "NFT Collection",
                "description", "ERC721-compatible NFT collection with metadata",
                "category", "NFT",
                "complexity", "medium",
                "estimatedGas", 350000,
                "parameters", List.of(
                    Map.of("name", "collectionName", "type", "string", "description", "Collection name", "required", true),
                    Map.of("name", "symbol", "type", "string", "description", "Collection symbol", "required", true),
                    Map.of("name", "baseURI", "type", "string", "description", "Base metadata URI", "required", false)
                )
            ),
            Map.of(
                "id", "template-governance",
                "name", "DAO Governance",
                "description", "Decentralized governance with proposals and voting",
                "category", "Governance",
                "complexity", "complex",
                "estimatedGas", 850000,
                "parameters", List.of(
                    Map.of("name", "daoName", "type", "string", "description", "DAO name", "required", true),
                    Map.of("name", "votingPeriod", "type", "uint256", "description", "Voting period in blocks", "required", true),
                    Map.of("name", "quorum", "type", "uint256", "description", "Quorum percentage", "required", true)
                )
            ),
            Map.of(
                "id", "template-escrow",
                "name", "Escrow Contract",
                "description", "Secure escrow for multi-party transactions",
                "category", "Financial",
                "complexity", "simple",
                "estimatedGas", 200000,
                "parameters", List.of(
                    Map.of("name", "buyer", "type", "address", "description", "Buyer address", "required", true),
                    Map.of("name", "seller", "type", "address", "description", "Seller address", "required", true),
                    Map.of("name", "arbiter", "type", "address", "description", "Arbiter address", "required", true)
                )
            )
        );

        return Response.ok(Map.of(
            "success", true,
            "templates", templates,
            "count", templates.size()
        )).build();
    }
}

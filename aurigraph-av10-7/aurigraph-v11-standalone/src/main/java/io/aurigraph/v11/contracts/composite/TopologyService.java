package io.aurigraph.v11.contracts.composite;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.logging.Log;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Topology Service - Business logic for Token Topology generation
 *
 * Provides methods to generate topology visualizations for:
 * - Composite Tokens
 * - Active Contracts
 * - Token relationships and navigation paths
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-605-02
 */
@ApplicationScoped
public class TopologyService {

    @Inject
    CompositeTokenFactory compositeTokenFactory;

    // In-memory cache for contracts (would be replaced with repository in production)
    private final Map<String, ActiveContract> contractCache = new ConcurrentHashMap<>();
    private final Map<String, TokenTopology> topologyCache = new ConcurrentHashMap<>();

    /**
     * Get topology for a composite token
     */
    public Uni<TokenTopology> getTopologyForCompositeToken(String compositeId, int depth, boolean includeVerifiers) {
        return compositeTokenFactory.getCompositeToken(compositeId)
            .map(compositeToken -> {
                if (compositeToken == null) {
                    return null;
                }

                TokenTopology topology = TokenTopology.fromCompositeToken(compositeToken);

                // Add VVB verifiers if requested
                if (includeVerifiers && compositeToken.getVvbVerifications() != null) {
                    addVerifierNodes(topology, compositeToken);
                }

                // Cache the topology
                topologyCache.put(compositeId, topology);

                return topology;
            });
    }

    /**
     * Get topology for an active contract
     */
    public Uni<TokenTopology> getTopologyForContract(String contractId, int depth) {
        ActiveContract contract = contractCache.get(contractId);

        if (contract == null) {
            // Try to find contract from composite token
            return findContractByCompositeTokenId(contractId)
                .flatMap(foundContract -> {
                    if (foundContract == null) {
                        return Uni.createFrom().nullItem();
                    }
                    return buildContractTopology(foundContract);
                });
        }

        return buildContractTopology(contract);
    }

    /**
     * Build topology from active contract
     */
    private Uni<TokenTopology> buildContractTopology(ActiveContract contract) {
        String compositeTokenId = contract.getCompositeTokenId();

        if (compositeTokenId == null) {
            // Contract without composite token - just show contract node
            TokenTopology topology = TokenTopology.builder()
                .rootId(contract.getContractId())
                .type(TokenTopology.TopologyType.ACTIVE_CONTRACT)
                .depth(1)
                .build();

            TokenTopology.TopologyNode contractNode = new TokenTopology.TopologyNode(
                contract.getContractId(),
                TokenTopology.TopologyNode.NodeType.ACTIVE_CONTRACT,
                "Active Contract"
            );
            contractNode.setStatus(contract.getStatus().name());
            contractNode.setVerified(contract.isVvbVerified());
            contractNode.getData().put("ownerAddress", contract.getOwnerAddress());
            topology.addNode(contractNode);

            return Uni.createFrom().item(topology);
        }

        return compositeTokenFactory.getCompositeToken(compositeTokenId)
            .map(compositeToken -> {
                if (compositeToken == null) {
                    return null;
                }
                return TokenTopology.fromActiveContract(contract, compositeToken);
            });
    }

    /**
     * Find contract by composite token ID
     */
    private Uni<ActiveContract> findContractByCompositeTokenId(String compositeTokenId) {
        // Search cache for contract bound to this composite token
        return Uni.createFrom().item(
            contractCache.values().stream()
                .filter(c -> compositeTokenId.equals(c.getCompositeTokenId()))
                .findFirst()
                .orElse(null)
        );
    }

    /**
     * Add VVB verifier nodes to topology
     */
    private void addVerifierNodes(TokenTopology topology, CompositeToken compositeToken) {
        if (compositeToken.getVvbVerifications() == null) {
            return;
        }

        for (CompositeToken.VVBVerification verification : compositeToken.getVvbVerifications()) {
            TokenTopology.TopologyNode vvbNode = new TokenTopology.TopologyNode(
                verification.getVerifierId(),
                TokenTopology.TopologyNode.NodeType.VVB_VERIFIER,
                verification.getVerifierName()
            );
            vvbNode.setVerified(verification.isApproved());
            vvbNode.getData().put("verifiedAt", verification.getVerifiedAt().toString());
            vvbNode.getData().put("approved", verification.isApproved());
            topology.addNode(vvbNode);

            // Edge from verifier to composite token
            TokenTopology.TopologyEdge edge = new TokenTopology.TopologyEdge(
                verification.getVerifierId(),
                compositeToken.getCompositeId(),
                TokenTopology.TopologyEdge.EdgeType.VERIFIES
            );
            topology.addEdge(edge);
        }
    }

    /**
     * Get node details
     */
    public Uni<Map<String, Object>> getNodeDetails(String compositeId, String nodeId) {
        return getTopologyForCompositeToken(compositeId, 4, true)
            .map(topology -> {
                if (topology == null) {
                    return null;
                }

                TokenTopology.TopologyNode node = topology.getNode(nodeId);
                if (node == null) {
                    return null;
                }

                Map<String, Object> details = new HashMap<>();
                details.put("id", node.getId());
                details.put("type", node.getType().name());
                details.put("label", node.getLabel());
                details.put("status", node.getStatus());
                details.put("verified", node.isVerified());
                details.put("data", node.getData());
                details.put("style", Map.of(
                    "color", node.getStyle().getColor(),
                    "shape", node.getStyle().getShape(),
                    "size", node.getStyle().getSize()
                ));

                // Add edges
                List<TokenTopology.TopologyEdge> edges = topology.getEdgesForNode(nodeId);
                details.put("connectedEdges", edges.size());
                details.put("edges", edges.stream().map(e -> Map.of(
                    "source", e.getSource(),
                    "target", e.getTarget(),
                    "type", e.getType().name()
                )).toList());

                // Add children
                List<TokenTopology.TopologyNode> children = topology.getChildNodes(nodeId);
                details.put("childCount", children.size());
                details.put("children", children.stream().map(c -> Map.of(
                    "id", c.getId(),
                    "type", c.getType().name(),
                    "label", c.getLabel()
                )).toList());

                return details;
            });
    }

    /**
     * Find path between two nodes using BFS
     */
    public Uni<List<String>> findPath(String compositeId, String fromNode, String toNode) {
        return getTopologyForCompositeToken(compositeId, 5, false)
            .map(topology -> {
                if (topology == null) {
                    throw new RuntimeException("Topology not found");
                }

                // BFS to find path
                Queue<List<String>> queue = new LinkedList<>();
                Set<String> visited = new HashSet<>();

                queue.add(List.of(fromNode));
                visited.add(fromNode);

                while (!queue.isEmpty()) {
                    List<String> path = queue.poll();
                    String current = path.get(path.size() - 1);

                    if (current.equals(toNode)) {
                        return path;
                    }

                    // Get neighbors (connected nodes)
                    for (TokenTopology.TopologyEdge edge : topology.getEdgesForNode(current)) {
                        String neighbor = edge.getSource().equals(current) ? edge.getTarget() : edge.getSource();
                        if (!visited.contains(neighbor)) {
                            visited.add(neighbor);
                            List<String> newPath = new ArrayList<>(path);
                            newPath.add(neighbor);
                            queue.add(newPath);
                        }
                    }
                }

                throw new RuntimeException("No path exists between " + fromNode + " and " + toNode);
            });
    }

    /**
     * Get all topologies for an owner
     */
    public Uni<List<TokenTopology>> getTopologiesByOwner(String ownerAddress) {
        return compositeTokenFactory.getCompositeTokensByOwner(ownerAddress)
            .map(tokens -> tokens.stream()
                .map(TokenTopology::fromCompositeToken)
                .toList()
            );
    }

    /**
     * Register an active contract
     */
    public void registerContract(ActiveContract contract) {
        contractCache.put(contract.getContractId(), contract);
        Log.infof("Registered contract: %s", contract.getContractId());
    }

    /**
     * Get contract by ID
     */
    public ActiveContract getContract(String contractId) {
        return contractCache.get(contractId);
    }

    /**
     * Get all contracts for owner
     */
    public List<ActiveContract> getContractsByOwner(String ownerAddress) {
        return contractCache.values().stream()
            .filter(c -> ownerAddress.equals(c.getOwnerAddress()))
            .toList();
    }

    /**
     * Get contracts by status
     */
    public List<ActiveContract> getContractsByStatus(ActiveContract.ContractStatus status) {
        return contractCache.values().stream()
            .filter(c -> c.getStatus() == status)
            .toList();
    }

    /**
     * Get contract count
     */
    public int getContractCount() {
        return contractCache.size();
    }

    /**
     * Get service statistics
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalContracts", contractCache.size());
        stats.put("cachedTopologies", topologyCache.size());

        // Count by status
        Map<String, Long> byStatus = new HashMap<>();
        for (ActiveContract.ContractStatus status : ActiveContract.ContractStatus.values()) {
            long count = contractCache.values().stream()
                .filter(c -> c.getStatus() == status)
                .count();
            if (count > 0) {
                byStatus.put(status.name(), count);
            }
        }
        stats.put("contractsByStatus", byStatus);

        return stats;
    }
}

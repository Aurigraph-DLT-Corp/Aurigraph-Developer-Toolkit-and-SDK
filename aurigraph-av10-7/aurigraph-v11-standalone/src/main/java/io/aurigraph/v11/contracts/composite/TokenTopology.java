package io.aurigraph.v11.contracts.composite;

import java.time.Instant;
import java.util.*;

/**
 * Token Topology - Graph data structure for visualization
 *
 * Represents the complete topology of an Active Contract including:
 * - All nodes (Active Contract, Composite Token, Primary Token, Secondary Tokens, Derived Tokens)
 * - All edges (relationships between tokens)
 * - Visual attributes for rendering
 *
 * This data structure is designed for use with D3.js, vis-network, or similar
 * graph visualization libraries.
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-605-01
 */
public class TokenTopology {

    private String topologyId;
    private String rootId;           // Starting node (Active Contract or Composite Token)
    private TopologyType type;       // What type of topology this is
    private List<TopologyNode> nodes;
    private List<TopologyEdge> edges;
    private int depth;               // How deep the topology goes
    private Instant generatedAt;
    private Map<String, Object> metadata;

    /**
     * Topology Type
     */
    public enum TopologyType {
        ACTIVE_CONTRACT("Full topology starting from Active Contract"),
        COMPOSITE_TOKEN("Topology starting from Composite Token"),
        PRIMARY_TOKEN("Topology starting from Primary Token");

        private final String description;
        TopologyType(String description) { this.description = description; }
        public String getDescription() { return description; }
    }

    /**
     * Node in the topology graph
     */
    public static class TopologyNode {
        private String id;
        private NodeType type;
        private String label;
        private String status;
        private boolean verified;
        private Map<String, Object> data;     // Node-specific data
        private NodeStyle style;              // Visual styling

        public enum NodeType {
            ACTIVE_CONTRACT("#3B82F6", "hexagon", 40),      // Blue hexagon
            COMPOSITE_TOKEN("#10B981", "diamond", 35),      // Green diamond
            PRIMARY_TOKEN("#8B5CF6", "circle", 30),         // Purple circle
            SECONDARY_TOKEN("#F59E0B", "square", 25),       // Orange square
            DERIVED_TOKEN("#EC4899", "triangle", 25),       // Pink triangle
            DOCUMENT_TOKEN("#6366F1", "rect", 20),          // Indigo rectangle
            MEDIA_TOKEN("#14B8A6", "ellipse", 20),          // Teal ellipse
            VVB_VERIFIER("#EF4444", "star", 25);            // Red star

            private final String defaultColor;
            private final String defaultShape;
            private final int defaultSize;

            NodeType(String color, String shape, int size) {
                this.defaultColor = color;
                this.defaultShape = shape;
                this.defaultSize = size;
            }

            public String getDefaultColor() { return defaultColor; }
            public String getDefaultShape() { return defaultShape; }
            public int getDefaultSize() { return defaultSize; }
        }

        /**
         * Node styling for visualization
         */
        public static class NodeStyle {
            private String color;
            private String shape;
            private int size;
            private String borderColor;
            private int borderWidth;
            private String icon;

            public NodeStyle(NodeType type) {
                this.color = type.getDefaultColor();
                this.shape = type.getDefaultShape();
                this.size = type.getDefaultSize();
                this.borderColor = "#1F2937";
                this.borderWidth = 2;
            }

            // Getters and setters
            public String getColor() { return color; }
            public void setColor(String color) { this.color = color; }
            public String getShape() { return shape; }
            public void setShape(String shape) { this.shape = shape; }
            public int getSize() { return size; }
            public void setSize(int size) { this.size = size; }
            public String getBorderColor() { return borderColor; }
            public void setBorderColor(String borderColor) { this.borderColor = borderColor; }
            public int getBorderWidth() { return borderWidth; }
            public void setBorderWidth(int borderWidth) { this.borderWidth = borderWidth; }
            public String getIcon() { return icon; }
            public void setIcon(String icon) { this.icon = icon; }
        }

        public TopologyNode(String id, NodeType type, String label) {
            this.id = id;
            this.type = type;
            this.label = label;
            this.data = new HashMap<>();
            this.style = new NodeStyle(type);
            this.verified = false;
        }

        // Getters and setters
        public String getId() { return id; }
        public NodeType getType() { return type; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public boolean isVerified() { return verified; }
        public void setVerified(boolean verified) { this.verified = verified; }
        public Map<String, Object> getData() { return data; }
        public NodeStyle getStyle() { return style; }
        public void setStyle(NodeStyle style) { this.style = style; }
    }

    /**
     * Edge in the topology graph
     */
    public static class TopologyEdge {
        private String id;
        private String source;       // Source node ID
        private String target;       // Target node ID
        private EdgeType type;
        private String label;
        private boolean bidirectional;
        private EdgeStyle style;

        public enum EdgeType {
            BINDS_TO("Binding relationship", "#3B82F6", "solid"),
            CONTAINS("Containment", "#10B981", "solid"),
            DERIVES_FROM("Derivation", "#8B5CF6", "dashed"),
            VERIFIES("Verification", "#EF4444", "solid"),
            REFERENCES("Reference", "#6B7280", "dotted"),
            DEPENDS_ON("Dependency", "#F59E0B", "solid");

            private final String description;
            private final String defaultColor;
            private final String defaultStyle;

            EdgeType(String description, String color, String style) {
                this.description = description;
                this.defaultColor = color;
                this.defaultStyle = style;
            }

            public String getDescription() { return description; }
            public String getDefaultColor() { return defaultColor; }
            public String getDefaultStyle() { return defaultStyle; }
        }

        /**
         * Edge styling for visualization
         */
        public static class EdgeStyle {
            private String color;
            private String lineStyle;  // solid, dashed, dotted
            private int width;
            private boolean animated;
            private String arrowType;  // arrow, none, both

            public EdgeStyle(EdgeType type) {
                this.color = type.getDefaultColor();
                this.lineStyle = type.getDefaultStyle();
                this.width = 2;
                this.animated = false;
                this.arrowType = "arrow";
            }

            // Getters and setters
            public String getColor() { return color; }
            public void setColor(String color) { this.color = color; }
            public String getLineStyle() { return lineStyle; }
            public void setLineStyle(String lineStyle) { this.lineStyle = lineStyle; }
            public int getWidth() { return width; }
            public void setWidth(int width) { this.width = width; }
            public boolean isAnimated() { return animated; }
            public void setAnimated(boolean animated) { this.animated = animated; }
            public String getArrowType() { return arrowType; }
            public void setArrowType(String arrowType) { this.arrowType = arrowType; }
        }

        public TopologyEdge(String source, String target, EdgeType type) {
            this.id = source + "->" + target;
            this.source = source;
            this.target = target;
            this.type = type;
            this.label = type.getDescription();
            this.bidirectional = false;
            this.style = new EdgeStyle(type);
        }

        // Getters and setters
        public String getId() { return id; }
        public String getSource() { return source; }
        public String getTarget() { return target; }
        public EdgeType getType() { return type; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
        public boolean isBidirectional() { return bidirectional; }
        public void setBidirectional(boolean bidirectional) { this.bidirectional = bidirectional; }
        public EdgeStyle getStyle() { return style; }
        public void setStyle(EdgeStyle style) { this.style = style; }
    }

    // Private constructor - use builder
    private TokenTopology() {
        this.nodes = new ArrayList<>();
        this.edges = new ArrayList<>();
        this.metadata = new HashMap<>();
        this.generatedAt = Instant.now();
        this.depth = 0;
    }

    /**
     * Builder pattern
     */
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private TokenTopology topology = new TokenTopology();

        public Builder topologyId(String topologyId) {
            topology.topologyId = topologyId;
            return this;
        }

        public Builder rootId(String rootId) {
            topology.rootId = rootId;
            return this;
        }

        public Builder type(TopologyType type) {
            topology.type = type;
            return this;
        }

        public Builder depth(int depth) {
            topology.depth = depth;
            return this;
        }

        public TokenTopology build() {
            if (topology.topologyId == null) {
                topology.topologyId = "TOPO-" + UUID.randomUUID().toString().substring(0, 8);
            }
            return topology;
        }
    }

    /**
     * Add a node to the topology
     */
    public void addNode(TopologyNode node) {
        if (nodes.stream().noneMatch(n -> n.getId().equals(node.getId()))) {
            nodes.add(node);
        }
    }

    /**
     * Add an edge to the topology
     */
    public void addEdge(TopologyEdge edge) {
        if (edges.stream().noneMatch(e -> e.getId().equals(edge.getId()))) {
            edges.add(edge);
        }
    }

    /**
     * Build topology from Active Contract
     */
    public static TokenTopology fromActiveContract(ActiveContract contract, CompositeToken compositeToken) {
        TokenTopology topology = builder()
            .rootId(contract.getContractId())
            .type(TopologyType.ACTIVE_CONTRACT)
            .depth(4)
            .build();

        // Add Active Contract node
        TopologyNode acNode = new TopologyNode(
            contract.getContractId(),
            TopologyNode.NodeType.ACTIVE_CONTRACT,
            "Active Contract"
        );
        acNode.setStatus(contract.getStatus().name());
        acNode.setVerified(contract.isVvbVerified());
        acNode.getData().put("ownerAddress", contract.getOwnerAddress());
        acNode.getData().put("version", contract.getVersion());
        topology.addNode(acNode);

        // Add Composite Token
        if (compositeToken != null) {
            TopologyNode ctNode = new TopologyNode(
                compositeToken.getCompositeId(),
                TopologyNode.NodeType.COMPOSITE_TOKEN,
                "Composite Token"
            );
            ctNode.setStatus(compositeToken.getStatus() != null ? compositeToken.getStatus().name() : "PENDING");
            ctNode.setVerified(compositeToken.isVvbVerified());
            ctNode.getData().put("merkleRoot", compositeToken.getMerkleRootHash());
            ctNode.getData().put("assetType", compositeToken.getAssetTypeString());
            topology.addNode(ctNode);

            // Edge: AC -> CT
            topology.addEdge(new TopologyEdge(
                contract.getContractId(),
                compositeToken.getCompositeId(),
                TopologyEdge.EdgeType.BINDS_TO
            ));

            // Add Primary Token
            PrimaryToken primaryToken = compositeToken.getPrimaryToken();
            if (primaryToken != null) {
                TopologyNode ptNode = new TopologyNode(
                    primaryToken.getTokenId(),
                    TopologyNode.NodeType.PRIMARY_TOKEN,
                    "Primary Token"
                );
                ptNode.setVerified(primaryToken.isVvbVerified());
                ptNode.getData().put("assetId", primaryToken.getAssetId());
                ptNode.getData().put("valuation", primaryToken.getValuation());
                ptNode.getData().put("digitalTwin", primaryToken.getDigitalTwinReference());
                topology.addNode(ptNode);

                // Edge: CT -> PT
                topology.addEdge(new TopologyEdge(
                    compositeToken.getCompositeId(),
                    primaryToken.getTokenId(),
                    TopologyEdge.EdgeType.CONTAINS
                ));
            }

            // Add Secondary Tokens
            if (compositeToken.getSecondaryTokens() != null) {
                for (SecondaryToken st : compositeToken.getSecondaryTokens()) {
                    TopologyNode.NodeType nodeType = getSecondaryNodeType(st.getTokenType());
                    TopologyNode stNode = new TopologyNode(
                        st.getTokenId(),
                        nodeType,
                        st.getTokenType().getDisplayName()
                    );
                    stNode.getData().put("tokenType", st.getTokenType().name());
                    topology.addNode(stNode);

                    // Edge: CT -> ST
                    topology.addEdge(new TopologyEdge(
                        compositeToken.getCompositeId(),
                        st.getTokenId(),
                        TopologyEdge.EdgeType.CONTAINS
                    ));
                }
            }

            // Add Derived Tokens
            if (compositeToken.getDerivedTokens() != null) {
                for (DerivedToken dt : compositeToken.getDerivedTokens()) {
                    TopologyNode dtNode = new TopologyNode(
                        dt.getTokenId(),
                        TopologyNode.NodeType.DERIVED_TOKEN,
                        dt.getDerivationType().getDisplayName()
                    );
                    dtNode.getData().put("derivationType", dt.getDerivationType().name());
                    dtNode.getData().put("value", dt.getValue());
                    dtNode.getData().put("sharePercentage", dt.getSharePercentage());
                    topology.addNode(dtNode);

                    // Edge: PT -> DT
                    if (primaryToken != null) {
                        topology.addEdge(new TopologyEdge(
                            primaryToken.getTokenId(),
                            dt.getTokenId(),
                            TopologyEdge.EdgeType.DERIVES_FROM
                        ));
                    }
                }
            }
        }

        return topology;
    }

    /**
     * Build topology from Composite Token (without Active Contract)
     */
    public static TokenTopology fromCompositeToken(CompositeToken compositeToken) {
        TokenTopology topology = builder()
            .rootId(compositeToken.getCompositeId())
            .type(TopologyType.COMPOSITE_TOKEN)
            .depth(3)
            .build();

        // Add Composite Token as root
        TopologyNode ctNode = new TopologyNode(
            compositeToken.getCompositeId(),
            TopologyNode.NodeType.COMPOSITE_TOKEN,
            "Composite Token"
        );
        ctNode.setStatus(compositeToken.getStatus() != null ? compositeToken.getStatus().name() : "PENDING");
        ctNode.setVerified(compositeToken.isVvbVerified());
        topology.addNode(ctNode);

        // Add Primary and Secondary tokens (similar to above)
        PrimaryToken primaryToken = compositeToken.getPrimaryToken();
        if (primaryToken != null) {
            TopologyNode ptNode = new TopologyNode(
                primaryToken.getTokenId(),
                TopologyNode.NodeType.PRIMARY_TOKEN,
                "Primary Token"
            );
            ptNode.setVerified(primaryToken.isVvbVerified());
            topology.addNode(ptNode);

            topology.addEdge(new TopologyEdge(
                compositeToken.getCompositeId(),
                primaryToken.getTokenId(),
                TopologyEdge.EdgeType.CONTAINS
            ));
        }

        if (compositeToken.getSecondaryTokens() != null) {
            for (SecondaryToken st : compositeToken.getSecondaryTokens()) {
                TopologyNode.NodeType nodeType = getSecondaryNodeType(st.getTokenType());
                TopologyNode stNode = new TopologyNode(
                    st.getTokenId(),
                    nodeType,
                    st.getTokenType().getDisplayName()
                );
                topology.addNode(stNode);

                topology.addEdge(new TopologyEdge(
                    compositeToken.getCompositeId(),
                    st.getTokenId(),
                    TopologyEdge.EdgeType.CONTAINS
                ));
            }
        }

        return topology;
    }

    /**
     * Get node type for secondary token
     */
    private static TopologyNode.NodeType getSecondaryNodeType(SecondaryTokenType type) {
        if (type.isDocumentBased()) {
            return TopologyNode.NodeType.DOCUMENT_TOKEN;
        } else if (type.isMediaBased()) {
            return TopologyNode.NodeType.MEDIA_TOKEN;
        }
        return TopologyNode.NodeType.SECONDARY_TOKEN;
    }

    /**
     * Get node by ID
     */
    public TopologyNode getNode(String nodeId) {
        return nodes.stream()
            .filter(n -> n.getId().equals(nodeId))
            .findFirst()
            .orElse(null);
    }

    /**
     * Get edges for a node
     */
    public List<TopologyEdge> getEdgesForNode(String nodeId) {
        return edges.stream()
            .filter(e -> e.getSource().equals(nodeId) || e.getTarget().equals(nodeId))
            .toList();
    }

    /**
     * Get child nodes
     */
    public List<TopologyNode> getChildNodes(String parentId) {
        return edges.stream()
            .filter(e -> e.getSource().equals(parentId))
            .map(e -> getNode(e.getTarget()))
            .filter(Objects::nonNull)
            .toList();
    }

    // Getters
    public String getTopologyId() { return topologyId; }
    public String getRootId() { return rootId; }
    public TopologyType getType() { return type; }
    public List<TopologyNode> getNodes() { return nodes; }
    public List<TopologyEdge> getEdges() { return edges; }
    public int getDepth() { return depth; }
    public Instant getGeneratedAt() { return generatedAt; }
    public Map<String, Object> getMetadata() { return metadata; }

    /**
     * Get statistics about the topology
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalNodes", nodes.size());
        stats.put("totalEdges", edges.size());
        stats.put("depth", depth);

        // Count by node type
        Map<String, Long> nodesByType = new HashMap<>();
        for (TopologyNode.NodeType type : TopologyNode.NodeType.values()) {
            long count = nodes.stream().filter(n -> n.getType() == type).count();
            if (count > 0) {
                nodesByType.put(type.name(), count);
            }
        }
        stats.put("nodesByType", nodesByType);

        // Count verified nodes
        long verifiedCount = nodes.stream().filter(TopologyNode::isVerified).count();
        stats.put("verifiedNodes", verifiedCount);

        return stats;
    }
}

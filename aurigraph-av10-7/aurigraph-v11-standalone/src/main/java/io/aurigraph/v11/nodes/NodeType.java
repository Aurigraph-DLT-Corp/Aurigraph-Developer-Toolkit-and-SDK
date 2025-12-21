package io.aurigraph.v11.nodes;

/**
 * Unified NodeType enumeration for all Aurigraph V12 node types.
 *
 * This consolidates node types from demo.models and models packages
 * into a single canonical definition.
 *
 * @author Aurigraph V12 Platform
 * @version 12.0.0
 */
public enum NodeType {

    // ============================================
    // CORE NODE TYPES
    // ============================================

    /**
     * Validator Node - Participates in HyperRAFT++ consensus
     */
    VALIDATOR("Validator", "Participates in HyperRAFT++ consensus and validates transactions", true, true),

    /**
     * Business Node - Executes business logic and smart contracts
     */
    BUSINESS("Business", "Executes business logic and smart contract operations", false, true),

    /**
     * Channel Node - Manages multi-channel data flows
     */
    CHANNEL("Channel", "Manages multi-channel data flows and participant coordination", false, false),

    /**
     * API Integration Node - External API integration
     */
    API_INTEGRATION("API Integration", "Integrates with external APIs and data sources", false, false),

    // ============================================
    // INFRASTRUCTURE NODE TYPES
    // ============================================

    /**
     * Full Node - Stores complete blockchain data
     */
    FULL_NODE("Full Node", "Stores complete blockchain data", false, true),

    /**
     * Light Client - Minimal blockchain storage
     */
    LIGHT_CLIENT("Light Client", "Stores only essential blockchain data", false, false),

    /**
     * Archive Node - Complete historical data
     */
    ARCHIVE("Archive", "Stores complete historical blockchain data", false, true),

    /**
     * Boot Node - Network discovery
     */
    BOOT_NODE("Boot Node", "Helps new nodes discover the network", false, false),

    /**
     * RPC Node - API access
     */
    RPC_NODE("RPC Node", "Provides JSON-RPC API access", false, true),

    // ============================================
    // ENTERPRISE NODE TYPES
    // ============================================

    /**
     * EI Node - Enterprise Infrastructure integration
     */
    EI_NODE("EI Node", "Enterprise Infrastructure integration with exchanges and data feeds", false, false),

    /**
     * Bridge Validator - Cross-chain bridge validation
     */
    BRIDGE_VALIDATOR("Bridge Validator", "Validates cross-chain bridge transactions", true, false);

    private final String displayName;
    private final String description;
    private final boolean consensusParticipant;
    private final boolean storesFullChain;

    NodeType(String displayName, String description, boolean consensusParticipant, boolean storesFullChain) {
        this.displayName = displayName;
        this.description = description;
        this.consensusParticipant = consensusParticipant;
        this.storesFullChain = storesFullChain;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Check if node type participates in consensus
     */
    public boolean canValidate() {
        return consensusParticipant;
    }

    /**
     * Check if node type stores full blockchain
     */
    public boolean storesFullChain() {
        return storesFullChain;
    }

    /**
     * Check if this is a consensus node
     */
    public boolean isConsensusNode() {
        return this == VALIDATOR || this == BRIDGE_VALIDATOR;
    }

    /**
     * Check if this handles external integrations
     */
    public boolean isExternalIntegration() {
        return this == API_INTEGRATION || this == EI_NODE;
    }

    /**
     * Check if this executes business logic
     */
    public boolean isBusinessNode() {
        return this == BUSINESS;
    }

    /**
     * Check if this manages data channels
     */
    public boolean isChannelNode() {
        return this == CHANNEL;
    }

    @Override
    public String toString() {
        return displayName;
    }
}

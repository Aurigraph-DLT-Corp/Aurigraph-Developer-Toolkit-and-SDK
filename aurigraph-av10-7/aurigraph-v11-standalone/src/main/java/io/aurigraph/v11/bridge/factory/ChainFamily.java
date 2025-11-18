package io.aurigraph.v11.bridge.factory;

/**
 * Classification of blockchains by consensus/VM type for adapter family pattern
 * Enables reusable adapter implementations across similar chains
 *
 * PHASE: 2 (Week 3-4) - Configuration setup
 * Adapter implementations deferred to Week 5-8
 *
 * @author Claude Code - Priority 3 Implementation
 * @version 1.0.0
 */
public enum ChainFamily {
    /**
     * Ethereum Virtual Machine - EVM-compatible chains
     * Examples: Ethereum, Polygon, BSC, Arbitrum, Optimism, Avalanche, Fantom, etc.
     * Total: 18+ chains
     */
    EVM(
        "Ethereum Virtual Machine",
        "EVM-compatible chains using Web3.js/Web3j",
        null  // Adapter: Week 5-8
    ),

    /**
     * Solana Program Model - SPL token standard
     * Examples: Solana, Serum, Marinade, Magic Eden, Orca
     * Total: 5 chains
     */
    SOLANA(
        "Solana Program Model",
        "Solana ecosystem with SPL tokens",
        null  // Adapter: Week 5-8
    ),

    /**
     * Cosmos SDK - IBC protocol for inter-blockchain communication
     * Examples: Cosmos Hub, Osmosis, Juno, Evmos, Injective, Kava, etc.
     * Total: 10 chains
     */
    COSMOS(
        "Cosmos SDK + IBC",
        "Cosmos ecosystem with IBC protocol",
        null  // Adapter: Week 5-8
    ),

    /**
     * Polkadot/Substrate - XCM for cross-chain messaging
     * Examples: Polkadot, Kusama, Moonbeam, Astar, Hydra DX, etc.
     * Total: 8 chains
     */
    SUBSTRATE(
        "Polkadot/Substrate",
        "Substrate-based chains with XCM",
        null  // Adapter: Week 5-8
    ),

    /**
     * Layer 2 Solutions - Optimistic and ZK rollups
     * Examples: Arbitrum, Optimism, zkSync, StarkNet, Scroll
     * Total: 5 chains
     */
    LAYER2(
        "Layer 2 Rollups",
        "L2 solutions (Optimistic & ZK rollups)",
        null  // Adapter: Week 5-8
    ),

    /**
     * UTXO Model - Bitcoin-style transaction model
     * Examples: Bitcoin, Litecoin, Dogecoin
     * Total: 3 chains
     */
    UTXO(
        "Bitcoin UTXO Model",
        "UTXO-based chains like Bitcoin",
        null  // Adapter: Week 5-8
    ),

    /**
     * Other Virtual Machines - Unique implementations
     * Examples: Tezos, Cardano, Near, Algorand, Hedera, Tron
     * Total: 6 chains
     */
    OTHER(
        "Other VMs",
        "Unique VM implementations (Tezos, Cardano, Near, etc.)",
        null  // Adapter: Week 5-8
    );

    private final String displayName;
    private final String description;
    private final Class<?> adapterClass;

    ChainFamily(String displayName, String description, Class<?> adapterClass) {
        this.displayName = displayName;
        this.description = description;
        this.adapterClass = adapterClass;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public Class<?> getAdapterClass() {
        return adapterClass;
    }

    /**
     * Get family by name (case-insensitive)
     */
    public static ChainFamily fromString(String name) {
        try {
            return ChainFamily.valueOf(name.toUpperCase());
        } catch (IllegalArgumentException e) {
            return OTHER; // Default to generic adapter
        }
    }
}

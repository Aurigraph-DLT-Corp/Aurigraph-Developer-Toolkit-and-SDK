package io.aurigraph.v11.models;

/**
 * Token Type Enumeration
 *
 * Defines the token standards supported by Aurigraph V11 platform.
 *
 * @author Backend Development Agent (BDA)
 * @version 11.0.0
 * @since Sprint 12
 */
public enum TokenType {
    /**
     * ERC20 - Fungible token standard
     */
    ERC20,

    /**
     * ERC721 - Non-fungible token (NFT) standard
     */
    ERC721,

    /**
     * ERC1155 - Multi-token standard (fungible + non-fungible)
     */
    ERC1155,

    /**
     * RWA - Real-World Asset Token
     * Specialized token type for tokenized real-world assets
     */
    RWA,

    /**
     * GOVERNANCE - Governance Token
     * Tokens used for platform governance and voting
     */
    GOVERNANCE,

    /**
     * UTILITY - Utility Token
     * Platform utility tokens for service payments
     */
    UTILITY
}

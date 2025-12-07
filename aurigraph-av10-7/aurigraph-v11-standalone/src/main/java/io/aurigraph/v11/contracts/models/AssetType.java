package io.aurigraph.v11.contracts.models;

/**
 * Types of real-world assets that can be tokenized
 */
public enum AssetType {
    // Environmental & Energy
    CARBON_CREDIT,     // Carbon credits and environmental assets
    ENERGY,            // Energy certificates and renewable energy

    // Real Estate & Property
    REAL_ESTATE,       // Real estate properties and REITs

    // Financial Instruments
    FINANCIAL_ASSET,   // Stocks, bonds, derivatives
    BONDS,             // Government and corporate bonds
    EQUITIES,          // Stocks and equity instruments

    // Banking & Trade Finance
    TRADE_FINANCE,     // Letters of credit, trade receivables
    DEPOSITS,          // Bank deposits, certificates of deposit
    LOANS,             // Commercial loans, mortgages, syndicated loans
    INVOICE_FACTORING, // Invoice financing, factoring
    SUPPLY_CHAIN_FINANCE, // Supply chain financing
    TREASURY,          // Treasury instruments

    // Supply Chain & Logistics
    SUPPLY_CHAIN,      // Supply chain tracking and logistics

    // Healthcare
    HEALTHCARE,        // Healthcare data and medical records

    // Intellectual Property
    INTELLECTUAL_PROPERTY, // Patents, trademarks, copyrights (general IP)
    PATENT,            // Patents and registered inventions
    TRADEMARK,         // Trademarks and service marks
    COPYRIGHT,         // Copyrights and literary works

    // Physical Assets
    COMMODITIES,       // Physical commodities (gold, oil, etc.)
    PRECIOUS_METALS,   // Gold, silver, platinum
    ARTWORK,           // Physical art and collectibles
    COLLECTIBLES,      // Physical and digital collectibles

    // Digital Assets
    DIGITAL_ART,       // Digital art and digital collectibles
    NFT,               // Non-fungible tokens

    // Insurance & Identity
    INSURANCE,         // Insurance policies and claims
    IDENTITY,          // Digital identity and credentials

    OTHER              // Other asset types
}
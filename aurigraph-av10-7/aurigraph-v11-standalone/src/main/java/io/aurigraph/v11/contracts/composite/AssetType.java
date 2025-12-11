package io.aurigraph.v11.contracts.composite;

/**
 * Asset Type Enumeration
 *
 * Defines the types of real-world assets that can be tokenized
 * in the Aurigraph platform.
 *
 * @author J4C Development Agent
 * @version 12.1.0
 * @since AV11-601-01
 */
public enum AssetType {
    // Real Estate
    REAL_ESTATE("RE", "Real Estate", "Property, land, buildings"),
    RESIDENTIAL("RES", "Residential Property", "Houses, apartments, condos"),
    COMMERCIAL("COM", "Commercial Property", "Office buildings, retail spaces"),
    INDUSTRIAL("IND", "Industrial Property", "Warehouses, factories"),
    LAND("LND", "Land", "Raw land, development sites"),

    // Vehicles
    VEHICLE("VEH", "Vehicle", "Cars, trucks, motorcycles"),
    AIRCRAFT("AIR", "Aircraft", "Planes, helicopters"),
    VESSEL("VSL", "Vessel", "Ships, boats, yachts"),

    // Commodities
    COMMODITY("CMD", "Commodity", "Raw materials, goods"),
    PRECIOUS_METAL("PM", "Precious Metal", "Gold, silver, platinum"),
    ENERGY("ENG", "Energy", "Oil, gas, renewables"),
    AGRICULTURAL("AGR", "Agricultural", "Crops, livestock"),

    // Intellectual Property
    IP("IP", "Intellectual Property", "Patents, trademarks, copyrights"),
    PATENT("PAT", "Patent", "Registered patents"),
    TRADEMARK("TM", "Trademark", "Registered trademarks"),
    COPYRIGHT("CR", "Copyright", "Copyrighted works"),
    TRADE_SECRET("TS", "Trade Secret", "Proprietary knowledge"),

    // Financial Instruments
    FINANCIAL("FIN", "Financial Instrument", "Bonds, equities, derivatives"),
    BOND("BND", "Bond", "Corporate and government bonds"),
    EQUITY("EQT", "Equity", "Stocks, shares"),
    DERIVATIVE("DRV", "Derivative", "Options, futures, swaps"),

    // Art & Collectibles
    ART("ART", "Art", "Paintings, sculptures"),
    COLLECTIBLE("COL", "Collectible", "Antiques, rare items"),
    NFT("NFT", "NFT", "Digital art, collectibles"),

    // Infrastructure
    INFRASTRUCTURE("INF", "Infrastructure", "Roads, bridges, utilities"),

    // Carbon & Environmental
    CARBON_CREDIT("CCR", "Carbon Credit", "Verified carbon offsets"),
    ENVIRONMENTAL("ENV", "Environmental Asset", "Water rights, biodiversity"),

    // Other
    OTHER("OTH", "Other", "Other asset types");

    private final String prefix;
    private final String displayName;
    private final String description;

    AssetType(String prefix, String displayName, String description) {
        this.prefix = prefix;
        this.displayName = displayName;
        this.description = description;
    }

    public String getPrefix() {
        return prefix;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    /**
     * Get the Merkle tree registry name for this asset type
     */
    public String getRegistryName() {
        return name() + "_REGISTRY";
    }

    /**
     * Check if this asset type is fractionalizable by default
     */
    public boolean isDefaultFractionalizable() {
        return switch (this) {
            case REAL_ESTATE, RESIDENTIAL, COMMERCIAL, INDUSTRIAL, LAND,
                 ART, COLLECTIBLE, INFRASTRUCTURE -> true;
            default -> false;
        };
    }

    /**
     * Get the default verification requirements for this asset type
     */
    public int getDefaultVVBRequirement() {
        return switch (this) {
            case REAL_ESTATE, RESIDENTIAL, COMMERCIAL, INDUSTRIAL -> 3; // Requires 3 VVBs
            case FINANCIAL, BOND, EQUITY, DERIVATIVE -> 3;
            case ART, COLLECTIBLE -> 2;
            default -> 1;
        };
    }

    /**
     * Find asset type by prefix
     */
    public static AssetType fromPrefix(String prefix) {
        for (AssetType type : values()) {
            if (type.prefix.equals(prefix)) {
                return type;
            }
        }
        return OTHER;
    }
}

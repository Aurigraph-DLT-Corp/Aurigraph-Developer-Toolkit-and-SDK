package io.aurigraph.v11.registry;

/**
 * Asset categories supported by the Aurigraph Asset Registry.
 * Each category has specific validation rules and metadata requirements.
 *
 * @author J4C Development Agent
 * @since 12.0.0
 */
public enum AssetCategory {

    /**
     * Real estate properties including residential, commercial, and industrial.
     */
    REAL_ESTATE("Real Estate", "Real estate properties and land", "realestate"),

    /**
     * Carbon credits and environmental offsets.
     */
    CARBON_CREDITS("Carbon Credits", "Carbon credits and environmental offsets", "carbon"),

    /**
     * Intellectual property including patents, trademarks, and copyrights.
     */
    INTELLECTUAL_PROPERTY("Intellectual Property", "Patents, trademarks, copyrights", "ip"),

    /**
     * Financial securities including stocks, bonds, and derivatives.
     */
    FINANCIAL_SECURITIES("Financial Securities", "Stocks, bonds, and financial instruments", "securities"),

    /**
     * Art and collectibles including paintings, sculptures, and rare items.
     */
    ART_COLLECTIBLES("Art & Collectibles", "Fine art, collectibles, and rare items", "art"),

    /**
     * Physical commodities including precious metals and raw materials.
     */
    COMMODITIES("Commodities", "Precious metals, raw materials", "commodities"),

    /**
     * Supply chain assets including inventory and logistics.
     */
    SUPPLY_CHAIN("Supply Chain", "Inventory, logistics, and trade assets", "supplychain"),

    /**
     * Infrastructure assets including utilities and transportation.
     */
    INFRASTRUCTURE("Infrastructure", "Utilities, transportation, and public works", "infrastructure"),

    /**
     * Energy assets including renewable energy and power generation.
     */
    ENERGY_ASSETS("Energy Assets", "Renewable energy, power generation", "energy"),

    /**
     * Agricultural assets including farmland and livestock.
     */
    AGRICULTURAL("Agricultural", "Farmland, livestock, and agricultural products", "agriculture"),

    /**
     * Insurance products and risk instruments.
     */
    INSURANCE_PRODUCTS("Insurance Products", "Insurance policies and risk instruments", "insurance"),

    /**
     * Receivables and invoices for trade finance.
     */
    RECEIVABLES("Receivables", "Invoices, trade receivables, and factoring", "receivables");

    private final String displayName;
    private final String description;
    private final String code;

    AssetCategory(String displayName, String description, String code) {
        this.displayName = displayName;
        this.description = description;
        this.code = code;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public String getCode() {
        return code;
    }

    /**
     * Find category by code (case-insensitive).
     */
    public static AssetCategory fromCode(String code) {
        if (code == null) return null;
        for (AssetCategory category : values()) {
            if (category.code.equalsIgnoreCase(code)) {
                return category;
            }
        }
        return null;
    }
}

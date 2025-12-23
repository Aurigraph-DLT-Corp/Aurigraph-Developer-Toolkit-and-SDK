package io.aurigraph.v11.contracts.rwa.models;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Regulatory Jurisdiction Enum
 * Defines supported regulatory jurisdictions for compliance
 */
public enum RegulatoryJurisdiction {
    US("US", "United States", "SEC", "USD"),
    EU("EU", "European Union", "ESMA", "EUR"),
    UK("UK", "United Kingdom", "FCA", "GBP"),
    SINGAPORE("SG", "Singapore", "MAS", "SGD"),
    JAPAN("JP", "Japan", "FSA", "JPY"),
    CANADA("CA", "Canada", "OSC", "CAD"),
    AUSTRALIA("AU", "Australia", "ASIC", "AUD"),
    SWITZERLAND("CH", "Switzerland", "FINMA", "CHF"),
    HONG_KONG("HK", "Hong Kong", "SFC", "HKD"),
    SOUTH_KOREA("KR", "South Korea", "FSC", "KRW"),
    GERMANY("DE", "Germany", "BaFIN", "EUR"),
    FRANCE("FR", "France", "AMF", "EUR"),
    NETHERLANDS("NL", "Netherlands", "AFM", "EUR"),
    ITALY("IT", "Italy", "CONSOB", "EUR"),
    SPAIN("ES", "Spain", "CNMV", "EUR"),
    BRAZIL("BR", "Brazil", "CVM", "BRL"),
    MEXICO("MX", "Mexico", "CNBV", "MXN"),
    INDIA("IN", "India", "SEBI", "INR"),
    CHINA("CN", "China", "CSRC", "CNY"),
    RUSSIA("RU", "Russia", "CBR", "RUB"),
    UAE("AE", "United Arab Emirates", "SCA", "AED"),
    SAUDI_ARABIA("SA", "Saudi Arabia", "CMA", "SAR"),
    SOUTH_AFRICA("ZA", "South Africa", "FSCA", "ZAR"),
    TURKEY("TR", "Turkey", "CMB", "TRY"),
    THAILAND("TH", "Thailand", "SEC", "THB"),
    MALAYSIA("MY", "Malaysia", "SC", "MYR"),
    INDONESIA("ID", "Indonesia", "OJK", "IDR"),
    PHILIPPINES("PH", "Philippines", "SEC", "PHP"),
    VIETNAM("VN", "Vietnam", "SSC", "VND"),
    TAIWAN("TW", "Taiwan", "FSC", "TWD"),
    NEW_ZEALAND("NZ", "New Zealand", "FMA", "NZD"),
    NORWAY("NO", "Norway", "FSA", "NOK"),
    SWEDEN("SE", "Sweden", "FSA", "SEK"),
    DENMARK("DK", "Denmark", "FSA", "DKK"),
    FINLAND("FI", "Finland", "FSA", "EUR"),
    BELGIUM("BE", "Belgium", "FSMA", "EUR"),
    AUSTRIA("AT", "Austria", "FMA", "EUR"),
    IRELAND("IE", "Ireland", "CBI", "EUR"),
    LUXEMBOURG("LU", "Luxembourg", "CSSF", "EUR"),
    PORTUGAL("PT", "Portugal", "CMVM", "EUR"),
    GREECE("GR", "Greece", "HCMC", "EUR"),
    CYPRUS("CY", "Cyprus", "CySEC", "EUR"),
    MALTA("MT", "Malta", "MFSA", "EUR"),
    POLAND("PL", "Poland", "KNF", "PLN"),
    CZECH_REPUBLIC("CZ", "Czech Republic", "CNB", "CZK"),
    HUNGARY("HU", "Hungary", "MNB", "HUF"),
    SLOVAKIA("SK", "Slovakia", "NBS", "EUR"),
    SLOVENIA("SI", "Slovenia", "ATVP", "EUR"),
    ESTONIA("EE", "Estonia", "FSA", "EUR"),
    LATVIA("LV", "Latvia", "FCMC", "EUR"),
    LITHUANIA("LT", "Lithuania", "BoL", "EUR"),
    CROATIA("HR", "Croatia", "HANFA", "EUR"),
    ROMANIA("RO", "Romania", "ASF", "RON"),
    BULGARIA("BG", "Bulgaria", "FSC", "BGN"),
    ISRAEL("IL", "Israel", "ISA", "ILS"),
    GLOBAL("GLOBAL", "Global/Multi-Jurisdictional", "Multiple", "Multiple");
    
    private final String code;
    private final String name;
    private final String regulator;
    private final String primaryCurrency;
    
    RegulatoryJurisdiction(String code, String name, String regulator, String primaryCurrency) {
        this.code = code;
        this.name = name;
        this.regulator = regulator;
        this.primaryCurrency = primaryCurrency;
    }
    
    @JsonValue
    public String getCode() {
        return code;
    }
    
    public String getName() {
        return name;
    }
    
    public String getRegulator() {
        return regulator;
    }
    
    public String getPrimaryCurrency() {
        return primaryCurrency;
    }
    
    /**
     * Get jurisdiction by code
     */
    public static RegulatoryJurisdiction fromCode(String code) {
        if (code == null) return null;
        
        for (RegulatoryJurisdiction jurisdiction : values()) {
            if (jurisdiction.code.equalsIgnoreCase(code)) {
                return jurisdiction;
            }
        }
        return null;
    }
    
    /**
     * Check if jurisdiction requires enhanced KYC
     */
    public boolean requiresEnhancedKYC() {
        return this == US || this == EU || this == UK || this == SINGAPORE || 
               this == JAPAN || this == CANADA || this == AUSTRALIA || this == SWITZERLAND;
    }
    
    /**
     * Check if jurisdiction requires AML screening
     */
    public boolean requiresAMLScreening() {
        return !this.equals(GLOBAL); // All jurisdictions except global require AML
    }
    
    /**
     * Check if jurisdiction allows retail investors
     */
    public boolean allowsRetailInvestors() {
        return this != US; // US typically restricts to accredited investors for many products
    }
    
    /**
     * Get regulatory tier (1 = most strict, 3 = least strict)
     */
    public int getRegulatoryTier() {
        switch (this) {
            case US:
            case EU:
            case UK:
            case SINGAPORE:
            case SWITZERLAND:
                return 1; // Tier 1 - Most strict
            case JAPAN:
            case CANADA:
            case AUSTRALIA:
            case GERMANY:
            case FRANCE:
            case NETHERLANDS:
            case HONG_KONG:
                return 2; // Tier 2 - Moderate
            default:
                return 3; // Tier 3 - Standard
        }
    }
    
    /**
     * Check if jurisdiction is part of EU
     */
    public boolean isEUMember() {
        return this == EU || this == GERMANY || this == FRANCE || this == NETHERLANDS ||
               this == ITALY || this == SPAIN || this == BELGIUM || this == AUSTRIA ||
               this == IRELAND || this == LUXEMBOURG || this == PORTUGAL || this == GREECE ||
               this == CYPRUS || this == MALTA || this == POLAND || this == SLOVAKIA ||
               this == SLOVENIA || this == ESTONIA || this == LATVIA || this == LITHUANIA ||
               this == CROATIA || this == FINLAND || this == DENMARK;
    }
    
    /**
     * Get minimum investment threshold in USD
     */
    public long getMinimumInvestmentUSD() {
        switch (getRegulatoryTier()) {
            case 1: return 250000; // $250k for Tier 1
            case 2: return 100000; // $100k for Tier 2
            default: return 10000; // $10k for Tier 3
        }
    }
}
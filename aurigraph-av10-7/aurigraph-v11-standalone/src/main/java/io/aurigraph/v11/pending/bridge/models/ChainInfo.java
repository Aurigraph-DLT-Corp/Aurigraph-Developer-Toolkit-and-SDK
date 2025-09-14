package io.aurigraph.v11.pending.bridge.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

/**
 * Chain Information Model
 * 
 * Contains comprehensive information about a blockchain network
 * supported by the Aurigraph cross-chain bridge system.
 */
public final class ChainInfo {

    private final String chainId;
    private final String name;
    private final String displayName;
    private final int networkId;
    private final String rpcUrl;
    private final String explorerUrl;
    private final String nativeCurrency;
    private final String currencySymbol;
    private final int decimals;
    private final boolean isActive;
    private final boolean isTestnet;
    private final String bridgeContractAddress;
    private final String tokenFactoryAddress;
    private final List<String> supportedAssets;
    private final long currentBlockHeight;
    private final long averageBlockTime;
    private final int averageConfirmationTime;
    private final BigDecimal minTransferAmount;
    private final BigDecimal maxTransferAmount;
    private final BigDecimal baseFee;
    private final double networkHealth;
    private final long lastHealthCheck;
    private final String chainType; // EVM, Solana, Bitcoin, etc.
    private final int confirmationBlocks;

    @JsonCreator
    public ChainInfo(
            @JsonProperty("chainId") String chainId,
            @JsonProperty("name") String name,
            @JsonProperty("displayName") String displayName,
            @JsonProperty("networkId") int networkId,
            @JsonProperty("rpcUrl") String rpcUrl,
            @JsonProperty("explorerUrl") String explorerUrl,
            @JsonProperty("nativeCurrency") String nativeCurrency,
            @JsonProperty("currencySymbol") String currencySymbol,
            @JsonProperty("decimals") int decimals,
            @JsonProperty("isActive") boolean isActive,
            @JsonProperty("isTestnet") boolean isTestnet,
            @JsonProperty("bridgeContractAddress") String bridgeContractAddress,
            @JsonProperty("tokenFactoryAddress") String tokenFactoryAddress,
            @JsonProperty("supportedAssets") List<String> supportedAssets,
            @JsonProperty("currentBlockHeight") long currentBlockHeight,
            @JsonProperty("averageBlockTime") long averageBlockTime,
            @JsonProperty("averageConfirmationTime") int averageConfirmationTime,
            @JsonProperty("minTransferAmount") BigDecimal minTransferAmount,
            @JsonProperty("maxTransferAmount") BigDecimal maxTransferAmount,
            @JsonProperty("baseFee") BigDecimal baseFee,
            @JsonProperty("networkHealth") double networkHealth,
            @JsonProperty("lastHealthCheck") long lastHealthCheck,
            @JsonProperty("chainType") String chainType,
            @JsonProperty("confirmationBlocks") int confirmationBlocks) {
        
        this.chainId = Objects.requireNonNull(chainId, "Chain ID cannot be null");
        this.name = Objects.requireNonNull(name, "Name cannot be null");
        this.displayName = displayName != null ? displayName : name;
        this.networkId = networkId;
        this.rpcUrl = rpcUrl;
        this.explorerUrl = explorerUrl;
        this.nativeCurrency = Objects.requireNonNull(nativeCurrency, "Native currency cannot be null");
        this.currencySymbol = currencySymbol != null ? currencySymbol : nativeCurrency;
        this.decimals = Math.max(decimals, 0);
        this.isActive = isActive;
        this.isTestnet = isTestnet;
        this.bridgeContractAddress = bridgeContractAddress;
        this.tokenFactoryAddress = tokenFactoryAddress;
        this.supportedAssets = supportedAssets != null ? List.copyOf(supportedAssets) : List.of();
        this.currentBlockHeight = Math.max(currentBlockHeight, 0);
        this.averageBlockTime = Math.max(averageBlockTime, 1000);
        this.averageConfirmationTime = Math.max(averageConfirmationTime, 1);
        this.minTransferAmount = minTransferAmount != null ? minTransferAmount : BigDecimal.ZERO;
        this.maxTransferAmount = maxTransferAmount != null ? maxTransferAmount : new BigDecimal("1000000");
        this.baseFee = baseFee != null ? baseFee : BigDecimal.ZERO;
        this.networkHealth = Math.max(0.0, Math.min(1.0, networkHealth));
        this.lastHealthCheck = lastHealthCheck;
        this.chainType = chainType != null ? chainType : "EVM";
        this.confirmationBlocks = Math.max(confirmationBlocks, 1);
    }

    // Convenience constructor for basic chain info
    public ChainInfo(String chainId, String name, int networkId, String nativeCurrency, 
                     int decimals, boolean isActive, String bridgeContractAddress) {
        this(chainId, name, name, networkId, null, null, nativeCurrency, nativeCurrency, 
             decimals, isActive, false, bridgeContractAddress, null, List.of(), 
             0, 15000, 60, BigDecimal.ZERO, new BigDecimal("1000000"), 
             BigDecimal.ZERO, 1.0, System.currentTimeMillis(), "EVM", 12);
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String chainId;
        private String name;
        private String displayName;
        private int networkId;
        private String rpcUrl;
        private String explorerUrl;
        private String nativeCurrency;
        private String currencySymbol;
        private int decimals = 18;
        private boolean isActive = true;
        private boolean isTestnet = false;
        private String bridgeContractAddress;
        private String tokenFactoryAddress;
        private List<String> supportedAssets = List.of();
        private long currentBlockHeight;
        private long averageBlockTime = 15000;
        private int averageConfirmationTime = 60;
        private BigDecimal minTransferAmount = BigDecimal.ZERO;
        private BigDecimal maxTransferAmount = new BigDecimal("1000000");
        private BigDecimal baseFee = BigDecimal.ZERO;
        private double networkHealth = 1.0;
        private long lastHealthCheck = System.currentTimeMillis();
        private String chainType = "EVM";
        private int confirmationBlocks = 12;

        public Builder chainId(String chainId) { this.chainId = chainId; return this; }
        public Builder name(String name) { this.name = name; return this; }
        public Builder displayName(String displayName) { this.displayName = displayName; return this; }
        public Builder networkId(int networkId) { this.networkId = networkId; return this; }
        public Builder rpcUrl(String rpcUrl) { this.rpcUrl = rpcUrl; return this; }
        public Builder explorerUrl(String explorerUrl) { this.explorerUrl = explorerUrl; return this; }
        public Builder nativeCurrency(String nativeCurrency) { this.nativeCurrency = nativeCurrency; return this; }
        public Builder currencySymbol(String currencySymbol) { this.currencySymbol = currencySymbol; return this; }
        public Builder decimals(int decimals) { this.decimals = decimals; return this; }
        public Builder isActive(boolean isActive) { this.isActive = isActive; return this; }
        public Builder isTestnet(boolean isTestnet) { this.isTestnet = isTestnet; return this; }
        public Builder bridgeContractAddress(String bridgeContractAddress) { this.bridgeContractAddress = bridgeContractAddress; return this; }
        public Builder tokenFactoryAddress(String tokenFactoryAddress) { this.tokenFactoryAddress = tokenFactoryAddress; return this; }
        public Builder supportedAssets(List<String> supportedAssets) { this.supportedAssets = supportedAssets; return this; }
        public Builder currentBlockHeight(long currentBlockHeight) { this.currentBlockHeight = currentBlockHeight; return this; }
        public Builder averageBlockTime(long averageBlockTime) { this.averageBlockTime = averageBlockTime; return this; }
        public Builder averageConfirmationTime(int averageConfirmationTime) { this.averageConfirmationTime = averageConfirmationTime; return this; }
        public Builder minTransferAmount(BigDecimal minTransferAmount) { this.minTransferAmount = minTransferAmount; return this; }
        public Builder maxTransferAmount(BigDecimal maxTransferAmount) { this.maxTransferAmount = maxTransferAmount; return this; }
        public Builder baseFee(BigDecimal baseFee) { this.baseFee = baseFee; return this; }
        public Builder networkHealth(double networkHealth) { this.networkHealth = networkHealth; return this; }
        public Builder lastHealthCheck(long lastHealthCheck) { this.lastHealthCheck = lastHealthCheck; return this; }
        public Builder chainType(String chainType) { this.chainType = chainType; return this; }
        public Builder confirmationBlocks(int confirmationBlocks) { this.confirmationBlocks = confirmationBlocks; return this; }

        public ChainInfo build() {
            return new ChainInfo(chainId, name, displayName, networkId, rpcUrl, explorerUrl,
                nativeCurrency, currencySymbol, decimals, isActive, isTestnet,
                bridgeContractAddress, tokenFactoryAddress, supportedAssets,
                currentBlockHeight, averageBlockTime, averageConfirmationTime,
                minTransferAmount, maxTransferAmount, baseFee, networkHealth,
                lastHealthCheck, chainType, confirmationBlocks);
        }
    }

    // Getters
    public String getChainId() { return chainId; }
    public String getName() { return name; }
    public String getDisplayName() { return displayName; }
    public int getNetworkId() { return networkId; }
    public String getRpcUrl() { return rpcUrl; }
    public String getExplorerUrl() { return explorerUrl; }
    public String getNativeCurrency() { return nativeCurrency; }
    public String getCurrencySymbol() { return currencySymbol; }
    public int getDecimals() { return decimals; }
    public boolean isActive() { return isActive; }
    public boolean isTestnet() { return isTestnet; }
    public String getBridgeContractAddress() { return bridgeContractAddress; }
    public String getTokenFactoryAddress() { return tokenFactoryAddress; }
    public List<String> getSupportedAssets() { return supportedAssets; }
    public long getCurrentBlockHeight() { return currentBlockHeight; }
    public long getAverageBlockTime() { return averageBlockTime; }
    public int getAverageConfirmationTime() { return averageConfirmationTime; }
    public BigDecimal getMinTransferAmount() { return minTransferAmount; }
    public BigDecimal getMaxTransferAmount() { return maxTransferAmount; }
    public BigDecimal getBaseFee() { return baseFee; }
    public double getNetworkHealth() { return networkHealth; }
    public long getLastHealthCheck() { return lastHealthCheck; }
    public String getChainType() { return chainType; }
    public int getConfirmationBlocks() { return confirmationBlocks; }

    // Utility methods
    public boolean isEVM() {
        return "EVM".equalsIgnoreCase(chainType);
    }

    public boolean isSolana() {
        return "Solana".equalsIgnoreCase(chainType);
    }

    public boolean isBitcoin() {
        return "Bitcoin".equalsIgnoreCase(chainType);
    }

    public boolean isHealthy() {
        return networkHealth >= 0.8 && isActive;
    }

    public boolean supportsAsset(String asset) {
        return supportedAssets.contains(asset) || asset.equals(nativeCurrency);
    }

    public String getExplorerTxUrl(String txHash) {
        if (explorerUrl == null || txHash == null) return null;
        return explorerUrl + (explorerUrl.endsWith("/") ? "" : "/") + "tx/" + txHash;
    }

    public String getExplorerAddressUrl(String address) {
        if (explorerUrl == null || address == null) return null;
        return explorerUrl + (explorerUrl.endsWith("/") ? "" : "/") + "address/" + address;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChainInfo chainInfo = (ChainInfo) o;
        return Objects.equals(chainId, chainInfo.chainId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(chainId);
    }

    @Override
    public String toString() {
        return String.format("ChainInfo{id=%s, name=%s, network=%d, health=%.2f}", 
            chainId, name, networkId, networkHealth);
    }
}
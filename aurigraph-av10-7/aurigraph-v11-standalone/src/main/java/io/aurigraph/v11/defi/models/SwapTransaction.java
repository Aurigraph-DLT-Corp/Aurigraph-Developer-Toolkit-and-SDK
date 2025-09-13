package io.aurigraph.v11.defi.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Represents a DEX swap transaction with routing, slippage protection, and gas optimization
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class SwapTransaction {
    
    @JsonProperty("transactionId")
    private String transactionId;
    
    @JsonProperty("userAddress")
    private String userAddress;
    
    @JsonProperty("tokenIn")
    private TokenInfo tokenIn;
    
    @JsonProperty("tokenOut")
    private TokenInfo tokenOut;
    
    @JsonProperty("amountIn")
    private BigDecimal amountIn;
    
    @JsonProperty("amountOut")
    private BigDecimal amountOut;
    
    @JsonProperty("amountOutMin")
    private BigDecimal amountOutMin;
    
    @JsonProperty("priceImpact")
    private BigDecimal priceImpact;
    
    @JsonProperty("slippageTolerance")
    private BigDecimal slippageTolerance;
    
    @JsonProperty("actualSlippage")
    private BigDecimal actualSlippage;
    
    @JsonProperty("swapRoute")
    private List<SwapHop> swapRoute;
    
    @JsonProperty("gasEstimate")
    private BigDecimal gasEstimate;
    
    @JsonProperty("actualGasUsed")
    private BigDecimal actualGasUsed;
    
    @JsonProperty("gasPrice")
    private BigDecimal gasPrice;
    
    @JsonProperty("transactionFee")
    private BigDecimal transactionFee;
    
    @JsonProperty("protocolFees")
    private List<ProtocolFee> protocolFees;
    
    @JsonProperty("dexProtocol")
    private String dexProtocol;
    
    @JsonProperty("status")
    private TransactionStatus status;
    
    @JsonProperty("txHash")
    private String txHash;
    
    @JsonProperty("blockNumber")
    private Long blockNumber;
    
    @JsonProperty("createdAt")
    private Instant createdAt;
    
    @JsonProperty("executedAt")
    private Instant executedAt;
    
    @JsonProperty("deadline")
    private Instant deadline;
    
    @JsonProperty("mevProtected")
    private Boolean mevProtected;
    
    @JsonProperty("flashLoanUsed")
    private Boolean flashLoanUsed;
    
    @JsonProperty("metadata")
    private Map<String, Object> metadata;
    
    // Constructors
    public SwapTransaction() {
        this.createdAt = Instant.now();
        this.status = TransactionStatus.PENDING;
        this.mevProtected = false;
        this.flashLoanUsed = false;
        this.actualSlippage = BigDecimal.ZERO;
        this.priceImpact = BigDecimal.ZERO;
    }
    
    public SwapTransaction(String userAddress, TokenInfo tokenIn, TokenInfo tokenOut, 
                          BigDecimal amountIn, BigDecimal slippageTolerance) {
        this();
        this.userAddress = userAddress;
        this.tokenIn = tokenIn;
        this.tokenOut = tokenOut;
        this.amountIn = amountIn;
        this.slippageTolerance = slippageTolerance;
    }
    
    // Enums
    public enum TransactionStatus {
        PENDING, CONFIRMED, FAILED, EXPIRED, CANCELLED
    }
    
    // Getters and Setters
    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
    
    public String getUserAddress() { return userAddress; }
    public void setUserAddress(String userAddress) { this.userAddress = userAddress; }
    
    public TokenInfo getTokenIn() { return tokenIn; }
    public void setTokenIn(TokenInfo tokenIn) { this.tokenIn = tokenIn; }
    
    public TokenInfo getTokenOut() { return tokenOut; }
    public void setTokenOut(TokenInfo tokenOut) { this.tokenOut = tokenOut; }
    
    public BigDecimal getAmountIn() { return amountIn; }
    public void setAmountIn(BigDecimal amountIn) { this.amountIn = amountIn; }
    
    public BigDecimal getAmountOut() { return amountOut; }
    public void setAmountOut(BigDecimal amountOut) { this.amountOut = amountOut; }
    
    public BigDecimal getAmountOutMin() { return amountOutMin; }
    public void setAmountOutMin(BigDecimal amountOutMin) { this.amountOutMin = amountOutMin; }
    
    public BigDecimal getPriceImpact() { return priceImpact; }
    public void setPriceImpact(BigDecimal priceImpact) { this.priceImpact = priceImpact; }
    
    public BigDecimal getSlippageTolerance() { return slippageTolerance; }
    public void setSlippageTolerance(BigDecimal slippageTolerance) { this.slippageTolerance = slippageTolerance; }
    
    public BigDecimal getActualSlippage() { return actualSlippage; }
    public void setActualSlippage(BigDecimal actualSlippage) { this.actualSlippage = actualSlippage; }
    
    public List<SwapHop> getSwapRoute() { return swapRoute; }
    public void setSwapRoute(List<SwapHop> swapRoute) { this.swapRoute = swapRoute; }
    
    public BigDecimal getGasEstimate() { return gasEstimate; }
    public void setGasEstimate(BigDecimal gasEstimate) { this.gasEstimate = gasEstimate; }
    
    public BigDecimal getActualGasUsed() { return actualGasUsed; }
    public void setActualGasUsed(BigDecimal actualGasUsed) { this.actualGasUsed = actualGasUsed; }
    
    public BigDecimal getGasPrice() { return gasPrice; }
    public void setGasPrice(BigDecimal gasPrice) { this.gasPrice = gasPrice; }
    
    public BigDecimal getTransactionFee() { return transactionFee; }
    public void setTransactionFee(BigDecimal transactionFee) { this.transactionFee = transactionFee; }
    
    public List<ProtocolFee> getProtocolFees() { return protocolFees; }
    public void setProtocolFees(List<ProtocolFee> protocolFees) { this.protocolFees = protocolFees; }
    
    public String getDexProtocol() { return dexProtocol; }
    public void setDexProtocol(String dexProtocol) { this.dexProtocol = dexProtocol; }
    
    public TransactionStatus getStatus() { return status; }
    public void setStatus(TransactionStatus status) { this.status = status; }
    
    public String getTxHash() { return txHash; }
    public void setTxHash(String txHash) { this.txHash = txHash; }
    
    public Long getBlockNumber() { return blockNumber; }
    public void setBlockNumber(Long blockNumber) { this.blockNumber = blockNumber; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getExecutedAt() { return executedAt; }
    public void setExecutedAt(Instant executedAt) { this.executedAt = executedAt; }
    
    public Instant getDeadline() { return deadline; }
    public void setDeadline(Instant deadline) { this.deadline = deadline; }
    
    public Boolean getMevProtected() { return mevProtected; }
    public void setMevProtected(Boolean mevProtected) { this.mevProtected = mevProtected; }
    
    public Boolean getFlashLoanUsed() { return flashLoanUsed; }
    public void setFlashLoanUsed(Boolean flashLoanUsed) { this.flashLoanUsed = flashLoanUsed; }
    
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    
    // Business logic methods
    public void calculateAmountOutMin() {
        if (amountOut != null && slippageTolerance != null) {
            BigDecimal slippageMultiplier = BigDecimal.ONE.subtract(slippageTolerance);
            this.amountOutMin = amountOut.multiply(slippageMultiplier);
        }
    }
    
    public void calculateActualSlippage() {
        if (amountOut != null && amountOutMin != null && amountOut.compareTo(BigDecimal.ZERO) > 0) {
            this.actualSlippage = amountOut.subtract(amountOutMin).divide(amountOut, 6, BigDecimal.ROUND_HALF_UP);
        }
    }
    
    public BigDecimal getEffectivePrice() {
        if (amountIn == null || amountOut == null || amountOut.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return amountIn.divide(amountOut, 8, BigDecimal.ROUND_HALF_UP);
    }
    
    public BigDecimal getTotalCost() {
        BigDecimal totalFees = protocolFees != null ? 
            protocolFees.stream()
                .map(ProtocolFee::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;
        
        return (transactionFee != null ? transactionFee : BigDecimal.ZERO).add(totalFees);
    }
    
    public boolean isExpired() {
        return deadline != null && Instant.now().isAfter(deadline);
    }
    
    public boolean hasHighPriceImpact() {
        return priceImpact != null && priceImpact.compareTo(BigDecimal.valueOf(0.05)) > 0; // >5%
    }
    
    public boolean hasExcessiveSlippage() {
        return actualSlippage != null && slippageTolerance != null && 
               actualSlippage.compareTo(slippageTolerance) > 0;
    }
    
    // Inner classes
    public static class TokenInfo {
        @JsonProperty("address")
        private String address;
        
        @JsonProperty("symbol")
        private String symbol;
        
        @JsonProperty("decimals")
        private Integer decimals;
        
        @JsonProperty("priceUsd")
        private BigDecimal priceUsd;
        
        public TokenInfo() {}
        
        public TokenInfo(String address, String symbol, Integer decimals, BigDecimal priceUsd) {
            this.address = address;
            this.symbol = symbol;
            this.decimals = decimals;
            this.priceUsd = priceUsd;
        }
        
        // Getters and setters
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        
        public String getSymbol() { return symbol; }
        public void setSymbol(String symbol) { this.symbol = symbol; }
        
        public Integer getDecimals() { return decimals; }
        public void setDecimals(Integer decimals) { this.decimals = decimals; }
        
        public BigDecimal getPriceUsd() { return priceUsd; }
        public void setPriceUsd(BigDecimal priceUsd) { this.priceUsd = priceUsd; }
    }
    
    public static class SwapHop {
        @JsonProperty("poolAddress")
        private String poolAddress;
        
        @JsonProperty("tokenIn")
        private String tokenIn;
        
        @JsonProperty("tokenOut")
        private String tokenOut;
        
        @JsonProperty("amountIn")
        private BigDecimal amountIn;
        
        @JsonProperty("amountOut")
        private BigDecimal amountOut;
        
        @JsonProperty("fee")
        private BigDecimal fee;
        
        @JsonProperty("protocol")
        private String protocol;
        
        public SwapHop() {}
        
        public SwapHop(String poolAddress, String tokenIn, String tokenOut, 
                       BigDecimal amountIn, BigDecimal amountOut) {
            this.poolAddress = poolAddress;
            this.tokenIn = tokenIn;
            this.tokenOut = tokenOut;
            this.amountIn = amountIn;
            this.amountOut = amountOut;
        }
        
        // Getters and setters
        public String getPoolAddress() { return poolAddress; }
        public void setPoolAddress(String poolAddress) { this.poolAddress = poolAddress; }
        
        public String getTokenIn() { return tokenIn; }
        public void setTokenIn(String tokenIn) { this.tokenIn = tokenIn; }
        
        public String getTokenOut() { return tokenOut; }
        public void setTokenOut(String tokenOut) { this.tokenOut = tokenOut; }
        
        public BigDecimal getAmountIn() { return amountIn; }
        public void setAmountIn(BigDecimal amountIn) { this.amountIn = amountIn; }
        
        public BigDecimal getAmountOut() { return amountOut; }
        public void setAmountOut(BigDecimal amountOut) { this.amountOut = amountOut; }
        
        public BigDecimal getFee() { return fee; }
        public void setFee(BigDecimal fee) { this.fee = fee; }
        
        public String getProtocol() { return protocol; }
        public void setProtocol(String protocol) { this.protocol = protocol; }
    }
    
    public static class ProtocolFee {
        @JsonProperty("protocol")
        private String protocol;
        
        @JsonProperty("amount")
        private BigDecimal amount;
        
        @JsonProperty("token")
        private String token;
        
        @JsonProperty("percentage")
        private BigDecimal percentage;
        
        public ProtocolFee() {}
        
        public ProtocolFee(String protocol, BigDecimal amount, String token) {
            this.protocol = protocol;
            this.amount = amount;
            this.token = token;
        }
        
        // Getters and setters
        public String getProtocol() { return protocol; }
        public void setProtocol(String protocol) { this.protocol = protocol; }
        
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
        
        public BigDecimal getPercentage() { return percentage; }
        public void setPercentage(BigDecimal percentage) { this.percentage = percentage; }
    }
    
    @Override
    public String toString() {
        return String.format("SwapTransaction{id='%s', %s->%s, amount=%s, slippage=%s, status=%s}", 
                           transactionId, tokenIn != null ? tokenIn.getSymbol() : "?", 
                           tokenOut != null ? tokenOut.getSymbol() : "?", 
                           amountIn, actualSlippage, status);
    }
}
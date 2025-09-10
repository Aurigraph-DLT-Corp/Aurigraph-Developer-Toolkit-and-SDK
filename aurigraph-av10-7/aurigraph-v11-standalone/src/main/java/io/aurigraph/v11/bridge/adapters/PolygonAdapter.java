package io.aurigraph.v11.bridge.adapters;

import io.aurigraph.v11.bridge.models.ChainInfo;
import io.aurigraph.v11.bridge.models.ChainType;
import java.math.BigDecimal;
import java.util.List;

public class PolygonAdapter extends BaseChainAdapter {
    
    public PolygonAdapter(String rpcUrl, int confirmations, boolean isActive) {
        super(rpcUrl, confirmations, isActive);
    }
    
    @Override
    public void initialize() {
        this.chainInfo = ChainInfo.builder()
            .chainId(getChainId())
            .name(getChainName())
            .type(getChainType())
            .isActive(isActive)
            .averageConfirmationTime(getConfirmationTime())
            .supportedAssets(getDefaultAssets())
            .currentBlockHeight(getBaseBlockHeight())
            .networkHealth(getNetworkHealth())
            .build();
    }
    
    @Override
    protected String getChainId() { return "polygon"; }
    
    @Override
    protected String getChainName() { return "Polygon"; }
    
    @Override
    protected ChainType getChainType() { return ChainType.EVM; }
    
    @Override
    protected long getConfirmationTime() { return 4000; } // ~4 seconds
    
    @Override
    protected List<String> getDefaultAssets() {
        return List.of("MATIC", "USDC", "USDT", "DAI", "WETH");
    }
    
    @Override
    protected long getBaseBlockHeight() { return 50000000; }
    
    @Override
    protected BigDecimal calculateFee(String asset, BigDecimal amount) {
        return new BigDecimal("0.001"); // 0.001 MATIC
    }
    
    @Override
    public long getAverageConfirmationTime() { return getConfirmationTime(); }
    
    @Override
    public List<String> getSupportedAssets() { return getDefaultAssets(); }
    
    @Override
    public long getCurrentBlockHeight() {
        return getBaseBlockHeight() + (System.currentTimeMillis() / 2000);
    }
    
    @Override
    public BigDecimal estimateTransactionFee(String asset, BigDecimal amount) {
        return calculateFee(asset, amount);
    }
}
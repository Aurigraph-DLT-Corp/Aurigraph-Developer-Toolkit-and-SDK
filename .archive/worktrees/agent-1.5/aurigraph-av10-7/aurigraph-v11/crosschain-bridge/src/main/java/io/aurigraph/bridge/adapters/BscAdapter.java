package io.aurigraph.bridge.adapters;

import java.util.Arrays;
import java.util.List;

/**
 * Binance Smart Chain (BSC) Adapter
 * 
 * Extends Ethereum adapter since BSC is EVM-compatible
 * with faster block times and lower fees.
 */
public class BscAdapter extends EthereumAdapter {
    
    public BscAdapter(String rpcUrl, int requiredConfirmations) {
        super(rpcUrl, requiredConfirmations);
        this.chainId = "bsc";
        this.chainName = "BNB Smart Chain";
        this.avgBlockTime = 3000; // 3 seconds average block time
    }

    @Override
    public List<String> getSupportedAssets() {
        return Arrays.asList("BNB", "USDT", "BUSD", "USDC", "CAKE", "XVS", "ALPHA", "AUTO");
    }

    @Override
    public long getAverageConfirmationTime() {
        return 3000 * requiredConfirmations;
    }
}
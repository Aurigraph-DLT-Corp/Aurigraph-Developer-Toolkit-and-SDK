package io.aurigraph.bridge.adapters;

import java.util.Arrays;
import java.util.List;

/**
 * Polygon (MATIC) Chain Adapter
 * 
 * Extends Ethereum adapter since Polygon is EVM-compatible
 * with optimizations for faster block times and lower fees.
 */
public class PolygonAdapter extends EthereumAdapter {
    
    public PolygonAdapter(String rpcUrl, int requiredConfirmations) {
        super(rpcUrl, requiredConfirmations);
        // Override chain-specific properties
        this.chainId = "polygon";
        this.chainName = "Polygon";
        this.avgBlockTime = 2000; // 2 seconds average block time
    }

    @Override
    public List<String> getSupportedAssets() {
        return Arrays.asList("MATIC", "USDC", "USDT", "DAI", "WETH", "WMATIC", "QUICK", "AAVE");
    }

    @Override
    public long getAverageConfirmationTime() {
        return 2000 * requiredConfirmations; // Much faster than Ethereum
    }
}
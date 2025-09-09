package io.aurigraph.bridge.adapters;

import java.util.Arrays;
import java.util.List;

/**
 * Avalanche C-Chain Adapter
 * 
 * Extends Ethereum adapter since Avalanche C-Chain is EVM-compatible
 * with faster finality and lower fees.
 */
public class AvalancheAdapter extends EthereumAdapter {
    
    public AvalancheAdapter(String rpcUrl, int requiredConfirmations) {
        super(rpcUrl, requiredConfirmations);
        this.chainId = "avalanche";
        this.chainName = "Avalanche C-Chain";
        this.avgBlockTime = 2000; // 2 seconds average block time
    }

    @Override
    public List<String> getSupportedAssets() {
        return Arrays.asList("AVAX", "USDC", "USDT", "WAVAX", "PNG", "JOE", "QI", "SPELL");
    }

    @Override
    public long getAverageConfirmationTime() {
        return 2000 * requiredConfirmations;
    }
}
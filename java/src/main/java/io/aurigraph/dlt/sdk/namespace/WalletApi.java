package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.Transaction;
import io.aurigraph.dlt.sdk.dto.TransferReceipt;
import io.aurigraph.dlt.sdk.dto.TransferRequest;
import io.aurigraph.dlt.sdk.dto.WalletBalance;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Namespace for /api/v11/wallet endpoints — wallet management and transfers.
 */
public class WalletApi {

    private final AurigraphClient client;

    public WalletApi(AurigraphClient client) {
        this.client = client;
    }

    /**
     * Get the balance for a wallet address.
     */
    public WalletBalance getBalance(String address) {
        String enc = URLEncoder.encode(address, StandardCharsets.UTF_8);
        return client.get("/wallet/" + enc + "/balance", WalletBalance.class);
    }

    /**
     * Transfer tokens between wallets.
     */
    public TransferReceipt transfer(TransferRequest req) {
        return client.post("/wallet/transfer", req, TransferReceipt.class);
    }

    /**
     * Get transaction history for a wallet address.
     */
    public List<Transaction> getHistory(String address) {
        String enc = URLEncoder.encode(address, StandardCharsets.UTF_8);
        return client.get("/wallet/" + enc + "/history", new TypeReference<List<Transaction>>() {});
    }
}

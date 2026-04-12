package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.Proposal;
import io.aurigraph.dlt.sdk.dto.TreasuryStats;
import io.aurigraph.dlt.sdk.dto.VoteReceipt;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Namespace for /api/v11/governance endpoints — on-chain governance.
 */
public class GovernanceApi {

    private final AurigraphClient client;

    public GovernanceApi(AurigraphClient client) {
        this.client = client;
    }

    /**
     * List all governance proposals.
     */
    public List<Proposal> listProposals() {
        return client.get("/governance/proposals", new TypeReference<List<Proposal>>() {});
    }

    /**
     * Cast a vote on a governance proposal.
     */
    public VoteReceipt vote(String proposalId, boolean approve) {
        String enc = URLEncoder.encode(proposalId, StandardCharsets.UTF_8);
        return client.post("/governance/proposals/" + enc + "/vote",
                Map.of("approve", approve), VoteReceipt.class);
    }

    /**
     * Get governance treasury statistics.
     */
    public TreasuryStats getTreasury() {
        return client.get("/governance/treasury", TreasuryStats.class);
    }
}

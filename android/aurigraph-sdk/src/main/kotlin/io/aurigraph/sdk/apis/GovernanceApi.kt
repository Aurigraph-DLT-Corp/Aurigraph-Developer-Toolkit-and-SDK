package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.Proposal
import io.aurigraph.sdk.models.TreasuryStats
import io.aurigraph.sdk.models.VoteReceipt
import io.aurigraph.sdk.models.VoteRequest

/**
 * On-chain governance -- proposals, voting, and treasury.
 */
class GovernanceApi(private val client: AurigraphClient) {

    /** List all governance proposals. */
    suspend fun listProposals(): List<Proposal> = client.get("/governance/proposals")

    /** Get a specific governance proposal by ID. */
    suspend fun getProposal(proposalId: String): Proposal =
        client.get("/governance/proposals/$proposalId")

    /** Cast a vote on a governance proposal. */
    suspend fun vote(proposalId: String, approve: Boolean): VoteReceipt =
        client.post("/governance/proposals/$proposalId/vote", VoteRequest(approve))

    /** Get governance treasury statistics. */
    suspend fun getTreasury(): TreasuryStats = client.get("/governance/treasury")
}

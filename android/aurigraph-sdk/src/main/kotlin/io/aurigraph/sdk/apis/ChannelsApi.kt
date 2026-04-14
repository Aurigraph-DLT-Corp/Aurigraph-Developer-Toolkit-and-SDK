package io.aurigraph.sdk.apis

import io.aurigraph.sdk.AurigraphClient
import io.aurigraph.sdk.models.Channel

/**
 * Channel management -- listing and querying channels.
 */
class ChannelsApi(private val client: AurigraphClient) {

    /** List all channels. */
    suspend fun list(): List<Channel> = client.get("/channels")

    /** Get a specific channel by ID. */
    suspend fun get(channelId: String): Channel = client.get("/channels/$channelId")
}

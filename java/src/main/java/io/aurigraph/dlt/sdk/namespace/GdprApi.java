package io.aurigraph.dlt.sdk.namespace;

import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.ErasureReceipt;
import io.aurigraph.dlt.sdk.dto.GdprExportPayload;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Namespace for /api/v11/gdpr endpoints — GDPR data export and erasure.
 */
public class GdprApi {

    private final AurigraphClient client;

    public GdprApi(AurigraphClient client) {
        this.client = client;
    }

    /**
     * Export all user data for the given user ID (GDPR Article 20 — data portability).
     */
    public GdprExportPayload exportUserData(String userId) {
        String enc = URLEncoder.encode(userId, StandardCharsets.UTF_8);
        return client.get("/gdpr/export/" + enc, GdprExportPayload.class);
    }

    /**
     * Download user data as a raw byte array (e.g. ZIP archive).
     */
    public byte[] downloadUserData(String userId) {
        String enc = URLEncoder.encode(userId, StandardCharsets.UTF_8);
        return client.get("/gdpr/export/" + enc + "/download", byte[].class);
    }

    /**
     * Request erasure of all user data (GDPR Article 17 — right to be forgotten).
     */
    public ErasureReceipt requestErasure(String userId) {
        String enc = URLEncoder.encode(userId, StandardCharsets.UTF_8);
        return client.delete("/gdpr/erasure/" + enc, ErasureReceipt.class);
    }
}

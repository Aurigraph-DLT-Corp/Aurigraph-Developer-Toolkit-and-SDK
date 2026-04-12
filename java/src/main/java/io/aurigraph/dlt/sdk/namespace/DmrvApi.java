package io.aurigraph.dlt.sdk.namespace;

import com.fasterxml.jackson.core.type.TypeReference;
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.AuditFilter;
import io.aurigraph.dlt.sdk.dto.BatchReceipt;
import io.aurigraph.dlt.sdk.dto.DmrvEvent;
import io.aurigraph.dlt.sdk.dto.DmrvReceipt;
import io.aurigraph.dlt.sdk.dto.MintReceipt;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Namespace for /api/v11/dmrv and /api/v11/active-contracts/{id}/trigger-mint.
 */
public class DmrvApi {

    /** Max events per batch request — matches the V12 server limit. */
    public static final int BATCH_CHUNK_SIZE = 50;

    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
            Pattern.CASE_INSENSITIVE);

    private final AurigraphClient client;

    public DmrvApi(AurigraphClient client) {
        this.client = client;
    }

    public static boolean isUuid(String s) {
        return s != null && UUID_PATTERN.matcher(s).matches();
    }

    /** Submit a single DMRV measurement. */
    public DmrvReceipt recordEvent(DmrvEvent event) {
        return client.post("/dmrv/events", event, DmrvReceipt.class);
    }

    /** Query the DMRV audit trail. */
    public List<DmrvEvent> getAuditTrail(AuditFilter filter) {
        StringBuilder sb = new StringBuilder("/dmrv/audit-trail");
        if (filter != null) {
            List<String> parts = new ArrayList<>();
            appendParam(parts, "contractId", filter.contractId);
            appendParam(parts, "deviceId", filter.deviceId);
            appendParam(parts, "eventType", filter.eventType);
            appendParam(parts, "fromTimestamp", filter.fromTimestamp);
            appendParam(parts, "toTimestamp", filter.toTimestamp);
            if (filter.limit != null) {
                parts.add("limit=" + filter.limit);
            }
            if (!parts.isEmpty()) {
                sb.append("?").append(String.join("&", parts));
            }
        }
        // V12 returns either a bare array or { events: [...] } — handle both.
        Map<String, Object> wrapper = client.get(sb.toString(),
                new TypeReference<Map<String, Object>>() {});
        if (wrapper == null) return new ArrayList<>();
        Object events = wrapper.get("events");
        if (events == null) events = wrapper.get("items");
        if (events == null) events = wrapper.get("data");
        if (events instanceof List) {
            return client.mapper().convertValue(events,
                    new TypeReference<List<DmrvEvent>>() {});
        }
        return new ArrayList<>();
    }

    /**
     * Record many events. Automatically splits into chunks of 50 and merges
     * the receipts from each chunk.
     */
    public BatchReceipt batchRecord(List<DmrvEvent> events) {
        BatchReceipt merged = new BatchReceipt();
        if (events == null || events.isEmpty()) return merged;

        for (int i = 0; i < events.size(); i += BATCH_CHUNK_SIZE) {
            int end = Math.min(i + BATCH_CHUNK_SIZE, events.size());
            List<DmrvEvent> chunk = events.subList(i, end);
            Map<String, Object> body = new HashMap<>();
            body.put("events", chunk);
            BatchReceipt r = client.post("/dmrv/events/batch", body, BatchReceipt.class);
            if (r == null) continue;
            merged.accepted += r.accepted;
            merged.rejected += r.rejected;
            if (r.receipts != null) merged.receipts.addAll(r.receipts);
            if (r.errors != null) {
                final int offset = i;
                for (BatchReceipt.BatchError err : r.errors) {
                    BatchReceipt.BatchError copy = new BatchReceipt.BatchError();
                    copy.index = err.index + offset;
                    copy.message = err.message;
                    copy.errorCode = err.errorCode;
                    merged.errors.add(copy);
                }
            }
        }
        return merged;
    }

    /**
     * Trigger a mint on an active Ricardian contract. Validates the contract id
     * is a UUID client-side — throws {@link IllegalArgumentException} on bad input.
     */
    public MintReceipt triggerMint(String contractId, String eventType, double quantity) {
        if (!isUuid(contractId)) {
            throw new IllegalArgumentException(
                    "DmrvApi.triggerMint: contractId must be a UUID, got '" + contractId + "'");
        }
        if (quantity <= 0 || Double.isNaN(quantity) || Double.isInfinite(quantity)) {
            throw new IllegalArgumentException(
                    "DmrvApi.triggerMint: quantity must be positive, got " + quantity);
        }
        String enc = URLEncoder.encode(contractId, StandardCharsets.UTF_8);
        Map<String, Object> body = new HashMap<>();
        body.put("eventType", eventType);
        body.put("quantity", quantity);
        return client.post("/active-contracts/" + enc + "/trigger-mint", body, MintReceipt.class);
    }

    private void appendParam(List<String> out, String key, String value) {
        if (value == null) return;
        out.add(key + "=" + URLEncoder.encode(value, StandardCharsets.UTF_8));
    }
}

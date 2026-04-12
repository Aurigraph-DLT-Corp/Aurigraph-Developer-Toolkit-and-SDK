package io.aurigraph.dlt.sdk.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Deterministic SHA-256 idempotency key for mutating SDK requests.
 *
 * <p>The input payload is first serialised to JSON, then canonicalised
 * (object keys sorted alphabetically), then hashed. This guarantees that
 * two callers passing the same logical payload — even with different key
 * ordering — produce the same key.
 */
public final class IdempotencyKey {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private IdempotencyKey() {}

    /**
     * Generate a SHA-256 idempotency key for the given payload.
     *
     * @param payload any JSON-serialisable value (Map, POJO, list, primitive).
     * @return 64-character hex string.
     */
    public static String generate(Object payload) {
        try {
            JsonNode node = MAPPER.valueToTree(payload);
            String canonical = canonicalize(node);
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(canonical.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /** Canonicalise a JsonNode — sort object keys, preserve array order. */
    static String canonicalize(JsonNode node) {
        if (node == null || node.isNull()) return "null";
        if (node.isBoolean()) return node.asBoolean() ? "true" : "false";
        if (node.isNumber()) return node.numberValue().toString();
        if (node.isTextual()) return "\"" + escape(node.asText()) + "\"";
        if (node.isArray()) {
            ArrayNode arr = (ArrayNode) node;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(canonicalize(arr.get(i)));
            }
            return sb.append("]").toString();
        }
        if (node.isObject()) {
            ObjectNode obj = (ObjectNode) node;
            List<String> keys = new ArrayList<>();
            Iterator<Map.Entry<String, JsonNode>> it = obj.fields();
            while (it.hasNext()) keys.add(it.next().getKey());
            Collections.sort(keys);
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (String k : keys) {
                JsonNode v = obj.get(k);
                if (v == null || v.isMissingNode()) continue;
                if (!first) sb.append(",");
                first = false;
                sb.append("\"").append(escape(k)).append("\":").append(canonicalize(v));
            }
            return sb.append("}").toString();
        }
        return "\"" + escape(node.toString()) + "\"";
    }

    private static String escape(String s) {
        StringBuilder sb = new StringBuilder(s.length() + 2);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '\\': sb.append("\\\\"); break;
                case '"':  sb.append("\\\""); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }

    private static String toHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b & 0xff));
        }
        return sb.toString();
    }
}

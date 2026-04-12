package io.aurigraph.dlt.sdk.dto;

/**
 * Query filter for the DMRV audit trail endpoint.
 * Any null field is omitted from the query string.
 */
public class AuditFilter {
    public String contractId;
    public String deviceId;
    public String eventType;
    public String fromTimestamp;
    public String toTimestamp;
    public Integer limit;

    public AuditFilter() {}

    public AuditFilter contractId(String v) { this.contractId = v; return this; }
    public AuditFilter deviceId(String v) { this.deviceId = v; return this; }
    public AuditFilter eventType(String v) { this.eventType = v; return this; }
    public AuditFilter fromTimestamp(String v) { this.fromTimestamp = v; return this; }
    public AuditFilter toTimestamp(String v) { this.toTimestamp = v; return this; }
    public AuditFilter limit(Integer v) { this.limit = v; return this; }
}

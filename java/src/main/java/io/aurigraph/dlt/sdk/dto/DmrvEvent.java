package io.aurigraph.dlt.sdk.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * Single DMRV (Digital Measurement, Reporting & Verification) event —
 * sensor / meter / device reading submitted to the V12 DMRV namespace.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DmrvEvent {
    public String eventId;
    public String deviceId;
    public String eventType;
    public Double quantity;
    public String unit;
    public String timestamp;
    public String contractId;
    public Map<String, Object> location;
    public Map<String, Object> metadata;

    public DmrvEvent() {}

    public DmrvEvent(String deviceId, String eventType, double quantity) {
        this.deviceId = deviceId;
        this.eventType = eventType;
        this.quantity = quantity;
    }
}

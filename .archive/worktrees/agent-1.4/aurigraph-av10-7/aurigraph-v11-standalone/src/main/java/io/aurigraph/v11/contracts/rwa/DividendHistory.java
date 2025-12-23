package io.aurigraph.v11.contracts.rwa;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Historical dividend information for a token
 */
public class DividendHistory {
    private final String tokenId;
    private final List<DividendEvent> events;
    private final BigDecimal totalDistributed;
    private final BigDecimal totalNet;
    private final Instant fromDate;
    private final Instant toDate;

    public DividendHistory(String tokenId, List<DividendEvent> events, BigDecimal totalDistributed,
                          BigDecimal totalNet, Instant fromDate, Instant toDate) {
        this.tokenId = tokenId;
        this.events = events;
        this.totalDistributed = totalDistributed;
        this.totalNet = totalNet;
        this.fromDate = fromDate;
        this.toDate = toDate;
    }

    public int getEventCount() {
        return events.size();
    }

    public BigDecimal getTotalTaxWithheld() {
        return totalDistributed.subtract(totalNet);
    }

    // Getters
    public String getTokenId() { return tokenId; }
    public List<DividendEvent> getEvents() { return events; }
    public BigDecimal getTotalDistributed() { return totalDistributed; }
    public BigDecimal getTotalNet() { return totalNet; }
    public Instant getFromDate() { return fromDate; }
    public Instant getToDate() { return toDate; }
}
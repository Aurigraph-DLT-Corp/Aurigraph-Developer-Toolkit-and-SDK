package io.aurigraph.v11.hms;

public class HMSOrder {
    public final String orderId;
    public final String status;
    
    public HMSOrder(String orderId, String status) {
        this.orderId = orderId;
        this.status = status;
    }
}

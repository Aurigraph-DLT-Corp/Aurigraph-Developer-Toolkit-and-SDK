package io.aurigraph.v11.quantconnect;

import java.time.Instant;

/**
 * Transaction Data Model
 *
 * Represents transaction data from QuantConnect API.
 * Captures equity trades for tokenization on Aurigraph DLT.
 *
 * @author Aurigraph DLT Team
 * @version 12.0.0
 */
public class TransactionData {

    private String transactionId;
    private String symbol;
    private String type;  // BUY, SELL, LIMIT_BUY, LIMIT_SELL, MARKET
    private int quantity;
    private double price;
    private Instant timestamp;
    private String exchange;
    private String orderId;
    private String status = "COMPLETED";
    private double fees;
    private String currency = "USD";

    public TransactionData() {}

    public TransactionData(String transactionId, String symbol, String type, int quantity, double price) {
        this.transactionId = transactionId;
        this.symbol = symbol;
        this.type = type;
        this.quantity = quantity;
        this.price = price;
        this.timestamp = Instant.now();
    }

    // Calculated fields

    public double getTotalValue() {
        return quantity * price;
    }

    // Getters and Setters

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getExchange() {
        return exchange;
    }

    public void setExchange(String exchange) {
        this.exchange = exchange;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getFees() {
        return fees;
    }

    public void setFees(double fees) {
        this.fees = fees;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    @Override
    public String toString() {
        return String.format("TransactionData{id='%s', symbol='%s', type='%s', qty=%d, price=%.2f, total=%.2f}",
            transactionId, symbol, type, quantity, price, getTotalValue());
    }
}

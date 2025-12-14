package io.aurigraph.v11.quantconnect;

import java.time.Instant;

/**
 * Equity Data Model
 *
 * Represents real-time equity data from QuantConnect API.
 * Used for tokenization on Aurigraph DLT via External Integration (EI) Node.
 *
 * @author Aurigraph DLT Team
 * @version 12.0.0
 */
public class EquityData {

    private String symbol;
    private String name;
    private double price;
    private double open;
    private double high;
    private double low;
    private long volume;
    private long marketCap;
    private double change24h;
    private Instant timestamp;
    private String exchange;
    private String currency = "USD";

    public EquityData() {}

    public EquityData(String symbol, String name, double price) {
        this.symbol = symbol;
        this.name = name;
        this.price = price;
        this.timestamp = Instant.now();
    }

    // Getters and Setters

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public double getOpen() {
        return open;
    }

    public void setOpen(double open) {
        this.open = open;
    }

    public double getHigh() {
        return high;
    }

    public void setHigh(double high) {
        this.high = high;
    }

    public double getLow() {
        return low;
    }

    public void setLow(double low) {
        this.low = low;
    }

    public long getVolume() {
        return volume;
    }

    public void setVolume(long volume) {
        this.volume = volume;
    }

    public long getMarketCap() {
        return marketCap;
    }

    public void setMarketCap(long marketCap) {
        this.marketCap = marketCap;
    }

    public double getChange24h() {
        return change24h;
    }

    public void setChange24h(double change24h) {
        this.change24h = change24h;
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

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    @Override
    public String toString() {
        return String.format("EquityData{symbol='%s', name='%s', price=%.2f, change24h=%.2f%%, volume=%d}",
            symbol, name, price, change24h, volume);
    }
}

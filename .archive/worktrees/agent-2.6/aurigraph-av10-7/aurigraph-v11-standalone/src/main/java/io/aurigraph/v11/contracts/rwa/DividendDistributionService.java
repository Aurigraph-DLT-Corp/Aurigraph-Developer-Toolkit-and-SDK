package io.aurigraph.v11.contracts.rwa;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.quarkus.logging.Log;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enhanced Dividend Distribution Service for RWA Tokens
 * Features: Automated distribution, tax handling, reinvestment options, yield tracking
 */
@ApplicationScoped
public class DividendDistributionService {

    @Inject
    FractionalOwnershipService fractionalOwnershipService;

    // Dividend schedules and configurations
    private final Map<String, DividendSchedule> dividendSchedules = new ConcurrentHashMap<>();
    private final Map<String, List<DividendEvent>> dividendHistory = new ConcurrentHashMap<>();
    private final Map<String, DividendConfiguration> dividendConfigs = new ConcurrentHashMap<>();

    /**
     * Set up automated dividend distribution schedule
     */
    public Uni<Boolean> setupDividendSchedule(String tokenId, DividendSchedule schedule) {
        return Uni.createFrom().item(() -> {
            // Validate schedule
            if (schedule.getDistributionFrequency() == null) {
                throw new IllegalArgumentException("Distribution frequency is required");
            }

            if (schedule.getMinimumDividendAmount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Minimum dividend amount must be positive");
            }

            dividendSchedules.put(tokenId, schedule);
            
            Log.infof("Set up dividend schedule for token %s with frequency %s", 
                tokenId, schedule.getDistributionFrequency());
            
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Configure dividend distribution parameters
     */
    public Uni<Boolean> configureDividendDistribution(String tokenId, DividendConfiguration config) {
        return Uni.createFrom().item(() -> {
            dividendConfigs.put(tokenId, config);
            
            Log.infof("Configured dividend distribution for token %s with tax handling: %s, reinvestment: %s", 
                tokenId, config.isWithholdTax(), config.isAllowReinvestment());
            
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Execute dividend distribution with advanced features
     */
    public Uni<EnhancedDividendResult> distributeDividends(String tokenId, BigDecimal totalAmount, 
                                                         String source, DividendType dividendType) {
        return Uni.createFrom().item(() -> {
            long startTime = System.nanoTime();
            
            DividendConfiguration config = dividendConfigs.getOrDefault(tokenId, new DividendConfiguration());
            
            // Calculate net dividend amount after taxes
            BigDecimal netAmount = calculateNetDividendAmount(totalAmount, config);
            
            // Get shareholder information
            List<EnhancedDividendPayment> payments = new ArrayList<>();
            
            // Create dividend event
            DividendEvent event = new DividendEvent(
                UUID.randomUUID().toString(),
                tokenId,
                totalAmount,
                netAmount,
                source,
                dividendType,
                Instant.now(),
                config
            );

            // Simulate distribution to shareholders (in real implementation, would fetch from registry)
            createDividendPayments(tokenId, netAmount, event, payments, config);
            
            // Process reinvestment options
            processReinvestmentOptions(tokenId, payments, config);
            
            // Record dividend event
            dividendHistory.computeIfAbsent(tokenId, k -> new ArrayList<>()).add(event);
            
            long endTime = System.nanoTime();
            
            Log.infof("Distributed %s in dividends (%s net) to %d shareholders of token %s", 
                totalAmount, netAmount, payments.size(), tokenId);

            return new EnhancedDividendResult(
                true,
                "Enhanced dividend distribution completed successfully",
                event,
                payments,
                endTime - startTime
            );
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Calculate projected dividends based on historical data
     */
    public Uni<DividendProjection> calculateDividendProjection(String tokenId, int monthsAhead) {
        return Uni.createFrom().item(() -> {
            List<DividendEvent> history = dividendHistory.getOrDefault(tokenId, new ArrayList<>());
            
            if (history.isEmpty()) {
                return new DividendProjection(tokenId, BigDecimal.ZERO, BigDecimal.ZERO, 
                                            BigDecimal.ZERO, monthsAhead);
            }

            // Calculate average dividend over last 12 months
            Instant oneYearAgo = Instant.now().minus(365, ChronoUnit.DAYS);
            List<DividendEvent> recentDividends = history.stream()
                .filter(event -> event.getDistributionDate().isAfter(oneYearAgo))
                .toList();

            BigDecimal totalRecentDividends = recentDividends.stream()
                .map(DividendEvent::getNetAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal averageMonthlyDividend = totalRecentDividends.divide(
                new BigDecimal(Math.max(1, recentDividends.size())), 4, RoundingMode.HALF_UP);

            BigDecimal projectedTotal = averageMonthlyDividend.multiply(new BigDecimal(monthsAhead));
            
            // Calculate yield based on current asset value (simplified)
            BigDecimal annualizedYield = averageMonthlyDividend.multiply(new BigDecimal(12));

            return new DividendProjection(
                tokenId,
                averageMonthlyDividend,
                projectedTotal,
                annualizedYield,
                monthsAhead
            );
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get dividend history for a token
     */
    public Uni<DividendHistory> getDividendHistory(String tokenId, Instant fromDate, Instant toDate) {
        return Uni.createFrom().item(() -> {
            List<DividendEvent> events = dividendHistory.getOrDefault(tokenId, new ArrayList<>())
                .stream()
                .filter(event -> !event.getDistributionDate().isBefore(fromDate) && 
                               !event.getDistributionDate().isAfter(toDate))
                .toList();

            BigDecimal totalDistributed = events.stream()
                .map(DividendEvent::getGrossAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalNet = events.stream()
                .map(DividendEvent::getNetAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            return new DividendHistory(tokenId, events, totalDistributed, totalNet, fromDate, toDate);
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Process pending dividend distributions based on schedules
     */
    public Uni<List<String>> processPendingDividends() {
        return Uni.createFrom().item(() -> {
            List<String> processedTokens = new ArrayList<>();
            
            for (Map.Entry<String, DividendSchedule> entry : dividendSchedules.entrySet()) {
                String tokenId = entry.getKey();
                DividendSchedule schedule = entry.getValue();
                
                if (shouldDistributeDividend(tokenId, schedule)) {
                    // Auto-distribute accumulated dividends
                    BigDecimal accumulatedAmount = getAccumulatedDividendAmount(tokenId, schedule);
                    
                    if (accumulatedAmount.compareTo(schedule.getMinimumDividendAmount()) >= 0) {
                        distributeDividends(tokenId, accumulatedAmount, "AUTOMATED_DISTRIBUTION", 
                                         DividendType.REGULAR).await().indefinitely();
                        processedTokens.add(tokenId);
                    }
                }
            }
            
            Log.infof("Processed %d automated dividend distributions", processedTokens.size());
            return processedTokens;
            
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // Private helper methods

    private BigDecimal calculateNetDividendAmount(BigDecimal grossAmount, DividendConfiguration config) {
        if (!config.isWithholdTax()) {
            return grossAmount;
        }
        
        BigDecimal taxAmount = grossAmount.multiply(config.getTaxRate());
        return grossAmount.subtract(taxAmount);
    }

    private void createDividendPayments(String tokenId, BigDecimal netAmount, DividendEvent event,
                                      List<EnhancedDividendPayment> payments, DividendConfiguration config) {
        // In a real implementation, this would fetch actual shareholders from the registry
        // For now, simulate with mock data
        
        // Simulate 10 shareholders with different shareholdings
        for (int i = 1; i <= 10; i++) {
            String shareholderAddress = String.format("0x%040d", i);
            int shareCount = 100 * i; // Varying share counts
            BigDecimal holderAmount = netAmount.multiply(new BigDecimal(shareCount))
                                             .divide(new BigDecimal(5500), 8, RoundingMode.HALF_UP); // Total 5500 shares
            
            EnhancedDividendPayment payment = new EnhancedDividendPayment(
                shareholderAddress,
                shareCount,
                holderAmount,
                event.getDistributionDate(),
                config.isWithholdTax() ? calculateTaxWithheld(holderAmount, config) : BigDecimal.ZERO,
                config.isAllowReinvestment() && (i % 3 == 0) // Every 3rd shareholder opts for reinvestment
            );
            
            payments.add(payment);
        }
    }

    private BigDecimal calculateTaxWithheld(BigDecimal amount, DividendConfiguration config) {
        return amount.multiply(config.getTaxRate()).divide(
            BigDecimal.ONE.subtract(config.getTaxRate()), 8, RoundingMode.HALF_UP);
    }

    private void processReinvestmentOptions(String tokenId, List<EnhancedDividendPayment> payments, 
                                          DividendConfiguration config) {
        if (!config.isAllowReinvestment()) {
            return;
        }

        for (EnhancedDividendPayment payment : payments) {
            if (payment.isReinvestmentSelected()) {
                // Calculate additional shares from reinvestment
                BigDecimal reinvestmentAmount = payment.getNetAmount();
                // In real implementation, would use current share price
                BigDecimal sharePrice = new BigDecimal("100"); // Mock share price
                
                BigDecimal additionalShares = reinvestmentAmount.divide(sharePrice, 4, RoundingMode.DOWN);
                payment.setReinvestedShares(additionalShares);
                
                Log.debugf("Reinvested %s for %s shares for holder %s", 
                    reinvestmentAmount, additionalShares, payment.getRecipientAddress());
            }
        }
    }

    private boolean shouldDistributeDividend(String tokenId, DividendSchedule schedule) {
        List<DividendEvent> history = dividendHistory.getOrDefault(tokenId, new ArrayList<>());
        
        if (history.isEmpty()) {
            return true; // First distribution
        }
        
        DividendEvent lastDistribution = history.get(history.size() - 1);
        Instant nextDistributionDate = calculateNextDistributionDate(lastDistribution.getDistributionDate(), 
                                                                    schedule.getDistributionFrequency());
        
        return Instant.now().isAfter(nextDistributionDate);
    }

    private Instant calculateNextDistributionDate(Instant lastDistribution, DistributionFrequency frequency) {
        return switch (frequency) {
            case WEEKLY -> lastDistribution.plus(7, ChronoUnit.DAYS);
            case MONTHLY -> lastDistribution.plus(30, ChronoUnit.DAYS);
            case QUARTERLY -> lastDistribution.plus(90, ChronoUnit.DAYS);
            case ANNUALLY -> lastDistribution.plus(365, ChronoUnit.DAYS);
        };
    }

    private BigDecimal getAccumulatedDividendAmount(String tokenId, DividendSchedule schedule) {
        // In a real implementation, this would calculate accumulated income from the asset
        // For now, return a mock accumulated amount
        return schedule.getMinimumDividendAmount().multiply(new BigDecimal("1.5"));
    }
}
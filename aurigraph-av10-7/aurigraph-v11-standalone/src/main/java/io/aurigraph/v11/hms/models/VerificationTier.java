package io.aurigraph.v11.hms.models;

/**
 * Verification tiers based on asset value
 */
public enum VerificationTier {
    TIER_1(1, 100000, 1),      // <$100K - 1 verifier
    TIER_2(100000, 1000000, 2),  // $100K-$1M - 2 verifiers
    TIER_3(1000000, 10000000, 3), // $1M-$10M - 3 verifiers
    TIER_4(10000000, Long.MAX_VALUE, 5); // >$10M - 5 verifiers

    private final long minValue;
    private final long maxValue;
    private final int requiredVerifiers;

    VerificationTier(long minValue, long maxValue, int requiredVerifiers) {
        this.minValue = minValue;
        this.maxValue = maxValue;
        this.requiredVerifiers = requiredVerifiers;
    }

    public long getMinValue() {
        return minValue;
    }

    public long getMaxValue() {
        return maxValue;
    }

    public int getRequiredVerifiers() {
        return requiredVerifiers;
    }

    public static VerificationTier getTierByValue(long assetValue) {
        for (VerificationTier tier : values()) {
            if (assetValue >= tier.minValue && assetValue < tier.maxValue) {
                return tier;
            }
        }
        return TIER_1; // Default to lowest tier
    }
}

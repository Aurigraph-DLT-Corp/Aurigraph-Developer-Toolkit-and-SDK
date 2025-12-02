package io.aurigraph.v11.marketplace;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Marketplace Service for Asset Tokenization Marketplace
 *
 * Implements AV11-520: Marketplace Listing & Discovery
 *
 * Features:
 * - Asset browsing by category
 * - Full-text search with keyword matching
 * - Advanced filtering (price, location, verification status)
 * - Sorting (newest, price, popularity)
 * - Favorites/watchlist system
 *
 * @author Backend Development Agent (BDA)
 * @ticket AV11-520
 * @version 11.0.0
 */
@ApplicationScoped
public class MarketplaceService {

    private static final Logger LOG = Logger.getLogger(MarketplaceService.class);

    // In-memory storage for demo (would be replaced with database/Elasticsearch in production)
    private final Map<String, AssetListing> assetListings = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> userFavorites = new ConcurrentHashMap<>();
    private final Map<String, Integer> assetViews = new ConcurrentHashMap<>();

    public MarketplaceService() {
        initializeSampleAssets();
    }

    /**
     * Search and filter marketplace assets
     */
    public Uni<MarketplaceSearchResponse> searchAssets(MarketplaceSearchRequest request) {
        return Uni.createFrom().item(() -> {
            LOG.infof("Searching marketplace: keyword=%s, category=%s, minPrice=%s, maxPrice=%s",
                    request.getKeyword(), request.getCategory(), request.getMinPrice(), request.getMaxPrice());

            long startTime = System.currentTimeMillis();

            List<AssetListing> filteredAssets = assetListings.values().stream()
                    // Filter by category
                    .filter(asset -> request.getCategory() == null ||
                            request.getCategory().isEmpty() ||
                            asset.getCategory().equalsIgnoreCase(request.getCategory()))
                    // Filter by keyword
                    .filter(asset -> request.getKeyword() == null ||
                            request.getKeyword().isEmpty() ||
                            matchesKeyword(asset, request.getKeyword()))
                    // Filter by price range
                    .filter(asset -> request.getMinPrice() == null ||
                            asset.getPrice().compareTo(request.getMinPrice()) >= 0)
                    .filter(asset -> request.getMaxPrice() == null ||
                            asset.getPrice().compareTo(request.getMaxPrice()) <= 0)
                    // Filter by verification status
                    .filter(asset -> request.getVerificationStatus() == null ||
                            request.getVerificationStatus().isEmpty() ||
                            asset.getVerificationStatus().equalsIgnoreCase(request.getVerificationStatus()))
                    // Filter by location
                    .filter(asset -> request.getLocation() == null ||
                            request.getLocation().isEmpty() ||
                            asset.getLocation().toLowerCase().contains(request.getLocation().toLowerCase()))
                    .collect(Collectors.toList());

            // Sort results
            sortAssets(filteredAssets, request.getSortBy(), request.getSortOrder());

            // Calculate total before pagination
            int totalResults = filteredAssets.size();

            // Apply pagination
            int offset = request.getOffset() != null ? request.getOffset() : 0;
            int limit = request.getLimit() != null ? request.getLimit() : 20;

            List<AssetListing> paginatedAssets = filteredAssets.stream()
                    .skip(offset)
                    .limit(limit)
                    .collect(Collectors.toList());

            // Add user's favorites if userId provided
            if (request.getUserId() != null) {
                Set<String> favorites = userFavorites.getOrDefault(request.getUserId(), Collections.emptySet());
                paginatedAssets.forEach(asset -> asset.setFavorited(favorites.contains(asset.getAssetId())));
            }

            long searchTime = System.currentTimeMillis() - startTime;

            MarketplaceSearchResponse response = new MarketplaceSearchResponse();
            response.setAssets(paginatedAssets);
            response.setTotalResults(totalResults);
            response.setOffset(offset);
            response.setLimit(limit);
            response.setSearchTimeMs(searchTime);
            response.setTimestamp(Instant.now().toString());

            LOG.infof("Marketplace search completed: %d results in %dms", totalResults, searchTime);
            return response;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get asset details by ID
     */
    public Uni<AssetListing> getAssetById(String assetId, String userId) {
        return Uni.createFrom().item(() -> {
            AssetListing asset = assetListings.get(assetId);
            if (asset != null) {
                // Increment view count
                assetViews.merge(assetId, 1, Integer::sum);
                asset.setViewCount(assetViews.get(assetId));

                // Check if favorited by user
                if (userId != null) {
                    Set<String> favorites = userFavorites.getOrDefault(userId, Collections.emptySet());
                    asset.setFavorited(favorites.contains(assetId));
                }
            }
            return asset;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get assets by category
     */
    public Uni<List<AssetListing>> getAssetsByCategory(String category, int limit) {
        return Uni.createFrom().item(() -> {
            return assetListings.values().stream()
                    .filter(asset -> asset.getCategory().equalsIgnoreCase(category))
                    .sorted(Comparator.comparing(AssetListing::getCreatedAt).reversed())
                    .limit(limit)
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get featured/trending assets
     */
    public Uni<List<AssetListing>> getFeaturedAssets(int limit) {
        return Uni.createFrom().item(() -> {
            return assetListings.values().stream()
                    .filter(AssetListing::isFeatured)
                    .sorted(Comparator.comparing(AssetListing::getViewCount).reversed())
                    .limit(limit)
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Add asset to user's favorites
     */
    public Uni<Boolean> addToFavorites(String userId, String assetId) {
        return Uni.createFrom().item(() -> {
            if (!assetListings.containsKey(assetId)) {
                return false;
            }
            userFavorites.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(assetId);

            // Update favorite count on asset
            AssetListing asset = assetListings.get(assetId);
            if (asset != null) {
                asset.setFavoriteCount(asset.getFavoriteCount() + 1);
            }

            LOG.infof("User %s added asset %s to favorites", userId, assetId);
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Remove asset from user's favorites
     */
    public Uni<Boolean> removeFromFavorites(String userId, String assetId) {
        return Uni.createFrom().item(() -> {
            Set<String> favorites = userFavorites.get(userId);
            if (favorites == null || !favorites.remove(assetId)) {
                return false;
            }

            // Update favorite count on asset
            AssetListing asset = assetListings.get(assetId);
            if (asset != null && asset.getFavoriteCount() > 0) {
                asset.setFavoriteCount(asset.getFavoriteCount() - 1);
            }

            LOG.infof("User %s removed asset %s from favorites", userId, assetId);
            return true;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get user's favorite assets
     */
    public Uni<List<AssetListing>> getUserFavorites(String userId) {
        return Uni.createFrom().item(() -> {
            Set<String> favorites = userFavorites.getOrDefault(userId, Collections.emptySet());
            return favorites.stream()
                    .map(assetListings::get)
                    .filter(Objects::nonNull)
                    .peek(asset -> asset.setFavorited(true))
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get marketplace statistics
     */
    public Uni<MarketplaceStats> getMarketplaceStats() {
        return Uni.createFrom().item(() -> {
            MarketplaceStats stats = new MarketplaceStats();
            stats.setTotalAssets(assetListings.size());
            stats.setTotalValue(assetListings.values().stream()
                    .map(AssetListing::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add));
            stats.setVerifiedAssets((int) assetListings.values().stream()
                    .filter(a -> "verified".equalsIgnoreCase(a.getVerificationStatus()))
                    .count());
            stats.setTotalViews(assetViews.values().stream().mapToInt(Integer::intValue).sum());

            // Category counts
            Map<String, Long> categoryBreakdown = assetListings.values().stream()
                    .collect(Collectors.groupingBy(AssetListing::getCategory, Collectors.counting()));
            stats.setCategoryBreakdown(categoryBreakdown);

            stats.setTimestamp(Instant.now().toString());
            return stats;
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    /**
     * Get available categories
     */
    public Uni<List<CategoryInfo>> getCategories() {
        return Uni.createFrom().item(() -> {
            Map<String, Long> categoryCounts = assetListings.values().stream()
                    .collect(Collectors.groupingBy(AssetListing::getCategory, Collectors.counting()));

            return categoryCounts.entrySet().stream()
                    .map(entry -> new CategoryInfo(entry.getKey(), entry.getValue().intValue(),
                            getCategoryDescription(entry.getKey()), getCategoryIcon(entry.getKey())))
                    .sorted(Comparator.comparing(CategoryInfo::getCount).reversed())
                    .collect(Collectors.toList());
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    // ==================== Helper Methods ====================

    private boolean matchesKeyword(AssetListing asset, String keyword) {
        String lowerKeyword = keyword.toLowerCase();
        return asset.getName().toLowerCase().contains(lowerKeyword) ||
               asset.getDescription().toLowerCase().contains(lowerKeyword) ||
               asset.getCategory().toLowerCase().contains(lowerKeyword) ||
               asset.getLocation().toLowerCase().contains(lowerKeyword) ||
               (asset.getTags() != null && asset.getTags().stream()
                       .anyMatch(tag -> tag.toLowerCase().contains(lowerKeyword)));
    }

    private void sortAssets(List<AssetListing> assets, String sortBy, String sortOrder) {
        Comparator<AssetListing> comparator;

        switch (sortBy != null ? sortBy.toLowerCase() : "newest") {
            case "price":
                comparator = Comparator.comparing(AssetListing::getPrice);
                break;
            case "popularity":
                comparator = Comparator.comparing(AssetListing::getViewCount);
                break;
            case "rating":
                comparator = Comparator.comparing(AssetListing::getRating);
                break;
            case "favorites":
                comparator = Comparator.comparing(AssetListing::getFavoriteCount);
                break;
            case "newest":
            default:
                comparator = Comparator.comparing(AssetListing::getCreatedAt);
                break;
        }

        if ("asc".equalsIgnoreCase(sortOrder)) {
            assets.sort(comparator);
        } else {
            assets.sort(comparator.reversed());
        }
    }

    private String getCategoryDescription(String category) {
        return switch (category.toLowerCase()) {
            case "real_estate" -> "Tokenized real estate properties and land parcels";
            case "carbon_credits" -> "Verified carbon offset credits and environmental assets";
            case "art" -> "Fine art, collectibles, and digital artwork (NFTs)";
            case "intellectual_property" -> "Patents, trademarks, copyrights, and royalty streams";
            case "financial" -> "Bonds, securities, and financial instruments";
            case "supply_chain" -> "Commodities, inventory, and supply chain assets";
            default -> "Tokenized assets in this category";
        };
    }

    private String getCategoryIcon(String category) {
        return switch (category.toLowerCase()) {
            case "real_estate" -> "home";
            case "carbon_credits" -> "eco";
            case "art" -> "palette";
            case "intellectual_property" -> "lightbulb";
            case "financial" -> "account_balance";
            case "supply_chain" -> "local_shipping";
            default -> "token";
        };
    }

    // ==================== Sample Data Initialization ====================

    private void initializeSampleAssets() {
        // Real Estate Assets
        addSampleAsset("asset-re-001", "Luxury Penthouse NYC", "REAL_ESTATE",
                new BigDecimal("2500000"), "New York, NY", "verified", true,
                "Premium penthouse in Manhattan with stunning skyline views",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2");

        addSampleAsset("asset-re-002", "Commercial Building Miami", "REAL_ESTATE",
                new BigDecimal("5000000"), "Miami, FL", "verified", true,
                "Class A office building in downtown Miami financial district",
                "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab");

        addSampleAsset("asset-re-003", "Beachfront Villa Malibu", "REAL_ESTATE",
                new BigDecimal("8500000"), "Malibu, CA", "verified", false,
                "Stunning beachfront property with private beach access",
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750");

        // Carbon Credits
        addSampleAsset("asset-cc-001", "Amazon Rainforest Carbon Credits", "CARBON_CREDITS",
                new BigDecimal("50000"), "Brazil", "verified", true,
                "Certified carbon credits from Amazon rainforest preservation project",
                "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5");

        addSampleAsset("asset-cc-002", "Wind Farm Carbon Offsets", "CARBON_CREDITS",
                new BigDecimal("75000"), "Texas, USA", "verified", false,
                "Carbon offset credits from renewable wind energy production",
                "https://images.unsplash.com/photo-1532601224476-15c79f2f7a51");

        // Art & Collectibles
        addSampleAsset("asset-art-001", "Digital Art Collection #42", "ART",
                new BigDecimal("125000"), "Global", "verified", true,
                "Exclusive digital art collection by renowned artist",
                "https://images.unsplash.com/photo-1561214115-f2f134cc4912");

        addSampleAsset("asset-art-002", "Renaissance Masterpiece Fraction", "ART",
                new BigDecimal("500000"), "Florence, Italy", "pending", false,
                "Fractional ownership of authenticated Renaissance painting",
                "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5");

        // Intellectual Property
        addSampleAsset("asset-ip-001", "AI Patent Portfolio", "INTELLECTUAL_PROPERTY",
                new BigDecimal("1500000"), "USA", "verified", true,
                "Portfolio of 15 AI/ML patents with active licensing revenue",
                "https://images.unsplash.com/photo-1485827404703-89b55fcc595e");

        addSampleAsset("asset-ip-002", "Music Royalty Stream", "INTELLECTUAL_PROPERTY",
                new BigDecimal("250000"), "Global", "verified", false,
                "Tokenized royalty stream from platinum album catalog",
                "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4");

        // Financial Instruments
        addSampleAsset("asset-fin-001", "Corporate Bond Token", "FINANCIAL",
                new BigDecimal("100000"), "USA", "verified", true,
                "Tokenized corporate bond with 5.5% annual yield",
                "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3");

        // Supply Chain
        addSampleAsset("asset-sc-001", "Gold Bullion Token", "SUPPLY_CHAIN",
                new BigDecimal("1000000"), "Switzerland", "verified", true,
                "Tokenized gold bars stored in Swiss vault",
                "https://images.unsplash.com/photo-1610375461246-83df859d849d");

        addSampleAsset("asset-sc-002", "Rare Earth Elements", "SUPPLY_CHAIN",
                new BigDecimal("750000"), "Australia", "pending", false,
                "Tokenized rare earth elements with verified provenance",
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23");

        LOG.infof("Initialized %d sample marketplace assets", assetListings.size());
    }

    private void addSampleAsset(String id, String name, String category, BigDecimal price,
                                 String location, String verificationStatus, boolean featured,
                                 String description, String imageUrl) {
        AssetListing asset = new AssetListing();
        asset.setAssetId(id);
        asset.setName(name);
        asset.setCategory(category);
        asset.setPrice(price);
        asset.setLocation(location);
        asset.setVerificationStatus(verificationStatus);
        asset.setFeatured(featured);
        asset.setDescription(description);
        asset.setImageUrl(imageUrl);
        asset.setCreatedAt(Instant.now().minusSeconds((long)(Math.random() * 86400 * 30)).toString());
        asset.setViewCount((int)(Math.random() * 1000));
        asset.setFavoriteCount((int)(Math.random() * 100));
        asset.setRating(3.5 + Math.random() * 1.5);
        asset.setTokenSymbol("AUR-" + id.substring(6).toUpperCase());
        asset.setTotalSupply(1000000L);
        asset.setAvailableSupply((long)(Math.random() * 500000 + 500000));
        asset.setOwnerCount((int)(Math.random() * 500 + 10));
        asset.setTags(generateTags(category));

        assetListings.put(id, asset);
        assetViews.put(id, asset.getViewCount());
    }

    private List<String> generateTags(String category) {
        List<String> baseTags = new ArrayList<>(List.of("tokenized", "blockchain", "investment"));
        switch (category.toLowerCase()) {
            case "real_estate" -> baseTags.addAll(List.of("property", "real-estate", "rental-income"));
            case "carbon_credits" -> baseTags.addAll(List.of("carbon", "green", "sustainability", "ESG"));
            case "art" -> baseTags.addAll(List.of("art", "collectible", "NFT"));
            case "intellectual_property" -> baseTags.addAll(List.of("IP", "patent", "royalty"));
            case "financial" -> baseTags.addAll(List.of("bond", "yield", "fixed-income"));
            case "supply_chain" -> baseTags.addAll(List.of("commodity", "gold", "physical-asset"));
        }
        return baseTags;
    }

    // ==================== DTOs ====================

    /**
     * Asset listing representing a tokenized real-world asset
     */
    public static class AssetListing {
        private String assetId;
        private String name;
        private String description;
        private String category;
        private BigDecimal price;
        private String location;
        private String verificationStatus;
        private boolean featured;
        private String imageUrl;
        private String createdAt;
        private int viewCount;
        private int favoriteCount;
        private double rating;
        private String tokenSymbol;
        private long totalSupply;
        private long availableSupply;
        private int ownerCount;
        private List<String> tags;
        private boolean favorited;

        // Getters and setters
        public String getAssetId() { return assetId; }
        public void setAssetId(String assetId) { this.assetId = assetId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getVerificationStatus() { return verificationStatus; }
        public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
        public boolean isFeatured() { return featured; }
        public void setFeatured(boolean featured) { this.featured = featured; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        public int getViewCount() { return viewCount; }
        public void setViewCount(int viewCount) { this.viewCount = viewCount; }
        public int getFavoriteCount() { return favoriteCount; }
        public void setFavoriteCount(int favoriteCount) { this.favoriteCount = favoriteCount; }
        public double getRating() { return rating; }
        public void setRating(double rating) { this.rating = rating; }
        public String getTokenSymbol() { return tokenSymbol; }
        public void setTokenSymbol(String tokenSymbol) { this.tokenSymbol = tokenSymbol; }
        public long getTotalSupply() { return totalSupply; }
        public void setTotalSupply(long totalSupply) { this.totalSupply = totalSupply; }
        public long getAvailableSupply() { return availableSupply; }
        public void setAvailableSupply(long availableSupply) { this.availableSupply = availableSupply; }
        public int getOwnerCount() { return ownerCount; }
        public void setOwnerCount(int ownerCount) { this.ownerCount = ownerCount; }
        public List<String> getTags() { return tags; }
        public void setTags(List<String> tags) { this.tags = tags; }
        public boolean isFavorited() { return favorited; }
        public void setFavorited(boolean favorited) { this.favorited = favorited; }
    }

    /**
     * Search request for marketplace
     */
    public static class MarketplaceSearchRequest {
        private String keyword;
        private String category;
        private BigDecimal minPrice;
        private BigDecimal maxPrice;
        private String verificationStatus;
        private String location;
        private String sortBy;
        private String sortOrder;
        private Integer offset;
        private Integer limit;
        private String userId;

        // Getters and setters
        public String getKeyword() { return keyword; }
        public void setKeyword(String keyword) { this.keyword = keyword; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public BigDecimal getMinPrice() { return minPrice; }
        public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }
        public BigDecimal getMaxPrice() { return maxPrice; }
        public void setMaxPrice(BigDecimal maxPrice) { this.maxPrice = maxPrice; }
        public String getVerificationStatus() { return verificationStatus; }
        public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
        public String getLocation() { return location; }
        public void setLocation(String location) { this.location = location; }
        public String getSortBy() { return sortBy; }
        public void setSortBy(String sortBy) { this.sortBy = sortBy; }
        public String getSortOrder() { return sortOrder; }
        public void setSortOrder(String sortOrder) { this.sortOrder = sortOrder; }
        public Integer getOffset() { return offset; }
        public void setOffset(Integer offset) { this.offset = offset; }
        public Integer getLimit() { return limit; }
        public void setLimit(Integer limit) { this.limit = limit; }
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
    }

    /**
     * Search response for marketplace
     */
    public static class MarketplaceSearchResponse {
        private List<AssetListing> assets;
        private int totalResults;
        private int offset;
        private int limit;
        private long searchTimeMs;
        private String timestamp;

        // Getters and setters
        public List<AssetListing> getAssets() { return assets; }
        public void setAssets(List<AssetListing> assets) { this.assets = assets; }
        public int getTotalResults() { return totalResults; }
        public void setTotalResults(int totalResults) { this.totalResults = totalResults; }
        public int getOffset() { return offset; }
        public void setOffset(int offset) { this.offset = offset; }
        public int getLimit() { return limit; }
        public void setLimit(int limit) { this.limit = limit; }
        public long getSearchTimeMs() { return searchTimeMs; }
        public void setSearchTimeMs(long searchTimeMs) { this.searchTimeMs = searchTimeMs; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }

    /**
     * Marketplace statistics
     */
    public static class MarketplaceStats {
        private int totalAssets;
        private BigDecimal totalValue;
        private int verifiedAssets;
        private int totalViews;
        private Map<String, Long> categoryBreakdown;
        private String timestamp;

        // Getters and setters
        public int getTotalAssets() { return totalAssets; }
        public void setTotalAssets(int totalAssets) { this.totalAssets = totalAssets; }
        public BigDecimal getTotalValue() { return totalValue; }
        public void setTotalValue(BigDecimal totalValue) { this.totalValue = totalValue; }
        public int getVerifiedAssets() { return verifiedAssets; }
        public void setVerifiedAssets(int verifiedAssets) { this.verifiedAssets = verifiedAssets; }
        public int getTotalViews() { return totalViews; }
        public void setTotalViews(int totalViews) { this.totalViews = totalViews; }
        public Map<String, Long> getCategoryBreakdown() { return categoryBreakdown; }
        public void setCategoryBreakdown(Map<String, Long> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }

    /**
     * Category information
     */
    public static class CategoryInfo {
        private String name;
        private int count;
        private String description;
        private String icon;

        public CategoryInfo(String name, int count, String description, String icon) {
            this.name = name;
            this.count = count;
            this.description = description;
            this.icon = icon;
        }

        // Getters
        public String getName() { return name; }
        public int getCount() { return count; }
        public String getDescription() { return description; }
        public String getIcon() { return icon; }
    }
}

package io.aurigraph.v11.identity.did;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.jboss.logging.Logger;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

/**
 * Universal DID Resolver
 *
 * Resolves Decentralized Identifiers (DIDs) to their DID Documents.
 * Supports multiple DID methods including:
 * - did:aurigraph - Native Aurigraph DIDs
 * - did:key - Self-certifying DIDs
 * - did:web - Web-based DIDs
 * - did:ion - ION DIDs (via universal resolver)
 * - did:ethr - Ethereum DIDs (via universal resolver)
 *
 * Features:
 * - Caching with configurable TTL
 * - Async resolution
 * - Universal resolver fallback
 * - Resolution metadata
 *
 * @version 12.0.0
 * @author Compliance & Audit Agent (CAA)
 */
@ApplicationScoped
public class DIDResolver {

    private static final Logger LOG = Logger.getLogger(DIDResolver.class);

    // DID method patterns
    private static final Pattern DID_PATTERN = Pattern.compile("^did:([a-z0-9]+):(.+)$");
    private static final Pattern DID_KEY_PATTERN = Pattern.compile("^did:key:z([a-zA-Z0-9]+)$");
    private static final Pattern DID_WEB_PATTERN = Pattern.compile("^did:web:([^:]+)(:.+)?$");

    // Cache configuration
    private static final int CACHE_MAX_SIZE = 10000;
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);
    private static final Duration DEACTIVATED_CACHE_TTL = Duration.ofHours(24);

    // Universal resolver endpoint
    private static final String DEFAULT_UNIVERSAL_RESOLVER_URL = "https://resolver.identity.foundation/1.0/identifiers/";

    // Supported DID methods
    public static final Set<String> NATIVELY_SUPPORTED_METHODS = Set.of("aurigraph", "key");
    public static final Set<String> EXTERNALLY_SUPPORTED_METHODS = Set.of("web", "ion", "ethr", "sov", "elem");

    // Cache for resolved DID documents
    private Cache<String, CachedResolution> resolutionCache;

    // HTTP client for external resolution
    private OkHttpClient httpClient;
    private ObjectMapper objectMapper;

    // Method-specific resolvers
    private final Map<String, DIDMethodResolver> methodResolvers = new ConcurrentHashMap<>();

    // Statistics
    private long totalResolutions = 0;
    private long cacheHits = 0;
    private long cacheMisses = 0;
    private long externalResolutions = 0;
    private long resolutionErrors = 0;

    @Inject
    AurigraphDIDMethod aurigraphDIDMethod;

    private String universalResolverUrl = DEFAULT_UNIVERSAL_RESOLVER_URL;

    @PostConstruct
    public void initialize() {
        // Initialize cache
        resolutionCache = Caffeine.newBuilder()
                .maximumSize(CACHE_MAX_SIZE)
                .expireAfterWrite(CACHE_TTL)
                .recordStats()
                .build();

        // Initialize HTTP client
        httpClient = new OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .build();

        objectMapper = new ObjectMapper();

        // Register built-in method resolvers
        registerMethodResolver("aurigraph", this::resolveAurigraph);
        registerMethodResolver("key", this::resolveKey);
        registerMethodResolver("web", this::resolveWeb);

        LOG.info("DIDResolver initialized with support for methods: " + getSupportedMethods());
    }

    // ==================== Resolution Methods ====================

    /**
     * Resolve a DID to its DID Document
     *
     * @param did The DID to resolve
     * @return Resolution result
     */
    public ResolutionResult resolve(String did) {
        return resolve(did, new ResolutionOptions());
    }

    /**
     * Resolve a DID with options
     *
     * @param did The DID to resolve
     * @param options Resolution options
     * @return Resolution result
     */
    public ResolutionResult resolve(String did, ResolutionOptions options) {
        long startTime = System.nanoTime();
        totalResolutions++;

        try {
            // Validate DID format
            if (!isValidDID(did)) {
                return ResolutionResult.invalidDid(did, "Invalid DID format");
            }

            // Check cache first (unless explicitly disabled)
            if (!options.isNoCache()) {
                CachedResolution cached = resolutionCache.getIfPresent(did);
                if (cached != null && !cached.isExpired()) {
                    cacheHits++;
                    long duration = (System.nanoTime() - startTime) / 1_000_000;
                    LOG.debugf("Cache hit for DID: %s (%dms)", did, duration);
                    return cached.getResult().withCacheHit(true, duration);
                }
            }
            cacheMisses++;

            // Parse DID to get method
            String method = extractMethod(did);

            // Try method-specific resolver
            DIDMethodResolver resolver = methodResolvers.get(method);
            if (resolver != null) {
                ResolutionResult result = resolver.resolve(did, options);
                cacheResult(did, result);
                long duration = (System.nanoTime() - startTime) / 1_000_000;
                return result.withDuration(duration);
            }

            // Fall back to universal resolver for supported external methods
            if (EXTERNALLY_SUPPORTED_METHODS.contains(method)) {
                return resolveViaUniversalResolver(did, options, startTime);
            }

            // Unsupported method
            return ResolutionResult.methodNotSupported(did, method);

        } catch (Exception e) {
            resolutionErrors++;
            LOG.error("Failed to resolve DID: " + did, e);
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            return ResolutionResult.internalError(did, e.getMessage(), duration);
        }
    }

    /**
     * Resolve a DID asynchronously
     *
     * @param did The DID to resolve
     * @return CompletableFuture with resolution result
     */
    public CompletableFuture<ResolutionResult> resolveAsync(String did) {
        return CompletableFuture.supplyAsync(() -> resolve(did));
    }

    /**
     * Resolve multiple DIDs in batch
     *
     * @param dids List of DIDs to resolve
     * @return Map of DID to resolution results
     */
    public Map<String, ResolutionResult> resolveBatch(List<String> dids) {
        Map<String, ResolutionResult> results = new LinkedHashMap<>();

        // Resolve in parallel using virtual threads
        List<CompletableFuture<Void>> futures = new ArrayList<>();

        for (String did : dids) {
            CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
                ResolutionResult result = resolve(did);
                synchronized (results) {
                    results.put(did, result);
                }
            });
            futures.add(future);
        }

        // Wait for all resolutions to complete
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        return results;
    }

    // ==================== Method-Specific Resolvers ====================

    /**
     * Resolve Aurigraph DID
     */
    private ResolutionResult resolveAurigraph(String did, ResolutionOptions options) {
        AurigraphDIDMethod.DIDResolutionResult result = aurigraphDIDMethod.resolve(did);

        if (!result.isFound()) {
            return ResolutionResult.notFound(did);
        }

        if (result.isDeactivated()) {
            return ResolutionResult.deactivated(did, result.getDocument());
        }

        return ResolutionResult.success(did, result.getDocument(), result.getDurationMs());
    }

    /**
     * Resolve did:key (self-certifying DID)
     *
     * did:key DIDs encode the public key directly in the DID.
     * No external resolution is needed.
     */
    private ResolutionResult resolveKey(String did, ResolutionOptions options) {
        try {
            // Extract the multibase-encoded key
            java.util.regex.Matcher matcher = DID_KEY_PATTERN.matcher(did);
            if (!matcher.matches()) {
                return ResolutionResult.invalidDid(did, "Invalid did:key format");
            }

            String multibaseKey = "z" + matcher.group(1);

            // Create DID Document
            DIDDocument document = DIDDocument.create(did);

            // Determine key type from multibase prefix
            // z6Mk... = Ed25519
            // z5T... = NIST P-256
            // zQ3s... = secp256k1
            String keyType = determineKeyType(multibaseKey);

            // Add verification method
            DIDDocument.VerificationMethod vm = new DIDDocument.VerificationMethod();
            vm.setId(did + "#" + did.substring(8));  // Use key part as fragment
            vm.setType(keyType);
            vm.setController(did);
            vm.setPublicKeyMultibase(multibaseKey);

            document.getVerificationMethod().add(vm);
            document.getAuthentication().add(vm.getId());
            document.getAssertionMethod().add(vm.getId());
            document.getCapabilityInvocation().add(vm.getId());
            document.getCapabilityDelegation().add(vm.getId());

            // For X25519 keys, also add keyAgreement
            if (multibaseKey.startsWith("z6LS")) {
                document.getKeyAgreement().add(vm.getId());
            }

            return ResolutionResult.success(did, document, 0);

        } catch (Exception e) {
            LOG.error("Failed to resolve did:key: " + did, e);
            return ResolutionResult.internalError(did, e.getMessage(), 0);
        }
    }

    /**
     * Resolve did:web
     */
    private ResolutionResult resolveWeb(String did, ResolutionOptions options) {
        try {
            // Parse did:web
            java.util.regex.Matcher matcher = DID_WEB_PATTERN.matcher(did);
            if (!matcher.matches()) {
                return ResolutionResult.invalidDid(did, "Invalid did:web format");
            }

            String domain = matcher.group(1).replace("%3A", ":");
            String path = matcher.group(2);

            // Construct URL
            String url;
            if (path == null || path.isEmpty()) {
                url = "https://" + domain + "/.well-known/did.json";
            } else {
                url = "https://" + domain + path.replace(":", "/") + "/did.json";
            }

            // Fetch DID Document
            Request request = new Request.Builder()
                    .url(url)
                    .header("Accept", "application/did+ld+json, application/json")
                    .build();

            externalResolutions++;

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    if (response.code() == 404) {
                        return ResolutionResult.notFound(did);
                    }
                    return ResolutionResult.internalError(did,
                            "HTTP " + response.code() + ": " + response.message(), 0);
                }

                String body = response.body() != null ? response.body().string() : null;
                if (body == null || body.isEmpty()) {
                    return ResolutionResult.internalError(did, "Empty response from " + url, 0);
                }

                DIDDocument document = DIDDocument.fromJsonLd(body);
                return ResolutionResult.success(did, document, 0);
            }

        } catch (Exception e) {
            LOG.error("Failed to resolve did:web: " + did, e);
            return ResolutionResult.internalError(did, e.getMessage(), 0);
        }
    }

    /**
     * Resolve via Universal Resolver
     */
    private ResolutionResult resolveViaUniversalResolver(String did, ResolutionOptions options, long startTime) {
        try {
            String encodedDid = java.net.URLEncoder.encode(did, "UTF-8");
            String url = universalResolverUrl + encodedDid;

            Request request = new Request.Builder()
                    .url(url)
                    .header("Accept", "application/did+ld+json, application/json")
                    .build();

            externalResolutions++;

            try (Response response = httpClient.newCall(request).execute()) {
                long duration = (System.nanoTime() - startTime) / 1_000_000;

                if (!response.isSuccessful()) {
                    if (response.code() == 404) {
                        return ResolutionResult.notFound(did);
                    }
                    return ResolutionResult.internalError(did,
                            "Universal resolver returned HTTP " + response.code(), duration);
                }

                String body = response.body() != null ? response.body().string() : null;
                if (body == null || body.isEmpty()) {
                    return ResolutionResult.internalError(did, "Empty response from universal resolver", duration);
                }

                // Parse universal resolver response
                @SuppressWarnings("unchecked")
                Map<String, Object> resolverResponse = objectMapper.readValue(body, Map.class);

                @SuppressWarnings("unchecked")
                Map<String, Object> didDocumentMap = (Map<String, Object>) resolverResponse.get("didDocument");
                if (didDocumentMap == null) {
                    return ResolutionResult.notFound(did);
                }

                String didDocJson = objectMapper.writeValueAsString(didDocumentMap);
                DIDDocument document = DIDDocument.fromJsonLd(didDocJson);

                ResolutionResult result = ResolutionResult.success(did, document, duration);
                cacheResult(did, result);
                return result;
            }

        } catch (Exception e) {
            LOG.error("Failed to resolve via universal resolver: " + did, e);
            long duration = (System.nanoTime() - startTime) / 1_000_000;
            return ResolutionResult.internalError(did, e.getMessage(), duration);
        }
    }

    // ==================== Utility Methods ====================

    /**
     * Check if a DID has valid format
     */
    public boolean isValidDID(String did) {
        return did != null && DID_PATTERN.matcher(did).matches();
    }

    /**
     * Extract the method from a DID
     */
    public String extractMethod(String did) {
        java.util.regex.Matcher matcher = DID_PATTERN.matcher(did);
        if (matcher.matches()) {
            return matcher.group(1);
        }
        throw new IllegalArgumentException("Invalid DID format: " + did);
    }

    /**
     * Register a custom method resolver
     */
    public void registerMethodResolver(String method, DIDMethodResolver resolver) {
        methodResolvers.put(method, resolver);
        LOG.infof("Registered resolver for method: %s", method);
    }

    /**
     * Get all supported DID methods
     */
    public Set<String> getSupportedMethods() {
        Set<String> methods = new HashSet<>(NATIVELY_SUPPORTED_METHODS);
        methods.addAll(EXTERNALLY_SUPPORTED_METHODS);
        return methods;
    }

    /**
     * Set universal resolver URL
     */
    public void setUniversalResolverUrl(String url) {
        this.universalResolverUrl = url;
    }

    /**
     * Invalidate cache for a specific DID
     */
    public void invalidateCache(String did) {
        resolutionCache.invalidate(did);
    }

    /**
     * Clear all cache entries
     */
    public void clearCache() {
        resolutionCache.invalidateAll();
    }

    /**
     * Get resolution statistics
     */
    public ResolverStatistics getStatistics() {
        var cacheStats = resolutionCache.stats();
        return new ResolverStatistics(
                totalResolutions,
                cacheHits,
                cacheMisses,
                externalResolutions,
                resolutionErrors,
                resolutionCache.estimatedSize(),
                cacheStats.hitRate(),
                cacheStats.averageLoadPenalty() / 1_000_000.0 // Convert to ms
        );
    }

    /**
     * Cache a resolution result
     */
    private void cacheResult(String did, ResolutionResult result) {
        if (result.isSuccess() || result.isDeactivated()) {
            Duration ttl = result.isDeactivated() ? DEACTIVATED_CACHE_TTL : CACHE_TTL;
            resolutionCache.put(did, new CachedResolution(result, Instant.now().plus(ttl)));
        }
    }

    /**
     * Determine key type from multibase prefix
     */
    private String determineKeyType(String multibaseKey) {
        if (multibaseKey.startsWith("z6Mk")) {
            return "Ed25519VerificationKey2020";
        } else if (multibaseKey.startsWith("z6LS")) {
            return "X25519KeyAgreementKey2020";
        } else if (multibaseKey.startsWith("z5T")) {
            return "JsonWebKey2020"; // NIST P-256
        } else if (multibaseKey.startsWith("zQ3s")) {
            return "EcdsaSecp256k1VerificationKey2019";
        } else if (multibaseKey.startsWith("zDn")) {
            return "DilithiumVerificationKey2023";
        }
        return "JsonWebKey2020";
    }

    // ==================== Data Classes ====================

    /**
     * Functional interface for method-specific resolvers
     */
    @FunctionalInterface
    public interface DIDMethodResolver {
        ResolutionResult resolve(String did, ResolutionOptions options);
    }

    /**
     * Resolution options
     */
    public static class ResolutionOptions {
        private boolean noCache = false;
        private String versionId;
        private String versionTime;
        private boolean dereferenceFragments = true;

        public boolean isNoCache() { return noCache; }
        public void setNoCache(boolean noCache) { this.noCache = noCache; }
        public String getVersionId() { return versionId; }
        public void setVersionId(String versionId) { this.versionId = versionId; }
        public String getVersionTime() { return versionTime; }
        public void setVersionTime(String versionTime) { this.versionTime = versionTime; }
        public boolean isDereferenceFragments() { return dereferenceFragments; }
        public void setDereferenceFragments(boolean dereferenceFragments) {
            this.dereferenceFragments = dereferenceFragments;
        }
    }

    /**
     * Resolution result
     */
    public static class ResolutionResult {
        private final String did;
        private final DIDDocument document;
        private final ResolutionMetadata metadata;
        private final boolean success;
        private final boolean deactivated;
        private final boolean cacheHit;
        private final long durationMs;

        private ResolutionResult(String did, DIDDocument document, ResolutionMetadata metadata,
                                  boolean success, boolean deactivated, boolean cacheHit, long durationMs) {
            this.did = did;
            this.document = document;
            this.metadata = metadata;
            this.success = success;
            this.deactivated = deactivated;
            this.cacheHit = cacheHit;
            this.durationMs = durationMs;
        }

        public static ResolutionResult success(String did, DIDDocument document, long durationMs) {
            return new ResolutionResult(did, document, new ResolutionMetadata(),
                    true, false, false, durationMs);
        }

        public static ResolutionResult notFound(String did) {
            ResolutionMetadata meta = new ResolutionMetadata();
            meta.setError("notFound");
            meta.setMessage("DID not found");
            return new ResolutionResult(did, null, meta, false, false, false, 0);
        }

        public static ResolutionResult deactivated(String did, DIDDocument document) {
            ResolutionMetadata meta = new ResolutionMetadata();
            meta.setDeactivated(true);
            return new ResolutionResult(did, document, meta, true, true, false, 0);
        }

        public static ResolutionResult invalidDid(String did, String message) {
            ResolutionMetadata meta = new ResolutionMetadata();
            meta.setError("invalidDid");
            meta.setMessage(message);
            return new ResolutionResult(did, null, meta, false, false, false, 0);
        }

        public static ResolutionResult methodNotSupported(String did, String method) {
            ResolutionMetadata meta = new ResolutionMetadata();
            meta.setError("methodNotSupported");
            meta.setMessage("DID method not supported: " + method);
            return new ResolutionResult(did, null, meta, false, false, false, 0);
        }

        public static ResolutionResult internalError(String did, String message, long durationMs) {
            ResolutionMetadata meta = new ResolutionMetadata();
            meta.setError("internalError");
            meta.setMessage(message);
            return new ResolutionResult(did, null, meta, false, false, false, durationMs);
        }

        public ResolutionResult withCacheHit(boolean cacheHit, long durationMs) {
            return new ResolutionResult(did, document, metadata, success, deactivated, cacheHit, durationMs);
        }

        public ResolutionResult withDuration(long durationMs) {
            return new ResolutionResult(did, document, metadata, success, deactivated, cacheHit, durationMs);
        }

        // Getters
        public String getDid() { return did; }
        public DIDDocument getDocument() { return document; }
        public ResolutionMetadata getMetadata() { return metadata; }
        public boolean isSuccess() { return success; }
        public boolean isDeactivated() { return deactivated; }
        public boolean isCacheHit() { return cacheHit; }
        public long getDurationMs() { return durationMs; }
    }

    /**
     * Resolution metadata
     */
    public static class ResolutionMetadata {
        private String contentType = "application/did+ld+json";
        private String error;
        private String message;
        private boolean deactivated = false;
        private Instant retrieved = Instant.now();

        public String getContentType() { return contentType; }
        public void setContentType(String contentType) { this.contentType = contentType; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public boolean isDeactivated() { return deactivated; }
        public void setDeactivated(boolean deactivated) { this.deactivated = deactivated; }
        public Instant getRetrieved() { return retrieved; }
        public void setRetrieved(Instant retrieved) { this.retrieved = retrieved; }
    }

    /**
     * Cached resolution entry
     */
    private static class CachedResolution {
        private final ResolutionResult result;
        private final Instant expiresAt;

        public CachedResolution(ResolutionResult result, Instant expiresAt) {
            this.result = result;
            this.expiresAt = expiresAt;
        }

        public ResolutionResult getResult() { return result; }
        public boolean isExpired() { return Instant.now().isAfter(expiresAt); }
    }

    /**
     * Resolver statistics
     */
    public record ResolverStatistics(
            long totalResolutions,
            long cacheHits,
            long cacheMisses,
            long externalResolutions,
            long resolutionErrors,
            long cacheSize,
            double hitRate,
            double avgLoadTimeMs
    ) {}
}

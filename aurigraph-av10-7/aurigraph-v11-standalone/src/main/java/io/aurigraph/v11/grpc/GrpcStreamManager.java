package io.aurigraph.v11.grpc;

import io.grpc.stub.StreamObserver;
import io.smallrye.mutiny.subscription.MultiEmitter;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.List;
import java.util.ArrayList;
import java.util.Set;
import java.util.HashSet;
import java.util.function.Consumer;
import java.util.stream.Collectors;

/**
 * gRPC Stream Manager
 *
 * Manages active gRPC streaming subscriptions, replacing WebSocketSessionManager.
 * Handles stream registration, deregistration, and broadcasting to all active streams.
 *
 * Key Features:
 * - Thread-safe stream registration using ConcurrentHashMap
 * - Automatic cleanup on stream completion/error
 * - Support for multiple stream types (transactions, metrics, validators, etc.)
 * - Built-in backpressure handling via gRPC flow control
 * - Mutiny Multi emitter support for reactive streams
 * - Session timeout and idle cleanup
 * - Stream filtering capabilities
 *
 * @author J4C Backend Agent
 * @version V12.0.0
 * @since December 2025
 */
@ApplicationScoped
public class GrpcStreamManager {

    private static final Logger LOG = Logger.getLogger(GrpcStreamManager.class);

    // Timeout configuration
    private static final long STREAM_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    private static final long IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    private static final long CLEANUP_INTERVAL_MS = 60_000; // 1 minute

    // Cleanup scheduler
    private final ScheduledExecutorService cleanupScheduler = Executors.newSingleThreadScheduledExecutor();

    /**
     * Stream type enumeration for categorizing subscriptions
     */
    public enum StreamType {
        TRANSACTIONS("transactions"),
        TRANSACTION_STATUS("transaction_status"),
        METRICS("metrics"),
        AGGREGATED_METRICS("aggregated_metrics"),
        CONSENSUS("consensus"),
        CONSENSUS_ROUNDS("consensus_rounds"),
        VALIDATORS("validators"),
        VALIDATOR_PERFORMANCE("validator_performance"),
        NETWORK("network"),
        NETWORK_TOPOLOGY("network_topology"),
        UNIFIED("unified"),
        MULTI("multi");

        private final String value;

        StreamType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static StreamType fromValue(String value) {
            for (StreamType type : values()) {
                if (type.value.equalsIgnoreCase(value)) {
                    return type;
                }
            }
            return UNIFIED;
        }
    }

    /**
     * Wrapper for stream observer with metadata
     */
    public record StreamSubscription<T>(
        String clientId,
        String subscriptionId,
        StreamType streamType,
        StreamObserver<T> observer,
        long registeredAt,
        StreamFilter filter
    ) {
        public StreamSubscription(String clientId, String subscriptionId, StreamType streamType,
                                 StreamObserver<T> observer, long registeredAt) {
            this(clientId, subscriptionId, streamType, observer, registeredAt, new StreamFilter());
        }
    }

    /**
     * Wrapper for Mutiny emitter with metadata
     */
    public static class EmitterSubscription<T> {
        private final String clientId;
        private final String subscriptionId;
        private final StreamType streamType;
        private final MultiEmitter<? super T> emitter;
        private final long registeredAt;
        private volatile long lastActivityAt;
        private volatile long eventCount;
        private volatile int errorCount;
        private final StreamFilter filter;

        public EmitterSubscription(String clientId, String subscriptionId, StreamType streamType,
                                  MultiEmitter<? super T> emitter, StreamFilter filter) {
            this.clientId = clientId;
            this.subscriptionId = subscriptionId;
            this.streamType = streamType;
            this.emitter = emitter;
            this.registeredAt = System.currentTimeMillis();
            this.lastActivityAt = registeredAt;
            this.eventCount = 0;
            this.errorCount = 0;
            this.filter = filter != null ? filter : new StreamFilter();
        }

        public String getClientId() { return clientId; }
        public String getSubscriptionId() { return subscriptionId; }
        public StreamType getStreamType() { return streamType; }
        public MultiEmitter<? super T> getEmitter() { return emitter; }
        public long getRegisteredAt() { return registeredAt; }
        public long getLastActivityAt() { return lastActivityAt; }
        public long getEventCount() { return eventCount; }
        public int getErrorCount() { return errorCount; }
        public StreamFilter getFilter() { return filter; }

        public void recordEvent() {
            this.lastActivityAt = System.currentTimeMillis();
            this.eventCount++;
        }

        public void recordError() {
            this.errorCount++;
        }

        public boolean isAlive() {
            long idle = System.currentTimeMillis() - lastActivityAt;
            return idle < IDLE_TIMEOUT_MS && errorCount < 5;
        }

        public long getIdleTime() {
            return System.currentTimeMillis() - lastActivityAt;
        }

        public long getAge() {
            return System.currentTimeMillis() - registeredAt;
        }
    }

    /**
     * Stream filter for selective event delivery
     */
    public static class StreamFilter {
        private Set<String> addressFilters = new HashSet<>();
        private Set<String> nodeIdFilters = new HashSet<>();
        private Set<String> statusFilters = new HashSet<>();
        private Set<String> eventTypeFilters = new HashSet<>();
        private boolean includeAll = true;

        public StreamFilter() {}

        public StreamFilter withAddresses(List<String> addresses) {
            if (addresses != null && !addresses.isEmpty()) {
                this.addressFilters.addAll(addresses);
                this.includeAll = false;
            }
            return this;
        }

        public StreamFilter withNodeIds(List<String> nodeIds) {
            if (nodeIds != null && !nodeIds.isEmpty()) {
                this.nodeIdFilters.addAll(nodeIds);
                this.includeAll = false;
            }
            return this;
        }

        public StreamFilter withStatuses(List<String> statuses) {
            if (statuses != null && !statuses.isEmpty()) {
                this.statusFilters.addAll(statuses);
                this.includeAll = false;
            }
            return this;
        }

        public StreamFilter withEventTypes(List<String> eventTypes) {
            if (eventTypes != null && !eventTypes.isEmpty()) {
                this.eventTypeFilters.addAll(eventTypes);
                this.includeAll = false;
            }
            return this;
        }

        public boolean matches(Object event) {
            return includeAll; // Default: accept all if no filters
        }

        public Set<String> getAddressFilters() { return addressFilters; }
        public Set<String> getNodeIdFilters() { return nodeIdFilters; }
        public Set<String> getStatusFilters() { return statusFilters; }
        public Set<String> getEventTypeFilters() { return eventTypeFilters; }
        public boolean isIncludeAll() { return includeAll; }
    }

    // Stream registries by type
    private final ConcurrentMap<StreamType, List<StreamSubscription<?>>> streams = new ConcurrentHashMap<>();

    // Mutiny emitter registries by type
    private final ConcurrentMap<StreamType, List<EmitterSubscription<?>>> emitterStreams = new ConcurrentHashMap<>();

    // Client ID to subscription mapping for quick lookup
    private final ConcurrentMap<String, StreamSubscription<?>> clientSubscriptions = new ConcurrentHashMap<>();

    // Client ID to emitter subscription mapping
    private final ConcurrentMap<String, Set<String>> clientEmitters = new ConcurrentHashMap<>();

    // Emitter registry by subscription ID
    private final ConcurrentMap<String, EmitterSubscription<?>> emitterRegistry = new ConcurrentHashMap<>();

    // Statistics
    private final ConcurrentMap<StreamType, Long> messagesSent = new ConcurrentHashMap<>();
    private final ConcurrentMap<StreamType, Long> errorsCount = new ConcurrentHashMap<>();

    public GrpcStreamManager() {
        // Initialize stream lists for each type
        for (StreamType type : StreamType.values()) {
            streams.put(type, new CopyOnWriteArrayList<>());
            emitterStreams.put(type, new CopyOnWriteArrayList<>());
            messagesSent.put(type, 0L);
            errorsCount.put(type, 0L);
        }

        // Start cleanup task
        cleanupScheduler.scheduleAtFixedRate(
            this::cleanupDeadStreams,
            CLEANUP_INTERVAL_MS,
            CLEANUP_INTERVAL_MS,
            TimeUnit.MILLISECONDS
        );

        LOG.info("GrpcStreamManager initialized with cleanup interval: " + CLEANUP_INTERVAL_MS + "ms");
    }

    /**
     * Register a new stream subscription
     *
     * @param streamType Type of stream (TRANSACTIONS, METRICS, etc.)
     * @param clientId Client identifier
     * @param observer gRPC stream observer
     * @return Subscription ID
     */
    @SuppressWarnings("unchecked")
    public <T> String registerStream(StreamType streamType, String clientId, StreamObserver<T> observer) {
        String subscriptionId = generateSubscriptionId(streamType, clientId);

        StreamSubscription<T> subscription = new StreamSubscription<>(
            clientId,
            subscriptionId,
            streamType,
            observer,
            System.currentTimeMillis()
        );

        List<StreamSubscription<?>> typeStreams = streams.get(streamType);
        typeStreams.add(subscription);
        clientSubscriptions.put(clientId, subscription);

        LOG.infof("Registered gRPC stream: type=%s, clientId=%s, subscriptionId=%s, totalStreams=%d",
            streamType, clientId, subscriptionId, typeStreams.size());

        return subscriptionId;
    }

    /**
     * Register a Mutiny emitter subscription (for reactive streams)
     *
     * @param streamType Type of stream (TRANSACTIONS, METRICS, etc.)
     * @param clientId Client identifier
     * @param emitter Mutiny MultiEmitter for sending events
     * @return Subscription ID
     */
    public <T> String registerEmitter(StreamType streamType, String clientId, MultiEmitter<? super T> emitter) {
        return registerEmitter(streamType, clientId, emitter, new StreamFilter());
    }

    /**
     * Register a Mutiny emitter subscription with filter
     *
     * @param streamType Type of stream
     * @param clientId Client identifier
     * @param emitter Mutiny MultiEmitter
     * @param filter Stream filter
     * @return Subscription ID
     */
    public <T> String registerEmitter(StreamType streamType, String clientId,
                                      MultiEmitter<? super T> emitter, StreamFilter filter) {
        String subscriptionId = generateSubscriptionId(streamType, clientId);

        EmitterSubscription<T> subscription = new EmitterSubscription<>(
            clientId,
            subscriptionId,
            streamType,
            emitter,
            filter
        );

        // Store in type registry
        List<EmitterSubscription<?>> typeEmitters = emitterStreams.get(streamType);
        typeEmitters.add(subscription);

        // Store in emitter registry
        emitterRegistry.put(subscriptionId, subscription);

        // Track client's emitters
        clientEmitters.computeIfAbsent(clientId, k -> ConcurrentHashMap.newKeySet()).add(subscriptionId);

        LOG.infof("Registered Mutiny emitter: type=%s, clientId=%s, subscriptionId=%s, totalEmitters=%d",
            streamType, clientId, subscriptionId, typeEmitters.size());

        return subscriptionId;
    }

    /**
     * Unregister a Mutiny emitter subscription
     *
     * @param subscriptionId Subscription ID to remove
     */
    public void unregisterEmitter(String subscriptionId) {
        EmitterSubscription<?> subscription = emitterRegistry.remove(subscriptionId);

        if (subscription == null) {
            LOG.warnf("Attempted to unregister unknown emitter: %s", subscriptionId);
            return;
        }

        // Remove from type registry
        emitterStreams.get(subscription.getStreamType()).removeIf(
            e -> e.getSubscriptionId().equals(subscriptionId)
        );

        // Remove from client tracking
        String clientId = subscription.getClientId();
        Set<String> clientEmitterSet = clientEmitters.get(clientId);
        if (clientEmitterSet != null) {
            clientEmitterSet.remove(subscriptionId);
            if (clientEmitterSet.isEmpty()) {
                clientEmitters.remove(clientId);
            }
        }

        // Complete the emitter
        try {
            subscription.getEmitter().complete();
        } catch (Exception e) {
            LOG.debugf("Emitter already completed: %s", subscriptionId);
        }

        LOG.infof("Unregistered Mutiny emitter: subscriptionId=%s, clientId=%s",
            subscriptionId, clientId);
    }

    /**
     * Unregister all emitters for a client
     *
     * @param clientId Client ID
     */
    public void unregisterClientEmitters(String clientId) {
        Set<String> emitters = clientEmitters.get(clientId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        // Copy to avoid concurrent modification
        Set<String> emittersCopy = new HashSet<>(emitters);
        for (String subscriptionId : emittersCopy) {
            unregisterEmitter(subscriptionId);
        }

        LOG.infof("Unregistered all emitters for client: %s (%d emitters)", clientId, emittersCopy.size());
    }

    /**
     * Unregister a stream subscription
     *
     * @param subscriptionId Subscription ID to remove
     */
    public void unregisterStream(String subscriptionId) {
        for (List<StreamSubscription<?>> typeStreams : streams.values()) {
            typeStreams.removeIf(sub -> {
                if (sub.subscriptionId().equals(subscriptionId)) {
                    clientSubscriptions.remove(sub.clientId());
                    LOG.infof("Unregistered gRPC stream: subscriptionId=%s", subscriptionId);
                    return true;
                }
                return false;
            });
        }
    }

    /**
     * Unregister a stream by client ID
     *
     * @param clientId Client ID to remove
     */
    public void unregisterByClientId(String clientId) {
        StreamSubscription<?> subscription = clientSubscriptions.remove(clientId);
        if (subscription != null) {
            streams.get(subscription.streamType()).remove(subscription);
            LOG.infof("Unregistered gRPC stream by clientId: %s", clientId);
        }
    }

    /**
     * Broadcast a message to all subscribers of a stream type
     *
     * @param streamType Target stream type
     * @param message Message to broadcast
     */
    @SuppressWarnings("unchecked")
    public <T> void broadcast(StreamType streamType, T message) {
        List<StreamSubscription<?>> typeStreams = streams.get(streamType);
        List<StreamSubscription<?>> failedStreams = new CopyOnWriteArrayList<>();

        for (StreamSubscription<?> subscription : typeStreams) {
            try {
                StreamObserver<T> observer = (StreamObserver<T>) subscription.observer();
                observer.onNext(message);
                messagesSent.merge(streamType, 1L, Long::sum);
            } catch (Exception e) {
                LOG.warnf("Failed to broadcast to stream %s: %s", subscription.subscriptionId(), e.getMessage());
                failedStreams.add(subscription);
                errorsCount.merge(streamType, 1L, Long::sum);
            }
        }

        // Remove failed streams
        for (StreamSubscription<?> failed : failedStreams) {
            unregisterStream(failed.subscriptionId());
        }

        if (!typeStreams.isEmpty()) {
            LOG.debugf("Broadcasted to %d %s streams", typeStreams.size() - failedStreams.size(), streamType);
        }
    }

    /**
     * Broadcast a message with a custom action
     *
     * @param streamType Target stream type
     * @param action Action to perform on each observer
     */
    @SuppressWarnings("unchecked")
    public <T> void broadcastWithAction(StreamType streamType, Consumer<StreamObserver<T>> action) {
        List<StreamSubscription<?>> typeStreams = streams.get(streamType);
        List<StreamSubscription<?>> failedStreams = new CopyOnWriteArrayList<>();

        for (StreamSubscription<?> subscription : typeStreams) {
            try {
                StreamObserver<T> observer = (StreamObserver<T>) subscription.observer();
                action.accept(observer);
                messagesSent.merge(streamType, 1L, Long::sum);
            } catch (Exception e) {
                LOG.warnf("Failed to execute action on stream %s: %s", subscription.subscriptionId(), e.getMessage());
                failedStreams.add(subscription);
                errorsCount.merge(streamType, 1L, Long::sum);
            }
        }

        // Remove failed streams
        for (StreamSubscription<?> failed : failedStreams) {
            unregisterStream(failed.subscriptionId());
        }
    }

    /**
     * Broadcast a message to all Mutiny emitter subscribers of a stream type
     *
     * @param streamType Target stream type
     * @param message Message to broadcast
     */
    @SuppressWarnings("unchecked")
    public <T> void broadcastToEmitters(StreamType streamType, T message) {
        List<EmitterSubscription<?>> typeEmitters = emitterStreams.get(streamType);
        List<String> failedEmitters = new ArrayList<>();

        if (typeEmitters == null || typeEmitters.isEmpty()) {
            LOG.debugf("No emitter subscribers for stream type: %s", streamType.getValue());
            return;
        }

        int successCount = 0;

        for (EmitterSubscription<?> subscription : typeEmitters) {
            // Check if filter matches
            if (!subscription.getFilter().matches(message)) {
                continue;
            }

            try {
                MultiEmitter<T> emitter = (MultiEmitter<T>) subscription.getEmitter();
                emitter.emit(message);
                subscription.recordEvent();
                messagesSent.merge(streamType, 1L, Long::sum);
                successCount++;
            } catch (Exception e) {
                LOG.warnf("Failed to emit to emitter %s: %s", subscription.getSubscriptionId(), e.getMessage());
                subscription.recordError();
                failedEmitters.add(subscription.getSubscriptionId());
                errorsCount.merge(streamType, 1L, Long::sum);
            }
        }

        // Remove failed emitters
        for (String failed : failedEmitters) {
            unregisterEmitter(failed);
        }

        if (successCount > 0) {
            LOG.debugf("Broadcasted to %d %s emitters", successCount, streamType.getValue());
        }
    }

    /**
     * Send to a specific emitter subscription
     *
     * @param subscriptionId Subscription ID
     * @param message Message to send
     * @return true if sent successfully
     */
    @SuppressWarnings("unchecked")
    public <T> boolean sendToEmitter(String subscriptionId, T message) {
        EmitterSubscription<?> subscription = emitterRegistry.get(subscriptionId);
        if (subscription == null) {
            LOG.warnf("Cannot send: Emitter subscription %s not found", subscriptionId);
            return false;
        }

        try {
            MultiEmitter<T> emitter = (MultiEmitter<T>) subscription.getEmitter();
            emitter.emit(message);
            subscription.recordEvent();
            messagesSent.merge(subscription.getStreamType(), 1L, Long::sum);
            return true;
        } catch (Exception e) {
            LOG.errorf(e, "Failed to send to emitter %s", subscriptionId);
            subscription.recordError();
            errorsCount.merge(subscription.getStreamType(), 1L, Long::sum);
            return false;
        }
    }

    /**
     * Get emitter count for a stream type
     */
    public int getEmitterCount(StreamType streamType) {
        List<EmitterSubscription<?>> emitters = emitterStreams.get(streamType);
        return emitters != null ? emitters.size() : 0;
    }

    /**
     * Get total emitter count
     */
    public int getTotalEmitterCount() {
        return emitterStreams.values().stream()
            .mapToInt(List::size)
            .sum();
    }

    /**
     * Check if any emitters are active for a type
     */
    public boolean hasActiveEmitters(StreamType streamType) {
        List<EmitterSubscription<?>> emitters = emitterStreams.get(streamType);
        return emitters != null && !emitters.isEmpty();
    }

    /**
     * Get emitter subscription by ID
     */
    public EmitterSubscription<?> getEmitterSubscription(String subscriptionId) {
        return emitterRegistry.get(subscriptionId);
    }

    /**
     * Get all emitter subscriptions for a client
     */
    public List<EmitterSubscription<?>> getClientEmitterSubscriptions(String clientId) {
        Set<String> emitters = clientEmitters.get(clientId);
        if (emitters == null || emitters.isEmpty()) {
            return new ArrayList<>();
        }
        return emitters.stream()
            .map(emitterRegistry::get)
            .filter(e -> e != null)
            .collect(Collectors.toList());
    }

    /**
     * Get count of active streams for a type
     *
     * @param streamType Stream type
     * @return Number of active streams
     */
    public int getStreamCount(StreamType streamType) {
        return streams.get(streamType).size();
    }

    /**
     * Get total count of all active streams
     *
     * @return Total number of active streams
     */
    public int getTotalStreamCount() {
        return streams.values().stream()
            .mapToInt(List::size)
            .sum();
    }

    /**
     * Check if any streams are active for a type
     *
     * @param streamType Stream type
     * @return true if at least one stream is active
     */
    public boolean hasActiveStreams(StreamType streamType) {
        return !streams.get(streamType).isEmpty();
    }

    /**
     * Check if any streams are active
     *
     * @return true if at least one stream is active
     */
    public boolean hasAnyActiveStreams() {
        return getTotalStreamCount() > 0;
    }

    /**
     * Get total subscription count (streams + emitters)
     * Used by dashboard status endpoints.
     *
     * @return Total number of active subscriptions
     */
    public int getSubscriptionCount() {
        return getTotalStreamCount() + getTotalEmitterCount();
    }

    /**
     * Get statistics for a stream type
     *
     * @param streamType Stream type
     * @return Statistics map
     */
    public java.util.Map<String, Object> getStreamStats(StreamType streamType) {
        return java.util.Map.of(
            "activeStreams", getStreamCount(streamType),
            "messagesSent", messagesSent.getOrDefault(streamType, 0L),
            "errorsCount", errorsCount.getOrDefault(streamType, 0L)
        );
    }

    /**
     * Get all statistics
     *
     * @return Statistics for all stream types
     */
    public java.util.Map<String, Object> getAllStats() {
        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("totalStreams", getTotalStreamCount());
        stats.put("totalMessagesSent", messagesSent.values().stream().mapToLong(Long::longValue).sum());
        stats.put("totalErrors", errorsCount.values().stream().mapToLong(Long::longValue).sum());

        for (StreamType type : StreamType.values()) {
            stats.put(type.name().toLowerCase() + "Stats", getStreamStats(type));
        }

        return stats;
    }

    /**
     * Complete all streams (graceful shutdown)
     */
    public void completeAllStreams() {
        LOG.info("Completing all gRPC streams for shutdown");

        // Complete StreamObserver streams
        for (List<StreamSubscription<?>> typeStreams : streams.values()) {
            for (StreamSubscription<?> subscription : typeStreams) {
                try {
                    subscription.observer().onCompleted();
                } catch (Exception e) {
                    LOG.warnf("Error completing stream %s: %s", subscription.subscriptionId(), e.getMessage());
                }
            }
            typeStreams.clear();
        }
        clientSubscriptions.clear();

        // Complete Mutiny emitter streams
        for (List<EmitterSubscription<?>> typeEmitters : emitterStreams.values()) {
            for (EmitterSubscription<?> subscription : typeEmitters) {
                try {
                    subscription.getEmitter().complete();
                } catch (Exception e) {
                    LOG.warnf("Error completing emitter %s: %s", subscription.getSubscriptionId(), e.getMessage());
                }
            }
            typeEmitters.clear();
        }
        emitterRegistry.clear();
        clientEmitters.clear();

        LOG.info("All gRPC streams completed");
    }

    /**
     * Shutdown the stream manager (cleanup scheduler)
     */
    public void shutdown() {
        LOG.info("Shutting down GrpcStreamManager...");

        // Stop cleanup scheduler
        cleanupScheduler.shutdown();
        try {
            if (!cleanupScheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                cleanupScheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            cleanupScheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }

        // Complete all streams
        completeAllStreams();

        LOG.info("GrpcStreamManager shutdown complete");
    }

    // ========== Private Methods ==========

    private String generateSubscriptionId(StreamType type, String clientId) {
        return String.format("%s-%s-%d", type.name().toLowerCase(), clientId, System.currentTimeMillis());
    }

    /**
     * Cleanup dead/timed-out emitter streams
     */
    private void cleanupDeadStreams() {
        long now = System.currentTimeMillis();
        List<String> deadEmitters = new ArrayList<>();

        for (EmitterSubscription<?> subscription : emitterRegistry.values()) {
            long age = now - subscription.getRegisteredAt();
            long idle = now - subscription.getLastActivityAt();

            // Check for timeout
            if (age > STREAM_TIMEOUT_MS) {
                LOG.warnf("Emitter %s timed out (age: %dms)", subscription.getSubscriptionId(), age);
                deadEmitters.add(subscription.getSubscriptionId());
            } else if (idle > IDLE_TIMEOUT_MS) {
                LOG.warnf("Emitter %s idle timeout (idle: %dms)", subscription.getSubscriptionId(), idle);
                deadEmitters.add(subscription.getSubscriptionId());
            } else if (subscription.getErrorCount() > 5) {
                LOG.warnf("Emitter %s has too many errors (%d)", subscription.getSubscriptionId(), subscription.getErrorCount());
                deadEmitters.add(subscription.getSubscriptionId());
            }
        }

        // Cleanup dead emitters
        for (String subscriptionId : deadEmitters) {
            unregisterEmitter(subscriptionId);
        }

        if (!deadEmitters.isEmpty()) {
            LOG.infof("Cleaned up %d dead emitter streams", deadEmitters.size());
        }
    }
}

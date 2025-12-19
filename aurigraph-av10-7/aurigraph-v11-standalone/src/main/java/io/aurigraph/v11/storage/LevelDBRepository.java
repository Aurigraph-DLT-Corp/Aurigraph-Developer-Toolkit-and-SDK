package io.aurigraph.v11.storage;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * Base LevelDB Repository
 *
 * Provides generic CRUD operations for LevelDB storage.
 * Replaces Panache repository pattern with key-value storage.
 *
 * @param <T> Entity type
 * @param <ID> ID type (typically String)
 *
 * @version 1.0.0 (Oct 8, 2025)
 * @author Aurigraph V11 Development Team
 */
public abstract class LevelDBRepository<T, ID> {

    @Inject
    protected LevelDBService levelDB;

    @Inject
    protected ObjectMapper objectMapper;

    /**
     * Get the entity class for JSON serialization
     */
    protected abstract Class<T> getEntityClass();

    /**
     * Get the key prefix for this repository (e.g., "token:", "channel:")
     */
    protected abstract String getKeyPrefix();

    /**
     * Extract ID from entity
     */
    protected abstract ID getId(T entity);

    // ==================== BASIC CRUD OPERATIONS ====================

    /**
     * Save an entity to LevelDB
     */
    public Uni<T> persist(T entity) {
        // Serialize first, then chain the async write
        return Uni.createFrom().item(() -> {
            try {
                String key = buildKey(getId(entity));
                String value = objectMapper.writeValueAsString(entity);
                return java.util.Map.entry(key, value);
            } catch (Exception e) {
                throw new RuntimeException("Failed to serialize entity: " + e.getMessage(), e);
            }
        }).flatMap(entry ->
            levelDB.put(entry.getKey(), entry.getValue())
                .replaceWith(entity)
                .onFailure().transform(e ->
                    new RuntimeException("Failed to persist entity to LevelDB: " + e.getMessage(), e))
        );
    }

    /**
     * Find entity by ID
     */
    public Uni<Optional<T>> findById(ID id) {
        String key = buildKey(id);
        return levelDB.get(key)
            .map(value -> {
                if (value == null) {
                    return Optional.<T>empty();
                }
                try {
                    T entity = objectMapper.readValue(value, getEntityClass());
                    return Optional.of(entity);
                } catch (Exception e) {
                    throw new RuntimeException("Failed to deserialize entity: " + e.getMessage(), e);
                }
            })
            .onFailure().transform(e ->
                new RuntimeException("Failed to find entity by ID: " + e.getMessage(), e));
    }

    /**
     * Delete entity by ID
     */
    public Uni<Void> deleteById(ID id) {
        String key = buildKey(id);
        return levelDB.delete(key)
            .onFailure().transform(e ->
                new RuntimeException("Failed to delete entity: " + e.getMessage(), e));
    }

    /**
     * Delete an entity
     */
    public Uni<Void> delete(T entity) {
        return deleteById(getId(entity));
    }

    /**
     * Check if entity exists
     */
    public Uni<Boolean> existsById(ID id) {
        String key = buildKey(id);
        return levelDB.exists(key)
            .onFailure().transform(e ->
                new RuntimeException("Failed to check existence: " + e.getMessage(), e));
    }

    /**
     * Count all entities
     */
    public Uni<Long> count() {
        return levelDB.getKeysByPrefix(getKeyPrefix())
            .map(keys -> (long) keys.size())
            .onFailure().transform(e ->
                new RuntimeException("Failed to count entities: " + e.getMessage(), e));
    }

    /**
     * List all entities
     */
    public Uni<List<T>> listAll() {
        return levelDB.scanByPrefix(getKeyPrefix())
            .map(entries -> {
                List<T> entities = new ArrayList<>();
                for (String value : entries.values()) {
                    try {
                        entities.add(objectMapper.readValue(value, getEntityClass()));
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to deserialize entity: " + e.getMessage(), e);
                    }
                }
                return entities;
            })
            .onFailure().transform(e ->
                new RuntimeException("Failed to list all entities: " + e.getMessage(), e));
    }

    // ==================== QUERY OPERATIONS ====================

    /**
     * Find entities matching a predicate
     */
    public Uni<List<T>> findBy(Predicate<T> predicate) {
        return listAll().map(entities ->
            entities.stream()
                .filter(predicate)
                .collect(Collectors.toList())
        );
    }

    /**
     * Find first entity matching a predicate
     */
    public Uni<Optional<T>> findFirstBy(Predicate<T> predicate) {
        return listAll().map(entities ->
            entities.stream()
                .filter(predicate)
                .findFirst()
        );
    }

    /**
     * Count entities matching a predicate
     */
    public Uni<Long> countBy(Predicate<T> predicate) {
        return listAll().map(entities ->
            entities.stream()
                .filter(predicate)
                .count()
        );
    }

    // ==================== BATCH OPERATIONS ====================

    /**
     * Save multiple entities
     */
    public Uni<List<T>> persistAll(List<T> entities) {
        // Serialize all entities first
        return Uni.createFrom().item(() -> {
            try {
                return entities.stream()
                    .collect(Collectors.toMap(
                        e -> buildKey(getId(e)),
                        e -> {
                            try {
                                return objectMapper.writeValueAsString(e);
                            } catch (Exception ex) {
                                throw new RuntimeException("Failed to serialize entity: " + ex.getMessage(), ex);
                            }
                        }
                    ));
            } catch (Exception e) {
                throw new RuntimeException("Failed to prepare batch persist: " + e.getMessage(), e);
            }
        }).flatMap(puts ->
            levelDB.batchWrite(puts, null)
                .replaceWith(entities)
                .onFailure().transform(e ->
                    new RuntimeException("Failed to persist all entities to LevelDB: " + e.getMessage(), e))
        );
    }

    /**
     * Delete all entities
     */
    public Uni<Void> deleteAll() {
        return levelDB.getKeysByPrefix(getKeyPrefix())
            .flatMap(keys ->
                levelDB.batchWrite(null, keys)
                    .onFailure().transform(e ->
                        new RuntimeException("Failed to delete all entities: " + e.getMessage(), e))
            );
    }

    // ==================== HELPER METHODS ====================

    /**
     * Build storage key from ID
     */
    protected String buildKey(ID id) {
        return getKeyPrefix() + id.toString();
    }

    /**
     * Extract ID from storage key
     */
    protected String extractId(String key) {
        return key.substring(getKeyPrefix().length());
    }
}

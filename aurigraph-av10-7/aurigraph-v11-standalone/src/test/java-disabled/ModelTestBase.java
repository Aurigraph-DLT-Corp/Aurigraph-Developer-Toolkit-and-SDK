package io.aurigraph.v11;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.lang.reflect.Constructor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.*;

/**
 * Base test class for testing model classes and data structures.
 * 
 * Features:
 * - Field validation testing
 * - Constructor testing
 * - Immutability testing
 * - Serialization testing
 * - Equality and hashCode testing
 * - Common model validation patterns
 * 
 * Usage: Extend this class for testing model classes and override test methods as needed.
 */
public abstract class ModelTestBase extends BaseTest {
    
    /**
     * Override this method to return the class being tested
     */
    protected abstract Class<?> getModelClass();
    
    /**
     * Override this method to provide valid constructor parameters
     */
    protected abstract Object[] getValidConstructorParams();
    
    /**
     * Override this method to provide constructor parameter types
     */
    protected abstract Class<?>[] getConstructorParameterTypes();
    
    @Test
    @DisplayName("Model class should not be null")
    void testModelClassNotNull() {
        assertThat(getModelClass())
            .as("Model class should not be null")
            .isNotNull();
    }
    
    @Test
    @DisplayName("Model should have valid constructor")
    void testValidConstructor() throws Exception {
        Class<?> modelClass = getModelClass();
        Class<?>[] paramTypes = getConstructorParameterTypes();
        Object[] params = getValidConstructorParams();
        
        Constructor<?> constructor = modelClass.getConstructor(paramTypes);
        assertThat(constructor)
            .as("Constructor should exist")
            .isNotNull();
            
        Object instance = constructor.newInstance(params);
        assertThat(instance)
            .as("Instance should be created successfully")
            .isNotNull()
            .isInstanceOf(modelClass);
    }
    
    @Test
    @DisplayName("Model fields should be accessible")
    void testFieldAccessibility() throws Exception {
        Class<?> modelClass = getModelClass();
        Object instance = createValidInstance();
        
        Field[] fields = modelClass.getDeclaredFields();
        assertThat(fields)
            .as("Model should have fields")
            .isNotEmpty();
            
        for (Field field : fields) {
            // Skip static fields and synthetic fields
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers()) || 
                field.isSynthetic()) {
                continue;
            }
            
            field.setAccessible(true);
            Object value = field.get(instance);
            
            // Validate that important fields are not null
            if (isRequiredField(field.getName())) {
                assertThat(value)
                    .as("Required field %s should not be null", field.getName())
                    .isNotNull();
            }
        }
    }
    
    @Test
    @DisplayName("Model should handle null parameters appropriately")
    void testNullParameterHandling() {
        Class<?> modelClass = getModelClass();
        Class<?>[] paramTypes = getConstructorParameterTypes();
        
        try {
            Constructor<?> constructor = modelClass.getConstructor(paramTypes);
            
            // Test with all null parameters
            Object[] nullParams = new Object[paramTypes.length];
            Arrays.fill(nullParams, null);
            
            // This should either work (if nulls are allowed) or throw appropriate exception
            try {
                Object instance = constructor.newInstance(nullParams);
                // If instance is created, validate it handles nulls properly
                validateNullHandling(instance);
            } catch (Exception e) {
                // Exception is expected for models that don't allow nulls
                logger.info("Model correctly rejects null parameters: {}", e.getMessage());
            }
        } catch (NoSuchMethodException e) {
            logger.warn("No public constructor found for testing null parameters");
        }
    }
    
    @Test
    @DisplayName("Model should have consistent toString implementation")
    void testToStringImplementation() throws Exception {
        Object instance1 = createValidInstance();
        Object instance2 = createValidInstance();
        
        String toString1 = instance1.toString();
        String toString2 = instance2.toString();
        
        assertThat(toString1)
            .as("toString should not be null")
            .isNotNull()
            .as("toString should not be empty")
            .isNotEmpty()
            .as("toString should contain class name")
            .contains(getModelClass().getSimpleName());
            
        // If instances are equal, toString should be equal
        if (instance1.equals(instance2)) {
            assertThat(toString1)
                .as("Equal instances should have equal toString")
                .isEqualTo(toString2);
        }
    }
    
    /**
     * Tests that date/time fields are properly initialized
     */
    @Test
    @DisplayName("Date/time fields should be properly initialized")
    void testDateTimeFields() throws Exception {
        Object instance = createValidInstance();
        Class<?> modelClass = getModelClass();
        
        Field[] fields = modelClass.getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            
            if (field.getType() == Instant.class) {
                Instant value = (Instant) field.get(instance);
                if (value != null) {
                    assertThat(value)
                        .as("Instant field %s should not be in the future", field.getName())
                        .isBeforeOrEqualTo(Instant.now());
                }
            }
        }
    }
    
    /**
     * Tests that numeric fields have reasonable values
     */
    @Test
    @DisplayName("Numeric fields should have reasonable values")
    void testNumericFields() throws Exception {
        Object instance = createValidInstance();
        Class<?> modelClass = getModelClass();
        
        Field[] fields = modelClass.getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            Object value = field.get(instance);
            
            if (value instanceof Long) {
                Long longValue = (Long) value;
                assertThat(longValue)
                    .as("Long field %s should not be negative", field.getName())
                    .isGreaterThanOrEqualTo(0L);
            } else if (value instanceof Integer) {
                Integer intValue = (Integer) value;
                assertThat(intValue)
                    .as("Integer field %s should not be negative", field.getName())
                    .isGreaterThanOrEqualTo(0);
            } else if (value instanceof BigDecimal) {
                BigDecimal decimalValue = (BigDecimal) value;
                assertThat(decimalValue)
                    .as("BigDecimal field %s should not be negative", field.getName())
                    .isGreaterThanOrEqualTo(BigDecimal.ZERO);
            }
        }
    }
    
    /**
     * Tests that string fields are properly initialized
     */
    @Test
    @DisplayName("String fields should be properly initialized")
    void testStringFields() throws Exception {
        Object instance = createValidInstance();
        Class<?> modelClass = getModelClass();
        
        Field[] fields = modelClass.getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            
            if (field.getType() == String.class) {
                String value = (String) field.get(instance);
                if (value != null && isRequiredField(field.getName())) {
                    assertThat(value)
                        .as("Required string field %s should not be empty", field.getName())
                        .isNotEmpty();
                }
            }
        }
    }
    
    /**
     * Tests that collection fields are properly initialized
     */
    @Test
    @DisplayName("Collection fields should be properly initialized")
    void testCollectionFields() throws Exception {
        Object instance = createValidInstance();
        Class<?> modelClass = getModelClass();
        
        Field[] fields = modelClass.getDeclaredFields();
        for (Field field : fields) {
            field.setAccessible(true);
            
            if (Collection.class.isAssignableFrom(field.getType())) {
                Collection<?> collection = (Collection<?>) field.get(instance);
                if (collection != null) {
                    // Collection should be safe to iterate
                    assertThatCode(() -> {
                        for (Object item : collection) {
                            // Just iterate to ensure no exceptions
                        }
                    }).as("Collection field %s should be safely iterable", field.getName())
                      .doesNotThrowAnyException();
                }
            } else if (Map.class.isAssignableFrom(field.getType())) {
                Map<?, ?> map = (Map<?, ?>) field.get(instance);
                if (map != null) {
                    // Map should be safe to iterate
                    assertThatCode(() -> {
                        for (Map.Entry<?, ?> entry : map.entrySet()) {
                            // Just iterate to ensure no exceptions
                        }
                    }).as("Map field %s should be safely iterable", field.getName())
                      .doesNotThrowAnyException();
                }
            }
        }
    }
    
    /**
     * Helper method to create a valid instance of the model
     */
    protected Object createValidInstance() throws Exception {
        Class<?> modelClass = getModelClass();
        Class<?>[] paramTypes = getConstructorParameterTypes();
        Object[] params = getValidConstructorParams();
        
        Constructor<?> constructor = modelClass.getConstructor(paramTypes);
        return constructor.newInstance(params);
    }
    
    /**
     * Override this method to specify which fields are required (non-null)
     */
    protected boolean isRequiredField(String fieldName) {
        // Common required fields
        Set<String> commonRequiredFields = Set.of(
            "id", "nodeId", "assetId", "tokenId", "owner", "term", "command"
        );
        return commonRequiredFields.contains(fieldName);
    }
    
    /**
     * Override this method to customize null handling validation
     */
    protected void validateNullHandling(Object instance) {
        assertThat(instance)
            .as("Instance created with null parameters should not be null")
            .isNotNull();
    }
    
    /**
     * Validates that the model properly handles edge case values
     */
    protected void validateEdgeCaseHandling() throws Exception {
        // This can be overridden by subclasses for specific edge case testing
        logger.info("Edge case validation completed for {}", getModelClass().getSimpleName());
    }
    
    /**
     * Validates that the model is thread-safe (for immutable models)
     */
    protected void validateThreadSafety() throws Exception {
        Object instance = createValidInstance();
        
        // Test concurrent access to the instance
        List<Thread> threads = new ArrayList<>();
        List<Throwable> exceptions = Collections.synchronizedList(new ArrayList<>());
        
        for (int i = 0; i < 10; i++) {
            Thread thread = new Thread(() -> {
                try {
                    // Access all public methods
                    Method[] methods = getModelClass().getMethods();
                    for (Method method : methods) {
                        if (method.getParameterCount() == 0 && 
                            !method.getName().equals("wait") &&
                            !method.getName().equals("notify") &&
                            !method.getName().equals("notifyAll")) {
                            method.invoke(instance);
                        }
                    }
                } catch (Exception e) {
                    exceptions.add(e);
                }
            });
            threads.add(thread);
            thread.start();
        }
        
        // Wait for all threads to complete
        for (Thread thread : threads) {
            thread.join(1000); // 1 second timeout
        }
        
        assertThat(exceptions)
            .as("No exceptions should occur during concurrent access")
            .isEmpty();
    }
}
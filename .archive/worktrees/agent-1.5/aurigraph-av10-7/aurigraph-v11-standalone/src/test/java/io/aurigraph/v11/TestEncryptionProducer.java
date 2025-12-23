package io.aurigraph.v11;

import io.aurigraph.v11.security.MockEncryptionService;
import io.quarkus.test.Mock;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Produces;

/**
 * Test-scoped encryption service producer
 *
 * This provider ensures the MockEncryptionService is used during tests
 * instead of the real EncryptionService, avoiding encryption key initialization issues.
 */
@ApplicationScoped
public class TestEncryptionProducer {

    @Produces
    @Mock
    @ApplicationScoped
    public MockEncryptionService provideMockEncryptionService() {
        return new MockEncryptionService();
    }
}

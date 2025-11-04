package io.aurigraph.v11.user;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

/**
 * Utility test to generate BCrypt password hashes for testing
 */
@QuarkusTest
public class PasswordHashGeneratorTest {

    @Test
    public void generatePasswordHashesForAdminCredentials() {
        // Password policy: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
        String[] testPasswords = {
                "Admin@123",      // Valid: uppercase, lowercase, digit, special char
                "Admin@2025",     // Valid
                "Test1234!",      // Valid
                "Secure!Pass1"    // Valid
        };

        System.out.println("========================================");
        System.out.println("BCrypt Password Hashes (Cost Factor 12)");
        System.out.println("========================================");

        for (String password : testPasswords) {
            String hash = BcryptUtil.bcryptHash(password, 12);
            boolean isValid = BcryptUtil.matches(password, hash);
            System.out.printf("Password: %-20s | Valid: %s%n", password, isValid);
            System.out.printf("Hash: %s%n", hash);
            System.out.println("----------------------------------------");
        }
    }

    @Test
    public void testVerifyPasswordHash() {
        // Verify the original hash from seed file
        String originalHash = "$2a$10$XLXsIzl/0Wkr/C/d.Mn8ee/5tpgW/bXzQfZOZzLqPZb/gW4rUXRQ2";
        String originalPassword = "AdminPassword123!";

        boolean matches = BcryptUtil.matches(originalPassword, originalHash);
        System.out.println("\n========================================");
        System.out.println("Verify Original Admin Password");
        System.out.println("========================================");
        System.out.printf("Password: %s%n", originalPassword);
        System.out.printf("Hash Matches: %s%n", matches);
        System.out.println("----------------------------------------");
    }
}

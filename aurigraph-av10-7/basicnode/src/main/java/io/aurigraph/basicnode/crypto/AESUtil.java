package io.aurigraph.basicnode.crypto;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.spec.IvParameterSpec;
import java.security.SecureRandom;
import java.util.logging.Logger;

public class AESUtil {
    
    private static final Logger LOGGER = Logger.getLogger(AESUtil.class.getName());
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/CBC/PKCS5Padding";
    private static final int IV_LENGTH = 16; // 128-bit IV for CBC mode
    
    public static byte[] encrypt(byte[] plaintext, byte[] key) throws Exception {
        if (key.length != 32) { // 256-bit key
            throw new IllegalArgumentException("AES key must be 256 bits (32 bytes)");
        }
        
        // Generate random IV
        byte[] iv = new byte[IV_LENGTH];
        new SecureRandom().nextBytes(iv);
        
        // Create cipher
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        SecretKeySpec keySpec = new SecretKeySpec(key, ALGORITHM);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);
        byte[] ciphertext = cipher.doFinal(plaintext);
        
        // Prepend IV to ciphertext
        byte[] result = new byte[IV_LENGTH + ciphertext.length];
        System.arraycopy(iv, 0, result, 0, IV_LENGTH);
        System.arraycopy(ciphertext, 0, result, IV_LENGTH, ciphertext.length);
        
        return result;
    }
    
    public static byte[] decrypt(byte[] encryptedData, byte[] key) throws Exception {
        if (key.length != 32) { // 256-bit key
            throw new IllegalArgumentException("AES key must be 256 bits (32 bytes)");
        }
        
        if (encryptedData.length < IV_LENGTH) {
            throw new IllegalArgumentException("Encrypted data too short to contain IV");
        }
        
        // Extract IV and ciphertext
        byte[] iv = new byte[IV_LENGTH];
        byte[] ciphertext = new byte[encryptedData.length - IV_LENGTH];
        
        System.arraycopy(encryptedData, 0, iv, 0, IV_LENGTH);
        System.arraycopy(encryptedData, IV_LENGTH, ciphertext, 0, ciphertext.length);
        
        // Create cipher
        Cipher cipher = Cipher.getInstance(TRANSFORMATION);
        SecretKeySpec keySpec = new SecretKeySpec(key, ALGORITHM);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
        
        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
        return cipher.doFinal(ciphertext);
    }
    
    public static byte[] generateKey() {
        try {
            KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
            keyGen.init(256); // 256-bit key
            SecretKey secretKey = keyGen.generateKey();
            return secretKey.getEncoded();
        } catch (Exception e) {
            LOGGER.severe("AES key generation failed: " + e.getMessage());
            throw new RuntimeException("AES key generation failed", e);
        }
    }
}
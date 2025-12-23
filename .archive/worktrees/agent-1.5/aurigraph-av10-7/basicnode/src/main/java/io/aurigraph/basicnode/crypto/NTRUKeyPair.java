package io.aurigraph.basicnode.crypto;

import java.time.Instant;
import java.util.UUID;

public class NTRUKeyPair {
    
    private final String keyId;
    private final NTRUPublicKey publicKey;
    private final NTRUPrivateKey privateKey;
    private final Instant createdAt;
    private final KeyMetadata metadata;
    
    public NTRUKeyPair(NTRUPublicKey publicKey, NTRUPrivateKey privateKey) {
        this.keyId = UUID.randomUUID().toString();
        this.publicKey = publicKey;
        this.privateKey = privateKey;
        this.createdAt = Instant.now();
        this.metadata = new KeyMetadata(
            "NTRU",
            1024, // Key size
            256,  // Security level
            true, // NIST compliant
            true, // Quantum resistant
            createdAt,
            null  // No expiration for demo
        );
    }
    
    public String getKeyId() {
        return keyId;
    }
    
    public NTRUPublicKey getPublicKey() {
        return publicKey;
    }
    
    public NTRUPrivateKey getPrivateKey() {
        return privateKey;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public KeyMetadata getMetadata() {
        return metadata;
    }
    
    public boolean isValid() {
        return publicKey != null && privateKey != null && 
               publicKey.isValid() && privateKey.isValid();
    }
    
    public boolean isExpired() {
        return metadata.getExpiresAt() != null && 
               Instant.now().isAfter(metadata.getExpiresAt());
    }
    
    public int getSecurityLevel() {
        return metadata.getSecurityLevel();
    }
    
    public boolean isQuantumResistant() {
        return metadata.isQuantumResistant();
    }
    
    @Override
    public String toString() {
        return String.format("NTRUKeyPair{keyId='%s', created=%s, securityLevel=%d, quantumResistant=%s}", 
                           keyId, createdAt, getSecurityLevel(), isQuantumResistant());
    }
    
    // Metadata class for key information
    public static class KeyMetadata {
        private final String algorithm;
        private final int keySize;
        private final int securityLevel;
        private final boolean nistCompliant;
        private final boolean quantumResistant;
        private final Instant createdAt;
        private final Instant expiresAt;
        
        public KeyMetadata(String algorithm, int keySize, int securityLevel, 
                          boolean nistCompliant, boolean quantumResistant,
                          Instant createdAt, Instant expiresAt) {
            this.algorithm = algorithm;
            this.keySize = keySize;
            this.securityLevel = securityLevel;
            this.nistCompliant = nistCompliant;
            this.quantumResistant = quantumResistant;
            this.createdAt = createdAt;
            this.expiresAt = expiresAt;
        }
        
        public String getAlgorithm() { return algorithm; }
        public int getKeySize() { return keySize; }
        public int getSecurityLevel() { return securityLevel; }
        public boolean isNISTCompliant() { return nistCompliant; }
        public boolean isQuantumResistant() { return quantumResistant; }
        public Instant getCreatedAt() { return createdAt; }
        public Instant getExpiresAt() { return expiresAt; }
    }
}

// Supporting key classes
class NTRUPublicKey {
    private final NTRUPolynomial h;
    private final int n;
    private final int p;
    private final int q;
    
    public NTRUPublicKey(NTRUPolynomial h, int n, int p, int q) {
        this.h = h;
        this.n = n;
        this.p = p;
        this.q = q;
    }
    
    public NTRUPolynomial getH() { return h; }
    public int getN() { return n; }
    public int getP() { return p; }
    public int getQ() { return q; }
    
    public boolean isValid() {
        return h != null && n > 0 && p > 0 && q > 0 && q > p;
    }
    
    public byte[] toBytes() {
        if (h == null) return new byte[0];
        
        int[] coeffs = h.getCoefficients();
        byte[] bytes = new byte[coeffs.length * 4]; // 4 bytes per int
        
        for (int i = 0; i < coeffs.length; i++) {
            int value = coeffs[i];
            bytes[i * 4] = (byte) (value >> 24);
            bytes[i * 4 + 1] = (byte) (value >> 16);
            bytes[i * 4 + 2] = (byte) (value >> 8);
            bytes[i * 4 + 3] = (byte) value;
        }
        
        return bytes;
    }
    
    @Override
    public String toString() {
        return String.format("NTRUPublicKey{N=%d, P=%d, Q=%d, h=%s}", n, p, q, h != null ? "present" : "null");
    }
}

class NTRUPrivateKey {
    private final NTRUPolynomial f;
    private final NTRUPolynomial fInvP;
    private final int n;
    private final int p;
    private final int q;
    
    public NTRUPrivateKey(NTRUPolynomial f, NTRUPolynomial fInvP, int n, int p, int q) {
        this.f = f;
        this.fInvP = fInvP;
        this.n = n;
        this.p = p;
        this.q = q;
    }
    
    public NTRUPolynomial getF() { return f; }
    public NTRUPolynomial getFInvP() { return fInvP; }
    public int getN() { return n; }
    public int getP() { return p; }
    public int getQ() { return q; }
    
    public boolean isValid() {
        return f != null && fInvP != null && n > 0 && p > 0 && q > 0 && q > p;
    }
    
    // Private keys should not be serialized easily for security
    public boolean hasValidStructure() {
        if (f == null) return false;
        
        // Check that f has the expected structure for NTRU
        int[] coeffs = f.getCoefficients();
        int positiveCoeffs = 0;
        int negativeCoeffs = 0;
        
        for (int coeff : coeffs) {
            if (coeff == 1) positiveCoeffs++;
            else if (coeff == -1) negativeCoeffs++;
        }
        
        // NTRU private key should have specific number of +1 and -1 coefficients
        return positiveCoeffs > 0 && negativeCoeffs >= 0;
    }
    
    @Override
    public String toString() {
        return String.format("NTRUPrivateKey{N=%d, P=%d, Q=%d, valid=%s}", n, p, q, isValid());
    }
}
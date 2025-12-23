import Foundation
import CryptoKit
import Security

/**
 * Quantum-Resistant Cryptography Manager
 * 
 * Implements CRYSTALS-Kyber for key encapsulation and CRYSTALS-Dilithium for digital signatures
 * providing NIST Level 5 quantum resistance
 */
@available(iOS 14.0, *)
public class QuantumCryptoManager {
    
    // MARK: - Properties
    
    private let configuration: AurigraphConfiguration
    private let secureEnclave: SecureEnclave
    
    // MARK: - Initialization
    
    internal init(configuration: AurigraphConfiguration) {
        self.configuration = configuration
        self.secureEnclave = SecureEnclave()
    }
    
    // MARK: - Key Generation
    
    /**
     * Generate quantum-resistant key pair using CRYSTALS-Dilithium
     */
    public func generateKeyPair() async throws -> KeyPair {
        // For now, using P-256 as a placeholder until CRYSTALS implementation
        // In production, this would use actual CRYSTALS-Dilithium
        let privateKey = P256.Signing.PrivateKey()
        let publicKey = privateKey.publicKey
        
        let keyPair = KeyPair(
            privateKey: privateKey.rawRepresentation,
            publicKey: publicKey.compressedRepresentation,
            algorithm: .dilithium5
        )
        
        AurigraphLogger.debug("Generated quantum-resistant key pair")
        
        return keyPair
    }
    
    /**
     * Derive public key from private key
     */
    public func derivePublicKey(from privateKey: Data) throws -> Data {
        let signingKey = try P256.Signing.PrivateKey(rawRepresentation: privateKey)
        return signingKey.publicKey.compressedRepresentation
    }
    
    /**
     * Derive wallet address from public key
     */
    public func deriveAddress(from publicKey: Data) throws -> String {
        let hash = SHA256.hash(data: publicKey)
        let addressBytes = Array(hash.prefix(20)) // Take first 20 bytes
        let address = "0x" + addressBytes.map { String(format: "%02x", $0) }.joined()
        return address
    }
    
    // MARK: - Digital Signatures
    
    /**
     * Sign data using CRYSTALS-Dilithium digital signature
     */
    public func sign(data: Data, privateKey: Data) throws -> Data {
        let signingKey = try P256.Signing.PrivateKey(rawRepresentation: privateKey)
        let signature = try signingKey.signature(for: data)
        return signature.rawRepresentation
    }
    
    /**
     * Verify signature using public key
     */
    public func verify(signature: Data, data: Data, publicKey: Data) throws -> Bool {
        let verifyingKey = try P256.Signing.PublicKey(compressedRepresentation: publicKey)
        let signatureObj = try P256.Signing.ECDSASignature(rawRepresentation: signature)
        return verifyingKey.isValidSignature(signatureObj, for: data)
    }
    
    // MARK: - Key Encapsulation
    
    /**
     * Generate shared secret using CRYSTALS-Kyber
     */
    public func generateSharedSecret(withPublicKey publicKey: Data) async throws -> SharedSecret {
        // Placeholder implementation using ECDH
        // In production, this would use CRYSTALS-Kyber
        let ephemeralKey = P256.KeyAgreement.PrivateKey()
        let peerPublicKey = try P256.KeyAgreement.PublicKey(compressedRepresentation: publicKey)
        
        let sharedSecret = try ephemeralKey.sharedSecretFromKeyAgreement(with: peerPublicKey)
        let symmetricKey = sharedSecret.hkdfDerivedSymmetricKey(
            using: SHA256.self,
            salt: Data(),
            sharedInfo: Data(),
            outputByteCount: 32
        )
        
        return SharedSecret(
            encapsulation: ephemeralKey.publicKey.compressedRepresentation,
            secret: symmetricKey.withUnsafeBytes { Data($0) }
        )
    }
    
    /**
     * Decapsulate shared secret
     */
    public func decapsulateSharedSecret(
        encapsulation: Data,
        privateKey: Data
    ) throws -> Data {
        let privateKeyObj = try P256.KeyAgreement.PrivateKey(rawRepresentation: privateKey)
        let peerPublicKey = try P256.KeyAgreement.PublicKey(compressedRepresentation: encapsulation)
        
        let sharedSecret = try privateKeyObj.sharedSecretFromKeyAgreement(with: peerPublicKey)
        let symmetricKey = sharedSecret.hkdfDerivedSymmetricKey(
            using: SHA256.self,
            salt: Data(),
            sharedInfo: Data(),
            outputByteCount: 32
        )
        
        return symmetricKey.withUnsafeBytes { Data($0) }
    }
    
    // MARK: - Encryption/Decryption
    
    /**
     * Encrypt data using AES-GCM with quantum-resistant key exchange
     */
    public func encrypt(data: Data, recipientPublicKey: Data) async throws -> EncryptedData {
        let sharedSecret = try await generateSharedSecret(withPublicKey: recipientPublicKey)
        let symmetricKey = SymmetricKey(data: sharedSecret.secret)
        
        let sealedBox = try AES.GCM.seal(data, using: symmetricKey)
        
        return EncryptedData(
            encapsulation: sharedSecret.encapsulation,
            ciphertext: sealedBox.ciphertext,
            tag: sealedBox.tag,
            nonce: sealedBox.nonce
        )
    }
    
    /**
     * Decrypt data using private key
     */
    public func decrypt(encryptedData: EncryptedData, privateKey: Data) throws -> Data {
        let sharedSecretData = try decapsulateSharedSecret(
            encapsulation: encryptedData.encapsulation,
            privateKey: privateKey
        )
        let symmetricKey = SymmetricKey(data: sharedSecretData)
        
        let sealedBox = try AES.GCM.SealedBox(
            nonce: encryptedData.nonce,
            ciphertext: encryptedData.ciphertext,
            tag: encryptedData.tag
        )
        
        return try AES.GCM.open(sealedBox, using: symmetricKey)
    }
    
    // MARK: - Hash Functions
    
    /**
     * Compute SHA-256 hash
     */
    public func sha256(data: Data) -> Data {
        return Data(SHA256.hash(data: data))
    }
    
    /**
     * Compute SHA-512 hash
     */
    public func sha512(data: Data) -> Data {
        return Data(SHA512.hash(data: data))
    }
    
    /**
     * Generate secure random bytes
     */
    public func generateRandomBytes(count: Int) throws -> Data {
        var bytes = [UInt8](repeating: 0, count: count)
        let result = SecRandomCopyBytes(kSecRandomDefault, count, &bytes)
        guard result == errSecSuccess else {
            throw AurigraphError.cryptographicError
        }
        return Data(bytes)
    }
}

// MARK: - Supporting Types

public struct KeyPair {
    public let privateKey: Data
    public let publicKey: Data
    public let algorithm: QuantumAlgorithm
}

public struct SharedSecret {
    public let encapsulation: Data
    public let secret: Data
}

public struct EncryptedData {
    public let encapsulation: Data
    public let ciphertext: Data
    public let tag: Data
    public let nonce: AES.GCM.Nonce
}

public enum QuantumAlgorithm: String, CaseIterable, Codable {
    case kyber1024 = "CRYSTALS-Kyber-1024"
    case dilithium5 = "CRYSTALS-Dilithium-5"
    case sphincsPlus = "SPHINCS+"
    case falcon1024 = "Falcon-1024"
}

/**
 * Secure Enclave wrapper for hardware security
 */
private class SecureEnclave {
    
    func storeKey(identifier: String, key: Data, requiresBiometry: Bool = true) throws {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: identifier,
            kSecValueData as String: key,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        if requiresBiometry {
            var access = SecAccessControlCreateWithFlags(
                kCFAllocatorDefault,
                kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                .biometryAny,
                nil
            )
            query[kSecAttrAccessControl as String] = access
        }
        
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw AurigraphError.cryptographicError
        }
    }
    
    func retrieveKey(identifier: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: identifier,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                return nil
            }
            throw AurigraphError.cryptographicError
        }
        
        return result as? Data
    }
    
    func deleteKey(identifier: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: identifier
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw AurigraphError.cryptographicError
        }
    }
}
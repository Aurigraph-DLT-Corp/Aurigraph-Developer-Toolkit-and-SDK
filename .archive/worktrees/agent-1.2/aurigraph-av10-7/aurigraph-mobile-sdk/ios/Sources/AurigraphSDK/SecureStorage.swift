import Foundation
import LocalAuthentication
import Security

/**
 * Secure Storage with biometric authentication and hardware security module integration
 */
@available(iOS 14.0, *)
public class SecureStorage {
    
    // MARK: - Properties
    
    private let serviceName = "io.aurigraph.mobile-sdk"
    private let accessGroup: String?
    
    // MARK: - Initialization
    
    public init(accessGroup: String? = nil) {
        self.accessGroup = accessGroup
    }
    
    // MARK: - Storage Methods
    
    /**
     * Store data securely with optional biometric protection
     */
    public func store(
        key: String,
        data: Data,
        passcode: String? = nil,
        useBiometrics: Bool = false
    ) async throws {
        
        let accessControl = try createAccessControl(
            passcode: passcode,
            useBiometrics: useBiometrics
        )
        
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessControl as String: accessControl
        ]
        
        if let accessGroup = accessGroup {
            query[kSecAttrAccessGroup as String] = accessGroup
        }
        
        // Delete existing item first
        SecItemDelete(query as CFDictionary)
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        guard status == errSecSuccess else {
            throw SecureStorageError.storageError(status)
        }
        
        AurigraphLogger.debug("Stored data for key: \(key)")
    }
    
    /**
     * Retrieve data from secure storage with authentication
     */
    public func retrieve(
        key: String,
        passcode: String? = nil,
        useBiometrics: Bool = false
    ) async throws -> Data? {
        
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        if let accessGroup = accessGroup {
            query[kSecAttrAccessGroup as String] = accessGroup
        }
        
        // Add authentication context if needed
        if passcode != nil || useBiometrics {
            let context = LAContext()
            query[kSecUseAuthenticationContext as String] = context
            
            if useBiometrics {
                let reason = "Authenticate to access your wallet data"
                let success = try await authenticateWithBiometrics(
                    context: context,
                    reason: reason
                )
                
                if !success {
                    throw SecureStorageError.authenticationFailed
                }
            }
        }
        
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                return nil
            }
            throw SecureStorageError.retrievalError(status)
        }
        
        guard let data = result as? Data else {
            throw SecureStorageError.invalidData
        }
        
        AurigraphLogger.debug("Retrieved data for key: \(key)")
        
        return data
    }
    
    /**
     * Delete data from secure storage
     */
    public func delete(key: String) async throws {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key
        ]
        
        if let accessGroup = accessGroup {
            query[kSecAttrAccessGroup as String] = accessGroup
        }
        
        let status = SecItemDelete(query as CFDictionary)
        
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw SecureStorageError.deletionError(status)
        }
        
        AurigraphLogger.debug("Deleted data for key: \(key)")
    }
    
    /**
     * Check if key exists in storage
     */
    public func exists(key: String) async throws -> Bool {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecAttrAccount as String: key,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        if let accessGroup = accessGroup {
            query[kSecAttrAccessGroup as String] = accessGroup
        }
        
        let status = SecItemCopyMatching(query as CFDictionary, nil)
        
        return status == errSecSuccess
    }
    
    /**
     * List all keys in storage
     */
    public func listKeys() async throws -> [String] {
        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: serviceName,
            kSecReturnAttributes as String: true,
            kSecMatchLimit as String: kSecMatchLimitAll
        ]
        
        if let accessGroup = accessGroup {
            query[kSecAttrAccessGroup as String] = accessGroup
        }
        
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                return []
            }
            throw SecureStorageError.retrievalError(status)
        }
        
        guard let items = result as? [[String: Any]] else {
            return []
        }
        
        return items.compactMap { item in
            item[kSecAttrAccount as String] as? String
        }
    }
    
    // MARK: - Hardware Security Module Integration
    
    /**
     * Generate key in Secure Enclave
     */
    public func generateSecureEnclaveKey(tag: String) throws -> SecKey {
        let flags: SecAccessControlCreateFlags = [
            .privateKeyUsage,
            .biometryCurrentSet
        ]
        
        guard let access = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            flags,
            nil
        ) else {
            throw SecureStorageError.accessControlCreationFailed
        }
        
        let keyAttributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECP256R1,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: true,
                kSecAttrApplicationTag as String: tag.data(using: .utf8)!,
                kSecAttrAccessControl as String: access
            ]
        ]
        
        var error: Unmanaged<CFError>?
        guard let privateKey = SecKeyCreateRandomKey(keyAttributes as CFDictionary, &error) else {
            if let error = error {
                throw SecureStorageError.keyGenerationFailed(error.takeRetainedValue())
            }
            throw SecureStorageError.keyGenerationFailed(nil)
        }
        
        AurigraphLogger.info("Generated Secure Enclave key with tag: \(tag)")
        
        return privateKey
    }
    
    /**
     * Load key from Secure Enclave
     */
    public func loadSecureEnclaveKey(tag: String) throws -> SecKey? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tag.data(using: .utf8)!,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECP256R1,
            kSecReturnRef as String: true
        ]
        
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                return nil
            }
            throw SecureStorageError.retrievalError(status)
        }
        
        return result as! SecKey
    }
    
    /**
     * Delete key from Secure Enclave
     */
    public func deleteSecureEnclaveKey(tag: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassKey,
            kSecAttrApplicationTag as String: tag.data(using: .utf8)!,
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECP256R1
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw SecureStorageError.deletionError(status)
        }
        
        AurigraphLogger.debug("Deleted Secure Enclave key with tag: \(tag)")
    }
    
    // MARK: - Private Methods
    
    private func createAccessControl(
        passcode: String?,
        useBiometrics: Bool
    ) throws -> SecAccessControl {
        
        var flags: SecAccessControlCreateFlags = []
        
        if useBiometrics {
            flags.insert(.biometryCurrentSet)
        }
        
        if passcode != nil {
            flags.insert(.applicationPassword)
        }
        
        if flags.isEmpty {
            flags.insert(.devicePasscode)
        }
        
        guard let accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            flags,
            nil
        ) else {
            throw SecureStorageError.accessControlCreationFailed
        }
        
        return accessControl
    }
    
    private func authenticateWithBiometrics(
        context: LAContext,
        reason: String
    ) async throws -> Bool {
        
        return try await withCheckedThrowingContinuation { continuation in
            context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            ) { success, error in
                if let error = error {
                    continuation.resume(throwing: SecureStorageError.biometricAuthenticationFailed(error))
                } else {
                    continuation.resume(returning: success)
                }
            }
        }
    }
}

// MARK: - Biometric Authentication Helper

@available(iOS 14.0, *)
extension SecureStorage {
    
    /**
     * Check biometric availability
     */
    public static func getBiometricType() -> BiometricType {
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            return .none
        }
        
        switch context.biometryType {
        case .faceID:
            return .face
        case .touchID:
            return .fingerprint
        case .opticID:
            return .iris
        default:
            return .none
        }
    }
    
    /**
     * Check if device has Secure Enclave
     */
    public static func hasSecureEnclave() -> Bool {
        // Try to create a temporary key in Secure Enclave
        let keyAttributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECP256R1,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave
        ]
        
        var error: Unmanaged<CFError>?
        let key = SecKeyCreateRandomKey(keyAttributes as CFDictionary, &error)
        
        if key != nil {
            // Clean up test key
            let query: [String: Any] = [
                kSecClass as String: kSecClassKey,
                kSecValueRef as String: key!
            ]
            SecItemDelete(query as CFDictionary)
            return true
        }
        
        return false
    }
    
    /**
     * Get device security level
     */
    public static func getSecurityLevel() -> SecurityLevel {
        let hasSecureEnclave = self.hasSecureEnclave()
        let biometricType = self.getBiometricType()
        
        if hasSecureEnclave && biometricType != .none {
            return .maximum
        } else if hasSecureEnclave || biometricType != .none {
            return .high
        } else {
            return .standard
        }
    }
}

// MARK: - Supporting Types

public enum BiometricType: String, CaseIterable {
    case none = "none"
    case fingerprint = "fingerprint"
    case face = "face"
    case iris = "iris"
}

public enum SecurityLevel: String, CaseIterable {
    case standard = "standard"
    case high = "high"
    case maximum = "maximum"
}

public enum SecureStorageError: LocalizedError {
    case accessControlCreationFailed
    case storageError(OSStatus)
    case retrievalError(OSStatus)
    case deletionError(OSStatus)
    case authenticationFailed
    case biometricAuthenticationFailed(Error)
    case invalidData
    case keyGenerationFailed(CFError?)
    
    public var errorDescription: String? {
        switch self {
        case .accessControlCreationFailed:
            return "Failed to create access control"
        case .storageError(let status):
            return "Storage error: \(status)"
        case .retrievalError(let status):
            return "Retrieval error: \(status)"
        case .deletionError(let status):
            return "Deletion error: \(status)"
        case .authenticationFailed:
            return "Authentication failed"
        case .biometricAuthenticationFailed(let error):
            return "Biometric authentication failed: \(error.localizedDescription)"
        case .invalidData:
            return "Invalid data format"
        case .keyGenerationFailed(let error):
            if let error = error {
                return "Key generation failed: \(CFErrorCopyDescription(error))"
            }
            return "Key generation failed"
        }
    }
}
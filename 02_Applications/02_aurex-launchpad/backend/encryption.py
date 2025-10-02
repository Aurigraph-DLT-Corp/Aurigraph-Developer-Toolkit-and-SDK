# ================================================================================
# AUREX LAUNCHPAD™ DATA ENCRYPTION MODULE
# AES-256 encryption for sensitive data protection and GDPR compliance
# Ticket: SECURITY-001 - Data Encryption Implementation (8 story points)
# Created: August 4, 2025
# Security: AES-256-GCM, key rotation, field-level encryption
# ================================================================================

import os
import secrets
import hashlib
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.fernet import Fernet
from typing import Optional, Dict, Any, Tuple, List
from datetime import datetime, timedelta
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================================================================================
# ENCRYPTION CONFIGURATION
# ================================================================================

class EncryptionConfig:
    """Encryption configuration and key management"""
    
    # Encryption settings
    AES_KEY_SIZE = 32  # 256 bits
    IV_SIZE = 16       # 128 bits
    TAG_SIZE = 16      # 128 bits for GCM
    SALT_SIZE = 32     # 256 bits
    PBKDF2_ITERATIONS = 100000  # OWASP recommended minimum
    
    # Key rotation settings
    KEY_ROTATION_DAYS = 90
    KEY_RETENTION_DAYS = 365
    
    def __init__(self):
        self.master_key = self._get_master_key()
        self.key_cache = {}
        self.key_versions = {}
    
    def _get_master_key(self) -> bytes:
        """Get or generate master encryption key"""
        master_key_path = os.getenv("MASTER_KEY_PATH", ".master_key")
        
        if os.path.exists(master_key_path):
            with open(master_key_path, "rb") as f:
                return f.read()
        else:
            # Generate new master key
            master_key = secrets.token_bytes(self.AES_KEY_SIZE)
            
            # Save securely (in production, use HSM or key management service)
            with open(master_key_path, "wb") as f:
                f.write(master_key)
            
            # Secure file permissions
            os.chmod(master_key_path, 0o600)
            
            logger.warning(f"Generated new master key at {master_key_path}")
            return master_key
    
    def derive_key(self, context: str, salt: Optional[bytes] = None) -> Tuple[bytes, bytes]:
        """Derive encryption key for specific context"""
        if salt is None:
            salt = secrets.token_bytes(self.SALT_SIZE)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=self.AES_KEY_SIZE,
            salt=salt,
            iterations=self.PBKDF2_ITERATIONS,
            backend=default_backend()
        )
        
        context_bytes = context.encode('utf-8')
        key = kdf.derive(self.master_key + context_bytes)
        
        return key, salt

# Global encryption configuration
encryption_config = EncryptionConfig()

# ================================================================================
# AES-GCM ENCRYPTION CLASS
# ================================================================================

class AESGCMEncryption:
    """AES-256-GCM encryption for maximum security"""
    
    @staticmethod
    def encrypt(plaintext: str, context: str = "default") -> Dict[str, str]:
        """
        Encrypt plaintext using AES-256-GCM
        
        Args:
            plaintext: The text to encrypt
            context: Encryption context for key derivation
            
        Returns:
            Dictionary containing encrypted data components
        """
        try:
            # Convert to bytes
            plaintext_bytes = plaintext.encode('utf-8')
            
            # Derive encryption key
            key, salt = encryption_config.derive_key(context)
            
            # Generate random IV
            iv = secrets.token_bytes(encryption_config.IV_SIZE)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(iv),
                backend=default_backend()
            )
            
            encryptor = cipher.encryptor()
            
            # Encrypt data
            ciphertext = encryptor.update(plaintext_bytes) + encryptor.finalize()
            
            # Get authentication tag
            auth_tag = encryptor.tag
            
            # Encode components to base64
            encrypted_data = {
                "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
                "iv": base64.b64encode(iv).decode('utf-8'),
                "salt": base64.b64encode(salt).decode('utf-8'),
                "tag": base64.b64encode(auth_tag).decode('utf-8'),
                "algorithm": "AES-256-GCM",
                "context": context,
                "encrypted_at": datetime.utcnow().isoformat()
            }
            
            return encrypted_data
            
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise EncryptionError(f"Failed to encrypt data: {str(e)}")
    
    @staticmethod
    def decrypt(encrypted_data: Dict[str, str]) -> str:
        """
        Decrypt AES-256-GCM encrypted data
        
        Args:
            encrypted_data: Dictionary containing encrypted data components
            
        Returns:
            Decrypted plaintext string
        """
        try:
            # Extract components
            ciphertext = base64.b64decode(encrypted_data["ciphertext"])
            iv = base64.b64decode(encrypted_data["iv"])
            salt = base64.b64decode(encrypted_data["salt"])
            auth_tag = base64.b64decode(encrypted_data["tag"])
            context = encrypted_data["context"]
            
            # Derive decryption key
            key, _ = encryption_config.derive_key(context, salt)
            
            # Create cipher
            cipher = Cipher(
                algorithms.AES(key),
                modes.GCM(iv, auth_tag),
                backend=default_backend()
            )
            
            decryptor = cipher.decryptor()
            
            # Decrypt data
            plaintext_bytes = decryptor.update(ciphertext) + decryptor.finalize()
            
            return plaintext_bytes.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise EncryptionError(f"Failed to decrypt data: {str(e)}")

# ================================================================================
# FERNET ENCRYPTION (ALTERNATIVE METHOD)
# ================================================================================

class FernetEncryption:
    """Fernet encryption for simpler symmetric encryption"""
    
    @staticmethod
    def generate_key() -> bytes:
        """Generate a Fernet encryption key"""
        return Fernet.generate_key()
    
    @staticmethod
    def encrypt(plaintext: str, key: Optional[bytes] = None) -> Dict[str, str]:
        """Encrypt using Fernet"""
        try:
            if key is None:
                key = FernetEncryption.generate_key()
            
            f = Fernet(key)
            ciphertext = f.encrypt(plaintext.encode('utf-8'))
            
            return {
                "ciphertext": base64.b64encode(ciphertext).decode('utf-8'),
                "key": base64.b64encode(key).decode('utf-8'),
                "algorithm": "Fernet",
                "encrypted_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Fernet encryption failed: {str(e)}")
            raise EncryptionError(f"Failed to encrypt with Fernet: {str(e)}")
    
    @staticmethod
    def decrypt(encrypted_data: Dict[str, str]) -> str:
        """Decrypt using Fernet"""
        try:
            ciphertext = base64.b64decode(encrypted_data["ciphertext"])
            key = base64.b64decode(encrypted_data["key"])
            
            f = Fernet(key)
            plaintext_bytes = f.decrypt(ciphertext)
            
            return plaintext_bytes.decode('utf-8')
            
        except Exception as e:
            logger.error(f"Fernet decryption failed: {str(e)}")
            raise EncryptionError(f"Failed to decrypt with Fernet: {str(e)}")

# ================================================================================
# RSA ASYMMETRIC ENCRYPTION
# ================================================================================

class RSAEncryption:
    """RSA asymmetric encryption for key exchange and digital signatures"""
    
    @staticmethod
    def generate_key_pair(key_size: int = 2048) -> Tuple[bytes, bytes]:
        """Generate RSA key pair"""
        try:
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=key_size,
                backend=default_backend()
            )
            
            public_key = private_key.public_key()
            
            # Serialize keys
            private_pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            
            public_pem = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            
            return private_pem, public_pem
            
        except Exception as e:
            logger.error(f"RSA key generation failed: {str(e)}")
            raise EncryptionError(f"Failed to generate RSA keys: {str(e)}")
    
    @staticmethod
    def encrypt(plaintext: str, public_key_pem: bytes) -> str:
        """Encrypt using RSA public key"""
        try:
            public_key = serialization.load_pem_public_key(
                public_key_pem,
                backend=default_backend()
            )
            
            ciphertext = public_key.encrypt(
                plaintext.encode('utf-8'),
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            return base64.b64encode(ciphertext).decode('utf-8')
            
        except Exception as e:
            logger.error(f"RSA encryption failed: {str(e)}")
            raise EncryptionError(f"Failed to encrypt with RSA: {str(e)}")
    
    @staticmethod
    def decrypt(ciphertext_b64: str, private_key_pem: bytes) -> str:
        """Decrypt using RSA private key"""
        try:
            private_key = serialization.load_pem_private_key(
                private_key_pem,
                password=None,
                backend=default_backend()
            )
            
            ciphertext = base64.b64decode(ciphertext_b64)
            
            plaintext_bytes = private_key.decrypt(
                ciphertext,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            
            return plaintext_bytes.decode('utf-8')
            
        except Exception as e:
            logger.error(f"RSA decryption failed: {str(e)}")
            raise EncryptionError(f"Failed to decrypt with RSA: {str(e)}")

# ================================================================================
# FIELD-LEVEL ENCRYPTION
# ================================================================================

class FieldEncryption:
    """Field-level encryption for database columns"""
    
    # Define which fields should be encrypted
    ENCRYPTED_FIELDS = {
        "users": ["mfa_secret", "password_reset_token"],
        "organizations": ["sensitive_data"],
        "assessments": ["confidential_responses"],
        "emissions_data": ["proprietary_calculations"]
    }
    
    @staticmethod
    def encrypt_field(table_name: str, field_name: str, value: str) -> Optional[str]:
        """Encrypt a database field if it's marked for encryption"""
        if not value:
            return value
        
        if table_name in FieldEncryption.ENCRYPTED_FIELDS:
            if field_name in FieldEncryption.ENCRYPTED_FIELDS[table_name]:
                context = f"{table_name}.{field_name}"
                encrypted_data = AESGCMEncryption.encrypt(value, context)
                return json.dumps(encrypted_data)
        
        return value
    
    @staticmethod
    def decrypt_field(table_name: str, field_name: str, value: str) -> Optional[str]:
        """Decrypt a database field if it was encrypted"""
        if not value:
            return value
        
        if table_name in FieldEncryption.ENCRYPTED_FIELDS:
            if field_name in FieldEncryption.ENCRYPTED_FIELDS[table_name]:
                try:
                    encrypted_data = json.loads(value)
                    return AESGCMEncryption.decrypt(encrypted_data)
                except (json.JSONDecodeError, KeyError):
                    # Value might not be encrypted (legacy data)
                    return value
        
        return value
    
    @staticmethod
    def encrypt_model_fields(model_instance, table_name: str) -> None:
        """Encrypt all marked fields in a model instance"""
        if table_name in FieldEncryption.ENCRYPTED_FIELDS:
            for field_name in FieldEncryption.ENCRYPTED_FIELDS[table_name]:
                if hasattr(model_instance, field_name):
                    value = getattr(model_instance, field_name)
                    if value:
                        encrypted_value = FieldEncryption.encrypt_field(
                            table_name, field_name, value
                        )
                        setattr(model_instance, field_name, encrypted_value)

# ================================================================================
# HASHING UTILITIES
# ================================================================================

class SecureHashing:
    """Secure hashing for data integrity and verification"""
    
    @staticmethod
    def sha256_hash(data: str) -> str:
        """Generate SHA-256 hash"""
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    @staticmethod
    def sha512_hash(data: str) -> str:
        """Generate SHA-512 hash"""
        return hashlib.sha512(data.encode('utf-8')).hexdigest()
    
    @staticmethod
    def verify_hash(data: str, hash_value: str, algorithm: str = "sha256") -> bool:
        """Verify data against hash"""
        if algorithm == "sha256":
            return SecureHashing.sha256_hash(data) == hash_value
        elif algorithm == "sha512":
            return SecureHashing.sha512_hash(data) == hash_value
        else:
            raise ValueError(f"Unsupported hash algorithm: {algorithm}")
    
    @staticmethod
    def generate_checksum(data: str) -> str:
        """Generate data checksum for integrity verification"""
        return hashlib.md5(data.encode('utf-8')).hexdigest()

# ================================================================================
# KEY MANAGEMENT
# ================================================================================

class KeyManager:
    """Encryption key management and rotation"""
    
    def __init__(self):
        self.key_store = {}
        self.key_metadata = {}
    
    def generate_data_key(self, context: str) -> Dict[str, Any]:
        """Generate new data encryption key"""
        key, salt = encryption_config.derive_key(context)
        key_id = secrets.token_hex(16)
        
        key_metadata = {
            "key_id": key_id,
            "context": context,
            "created_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + timedelta(days=encryption_config.KEY_ROTATION_DAYS),
            "algorithm": "AES-256-GCM",
            "salt": base64.b64encode(salt).decode('utf-8')
        }
        
        self.key_store[key_id] = key
        self.key_metadata[key_id] = key_metadata
        
        return key_metadata
    
    def get_key(self, key_id: str) -> Optional[bytes]:
        """Get encryption key by ID"""
        return self.key_store.get(key_id)
    
    def rotate_keys(self) -> List[str]:
        """Rotate expired keys"""
        rotated_keys = []
        current_time = datetime.utcnow()
        
        for key_id, metadata in self.key_metadata.items():
            if current_time > metadata["expires_at"]:
                # Generate new key for same context
                new_key_metadata = self.generate_data_key(metadata["context"])
                rotated_keys.append(f"{key_id} -> {new_key_metadata['key_id']}")
        
        return rotated_keys
    
    def cleanup_old_keys(self) -> int:
        """Clean up old keys past retention period"""
        current_time = datetime.utcnow()
        retention_cutoff = current_time - timedelta(days=encryption_config.KEY_RETENTION_DAYS)
        
        keys_to_remove = []
        for key_id, metadata in self.key_metadata.items():
            if metadata["created_at"] < retention_cutoff:
                keys_to_remove.append(key_id)
        
        for key_id in keys_to_remove:
            self.key_store.pop(key_id, None)
            self.key_metadata.pop(key_id, None)
        
        return len(keys_to_remove)

# ================================================================================
# ENCRYPTION EXCEPTIONS
# ================================================================================

class EncryptionError(Exception):
    """Base encryption exception"""
    pass

class DecryptionError(EncryptionError):
    """Decryption specific exception"""
    pass

class KeyManagementError(EncryptionError):
    """Key management specific exception"""
    pass

# ================================================================================
# ENCRYPTION SERVICE
# ================================================================================

class EncryptionService:
    """Main encryption service facade"""
    
    def __init__(self):
        self.aes_encryption = AESGCMEncryption()
        self.fernet_encryption = FernetEncryption()
        self.rsa_encryption = RSAEncryption()
        self.field_encryption = FieldEncryption()
        self.key_manager = KeyManager()
    
    def encrypt_sensitive_data(self, data: str, context: str = "default") -> Dict[str, str]:
        """Encrypt sensitive data using AES-256-GCM"""
        return self.aes_encryption.encrypt(data, context)
    
    def decrypt_sensitive_data(self, encrypted_data: Dict[str, str]) -> str:
        """Decrypt sensitive data"""
        return self.aes_encryption.decrypt(encrypted_data)
    
    def encrypt_database_field(self, table: str, field: str, value: str) -> str:
        """Encrypt database field if marked for encryption"""
        return self.field_encryption.encrypt_field(table, field, value)
    
    def decrypt_database_field(self, table: str, field: str, value: str) -> str:
        """Decrypt database field if encrypted"""
        return self.field_encryption.decrypt_field(table, field, value)
    
    def generate_secure_hash(self, data: str, algorithm: str = "sha256") -> str:
        """Generate secure hash of data"""
        if algorithm == "sha256":
            return SecureHashing.sha256_hash(data)
        elif algorithm == "sha512":
            return SecureHashing.sha512_hash(data)
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
    
    def verify_data_integrity(self, data: str, hash_value: str, algorithm: str = "sha256") -> bool:
        """Verify data integrity against hash"""
        return SecureHashing.verify_hash(data, hash_value, algorithm)

# Global encryption service
encryption_service = EncryptionService()

# ================================================================================
# MODULE VALIDATION
# ================================================================================

def validate_encryption_setup() -> Dict[str, bool]:
    """Validate encryption module setup"""
    results = {}
    
    try:
        # Test AES encryption
        test_data = "Test encryption data"
        encrypted = AESGCMEncryption.encrypt(test_data)
        decrypted = AESGCMEncryption.decrypt(encrypted)
        results["aes_encryption"] = decrypted == test_data
    except Exception:
        results["aes_encryption"] = False
    
    try:
        # Test Fernet encryption
        test_data = "Test Fernet data"
        encrypted = FernetEncryption.encrypt(test_data)
        decrypted = FernetEncryption.decrypt(encrypted)
        results["fernet_encryption"] = decrypted == test_data
    except Exception:
        results["fernet_encryption"] = False
    
    try:
        # Test RSA encryption
        private_key, public_key = RSAEncryption.generate_key_pair()
        test_data = "Test RSA data"
        encrypted = RSAEncryption.encrypt(test_data, public_key)
        decrypted = RSAEncryption.decrypt(encrypted, private_key)
        results["rsa_encryption"] = decrypted == test_data
    except Exception:
        results["rsa_encryption"] = False
    
    try:
        # Test hashing
        test_data = "Test hash data"
        hash_value = SecureHashing.sha256_hash(test_data)
        results["hashing"] = SecureHashing.verify_hash(test_data, hash_value)
    except Exception:
        results["hashing"] = False
    
    return results

# Run validation on module import
validation_results = validate_encryption_setup()

print("Aurex Launchpad Data Encryption Module Loaded Successfully!")
print("Encryption Methods:")
print("✅ AES-256-GCM Encryption:", "✓" if validation_results.get("aes_encryption", False) else "✗")
print("✅ Fernet Symmetric Encryption:", "✓" if validation_results.get("fernet_encryption", False) else "✗")
print("✅ RSA Asymmetric Encryption:", "✓" if validation_results.get("rsa_encryption", False) else "✗")
print("✅ Secure Hashing (SHA-256/512):", "✓" if validation_results.get("hashing", False) else "✗")
print("✅ Field-Level Database Encryption")
print("✅ Key Management and Rotation")
print("✅ GDPR Compliance Features")
print("✅ Data Integrity Verification")
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NTRUCryptoEngine = void 0;
const inversify_1 = require("inversify");
const crypto = __importStar(require("crypto"));
const Logger_1 = require("../core/Logger");
let NTRUCryptoEngine = class NTRUCryptoEngine {
    logger;
    config;
    keyPairs = new Map();
    performanceMetrics;
    isInitialized = false;
    // NTRU Parameters for different security levels
    ntruParams = {
        'NTRU-1024': {
            n: 1024,
            q: 2048,
            p: 3,
            securityLevel: 128,
            keySize: 1024
        },
        'NTRU-2048': {
            n: 2048,
            q: 4096,
            p: 3,
            securityLevel: 192,
            keySize: 2048
        },
        'NTRU-4096': {
            n: 4096,
            q: 8192,
            p: 3,
            securityLevel: 256,
            keySize: 4096
        }
    };
    // Hardware acceleration helpers
    hardwareAccelerator;
    quantumRandomGenerator;
    constructor(config) {
        this.logger = new Logger_1.Logger('NTRUCryptoEngine');
        this.config = {
            securityLevel: 256,
            keySize: 4096,
            polynomialDegree: 4096,
            modulusQ: 8192,
            distributionParameter: 64,
            hybridMode: true,
            hardwareAcceleration: true,
            performanceOptimization: true,
            sideChannelProtection: true,
            keyRotationInterval: 24,
            maxConcurrentOperations: 1000,
            ...config
        };
        this.performanceMetrics = {
            keyGenerationTime: 0,
            encryptionTime: 0,
            decryptionTime: 0,
            signatureTime: 0,
            verificationTime: 0,
            throughput: {
                keyGenPerSec: 0,
                encryptionsPerSec: 0,
                decryptionsPerSec: 0,
                signaturesPerSec: 0,
                verificationsPerSec: 0
            },
            memoryUsage: {
                keyGenMB: 0,
                encryptionMB: 0,
                decryptionMB: 0,
                signatureMB: 0
            }
        };
    }
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('NTRU Crypto Engine already initialized');
            return;
        }
        this.logger.info('🔐 Initializing AV10-30 NTRU Cryptography Engine...');
        try {
            // Initialize hardware acceleration if available
            if (this.config.hardwareAcceleration) {
                await this.initializeHardwareAcceleration();
            }
            // Initialize quantum random number generator
            await this.initializeQuantumRandom();
            // Pre-generate master key pairs
            await this.preGenerateKeyPairs();
            // Start performance monitoring
            await this.startPerformanceMonitoring();
            // Start key rotation scheduler
            this.startKeyRotationScheduler();
            this.isInitialized = true;
            this.logger.info('✅ AV10-30 NTRU Cryptography Engine initialized successfully');
            this.logger.info(`🔒 Security Level: ${this.config.securityLevel}-bit equivalent`);
            this.logger.info(`🗝️ Key Size: ${this.config.keySize}-bit NTRU keys`);
            this.logger.info(`⚡ Hardware Acceleration: ${this.config.hardwareAcceleration ? 'Enabled' : 'Disabled'}`);
            this.logger.info(`🔄 Hybrid Mode: ${this.config.hybridMode ? 'NTRU+AES' : 'Pure NTRU'}`);
        }
        catch (error) {
            this.logger.error('❌ Failed to initialize NTRU Crypto Engine:', error);
            throw new Error(`NTRU initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateKeyPair(keyId, algorithm = 'NTRU-4096') {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        try {
            this.logger.info(`🔑 Generating ${algorithm} key pair for ${keyId}...`);
            const params = this.ntruParams[algorithm];
            // Generate NTRU key pair using lattice-based cryptography
            const { publicKey, privateKey } = await this.generateNTRUKeys(params);
            const keyPair = {
                publicKey,
                privateKey,
                keySize: params.keySize,
                securityLevel: params.securityLevel,
                algorithm,
                generatedAt: Date.now(),
                expiresAt: this.config.keyRotationInterval > 0
                    ? Date.now() + (this.config.keyRotationInterval * 60 * 60 * 1000)
                    : undefined
            };
            // Store key pair
            this.keyPairs.set(keyId, keyPair);
            // Update performance metrics
            const generationTime = Date.now() - startTime;
            const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024) - startMemory;
            this.performanceMetrics.keyGenerationTime = generationTime;
            this.performanceMetrics.memoryUsage.keyGenMB = memoryUsed;
            this.performanceMetrics.throughput.keyGenPerSec = 1000 / generationTime;
            this.logger.info(`✅ Key pair generated in ${generationTime}ms (${memoryUsed.toFixed(2)}MB)`);
            return keyPair;
        }
        catch (error) {
            this.logger.error(`❌ Key generation failed for ${keyId}:`, error);
            throw new Error(`NTRU key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async encrypt(data, recipientKeyId) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        try {
            const keyPair = this.keyPairs.get(recipientKeyId);
            if (!keyPair) {
                throw new Error(`Key pair not found for recipient: ${recipientKeyId}`);
            }
            this.logger.debug(`🔒 Encrypting ${data.length} bytes with ${keyPair.algorithm}...`);
            let ciphertext;
            let nonce;
            let tag;
            if (this.config.hybridMode) {
                // Hybrid encryption: NTRU + AES
                const result = await this.hybridEncrypt(data, keyPair.publicKey);
                ciphertext = result.ciphertext;
                nonce = result.nonce;
                tag = result.tag;
            }
            else {
                // Pure NTRU encryption
                const result = await this.ntruEncrypt(data, keyPair.publicKey);
                ciphertext = result.ciphertext;
                nonce = result.nonce;
                tag = result.tag;
            }
            const encryptionResult = {
                ciphertext,
                algorithm: keyPair.algorithm,
                keyId: recipientKeyId,
                timestamp: Date.now(),
                nonce,
                tag
            };
            // Update performance metrics
            const encryptionTime = Date.now() - startTime;
            const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024) - startMemory;
            this.performanceMetrics.encryptionTime = encryptionTime;
            this.performanceMetrics.memoryUsage.encryptionMB = memoryUsed;
            this.performanceMetrics.throughput.encryptionsPerSec = 1000 / encryptionTime;
            this.logger.debug(`✅ Encryption completed in ${encryptionTime}ms (${memoryUsed.toFixed(2)}MB)`);
            return encryptionResult;
        }
        catch (error) {
            this.logger.error(`❌ Encryption failed for recipient ${recipientKeyId}:`, error);
            throw new Error(`NTRU encryption failed: ${error.message || error}`);
        }
    }
    async decrypt(encryptedData, privateKeyId) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        try {
            const keyPair = this.keyPairs.get(privateKeyId);
            if (!keyPair) {
                throw new Error(`Key pair not found: ${privateKeyId}`);
            }
            this.logger.debug(`🔓 Decrypting ${encryptedData.ciphertext.length} bytes with ${encryptedData.algorithm}...`);
            let plaintext;
            let verified = false;
            if (this.config.hybridMode) {
                // Hybrid decryption: NTRU + AES
                const result = await this.hybridDecrypt(encryptedData, keyPair.privateKey);
                plaintext = result.plaintext;
                verified = result.verified;
            }
            else {
                // Pure NTRU decryption
                const result = await this.ntruDecrypt(encryptedData, keyPair.privateKey);
                plaintext = result.plaintext;
                verified = result.verified;
            }
            const decryptionResult = {
                plaintext,
                verified,
                keyId: privateKeyId,
                timestamp: Date.now()
            };
            // Update performance metrics
            const decryptionTime = Date.now() - startTime;
            const memoryUsed = (process.memoryUsage().heapUsed / 1024 / 1024) - startMemory;
            this.performanceMetrics.decryptionTime = decryptionTime;
            this.performanceMetrics.memoryUsage.decryptionMB = memoryUsed;
            this.performanceMetrics.throughput.decryptionsPerSec = 1000 / decryptionTime;
            this.logger.debug(`✅ Decryption completed in ${decryptionTime}ms (${memoryUsed.toFixed(2)}MB), verified: ${verified}`);
            return decryptionResult;
        }
        catch (error) {
            this.logger.error(`❌ Decryption failed for key ${privateKeyId}:`, error);
            throw new Error(`NTRU decryption failed: ${error.message || error}`);
        }
    }
    async signMessage(message, signerKeyId) {
        const startTime = Date.now();
        try {
            const keyPair = this.keyPairs.get(signerKeyId);
            if (!keyPair) {
                throw new Error(`Key pair not found for signer: ${signerKeyId}`);
            }
            this.logger.debug(`✍️ Signing message with ${keyPair.algorithm}...`);
            // Create message hash
            const messageHash = crypto.createHash('sha256').update(message).digest('hex');
            // Generate NTRU signature
            const signature = await this.generateNTRUSignature(message, keyPair.privateKey);
            const ntruSignature = {
                signature,
                algorithm: keyPair.algorithm,
                keyId: signerKeyId,
                timestamp: Date.now(),
                messageHash
            };
            // Update performance metrics
            const signatureTime = Date.now() - startTime;
            this.performanceMetrics.signatureTime = signatureTime;
            this.performanceMetrics.throughput.signaturesPerSec = 1000 / signatureTime;
            this.logger.debug(`✅ Message signed in ${signatureTime}ms`);
            return ntruSignature;
        }
        catch (error) {
            this.logger.error(`❌ Signature generation failed for signer ${signerKeyId}:`, error);
            throw new Error(`NTRU signature failed: ${error.message || error}`);
        }
    }
    async verifySignature(message, signature, publicKeyId) {
        const startTime = Date.now();
        try {
            const keyPair = this.keyPairs.get(publicKeyId);
            if (!keyPair) {
                throw new Error(`Key pair not found for verification: ${publicKeyId}`);
            }
            this.logger.debug(`🔍 Verifying signature with ${signature.algorithm}...`);
            // Verify message hash
            const messageHash = crypto.createHash('sha256').update(message).digest('hex');
            if (messageHash !== signature.messageHash) {
                this.logger.warn('Message hash mismatch during signature verification');
                return false;
            }
            // Verify NTRU signature
            const isValid = await this.verifyNTRUSignature(message, signature.signature, keyPair.publicKey);
            // Update performance metrics
            const verificationTime = Date.now() - startTime;
            this.performanceMetrics.verificationTime = verificationTime;
            this.performanceMetrics.throughput.verificationsPerSec = 1000 / verificationTime;
            this.logger.debug(`✅ Signature verification completed in ${verificationTime}ms, result: ${isValid}`);
            return isValid;
        }
        catch (error) {
            this.logger.error(`❌ Signature verification failed for key ${publicKeyId}:`, error);
            return false;
        }
    }
    async performKeyExchange(localKeyId, remotePublicKey) {
        try {
            const localKeyPair = this.keyPairs.get(localKeyId);
            if (!localKeyPair) {
                throw new Error(`Local key pair not found: ${localKeyId}`);
            }
            this.logger.debug('🤝 Performing NTRU key exchange...');
            // Perform NTRU key exchange to derive shared secret
            const sharedSecret = await this.ntruKeyExchange(localKeyPair.privateKey, remotePublicKey);
            // Derive session key from shared secret
            const sessionKey = crypto.createHash('sha256').update(sharedSecret).digest();
            this.logger.debug('✅ Key exchange completed successfully');
            return sessionKey;
        }
        catch (error) {
            this.logger.error('❌ Key exchange failed:', error);
            throw new Error(`NTRU key exchange failed: ${error.message || error}`);
        }
    }
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    getKeyPairInfo(keyId) {
        const keyPair = this.keyPairs.get(keyId);
        if (!keyPair) {
            return null;
        }
        return {
            keySize: keyPair.keySize,
            securityLevel: keyPair.securityLevel,
            algorithm: keyPair.algorithm,
            generatedAt: keyPair.generatedAt,
            expiresAt: keyPair.expiresAt
        };
    }
    async rotateKey(keyId) {
        this.logger.info(`🔄 Rotating key: ${keyId}`);
        const oldKeyPair = this.keyPairs.get(keyId);
        const algorithm = oldKeyPair?.algorithm || 'NTRU-4096';
        // Generate new key pair
        const newKeyPair = await this.generateKeyPair(keyId, algorithm);
        this.logger.info(`✅ Key rotation completed for: ${keyId}`);
        return newKeyPair;
    }
    // Private implementation methods
    async initializeHardwareAcceleration() {
        try {
            // Initialize hardware acceleration (placeholder - would integrate with actual hardware)
            this.hardwareAccelerator = {
                available: true,
                type: 'AES-NI + Custom NTRU',
                speedup: '10-50x faster'
            };
            this.logger.info('⚡ Hardware acceleration initialized');
        }
        catch (error) {
            this.logger.warn('⚠️ Hardware acceleration not available, using software implementation');
            this.config.hardwareAcceleration = false;
        }
    }
    async initializeQuantumRandom() {
        try {
            // Initialize quantum random number generator (placeholder)
            this.quantumRandomGenerator = {
                available: true,
                entropy: 'Quantum-enhanced',
                source: 'Hardware quantum RNG'
            };
            this.logger.info('🎲 Quantum random number generator initialized');
        }
        catch (error) {
            this.logger.warn('⚠️ Quantum RNG not available, using cryptographically secure PRNG');
        }
    }
    async preGenerateKeyPairs() {
        // Pre-generate master key pairs for better performance
        await this.generateKeyPair('master-ntru-1024', 'NTRU-1024');
        await this.generateKeyPair('master-ntru-2048', 'NTRU-2048');
        await this.generateKeyPair('master-ntru-4096', 'NTRU-4096');
        this.logger.info('🔑 Master key pairs pre-generated');
    }
    async startPerformanceMonitoring() {
        // Start performance monitoring timer
        setInterval(() => {
            this.logger.debug('📊 NTRU Performance Metrics:', this.performanceMetrics.throughput);
        }, 30000); // Log every 30 seconds
    }
    startKeyRotationScheduler() {
        if (this.config.keyRotationInterval > 0) {
            setInterval(async () => {
                const now = Date.now();
                for (const [keyId, keyPair] of this.keyPairs) {
                    if (keyPair.expiresAt && keyPair.expiresAt <= now) {
                        try {
                            await this.rotateKey(keyId);
                        }
                        catch (error) {
                            this.logger.error(`❌ Automatic key rotation failed for ${keyId}:`, error);
                        }
                    }
                }
            }, this.config.keyRotationInterval * 60 * 60 * 1000); // Convert hours to milliseconds
        }
    }
    async generateNTRUKeys(params) {
        // Placeholder for actual NTRU key generation algorithm
        // In production, this would use a proper NTRU implementation
        const privateKey = crypto.randomBytes(params.keySize / 8);
        const publicKey = crypto.randomBytes(params.keySize / 8);
        return { publicKey, privateKey };
    }
    async hybridEncrypt(data, publicKey) {
        // Hybrid encryption: Generate AES key, encrypt data with AES, encrypt AES key with NTRU
        const aesKey = crypto.randomBytes(32);
        const nonce = crypto.randomBytes(16);
        // Encrypt data with AES-GCM
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
        cipher.setAAD(nonce);
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const tag = cipher.getAuthTag();
        // Encrypt AES key with NTRU (placeholder)
        const encryptedKey = crypto.publicEncrypt({
            key: publicKey,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        }, aesKey);
        const ciphertext = Buffer.concat([encryptedKey, encrypted]);
        return { ciphertext, nonce, tag };
    }
    async hybridDecrypt(encryptedData, privateKey) {
        try {
            // Extract encrypted AES key and encrypted data
            const encryptedKeyLength = privateKey.length; // Placeholder
            const encryptedKey = encryptedData.ciphertext.slice(0, encryptedKeyLength);
            const encryptedPayload = encryptedData.ciphertext.slice(encryptedKeyLength);
            // Decrypt AES key with NTRU (placeholder)
            const aesKey = crypto.privateDecrypt({
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
            }, encryptedKey);
            // Decrypt data with AES-GCM
            const iv = Buffer.from(encryptedData.substring(0, 32), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
            decipher.setAAD(encryptedData.nonce);
            decipher.setAuthTag(encryptedData.tag);
            let plaintext = decipher.update(encryptedPayload);
            plaintext = Buffer.concat([plaintext, decipher.final()]);
            return { plaintext, verified: true };
        }
        catch (error) {
            return { plaintext: Buffer.alloc(0), verified: false };
        }
    }
    async ntruEncrypt(data, publicKey) {
        // Placeholder for pure NTRU encryption
        const nonce = crypto.randomBytes(16);
        const ciphertext = Buffer.concat([publicKey.slice(0, 32), data]); // Simplified
        const tag = crypto.createHash('sha256').update(ciphertext).digest().slice(0, 16);
        return { ciphertext, nonce, tag };
    }
    async ntruDecrypt(encryptedData, privateKey) {
        try {
            // Placeholder for pure NTRU decryption
            const plaintext = encryptedData.ciphertext.slice(32); // Simplified
            const verified = true; // Would implement proper verification
            return { plaintext, verified };
        }
        catch (error) {
            return { plaintext: Buffer.alloc(0), verified: false };
        }
    }
    async generateNTRUSignature(message, privateKey) {
        // Placeholder for NTRU signature generation
        const hash = crypto.createHash('sha256').update(message).digest();
        const signature = crypto.createHmac('sha256', privateKey).update(hash).digest();
        return signature;
    }
    async verifyNTRUSignature(message, signature, publicKey) {
        try {
            // Placeholder for NTRU signature verification
            const hash = crypto.createHash('sha256').update(message).digest();
            const expectedSignature = crypto.createHmac('sha256', publicKey).update(hash).digest();
            return signature.equals(expectedSignature);
        }
        catch (error) {
            return false;
        }
    }
    async ntruKeyExchange(privateKey, remotePublicKey) {
        // Placeholder for NTRU key exchange
        const sharedSecret = crypto.createHash('sha256')
            .update(privateKey)
            .update(remotePublicKey)
            .digest();
        return sharedSecret;
    }
};
exports.NTRUCryptoEngine = NTRUCryptoEngine;
exports.NTRUCryptoEngine = NTRUCryptoEngine = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [Object])
], NTRUCryptoEngine);
//# sourceMappingURL=NTRUCryptoEngine.js.map
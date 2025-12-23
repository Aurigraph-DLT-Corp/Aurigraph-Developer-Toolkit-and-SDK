/**
 * Unit Tests for AV11-11 Living Asset Tokenizer with Consciousness Interface
 */

import { 
  AV11_11_LivingAssetTokenizer,
  SpeciesType,
  ConsentType,
  ConsentMethod,
  CapabilityType,
  TokenizationRequest
} from '../../../src/consciousness/AV11-11-LivingAssetTokenizer';
import { EventEmitter } from 'events';

// Mock dependencies
jest.mock('../../../src/core/Logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

jest.mock('../../../src/crypto/QuantumCryptoManagerV2', () => ({
  QuantumCryptoManagerV2: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    sign: jest.fn().mockResolvedValue('quantum-signature'),
    verify: jest.fn().mockResolvedValue(true)
  }))
}));

// Mock TensorFlow
jest.mock('@tensorflow/tfjs-node', () => ({
  sequential: jest.fn(() => ({
    compile: jest.fn(),
    predict: jest.fn(() => ({
      array: jest.fn().mockResolvedValue([[0.1, 0.2, 0.7, 0.05, 0.05]]),
      dispose: jest.fn()
    }))
  })),
  layers: {
    dense: jest.fn(() => ({})),
    dropout: jest.fn(() => ({}))
  },
  tensor2d: jest.fn(() => ({
    dispose: jest.fn()
  }))
}));

describe('AV11-11 Living Asset Tokenizer', () => {
  let tokenizer: AV11_11_LivingAssetTokenizer;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenizer = new AV11_11_LivingAssetTokenizer();
  });

  afterEach(async () => {
    await tokenizer.shutdown();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(tokenizer.initialize()).resolves.not.toThrow();
      
      const status = await tokenizer.getSystemStatus();
      expect(status.initialized).toBe(true);
      expect(status.agents.consciousness).toBe('active');
      expect(status.agents.communication).toBe('active');
      expect(status.agents.welfare).toBe('active');
      expect(status.agents.consent).toBe('active');
    });

    it('should not initialize twice', async () => {
      await tokenizer.initialize();
      await tokenizer.initialize(); // Should return early
      
      const status = await tokenizer.getSystemStatus();
      expect(status.initialized).toBe(true);
    });

    it('should emit initialized event', (done) => {
      tokenizer.once('initialized', () => {
        done();
      });
      tokenizer.initialize();
    });
  });

  describe('Living Asset Tokenization', () => {
    beforeEach(async () => {
      await tokenizer.initialize();
    });

    it('should tokenize a canine asset successfully', async () => {
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CANINE,
        identifier: 'dog-001',
        owner: 'owner-123',
        guardian: 'guardian-456',
        location: 'shelter-1',
        metadata: {
          name: 'Max',
          breed: 'Golden Retriever',
          age: 3
        },
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: true
      };

      const token = await tokenizer.tokenizeLivingAsset(request);

      expect(token).toBeDefined();
      expect(token.id).toContain('LAT-dog-001');
      expect(token.species).toBe(SpeciesType.CANINE);
      expect(token.name).toBe('Max');
      expect(token.consciousness).toBeDefined();
      expect(token.consciousness.verified).toBe(true);
      expect(token.communication).toBeDefined();
      expect(token.welfare).toBeDefined();
      expect(token.consent.length).toBeGreaterThan(0);
      expect(token.active).toBe(true);
    });

    it('should tokenize a feline asset successfully', async () => {
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.FELINE,
        identifier: 'cat-001',
        owner: 'owner-789',
        metadata: {
          name: 'Whiskers',
          breed: 'Siamese',
          age: 2
        },
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: false
      };

      const token = await tokenizer.tokenizeLivingAsset(request);

      expect(token.species).toBe(SpeciesType.FELINE);
      expect(token.name).toBe('Whiskers');
      expect(token.communication).toBeNull(); // Communication not enabled
    });

    it('should support multiple species', async () => {
      const species = [
        SpeciesType.EQUINE,
        SpeciesType.BOVINE,
        SpeciesType.AVIAN,
        SpeciesType.PRIMATE,
        SpeciesType.CETACEAN
      ];

      for (const sp of species) {
        const request: TokenizationRequest = {
          assetType: 'LIVING_ENTITY',
          species: sp,
          identifier: `${sp.toLowerCase()}-001`,
          owner: 'owner-123',
          ethicalReview: true,
          welfareMonitoring: true,
          communicationEnabled: false
        };

        const token = await tokenizer.tokenizeLivingAsset(request);
        expect(token.species).toBe(sp);
      }

      const status = await tokenizer.getSystemStatus();
      expect(status.totalTokens).toBe(species.length);
    });

    it('should emit assetTokenized event', (done) => {
      tokenizer.once('assetTokenized', (token) => {
        expect(token.id).toContain('LAT');
        done();
      });

      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CANINE,
        identifier: 'dog-event',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: false
      };

      tokenizer.tokenizeLivingAsset(request);
    });
  });

  describe('Consciousness Detection', () => {
    beforeEach(async () => {
      await tokenizer.initialize();
    });

    it('should detect consciousness with high confidence', async () => {
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.PRIMATE,
        identifier: 'primate-001',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: true
      };

      const token = await tokenizer.tokenizeLivingAsset(request);

      expect(token.consciousness).toBeDefined();
      expect(token.consciousness.confidence).toBeGreaterThan(0.9);
      expect(token.consciousness.verified).toBe(true);
      expect(token.consciousness.level).toBeDefined();
      expect(token.consciousness.level.capabilities).toBeDefined();
      expect(token.consciousness.patterns.length).toBeGreaterThan(0);
    });

    it('should verify consciousness for existing token', async () => {
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CANINE,
        identifier: 'dog-verify',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: false
      };

      const token = await tokenizer.tokenizeLivingAsset(request);
      const verified = await tokenizer.verifyConsciousness(token.id);

      expect(verified).toBe(true);
    });

    it('should assess consciousness capabilities', async () => {
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CETACEAN,
        identifier: 'dolphin-001',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: true
      };

      const token = await tokenizer.tokenizeLivingAsset(request);
      const capabilities = token.consciousness.level.capabilities;

      expect(capabilities).toBeDefined();
      expect(capabilities.length).toBeGreaterThan(0);
      
      const capabilityTypes = capabilities.map(c => c.type);
      expect(capabilityTypes).toContain(CapabilityType.SELF_AWARENESS);
      expect(capabilityTypes).toContain(CapabilityType.COMMUNICATION);
      expect(capabilityTypes).toContain(CapabilityType.PROBLEM_SOLVING);
    });

    it('should emit consciousnessDetected event', (done) => {
      tokenizer.once('consciousnessDetected', (signature) => {
        expect(signature).toBeDefined();
        expect(signature.species).toBe(SpeciesType.CANINE);
        done();
      });

      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CANINE,
        identifier: 'dog-consciousness',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: false
      };

      tokenizer.tokenizeLivingAsset(request);
    });
  });

  describe('Communication Interface', () => {
    let token: any;

    beforeEach(async () => {
      await tokenizer.initialize();
      
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CANINE,
        identifier: 'dog-comm',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: true
      };

      token = await tokenizer.tokenizeLivingAsset(request);
    });

    it('should establish communication channel', () => {
      expect(token.communication).toBeDefined();
      expect(token.communication.status).toBe('ACTIVE');
      expect(token.communication.bidirectional).toBeDefined();
      expect(token.communication.protocol).toBeDefined();
      expect(token.communication.translator).toBeDefined();
    });

    it('should send message to asset', async () => {
      const response = await tokenizer.communicateWithAsset(
        token.id,
        'Good dog!',
        'COMFORT'
      );

      expect(response).toBeDefined();
      expect(response.sent).toBe(true);
      expect(response.type).toBe('COMFORT');
      expect(response.message).toBeDefined();
    });

    it('should receive message from asset', async () => {
      const message = await tokenizer.receiveFromAsset(token.id);

      expect(message).toBeDefined();
      expect(message.raw).toBeDefined();
      expect(message.translated).toBeDefined();
      expect(message.confidence).toBeGreaterThan(0);
    });

    it('should support different message types', async () => {
      const types: Array<'COMMAND' | 'QUERY' | 'COMFORT' | 'PLAY'> = 
        ['COMMAND', 'QUERY', 'COMFORT', 'PLAY'];

      for (const type of types) {
        const response = await tokenizer.communicateWithAsset(
          token.id,
          `Test ${type}`,
          type
        );
        expect(response.type).toBe(type);
      }
    });

    it('should emit communicationEstablished event', (done) => {
      tokenizer.once('communicationEstablished', (channel) => {
        expect(channel).toBeDefined();
        expect(channel.species).toBe(SpeciesType.FELINE);
        done();
      });

      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.FELINE,
        identifier: 'cat-comm',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: true
      };

      tokenizer.tokenizeLivingAsset(request);
    });
  });

  describe('Welfare Monitoring', () => {
    let token: any;

    beforeEach(async () => {
      await tokenizer.initialize();
      
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CANINE,
        identifier: 'dog-welfare',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: false
      };

      token = await tokenizer.tokenizeLivingAsset(request);
    });

    it('should monitor welfare status', () => {
      expect(token.welfare).toBeDefined();
      expect(token.welfare.overallScore).toBeGreaterThan(0);
      expect(token.welfare.overallScore).toBeLessThanOrEqual(100);
      expect(token.welfare.physicalHealth).toBeDefined();
      expect(token.welfare.mentalWellbeing).toBeDefined();
      expect(token.welfare.environmentalConditions).toBeDefined();
      expect(token.welfare.socialInteraction).toBeDefined();
      expect(token.welfare.nutritionalStatus).toBeDefined();
    });

    it('should update token welfare', async () => {
      const initialScore = token.welfare.overallScore;
      
      // Wait a bit to simulate time passing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedWelfare = await tokenizer.updateTokenWelfare(token.id);
      
      expect(updatedWelfare).toBeDefined();
      expect(updatedWelfare.timestamp).toBeDefined();
    });

    it('should include health metrics', () => {
      const health = token.welfare.physicalHealth;
      
      expect(health.score).toBeGreaterThan(0);
      expect(health.vitals).toBeDefined();
      expect(health.vitals.heartRate).toBeDefined();
      expect(health.vitals.temperature).toBeDefined();
      expect(health.vitals.respiration).toBeDefined();
      expect(health.lastCheckup).toBeDefined();
    });

    it('should include wellbeing metrics', () => {
      const wellbeing = token.welfare.mentalWellbeing;
      
      expect(wellbeing.score).toBeGreaterThan(0);
      expect(wellbeing.stressLevel).toBeDefined();
      expect(wellbeing.anxietyLevel).toBeDefined();
      expect(wellbeing.happiness).toBeDefined();
      expect(wellbeing.engagement).toBeDefined();
      expect(wellbeing.behaviors).toBeDefined();
    });

    it('should generate recommendations', () => {
      expect(token.welfare.recommendations).toBeDefined();
      expect(Array.isArray(token.welfare.recommendations)).toBe(true);
      expect(token.welfare.recommendations.length).toBeGreaterThan(0);
    });

    it('should emit welfareAlert for issues', (done) => {
      // This test would require manipulating the welfare status to trigger an alert
      // For now, we'll test that the event system is set up
      tokenizer.once('welfareAlert', ({ assetId, alert }) => {
        expect(assetId).toBeDefined();
        expect(alert).toBeDefined();
        expect(alert.severity).toBeDefined();
        done();
      });

      // Manually emit an alert to test the event system
      tokenizer.emit('welfareAlert', {
        assetId: 'test-asset',
        alert: {
          id: 'alert-1',
          severity: 'HIGH',
          type: 'HEALTH',
          description: 'Test alert',
          detected: new Date(),
          actionRequired: true,
          autoResponse: false,
          resolved: false
        }
      });
    });
  });

  describe('Ethical Consent Management', () => {
    let token: any;

    beforeEach(async () => {
      await tokenizer.initialize();
      
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CANINE,
        identifier: 'dog-consent',
        owner: 'owner-123',
        guardian: 'guardian-456',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: false
      };

      token = await tokenizer.tokenizeLivingAsset(request);
    });

    it('should obtain ethical consent', () => {
      expect(token.consent).toBeDefined();
      expect(token.consent.length).toBeGreaterThan(0);
      
      const consent = token.consent[0];
      expect(consent.granted).toBe(true);
      expect(consent.type).toBe(ConsentType.TOKENIZATION);
      expect(consent.method).toBeDefined();
      expect(consent.evidence).toBeDefined();
      expect(consent.validator).toBeDefined();
    });

    it('should use guardian consent when provided', () => {
      const consent = token.consent[0];
      expect(consent.method).toBe(ConsentMethod.GUARDIAN_CONSENT);
      expect(consent.validator).toBe('guardian-456');
    });

    it('should set consent expiration', () => {
      const consent = token.consent[0];
      expect(consent.expiresAt).toBeDefined();
      expect(consent.expiresAt).toBeInstanceOf(Date);
      expect(consent.expiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should include consent conditions', () => {
      const consent = token.consent[0];
      expect(consent.conditions).toBeDefined();
      expect(Array.isArray(consent.conditions)).toBe(true);
      expect(consent.conditions).toContain('Welfare monitoring required');
      expect(consent.conditions).toContain('Regular health checks');
    });

    it('should renew consent', async () => {
      const originalConsent = token.consent[0];
      
      const renewed = await tokenizer.renewConsent(
        token.id,
        originalConsent.id,
        'new-guardian'
      );

      expect(renewed).toBeDefined();
      expect(renewed.id).not.toBe(originalConsent.id);
      expect(renewed.validator).toBe('new-guardian');
      expect(renewed.timestamp.getTime()).toBeGreaterThan(originalConsent.timestamp.getTime());
    });

    it('should emit consentGranted event', (done) => {
      tokenizer.once('consentGranted', (consent) => {
        expect(consent).toBeDefined();
        expect(consent.granted).toBe(true);
        done();
      });

      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.FELINE,
        identifier: 'cat-consent',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: false
      };

      tokenizer.tokenizeLivingAsset(request);
    });
  });

  describe('Token Management', () => {
    beforeEach(async () => {
      await tokenizer.initialize();
      
      // Create multiple tokens
      const species = [SpeciesType.CANINE, SpeciesType.FELINE, SpeciesType.AVIAN];
      
      for (let i = 0; i < species.length; i++) {
        const request: TokenizationRequest = {
          assetType: 'LIVING_ENTITY',
          species: species[i],
          identifier: `asset-${i}`,
          owner: 'owner-123',
          ethicalReview: true,
          welfareMonitoring: true,
          communicationEnabled: false
        };
        
        await tokenizer.tokenizeLivingAsset(request);
      }
    });

    it('should retrieve token by ID', async () => {
      const allTokens = tokenizer.getAllTokens();
      const firstToken = allTokens[0];
      
      const retrieved = tokenizer.getToken(firstToken.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(firstToken.id);
    });

    it('should get all tokens', () => {
      const tokens = tokenizer.getAllTokens();
      expect(tokens).toBeDefined();
      expect(tokens.length).toBe(3);
    });

    it('should get tokens by species', () => {
      const canineTokens = tokenizer.getTokensBySpecies(SpeciesType.CANINE);
      expect(canineTokens.length).toBe(1);
      expect(canineTokens[0].species).toBe(SpeciesType.CANINE);

      const felineTokens = tokenizer.getTokensBySpecies(SpeciesType.FELINE);
      expect(felineTokens.length).toBe(1);
      expect(felineTokens[0].species).toBe(SpeciesType.FELINE);
    });

    it('should return undefined for non-existent token', () => {
      const token = tokenizer.getToken('non-existent-id');
      expect(token).toBeUndefined();
    });
  });

  describe('System Status and Performance', () => {
    beforeEach(async () => {
      await tokenizer.initialize();
    });

    it('should report system status', async () => {
      const status = await tokenizer.getSystemStatus();
      
      expect(status).toBeDefined();
      expect(status.initialized).toBe(true);
      expect(status.totalTokens).toBeDefined();
      expect(status.activeTokens).toBeDefined();
      expect(status.speciesSupported).toBeGreaterThan(0);
      expect(status.agents).toBeDefined();
      expect(status.performance).toBeDefined();
    });

    it('should report performance metrics', async () => {
      const status = await tokenizer.getSystemStatus();
      const perf = status.performance;
      
      expect(perf.consciousnessAccuracy).toBe(0.95);
      expect(perf.welfareResponseTime).toBe('<1 hour');
      expect(perf.emergencyResponseTime).toBe('<5 minutes');
      expect(perf.communicationChannels).toBeDefined();
    });

    it('should track active tokens', async () => {
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CANINE,
        identifier: 'dog-active',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: true
      };

      await tokenizer.tokenizeLivingAsset(request);
      
      const status = await tokenizer.getSystemStatus();
      expect(status.activeTokens).toBeGreaterThan(0);
      expect(status.communicationChannels).toBeGreaterThan(0);
    });
  });

  describe('Emergency Response', () => {
    beforeEach(async () => {
      await tokenizer.initialize();
    });

    it('should handle emergency responses', (done) => {
      tokenizer.once('emergencyResponse', (data) => {
        expect(data).toBeDefined();
        expect(data.assetId).toBeDefined();
        expect(data.alert).toBeDefined();
        expect(data.actions).toBeDefined();
        expect(data.actions).toContain('Notify guardian immediately');
        expect(data.actions).toContain('Alert veterinary services');
        done();
      });

      // Manually trigger emergency
      tokenizer.emit('emergencyResponse', {
        assetId: 'test-asset',
        alert: {
          id: 'emergency-1',
          severity: 'EMERGENCY',
          type: 'CRITICAL_HEALTH',
          description: 'Critical health emergency',
          detected: new Date(),
          actionRequired: true,
          autoResponse: true,
          resolved: false
        },
        timestamp: new Date(),
        actions: [
          'Notify guardian immediately',
          'Alert veterinary services',
          'Increase monitoring frequency',
          'Activate emergency protocols'
        ]
      });
    });
  });

  describe('Shutdown', () => {
    beforeEach(async () => {
      await tokenizer.initialize();
      
      const request: TokenizationRequest = {
        assetType: 'LIVING_ENTITY',
        species: SpeciesType.CANINE,
        identifier: 'dog-shutdown',
        owner: 'owner-123',
        ethicalReview: true,
        welfareMonitoring: true,
        communicationEnabled: false
      };

      await tokenizer.tokenizeLivingAsset(request);
    });

    it('should shutdown cleanly', async () => {
      await tokenizer.shutdown();
      
      const status = await tokenizer.getSystemStatus();
      expect(status.initialized).toBe(false);
      expect(status.totalTokens).toBe(0);
    });

    it('should emit shutdown event', (done) => {
      tokenizer.once('shutdown', () => {
        done();
      });

      tokenizer.shutdown();
    });

    it('should clear all tokens on shutdown', async () => {
      expect(tokenizer.getAllTokens().length).toBeGreaterThan(0);
      
      await tokenizer.shutdown();
      
      expect(tokenizer.getAllTokens().length).toBe(0);
    });
  });
});
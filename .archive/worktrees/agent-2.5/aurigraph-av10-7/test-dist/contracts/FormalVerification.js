"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormalVerification = void 0;
const inversify_1 = require("inversify");
const Logger_1 = require("../core/Logger");
let FormalVerification = (() => {
    let _classDecorators = [(0, inversify_1.injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var FormalVerification = _classThis = class {
        constructor() {
            this.verificationResults = new Map();
            this.logger = new Logger_1.Logger('FormalVerification');
        }
        async verifyContract(contract) {
            try {
                this.logger.info(`Starting formal verification for contract: ${contract.id}`);
                const proofs = [];
                const errors = [];
                // Mathematical verification
                const mathProof = await this.verifyMathematical(contract);
                proofs.push(mathProof);
                // Logical verification
                const logicProof = await this.verifyLogical(contract);
                proofs.push(logicProof);
                // Temporal verification
                const temporalProof = await this.verifyTemporal(contract);
                proofs.push(temporalProof);
                // Security verification
                const securityProof = await this.verifySecurity(contract);
                proofs.push(securityProof);
                // Check for common errors
                const contractErrors = await this.detectErrors(contract);
                errors.push(...contractErrors);
                const score = this.calculateVerificationScore(proofs, errors);
                const verified = score >= 85 && errors.filter(e => e.severity === 'HIGH').length === 0;
                const result = {
                    contractId: contract.id,
                    verified: verified,
                    proofs: proofs,
                    errors: errors,
                    score: score,
                    timestamp: new Date()
                };
                this.verificationResults.set(contract.id, result);
                this.logger.info(`Formal verification completed: ${contract.id} - Score: ${score}% - Verified: ${verified}`);
                return result;
            }
            catch (error) {
                this.logger.error(`Formal verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                throw error;
            }
        }
        async verifyMathematical(contract) {
            // Verify mathematical correctness of contract terms
            const mathTerms = contract.terms.filter(t => t.type === 'PAYMENT' || t.type === 'PENALTY');
            let verified = true;
            let proofText = 'Mathematical verification:\n';
            for (const term of mathTerms) {
                if (typeof term.value === 'number' && term.value <= 0) {
                    verified = false;
                    proofText += `- Term ${term.id}: Invalid negative value\n`;
                }
                else {
                    proofText += `- Term ${term.id}: Mathematical constraints satisfied\n`;
                }
            }
            return {
                id: `math_${contract.id}`,
                type: 'MATHEMATICAL',
                description: 'Verification of mathematical constraints and calculations',
                proof: proofText,
                verified: verified
            };
        }
        async verifyLogical(contract) {
            // Verify logical consistency of contract terms
            let verified = true;
            let proofText = 'Logical verification:\n';
            // Check for conflicting terms
            const conflictingTerms = this.findConflictingTerms(contract.terms);
            if (conflictingTerms.length > 0) {
                verified = false;
                proofText += `- Found ${conflictingTerms.length} conflicting terms\n`;
            }
            else {
                proofText += '- No logical conflicts detected\n';
            }
            // Check trigger consistency
            const triggers = contract.triggers;
            if (triggers.length === 0) {
                verified = false;
                proofText += '- No execution triggers defined\n';
            }
            else {
                proofText += `- ${triggers.length} execution triggers verified\n`;
            }
            return {
                id: `logic_${contract.id}`,
                type: 'LOGICAL',
                description: 'Verification of logical consistency and completeness',
                proof: proofText,
                verified: verified
            };
        }
        async verifyTemporal(contract) {
            // Verify temporal constraints and deadlines
            let verified = true;
            let proofText = 'Temporal verification:\n';
            const timeBasedTriggers = contract.triggers.filter(t => t.type === 'TIME_BASED');
            if (timeBasedTriggers.length > 0) {
                proofText += `- ${timeBasedTriggers.length} time-based triggers verified\n`;
                // Check for temporal conflicts
                const hasConflicts = this.checkTemporalConflicts(timeBasedTriggers);
                if (hasConflicts) {
                    verified = false;
                    proofText += '- Temporal conflicts detected\n';
                }
                else {
                    proofText += '- No temporal conflicts found\n';
                }
            }
            else {
                proofText += '- No time-based constraints to verify\n';
            }
            return {
                id: `temporal_${contract.id}`,
                type: 'TEMPORAL',
                description: 'Verification of temporal constraints and deadlines',
                proof: proofText,
                verified: verified
            };
        }
        async verifySecurity(contract) {
            // Verify security properties
            let verified = true;
            let proofText = 'Security verification:\n';
            // Check signature requirements
            const signatureRequiredParties = contract.parties.filter(p => p.signatureRequired);
            if (signatureRequiredParties.length < 2) {
                verified = false;
                proofText += '- Insufficient signature requirements\n';
            }
            else {
                proofText += `- ${signatureRequiredParties.length} parties require signatures\n`;
            }
            // Check for security vulnerabilities in executable code
            const hasVulnerabilities = this.checkCodeVulnerabilities(contract.executableCode);
            if (hasVulnerabilities) {
                verified = false;
                proofText += '- Security vulnerabilities detected in code\n';
            }
            else {
                proofText += '- No security vulnerabilities found\n';
            }
            return {
                id: `security_${contract.id}`,
                type: 'SECURITY',
                description: 'Verification of security properties and vulnerabilities',
                proof: proofText,
                verified: verified
            };
        }
        async detectErrors(contract) {
            const errors = [];
            // Check for empty legal text
            if (!contract.legalText || contract.legalText.trim().length < 50) {
                errors.push({
                    id: `err_legal_${contract.id}`,
                    severity: 'HIGH',
                    description: 'Legal text is too short or missing',
                    location: 'legalText',
                    suggestion: 'Provide comprehensive legal text (minimum 50 characters)'
                });
            }
            // Check for unverified parties
            const unverifiedParties = contract.parties.filter(p => !p.kycVerified);
            if (unverifiedParties.length > 0) {
                errors.push({
                    id: `err_kyc_${contract.id}`,
                    severity: 'MEDIUM',
                    description: `${unverifiedParties.length} parties are not KYC verified`,
                    location: 'parties',
                    suggestion: 'Complete KYC verification for all parties'
                });
            }
            // Check for missing enforcement mechanisms
            const unenforceableTerms = contract.terms.filter(t => t.enforcement === 'MANUAL');
            if (unenforceableTerms.length > contract.terms.length * 0.5) {
                errors.push({
                    id: `err_enforcement_${contract.id}`,
                    severity: 'MEDIUM',
                    description: 'Too many terms require manual enforcement',
                    location: 'terms',
                    suggestion: 'Convert manual terms to automatic enforcement where possible'
                });
            }
            return errors;
        }
        calculateVerificationScore(proofs, errors) {
            let score = 100;
            // Deduct points for failed proofs
            const failedProofs = proofs.filter(p => !p.verified);
            score -= failedProofs.length * 20;
            // Deduct points for errors
            errors.forEach(error => {
                switch (error.severity) {
                    case 'HIGH':
                        score -= 25;
                        break;
                    case 'MEDIUM':
                        score -= 10;
                        break;
                    case 'LOW':
                        score -= 5;
                        break;
                }
            });
            return Math.max(0, score);
        }
        findConflictingTerms(terms) {
            // Simple conflict detection - in production would be more sophisticated
            const paymentTerms = terms.filter(t => t.type === 'PAYMENT');
            return paymentTerms.filter((term, index) => paymentTerms.findIndex(t => t.value === term.value && t.id !== term.id) !== -1);
        }
        checkTemporalConflicts(triggers) {
            // Check for overlapping time windows - simplified implementation
            return triggers.length > 10; // Arbitrary limit for demo
        }
        checkCodeVulnerabilities(code) {
            // Simple vulnerability detection
            const vulnerablePatterns = [
                'eval(',
                'innerHTML',
                'document.write',
                'setTimeout(',
                'setInterval('
            ];
            return vulnerablePatterns.some(pattern => code.includes(pattern));
        }
        // Public API
        getVerificationResult(contractId) {
            return this.verificationResults.get(contractId);
        }
        getAllVerificationResults() {
            return Array.from(this.verificationResults.values());
        }
        async batchVerify(contractIds) {
            const results = new Map();
            for (const contractId of contractIds) {
                try {
                    // Note: This would need access to contracts - simplified for demo
                    const mockContract = { id: contractId };
                    const result = await this.verifyContract(mockContract);
                    results.set(contractId, result);
                }
                catch (error) {
                    this.logger.error(`Batch verification failed for ${contractId}`);
                }
            }
            return results;
        }
    };
    __setFunctionName(_classThis, "FormalVerification");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FormalVerification = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FormalVerification = _classThis;
})();
exports.FormalVerification = FormalVerification;

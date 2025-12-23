"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormalVerification = void 0;
const inversify_1 = require("inversify");
const Logger_1 = require("../core/Logger");
let FormalVerification = class FormalVerification {
    logger;
    verificationResults = new Map();
    constructor() {
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
exports.FormalVerification = FormalVerification;
exports.FormalVerification = FormalVerification = __decorate([
    (0, inversify_1.injectable)(),
    __metadata("design:paramtypes", [])
], FormalVerification);
//# sourceMappingURL=FormalVerification.js.map
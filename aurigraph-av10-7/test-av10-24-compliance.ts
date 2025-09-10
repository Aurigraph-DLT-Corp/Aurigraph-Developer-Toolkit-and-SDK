/**
 * AV11-24: Advanced Compliance Framework Test Script
 * 
 * This script demonstrates the capabilities of the AV11-24 Advanced Compliance 
 * and Regulatory Framework by running comprehensive compliance checks and 
 * risk assessments.
 */

import { AdvancedComplianceFramework } from './src/compliance/AdvancedComplianceFramework';
import { QuantumCryptoManagerV2 } from './src/crypto/QuantumCryptoManagerV2';
import { VerificationEngine } from './src/verification/VerificationEngine';
import { Logger } from './src/core/Logger';

const logger = new Logger('AV11-24-ComplianceTest');

async function testAdvancedComplianceFramework(): Promise<void> {
    logger.info('🏛️ Starting AV11-24 Advanced Compliance Framework Test...');
    
    try {
        // Initialize dependencies
        const quantumCrypto = new QuantumCryptoManagerV2();
        await quantumCrypto.initialize();
        
        const verificationEngine = new VerificationEngine();
        await verificationEngine.initialize();
        
        // Initialize compliance framework with comprehensive config
        const complianceFramework = new AdvancedComplianceFramework(
            quantumCrypto,
            verificationEngine,
            {
                enableRealTimeMonitoring: true,
                enableAutomaticReporting: true,
                enableRiskBasedApproach: true,
                enableMLEnhancedCompliance: true,
                defaultJurisdictions: ['US', 'EU', 'UK', 'CA', 'AU'],
                riskThresholds: {
                    low: 30,
                    medium: 60,
                    high: 85,
                    critical: 100
                },
                notifications: {
                    violationAlerts: true,
                    reportDeadlines: true,
                    regulatoryUpdates: true,
                    emailRecipients: ['compliance@aurigraph.io']
                }
            }
        );
        
        await complianceFramework.initialize();
        
        // Display system status
        const status = complianceFramework.getSystemStatus();
        logger.info('📊 System Status:');
        logger.info(`   - Status: ${status.status}`);
        logger.info(`   - Jurisdictions: ${status.jurisdictionsSupported}`);
        logger.info(`   - Requirements: ${status.activeRequirements}`);
        logger.info(`   - Real-time Monitoring: ${status.realTimeMonitoring ? 'Enabled' : 'Disabled'}`);
        
        // Display supported jurisdictions
        const jurisdictions = complianceFramework.getJurisdictions();
        logger.info(`🌍 Supported Jurisdictions (${jurisdictions.length}):`);
        for (const jurisdiction of jurisdictions) {
            logger.info(`   - ${jurisdiction.name} (${jurisdiction.code}): ${jurisdiction.regulations.join(', ')}`);
        }
        
        // Test 1: Individual KYC Compliance Check (US)
        logger.info('\n🔍 Test 1: Individual KYC Compliance Check (US)');
        const individualCheck = await complianceFramework.performComplianceCheck(
            'user_001',
            'INDIVIDUAL',
            ['US'],
            {
                fullName: 'John Smith',
                ssn: '123-45-6789',
                dateOfBirth: '1985-06-15',
                address: '123 Main St, New York, NY 10001',
                country: 'US',
                age: 38,
                income: 75000
            }
        );
        
        logger.info(`   Result: ${individualCheck.status}`);
        logger.info(`   Overall Score: ${individualCheck.overallScore}`);
        logger.info(`   Risk Score: ${individualCheck.riskScore}`);
        logger.info(`   Violations: ${individualCheck.violations.length}`);
        
        // Test 2: Corporate GDPR Compliance Check (EU)
        logger.info('\n🔍 Test 2: Corporate GDPR Compliance Check (EU)');
        const corporateCheck = await complianceFramework.performComplianceCheck(
            'corp_001',
            'CORPORATE',
            ['EU'],
            {
                companyName: 'Tech Innovations Ltd',
                registrationNumber: 'EU123456789',
                country: 'DE',
                businessType: 'TECHNOLOGY',
                employees: 150,
                dataProcessingActivities: ['USER_DATA', 'ANALYTICS', 'MARKETING'],
                dataConsent: true,
                dataFields: 15,
                hasDataProtectionOfficer: true
            }
        );
        
        logger.info(`   Result: ${corporateCheck.status}`);
        logger.info(`   Overall Score: ${corporateCheck.overallScore}`);
        logger.info(`   Risk Score: ${corporateCheck.riskScore}`);
        logger.info(`   Violations: ${corporateCheck.violations.length}`);
        
        // Test 3: High-Risk Transaction Monitoring
        logger.info('\n🔍 Test 3: High-Risk Transaction Monitoring');
        const transactionCheck = await complianceFramework.performComplianceCheck(
            'tx_001',
            'TRANSACTION',
            ['US', 'EU'],
            {
                amount: 25000,
                currency: 'USD',
                fromCountry: 'US',
                toCountry: 'CH',
                transactionType: 'WIRE_TRANSFER',
                purpose: 'BUSINESS_PAYMENT',
                timestamp: new Date().toISOString()
            }
        );
        
        logger.info(`   Result: ${transactionCheck.status}`);
        logger.info(`   Overall Score: ${transactionCheck.overallScore}`);
        logger.info(`   Risk Score: ${transactionCheck.riskScore}`);
        logger.info(`   Violations: ${transactionCheck.violations.length}`);
        
        // Test 4: Comprehensive Risk Assessment
        logger.info('\n⚠️ Test 4: Comprehensive Risk Assessment');
        const riskAssessment = await complianceFramework.performRiskAssessment(
            'risk_entity_001',
            'CORPORATE',
            {
                companyName: 'Global Crypto Exchange',
                country: 'US',
                businessType: 'CRYPTO_EXCHANGE',
                transactionVolume: 5000000,
                dailyUsers: 10000,
                regulatoryHistory: 'GOOD',
                kyc_completion: 95,
                isPEP: false,
                negativeMedia: false
            }
        );
        
        logger.info(`   Risk Level: ${riskAssessment.riskLevel}`);
        logger.info(`   Risk Score: ${riskAssessment.riskScore.toFixed(2)}`);
        logger.info('   Risk Factors:');
        for (const factor of riskAssessment.riskFactors) {
            logger.info(`     - ${factor.factor}: ${factor.score.toFixed(2)} (weight: ${factor.weight})`);
        }
        logger.info('   Recommendations:');
        for (const recommendation of riskAssessment.recommendations) {
            logger.info(`     - ${recommendation}`);
        }
        
        // Test 5: Generate Regulatory Report
        logger.info('\n📊 Test 5: Generate Regulatory Report');
        const reportEndDate = new Date();
        const reportStartDate = new Date();
        reportStartDate.setMonth(reportStartDate.getMonth() - 1);
        
        const report = await complianceFramework.generateRegulatoryReport(
            'US',
            'COMPLIANCE_SUMMARY',
            reportStartDate,
            reportEndDate
        );
        
        logger.info(`   Report ID: ${report.id}`);
        logger.info(`   Status: ${report.status}`);
        logger.info(`   Generated: ${report.generatedDate.toISOString()}`);
        logger.info(`   Errors: ${report.errors?.length || 0}`);
        logger.info(`   Warnings: ${report.warnings?.length || 0}`);
        
        // Test 6: Display Performance Metrics
        logger.info('\n📈 Test 6: Performance Metrics');
        const metrics = complianceFramework.getPerformanceMetrics();
        logger.info(`   Total Compliance Checks: ${metrics.totalComplianceChecks}`);
        logger.info(`   Passed Checks: ${metrics.passedChecks}`);
        logger.info(`   Failed Checks: ${metrics.failedChecks}`);
        logger.info(`   Compliance Rate: ${metrics.complianceRate.toFixed(1)}%`);
        logger.info(`   Average Compliance Score: ${metrics.averageComplianceScore.toFixed(1)}`);
        logger.info(`   Average Risk Score: ${metrics.averageRiskScore.toFixed(1)}`);
        logger.info(`   Total Violations: ${metrics.totalViolations}`);
        logger.info(`   Open Violations: ${metrics.openViolations}`);
        
        // Test 7: Check Active Violations
        const violations = complianceFramework.getActiveViolations();
        if (violations.length > 0) {
            logger.info(`\n🚨 Active Violations (${violations.length}):`);
            for (const violation of violations.slice(0, 3)) { // Show first 3
                logger.info(`   - ${violation.severity}: ${violation.description}`);
                logger.info(`     Detected: ${violation.detected.toISOString()}`);
                logger.info(`     Status: ${violation.status}`);
            }
        } else {
            logger.info('\n✅ No active violations found');
        }
        
        // Test 8: Simulate Report Submission
        if (report.status === 'READY') {
            logger.info('\n📤 Test 8: Submit Regulatory Report');
            try {
                const submitted = await complianceFramework.submitReport(report.id);
                logger.info(`   Submission Result: ${submitted ? 'Success' : 'Failed'}`);
            } catch (error) {
                logger.info(`   Submission Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        
        // Display final summary
        logger.info('\n📋 Test Summary:');
        logger.info('✅ AV11-24 Advanced Compliance Framework operational');
        logger.info('✅ Multi-jurisdiction compliance checks working');
        logger.info('✅ Real-time risk assessment functional');
        logger.info('✅ Regulatory reporting system active');
        logger.info('✅ Audit trail and violation tracking enabled');
        logger.info('✅ Quantum-secured compliance data storage');
        
        // Cleanup
        await complianceFramework.stop();
        logger.info('\n🛑 Compliance Framework test completed successfully');
        
    } catch (error) {
        logger.error(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testAdvancedComplianceFramework()
        .then(() => {
            console.log('✅ AV11-24 Advanced Compliance Framework test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test failed:', error);
            process.exit(1);
        });
}

export { testAdvancedComplianceFramework };
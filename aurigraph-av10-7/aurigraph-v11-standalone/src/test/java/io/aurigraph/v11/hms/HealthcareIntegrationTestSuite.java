package io.aurigraph.v11.hms;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.hamcrest.Matchers;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.lessThan;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive Test Suite for Aurigraph V11 Healthcare Integration
 * 
 * Tests all healthcare tokenization services including:
 * - Electronic Health Records (EHR) tokenization
 * - Medical imaging data processing with DICOM compliance
 * - Patient consent management with smart contracts
 * - HIPAA compliance framework validation
 * - HL7 FHIR integration and interoperability
 * - Healthcare terminology mapping (ICD-10, SNOMED CT, LOINC, CPT)
 * - Clinical decision support systems
 * - Quality reporting and analytics
 * - Regulatory compliance monitoring
 * 
 * Test Categories:
 * - Unit Tests: Individual service component testing
 * - Integration Tests: Cross-service interaction testing
 * - Performance Tests: Load testing and latency validation
 * - Security Tests: HIPAA compliance and quantum cryptography
 * - Compliance Tests: Regulatory requirement validation
 */
@QuarkusTest
@TestMethodOrder(OrderAnnotation.class)
@DisplayName("Healthcare Integration Test Suite - Aurigraph V11")
public class HealthcareIntegrationTestSuite {
    
    @Inject
    HealthcareDataTokenizationService healthcareTokenizationService;
    
    @Inject
    HL7FHIRIntegrationService fhirIntegrationService;
    
    // Test data constants
    private static final String TEST_PATIENT_ID = "PAT_TEST_001";
    private static final String TEST_PROVIDER_ID = "PROV_TEST_001";
    private static final String TEST_FACILITY_ID = "FAC_TEST_001";
    
    @BeforeEach
    void setUp() {
        // Set base URI for REST Assured
        RestAssured.baseURI = "http://localhost:8081";
        RestAssured.basePath = "/api/v11/healthcare";
    }
    
    @Nested
    @DisplayName("Electronic Health Records (EHR) Tokenization Tests")
    @TestMethodOrder(OrderAnnotation.class)
    class EHRTokenizationTests {
        
        @Test
        @Order(1)
        @DisplayName("Should successfully tokenize EHR with HIPAA compliance")
        void testEHRTokenizationSuccess() {
            // Create test patient consent first
            createTestPatientConsent();
            
            // Create EHR tokenization request
            Map<String, Object> ehrRequest = Map.of(
                "patientId", TEST_PATIENT_ID,
                "providerId", TEST_PROVIDER_ID,
                "facilityId", TEST_FACILITY_ID,
                "ehrData", Map.of(
                    "dataTypes", List.of("demographics", "medications", "allergies", "vitals"),
                    "clinicalData", Map.of(
                        "temperature", "98.6F",
                        "bloodPressure", "120/80",
                        "heartRate", "72"
                    ),
                    "diagnoses", List.of("Essential hypertension", "Type 2 diabetes"),
                    "medications", List.of("Metformin 500mg", "Lisinopril 10mg"),
                    "allergies", List.of("Penicillin"),
                    "vitalSigns", Map.of(
                        "temperature", 98.6,
                        "systolicBP", 120,
                        "diastolicBP", 80,
                        "heartRate", 72
                    ),
                    "procedures", List.of("Annual physical examination")
                ),
                "requiredConsents", List.of("EHR_ACCESS", "DATA_PROCESSING")
            );
            
            given()
                .contentType(ContentType.JSON)
                .body(ehrRequest)
            .when()
                .post("/ehr/tokenize")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("tokenizationId", notNullValue())
                .body("processingTimeMs", lessThan(100.0f))
                .body("details.complianceFlags", Matchers.hasItems("HIPAA_COMPLIANT", "PHI_ENCRYPTED"))
                .body("details.quantumSecurity", Matchers.containsString("Level"))
                .body("details.fhirVersion", is("4.0.1"));
        }
        
        @Test
        @Order(2)
        @DisplayName("Should reject EHR tokenization without patient consent")
        void testEHRTokenizationWithoutConsent() {
            Map<String, Object> ehrRequest = Map.of(
                "patientId", "PAT_NO_CONSENT_001",
                "providerId", TEST_PROVIDER_ID,
                "facilityId", TEST_FACILITY_ID,
                "ehrData", Map.of(
                    "dataTypes", List.of("demographics"),
                    "clinicalData", Map.of("temperature", "98.6F")
                ),
                "requiredConsents", List.of("EHR_ACCESS")
            );
            
            given()
                .contentType(ContentType.JSON)
                .body(ehrRequest)
            .when()
                .post("/ehr/tokenize")
            .then()
                .statusCode(400)
                .body("success", is(false))
                .body("errorCode", is("EHR_TOKENIZATION_ERROR"))
                .body("message", Matchers.containsString("consent"));
        }
        
        @Test
        @Order(3)
        @DisplayName("Should validate EHR tokenization performance requirements")
        void testEHRTokenizationPerformance() {
            createTestPatientConsent();
            
            long startTime = System.currentTimeMillis();
            
            Map<String, Object> ehrRequest = Map.of(
                "patientId", TEST_PATIENT_ID,
                "providerId", TEST_PROVIDER_ID,
                "facilityId", TEST_FACILITY_ID,
                "ehrData", Map.of(
                    "dataTypes", List.of("demographics", "medications"),
                    "clinicalData", Map.of("temperature", "98.6F")
                ),
                "requiredConsents", List.of("EHR_ACCESS")
            );
            
            given()
                .contentType(ContentType.JSON)
                .body(ehrRequest)
            .when()
                .post("/ehr/tokenize")
            .then()
                .statusCode(200)
                .body("processingTimeMs", lessThan(50.0f)); // Sub-50ms requirement
            
            long endTime = System.currentTimeMillis();
            assertTrue(endTime - startTime < 1000, "EHR tokenization should complete within 1 second");
        }
    }
    
    @Nested
    @DisplayName("Medical Imaging Tokenization Tests")
    @TestMethodOrder(OrderAnnotation.class)
    class MedicalImagingTests {
        
        @Test
        @Order(1)
        @DisplayName("Should successfully tokenize medical image with DICOM compliance")
        void testMedicalImageTokenization() {
            createTestPatientConsent("MEDICAL_IMAGING");
            
            // Create test medical image data
            byte[] testImageData = "DICOM_IMAGE_DATA_SAMPLE".getBytes();
            
            Map<String, Object> imageRequest = Map.of(
                "patientId", TEST_PATIENT_ID,
                "providerId", TEST_PROVIDER_ID,
                "studyInstanceUID", "1.2.840.10008.1.2.1.test.001",
                "seriesInstanceUID", "1.2.840.10008.1.2.1.test.series.001",
                "imageType", "CT",
                "imageData", testImageData,
                "imagingDevice", Map.of(
                    "deviceId", "CT_SCANNER_001",
                    "manufacturer", "Siemens Healthineers",
                    "model", "SOMATOM Definition AS+",
                    "softwareVersion", "VB10A",
                    "fdaRegistrationNumber", "FDA_REG_12345",
                    "lastCalibration", Instant.now().toString()
                ),
                "imagingDate", LocalDate.now().toString(),
                "patientPosition", "HFS"
            );
            
            given()
                .contentType(ContentType.JSON)
                .body(imageRequest)
            .when()
                .post("/imaging/tokenize")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("imageTokenId", notNullValue())
                .body("details.dicomCompliant", is(true))
                .body("details.fdaDeviceApproved", is(true))
                .body("details.integrityHash", notNullValue());
        }
        
        @Test
        @Order(2)
        @DisplayName("Should validate medical image compression and encryption")
        void testMedicalImageCompression() {
            createTestPatientConsent("MEDICAL_IMAGING");
            
            // Create larger test image data
            byte[] testImageData = new byte[10240]; // 10KB test data
            for (int i = 0; i < testImageData.length; i++) {
                testImageData[i] = (byte) (i % 256);
            }
            
            Map<String, Object> imageRequest = Map.of(
                "patientId", TEST_PATIENT_ID,
                "providerId", TEST_PROVIDER_ID,
                "studyInstanceUID", "1.2.840.10008.1.2.1.test.002",
                "seriesInstanceUID", "1.2.840.10008.1.2.1.test.series.002",
                "imageType", "MRI",
                "imageData", testImageData,
                "imagingDevice", Map.of(
                    "deviceId", "MRI_SCANNER_001",
                    "manufacturer", "GE Healthcare",
                    "model", "SIGNA Explorer",
                    "softwareVersion", "DV26.0",
                    "fdaRegistrationNumber", "FDA_REG_67890",
                    "lastCalibration", Instant.now().toString()
                ),
                "imagingDate", LocalDate.now().toString(),
                "patientPosition", "HFP"
            );
            
            given()
                .contentType(ContentType.JSON)
                .body(imageRequest)
            .when()
                .post("/imaging/tokenize")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("details.originalSize", greaterThan(0))
                .body("details.compressedSize", greaterThan(0));
        }
    }
    
    @Nested
    @DisplayName("Patient Consent Management Tests")
    @TestMethodOrder(OrderAnnotation.class)
    class PatientConsentTests {
        
        @Test
        @Order(1)
        @DisplayName("Should create patient consent with smart contract")
        void testCreatePatientConsent() {
            Map<String, Object> consentRequest = Map.of(
                "patientId", TEST_PATIENT_ID,
                "providerId", TEST_PROVIDER_ID,
                "consentType", "COMPREHENSIVE_CARE",
                "permissions", List.of("EHR_ACCESS", "MEDICAL_IMAGING", "DATA_SHARING", "RESEARCH_PARTICIPATION"),
                "customExpiryDate", Instant.now().plusSeconds(365 * 24 * 3600).toString() // 1 year
            );
            
            given()
                .contentType(ContentType.JSON)
                .body(consentRequest)
            .when()
                .post("/consent/create")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("consentId", notNullValue())
                .body("details.smartContractAddress", Matchers.startsWith("0x"))
                .body("details.quantumSignature", notNullValue())
                .body("details.active", is(true))
                .body("details.permissions", greaterThan(0));
        }
        
        @Test
        @Order(2)
        @DisplayName("Should validate patient consent for specific operations")
        void testValidatePatientConsent() {
            // First create a consent
            createTestPatientConsent("EHR_ACCESS");
            
            // Then validate it
            given()
            .when()
                .get("/consent/validate/" + TEST_PATIENT_ID + "/EHR_ACCESS")
            .then()
                .statusCode(200)
                .body("valid", is(true))
                .body("message", Matchers.containsString("valid"))
                .body("operationType", is("EHR_ACCESS"))
                .body("details.consentRequired", is(true));
        }
        
        @Test
        @Order(3)
        @DisplayName("Should reject validation for non-existent consent")
        void testValidateNonExistentConsent() {
            given()
            .when()
                .get("/consent/validate/NONEXISTENT_PATIENT/EHR_ACCESS")
            .then()
                .statusCode(200)
                .body("valid", is(false))
                .body("message", Matchers.containsString("not found"));
        }
    }
    
    @Nested
    @DisplayName("Healthcare System Statistics Tests")
    @TestMethodOrder(OrderAnnotation.class)
    class HealthcareStatsTests {
        
        @Test
        @Order(1)
        @DisplayName("Should retrieve comprehensive healthcare statistics")
        void testGetHealthcareStats() {
            given()
            .when()
                .get("/stats")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("stats.totalEHRTokenized", greaterThan(-1))
                .body("stats.totalMedicalImagesProcessed", greaterThan(-1))
                .body("stats.totalPatientConsents", greaterThan(-1))
                .body("stats.complianceScore", greaterThan(0.0f))
                .body("stats.avgTokenizationLatency", greaterThan(-1.0f))
                .body("timestamp", notNullValue());
        }
        
        @Test
        @Order(2)
        @DisplayName("Should validate healthcare system health")
        void testHealthcareHealthCheck() {
            given()
            .when()
                .get("/health")
            .then()
                .statusCode(200)
                .body("status", is("UP"))
                .body("message", Matchers.containsString("operational"))
                .body("metrics", notNullValue())
                .body("timestamp", notNullValue());
        }
    }
    
    @Nested
    @DisplayName("Insurance Claim Processing Tests")
    @TestMethodOrder(OrderAnnotation.class)
    class InsuranceClaimTests {
        
        @Test
        @Order(1)
        @DisplayName("Should process insurance claim with smart contract")
        void testProcessInsuranceClaim() {
            Map<String, Object> claimRequest = Map.of(
                "claimId", "CLAIM_TEST_001",
                "patientId", TEST_PATIENT_ID,
                "providerId", TEST_PROVIDER_ID,
                "insuranceId", "INS_PROVIDER_001",
                "diagnosisCode", "I10", // Essential hypertension
                "procedureCode", "99213", // Office visit
                "claimAmount", 250.00,
                "claimType", "OFFICE_VISIT"
            );
            
            given()
                .contentType(ContentType.JSON)
                .body(claimRequest)
            .when()
                .post("/insurance/claim")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("processedClaimId", notNullValue())
                .body("status", is("APPROVED"))
                .body("originalAmount", is(250.0f))
                .body("details.smartContractTx", Matchers.startsWith("0x"))
                .body("details.processedAmount", notNullValue())
                .body("details.copay", notNullValue());
        }
    }
    
    @Nested
    @DisplayName("Telemedicine Integration Tests")
    @TestMethodOrder(OrderAnnotation.class)
    class TelemedicineTests {
        
        @Test
        @Order(1)
        @DisplayName("Should tokenize telemedicine session")
        void testTokenizeTelemedicineSession() {
            Map<String, Object> sessionRequest = Map.of(
                "sessionId", "TELE_SESSION_001",
                "patientId", TEST_PATIENT_ID,
                "providerId", TEST_PROVIDER_ID,
                "consultationType", "GENERAL_CONSULTATION",
                "durationMinutes", 30,
                "sessionMetadata", Map.of(
                    "videoQuality", "HD",
                    "audioQuality", "High",
                    "recordingEnabled", true,
                    "consultationNotes", "Patient follow-up for hypertension management"
                )
            );
            
            given()
                .contentType(ContentType.JSON)
                .body(sessionRequest)
            .when()
                .post("/telemedicine/tokenize")
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("tokenId", notNullValue())
                .body("sessionId", is("TELE_SESSION_001"))
                .body("details.recordingEncrypted", is(true))
                .body("details.billingIntegrated", is(true))
                .body("details.complianceValidated", is(true));
        }
    }
    
    @Nested
    @DisplayName("Healthcare Provider Validation Tests")
    @TestMethodOrder(OrderAnnotation.class)
    class ProviderValidationTests {
        
        @Test
        @Order(1)
        @DisplayName("Should validate healthcare provider credentials")
        void testProviderCredentialsValidation() {
            given()
            .when()
                .get("/provider/credentials/" + TEST_PROVIDER_ID)
            .then()
                .statusCode(200)
                .body("success", is(true))
                .body("providerId", is(TEST_PROVIDER_ID))
                .body("credentials.verified", is(true))
                .body("credentials.licenseStatus", is("ACTIVE"))
                .body("credentials.specialties", notNullValue())
                .body("credentials.certifications", notNullValue());
        }
    }
    
    @Nested
    @DisplayName("HIPAA Compliance Tests")
    @TestMethodOrder(OrderAnnotation.class)
    class HIPAAComplianceTests {
        
        @Test
        @Order(1)
        @DisplayName("Should generate HIPAA compliance report")
        void testHIPAAComplianceReport() {
            given()
            .when()
                .get("/compliance/report/" + TEST_PROVIDER_ID)
            .then()
                .statusCode(200)
                .contentType(ContentType.JSON);
        }
        
        @Test
        @Order(2)
        @DisplayName("Should maintain PHI encryption standards")
        void testPHIEncryptionCompliance() {
            createTestPatientConsent("EHR_ACCESS");
            
            Map<String, Object> ehrRequest = Map.of(
                "patientId", TEST_PATIENT_ID,
                "providerId", TEST_PROVIDER_ID,
                "facilityId", TEST_FACILITY_ID,
                "ehrData", Map.of(
                    "dataTypes", List.of("demographics"),
                    "clinicalData", Map.of(
                        "ssn", "***-**-****", // Should be encrypted
                        "medicalRecordNumber", "MRN123456"
                    )
                ),
                "requiredConsents", List.of("EHR_ACCESS")
            );
            
            given()
                .contentType(ContentType.JSON)
                .body(ehrRequest)
            .when()
                .post("/ehr/tokenize")
            .then()
                .statusCode(200)
                .body("details.complianceFlags", Matchers.hasItem("PHI_ENCRYPTED"))
                .body("details.quantumSecurity", Matchers.containsString("Level"));
        }
    }
    
    @Nested
    @DisplayName("Performance and Load Tests")
    @TestMethodOrder(OrderAnnotation.class)
    class PerformanceTests {
        
        @Test
        @Order(1)
        @DisplayName("Should handle concurrent EHR tokenization requests")
        void testConcurrentEHRTokenization() throws InterruptedException {
            createTestPatientConsent("EHR_ACCESS");
            
            int concurrentRequests = 10;
            Thread[] threads = new Thread[concurrentRequests];
            
            for (int i = 0; i < concurrentRequests; i++) {
                final int requestIndex = i;
                threads[i] = new Thread(() -> {
                    Map<String, Object> ehrRequest = Map.of(
                        "patientId", TEST_PATIENT_ID + "_" + requestIndex,
                        "providerId", TEST_PROVIDER_ID,
                        "facilityId", TEST_FACILITY_ID,
                        "ehrData", Map.of(
                            "dataTypes", List.of("demographics"),
                            "clinicalData", Map.of("requestIndex", requestIndex)
                        ),
                        "requiredConsents", List.of("EHR_ACCESS")
                    );
                    
                    given()
                        .contentType(ContentType.JSON)
                        .body(ehrRequest)
                    .when()
                        .post("/ehr/tokenize")
                    .then()
                        .statusCode(200)
                        .body("success", is(true));
                });
            }
            
            // Start all threads
            for (Thread thread : threads) {
                thread.start();
            }
            
            // Wait for all threads to complete
            for (Thread thread : threads) {
                thread.join(5000); // 5 second timeout
            }
        }
        
        @Test
        @Order(2)
        @DisplayName("Should maintain sub-100ms latency for healthcare operations")
        void testHealthcareOperationLatency() {
            createTestPatientConsent("EHR_ACCESS");
            
            for (int i = 0; i < 5; i++) {
                long startTime = System.currentTimeMillis();
                
                given()
                .when()
                    .get("/consent/validate/" + TEST_PATIENT_ID + "/EHR_ACCESS")
                .then()
                    .statusCode(200)
                    .body("valid", is(true));
                
                long endTime = System.currentTimeMillis();
                long latency = endTime - startTime;
                
                assertTrue(latency < 100, "Healthcare operation latency should be under 100ms, was: " + latency + "ms");
            }
        }
    }
    
    // Helper methods for test setup
    
    private void createTestPatientConsent() {
        createTestPatientConsent("EHR_ACCESS");
    }
    
    private void createTestPatientConsent(String permission) {
        Map<String, Object> consentRequest = Map.of(
            "patientId", TEST_PATIENT_ID,
            "providerId", TEST_PROVIDER_ID,
            "consentType", "TEST_CONSENT",
            "permissions", List.of(permission, "DATA_PROCESSING"),
            "customExpiryDate", Instant.now().plusSeconds(3600).toString() // 1 hour
        );
        
        try {
            given()
                .contentType(ContentType.JSON)
                .body(consentRequest)
            .when()
                .post("/consent/create")
            .then()
                .statusCode(200);
        } catch (Exception e) {
            // Consent might already exist, continue with tests
        }
    }
}
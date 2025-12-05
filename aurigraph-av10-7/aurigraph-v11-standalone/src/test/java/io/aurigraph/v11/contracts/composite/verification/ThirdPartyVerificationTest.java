package io.aurigraph.v11.contracts.composite.verification;

import io.aurigraph.v11.ServiceTestBase;
import io.aurigraph.v11.contracts.composite.VerificationLevel;
import io.aurigraph.v11.contracts.composite.VerifierTier;
import org.junit.jupiter.api.*;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for Third-Party Verification System
 *
 * Tests all components:
 * - VerifierServiceCatalog
 * - VerificationTask
 * - RFIRequest
 * - VerificationPaymentService
 *
 * @version 1.0.0 (Dec 5, 2025 - AV12-CT: Third-Party Verification Tests)
 */
@DisplayName("Third-Party Verification System Tests")
class ThirdPartyVerificationTest extends ServiceTestBase {

    // ==================== VERIFIER SERVICE CATALOG TESTS ====================

    @Nested
    @DisplayName("VerifierServiceCatalog Tests")
    class VerifierServiceCatalogTests {

        private VerifierServiceCatalog catalog;
        private String verifierId;

        @BeforeEach
        void setUp() {
            verifierId = "VERIFIER-001";
            catalog = new VerifierServiceCatalog(verifierId);
        }

        @Test
        @DisplayName("testCreateServiceCatalog - Should create catalog with basic properties")
        void testCreateServiceCatalog() {
            assertNotNull(catalog.getCatalogId(), "Catalog ID should not be null");
            assertTrue(catalog.getCatalogId().startsWith("CAT-"), "Catalog ID should start with CAT-");
            assertEquals(verifierId, catalog.getVerifierId(), "Verifier ID should match");
            assertTrue(catalog.isActive(), "Catalog should be active by default");
            assertNotNull(catalog.getCreatedAt(), "Created timestamp should not be null");
            assertEquals(0, catalog.getServices().size(), "Services should be empty initially");
            assertNotNull(catalog.getRateCard(), "Rate card should be initialized");
            assertNotNull(catalog.getAvailability(), "Availability should be initialized");
        }

        @Test
        @DisplayName("testAddService - Should add service to catalog")
        void testAddService() {
            VerifierServiceCatalog.VerifierService service = createTestService();

            catalog.addService(service);

            assertEquals(1, catalog.getServices().size(), "Should have 1 service");
            assertTrue(catalog.getService(service.getServiceId()).isPresent(), "Service should be retrievable");

            VerifierServiceCatalog.VerifierService retrieved = catalog.getService(service.getServiceId()).get();
            assertEquals(service.getServiceName(), retrieved.getServiceName(), "Service name should match");
        }

        @Test
        @DisplayName("testRateCardCalculation - Should calculate correct prices with multipliers")
        void testRateCardCalculation() {
            VerifierServiceCatalog.RateCard rateCard = catalog.getRateCard();

            // Set up service pricing
            VerifierServiceCatalog.ServicePricing pricing = new VerifierServiceCatalog.ServicePricing()
                .serviceType(VerifierServiceCatalog.ServiceType.MARKET_VALUATION)
                .pricingModel(VerifierServiceCatalog.PricingModel.FLAT_FEE)
                .flatFee(BigDecimal.valueOf(1000));

            rateCard.getServicePricing().put(
                VerifierServiceCatalog.ServiceType.MARKET_VALUATION,
                pricing
            );

            // Set up multipliers
            rateCard.getAssetTypeMultipliers().put("REAL_ESTATE", BigDecimal.valueOf(1.5));
            rateCard.getJurisdictionMultipliers().put("CA", BigDecimal.valueOf(1.2));

            // Calculate price
            BigDecimal price = rateCard.calculatePrice(
                VerifierServiceCatalog.ServiceType.MARKET_VALUATION,
                "REAL_ESTATE",
                "CA",
                VerifierTier.TIER_2,
                BigDecimal.valueOf(1000000),
                false,  // not rush
                false,  // not weekend
                1       // complexity
            );

            // Base: 1000, Tier 2: x1.5, Asset: x1.5, Jurisdiction: x1.2
            // Expected: 1000 * 1.5 * 1.5 * 1.2 = 2700
            assertEquals(0, price.compareTo(BigDecimal.valueOf(2700)),
                "Price should be 2700 (1000 * 1.5 * 1.5 * 1.2)");
        }

        @Test
        @DisplayName("testRateCardCalculation - Should apply rush and weekend fees")
        void testRateCardCalculationWithFees() {
            VerifierServiceCatalog.RateCard rateCard = catalog.getRateCard();

            VerifierServiceCatalog.ServicePricing pricing = new VerifierServiceCatalog.ServicePricing()
                .serviceType(VerifierServiceCatalog.ServiceType.SITE_INSPECTION)
                .pricingModel(VerifierServiceCatalog.PricingModel.FLAT_FEE)
                .flatFee(BigDecimal.valueOf(500));

            rateCard.getServicePricing().put(
                VerifierServiceCatalog.ServiceType.SITE_INSPECTION,
                pricing
            );

            // Calculate with rush and weekend fees
            BigDecimal price = rateCard.calculatePrice(
                VerifierServiceCatalog.ServiceType.SITE_INSPECTION,
                "PROPERTY",
                "US",
                VerifierTier.TIER_1,
                BigDecimal.valueOf(100000),
                true,   // rush
                true,   // weekend
                1
            );

            // Base: 500, Tier 1: x1.0, Rush: x1.5, Weekend: x1.25
            // Expected: 500 * 1.0 * 1.5 * 1.25 = 937.5
            assertTrue(price.compareTo(BigDecimal.valueOf(937.5)) == 0,
                "Price should include rush and weekend fees");
        }

        @Test
        @DisplayName("testServiceAvailability - Should track availability correctly")
        void testServiceAvailability() {
            VerifierServiceCatalog.ServiceAvailability availability = catalog.getAvailability();

            assertTrue(availability.isAvailable(), "Should be available initially");
            assertEquals(10, availability.getRemainingCapacity(), "Should have default capacity");

            // Simulate adding active orders
            for (int i = 0; i < 5; i++) {
                availability.incrementActiveOrders();
            }

            assertEquals(5, availability.getCurrentActiveOrders(), "Should have 5 active orders");
            assertEquals(5, availability.getRemainingCapacity(), "Remaining capacity should be 5");
            assertTrue(availability.isAvailable(), "Should still be available");

            // Fill to capacity
            for (int i = 0; i < 5; i++) {
                availability.incrementActiveOrders();
            }

            assertFalse(availability.isAvailable(), "Should not be available at capacity");
            assertEquals(0, availability.getRemainingCapacity(), "No remaining capacity");
        }

        @Test
        @DisplayName("testVolumeDiscount - Should apply volume discounts correctly")
        void testVolumeDiscount() {
            VerifierServiceCatalog.RateCard rateCard = catalog.getRateCard();

            // Add volume discounts
            rateCard.getVolumeDiscounts().add(
                new VerifierServiceCatalog.VolumeDiscount(10, BigDecimal.valueOf(10))  // 10% off for 10+ orders
            );
            rateCard.getVolumeDiscounts().add(
                new VerifierServiceCatalog.VolumeDiscount(25, BigDecimal.valueOf(15))  // 15% off for 25+ orders
            );

            BigDecimal baseAmount = BigDecimal.valueOf(1000);

            // No discount for < 10 orders
            BigDecimal discounted1 = rateCard.applyVolumeDiscount(baseAmount, 5);
            assertEquals(0, baseAmount.compareTo(discounted1), "No discount for < 10 orders");

            // 10% discount for 10-24 orders
            BigDecimal discounted2 = rateCard.applyVolumeDiscount(baseAmount, 15);
            assertEquals(0, BigDecimal.valueOf(900).compareTo(discounted2), "10% discount applied");

            // 15% discount for 25+ orders
            BigDecimal discounted3 = rateCard.applyVolumeDiscount(baseAmount, 30);
            assertEquals(0, BigDecimal.valueOf(850).compareTo(discounted3), "15% discount applied");
        }
    }

    // ==================== VERIFICATION TASK TESTS ====================

    @Nested
    @DisplayName("VerificationTask Tests")
    class VerificationTaskTests {

        private VerificationTask task;
        private String workflowId;
        private String compositeId;
        private String assetId;

        @BeforeEach
        void setUp() {
            workflowId = "WORKFLOW-001";
            compositeId = "COMP-001";
            assetId = "ASSET-001";
            task = new VerificationTask(workflowId, compositeId, assetId);
        }

        @Test
        @DisplayName("testTaskCreation - Should create task with initial properties")
        void testTaskCreation() {
            assertNotNull(task.getTaskId(), "Task ID should not be null");
            assertTrue(task.getTaskId().startsWith("TASK-"), "Task ID should start with TASK-");
            assertEquals(workflowId, task.getWorkflowId(), "Workflow ID should match");
            assertEquals(compositeId, task.getCompositeId(), "Composite ID should match");
            assertEquals(assetId, task.getAssetId(), "Asset ID should match");
            assertEquals(VerificationTask.TaskStatus.CREATED, task.getStatus(), "Status should be CREATED");
            assertEquals(VerificationTask.TaskPriority.NORMAL, task.getPriority(), "Priority should be NORMAL");
            assertEquals(BigDecimal.ZERO, task.getProgressPercent(), "Progress should be 0");
            assertFalse(task.getEventLog().isEmpty(), "Event log should have creation event");
        }

        @Test
        @DisplayName("testTaskAssignment - Should assign task to verifier")
        void testTaskAssignment() {
            String verifierId = "VERIFIER-001";
            String verifierName = "Test Verifier Inc";
            VerifierTier tier = VerifierTier.TIER_2;

            task.assignToVerifier(verifierId, verifierName, tier);

            assertEquals(VerificationTask.TaskStatus.ASSIGNED, task.getStatus(), "Status should be ASSIGNED");
            assertNotNull(task.getAssignment(), "Assignment should not be null");
            assertEquals(verifierId, task.getAssignment().getAssignedVerifierId(), "Verifier ID should match");
            assertEquals(verifierName, task.getAssignment().getAssignedVerifierName(), "Verifier name should match");
            assertEquals(tier, task.getAssignment().getVerifierTier(), "Tier should match");
            assertNotNull(task.getAssignment().getAssignedAt(), "Assignment timestamp should be set");
        }

        @Test
        @DisplayName("testTaskLifecycle - Should transition through states correctly")
        void testTaskLifecycle() {
            String verifierId = "VERIFIER-001";

            // Initialize timeline for the task
            VerificationTask.TaskTimeline timeline = new VerificationTask.TaskTimeline()
                .createdAt(Instant.now())
                .dueDate(Instant.now().plus(Duration.ofDays(14)))
                .targetCompletionDate(Instant.now().plus(Duration.ofDays(14)))
                .estimatedDuration(Duration.ofDays(14));
            task.setTimeline(timeline);

            // CREATED -> ASSIGNED
            task.assignToVerifier(verifierId, "Test Verifier", VerifierTier.TIER_2);
            assertEquals(VerificationTask.TaskStatus.ASSIGNED, task.getStatus());

            // ASSIGNED -> ACCEPTED
            task.accept();
            assertEquals(VerificationTask.TaskStatus.ACCEPTED, task.getStatus());
            assertNotNull(task.getAssignment().getAcceptedAt(), "Accepted timestamp should be set");

            // ACCEPTED -> IN_PROGRESS
            task.start();
            assertEquals(VerificationTask.TaskStatus.IN_PROGRESS, task.getStatus());
            assertNotNull(task.getTimeline().getActualStartDate(), "Start date should be recorded");

            // IN_PROGRESS -> COMPLETED
            task.complete();
            assertEquals(VerificationTask.TaskStatus.COMPLETED, task.getStatus());
            assertEquals(0, BigDecimal.valueOf(100).compareTo(task.getProgressPercent()),
                "Progress should be 100%");
            assertNotNull(task.getTimeline().getActualCompletionDate(), "Completion date should be recorded");
        }

        @Test
        @DisplayName("testMilestoneProgress - Should track milestone completion")
        void testMilestoneProgress() {
            // Add milestones
            VerificationTask.TaskMilestone milestone1 = new VerificationTask.TaskMilestone(
                "Initial Assessment", 1, BigDecimal.valueOf(25)
            );
            VerificationTask.TaskMilestone milestone2 = new VerificationTask.TaskMilestone(
                "Site Visit", 2, BigDecimal.valueOf(35)
            );
            VerificationTask.TaskMilestone milestone3 = new VerificationTask.TaskMilestone(
                "Final Report", 3, BigDecimal.valueOf(40)
            );

            task.addMilestone(milestone1);
            task.addMilestone(milestone2);
            task.addMilestone(milestone3);

            assertEquals(3, task.getMilestones().size(), "Should have 3 milestones");

            // Complete first milestone
            task.completeMilestone(milestone1.getMilestoneId(), "verifier-001");
            assertEquals(VerificationTask.TaskMilestone.MilestoneStatus.COMPLETED,
                milestone1.getStatus(), "Milestone 1 should be completed");
            assertEquals(0, BigDecimal.valueOf(25).compareTo(task.getProgressPercent()),
                "Progress should be 25%");

            // Complete second milestone
            task.completeMilestone(milestone2.getMilestoneId(), "verifier-001");
            assertEquals(0, BigDecimal.valueOf(60).compareTo(task.getProgressPercent()),
                "Progress should be 60% (25 + 35)");

            // Complete third milestone
            task.completeMilestone(milestone3.getMilestoneId(), "verifier-001");
            assertEquals(0, BigDecimal.valueOf(100).compareTo(task.getProgressPercent()),
                "Progress should be 100%");
        }

        @Test
        @DisplayName("testDeliverableSubmission - Should track deliverable submission")
        void testDeliverableSubmission() {
            VerificationTask.TaskDeliverable deliverable = new VerificationTask.TaskDeliverable(
                "Inspection Report",
                VerifierServiceCatalog.DeliverableType.INSPECTION_REPORT
            );
            deliverable.setMandatory(true);

            task.addDeliverable(deliverable);

            assertEquals(1, task.getDeliverables().size(), "Should have 1 deliverable");
            assertEquals(VerificationTask.TaskDeliverable.DeliverableStatus.PENDING,
                deliverable.getStatus(), "Deliverable should be pending");

            // Submit deliverable
            List<String> attachmentIds = List.of("ATT-001", "ATT-002");
            deliverable.submit("verifier-001", attachmentIds);

            assertEquals(VerificationTask.TaskDeliverable.DeliverableStatus.SUBMITTED,
                deliverable.getStatus(), "Deliverable should be submitted");
            assertNotNull(deliverable.getSubmittedDate(), "Submitted date should be set");
            assertEquals("verifier-001", deliverable.getSubmittedBy(), "Submitted by should match");
            assertEquals(2, deliverable.getAttachmentIds().size(), "Should have 2 attachments");
        }

        @Test
        @DisplayName("testTaskPricing - Should calculate pricing correctly")
        void testTaskPricing() {
            VerificationTask.TaskPricing pricing = new VerificationTask.TaskPricing();
            pricing.setBasePrice(BigDecimal.valueOf(1000));
            pricing.setExpressMultiplier(BigDecimal.valueOf(1.5));
            pricing.setComplexityMultiplier(BigDecimal.valueOf(1.2));

            // Add line items using the correct inner class path
            VerificationTask.PricingLineItem item1 = new VerificationTask.PricingLineItem(
                "Document Review", BigDecimal.valueOf(500)
            );
            VerificationTask.PricingLineItem item2 = new VerificationTask.PricingLineItem(
                "Site Inspection", BigDecimal.valueOf(800)
            );
            pricing.addLineItem(item1);
            pricing.addLineItem(item2);

            // Add discount using correct inner class path
            VerificationTask.PricingAdjustment discount = new VerificationTask.PricingAdjustment(
                "Volume Discount",
                VerificationTask.PricingAdjustment.AdjustmentType.VOLUME_DISCOUNT,
                BigDecimal.valueOf(100),
                true  // is discount
            );
            pricing.addAdjustment(discount);

            // Verify calculations
            assertEquals(0, BigDecimal.valueOf(1300).compareTo(pricing.getSubtotal()),
                "Subtotal should be 1300 (500 + 800)");
            assertEquals(0, BigDecimal.valueOf(100).compareTo(pricing.getDiscount()),
                "Discount should be 100");

            // Total: (1300 - 100) * 1.5 * 1.2 = 2160
            assertEquals(0, BigDecimal.valueOf(2160).compareTo(pricing.getTotalPrice()),
                "Total should be 2160 after multipliers");
        }
    }

    // ==================== RFI REQUEST TESTS ====================

    @Nested
    @DisplayName("RFIRequest Tests")
    class RFIRequestTests {

        private RFIRequest rfi;
        private String taskId;
        private String workflowId;
        private String compositeId;

        @BeforeEach
        void setUp() {
            taskId = "TASK-001";
            workflowId = "WORKFLOW-001";
            compositeId = "COMP-001";
            rfi = new RFIRequest(taskId, workflowId, compositeId);
        }

        @Test
        @DisplayName("testRFICreation - Should create RFI with basic properties")
        void testRFICreation() {
            assertNotNull(rfi.getRfiId(), "RFI ID should not be null");
            assertTrue(rfi.getRfiId().startsWith("RFI-"), "RFI ID should start with RFI-");
            assertEquals(taskId, rfi.getTaskId(), "Task ID should match");
            assertEquals(workflowId, rfi.getWorkflowId(), "Workflow ID should match");
            assertEquals(compositeId, rfi.getCompositeId(), "Composite ID should match");
            assertEquals(RFIRequest.RFIStatus.DRAFT, rfi.getStatus(), "Status should be DRAFT");
            assertEquals(RFIRequest.RFIPriority.NORMAL, rfi.getPriority(), "Priority should be NORMAL");
            assertNotNull(rfi.getCreatedAt(), "Created timestamp should not be null");
        }

        @Test
        @DisplayName("testAddRFIItems - Should add items to RFI")
        void testAddRFIItems() {
            RFIRequest.RFIItem item1 = new RFIRequest.RFIItem(1, "Please provide title deed")
                .description("We need a copy of the property title deed")
                .itemType(RFIRequest.RFIItem.ItemType.DOCUMENT_UPLOAD)
                .mandatory(true);

            RFIRequest.RFIItem item2 = new RFIRequest.RFIItem(2, "Confirm property address")
                .description("Please verify the property address")
                .itemType(RFIRequest.RFIItem.ItemType.TEXT_RESPONSE)
                .mandatory(true);

            rfi.addItem(item1);
            rfi.addItem(item2);

            assertEquals(2, rfi.getRequestedItems().size(), "Should have 2 items");
            assertEquals(RFIRequest.RFIItem.ItemStatus.PENDING, item1.getStatus(), "Item 1 should be pending");
            assertEquals(RFIRequest.RFIItem.ItemStatus.PENDING, item2.getStatus(), "Item 2 should be pending");
        }

        @Test
        @DisplayName("testSubmitResponse - Should handle response submission")
        void testSubmitResponse() {
            // Add items
            RFIRequest.RFIItem item1 = new RFIRequest.RFIItem(1, "Provide ownership documents");
            rfi.addItem(item1);

            // Send RFI
            rfi.setRequesterId("requester-001");
            rfi.setRespondentId("respondent-001");
            rfi.setRespondentName("Property Owner");
            rfi.send();

            assertEquals(RFIRequest.RFIStatus.SENT, rfi.getStatus(), "Status should be SENT");
            assertNotNull(rfi.getSentAt(), "Sent timestamp should be set");

            // Create response
            RFIRequest.RFIResponse response = new RFIRequest.RFIResponse(
                "respondent-001",
                "Property Owner"
            );

            // Add item response
            RFIRequest.RFIItemResponse itemResponse = new RFIRequest.RFIItemResponse(item1.getItemId())
                .textResponse("Documents attached")
                .addAttachment("ATT-001")
                .addAttachment("ATT-002");

            response.addItemResponse(itemResponse);

            // Submit response
            rfi.submitResponse(response);

            assertEquals(RFIRequest.RFIStatus.ANSWERED, rfi.getStatus(), "Status should be ANSWERED");
            assertEquals(1, rfi.getResponses().size(), "Should have 1 response");
            assertNotNull(rfi.getRespondedAt(), "Responded timestamp should be set");
        }

        @Test
        @DisplayName("testThirdPartyDataRequest - Should handle third-party data requests")
        void testThirdPartyDataRequest() {
            // Create item that requires third-party verification
            RFIRequest.RFIItem item = new RFIRequest.RFIItem(1, "Verify property ownership")
                .itemType(RFIRequest.RFIItem.ItemType.THIRD_PARTY_VERIFICATION)
                .mandatory(true);

            rfi.addItem(item);

            // Create third-party data request
            RFIRequest.ThirdPartyDataRequest dataRequest = new RFIRequest.ThirdPartyDataRequest(
                item.getItemId(),
                RFIRequest.ThirdPartyDataRequest.ThirdPartyDataSource.PROPERTY_REGISTRY
            );
            dataRequest.setDataType("TITLE_VERIFICATION");
            dataRequest.setRequestedBy("verifier-001");
            dataRequest.addParameter("property_id", "PROP-12345");
            dataRequest.addParameter("jurisdiction", "CA");

            rfi.requestThirdPartyData(dataRequest);

            assertEquals(1, rfi.getThirdPartyDataRequests().size(), "Should have 1 data request");
            assertEquals(RFIRequest.ThirdPartyDataRequest.DataRequestStatus.PENDING,
                dataRequest.getStatus(), "Data request should be pending");
        }

        @Test
        @DisplayName("testRFILifecycle - Should transition through complete lifecycle")
        void testRFILifecycle() {
            // Setup RFI
            rfi.setSubject("Property Documentation Request");
            rfi.setRequesterId("requester-001");
            rfi.setRespondentId("respondent-001");
            rfi.setRespondentName("Property Owner");

            RFIRequest.RFIItem item = new RFIRequest.RFIItem(1, "Provide property deed");
            rfi.addItem(item);

            // DRAFT -> SENT
            rfi.send();
            assertEquals(RFIRequest.RFIStatus.SENT, rfi.getStatus());

            // SENT -> ACKNOWLEDGED
            rfi.acknowledge();
            assertEquals(RFIRequest.RFIStatus.ACKNOWLEDGED, rfi.getStatus());

            // ACKNOWLEDGED -> IN_PROGRESS
            rfi.startResponse();
            assertEquals(RFIRequest.RFIStatus.IN_PROGRESS, rfi.getStatus());

            // Create and submit response
            RFIRequest.RFIResponse response = new RFIRequest.RFIResponse(
                "respondent-001", "Property Owner"
            );
            RFIRequest.RFIItemResponse itemResponse = new RFIRequest.RFIItemResponse(item.getItemId())
                .textResponse("Documents provided");
            response.addItemResponse(itemResponse);

            rfi.submitResponse(response);
            assertEquals(RFIRequest.RFIStatus.ANSWERED, rfi.getStatus());

            // Accept response
            rfi.acceptResponse("reviewer-001", "All documents received and verified");
            assertEquals(RFIRequest.RFIStatus.ACCEPTED, rfi.getStatus());
        }

        @Test
        @DisplayName("testAttachments - Should handle attachments correctly")
        void testAttachments() {
            // Add request attachment
            RFIRequest.RFIAttachment requestAttachment = new RFIRequest.RFIAttachment(
                "instructions.pdf",
                "https://storage/instructions.pdf"
            )
                .fileType("PDF")
                .mimeType("application/pdf")
                .fileSize(1024000)
                .source(RFIRequest.RFIAttachment.AttachmentSource.REQUESTER_UPLOAD)
                .uploadedBy("requester-001")
                .description("RFI instructions and requirements");

            rfi.addRequestAttachment(requestAttachment);

            assertEquals(1, rfi.getRequestAttachments().size(), "Should have 1 request attachment");

            // Add response attachment
            RFIRequest.RFIAttachment responseAttachment = new RFIRequest.RFIAttachment(
                "title_deed.pdf",
                "https://storage/title_deed.pdf"
            )
                .fileType("PDF")
                .mimeType("application/pdf")
                .fileSize(2048000)
                .source(RFIRequest.RFIAttachment.AttachmentSource.RESPONDENT_UPLOAD)
                .uploadedBy("respondent-001")
                .confidential(true);

            rfi.addResponseAttachment(responseAttachment);

            assertEquals(1, rfi.getResponseAttachments().size(), "Should have 1 response attachment");
            assertTrue(responseAttachment.isConfidential(), "Response attachment should be confidential");
        }

        @Test
        @DisplayName("testRFIReminders - Should track reminder sending")
        void testRFIReminders() {
            rfi.send();

            assertEquals(0, rfi.getRemindersSent(), "No reminders sent initially");

            rfi.sendReminder();
            assertEquals(1, rfi.getRemindersSent(), "Should have sent 1 reminder");
            assertNotNull(rfi.getLastReminderSent(), "Last reminder timestamp should be set");

            rfi.sendReminder();
            assertEquals(2, rfi.getRemindersSent(), "Should have sent 2 reminders");
        }
    }

    // ==================== VERIFICATION PAYMENT SERVICE TESTS ====================

    @Nested
    @DisplayName("VerificationPaymentService Tests")
    class VerificationPaymentServiceTests {

        private VerificationPaymentService paymentService;

        @BeforeEach
        void setUp() {
            paymentService = new VerificationPaymentService();
        }

        @Test
        @DisplayName("testQuoteGeneration - Should generate quote with all fees")
        void testQuoteGeneration() {
            VerificationPaymentService.QuoteRequest request = new VerificationPaymentService.QuoteRequest();
            request.taskId = "TASK-001";
            request.compositeId = "COMP-001";
            request.clientId = "CLIENT-001";
            request.currency = "USD";
            request.useEscrow = true;
            request.isExpress = true;

            VerificationPaymentService.ServiceLineItem service1 = new VerificationPaymentService.ServiceLineItem();
            service1.serviceType = "DOCUMENT_REVIEW";
            service1.description = "Document verification service";
            service1.quantity = 1;
            service1.unitPrice = BigDecimal.valueOf(500);

            VerificationPaymentService.ServiceLineItem service2 = new VerificationPaymentService.ServiceLineItem();
            service2.serviceType = "SITE_INSPECTION";
            service2.description = "Physical site inspection";
            service2.quantity = 1;
            service2.unitPrice = BigDecimal.valueOf(800);

            request.services.add(service1);
            request.services.add(service2);

            VerificationPaymentService.VerificationQuote quote =
                paymentService.generateQuote(request).await().indefinitely();

            assertNotNull(quote.getQuoteId(), "Quote ID should not be null");
            assertEquals("TASK-001", quote.getTaskId(), "Task ID should match");
            assertEquals("USD", quote.getCurrency(), "Currency should be USD");

            // Service fees: 500 + 800 = 1300
            assertEquals(0, BigDecimal.valueOf(1300).compareTo(quote.getServiceFees()),
                "Service fees should be 1300");

            // Platform commission: 1300 * 0.05 = 65
            assertEquals(0, BigDecimal.valueOf(65).compareTo(quote.getPlatformCommission()),
                "Platform commission should be 65");

            // Escrow fee: 1300 * 0.01 = 13
            assertNotNull(quote.getEscrowFee(), "Escrow fee should be set");
            assertTrue(quote.getEscrowFee().compareTo(BigDecimal.ZERO) > 0,
                "Escrow fee should be positive");

            // Express fee should be applied
            assertNotNull(quote.getExpressFee(), "Express fee should be set");
            assertTrue(quote.getExpressFee().compareTo(BigDecimal.ZERO) > 0,
                "Express fee should be positive");

            assertNotNull(quote.getTotalAmount(), "Total amount should be calculated");
            assertNotNull(quote.getValidUntil(), "Quote expiry should be set");
        }

        @Test
        @DisplayName("testPaymentOrderCreation - Should create payment order from quote")
        void testPaymentOrderCreation() {
            String quoteId = "QT-12345";

            VerificationPaymentService.PaymentOrderRequest request =
                new VerificationPaymentService.PaymentOrderRequest();
            request.clientId = "CLIENT-001";
            request.taskId = "TASK-001";
            request.amount = BigDecimal.valueOf(1500);
            request.currency = "USD";
            request.paymentTerms = "NET_30";
            request.useEscrow = true;

            VerificationPaymentService.PaymentOrder order =
                paymentService.createPaymentOrder(quoteId, request).await().indefinitely();

            assertNotNull(order.getOrderId(), "Order ID should not be null");
            assertTrue(order.getOrderId().startsWith("ORD-"), "Order ID should start with ORD-");
            assertEquals(quoteId, order.getQuoteId(), "Quote ID should match");
            assertEquals("CLIENT-001", order.getClientId(), "Client ID should match");
            assertEquals(0, BigDecimal.valueOf(1500).compareTo(order.getAmount()),
                "Amount should be 1500");
            assertEquals(VerificationPaymentService.PaymentOrder.PaymentType.ESCROW,
                order.getPaymentType(), "Payment type should be ESCROW");
            assertEquals(VerificationPaymentService.PaymentOrder.OrderStatus.PENDING,
                order.getStatus(), "Status should be PENDING");
        }

        @Test
        @DisplayName("testEscrowFunding - Should fund escrow account")
        void testEscrowFunding() {
            String orderId = "ORD-12345";
            String clientId = "CLIENT-001";
            BigDecimal amount = BigDecimal.valueOf(1500);

            // Create escrow account
            VerificationPaymentService.EscrowAccount escrow =
                paymentService.createEscrowAccount(orderId, clientId, amount)
                    .await().indefinitely();

            assertNotNull(escrow.getEscrowId(), "Escrow ID should not be null");
            assertEquals(orderId, escrow.getOrderId(), "Order ID should match");
            assertEquals(VerificationPaymentService.EscrowAccount.EscrowStatus.CREATED,
                escrow.getStatus(), "Status should be CREATED");

            // Fund escrow
            VerificationPaymentService.EscrowTransaction transaction =
                paymentService.fundEscrow(escrow.getEscrowId(), amount, "TXN-001")
                    .await().indefinitely();

            assertNotNull(transaction.getTransactionId(), "Transaction ID should not be null");
            assertEquals(VerificationPaymentService.EscrowTransaction.TransactionType.DEPOSIT,
                transaction.getType(), "Transaction type should be DEPOSIT");
            assertEquals(0, amount.compareTo(transaction.getAmount()),
                "Transaction amount should match");
            assertEquals(VerificationPaymentService.EscrowTransaction.TransactionStatus.COMPLETED,
                transaction.getStatus(), "Transaction should be completed");

            // Verify escrow state
            assertEquals(0, amount.compareTo(escrow.getHeldAmount()),
                "Held amount should match funded amount");
            assertEquals(VerificationPaymentService.EscrowAccount.EscrowStatus.FUNDED,
                escrow.getStatus(), "Escrow should be FUNDED");
        }

        @Test
        @DisplayName("testEscrowRelease - Should release funds to verifier")
        void testEscrowRelease() {
            String orderId = "ORD-12345";
            String clientId = "CLIENT-001";
            String verifierId = "VERIFIER-001";
            BigDecimal totalAmount = BigDecimal.valueOf(1500);
            BigDecimal releaseAmount = BigDecimal.valueOf(1000);

            // Create and fund escrow
            VerificationPaymentService.EscrowAccount escrow =
                paymentService.createEscrowAccount(orderId, clientId, totalAmount)
                    .await().indefinitely();
            paymentService.fundEscrow(escrow.getEscrowId(), totalAmount, "TXN-001")
                .await().indefinitely();

            // Release funds
            VerificationPaymentService.EscrowTransaction release =
                paymentService.releaseFromEscrow(
                    escrow.getEscrowId(),
                    verifierId,
                    releaseAmount,
                    "Milestone 1 completed"
                ).await().indefinitely();

            assertEquals(VerificationPaymentService.EscrowTransaction.TransactionType.RELEASE,
                release.getType(), "Transaction type should be RELEASE");
            assertEquals(0, releaseAmount.compareTo(release.getAmount()),
                "Release amount should match");
            assertEquals(verifierId, release.getBeneficiaryId(), "Beneficiary should be verifier");

            // Verify escrow state
            assertEquals(0, BigDecimal.valueOf(500).compareTo(escrow.getHeldAmount()),
                "Held amount should be reduced to 500");
            assertEquals(0, releaseAmount.compareTo(escrow.getReleasedAmount()),
                "Released amount should be 1000");
            assertEquals(VerificationPaymentService.EscrowAccount.EscrowStatus.PARTIALLY_RELEASED,
                escrow.getStatus(), "Status should be PARTIALLY_RELEASED");
        }

        @Test
        @DisplayName("testFeeDistribution - Should distribute fees correctly")
        void testFeeDistribution() {
            String taskId = "TASK-001";
            BigDecimal totalAmount = BigDecimal.valueOf(1000);

            List<VerificationPaymentService.VerifierFeeShare> shares = new ArrayList<>();
            shares.add(new VerificationPaymentService.VerifierFeeShare(
                "VERIFIER-001", BigDecimal.valueOf(60)
            ));
            shares.add(new VerificationPaymentService.VerifierFeeShare(
                "VERIFIER-002", BigDecimal.valueOf(40)
            ));

            VerificationPaymentService.FeeDistribution distribution =
                paymentService.distributeFees(taskId, totalAmount, shares)
                    .await().indefinitely();

            assertNotNull(distribution.getDistributionId(), "Distribution ID should not be null");
            assertEquals(taskId, distribution.getTaskId(), "Task ID should match");

            // Platform fee: 1000 * 0.05 = 50
            assertEquals(0, BigDecimal.valueOf(50).compareTo(distribution.getPlatformFee()),
                "Platform fee should be 50");

            // Verifier pool: 1000 - 50 = 950
            // Verifier 1: 950 * 0.60 = 570
            // Verifier 2: 950 * 0.40 = 380
            assertEquals(0, BigDecimal.valueOf(570).compareTo(
                distribution.getVerifierPayouts().get("VERIFIER-001")),
                "Verifier 1 should receive 570");
            assertEquals(0, BigDecimal.valueOf(380).compareTo(
                distribution.getVerifierPayouts().get("VERIFIER-002")),
                "Verifier 2 should receive 380");
        }
    }

    // ==================== HELPER METHODS ====================

    private VerifierServiceCatalog.VerifierService createTestService() {
        return new VerifierServiceCatalog.VerifierService()
            .serviceName("Document Authentication")
            .serviceType(VerifierServiceCatalog.ServiceType.DOCUMENT_AUTHENTICATION)
            .description("Professional document authentication service")
            .outputLevel(VerificationLevel.CERTIFIED)
            .standardTurnaround(Duration.ofDays(3))
            .expressTurnaround(Duration.ofDays(1))
            .basePrice(BigDecimal.valueOf(500))
            .expressMultiplier(BigDecimal.valueOf(1.5))
            .addAssetType("REAL_ESTATE")
            .addAssetType("FINANCIAL_INSTRUMENT");
    }
}

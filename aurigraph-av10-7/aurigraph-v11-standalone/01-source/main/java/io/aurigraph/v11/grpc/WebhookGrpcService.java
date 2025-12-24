package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.aurigraph.v11.webhook.HmacSignatureVerifier;
import io.grpc.stub.StreamObserver;
import jakarta.inject.Singleton;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Logger;

/**
 * Sprint 15: WebhookGrpcService - Story 8 Migration
 *
 * gRPC implementation of webhook delivery with HMAC-SHA256 verification.
 * Replaces REST endpoints with native gRPC for better performance.
 */
@Singleton
public class WebhookGrpcService extends WebhookGrpcServiceGrpc.WebhookGrpcServiceImplBase {

    private static final Logger LOG = Logger.getLogger(WebhookGrpcService.class.getName());

    private final ConcurrentHashMap<String, WebhookData> webhooks = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<StreamObserver<WebhookEvent_Message>> eventSubscribers = new CopyOnWriteArrayList<>();
    private final BlockingQueue<WebhookEventDelivery> deliveryQueue = new LinkedBlockingQueue<>();
    private final AtomicLong totalDeliveries = new AtomicLong(0);
    private final ExecutorService executor = Executors.newFixedThreadPool(10);

    private static class WebhookData {
        String webhookId;
        String url;
        String secret;
        List<String> eventTypes;
        int successfulDeliveries = 0;
        int failedDeliveries = 0;
        String lastDeliveryAt;
        boolean active = true;
    }

    @Override
    public void registerWebhook(WebhookRegistration request, StreamObserver<WebhookReceipt> responseObserver) {
        try {
            WebhookData webhook = new WebhookData();
            webhook.webhookId = request.getWebhookId();
            webhook.url = request.getUrl();
            webhook.secret = request.getSecret();
            webhook.eventTypes = new ArrayList<>(request.getEventTypesList());

            webhooks.put(request.getWebhookId(), webhook);

            WebhookReceipt receipt = WebhookReceipt.newBuilder()
                .setWebhookId(request.getWebhookId())
                .setRegistered(true)
                .setMessage("Webhook registered successfully")
                .setSecret(request.getSecret())
                .setTimestamp(Instant.now().toString())
                .build();

            responseObserver.onNext(receipt);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void unregisterWebhook(WebhookIdRequest request, StreamObserver<UnregisterResponse> responseObserver) {
        try {
            WebhookData webhook = webhooks.remove(request.getWebhookId());
            boolean unregistered = webhook != null;

            UnregisterResponse response = UnregisterResponse.newBuilder()
                .setWebhookId(request.getWebhookId())
                .setUnregistered(unregistered)
                .setMessage(unregistered ? "Webhook unregistered" : "Webhook not found")
                .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void getWebhookStatus(WebhookIdRequest request, StreamObserver<WebhookStatus_Message> responseObserver) {
        try {
            WebhookData webhook = webhooks.get(request.getWebhookId());
            if (webhook == null) {
                responseObserver.onError(new Exception("Webhook not found"));
                return;
            }

            WebhookStatus_Message status = WebhookStatus_Message.newBuilder()
                .setWebhookId(webhook.webhookId)
                .setUrl(webhook.url)
                .setActive(webhook.active)
                .setSuccessfulDeliveries(webhook.successfulDeliveries)
                .setFailedDeliveries(webhook.failedDeliveries)
                .setLastDeliveryAt(webhook.lastDeliveryAt != null ? webhook.lastDeliveryAt : "")
                .build();

            responseObserver.onNext(status);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void streamWebhookEvents(WebhookSubscription request, StreamObserver<WebhookEvent_Message> responseObserver) {
        eventSubscribers.add(responseObserver);
        executor.submit(() -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    WebhookEventDelivery delivery = deliveryQueue.poll(5, TimeUnit.SECONDS);
                    if (delivery != null) {
                        responseObserver.onNext(delivery.getEvent());
                    }
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }

    @Override
    public void deliverWebhookEvent(WebhookEventDelivery request, StreamObserver<DeliveryReceipt> responseObserver) {
        try {
            WebhookData webhook = webhooks.get(request.getWebhookId());
            if (webhook == null) {
                responseObserver.onError(new Exception("Webhook not found"));
                return;
            }

            // Verify HMAC signature
            byte[] eventBytes = request.getEvent().getPayload().toByteArray();
            boolean signatureValid = HmacSignatureVerifier.verify(
                webhook.secret,
                eventBytes,
                request.getSignature()
            );

            if (!signatureValid) {
                webhook.failedDeliveries++;
                responseObserver.onError(new Exception("Invalid signature"));
                return;
            }

            // Queue for delivery
            deliveryQueue.offer(request);
            webhook.successfulDeliveries++;
            webhook.lastDeliveryAt = Instant.now().toString();
            totalDeliveries.incrementAndGet();

            DeliveryReceipt receipt = DeliveryReceipt.newBuilder()
                .setWebhookId(request.getWebhookId())
                .setEventId(request.getEvent().getEventId())
                .setDelivered(true)
                .setHttpStatus(200)
                .setTimestamp(Instant.now().toString())
                .build();

            responseObserver.onNext(receipt);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(e);
        }
    }

    @Override
    public void checkHealth(Empty request, StreamObserver<HealthStatus> responseObserver) {
        HealthStatus health = HealthStatus.newBuilder()
            .setServiceName("WebhookGrpcService")
            .setStatus("UP")
            .setUptimeSeconds((System.currentTimeMillis() / 1000))
            .build();
        responseObserver.onNext(health);
        responseObserver.onCompleted();
    }
}

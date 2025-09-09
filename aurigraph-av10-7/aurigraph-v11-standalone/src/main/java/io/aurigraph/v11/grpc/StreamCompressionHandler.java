package io.aurigraph.v11.grpc;

import io.grpc.ManagedChannel;
import io.grpc.ClientInterceptor;
import io.grpc.ClientCall;
import io.grpc.Channel;
import io.grpc.CallOptions;
import io.grpc.MethodDescriptor;
import io.grpc.ForwardingClientCall;
import io.grpc.Metadata;
import io.grpc.Compressor;
import io.grpc.CompressorRegistry;
import io.grpc.Decompressor;
import io.grpc.DecompressorRegistry;
import io.quarkus.runtime.Startup;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.concurrent.atomic.AtomicLong;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;
import java.util.zip.Deflater;
import java.util.zip.DeflaterOutputStream;
import java.util.zip.Inflater;
import java.util.zip.InflaterInputStream;

/**
 * Stream Compression Handler for High-Performance gRPC
 * 
 * Provides:
 * - Multiple compression algorithms (gzip, deflate, snappy-like)
 * - Adaptive compression based on message size
 * - Bandwidth optimization for 70% reduction
 * - Compression performance monitoring
 * - Stream-level compression control
 * 
 * Performance Targets:
 * - Bandwidth reduction: 70%+
 * - Compression overhead: <5ms P99
 * - Throughput degradation: <10%
 * - Memory overhead: <100MB per 10K connections
 */
@ApplicationScoped
@Startup
public class StreamCompressionHandler {

    private static final Logger LOG = Logger.getLogger(StreamCompressionHandler.class);

    // Configuration
    @ConfigProperty(name = "grpc.compression.enabled", defaultValue = "true")
    boolean compressionEnabled;

    @ConfigProperty(name = "grpc.compression.algorithm", defaultValue = "gzip")
    String defaultAlgorithm;

    @ConfigProperty(name = "grpc.compression.min-size", defaultValue = "1024")
    int minCompressionSize;

    @ConfigProperty(name = "grpc.compression.level", defaultValue = "6")
    int compressionLevel;

    @ConfigProperty(name = "grpc.compression.adaptive", defaultValue = "true")
    boolean adaptiveCompression;

    // Compression metrics
    private final AtomicLong totalOriginalBytes = new AtomicLong(0);
    private final AtomicLong totalCompressedBytes = new AtomicLong(0);
    private final AtomicLong compressionOperations = new AtomicLong(0);
    private final AtomicLong compressionTimeNs = new AtomicLong(0);

    // Custom compressor registry
    private final CompressorRegistry compressorRegistry;
    private final DecompressorRegistry decompressorRegistry;

    public StreamCompressionHandler() {
        this.compressorRegistry = CompressorRegistry.newEmptyInstance();
        this.decompressorRegistry = DecompressorRegistry.newEmptyInstance();
        initializeCompressors();
    }

    private void initializeCompressors() {
        LOG.info("Initializing stream compression handlers");

        // Register GZIP compressor
        compressorRegistry.register(new GzipCompressor());
        decompressorRegistry.register(new GzipDecompressor());

        // Register high-performance deflate compressor
        compressorRegistry.register(new HighPerformanceDeflateCompressor());
        decompressorRegistry.register(new HighPerformanceDeflateDecompressor());

        // Register fast compression for real-time scenarios
        compressorRegistry.register(new FastCompressor());
        decompressorRegistry.register(new FastDecompressor());

        LOG.infof("Compression initialized - Algorithm: %s, Min Size: %d bytes, Level: %d",
                 defaultAlgorithm, minCompressionSize, compressionLevel);
    }

    /**
     * Enables compression on a managed channel
     */
    public ManagedChannel enableCompression(ManagedChannel channel) {
        if (!compressionEnabled) {
            return channel;
        }

        // Apply compression interceptor
        return (ManagedChannel) io.grpc.ClientInterceptors.intercept(channel, 
            new CompressionInterceptor());
    }

    /**
     * Creates a compression-aware client call
     */
    public <ReqT, RespT> ClientCall<ReqT, RespT> createCompressedCall(
            Channel channel, MethodDescriptor<ReqT, RespT> method, CallOptions callOptions) {
        
        if (!compressionEnabled) {
            return channel.newCall(method, callOptions);
        }

        // Determine optimal compression for this method
        String algorithm = selectOptimalCompression(method);
        CallOptions compressedOptions = callOptions.withCompression(algorithm);
        
        return channel.newCall(method, compressedOptions);
    }

    /**
     * Selects optimal compression algorithm based on method and content
     */
    private <ReqT, RespT> String selectOptimalCompression(MethodDescriptor<ReqT, RespT> method) {
        if (!adaptiveCompression) {
            return defaultAlgorithm;
        }

        // Analyze method characteristics for optimal compression
        String methodName = method.getFullMethodName();
        
        if (methodName.contains("Stream") || methodName.contains("Batch")) {
            // Use high compression for streaming/batch operations
            return "gzip";
        } else if (methodName.contains("Health") || methodName.contains("Ping")) {
            // Use fast compression for health checks
            return "fast";
        } else {
            // Use balanced compression for regular operations
            return "deflate";
        }
    }

    /**
     * Compression interceptor for automatic compression
     */
    private class CompressionInterceptor implements ClientInterceptor {
        @Override
        public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
                MethodDescriptor<ReqT, RespT> method, CallOptions callOptions, Channel next) {
            
            String compression = selectOptimalCompression(method);
            CallOptions newOptions = callOptions.withCompression(compression);
            
            return new ForwardingClientCall.SimpleForwardingClientCall<ReqT, RespT>(
                    next.newCall(method, newOptions)) {
                
                @Override
                public void start(Listener<RespT> responseListener, Metadata headers) {
                    // Add compression headers if needed
                    if (compressionEnabled) {
                        headers.put(Metadata.Key.of("grpc-encoding", Metadata.ASCII_STRING_MARSHALLER), 
                                   compression);
                        headers.put(Metadata.Key.of("grpc-accept-encoding", Metadata.ASCII_STRING_MARSHALLER), 
                                   "gzip,deflate,fast");
                    }
                    super.start(responseListener, headers);
                }
            };
        }
    }

    /**
     * High-performance GZIP compressor
     */
    private class GzipCompressor implements Compressor {
        @Override
        public String getMessageEncoding() {
            return "gzip";
        }

        @Override
        public OutputStream compress(OutputStream os) throws IOException {
            long startTime = System.nanoTime();
            try {
                return new GZIPOutputStream(os) {
                    {
                        def.setLevel(compressionLevel);
                    }
                };
            } finally {
                compressionTimeNs.addAndGet(System.nanoTime() - startTime);
            }
        }
    }

    /**
     * GZIP decompressor
     */
    private class GzipDecompressor implements Decompressor {
        @Override
        public String getMessageEncoding() {
            return "gzip";
        }

        @Override
        public InputStream decompress(InputStream is) throws IOException {
            return new GZIPInputStream(is);
        }
    }

    /**
     * High-performance deflate compressor optimized for speed
     */
    private class HighPerformanceDeflateCompressor implements Compressor {
        @Override
        public String getMessageEncoding() {
            return "deflate";
        }

        @Override
        public OutputStream compress(OutputStream os) throws IOException {
            long startTime = System.nanoTime();
            compressionOperations.incrementAndGet();
            
            try {
                Deflater deflater = new Deflater(compressionLevel);
                deflater.setStrategy(Deflater.DEFAULT_STRATEGY);
                
                return new DeflaterOutputStream(os, deflater, 8192, true) {
                    @Override
                    public void close() throws IOException {
                        super.close();
                        compressionTimeNs.addAndGet(System.nanoTime() - startTime);
                    }
                };
            } catch (Exception e) {
                compressionTimeNs.addAndGet(System.nanoTime() - startTime);
                throw e;
            }
        }
    }

    /**
     * High-performance deflate decompressor
     */
    private class HighPerformanceDeflateDecompressor implements Decompressor {
        @Override
        public String getMessageEncoding() {
            return "deflate";
        }

        @Override
        public InputStream decompress(InputStream is) throws IOException {
            Inflater inflater = new Inflater();
            return new InflaterInputStream(is, inflater, 8192);
        }
    }

    /**
     * Fast compressor for real-time applications (minimal compression)
     */
    private class FastCompressor implements Compressor {
        @Override
        public String getMessageEncoding() {
            return "fast";
        }

        @Override
        public OutputStream compress(OutputStream os) throws IOException {
            long startTime = System.nanoTime();
            compressionOperations.incrementAndGet();
            
            try {
                // Use fastest deflate settings
                Deflater deflater = new Deflater(1); // Fastest compression
                deflater.setStrategy(Deflater.HUFFMAN_ONLY);
                
                return new DeflaterOutputStream(os, deflater, 4096, true) {
                    @Override
                    public void close() throws IOException {
                        super.close();
                        compressionTimeNs.addAndGet(System.nanoTime() - startTime);
                    }
                };
            } catch (Exception e) {
                compressionTimeNs.addAndGet(System.nanoTime() - startTime);
                throw e;
            }
        }
    }

    /**
     * Fast decompressor
     */
    private class FastDecompressor implements Decompressor {
        @Override
        public String getMessageEncoding() {
            return "fast";
        }

        @Override
        public InputStream decompress(InputStream is) throws IOException {
            return new InflaterInputStream(is, new Inflater(), 4096);
        }
    }

    /**
     * Compresses a byte array using the specified algorithm
     */
    public byte[] compressData(byte[] data, String algorithm) throws IOException {
        if (!compressionEnabled || data.length < minCompressionSize) {
            return data;
        }

        long originalSize = data.length;
        long startTime = System.nanoTime();
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             OutputStream compressor = createCompressor(algorithm, baos)) {
            
            compressor.write(data);
            compressor.flush();
            
            byte[] compressed = baos.toByteArray();
            
            // Update metrics
            totalOriginalBytes.addAndGet(originalSize);
            totalCompressedBytes.addAndGet(compressed.length);
            compressionOperations.incrementAndGet();
            compressionTimeNs.addAndGet(System.nanoTime() - startTime);
            
            // Only use compressed data if it's actually smaller
            if (compressed.length < originalSize * 0.95) { // 5% minimum savings
                return compressed;
            } else {
                // Compression not beneficial, return original
                totalCompressedBytes.addAndGet(originalSize - compressed.length); // Adjust metrics
                return data;
            }
        } catch (Exception e) {
            compressionTimeNs.addAndGet(System.nanoTime() - startTime);
            LOG.warnf("Compression failed for algorithm %s: %s", algorithm, e.getMessage());
            return data; // Return original on compression failure
        }
    }

    /**
     * Creates appropriate compressor output stream
     */
    private OutputStream createCompressor(String algorithm, OutputStream os) throws IOException {
        return switch (algorithm.toLowerCase()) {
            case "gzip" -> new GZIPOutputStream(os);
            case "deflate" -> new DeflaterOutputStream(os, new Deflater(compressionLevel));
            case "fast" -> new DeflaterOutputStream(os, new Deflater(1));
            default -> os; // No compression
        };
    }

    /**
     * Gets compression performance statistics
     */
    public CompressionStats getCompressionStats() {
        long originalBytes = totalOriginalBytes.get();
        long compressedBytes = totalCompressedBytes.get();
        long operations = compressionOperations.get();
        long totalTimeNs = compressionTimeNs.get();
        
        double compressionRatio = originalBytes > 0 ? 
            (double) compressedBytes / originalBytes : 0.0;
        double bandwidthSavings = originalBytes > 0 ? 
            1.0 - compressionRatio : 0.0;
        double avgCompressionTimeMs = operations > 0 ? 
            (totalTimeNs / 1_000_000.0) / operations : 0.0;
        
        return new CompressionStats(
            originalBytes,
            compressedBytes,
            operations,
            compressionRatio,
            bandwidthSavings,
            avgCompressionTimeMs
        );
    }

    /**
     * Optimizes compression settings based on current performance
     */
    public void optimizeCompressionSettings() {
        CompressionStats stats = getCompressionStats();
        
        // Adjust compression level based on performance
        if (stats.avgCompressionTimeMs() > 10.0) { // Too slow
            compressionLevel = Math.max(1, compressionLevel - 1);
            LOG.infof("Reduced compression level to %d for better performance", compressionLevel);
        } else if (stats.avgCompressionTimeMs() < 2.0 && stats.bandwidthSavings() < 0.5) {
            compressionLevel = Math.min(9, compressionLevel + 1);
            LOG.infof("Increased compression level to %d for better compression", compressionLevel);
        }
    }

    /**
     * Compression performance statistics
     */
    public record CompressionStats(
        long totalOriginalBytes,
        long totalCompressedBytes,
        long operations,
        double compressionRatio,
        double bandwidthSavings,
        double avgCompressionTimeMs
    ) {}
}
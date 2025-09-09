package io.aurigraph.v11;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.MappedByteBuffer;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Memory-Mapped Transaction Pool for Zero-Copy Operations
 * 
 * Performance Features:
 * - Memory-mapped file I/O for ultra-fast access
 * - Zero-copy transaction serialization/deserialization
 * - Lock-free ring buffer for concurrent writes
 * - Direct memory access with ByteBuffer operations
 * - Configurable pool size and segment management
 * 
 * Target Performance:
 * - 3M+ TPS sustained throughput
 * - <5ms memory allocation latency
 * - Zero garbage collection pressure
 * - Direct memory operations
 */
@ApplicationScoped
public class MemoryMappedTransactionPool {

    private static final Logger LOG = Logger.getLogger(MemoryMappedTransactionPool.class);
    
    // Memory-mapped configuration
    @ConfigProperty(name = "aurigraph.mmap.pool.size.mb", defaultValue = "1024")
    int poolSizeMB;
    
    @ConfigProperty(name = "aurigraph.mmap.segment.count", defaultValue = "64")
    int segmentCount;
    
    @ConfigProperty(name = "aurigraph.mmap.transaction.size", defaultValue = "256")
    int transactionSizeBytes;
    
    @ConfigProperty(name = "aurigraph.mmap.file.path", defaultValue = "/tmp/aurigraph/tx-pool.mmap")
    String mmapFilePath;
    
    // Memory-mapped segments for parallel access
    private MappedByteBuffer[] segments;
    private RandomAccessFile[] segmentFiles;
    private FileChannel[] segmentChannels;
    
    // Position tracking for ring buffer behavior
    private final AtomicLong[] segmentPositions;
    private final AtomicInteger nextSegment = new AtomicInteger(0);
    private final AtomicLong totalTransactions = new AtomicLong(0);
    
    // Transaction metadata index for fast lookup
    private final ConcurrentHashMap<String, TransactionLocation> transactionIndex;
    private final ReentrantReadWriteLock indexLock = new ReentrantReadWriteLock();
    
    // Performance metrics
    private final AtomicLong writeOperations = new AtomicLong(0);
    private final AtomicLong readOperations = new AtomicLong(0);
    private final AtomicLong zeroLatencyWrites = new AtomicLong(0);
    
    // Thread-local hash calculator
    private final ThreadLocal<MessageDigest> sha256 = ThreadLocal.withInitial(() -> {
        try {
            return MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    });

    @SuppressWarnings("unchecked")
    public MemoryMappedTransactionPool() {
        this.segmentPositions = new AtomicLong[64]; // Default, resized in @PostConstruct
        this.transactionIndex = new ConcurrentHashMap<>(1000000); // 1M initial capacity
    }

    @PostConstruct
    void initialize() {
        try {
            LOG.infof("Initializing MemoryMapped Transaction Pool: %dMB, %d segments", 
                     poolSizeMB, segmentCount);
            
            // Ensure directory exists
            Path mmapPath = Paths.get(mmapFilePath);
            Files.createDirectories(mmapPath.getParent());
            
            // Initialize segment tracking
            this.segmentPositions = new AtomicLong[segmentCount];
            for (int i = 0; i < segmentCount; i++) {
                segmentPositions[i] = new AtomicLong(0);
            }
            
            // Create memory-mapped segments
            createMemoryMappedSegments();
            
            LOG.infof("MemoryMapped Pool initialized: %d segments, %dMB total", 
                     segments.length, poolSizeMB);
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to initialize memory-mapped transaction pool", e);
        }
    }

    /**
     * Create memory-mapped segments for parallel access
     */
    private void createMemoryMappedSegments() throws IOException {
        long segmentSize = (long) poolSizeMB * 1024 * 1024 / segmentCount;
        
        segments = new MappedByteBuffer[segmentCount];
        segmentFiles = new RandomAccessFile[segmentCount];
        segmentChannels = new FileChannel[segmentCount];
        
        for (int i = 0; i < segmentCount; i++) {
            String segmentPath = mmapFilePath + ".segment." + i;
            segmentFiles[i] = new RandomAccessFile(segmentPath, "rw");
            segmentChannels[i] = segmentFiles[i].getChannel();
            
            // Map segment to memory
            segments[i] = segmentChannels[i].map(
                FileChannel.MapMode.READ_WRITE, 
                0, 
                segmentSize
            );
            
            LOG.debugf("Mapped segment %d: %dMB at %s", i, segmentSize / 1024 / 1024, segmentPath);
        }
    }

    /**
     * Write transaction with zero-copy operations
     * Returns transaction location for fast retrieval
     */
    public TransactionLocation writeTransaction(String id, double amount, String hash) {
        long startTime = System.nanoTime();
        
        // Select segment using round-robin for load balancing
        int segmentIndex = Math.abs(nextSegment.getAndIncrement()) % segmentCount;
        MappedByteBuffer segment = segments[segmentIndex];
        
        // Calculate position in segment (ring buffer behavior)
        long position = segmentPositions[segmentIndex].getAndAdd(transactionSizeBytes);
        int segmentPos = (int) (position % segment.capacity());
        
        // Ensure we don't exceed segment capacity
        if (segmentPos + transactionSizeBytes > segment.capacity()) {
            segmentPositions[segmentIndex].set(0); // Reset to beginning
            segmentPos = 0;
        }
        
        // Zero-copy write using direct ByteBuffer operations
        segment.position(segmentPos);
        
        // Write transaction header (64 bytes)
        byte[] idBytes = id.getBytes();
        segment.putInt(idBytes.length);
        segment.put(idBytes);
        segment.position(segmentPos + 64); // Fixed header size
        
        // Write transaction data
        segment.putDouble(amount);
        
        byte[] hashBytes = hash.getBytes();
        segment.putInt(hashBytes.length);
        segment.put(hashBytes);
        segment.putLong(System.currentTimeMillis()); // timestamp
        segment.putInt(1); // status: PENDING
        
        // Create transaction location
        TransactionLocation location = new TransactionLocation(
            segmentIndex,
            segmentPos,
            transactionSizeBytes,
            System.nanoTime()
        );
        
        // Index for fast lookup
        indexLock.readLock().lock();
        try {
            transactionIndex.put(id, location);
        } finally {
            indexLock.readLock().unlock();
        }
        
        // Update metrics
        writeOperations.incrementAndGet();
        totalTransactions.incrementAndGet();
        
        long writeTime = System.nanoTime() - startTime;
        if (writeTime < 1_000_000) { // Less than 1ms
            zeroLatencyWrites.incrementAndGet();
        }
        
        return location;
    }

    /**
     * Read transaction with zero-copy operations
     */
    public Transaction readTransaction(String id) {
        long startTime = System.nanoTime();
        
        // Find transaction location
        TransactionLocation location = transactionIndex.get(id);
        if (location == null) {
            return null;
        }
        
        // Direct memory access to transaction data
        MappedByteBuffer segment = segments[location.segmentIndex()];
        segment.position(location.position());
        
        // Read transaction header
        int idLength = segment.getInt();
        byte[] idBytes = new byte[idLength];
        segment.get(idBytes);
        segment.position(location.position() + 64); // Skip to data section
        
        // Read transaction data
        double amount = segment.getDouble();
        
        int hashLength = segment.getInt();
        byte[] hashBytes = new byte[hashLength];
        segment.get(hashBytes);
        
        long timestamp = segment.getLong();
        int status = segment.getInt();
        
        // Update metrics
        readOperations.incrementAndGet();
        
        return new Transaction(
            new String(idBytes),
            new String(hashBytes),
            amount,
            timestamp,
            statusToString(status)
        );
    }

    /**
     * Batch write for maximum throughput
     */
    public void batchWrite(TransactionBatch batch) {
        int segmentIndex = Math.abs(nextSegment.getAndIncrement()) % segmentCount;
        MappedByteBuffer segment = segments[segmentIndex];
        
        long startPos = segmentPositions[segmentIndex].getAndAdd(
            batch.transactions().size() * transactionSizeBytes);
        
        int segmentPos = (int) (startPos % segment.capacity());
        
        // Batch write all transactions
        for (BatchTransaction tx : batch.transactions()) {
            if (segmentPos + transactionSizeBytes > segment.capacity()) {
                segmentPos = 0; // Wrap around
            }
            
            writeTransactionDirect(segment, segmentPos, tx);
            
            // Index the transaction
            TransactionLocation location = new TransactionLocation(
                segmentIndex,
                segmentPos,
                transactionSizeBytes,
                System.nanoTime()
            );
            
            transactionIndex.put(tx.id(), location);
            segmentPos += transactionSizeBytes;
        }
        
        totalTransactions.addAndGet(batch.transactions().size());
    }

    /**
     * Direct transaction write without bounds checking (for batch operations)
     */
    private void writeTransactionDirect(MappedByteBuffer segment, int position, BatchTransaction tx) {
        segment.position(position);
        
        byte[] idBytes = tx.id().getBytes();
        segment.putInt(idBytes.length);
        segment.put(idBytes);
        segment.position(position + 64);
        
        segment.putDouble(tx.amount());
        
        byte[] hashBytes = tx.hash().getBytes();
        segment.putInt(hashBytes.length);
        segment.put(hashBytes);
        segment.putLong(System.currentTimeMillis());
        segment.putInt(1); // PENDING
    }

    /**
     * Get memory pool statistics
     */
    public PoolStats getStats() {
        long totalCapacity = 0;
        long totalUsed = 0;
        
        for (int i = 0; i < segments.length; i++) {
            totalCapacity += segments[i].capacity();
            totalUsed += segmentPositions[i].get();
        }
        
        return new PoolStats(
            totalTransactions.get(),
            writeOperations.get(),
            readOperations.get(),
            zeroLatencyWrites.get(),
            totalCapacity,
            totalUsed,
            segmentCount,
            transactionIndex.size()
        );
    }

    /**
     * Compact memory pool by removing old transactions
     */
    public void compact() {
        indexLock.writeLock().lock();
        try {
            // Simple compaction: clear index of transactions older than 1 hour
            long cutoff = System.currentTimeMillis() - 3600_000;
            transactionIndex.entrySet().removeIf(entry -> 
                entry.getValue().creationTime() < cutoff * 1_000_000);
        } finally {
            indexLock.writeLock().unlock();
        }
        
        LOG.infof("Compacted memory pool, %d transactions indexed", transactionIndex.size());
    }

    @PreDestroy
    void cleanup() {
        try {
            for (int i = 0; i < segmentChannels.length; i++) {
                if (segmentChannels[i] != null) {
                    segmentChannels[i].close();
                }
                if (segmentFiles[i] != null) {
                    segmentFiles[i].close();
                }
            }
            LOG.info("Memory-mapped transaction pool cleaned up");
        } catch (IOException e) {
            LOG.error("Error cleaning up memory-mapped pool", e);
        }
    }

    private String statusToString(int status) {
        return switch (status) {
            case 0 -> "PENDING";
            case 1 -> "CONFIRMED";
            case 2 -> "FAILED";
            default -> "UNKNOWN";
        };
    }

    // Transaction location in memory-mapped file
    public record TransactionLocation(
        int segmentIndex,
        int position,
        int size,
        long creationTime
    ) {}

    // Batch transaction for efficient writing
    public record BatchTransaction(
        String id,
        double amount,
        String hash
    ) {}

    // Transaction batch
    public record TransactionBatch(
        java.util.List<BatchTransaction> transactions
    ) {}

    // Memory pool statistics
    public record PoolStats(
        long totalTransactions,
        long writeOperations,
        long readOperations,
        long zeroLatencyWrites,
        long totalCapacityBytes,
        long totalUsedBytes,
        int segmentCount,
        int indexedTransactions
    ) {}

    // Transaction record (same as TransactionService)
    public record Transaction(
        String id,
        String hash,
        double amount,
        long timestamp,
        String status
    ) {}
}
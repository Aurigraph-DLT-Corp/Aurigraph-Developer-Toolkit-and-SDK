package io.aurigraph.v11.tokenization.models;

/**
 * Storage Information Model
 *
 * Represents LevelDB storage information for ALL nodes
 *
 * @version 11.3.0
 * @author Backend Development Agent (BDA)
 */
public class StorageInfo {

    public String basePath;
    public long totalSize;  // Total bytes stored
    public int eiNodeCount;  // Number of EI nodes (legacy field)
    public int channelCount;  // Number of active channels
    public boolean compressionEnabled;
    public boolean encryptionEnabled;

    public StorageInfo() {
        // Default constructor for Jackson/JSON deserialization
    }

    public StorageInfo(String basePath, long totalSize, int eiNodeCount,
                      int channelCount, boolean compressionEnabled,
                      boolean encryptionEnabled) {
        this.basePath = basePath;
        this.totalSize = totalSize;
        this.eiNodeCount = eiNodeCount;
        this.channelCount = channelCount;
        this.compressionEnabled = compressionEnabled;
        this.encryptionEnabled = encryptionEnabled;
    }
}

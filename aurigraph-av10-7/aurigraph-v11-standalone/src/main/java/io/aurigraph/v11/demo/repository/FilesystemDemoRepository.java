package io.aurigraph.v11.demo.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.aurigraph.v11.demo.model.DemoDTO;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Filesystem-based Demo Repository
 *
 * Stores demo data as JSON files on the filesystem instead of in a database.
 * This allows demos to persist without requiring database container setup.
 *
 * Storage structure:
 *   data/demos/
 *     ├── demo_{id}.json       - Individual demo files
 *     ├── demo_index.json      - Index for quick lookups
 *     └── archive/             - Expired demos
 *
 * @version 1.0.0 (Dec 4, 2025)
 * @author Backend Development Agent (BDA)
 */
@ApplicationScoped
public class FilesystemDemoRepository {

    private static final Logger LOG = Logger.getLogger(FilesystemDemoRepository.class);

    @ConfigProperty(name = "aurigraph.demo.data.path", defaultValue = "data/demos")
    String dataPath;

    private Path demosPath;
    private Path archivePath;
    private final ObjectMapper objectMapper;

    // In-memory cache for fast reads
    private final Map<String, DemoDTO> demoCache = new ConcurrentHashMap<>();

    public FilesystemDemoRepository() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @PostConstruct
    void init() {
        try {
            this.demosPath = Paths.get(dataPath);
            this.archivePath = demosPath.resolve("archive");

            // Create directories if they don't exist
            Files.createDirectories(demosPath);
            Files.createDirectories(archivePath);

            // Load existing demos into cache
            loadDemosFromFilesystem();

            LOG.infof("Filesystem demo repository initialized at: %s", demosPath.toAbsolutePath());
            LOG.infof("Loaded %d demos from filesystem", demoCache.size());
        } catch (IOException e) {
            LOG.errorf(e, "Failed to initialize filesystem demo repository");
            throw new RuntimeException("Cannot initialize demo storage", e);
        }
    }

    /**
     * Load all demo files from filesystem into cache
     */
    private void loadDemosFromFilesystem() {
        try (Stream<Path> files = Files.list(demosPath)) {
            files.filter(p -> p.toString().endsWith(".json") && p.getFileName().toString().startsWith("demo_"))
                 .forEach(this::loadDemoFile);
        } catch (IOException e) {
            LOG.warnf(e, "Error loading demos from filesystem");
        }
    }

    private void loadDemoFile(Path path) {
        try {
            DemoDTO demo = objectMapper.readValue(path.toFile(), DemoDTO.class);
            demoCache.put(demo.id, demo);
        } catch (IOException e) {
            LOG.warnf(e, "Failed to load demo file: %s", path);
        }
    }

    /**
     * Save a demo to filesystem
     */
    public DemoDTO save(DemoDTO demo) {
        try {
            Path demoFile = demosPath.resolve("demo_" + demo.id + ".json");
            objectMapper.writeValue(demoFile.toFile(), demo);
            demoCache.put(demo.id, demo);
            LOG.debugf("Saved demo to filesystem: %s", demo.id);
            return demo;
        } catch (IOException e) {
            LOG.errorf(e, "Failed to save demo: %s", demo.id);
            throw new RuntimeException("Cannot save demo", e);
        }
    }

    /**
     * Find demo by ID
     */
    public Optional<DemoDTO> findById(String id) {
        DemoDTO demo = demoCache.get(id);
        if (demo != null) {
            return Optional.of(demo);
        }

        // Try loading from filesystem
        Path demoFile = demosPath.resolve("demo_" + id + ".json");
        if (Files.exists(demoFile)) {
            try {
                demo = objectMapper.readValue(demoFile.toFile(), DemoDTO.class);
                demoCache.put(id, demo);
                return Optional.of(demo);
            } catch (IOException e) {
                LOG.warnf(e, "Failed to load demo: %s", id);
            }
        }
        return Optional.empty();
    }

    /**
     * Get all demos
     */
    public List<DemoDTO> findAll() {
        return new ArrayList<>(demoCache.values()).stream()
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .collect(Collectors.toList());
    }

    /**
     * Get active (non-expired) demos
     */
    public List<DemoDTO> findAllActive() {
        return demoCache.values().stream()
                .filter(d -> !"EXPIRED".equals(d.status))
                .sorted((a, b) -> b.createdAt.compareTo(a.createdAt))
                .collect(Collectors.toList());
    }

    /**
     * Get expired demos that haven't been marked as expired yet
     */
    public List<DemoDTO> findExpired() {
        LocalDateTime now = LocalDateTime.now();
        return demoCache.values().stream()
                .filter(d -> d.expiresAt != null && d.expiresAt.isBefore(now) && !"EXPIRED".equals(d.status))
                .collect(Collectors.toList());
    }

    /**
     * Get running demos
     */
    public List<DemoDTO> findRunning() {
        LocalDateTime now = LocalDateTime.now();
        return demoCache.values().stream()
                .filter(d -> "RUNNING".equals(d.status) &&
                             d.expiresAt != null && d.expiresAt.isAfter(now))
                .collect(Collectors.toList());
    }

    /**
     * Delete a demo
     */
    public boolean delete(String id) {
        try {
            Path demoFile = demosPath.resolve("demo_" + id + ".json");
            if (Files.exists(demoFile)) {
                Files.delete(demoFile);
            }
            demoCache.remove(id);
            LOG.debugf("Deleted demo: %s", id);
            return true;
        } catch (IOException e) {
            LOG.errorf(e, "Failed to delete demo: %s", id);
            return false;
        }
    }

    /**
     * Archive an expired demo (move to archive folder)
     */
    public boolean archive(String id) {
        try {
            Path demoFile = demosPath.resolve("demo_" + id + ".json");
            Path archiveFile = archivePath.resolve("demo_" + id + ".json");

            if (Files.exists(demoFile)) {
                Files.move(demoFile, archiveFile, StandardCopyOption.REPLACE_EXISTING);
            }
            demoCache.remove(id);
            LOG.debugf("Archived demo: %s", id);
            return true;
        } catch (IOException e) {
            LOG.errorf(e, "Failed to archive demo: %s", id);
            return false;
        }
    }

    /**
     * Count all demos
     */
    public long count() {
        return demoCache.size();
    }

    /**
     * Count active demos
     */
    public long countActive() {
        return demoCache.values().stream()
                .filter(d -> !"EXPIRED".equals(d.status))
                .count();
    }

    /**
     * Refresh cache from filesystem
     */
    public void refresh() {
        demoCache.clear();
        loadDemosFromFilesystem();
        LOG.infof("Refreshed demo cache: %d demos loaded", demoCache.size());
    }
}

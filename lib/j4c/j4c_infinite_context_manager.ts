/**
 * J4C Infinite Context Window Manager
 *
 * Provides intelligent context management for multiple agents with theoretically
 * unlimited context through:
 * - Hierarchical context compression
 * - Semantic chunking and indexing
 * - Dynamic context loading/unloading
 * - Cross-agent context sharing
 * - Persistent context storage with efficient retrieval
 *
 * @module j4c_infinite_context_manager
 * @version 3.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

/**
 * Context chunk with semantic metadata
 */
interface ContextChunk {
  id: string;
  agentId: string;
  sessionId: string;
  content: string;
  type: ContextType;
  timestamp: number;
  priority: ContextPriority;
  semanticTags: string[];
  references: string[]; // IDs of related chunks
  compressionLevel: number; // 0=raw, 1-5=progressive compression
  accessCount: number;
  lastAccessed: number;
  size: number; // bytes
  metadata: Record<string, any>;
}

/**
 * Context types for semantic organization
 */
enum ContextType {
  CODE = 'code',
  DOCUMENTATION = 'documentation',
  CONVERSATION = 'conversation',
  DECISION = 'decision',
  ERROR = 'error',
  PATTERN = 'pattern',
  BEST_PRACTICE = 'best_practice',
  EXECUTION_RESULT = 'execution_result',
  ANALYSIS = 'analysis',
  REQUIREMENT = 'requirement',
}

/**
 * Context priority for memory management
 */
enum ContextPriority {
  CRITICAL = 1,    // Never evict (decisions, requirements)
  HIGH = 2,        // Evict last (active work)
  NORMAL = 3,      // Standard eviction
  LOW = 4,         // Evict early (old conversations)
  ARCHIVAL = 5,    // Compress aggressively
}

/**
 * Context window configuration
 */
interface ContextWindowConfig {
  maxActiveMemoryMB: number;      // RAM limit for active context
  maxDiskStorageGB: number;       // Disk limit for persisted context
  compressionThresholdKB: number; // Size threshold for compression
  evictionPolicy: 'LRU' | 'LFU' | 'PRIORITY' | 'SEMANTIC';
  chunkSize: number;              // Target chunk size in characters
  overlapSize: number;            // Overlap between chunks
  indexingEnabled: boolean;       // Enable semantic indexing
  crossAgentSharing: boolean;     // Allow context sharing between agents
}

/**
 * Context index entry for fast retrieval
 */
interface ContextIndex {
  chunkId: string;
  agentId: string;
  sessionId: string;
  type: ContextType;
  priority: ContextPriority;
  semanticTags: string[];
  timestamp: number;
  size: number;
  location: 'memory' | 'disk' | 'compressed';
  compressionRatio?: number;
}

/**
 * Context query for semantic retrieval
 */
interface ContextQuery {
  agentId?: string;
  sessionId?: string;
  types?: ContextType[];
  semanticTags?: string[];
  timeRange?: { start: number; end: number };
  priorityMin?: ContextPriority;
  limit?: number;
  includeRelated?: boolean; // Follow references
  relevanceThreshold?: number; // 0-1 semantic similarity
}

/**
 * Context retrieval result
 */
interface ContextResult {
  chunks: ContextChunk[];
  totalSize: number;
  retrievalTimeMs: number;
  compressionSavings: number;
  metadata: {
    hitRate: number;
    fromMemory: number;
    fromDisk: number;
    decompressed: number;
  };
}

/**
 * Context statistics
 */
interface ContextStats {
  totalChunks: number;
  totalSizeMB: number;
  activeMemoryMB: number;
  diskStorageMB: number;
  compressionRatio: number;
  chunksByType: Record<ContextType, number>;
  chunksByPriority: Record<ContextPriority, number>;
  agentCount: number;
  sessionCount: number;
  avgAccessTime: number;
  hitRate: number;
}

// ============================================================================
// INFINITE CONTEXT MANAGER
// ============================================================================

export class InfiniteContextManager {
  private config: ContextWindowConfig;
  private activeChunks: Map<string, ContextChunk>; // In-memory cache
  private chunkIndex: Map<string, ContextIndex>;
  private semanticIndex: Map<string, Set<string>>; // tag -> chunk IDs
  private agentIndex: Map<string, Set<string>>; // agentId -> chunk IDs
  private sessionIndex: Map<string, Set<string>>; // sessionId -> chunk IDs
  private storageDir: string;
  private indexDir: string;
  private compressedDir: string;
  private currentMemoryUsageMB: number;
  private stats: {
    queries: number;
    hits: number;
    misses: number;
    evictions: number;
    compressions: number;
    decompressions: number;
    totalRetrievalTimeMs: number;
  };

  constructor(config: Partial<ContextWindowConfig> = {}) {
    this.config = {
      maxActiveMemoryMB: config.maxActiveMemoryMB || 512,
      maxDiskStorageGB: config.maxDiskStorageGB || 10,
      compressionThresholdKB: config.compressionThresholdKB || 100,
      evictionPolicy: config.evictionPolicy || 'PRIORITY',
      chunkSize: config.chunkSize || 4000,
      overlapSize: config.overlapSize || 400,
      indexingEnabled: config.indexingEnabled !== false,
      crossAgentSharing: config.crossAgentSharing !== false,
    };

    this.activeChunks = new Map();
    this.chunkIndex = new Map();
    this.semanticIndex = new Map();
    this.agentIndex = new Map();
    this.sessionIndex = new Map();
    this.currentMemoryUsageMB = 0;

    // Setup storage directories
    const baseDir = path.join(process.cwd(), '.j4c', 'context');
    this.storageDir = path.join(baseDir, 'chunks');
    this.indexDir = path.join(baseDir, 'indexes');
    this.compressedDir = path.join(baseDir, 'compressed');

    this.ensureDirectories();

    this.stats = {
      queries: 0,
      hits: 0,
      misses: 0,
      evictions: 0,
      compressions: 0,
      decompressions: 0,
      totalRetrievalTimeMs: 0,
    };

    // Load existing indexes
    this.loadIndexes();
  }

  // ==========================================================================
  // PUBLIC API
  // ==========================================================================

  /**
   * Add content to the infinite context window
   */
  public async addContext(
    agentId: string,
    sessionId: string,
    content: string,
    type: ContextType,
    options: {
      priority?: ContextPriority;
      semanticTags?: string[];
      references?: string[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string[]> {
    const chunks = this.chunkContent(content);
    const chunkIds: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk: ContextChunk = {
        id: this.generateChunkId(agentId, sessionId),
        agentId,
        sessionId,
        content: chunks[i],
        type,
        timestamp: Date.now(),
        priority: options.priority || ContextPriority.NORMAL,
        semanticTags: options.semanticTags || this.extractSemanticTags(chunks[i], type),
        references: options.references || [],
        compressionLevel: 0,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: Buffer.byteLength(chunks[i], 'utf8'),
        metadata: options.metadata || {},
      };

      // Add references to adjacent chunks
      if (i > 0) {
        chunk.references.push(chunkIds[i - 1]);
      }

      await this.storeChunk(chunk);
      chunkIds.push(chunk.id);
    }

    return chunkIds;
  }

  /**
   * Query context with semantic search
   */
  public async queryContext(query: ContextQuery): Promise<ContextResult> {
    const startTime = Date.now();
    this.stats.queries++;

    // Build candidate set from indexes
    let candidateIds = new Set<string>();

    if (query.agentId && this.agentIndex.has(query.agentId)) {
      candidateIds = new Set(this.agentIndex.get(query.agentId)!);
    } else if (query.sessionId && this.sessionIndex.has(query.sessionId)) {
      candidateIds = new Set(this.sessionIndex.get(query.sessionId)!);
    } else {
      candidateIds = new Set(this.chunkIndex.keys());
    }

    // Filter by semantic tags
    if (query.semanticTags && query.semanticTags.length > 0) {
      const taggedChunks = new Set<string>();
      for (const tag of query.semanticTags) {
        if (this.semanticIndex.has(tag)) {
          this.semanticIndex.get(tag)!.forEach(id => taggedChunks.add(id));
        }
      }
      candidateIds = new Set([...candidateIds].filter(id => taggedChunks.has(id)));
    }

    // Filter by type
    if (query.types && query.types.length > 0) {
      candidateIds = new Set(
        [...candidateIds].filter(id => {
          const index = this.chunkIndex.get(id);
          return index && query.types!.includes(index.type);
        })
      );
    }

    // Filter by priority
    if (query.priorityMin !== undefined) {
      candidateIds = new Set(
        [...candidateIds].filter(id => {
          const index = this.chunkIndex.get(id);
          return index && index.priority <= query.priorityMin!;
        })
      );
    }

    // Filter by time range
    if (query.timeRange) {
      candidateIds = new Set(
        [...candidateIds].filter(id => {
          const index = this.chunkIndex.get(id);
          return (
            index &&
            index.timestamp >= query.timeRange!.start &&
            index.timestamp <= query.timeRange!.end
          );
        })
      );
    }

    // Retrieve chunks (with LRU caching)
    const chunks: ContextChunk[] = [];
    let fromMemory = 0;
    let fromDisk = 0;
    let decompressed = 0;

    for (const chunkId of candidateIds) {
      if (query.limit && chunks.length >= query.limit) break;

      const chunk = await this.getChunk(chunkId);
      if (chunk) {
        chunks.push(chunk);
        const index = this.chunkIndex.get(chunkId)!;
        if (index.location === 'memory') fromMemory++;
        else if (index.location === 'compressed') decompressed++;
        else fromDisk++;
      }
    }

    // Include related chunks if requested
    if (query.includeRelated) {
      const relatedIds = new Set<string>();
      chunks.forEach(chunk => {
        chunk.references.forEach(refId => relatedIds.add(refId));
      });

      for (const refId of relatedIds) {
        if (query.limit && chunks.length >= query.limit) break;
        if (!candidateIds.has(refId)) {
          const chunk = await this.getChunk(refId);
          if (chunk) chunks.push(chunk);
        }
      }
    }

    // Sort by priority and timestamp
    chunks.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.timestamp - a.timestamp;
    });

    const retrievalTimeMs = Date.now() - startTime;
    this.stats.totalRetrievalTimeMs += retrievalTimeMs;

    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const compressionSavings = this.calculateCompressionSavings(chunks);

    return {
      chunks,
      totalSize,
      retrievalTimeMs,
      compressionSavings,
      metadata: {
        hitRate: fromMemory / Math.max(chunks.length, 1),
        fromMemory,
        fromDisk,
        decompressed,
      },
    };
  }

  /**
   * Get context for a specific agent across all sessions
   */
  public async getAgentContext(
    agentId: string,
    limit: number = 100
  ): Promise<ContextResult> {
    return this.queryContext({
      agentId,
      limit,
      includeRelated: true,
    });
  }

  /**
   * Get context for a specific session
   */
  public async getSessionContext(
    sessionId: string,
    limit: number = 100
  ): Promise<ContextResult> {
    return this.queryContext({
      sessionId,
      limit,
      includeRelated: true,
    });
  }

  /**
   * Share context between agents
   */
  public async shareContext(
    fromAgentId: string,
    toAgentId: string,
    chunkIds: string[]
  ): Promise<void> {
    if (!this.config.crossAgentSharing) {
      throw new Error('Cross-agent context sharing is disabled');
    }

    for (const chunkId of chunkIds) {
      const chunk = await this.getChunk(chunkId);
      if (chunk) {
        // Create a copy for the target agent
        const sharedChunk: ContextChunk = {
          ...chunk,
          id: this.generateChunkId(toAgentId, chunk.sessionId),
          agentId: toAgentId,
          metadata: {
            ...chunk.metadata,
            sharedFrom: fromAgentId,
            originalChunkId: chunkId,
          },
        };
        await this.storeChunk(sharedChunk);
      }
    }
  }

  /**
   * Compress old or low-priority context
   */
  public async compressContext(
    olderThanHours: number = 24,
    minPriority: ContextPriority = ContextPriority.LOW
  ): Promise<{ compressed: number; savedMB: number }> {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
    let compressed = 0;
    let savedBytes = 0;

    for (const [chunkId, index] of this.chunkIndex.entries()) {
      if (
        index.timestamp < cutoffTime &&
        index.priority >= minPriority &&
        index.compressionRatio === undefined
      ) {
        const chunk = await this.getChunk(chunkId);
        if (chunk && chunk.size > this.config.compressionThresholdKB * 1024) {
          const originalSize = chunk.size;
          await this.compressChunk(chunk);
          savedBytes += originalSize - chunk.size;
          compressed++;
        }
      }
    }

    return {
      compressed,
      savedMB: savedBytes / (1024 * 1024),
    };
  }

  /**
   * Get context statistics
   */
  public getStats(): ContextStats {
    const chunksByType: Record<ContextType, number> = {} as any;
    const chunksByPriority: Record<ContextPriority, number> = {} as any;

    for (const index of this.chunkIndex.values()) {
      chunksByType[index.type] = (chunksByType[index.type] || 0) + 1;
      chunksByPriority[index.priority] = (chunksByPriority[index.priority] || 0) + 1;
    }

    const totalSizeBytes = Array.from(this.chunkIndex.values()).reduce(
      (sum, idx) => sum + idx.size,
      0
    );

    return {
      totalChunks: this.chunkIndex.size,
      totalSizeMB: totalSizeBytes / (1024 * 1024),
      activeMemoryMB: this.currentMemoryUsageMB,
      diskStorageMB: (totalSizeBytes - this.currentMemoryUsageMB * 1024 * 1024) / (1024 * 1024),
      compressionRatio: this.calculateOverallCompressionRatio(),
      chunksByType,
      chunksByPriority,
      agentCount: this.agentIndex.size,
      sessionCount: this.sessionIndex.size,
      avgAccessTime: this.stats.totalRetrievalTimeMs / Math.max(this.stats.queries, 1),
      hitRate: this.stats.hits / Math.max(this.stats.queries, 1),
    };
  }

  /**
   * Clear context for a specific agent or session
   */
  public async clearContext(agentId?: string, sessionId?: string): Promise<number> {
    let cleared = 0;
    const toRemove: string[] = [];

    for (const [chunkId, index] of this.chunkIndex.entries()) {
      if ((agentId && index.agentId === agentId) || (sessionId && index.sessionId === sessionId)) {
        toRemove.push(chunkId);
      }
    }

    for (const chunkId of toRemove) {
      await this.removeChunk(chunkId);
      cleared++;
    }

    return cleared;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  private ensureDirectories(): void {
    [this.storageDir, this.indexDir, this.compressedDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadIndexes(): void {
    const indexFile = path.join(this.indexDir, 'main_index.json');
    if (fs.existsSync(indexFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(indexFile, 'utf8'));

        // Restore chunk index
        this.chunkIndex = new Map(Object.entries(data.chunkIndex || {}));

        // Rebuild semantic, agent, and session indexes
        for (const [chunkId, index] of this.chunkIndex.entries()) {
          const idx = index as ContextIndex;

          // Semantic index
          idx.semanticTags.forEach(tag => {
            if (!this.semanticIndex.has(tag)) {
              this.semanticIndex.set(tag, new Set());
            }
            this.semanticIndex.get(tag)!.add(chunkId);
          });

          // Agent index
          if (!this.agentIndex.has(idx.agentId)) {
            this.agentIndex.set(idx.agentId, new Set());
          }
          this.agentIndex.get(idx.agentId)!.add(chunkId);

          // Session index
          if (!this.sessionIndex.has(idx.sessionId)) {
            this.sessionIndex.set(idx.sessionId, new Set());
          }
          this.sessionIndex.get(idx.sessionId)!.add(chunkId);
        }
      } catch (error) {
        console.error('Error loading context indexes:', error);
      }
    }
  }

  private saveIndexes(): void {
    const indexFile = path.join(this.indexDir, 'main_index.json');
    const data = {
      chunkIndex: Object.fromEntries(this.chunkIndex.entries()),
      lastUpdated: Date.now(),
    };
    fs.writeFileSync(indexFile, JSON.stringify(data, null, 2));
  }

  private async storeChunk(chunk: ContextChunk): Promise<void> {
    // Check memory limit
    const chunkSizeMB = chunk.size / (1024 * 1024);
    if (this.currentMemoryUsageMB + chunkSizeMB > this.config.maxActiveMemoryMB) {
      await this.evictChunks(chunkSizeMB);
    }

    // Store in memory
    this.activeChunks.set(chunk.id, chunk);
    this.currentMemoryUsageMB += chunkSizeMB;

    // Update indexes
    const index: ContextIndex = {
      chunkId: chunk.id,
      agentId: chunk.agentId,
      sessionId: chunk.sessionId,
      type: chunk.type,
      priority: chunk.priority,
      semanticTags: chunk.semanticTags,
      timestamp: chunk.timestamp,
      size: chunk.size,
      location: 'memory',
    };

    this.chunkIndex.set(chunk.id, index);

    // Update semantic index
    chunk.semanticTags.forEach(tag => {
      if (!this.semanticIndex.has(tag)) {
        this.semanticIndex.set(tag, new Set());
      }
      this.semanticIndex.get(tag)!.add(chunk.id);
    });

    // Update agent index
    if (!this.agentIndex.has(chunk.agentId)) {
      this.agentIndex.set(chunk.agentId, new Set());
    }
    this.agentIndex.get(chunk.agentId)!.add(chunk.id);

    // Update session index
    if (!this.sessionIndex.has(chunk.sessionId)) {
      this.sessionIndex.set(chunk.sessionId, new Set());
    }
    this.sessionIndex.get(chunk.sessionId)!.add(chunk.id);

    // Persist to disk
    await this.persistChunk(chunk);

    // Save indexes periodically
    if (this.chunkIndex.size % 100 === 0) {
      this.saveIndexes();
    }
  }

  private async getChunk(chunkId: string): Promise<ContextChunk | null> {
    // Check memory cache first
    if (this.activeChunks.has(chunkId)) {
      this.stats.hits++;
      const chunk = this.activeChunks.get(chunkId)!;
      chunk.accessCount++;
      chunk.lastAccessed = Date.now();
      return chunk;
    }

    this.stats.misses++;

    // Load from disk
    const index = this.chunkIndex.get(chunkId);
    if (!index) return null;

    const chunk = await this.loadChunkFromDisk(chunkId);
    if (!chunk) return null;

    // Add to memory cache
    const chunkSizeMB = chunk.size / (1024 * 1024);
    if (this.currentMemoryUsageMB + chunkSizeMB > this.config.maxActiveMemoryMB) {
      await this.evictChunks(chunkSizeMB);
    }

    this.activeChunks.set(chunkId, chunk);
    this.currentMemoryUsageMB += chunkSizeMB;

    chunk.accessCount++;
    chunk.lastAccessed = Date.now();

    return chunk;
  }

  private async persistChunk(chunk: ContextChunk): Promise<void> {
    const filePath = path.join(
      this.storageDir,
      `${chunk.agentId}_${chunk.sessionId}_${chunk.id}.json`
    );
    fs.writeFileSync(filePath, JSON.stringify(chunk));
  }

  private async loadChunkFromDisk(chunkId: string): Promise<ContextChunk | null> {
    const index = this.chunkIndex.get(chunkId);
    if (!index) return null;

    const filePath = path.join(
      this.storageDir,
      `${index.agentId}_${index.sessionId}_${chunkId}.json`
    );

    if (!fs.existsSync(filePath)) return null;

    try {
      const chunk: ContextChunk = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Decompress if needed
      if (chunk.compressionLevel > 0) {
        await this.decompressChunk(chunk);
        this.stats.decompressions++;
      }

      return chunk;
    } catch (error) {
      console.error(`Error loading chunk ${chunkId}:`, error);
      return null;
    }
  }

  private async removeChunk(chunkId: string): Promise<void> {
    // Remove from memory
    if (this.activeChunks.has(chunkId)) {
      const chunk = this.activeChunks.get(chunkId)!;
      this.currentMemoryUsageMB -= chunk.size / (1024 * 1024);
      this.activeChunks.delete(chunkId);
    }

    // Remove from indexes
    const index = this.chunkIndex.get(chunkId);
    if (index) {
      // Semantic index
      index.semanticTags.forEach(tag => {
        this.semanticIndex.get(tag)?.delete(chunkId);
      });

      // Agent index
      this.agentIndex.get(index.agentId)?.delete(chunkId);

      // Session index
      this.sessionIndex.get(index.sessionId)?.delete(chunkId);

      this.chunkIndex.delete(chunkId);
    }

    // Remove from disk
    if (index) {
      const filePath = path.join(
        this.storageDir,
        `${index.agentId}_${index.sessionId}_${chunkId}.json`
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  private async evictChunks(requiredMB: number): Promise<void> {
    const candidates: Array<{ id: string; score: number }> = [];

    for (const [chunkId, chunk] of this.activeChunks.entries()) {
      const score = this.calculateEvictionScore(chunk);
      candidates.push({ id: chunkId, score });
    }

    // Sort by eviction score (higher = more likely to evict)
    candidates.sort((a, b) => b.score - a.score);

    let freedMB = 0;
    for (const candidate of candidates) {
      if (freedMB >= requiredMB) break;

      const chunk = this.activeChunks.get(candidate.id);
      if (!chunk) continue;

      // Never evict critical chunks
      if (chunk.priority === ContextPriority.CRITICAL) continue;

      const chunkSizeMB = chunk.size / (1024 * 1024);
      this.activeChunks.delete(candidate.id);
      this.currentMemoryUsageMB -= chunkSizeMB;
      freedMB += chunkSizeMB;
      this.stats.evictions++;

      // Update index location
      const index = this.chunkIndex.get(candidate.id);
      if (index) {
        index.location = 'disk';
      }
    }
  }

  private calculateEvictionScore(chunk: ContextChunk): number {
    const ageSeconds = (Date.now() - chunk.lastAccessed) / 1000;
    const ageFactor = ageSeconds / 3600; // hours

    let score = ageFactor;

    // Factor in priority (lower priority = higher score)
    score *= chunk.priority;

    // Factor in access frequency (less accessed = higher score)
    score /= Math.max(chunk.accessCount, 1);

    return score;
  }

  private async compressChunk(chunk: ContextChunk): Promise<void> {
    // Simple compression: remove extra whitespace, summarize if needed
    const originalSize = chunk.size;

    // Level 1: Remove extra whitespace
    let compressed = chunk.content.replace(/\s+/g, ' ').trim();

    // Level 2+: Progressive summarization (placeholder for actual compression)
    if (chunk.compressionLevel > 1) {
      // TODO: Implement actual compression (e.g., gzip, or AI summarization)
      compressed = compressed.substring(0, compressed.length * 0.7);
    }

    chunk.content = compressed;
    chunk.size = Buffer.byteLength(compressed, 'utf8');
    chunk.compressionLevel++;

    await this.persistChunk(chunk);

    // Update index
    const index = this.chunkIndex.get(chunk.id);
    if (index) {
      index.size = chunk.size;
      index.compressionRatio = originalSize / chunk.size;
      index.location = 'compressed';
    }

    this.stats.compressions++;
  }

  private async decompressChunk(chunk: ContextChunk): Promise<void> {
    // Placeholder - in practice, would decompress or fetch original
    chunk.compressionLevel = 0;
  }

  private chunkContent(content: string): string[] {
    const chunks: string[] = [];
    const chunkSize = this.config.chunkSize;
    const overlapSize = this.config.overlapSize;

    let start = 0;
    while (start < content.length) {
      const end = Math.min(start + chunkSize, content.length);
      chunks.push(content.substring(start, end));
      start += chunkSize - overlapSize;
    }

    return chunks;
  }

  private generateChunkId(agentId: string, sessionId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `${agentId}_${sessionId}_${timestamp}_${random}`;
  }

  private extractSemanticTags(content: string, type: ContextType): string[] {
    const tags: Set<string> = new Set();

    tags.add(type);

    // Extract common programming keywords
    const keywords = [
      'function',
      'class',
      'interface',
      'async',
      'await',
      'error',
      'bug',
      'fix',
      'TODO',
      'FIXME',
      'test',
      'import',
      'export',
    ];

    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        tags.add(keyword.toLowerCase());
      }
    }

    // Extract file extensions
    const extMatches = content.match(/\.(ts|js|py|java|cpp|go|rs|md|json|yaml)\b/g);
    if (extMatches) {
      extMatches.forEach(ext => tags.add(ext.substring(1)));
    }

    return Array.from(tags);
  }

  private calculateCompressionSavings(chunks: ContextChunk[]): number {
    let saved = 0;
    for (const chunk of chunks) {
      const index = this.chunkIndex.get(chunk.id);
      if (index?.compressionRatio) {
        const originalSize = chunk.size * index.compressionRatio;
        saved += originalSize - chunk.size;
      }
    }
    return saved;
  }

  private calculateOverallCompressionRatio(): number {
    let totalOriginal = 0;
    let totalCompressed = 0;

    for (const index of this.chunkIndex.values()) {
      if (index.compressionRatio) {
        totalOriginal += index.size * index.compressionRatio;
        totalCompressed += index.size;
      }
    }

    return totalCompressed > 0 ? totalOriginal / totalCompressed : 1.0;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ContextChunk,
  ContextType,
  ContextPriority,
  ContextWindowConfig,
  ContextIndex,
  ContextQuery,
  ContextResult,
  ContextStats,
};

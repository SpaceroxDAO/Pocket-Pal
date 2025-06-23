# Vector Storage API Specification

## 📋 Overview

This document defines the API specifications for the Vector Storage system in PocketPal SuperAI, providing high-performance vector database operations optimized for mobile devices with HNSW (Hierarchical Navigable Small World) indexing based on TIC-13's implementation analysis.

**Version**: 1.0  
**Status**: Specification  
**Based on**: TIC-13 HNSW implementation + mobile vector storage analysis  

## 🏗️ Architecture Overview

The Vector Storage API provides efficient vector operations including storage, indexing, similarity search, and metadata management optimized for mobile device constraints while maintaining sub-100ms search performance.

### Core Components
- **Vector Index**: HNSW-based indexing for fast similarity search
- **Storage Engine**: Optimized SQLite storage with vector extensions
- **Compression**: Vector quantization and compression for mobile storage
- **Metadata Management**: Rich metadata storage and filtering capabilities
- **Memory Management**: Efficient memory usage with lazy loading
- **Batch Operations**: Bulk operations for efficient processing

## 🗄️ Vector Storage API

#### Store Vector
```typescript
POST /api/vectors/store

interface StoreVectorRequest {
  vector: number[];                           // Vector embeddings (float array)
  metadata: {
    id: string;                              // Unique identifier
    documentId?: string;                     // Source document
    chunkId?: string;                        // Source chunk
    content?: string;                        // Original text content
    type?: string;                           // Content type
    timestamp?: string;                      // Creation timestamp
    tags?: string[];                         // Search tags
    custom?: object;                         // Custom metadata
  };
  normalize?: boolean;                       // Normalize vector (default: true)
  compress?: boolean;                        // Apply compression (default: true)
}

interface StoreVectorResponse {
  vectorId: string;                          // Generated vector ID
  stored: boolean;
  dimensions: number;                        // Vector dimensions
  compressed: boolean;                       // Whether compression was applied
  compressionRatio?: number;                 // If compressed
  indexUpdated: boolean;                     // Whether index was updated
  storageUsed: number;                       // Bytes used for this vector
}
```

#### Batch Store Vectors
```typescript
POST /api/vectors/store/batch

interface BatchStoreRequest {
  vectors: Array<{
    vector: number[];
    metadata: object;
  }>;
  options?: {
    batchSize?: number;                      // Processing batch size
    normalize?: boolean;
    compress?: boolean;
    updateIndex?: boolean;                   // Update index after batch
  };
}

interface BatchStoreResponse {
  batchId: string;
  status: 'processing' | 'completed' | 'error';
  progress: {
    total: number;
    processed: number;
    failed: number;
    percentage: number;
  };
  results: Array<{
    vectorId?: string;
    success: boolean;
    error?: string;
  }>;
  performance: {
    processingTime: number;                  // milliseconds
    vectorsPerSecond: number;
    storageUsed: number;                     // Total bytes
  };
}
```

## 🔍 Vector Search API

#### Similarity Search
```typescript
POST /api/vectors/search

interface VectorSearchRequest {
  query: {
    vector?: number[];                       // Direct vector query
    text?: string;                          // Text to embed and search
    embedModel?: string;                    // Embedding model for text
  };
  options: {
    k?: number;                             // Number of results (default: 10)
    threshold?: number;                     // Similarity threshold 0-1
    maxDistance?: number;                   // Maximum distance
    algorithm?: 'hnsw' | 'brute_force';    // Search algorithm
  };
  filter?: {
    documentIds?: string[];                 // Filter by document
    tags?: string[];                        // Filter by tags
    type?: string;                          // Filter by content type
    dateRange?: {
      start: string;
      end: string;
    };
    custom?: object;                        // Custom metadata filters
  };
  include?: {
    vector?: boolean;                       // Include vectors in response
    metadata?: boolean;                     // Include metadata
    content?: boolean;                      // Include original content
    similarity?: boolean;                   // Include similarity scores
  };
}

interface VectorSearchResponse {
  results: Array<{
    vectorId: string;
    similarity: number;                     // Cosine similarity 0-1
    distance: number;                       // Vector distance
    rank: number;                           // Result ranking
    vector?: number[];                      // If requested
    metadata?: object;                      // If requested
    content?: string;                       // If requested
  }>;
  performance: {
    searchTime: number;                     // milliseconds
    indexTime: number;                      // Index search time
    filterTime: number;                     // Filter application time
    totalCandidates: number;                // Candidates considered
    algorithmsUsed: string[];               // Search algorithms used
  };
  query: {
    normalizedVector?: number[];            // Query vector used
    dimensions: number;
    filters: object;                        // Applied filters
  };
}
```

#### Batch Search
```typescript
POST /api/vectors/search/batch

interface BatchSearchRequest {
  queries: Array<{
    id: string;                             // Query identifier
    vector?: number[];
    text?: string;
    options?: object;                       // Per-query options
    filter?: object;                        // Per-query filters
  }>;
  defaultOptions?: object;                  // Default options for all queries
  defaultFilter?: object;                   // Default filters for all queries
}

interface BatchSearchResponse {
  batchId: string;
  results: Array<{
    queryId: string;
    results: Array<VectorSearchResult>;
    performance: object;
    error?: string;
  }>;
  aggregate: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageSearchTime: number;              // milliseconds
    totalSearchTime: number;
  };
}
```

## 📊 Vector Index API

#### Build Index
```typescript
POST /api/vectors/index/build

interface BuildIndexRequest {
  algorithm: 'hnsw' | 'faiss' | 'annoy';
  parameters?: {
    // HNSW parameters
    hnsw?: {
      efConstruction?: number;              // Default: 200
      maxConnections?: number;              // Default: 16
      efSearch?: number;                    // Default: 50
      levels?: number;                      // Default: auto
    };
    // FAISS parameters
    faiss?: {
      nlist?: number;                       // Number of clusters
      nprobe?: number;                      // Number of probes
    };
  };
  background?: boolean;                     // Build in background
  optimize?: boolean;                       // Optimize for mobile
}

interface BuildIndexResponse {
  taskId: string;
  status: 'queued' | 'building' | 'completed' | 'error';
  algorithm: string;
  parameters: object;
  progress: {
    phase: string;                          // Current build phase
    percentage: number;                     // 0-100
    vectorsProcessed: number;
    estimatedCompletion: string;
  };
  performance: {
    buildTime?: number;                     // milliseconds when completed
    indexSize: number;                      // Index size in bytes
    memoryUsage: number;                    // Peak memory usage
  };
}
```

#### Get Index Status
```typescript
GET /api/vectors/index/status

interface IndexStatusResponse {
  status: 'empty' | 'building' | 'ready' | 'error' | 'rebuilding';
  algorithm: string;
  parameters: object;
  statistics: {
    totalVectors: number;
    dimensions: number;
    indexSize: number;                      // Bytes
    buildTime: number;                      // milliseconds
    lastUpdated: string;
  };
  performance: {
    averageSearchTime: number;              // milliseconds
    searchAccuracy: number;                 // 0-1
    memoryUsage: number;                    // Current memory usage
    diskUsage: number;                      // Disk space used
  };
  health: {
    integrity: boolean;                     // Index integrity
    corruption: boolean;                    // Corruption detected
    optimization: number;                   // Optimization score 0-100
  };
}
```

#### Optimize Index
```typescript
POST /api/vectors/index/optimize

interface OptimizeIndexRequest {
  operations: Array<'compact' | 'rebalance' | 'prune' | 'compress'>;
  aggressive?: boolean;                     // Aggressive optimization
  background?: boolean;                     // Run in background
  targetMetrics?: {
    maxSize?: number;                       // Maximum index size
    maxSearchTime?: number;                 // Maximum search time ms
    minAccuracy?: number;                   // Minimum accuracy 0-1
  };
}

interface OptimizeIndexResponse {
  taskId: string;
  operations: string[];
  status: 'optimizing' | 'completed' | 'error';
  improvements: {
    sizeReduction: number;                  // Percentage
    speedImprovement: number;               // Percentage
    accuracyChange: number;                 // Percentage change
  };
  before: {
    size: number;
    searchTime: number;
    accuracy: number;
  };
  after?: {
    size: number;
    searchTime: number;
    accuracy: number;
  };
}
```

## 🗂️ Metadata Management API

#### Update Vector Metadata
```typescript
PUT /api/vectors/{vectorId}/metadata

interface UpdateMetadataRequest {
  metadata: object;                         // New metadata
  merge?: boolean;                         // Merge with existing (default: false)
  indexUpdate?: boolean;                   // Update search index
}

interface UpdateMetadataResponse {
  vectorId: string;
  updated: boolean;
  changes: Array<{
    field: string;
    from: any;
    to: any;
  }>;
  indexUpdated: boolean;
}
```

#### Query by Metadata
```typescript
POST /api/vectors/query/metadata

interface MetadataQueryRequest {
  filter: {
    equals?: object;                        // Exact matches
    contains?: object;                      // Contains values
    range?: {
      [field: string]: {
        min?: any;
        max?: any;
      };
    };
    exists?: string[];                      // Fields that must exist
    missing?: string[];                     // Fields that must not exist
  };
  sort?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
  pagination?: {
    offset?: number;
    limit?: number;                         // Default: 100
  };
  include?: {
    vector?: boolean;
    content?: boolean;
    statistics?: boolean;
  };
}

interface MetadataQueryResponse {
  vectors: Array<{
    vectorId: string;
    metadata: object;
    vector?: number[];
    content?: string;
    statistics?: {
      createdAt: string;
      lastAccessed: string;
      accessCount: number;
    };
  }>;
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
  performance: {
    queryTime: number;                      // milliseconds
    indexHits: number;
    scanCount: number;
  };
}
```

## 📊 Storage Management API

#### Get Storage Statistics
```typescript
GET /api/vectors/storage/stats

interface StorageStatsResponse {
  overview: {
    totalVectors: number;
    totalDimensions: number;
    storageUsed: number;                    // Bytes
    indexSize: number;                      // Bytes
    compressionRatio: number;               // Overall compression
  };
  distribution: {
    byType: {
      [type: string]: {
        count: number;
        storage: number;
      };
    };
    bySize: Array<{
      range: string;                        // Size range
      count: number;
      percentage: number;
    }>;
    byAge: Array<{
      period: string;                       // Time period
      count: number;
      storage: number;
    }>;
  };
  performance: {
    averageVectorSize: number;              // Bytes
    averageCompressionRatio: number;
    storageEfficiency: number;              // 0-100 score
    indexEfficiency: number;                // 0-100 score
  };
  predictions: {
    growthRate: number;                     // Vectors per day
    estimatedFullAt?: string;               // When storage will be full
    recommendedCleanup: boolean;
  };
}
```

#### Cleanup Storage
```typescript
POST /api/vectors/storage/cleanup

interface CleanupRequest {
  strategy: {
    removeOrphaned?: boolean;               // Remove vectors without metadata
    removeDuplicates?: boolean;             // Remove duplicate vectors
    removeOld?: {
      olderThan: string;                    // ISO date or duration
      keepMinimum?: number;                 // Minimum vectors to keep
    };
    removeUnused?: {
      notAccessedFor: string;               // Duration
      accessThreshold?: number;             // Minimum access count
    };
    compressVectors?: boolean;              // Apply/reapply compression
    optimizeIndex?: boolean;                // Optimize index after cleanup
  };
  dryRun?: boolean;                        // Preview changes without applying
  background?: boolean;                    // Run in background
}

interface CleanupResponse {
  taskId: string;
  status: 'analyzing' | 'cleaning' | 'completed' | 'error';
  preview?: {
    vectorsToRemove: number;
    storageToFree: number;                  // Bytes
    estimatedTime: number;                  // seconds
  };
  results?: {
    vectorsRemoved: number;
    storageFreed: number;                   // Bytes
    indexOptimized: boolean;
    compressionImproved: number;            // Percentage
  };
  performance: {
    processingTime: number;                 // milliseconds
    operationsPerformed: string[];
  };
}
```

## 🔧 Vector Operations API

#### Get Vector
```typescript
GET /api/vectors/{vectorId}

interface GetVectorResponse {
  vectorId: string;
  vector: number[];
  metadata: object;
  statistics: {
    dimensions: number;
    magnitude: number;                      // Vector magnitude
    compressed: boolean;
    compressionRatio?: number;
    createdAt: string;
    lastAccessed: string;
    accessCount: number;
  };
  relationships?: {
    similarVectors: Array<{
      vectorId: string;
      similarity: number;
    }>;
    clusters?: Array<{
      clusterId: string;
      distance: number;
    }>;
  };
}
```

#### Update Vector
```typescript
PUT /api/vectors/{vectorId}

interface UpdateVectorRequest {
  vector?: number[];                        // New vector values
  metadata?: object;                        // New metadata
  normalize?: boolean;                      // Normalize updated vector
  updateIndex?: boolean;                    // Update search index
}

interface UpdateVectorResponse {
  vectorId: string;
  updated: boolean;
  changes: {
    vectorChanged: boolean;
    metadataChanged: boolean;
    indexUpdated: boolean;
  };
  performance: {
    updateTime: number;                     // milliseconds
    indexUpdateTime?: number;
  };
}
```

#### Delete Vector
```typescript
DELETE /api/vectors/{vectorId}

interface DeleteVectorRequest {
  updateIndex?: boolean;                    // Update index immediately
  cascade?: boolean;                        // Delete related vectors
}

interface DeleteVectorResponse {
  vectorId: string;
  deleted: boolean;
  cascade?: {
    vectorsDeleted: number;
    idsDeleted: string[];
  };
  indexUpdated: boolean;
  storageFreed: number;                     // Bytes freed
}
```

## ⚙️ Configuration API

#### Vector Storage Configuration
```typescript
GET /api/vectors/config
PUT /api/vectors/config

interface VectorStorageConfig {
  storage: {
    engine: 'sqlite' | 'file' | 'memory';
    path?: string;                          // Storage location
    maxSize?: number;                       // Maximum storage size (MB)
    autoCleanup: boolean;                   // Auto cleanup when full
    compression: {
      enabled: boolean;
      algorithm: 'quantization' | 'pca' | 'none';
      ratio: number;                        // Target compression ratio
    };
  };
  indexing: {
    algorithm: 'hnsw' | 'faiss' | 'annoy';
    autoRebuild: boolean;                   // Auto rebuild when needed
    rebuildThreshold: number;               // Vectors added before rebuild
    parameters: object;                     // Algorithm-specific parameters
    memoryLimit: number;                    // Memory limit for indexing (MB)
  };
  search: {
    defaultK: number;                       // Default result count
    maxK: number;                          // Maximum result count
    defaultThreshold: number;               // Default similarity threshold
    caching: {
      enabled: boolean;
      maxSize: number;                      // Cache size (MB)
      ttl: number;                          // Cache TTL (seconds)
    };
  };
  performance: {
    batchSize: number;                      // Default batch size
    maxConcurrency: number;                 // Max concurrent operations
    timeout: number;                        // Operation timeout (ms)
    memoryPool: number;                     // Memory pool size (MB)
  };
  maintenance: {
    autoOptimize: boolean;                  // Auto optimize index
    optimizeSchedule?: string;              // Cron schedule
    statisticsCollection: boolean;          // Collect usage statistics
    performanceMonitoring: boolean;         // Monitor performance metrics
  };
}
```

## 🔒 Error Handling

### Standard Error Response
```typescript
interface VectorError {
  error: {
    code: string;
    message: string;
    details?: object;
    timestamp: string;
    requestId: string;
  };
}
```

### Error Codes
| Code | Description | Action |
|------|-------------|---------|
| `VECTOR_001` | Invalid vector dimensions | Check vector size |
| `VECTOR_002` | Vector not found | Verify vector ID |
| `VECTOR_003` | Index not ready | Wait for index build |
| `VECTOR_004` | Storage full | Clean up or expand storage |
| `VECTOR_005` | Search timeout | Reduce query complexity |
| `VECTOR_006` | Index corruption | Rebuild index |
| `VECTOR_007` | Memory limit exceeded | Reduce batch size |
| `VECTOR_008` | Invalid metadata format | Check metadata schema |
| `VECTOR_009` | Compression failed | Disable compression |
| `VECTOR_010` | Concurrent modification | Retry operation |

## 📱 Mobile-Specific Features

### Memory Management
```typescript
interface MemoryManagement {
  lazyLoading: boolean;                     // Load vectors on demand
  memoryPool: number;                       // Pre-allocated memory pool
  swapping: {
    enabled: boolean;                       // Enable memory swapping
    threshold: number;                      // Swap threshold (MB)
    strategy: 'lru' | 'random' | 'priority';
  };
  garbage_collection: {
    automatic: boolean;                     // Auto GC
    threshold: number;                      // GC trigger threshold
    interval: number;                       // GC interval (seconds)
  };
}
```

### Platform Optimizations
```typescript
// iOS-specific optimizations
interface iOSOptimizations {
  useAccelerate: boolean;                   // Use Accelerate framework
  neuralEngine: boolean;                    // Use Neural Engine
  memoryWarnings: boolean;                  // Handle memory warnings
}

// Android-specific optimizations
interface AndroidOptimizations {
  useNNAPI: boolean;                        // Use Android NNAPI
  renderScript: boolean;                    // Use RenderScript
  lowMemoryHandling: boolean;               // Handle low memory
}
```

## 🚀 Performance Benchmarks

### Target Performance Metrics
| Operation | Target Time | Mobile Optimized |
|-----------|-------------|------------------|
| **Vector Store** | <10ms | ✅ |
| **Similarity Search** | <100ms | ✅ |
| **Index Build** | <5min per 100k vectors | ✅ |
| **Batch Operations** | >1000 vectors/sec | ✅ |
| **Memory Usage** | <200MB for 100k vectors | ✅ |

### HNSW Implementation Example
```typescript
// Based on TIC-13 analysis
const hnswConfig = {
  efConstruction: 200,        // Build-time search width
  maxConnections: 16,         // Connections per node
  efSearch: 50,              // Search-time width
  levels: 4,                 // Index levels
  distance: 'cosine'         // Distance metric
};

// Performance tuning for mobile
const mobileOptimizations = {
  memoryPool: 100,           // 100MB memory pool
  batchSize: 1000,           // Process 1000 vectors at once
  compression: true,         // Enable vector compression
  lazyLoading: true,         // Load vectors on demand
  cacheSize: 50             // 50MB search cache
};
```

---

**API Version**: 1.0  
**Last Updated**: June 23, 2025  
**Implementation Status**: Specification Complete  
**Based on Research**: TIC-13 HNSW implementation analysis  
**Next Phase**: Integration with RAG API and mobile implementation
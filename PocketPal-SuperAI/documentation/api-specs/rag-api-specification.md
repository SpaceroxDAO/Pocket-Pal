# RAG API Specification

## 📋 Overview

This document defines the API specifications for the RAG (Retrieval-Augmented Generation) system in PocketPal SuperAI, based on comprehensive analysis of TIC-13's implementation patterns and mobile-optimized RAG architecture.

**Version**: 1.0  
**Status**: Specification  
**Based on**: TIC-13 RAG implementation analysis  

## 🏗️ Architecture Overview

The RAG API provides document processing, vector storage, semantic search, and context retrieval capabilities optimized for mobile devices with complete local processing for privacy.

### Core Components
- **Document Processing Pipeline**: Text chunking, preprocessing, and optimization
- **Vector Generation**: Local embedding generation using TFLite models
- **Vector Storage**: Mobile-optimized HNSW-based vector database
- **Semantic Search**: Sub-100ms similarity search with relevance scoring
- **Context Injection**: Intelligent context augmentation for AI responses

## 📚 API Endpoints

### Document Management API

#### Ingest Document
```typescript
POST /api/rag/documents/ingest

interface IngestDocumentRequest {
  documentPath: string;          // Local file path
  documentType: 'pdf' | 'txt' | 'md' | 'web';
  chunkSize?: number;           // Default: 500 characters
  chunkOverlap?: number;        // Default: 50 characters
  metadata?: {
    title?: string;
    author?: string;
    tags?: string[];
    source?: string;
  };
}

interface IngestDocumentResponse {
  documentId: string;
  status: 'success' | 'processing' | 'error';
  chunksCreated: number;
  processingTime: number;       // milliseconds
  vectorsGenerated: number;
  storageUsed: number;          // bytes
  error?: string;
}
```

#### List Documents
```typescript
GET /api/rag/documents

interface ListDocumentsResponse {
  documents: Array<{
    id: string;
    title: string;
    type: string;
    chunksCount: number;
    createdAt: string;
    lastAccessed: string;
    metadata: object;
  }>;
  totalDocuments: number;
  totalChunks: number;
  storageUsed: number;
}
```

#### Delete Document
```typescript
DELETE /api/rag/documents/{documentId}

interface DeleteDocumentResponse {
  success: boolean;
  chunksRemoved: number;
  storageFreed: number;
  error?: string;
}
```

### Vector Operations API

#### Generate Embedding
```typescript
POST /api/rag/vectors/embed

interface EmbedRequest {
  text: string;
  model?: string;               // Default: 'sentence-transformers-mobile'
  normalize?: boolean;          // Default: true
}

interface EmbedResponse {
  embedding: number[];          // Float array
  dimensions: number;
  model: string;
  processingTime: number;       // milliseconds
}
```

#### Search Vectors
```typescript
POST /api/rag/vectors/search

interface VectorSearchRequest {
  query: string;                // Text query for embedding
  queryVector?: number[];       // Or direct vector input
  limit?: number;               // Default: 5, Max: 20
  threshold?: number;           // Similarity threshold 0-1
  filter?: {
    documentIds?: string[];
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

interface VectorSearchResponse {
  results: Array<{
    chunkId: string;
    documentId: string;
    content: string;
    similarity: number;          // 0-1 score
    metadata: {
      title: string;
      source: string;
      position: number;          // Chunk position in document
    };
  }>;
  searchTime: number;           // milliseconds
  totalMatches: number;
}
```

### Context Retrieval API

#### Get Context for Query
```typescript
POST /api/rag/context/retrieve

interface ContextRetrievalRequest {
  query: string;
  maxContextLength?: number;    // Default: 2000 characters
  maxChunks?: number;          // Default: 3
  diversityFactor?: number;    // 0-1, higher = more diverse results
  includeMetadata?: boolean;   // Default: true
}

interface ContextRetrievalResponse {
  context: {
    text: string;              // Formatted context for AI prompt
    chunks: Array<{
      content: string;
      source: string;
      similarity: number;
    }>;
    totalLength: number;       // Character count
    relevanceScore: number;    // Aggregated relevance 0-1
  };
  processingTime: number;
}
```

#### Generate Enhanced Prompt
```typescript
POST /api/rag/context/enhance-prompt

interface EnhancePromptRequest {
  userQuery: string;
  systemPrompt?: string;
  context?: string;            // Auto-retrieved if not provided
  template?: 'default' | 'technical' | 'creative' | 'analytical';
}

interface EnhancePromptResponse {
  enhancedPrompt: string;
  contextUsed: string;
  promptLength: number;
  confidence: number;          // Context relevance 0-1
}
```

## 🔧 Configuration API

#### RAG System Configuration
```typescript
GET /api/rag/config
PUT /api/rag/config

interface RAGConfig {
  embedding: {
    model: string;             // Model identifier
    dimensions: number;        // Vector dimensions
    batchSize: number;         // Processing batch size
  };
  vectorStore: {
    algorithm: 'hnsw' | 'faiss';
    hnswParams?: {
      efConstruction: number;  // Default: 200
      maxConnections: number;  // Default: 16
    };
  };
  chunking: {
    defaultSize: number;       // Default chunk size
    defaultOverlap: number;    // Default overlap
    maxChunkSize: number;      // Maximum allowed
  };
  search: {
    defaultLimit: number;      // Default results
    maxLimit: number;          // Maximum results
    defaultThreshold: number;  // Similarity threshold
  };
  performance: {
    maxMemoryUsage: number;    // MB
    searchTimeout: number;     // milliseconds
    indexingBatchSize: number;
  };
}
```

## 📊 Status and Health API

#### System Status
```typescript
GET /api/rag/status

interface RAGStatus {
  status: 'ready' | 'indexing' | 'error' | 'initializing';
  performance: {
    documentsIndexed: number;
    totalChunks: number;
    vectorsStored: number;
    memoryUsage: number;       // MB
    diskUsage: number;         // MB
    averageSearchTime: number; // milliseconds
  };
  health: {
    embeddingModel: 'loaded' | 'loading' | 'error';
    vectorIndex: 'ready' | 'building' | 'error';
    storage: 'available' | 'low' | 'full';
  };
  lastUpdated: string;
}
```

#### Performance Metrics
```typescript
GET /api/rag/metrics

interface RAGMetrics {
  performance: {
    searchMetrics: {
      averageTime: number;
      p95Time: number;
      p99Time: number;
      totalSearches: number;
    };
    indexingMetrics: {
      documentsPerSecond: number;
      vectorsPerSecond: number;
      averageIndexTime: number;
    };
  };
  usage: {
    topDocuments: Array<{
      documentId: string;
      title: string;
      accessCount: number;
      lastAccessed: string;
    }>;
    topQueries: Array<{
      query: string;
      count: number;
      averageRelevance: number;
    }>;
  };
}
```

## 🚀 Advanced Operations API

#### Batch Operations
```typescript
POST /api/rag/batch/ingest

interface BatchIngestRequest {
  documents: Array<{
    path: string;
    type: string;
    metadata?: object;
  }>;
  concurrency?: number;        // Default: 3
  priority?: 'high' | 'normal' | 'low';
}

interface BatchIngestResponse {
  batchId: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: {
    total: number;
    completed: number;
    failed: number;
    estimated_completion: string;
  };
}
```

#### Index Optimization
```typescript
POST /api/rag/index/optimize

interface OptimizeIndexRequest {
  action: 'rebuild' | 'compact' | 'rebalance';
  backgroundMode?: boolean;    // Default: true
}

interface OptimizeIndexResponse {
  taskId: string;
  estimatedTime: number;       // minutes
  status: 'started' | 'queued';
}
```

## 🔒 Error Handling

### Standard Error Response
```typescript
interface RAGError {
  error: {
    code: string;              // Error code
    message: string;           // Human-readable message
    details?: object;          // Additional context
    timestamp: string;
    requestId: string;
  };
}
```

### Error Codes
| Code | Description | Action |
|------|-------------|---------|
| `RAG_001` | Document parsing failed | Check document format |
| `RAG_002` | Embedding generation failed | Verify model availability |
| `RAG_003` | Vector storage full | Clean up old documents |
| `RAG_004` | Search timeout | Reduce query complexity |
| `RAG_005` | Index corruption detected | Rebuild index |
| `RAG_006` | Memory limit exceeded | Reduce batch size |

## 📱 Mobile-Specific Considerations

### Performance Optimizations
- **Lazy Loading**: Load embeddings on-demand
- **Memory Management**: Automatic cleanup of unused vectors
- **Background Processing**: Non-blocking document ingestion
- **Progressive Indexing**: Incremental index building

### Storage Management
```typescript
interface StorageInfo {
  used: number;              // Bytes used
  available: number;         // Bytes available
  efficiency: number;        // Compression ratio
  autoCleanup: boolean;      // Auto-cleanup enabled
}
```

### Platform-Specific APIs
```typescript
// iOS-specific
interface iOSRAGConfig {
  useNeuralEngine: boolean;    // Use iOS Neural Engine
  backgroundProcessing: boolean;
}

// Android-specific
interface AndroidRAGConfig {
  useNNAPI: boolean;          // Use Android NNAPI
  optimizeForBattery: boolean;
}
```

## 🔧 SDK Implementation Example

### TypeScript SDK Usage
```typescript
import { RAGClient } from 'pocketpal-superai-rag';

const rag = new RAGClient({
  baseUrl: 'file://local-rag-service',
  config: {
    embedding: { model: 'mobile-sentence-transformer' },
    search: { defaultLimit: 5 }
  }
});

// Ingest document
const result = await rag.ingestDocument({
  documentPath: '/path/to/document.pdf',
  documentType: 'pdf',
  metadata: { title: 'Important Document' }
});

// Search for context
const context = await rag.retrieveContext({
  query: "How do I configure the AI model?",
  maxChunks: 3
});

// Use context in AI conversation
const enhancedPrompt = await rag.enhancePrompt({
  userQuery: "How do I configure the AI model?",
  template: 'technical'
});
```

## 📋 Implementation Notes

### Based on TIC-13 Analysis
- **HNSW Algorithm**: Primary vector indexing algorithm
- **TFLite Models**: Mobile-optimized embedding generation
- **Local Processing**: Complete privacy with no cloud dependencies
- **React Native Bridge**: TypeScript to native code communication

### Performance Targets
- **Search Response**: <100ms for queries
- **Document Ingestion**: <30 seconds for 10MB PDFs
- **Memory Usage**: <500MB additional RAM
- **Storage Efficiency**: 10:1 compression ratio

### Integration Requirements
- Must integrate with voice processing API
- Support for real-time context injection
- Compatible with sultanqasim optimizations
- Cross-platform iOS/Android support

---

**API Version**: 1.0  
**Last Updated**: June 23, 2025  
**Implementation Status**: Specification Complete  
**Based on Research**: TIC-13 comprehensive analysis  
**Next Phase**: Implementation and testing
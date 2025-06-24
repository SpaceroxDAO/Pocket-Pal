/**
 * RAG Native Bridge
 * 
 * Based on TIC-13 RAG native interface patterns from:
 * - resources/fork-repositories/tic13-rag-pocketpal-ai/src/native/Rag.ts
 * - Native module bridge for vector operations and RAG functionality
 * 
 * Provides interface to native RAG implementations for iOS and Android.
 */

import { NativeModules } from "react-native";

export interface RagModuleType {
  // Index management
  isLoaded: () => Promise<boolean>;
  loadFromInternalStorage: (tokenizerPath: string, vectorsPath: string, chunksPath: string) => Promise<boolean>;
  loadFromAssets: (tokenizerPath: string, vectorsPath: string, chunksPath: string) => Promise<boolean>;
  
  // Document processing
  processDocument: (content: string, metadata: DocumentMetadata) => Promise<ProcessingResult>;
  
  // Embedding generation
  generateEmbedding: (text: string) => Promise<Float32Array>;
  generateEmbeddings: (texts: string[]) => Promise<Float32Array[]>;
  
  // Vector search
  searchSimilar: (embedding: Float32Array, k?: number, threshold?: number) => Promise<SearchResult[]>;
  
  // Query processing (main RAG function)
  getPrompt: (query: string, k?: number) => Promise<string>;
  
  // Index operations
  buildIndex: () => Promise<boolean>;
  saveIndex: (path: string) => Promise<boolean>;
  loadIndex: (path: string) => Promise<boolean>;
  
  // Statistics
  getIndexStats: () => Promise<IndexStats>;
  
  // Configuration
  updateConfig: (config: RagConfig) => Promise<boolean>;
  getConfig: () => Promise<RagConfig>;
  
  // Cleanup
  clearIndex: () => Promise<void>;
  cleanup: () => Promise<void>;
}

export interface DocumentMetadata {
  title: string;
  sourceType: 'pdf' | 'text' | 'web' | 'file';
  sourcePath: string;
  fileSize?: number;
  mimeType?: string;
}

export interface ProcessingResult {
  documentId: string;
  chunkCount: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface SearchResult {
  chunkId: string;
  content: string;
  distance: number;
  similarity: number;
  metadata?: Record<string, any>;
}

export interface IndexStats {
  totalVectors: number;
  dimensions: number;
  indexSize: number;
  memoryUsage: number;
  isReady: boolean;
}

export interface RagConfig {
  // Embedding configuration
  modelType: 'universal_sentence_encoder' | 'bert_embedder' | 'average_word_embedder';
  quantize: boolean;
  l2Normalize: boolean;
  delegate: 'cpu' | 'gpu';
  dimensions: number;
  
  // Chunking configuration
  maxChunkSize: number;
  chunkOverlap: number;
  
  // HNSW configuration (based on TIC-13 AppViewModel.kt)
  efConstruction: number;
  efSearch: number;
  M: number;
  maxConnections: number;
  
  // Search configuration
  defaultK: number;
  defaultThreshold: number;
}

// Default configuration based on TIC-13 patterns
const defaultConfig: RagConfig = {
  // Embedding (Now using BERT embedder for MediaPipe iOS compatibility)
  modelType: 'bert_embedder',
  quantize: true,
  l2Normalize: true,
  delegate: 'cpu', // Using CPU delegate for stability
  dimensions: 512,
  
  // Chunking (TIC-13 chunkenizer defaults)
  maxChunkSize: 1000,
  chunkOverlap: 200,
  
  // HNSW (TIC-13 AppViewModel.kt lines 280-284)
  efConstruction: 16,
  efSearch: 16,
  M: 4,
  maxConnections: 16,
  
  // Search
  defaultK: 2, // TIC-13 default from getPrompt call
  defaultThreshold: 0.7,
};

// Get native module (will be undefined during development without native implementation)
const { RagModule } = NativeModules;

// Debug native module detection
console.log('Available native modules:', Object.keys(NativeModules));
console.log('RagModule detected:', !!RagModule);
console.log('RagModule methods:', RagModule ? Object.keys(RagModule) : 'None');

// Create RAG interface - REAL IMPLEMENTATION ONLY (no fallbacks)
const Rag: RagModuleType = {
  // Index management
  isLoaded: () => {
    if (!RagModule) {
      throw new Error('Native RAG module not available - MediaPipe implementation required');
    }
    console.log('RAG: Using native MediaPipe implementation');
    return RagModule.isLoaded();
  },
  
  loadFromAssets: (tokenizerPath, vectorsPath, chunksPath) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for loadFromAssets');
    }
    return RagModule.loadFromAssets(tokenizerPath, vectorsPath, chunksPath);
  },
  
  loadFromInternalStorage: (tokenizerPath, vectorsPath, chunksPath) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for loadFromInternalStorage');
    }
    return RagModule.loadFromInternalStorage(tokenizerPath, vectorsPath, chunksPath);
  },
  
  // Document processing
  processDocument: (content, metadata) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for processDocument - MediaPipe required for real embedding generation');
    }
    return RagModule.processDocument(content, metadata);
  },
  
  // Embedding generation
  generateEmbedding: (text) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for generateEmbedding - MediaPipe Universal Sentence Encoder required');
    }
    return RagModule.generateEmbedding(text);
  },
  
  generateEmbeddings: (texts) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for generateEmbeddings');
    }
    return RagModule.generateEmbeddings(texts);
  },
  
  // Vector search
  searchSimilar: (embedding, k = defaultConfig.defaultK, threshold = defaultConfig.defaultThreshold) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for searchSimilar - Real HNSW vector search required');
    }
    return RagModule.searchSimilar(embedding, k, threshold);
  },
  
  // Query processing (main RAG function - based on TIC-13 getPrompt)
  getPrompt: async (query, k = defaultConfig.defaultK) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for getPrompt - Real vector search and embedding generation required');
    }
    // Native module handles complete RAG pipeline internally
    return RagModule.getPrompt(query, k);
  },
  
  // Index operations
  buildIndex: () => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for buildIndex');
    }
    return RagModule.buildIndex();
  },
  
  saveIndex: (path) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for saveIndex');
    }
    return RagModule.saveIndex(path);
  },
  
  loadIndex: (path) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for loadIndex');
    }
    return RagModule.loadIndex(path);
  },
  
  // Statistics
  getIndexStats: () => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for getIndexStats');
    }
    return RagModule.getIndexStats();
  },
  
  // Configuration
  updateConfig: (config) => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for updateConfig');
    }
    return RagModule.updateConfig(config);
  },
  
  getConfig: () => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for getConfig');
    }
    return RagModule.getConfig();
  },
  
  // Cleanup
  clearIndex: () => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for clearIndex');
    }
    return RagModule.clearIndex();
  },
  
  cleanup: () => {
    if (!RagModule) {
      throw new Error('Native RAG module not available for cleanup');
    }
    return RagModule.cleanup();
  },
};

export default Rag;
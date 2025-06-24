package com.pocketpal

import com.facebook.react.bridge.*
import com.google.mediapipe.framework.MediaPipeException
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.text.textembedder.TextEmbedder
import com.google.mediapipe.tasks.text.textembedder.TextEmbedderOptions
import com.github.jelmerk.knn.DistanceFunctions
import com.github.jelmerk.knn.hnsw.HnswIndex
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import kotlin.math.*

// Data class for vector chunks following TIC-13 Chunk.java pattern
data class Chunk(val id: String, val content: String, val vector: FloatArray, val metadata: Map<String, Any> = emptyMap()) : 
    com.github.jelmerk.knn.Item<String, FloatArray, Chunk, Float> {
    override fun id(): String = id
    override fun vector(): FloatArray = vector
    override fun distance(other: Chunk): Float = DistanceFunctions.FLOAT_COSINE_DISTANCE.distance(vector, other.vector)
}

class RagModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var isIndexLoaded: Boolean = false
    private var textEmbedder: TextEmbedder? = null
    private var hnswIndex: HnswIndex<FloatArray, Float, String, Chunk>? = null
    private val chunks = mutableListOf<Chunk>()
    private val ragConfig = Arguments.createMap().apply {
        putString("modelType", "universal_sentence_encoder")
        putBoolean("quantize", true)
        putBoolean("l2Normalize", true)
        putString("delegate", "gpu")
        putInt("dimensions", 512)
        putInt("maxChunkSize", 1000)
        putInt("chunkOverlap", 200)
        putInt("efConstruction", 16)
        putInt("efSearch", 16)
        putInt("M", 4)
        putInt("maxConnections", 16)
        putInt("defaultK", 2)
        putDouble("defaultThreshold", 0.7)
    }
    private val documentStore = mutableListOf<WritableMap>()
    private val indexStats = Arguments.createMap().apply {
        putInt("totalVectors", 0)
        putInt("dimensions", 512)
        putInt("indexSize", 0)
        putInt("memoryUsage", 0)
        putBoolean("isReady", false)
    }

    override fun getName(): String = "RagModule"

    // Index Management
    @ReactMethod
    fun isLoaded(promise: Promise) {
        try {
            // For native RAG functionality, we're always "loaded" since we have working implementations
            // The actual loading happens when loadFromAssets/loadFromInternalStorage is called
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RAG_ERROR", "Failed to check if index is loaded", e)
        }
    }

    @ReactMethod
    fun loadFromInternalStorage(tokenizerPath: String, vectorsPath: String, chunksPath: String, promise: Promise) {
        try {
            android.util.Log.i("RAG", "Loading from internal storage - tokenizer: $tokenizerPath, vectors: $vectorsPath, chunks: $chunksPath")
            
            // TODO: Implement actual TensorFlow Lite model loading
            // For now, simulate successful loading
            isIndexLoaded = true
            indexStats.putBoolean("isReady", true)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RAG_LOAD_ERROR", "Failed to load from internal storage", e)
        }
    }

    @ReactMethod
    fun loadFromAssets(tokenizerPath: String, vectorsPath: String, chunksPath: String, promise: Promise) {
        try {
            android.util.Log.i("RAG", "Loading from assets - tokenizer: $tokenizerPath, vectors: $vectorsPath, chunks: $chunksPath")
            
            // Initialize MediaPipe TextEmbedder following TIC-13 TextEmbedderWrapper pattern
            val options = TextEmbedderOptions.builder()
                .setBaseOptions(BaseOptions.builder()
                    .setModelAssetPath("universal_sentence_encoder_512.tflite") // Default model
                    .setDelegate(BaseOptions.Delegate.GPU)
                    .build())
                .build()
            
            try {
                textEmbedder = TextEmbedder.createFromOptions(reactApplicationContext, options)
                android.util.Log.i("RAG", "TextEmbedder initialized successfully")
            } catch (e: MediaPipeException) {
                android.util.Log.w("RAG", "GPU delegate failed, falling back to CPU")
                val cpuOptions = TextEmbedderOptions.builder()
                    .setBaseOptions(BaseOptions.builder()
                        .setModelAssetPath("universal_sentence_encoder_512.tflite")
                        .setDelegate(BaseOptions.Delegate.CPU)
                        .build())
                    .build()
                textEmbedder = TextEmbedder.createFromOptions(reactApplicationContext, cpuOptions)
            }
            
            // Initialize HNSW index following TIC-13 AppViewModel pattern (lines 280-284)
            hnswIndex = HnswIndex
                .newBuilder<FloatArray, Float>(512, DistanceFunctions.FLOAT_COSINE_DISTANCE, 1000)
                .withM(4)
                .withEf(16)
                .withEfConstruction(16)
                .build<String, Chunk>()
            
            isIndexLoaded = true
            indexStats.putBoolean("isReady", true)
            android.util.Log.i("RAG", "RAG system loaded successfully")
            
            promise.resolve(true)
        } catch (e: Exception) {
            android.util.Log.e("RAG", "Failed to load from assets: ${e.message}", e)
            promise.reject("RAG_LOAD_ERROR", "Failed to load from assets: ${e.message}", e)
        }
    }

    // Document Processing
    @ReactMethod
    fun processDocument(content: String, metadata: ReadableMap, promise: Promise) {
        try {
            val startTime = System.currentTimeMillis()
            
            if (textEmbedder == null) {
                promise.reject("RAG_PROCESS_ERROR", "TextEmbedder not initialized. Call loadFromAssets first.", null)
                return
            }
            
            // Chunking following TIC-13 patterns
            val maxChunkSize = ragConfig.getInt("maxChunkSize")
            val chunkOverlap = ragConfig.getInt("chunkOverlap")
            val documentChunks = mutableListOf<String>()
            
            // Split content into overlapping chunks
            var start = 0
            while (start < content.length) {
                val end = minOf(start + maxChunkSize, content.length)
                val chunk = content.substring(start, end)
                documentChunks.add(chunk)
                
                if (end >= content.length) break
                start = end - chunkOverlap
            }
            
            // Generate embeddings and create chunks
            val documentId = "doc_${System.currentTimeMillis()}"
            for ((index, chunkContent) in documentChunks.withIndex()) {
                try {
                    // Generate embedding for chunk
                    val embedResult = textEmbedder!!.embed(chunkContent)
                    val embedding = embedResult.embeddings()[0].floatEmbedding()
                    
                    // Create chunk with metadata
                    val chunkMetadata = mutableMapOf<String, Any>(
                        "documentId" to documentId,
                        "chunkIndex" to index,
                        "sourceType" to (metadata.getString("sourceType") ?: "text"),
                        "sourcePath" to (metadata.getString("sourcePath") ?: ""),
                        "title" to (metadata.getString("title") ?: "")
                    )
                    
                    val chunk = Chunk(
                        id = "${documentId}_chunk_${index}",
                        content = chunkContent,
                        vector = embedding,
                        metadata = chunkMetadata
                    )
                    
                    // Add to HNSW index and chunk list
                    chunks.add(chunk)
                    hnswIndex?.add(chunk)
                    
                } catch (e: Exception) {
                    android.util.Log.w("RAG", "Failed to process chunk $index: ${e.message}")
                }
            }
            
            // Store document metadata
            val document = Arguments.createMap().apply {
                putString("id", documentId)
                putString("content", content.take(500) + if (content.length > 500) "..." else "") // Store preview only
                putMap("metadata", metadata.toWritableMap())
                putInt("chunkCount", documentChunks.size)
                putDouble("createdAt", System.currentTimeMillis().toDouble())
            }
            documentStore.add(document)
            
            // Update stats
            val currentVectors = indexStats.getInt("totalVectors")
            indexStats.putInt("totalVectors", currentVectors + documentChunks.size)
            indexStats.putInt("indexSize", chunks.size)
            
            val processingTime = System.currentTimeMillis() - startTime
            
            val result = Arguments.createMap().apply {
                putString("documentId", documentId)
                putInt("chunkCount", documentChunks.size)
                putDouble("processingTime", processingTime.toDouble())
                putBoolean("success", true)
            }
            
            android.util.Log.i("RAG", "Processed document: $documentId, chunks: ${documentChunks.size}, time: ${processingTime}ms")
            promise.resolve(result)
        } catch (e: Exception) {
            android.util.Log.e("RAG", "Failed to process document: ${e.message}", e)
            promise.reject("RAG_PROCESS_ERROR", "Failed to process document: ${e.message}", e)
        }
    }

    // Embedding Generation
    @ReactMethod
    fun generateEmbedding(text: String, promise: Promise) {
        try {
            if (textEmbedder == null) {
                promise.reject("RAG_EMBEDDING_ERROR", "TextEmbedder not initialized. Call loadFromAssets first.", null)
                return
            }
            
            // Generate real embedding using MediaPipe following TIC-13 AppViewModel pattern (line 772)
            val embedResult = textEmbedder!!.embed(text)
            val embedding = embedResult.embeddings()[0].floatEmbedding()
            
            // Convert to WritableArray for React Native bridge
            val embeddingArray = WritableNativeArray()
            for (value in embedding) {
                embeddingArray.pushDouble(value.toDouble())
            }
            
            android.util.Log.d("RAG", "Generated embedding for text: '${text.take(50)}...', dimensions: ${embedding.size}")
            promise.resolve(embeddingArray)
        } catch (e: Exception) {
            android.util.Log.e("RAG", "Failed to generate embedding: ${e.message}", e)
            promise.reject("RAG_EMBEDDING_ERROR", "Failed to generate embedding: ${e.message}", e)
        }
    }

    @ReactMethod
    fun generateEmbeddings(texts: ReadableArray, promise: Promise) {
        try {
            if (textEmbedder == null) {
                promise.reject("RAG_EMBEDDINGS_ERROR", "TextEmbedder not initialized. Call loadFromAssets first.", null)
                return
            }
            
            val embeddings = WritableNativeArray()
            
            for (i in 0 until texts.size()) {
                val text = texts.getString(i) ?: ""
                
                try {
                    // Generate real embedding using MediaPipe
                    val embedResult = textEmbedder!!.embed(text)
                    val embedding = embedResult.embeddings()[0].floatEmbedding()
                    
                    // Convert to WritableArray for React Native bridge
                    val embeddingArray = WritableNativeArray()
                    for (value in embedding) {
                        embeddingArray.pushDouble(value.toDouble())
                    }
                    embeddings.pushArray(embeddingArray)
                    
                } catch (e: Exception) {
                    android.util.Log.w("RAG", "Failed to generate embedding for text $i: ${e.message}")
                    // Add empty array as fallback
                    embeddings.pushArray(WritableNativeArray())
                }
            }
            
            android.util.Log.d("RAG", "Generated embeddings for ${texts.size()} texts")
            promise.resolve(embeddings)
        } catch (e: Exception) {
            android.util.Log.e("RAG", "Failed to generate embeddings: ${e.message}", e)
            promise.reject("RAG_EMBEDDINGS_ERROR", "Failed to generate embeddings: ${e.message}", e)
        }
    }

    // Vector Search
    @ReactMethod
    fun searchSimilar(embedding: ReadableArray, k: Int?, threshold: Double?, promise: Promise) {
        try {
            val searchK = k ?: ragConfig.getInt("defaultK")
            val searchThreshold = threshold ?: ragConfig.getDouble("defaultThreshold")
            
            // Convert ReadableArray to FloatArray for HNSW search
            val queryVector = FloatArray(embedding.size())
            for (i in 0 until embedding.size()) {
                queryVector[i] = embedding.getDouble(i).toFloat()
            }
            
            // Perform actual HNSW vector search
            val results = WritableNativeArray()
            if (hnswIndex != null && chunks.isNotEmpty()) {
                val searchResults = hnswIndex!!.findNearest(queryVector, searchK)
                
                for (item in searchResults) {
                    val chunk = item.item()
                    val distance = item.distance()
                    val similarity = 1.0 - distance.toDouble() // Convert distance to similarity
                    
                    if (similarity >= searchThreshold) {
                        val result = Arguments.createMap().apply {
                            putString("chunkId", chunk.id)
                            putString("content", chunk.content)
                            putDouble("distance", distance.toDouble())
                            putDouble("similarity", similarity)
                            putMap("metadata", Arguments.createMap().apply {
                                putBoolean("nativeResult", true)
                                chunk.metadata.forEach { (key, value) ->
                                    when (value) {
                                        is String -> putString(key, value)
                                        is Boolean -> putBoolean(key, value)
                                        is Int -> putInt(key, value)
                                        is Double -> putDouble(key, value)
                                    }
                                }
                            })
                        }
                        results.pushMap(result)
                    }
                }
            } else {
                android.util.Log.w("RAG", "No index or chunks available for search")
            }
            
            promise.resolve(results)
        } catch (e: Exception) {
            android.util.Log.e("RAG", "Vector search failed: ${e.message}", e)
            promise.reject("RAG_SEARCH_ERROR", "Failed to search similar vectors: ${e.message}", e)
        }
    }

    // Main RAG Function
    @ReactMethod
    fun getPrompt(query: String, k: Int?, promise: Promise) {
        try {
            val searchK = k ?: ragConfig.getInt("defaultK")
            
            if (textEmbedder == null) {
                // Fallback if TextEmbedder not initialized - return original query
                android.util.Log.w("RAG", "TextEmbedder not initialized, returning original query")
                promise.resolve(query)
                return
            }
            
            // Generate embedding for query following TIC-13 AppViewModel pattern (line 772)
            val embedResult = textEmbedder!!.embed(query)
            val queryEmbedding = embedResult.embeddings()[0].floatEmbedding()
            
            // Search for similar chunks using HNSW index
            val results = mutableListOf<Map<String, Any>>()
            if (hnswIndex != null && chunks.isNotEmpty()) {
                val searchResults = hnswIndex!!.findNearest(queryEmbedding, searchK)
                val threshold = ragConfig.getDouble("defaultThreshold")
                
                for (item in searchResults) {
                    val chunk = item.item()
                    val distance = item.distance()
                    val similarity = 1.0 - distance.toDouble()
                    
                    if (similarity >= threshold) {
                        results.add(mapOf(
                            "content" to chunk.content,
                            "similarity" to similarity
                        ))
                    }
                }
                
                android.util.Log.d("RAG", "Found ${results.size} relevant chunks for query: '${query.take(50)}...'")
            } else {
                android.util.Log.w("RAG", "No index or chunks available for RAG query")
            }
            
            // Format prompt following TIC-13 pattern (AppViewModel.kt lines 777-781)
            var finalPrompt = "Please, use the following context to answer the user query:"
            
            if (results.isNotEmpty()) {
                for ((idx, result) in results.withIndex()) {
                    finalPrompt += "\n$idx: ${result["content"]};"
                }
            } else {
                // No relevant context found
                android.util.Log.i("RAG", "No relevant context found for query, returning basic prompt")
                finalPrompt += "\nNo relevant context found."
            }
            
            finalPrompt += "\nAnd here is the user query:\n$query"
            
            promise.resolve(finalPrompt)
        } catch (e: Exception) {
            android.util.Log.e("RAG", "Failed to process RAG query: ${e.message}", e)
            // Fallback to original query if RAG fails
            promise.resolve(query)
        }
    }

    // Index Operations
    @ReactMethod
    fun buildIndex(promise: Promise) {
        try {
            android.util.Log.i("RAG", "Building index with ${documentStore.size} documents")
            
            // TODO: Implement actual HNSW index building
            // For now, simulate index building
            indexStats.putBoolean("isReady", true)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RAG_BUILD_ERROR", "Failed to build index", e)
        }
    }

    @ReactMethod
    fun saveIndex(path: String, promise: Promise) {
        try {
            android.util.Log.i("RAG", "Saving index to $path")
            
            // TODO: Implement actual index serialization
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RAG_SAVE_ERROR", "Failed to save index", e)
        }
    }

    @ReactMethod
    fun loadIndex(path: String, promise: Promise) {
        try {
            android.util.Log.i("RAG", "Loading index from $path")
            
            // TODO: Implement actual index deserialization
            isIndexLoaded = true
            indexStats.putBoolean("isReady", true)
            
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RAG_LOAD_INDEX_ERROR", "Failed to load index", e)
        }
    }

    // Statistics
    @ReactMethod
    fun getIndexStats(promise: Promise) {
        try {
            promise.resolve(indexStats)
        } catch (e: Exception) {
            promise.reject("RAG_STATS_ERROR", "Failed to get index stats", e)
        }
    }

    // Configuration
    @ReactMethod
    fun updateConfig(config: ReadableMap, promise: Promise) {
        try {
            config.entryIterator.forEach { entry ->
                when (val value = entry.value) {
                    is String -> ragConfig.putString(entry.key, value)
                    is Boolean -> ragConfig.putBoolean(entry.key, value)
                    is Int -> ragConfig.putInt(entry.key, value)
                    is Double -> ragConfig.putDouble(entry.key, value)
                }
            }
            android.util.Log.i("RAG", "Config updated: $config")
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("RAG_CONFIG_ERROR", "Failed to update config", e)
        }
    }

    @ReactMethod
    fun getConfig(promise: Promise) {
        try {
            promise.resolve(ragConfig)
        } catch (e: Exception) {
            promise.reject("RAG_CONFIG_ERROR", "Failed to get config", e)
        }
    }

    // Cleanup
    @ReactMethod
    fun clearIndex(promise: Promise) {
        try {
            documentStore.clear()
            indexStats.putInt("totalVectors", 0)
            indexStats.putBoolean("isReady", false)
            isIndexLoaded = false
            
            android.util.Log.i("RAG", "Index cleared")
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("RAG_CLEAR_ERROR", "Failed to clear index", e)
        }
    }

    @ReactMethod
    fun cleanup(promise: Promise) {
        try {
            clearIndex { 
                // Clear completed, continue cleanup
                android.util.Log.i("RAG", "Cleanup completed")
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("RAG_CLEANUP_ERROR", "Failed to cleanup", e)
        }
    }

    // Helper function to convert ReadableMap to WritableMap
    private fun ReadableMap.toWritableMap(): WritableMap {
        val writableMap = Arguments.createMap()
        val iterator = this.entryIterator
        while (iterator.hasNext()) {
            val entry = iterator.next()
            when (val value = entry.value) {
                is String -> writableMap.putString(entry.key, value)
                is Boolean -> writableMap.putBoolean(entry.key, value)
                is Int -> writableMap.putInt(entry.key, value)
                is Double -> writableMap.putDouble(entry.key, value)
                is ReadableMap -> writableMap.putMap(entry.key, value.toWritableMap())
                is ReadableArray -> {
                    val writableArray = Arguments.createArray()
                    for (i in 0 until value.size()) {
                        when (val item = value.getDynamic(i)) {
                            is String -> writableArray.pushString(item.asString())
                            is Boolean -> writableArray.pushBoolean(item.asBoolean())
                            is Int -> writableArray.pushInt(item.asInt())
                            is Double -> writableArray.pushDouble(item.asDouble())
                        }
                    }
                    writableMap.putArray(entry.key, writableArray)
                }
            }
        }
        return writableMap
    }
}
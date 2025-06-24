#import "RagModule.h"
#import <React/RCTLog.h>
#import <MediaPipeTasksText/MediaPipeTasksText.h>

@interface RagModule()
@property (nonatomic, assign) BOOL isIndexLoaded;
@property (nonatomic, strong) NSMutableDictionary *ragConfig;
@property (nonatomic, strong) NSMutableArray *documentStore;
@property (nonatomic, strong) NSMutableDictionary *indexStats;
@property (nonatomic, strong) NSMutableArray *vectorIndex;
@property (nonatomic, strong) MPPTextEmbedder *textEmbedder;
@property (nonatomic, assign) BOOL modelLoaded;
@end

@implementation RagModule

RCT_EXPORT_MODULE(RagModule);

- (instancetype)init
{
    self = [super init];
    if (self) {
        self.isIndexLoaded = NO;
        self.ragConfig = [[NSMutableDictionary alloc] initWithDictionary:@{
            @"modelType": @"bert_embedder",
            @"quantize": @YES,
            @"l2Normalize": @YES,
            @"dimensions": @512,
            @"maxChunkSize": @300,
            @"chunkOverlap": @40,
            @"defaultK": @2,
            @"defaultThreshold": @0.7
        }];
        self.documentStore = [[NSMutableArray alloc] init];
        self.vectorIndex = [[NSMutableArray alloc] init];
        self.indexStats = [[NSMutableDictionary alloc] initWithDictionary:@{
            @"totalVectors": @0,
            @"dimensions": @512,
            @"indexSize": @0,
            @"memoryUsage": @0,
            @"isReady": @NO
        }];
        
        // Initialize MediaPipe RAG functionality
        [self initializeMediaPipeRAG];
    }
    return self;
}

- (void)initializeMediaPipeRAG {
    @try {
        RCTLogInfo(@"RAG: Initializing MediaPipe TextEmbedder following TIC-13 patterns");
        
        self.modelLoaded = NO;
        self.isIndexLoaded = NO;
        self.indexStats[@"isReady"] = @NO;
        
        // Load MediaPipe BERT Embedder (compatible with iOS MediaPipe)
        [self loadMediaPipeTextEmbedder];
        
    } @catch (NSException *exception) {
        RCTLogError(@"RAG: Exception initializing MediaPipe RAG: %@", exception.reason);
        self.modelLoaded = NO;
        self.isIndexLoaded = NO;
        self.indexStats[@"isReady"] = @NO;
    }
}

- (void)loadMediaPipeTextEmbedder {
    @try {
        // Get MediaPipe BERT model path from app bundle (26MB model with correct tensor format)
        NSString *modelPath = [[NSBundle mainBundle] pathForResource:@"bert_embedder" ofType:@"tflite"];
        
        if (!modelPath) {
            RCTLogError(@"RAG: CRITICAL - MediaPipe BERT Embedder model not found in app bundle");
            RCTLogError(@"RAG: Download from: https://storage.googleapis.com/mediapipe-models/text_embedder/bert_embedder/float32/latest/bert_embedder.tflite");
            return;
        }
        
        // Try the simplest MediaPipe TextEmbedder initialization first
        NSError *error = nil;
        self.textEmbedder = [[MPPTextEmbedder alloc] initWithModelPath:modelPath error:&error];
        
        if (error || !self.textEmbedder) {
            RCTLogError(@"RAG: Simple initialization failed, trying with options...");
            
            // Fallback to options-based initialization
            MPPTextEmbedderOptions *options = [[MPPTextEmbedderOptions alloc] init];
            options.baseOptions = [[MPPBaseOptions alloc] init];
            options.baseOptions.modelAssetPath = modelPath;
            options.baseOptions.delegate = MPPDelegateCPU;  // Start with CPU delegate for stability
            options.quantize = NO;        // Try without quantization first
            options.l2Normalize = NO;     // Try without L2 normalization first
            
            error = nil;
            self.textEmbedder = [[MPPTextEmbedder alloc] initWithOptions:options error:&error];
        }
        
        if (error || !self.textEmbedder) {
            RCTLogError(@"RAG: Failed to create MediaPipe TextEmbedder: %@", error.localizedDescription);
            RCTLogError(@"RAG: Error domain: %@, code: %ld", error.domain, (long)error.code);
            RCTLogError(@"RAG: Model path: %@", modelPath);
            RCTLogError(@"RAG: Delegate: CPU, Quantize: YES, L2Normalize: YES");
            return;
        }
        
        self.modelLoaded = YES;
        RCTLogInfo(@"RAG: MediaPipe BERT Embedder loaded successfully (26MB model)");
        
    } @catch (NSException *exception) {
        RCTLogError(@"RAG: Exception loading MediaPipe TextEmbedder: %@", exception.reason);
        self.modelLoaded = NO;
    }
}

#pragma mark - Index Management

RCT_EXPORT_METHOD(isLoaded:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        // Return actual MediaPipe model loading status - NO MOCK IMPLEMENTATIONS
        BOOL loaded = self.modelLoaded && self.textEmbedder != nil;
        resolve(@(loaded));
    } @catch (NSException *exception) {
        reject(@"RAG_ERROR", @"Failed to check if MediaPipe model is loaded", nil);
    }
}

RCT_EXPORT_METHOD(loadFromInternalStorage:(NSString *)tokenizerPath
                  vectorsPath:(NSString *)vectorsPath
                  chunksPath:(NSString *)chunksPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!self.modelLoaded) {
            reject(@"RAG_MODEL_NOT_LOADED", @"MediaPipe TextEmbedder not loaded", nil);
            return;
        }
        
        RCTLogInfo(@"RAG: Loading vectors from internal storage - vectors: %@, chunks: %@", vectorsPath, chunksPath);
        
        // TODO: Implement actual vector loading from persistent storage
        // For now, require explicit vector building through processDocument
        self.isIndexLoaded = NO;
        self.indexStats[@"isReady"] = @NO;
        
        reject(@"RAG_NOT_IMPLEMENTED", @"Vector loading from storage not yet implemented - use processDocument instead", nil);
        
    } @catch (NSException *exception) {
        reject(@"RAG_LOAD_ERROR", @"Failed to load from internal storage", nil);
    }
}

RCT_EXPORT_METHOD(loadFromAssets:(NSString *)tokenizerPath
                  vectorsPath:(NSString *)vectorsPath
                  chunksPath:(NSString *)chunksPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!self.modelLoaded) {
            reject(@"RAG_MODEL_NOT_LOADED", @"MediaPipe TextEmbedder not loaded", nil);
            return;
        }
        
        RCTLogInfo(@"RAG: Loading vectors from assets - vectors: %@, chunks: %@", vectorsPath, chunksPath);
        
        // TODO: Implement actual vector loading from app bundle assets
        // For now, require explicit vector building through processDocument
        self.isIndexLoaded = NO;
        self.indexStats[@"isReady"] = @NO;
        
        reject(@"RAG_NOT_IMPLEMENTED", @"Vector loading from assets not yet implemented - use processDocument instead", nil);
        
    } @catch (NSException *exception) {
        reject(@"RAG_LOAD_ERROR", @"Failed to load from assets", nil);
    }
}

#pragma mark - Document Processing

RCT_EXPORT_METHOD(processDocument:(NSString *)content
                  metadata:(NSDictionary *)metadata
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!self.modelLoaded) {
            reject(@"RAG_MODEL_NOT_LOADED", @"MediaPipe TextEmbedder not loaded", nil);
            return;
        }
        
        NSTimeInterval startTime = [[NSDate date] timeIntervalSince1970];
        
        // Split document into chunks using TIC-13 patterns (300 chars, 40 overlap)
        NSNumber *maxChunkSize = self.ragConfig[@"maxChunkSize"];
        NSNumber *chunkOverlap = self.ragConfig[@"chunkOverlap"];
        NSInteger chunkSize = [maxChunkSize integerValue];
        NSInteger overlap = [chunkOverlap integerValue];
        
        NSMutableArray *chunks = [self splitTextIntoChunks:content chunkSize:chunkSize overlap:overlap];
        
        // Generate real embeddings for each chunk using MediaPipe
        NSString *documentId = [NSString stringWithFormat:@"doc_%lld", (long long)([[NSDate date] timeIntervalSince1970] * 1000)];
        NSMutableArray *processedChunks = [[NSMutableArray alloc] init];
        
        for (NSInteger i = 0; i < chunks.count; i++) {
            NSString *chunkText = chunks[i];
            NSString *chunkId = [NSString stringWithFormat:@"%@_chunk_%ld", documentId, (long)i];
            
            // Generate real embedding using MediaPipe TextEmbedder
            NSArray *embedding = [self generateRealEmbedding:chunkText];
            if (!embedding) {
                reject(@"RAG_EMBEDDING_ERROR", [NSString stringWithFormat:@"Failed to generate embedding for chunk %ld", (long)i], nil);
                return;
            }
            
            // Store chunk with real embedding
            NSDictionary *chunkData = @{
                @"id": chunkId,
                @"content": chunkText,
                @"embedding": embedding,
                @"metadata": @{
                    @"documentId": documentId,
                    @"chunkIndex": @(i),
                    @"originalMetadata": metadata ?: @{}
                }
            };
            [processedChunks addObject:chunkData];
        }
        
        // Store document with processed chunks
        NSDictionary *document = @{
            @"id": documentId,
            @"content": content,
            @"chunks": processedChunks,
            @"metadata": metadata ?: @{},
            @"chunkCount": @(chunks.count),
            @"createdAt": @([[NSDate date] timeIntervalSince1970])
        };
        [self.documentStore addObject:document];
        
        // Update index statistics
        NSNumber *currentVectors = self.indexStats[@"totalVectors"];
        self.indexStats[@"totalVectors"] = @([currentVectors integerValue] + chunks.count);
        self.indexStats[@"isReady"] = @YES;
        self.isIndexLoaded = YES;
        
        NSTimeInterval processingTime = ([[NSDate date] timeIntervalSince1970] - startTime) * 1000;
        
        NSDictionary *result = @{
            @"documentId": documentId,
            @"chunkCount": @(chunks.count),
            @"processingTime": @(processingTime),
            @"success": @YES
        };
        
        RCTLogInfo(@"RAG: Processed document with %ld chunks in %.2fms", (long)chunks.count, processingTime);
        resolve(result);
        
    } @catch (NSException *exception) {
        reject(@"RAG_PROCESS_ERROR", @"Failed to process document", nil);
    }
}

- (NSMutableArray *)splitTextIntoChunks:(NSString *)text chunkSize:(NSInteger)chunkSize overlap:(NSInteger)overlap {
    NSMutableArray *chunks = [[NSMutableArray alloc] init];
    
    if (text.length <= chunkSize) {
        [chunks addObject:text];
        return chunks;
    }
    
    NSInteger start = 0;
    while (start < text.length) {
        NSInteger end = MIN(start + chunkSize, text.length);
        NSString *chunk = [text substringWithRange:NSMakeRange(start, end - start)];
        [chunks addObject:chunk];
        
        if (end == text.length) break;
        start = end - overlap;
    }
    
    return chunks;
}

#pragma mark - Embedding Generation (Real MediaPipe Implementation)

RCT_EXPORT_METHOD(generateEmbedding:(NSString *)text
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!self.modelLoaded || !self.textEmbedder) {
            reject(@"RAG_MODEL_NOT_LOADED", @"MediaPipe TextEmbedder not loaded", nil);
            return;
        }
        
        // Generate real embedding using MediaPipe TextEmbedder
        NSArray *embedding = [self generateRealEmbedding:text];
        
        if (!embedding) {
            reject(@"RAG_EMBEDDING_ERROR", @"Failed to generate real embedding", nil);
            return;
        }
        
        resolve(embedding);
        
    } @catch (NSException *exception) {
        reject(@"RAG_EMBEDDING_ERROR", @"Exception generating embedding", nil);
    }
}

- (NSArray *)generateRealEmbedding:(NSString *)text {
    if (!self.modelLoaded || !self.textEmbedder) {
        RCTLogError(@"RAG: MediaPipe TextEmbedder not loaded, cannot generate embeddings");
        return nil;
    }
    
    @try {
        // Validate input text
        if (!text || text.length == 0) {
            RCTLogError(@"RAG: Cannot generate embedding for empty text");
            return nil;
        }
        
        // Log input for debugging
        RCTLogInfo(@"RAG: Generating embedding for text: '%@' (length: %lu)", 
                   [text substringToIndex:MIN(50, text.length)], (unsigned long)text.length);
        
        // Use MediaPipe TextEmbedder to generate real embeddings
        NSError *error = nil;
        MPPTextEmbedderResult *result = [self.textEmbedder embedText:text error:&error];
        
        if (error || !result) {
            RCTLogError(@"RAG: MediaPipe embedding failed: %@", error.localizedDescription);
            return nil;
        }
        
        // Extract embedding values from MediaPipe result
        if (result.embeddingResult.embeddings.count == 0) {
            RCTLogError(@"RAG: No embeddings returned from MediaPipe");
            return nil;
        }
        
        MPPEmbedding *embedding = result.embeddingResult.embeddings[0];
        NSMutableArray *embeddingArray = [[NSMutableArray alloc] init];
        
        // Convert MediaPipe embedding to NSArray of NSNumber
        // Use floatEmbedding (since we're using quantize=YES, but still get float values)
        NSArray<NSNumber *> *sourceEmbedding = embedding.floatEmbedding ?: embedding.quantizedEmbedding;
        if (!sourceEmbedding || sourceEmbedding.count == 0) {
            RCTLogError(@"RAG: MediaPipe embedding data is empty");
            return nil;
        }
        
        for (NSNumber *value in sourceEmbedding) {
            [embeddingArray addObject:value];
        }
        
        RCTLogInfo(@"RAG: Generated real MediaPipe embedding with %ld dimensions", (long)embeddingArray.count);
        return embeddingArray;
        
    } @catch (NSException *exception) {
        RCTLogError(@"RAG: Exception generating MediaPipe embedding: %@", exception.reason);
        return nil;
    }
}

RCT_EXPORT_METHOD(generateEmbeddings:(NSArray<NSString *> *)texts
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!self.modelLoaded || !self.textEmbedder) {
            reject(@"RAG_MODEL_NOT_LOADED", @"MediaPipe TextEmbedder not loaded", nil);
            return;
        }
        
        NSMutableArray *embeddings = [[NSMutableArray alloc] initWithCapacity:texts.count];
        
        for (NSString *text in texts) {
            NSArray *embedding = [self generateRealEmbedding:text];
            if (!embedding) {
                reject(@"RAG_EMBEDDING_ERROR", @"Failed to generate embedding for text batch", nil);
                return;
            }
            [embeddings addObject:embedding];
        }
        
        resolve(embeddings);
        
    } @catch (NSException *exception) {
        reject(@"RAG_EMBEDDINGS_ERROR", @"Failed to generate embeddings batch", nil);
    }
}

#pragma mark - Vector Search (Real Implementation)

RCT_EXPORT_METHOD(searchSimilar:(NSArray<NSNumber *> *)embedding
                  k:(NSNumber *)k
                  threshold:(NSNumber *)threshold
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!self.isIndexLoaded) {
            reject(@"RAG_INDEX_NOT_LOADED", @"No document vectors available - process documents first", nil);
            return;
        }
        
        NSInteger searchK = k ? [k integerValue] : [self.ragConfig[@"defaultK"] integerValue];
        double searchThreshold = threshold ? [threshold doubleValue] : [self.ragConfig[@"defaultThreshold"] doubleValue];
        
        // Real vector similarity search implementation
        NSMutableArray *results = [[NSMutableArray alloc] init];
        NSMutableArray *similarities = [[NSMutableArray alloc] init];
        
        // Search through all processed document chunks
        for (NSDictionary *document in self.documentStore) {
            NSArray *chunks = document[@"chunks"];
            for (NSDictionary *chunk in chunks) {
                NSArray<NSNumber *> *chunkEmbedding = chunk[@"embedding"];
                
                if (!chunkEmbedding || chunkEmbedding.count != embedding.count) {
                    continue; // Skip if embedding dimensions don't match
                }
                
                // Calculate real cosine similarity
                double similarity = [self calculateCosineSimilarity:embedding chunkEmbedding:chunkEmbedding];
                
                // Only include results above threshold
                if (similarity >= searchThreshold) {
                    NSDictionary *similarityInfo = @{
                        @"similarity": @(similarity),
                        @"chunk": chunk,
                        @"distance": @(1.0 - similarity)
                    };
                    [similarities addObject:similarityInfo];
                }
            }
        }
        
        // Sort by similarity (descending) and take top K
        [similarities sortUsingComparator:^NSComparisonResult(NSDictionary *a, NSDictionary *b) {
            double simA = [a[@"similarity"] doubleValue];
            double simB = [b[@"similarity"] doubleValue];
            if (simA > simB) return NSOrderedAscending;
            if (simA < simB) return NSOrderedDescending;
            return NSOrderedSame;
        }];
        
        NSInteger resultCount = MIN(searchK, similarities.count);
        for (NSInteger i = 0; i < resultCount; i++) {
            NSDictionary *simInfo = similarities[i];
            NSDictionary *chunk = simInfo[@"chunk"];
            
            NSDictionary *result = @{
                @"chunkId": chunk[@"id"],
                @"content": chunk[@"content"],
                @"distance": simInfo[@"distance"],
                @"similarity": simInfo[@"similarity"],
                @"metadata": chunk[@"metadata"]
            };
            [results addObject:result];
        }
        
        RCTLogInfo(@"RAG: Found %ld similar chunks (threshold: %.3f)", (long)results.count, searchThreshold);
        resolve(results);
        
    } @catch (NSException *exception) {
        reject(@"RAG_SEARCH_ERROR", @"Failed to search similar vectors", nil);
    }
}

- (double)calculateCosineSimilarity:(NSArray<NSNumber *> *)vectorA chunkEmbedding:(NSArray<NSNumber *> *)vectorB {
    if (vectorA.count != vectorB.count) {
        return 0.0;
    }
    
    double dotProduct = 0.0;
    double normA = 0.0;
    double normB = 0.0;
    
    for (NSUInteger i = 0; i < vectorA.count; i++) {
        double a = [vectorA[i] doubleValue];
        double b = [vectorB[i] doubleValue];
        dotProduct += a * b;
        normA += a * a;
        normB += b * b;
    }
    
    if (normA == 0.0 || normB == 0.0) {
        return 0.0;
    }
    
    return dotProduct / (sqrt(normA) * sqrt(normB));
}

#pragma mark - Main RAG Function (Real Implementation)

RCT_EXPORT_METHOD(getPrompt:(NSString *)query
                  k:(nonnull NSNumber *)k
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (!self.modelLoaded || !self.textEmbedder) {
            reject(@"RAG_MODEL_NOT_LOADED", @"MediaPipe TextEmbedder not loaded", nil);
            return;
        }
        
        if (!self.isIndexLoaded) {
            reject(@"RAG_INDEX_NOT_LOADED", @"No document vectors available - process documents first", nil);
            return;
        }
        
        NSInteger searchK = k ? [k integerValue] : [self.ragConfig[@"defaultK"] integerValue];
        
        // Generate real embedding for query using MediaPipe
        NSArray *queryEmbedding = [self generateRealEmbedding:query];
        if (!queryEmbedding) {
            reject(@"RAG_EMBEDDING_ERROR", @"Failed to generate query embedding", nil);
            return;
        }
        
        // Search for similar chunks using real vector search
        dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
        __block NSArray *searchResults = nil;
        __block NSError *searchError = nil;
        
        [self searchSimilar:queryEmbedding k:@(searchK) threshold:nil resolver:^(id result) {
            searchResults = result;
            dispatch_semaphore_signal(semaphore);
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            searchError = error;
            dispatch_semaphore_signal(semaphore);
        }];
        
        dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);
        
        if (searchError) {
            reject(@"RAG_SEARCH_ERROR", @"Failed to search for similar content", searchError);
            return;
        }
        
        // Format prompt following TIC-13 pattern with real retrieved content
        NSMutableString *finalPrompt = [[NSMutableString alloc] initWithString:@"Please, use the following context to answer the user query:"];
        
        for (NSInteger idx = 0; idx < [searchResults count]; idx++) {
            NSDictionary *result = searchResults[idx];
            [finalPrompt appendFormat:@"\n%ld: %@;", (long)idx, result[@"content"]];
        }
        
        [finalPrompt appendFormat:@"\nAnd here is the user query:\n%@", query];
        
        RCTLogInfo(@"RAG: Generated prompt with %ld real context chunks", (long)[searchResults count]);
        resolve(finalPrompt);
        
    } @catch (NSException *exception) {
        reject(@"RAG_GETPROMPT_ERROR", @"Failed to process RAG query", nil);
    }
}

#pragma mark - Index Operations

RCT_EXPORT_METHOD(buildIndex:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        if (self.documentStore.count == 0) {
            reject(@"RAG_NO_DOCUMENTS", @"No documents to build index from - process documents first", nil);
            return;
        }
        
        RCTLogInfo(@"RAG: Index already built during document processing (%lu documents)", (unsigned long)self.documentStore.count);
        self.indexStats[@"isReady"] = @YES;
        resolve(@YES);
        
    } @catch (NSException *exception) {
        reject(@"RAG_BUILD_ERROR", @"Failed to build index", nil);
    }
}

RCT_EXPORT_METHOD(saveIndex:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    reject(@"RAG_NOT_IMPLEMENTED", @"Index persistence not yet implemented", nil);
}

RCT_EXPORT_METHOD(loadIndex:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    reject(@"RAG_NOT_IMPLEMENTED", @"Index persistence not yet implemented", nil);
}

#pragma mark - Statistics

RCT_EXPORT_METHOD(getIndexStats:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        resolve(self.indexStats);
    } @catch (NSException *exception) {
        reject(@"RAG_STATS_ERROR", @"Failed to get index stats", nil);
    }
}

#pragma mark - Configuration

RCT_EXPORT_METHOD(updateConfig:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        [self.ragConfig addEntriesFromDictionary:config];
        RCTLogInfo(@"RAG: Config updated: %@", config);
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"RAG_CONFIG_ERROR", @"Failed to update config", nil);
    }
}

RCT_EXPORT_METHOD(getConfig:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        resolve(self.ragConfig);
    } @catch (NSException *exception) {
        reject(@"RAG_CONFIG_ERROR", @"Failed to get config", nil);
    }
}

#pragma mark - Cleanup

RCT_EXPORT_METHOD(clearIndex:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        [self.documentStore removeAllObjects];
        [self.vectorIndex removeAllObjects];
        self.indexStats[@"totalVectors"] = @0;
        self.indexStats[@"isReady"] = @NO;
        self.isIndexLoaded = NO;
        
        RCTLogInfo(@"RAG: Index cleared");
        resolve(nil);
    } @catch (NSException *exception) {
        reject(@"RAG_CLEAR_ERROR", @"Failed to clear index", nil);
    }
}

RCT_EXPORT_METHOD(cleanup:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        [self clearIndex:^(id result) {
            // Clear completed
        } rejecter:^(NSString *code, NSString *message, NSError *error) {
            // Clear failed but continue cleanup
        }];
        
        // Cleanup MediaPipe resources
        self.textEmbedder = nil;
        self.modelLoaded = NO;
        
        RCTLogInfo(@"RAG: Cleanup completed");
        resolve(nil);
    } @catch (NSException *exception) {
        reject(@"RAG_CLEANUP_ERROR", @"Failed to cleanup", nil);
    }
}

@end
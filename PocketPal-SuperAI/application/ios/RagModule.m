#import "RagModule.h"
#import <React/RCTLog.h>

@interface RagModule()
@property (nonatomic, assign) BOOL isIndexLoaded;
@property (nonatomic, strong) NSMutableDictionary *ragConfig;
@property (nonatomic, strong) NSMutableArray *documentStore;
@property (nonatomic, strong) NSMutableDictionary *indexStats;
@end

@implementation RagModule

RCT_EXPORT_MODULE(RagModule);

- (instancetype)init
{
    self = [super init];
    if (self) {
        self.isIndexLoaded = NO;
        self.ragConfig = [[NSMutableDictionary alloc] initWithDictionary:@{
            @"modelType": @"universal_sentence_encoder",
            @"quantize": @YES,
            @"l2Normalize": @YES,
            @"delegate": @"gpu",
            @"dimensions": @512,
            @"maxChunkSize": @1000,
            @"chunkOverlap": @200,
            @"efConstruction": @16,
            @"efSearch": @16,
            @"M": @4,
            @"maxConnections": @16,
            @"defaultK": @2,
            @"defaultThreshold": @0.7
        }];
        self.documentStore = [[NSMutableArray alloc] init];
        self.indexStats = [[NSMutableDictionary alloc] initWithDictionary:@{
            @"totalVectors": @0,
            @"dimensions": @512,
            @"indexSize": @0,
            @"memoryUsage": @0,
            @"isReady": @NO
        }];
    }
    return self;
}

#pragma mark - Index Management

RCT_EXPORT_METHOD(isLoaded:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        resolve(@(self.isIndexLoaded));
    } @catch (NSException *exception) {
        reject(@"RAG_ERROR", @"Failed to check if index is loaded", nil);
    }
}

RCT_EXPORT_METHOD(loadFromInternalStorage:(NSString *)tokenizerPath
                  vectorsPath:(NSString *)vectorsPath
                  chunksPath:(NSString *)chunksPath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        RCTLogInfo(@"RAG: Loading from internal storage - tokenizer: %@, vectors: %@, chunks: %@", tokenizerPath, vectorsPath, chunksPath);
        
        // TODO: Implement actual TensorFlow Lite model loading
        // For now, simulate successful loading
        self.isIndexLoaded = YES;
        self.indexStats[@"isReady"] = @YES;
        
        resolve(@YES);
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
        RCTLogInfo(@"RAG: Loading from assets - tokenizer: %@, vectors: %@, chunks: %@", tokenizerPath, vectorsPath, chunksPath);
        
        // TODO: Implement actual Core ML model loading from assets
        // For now, simulate successful loading
        self.isIndexLoaded = YES;
        self.indexStats[@"isReady"] = @YES;
        
        resolve(@YES);
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
        NSTimeInterval startTime = [[NSDate date] timeIntervalSince1970];
        
        // Calculate chunks
        NSNumber *maxChunkSize = self.ragConfig[@"maxChunkSize"];
        NSInteger chunkSize = [maxChunkSize integerValue];
        NSInteger chunkCount = (NSInteger)ceil((double)content.length / chunkSize);
        
        // Store document (simplified for stub)
        NSString *documentId = [NSString stringWithFormat:@"doc_%lld", (long long)([[NSDate date] timeIntervalSince1970] * 1000)];
        NSDictionary *document = @{
            @"id": documentId,
            @"content": content,
            @"metadata": metadata,
            @"chunkCount": @(chunkCount),
            @"createdAt": @([[NSDate date] timeIntervalSince1970])
        };
        [self.documentStore addObject:document];
        
        // Update stats
        NSNumber *currentVectors = self.indexStats[@"totalVectors"];
        self.indexStats[@"totalVectors"] = @([currentVectors integerValue] + chunkCount);
        
        NSTimeInterval processingTime = ([[NSDate date] timeIntervalSince1970] - startTime) * 1000;
        
        NSDictionary *result = @{
            @"documentId": documentId,
            @"chunkCount": @(chunkCount),
            @"processingTime": @(processingTime),
            @"success": @YES
        };
        
        resolve(result);
    } @catch (NSException *exception) {
        reject(@"RAG_PROCESS_ERROR", @"Failed to process document", nil);
    }
}

#pragma mark - Embedding Generation

RCT_EXPORT_METHOD(generateEmbedding:(NSString *)text
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        // TODO: Implement actual Core ML embedding generation
        // For now, generate deterministic mock embedding
        NSNumber *dimensions = self.ragConfig[@"dimensions"];
        NSInteger dim = [dimensions integerValue];
        
        NSMutableArray *embedding = [[NSMutableArray alloc] initWithCapacity:dim];
        
        // Generate deterministic embedding based on text hash
        NSUInteger hash = [text hash];
        for (NSInteger i = 0; i < dim; i++) {
            NSUInteger seed = hash + i * 37;
            double value = sin(seed) * 10000;
            [embedding addObject:@(value - floor(value))];
        }
        
        resolve(embedding);
    } @catch (NSException *exception) {
        reject(@"RAG_EMBEDDING_ERROR", @"Failed to generate embedding", nil);
    }
}

RCT_EXPORT_METHOD(generateEmbeddings:(NSArray<NSString *> *)texts
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSMutableArray *embeddings = [[NSMutableArray alloc] initWithCapacity:texts.count];
        
        for (NSString *text in texts) {
            // Reuse single embedding generation logic
            NSNumber *dimensions = self.ragConfig[@"dimensions"];
            NSInteger dim = [dimensions integerValue];
            
            NSMutableArray *embedding = [[NSMutableArray alloc] initWithCapacity:dim];
            NSUInteger hash = [text hash];
            for (NSInteger i = 0; i < dim; i++) {
                NSUInteger seed = hash + i * 37;
                double value = sin(seed) * 10000;
                [embedding addObject:@(value - floor(value))];
            }
            [embeddings addObject:embedding];
        }
        
        resolve(embeddings);
    } @catch (NSException *exception) {
        reject(@"RAG_EMBEDDINGS_ERROR", @"Failed to generate embeddings", nil);
    }
}

#pragma mark - Vector Search

RCT_EXPORT_METHOD(searchSimilar:(NSArray<NSNumber *> *)embedding
                  k:(NSNumber *)k
                  threshold:(NSNumber *)threshold
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSInteger searchK = k ? [k integerValue] : [self.ragConfig[@"defaultK"] integerValue];
        double searchThreshold = threshold ? [threshold doubleValue] : [self.ragConfig[@"defaultThreshold"] doubleValue];
        
        // TODO: Implement actual HNSW vector search
        // For now, return mock results that pass threshold
        NSMutableArray *results = [[NSMutableArray alloc] init];
        
        for (NSInteger i = 0; i < searchK; i++) {
            double similarity = 0.9 - (i * 0.05);
            if (similarity >= searchThreshold) {
                NSDictionary *result = @{
                    @"chunkId": [NSString stringWithFormat:@"chunk_%ld", (long)i],
                    @"content": [NSString stringWithFormat:@"Retrieved content for chunk %ld based on vector similarity search.", (long)i],
                    @"distance": @(0.1 + i * 0.05),
                    @"similarity": @(similarity),
                    @"metadata": @{@"nativeResult": @YES, @"index": @(i)}
                };
                [results addObject:result];
            }
        }
        
        resolve(results);
    } @catch (NSException *exception) {
        reject(@"RAG_SEARCH_ERROR", @"Failed to search similar vectors", nil);
    }
}

#pragma mark - Main RAG Function

RCT_EXPORT_METHOD(getPrompt:(NSString *)query
                  k:(NSNumber *)k
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        NSInteger searchK = k ? [k integerValue] : [self.ragConfig[@"defaultK"] integerValue];
        
        // Generate embedding for query (using sync version for simplicity in stub)
        NSNumber *dimensions = self.ragConfig[@"dimensions"];
        NSInteger dim = [dimensions integerValue];
        
        NSMutableArray *queryEmbedding = [[NSMutableArray alloc] initWithCapacity:dim];
        NSUInteger hash = [query hash];
        for (NSInteger i = 0; i < dim; i++) {
            NSUInteger seed = hash + i * 37;
            double value = sin(seed) * 10000;
            [queryEmbedding addObject:@(value - floor(value))];
        }
        
        // Search for similar chunks
        NSMutableArray *results = [[NSMutableArray alloc] init];
        for (NSInteger i = 0; i < searchK; i++) {
            double similarity = 0.9 - (i * 0.05);
            NSDictionary *result = @{
                @"content": [NSString stringWithFormat:@"Context chunk %ld: Retrieved content based on similarity to query.", (long)i],
                @"similarity": @(similarity)
            };
            [results addObject:result];
        }
        
        // Format prompt following TIC-13 pattern
        NSMutableString *finalPrompt = [[NSMutableString alloc] initWithString:@"Please, use the following context to answer the user query:"];
        
        for (NSInteger idx = 0; idx < results.count; idx++) {
            NSDictionary *result = results[idx];
            [finalPrompt appendFormat:@"\n%ld: %@;", (long)idx, result[@"content"]];
        }
        
        [finalPrompt appendFormat:@"\nAnd here is the user query:\n%@", query];
        
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
        RCTLogInfo(@"RAG: Building index with %lu documents", (unsigned long)self.documentStore.count);
        
        // TODO: Implement actual HNSW index building
        // For now, simulate index building
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
    @try {
        RCTLogInfo(@"RAG: Saving index to %@", path);
        
        // TODO: Implement actual index serialization
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"RAG_SAVE_ERROR", @"Failed to save index", nil);
    }
}

RCT_EXPORT_METHOD(loadIndex:(NSString *)path
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
    @try {
        RCTLogInfo(@"RAG: Loading index from %@", path);
        
        // TODO: Implement actual index deserialization
        self.isIndexLoaded = YES;
        self.indexStats[@"isReady"] = @YES;
        
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"RAG_LOAD_INDEX_ERROR", @"Failed to load index", nil);
    }
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
        
        RCTLogInfo(@"RAG: Cleanup completed");
        resolve(nil);
    } @catch (NSException *exception) {
        reject(@"RAG_CLEANUP_ERROR", @"Failed to cleanup", nil);
    }
}

@end
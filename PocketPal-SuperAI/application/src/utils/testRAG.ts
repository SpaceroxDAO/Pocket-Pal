/**
 * RAG Native Module Test Utility
 * Quick test to check if the native RAG module is properly loaded
 */

import Rag from '../native/Rag';

export const testNativeRAGModule = async (): Promise<{
  nativeModuleDetected: boolean;
  configAvailable: boolean;
  isLoaded: boolean;
  testResults: string[];
}> => {
  const results: string[] = [];
  let nativeModuleDetected = false;
  let configAvailable = false;
  let isLoaded = false;

  try {
    // Test 1: Check if native module is detected
    results.push('Testing native module detection...');
    
    // Test 2: Check if RAG is loaded
    results.push('Testing RAG isLoaded()...');
    isLoaded = await Rag.isLoaded();
    results.push(`RAG isLoaded: ${isLoaded}`);
    
    // Test 3: If not loaded, try to load it from assets
    if (!isLoaded) {
      results.push('RAG not loaded, attempting to load from assets...');
      try {
        const loadResult = await Rag.loadFromAssets(
          'tokenizer.json',  // placeholder paths
          'vectors.bin',
          'chunks.json'
        );
        results.push(`Load from assets result: ${loadResult}`);
        
        // Check again if it's loaded
        isLoaded = await Rag.isLoaded();
        results.push(`RAG isLoaded after loadFromAssets: ${isLoaded}`);
      } catch (loadError) {
        results.push(`Load from assets failed: ${loadError.message}`);
      }
    }
    
    if (isLoaded) {
      nativeModuleDetected = true;
      
      // Test 3: Get configuration
      results.push('Testing RAG getConfig()...');
      const config = await Rag.getConfig();
      configAvailable = !!config;
      results.push(`Config retrieved: ${configAvailable}`);
      
      if (config) {
        results.push(`Config keys: ${Object.keys(config).join(', ')}`);
        results.push(`Model type: ${config.modelType}`);
        results.push(`Dimensions: ${config.dimensions}`);
      }
      
      // Test 4: Test document processing
      results.push('Testing document processing...');
      const testDocument = 'Artificial intelligence (AI) is a branch of computer science that aims to create intelligent machines that can think and act like humans. AI systems use algorithms and data to make decisions, recognize patterns, and solve problems. Machine learning is a subset of AI that enables computers to learn from data without being explicitly programmed.';
      const metadata = {
        title: 'AI Introduction',
        sourceType: 'text' as const,
        sourcePath: 'test',
        fileSize: testDocument.length,
        mimeType: 'text/plain'
      };
      
      try {
        const processResult = await Rag.processDocument(testDocument, metadata);
        results.push(`Document processing: SUCCESS`);
        results.push(`Chunks created: ${processResult.chunkCount}`);
        results.push(`Processing time: ${processResult.processingTime}ms`);
        
        // Test 5: Test RAG query after processing
        results.push('Testing RAG query with processed document...');
        const testQuery = 'What is artificial intelligence?';
        const prompt = await Rag.getPrompt(testQuery);
        results.push(`Query test: SUCCESS`);
        results.push(`Prompt length: ${prompt.length} characters`);
        results.push(`Contains context: ${prompt.includes('context') ? 'YES' : 'NO'}`);
        results.push(`Retrieved content preview: ${prompt.substring(0, 100)}...`);
        
      } catch (docError) {
        results.push(`Document processing failed: ${docError.message}`);
        
        // Still try the basic query to see what error we get
        try {
          results.push('Testing basic RAG query without documents...');
          const testQuery = 'What is artificial intelligence?';
          const prompt = await Rag.getPrompt(testQuery);
          results.push(`Query test: ${prompt ? 'SUCCESS' : 'FAILED'}`);
        } catch (queryError) {
          results.push(`Query failed: ${queryError.message}`);
        }
      }
    } else {
      results.push('RAG module not loaded - using fallback implementation');
    }
    
  } catch (error) {
    results.push(`Error during testing: ${error.message}`);
  }

  return {
    nativeModuleDetected,
    configAvailable,
    isLoaded,
    testResults: results,
  };
};

// Auto-run test when imported (for immediate feedback)
testNativeRAGModule().then(result => {
  console.log('=== RAG NATIVE MODULE TEST RESULTS ===');
  console.log(`Native module detected: ${result.nativeModuleDetected}`);
  console.log(`Config available: ${result.configAvailable}`);
  console.log(`Is loaded: ${result.isLoaded}`);
  console.log('Test log:');
  result.testResults.forEach((line, index) => {
    console.log(`  ${index + 1}: ${line}`);
  });
  console.log('=== END RAG TEST ===');
}).catch(error => {
  console.error('RAG test failed:', error);
});
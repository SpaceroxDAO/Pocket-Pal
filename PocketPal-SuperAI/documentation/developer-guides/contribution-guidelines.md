# Contribution Guidelines

## 📋 Overview

This guide establishes comprehensive development standards, practices, and contribution workflows for PocketPal SuperAI. These guidelines ensure code quality, maintainability, and successful collaboration across the development team.

**Code Quality Goal**: Enterprise-grade, maintainable, performant codebase  
**Collaboration Model**: Fork-based development with comprehensive review process  
**Standards Adherence**: TypeScript strict mode, comprehensive testing, accessibility compliance  

## 🎯 Development Philosophy

### Core Principles
1. **Privacy First**: All implementations must prioritize user privacy and local processing
2. **Performance Optimized**: Mobile-first performance with <2s response times
3. **Quality Over Speed**: Comprehensive testing and review over rapid delivery
4. **Accessibility by Design**: Universal access and usability from day one
5. **Documentation Driven**: Code is documented, decisions are explained
6. **Security Conscious**: Security considerations in every implementation

### Technical Standards
- **TypeScript Strict Mode**: All code must pass strict TypeScript compilation
- **Test Coverage**: Minimum 85% code coverage with 100% critical path coverage
- **Performance Budget**: Memory usage <500MB, response times <100ms for core features
- **Bundle Size**: Mobile-optimized bundle sizes with code splitting
- **Accessibility**: WCAG 2.1 AA compliance for all UI components

## 🛠️ Development Workflow

### 1. Getting Started
```bash
# Fork the repository
git clone https://github.com/your-username/pocketpal-superai.git
cd pocketpal-superai

# Add upstream remote
git remote add upstream https://github.com/pocketpal-superai/pocketpal-superai.git

# Set up development environment
yarn install
yarn setup:dev

# Create feature branch
git checkout -b feature/your-feature-name
```

### 2. Branch Naming Convention
```bash
# Feature branches
feature/rag-document-processing
feature/voice-command-recognition
feature/model-optimization

# Bug fix branches
fix/memory-leak-in-vector-search
fix/ios-recording-permissions

# Improvement branches
improve/search-performance
improve/ui-accessibility

# Documentation branches
docs/api-specifications
docs/deployment-guide

# Experimental branches
experiment/new-embedding-model
experiment/alternative-architecture
```

### 3. Commit Message Standards
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description
# Examples:
feat(rag): add PDF document processing with OCR support
fix(voice): resolve iOS microphone permission handling
docs(api): update RAG API documentation with examples
perf(vector): optimize HNSW search algorithm for mobile
test(integration): add RAG-voice pipeline testing
refactor(models): extract model loading logic to service
style(ui): update chat message styling for accessibility
chore(deps): update React Native to 0.72.0
```

#### Commit Types
- `feat`: New feature implementation
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting, missing semicolons, etc.
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding or correcting tests
- `chore`: Maintenance tasks, dependency updates
- `ci`: CI/CD pipeline changes
- `revert`: Reverting previous commits

#### Commit Scope
- `rag`: RAG system components
- `voice`: Voice processing features
- `models`: AI model management
- `vectors`: Vector storage and search
- `ui`: User interface components
- `api`: API and service layer
- `native`: Native module implementations
- `build`: Build system and configuration
- `deps`: Dependencies and package management

### 4. Code Review Process

#### Pull Request Template
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing Checklist
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Performance tests meet requirements
- [ ] Accessibility tests pass
- [ ] Manual testing completed

## Platform Testing
- [ ] iOS testing completed
- [ ] Android testing completed
- [ ] Cross-platform compatibility verified

## Documentation
- [ ] Code is self-documenting with clear naming
- [ ] Complex logic includes comments
- [ ] API documentation updated (if applicable)
- [ ] User documentation updated (if applicable)

## Performance Impact
- [ ] Memory usage profiled and within limits
- [ ] Response time requirements met
- [ ] Bundle size impact analyzed
- [ ] Battery impact considered

## Screenshots/Videos
(Include for UI changes)

## Related Issues
Fixes #(issue_number)
```

#### Review Criteria
Reviewers must verify:
1. **Functionality**: Code works as intended and meets requirements
2. **Quality**: Follows coding standards and best practices
3. **Testing**: Adequate test coverage and all tests pass
4. **Performance**: Meets performance requirements
5. **Security**: No security vulnerabilities introduced
6. **Accessibility**: UI changes maintain accessibility compliance
7. **Documentation**: Code is well-documented and clear

#### Review Process
1. **Automated Checks**: CI/CD pipeline must pass (tests, linting, builds)
2. **Code Review**: At least 2 approved reviews from core contributors
3. **Manual Testing**: Feature manually tested on both platforms
4. **Performance Review**: Performance impact assessed
5. **Security Review**: Security implications evaluated
6. **Final Approval**: Maintainer final approval and merge

## 📝 Coding Standards

### 1. TypeScript Standards
```typescript
// Use strict TypeScript configuration
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}

// Explicit typing for function parameters and returns
function processDocument(
  document: DocumentInput,
  options: ProcessingOptions
): Promise<ProcessingResult> {
  // Implementation
}

// Use enums for constants
enum ModelType {
  CHAT = 'chat',
  EMBEDDING = 'embedding',
  VOICE = 'voice'
}

// Proper interface definitions
interface RagDocument {
  readonly id: string;
  readonly content: string;
  readonly metadata: DocumentMetadata;
  readonly createdAt: Date;
}

// Use type guards for runtime type checking
function isValidDocument(obj: unknown): obj is RagDocument {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'content' in obj &&
    typeof (obj as any).id === 'string'
  );
}
```

### 2. React/React Native Standards
```typescript
// Use function components with hooks
const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onLongPress,
  showTimestamp = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  const handleLongPress = useCallback(() => {
    onLongPress?.(message);
  }, [message, onLongPress]);
  
  return (
    <TouchableOpacity
      testID="chat-message-container"
      onLongPress={handleLongPress}
      accessibilityLabel={`Message from ${message.isUser ? 'you' : 'AI'}: ${message.text}`}
      accessibilityRole="button"
    >
      <Text>{message.text}</Text>
      {showTimestamp && <Text>{formatTimestamp(message.timestamp)}</Text>}
    </TouchableOpacity>
  );
};

// Use proper prop types
interface ChatMessageProps {
  message: Message;
  onLongPress?: (message: Message) => void;
  showTimestamp?: boolean;
}

// Custom hooks for complex logic
const useRAGSearch = (query: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const search = useCallback(async (searchQuery: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await ragService.search(searchQuery);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (query.trim()) {
      search(query);
    }
  }, [query, search]);
  
  return { results, loading, error, search };
};
```

### 3. Performance Standards
```typescript
// Memoization for expensive computations
const ExpensiveComponent: React.FC<Props> = memo(({ data, config }) => {
  const processedData = useMemo(() => {
    return expensiveDataProcessing(data);
  }, [data]);
  
  const memoizedCallback = useCallback((id: string) => {
    onItemSelect(id);
  }, [onItemSelect]);
  
  return <ProcessedDataView data={processedData} onSelect={memoizedCallback} />;
});

// Lazy loading for large components
const RAGDocumentViewer = lazy(() => import('./RAGDocumentViewer'));
const VoiceSettings = lazy(() => import('./VoiceSettings'));

// Performance monitoring
const performanceWrap = <T extends any[], R>(
  fn: (...args: T) => R,
  name: string
): ((...args: T) => R) => {
  return (...args: T): R => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (__DEV__) {
      console.log(`${name} took ${end - start} milliseconds`);
    }
    
    return result;
  };
};

// Memory management
const useMemoryCleanup = () => {
  useEffect(() => {
    return () => {
      // Cleanup large objects, cancel ongoing operations
      ragService.cleanup();
      voiceService.cleanup();
    };
  }, []);
};
```

### 4. Testing Standards
```typescript
// Comprehensive test coverage
describe('RAGService', () => {
  let ragService: RAGService;
  
  beforeEach(() => {
    ragService = new RAGService();
    jest.clearAllMocks();
  });
  
  describe('document ingestion', () => {
    it('successfully ingests valid PDF documents', async () => {
      const mockDocument = createMockDocument();
      const result = await ragService.ingestDocument(mockDocument);
      
      expect(result.success).toBe(true);
      expect(result.documentId).toBeDefined();
    });
    
    it('handles invalid document formats gracefully', async () => {
      const invalidDocument = { type: 'invalid' };
      
      await expect(ragService.ingestDocument(invalidDocument))
        .rejects.toThrow('Unsupported document format');
    });
    
    it('meets performance requirements for document processing', async () => {
      const document = createLargeDocument();
      const startTime = performance.now();
      
      await ragService.ingestDocument(document);
      
      const processingTime = performance.now() - startTime;
      expect(processingTime).toBeLessThan(5000); // <5s for large documents
    });
  });
});

// Integration testing
describe('RAG-Voice Integration', () => {
  it('processes voice queries with RAG context', async () => {
    const voiceInput = await simulateVoiceInput('What is in the document?');
    const ragContext = await ragService.search(voiceInput.text);
    const response = await chatService.generateResponse(voiceInput.text, ragContext);
    
    expect(response).toContain('document');
    expect(ragContext.length).toBeGreaterThan(0);
  });
});
```

### 5. Documentation Standards
```typescript
/**
 * Processes documents for RAG ingestion with support for multiple formats.
 * 
 * @param document - The document to process (PDF, text, or web content)
 * @param options - Processing configuration options
 * @returns Promise resolving to processing result with document ID
 * 
 * @throws {DocumentProcessingError} When document format is unsupported
 * @throws {ValidationError} When document content is invalid
 * 
 * @example
 * ```typescript
 * const result = await ragService.ingestDocument(
 *   { type: 'pdf', path: '/path/to/document.pdf' },
 *   { chunking: 'semantic', embedding: 'local' }
 * );
 * 
 * if (result.success) {
 *   console.log(`Document ingested with ID: ${result.documentId}`);
 * }
 * ```
 */
async function ingestDocument(
  document: DocumentInput,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  // Implementation with detailed comments for complex logic
  
  // Validate input document format and content
  if (!isValidDocumentFormat(document)) {
    throw new DocumentProcessingError('Unsupported document format');
  }
  
  // Process document with chunking strategy
  // Using semantic chunking for better context preservation
  const chunks = await this.chunkDocument(document, options.chunking);
  
  // Generate embeddings using configured model
  const embeddings = await this.generateEmbeddings(chunks);
  
  // Store in vector database with metadata
  const documentId = await this.storeDocument(embeddings, document.metadata);
  
  return { success: true, documentId };
}
```

## 🔒 Security Guidelines

### 1. API Key Management
```typescript
// NEVER commit API keys or secrets
// Use environment variables
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

// Validate API keys before use
function validateApiKey(key: string): boolean {
  return key.startsWith('sk-') && key.length > 20;
}

// Sanitize user inputs
function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potentially dangerous characters
    .substring(0, 1000); // Limit length
}
```

### 2. Privacy Protection
```typescript
// Ensure local processing when possible
const processLocally = async (data: UserData): Promise<Result> => {
  // Process sensitive data locally without sending to external services
  return await localProcessingService.process(data);
};

// Minimize data collection
interface UserPreferences {
  // Only collect necessary data
  readonly voiceEnabled: boolean;
  readonly ragEnabled: boolean;
  // Do NOT collect personal information
}

// Secure data storage
const secureStorage = {
  store: async (key: string, data: any): Promise<void> => {
    // Encrypt sensitive data before storage
    const encrypted = await encrypt(JSON.stringify(data));
    await AsyncStorage.setItem(key, encrypted);
  },
  
  retrieve: async (key: string): Promise<any> => {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = await decrypt(encrypted);
    return JSON.parse(decrypted);
  }
};
```

### 3. Input Validation
```typescript
// Validate all user inputs
const validateDocumentUpload = (file: File): ValidationResult => {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File too large' };
  }
  
  // Check file type
  const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Unsupported file type' };
  }
  
  // Check file name for security
  if (file.name.includes('..') || file.name.includes('/')) {
    return { valid: false, error: 'Invalid file name' };
  }
  
  return { valid: true };
};
```

## ♿ Accessibility Standards

### 1. Component Accessibility
```typescript
// Proper accessibility labels and roles
const VoiceRecordButton: React.FC<Props> = ({ isRecording, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      accessibilityHint={
        isRecording 
          ? 'Double tap to stop voice recording'
          : 'Double tap to start recording your voice message'
      }
      accessibilityState={{ selected: isRecording }}
    >
      <Icon name={isRecording ? 'stop' : 'microphone'} />
    </TouchableOpacity>
  );
};

// Focus management
const ChatScreen: React.FC = () => {
  const inputRef = useRef<TextInput>(null);
  
  const sendMessage = useCallback(() => {
    // Send message logic
    
    // Return focus to input after sending
    inputRef.current?.focus();
  }, []);
  
  return (
    <View>
      <FlatList
        data={messages}
        renderItem={({ item }) => <ChatMessage message={item} />}
        accessibilityRole="log"
        accessibilityLabel="Chat conversation"
      />
      <TextInput
        ref={inputRef}
        placeholder="Type your message..."
        accessibilityLabel="Message input"
        accessibilityRole="textbox"
      />
    </View>
  );
};
```

### 2. Voice Interface Accessibility
```typescript
// Provide voice alternatives for all interactions
const useVoiceCommands = () => {
  const processVoiceCommand = useCallback((command: string) => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Voice navigation commands
    if (normalizedCommand.includes('go to settings')) {
      navigation.navigate('Settings');
      announceToScreenReader('Navigating to settings');
    } else if (normalizedCommand.includes('upload document')) {
      openDocumentPicker();
      announceToScreenReader('Opening document picker');
    }
    // ... more commands
  }, []);
  
  return { processVoiceCommand };
};

// Screen reader announcements
const announceToScreenReader = (message: string) => {
  AccessibilityInfo.announceForAccessibility(message);
};
```

## 🚀 Performance Guidelines

### 1. Mobile Optimization
```typescript
// Bundle splitting for faster loading
const LazyRAGSettings = lazy(() => 
  import('./RAGSettings').then(module => ({ default: module.RAGSettings }))
);

// Image optimization
const OptimizedImage: React.FC<ImageProps> = ({ source, ...props }) => {
  return (
    <Image
      source={source}
      resizeMode="contain"
      progressiveRenderingEnabled
      {...props}
    />
  );
};

// Memory management
const useLargeDataCleanup = (data: LargeData[]) => {
  useEffect(() => {
    return () => {
      // Clean up large data arrays when component unmounts
      data.length = 0;
    };
  }, [data]);
};
```

### 2. Network Optimization
```typescript
// Implement caching strategies
const useAPICache = <T>(key: string, fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = await cache.get(key);
    if (cached && !isExpired(cached)) {
      setData(cached.data);
      return;
    }
    
    setLoading(true);
    try {
      const result = await fetcher();
      setData(result);
      
      // Cache the result
      await cache.set(key, { data: result, timestamp: Date.now() });
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);
  
  return { data, loading, refetch: fetchData };
};
```

## 📚 Documentation Requirements

### 1. API Documentation
- All public APIs must have JSDoc comments
- Include parameter types, return types, and examples
- Document error conditions and exceptions
- Provide usage examples

### 2. Architecture Documentation
- High-level system diagrams
- Component interaction diagrams
- Data flow documentation
- Integration patterns

### 3. User Documentation
- Feature usage guides
- Configuration instructions
- Troubleshooting guides
- FAQ sections

## 🔄 Release Process

### 1. Version Numbering
Follow [Semantic Versioning](https://semver.org/):
- `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- `MAJOR`: Breaking changes
- `MINOR`: New features (backward compatible)
- `PATCH`: Bug fixes (backward compatible)

### 2. Release Checklist
- [ ] All tests pass (unit, integration, E2E)
- [ ] Performance benchmarks meet requirements
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version number incremented
- [ ] Release notes prepared
- [ ] App store assets updated (if applicable)

### 3. Hotfix Process
For critical bugs in production:
1. Create hotfix branch from main
2. Fix the issue with minimal changes
3. Fast-track testing and review
4. Deploy immediately
5. Merge back to develop branch

## ❌ What NOT to Do

### Code Quality
- ❌ Don't commit code without tests
- ❌ Don't ignore TypeScript errors
- ❌ Don't use `any` type without justification
- ❌ Don't commit commented-out code
- ❌ Don't commit console.log statements
- ❌ Don't commit personal API keys or secrets

### Performance
- ❌ Don't create memory leaks with uncleaned listeners
- ❌ Don't perform expensive operations on the main thread
- ❌ Don't ignore bundle size increases
- ❌ Don't skip performance testing

### Security
- ❌ Don't store sensitive data in plain text
- ❌ Don't trust user input without validation
- ❌ Don't expose internal implementation details
- ❌ Don't use deprecated security practices

### Accessibility
- ❌ Don't create UI without accessibility labels
- ❌ Don't ignore screen reader compatibility
- ❌ Don't use color as the only way to convey information
- ❌ Don't create focus traps without escape mechanisms

## 🆘 Getting Help

### 1. Internal Resources
- **Development Setup Issues**: See [Development Setup Guide](./development-setup-guide.md)
- **Testing Questions**: See [Testing Strategy Guide](./testing-strategy-guide.md)
- **Architecture Questions**: Review architecture documentation
- **Code Review Feedback**: Respond to reviewers constructively

### 2. Communication Channels
- **Bug Reports**: Create GitHub issues with detailed reproduction steps
- **Feature Requests**: Discuss in GitHub discussions before implementation
- **Questions**: Use appropriate communication channels for the team
- **Documentation Issues**: Create issues in the documentation repository

### 3. Escalation Process
1. **Level 1**: Self-service documentation and guides
2. **Level 2**: Team discussion and collaboration
3. **Level 3**: Maintainer consultation for complex decisions
4. **Level 4**: Architecture review for system-wide changes

## ✅ Contribution Checklist

### Before Starting
- [ ] Issue exists for the work (bug report or feature request)
- [ ] Assignment confirmed to avoid duplicate work
- [ ] Development environment set up and tested
- [ ] Codebase and architecture understood

### During Development
- [ ] Following TypeScript and React Native best practices
- [ ] Writing tests as you develop features
- [ ] Running linters and formatters regularly
- [ ] Documenting complex logic and public APIs
- [ ] Testing on both iOS and Android platforms

### Before Submitting
- [ ] All tests pass locally
- [ ] Code coverage meets requirements (>85%)
- [ ] Performance requirements met
- [ ] Accessibility compliance verified
- [ ] Documentation updated (code and user docs)
- [ ] Self-review completed
- [ ] Pull request description complete

### After Submission
- [ ] Respond to review feedback promptly
- [ ] Make requested changes thoroughly
- [ ] Ensure CI/CD pipeline passes
- [ ] Address any merge conflicts
- [ ] Verify deployed changes work correctly

---

**Guidelines Version**: 1.0  
**Last Updated**: June 23, 2025  
**Review Cycle**: Quarterly updates based on team feedback and evolving best practices  
**Compliance**: Required for all contributions to maintain code quality and project standards
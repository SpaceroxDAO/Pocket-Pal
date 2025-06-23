# Model Management API Specification

## 📋 Overview

This document defines the API specifications for Model Management in PocketPal SuperAI, covering AI model downloading, installation, configuration, and sharing based on analysis of tjipenk's model sharing implementation and community ecosystem features.

**Version**: 1.0  
**Status**: Specification  
**Based on**: tjipenk model sharing analysis + community ecosystem research  

## 🏗️ Architecture Overview

The Model Management API provides comprehensive model lifecycle management including discovery, download, installation, configuration, sharing, and community features for local AI models optimized for mobile devices.

### Core Components
- **Model Discovery**: Community model marketplace and recommendations
- **Download Management**: Efficient model downloading with progress tracking
- **Installation Engine**: Automated model setup and optimization
- **Configuration System**: Model parameter management and optimization
- **Sharing Platform**: Community model distribution and rating system
- **Version Control**: Model versioning and update management

## 🤖 Model Discovery API

#### List Available Models
```typescript
GET /api/models/discover

interface DiscoverModelsRequest {
  category?: 'chat' | 'embedding' | 'voice' | 'vision' | 'all';
  size?: 'small' | 'medium' | 'large' | 'all';  // <1GB, 1-5GB, >5GB
  language?: string[];                           // Supported languages
  features?: string[];                          // Required capabilities
  sort?: 'popular' | 'rating' | 'size' | 'recent';
  page?: number;
  limit?: number;                               // Default: 20
}

interface DiscoverModelsResponse {
  models: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    version: string;
    size: number;                               // Bytes
    author: {
      name: string;
      verified: boolean;
      reputation: number;                       // 0-100 score
    };
    metrics: {
      downloads: number;
      rating: number;                           // 0-5 stars
      reviews: number;
      performance: {
        speed: number;                          // Tokens/second
        quality: number;                        // Quality score 0-100
        memory: number;                         // MB required
      };
    };
    compatibility: {
      platforms: string[];                      // ['ios', 'android']
      minRAM: number;                          // MB
      architecture: string[];                  // ['arm64', 'x86_64']
    };
    features: string[];                         // Supported features
    tags: string[];                            // Search tags
    license: string;
    createdAt: string;
    updatedAt: string;
  }>;
  pagination: {
    total: number;
    page: number;
    pages: number;
    hasNext: boolean;
  };
  filters: {
    categories: string[];
    sizes: string[];
    languages: string[];
    features: string[];
  };
}
```

#### Get Model Details
```typescript
GET /api/models/{modelId}

interface ModelDetailsResponse {
  model: {
    id: string;
    name: string;
    description: string;
    longDescription: string;
    category: string;
    version: string;
    size: number;
    checksums: {
      sha256: string;
      md5: string;
    };
    author: {
      name: string;
      email?: string;
      website?: string;
      verified: boolean;
      reputation: number;
    };
    metrics: {
      downloads: number;
      rating: number;
      reviews: number;
      performance: {
        benchmarks: Array<{
          name: string;
          score: number;
          unit: string;
          device: string;
        }>;
        averageSpeed: number;                   // Tokens/second
        qualityScore: number;                   // 0-100
        memoryUsage: number;                    // MB
      };
    };
    compatibility: {
      platforms: string[];
      minRAM: number;
      maxRAM?: number;
      architecture: string[];
      osVersions: {
        ios?: string;                           // Minimum iOS version
        android?: string;                       // Minimum Android API
      };
    };
    configuration: {
      parameters: Array<{
        name: string;
        type: 'number' | 'string' | 'boolean' | 'select';
        default: any;
        range?: [number, number];               // For numbers
        options?: string[];                     // For select
        description: string;
      }>;
      presets: Array<{
        name: string;
        description: string;
        parameters: object;
        performance: {
          speed: string;                        // 'fast' | 'balanced' | 'quality'
          memory: number;                       // MB
        };
      }>;
    };
    files: Array<{
      name: string;
      size: number;
      url: string;
      checksum: string;
      required: boolean;
    }>;
    dependencies: Array<{
      type: 'runtime' | 'library' | 'model';
      name: string;
      version: string;
      optional: boolean;
    }>;
    license: {
      type: string;
      text: string;
      commercial: boolean;
      attribution: boolean;
    };
    documentation: {
      readme: string;
      examples: Array<{
        title: string;
        code: string;
        description: string;
      }>;
      changelog: string;
    };
    community: {
      reviews: Array<{
        user: string;
        rating: number;
        comment: string;
        device: string;
        performance: object;
        timestamp: string;
      }>;
      discussions: number;                      // Count
      issues: number;                          // Count
    };
  };
}
```

## 📥 Download Management API

#### Start Model Download
```typescript
POST /api/models/download

interface DownloadModelRequest {
  modelId: string;
  version?: string;                             // Default: latest
  files?: string[];                            // Specific files, default: all required
  priority?: 'high' | 'normal' | 'low';
  wifi_only?: boolean;                         // Default: true
  background?: boolean;                        // Background download
}

interface DownloadModelResponse {
  downloadId: string;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'error';
  model: {
    id: string;
    name: string;
    version: string;
    totalSize: number;                          // Total bytes to download
  };
  progress: {
    downloaded: number;                         // Bytes downloaded
    percentage: number;                         // 0-100
    speed: number;                             // Bytes/second
    eta: number;                               // Seconds remaining
  };
  files: Array<{
    name: string;
    status: 'pending' | 'downloading' | 'completed' | 'error';
    progress: number;                          // 0-100
  }>;
  error?: string;
}
```

#### Get Download Status
```typescript
GET /api/models/download/{downloadId}

interface DownloadStatus {
  downloadId: string;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'error';
  progress: {
    downloaded: number;
    totalSize: number;
    percentage: number;
    speed: number;                             // Current speed
    avgSpeed: number;                          // Average speed
    eta: number;                               // Estimated time remaining
  };
  files: Array<{
    name: string;
    status: string;
    downloaded: number;
    size: number;
    progress: number;
  }>;
  timestamps: {
    started: string;
    updated: string;
    completed?: string;
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
```

#### Control Download
```typescript
POST /api/models/download/{downloadId}/control

interface ControlDownloadRequest {
  action: 'pause' | 'resume' | 'cancel' | 'retry';
}

interface ControlDownloadResponse {
  downloadId: string;
  action: string;
  status: string;
  success: boolean;
  message?: string;
}
```

## 🔧 Model Installation API

#### Install Downloaded Model
```typescript
POST /api/models/install

interface InstallModelRequest {
  downloadId?: string;                          // From download
  modelPath?: string;                          // Or local path
  configuration?: {
    preset?: string;                           // Named preset
    parameters?: object;                       // Custom parameters
  };
  optimize?: boolean;                          // Device optimization
  validate?: boolean;                          // Validation after install
}

interface InstallModelResponse {
  installationId: string;
  status: 'installing' | 'optimizing' | 'validating' | 'completed' | 'error';
  model: {
    id: string;
    name: string;
    version: string;
    installedSize: number;                     // Actual disk usage
  };
  progress: {
    step: string;                              // Current step
    percentage: number;                        // 0-100
    message: string;                           // Status message
  };
  validation?: {
    passed: boolean;
    tests: Array<{
      name: string;
      status: 'passed' | 'failed' | 'skipped';
      message?: string;
    }>;
  };
  optimization?: {
    applied: boolean;
    techniques: string[];                      // Applied optimizations
    sizeReduction: number;                     // Percentage
    speedImprovement: number;                  // Percentage
  };
  error?: string;
}
```

#### Get Installation Status
```typescript
GET /api/models/install/{installationId}

interface InstallationStatus {
  installationId: string;
  status: string;
  progress: {
    step: string;
    percentage: number;
    message: string;
    eta?: number;                              // Seconds remaining
  };
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
}
```

## 📱 Installed Models API

#### List Installed Models
```typescript
GET /api/models/installed

interface InstalledModelsResponse {
  models: Array<{
    id: string;
    name: string;
    version: string;
    category: string;
    status: 'ready' | 'loading' | 'error' | 'updating';
    size: number;                              // Disk usage
    installedAt: string;
    lastUsed?: string;
    usage: {
      sessions: number;                        // Usage count
      totalTime: number;                       // Total runtime minutes
      averageSpeed: number;                    // Tokens/second
    };
    configuration: {
      preset: string;
      parameters: object;
      optimized: boolean;
    };
    health: {
      integrity: boolean;                      // Files intact
      performance: number;                     // Performance score 0-100
      errors: string[];                        // Recent errors
    };
  }>;
  storage: {
    totalUsed: number;                         // Total disk usage
    available: number;                         // Available space
    recommended: number;                       // Recommended free space
  };
}
```

#### Get Model Info
```typescript
GET /api/models/installed/{modelId}

interface InstalledModelInfo {
  model: {
    id: string;
    name: string;
    version: string;
    description: string;
    category: string;
    status: string;
    size: number;
    installedAt: string;
    configuration: object;
  };
  performance: {
    averageSpeed: number;                      // Tokens/second
    memoryUsage: number;                       // Current RAM usage
    cpuUsage: number;                         // Current CPU usage
    quality: {
      responses: number;                       // Total responses
      rating: number;                         // Average user rating
      feedback: {
        positive: number;
        negative: number;
      };
    };
  };
  files: Array<{
    name: string;
    size: number;
    path: string;
    checksum: string;
    valid: boolean;
  }>;
  usage: {
    sessions: Array<{
      date: string;
      duration: number;                        // Minutes
      messages: number;
      rating?: number;
    }>;
    statistics: {
      totalSessions: number;
      totalMessages: number;
      averageSession: number;                  // Minutes
      peakUsage: string;                       // Date of peak usage
    };
  };
}
```

#### Configure Model
```typescript
PUT /api/models/installed/{modelId}/config

interface ConfigureModelRequest {
  preset?: string;                             // Named preset
  parameters?: object;                         // Parameter overrides
  optimization?: {
    quantization?: boolean;                    // Enable quantization
    pruning?: boolean;                         // Enable pruning
    caching?: boolean;                         // Enable response caching
  };
}

interface ConfigureModelResponse {
  modelId: string;
  configuration: object;                       // Applied configuration
  changes: Array<{
    parameter: string;
    from: any;
    to: any;
  }>;
  performance: {
    expectedSpeed: number;                     // Estimated tokens/second
    expectedMemory: number;                    // Estimated RAM usage
    qualityImpact: number;                     // Quality change -100 to +100
  };
  requiresRestart: boolean;
}
```

#### Uninstall Model
```typescript
DELETE /api/models/installed/{modelId}

interface UninstallModelRequest {
  removeData?: boolean;                        // Remove user data/cache
  keepConfiguration?: boolean;                 // Keep config for reinstall
}

interface UninstallModelResponse {
  modelId: string;
  status: 'uninstalled' | 'error';
  spaceFreed: number;                         // Bytes freed
  backup?: {
    configurationSaved: boolean;
    dataSaved: boolean;
    backupPath?: string;
  };
  error?: string;
}
```

## 🌐 Model Sharing API

#### Share Model
```typescript
POST /api/models/share

interface ShareModelRequest {
  modelId: string;                             // Local model ID
  metadata: {
    name: string;
    description: string;
    category: string;
    tags: string[];
    license: string;
    readme?: string;
  };
  visibility: 'public' | 'unlisted' | 'private';
  allowCommercial?: boolean;
  requireAttribution?: boolean;
}

interface ShareModelResponse {
  shareId: string;
  status: 'uploading' | 'processing' | 'published' | 'error';
  url?: string;                               // Share URL when published
  progress: {
    uploaded: number;                         // Bytes uploaded
    total: number;                           // Total bytes
    percentage: number;                      // 0-100
  };
  estimated: {
    uploadTime: number;                      // Seconds remaining
    processingTime: number;                  // Processing after upload
  };
}
```

#### Get Shared Models
```typescript
GET /api/models/shared

interface SharedModelsResponse {
  models: Array<{
    shareId: string;
    modelId: string;
    name: string;
    description: string;
    category: string;
    visibility: string;
    status: 'published' | 'processing' | 'rejected' | 'private';
    metrics: {
      downloads: number;
      rating: number;
      reviews: number;
    };
    sharedAt: string;
    url?: string;
  }>;
}
```

#### Import Model
```typescript
POST /api/models/import

interface ImportModelRequest {
  source: {
    type: 'url' | 'share_id' | 'file';
    value: string;                            // URL, share ID, or file path
  };
  options?: {
    customName?: string;
    configuration?: object;
    autoInstall?: boolean;
  };
}

interface ImportModelResponse {
  importId: string;
  status: 'downloading' | 'validating' | 'installing' | 'completed' | 'error';
  model?: {
    id: string;
    name: string;
    size: number;
  };
  progress: {
    step: string;
    percentage: number;
  };
}
```

## 🔄 Model Updates API

#### Check for Updates
```typescript
GET /api/models/updates

interface UpdatesResponse {
  updates: Array<{
    modelId: string;
    name: string;
    currentVersion: string;
    latestVersion: string;
    updateSize: number;                        // Bytes to download
    changes: {
      type: 'major' | 'minor' | 'patch';
      description: string;
      improvements: string[];
      breaking: boolean;
    };
    compatibility: boolean;                    // Compatible with current config
    urgent: boolean;                          // Security/critical update
  }>;
  automatic: {
    enabled: boolean;
    schedule: string;                         // When auto-updates run
    filter: string;                          // Which updates to auto-apply
  };
}
```

#### Update Model
```typescript
POST /api/models/update

interface UpdateModelRequest {
  modelId: string;
  version?: string;                           // Default: latest
  preserveConfiguration?: boolean;            // Default: true
  backup?: boolean;                          // Create backup first
}

interface UpdateModelResponse {
  updateId: string;
  status: 'downloading' | 'installing' | 'completed' | 'error';
  backup?: {
    created: boolean;
    path?: string;
    size?: number;
  };
  progress: {
    step: string;
    percentage: number;
    message: string;
  };
}
```

## ⚙️ Configuration API

#### Model Management Configuration
```typescript
GET /api/models/config
PUT /api/models/config

interface ModelManagementConfig {
  downloads: {
    maxConcurrent: number;                    // Concurrent downloads
    maxBandwidth: number;                     // KB/s limit
    wifiOnly: boolean;                       // Download on WiFi only
    autoRetry: boolean;                      // Auto-retry failed downloads
    retryAttempts: number;                   // Max retry attempts
    resumeSupport: boolean;                  // Resume interrupted downloads
  };
  installation: {
    autoOptimize: boolean;                   // Auto-optimize for device
    validateAfterInstall: boolean;           // Validate installation
    cleanupAfterInstall: boolean;           // Remove download files
    maxConcurrent: number;                   // Concurrent installations
  };
  storage: {
    maxTotalSize: number;                    // Max total model storage (MB)
    autoCleanup: boolean;                    // Auto-remove unused models
    cleanupThreshold: number;                // Storage threshold for cleanup
    retentionDays: number;                   // Days to keep unused models
  };
  updates: {
    automatic: boolean;                      // Auto-update models
    schedule: string;                        // Update schedule (cron)
    types: string[];                         // Update types to auto-apply
    notifications: boolean;                  // Notify about updates
  };
  sharing: {
    enabled: boolean;                        // Allow model sharing
    defaultVisibility: string;               // Default share visibility
    autoMetadata: boolean;                   // Auto-generate metadata
    uploadBandwidth: number;                 // Upload bandwidth limit KB/s
  };
  privacy: {
    analytics: boolean;                      // Share usage analytics
    crashReports: boolean;                   // Share crash reports
    telemetry: string;                       // Telemetry level
  };
}
```

## 📊 Analytics API

#### Model Usage Analytics
```typescript
GET /api/models/analytics

interface ModelAnalytics {
  overview: {
    totalModels: number;
    activeModels: number;
    totalUsage: number;                       // Total minutes
    storageUsed: number;                      // Total MB used
  };
  usage: {
    daily: Array<{
      date: string;
      sessions: number;
      duration: number;                       // Minutes
      models: string[];                       // Models used
    }>;
    popular: Array<{
      modelId: string;
      name: string;
      sessions: number;
      duration: number;
      rating: number;
    }>;
  };
  performance: {
    averageSpeed: number;                     // Tokens/second across all models
    memoryEfficiency: number;                 // MB per model average
    reliability: number;                      // Success rate percentage
    deviceOptimization: number;               // Optimization score 0-100
  };
  recommendations: Array<{
    type: 'install' | 'update' | 'configure' | 'remove';
    modelId?: string;
    reason: string;
    benefit: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}
```

## 🔒 Error Handling

### Standard Error Response
```typescript
interface ModelError {
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
| `MODEL_001` | Model not found | Check model ID |
| `MODEL_002` | Insufficient storage space | Free up space |
| `MODEL_003` | Download failed | Check network connection |
| `MODEL_004` | Installation failed | Check model integrity |
| `MODEL_005` | Incompatible model | Check device compatibility |
| `MODEL_006` | Configuration invalid | Validate parameters |
| `MODEL_007` | Model corrupted | Re-download model |
| `MODEL_008` | Permission denied | Check file permissions |
| `MODEL_009` | Network unavailable | Check internet connection |
| `MODEL_010` | Quota exceeded | Upgrade plan or remove models |

## 📱 Mobile Integration Example

```typescript
import { ModelManager } from 'pocketpal-superai-models';

const modelManager = new ModelManager({
  autoUpdate: true,
  wifiOnly: true,
  maxStorage: 5000 // MB
});

// Discover and install a model
const models = await modelManager.discover({
  category: 'chat',
  size: 'medium'
});

const downloadId = await modelManager.download(models[0].id);
await modelManager.waitForDownload(downloadId);

const installId = await modelManager.install({
  downloadId,
  configuration: { preset: 'balanced' }
});

// Use the model
const model = await modelManager.getModel(models[0].id);
const response = await model.generate('Hello, how are you?');
```

---

**API Version**: 1.0  
**Last Updated**: June 23, 2025  
**Implementation Status**: Specification Complete  
**Based on Research**: tjipenk model sharing + community ecosystem analysis  
**Next Phase**: Integration with RAG and Voice APIs
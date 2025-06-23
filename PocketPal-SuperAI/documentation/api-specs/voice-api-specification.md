# Voice API Specification

## 📋 Overview

This document defines the API specifications for the Voice Processing system in PocketPal SuperAI, based on comprehensive analysis of the-rich-piana's implementation and enhanced with privacy-focused local processing capabilities.

**Version**: 1.0  
**Status**: Specification  
**Based on**: the-rich-piana voice implementation analysis  

## 🏗️ Architecture Overview

The Voice API provides speech-to-text transcription, voice commands, audio processing, and text-to-speech capabilities with both cloud (Groq) and local processing options for maximum privacy and performance.

### Core Components
- **Audio Recording**: Cross-platform audio capture with visual feedback
- **Speech Recognition**: Local and cloud-based transcription services
- **Voice Commands**: Intent recognition and action execution
- **Audio Processing**: Noise reduction, quality enhancement, and format optimization
- **Text-to-Speech**: Natural voice output generation

## 🎤 Audio Recording API

#### Start Recording
```typescript
POST /api/voice/recording/start

interface StartRecordingRequest {
  quality?: 'low' | 'medium' | 'high';     // Default: 'medium'
  format?: 'mp3' | 'm4a' | 'wav';          // Platform optimized
  maxDuration?: number;                     // Seconds, default: 120
  noiseReduction?: boolean;                 // Default: true
  voiceActivityDetection?: boolean;         // Default: true
}

interface StartRecordingResponse {
  sessionId: string;
  status: 'recording' | 'error';
  audioPath: string;                        // Local file path
  estimatedSize: number;                    // Bytes
  timestamp: string;
  error?: string;
}
```

#### Stop Recording
```typescript
POST /api/voice/recording/stop

interface StopRecordingRequest {
  sessionId: string;
  autoTranscribe?: boolean;                 // Default: true
  transcriptionService?: 'local' | 'groq' | 'auto';
}

interface StopRecordingResponse {
  sessionId: string;
  audioPath: string;
  duration: number;                         // Seconds
  fileSize: number;                         // Bytes
  quality: {
    signalToNoise: number;                  // dB
    clarity: number;                        // 0-1 score
    voiceActivity: number;                  // Percentage
  };
  status: 'completed' | 'error';
  error?: string;
}
```

#### Get Recording Status
```typescript
GET /api/voice/recording/{sessionId}/status

interface RecordingStatus {
  sessionId: string;
  status: 'recording' | 'stopped' | 'processing' | 'completed' | 'error';
  duration: number;                         // Current duration in seconds
  fileSize: number;                         // Current file size
  audioLevels?: {
    peak: number;                           // Peak volume 0-1
    average: number;                        // Average volume 0-1
    silence: number;                        // Silence percentage
  };
}
```

## 🗣️ Speech Recognition API

#### Transcribe Audio
```typescript
POST /api/voice/transcription/transcribe

interface TranscribeRequest {
  audioPath?: string;                       // Local file path
  sessionId?: string;                       // Or recording session
  service: 'local' | 'groq' | 'auto';
  language?: string;                        // Default: 'auto-detect'
  prompt?: string;                          // Context hint for better accuracy
  temperature?: number;                     // 0-1, creativity for transcription
  options?: {
    punctuation?: boolean;                  // Add punctuation
    formatting?: boolean;                   // Format numbers, dates
    speakerDetection?: boolean;             // Multiple speakers
    confidence?: boolean;                   // Return confidence scores
  };
}

interface TranscribeResponse {
  transcription: {
    text: string;
    confidence: number;                     // Overall confidence 0-1
    language: string;                       // Detected language
    segments?: Array<{
      text: string;
      start: number;                        // Start time in seconds
      end: number;                          // End time in seconds
      confidence: number;
      speaker?: string;                     // If speaker detection enabled
    }>;
  };
  processing: {
    service: string;                        // Service used
    duration: number;                       // Processing time in ms
    audioDuration: number;                  // Audio length in seconds
  };
  error?: string;
}
```

#### Batch Transcription
```typescript
POST /api/voice/transcription/batch

interface BatchTranscribeRequest {
  audioFiles: Array<{
    path: string;
    language?: string;
    priority?: 'high' | 'normal' | 'low';
  }>;
  service: 'local' | 'groq' | 'auto';
  concurrency?: number;                     // Default: 3
}

interface BatchTranscribeResponse {
  batchId: string;
  status: 'queued' | 'processing' | 'completed';
  progress: {
    total: number;
    completed: number;
    failed: number;
    estimatedCompletion: string;
  };
  results?: Array<{
    audioPath: string;
    transcription?: string;
    confidence?: number;
    error?: string;
  }>;
}
```

## 🎯 Voice Commands API

#### Register Voice Command
```typescript
POST /api/voice/commands/register

interface RegisterCommandRequest {
  name: string;                             // Command identifier
  phrases: string[];                        // Trigger phrases
  action: {
    type: 'navigation' | 'function' | 'macro' | 'system';
    target: string;                         // Action target
    parameters?: object;                    // Action parameters
  };
  enabled?: boolean;                        // Default: true
  language?: string;                        // Default: 'en'
  confidence?: number;                      // Min confidence 0-1
}

interface RegisterCommandResponse {
  commandId: string;
  status: 'registered' | 'error';
  conflicts?: string[];                     // Conflicting commands
  error?: string;
}
```

#### Process Voice Command
```typescript
POST /api/voice/commands/process

interface ProcessCommandRequest {
  text: string;                             // Transcribed text
  sessionId?: string;                       // Optional session context
  context?: {
    currentScreen?: string;
    userId?: string;
    preferences?: object;
  };
}

interface ProcessCommandResponse {
  command?: {
    id: string;
    name: string;
    confidence: number;
    action: object;
  };
  executed: boolean;
  result?: {
    success: boolean;
    data?: object;
    message?: string;
  };
  suggestions?: string[];                   // Alternative commands
  error?: string;
}
```

#### List Voice Commands
```typescript
GET /api/voice/commands

interface ListCommandsResponse {
  commands: Array<{
    id: string;
    name: string;
    phrases: string[];
    action: object;
    enabled: boolean;
    usageCount: number;
    lastUsed?: string;
  }>;
  categories: Array<{
    name: string;
    commands: string[];                     // Command IDs
  }>;
}
```

## 🎵 Audio Processing API

#### Process Audio
```typescript
POST /api/voice/audio/process

interface ProcessAudioRequest {
  audioPath: string;
  operations: Array<{
    type: 'noise_reduction' | 'normalize' | 'enhance' | 'compress';
    parameters?: object;
  }>;
  outputPath?: string;                      // Optional output path
  outputFormat?: 'mp3' | 'm4a' | 'wav';
}

interface ProcessAudioResponse {
  processedPath: string;
  operations: Array<{
    type: string;
    success: boolean;
    metrics?: object;                       // Quality metrics
  }>;
  quality: {
    before: number;                         // Quality score before
    after: number;                          // Quality score after
    improvement: number;                    // Improvement percentage
  };
  processingTime: number;                   // milliseconds
}
```

#### Audio Analysis
```typescript
POST /api/voice/audio/analyze

interface AnalyzeAudioRequest {
  audioPath: string;
  analysis: Array<'quality' | 'speech' | 'music' | 'silence' | 'emotions'>;
}

interface AnalyzeAudioResponse {
  duration: number;                         // Total duration in seconds
  quality: {
    signalToNoise: number;                  // dB
    clarity: number;                        // 0-1 score
    frequency: {
      range: [number, number];              // Hz range
      dominant: number;                     // Dominant frequency
    };
  };
  speech?: {
    detected: boolean;
    confidence: number;
    segments: Array<{
      start: number;
      end: number;
      energy: number;
    }>;
  };
  emotions?: {
    dominant: string;                       // Primary emotion
    scores: {
      [emotion: string]: number;            // Confidence scores
    };
  };
}
```

## 🔊 Text-to-Speech API

#### Synthesize Speech
```typescript
POST /api/voice/tts/synthesize

interface SynthesizeRequest {
  text: string;
  voice?: {
    name?: string;                          // Voice identifier
    language?: string;                      // Language code
    gender?: 'male' | 'female' | 'neutral';
    style?: 'normal' | 'formal' | 'casual' | 'dramatic';
  };
  audio?: {
    format?: 'mp3' | 'm4a' | 'wav';
    quality?: 'low' | 'medium' | 'high';
    speed?: number;                         // 0.5-2.0, default: 1.0
    pitch?: number;                         // 0.5-2.0, default: 1.0
  };
  outputPath?: string;                      // Optional output path
}

interface SynthesizeResponse {
  audioPath: string;
  duration: number;                         // Audio duration in seconds
  fileSize: number;                         // File size in bytes
  voice: {
    name: string;
    language: string;
    characteristics: object;
  };
  processingTime: number;                   // Generation time in ms
  error?: string;
}
```

#### List Available Voices
```typescript
GET /api/voice/tts/voices

interface ListVoicesResponse {
  voices: Array<{
    id: string;
    name: string;
    language: string;
    gender: string;
    style: string[];
    quality: 'standard' | 'premium' | 'neural';
    local: boolean;                         // Available offline
    sampleUrl?: string;                     // Preview audio
  }>;
  categories: {
    [language: string]: string[];           // Voice IDs by language
  };
}
```

## ⚙️ Configuration API

#### Voice System Configuration
```typescript
GET /api/voice/config
PUT /api/voice/config

interface VoiceConfig {
  recording: {
    defaultQuality: 'low' | 'medium' | 'high';
    maxDuration: number;                    // seconds
    autoStop: boolean;                      // Stop on silence
    silenceThreshold: number;               // dB
    format: 'mp3' | 'm4a' | 'wav';
  };
  transcription: {
    defaultService: 'local' | 'groq' | 'auto';
    language: string;
    autoDetectLanguage: boolean;
    confidence: number;                     // Minimum confidence
    groq?: {
      apiKey: string;
      model: string;                        // whisper-large-v3-turbo
      temperature: number;
    };
    local?: {
      model: string;
      device: 'cpu' | 'gpu' | 'auto';
    };
  };
  commands: {
    enabled: boolean;
    sensitivity: number;                    // 0-1
    timeout: number;                        // ms
    feedback: boolean;                      // Audio/visual feedback
  };
  tts: {
    defaultVoice: string;
    speed: number;
    pitch: number;
    caching: boolean;                       // Cache generated audio
  };
  privacy: {
    deleteRecordings: boolean;              // Auto-delete after transcription
    localProcessing: boolean;               // Prefer local over cloud
    dataRetention: number;                  // Days to keep data
  };
}
```

## 📊 Status and Metrics API

#### Voice System Status
```typescript
GET /api/voice/status

interface VoiceStatus {
  status: 'ready' | 'initializing' | 'error' | 'recording';
  services: {
    recording: 'available' | 'permissions_needed' | 'error';
    localTranscription: 'loaded' | 'loading' | 'unavailable';
    cloudTranscription: 'connected' | 'disconnected' | 'error';
    tts: 'ready' | 'loading' | 'error';
  };
  permissions: {
    microphone: boolean;
    storage: boolean;
    notifications?: boolean;
  };
  performance: {
    averageTranscriptionTime: number;       // ms
    transcriptionAccuracy: number;          // 0-1
    commandRecognitionRate: number;         // 0-1
  };
  storage: {
    temporaryFiles: number;                 // Count
    cacheSize: number;                      // Bytes
    maxCacheSize: number;                   // Bytes
  };
}
```

#### Voice Metrics
```typescript
GET /api/voice/metrics

interface VoiceMetrics {
  usage: {
    totalRecordings: number;
    totalTranscriptions: number;
    totalCommands: number;
    averageSessionLength: number;           // seconds
  };
  performance: {
    transcription: {
      averageTime: number;                  // ms
      accuracyRate: number;                 // 0-1
      errorRate: number;                    // 0-1
      serviceBreakdown: {
        [service: string]: {
          usage: number;                    // percentage
          performance: number;              // average time
        };
      };
    };
    commands: {
      recognitionRate: number;              // 0-1
      executionRate: number;                // 0-1
      topCommands: Array<{
        name: string;
        usage: number;
        accuracy: number;
      }>;
    };
  };
  quality: {
    audioQuality: number;                   // average 0-1
    speechClarity: number;                  // average 0-1
    backgroundNoise: number;                // average dB
  };
}
```

## 🔒 Error Handling

### Standard Error Response
```typescript
interface VoiceError {
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
| `VOICE_001` | Microphone permission denied | Request permissions |
| `VOICE_002` | Recording failed | Check device audio |
| `VOICE_003` | Transcription service unavailable | Use fallback service |
| `VOICE_004` | Audio format not supported | Convert format |
| `VOICE_005` | Voice command not recognized | Suggest alternatives |
| `VOICE_006` | TTS voice not available | Use default voice |
| `VOICE_007` | Storage space insufficient | Clean up files |
| `VOICE_008` | Audio quality too low | Improve recording conditions |

## 📱 Mobile Integration Patterns

### React Native Bridge Example
```typescript
import { VoiceManager } from 'pocketpal-superai-voice';

const voice = new VoiceManager({
  transcriptionService: 'auto',
  enableCommands: true,
  privacy: { localProcessing: true }
});

// Start recording with visual feedback
const recording = await voice.startRecording({
  quality: 'high',
  onProgress: (levels) => setAudioLevels(levels),
  onError: (error) => showError(error)
});

// Stop and transcribe
const result = await voice.stopAndTranscribe(recording.sessionId);
console.log('Transcription:', result.text);

// Process as voice command
const command = await voice.processCommand(result.text);
if (command.executed) {
  showFeedback(`Executed: ${command.name}`);
}
```

### iOS-Specific Features
```typescript
interface iOSVoiceFeatures {
  useNeuralEngine: boolean;                 // Hardware acceleration
  siriIntegration: boolean;                 // Siri shortcuts
  speechFramework: boolean;                 // Native Speech framework
  backgroundRecording: boolean;             // Background audio capability
}
```

### Android-Specific Features
```typescript
interface AndroidVoiceFeatures {
  useSpeechRecognizer: boolean;             // Native SpeechRecognizer
  hotwordDetection: boolean;                // "Hey PocketPal" detection
  audioFocusManagement: boolean;            // Handle audio interruptions
  customWakeWords: boolean;                 // Custom wake word training
}
```

## 📋 Implementation Notes

### Based on the-rich-piana Analysis
- **Groq Integration**: Whisper Large V3 Turbo for high-quality transcription
- **Cross-Platform Audio**: React Native Audio Recorder Player
- **Visual Feedback**: Animated microphone with pulse effects
- **Permission Management**: Comprehensive iOS/Android permissions

### Performance Targets
- **Recording Start**: <50ms initialization
- **Transcription**: <2 seconds for 30-second audio
- **Voice Commands**: <100ms recognition time
- **Audio Quality**: >95% clarity in normal conditions

### Privacy Enhancements
- **Local Transcription**: On-device processing option
- **Auto-Cleanup**: Automatic temporary file removal
- **Data Retention**: User-controlled data storage policies
- **Encryption**: Encrypted audio storage for sensitive content

---

**API Version**: 1.0  
**Last Updated**: June 23, 2025  
**Implementation Status**: Specification Complete  
**Based on Research**: the-rich-piana voice implementation analysis  
**Next Phase**: Integration with RAG API and native implementation
# Development Setup Guide

## 📋 Overview

This comprehensive guide covers setting up a complete development environment for PocketPal SuperAI, including all components (RAG, Voice, Model Management, Vector Storage) and tools required for cross-platform mobile development.

**Target Platforms**: iOS, Android  
**Development Framework**: React Native + Native Modules  
**Based on**: Comprehensive fork analysis and optimization patterns  

## 🛠️ Prerequisites

### System Requirements

#### Hardware Requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 16GB | 32GB+ |
| **Storage** | 100GB free | 500GB+ SSD |
| **CPU** | 8 cores | 12+ cores |
| **GPU** | Integrated | Dedicated (for ML training) |

#### Operating System Support
- **macOS**: 12.0+ (for iOS development)
- **Windows**: 10/11 (Android only)
- **Linux**: Ubuntu 20.04+ (Android only)

### Required Software

#### Core Development Tools
```bash
# Node.js (LTS version)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install --lts
nvm use --lts

# Yarn package manager
npm install -g yarn

# React Native CLI
npm install -g @react-native-community/cli

# Watchman (macOS/Linux)
brew install watchman  # macOS
# For Linux: https://facebook.github.io/watchman/docs/install#buildinstall
```

#### Platform-Specific Tools

##### iOS Development (macOS only)
```bash
# Xcode (from App Store - latest version)
# Xcode Command Line Tools
xcode-select --install

# iOS Simulator
# Install through Xcode preferences

# CocoaPods
sudo gem install cocoapods

# iOS Deploy tools
npm install -g ios-deploy
```

##### Android Development (All platforms)
```bash
# Android Studio
# Download from: https://developer.android.com/studio

# Android SDK setup
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
# Windows: Set via System Properties

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Accept licenses
$ANDROID_HOME/tools/bin/sdkmanager --licenses
```

#### Development Tools
```bash
# Git (latest version)
git --version  # Verify installation

# VS Code with extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension ms-vscode.vscode-react-native
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-python.python

# Docker (for local services)
# Download from: https://docs.docker.com/get-docker/

# Python 3.9+ (for ML components)
python3 --version
pip3 install --upgrade pip
```

## 🚀 Project Setup

### 1. Clone Repository
```bash
# Clone main repository
git clone https://github.com/your-org/pocketpal-superai.git
cd pocketpal-superai

# Initialize submodules (if using git submodules for components)
git submodule init
git submodule update --recursive
```

### 2. Environment Configuration
```bash
# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

#### Required Environment Variables
```bash
# .env file
# Core API Keys
ANTHROPIC_API_KEY=your_anthropic_key
GROQ_API_KEY=your_groq_key
OPENAI_API_KEY=your_openai_key

# Development Configuration
NODE_ENV=development
DEBUG=pocketpal:*
LOG_LEVEL=debug

# Platform Configuration
PLATFORM=auto  # ios | android | auto
BUILD_MODE=development  # development | staging | production

# Component Configuration
RAG_ENABLED=true
VOICE_ENABLED=true
MODELS_ENABLED=true
VECTORS_ENABLED=true

# Performance Tuning
MEMORY_PROFILE=medium  # low | medium | high
PERFORMANCE_MODE=balanced  # battery | balanced | performance

# Storage Configuration
MAX_STORAGE_MB=5000
AUTO_CLEANUP=true
CACHE_SIZE_MB=500

# Debugging
FLIPPER_ENABLED=true
DEV_MENU_ENABLED=true
REMOTE_DEBUGGING=true
```

### 3. Install Dependencies
```bash
# Install Node.js dependencies
yarn install

# Install iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Install Android dependencies (automatic during build)
```

### 4. Native Module Setup

#### RAG Component Setup
```bash
# Build RAG native modules
cd native/rag
yarn install
yarn build:android
yarn build:ios  # macOS only
cd ../..
```

#### Voice Component Setup
```bash
# Setup voice processing
cd native/voice
yarn install

# Download voice models
yarn setup:models

# Build native libraries
yarn build:android
yarn build:ios  # macOS only
cd ../..
```

#### Vector Storage Setup
```bash
# Setup vector storage
cd native/vectors
yarn install

# Initialize vector database
yarn setup:database

# Build native modules
yarn build:android
yarn build:ios  # macOS only
cd ../..
```

#### Model Management Setup
```bash
# Setup model management
cd native/models
yarn install

# Initialize model registry
yarn setup:registry

# Build components
yarn build:android
yarn build:ios  # macOS only
cd ../..
```

## 🔧 Development Environment Configuration

### 1. VS Code Configuration
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.tsx": "typescriptreact"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/ios/build": true,
    "**/android/build": true,
    "**/dist": true
  }
}
```

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug iOS",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios",
      "target": "simulator"
    },
    {
      "name": "Debug Android",
      "type": "reactnative", 
      "request": "launch",
      "platform": "android"
    },
    {
      "name": "Debug Metro",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/react-native",
      "args": ["start"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 2. Metro Configuration
Update `metro.config.js`:
```javascript
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    alias: {
      '@': './src',
      '@rag': './src/rag',
      '@voice': './src/voice', 
      '@models': './src/models',
      '@vectors': './src/vectors',
      '@utils': './src/utils',
      '@types': './src/types'
    },
    assetExts: [...defaultConfig.resolver.assetExts, 'bin', 'txt', 'gguf'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  watchFolders: [
    // Include native module directories
    './native/rag',
    './native/voice',
    './native/vectors', 
    './native/models'
  ]
};

module.exports = mergeConfig(defaultConfig, config);
```

### 3. TypeScript Configuration
Update `tsconfig.json`:
```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@rag/*": ["./src/rag/*"],
      "@voice/*": ["./src/voice/*"],
      "@models/*": ["./src/models/*"],
      "@vectors/*": ["./src/vectors/*"],
      "@utils/*": ["./src/utils/*"],
      "@types/*": ["./src/types/*"]
    },
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": [
    "src/**/*",
    "native/**/*",
    "index.js"
  ],
  "exclude": [
    "node_modules",
    "ios/build",
    "android/build",
    "dist"
  ]
}
```

## 🧪 Development Workflow

### 1. Start Development Servers
```bash
# Terminal 1: Start Metro bundler
yarn start

# Terminal 2: Start iOS (macOS only)
yarn ios

# Terminal 2: Start Android
yarn android

# Optional: Start with specific device
yarn ios --simulator="iPhone 15 Pro"
yarn android --deviceId emulator-5554
```

### 2. Component Development Workflow
```bash
# Develop RAG features
yarn dev:rag

# Develop Voice features  
yarn dev:voice

# Develop Model Management
yarn dev:models

# Develop Vector Storage
yarn dev:vectors

# Full integration testing
yarn dev:integration
```

### 3. Code Generation and Scaffolding
```bash
# Generate new component
yarn generate:component ComponentName

# Generate new screen
yarn generate:screen ScreenName

# Generate API client
yarn generate:api ApiName

# Generate native module bridge
yarn generate:bridge ModuleName
```

## 🛡️ Code Quality Setup

### 1. ESLint Configuration
Create `.eslintrc.js`:
```javascript
module.exports = {
  root: true,
  extends: [
    '@react-native',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-hooks'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error'
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        'no-console': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    }
  ]
};
```

### 2. Prettier Configuration
Create `.prettierrc.js`:
```javascript
module.exports = {
  arrowParens: 'avoid',
  bracketSameLine: true,
  bracketSpacing: false,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 80,
  endOfLine: 'lf'
};
```

### 3. Husky Pre-commit Hooks
```bash
# Install husky
yarn add --dev husky lint-staged

# Setup pre-commit hooks
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

Create `.lintstagedrc.js`:
```javascript
module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write'
  ],
  '*.{json,md,yml,yaml}': [
    'prettier --write'
  ]
};
```

## 🔍 Testing Setup

### 1. Jest Configuration
Update `jest.config.js`:
```javascript
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '<rootDir>/jest/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-vector-icons)/)'
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@rag/(.*)$': '<rootDir>/src/rag/$1',
    '^@voice/(.*)$': '<rootDir>/src/voice/$1',
    '^@models/(.*)$': '<rootDir>/src/models/$1',
    '^@vectors/(.*)$': '<rootDir>/src/vectors/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
```

### 2. Test Utilities Setup
Create `jest/setup.ts`:
```typescript
import 'react-native-gesture-handler/jestSetup';
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';

// Mock react-native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock network info
jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);

// Mock native modules
jest.mock('../src/native/rag', () => ({
  ingestDocument: jest.fn(),
  searchVectors: jest.fn(),
  getContext: jest.fn()
}));

jest.mock('../src/native/voice', () => ({
  startRecording: jest.fn(),
  stopRecording: jest.fn(), 
  transcribeAudio: jest.fn()
}));

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Global test utilities
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn()
};
```

## 📱 Device Testing Setup

### 1. iOS Device Setup
```bash
# Install development certificate
# Open Xcode -> Preferences -> Accounts -> Add Apple ID

# Configure signing (in Xcode)
# Select project -> Signing & Capabilities -> Team

# Enable developer mode on device
# Settings -> Privacy & Security -> Developer Mode

# Trust development certificates
# Settings -> General -> VPN & Device Management
```

### 2. Android Device Setup
```bash
# Enable developer options
# Settings -> About phone -> Tap build number 7 times

# Enable USB debugging
# Settings -> Developer options -> USB debugging

# Install ADB drivers (Windows)
# Download from Android developer site

# Verify device connection
adb devices
```

### 3. Debugging Tools Setup
```bash
# Flipper (React Native debugging)
yarn add --dev react-native-flipper

# React Developer Tools
npm install -g react-devtools

# Start debugging session
yarn start --reset-cache
npx react-devtools
```

## 🚀 Build Configuration

### 1. iOS Build Setup
Update `ios/PocketPalSuperAI/Info.plist`:
```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for voice input</string>
<key>NSDocumentPickerUsageDescription</key>
<string>This app needs document access for RAG processing</string>
<key>NSFileProviderDomainUsageDescription</key>
<string>This app needs file access for document management</string>
```

### 2. Android Build Setup
Update `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

Update `android/app/build.gradle`:
```gradle
android {
    compileSdkVersion 34
    buildToolsVersion "34.0.0"
    
    defaultConfig {
        minSdkVersion 24
        targetSdkVersion 34
        
        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
    
    packagingOptions {
        pickFirst "lib/x86/libc++_shared.so"
        pickFirst "lib/arm64-v8a/libc++_shared.so"
    }
}
```

## 🔧 Performance Optimization

### 1. Bundle Optimization
```bash
# Analyze bundle size
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android-bundle.js \
  --sourcemap-output android-bundle.map \
  --verbose

# Bundle analyzer
yarn add --dev react-native-bundle-visualizer
npx react-native bundle-visualizer
```

### 2. Memory Optimization
Create `src/utils/performance.ts`:
```typescript
export const PerformanceMonitor = {
  trackMemory: () => {
    if (__DEV__) {
      const memoryInfo = performance.memory || {};
      console.log('Memory usage:', {
        used: memoryInfo.usedJSHeapSize,
        total: memoryInfo.totalJSHeapSize,
        limit: memoryInfo.jsHeapSizeLimit
      });
    }
  },
  
  trackRender: (componentName: string) => {
    if (__DEV__) {
      console.time(`${componentName} render`);
      return () => console.timeEnd(`${componentName} render`);
    }
    return () => {};
  }
};
```

## ✅ Verification Checklist

### Development Environment
- [ ] Node.js LTS installed and configured
- [ ] React Native CLI installed globally
- [ ] Platform tools (Xcode/Android Studio) installed
- [ ] Environment variables configured
- [ ] Dependencies installed successfully

### Project Setup
- [ ] Repository cloned and submodules initialized
- [ ] Environment file created and configured
- [ ] Native modules built successfully
- [ ] TypeScript configuration working
- [ ] ESLint and Prettier configured

### Testing Environment
- [ ] Jest tests run successfully
- [ ] iOS simulator/device connected
- [ ] Android emulator/device connected  
- [ ] Debugging tools working
- [ ] Code quality checks passing

### Build System
- [ ] iOS builds successfully
- [ ] Android builds successfully
- [ ] Hot reloading working
- [ ] Native modules linking correctly
- [ ] Performance monitoring active

## 🚨 Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear watchman
watchman watch-del-all

# Clear Node modules
rm -rf node_modules && yarn install
```

#### iOS Build Issues
```bash
# Clean iOS build
cd ios && xcodebuild clean && cd ..

# Update pods
cd ios && pod install --repo-update && cd ..

# Reset iOS simulator
xcrun simctl erase all
```

#### Android Build Issues
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..

# Clear gradle cache
rm -rf ~/.gradle/caches

# Reset ADB
adb kill-server && adb start-server
```

#### Native Module Issues
```bash
# Rebuild native modules
yarn clean:native
yarn build:native

# Check linking
npx react-native doctor

# Manual linking (if needed)
npx react-native link
```

## 📚 Next Steps

1. **Read the Component Guides**: Continue with specific component development guides
2. **Set up CI/CD**: Configure continuous integration and deployment
3. **Performance Testing**: Set up performance monitoring and testing
4. **Production Build**: Configure production builds and signing
5. **App Store Preparation**: Prepare for app store submissions

For component-specific setup, refer to:
- [RAG Development Guide](./rag-development-guide.md)
- [Voice Development Guide](./voice-development-guide.md) 
- [Testing Strategy Guide](./testing-strategy-guide.md)
- [Build Optimization Guide](./build-optimization-guide.md)

---

**Guide Version**: 1.0  
**Last Updated**: June 23, 2025  
**Setup Time**: 2-4 hours for complete environment  
**Prerequisites**: Basic React Native knowledge recommended
# iOS Simulator Setup Guide for PocketPal SuperAI

**Complete guide to running PocketPal SuperAI on iOS Simulator**

## 🎯 Quick Start Overview

This guide will help you successfully launch the PocketPal SuperAI React Native application in iOS Simulator. The app includes complex native dependencies (AI inference, camera, etc.) that require specific setup steps.

## 📋 Prerequisites

### Required Software
- **macOS**: Required for iOS development
- **Xcode**: Latest version (15.0+) from App Store
- **Command Line Tools**: `xcode-select --install`
- **Node.js**: v18+ (currently using v22.14.0 ✅)
- **Yarn**: Package manager (currently v1.22.22 ✅)
- **CocoaPods**: iOS dependency manager

### System Requirements
- **Minimum**: macOS 13.0+ with 8GB RAM
- **Recommended**: macOS 14.0+ with 16GB RAM
- **Storage**: 10GB+ free space for Xcode and simulators

## ⚡ Quick Fix for Common Build Failures

**If you're getting build errors, run this one-liner first:**
```bash
# Fix deployment target warnings and clean rebuild
cd /Users/adamboyle/Assist/PocketPal-SuperAI/application && \
cd ios && rm -rf Pods && rm Podfile.lock && pod install && cd .. && \
open ios/PocketPal.xcworkspace
```

**Next: Use Xcode's Play button (▶️) instead of command line builds for reliability.**

> 🎉 **Optimization Complete**: This app now runs Firebase-free following sultanqasim optimization patterns. All data processing stays on-device for maximum privacy.

---

## 🛠️ Step-by-Step Setup

### Step 1: Verify Xcode Installation

```bash
# Check if Xcode is installed
xcode-select -p

# Should output: /Applications/Xcode.app/Contents/Developer
# If not, install Xcode from App Store
```

```bash
# Install command line tools if needed
xcode-select --install
```

### Step 2: Verify iOS Simulators

```bash
# List available simulators
xcrun simctl list devices available

# Should show iPhone simulators like:
# iPhone 16 Pro (F7009FC0-2F0A-4DF8-A91C-9AC00C8A3352) (Shutdown)
```

If no simulators are available:
1. Open Xcode
2. Go to **Window → Devices and Simulators**
3. Click **Simulators** tab
4. Click **+** to add iPhone 16 Pro or similar

### Step 3: Install CocoaPods

```bash
# Install CocoaPods if not already installed
sudo gem install cocoapods

# Verify installation
pod --version
```

### Step 4: Project Setup

```bash
# Navigate to the application directory
cd /Users/adamboyle/Assist/PocketPal-SuperAI/application

# Verify Node.js and Yarn
node --version  # Should be v18+
yarn --version  # Should show yarn version

# Install JavaScript dependencies
yarn install
```

### Step 5: iOS Native Dependencies

```bash
# Navigate to iOS directory
cd ios

# Install iOS native dependencies (this takes 2-5 minutes)
pod install

# You should see output ending with:
# "Pod installation complete! There are 99 dependencies..."

# Return to project root
cd ..
```

## 🚀 Running the Application

### Method 1: Two Terminal Approach (Recommended)

**Terminal 1 - Start Metro Bundler:**
```bash
cd /Users/adamboyle/Assist/PocketPal-SuperAI/application
yarn start
```

Wait for Metro to fully start (you'll see the React Native logo and "Metro is ready").

**Terminal 2 - Launch iOS Simulator:**
```bash
cd /Users/adamboyle/Assist/PocketPal-SuperAI/application
yarn ios
```

### Method 2: Single Command (Alternative)

```bash
cd /Users/adamboyle/Assist/PocketPal-SuperAI/application
yarn ios
```

This will automatically start Metro if it's not running.

## ⏱️ Expected Build Times

### First Build
- **Clean Build**: 5-15 minutes (due to native AI dependencies)
- **Subsequent Builds**: 1-3 minutes
- **Metro Bundler**: 10-30 seconds

### Progress Indicators
```
yarn run v1.22.22
$ react-native run-ios --simulator="iPhone 16 Pro"
info Found Xcode workspace "PocketPal.xcworkspace"
info Building (using "xcodebuild...")
```

The build process will show many "Building the app..." messages - this is normal for complex React Native apps.

## 🔧 Troubleshooting Common Issues

### Issue 1: CocoaPods Configuration Errors

**Error**: `Unable to open base configuration reference file`

**Solution**:
```bash
cd ios
pod deintegrate
pod install
cd ..
yarn ios
```

### Issue 2: Metro Port Conflicts

**Error**: `Something is already running on port 8081`

**Solution**:
```bash
# Kill existing Metro process
lsof -ti:8081 | xargs kill -9

# Or use different port
yarn start --port 8082
```

### Issue 3: Simulator Not Found

**Error**: `Unable to find a simulator`

**Solution**:
```bash
# List available simulators
xcrun simctl list devices

# Boot a specific simulator
xcrun simctl boot "iPhone 16 Pro"

# Then run the app
yarn ios
```

### Issue 4: Xcode Build Failures

**Error**: Various Xcode compilation errors

**Solution**:
```bash
# Clean everything and rebuild
yarn clean
cd ios
xcodebuild clean -workspace PocketPal.xcworkspace -scheme PocketPal
pod install
cd ..
yarn ios
```

### Issue 5: Long Build Times

**Issue**: Build takes longer than 15 minutes

**Solutions**:
1. **Close other apps** to free up memory
2. **Use faster simulator**: iPhone SE instead of iPhone 16 Pro
3. **Enable Hermes**: Already enabled in this project
4. **Check Activity Monitor**: Ensure Xcode isn't using 100% CPU

```bash
# Use iPhone SE for faster builds
yarn ios --simulator="iPhone SE (3rd generation)"
```

### Issue 6: Build Failures & Common Xcode Issues ⚠️ **UPDATED - FIREBASE REMOVED**

**Common Errors**: 
- `"xcodebuild" exited with error code '65'`
- `iOS Simulator deployment target 'IPHONEOS_DEPLOYMENT_TARGET' is set to 9.0`
- `Unable to boot device in current state: Booted`

**Root Cause**: Deployment target conflicts, pod cache issues, and simulator boot conflicts.

**COMPLETE Solution - Privacy-First Build (No Firebase)**:
```bash
# 1. Fix deployment target warnings (automatically handled by Podfile)
# The post_install script in ios/Podfile now sets min deployment target to 12.0

# 2. Clean and rebuild iOS dependencies
cd ios
rm -rf Pods && rm Podfile.lock
pod install
cd ..

# 3. Reset simulator if booted
xcrun simctl shutdown "iPhone 16 Pro"
xcrun simctl boot "iPhone 16 Pro"

# 4. Use Xcode for reliable builds (RECOMMENDED)
open ios/PocketPal.xcworkspace

# 5. In Xcode:
#    - Select "PocketPal" scheme
#    - Select "iPhone 16 Pro" simulator  
#    - Click Play button (▶️) to build
#    - Expected build time: 5-15 minutes (first build)
```

**Alternative Command Line Solutions**:
```bash
# Option A: Use React Native doctor to check environment
npx react-native doctor

# Option B: Build with verbose output
yarn ios --verbose

# Option C: Use faster simulator
yarn ios --simulator="iPhone SE (3rd generation)"
```

**Key Learnings from Testing**:
- ✅ Metro bundler runs correctly
- ✅ iOS Simulator launches successfully  
- ❌ Command-line builds often timeout due to AI dependencies
- ✅ Xcode manual builds are more reliable for complex projects
- ⚠️ First build requires 5-15 minutes due to native AI libraries
- 🎉 **No Firebase dependencies** - All processing stays on-device for privacy
- 🔧 iOS deployment target warnings fixed by Podfile post_install script
- 🔧 Simulator boot conflicts resolved by shutdown/boot cycle

### Issue 7: React Native Doctor Warnings

**Warning**: Ruby version mismatch or environment issues

**Solution**:
```bash
# Check React Native environment
npx react-native doctor

# Focus on iOS-specific issues:
# ✓ Xcode - Required for building and installing your app on iOS
# ✓ CocoaPods - Required for installing iOS dependencies
# ● Watchman - Optional but recommended
# ● ios-deploy - Optional for physical devices
```

**Important**: Android warnings can be ignored if only testing iOS.

## 📱 Simulator Controls

### Basic Controls
- **Home Button**: `Cmd + Shift + H`
- **Screenshot**: `Cmd + S`
- **Rotate Device**: `Cmd + ←/→`
- **Shake Gesture**: `Device → Shake`

### Developer Menu
- **Reload**: `Cmd + R`
- **Developer Menu**: `Cmd + D`
- **Inspector**: `Cmd + I`

### Performance Testing
- **Memory Warning**: `Device → Simulate Memory Warning`
- **Background App**: `Cmd + Shift + H` then return to app

## 🎯 What You'll See When Successful

### 1. Metro Bundler Output
```
                Welcome to Metro v0.81.5
              Fast - Scalable - Integrated

info Dev server ready
```

### 2. iOS Simulator Launch
- iOS Simulator app opens automatically
- PocketPal AI app icon appears and launches
- Splash screen shows briefly
- Main app interface loads

### 3. App Interface
You should see:
- **Drawer Navigation**: Hamburger menu (☰) in top-left
- **Main Chat Screen**: Empty chat interface
- **Status**: "Model not loaded" placeholder text
- **Bottom Input**: Message input field (disabled until model loads)

### 4. Navigation Test
- Tap hamburger menu (☰)
- Navigate to **Models** screen
- See list of available AI models
- Navigate to **Settings** for theme/preferences

## 🔍 Verification Checklist

### ✅ Before Starting
- [ ] Xcode installed and updated
- [ ] Command line tools installed
- [ ] Node.js v18+ installed
- [ ] Yarn package manager installed
- [ ] CocoaPods installed

### ✅ Project Setup
- [ ] `yarn install` completed successfully
- [ ] `cd ios && pod install` completed successfully
- [ ] No error messages in installation logs

### ✅ Simulator Launch
- [ ] Metro bundler starts and shows "Dev server ready"
- [ ] iOS Simulator opens automatically
- [ ] PocketPal AI app launches without crashes
- [ ] App interface loads and is responsive

### ✅ Basic Functionality
- [ ] Drawer navigation opens and closes
- [ ] Can navigate between screens (Chat, Models, Settings)
- [ ] UI elements are visible and properly styled
- [ ] No JavaScript errors in Metro console

## 🚨 Emergency Reset Procedures

### Complete Clean Reset
If everything fails, use this nuclear option:

```bash
# 1. Clean Node modules
cd /Users/adamboyle/Assist/PocketPal-SuperAI/application
rm -rf node_modules
yarn install

# 2. Clean iOS dependencies
cd ios
pod deintegrate
rm -rf Pods
rm Podfile.lock
pod install
cd ..

# 3. Clean React Native cache
yarn start --reset-cache

# 4. Clean Xcode build cache
cd ios
xcodebuild clean -workspace PocketPal.xcworkspace -scheme PocketPal
cd ..

# 5. Launch fresh
yarn ios
```

### Xcode Manual Build (Last Resort)
If command line fails:

1. Open `ios/PocketPal.xcworkspace` in Xcode
2. Select iPhone 16 Pro simulator in top bar
3. Click Play button (▶️) to build and run
4. Watch build logs for specific errors

## 📚 Additional Resources

### React Native Documentation
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
- [Running on iOS Simulator](https://reactnative.dev/docs/running-on-simulator-ios)

### Troubleshooting Resources
- [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting)
- [Metro Bundler Issues](https://facebook.github.io/metro/docs/troubleshooting)

### Project-Specific Info
- **React Native Version**: 0.76.3
- **iOS Deployment Target**: iOS 13.0+
- **Key Dependencies**: @pocketpalai/llama.rn, react-native-vision-camera
- **Architecture**: React Native + TypeScript + MobX

## 💡 Pro Tips

### Speed Up Development
1. **Keep Metro Running**: Don't restart Metro between builds
2. **Use Fast Refresh**: Enable in developer menu for instant updates
3. **Use iPhone SE**: Faster simulator for development
4. **Close Unused Apps**: Free up system memory

### Debug Mode Features
- **Developer Menu**: Shake device or `Cmd + D`
- **Remote Debugging**: Enable JS Debugging for Chrome DevTools
- **Performance Monitor**: Track FPS and memory usage
- **Element Inspector**: Inspect UI components

### Build Optimization
```bash
# For faster development builds
export RCT_NO_LAUNCH_PACKAGER=true
yarn start  # In separate terminal
yarn ios

# For release testing
yarn ios --configuration Release
```

---

## 🎉 Success Indicators

When everything is working correctly, you should be able to:

1. **Launch the app** in under 5 minutes (after initial setup)
2. **Navigate between screens** smoothly
3. **See the interface** as shown in the screenshots
4. **Make changes** and see them reflected instantly (Fast Refresh)
5. **Access all features** like Models, Settings, Pals configuration

The app is a sophisticated AI assistant interface ready for the planned integrations from the analyzed PocketPal AI forks!

---

**Last Updated**: June 23, 2025  
**Tested On**: macOS with Xcode 15+, React Native 0.76.3  
**Status**: Production-ready development environment - **Firebase-free & Privacy-optimized**  
**Architecture**: Local-first AI assistant following sultanqasim optimization patterns
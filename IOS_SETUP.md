# iOS Setup Guide for Smart Home App

This guide will help you set up and run the Smart Home app on iOS devices.

## Prerequisites

1. **macOS**: iOS development requires macOS
2. **Xcode**: Install Xcode from the App Store (latest version recommended)
3. **iOS Simulator**: Included with Xcode
4. **CocoaPods**: Install CocoaPods if not already installed
   ```bash
   sudo gem install cocoapods
   ```

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate iOS Project

```bash
npx expo prebuild --platform ios
```

### 3. Install iOS Dependencies

```bash
cd ios
pod install
cd ..
```

### 4. Run on iOS Simulator

```bash
npm run ios:simulator
```

### 5. Run on Physical Device

```bash
npm run ios:device
```

## iOS-Specific Features

### Permissions

The app requests the following permissions on iOS:

- **Bluetooth**: For connecting to smart home devices
- **Camera**: For QR code scanning during device setup
- **Location**: For detecting local network connectivity
- **Local Network**: For communicating with smart home devices

### Background Modes

The app supports the following background modes:

- Bluetooth Central
- Bluetooth Peripheral
- Background Processing

### Network Detection

iOS-specific network detection includes:

- Local network detection based on IP address patterns
- SSID-based network identification
- Enhanced Bluetooth permission handling

## Troubleshooting

### Common Issues

1. **Build Errors**: Clean and rebuild

   ```bash
   npm run clean:ios
   npm run prebuild:ios
   ```

2. **Permission Issues**: Ensure all required permissions are granted in iOS Settings

3. **Bluetooth Issues**: Check that Bluetooth is enabled and permissions are granted

4. **Network Issues**: Verify local network access permissions

### Debug Commands

```bash
# Check iOS simulator
npx expo run:ios --simulator

# Check physical device
npx expo run:ios --device

# Clean build
npm run clean:ios
```

## Configuration Files

- `app.json`: Main Expo configuration with iOS-specific settings
- `ios/Podfile`: CocoaPods dependencies
- `ios/Raxus/Info.plist`: iOS app permissions and settings

## Testing

1. **Simulator Testing**: Use iOS Simulator for basic functionality testing
2. **Device Testing**: Test on physical device for Bluetooth and camera features
3. **Network Testing**: Test both local and cloud MQTT broker connections

## Build for Production

```bash
# Build for App Store
npm run build:ios

# Or use EAS Build
npx eas build --platform ios
```

## Notes

- The app uses Expo SDK 53 with React Native 0.79.3
- iOS 13.4+ is required
- Bluetooth LE is required for device connectivity
- Local network access is required for MQTT communication

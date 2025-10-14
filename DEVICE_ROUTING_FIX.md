# Device Routing Fix - Individual Device Detail Pages

## Issue

When clicking on any device to view its detail page, it always routed to the first device in smart-light type. All devices showed the same MQTT controls regardless of which specific device was clicked.

## Root Cause

The device detail page (`app/device/[type]/[id].tsx`) had a hardcoded `getMqttDeviceKey()` function that only considered the device **type**, not the specific device **ID**.

### Before (Broken)

```typescript
const getMqttDeviceKey = () => {
  if (deviceType === 'smart-light') {
    return 'light_switch'; // ❌ Always returns the same key
  }
  if (deviceType === 'smart-ac') {
    return 'AC_switch';
  }
  return 'socket_switch';
};
```

**Problem**: All devices of type `'smart-light'` were mapped to `'light_switch'`, ignoring the device ID.

---

## Device ID to MQTT Key Mapping

The devices are mapped as follows:

| Device ID | Device Name   | MQTT Key        |
| --------- | ------------- | --------------- |
| `'1'`     | light switch  | `light_switch`  |
| `'2'`     | AC switch     | `AC_switch`     |
| `'3'`     | socket switch | `socket_switch` |
| `'4'`     | rgb light     | `rgb_light`     |

---

## Solution

### 1. **Updated `getMqttDeviceKey()` Function**

```typescript
const getMqttDeviceKey = () => {
  if (deviceType === 'smart-ac') {
    return 'AC_switch';
  }

  // For smart-light type, map device ID to specific MQTT key
  if (deviceType === 'smart-light') {
    const deviceIdToMqttKey: Record<string, string> = {
      '1': 'light_switch',
      '2': 'AC_switch',
      '3': 'socket_switch',
      '4': 'rgb_light',
    };
    return (deviceIdToMqttKey[deviceId] || 'light_switch') as any;
  }

  return 'socket_switch';
};
```

**Fix**: Now considers the `deviceId` parameter to return the correct MQTT key for each specific device.

---

### 2. **Updated `handlePowerToggle()` Function**

**Before:**

```typescript
const handlePowerToggle = (value: boolean) => {
  setIsActive(value as any);
  publishSet('light_switch', value ? 'ON' : 'OFF'); // ❌ Hardcoded
};
```

**After:**

```typescript
const handlePowerToggle = (value: boolean) => {
  setIsActive(value as any);
  const deviceKey = getMqttDeviceKey(); // ✅ Dynamic based on device ID
  publishSet(deviceKey, value ? 'ON' : 'OFF');
};
```

---

### 3. **Updated MQTT Message Handler**

**Before:**

```typescript
const onMessageArrived = (topic: string, payload: string) => {
  const lightStateTopic = buildTopic('light_switch', 'state'); // ❌ Hardcoded
  const acStateTopic = buildTopic('AC_switch', 'state');

  if (topic === lightStateTopic) {
    setIsActive(payload === 'ON');
  } else if (topic === acStateTopic) {
    // handle AC
  }
  // ...
};
```

**After:**

```typescript
const onMessageArrived = (topic: string, payload: string) => {
  const deviceKey = getMqttDeviceKey(); // ✅ Dynamic
  const deviceStateTopic = buildTopic(deviceKey, 'state');

  if (topic === deviceStateTopic) {
    setIsActive(payload === 'ON');
  }
  // Handle AC separately...
};
```

---

### 4. **Added Device Name Display from Store**

**Before:**

```typescript
const deviceTitle = getDeviceTitle(deviceType);

// In UI:
<Text style={styles.deviceTitle}>{deviceTitle}</Text>;
```

This showed generic names like "Smart Light" for all devices.

**After:**

```typescript
// Get device details from store
const rooms = useSmartHomeStore((state) => state.rooms);
const currentDevice = rooms
  .flatMap((room) =>
    Object.entries(room.devices).flatMap(([type, devices]) =>
      devices.map((device) => ({
        ...device,
        type: type as DeviceType,
        roomId: room.id,
      }))
    )
  )
  .find((device) => device.id === deviceId && device.type === deviceType);

const deviceName = currentDevice?.name || 'Unknown Device';

// In UI:
<Text style={styles.deviceTitle}>{deviceName}</Text>;
```

**Result**: Now shows the actual device name like "light switch", "AC switch", "socket switch", or "rgb light".

---

## Testing Checklist

### Manual Testing

- [ ] Click on "light switch" (ID: 1) → Shows "light switch" controls
- [ ] Click on "AC switch" (ID: 2) → Shows "AC switch" controls
- [ ] Click on "socket switch" (ID: 3) → Shows "socket switch" controls
- [ ] Click on "rgb light" (ID: 4) → Shows "rgb light" controls
- [ ] Toggle each device → MQTT publishes to correct topic
- [ ] MQTT state updates → Only the correct device updates

### Expected Behavior

1. **Different Device Names Display** ✅

   - Each device shows its unique name from the store

2. **Correct MQTT Topics** ✅

   - Device 1 → `room1/light_control/light_switch/set`
   - Device 2 → `room1/light_control/AC_switch/set`
   - Device 3 → `room1/light_control/socket_switch/set`
   - Device 4 → `room1/light_control/rgb_light/set`

3. **Independent State Management** ✅
   - Each device has its own state
   - Toggling one device doesn't affect others

---

## Files Modified

### `app/device/[type]/[id].tsx`

1. ✅ Updated `getMqttDeviceKey()` to use device ID
2. ✅ Updated `handlePowerToggle()` to use dynamic MQTT key
3. ✅ Updated `onMessageArrived()` to use dynamic MQTT key
4. ✅ Added device name fetching from store
5. ✅ Updated UI to display device name

---

## MQTT Flow (After Fix)

```
User clicks "socket switch" (ID: 3)
   ↓
Router navigates to /device/smart-light/3
   ↓
Device detail page reads params:
  - type = 'smart-light'
  - id = '3'
   ↓
getMqttDeviceKey() returns 'socket_switch'
   ↓
User toggles power
   ↓
Publishes to: room1/light_control/socket_switch/set → 'ON'
   ↓
Device responds on: room1/light_control/socket_switch/state → 'ON'
   ↓
onMessageArrived() updates isActive state for this specific device
```

---

## Benefits

1. ✅ **Each device has unique controls**
2. ✅ **Correct MQTT topic routing**
3. ✅ **Shows actual device names**
4. ✅ **Independent state management**
5. ✅ **Proper device identification**

---

## No Linting Errors ✅

All changes passed TypeScript and ESLint checks.

---

**Status: FIXED & READY FOR TESTING** 🎉

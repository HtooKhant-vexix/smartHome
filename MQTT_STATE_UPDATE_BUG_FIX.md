# MQTT State Update Bug Fix

## Issue

When toggling device ID **4** (rgb light), device ID **1** (Main Light) was also getting toggled automatically.

### User Log

```
LOG  toggleDevice: room_Id -> living-room | device_Id-> 4 | device_Index-> 3
LOG  devices -> [{"id":"1","isActive":true,...}, ... {"id":"4","isActive":true,...}]
                      ↑ Should be FALSE!                        ↑ Correct
```

**Problem**: Both device 1 AND device 4 were activated, when only device 4 should have been.

---

## Root Cause

The `updateDeviceStatesFromMqtt()` function in the Zustand store was **always updating device at index 0** (device ID '1'), regardless of which MQTT message arrived.

### Before (Broken Code)

```typescript
function updateDeviceStatesFromMqtt(
  deviceKey: string,
  isActive: boolean,
  set: any,
  get: () => SmartHomeState
) {
  const deviceTypeMap: Record<string, DeviceType> = {
    light_switch: 'smart-light',
    AC_switch: 'smart-ac',
    socket_switch: 'smart-light',
    rgb_light: 'smart-light',
  };

  const targetDeviceType = deviceTypeMap[deviceKey];
  if (!targetDeviceType) return;

  const state = get();

  set({
    rooms: state.rooms.map((room) => {
      const devices = room.devices[targetDeviceType];
      if (devices && devices.length > 0) {
        return {
          ...room,
          devices: {
            ...room.devices,
            [targetDeviceType]: devices.map(
              (device, index) =>
                index === 0 ? { ...device, isActive } : device // ❌ BUG HERE!
            ),
          },
        };
      }
      return room;
    }),
  });
}
```

**The Bug**: `index === 0 ? { ...device, isActive } : device`

This line **always updates the device at index 0** (first device in the array), completely ignoring which specific device the MQTT message was for.

---

## MQTT Message Flow (Broken)

```
User toggles device '4' (rgb light)
   ↓
MQTT publishes: room1/light_control/rgb_light/set → 'ON'
   ↓
Device responds: room1/light_control/rgb_light/state → 'ON'
   ↓
Store receives message with deviceKey = 'rgb_light'
   ↓
updateDeviceStatesFromMqtt('rgb_light', true, ...)
   ↓
❌ Updates device at INDEX 0 (device ID '1') instead of device ID '4'
   ↓
WRONG: Device '1' becomes active
CORRECT: Device '4' becomes active (but by direct toggle, not MQTT update)
```

---

## Solution

### Updated `updateDeviceStatesFromMqtt()` Function

```typescript
function updateDeviceStatesFromMqtt(
  deviceKey: string,
  isActive: boolean,
  set: any,
  get: () => SmartHomeState
) {
  // Map MQTT device key to device type and ID
  const deviceKeyToConfig: Record<string, { type: DeviceType; id: string }> = {
    light_switch: { type: 'smart-light', id: '1' },
    AC_switch: { type: 'smart-light', id: '2' },
    socket_switch: { type: 'smart-light', id: '3' },
    rgb_light: { type: 'smart-light', id: '4' },
  };

  const config = deviceKeyToConfig[deviceKey];
  if (!config) return;

  const state = get();

  set({
    rooms: state.rooms.map((room) => {
      const devices = room.devices[config.type];
      if (devices && devices.length > 0) {
        // Update only the specific device with matching ID
        const hasDevice = devices.some((d) => d.id === config.id);
        if (!hasDevice) return room;

        return {
          ...room,
          devices: {
            ...room.devices,
            [config.type]: devices.map(
              (device) =>
                device.id === config.id ? { ...device, isActive } : device // ✅ Match by ID!
            ),
          },
        };
      }
      return room;
    }),
  });
}
```

### Key Changes

1. **Added `deviceKeyToConfig` mapping**

   - Maps each MQTT key to both device type AND device ID
   - Example: `rgb_light` → `{ type: 'smart-light', id: '4' }`

2. **Match by device ID instead of index**

   - Before: `index === 0 ? ...` ❌
   - After: `device.id === config.id ? ...` ✅

3. **Check if device exists before updating**
   - Prevents errors if device ID doesn't exist in room

---

## MQTT Key to Device ID Mapping

| MQTT Key        | Device Type   | Device ID | Example Device Name |
| --------------- | ------------- | --------- | ------------------- |
| `light_switch`  | `smart-light` | `'1'`     | "Main Light"        |
| `AC_switch`     | `smart-light` | `'2'`     | "Bulb 1"            |
| `socket_switch` | `smart-light` | `'3'`     | "Bulb 2"            |
| `rgb_light`     | `smart-light` | `'4'`     | "Bulb 3"            |

**Note**: The actual `smart-ac` device (Aircon) uses a different MQTT topic scheme (`AC_BASE_TOPIC`) and is not affected by this bug.

---

## MQTT Message Flow (Fixed)

```
User toggles device '4' (rgb light)
   ↓
MQTT publishes: room1/light_control/rgb_light/set → 'ON'
   ↓
Device responds: room1/light_control/rgb_light/state → 'ON'
   ↓
Store receives message with deviceKey = 'rgb_light'
   ↓
updateDeviceStatesFromMqtt('rgb_light', true, ...)
   ↓
Looks up config: { type: 'smart-light', id: '4' }
   ↓
✅ Updates ONLY device with ID '4'
   ↓
CORRECT: Only device '4' becomes active
```

---

## Testing Checklist

### Manual Testing

- [ ] Toggle device '1' (light switch) → Only device '1' updates
- [ ] Toggle device '2' (AC switch) → Only device '2' updates
- [ ] Toggle device '3' (socket switch) → Only device '3' updates
- [ ] Toggle device '4' (rgb light) → Only device '4' updates
- [ ] Check MQTT state updates reflect correct device
- [ ] Toggle multiple devices quickly → Each updates independently

### Expected Behavior

1. **Independent Device Updates** ✅

   - Only the toggled device changes state
   - Other devices remain unchanged

2. **MQTT State Sync** ✅

   - MQTT state messages update the correct device
   - No cross-contamination between devices

3. **Bidirectional Sync** ✅
   - App toggle → MQTT publish → Device response → App update (correct device)
   - External MQTT message → App updates correct device

---

## Files Modified

### `store/useSmartHomeStore.ts`

- ✅ Updated `updateDeviceStatesFromMqtt()` function (lines 537-577)
- ✅ Added device ID mapping instead of index matching
- ✅ Fixed MQTT state update logic

---

## No Linting Errors ✅

All changes passed TypeScript and ESLint checks.

---

## Router Warnings (Informational)

You may see these warnings:

```
WARN  Route "./_components/RoomCard.tsx" is missing the required default export
WARN  Route "./_context/RoomContext.tsx" is missing the required default export
```

**These are harmless** and will disappear after:

1. Stopping the dev server (Ctrl+C)
2. Clearing cache: `npx expo start --clear`
3. Restarting the app

The underscore prefix should exclude these from routing, but the router cache may need to be fully cleared.

---

**Status: FIXED & READY FOR TESTING** 🎉

Now when you toggle device '4', only device '4' will be updated. No more ghost toggles!

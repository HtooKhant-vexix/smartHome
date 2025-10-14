# Aircon vs AC_switch Conflict Fix

## Issue

Device ID '2' (AC_switch / Auto Current switch) was showing incorrect state because the **Aircon device detail page** was interfering with it by listening to the wrong MQTT topics.

## Root Cause

The `getMqttDeviceKey()` function in the device detail page had a critical error:

```typescript
// ❌ WRONG!
const getMqttDeviceKey = () => {
  if (deviceType === 'smart-ac') {
    return 'AC_switch'; // This is WRONG!
  }
  // ...
};
```

**The Problem**: When viewing the **Aircon** device (type: `'smart-ac'`), the function was returning `'AC_switch'`, which is actually the MQTT key for **device ID '2'** (the Auto Current switch).

---

## Device Naming Confusion

### Two Completely Separate Devices

| Device                              | Type          | ID    | MQTT Key/Topic                          |
| ----------------------------------- | ------------- | ----- | --------------------------------------- |
| **AC_switch** (Auto Current switch) | `smart-light` | `'2'` | `room1/light_control/AC_switch/*`       |
| **Aircon** (Air Conditioner)        | `smart-ac`    | `'1'` | `room1/ac/cmnd/*` and `room1/ac/stat/*` |

**Key Point**:

- **AC_switch** = "Auto Current switch" (a smart-light device)
- **Aircon** = Actual air conditioner (uses completely different MQTT topics)
- They are NOT related!

---

## What Was Happening

```
User views Aircon device detail page
   ↓
getMqttDeviceKey() returns 'AC_switch' ❌
   ↓
Aircon page subscribes to: room1/light_control/AC_switch/state ❌
   ↓
Device '2' (AC_switch) sends MQTT message
   ↓
Aircon page receives it and updates its own state ❌
   ↓
Aircon page might also publish to AC_switch topic ❌
   ↓
Device '2' gets wrong commands! 🐛
```

---

## The Fix

### Updated `getMqttDeviceKey()` Function

```typescript
const getMqttDeviceKey = () => {
  // Aircon uses a completely different MQTT structure (room1/ac/cmnd/*)
  // It doesn't use the light_control topics at all
  if (deviceType === 'smart-ac') {
    return null; // ✅ Aircon doesn't use these MQTT keys
  }

  // For smart-light type, map device ID to specific MQTT key
  if (deviceType === 'smart-light') {
    const deviceIdToMqttKey: Record<string, string> = {
      '1': 'light_switch',
      '2': 'AC_switch', // Auto Current switch (NOT aircon!)
      '3': 'socket_switch',
      '4': 'rgb_light',
    };
    return (deviceIdToMqttKey[deviceId] || 'light_switch') as any;
  }

  return 'socket_switch';
};
```

### Updated MQTT Message Handler

```typescript
const onMessageArrived = (topic: string, payload: string) => {
  try {
    // Handle state messages for smart-light devices only
    const deviceKey = getMqttDeviceKey();
    if (deviceKey) {  // ✅ Only process if deviceKey exists
      const deviceStateTopic = buildTopic(deviceKey, 'state');
      if (topic === deviceStateTopic) {
        setIsActive(payload === 'ON');
      }
    }

    // Handle AC JSON results/state (for Aircon device only)
    if (topic === `${AC_BASE_TOPIC}/stat/RESULT` ||
        topic === `${AC_BASE_TOPIC}/tele/STATE`) {
      // Handle aircon state
    }
    // ... other handlers
  }
}
```

### Updated Power Toggle Handler

```typescript
const handlePowerToggle = (value: boolean) => {
  // ...
  setIsActive(value);
  const deviceKey = getMqttDeviceKey();
  if (deviceKey) {
    // ✅ Only publish if deviceKey exists
    publishSet(deviceKey, value ? 'ON' : 'OFF');
  }
};
```

---

## MQTT Topic Structure

### Smart-Light Devices (IDs 1-4)

All use `room1/light_control/` prefix:

```
Device 1 (light_switch):
  - Set: room1/light_control/light_switch/set
  - State: room1/light_control/light_switch/state

Device 2 (AC_switch - Auto Current):
  - Set: room1/light_control/AC_switch/set
  - State: room1/light_control/AC_switch/state

Device 3 (socket_switch):
  - Set: room1/light_control/socket_switch/set
  - State: room1/light_control/socket_switch/state

Device 4 (rgb_light):
  - Set: room1/light_control/rgb_light/set
  - State: room1/light_control/rgb_light/state
```

### Aircon Device (smart-ac, ID 1)

Uses `room1/ac/` prefix with **completely different** structure:

```
Commands (cmnd):
  - room1/ac/cmnd/POWER
  - room1/ac/cmnd/TEMPERATURE
  - room1/ac/cmnd/MODE
  - room1/ac/cmnd/FAN
  - room1/ac/cmnd/SWINGV
  - room1/ac/cmnd/SWINGH

Status (stat):
  - room1/ac/stat/RESULT

Telemetry (tele):
  - room1/ac/tele/STATE
  - room1/ac/tele/LWT
```

---

## Flow After Fix

### Smart-Light Device (e.g., Device '2' - AC_switch)

```
User views device '2' detail page
   ↓
getMqttDeviceKey() returns 'AC_switch' ✅
   ↓
Page subscribes to: room1/light_control/AC_switch/state ✅
   ↓
User toggles
   ↓
Publishes to: room1/light_control/AC_switch/set ✅
   ↓
Device responds on: room1/light_control/AC_switch/state ✅
   ↓
Only device '2' page receives and updates ✅
```

### Aircon Device

```
User views Aircon detail page
   ↓
getMqttDeviceKey() returns null ✅
   ↓
Page DOES NOT subscribe to light_control topics ✅
   ↓
User changes temperature
   ↓
Publishes to: room1/ac/cmnd/TEMPERATURE ✅
   ↓
Aircon responds on: room1/ac/stat/RESULT ✅
   ↓
Only Aircon page receives and updates ✅
```

---

## Testing Checklist

### Device '2' (AC_switch - Auto Current)

- [ ] Toggle device '2' from home screen → Only device '2' updates
- [ ] View device '2' detail page → Shows correct state
- [ ] Toggle from device '2' detail page → MQTT publishes to `AC_switch` topic
- [ ] External MQTT message to `AC_switch` → Only device '2' updates

### Aircon Device

- [ ] View Aircon detail page → Shows correct temperature/mode
- [ ] Change Aircon temperature → MQTT publishes to `room1/ac/cmnd/TEMPERATURE`
- [ ] Change Aircon mode → MQTT publishes to `room1/ac/cmnd/MODE`
- [ ] External MQTT message to `room1/ac/stat/RESULT` → Aircon page updates
- [ ] Aircon DOES NOT interfere with device '2' ✅

### Cross-Device

- [ ] Toggle device '2' while viewing Aircon page → No interference
- [ ] Change Aircon while viewing device '2' page → No interference
- [ ] All devices maintain independent state ✅

---

## Files Modified

### `app/device/[type]/[id].tsx`

**Lines 247-266**: Updated `getMqttDeviceKey()` to return `null` for `smart-ac` type

**Lines 387-398**: Updated `onMessageArrived()` to check if `deviceKey` exists before processing

**Lines 399-438**: Changed `else if` to `if` for proper separation of MQTT handlers

**Lines 463-477**: Updated `handlePowerToggle()` to check if `deviceKey` exists

---

## Key Insights

1. **Naming is confusing but correct**:

   - `AC_switch` = Auto Current switch (not related to aircon)
   - `Aircon` = Actual air conditioner

2. **Different MQTT structures**:

   - Smart-light devices: `room1/light_control/{device}/set|state`
   - Aircon: `room1/ac/cmnd|stat|tele/{command}`

3. **Device isolation**:
   - Each device should only listen to its own MQTT topics
   - Returning `null` prevents cross-contamination

---

## No Linting Errors ✅

All changes passed TypeScript and ESLint checks.

---

**Status: FIXED & READY FOR TESTING** 🎉

Now the Aircon device and AC_switch (Auto Current switch) are completely independent and won't interfere with each other!

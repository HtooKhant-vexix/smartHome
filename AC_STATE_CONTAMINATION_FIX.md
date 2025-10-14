# AC State Contamination Bug Fix

## Issue

Device ID '2' (AC_switch / Auto Current switch) was showing **incorrect state** because the **Aircon's MQTT telemetry** was updating the wrong device in the store!

### Observed Behavior

```
Terminal logs show:
- MQTT: room1/light_control/AC_switch/state OFF  ← AC_switch is OFF
- MQTT: room1/ac/tele/STATE {"power":true,...}   ← Aircon telemetry
- Device '2' shows: isActive: true               ← WRONG! Should be false!
```

---

## Root Cause

The `handleMqttMessage` function in `store/useSmartHomeStore.ts` had a **critical logic error**:

```typescript
// ❌ WRONG CODE (lines 518-530)
// Handle AC state messages
if (
  topic === `${AC_BASE_TOPIC}/stat/RESULT` ||
  topic === `${AC_BASE_TOPIC}/tele/STATE`
) {
  try {
    const data = JSON.parse(payload);
    if (typeof data.power === 'boolean') {
      updateDeviceStatesFromMqtt('AC_switch', data.power, set, get);  // ❌ WRONG!
    }
  }
}
```

**The Problem**:

- The Aircon device (type: `smart-ac`, id: `'1'`) sends telemetry to `room1/ac/tele/STATE`
- The code was calling `updateDeviceStatesFromMqtt('AC_switch', ...)`
- This updated device ID '2' (AC_switch - Auto Current switch) instead of the Aircon!
- Device '2' is a **completely different device** (type: `smart-light`)

---

## Device Confusion

### Two Separate Devices That Should NEVER Interfere

| Device Name                         | Type          | Device ID | MQTT Topics                                             |
| ----------------------------------- | ------------- | --------- | ------------------------------------------------------- | ------ |
| **AC_switch** (Auto Current switch) | `smart-light` | `'2'`     | `room1/light_control/AC_switch/set                      | state` |
| **Aircon** (Air Conditioner)        | `smart-ac`    | `'1'`     | `room1/ac/cmnd/*`, `room1/ac/stat/*`, `room1/ac/tele/*` |

**They use COMPLETELY DIFFERENT MQTT topic structures!**

---

## What Was Happening

```
Aircon sends telemetry: room1/ac/tele/STATE {"power": true, ...}
   ↓
handleMqttMessage() receives it
   ↓
Calls: updateDeviceStatesFromMqtt('AC_switch', true, ...)  ❌ WRONG DEVICE!
   ↓
Device '2' (AC_switch) state updated to match Aircon's power state ❌
   ↓
User sees AC_switch showing "ON" even though:
  - Its MQTT topic says: room1/light_control/AC_switch/state OFF ❌
  - The Aircon is ON, contaminating AC_switch state! 🐛
```

---

## The Fix

### Step 1: Added Aircon to Device Key Mapping

**File**: `store/useSmartHomeStore.ts` (lines 543-550)

```typescript
// Helper function to update device states from MQTT
function updateDeviceStatesFromMqtt(
  deviceKey: string,
  isActive: boolean,
  set: any,
  get: () => SmartHomeState
) {
  // Map MQTT device key to device type and ID
  const deviceKeyToConfig: Record<string, { type: DeviceType; id: string }> = {
    light_switch: { type: 'smart-light', id: '1' },
    AC_switch: { type: 'smart-light', id: '2' }, // Auto Current switch
    socket_switch: { type: 'smart-light', id: '3' },
    rgb_light: { type: 'smart-light', id: '4' },
    aircon: { type: 'smart-ac', id: '1' }, // ✅ Actual Aircon device
  };

  const config = deviceKeyToConfig[deviceKey];
  if (!config) return;
  // ... rest of function
}
```

### Step 2: Updated MQTT Handler to Use Correct Device Key

**File**: `store/useSmartHomeStore.ts` (lines 517-532)

```typescript
// Handle Aircon state messages (smart-ac device, NOT AC_switch!)
if (
  topic === `${AC_BASE_TOPIC}/stat/RESULT` ||
  topic === `${AC_BASE_TOPIC}/tele/STATE`
) {
  try {
    const data = JSON.parse(payload);
    if (typeof data.power === 'boolean') {
      // ✅ Update the actual Aircon device (smart-ac, id: '1')
      // ✅ NOT the AC_switch device (smart-light, id: '2')
      updateDeviceStatesFromMqtt('aircon', data.power, set, get);
    }
  } catch (_e) {
    // ignore non-JSON payloads
  }
}
```

---

## Flow After Fix

### Smart-Light Devices (IDs 1-4)

```
MQTT: room1/light_control/AC_switch/state OFF
   ↓
handleMqttMessage() receives it
   ↓
Calls: updateDeviceStatesFromMqtt('AC_switch', false, ...)
   ↓
Updates: Device type: 'smart-light', id: '2' ✅
   ↓
Only device '2' is updated ✅
```

### Aircon Device (smart-ac)

```
MQTT: room1/ac/tele/STATE {"power": true, ...}
   ↓
handleMqttMessage() receives it
   ↓
Calls: updateDeviceStatesFromMqtt('aircon', true, ...)
   ↓
Updates: Device type: 'smart-ac', id: '1' ✅
   ↓
Only Aircon is updated ✅
   ↓
AC_switch (device '2') is NOT affected! ✅
```

---

## Complete Device MQTT Mapping

### Light Control Devices (room1/light_control/\*)

```javascript
{
  light_switch:  { type: 'smart-light', id: '1' },  // Main Light
  AC_switch:     { type: 'smart-light', id: '2' },  // Auto Current switch
  socket_switch: { type: 'smart-light', id: '3' },  // Socket
  rgb_light:     { type: 'smart-light', id: '4' },  // RGB Light
}
```

### Aircon Device (room1/ac/\*)

```javascript
{
  aircon: { type: 'smart-ac', id: '1' },  // Aircon
}
```

---

## Testing Checklist

### Device '2' (AC_switch - Auto Current)

- [ ] MQTT receives: `room1/light_control/AC_switch/state OFF` → Device '2' shows OFF
- [ ] MQTT receives: `room1/light_control/AC_switch/state ON` → Device '2' shows ON
- [ ] Toggle device '2' from UI → MQTT publishes to `AC_switch/set`
- [ ] Aircon telemetry does NOT affect device '2' ✅

### Aircon Device

- [ ] MQTT receives: `room1/ac/tele/STATE {"power":true}` → Aircon shows ON
- [ ] MQTT receives: `room1/ac/tele/STATE {"power":false}` → Aircon shows OFF
- [ ] Change Aircon power → MQTT publishes to `room1/ac/cmnd/POWER`
- [ ] Aircon state does NOT affect device '2' (AC_switch) ✅

### Cross-Device Independence

- [ ] AC_switch ON, Aircon OFF → Both maintain independent states ✅
- [ ] AC_switch OFF, Aircon ON → Both maintain independent states ✅
- [ ] Toggling either device does NOT affect the other ✅

---

## Why This Bug Was Subtle

1. **Naming Confusion**:

   - "AC_switch" sounds like it's related to the Aircon
   - Actually means "Auto Current switch" - completely unrelated!

2. **MQTT Topic Contamination**:

   - Aircon's telemetry (`room1/ac/tele/STATE`) was bleeding into AC_switch state
   - No error thrown - just wrong device updated

3. **State Source Conflict**:
   - AC_switch has its own MQTT topic: `room1/light_control/AC_switch/state`
   - But Aircon telemetry was overwriting it with `data.power` from `room1/ac/tele/STATE`

---

## Files Modified

### `store/useSmartHomeStore.ts`

**Lines 544-550**: Added `aircon` mapping to `deviceKeyToConfig`

**Lines 517-532**: Updated AC state handler to use `'aircon'` instead of `'AC_switch'`

---

## Linting Status

✅ **No linting errors** - All changes pass TypeScript and ESLint checks

---

## Key Insights

1. **Device isolation is critical**: Each device must only respond to its own MQTT topics
2. **Clear mapping reduces bugs**: Explicit `deviceKey → {type, id}` mapping prevents confusion
3. **Telemetry vs Control**: Aircon telemetry (`tele/STATE`) is different from light control state
4. **Name ≠ Function**: "AC_switch" is NOT the Aircon switch!

---

**Status: FIXED** ✅

The Aircon and AC_switch now maintain **completely independent states** and will never interfere with each other!

---

## Before vs After

### Before (Bug)

```
Aircon power: true  →  Updates device '2' (AC_switch) to true ❌
AC_switch MQTT: OFF →  But device still shows ON ❌
```

### After (Fixed)

```
Aircon power: true  →  Updates Aircon (smart-ac, id '1') ✅
AC_switch MQTT: OFF →  Updates AC_switch (smart-light, id '2') ✅
Both devices independent! ✅
```

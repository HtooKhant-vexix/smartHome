# Device State Sync Bug Fix

## Issue

Device ID '2' was showing as active in the device detail page even when it was not actually active.

### Problem

The device detail page's local state was not syncing with the Zustand store's state after MQTT messages updated the device.

---

## Root Cause

The device detail page (`app/device/[type]/[id].tsx`) initialized the `isActive` state from the store **once** on component mount, but never updated it when the store changed.

### Before (Broken)

```typescript
// Get device from store
const currentDevice = rooms
  .flatMap(...)
  .find((device) => device.id === deviceId && device.type === deviceType);

// ❌ Initialize state once - never updates afterwards
const [isActive, setIsActive] = useState(currentDevice?.isActive || false);
```

**The Problem**:

1. Component mounts → `isActive` set from `currentDevice.isActive`
2. User toggles device → Zustand store updates
3. MQTT message arrives → Zustand store updates
4. **But component's `isActive` state stays the same!**

---

## Flow Diagram (Broken)

```
Component Mounts
   ↓
currentDevice.isActive = false
   ↓
useState initializes: isActive = false ✅
   ↓
User toggles device OR MQTT message arrives
   ↓
Zustand store updates: currentDevice.isActive = true
   ↓
❌ Component's local state still shows: isActive = false
   ↓
UI shows incorrect state!
```

---

## Solution

Added a `useEffect` to sync the local state with the store state whenever the device's `isActive` property changes in the store.

### After (Fixed)

```typescript
// Get device from store
const currentDevice = rooms
  .flatMap(...)
  .find((device) => device.id === deviceId && device.type === deviceType);

// Initialize state
const [isActive, setIsActive] = useState(currentDevice?.isActive || false);

// ✅ Sync local state with store state
useEffect(() => {
  if (currentDevice) {
    setIsActive(currentDevice.isActive || false);
  }
}, [currentDevice?.isActive]);  // Re-run when store state changes
```

**How it Works**:

1. Component mounts → `isActive` initialized from store
2. Store updates → `useEffect` detects change
3. Local `isActive` state updates to match store
4. UI re-renders with correct state ✅

---

## Flow Diagram (Fixed)

```
Component Mounts
   ↓
currentDevice.isActive = false
   ↓
useState initializes: isActive = false ✅
useEffect runs: isActive = false ✅
   ↓
User toggles device OR MQTT message arrives
   ↓
Zustand store updates: currentDevice.isActive = true
   ↓
useEffect detects change in currentDevice?.isActive
   ↓
✅ setIsActive(true) - local state updates
   ↓
UI re-renders with correct state! ✅
```

---

## Why This Happened

### useState vs Zustand Selector

**useState**:

- Only runs **once** when component mounts
- Does not react to prop/store changes

**Zustand Selector**:

- `useSmartHomeStore((state) => state.rooms)` re-renders when `rooms` changes
- But this only updates the `rooms` variable, not the local state variables

### The Disconnect

```typescript
// This updates when store changes ✅
const rooms = useSmartHomeStore((state) => state.rooms);

// This is computed from rooms ✅
const currentDevice = rooms.flatMap(...).find(...);

// This is initialized once, NEVER updates ❌
const [isActive, setIsActive] = useState(currentDevice?.isActive || false);
```

---

## Example Scenario

### User toggles device 2 from the home screen:

**Before Fix**:

```
1. Home screen toggle → Store updates device 2 to active: true
2. Navigate to device 2 detail page
3. Page reads from store: currentDevice.isActive = true ✅
4. useState initializes: isActive = true ✅
5. MQTT responds → Store updates device 2 to active: true (confirmed)
6. currentDevice.isActive = true (already was true)
7. Local isActive = true ✅ (works by coincidence)
```

**But if MQTT says it's OFF**:

```
1. Home screen shows: device 2 active (from previous session)
2. Navigate to device 2 detail page
3. Page reads: currentDevice.isActive = true
4. useState initializes: isActive = true
5. MQTT message arrives: OFF
6. Store updates: currentDevice.isActive = false ✅
7. ❌ Local isActive still = true (WRONG!)
8. UI shows device as ON when it's actually OFF!
```

**After Fix**:

```
1. Home screen shows: device 2 active
2. Navigate to device 2 detail page
3. useState initializes: isActive = true
4. useEffect runs: isActive = true
5. MQTT message arrives: OFF
6. Store updates: currentDevice.isActive = false
7. ✅ useEffect runs: setIsActive(false)
8. UI updates to show OFF (CORRECT!)
```

---

## Testing Checklist

### Manual Testing

- [ ] Toggle device from home screen → Device detail page shows correct state
- [ ] Toggle device from device detail page → State updates immediately
- [ ] External MQTT message updates device → Device detail page reflects change
- [ ] Navigate to device detail page → Shows current state from store
- [ ] Multiple rapid toggles → State stays in sync

### Expected Behavior

1. **Home Screen Toggle**

   - Toggle device on home screen
   - Navigate to device detail page
   - Should show the correct active/inactive state ✅

2. **MQTT State Sync**

   - MQTT message arrives with new state
   - Store updates
   - Device detail page updates automatically ✅

3. **Detail Page Toggle**
   - Toggle from device detail page
   - State updates immediately
   - MQTT publishes
   - Response updates state (no flicker) ✅

---

## Files Modified

### `app/device/[type]/[id].tsx`

**Lines 109-114**:

```typescript
// Sync local state with store state
useEffect(() => {
  if (currentDevice) {
    setIsActive(currentDevice.isActive || false);
  }
}, [currentDevice?.isActive]);
```

**Why this dependency?**

- `currentDevice?.isActive` - Only re-run when the active state changes
- Avoids unnecessary re-renders when other device properties change
- Uses optional chaining (`?.`) to handle undefined safely

---

## No Linting Errors ✅

All changes passed TypeScript and ESLint checks.

---

## Related Fixes

This fix is part of a series of MQTT/device state synchronization fixes:

1. ✅ **MQTT State Update Bug** - Fixed index-based updating
2. ✅ **Device Routing Bug** - Fixed device ID mapping
3. ✅ **Device State Sync Bug** - This fix (store → component sync)

---

**Status: FIXED & READY FOR TESTING** 🎉

Now the device detail page will always show the correct state from the store, even when MQTT messages update it in the background!

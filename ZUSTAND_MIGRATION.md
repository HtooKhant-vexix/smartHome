# Zustand Migration Guide

## Overview

The Smart Home application has been migrated from **React Context API** to **Zustand** for state management with the following benefits:

✅ **Centralized State Management** - Single source of truth for all app state  
✅ **AsyncStorage Persistence** - Automatic state persistence across app restarts  
✅ **Centralized MQTT** - All MQTT operations handled in one place  
✅ **Better Performance** - Selective re-renders using Zustand selectors  
✅ **Simpler Code** - Less boilerplate compared to Context API

---

## Architecture Changes

### Before (Context API)

```tsx
// Multiple contexts and hooks
<RoomProvider>
  <Component />
</RoomProvider>;

// In component
const { rooms, updateRoom } = useRooms();
const { isConnected, publish } = useMqtt();
```

### After (Zustand)

```tsx
// No providers needed - just import and use
import { useSmartHomeStore } from '@/store/useSmartHomeStore';

// In component
const rooms = useSmartHomeStore((state) => state.rooms);
const updateRoom = useSmartHomeStore((state) => state.updateRoom);
const publishMqtt = useSmartHomeStore((state) => state.publishMqtt);
```

---

## New Store Structure

### Location

`D:\codeFolders\smartHome\store\useSmartHomeStore.ts`

### Key Features

#### 1. **State Persistence**

```typescript
persist(
  (set, get) => ({
    /* store */
  }),
  {
    name: 'smart-home-storage',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({
      rooms: state.rooms,
      configuredDevices: state.configuredDevices,
      // MQTT state is NOT persisted (reconnects on app start)
    }),
  }
);
```

#### 2. **Centralized MQTT Management**

- Auto-connects on app initialization
- Subscribes to all necessary topics automatically
- Handles incoming messages and updates device states
- Provides publish/subscribe methods to components

#### 3. **Room & Device Management**

```typescript
// Add/Remove/Update rooms
addRoom(room);
removeRoom(id);
updateRoom(id, updates);

// Device operations
addDevice(roomId, deviceType, device);
removeDevice(roomId, deviceType, deviceId);
updateDevice(roomId, deviceType, deviceId, updates);
toggleDeviceWithMqtt(roomId, deviceType, deviceId, deviceIndex);
```

#### 4. **MQTT Device Control**

```typescript
// Light controls
setDeviceBrightness(brightness);
setDeviceColor(r, g, b);

// AC controls
setAcPower(power);
setAcTemperature(temp);
setAcMode(mode);
setAcFanSpeed(speed);
setAcSwing(axis, value);
```

---

## Migration Changes

### Files Modified

#### 1. **app/\_layout.tsx**

- ❌ Removed `RoomProvider`
- ✅ Added store initialization in `useEffect`

```tsx
const initializeMqtt = useSmartHomeStore((state) => state.initializeMqtt);
const loadConfiguredDevices = useSmartHomeStore(
  (state) => state.loadConfiguredDevices
);

useEffect(() => {
  initializeMqtt();
  loadConfiguredDevices();
}, []);
```

#### 2. **app/(tabs)/index.tsx**

- ❌ Removed `useRooms()` and `useMqtt()`
- ✅ Use Zustand selectors

```tsx
const rooms = useSmartHomeStore((state) => state.rooms);
const mqttConnected = useSmartHomeStore((state) => state.mqtt.isConnected);
const mqttStatus = useSmartHomeStore((state) => state.mqtt.status);
```

#### 3. **app/room/[id].tsx**

- ❌ Removed MQTT subscription logic (now in store)
- ✅ Use `toggleDeviceWithMqtt` action

```tsx
const toggleDeviceWithMqtt = useSmartHomeStore(
  (state) => state.toggleDeviceWithMqtt
);

const toggleDevice = (deviceType, deviceId, deviceIndex) => {
  toggleDeviceWithMqtt(roomId, deviceType, deviceId, deviceIndex);
};
```

#### 4. **app/device/[type]/[id].tsx**

- ✅ Use store actions for all MQTT operations

```tsx
const setAcPowerStore = useSmartHomeStore((state) => state.setAcPower);
const setAcTemperatureStore = useSmartHomeStore(
  (state) => state.setAcTemperature
);

const handleAcPowerToggle = (value) => {
  setAcPower(value);
  setAcPowerStore(value); // Publishes to MQTT
};
```

#### 5. **app/device-setup.tsx**

- ✅ Use store actions to add devices

```tsx
const addDevice = useSmartHomeStore((state) => state.addDevice);
const addConfiguredDevice = useSmartHomeStore(
  (state) => state.addConfiguredDevice
);

// Add device to room
addDevice(roomId, selectedType, newDevice);
addConfiguredDevice(deviceInfo);
```

#### 6. **components/RoomCard.tsx**

- ✅ Direct store access instead of context

```tsx
const rooms = useSmartHomeStore((state) => state.rooms);
const room = rooms.find((r) => r.id === roomId);
```

---

## Store API Reference

### State Shape

```typescript
interface SmartHomeState {
  // Data
  rooms: Room[];
  configuredDevices: ConfiguredDevice[];
  mqtt: {
    isConnected: boolean;
    status: MqttConnectionStatus;
  };

  // Room Actions
  addRoom(room);
  removeRoom(id);
  updateRoom(id, updates);

  // Device Actions
  addDevice(roomId, type, device);
  removeDevice(roomId, type, deviceId);
  updateDevice(roomId, type, deviceId, updates);
  toggleDevice(roomId, type, deviceId);

  // Configured Devices
  addConfiguredDevice(device);
  removeConfiguredDevice(deviceId);
  loadConfiguredDevices();

  // MQTT
  initializeMqtt();
  connectMqtt();
  disconnectMqtt();
  publishMqtt(topic, message);
  subscribeMqtt(topic);
  setMqttStatus(status);
  setMqttConnected(connected);

  // Device Control
  toggleDeviceWithMqtt(roomId, type, deviceId, index);
  setDeviceBrightness(brightness);
  setDeviceColor(r, g, b);
  setAcPower(power);
  setAcTemperature(temp);
  setAcMode(mode);
  setAcFanSpeed(speed);
  setAcSwing(axis, value);
}
```

---

## Usage Examples

### 1. **Reading State**

```tsx
// Select only what you need for optimal re-renders
const rooms = useSmartHomeStore((state) => state.rooms);
const isConnected = useSmartHomeStore((state) => state.mqtt.isConnected);

// Or select multiple values
const { rooms, mqtt } = useSmartHomeStore((state) => ({
  rooms: state.rooms,
  mqtt: state.mqtt,
}));
```

### 2. **Updating State**

```tsx
// Get action
const updateRoom = useSmartHomeStore((state) => state.updateRoom);

// Call it
updateRoom('living-room', { name: 'New Name' });
```

### 3. **MQTT Operations**

```tsx
const toggleDeviceWithMqtt = useSmartHomeStore(
  (state) => state.toggleDeviceWithMqtt
);
const publishMqtt = useSmartHomeStore((state) => state.publishMqtt);

// Toggle device (publishes to MQTT automatically)
toggleDeviceWithMqtt('living-room', 'smart-light', 'device-1', 0);

// Custom MQTT publish
publishMqtt('custom/topic', 'message');
```

### 4. **AC Control**

```tsx
const setAcTemperature = useSmartHomeStore((state) => state.setAcTemperature);
const setAcMode = useSmartHomeStore((state) => state.setAcMode);

setAcTemperature(24); // Sets temperature and publishes to MQTT
setAcMode('cool'); // Sets mode and publishes to MQTT
```

---

## MQTT Flow

### Auto-Initialization

```
App Start → _layout.tsx useEffect → initializeMqtt()
  ↓
Connect to MQTT broker (192.168.0.103:9001)
  ↓
Subscribe to all device topics:
  - room1/light_control/{device}/state
  - room1/ac/stat/RESULT
  - room1/ac/tele/STATE
  - room1/ac/tele/LWT
  - home/test/{temp|hum|lux}
  ↓
Listen for messages → Update store state
```

### Message Handling

```
MQTT Message Received
  ↓
handleMqttMessage() in store
  ↓
Parse topic and payload
  ↓
Update device state in rooms
  ↓
Components re-render (only affected components)
```

### Publishing

```
User Action (e.g., toggle device)
  ↓
Call store action (e.g., toggleDeviceWithMqtt())
  ↓
Optimistic UI update
  ↓
Publish to MQTT
  ↓
Device responds with state update
  ↓
Store receives message and confirms state
```

---

## Benefits Over Context API

### 1. **Performance**

- ✅ Selective re-renders (only components using changed state)
- ❌ Context re-renders all consumers when any value changes

### 2. **DevTools**

- ✅ Zustand DevTools integration
- ✅ Time-travel debugging
- ❌ Context has limited debugging

### 3. **Code Simplicity**

- ✅ No Provider wrappers needed
- ✅ Direct imports
- ❌ Context requires Provider setup

### 4. **State Persistence**

- ✅ Built-in with `persist` middleware
- ❌ Context requires manual AsyncStorage integration

### 5. **Centralization**

- ✅ All logic in one file
- ❌ Context spreads across multiple files

---

## Testing

### Test MQTT Connection

```tsx
const { mqtt } = useSmartHomeStore.getState();
console.log('Connected:', mqtt.isConnected);
console.log('Status:', mqtt.status);
```

### Test Device Toggle

```tsx
const { toggleDeviceWithMqtt } = useSmartHomeStore.getState();
toggleDeviceWithMqtt('living-room', 'smart-light', '1', 0);
```

### Test Persistence

```tsx
// Add a room
useSmartHomeStore.getState().addRoom({
  name: 'Test Room',
  icon: 'Home',
  devices: {},
});

// Restart app - room should persist
```

---

## Troubleshooting

### MQTT Not Connecting

```tsx
// Check status
const { mqtt, connectMqtt } = useSmartHomeStore.getState();
console.log(mqtt.status);

// Manually reconnect
await connectMqtt();
```

### State Not Persisting

- Check AsyncStorage permissions
- Verify `partialize` configuration in store
- Clear AsyncStorage: `AsyncStorage.clear()`

### Devices Not Updating

- Verify MQTT topics match device configuration
- Check `handleMqttMessage` logic in store
- Ensure device type mapping is correct

---

## Migration Checklist

- [x] Install Zustand
- [x] Create centralized store
- [x] Add AsyncStorage persistence
- [x] Integrate MQTT into store
- [x] Update \_layout.tsx
- [x] Update home screen
- [x] Update room detail screen
- [x] Update device detail screen
- [x] Update device setup screen
- [x] Update RoomCard component
- [x] Remove old Context files (optional)
- [x] Test MQTT connectivity
- [x] Test state persistence
- [x] Test device control

---

## Next Steps

1. **Remove Legacy Code** (Optional)

   - Delete `app/context/RoomContext.tsx`
   - Delete `hooks/useMqtt.ts`

2. **Add More Store Slices** (Optional)

   - User preferences
   - Notifications
   - Automation rules

3. **Add Zustand DevTools**

   ```bash
   npm install @redux-devtools/extension
   ```

   ```typescript
   import { devtools } from 'zustand/middleware';

   export const useSmartHomeStore = create<SmartHomeState>()(
     devtools(persist(/* ... */), { name: 'SmartHomeStore' })
   );
   ```

4. **Add State Selectors** (Performance)

   ```typescript
   // Create reusable selectors
   const selectActiveDevices = (state) =>
     state.rooms.flatMap((r) =>
       Object.values(r.devices)
         .flat()
         .filter((d) => d.isActive)
     );

   // Use in component
   const activeDevices = useSmartHomeStore(selectActiveDevices);
   ```

---

## Support

For issues or questions:

1. Check the store implementation in `store/useSmartHomeStore.ts`
2. Review MQTT message handling in `handleMqttMessage()`
3. Verify device type mappings match your MQTT broker
4. Check AsyncStorage for persisted data

---

**Migration Complete! 🎉**

Your Smart Home app now uses Zustand for centralized state management with AsyncStorage persistence and integrated MQTT control.

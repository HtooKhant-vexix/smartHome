# Quick Start Guide - Zustand Store

## 🚀 Quick Import

```typescript
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
```

## 📖 Common Use Cases

### 1. Get Rooms

```typescript
const rooms = useSmartHomeStore((state) => state.rooms);
```

### 2. Get MQTT Status

```typescript
const isConnected = useSmartHomeStore((state) => state.mqtt.isConnected);
const status = useSmartHomeStore((state) => state.mqtt.status);
```

### 3. Toggle Device

```typescript
const toggleDevice = useSmartHomeStore((state) => state.toggleDeviceWithMqtt);

// Usage
toggleDevice('living-room', 'smart-light', 'device-1', 0);
```

### 4. Control AC

```typescript
const setAcTemp = useSmartHomeStore((state) => state.setAcTemperature);
const setAcMode = useSmartHomeStore((state) => state.setAcMode);

setAcTemp(24); // Sets to 24°C
setAcMode('cool'); // Sets to cool mode
```

### 5. Add New Room

```typescript
const addRoom = useSmartHomeStore((state) => state.addRoom);

addRoom({
  name: 'Office',
  icon: 'Briefcase',
  devices: {},
});
```

### 6. Add Device to Room

```typescript
const addDevice = useSmartHomeStore((state) => state.addDevice);

addDevice('living-room', 'smart-light', {
  id: 'light-5',
  name: 'Desk Lamp',
  isActive: false,
});
```

### 7. Custom MQTT Publish

```typescript
const publish = useSmartHomeStore((state) => state.publishMqtt);

publish('custom/topic', 'ON');
```

### 8. Subscribe to MQTT Topic

```typescript
const subscribe = useSmartHomeStore((state) => state.subscribeMqtt);

subscribe('custom/topic');
```

## 🔥 Advanced Patterns

### Multiple Selectors

```typescript
const { rooms, mqtt, toggleDevice } = useSmartHomeStore((state) => ({
  rooms: state.rooms,
  mqtt: state.mqtt,
  toggleDevice: state.toggleDeviceWithMqtt,
}));
```

### Get Specific Room

```typescript
const room = useSmartHomeStore((state) =>
  state.rooms.find((r) => r.id === 'living-room')
);
```

### Count Active Devices

```typescript
const activeCount = useSmartHomeStore((state) =>
  state.rooms.reduce(
    (count, room) =>
      count +
      Object.values(room.devices)
        .flat()
        .filter((d) => d.isActive).length,
    0
  )
);
```

### Outside Components (Direct Access)

```typescript
// Get current state
const state = useSmartHomeStore.getState();
console.log(state.rooms);

// Call actions
useSmartHomeStore
  .getState()
  .toggleDeviceWithMqtt('living-room', 'smart-light', '1', 0);
```

## 🎯 Key Store Actions

| Action                                                | Description             |
| ----------------------------------------------------- | ----------------------- |
| `addRoom(room)`                                       | Add new room            |
| `updateRoom(id, updates)`                             | Update room details     |
| `removeRoom(id)`                                      | Remove room             |
| `addDevice(roomId, type, device)`                     | Add device to room      |
| `updateDevice(roomId, type, deviceId, updates)`       | Update device           |
| `toggleDeviceWithMqtt(roomId, type, deviceId, index)` | Toggle device with MQTT |
| `publishMqtt(topic, message)`                         | Publish MQTT message    |
| `subscribeMqtt(topic)`                                | Subscribe to MQTT topic |
| `setAcPower(power)`                                   | Control AC power        |
| `setAcTemperature(temp)`                              | Set AC temperature      |
| `setAcMode(mode)`                                     | Set AC mode             |
| `setDeviceBrightness(brightness)`                     | Set light brightness    |
| `setDeviceColor(r, g, b)`                             | Set RGB color           |

## 🔧 Debugging

```typescript
// Log entire state
console.log(useSmartHomeStore.getState());

// Subscribe to all state changes
useSmartHomeStore.subscribe((state) => {
  console.log('State changed:', state);
});

// Check MQTT status
const { mqtt } = useSmartHomeStore.getState();
console.log('MQTT Status:', mqtt.status);
console.log('Connected:', mqtt.isConnected);
```

## 💾 Data Persistence

- **Automatically persisted**: rooms, configuredDevices
- **Not persisted**: MQTT connection state (reconnects on app start)
- **Storage**: AsyncStorage with key `smart-home-storage`

## 🔄 State Updates

The store automatically:

- ✅ Connects to MQTT on app start
- ✅ Subscribes to all device topics
- ✅ Updates device states from MQTT messages
- ✅ Persists room and device data
- ✅ Handles optimistic updates

## 📱 Usage in Components

```typescript
function MyComponent() {
  // Select only what you need
  const rooms = useSmartHomeStore((state) => state.rooms);
  const toggleDevice = useSmartHomeStore((state) => state.toggleDeviceWithMqtt);

  return (
    <View>
      {rooms.map((room) => (
        <Text key={room.id}>{room.name}</Text>
      ))}
    </View>
  );
}
```

## 🌐 MQTT Topics

### Subscribe (automatic)

- `room1/light_control/{device}/state`
- `room1/ac/stat/RESULT`
- `room1/ac/tele/STATE`
- `room1/ac/tele/LWT`
- `home/test/temp`
- `home/test/hum`
- `home/test/lux`

### Publish (via actions)

- `room1/light_control/{device}/set` → ON/OFF
- `room1/ac/cmnd/POWER` → ON/OFF
- `room1/ac/cmnd/TEMPERATURE` → 16-30
- `room1/ac/cmnd/MODE` → 0-3
- `room1/ac/cmnd/FAN` → 1-3
- `room1/ac/cmnd/SWINGV` → ON/OFF
- `room1/ac/cmnd/SWINGH` → ON/OFF

---

**Happy Coding! 🎉**

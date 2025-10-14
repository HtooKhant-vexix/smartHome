import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mqttService, MqttConnectionStatus } from '../services/mqttService';
import { topicHelpers } from '../constants/topicTable';
import { DeviceType, Device } from '../constants/defaultData';

// Types
export interface Room {
  id: string;
  name: string;
  icon: string;
  devices: {
    [key in DeviceType]?: Device[];
  };
}

interface ConfiguredDevice {
  id: string;
  name: string;
  type: DeviceType;
  roomId: string;
  wifiConfig: {
    ssid: string;
    password: string;
    port: number;
  };
  lastConnected: string;
  status: string;
}

interface MqttState {
  isConnected: boolean;
  status: MqttConnectionStatus;
}

interface SmartHomeState {
  // Rooms & Devices
  rooms: Room[];
  configuredDevices: ConfiguredDevice[];

  // MQTT State
  mqtt: MqttState;

  // Actions - Rooms
  addRoom: (room: Omit<Room, 'id'>) => void;
  removeRoom: (id: string) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;

  // Actions - Devices
  addDevice: (roomId: string, deviceType: DeviceType, device: Device) => void;
  removeDevice: (
    roomId: string,
    deviceType: DeviceType,
    deviceId: string
  ) => void;
  updateDevice: (
    roomId: string,
    deviceType: DeviceType,
    deviceId: string,
    updates: Partial<Device>
  ) => void;
  toggleDevice: (
    roomId: string,
    deviceType: DeviceType,
    deviceId: string
  ) => void;

  // Actions - Configured Devices
  addConfiguredDevice: (device: ConfiguredDevice) => void;
  removeConfiguredDevice: (deviceId: string) => void;
  loadConfiguredDevices: () => Promise<void>;

  // Actions - MQTT
  initializeMqtt: () => Promise<void>;
  connectMqtt: () => Promise<boolean>;
  disconnectMqtt: () => void;
  publishMqtt: (topic: string, message: string) => boolean;
  subscribeMqtt: (topic: string) => boolean;
  setMqttStatus: (status: MqttConnectionStatus) => void;
  setMqttConnected: (connected: boolean) => void;

  // MQTT Device Control
  toggleDeviceWithMqtt: (
    roomId: string,
    deviceType: DeviceType,
    deviceId: string,
    deviceIndex?: number
  ) => void;
  setDeviceBrightness: (brightness: number) => void;
  setDeviceColor: (r: number, g: number, b: number) => void;

  // AC Control
  setAcPower: (power: boolean) => void;
  setAcTemperature: (temp: number) => void;
  setAcMode: (mode: 'cool' | 'heat' | 'auto' | 'dry') => void;
  setAcFanSpeed: (speed: 'low' | 'med' | 'high') => void;
  setAcSwing: (axis: 'UD' | 'LR', value: boolean) => void;
}

// Default room data
const defaultRooms: Room[] = [
  {
    id: 'living-room',
    name: 'Living Room',
    icon: 'Sofa',
    devices: {
      'smart-light': [
        { id: '1', name: 'light switch', isActive: false },
        { id: '2', name: 'AC switch', isActive: false },
        { id: '3', name: 'socket switch', isActive: false },
        { id: '4', name: 'rgb light', isActive: false },
      ],
      'smart-ac': [{ id: '1', name: 'Aircon', isActive: false }],
    },
  },
];

// MQTT device key mapping
const DEVICE_KEYS = [
  'light_switch',
  'AC_switch',
  'socket_switch',
  'rgb_light',
] as const;
const AC_BASE_TOPIC = 'room1/ac';

// Create the store
export const useSmartHomeStore = create<SmartHomeState>()(
  persist(
    (set, get) => ({
      // Initial State
      rooms: defaultRooms,
      configuredDevices: [],
      mqtt: {
        isConnected: false,
        status: 'disconnected',
      },

      // Room Actions
      addRoom: (room) =>
        set((state) => ({
          rooms: [
            ...state.rooms,
            {
              ...room,
              id: room.name.toLowerCase().replace(/\s+/g, '-'),
              devices: room.devices || {},
            },
          ],
        })),

      removeRoom: (id) =>
        set((state) => ({
          rooms: state.rooms.filter((room) => room.id !== id),
        })),

      updateRoom: (id, updatedRoom) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === id
              ? {
                  ...room,
                  ...updatedRoom,
                  devices: updatedRoom.devices || room.devices || {},
                }
              : room
          ),
        })),

      // Device Actions
      addDevice: (roomId, deviceType, device) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  devices: {
                    ...room.devices,
                    [deviceType]: [...(room.devices[deviceType] || []), device],
                  },
                }
              : room
          ),
        })),

      removeDevice: (roomId, deviceType, deviceId) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  devices: {
                    ...room.devices,
                    [deviceType]: (room.devices[deviceType] || []).filter(
                      (d) => d.id !== deviceId
                    ),
                  },
                }
              : room
          ),
        })),

      updateDevice: (roomId, deviceType, deviceId, updates) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  devices: {
                    ...room.devices,
                    [deviceType]: (room.devices[deviceType] || []).map(
                      (device) =>
                        device.id === deviceId
                          ? { ...device, ...updates }
                          : device
                    ),
                  },
                }
              : room
          ),
        })),

      toggleDevice: (roomId, deviceType, deviceId) =>
        set((state) => ({
          rooms: state.rooms.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  devices: {
                    ...room.devices,
                    [deviceType]: (room.devices[deviceType] || []).map(
                      (device) =>
                        device.id === deviceId
                          ? { ...device, isActive: !device.isActive }
                          : device
                    ),
                  },
                }
              : room
          ),
        })),

      // Configured Devices
      addConfiguredDevice: (device) =>
        set((state) => {
          const exists = state.configuredDevices.some(
            (d) => d.id === device.id
          );
          if (exists) {
            return {
              configuredDevices: state.configuredDevices.map((d) =>
                d.id === device.id ? device : d
              ),
            };
          }
          return {
            configuredDevices: [...state.configuredDevices, device],
          };
        }),

      removeConfiguredDevice: (deviceId) =>
        set((state) => ({
          configuredDevices: state.configuredDevices.filter(
            (d) => d.id !== deviceId
          ),
        })),

      loadConfiguredDevices: async () => {
        try {
          const devices = await AsyncStorage.getItem('configuredDevices');
          if (devices) {
            const configuredDevices: ConfiguredDevice[] = JSON.parse(devices);
            set({ configuredDevices });

            // Update rooms with configured devices
            const devicesByRoom = configuredDevices.reduce((acc, device) => {
              if (!acc[device.roomId]) {
                acc[device.roomId] = [];
              }
              acc[device.roomId].push(device);
              return acc;
            }, {} as Record<string, ConfiguredDevice[]>);

            set((state) => ({
              rooms: state.rooms.map((room) => {
                const roomDevices = devicesByRoom[room.id] || [];
                const updatedDevices = { ...room.devices };

                roomDevices.forEach((device) => {
                  if (!updatedDevices[device.type]) {
                    updatedDevices[device.type] = [];
                  }

                  const existingDeviceIndex = updatedDevices[
                    device.type
                  ]?.findIndex((d) => d.id === device.id);

                  if (existingDeviceIndex === -1) {
                    updatedDevices[device.type]?.push({
                      id: device.id,
                      name: device.name,
                      isActive:
                        device.name.toLowerCase().includes('main') ||
                        device.name.toLowerCase().includes('primary'),
                    });
                  }
                });

                return {
                  ...room,
                  devices: updatedDevices,
                };
              }),
            }));
          }
        } catch (error) {
          console.error('Error loading configured devices:', error);
        }
      },

      // MQTT Actions
      initializeMqtt: async () => {
        // Set up MQTT event listeners
        mqttService.on('connected', () => {
          console.log('MQTT Connected');
          set((state) => ({
            mqtt: { isConnected: true, status: 'connected' },
          }));

          // Subscribe to all device topics
          const deviceKeys: Array<
            'light_switch' | 'AC_switch' | 'socket_switch' | 'rgb_light'
          > = ['light_switch', 'AC_switch', 'socket_switch', 'rgb_light'];

          deviceKeys.forEach((key) => {
            mqttService.subscribe(topicHelpers.switchState(key));
          });

          // Subscribe to AC topics
          mqttService.subscribe(`${AC_BASE_TOPIC}/stat/RESULT`);
          mqttService.subscribe(`${AC_BASE_TOPIC}/tele/STATE`);
          mqttService.subscribe(`${AC_BASE_TOPIC}/tele/LWT`);

          // Subscribe to sensor topics
          mqttService.subscribe('home/test/temp');
          mqttService.subscribe('home/test/hum');
          mqttService.subscribe('home/test/lux');
        });

        mqttService.on('disconnected', () => {
          console.log('MQTT Disconnected');
          set((state) => ({
            mqtt: { isConnected: false, status: 'disconnected' },
          }));
        });

        mqttService.on('statusChanged', (status: MqttConnectionStatus) => {
          console.log('MQTT Status Changed:', status);
          set((state) => ({
            mqtt: { ...state.mqtt, status },
          }));
        });

        mqttService.on('message', (topic: string, payload: string) => {
          console.log('MQTT Message:', topic, payload);
          handleMqttMessage(topic, payload, set, get);
        });

        // Auto-connect
        try {
          await mqttService.connect();
        } catch (error) {
          console.error('Failed to connect to MQTT:', error);
        }
      },

      connectMqtt: async () => {
        try {
          await mqttService.connect();
          return true;
        } catch (error) {
          console.error('Failed to connect to MQTT:', error);
          return false;
        }
      },

      disconnectMqtt: () => {
        mqttService.disconnect();
      },

      publishMqtt: (topic: string, message: string) => {
        return mqttService.publish(topic, message);
      },

      subscribeMqtt: (topic: string) => {
        return mqttService.subscribe(topic);
      },

      setMqttStatus: (status) =>
        set((state) => ({
          mqtt: { ...state.mqtt, status },
        })),

      setMqttConnected: (connected) =>
        set((state) => ({
          mqtt: { ...state.mqtt, isConnected: connected },
        })),

      // MQTT Device Control
      toggleDeviceWithMqtt: (roomId, deviceType, deviceId, deviceIndex = 0) => {
        const state = get();
        const room = state.rooms.find((r) => r.id === roomId);
        if (!room) return;

        const devices = room.devices[deviceType] || [];
        const device = devices.find((d) => d.id === deviceId);
        const nextActive = device ? !device.isActive : true;

        // Publish to MQTT
        if (deviceType === 'smart-light') {
          const key = DEVICE_KEYS[deviceIndex] || 'light_switch';
          mqttService.publish(
            topicHelpers.switchSet(key),
            nextActive ? 'ON' : 'OFF'
          );
        } else if (deviceType === 'smart-ac') {
          mqttService.publish(
            topicHelpers.acCmnd('POWER'),
            nextActive ? 'ON' : 'OFF'
          );
        }

        // Update local state optimistically
        get().updateDevice(roomId, deviceType, deviceId, {
          isActive: nextActive,
        });
      },

      setDeviceBrightness: (brightness) => {
        mqttService.publish('control', `BRIGHTNESS:${brightness}`);
      },

      setDeviceColor: (r, g, b) => {
        mqttService.publish('control', `COLOR:${r},${g},${b}`);
      },

      // AC Control
      setAcPower: (power) => {
        mqttService.publish(topicHelpers.acCmnd('POWER'), power ? 'ON' : 'OFF');
      },

      setAcTemperature: (temp) => {
        const t = Math.max(16, Math.min(30, Math.round(temp)));
        mqttService.publish(topicHelpers.acCmnd('TEMPERATURE'), String(t));
      },

      setAcMode: (mode) => {
        const map: Record<typeof mode, string> = {
          auto: '0',
          cool: '1',
          heat: '2',
          dry: '3',
        };
        mqttService.publish(topicHelpers.acCmnd('MODE'), map[mode]);
      },

      setAcFanSpeed: (speed) => {
        const map: Record<typeof speed, string> = {
          low: '1',
          med: '2',
          high: '3',
        };
        mqttService.publish(topicHelpers.acCmnd('FAN'), map[speed]);
      },

      setAcSwing: (axis, value) => {
        mqttService.publish(
          topicHelpers.acCmnd(axis === 'UD' ? 'SWINGV' : 'SWINGH'),
          value ? 'ON' : 'OFF'
        );
      },
    }),
    {
      name: 'smart-home-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        rooms: state.rooms,
        configuredDevices: state.configuredDevices,
        // Don't persist MQTT state
      }),
    }
  )
);

// MQTT Message Handler
function handleMqttMessage(
  topic: string,
  payload: string,
  set: any,
  get: () => SmartHomeState
) {
  try {
    // Handle device state messages
    const deviceKeys: Array<
      'light_switch' | 'AC_switch' | 'socket_switch' | 'rgb_light'
    > = ['light_switch', 'AC_switch', 'socket_switch', 'rgb_light'];

    deviceKeys.forEach((key) => {
      const stateTopic = topicHelpers.switchState(key);
      if (topic === stateTopic) {
        const isActive = payload === 'ON';
        updateDeviceStatesFromMqtt(key, isActive, set, get);
      }
    });

    // Handle AC state messages
    if (
      topic === `${AC_BASE_TOPIC}/stat/RESULT` ||
      topic === `${AC_BASE_TOPIC}/tele/STATE`
    ) {
      try {
        const data = JSON.parse(payload);
        if (typeof data.power === 'boolean') {
          updateDeviceStatesFromMqtt('AC_switch', data.power, set, get);
        }
      } catch (_e) {
        // ignore non-JSON payloads
      }
    }
  } catch (error) {
    console.error('Error handling MQTT message:', error);
  }
}

// Helper function to update device states from MQTT
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
            [targetDeviceType]: devices.map((device, index) =>
              index === 0 ? { ...device, isActive } : device
            ),
          },
        };
      }
      return room;
    }),
  });
}

// Initialize MQTT on app start
if (typeof window !== 'undefined') {
  useSmartHomeStore.getState().initializeMqtt();
  useSmartHomeStore.getState().loadConfiguredDevices();
}

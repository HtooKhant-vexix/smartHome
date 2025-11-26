import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haService } from '../services/haService';
import { HassEntities } from 'home-assistant-js-websocket';
import { DeviceType, Device } from '../constants/defaultData';
import { appConfig } from '../config/env';

const STORAGE_KEY = appConfig.storageKey;

// Types
export interface Room {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  devices: {
    [key in DeviceType]?: Device[];
  };
}

export interface ConfiguredDevice {
  id: string;
  name: string;
  type: DeviceType;
  roomId: string;
  // HA specific
  entityId: string;
  domain: string;
  state: string;
  attributes: any;
}

interface SmartHomeState {
  rooms: Room[];
  haEntities: HassEntities;
  isConnected: boolean;

  // Actions
  initializeSmartHome: () => void;
  loadConfiguredDevices: () => void; // Keeping name for compatibility
  
  // HA Actions
  toggleDevice: (roomId: string, deviceType: DeviceType, deviceId: string) => void;
  
  // AC Actions
  setAcPower: (value: boolean) => void;
  setAcTemperature: (temp: number) => void;
  setAcMode: (mode: string) => void;
  setAcFanSpeed: (speed: string) => void;
  setAcSwing: (axis: 'UD' | 'LR', value: boolean) => void;

  // Light Actions
  // Light Actions
  setLightBrightness: (deviceId: string, brightness: number) => void;
  setLightColor: (deviceId: string, rgb: [number, number, number]) => void;
  setLightEffect: (deviceId: string, effect: string) => void;
  
  updateHaConfig: (config: { url: string; token: string }) => Promise<void>;
  // Visibility Actions
  visibleDeviceIds: string[];
  toggleDeviceVisibility: (deviceId: string) => void;

  haConfig: { url: string; token: string } | null;
  error: string | null;
  clearError: () => void;
  isHydrated: boolean;
  setHydrated: (state: boolean) => void;
}

// Default room data (skeleton)
const defaultRooms: Room[] = [
  {
    id: 'home-assistant',
    name: 'Home Assistant',
    icon: 'Home',
    devices: {
      'smart-light': [],
      'smart-ac': [],
      'smart-tv': [],
      'air-purifier': [],
      'smart-curtain': [],
      'sensor': [],
    },
  },
];

export const useSmartHomeStore = create<SmartHomeState>()(
  persist(
    (set, get) => ({
      // Initial State
      rooms: defaultRooms,
      haEntities: {},
      isConnected: false,
      haConfig: {
        url: appConfig.haUrl,
        token: appConfig.haToken,
      },
      error: null,
      visibleDeviceIds: [],
      isHydrated: false,

      setHydrated: (state: boolean) => set({ isHydrated: state }),

      toggleDeviceVisibility: (deviceId: string) => {
        set((state) => {
          const isVisible = state.visibleDeviceIds.includes(deviceId);
          return {
            visibleDeviceIds: isVisible
              ? state.visibleDeviceIds.filter((id) => id !== deviceId)
              : [...state.visibleDeviceIds, deviceId],
          };
        });
      },

      clearError: () => set({ error: null }),

      initializeSmartHome: async () => {
        const { haConfig } = get();
        console.log('Initializing Home Assistant Service...');
        
        if (!haConfig?.url || !haConfig?.token) {
          console.warn('HA Config missing (URL or Token is empty), skipping connection. Please configure in Settings.');
          set({ error: 'Home Assistant not configured. Please go to Settings.' });
          return;
        }

        haService.on('connected', () => {
          set({ isConnected: true, error: null });
        });

        haService.on('disconnected', () => {
          set({ isConnected: false });
        });

        haService.on('error', (err) => {
          console.error('HA Service Error:', err);
          set({ error: err.message || 'Connection failed' });
          set({ isConnected: false });
        });

        haService.on('entities_changed', (entities) => {
          set({ haEntities: entities });
          get().loadConfiguredDevices(); // Refresh mapped devices
        });

        await haService.connect(haConfig.url, haConfig.token);
      },

      updateHaConfig: async (config) => {
        set({ haConfig: config });
        // Reconnect with new config
        await haService.disconnect();
        await get().initializeSmartHome();
      },

      loadConfiguredDevices: () => {
        const { haEntities } = get();
        const haRoom = { ...defaultRooms[0] };
        
        // Reset devices in the room
        haRoom.devices = {
          'smart-light': [],
          'smart-ac': [],
          'smart-tv': [],
          'air-purifier': [],
          'smart-curtain': [],
          'sensor': [],
        };

        Object.values(haEntities).forEach((entity) => {
          const domain = entity.entity_id.split('.')[0];
          const device: Device = {
            id: entity.entity_id,
            name: entity.attributes.friendly_name || entity.entity_id,
            isActive: domain === 'climate' ? entity.state !== 'off' : entity.state === 'on',
            // Store raw entity data if needed later
          };

          if (domain === 'light' || domain === 'switch') {
             // Map light attributes
             if (domain === 'light') {
               device.brightness = entity.attributes.brightness;
               device.rgb_color = entity.attributes.rgb_color;
               device.effect = entity.attributes.effect;
               device.effect_list = entity.attributes.effect_list;
               device.supported_features = entity.attributes.supported_features;
             }
             haRoom.devices['smart-light']?.push(device);
          } else if (domain === 'climate') {
             haRoom.devices['smart-ac']?.push(device);
          } else if (domain === 'media_player') {
             haRoom.devices['smart-tv']?.push(device);
          } else if (domain === 'cover') {
             haRoom.devices['smart-curtain']?.push(device);
          } else if (domain === 'sensor' || domain === 'binary_sensor') {
             haRoom.devices['sensor']?.push(device);
          }
          // Add more mappings as needed
        });

        set({ rooms: [haRoom] });
      },

      toggleDevice: (roomId, deviceType, deviceId) => {
        // Optimistic update
        const { rooms } = get();
        const newRooms = rooms.map(room => {
          if (room.id !== roomId) return room;
          
          const newDevices = { ...room.devices };
          if (newDevices[deviceType]) {
            newDevices[deviceType] = newDevices[deviceType]!.map(d => 
              d.id === deviceId ? { ...d, isActive: !d.isActive } : d
            );
          }
          return { ...room, devices: newDevices };
        });
        
        set({ rooms: newRooms });

        // Call HA Service
        const device = rooms.find(r => r.id === roomId)?.devices[deviceType]?.find(d => d.id === deviceId);
        if (device) {
           const domain = device.id.split('.')[0];
           const service = !device.isActive ? 'turn_on' : 'turn_off';
           haService.callService(domain, service, { entity_id: device.id });
        }
      },

      setLightBrightness: (deviceId, brightness) => {
        // Optimistic update
        const { rooms } = get();
        const newRooms = rooms.map((room) => {
          const newDevices = { ...room.devices };
          if (newDevices['smart-light']) {
            newDevices['smart-light'] = newDevices['smart-light']!.map((d) =>
              d.id === deviceId ? { ...d, brightness } : d
            );
          }
          return { ...room, devices: newDevices };
        });
        set({ rooms: newRooms });

        // Call HA Service
        haService.callService('light', 'turn_on', {
          entity_id: deviceId,
          brightness: brightness,
        });
      },

      setLightColor: (deviceId, rgb) => {
        // Optimistic update
        const { rooms } = get();
        const newRooms = rooms.map((room) => {
          const newDevices = { ...room.devices };
          if (newDevices['smart-light']) {
            newDevices['smart-light'] = newDevices['smart-light']!.map((d) =>
              d.id === deviceId ? { ...d, rgb_color: rgb } : d
            );
          }
          return { ...room, devices: newDevices };
        });
        set({ rooms: newRooms });

        // Call HA Service
        haService.callService('light', 'turn_on', {
          entity_id: deviceId,
          rgb_color: rgb,
        });
      },

      setLightEffect: (deviceId, effect) => {
        // Optimistic update
        const { rooms } = get();
        const newRooms = rooms.map((room) => {
          const newDevices = { ...room.devices };
          if (newDevices['smart-light']) {
            newDevices['smart-light'] = newDevices['smart-light']!.map((d) =>
              d.id === deviceId ? { ...d, effect } : d
            );
          }
          return { ...room, devices: newDevices };
        });
        set({ rooms: newRooms });

        // Call HA Service
        haService.callService('light', 'turn_on', {
          entity_id: deviceId,
          effect: effect,
        });
      },
      setAcTemperature: (temp) => {
        // Optimistic update would go here if we had the deviceId in the action
        // For now just logging as the original code did, or we can update if we change the signature
        console.log('Set AC Temp:', temp);
      },
      setAcPower: (value) => {
        console.log('Set AC Power:', value);
      },
      setAcMode: (mode) => {
        console.log('Set AC Mode:', mode);
      },
      setAcFanSpeed: (speed) => {
        console.log('Set AC Fan Speed:', speed);
      },
      setAcSwing: (axis, value) => {
        console.log('Set AC Swing:', axis, value);
      },

    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        haConfig: state.haConfig,
        visibleDeviceIds: state.visibleDeviceIds,
        // We don't persist rooms/devices as they are fetched from HA
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

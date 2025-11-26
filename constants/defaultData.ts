import { Lightbulb, Wind, Tv, Monitor, Blinds, Activity } from 'lucide-react-native';

// Authentication types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Device type definitions
export type DeviceType =
  | 'smart-light'
  | 'smart-ac'
  | 'smart-tv'
  | 'air-purifier'
  | 'smart-curtain'
  | 'sensor';

// Device interface
export interface Device {
  id: string;
  name: string;
  isActive: boolean;
  // AC-specific properties (optional, only for smart-ac devices)
  acSettings?: {
    mode: 'auto' | 'cool' | 'heat' | 'dry' | 'fan';
    temperature: number;
    fanSpeed: 'auto' | 'low' | 'med' | 'high';
    swingV: boolean;
    swingH: boolean;
    online?: boolean;
    lastSeen?: string;
  };
  // Light-specific properties
  brightness?: number; // 0-255
  rgb_color?: [number, number, number];
  effect?: string;
  effect_list?: string[];
  supported_features?: number;
}

// Room interface
export interface Room {
  name: string;
  devices: {
    [key in DeviceType]?: Device[];
  };
}

// Device Icons mapping
export const deviceIcons: Record<DeviceType, typeof Lightbulb> = {
  'smart-light': Lightbulb,
  'smart-ac': Wind,
  'smart-tv': Tv,
  'air-purifier': Monitor,
  'smart-curtain': Blinds,
  'sensor': Activity,
} as const;

// Default device states
export const defaultDeviceStates = {
  isActive: true,
  brightness: 75,
  temperature: 23,
  batteryLevel: 85,
  lastSeen: '2 minutes ago',
  uptime: '2h 30m',
  signal: 'Strong',
  firmware: 'v2.1.0',
  lastUpdate: '2 days ago',
  model: 'Smart Home Pro 2024',
} as const;

// Default room data
export const defaultRoomData: Record<string, Room> = {
  'living-room': {
    name: 'Living Room',
    devices: {
      'smart-light': [
        { id: '1', name: 'Light Switch', isActive: false },
        { id: '2', name: 'AC Switch', isActive: false },
        { id: '3', name: 'Socket Switch', isActive: false },
        { id: '4', name: 'RGB Light', isActive: false },
      ],
      'smart-ac': [
        {
          id: '1',
          name: 'Main AC',
          isActive: false,
          acSettings: {
            mode: 'cool',
            temperature: 24,
            fanSpeed: 'auto',
            swingV: false,
            swingH: false,
            online: false,
            lastSeen: '',
          },
        },
      ],
      // 'smart-tv': [{ id: '1', name: 'Samsung TV', isActive: true }],
      // 'air-purifier': [{ id: '1', name: 'Dyson Purifier', isActive: true }],
    },
  },
};

// Helper function to get device title
export const getDeviceTitle = (deviceType: DeviceType): string => {
  return deviceType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

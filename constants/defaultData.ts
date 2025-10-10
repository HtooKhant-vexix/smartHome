import { Lightbulb, Wind, Tv, Monitor } from 'lucide-react-native';

// Device type definitions
export type DeviceType =
  | 'smart-light'
  | 'smart-ac'
  | 'smart-tv'
  | 'air-purifier';

// Device interface
export interface Device {
  id: string;
  name: string;
  isActive: boolean;
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
        { id: '1', name: 'Main Light', isActive: true },
        { id: '2', name: 'Lamp', isActive: false },
        { id: '3', name: 'Lamp', isActive: true },
        { id: '4', name: 'Lamp', isActive: false },
      ],
      // 'smart-ac': [{ id: '1', name: 'Main AC', isActive: true }],
      // 'smart-tv': [{ id: '1', name: 'Samsung TV', isActive: true }],
      // 'air-purifier': [{ id: '1', name: 'Dyson Purifier', isActive: true }],
    },
  },
  // bedroom: {
  //   name: 'Bedroom',
  //   devices: {
  //     'smart-light': [
  //       { id: '3', name: 'Ceiling Light', isActive: true },
  //       { id: '4', name: 'Night Lamp', isActive: false },
  //     ],
  //     'smart-ac': [{ id: '2', name: 'Wall AC', isActive: false }],
  //     'smart-tv': [{ id: '2', name: 'LG TV', isActive: false }],
  //     'air-purifier': [{ id: '2', name: 'Xiaomi Purifier', isActive: false }],
  //   },
  // },
  // kitchen: {
  //   name: 'Kitchen',
  //   devices: {
  //     'smart-light': [
  //       { id: '5', name: 'Main Light', isActive: true },
  //       // { id: '6', name: 'Under Cabinet', isActive: true },
  //     ],
  //   },
  // },
  // bathroom: {
  //   name: 'Bathroom',
  //   devices: {
  //     'smart-light': [
  //       { id: '7', name: 'Main Light', isActive: false },
  //       { id: '8', name: 'Mirror Light', isActive: true },
  //     ],
  //   },
  // },
} as const;

// Helper function to get device title
export const getDeviceTitle = (deviceType: DeviceType): string => {
  return deviceType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

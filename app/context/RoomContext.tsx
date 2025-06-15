import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  defaultRoomData,
  DeviceType,
  Device,
} from '../../constants/defaultData';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface RoomContextType {
  rooms: Room[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  removeRoom: (id: string) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  loadConfiguredDevices: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Initialize rooms with proper structure and unique icons
  const [rooms, setRooms] = useState<Room[]>(() => {
    const roomIcons: Record<string, string> = {
      'living-room': 'Sofa',
      bedroom: 'BedDouble',
      kitchen: 'Utensils',
      bathroom: 'Bath',
    };

    return Object.entries(defaultRoomData).map(([id, room]) => ({
      id,
      name: room.name,
      icon: roomIcons[id] || 'Home',
      devices: room.devices || {},
    }));
  });

  const loadConfiguredDevices = async () => {
    try {
      const devices = await AsyncStorage.getItem('configuredDevices');
      if (devices) {
        const configuredDevices: ConfiguredDevice[] = JSON.parse(devices);

        // Group devices by room
        const devicesByRoom = configuredDevices.reduce((acc, device) => {
          if (!acc[device.roomId]) {
            acc[device.roomId] = [];
          }
          acc[device.roomId].push(device);
          return acc;
        }, {} as Record<string, ConfiguredDevice[]>);

        // Update rooms with configured devices
        setRooms((prevRooms) =>
          prevRooms.map((room) => {
            const roomDevices = devicesByRoom[room.id] || [];
            const updatedDevices = { ...room.devices };

            // Add each configured device to its type array
            roomDevices.forEach((device) => {
              if (!updatedDevices[device.type]) {
                updatedDevices[device.type] = [];
              }

              // Check if device already exists
              const existingDeviceIndex = updatedDevices[
                device.type
              ]?.findIndex((d) => d.id === device.id);

              if (existingDeviceIndex === -1) {
                // Add new device
                updatedDevices[device.type]?.push({
                  id: device.id,
                  name: device.name,
                  isActive: device.status === 'active',
                });
              }
            });

            return {
              ...room,
              devices: updatedDevices,
            };
          })
        );
      }
    } catch (error) {
      console.error('Error loading configured devices:', error);
    }
  };

  // Load configured devices when the provider mounts
  useEffect(() => {
    loadConfiguredDevices();
  }, []);

  const addRoom = (room: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      id: room.name.toLowerCase().replace(/\s+/g, '-'),
      name: room.name,
      icon: room.icon,
      devices: room.devices || {},
    };
    setRooms((prev) => [...prev, newRoom]);
  };

  const removeRoom = (id: string) => {
    setRooms((prev) => prev.filter((room) => room.id !== id));
  };

  const updateRoom = (id: string, updatedRoom: Partial<Room>) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === id
          ? {
              ...room,
              ...updatedRoom,
              devices: updatedRoom.devices || room.devices || {},
            }
          : room
      )
    );
  };

  return (
    <RoomContext.Provider
      value={{ rooms, addRoom, removeRoom, updateRoom, loadConfiguredDevices }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return context;
};

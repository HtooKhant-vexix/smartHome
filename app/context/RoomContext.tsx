import React, { createContext, useContext, useState } from 'react';
import {
  defaultRoomData,
  DeviceType,
  Device,
} from '../../constants/defaultData';

export interface Room {
  id: string;
  name: string;
  icon: string;
  devices: {
    [key in DeviceType]?: Device[];
  };
}

interface RoomContextType {
  rooms: Room[];
  addRoom: (room: Omit<Room, 'id'>) => void;
  removeRoom: (id: string) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
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
    <RoomContext.Provider value={{ rooms, addRoom, removeRoom, updateRoom }}>
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

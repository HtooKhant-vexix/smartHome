import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useRooms } from '../app/context/RoomContext';
import { DeviceType } from '../constants/defaultData';

interface RoomCardProps {
  roomId: string;
  icon: React.ElementType;
}

export const RoomCard = ({ roomId, icon: Icon }: RoomCardProps) => {
  const router = useRouter();
  const { rooms } = useRooms();
  const room = rooms.find((r) => r.id === roomId);

  if (!room) {
    return null;
  }

  // Calculate total devices and active devices
  const allDevices = Object.entries(room.devices).flatMap(([type, devices]) =>
    devices.map((device) => ({
      ...device,
      type: type as DeviceType,
    }))
  );

  const activeDevices = allDevices.filter((device) => device.isActive).length;
  const totalDevices = allDevices.length;

  return (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() =>
        router.push({
          pathname: '/room/[id]',
          params: { id: roomId },
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.roomCardHeader}>
        <View style={styles.roomIconContainer}>
          <Icon size={24} color="white" />
        </View>
        <View style={styles.deviceStatusContainer}>
          <View style={styles.deviceStatus}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: activeDevices > 0 ? '#22c55e' : '#ef4444' },
              ]}
            />
            <Text style={styles.deviceStatusText}>
              {activeDevices} / {totalDevices}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.roomTitle}>{room.name}</Text>
      <Text style={styles.roomSubtitle}>
        {totalDevices} {totalDevices === 1 ? 'device' : 'devices'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  roomCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceStatusContainer: {
    // backgroundColor: '#334155',
    // borderRadius: 12,
    // padding: 6,
    alignItems: 'flex-end',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  deviceStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  roomTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  roomSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
});

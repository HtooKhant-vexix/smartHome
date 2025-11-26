
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Settings, Plus, ChevronRight } from 'lucide-react-native';
import { DeviceItem } from '../../components/DeviceItem';
import {
  deviceIcons,
  getDeviceTitle,
  DeviceType,
  Device,
} from '../../constants/defaultData';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
import AddDeviceModal from '../_components/AddDeviceModal';
import RoomSelectionModal from '../_components/RoomSelectionModal';

export default function DeviceListScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const deviceType = type as DeviceType;
  const deviceTitle = getDeviceTitle(deviceType);

  // Use Zustand store
  const rooms = useSmartHomeStore((state) => state.rooms);
  const visibleDeviceIds = useSmartHomeStore((state) => state.visibleDeviceIds);
  const toggleDevice = useSmartHomeStore((state) => state.toggleDevice);

  const [isAddDeviceModalVisible, setIsAddDeviceModalVisible] = useState(false);
  const [isRoomSelectionModalVisible, setIsRoomSelectionModalVisible] =
    useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  const handleToggleDevice = (
    roomId: string,
    deviceId: string,
    deviceIndex: number
  ) => {
    toggleDevice(roomId, deviceType, deviceId);
  };

  // Filter devices by type and visibility
  const devicesByRoom = rooms
    .map((room) => ({
      ...room,
      devices: (room.devices[deviceType] || []).filter((device) =>
        visibleDeviceIds.includes(device.id)
      ),
    }))
    .filter((room) => room.devices.length > 0);

  const DeviceIcon = deviceIcons[deviceType];

  // Calculate total devices and active devices
  const totalDevices = rooms.reduce((total, room) => {
    const devices = room.devices[deviceType] || [];
    return (
      total +
      devices.filter((device) => visibleDeviceIds.includes(device.id)).length
    );
  }, 0);

  const activeDevices = rooms.reduce((total, room) => {
    const devices = room.devices[deviceType] || [];
    return (
      total +
      devices.filter(
        (device) => device.isActive && visibleDeviceIds.includes(device.id)
      ).length
    );
  }, 0);

  const handleAddDevice = (roomId: string) => {
    setSelectedRoomId(roomId);
    setIsAddDeviceModalVisible(true);
  };

  const handleAddDevicePress = () => {
    if (rooms.length === 1) {
      // If there's only one room, select it automatically
      handleAddDevice(rooms[0].id);
    } else {
      // Show room selection modal for multiple rooms
      setIsRoomSelectionModalVisible(true);
    }
  };

  // MQTT is now handled in the Zustand store - no need for subscriptions here

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.deviceTypeTitle}>{deviceTitle}</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Device Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeDevices}</Text>
            <Text style={styles.statLabel}>Active Devices</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalDevices}</Text>
            <Text style={styles.statLabel}>Total Devices</Text>
          </View>
        </View>

        {/* Devices List by Room */}
        <View style={styles.devicesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Devices by Room</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddDevicePress}
            >
              <Plus size={20} color="#2563eb" />
              <Text style={styles.addButtonText}>Add Device</Text>
            </TouchableOpacity>
          </View>

          {devicesByRoom.map((room) => (
            <View key={room.id} style={styles.roomSection}>
              <TouchableOpacity
                style={styles.roomHeader}
                onPress={() => router.push(`/room/${room.id}`)}
              >
                <Text style={styles.roomTitle}>{room.name}</Text>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>

              {room.devices.map((device, idx) => (
                <DeviceItem
                  key={device.id}
                  title={device.name}
                  icon={DeviceIcon}
                  isActive={device.isActive}
                  onToggle={() =>
                    handleToggleDevice(room.id, device.id, idx)
                  }
                  onPress={() => {
                    router.push({
                      pathname: '/device/[type]/[id]',
                      params: {
                        type: deviceType,
                        id: device.id,
                        roomId: room.id,
                      },
                    });
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <AddDeviceModal
        visible={isAddDeviceModalVisible}
        onClose={() => {
          setIsAddDeviceModalVisible(false);
          setSelectedRoomId('');
        }}
        roomId={selectedRoomId}
      />

      <RoomSelectionModal
        visible={isRoomSelectionModalVisible}
        onClose={() => setIsRoomSelectionModalVisible(false)}
        onSelectRoom={handleAddDevice}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceTypeTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  devicesContainer: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#2563eb',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  roomSection: {
    marginBottom: 24,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#94a3b8',
    marginRight: 8,
  },
});

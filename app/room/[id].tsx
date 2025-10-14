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
import { deviceIcons, DeviceType } from '../../constants/defaultData';
import AddDeviceModal from '../_components/AddDeviceModal';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';

const DEVICE_KEYS = [
  'light_switch',
  'AC_switch',
  'socket_switch',
  'rgb_light',
] as const;

const AC_BASE_TOPIC = 'room1/ac';

export default function RoomDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const roomId = id as string;

  // Use Zustand store
  const rooms = useSmartHomeStore((state) => state.rooms);
  const toggleDeviceWithMqtt = useSmartHomeStore(
    (state) => state.toggleDeviceWithMqtt
  );
  const room = rooms.find((r) => r.id === roomId);

  const [isAddDeviceModalVisible, setIsAddDeviceModalVisible] = useState(false);

  if (!room) {
    return null;
  }

  // Get all devices in this room
  const allDevices = Object.entries(room.devices).flatMap(([type, devices]) =>
    devices.map((device) => ({
      ...device,
      type: type as DeviceType,
    }))
  );

  const activeDevices = allDevices.filter((device) => device.isActive).length;
  const totalDevices = allDevices.length;

  const toggleDevice = (
    deviceType: DeviceType,
    deviceId: string,
    deviceIndex: number
  ) => {
    toggleDeviceWithMqtt(roomId, deviceType, deviceId, deviceIndex);
  };

  const handleDevicePress = (deviceType: DeviceType, deviceId: string) => {
    router.push({
      pathname: '/device/[type]/[id]',
      params: { type: deviceType, id: deviceId },
    });
  };

  const handleDeviceTypePress = (deviceType: DeviceType) => {
    router.push({
      pathname: '/device/list',
      params: { type: deviceType },
    });
  };

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
          <Text style={styles.roomName}>{room.name}</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Room Stats */}
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

        {/* Devices List */}
        <View style={styles.devicesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Devices</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsAddDeviceModalVisible(true)}
            >
              <Plus size={20} color="#2563eb" />
              <Text style={styles.addButtonText}>Add Device</Text>
            </TouchableOpacity>
          </View>

          {Object.entries(room.devices).map(([deviceType, devices]) => (
            <View key={deviceType} style={styles.deviceTypeSection}>
              <TouchableOpacity
                style={styles.roomHeader}
                onPress={() => handleDeviceTypePress(deviceType as DeviceType)}
              >
                <Text style={styles.roomTitle}>
                  {deviceType
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </Text>
                <ChevronRight size={20} color="#94a3b8" />
              </TouchableOpacity>

              {devices.map((device, idx) => (
                <TouchableOpacity
                  key={device.id}
                  onPress={() =>
                    handleDevicePress(deviceType as DeviceType, device.id)
                  }
                >
                  <DeviceItem
                    title={device.name}
                    icon={deviceIcons[deviceType as DeviceType]}
                    isActive={device.isActive}
                    onToggle={() =>
                      toggleDevice(deviceType as DeviceType, device.id, idx)
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <AddDeviceModal
        visible={isAddDeviceModalVisible}
        onClose={() => setIsAddDeviceModalVisible(false)}
        roomId={roomId}
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
  roomName: {
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
    borderRadius: 8,
  },
  addButtonText: {
    color: '#2563eb',
    marginLeft: 4,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  deviceTypeSection: {
    marginBottom: 24,
  },
  deviceTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
  },
  deviceTypeInfo: {
    flex: 1,
  },
  deviceTypeTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roomTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#94a3b8',
  },
  deviceTypeCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
});

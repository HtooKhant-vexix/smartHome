import React from 'react';
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
  defaultRoomData,
  getDeviceTitle,
  DeviceType,
  Room,
  Device,
} from '../../constants/defaultData';

export default function DeviceListScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const deviceType = type as DeviceType;
  const deviceTitle = getDeviceTitle(deviceType);

  const [rooms, setRooms] =
    React.useState<Record<string, Room>>(defaultRoomData);

  const toggleDevice = (roomId: string, deviceId: string) => {
    setRooms((prevRooms) => {
      const newRooms = { ...prevRooms };
      const room = newRooms[roomId];
      const devices = room.devices[deviceType] || [];

      const updatedDevices = devices.map((device: Device) =>
        device.id === deviceId
          ? { ...device, isActive: !device.isActive }
          : device
      );

      room.devices[deviceType] = updatedDevices;
      return newRooms;
    });
  };

  const DeviceIcon = deviceIcons[deviceType];

  // Calculate total devices and active devices
  const totalDevices = Object.values(rooms).reduce((total, room) => {
    const devices = room.devices[deviceType] || [];
    return total + devices.length;
  }, 0);

  const activeDevices = Object.values(rooms).reduce((total, room) => {
    const devices = room.devices[deviceType] || [];
    return total + devices.filter((device: Device) => device.isActive).length;
  }, 0);

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
            <TouchableOpacity style={styles.addButton}>
              <Plus size={20} color="#2563eb" />
              <Text style={styles.addButtonText}>Add Device</Text>
            </TouchableOpacity>
          </View>

          {Object.entries(rooms).map(([roomId, room]) => {
            const devices = room.devices[deviceType] || [];
            if (devices.length === 0) return null;

            return (
              <View key={roomId} style={styles.roomSection}>
                <TouchableOpacity
                  style={styles.roomHeader}
                  onPress={() => router.push(`/room/${roomId}`)}
                >
                  <Text style={styles.roomTitle}>{room.name}</Text>
                  <ChevronRight size={20} color="#94a3b8" />
                </TouchableOpacity>

                {devices.map((device: Device) => (
                  <TouchableOpacity
                    key={device.id}
                    onPress={() =>
                      router.push({
                        pathname: '/device/[type]/[id]',
                        params: { type: deviceType, id: device.id },
                      })
                    }
                  >
                    <DeviceItem
                      title={device.name}
                      icon={DeviceIcon}
                      isActive={device.isActive}
                      onToggle={() => toggleDevice(roomId, device.id)}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>
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
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2563eb',
    marginLeft: 4,
  },
  roomSection: {
    marginBottom: 24,
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
});

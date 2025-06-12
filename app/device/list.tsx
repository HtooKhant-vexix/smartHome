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
import {
  ArrowLeft,
  Lightbulb,
  Wind,
  Tv,
  Monitor,
  Settings,
  Plus,
  ChevronRight,
} from 'lucide-react-native';
import { DeviceItem } from '../../components/DeviceItem';

const deviceIcons = {
  'smart-light': Lightbulb,
  'smart-ac': Wind,
  'smart-tv': Tv,
  'air-purifier': Monitor,
};

// Mock data for rooms and their devices
const roomData = {
  'living-room': {
    name: 'Living Room',
    devices: {
      'smart-light': [
        { id: '1', name: 'Main Light', isActive: true },
        { id: '2', name: 'Lamp', isActive: false },
      ],
      'smart-ac': [{ id: '1', name: 'Main AC', isActive: true }],
      'smart-tv': [{ id: '1', name: 'Samsung TV', isActive: true }],
      'air-purifier': [{ id: '1', name: 'Dyson Purifier', isActive: true }],
    },
  },
  bedroom: {
    name: 'Bedroom',
    devices: {
      'smart-light': [
        { id: '3', name: 'Ceiling Light', isActive: true },
        { id: '4', name: 'Night Lamp', isActive: false },
      ],
      'smart-ac': [{ id: '2', name: 'Wall AC', isActive: false }],
      'smart-tv': [{ id: '2', name: 'LG TV', isActive: false }],
      'air-purifier': [{ id: '2', name: 'Xiaomi Purifier', isActive: false }],
    },
  },
  kitchen: {
    name: 'Kitchen',
    devices: {
      'smart-light': [
        { id: '5', name: 'Main Light', isActive: true },
        { id: '6', name: 'Under Cabinet', isActive: true },
      ],
    },
  },
  bathroom: {
    name: 'Bathroom',
    devices: {
      'smart-light': [
        { id: '7', name: 'Main Light', isActive: false },
        { id: '8', name: 'Mirror Light', isActive: true },
      ],
    },
  },
};

export default function DeviceListScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();
  const deviceType = type as string;
  const deviceTitle = deviceType
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const [rooms, setRooms] = React.useState(roomData);

  const toggleDevice = (roomId: string, deviceId: string) => {
    setRooms((prevRooms) => {
      const newRooms = { ...prevRooms };
      const room = newRooms[roomId];
      const deviceType = type as keyof typeof room.devices;
      const devices = room.devices[deviceType];

      const updatedDevices = devices.map((device) =>
        device.id === deviceId
          ? { ...device, isActive: !device.isActive }
          : device
      );

      room.devices[deviceType] = updatedDevices;
      return newRooms;
    });
  };

  const DeviceIcon =
    deviceIcons[deviceType as keyof typeof deviceIcons] || Lightbulb;

  // Calculate total devices and active devices
  const totalDevices = Object.values(rooms).reduce((total, room) => {
    const devices = room.devices[deviceType as keyof typeof room.devices] || [];
    return total + devices.length;
  }, 0);

  const activeDevices = Object.values(rooms).reduce((total, room) => {
    const devices = room.devices[deviceType as keyof typeof room.devices] || [];
    return total + devices.filter((device) => device.isActive).length;
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
            const devices =
              room.devices[deviceType as keyof typeof room.devices] || [];
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

                {devices.map((device) => (
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

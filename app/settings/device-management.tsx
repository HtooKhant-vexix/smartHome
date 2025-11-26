import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Eye, Plus } from 'lucide-react-native';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
import { deviceIcons, getDeviceTitle } from '@/constants/defaultData';

export default function DeviceManagementScreen() {
  const router = useRouter();
  const { rooms, visibleDeviceIds, toggleDeviceVisibility } = useSmartHomeStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten devices into a list with room info
  const allDevices = useMemo(() => {
    const devices = [];
    rooms.forEach((room) => {
      Object.entries(room.devices).forEach(([type, typeDevices]) => {
        typeDevices.forEach((device) => {
          devices.push({
            ...device,
            type,
            roomName: room.name,
            roomId: room.id,
          });
        });
      });
    });
    return devices;
  }, [rooms]);

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return allDevices;
    const query = searchQuery.toLowerCase();
    return allDevices.filter(
      (device) =>
        device.name.toLowerCase().includes(query) ||
        device.roomName.toLowerCase().includes(query) ||
        getDeviceTitle(device.type).toLowerCase().includes(query)
    );
  }, [allDevices, searchQuery]);

  // Group by Room for display
  const devicesByRoom = useMemo(() => {
    const grouped = {};
    filteredDevices.forEach((device) => {
      if (!grouped[device.roomName]) {
        grouped[device.roomName] = [];
      }
      grouped[device.roomName].push(device);
    });
    return grouped;
  }, [filteredDevices]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Devices</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search devices or rooms..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {Object.entries(devicesByRoom).map(([roomName, devices]: [string, any[]]) => (
          <View key={roomName} style={styles.roomSection}>
            <Text style={styles.roomTitle}>{roomName}</Text>
            <View style={styles.deviceList}>
              {devices.map((device) => {
                const isVisible = visibleDeviceIds.includes(device.id);
                const Icon = deviceIcons[device.type];

                return (
                  <View key={device.id} style={styles.deviceItem}>
                    <View style={styles.deviceInfo}>
                      <View style={styles.iconContainer}>
                        {Icon && <Icon size={20} color="#fff" />}
                      </View>
                      <View>
                        <Text style={styles.deviceName}>{device.name}</Text>
                        <Text style={styles.deviceType}>
                          {getDeviceTitle(device.type)}
                        </Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={[
                        styles.visibilityButton,
                        !isVisible && styles.visibilityButtonHidden
                      ]}
                      onPress={() => toggleDeviceVisibility(device.id)}
                    >
                      {isVisible ? (
                        <Eye size={20} color="#2563eb" />
                      ) : (
                        <Plus size={20} color="#94a3b8" />
                      )}
                      <Text style={[
                        styles.visibilityText,
                        !isVisible && styles.visibilityTextHidden
                      ]}>
                        {isVisible ? 'Added' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {filteredDevices.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No devices found</Text>
          </View>
        )}
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    margin: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  content: {
    padding: 20,
    paddingTop: 0,
  },
  roomSection: {
    marginBottom: 24,
  },
  roomTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#94a3b8',
    marginBottom: 12,
    marginLeft: 4,
  },
  deviceList: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#fff',
    marginBottom: 2,
  },
  deviceType: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  visibilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  visibilityButtonHidden: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
  },
  visibilityText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#2563eb',
  },
  visibilityTextHidden: {
    color: '#94a3b8',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});

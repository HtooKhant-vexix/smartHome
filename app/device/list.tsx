import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Lightbulb, Wind, Tv, Monitor } from 'lucide-react-native';

const deviceIcons = {
  'smart-light': Lightbulb,
  'smart-ac': Wind,
  'smart-tv': Tv,
  'air-purifier': Monitor,
};

const deviceNames = {
  'smart-light': 'Smart Light',
  'smart-ac': 'Smart AC',
  'smart-tv': 'Smart TV',
  'air-purifier': 'Air Purifier',
};

// Mock data for devices
const initialDeviceData = {
  'smart-light': [
    { id: '1', name: 'Living Room Lamp', isOn: true },
    { id: '2', name: 'Kitchen Lamp', isOn: false },
    { id: '3', name: 'Bedroom Lamp', isOn: true },
  ],
  'smart-ac': [
    { id: '1', name: 'Living Room AC', isOn: true },
    { id: '2', name: 'Bedroom AC', isOn: false },
  ],
  'smart-tv': [
    { id: '1', name: 'Living Room TV', isOn: true },
    { id: '2', name: 'Bedroom TV', isOn: false },
  ],
  'air-purifier': [
    { id: '1', name: 'Living Room Purifier', isOn: true },
    { id: '2', name: 'Bedroom Purifier', isOn: false },
  ],
};

export default function DeviceListScreen() {
  const { type } = useLocalSearchParams();
  const router = useRouter();
  const Icon = deviceIcons[type as keyof typeof deviceIcons];
  const deviceName = deviceNames[type as keyof typeof deviceNames];

  const [devices, setDevices] = useState(
    initialDeviceData[type as keyof typeof initialDeviceData] || []
  );

  const toggleDevice = (deviceId: string) => {
    setDevices((prevDevices) =>
      prevDevices.map((device) =>
        device.id === deviceId ? { ...device, isOn: !device.isOn } : device
      )
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>{deviceName}</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceCard}
              onPress={() => router.push(`/device/${type}/${device.id}`)}
            >
              <View style={styles.deviceInfo}>
                <View style={styles.iconContainer}>
                  <Icon size={24} color="white" />
                </View>
                <View>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceStatus}>
                    {device.isOn ? 'On' : 'Off'}
                  </Text>
                </View>
              </View>
              <Switch
                value={device.isOn}
                onValueChange={() => toggleDevice(device.id)}
                trackColor={{ false: '#374151', true: '#2563eb' }}
                thumbColor="white"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  deviceStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 2,
  },
});

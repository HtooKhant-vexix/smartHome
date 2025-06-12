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
} from 'lucide-react-native';
import { DeviceItem } from '../../components/DeviceItem';

export default function RoomDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const roomName = (id as string)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Mock data - in a real app, this would come from your data source
  const [devices, setDevices] = React.useState({
    light1: true,
    light2: false,
    ac: true,
    tv: false,
    airPurifier: true,
  });

  const toggleDevice = (device: keyof typeof devices) => {
    setDevices((prev) => ({ ...prev, [device]: !prev[device] }));
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
          <Text style={styles.roomName}>{roomName}</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Room Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Object.values(devices).filter(Boolean).length}
            </Text>
            <Text style={styles.statLabel}>Active Devices</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{Object.keys(devices).length}</Text>
            <Text style={styles.statLabel}>Total Devices</Text>
          </View>
        </View>

        {/* Devices List */}
        <View style={styles.devicesContainer}>
          <Text style={styles.sectionTitle}>Devices</Text>
          <DeviceItem
            title="Main Light"
            icon={Lightbulb}
            isActive={devices.light1}
            onToggle={() => toggleDevice('light1')}
          />
          <DeviceItem
            title="Secondary Light"
            icon={Lightbulb}
            isActive={devices.light2}
            onToggle={() => toggleDevice('light2')}
          />
          <DeviceItem
            title="Air Conditioner"
            icon={Wind}
            isActive={devices.ac}
            onToggle={() => toggleDevice('ac')}
          />
          <DeviceItem
            title="Smart TV"
            icon={Tv}
            isActive={devices.tv}
            onToggle={() => toggleDevice('tv')}
          />
          <DeviceItem
            title="Air Purifier"
            icon={Monitor}
            isActive={devices.airPurifier}
            onToggle={() => toggleDevice('airPurifier')}
          />
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
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
});

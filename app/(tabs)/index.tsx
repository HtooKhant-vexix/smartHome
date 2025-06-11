import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Cloud,
  Lightbulb,
  Monitor,
  Tv,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Plus,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface DeviceCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isOn: boolean;
  onToggle: () => void;
  onPress?: () => void;
}

function DeviceCard({
  title,
  subtitle,
  icon,
  isOn,
  onToggle,
  onPress,
}: DeviceCardProps) {
  const router = useRouter();
  const deviceId = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <TouchableOpacity
      style={[styles.deviceCard, { opacity: isOn ? 1 : 0.7 }]}
      onPress={() => router.push(`/device/${deviceId}`)}
      activeOpacity={0.8}
    >
      <View style={styles.deviceHeader}>
        <View style={styles.deviceIcon}>{icon}</View>
        <TouchableOpacity
          style={[
            styles.toggle,
            { backgroundColor: isOn ? '#2563eb' : '#374151' },
          ]}
          onPress={onToggle}
        >
          <View
            style={[
              styles.toggleKnob,
              { transform: [{ translateX: isOn ? 16 : 2 }] },
            ]}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.deviceTitle}>{title}</Text>
      <Text style={styles.deviceSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const [devices, setDevices] = useState({
    smartLight: true,
    smartAC: false,
    smartTV: false,
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
          <View>
            <Text style={styles.greeting}>Hello, Saurabh</Text>
            <Text style={styles.subtitle}>Welcome back to your smart home</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Weather Card */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.weatherCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.weatherHeader}>
            <View>
              <Text style={styles.temperature}>20°C</Text>
              <Text style={styles.weatherCondition}>Cloudy</Text>
              <Text style={styles.weatherDate}>Tue, November 23</Text>
            </View>
            <Cloud size={60} color="white" />
          </View>

          <View style={styles.weatherStats}>
            <StatCard
              label="Indoor temp"
              value="23° C"
              icon={<Thermometer size={16} color="#2563eb" />}
            />
            <StatCard
              label="Humidity"
              value="40%"
              icon={<Droplets size={16} color="#2563eb" />}
            />
            <StatCard
              label="Air Quality"
              value="Poor"
              icon={<Gauge size={16} color="#2563eb" />}
            />
          </View>
        </LinearGradient>

        {/* Room/Devices Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, styles.toggleButtonActive]}
          >
            <Text style={styles.toggleButtonTextActive}>Room</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>Devices</Text>
          </TouchableOpacity>
        </View>

        {/* Device Grid */}
        <View style={styles.deviceGrid}>
          <DeviceCard
            title="Smart Light"
            subtitle="4 Lamps"
            icon={
              <Lightbulb
                size={24}
                color={devices.smartLight ? '#2563eb' : '#6b7280'}
              />
            }
            isOn={devices.smartLight}
            onToggle={() => toggleDevice('smartLight')}
          />
          <DeviceCard
            title="Smart AC"
            subtitle="2 Device"
            icon={
              <Wind size={24} color={devices.smartAC ? '#2563eb' : '#6b7280'} />
            }
            isOn={devices.smartAC}
            onToggle={() => toggleDevice('smartAC')}
          />
          <DeviceCard
            title="Smart TV"
            subtitle="1 Device"
            icon={
              <Tv size={24} color={devices.smartTV ? '#2563eb' : '#6b7280'} />
            }
            isOn={devices.smartTV}
            onToggle={() => toggleDevice('smartTV')}
          />
          <DeviceCard
            title="Air Purifier"
            subtitle="1 Device"
            icon={
              <Monitor
                size={24}
                color={devices.airPurifier ? '#2563eb' : '#6b7280'}
              />
            }
            isOn={devices.airPurifier}
            onToggle={() => toggleDevice('airPurifier')}
          />
        </View>

        {/* Add Device Button */}
        <TouchableOpacity style={styles.addDeviceButton}>
          <Plus size={24} color="#2563eb" />
          <Text style={styles.addDeviceText}>Add new device</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingBottom: 20,
  },
  scrollView: {
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  temperature: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  weatherCondition: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: 'white',
    opacity: 0.9,
  },
  weatherDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'white',
    opacity: 0.7,
    marginTop: 4,
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'white',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  toggleButtonTextActive: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  deviceCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggle: {
    width: 38,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    position: 'absolute',
  },
  deviceTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  deviceSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 80,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  addDeviceText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#2563eb',
    marginLeft: 8,
  },
});

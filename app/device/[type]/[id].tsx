import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Lightbulb,
  Wind,
  Tv,
  Monitor,
  Power,
  Sun,
  Moon,
  Snowflake,
  Droplets,
  Fan,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';

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

interface BaseDevice {
  id: string;
  name: string;
  isOn: boolean;
}

interface SmartLight extends BaseDevice {
  brightness: number;
}

interface SmartAC extends BaseDevice {
  temperature: number;
  mode: 'cool' | 'heat';
}

interface AirPurifier extends BaseDevice {
  mode: 'auto' | 'manual';
}

type Device = SmartLight | SmartAC | AirPurifier | BaseDevice;

const deviceData: Record<string, Device[]> = {
  'smart-light': [
    { id: '1', name: 'Living Room Lamp', isOn: true, brightness: 80 },
    { id: '2', name: 'Kitchen Lamp', isOn: false, brightness: 50 },
    { id: '3', name: 'Bedroom Lamp', isOn: true, brightness: 30 },
  ],
  'smart-ac': [
    {
      id: '1',
      name: 'Living Room AC',
      isOn: true,
      temperature: 22,
      mode: 'cool',
    },
    { id: '2', name: 'Bedroom AC', isOn: false, temperature: 24, mode: 'heat' },
  ],
  'smart-tv': [
    { id: '1', name: 'Living Room TV', isOn: true },
    { id: '2', name: 'Bedroom TV', isOn: false },
  ],
  'air-purifier': [
    { id: '1', name: 'Living Room Purifier', isOn: true, mode: 'auto' },
    { id: '2', name: 'Bedroom Purifier', isOn: false, mode: 'manual' },
  ],
};

function isSmartLight(device: Device): device is SmartLight {
  return 'brightness' in device;
}

function isSmartAC(device: Device): device is SmartAC {
  return 'temperature' in device && 'mode' in device;
}

function isAirPurifier(device: Device): device is AirPurifier {
  return 'mode' in device && !('temperature' in device);
}

export default function DeviceDetailScreen() {
  const { type, id } = useLocalSearchParams();
  const router = useRouter();
  const Icon = deviceIcons[type as keyof typeof deviceIcons];
  const deviceName = deviceNames[type as keyof typeof deviceNames];

  const devices = deviceData[type as keyof typeof deviceData] || [];
  const device = devices.find((d) => d.id === id) || devices[0];

  const [isOn, setIsOn] = useState(device.isOn);
  const [brightness, setBrightness] = useState(
    isSmartLight(device) ? device.brightness : 50
  );
  const [temperature, setTemperature] = useState(
    isSmartAC(device) ? device.temperature : 22
  );
  const [mode, setMode] = useState(
    isSmartAC(device)
      ? device.mode
      : isAirPurifier(device)
      ? device.mode
      : 'cool'
  );

  const toggleDevice = () => {
    setIsOn(!isOn);
  };

  const renderDeviceControls = () => {
    switch (type) {
      case 'smart-light':
        return (
          <View style={styles.controlSection}>
            <Text style={styles.sectionTitle}>Brightness</Text>
            <View style={styles.brightnessControl}>
              <Moon size={24} color="#94a3b8" />
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={100}
                value={brightness}
                onValueChange={setBrightness}
                minimumTrackTintColor="#2563eb"
                maximumTrackTintColor="#374151"
                thumbTintColor="#2563eb"
              />
              <Sun size={24} color="#94a3b8" />
            </View>
          </View>
        );
      case 'smart-ac':
        return (
          <View style={styles.controlSection}>
            <Text style={styles.sectionTitle}>Temperature</Text>
            <View style={styles.temperatureControl}>
              <Snowflake size={24} color="#94a3b8" />
              <Slider
                style={styles.slider}
                minimumValue={16}
                maximumValue={30}
                value={temperature}
                onValueChange={setTemperature}
                minimumTrackTintColor="#2563eb"
                maximumTrackTintColor="#374151"
                thumbTintColor="#2563eb"
              />
              <Droplets size={24} color="#94a3b8" />
            </View>
            <Text style={styles.temperatureValue}>{temperature}°C</Text>
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'cool' && styles.activeModeButton,
                ]}
                onPress={() => setMode('cool')}
              >
                <Snowflake
                  size={20}
                  color={mode === 'cool' ? 'white' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.modeText,
                    mode === 'cool' && styles.activeModeText,
                  ]}
                >
                  Cool
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'heat' && styles.activeModeButton,
                ]}
                onPress={() => setMode('heat')}
              >
                <Droplets
                  size={20}
                  color={mode === 'heat' ? 'white' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.modeText,
                    mode === 'heat' && styles.activeModeText,
                  ]}
                >
                  Heat
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'air-purifier':
        return (
          <View style={styles.controlSection}>
            <View style={styles.modeContainer}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'auto' && styles.activeModeButton,
                ]}
                onPress={() => setMode('auto')}
              >
                <Fan size={20} color={mode === 'auto' ? 'white' : '#94a3b8'} />
                <Text
                  style={[
                    styles.modeText,
                    mode === 'auto' && styles.activeModeText,
                  ]}
                >
                  Auto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  mode === 'manual' && styles.activeModeButton,
                ]}
                onPress={() => setMode('manual')}
              >
                <Fan
                  size={20}
                  color={mode === 'manual' ? 'white' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.modeText,
                    mode === 'manual' && styles.activeModeText,
                  ]}
                >
                  Manual
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{device.name}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.deviceStatus}>
          <View style={styles.iconContainer}>
            <Icon size={32} color="white" />
          </View>
          <Text style={styles.statusText}>
            {isOn ? 'Device is On' : 'Device is Off'}
          </Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, !isOn && styles.actionButtonDisabled]}
            onPress={toggleDevice}
          >
            <Power size={24} color={isOn ? 'white' : '#94a3b8'} />
            <Text
              style={[styles.actionText, !isOn && styles.actionTextDisabled]}
            >
              {isOn ? 'Turn Off' : 'Turn On'}
            </Text>
          </TouchableOpacity>
        </View>

        {isOn && renderDeviceControls()}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Device Type</Text>
              <Text style={styles.infoValue}>{deviceName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{device.name.split(' ')[0]}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={styles.infoValue}>
                {isOn ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
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
  deviceStatus: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonDisabled: {
    backgroundColor: '#1e293b',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  actionTextDisabled: {
    color: '#94a3b8',
  },
  controlSection: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  brightnessControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  temperatureControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  temperatureValue: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeModeButton: {
    backgroundColor: '#2563eb',
  },
  modeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#94a3b8',
    marginLeft: 8,
  },
  activeModeText: {
    color: 'white',
  },
  infoSection: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});

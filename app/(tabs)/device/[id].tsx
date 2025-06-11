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
  Clock,
  Sliders,
  Sun,
  Moon,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

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

export default function DeviceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isOn, setIsOn] = useState(true);
  const [brightness, setBrightness] = useState(80);
  const [temperature, setTemperature] = useState(22);
  const [mode, setMode] = useState('cool');

  const Icon = deviceIcons[id as keyof typeof deviceIcons];
  const deviceName = deviceNames[id as keyof typeof deviceNames];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
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

        {/* Device Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.iconContainer}>
              <Icon size={32} color="white" />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {isOn ? 'Device is On' : 'Device is Off'}
              </Text>
              <Text style={styles.statusSubtitle}>
                Last updated 2 minutes ago
              </Text>
            </View>
            <Switch
              value={isOn}
              onValueChange={setIsOn}
              trackColor={{ false: '#374151', true: '#2563eb' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Power size={24} color="#2563eb" />
              <Text style={styles.actionText}>Power</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Clock size={24} color="#2563eb" />
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Sliders size={24} color="#2563eb" />
              <Text style={styles.actionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Device Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Controls</Text>
          <View style={styles.controlsCard}>
            {id === 'smart-light' && (
              <>
                <View style={styles.controlItem}>
                  <Text style={styles.controlLabel}>Brightness</Text>
                  <View style={styles.sliderContainer}>
                    <Sun size={20} color="white" />
                    <View style={styles.slider}>
                      <View
                        style={[styles.sliderFill, { width: `${brightness}%` }]}
                      />
                    </View>
                    <Moon size={20} color="white" />
                  </View>
                </View>
              </>
            )}
            {id === 'smart-ac' && (
              <>
                <View style={styles.controlItem}>
                  <Text style={styles.controlLabel}>Temperature</Text>
                  <View style={styles.temperatureControl}>
                    <TouchableOpacity
                      style={styles.tempButton}
                      onPress={() => setTemperature((t) => Math.max(16, t - 1))}
                    >
                      <Text style={styles.tempButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.temperature}>{temperature}°C</Text>
                    <TouchableOpacity
                      style={styles.tempButton}
                      onPress={() => setTemperature((t) => Math.min(30, t + 1))}
                    >
                      <Text style={styles.tempButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.controlItem}>
                  <Text style={styles.controlLabel}>Mode</Text>
                  <View style={styles.modeButtons}>
                    {['cool', 'heat', 'fan', 'dry'].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[
                          styles.modeButton,
                          {
                            backgroundColor: mode === m ? '#2563eb' : '#374151',
                          },
                        ]}
                        onPress={() => setMode(m)}
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            { color: mode === m ? 'white' : '#94a3b8' },
                          ]}
                        >
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
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
  statusCard: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#1e293b',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  statusSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: (width - 60) / 3,
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'white',
    marginTop: 8,
  },
  controlsCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#1e293b',
  },
  controlItem: {
    marginBottom: 24,
  },
  controlLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 12,
    backgroundColor: '#374151',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#2563eb',
  },
  temperatureControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempButtonText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  temperature: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginHorizontal: 20,
  },
  modeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  modeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    margin: 4,
  },
  modeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});

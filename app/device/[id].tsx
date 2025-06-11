import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MoveHorizontal as MoreHorizontal, Lightbulb, Zap, Flame, Power } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface WattageButtonProps {
  wattage: string;
  isSelected: boolean;
  onPress: () => void;
}

function WattageButton({ wattage, isSelected, onPress }: WattageButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.wattageButton,
        { backgroundColor: isSelected ? '#2563eb' : '#334155' }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[
        styles.wattageText,
        { color: isSelected ? 'white' : '#94a3b8' }
      ]}>
        {wattage}
      </Text>
    </TouchableOpacity>
  );
}

interface LightControlProps {
  lightNumber: number;
  isOn: boolean;
  onToggle: () => void;
}

function LightControl({ lightNumber, isOn, onToggle }: LightControlProps) {
  return (
    <TouchableOpacity
      style={[
        styles.lightControl,
        { backgroundColor: isOn ? '#2563eb' : '#334155' }
      ]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      <Lightbulb size={20} color={isOn ? 'white' : '#94a3b8'} />
      <Text style={[
        styles.lightControlText,
        { color: isOn ? 'white' : '#94a3b8' }
      ]}>
        Light {lightNumber}
      </Text>
    </TouchableOpacity>
  );
}

export default function DeviceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [selectedWattage, setSelectedWattage] = useState('8 watt');
  const [intensity, setIntensity] = useState(60);
  const [lights, setLights] = useState({
    1: true,
    2: false,
    3: true,
    4: false,
  });

  const wattageOptions = ['8 watt', '10 watt', '16 watt', '20 watt'];

  const toggleLight = (lightNumber: number) => {
    setLights(prev => ({
      ...prev,
      [lightNumber]: !prev[lightNumber as keyof typeof prev]
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Light</Text>
        <TouchableOpacity style={styles.moreButton}>
          <MoreHorizontal size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Wattage Selection */}
      <View style={styles.wattageContainer}>
        {wattageOptions.map((wattage) => (
          <WattageButton
            key={wattage}
            wattage={wattage}
            isSelected={selectedWattage === wattage}
            onPress={() => setSelectedWattage(wattage)}
          />
        ))}
      </View>

      {/* Controller Section */}
      <View style={styles.controllerSection}>
        <Text style={styles.sectionTitle}>Controller</Text>
        
        {/* Intensity Control */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.intensityCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.intensityHeader}>
            <Text style={styles.intensityLabel}>Min.</Text>
            <Text style={styles.intensityValue}>{intensity}%</Text>
            <Text style={styles.intensityLabel}>Max.</Text>
          </View>
          
          <Text style={styles.intensityTitle}>Light Intensity</Text>
          
          {/* Circular Progress */}
          <View style={styles.circularProgress}>
            <View style={styles.progressRing}>
              <Text style={styles.progressText}>{intensity}%</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Manual Control */}
      <View style={styles.manualSection}>
        <Text style={styles.sectionTitle}>Control Manually</Text>
        <View style={styles.lightsGrid}>
          {[1, 2, 3, 4].map((lightNumber) => (
            <LightControl
              key={lightNumber}
              lightNumber={lightNumber}
              isOn={lights[lightNumber as keyof typeof lights]}
              onToggle={() => toggleLight(lightNumber)}
            />
          ))}
        </View>
      </View>

      {/* Power Consumption */}
      <View style={styles.powerSection}>
        <Text style={styles.sectionTitle}>Power Consumption</Text>
        <Text style={styles.powerSubtitle}>{selectedWattage} smartlight</Text>
        
        <View style={styles.powerStats}>
          <View style={styles.powerStat}>
            <View style={styles.powerStatIcon}>
              <Zap size={20} color="#2563eb" />
            </View>
            <View style={styles.powerStatContent}>
              <Text style={styles.powerStatValue}>5kWh</Text>
              <Text style={styles.powerStatLabel}>Today</Text>
            </View>
          </View>
          
          <View style={styles.powerStat}>
            <View style={styles.powerStatIcon}>
              <Flame size={20} color="#0ea5e9" />
            </View>
            <View style={styles.powerStatContent}>
              <Text style={styles.powerStatValue}>120kWh</Text>
              <Text style={styles.powerStatLabel}>This month</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Add Device Button */}
      <TouchableOpacity style={styles.addDeviceButton}>
        <Text style={styles.addDeviceText}>Add new device</Text>
      </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  moreButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wattageContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  wattageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  wattageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  controllerSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  intensityCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  intensityLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  intensityValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  intensityTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 24,
  },
  circularProgress: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-90deg' }],
  },
  progressText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    transform: [{ rotate: '90deg' }],
  },
  manualSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  lightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  lightControl: {
    width: (width - 52) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  lightControlText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  powerSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  powerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginBottom: 16,
  },
  powerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  powerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  powerStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  powerStatContent: {
    flex: 1,
  },
  powerStatValue: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  powerStatLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 2,
  },
  addDeviceButton: {
    backgroundColor: '#2563eb',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  addDeviceText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});
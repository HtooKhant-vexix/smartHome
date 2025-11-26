import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import {
  defaultDeviceStates,
  DeviceType,
} from '../../../constants/defaultData';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
import { DeviceHeader } from '@/components/device/DeviceHeader';
import { SmartAcControls } from '@/components/device/SmartAcControls';
import { SmartLightControls } from '@/components/device/SmartLightControls';
import { SmartCameraControls } from '@/components/device/SmartCameraControls';

export default function DeviceDetailScreen() {
  const { type, id } = useLocalSearchParams();
  const deviceType = type as DeviceType;
  const deviceId = id as string;

  // Get device details from store
  const rooms = useSmartHomeStore((state) => state.rooms);
  const currentDevice = useMemo(() => {
    return rooms
      .flatMap((room) =>
        Object.entries(room.devices).flatMap(([type, devices]) =>
          devices.map((device) => ({
            ...device,
            type: type as DeviceType,
            roomId: room.id,
          }))
        )
      )
      .find((device) => device.id === deviceId && device.type === deviceType);
  }, [rooms, deviceId, deviceType]);

  const deviceName = useMemo(() => {
    return currentDevice?.name || 'Unknown Device';
  }, [currentDevice?.name]);

  const isConnected = useSmartHomeStore((state) => state.isConnected);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <DeviceHeader
          deviceType={deviceType}
          deviceId={deviceId}
          deviceName={deviceName}
          isConnected={isConnected}
          showPowerButton={deviceType !== 'smart-camera'}
        />

        {/* Device Specific Controls */}
        {!currentDevice ? (
           <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Device not found</Text>
          </View>
        ) : deviceType === 'smart-ac' ? (
          <SmartAcControls device={currentDevice} isConnected={isConnected} />
        ) : deviceType === 'smart-light' ? (
          <SmartLightControls device={currentDevice} isConnected={isConnected} />
        ) : deviceType === 'smart-camera' ? (
          <SmartCameraControls device={currentDevice} />
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>
              Controls for {deviceType} coming soon
            </Text>
          </View>
        )}

        {/* Device Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Device Information</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Device ID</Text>
              <Text style={styles.infoValue}>{deviceId}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Model</Text>
              <Text style={styles.infoValue}>{defaultDeviceStates.model}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Firmware</Text>
              <Text style={styles.infoValue}>
                {defaultDeviceStates.firmware}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Update</Text>
              <Text style={styles.infoValue}>
                {defaultDeviceStates.lastUpdate}
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
  placeholderContainer: {
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: {
    color: '#94a3b8',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  infoList: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});

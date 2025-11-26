import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  ArrowLeft,
  Settings,
  Power,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { DeviceType, deviceIcons, defaultDeviceStates } from '@/constants/defaultData';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
import { haService } from '@/services/haService';

interface DeviceHeaderProps {
  deviceType: DeviceType;
  deviceId: string;
  deviceName: string;
  isConnected: boolean;
}

export const DeviceHeader: React.FC<DeviceHeaderProps> = ({
  deviceType,
  deviceId,
  deviceName,
  isConnected,
}) => {
  const router = useRouter();
  const DeviceIcon = deviceIcons[deviceType];

  // Get device state from store
  const rooms = useSmartHomeStore((state) => state.rooms);
  
  const currentDevice = React.useMemo(() => {
    return rooms
      .flatMap((room) => Object.entries(room.devices).flatMap(([type, devices]) => 
        devices.map(d => ({...d, type: type as DeviceType, roomId: room.id}))
      ))
      .find((d) => d.id === deviceId && d.type === deviceType);
  }, [rooms, deviceId, deviceType]);

  const isActive = currentDevice?.isActive || false;
  const acSettings = currentDevice?.acSettings;
  const acPower = acSettings?.online || false; // Note: using online as proxy for power in header if needed, or just isActive
  // Actually, for AC, isActive is usually the power state too in our store model.
  
  // Handlers
  const toggleDevice = useSmartHomeStore((state) => state.toggleDevice);
  const setAcPowerStore = useSmartHomeStore((state) => state.setAcPower);

  const setAcModeStore = useSmartHomeStore((state) => state.setAcMode);

  const handlePowerToggle = () => {
    if (!currentDevice) return;

    if (deviceType === 'smart-ac') {
        if (!isActive) {
            // Turning ON - Default to Cool
            setAcPowerStore(true);
            setAcModeStore('cool');
            haService.callService('climate', 'set_hvac_mode', { 
                entity_id: deviceId,
                hvac_mode: 'cool'
            });
        } else {
            // Turning OFF
            setAcPowerStore(false);
            haService.callService('climate', 'turn_off', { 
                entity_id: deviceId 
            });
        }
    } else {
        toggleDevice(currentDevice.roomId, deviceType, deviceId);
    }
  };

  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.deviceTitle}>{deviceName}</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Device Status */}
      <View style={styles.statusContainer}>
        <View style={styles.deviceIconContainer}>
          <DeviceIcon size={40} color="white" />
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusText}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
          <Text style={styles.lastSeen}>
            {defaultDeviceStates.lastSeen}
          </Text>
          <View style={styles.mqttStatusContainer}>
            <View
              style={[
                styles.mqttStatusIndicator,
                {
                  backgroundColor: isConnected ? '#22c55e' : '#ef4444',
                },
              ]}
            />
            <Text style={styles.mqttStatusText}>
              {isConnected ? 'Connected to Home Assistant' : 'Disconnected'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isActive && styles.toggleButtonActive,
          ]}
          onPress={handlePowerToggle}
        >
          <Power
            size={28}
            color={isActive ? 'white' : '#94a3b8'}
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
  deviceTitle: {
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
  },
  deviceIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  lastSeen: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  mqttStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  mqttStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mqttStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  toggleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
});

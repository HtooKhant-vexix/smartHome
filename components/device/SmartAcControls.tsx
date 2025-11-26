import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Thermometer,
  Sliders,
  Wind,
  Minus,
  Plus,
} from 'lucide-react-native';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
import { haService } from '@/services/haService';
import { CustomAlert } from '../CustomAlert';

interface SmartAcControlsProps {
  deviceId: string;
  isConnected: boolean;
}

export const SmartAcControls: React.FC<SmartAcControlsProps> = ({
  deviceId,
  isConnected,
}) => {
  const [alert, setAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info') => {
    setAlert({ visible: true, title, message, type });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  // Get device state from store
  const rooms = useSmartHomeStore((state) => state.rooms);
  
  const currentDevice = React.useMemo(() => {
    return rooms
      .flatMap((room) => room.devices['smart-ac'] || [])
      .find((d) => d.id === deviceId);
  }, [rooms, deviceId]);

  const acSettings = currentDevice?.acSettings;

  // Local state for UI (synced with store)
  const [acTemp, setAcTemp] = useState(acSettings?.temperature || 24);
  const [acMode, setAcMode] = useState<
    'cool' | 'heat' | 'heat_cool' | 'dry' | 'fan' | 'fan_only'
  >((acSettings?.mode === 'auto' ? 'heat_cool' : acSettings?.mode) as any || 'cool');
  const [acFanSpeed, setAcFanSpeed] = useState(acSettings?.fanSpeed || 'auto');
  const [swingUpDown, setSwingUpDown] = useState(acSettings?.swingV || false);
  const [swingLeftRight, setSwingLeftRight] = useState(acSettings?.swingH || false);

  // Sync local state with store
  useEffect(() => {
    if (acSettings) {
      setAcTemp(acSettings.temperature || 24);
      setAcMode((acSettings.mode === 'auto' ? 'heat_cool' : acSettings.mode) as any || 'cool');
      setAcFanSpeed(acSettings.fanSpeed === 'med' ? 'medium' : acSettings.fanSpeed || 'auto');
      setSwingUpDown(acSettings.swingV || false);
      setSwingLeftRight(acSettings.swingH || false);
    }
  }, [acSettings]);

  // Store actions
  const setAcTemperatureStore = useSmartHomeStore((state) => state.setAcTemperature);
  const setAcModeStore = useSmartHomeStore((state) => state.setAcMode);
  const setAcFanSpeedStore = useSmartHomeStore((state) => state.setAcFanSpeed);
  const setAcSwingStore = useSmartHomeStore((state) => state.setAcSwing);

  // Animations
  const verticalSwitchAnimation = useRef(new Animated.Value(swingUpDown ? 11 : -11)).current;
  const horizontalSwitchAnimation = useRef(new Animated.Value(swingLeftRight ? 11 : -11)).current;

  useEffect(() => {
    Animated.timing(verticalSwitchAnimation, {
      toValue: swingUpDown ? 11 : -11,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [swingUpDown]);

  useEffect(() => {
    Animated.timing(horizontalSwitchAnimation, {
      toValue: swingLeftRight ? 11 : -11,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [swingLeftRight]);

  // Handlers
  const handleAcTempChange = async (value: number) => {
    if (!isConnected) return;

    try {
      const t = Math.max(16, Math.min(30, Math.round(value)));
      setAcTemp(t);
      setAcTemperatureStore(t);
      
      haService.callService('climate', 'set_temperature', { 
        entity_id: deviceId, 
        temperature: t 
      });
    } catch (error) {
      console.error('Error setting AC temperature:', error);
      showAlert('Error', 'Failed to set temperature', 'error');
    }
  };

  const handleAcModeChange = async (mode: 'cool' | 'heat' | 'heat_cool' | 'dry' | 'fan_only') => {
    if (!isConnected) return;

    try {
      setAcMode(mode);
      setAcModeStore(mode);
      
      haService.callService('climate', 'set_hvac_mode', { 
        entity_id: deviceId, 
        hvac_mode: mode 
      });
    } catch (error) {
      console.error('Error setting AC mode:', error);
      showAlert('Error', 'Failed to set mode', 'error');
    }
  };

  const handleAcFanChange = async (speed: 'auto' | 'low' | 'medium' | 'high') => {
    if (!isConnected) return;

    try {
      setAcFanSpeed(speed);
      setAcFanSpeedStore(speed);
      
      haService.callService('climate', 'set_fan_mode', { 
        entity_id: deviceId, 
        fan_mode: speed 
      });
    } catch (error) {
      console.error('Error setting AC fan speed:', error);
      showAlert('Error', 'Failed to set fan speed', 'error');
    }
  };

  const handleSwingToggle = async (axis: 'UD' | 'LR', value: boolean) => {
    if (!isConnected) return;

    try {
      if (axis === 'UD') setSwingUpDown(value);
      if (axis === 'LR') setSwingLeftRight(value);
      setAcSwingStore(axis, value);
      
      let swingMode = 'off';
      if (axis === 'UD' && value) swingMode = 'vertical';
      if (axis === 'LR' && value) swingMode = 'horizontal';
      
      haService.callService('climate', 'set_swing_mode', { 
        entity_id: deviceId, 
        swing_mode: swingMode 
      });
    } catch (error) {
      console.error('Error setting AC swing:', error);
      showAlert('Error', 'Failed to set swing', 'error');
    }
  };

  return (
    <View style={styles.airconControlsContainer}>
      <Text style={styles.sectionTitle}>Aircon Controls</Text>
      <View style={styles.airconControlsGrid}>
        {/* Temperature Control */}
        <View style={styles.controlItem}>
          <View style={styles.controlIcon}>
            <Thermometer size={24} color="#2563eb" />
          </View>
          <View style={styles.controlInfo}>
            <Text style={styles.controlLabel}>Temperature</Text>
            <View style={styles.temperatureControl}>
              <View style={styles.temperatureDisplay}>
                <Text style={styles.temperatureValue}>{acTemp}</Text>
                <Text style={styles.temperatureUnit}>°C</Text>
              </View>
            </View>
            <View style={styles.temperatureControl1}>
              <TouchableOpacity
                style={[
                  styles.tempButton,
                  acTemp <= 16 && styles.tempButtonDisabled,
                ]}
                onPress={() => handleAcTempChange(acTemp - 1)}
                disabled={acTemp <= 16}
              >
                <Minus size={20} color={acTemp <= 16 ? '#64748b' : 'white'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tempButton,
                  acTemp >= 30 && styles.tempButtonDisabled,
                ]}
                onPress={() => handleAcTempChange(acTemp + 1)}
                disabled={acTemp >= 30}
              >
                <Plus size={20} color={acTemp >= 30 ? '#64748b' : 'white'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Mode Control */}
        <View style={styles.controlItem}>
          <View style={styles.controlIcon}>
            <Sliders size={24} color="#2563eb" />
          </View>
          <View style={styles.controlInfo}>
            <Text style={styles.controlLabel}>Mode</Text>
            <View style={styles.modeContainer}>
              {(['cool', 'heat', 'heat_cool', 'dry', 'fan_only'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => handleAcModeChange(m)}
                  style={[
                    styles.modeChip,
                    acMode === m && styles.modeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      acMode === m && styles.modeChipTextActive,
                    ]}
                  >
                    {m === 'heat_cool' ? 'AUTO' : m === 'fan_only' ? 'FAN' : m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Fan Speed Control */}
        <View style={styles.controlItem}>
          <View style={styles.controlIcon}>
            <Wind size={24} color="#2563eb" />
          </View>
          <View style={styles.controlInfo}>
            <Text style={styles.controlLabel}>Fan Speed</Text>
            <View style={styles.fanSpeedContainer}>
              {(['auto', 'low', 'medium', 'high'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleAcFanChange(s)}
                  style={[
                    styles.fanSpeedChip,
                    acFanSpeed === s && styles.fanSpeedChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.fanSpeedChipText,
                      acFanSpeed === s && styles.fanSpeedChipTextActive,
                    ]}
                  >
                    {s === 'medium' ? 'MED' : s.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Swing Control */}
        <View style={styles.controlItem}>
          <View style={styles.controlIcon}>
            <Wind size={24} color="#2563eb" />
          </View>
          <View style={styles.controlInfo}>
            <Text style={styles.controlLabel}>Swing Control</Text>
            <View style={styles.swingControls}>
              <View style={styles.swingControl}>
                <View style={styles.swingLabelContainer}>
                  <Text style={styles.swingLabel}>Vertical</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.customSwitch,
                    swingUpDown ? styles.customSwitchActive : styles.customSwitchInactive,
                  ]}
                  onPress={() => handleSwingToggle('UD', !swingUpDown)}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.customSwitchThumb,
                      swingUpDown ? styles.customSwitchThumbActive : styles.customSwitchThumbInactive,
                      { transform: [{ translateX: verticalSwitchAnimation }] },
                    ]}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.swingControl}>
                <View style={styles.swingLabelContainer}>
                  <Text style={styles.swingLabel}>Horizontal</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.customSwitch,
                    swingLeftRight ? styles.customSwitchActive : styles.customSwitchInactive,
                  ]}
                  onPress={() => handleSwingToggle('LR', !swingLeftRight)}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.customSwitchThumb,
                      swingLeftRight ? styles.customSwitchThumbActive : styles.customSwitchThumbInactive,
                      { transform: [{ translateX: horizontalSwitchAnimation }] },
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  airconControlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  airconControlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  controlItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  controlIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlInfo: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
  },
  controlLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginBottom: 4,
  },
  temperatureControl: {
    alignItems: 'center',
    marginBottom: 8,
  },
  temperatureDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  temperatureValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  temperatureUnit: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
    marginTop: 4,
    marginLeft: 2,
  },
  temperatureControl1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  tempButton: {
    flex: 1,
    height: 36,
    backgroundColor: '#334155',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tempButtonDisabled: {
    opacity: 0.5,
  },
  modeContainer: {
    gap: 8,
  },
  modeChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  modeChipActive: {
    backgroundColor: '#2563eb',
  },
  modeChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  modeChipTextActive: {
    color: 'white',
  },
  fanSpeedContainer: {
    gap: 8,
  },
  fanSpeedChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  fanSpeedChipActive: {
    backgroundColor: '#2563eb',
  },
  fanSpeedChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  fanSpeedChipTextActive: {
    color: 'white',
  },
  swingControls: {
    gap: 12,
  },
  swingControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  swingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  swingLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  customSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  customSwitchActive: {
    backgroundColor: '#2563eb',
  },
  customSwitchInactive: {
    backgroundColor: '#334155',
  },
  customSwitchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  customSwitchThumbActive: {
    backgroundColor: 'white',
  },
  customSwitchThumbInactive: {
    backgroundColor: '#94a3b8',
  },
});

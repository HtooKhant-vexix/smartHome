import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import {
  ArrowLeft,
  Settings,
  Power,
  Clock,
  Sliders,
  Battery,
  Wifi,
  Wind,
  Send,
  Sun,
  Moon,
  Timer,
  Zap,
  X,
  Plus,
  Minus,
  Save,
  Palette,
  Thermometer,
} from 'lucide-react-native';
import {
  deviceIcons,
  defaultDeviceStates,
  getDeviceTitle,
  DeviceType,
} from '../../../constants/defaultData';
import { useMqtt } from '../../../hooks/useMqtt';
import { topicHelpers } from '../../../constants/topicTable';
import { CustomAlert } from '../../../components/CustomAlert';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
// MQTT topic scheme config for switches
const MQTT_LOCATION = 'room1';
const MQTT_CONTROLLER = 'light_control';
// AC controller follows mqttApi.md base topic and cmnd/stat/tele groups
const AC_BASE_TOPIC = 'room1/ac';

interface ControlItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
}

const ControlItem = ({ icon: Icon, label, value, unit }: ControlItemProps) => {
  return (
    <View style={styles.controlItem}>
      <View style={styles.controlIcon}>
        <Icon size={20} color="#2563eb" />
      </View>
      <View style={styles.controlInfo}>
        <Text style={styles.controlLabel}>{label}</Text>
        <Text style={styles.controlValue}>
          {value}
          {unit && <Text style={styles.controlUnit}> {unit}</Text>}
        </Text>
      </View>
    </View>
  );
};

export default function DeviceDetailScreen() {
  const router = useRouter();
  const { type, id } = useLocalSearchParams();
  const deviceType = type as DeviceType;
  const deviceId = id as string;

  const deviceTitle = getDeviceTitle(deviceType);

  const [isActive, setIsActive] = useState(false);
  const [brightness, setBrightness] = useState<number>(
    defaultDeviceStates.brightness
  );
  const [temperature, setTemperature] = useState(
    defaultDeviceStates.temperature
  );
  const [batteryLevel, setBatteryLevel] = useState(
    defaultDeviceStates.batteryLevel
  );
  const {
    isConnected: mqttConnected,
    status: mqttStatus,
    publish,
    subscribe,
    connect,
    mqttService,
  } = useMqtt();
  const [mqttMessage, setMqttMessage] = useState('');
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
  const [showBrightnessModal, setShowBrightnessModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [schedule, setSchedule] = useState('Not Set');
  const [powerUsage, setPowerUsage] = useState({
    current: 2.4,
    daily: 12.5,
    monthly: 375,
  });
  // AC specific state
  const [acPower, setAcPower] = useState(false);
  const [acTemp, setAcTemp] = useState<number>(defaultDeviceStates.temperature);
  const [acMode, setAcMode] = useState<'cool' | 'heat' | 'auto' | 'dry'>(
    'cool'
  );
  const [swingUpDown, setSwingUpDown] = useState(false);
  const [swingLeftRight, setSwingLeftRight] = useState(false);
  const [acFanSpeed, setAcFanSpeed] = useState<'low' | 'med' | 'high'>('med');
  const [acOnline, setAcOnline] = useState<boolean>(false);
  const [acLastSeen, setAcLastSeen] = useState<string>('');
  const AC_STATE_STORAGE_KEY = `${AC_BASE_TOPIC}:lastState`;

  const applyAcState = (data: any) => {
    if (typeof data !== 'object' || !data) return;
    setAcLastSeen(new Date().toLocaleString());
    if (typeof data.power === 'boolean') {
      setAcPower(data.power as any);
    }
    if (typeof data.temperature === 'number') {
      setAcTemp(Math.max(16, Math.min(30, Math.round(data.temperature))));
    }
    if (typeof data.mode === 'number') {
      const modeMap: Record<number, 'auto' | 'cool' | 'heat' | 'dry'> = {
        0: 'auto',
        1: 'cool',
        2: 'heat',
        3: 'dry',
      };
      setAcMode(modeMap[data.mode] ?? 'auto');
    }
    if (typeof data.fan === 'number') {
      const fanMap: Record<number, 'low' | 'med' | 'high'> = {
        1: 'low',
        2: 'med',
        3: 'high',
      };
      setAcFanSpeed(fanMap[data.fan] ?? 'low');
    }
    if (typeof data.swing_v === 'boolean') {
      setSwingUpDown(data.swing_v as any);
    }
    if (typeof data.swing_h === 'boolean') {
      setSwingLeftRight(data.swing_h as any);
    }
  };

  useEffect(() => {
    if (deviceType !== 'smart-ac') return;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(AC_STATE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            if (typeof parsed.online === 'boolean') setAcOnline(parsed.online);
            if (typeof parsed.lastSeen === 'string')
              setAcLastSeen(parsed.lastSeen);
            if (parsed.state) applyAcState(parsed.state);
          }
        }
      } catch (_e) {}
    })();
  }, [deviceType]);
  const [customTime, setCustomTime] = useState({
    hour: '',
    minute: '',
    period: 'AM',
  });
  const [showCustomTimePicker, setShowCustomTimePicker] = useState(false);
  const colorWheelSize = 300;
  const center = colorWheelSize / 2;

  const [color, setColor] = useState({
    r: 255,
    g: 255,
    b: 255,
  });
  const [colorWheelPosition, setColorWheelPosition] = useState({
    x: center,
    y: center,
  });
  // helpers to map current detail page device to MQTT devices
  const getMqttDeviceKey = () => {
    if (deviceType === 'smart-light') {
      return 'light_switch';
    }
    if (deviceType === 'smart-ac') {
      return 'AC_switch';
    }
    return 'socket_switch';
  };
  const buildTopic = (device: string, action: 'set' | 'state') =>
    action === 'set'
      ? topicHelpers.switchSet(device as any)
      : topicHelpers.switchState(device as any);
  const acCmnd = (suffix: string) => topicHelpers.acCmnd(suffix);
  const acStat = (suffix: string) => topicHelpers.acStat(suffix);
  const publishSet = (device: string, payload: string) => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return false;
    }
    return publish(buildTopic(device, 'set'), payload);
  };

  const handleColorChange = (newColor: { r: number; g: number; b: number }) => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }
    setColor(newColor);
    publishMessage(
      'control',
      `COLOR:${newColor.r},${newColor.g},${newColor.b}`
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        updateColorFromPosition(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        updateColorFromPosition(locationX, locationY);
      },
    })
  ).current;

  const updateColorFromPosition = (x: number, y: number) => {
    // Calculate distance from center
    const dx = x - center;
    const dy = y - center;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Clamp distance to wheel radius
    const clampedDistance = Math.min(distance, center);
    const clampedX = center + (dx * clampedDistance) / distance;
    const clampedY = center + (dy * clampedDistance) / distance;

    // Calculate hue and saturation
    const angle = Math.atan2(dy, dx);
    const hue = ((angle * 180) / Math.PI + 360) % 360;
    const saturation = (clampedDistance / center) * 100;

    // Convert to RGB
    const rgb = hsvToRgb(hue, saturation, 100);
    setColor(rgb);
    handleColorChange(rgb);

    // Update handle position
    setColorWheelPosition({ x: clampedX, y: clampedY });
  };

  // HSV to RGB conversion
  const hsvToRgb = (h: number, s: number, v: number) => {
    s = s / 100;
    v = v / 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0,
      g = 0,
      b = 0;
    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else {
      r = c;
      g = 0;
      b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  useEffect(() => {
    if (!mqttConnected) {
      // Try connecting to the centralized broker
      connect();
      return;
    }
    // Subscribe to device-specific topics when connected
    if (mqttConnected) {
      const key = getMqttDeviceKey();
      subscribe(buildTopic(key, 'state'));

      // Subscribe to AC state telemetry if viewing AC details
      if (deviceType === 'smart-ac') {
        subscribe(`${AC_BASE_TOPIC}/stat/RESULT`);
        subscribe(`${AC_BASE_TOPIC}/tele/STATE`);
        subscribe(`${AC_BASE_TOPIC}/tele/LWT`);
      }

      // Subscribe to sensor data topics if needed
      if (deviceType === ('sensor' as DeviceType)) {
        subscribe('home/test/temp');
        subscribe('home/test/hum');
        subscribe('home/test/lux');
      }
    }
  }, [mqttConnected, deviceType, subscribe, connect]);

  // Attach message handler to centralized MQTT service
  useEffect(() => {
    if (!mqttService) return;
    mqttService.on('message', onMessageArrived);
    return () => {
      mqttService.off('message', onMessageArrived);
    };
  }, [mqttService]);

  // connectMQTT is now handled by the useMqtt hook

  const onMessageArrived = (topic: string, payload: string) => {
    console.log('onMessageArrived', topic, payload, '.......');
    try {
      // Handle state messages
      const lightStateTopic = buildTopic('light_switch', 'state');
      const acStateTopic = buildTopic('AC_switch', 'state');
      if (topic === lightStateTopic) {
        setIsActive(payload === 'ON' ? (true as any) : (false as any));
      } else if (topic === acStateTopic) {
        // reflect AC state if needed
      }
      // Handle AC JSON results/state
      else if (
        topic === `${AC_BASE_TOPIC}/stat/RESULT` ||
        topic === `${AC_BASE_TOPIC}/tele/STATE`
      ) {
        try {
          const data = JSON.parse(payload);
          applyAcState(data);
          const ts = new Date().toLocaleString();
          AsyncStorage.setItem(
            AC_STATE_STORAGE_KEY,
            JSON.stringify({ online: acOnline, lastSeen: ts, state: data })
          ).catch(() => undefined);
        } catch (_e) {
          // ignore non-JSON payloads
        }
      }
      // Handle AC LWT online/offline
      else if (topic === `${AC_BASE_TOPIC}/tele/LWT`) {
        const online = payload?.toLowerCase() === 'online';
        setAcOnline(online);
        const ts = new Date().toLocaleString();
        setAcLastSeen(ts);
        AsyncStorage.setItem(
          AC_STATE_STORAGE_KEY,
          JSON.stringify({ online, lastSeen: ts, state: null })
        ).catch(() => undefined);
      }
      // Handle sensor data
      else if (topic === 'home/test/temp') {
        setTemperature(parseFloat(payload) as any);
      } else if (topic === 'home/test/hum') {
        // Handle humidity if needed
      } else if (topic === 'home/test/lux') {
        // Handle light level if needed
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  };

  // onConnectionLost is now handled by the centralized MQTT service

  const publishMessage = (topic: string, message: any) => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    try {
      const success = publish(`office/${deviceType}/control`, message);
      if (!success) {
        throw new Error('Failed to publish message');
      }
    } catch (error) {
      showAlert('Error', 'Failed to publish message', 'error');
      console.error('Publish error:', error);
    }
  };

  const handlePowerToggle = (value: boolean) => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }
    setIsActive(value as any);
    publishSet('light_switch', value ? 'ON' : 'OFF');
  };

  const handleBrightnessChange = (value: number) => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }
    const newBrightness = Math.max(0, Math.min(100, value));
    setBrightness(newBrightness);
    publishMessage('control', `BRIGHTNESS:${newBrightness}`);
  };

  // AC handlers
  const handleAcPowerToggle = (value: boolean) => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }
    setAcPower(value as any);
    // Use AC cmnd POWER per mqttApi.md
    publish(acCmnd('POWER'), value ? 'ON' : 'OFF');
  };

  const handleAcTempChange = (value: number) => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }
    const t = Math.max(16, Math.min(30, Math.round(value)));
    setAcTemp(t);
    // Publish per mqttApi.md
    publish(acCmnd('TEMPERATURE'), String(t));
  };

  const handleAcModeChange = (mode: 'cool' | 'heat' | 'auto' | 'dry') => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }
    setAcMode(mode);
    const map: Record<typeof mode, string> = {
      auto: '0',
      cool: '1',
      heat: '2',
      dry: '3',
    } as const;
    publish(acCmnd('MODE'), map[mode]);
  };

  const handleSwingToggle = (axis: 'UD' | 'LR', value: boolean) => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }
    if (axis === 'UD') setSwingUpDown(value as any);
    if (axis === 'LR') setSwingLeftRight(value as any);
    publish(acCmnd(axis === 'UD' ? 'SWINGV' : 'SWINGH'), value ? 'ON' : 'OFF');
  };

  const handleAcFanChange = (speed: 'low' | 'med' | 'high') => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }
    setAcFanSpeed(speed);
    const map: Record<typeof speed, string> = { low: '1', med: '2', high: '3' };
    publish(acCmnd('FAN'), map[speed]);
  };

  const handleScheduleSet = (time: string) => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }
    setSchedule(time);
    publishMessage('control', `SCHEDULE:${time}`);
    setShowScheduleModal(false);
  };

  const handleCustomTimeSet = () => {
    const formattedHour = customTime.hour.padStart(2, '0');
    const formattedMinute = customTime.minute.padStart(2, '0');
    const timeString = `${formattedHour}:${formattedMinute} ${customTime.period}`;
    handleScheduleSet(timeString);
    setShowCustomTimePicker(false);
  };

  const handleHourChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomTime((prev) => ({
      ...prev,
      hour: numericValue,
    }));
  };

  const handleMinuteChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCustomTime((prev) => ({
      ...prev,
      minute: numericValue,
    }));
  };

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setAlert({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false }));
  };

  const renderBrightnessModal = () => (
    <Modal
      visible={showBrightnessModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowBrightnessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Brightness Control</Text>
            <TouchableOpacity
              onPress={() => setShowBrightnessModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View style={styles.brightnessControls}>
            <TouchableOpacity
              style={styles.brightnessButton}
              onPress={() => handleBrightnessChange(brightness - 10)}
            >
              <Minus size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.brightnessValue}>{brightness}%</Text>
            <TouchableOpacity
              style={styles.brightnessButton}
              onPress={() => handleBrightnessChange(brightness + 10)}
            >
              <Plus size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCustomTimePicker = () => (
    <View style={styles.customTimeContainer}>
      <View style={styles.timeInputRow}>
        <View style={styles.timeInputGroup}>
          <Text style={styles.timeInputLabel}>Hour</Text>
          <TextInput
            style={styles.timeInput}
            value={customTime.hour}
            onChangeText={handleHourChange}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="00"
            placeholderTextColor="#64748b"
          />
        </View>
        <Text style={styles.timeSeparator}>:</Text>
        <View style={styles.timeInputGroup}>
          <Text style={styles.timeInputLabel}>Minute</Text>
          <TextInput
            style={styles.timeInput}
            value={customTime.minute}
            onChangeText={handleMinuteChange}
            keyboardType="number-pad"
            maxLength={2}
            placeholder="00"
            placeholderTextColor="#64748b"
          />
        </View>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              customTime.period === 'AM' && styles.periodButtonActive,
            ]}
            onPress={() => setCustomTime((prev) => ({ ...prev, period: 'AM' }))}
          >
            <Text
              style={[
                styles.periodButtonText,
                customTime.period === 'AM' && styles.periodButtonTextActive,
              ]}
            >
              AM
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              customTime.period === 'PM' && styles.periodButtonActive,
            ]}
            onPress={() => setCustomTime((prev) => ({ ...prev, period: 'PM' }))}
          >
            <Text
              style={[
                styles.periodButtonText,
                customTime.period === 'PM' && styles.periodButtonTextActive,
              ]}
            >
              PM
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={[
          styles.saveButton,
          (!customTime.hour || !customTime.minute) && styles.saveButtonDisabled,
        ]}
        onPress={handleCustomTimeSet}
        disabled={!customTime.hour || !customTime.minute}
      >
        <View style={styles.saveButtonContent}>
          <Save size={24} color="white" />
          <Text style={styles.saveButtonText}>Set Schedule</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderScheduleModal = () => (
    <Modal
      visible={showScheduleModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowScheduleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Set Schedule</Text>
            <TouchableOpacity
              onPress={() => setShowScheduleModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View style={styles.scheduleOptions}>
            <TouchableOpacity
              style={styles.scheduleOption}
              onPress={() => handleScheduleSet('Sunset')}
            >
              <Sun size={24} color="#2563eb" />
              <Text style={styles.scheduleOptionText}>Sunset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scheduleOption}
              onPress={() => handleScheduleSet('Sunrise')}
            >
              <Sun size={24} color="#2563eb" />
              <Text style={styles.scheduleOptionText}>Sunrise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.scheduleOption}
              onPress={() => setShowCustomTimePicker(true)}
            >
              <Clock size={24} color="#2563eb" />
              <Text style={styles.scheduleOptionText}>Custom Time</Text>
            </TouchableOpacity>
          </View>
          {showCustomTimePicker && renderCustomTimePicker()}
        </View>
      </View>
    </Modal>
  );

  const renderPowerModal = () => (
    <Modal
      visible={showPowerModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowPowerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Power Usage</Text>
            <TouchableOpacity
              onPress={() => setShowPowerModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View style={styles.powerStats}>
            <View style={styles.powerStat}>
              <Text style={styles.powerStatLabel}>Current Usage</Text>
              <Text style={styles.powerStatValue}>{powerUsage.current}W</Text>
            </View>
            <View style={styles.powerStat}>
              <Text style={styles.powerStatLabel}>Daily Usage</Text>
              <Text style={styles.powerStatValue}>{powerUsage.daily}Wh</Text>
            </View>
            <View style={styles.powerStat}>
              <Text style={styles.powerStatLabel}>Monthly Usage</Text>
              <Text style={styles.powerStatValue}>{powerUsage.monthly}Wh</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderColorModal = () => (
    <Modal
      visible={showColorModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowColorModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Color Control</Text>
            <TouchableOpacity
              onPress={() => setShowColorModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <View style={styles.colorControls}>
            <View style={styles.colorWheelContainer}>
              <View style={styles.colorSliders}>
                <Text style={styles.sliderLabel}>Red</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={255}
                  value={color.r}
                  onValueChange={(value) => {
                    handleColorChange({ ...color, r: Math.round(value) });
                  }}
                  minimumTrackTintColor="#ff0000"
                  maximumTrackTintColor="#ff0000"
                />
                <Text style={styles.sliderLabel}>Green</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={255}
                  value={color.g}
                  onValueChange={(value) => {
                    handleColorChange({ ...color, g: Math.round(value) });
                  }}
                  minimumTrackTintColor="#00ff00"
                  maximumTrackTintColor="#00ff00"
                />
                <Text style={styles.sliderLabel}>Blue</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={255}
                  value={color.b}
                  onValueChange={(value) => {
                    handleColorChange({ ...color, b: Math.round(value) });
                  }}
                  minimumTrackTintColor="#0000ff"
                  maximumTrackTintColor="#0000ff"
                />
              </View>
            </View>
            <View style={styles.colorPreview}>
              <View
                style={[
                  styles.colorPreviewBox,
                  {
                    backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                  },
                ]}
              />
              <Text style={styles.colorPreviewText}>
                RGB({Math.round(color.r)}, {Math.round(color.g)},{' '}
                {Math.round(color.b)})
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const DeviceIcon = deviceIcons[deviceType];

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
          <Text style={styles.deviceTitle}>
            {deviceTitle}
            {/* {deviceId} */}
          </Text>
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
              {deviceType === 'smart-ac'
                ? acOnline
                  ? 'Online'
                  : 'Offline'
                : isActive
                ? 'Active'
                : 'Inactive'}
            </Text>
            <Text style={styles.lastSeen}>
              {deviceType === 'smart-ac' && acLastSeen
                ? `Last seen: ${acLastSeen}`
                : defaultDeviceStates.lastSeen}
            </Text>
            <View style={styles.mqttStatusContainer}>
              <View
                style={[
                  styles.mqttStatusIndicator,
                  {
                    backgroundColor:
                      deviceType === 'smart-ac'
                        ? acOnline
                          ? '#22c55e'
                          : '#ef4444'
                        : mqttStatus === 'connected'
                        ? '#22c55e'
                        : mqttStatus === 'connecting'
                        ? '#eab308'
                        : '#ef4444',
                  },
                ]}
              />
              <Text style={styles.mqttStatusText}>
                {deviceType === 'smart-ac'
                  ? acOnline
                    ? 'Device Online'
                    : 'Device Offline'
                  : mqttStatus === 'connected'
                  ? 'Connected'
                  : mqttStatus === 'connecting'
                  ? 'Connecting...'
                  : 'Disconnected'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              (deviceType === 'smart-ac' ? acPower : isActive) &&
                styles.toggleButtonActive,
            ]}
            onPress={() =>
              deviceType === 'smart-ac'
                ? handleAcPowerToggle(!acPower)
                : handlePowerToggle(!isActive)
            }
          >
            <Power
              size={28}
              color={
                (deviceType === 'smart-ac' ? acPower : isActive)
                  ? 'white'
                  : '#94a3b8'
              }
            />
          </TouchableOpacity>
        </View>

        {/* Quick Controls */}
        {deviceType === 'smart-ac' ? (
          <View style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>Aircon Controls</Text>
            <View style={styles.controlsGrid}>
              <View style={styles.controlItem}>
                <View style={styles.controlIcon}>
                  <Thermometer size={24} color="#2563eb" />
                </View>
                <View style={styles.controlInfo}>
                  <Text style={styles.controlLabel}>Temperature</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <TouchableOpacity
                      style={styles.brightnessButton}
                      onPress={() => handleAcTempChange(acTemp - 1)}
                    >
                      <Minus size={20} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.controlValue}>{acTemp}°C</Text>
                    <TouchableOpacity
                      style={styles.brightnessButton}
                      onPress={() => handleAcTempChange(acTemp + 1)}
                    >
                      <Plus size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                  {/* Slider removed to avoid duplicate temperature publishes */}
                </View>
              </View>

              <View style={styles.controlItem}>
                <View style={styles.controlIcon}>
                  <Sliders size={24} color="#2563eb" />
                </View>
                <View style={styles.controlInfo}>
                  <Text style={styles.controlLabel}>Mode</Text>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
                  >
                    {(['cool', 'heat', 'auto', 'dry'] as const).map((m) => (
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
                          {m.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.controlItem}>
                <View style={styles.controlIcon}>
                  <Wind size={24} color="#2563eb" />
                </View>
                <View style={styles.controlInfo}>
                  <Text style={styles.controlLabel}>Fan Speed</Text>
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
                  >
                    {(['low', 'med', 'high'] as const).map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => handleAcFanChange(s)}
                        style={[
                          styles.modeChip,
                          acFanSpeed === s && styles.modeChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modeChipText,
                            acFanSpeed === s && styles.modeChipTextActive,
                          ]}
                        >
                          {s.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.controlItem}>
                <View style={styles.controlIcon}>
                  <Wind size={24} color="#2563eb" />
                </View>
                <View style={styles.controlInfo}>
                  <Text style={styles.controlLabel}>Swing</Text>
                  <View style={{ gap: 8 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={styles.controlValue}>Up/Down</Text>
                      <Switch
                        value={swingUpDown}
                        onValueChange={(v) => handleSwingToggle('UD', v)}
                        trackColor={{ false: '#334155', true: '#2563eb' }}
                        thumbColor="white"
                      />
                    </View>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={styles.controlValue}>Left/Right</Text>
                      <Switch
                        value={swingLeftRight}
                        onValueChange={(v) => handleSwingToggle('LR', v)}
                        trackColor={{ false: '#334155', true: '#2563eb' }}
                        thumbColor="white"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.controlsContainer}>
            <Text style={styles.sectionTitle}>Quick Controls</Text>
            <View style={styles.controlsGrid}>
              <TouchableOpacity
                style={styles.controlItem}
                onPress={() => setShowBrightnessModal(true)}
              >
                <View style={styles.controlIcon}>
                  <Sun size={24} color="#2563eb" />
                </View>
                <View style={styles.controlInfo}>
                  <Text style={styles.controlLabel}>Brightness</Text>
                  <Text style={styles.controlValue}>
                    {brightness}
                    <Text style={styles.controlUnit}>%</Text>
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlItem}
                onPress={() => setShowColorModal(true)}
              >
                <View style={styles.controlIcon}>
                  <Palette size={24} color="#2563eb" />
                </View>
                <View style={styles.controlInfo}>
                  <Text style={styles.controlLabel}>Color</Text>
                  <View style={styles.colorIndicator}>
                    <View
                      style={[
                        styles.colorDot,
                        {
                          backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                        },
                      ]}
                    />
                    <Text style={styles.controlValue}>RGB</Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlItem}
                onPress={() => setShowScheduleModal(true)}
              >
                <View style={styles.controlIcon}>
                  <Timer size={24} color="#2563eb" />
                </View>
                <View style={styles.controlInfo}>
                  <Text style={styles.controlLabel}>Schedule</Text>
                  <Text style={styles.controlValue}>{schedule}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.controlItem}
                onPress={() => setShowPowerModal(true)}
              >
                <View style={styles.controlIcon}>
                  <Zap size={24} color="#2563eb" />
                </View>
                <View style={styles.controlInfo}>
                  <Text style={styles.controlLabel}>Power Usage</Text>
                  <Text style={styles.controlValue}>
                    {powerUsage.current}
                    <Text style={styles.controlUnit}>W</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Device Settings */}
        {/* <View style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Device Settings</Text>
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Sliders size={20} color="#94a3b8" />
                <Text style={styles.settingLabel}>Brightness</Text>
              </View>
              <Text style={styles.settingValue}>{brightness}%</Text>
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Wind size={20} color="#94a3b8" />
                <Text style={styles.settingLabel}>Temperature</Text>
              </View>
              <Text style={styles.settingValue}>{temperature}°C</Text>
            </View>
          </View>
        </View> */}

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

      {renderBrightnessModal()}
      {renderScheduleModal()}
      {renderPowerModal()}
      {renderColorModal()}
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onClose={hideAlert}
      />
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
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  controlItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
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
  controlValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  controlUnit: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  settingsList: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2563eb',
  },
  infoContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb30',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  brightnessControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  brightnessButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brightnessValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
    minWidth: 80,
    textAlign: 'center',
  },
  scheduleOptions: {
    gap: 16,
  },
  scheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  scheduleOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  powerStats: {
    gap: 16,
  },
  powerStat: {
    backgroundColor: '#334155',
    padding: 16,
    borderRadius: 12,
  },
  powerStatLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginBottom: 4,
  },
  powerStatValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  customTimeContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#334155',
    borderRadius: 12,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  timeInputGroup: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginBottom: 8,
  },
  timeInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginTop: 24,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  periodButtonActive: {
    backgroundColor: '#2563eb',
  },
  periodButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  periodButtonTextActive: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  saveButtonDisabled: {
    backgroundColor: '#334155',
    borderColor: '#334155',
    opacity: 0.7,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  colorControls: {
    alignItems: 'center',
  },
  colorWheelContainer: {
    width: '100%',
    height: 300,
    marginBottom: 20,
  },
  colorSliders: {
    padding: 16,
    gap: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'white',
    marginBottom: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  colorPreview: {
    alignItems: 'center',
    gap: 12,
  },
  colorPreviewBox: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  colorPreviewText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  mqttStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  mqttStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  mqttStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modeChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  modeChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  modeChipTextActive: {
    color: '#ffffff',
  },
});

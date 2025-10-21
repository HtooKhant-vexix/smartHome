import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  PanResponder,
  Animated,
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
  Sun,
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
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
import { topicHelpers } from '../../../constants/topicTable';
import { CustomAlert } from '../../../components/CustomAlert';
import { networkDetector, NetworkInfo } from '../../../utils/networkDetection';
// Use centralized topic helpers
const AC_BASE_TOPIC = 'room1/ac';

export default function DeviceDetailScreen() {
  const router = useRouter();
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

  const [isActive, setIsActive] = useState(currentDevice?.isActive || false);
  const [brightness, setBrightness] = useState<number>(
    defaultDeviceStates.brightness
  );

  // Sync local state with store state
  useEffect(() => {
    if (currentDevice) {
      setIsActive(currentDevice.isActive || false);
    }
  }, [currentDevice?.isActive]);

  // Also sync AC power state with store for real-time updates
  const storeDeviceActive = useSmartHomeStore((state) => {
    if (currentDevice) {
      const room = state.rooms.find((r) => r.id === currentDevice.roomId);
      const device = room?.devices[deviceType]?.find(
        (d) => d.id === currentDevice.id
      );
      return device?.isActive;
    }
    return null;
  });

  // Update local active state when store device state changes
  useEffect(() => {
    if (storeDeviceActive !== null && storeDeviceActive !== undefined) {
      setIsActive(storeDeviceActive);
      if (deviceType === 'smart-ac') {
        setAcPower(storeDeviceActive);
      }
    }
  }, [deviceType, storeDeviceActive]);

  // Load AC settings from store on mount and when device changes
  useEffect(() => {
    if (deviceType === 'smart-ac' && currentDevice?.acSettings) {
      const settings = currentDevice.acSettings;
      setAcMode(settings.mode || 'cool');
      setAcTemp(settings.temperature || 24);
      setAcFanSpeed(settings.fanSpeed || 'auto');
      setSwingUpDown(settings.swingV || false);
      setSwingLeftRight(settings.swingH || false);
      setAcOnline(settings.online || false);
      setAcLastSeen(settings.lastSeen || '');
      // Remove redundant setAcPower call - it's handled by the store sync useEffect above
    }
  }, [deviceType, currentDevice]);

  // Also sync with store AC state changes for real-time updates
  const storeAcState = useSmartHomeStore((state) => {
    if (deviceType === 'smart-ac' && currentDevice) {
      const room = state.rooms.find((r) => r.id === currentDevice.roomId);
      const acDevice = room?.devices['smart-ac']?.find(
        (d) => d.id === currentDevice.id
      );
      return acDevice?.acSettings;
    }
    return null;
  });

  // Update local state when store AC state changes
  useEffect(() => {
    if (deviceType === 'smart-ac' && storeAcState) {
      setAcMode(storeAcState.mode || 'cool');
      setAcTemp(storeAcState.temperature || 24);
      setAcFanSpeed(storeAcState.fanSpeed || 'auto');
      setSwingUpDown(
        storeAcState.swingV !== undefined ? storeAcState.swingV : false
      );
      setSwingLeftRight(
        storeAcState.swingH !== undefined ? storeAcState.swingH : false
      );
      setAcOnline(
        storeAcState.online !== undefined ? storeAcState.online : false
      );
      setAcLastSeen(storeAcState.lastSeen || '');
    }
  }, [deviceType, storeAcState]);

  const [temperature, setTemperature] = useState(
    defaultDeviceStates.temperature
  );
  const [batteryLevel, setBatteryLevel] = useState(
    defaultDeviceStates.batteryLevel
  );

  // Use Zustand store for MQTT
  const mqttConnected = useSmartHomeStore((state) => state.mqtt.isConnected);
  const mqttStatus = useSmartHomeStore((state) => state.mqtt.status);
  const currentBroker = useSmartHomeStore((state) => state.mqtt.currentBroker);
  const publishMqtt = useSmartHomeStore((state) => state.publishMqtt);
  const subscribeMqtt = useSmartHomeStore((state) => state.subscribeMqtt);
  const connectMqtt = useSmartHomeStore((state) => state.connectMqtt);
  const initializeMqtt = useSmartHomeStore((state) => state.initializeMqtt);
  const switchMqttBroker = useSmartHomeStore((state) => state.switchMqttBroker);

  // Loading state for MQTT initialization with better state management
  const [mqttInitializing, setMqttInitializing] = useState(false);
  const [lastMqttInitTime, setLastMqttInitTime] = useState(0);
  const MQTT_INIT_COOLDOWN = 5000; // 5 second cooldown between initialization attempts
  const setAcPowerStore = useSmartHomeStore((state) => state.setAcPower);
  const setAcTemperatureStore = useSmartHomeStore(
    (state) => state.setAcTemperature
  );
  const setAcModeStore = useSmartHomeStore((state) => state.setAcMode);
  const setAcFanSpeedStore = useSmartHomeStore((state) => state.setAcFanSpeed);
  const setAcSwingStore = useSmartHomeStore((state) => state.setAcSwing);
  const setDeviceBrightnessStore = useSmartHomeStore(
    (state) => state.setDeviceBrightness
  );
  const setDeviceColorStore = useSmartHomeStore(
    (state) => state.setDeviceColor
  );

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

  // Network change notification state
  const [networkChangeAlert, setNetworkChangeAlert] = useState<{
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

  // Connection loss alert with cloud switch confirmation
  const [connectionLossAlert, setConnectionLossAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  // Previous network state for comparison with debouncing
  const [previousNetworkInfo, setPreviousNetworkInfo] =
    useState<NetworkInfo | null>(null);
  const [networkChangeTimeout, setNetworkChangeTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const NETWORK_CHANGE_DEBOUNCE = 2000; // 2 second debounce for network changes

  // Process network changes with intelligent broker switching
  const processNetworkChange = async (networkInfo: NetworkInfo) => {
    // Only show notifications for significant changes
    if (!previousNetworkInfo) {
      setPreviousNetworkInfo(networkInfo);

      // Show initial network status if we're on external network with local broker
      if (
        networkInfo.isConnected &&
        !networkInfo.isLocalNetwork &&
        currentBroker === 'local'
      ) {
        setTimeout(() => {
          setConnectionLossAlert({
            visible: true,
            title: 'External Network Detected',
            message:
              "You're on an external network but connected to the local broker. Would you like to switch to the cloud broker for better connectivity?",
          });
        }, 3000); // Show after 3 seconds to let UI load
      }
      return;
    }

    const wasConnected = previousNetworkInfo.isConnected;
    const isConnected = networkInfo.isConnected;
    const wasLocal = previousNetworkInfo.isLocalNetwork;
    const isLocal = networkInfo.isLocalNetwork;

    // Connection lost notification
    if (wasConnected && !isConnected) {
      setNetworkChangeAlert({
        visible: true,
        title: 'Connection Lost',
        message:
          'Network connection has been lost. Device control may be unavailable.',
        type: 'error',
      });
    }
    // Connection restored notification
    else if (!wasConnected && isConnected) {
      setNetworkChangeAlert({
        visible: true,
        title: 'Connection Restored',
        message: `Connected to ${isLocal ? 'home' : 'external'} network.`,
        type: 'success',
      });

      // If connection restored and we're on external network but using local broker, suggest switch
      if (isLocal === false && currentBroker === 'local' && mqttConnected) {
        setTimeout(() => {
          setConnectionLossAlert({
            visible: true,
            title: 'Switch to Cloud Broker?',
            message:
              "You've moved to an external network. Would you like to switch to the cloud broker for better connectivity?",
          });
        }, 2000);
      }
    }
    // Network type changed (local <-> external) - only process if significant
    else if (wasConnected && isConnected && wasLocal !== isLocal) {
      // Only process if the change is meaningful and we're not in the middle of MQTT operations
      if (mqttStatus !== 'connecting' && mqttStatus !== 'switching') {
        setNetworkChangeAlert({
          visible: true,
          title: 'Network Changed',
          message: `Switched to ${isLocal ? 'home' : 'external'} network.`,
          type: 'info',
        });

        // Intelligent broker switching based on network type and current MQTT state
        if (
          wasLocal &&
          !isLocal &&
          currentBroker === 'local' &&
          mqttConnected
        ) {
          // Moved from local to external network - only suggest switch if MQTT is working well
          // Don't automatically switch as it might cause unnecessary reconnections
          setTimeout(() => {
            setConnectionLossAlert({
              visible: true,
              title: 'Switch to Cloud Broker?',
              message:
                "You've moved to an external network. Would you like to switch to the cloud broker for better connectivity?",
            });
          }, 3000); // Longer delay to not overwhelm user
        } else if (!wasLocal && isLocal && currentBroker === 'cloud') {
          // Moved from external to local network - could suggest switching back to local
          // But only if local broker is available and working
          console.log(
            'Moved back to local network, considering broker switch...'
          );
        }
      }
    }

    setPreviousNetworkInfo(networkInfo);
  };
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
  const [acMode, setAcMode] = useState<
    'cool' | 'heat' | 'auto' | 'dry' | 'fan'
  >('cool');
  const [swingUpDown, setSwingUpDown] = useState(false);
  const [swingLeftRight, setSwingLeftRight] = useState(false);
  const [acFanSpeed, setAcFanSpeed] = useState<'auto' | 'low' | 'med' | 'high'>(
    'auto'
  );
  const [acOnline, setAcOnline] = useState<boolean>(false);
  const [acLastSeen, setAcLastSeen] = useState<string>('');

  // Animated values for custom switches
  const verticalSwitchAnimation = useRef(
    new Animated.Value(swingUpDown ? 11 : -11)
  ).current;
  const horizontalSwitchAnimation = useRef(
    new Animated.Value(swingLeftRight ? 11 : -11)
  ).current;

  // Animate vertical switch thumb
  useEffect(() => {
    Animated.timing(verticalSwitchAnimation, {
      toValue: swingUpDown ? 11 : -11,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [swingUpDown]);

  // Animate horizontal switch thumb
  useEffect(() => {
    Animated.timing(horizontalSwitchAnimation, {
      toValue: swingLeftRight ? 11 : -11,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [swingLeftRight]);

  const applyAcState = (data: any) => {
    if (typeof data !== 'object' || !data) return;
    setAcLastSeen(new Date().toLocaleString());
    if (typeof data.power === 'boolean') {
      setAcPower(data.power as any);
      setIsActive(data.power as any); // ✅ Sync main toggle with Aircon power
    }
    if (typeof data.temperature === 'number') {
      setAcTemp(Math.max(16, Math.min(30, Math.round(data.temperature))));
    }
    if (typeof data.mode === 'number') {
      const modeMap: Record<number, 'auto' | 'cool' | 'heat' | 'dry' | 'fan'> =
        {
          0: 'auto',
          1: 'cool',
          2: 'heat',
          3: 'dry',
          4: 'fan', // ✅ Added Fan mode per MQTT API docs
        };
      setAcMode(modeMap[data.mode] ?? 'auto');
    }
    if (typeof data.fan === 'number') {
      const fanMap: Record<number, 'auto' | 'low' | 'med' | 'high'> = {
        0: 'auto',
        1: 'low',
        2: 'med',
        3: 'high',
      };
      setAcFanSpeed(fanMap[data.fan] ?? 'auto');
    }
    if (typeof data.swing_v === 'boolean') {
      setSwingUpDown(data.swing_v as any);
    }
    if (typeof data.swing_h === 'boolean') {
      setSwingLeftRight(data.swing_h as any);
    }
  };

  // ✅ Removed local AsyncStorage loading - Zustand store handles all persistence
  // AC state is automatically loaded from AsyncStorage by Zustand persist middleware

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
    // Aircon uses a completely different MQTT structure (room1/ac/cmnd/*)
    // It doesn't use the light_control topics at all
    if (deviceType === 'smart-ac') {
      return null; // Aircon doesn't use these MQTT keys
    }

    // For smart-light type, map device ID to specific MQTT key
    if (deviceType === 'smart-light') {
      const deviceIdToMqttKey: Record<string, string> = {
        '1': 'light_switch',
        '2': 'AC_switch', // Auto Current switch (NOT aircon!)
        '3': 'socket_switch',
        '4': 'rgb_light',
      };
      return (deviceIdToMqttKey[deviceId] || 'light_switch') as any;
    }

    return 'socket_switch';
  };
  const buildTopic = (device: string, action: 'set' | 'state') => {
    const currentBroker = getCurrentBroker();
    const useCloud = currentBroker === 'cloud';
    return action === 'set'
      ? topicHelpers.switchSet(device as any, useCloud)
      : topicHelpers.switchState(device as any, useCloud);
  };
  const acCmnd = (suffix: string) => {
    const currentBroker = getCurrentBroker();
    const useCloud = currentBroker === 'cloud';
    return topicHelpers.acCmnd(suffix, useCloud);
  };
  const acStat = (suffix: string) => {
    const currentBroker = getCurrentBroker();
    const useCloud = currentBroker === 'cloud';
    return topicHelpers.acStat(suffix, useCloud);
  };

  // Get current broker to determine if we should use cloud topics
  const getCurrentBroker = () => {
    return useSmartHomeStore.getState().mqtt.currentBroker;
  };
  const publishSet = (device: string, payload: string): boolean => {
    if (!mqttConnected) {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return false;
    }
    return publishMqtt(buildTopic(device, 'set'), payload);
  };

  const handleColorChange = (newColor: { r: number; g: number; b: number }) => {
    if (!mqttConnected && mqttStatus !== 'connecting') {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    if (mqttStatus === 'connecting') {
      showAlert(
        'Info',
        'MQTT is connecting. Please wait a moment and try again.',
        'info'
      );
      return;
    }

    setColor(newColor);
    setDeviceColorStore(newColor.r, newColor.g, newColor.b);
    // Don't show success alert - just update the UI silently
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

  // Initialize MQTT when component mounts
  useEffect(() => {
    const initializeMqttConnection = async () => {
      const now = Date.now();

      // Prevent multiple rapid initialization attempts
      if (mqttInitializing || now - lastMqttInitTime < MQTT_INIT_COOLDOWN) {
        console.log(
          'MQTT initialization blocked - cooling down or already initializing'
        );
        return;
      }

      setMqttInitializing(true);
      setLastMqttInitTime(now);

      try {
        console.log('Initializing MQTT in detail page...', {
          mqttStatus,
          mqttConnected,
          currentBroker,
        });

        // Initialize MQTT service (this sets up subscriptions and event listeners)
        await initializeMqtt();

        // Only attempt connection if we're not already connected/ing and not in error state
        if (
          !mqttConnected &&
          mqttStatus !== 'connecting' &&
          mqttStatus !== 'connected'
        ) {
          console.log('Connecting to MQTT in detail page...');
          await connectMqtt();
        }
      } catch (error) {
        console.error('Failed to initialize MQTT in detail page:', error);
        // Show error alert after a delay to avoid rapid fire alerts
        setTimeout(() => {
          showAlert(
            'MQTT Error',
            'Failed to connect to MQTT broker. Please check your settings.',
            'error'
          );
        }, 1000);
      } finally {
        setMqttInitializing(false);
      }
    };

    // Only initialize if MQTT is in a state that requires initialization
    // and we haven't tried recently
    if (
      (mqttStatus === 'disconnected' || mqttStatus === 'error') &&
      !mqttInitializing
    ) {
      initializeMqttConnection();
    }
  }, [mqttStatus, mqttConnected, currentBroker]); // Re-run when MQTT status changes

  // Network change monitoring and notifications
  useEffect(() => {
    let unsubscribeNetwork: (() => void) | null = null;

    const setupNetworkMonitoring = async () => {
      try {
        // Get initial network info
        const initialNetworkInfo = await networkDetector.getNetworkInfo();
        setPreviousNetworkInfo(initialNetworkInfo);

        // Set up network change listener with debouncing
        unsubscribeNetwork = networkDetector.addNetworkListener(
          (networkInfo) => {
            // Clear existing timeout
            if (networkChangeTimeout) {
              clearTimeout(networkChangeTimeout);
            }

            // Set new timeout for debounced processing
            const timeout = setTimeout(() => {
              processNetworkChange(networkInfo);
            }, NETWORK_CHANGE_DEBOUNCE);
            setNetworkChangeTimeout(timeout);
          }
        );
      } catch (error) {
        console.error('Failed to set up network monitoring:', error);
      }
    };

    setupNetworkMonitoring();

    // Cleanup function
    return () => {
      if (unsubscribeNetwork) {
        unsubscribeNetwork();
      }
      if (networkChangeTimeout) {
        clearTimeout(networkChangeTimeout);
      }
    };
  }, [previousNetworkInfo, mqttConnected, currentBroker, mqttStatus]);

  // Handle MQTT status changes
  useEffect(() => {
    console.log(
      'MQTT Status changed in detail page:',
      mqttStatus,
      'Connected:',
      mqttConnected
    );

    if (mqttStatus === 'connected' && !mqttConnected) {
      // MQTT just connected, update state
      console.log('MQTT connected in detail page');
    } else if (mqttStatus === 'disconnected' && mqttConnected) {
      // MQTT disconnected, show error
      console.log('MQTT disconnected in detail page');
      showAlert(
        'Connection Lost',
        'MQTT connection was lost. Please check your connection.',
        'error'
      );
    } else if (mqttStatus === 'error') {
      // MQTT error occurred
      console.log('MQTT error in detail page');
      showAlert(
        'Connection Error',
        'Failed to connect to MQTT broker. Please check your settings.',
        'error'
      );
    }
  }, [mqttStatus, mqttConnected]);

  // MQTT subscriptions are now handled in the Zustand store
  // The store automatically subscribes to all necessary topics on connection

  const onMessageArrived = (topic: string, payload: string) => {
    // console.log('onMessageArrived', topic, payload, '.......');
    try {
      // Handle state messages for smart-light devices only
      const deviceKey = getMqttDeviceKey();
      if (deviceKey) {
        const deviceStateTopic = buildTopic(deviceKey, 'state');
        if (topic === deviceStateTopic) {
          setIsActive(payload === 'ON' ? (true as any) : (false as any));
        }
      }

      // Handle AC JSON results/state (for Aircon device only)
      // ✅ State is now persisted in Zustand store automatically
      const currentBroker = getCurrentBroker();
      const acStatResultTopic = acStat('RESULT');
      const acTeleStateTopic = acStat('STATE');
      const acTeleLWTTTopic = acStat('LWT');

      if (
        topic === acStatResultTopic ||
        topic === acTeleStateTopic ||
        topic === `cloud/${AC_BASE_TOPIC}/stat/RESULT` ||
        topic === `cloud/${AC_BASE_TOPIC}/tele/STATE`
      ) {
        try {
          const data = JSON.parse(payload);
          applyAcState(data);
          // ✅ Removed duplicate AsyncStorage - Zustand store handles persistence
        } catch (_e) {
          // ignore non-JSON payloads
        }
      }

      // Handle AC LWT online/offline (for Aircon device only)
      // ✅ Online status is now persisted in Zustand store automatically
      if (
        topic === acTeleLWTTTopic ||
        topic === `cloud/${AC_BASE_TOPIC}/tele/LWT`
      ) {
        const online = payload?.toLowerCase() === 'online';
        setAcOnline(online);
        const ts = new Date().toLocaleString();
        setAcLastSeen(ts);
        // ✅ Removed duplicate AsyncStorage - Zustand store handles persistence
      }

      // Handle sensor data
      if (topic === 'home/test/temp') {
        setTemperature(parseFloat(payload) as any);
      }
      if (topic === 'home/test/hum') {
        // Handle humidity if needed
      }
      if (topic === 'home/test/lux') {
        // Handle light level if needed
      }

      // Handle AC sensor data (also check cloud topics)
      const acSensorTopic = acStat('SENSOR');
      if (
        topic === acSensorTopic ||
        topic === `cloud/${AC_BASE_TOPIC}/tele/SENSOR`
      ) {
        try {
          const data = JSON.parse(payload);
          if (typeof data.temperature === 'number') {
            setTemperature(data.temperature as any);
          }
        } catch (_e) {
          // ignore non-JSON payloads
        }
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
      const success = publishMqtt(`office/${deviceType}/control`, message);
      if (!success) {
        throw new Error('Failed to publish message');
      }
    } catch (error) {
      showAlert('Error', 'Failed to publish message', 'error');
      console.error('Publish error:', error);
    }
  };

  // Network alert handlers
  const handleNetworkChangeAlertClose = () => {
    setNetworkChangeAlert({
      visible: false,
      title: '',
      message: '',
      type: 'info',
    });
  };

  // Connection loss alert with cloud switch confirmation
  const handleConnectionLossAlertClose = () => {
    setConnectionLossAlert({
      visible: false,
      title: '',
      message: '',
    });
  };

  const handleSwitchToCloud = async () => {
    try {
      setConnectionLossAlert({
        visible: false,
        title: '',
        message: '',
      });

      const success = await switchMqttBroker('cloud');
      if (success) {
        showAlert(
          'Success',
          'Successfully switched to cloud broker.',
          'success'
        );
      } else {
        showAlert(
          'Error',
          'Failed to switch to cloud broker. Please try again.',
          'error'
        );
      }
    } catch (error) {
      console.error('Error switching to cloud broker:', error);
      showAlert('Error', 'Failed to switch to cloud broker.', 'error');
    }
  };

  const handleStayOnLocal = () => {
    setConnectionLossAlert({
      visible: false,
      title: '',
      message: '',
    });
  };

  const handlePowerToggle = async (value: boolean) => {
    if (!mqttConnected && mqttStatus !== 'connecting') {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    if (mqttStatus === 'connecting') {
      showAlert(
        'Info',
        'MQTT is connecting. Please wait a moment and try again.',
        'info'
      );
      return;
    }

    try {
      setIsActive(value as any);
      const deviceKey = getMqttDeviceKey();
      if (deviceKey) {
        const success = publishSet(deviceKey, value ? 'ON' : 'OFF');
        if (!success) {
          showAlert('Error', 'Failed to send command to device', 'error');
        }
        // Don't show success alert - just update the UI silently
      }
    } catch (error) {
      console.error('Error toggling device power:', error);
      showAlert('Error', 'Failed to control device', 'error');
    }
  };

  const handleBrightnessChange = (value: number) => {
    if (!mqttConnected && mqttStatus !== 'connecting') {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    if (mqttStatus === 'connecting') {
      showAlert(
        'Info',
        'MQTT is connecting. Please wait a moment and try again.',
        'info'
      );
      return;
    }

    const newBrightness = Math.max(0, Math.min(100, value));
    setBrightness(newBrightness);
    setDeviceBrightnessStore(newBrightness);
    // Don't show success alert - just update the UI silently
  };

  // AC handlers
  const handleAcPowerToggle = async (value: boolean) => {
    if (!mqttConnected && mqttStatus !== 'connecting') {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    if (mqttStatus === 'connecting') {
      showAlert(
        'Info',
        'MQTT is connecting. Please wait a moment and try again.',
        'info'
      );
      return;
    }

    try {
      setAcPower(value as any);
      setIsActive(value as any); // ✅ Sync main toggle with Aircon power
      setAcPowerStore(value);
      // Don't show success alert - just update the UI silently
    } catch (error) {
      console.error('Error controlling AC power:', error);
      showAlert('Error', 'Failed to control AC', 'error');
    }
  };

  const handleAcTempChange = async (value: number) => {
    if (!mqttConnected && mqttStatus !== 'connecting') {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    if (mqttStatus === 'connecting') {
      showAlert(
        'Info',
        'MQTT is connecting. Please wait a moment and try again.',
        'info'
      );
      return;
    }

    try {
      const t = Math.max(16, Math.min(30, Math.round(value)));
      setAcTemp(t);
      setAcTemperatureStore(t);
      // Don't show success alert - just update the UI silently
    } catch (error) {
      console.error('Error setting AC temperature:', error);
      showAlert('Error', 'Failed to set temperature', 'error');
    }
  };

  const handleAcModeChange = async (mode: 'cool' | 'heat' | 'auto' | 'dry') => {
    if (!mqttConnected && mqttStatus !== 'connecting') {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    if (mqttStatus === 'connecting') {
      showAlert(
        'Info',
        'MQTT is connecting. Please wait a moment and try again.',
        'info'
      );
      return;
    }

    try {
      setAcMode(mode);
      setAcModeStore(mode);
      // Don't show success alert - just update the UI silently
    } catch (error) {
      console.error('Error setting AC mode:', error);
      showAlert('Error', 'Failed to set mode', 'error');
    }
  };

  const handleSwingToggle = async (axis: 'UD' | 'LR', value: boolean) => {
    if (!mqttConnected && mqttStatus !== 'connecting') {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    if (mqttStatus === 'connecting') {
      showAlert(
        'Info',
        'MQTT is connecting. Please wait a moment and try again.',
        'info'
      );
      return;
    }

    try {
      if (axis === 'UD') setSwingUpDown(value as any);
      if (axis === 'LR') setSwingLeftRight(value as any);
      setAcSwingStore(axis, value);
      // Don't show success alert - just update the UI silently
    } catch (error) {
      console.error('Error setting AC swing:', error);
      showAlert('Error', 'Failed to set swing', 'error');
    }
  };

  const handleAcFanChange = async (speed: 'auto' | 'low' | 'med' | 'high') => {
    if (!mqttConnected && mqttStatus !== 'connecting') {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    if (mqttStatus === 'connecting') {
      showAlert(
        'Info',
        'MQTT is connecting. Please wait a moment and try again.',
        'info'
      );
      return;
    }

    try {
      setAcFanSpeed(speed);
      setAcFanSpeedStore(speed);
      // Don't show success alert - just update the UI silently
    } catch (error) {
      console.error('Error setting AC fan speed:', error);
      showAlert('Error', 'Failed to set fan speed', 'error');
    }
  };

  const handleScheduleSet = (time: string) => {
    if (!mqttConnected && mqttStatus !== 'connecting') {
      showAlert(
        'Error',
        'MQTT not connected. Please check your connection.',
        'error'
      );
      return;
    }

    if (mqttStatus === 'connecting') {
      showAlert(
        'Info',
        'MQTT is connecting. Please wait a moment and try again.',
        'info'
      );
      return;
    }

    setSchedule(time);
    publishMessage('control', `SCHEDULE:${time}`);
    setShowScheduleModal(false);
    // Don't show success alert - just update the UI silently
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
                  ? `Connected (${currentBroker.toUpperCase()})`
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
          <View style={styles.airconControlsContainer}>
            <Text style={styles.sectionTitle}>Aircon Controls</Text>
            <View style={styles.airconControlsGrid}>
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
                      <Minus
                        size={20}
                        color={acTemp <= 16 ? '#64748b' : 'white'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.tempButton,
                        acTemp >= 30 && styles.tempButtonDisabled,
                      ]}
                      onPress={() => handleAcTempChange(acTemp + 1)}
                      disabled={acTemp >= 30}
                    >
                      <Plus
                        size={20}
                        color={acTemp >= 30 ? '#64748b' : 'white'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.controlItem}>
                <View style={styles.controlIcon}>
                  <Sliders size={24} color="#2563eb" />
                </View>
                <View style={styles.controlInfo}>
                  <Text style={styles.controlLabel}>Mode</Text>
                  <View style={styles.modeContainer}>
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
                  <View style={styles.fanSpeedContainer}>
                    {(['auto', 'low', 'med', 'high'] as const).map((s) => (
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
                  <Text style={styles.controlLabel}>Swing Control</Text>
                  <View style={styles.swingControls}>
                    <View style={styles.swingControl}>
                      <View style={styles.swingLabelContainer}>
                        {/* <Wind size={16} color="#94a3b8" /> */}
                        <Text style={styles.swingLabel}>Vertical</Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.customSwitch,
                          swingUpDown
                            ? styles.customSwitchActive
                            : styles.customSwitchInactive,
                        ]}
                        onPress={() => handleSwingToggle('UD', !swingUpDown)}
                        activeOpacity={0.8}
                      >
                        <Animated.View
                          style={[
                            styles.customSwitchThumb,
                            swingUpDown
                              ? styles.customSwitchThumbActive
                              : styles.customSwitchThumbInactive,
                            {
                              transform: [
                                { translateX: verticalSwitchAnimation },
                              ],
                            },
                          ]}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.swingControl}>
                      <View style={styles.swingLabelContainer}>
                        {/* <Wind
                          size={16}
                          color="#94a3b8"
                          style={{ transform: [{ rotate: '90deg' }] }}
                        /> */}
                        <Text style={styles.swingLabel}>Horizontal</Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.customSwitch,
                          swingLeftRight
                            ? styles.customSwitchActive
                            : styles.customSwitchInactive,
                        ]}
                        onPress={() => handleSwingToggle('LR', !swingLeftRight)}
                        activeOpacity={0.8}
                      >
                        <Animated.View
                          style={[
                            styles.customSwitchThumb,
                            swingLeftRight
                              ? styles.customSwitchThumbActive
                              : styles.customSwitchThumbInactive,
                            {
                              transform: [
                                { translateX: horizontalSwitchAnimation },
                              ],
                            },
                          ]}
                        />
                      </TouchableOpacity>
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

      {/* Network Change Alert */}
      <CustomAlert
        visible={networkChangeAlert.visible}
        title={networkChangeAlert.title}
        message={networkChangeAlert.message}
        type={networkChangeAlert.type}
        onClose={handleNetworkChangeAlertClose}
      />

      {/* Connection Loss Alert with Cloud Switch Confirmation */}
      <Modal
        visible={connectionLossAlert.visible}
        transparent
        animationType="fade"
        onRequestClose={handleConnectionLossAlertClose}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleConnectionLossAlertClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={[styles.iconContainer, { borderColor: '#2563eb' }]}>
              <Wifi size={32} color="#2563eb" />
            </View>

            <Text style={styles.modalTitle}>{connectionLossAlert.title}</Text>
            <Text style={styles.message}>{connectionLossAlert.message}</Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#2563eb' }]}
                onPress={handleSwitchToCloud}
              >
                <Text style={styles.buttonText}>Switch to Cloud</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#334155' }]}
                onPress={handleStayOnLocal}
              >
                <Text style={styles.buttonText}>Stay on Local</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  airconControlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    // gap: 8,
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

  // Temperature control styles
  temperatureControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // gap: 10,
    marginTop: 8,
  },
  temperatureControl1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -11,
  },
  tempButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  tempButtonDisabled: {
    backgroundColor: '#1e293b',
    borderColor: '#374151',
    opacity: 0.5,
  },
  temperatureDisplay: {
    alignItems: 'center',
    minWidth: 55,
    marginTop: -8,
    // backgroundColor: 'red',
    // paddingHorizontal: 20,
  },
  temperatureValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
    lineHeight: 36,
  },
  temperatureUnit: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
    marginLeft: 24,
    marginTop: -4,
  },

  // Mode and Fan Speed control styles
  modeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  fanSpeedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  fanSpeedChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 60,
    alignItems: 'center',
  },
  fanSpeedChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  fanSpeedChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  fanSpeedChipTextActive: {
    color: '#ffffff',
  },

  // Swing control styles
  swingControls: {
    gap: 16,
    marginTop: 8,
  },
  swingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  swingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  swingLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },

  // Custom Switch Styles
  customSwitch: {
    width: 48,
    marginStart: 'auto',
    height: 28,
    borderRadius: 17,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: 8,
  },
  customSwitchActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  customSwitchInactive: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  customSwitchThumb: {
    width: 16,
    height: 16,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  customSwitchThumbActive: {
    backgroundColor: 'white',
    transform: [{ translateX: 11 }],
  },
  customSwitchThumbInactive: {
    backgroundColor: '#94a3b8',
    transform: [{ translateX: -11 }],
  },

  // Modal styles for connection loss alert
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },

  // Modal styles for connection loss alert (extending existing styles)
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },

  message: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },

  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 120,
    alignItems: 'center',
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Network and Broker Info Styles
  networkInfoContainer: {
    marginTop: 12,
    gap: 8,
  },
  networkIndicator: {
    marginBottom: 0,
  },
  brokerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  brokerLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  brokerValue: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
});

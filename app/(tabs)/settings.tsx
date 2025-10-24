import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  TextInput,
  Modal,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wifi,
  Shield,
  Bell,
  Moon,
  Smartphone,
  CircleHelp as HelpCircle,
  ChevronRight,
  User,
  Lock,
  Globe,
  Palette,
  Bluetooth,
  RefreshCw,
  X,
  Send,
  Wifi as WifiIcon,
  Router,
  Network,
  Server,
} from 'lucide-react-native';
// Safe import for bluetooth service
let bluetoothService: any;
let Device: any;

try {
  const bluetoothModule = require('../../services/bluetooth');
  bluetoothService = bluetoothModule.bluetoothService;
  const bleModule = require('react-native-ble-plx');
  Device = bleModule.Device;
} catch (error) {
  console.warn('Bluetooth service not available:', error);
  // Mock bluetooth service for Expo Go
  bluetoothService = {
    requestPermissions: () => Promise.resolve(false),
    startScan: () => Promise.resolve(),
    stopScan: () => {},
    connectToDevice: () => Promise.resolve(false),
    disconnectDevice: () => Promise.resolve(),
    disconnectAllDevices: () => Promise.resolve(),
    getConnectedDevices: () => [],
    isDeviceConnected: () => false,
    getState: () => Promise.resolve('Unknown'),
    isDeviceConnecting: () => false,
    getConnectionRetries: () => 0,
    getDiscoveredDevices: () => [],
    sendData: () => Promise.resolve(false),
    readData: () => Promise.resolve(null),
    monitorCharacteristic: () => Promise.resolve(() => {}),
  };
  Device = class MockDevice {};
}
import { CustomAlert } from '../../components/CustomAlert';
// Paho no longer needed here; use centralized mqttService
import { useRouter } from 'expo-router';
import {
  mqttService,
  MqttConfig,
  MqttConnectionStatus,
  MqttBridgeStatus,
  BrokerType,
} from '../../services/mqttService';
import {
  mqttBridgeTester,
  BridgeTestResult,
} from '../../services/mqttBridgeTest';
import { useSmartHomeStore } from '../../store/useSmartHomeStore';

const { width } = Dimensions.get('window');

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightElement,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>{icon}</View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showArrow && !rightElement && (
          <ChevronRight size={20} color="#64748b" />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

// MQTT Connection interface for UI
interface MqttConnectionUI {
  id: string;
  host: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  status: MqttConnectionStatus;
  messages: string[];
  topic: string;
  message: string;
}

// MQTT Bridge Section Component
function MQTTBridgeSection() {
  const {
    mqtt,
    switchMqttBroker,
    getCurrentMqttBroker,
    getMqttBrokerConfigs,
    testMqttBrokerConnection,
  } = useSmartHomeStore();

  const [isTestingLocal, setIsTestingLocal] = useState(false);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [testResults, setTestResults] = useState<{
    local: boolean | null;
    cloud: boolean | null;
  }>({ local: null, cloud: null });
  const [bridgeTestResults, setBridgeTestResults] =
    useState<BridgeTestResult | null>(null);
  const [isTestingBridge, setIsTestingBridge] = useState(false);

  const currentBroker = getCurrentMqttBroker();

  const testBroker = async (brokerType: BrokerType) => {
    if (brokerType === 'local') {
      setIsTestingLocal(true);
    } else {
      setIsTestingCloud(true);
    }

    try {
      const result = await testMqttBrokerConnection(brokerType);
      setTestResults((prev) => ({ ...prev, [brokerType]: result }));
    } catch (error) {
      console.error(`Error testing ${brokerType} broker:`, error);
      setTestResults((prev) => ({ ...prev, [brokerType]: false }));
    } finally {
      if (brokerType === 'local') {
        setIsTestingLocal(false);
      } else {
        setIsTestingCloud(false);
      }
    }
  };

  const handleSwitchBroker = async (brokerType: BrokerType) => {
    setIsSwitching(true);
    try {
      await switchMqttBroker(brokerType);
      setTestResults({ local: null, cloud: null }); // Reset test results
    } catch (error) {
      console.error('Error switching broker:', error);
      Alert.alert('Error', 'Failed to switch MQTT broker');
    } finally {
      setIsSwitching(false);
    }
  };

  const testBridge = async () => {
    setIsTestingBridge(true);
    try {
      const results = await mqttBridgeTester.runFullBridgeTest();
      setBridgeTestResults(results);
    } catch (error) {
      console.error('Bridge test error:', error);
      Alert.alert('Error', 'Failed to test MQTT bridge');
    } finally {
      setIsTestingBridge(false);
    }
  };

  const getStatusColor = (status: MqttBridgeStatus) => {
    switch (status) {
      case 'connected':
        return '#22c55e';
      case 'connecting':
      case 'switching':
        return '#eab308';
      default:
        return '#ef4444';
    }
  };

  const getStatusText = (status: MqttBridgeStatus) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'switching':
        return 'Switching...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <View>
      {/* Current Status */}
      <View style={styles.mqttCard}>
        <View style={styles.mqttHeader}>
          <View style={styles.mqttStatus}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(mqtt.status) },
              ]}
            />
            <Text style={styles.statusText}>
              {getStatusText(mqtt.status)} ({currentBroker.toUpperCase()})
            </Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[
                styles.headerButton,
                isSwitching && styles.scanningButton,
              ]}
              onPress={() =>
                handleSwitchBroker(
                  currentBroker === 'local' ? 'cloud' : 'local'
                )
              }
              disabled={isSwitching}
            >
              {isSwitching ? (
                <ActivityIndicator color="#2563eb" />
              ) : (
                <RefreshCw size={20} color="#2563eb" />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Broker Information */}
        {/* <View style={styles.brokerInfo}>
          <View style={styles.brokerRow}>
            <Text style={styles.brokerLabel}>Local Broker:</Text>
            <Text style={styles.brokerValue}>
              {brokerConfigs.local.host}:{brokerConfigs.local.port}
            </Text>
          </View>
          <View style={styles.brokerRow}>
            <Text style={styles.brokerLabel}>Cloud Broker:</Text>
            <Text style={styles.brokerValue}>
              {brokerConfigs.cloud.host}:{brokerConfigs.cloud.port}
            </Text>
          </View>
        </View> */}
        {/* Network Information */}
        {/* <View style={styles.networkSection}>
          <Text style={styles.sectionTitle}>Network Status</Text>
          <NetworkIndicator style={styles.networkIndicator} />
        </View> */}{' '}
        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Broker Testing</Text>

          <TouchableOpacity
            style={[
              styles.testButton,
              isTestingLocal && styles.testButtonActive,
              testResults.local === false && styles.testButtonError,
            ]}
            onPress={() => testBroker('local')}
            disabled={isTestingLocal}
          >
            {isTestingLocal ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <WifiIcon size={20} color="#ffffff" />
                <Text style={styles.testButtonText}>
                  Test Local (
                  {testResults.local === true
                    ? '✓'
                    : testResults.local === false
                    ? '✗'
                    : '?'}
                  )
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.testButton,
              styles.cloudTestButton,
              isTestingCloud && styles.testButtonActive,
              testResults.cloud === false && styles.testButtonError,
            ]}
            onPress={() => testBroker('cloud')}
            disabled={isTestingCloud}
          >
            {isTestingCloud ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Server size={20} color="#ffffff" />
                <Text style={styles.testButtonText}>
                  Test Cloud (
                  {testResults.cloud === true
                    ? '✓'
                    : testResults.cloud === false
                    ? '✗'
                    : '?'}
                  )
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.testButton,
              styles.bridgeTestButton,
              isTestingBridge && styles.testButtonActive,
            ]}
            onPress={testBridge}
            disabled={isTestingBridge}
          >
            {isTestingBridge ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Router size={20} color="#ffffff" />
                <Text style={styles.testButtonText}>Test Bridge</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Broker Testing */}

      {/* Bridge Test Results */}
      {bridgeTestResults && (
        <View style={styles.bridgeResults}>
          <Text style={styles.bridgeResultsTitle}>Bridge Test Results:</Text>
          <View style={styles.bridgeResultRow}>
            <Text style={styles.bridgeResultLabel}>Cloud → Local:</Text>
            <Text
              style={[
                styles.bridgeResultValue,
                {
                  color: bridgeTestResults?.bridgeTest?.cloudToLocal
                    ? '#22c55e'
                    : '#ef4444',
                },
              ]}
            >
              {bridgeTestResults?.bridgeTest?.cloudToLocal
                ? '✅ Working'
                : '❌ Failed'}
            </Text>
          </View>
          <View style={styles.bridgeResultRow}>
            <Text style={styles.bridgeResultLabel}>Local → Cloud:</Text>
            <Text
              style={[
                styles.bridgeResultValue,
                {
                  color: bridgeTestResults?.bridgeTest?.localToCloud
                    ? '#22c55e'
                    : '#ef4444',
                },
              ]}
            >
              {bridgeTestResults?.bridgeTest?.localToCloud
                ? '✅ Working'
                : '❌ Failed'}
            </Text>
          </View>
          {bridgeTestResults?.bridgeTest?.error && (
            <View style={styles.bridgeErrors}>
              <Text style={styles.bridgeErrorTitle}>Bridge Error:</Text>
              <Text style={styles.bridgeErrorText}>
                • {bridgeTestResults.bridgeTest.error}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Connection Info */}
      {/* <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Connection Information</Text>
        <Text style={styles.infoText}>
          • Local: {brokerConfigs.local.host}:{brokerConfigs.local.port}
        </Text>
        <Text style={styles.infoText}>
          • Cloud: {brokerConfigs.cloud.host}:{brokerConfigs.cloud.port}
        </Text>
        <Text style={styles.infoText}>
          • Auto-switching: Enabled (connects to best available broker)
        </Text>
      </View> */}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoMode, setAutoMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(
    null
  );
  const [devices, setDevices] = useState<any[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
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
  const [mqttConnected, setMqttConnected] = useState(false);
  const [mqttMessages, setMqttMessages] = useState<string[]>([]);
  const [mqttTopic, setMqttTopic] = useState('detpos/topic');
  const [mqttMessage, setMqttMessage] = useState('');
  const [mqttStatus, setMqttStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [wifiConfig, setWifiConfig] = useState({
    ssid: '',
    password: '',
    port: '1883',
  });
  const [isSending, setIsSending] = useState(false);
  const [isBluetoothReady, setIsBluetoothReady] = useState(false);
  const [wifiNetworks, setWifiNetworks] = useState<
    { ssid: string; rssi: number }[]
  >([]);
  const [isWifiScanning, setIsWifiScanning] = useState(false);
  const [showWifiScan, setShowWifiScan] = useState(false);
  const [networkDevices, setNetworkDevices] = useState<
    {
      ip: string;
      mac: string;
      hostname: string;
      vendor: string;
    }[]
  >([]);
  const [isScanningNetwork, setIsScanningNetwork] = useState(false);
  const [tcpStatus, setTcpStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [tcpConnected, setTcpConnected] = useState(false);
  const [tcpHost, setTcpHost] = useState('127.0.0.1');
  const [tcpPort, setTcpPort] = useState('1883');
  const [tcpTopic, setTcpTopic] = useState('office/ac/control');
  const [tcpMessage, setTcpMessage] = useState('');
  const [tcpMessages, setTcpMessages] = useState<string[]>([]);
  const tcpClient = useRef<any>(null);

  // Device Control States
  const [deviceStates, setDeviceStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [deviceTopics, setDeviceTopics] = useState<{ [key: string]: string }>(
    {}
  );
  const [selectedDeviceForControl, setSelectedDeviceForControl] = useState<
    string | null
  >(null);

  const [mqttConnections, setMqttConnections] = useState<MqttConnectionUI[]>(
    []
  );
  const [selectedMqttConnection, setSelectedMqttConnection] = useState<
    string | null
  >(null);
  const [mqttConfig, setMqttConfig] = useState<MqttConfig>(
    mqttService.getConfig()
  );

  // Device Control Functions
  const toggleDeviceState = async (deviceId: string) => {
    try {
      const newState = !deviceStates[deviceId];
      setDeviceStates((prev) => ({
        ...prev,
        [deviceId]: newState,
      }));

      // Prepare control message
      const controlMessage = {
        deviceId,
        state: newState ? 'ON' : 'OFF',
        type: 'control',
      };

      // Send via centralized MQTT service if connected
      if (mqttService.isConnected()) {
        const topic = deviceTopics[deviceId] || `devices/${deviceId}/control`;
        const success = mqttService.publishJson(topic, controlMessage);

        if (success) {
          setMqttMessages((prev) => [
            ...prev,
            `[${topic}] Sent: ${JSON.stringify(controlMessage)}`,
          ]);
        }
      }

      showAlert(
        'Success',
        `Device ${newState ? 'turned ON' : 'turned OFF'}`,
        'success'
      );
    } catch (error) {
      console.error('Error toggling device state:', error);
      showAlert('Error', 'Failed to toggle device state', 'error');
    }
  };

  const addDeviceControl = (deviceId: string, topic: string) => {
    setDeviceStates((prev) => ({
      ...prev,
      [deviceId]: false,
    }));
    setDeviceTopics((prev) => ({
      ...prev,
      [deviceId]: topic,
    }));
  };

  const removeDeviceControl = (deviceId: string) => {
    setDeviceStates((prev) => {
      const newStates = { ...prev };
      delete newStates[deviceId];
      return newStates;
    });
    setDeviceTopics((prev) => {
      const newTopics = { ...prev };
      delete newTopics[deviceId];
      return newTopics;
    });
  };

  useEffect(() => {
    const initializeBluetooth = async () => {
      try {
        const hasPermissions = await bluetoothService.requestPermissions();
        setIsBluetoothReady(hasPermissions);
        if (hasPermissions) {
          setConnectedDevices(bluetoothService.getConnectedDevices());
        }
      } catch (error) {
        console.error('Error initializing Bluetooth:', error);
        showAlert('Error', 'Failed to initialize Bluetooth', 'error');
      }
    };

    // initializeBluetooth();

    return () => {
      bluetoothService.stopScan();
    };
  }, []);

  const startScan = async () => {
    if (!isBluetoothReady) {
      showAlert('Error', 'Bluetooth is not ready', 'error');
      return;
    }

    try {
      setIsScanning(true);
      setDevices([]);
      await bluetoothService.startScan();
      // Update devices list every second while scanning
      const interval = setInterval(() => {
        setDevices(bluetoothService.getDiscoveredDevices());
      }, 1000);
      // Clear interval after 10 seconds
      setTimeout(() => {
        clearInterval(interval);
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      console.error('Error starting scan:', error);
      setIsScanning(false);
      showAlert('Error', 'Failed to start scanning', 'error');
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear all connection states
      setConnectingDeviceId(null);

      // Check and reinitialize Bluetooth if needed
      if (!isBluetoothReady) {
        const hasPermissions = await bluetoothService.requestPermissions();
        setIsBluetoothReady(hasPermissions);
        if (!hasPermissions) {
          showAlert('Error', 'Bluetooth permissions not granted', 'error');
          return;
        }
      }

      // Refresh the device list
      // await startScan();
      // Update connected devices list
      setConnectedDevices(bluetoothService.getConnectedDevices());
    } catch (error) {
      console.error('Error refreshing:', error);
      showAlert('Error', 'Failed to refresh devices', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [isBluetoothReady]);

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

  const connectToDevice = async (device: any) => {
    try {
      setConnectingDeviceId(device.id);
      const connected = await bluetoothService.connectToDevice(device.id);
      if (connected) {
        setConnectedDevices(bluetoothService.getConnectedDevices());
        showAlert('Success', 'Device connected successfully', 'success');
      } else {
        showAlert('Error', 'Failed to connect to device', 'error');
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      showAlert('Error', 'Failed to connect to device', 'error');
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    try {
      setConnectingDeviceId(deviceId);
      await bluetoothService.disconnectDevice(deviceId);
      setConnectedDevices((prev) =>
        prev.filter((device) => device.id !== deviceId)
      );
      showAlert('Success', 'Device disconnected successfully', 'success');
    } catch (error) {
      console.error('Error disconnecting device:', error);
      showAlert('Error', 'Failed to disconnect device', 'error');
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const disconnectAllDevices = async () => {
    try {
      setConnectingDeviceId('all');
      await bluetoothService.disconnectAllDevices();
      setConnectedDevices([]);
      showAlert('Success', 'All devices disconnected successfully', 'success');
    } catch (error) {
      console.error('Error disconnecting all devices:', error);
      showAlert('Error', 'Failed to disconnect all devices', 'error');
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const connectMQTT = async () => {
    try {
      setMqttStatus('connecting');
      await mqttService.connect();
      // default test subscription
      mqttService.subscribe('detpos/#');
      setMqttStatus('connected');
      setMqttConnected(true);
      showAlert('Success', 'MQTT Connected successfully', 'success');
      // Hook one-time message logger for settings page
      const handler = (topic: string, payload: string) => {
        try {
          const json = JSON.parse(payload);
          setMqttMessages((prev) => [
            ...prev,
            `[${topic}] Received: ${JSON.stringify(json)}`,
          ]);
        } catch {
          setMqttMessages((prev) => [
            ...prev,
            `[${topic}] Received: ${payload}`,
          ]);
        }
      };
      // Note: rely on centralized listeners; duplicate registrations are fine in this scope
      mqttService.on('message', handler as any);
    } catch (err) {
      setMqttStatus('disconnected');
      setMqttConnected(false);
      showAlert('Error', 'Failed to connect to MQTT broker', 'error');
      console.error('MQTT Connection failed:', err);
    }
  };

  const disconnectMQTT = () => {
    mqttService.disconnect();
    setMqttStatus('disconnected');
    setMqttConnected(false);
    showAlert('Success', 'MQTT Disconnected successfully', 'success');
  };

  // Connection lost handled by centralized mqttService

  const publishMessage = () => {
    if (!mqttConnected) {
      showAlert('Error', 'MQTT not connected', 'error');
      return;
    }

    try {
      // Store current message and topic for logging
      const currentMessage = mqttMessage;
      const currentTopic = mqttTopic;

      // Immediately update UI to show message as sending
      setMqttMessages((prev) => [
        ...prev,
        `[${currentTopic}] Sending: ${currentMessage}`,
      ]);
      setMqttMessage(''); // Clear the message input immediately

      // Send via centralized service
      mqttService.publish(currentTopic, currentMessage);

      // Add success message after sending
      setMqttMessages((prev) => [
        ...prev,
        `[${currentTopic}] Sent successfully`,
      ]);
    } catch (error) {
      showAlert('Error', 'Failed to publish message', 'error');
      console.error('Publish error:', error);
      // Add error message to the log
      setMqttMessages((prev) => [
        ...prev,
        `[${mqttTopic}] Error: Failed to publish message`,
      ]);
    }
  };

  const handleDevicePress = (device: any) => {
    console.log('Device pressed:', device.id);
    setSelectedDevice(device);
    setIsModalVisible(true);
  };

  const sendWifiConfig = async () => {
    if (!selectedDevice) {
      showAlert('Error', 'No device selected', 'error');
      return;
    }

    try {
      setIsSending(true);

      // Format the WiFi configuration data
      const wifiConfigData = {
        wifiConfig: {
          ssid: wifiConfig.ssid,
          password: wifiConfig.password,
          port: parseInt(wifiConfig.port),
        },
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(wifiConfigData);

      // Send the data
      const success = await bluetoothService.sendData(
        selectedDevice.id,
        jsonData
      );

      if (success) {
        showAlert('Success', 'WiFi configuration sent successfully', 'success');
        setIsModalVisible(false);
      } else {
        showAlert('Error', 'Failed to send WiFi configuration', 'error');
      }
    } catch (error) {
      console.error('Error sending WiFi config:', error);
      showAlert('Error', 'Failed to send WiFi configuration', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const startWifiScan = async () => {
    try {
      setIsWifiScanning(true);
      // Simulate WiFi scanning with mock data
      setTimeout(() => {
        const mockNetworks = [
          { ssid: 'Home WiFi', rssi: -45 },
          { ssid: 'Neighbor WiFi', rssi: -65 },
          { ssid: 'Guest Network', rssi: -55 },
          { ssid: 'Office WiFi', rssi: -70 },
        ];
        setWifiNetworks(mockNetworks);
        setIsWifiScanning(false);
      }, 2000);
    } catch (error) {
      console.error('Error scanning WiFi:', error);
      showAlert('Error', 'Failed to scan WiFi networks', 'error');
      setIsWifiScanning(false);
    }
  };

  const getWifiSignalStrength = (rssi: number) => {
    if (rssi >= -50) return 'Excellent';
    if (rssi >= -60) return 'Good';
    if (rssi >= -70) return 'Fair';
    return 'Poor';
  };

  const getWifiSignalColor = (rssi: number) => {
    if (rssi >= -50) return '#22c55e';
    if (rssi >= -60) return '#84cc16';
    if (rssi >= -70) return '#eab308';
    return '#ef4444';
  };

  const startNetworkScan = async () => {
    try {
      setIsScanningNetwork(true);
      // Simulate network scanning with mock data
      setTimeout(() => {
        const mockDevices = [
          {
            ip: '192.168.1.1',
            mac: '00:11:22:33:44:55',
            hostname: 'Router',
            vendor: 'TP-Link',
          },
          {
            ip: '192.168.1.2',
            mac: 'AA:BB:CC:DD:EE:FF',
            hostname: 'Smart TV',
            vendor: 'Samsung',
          },
          {
            ip: '192.168.1.3',
            mac: '12:34:56:78:90:AB',
            hostname: 'ESP32 Device',
            vendor: 'Espressif',
          },
          {
            ip: '192.168.1.4',
            mac: 'CD:EF:12:34:56:78',
            hostname: 'Smart Bulb',
            vendor: 'Philips Hue',
          },
        ];
        setNetworkDevices(mockDevices);
        setIsScanningNetwork(false);
      }, 3000);
    } catch (error) {
      console.error('Error scanning network:', error);
      showAlert('Error', 'Failed to scan network devices', 'error');
      setIsScanningNetwork(false);
    }
  };

  const getDeviceIcon = (vendor: string) => {
    switch (vendor.toLowerCase()) {
      case 'tp-link':
      case 'router':
        return <Router size={24} color="#2563eb" />;
      case 'samsung':
      case 'smart tv':
        return <Smartphone size={24} color="#2563eb" />;
      case 'espressif':
      case 'esp32':
        return <Server size={24} color="#2563eb" />;
      default:
        return <Network size={24} color="#2563eb" />;
    }
  };

  const addMqttConnection = () => {
    const newConnection: MqttConnectionUI = {
      id: `mqtt_${Date.now()}`,
      host: mqttConfig.host,
      port: mqttConfig.port,
      clientId: mqttConfig.clientId,
      username: mqttConfig.username,
      password: mqttConfig.password,
      status: 'disconnected',
      messages: [],
      topic: 'test/topic',
      message: '',
    };
    setMqttConnections((prev) => [...prev, newConnection]);
    setSelectedMqttConnection(newConnection.id);
  };

  const removeMqttConnection = (id: string) => {
    setMqttConnections((prev) => prev.filter((conn) => conn.id !== id));
    if (selectedMqttConnection === id) {
      setSelectedMqttConnection(null);
    }
  };

  const updateMqttConnection = (
    id: string,
    updates:
      | Partial<MqttConnectionUI>
      | ((conn: MqttConnectionUI) => Partial<MqttConnectionUI>)
  ) => {
    setMqttConnections((prev) =>
      prev.map((conn) =>
        conn.id === id
          ? {
              ...conn,
              ...(typeof updates === 'function' ? updates(conn) : updates),
            }
          : conn
      )
    );
  };

  const connectMqtt = async (id: string) => {
    const connection = mqttConnections.find((conn) => conn.id === id);
    if (!connection) return;

    try {
      updateMqttConnection(id, { status: 'connecting' });

      // Update centralized MQTT service configuration
      mqttService.updateConfig({
        host: connection.host,
        port: connection.port,
        clientId: connection.clientId,
        username: connection.username,
        password: connection.password,
      });

      // Connect using centralized service
      await mqttService.connect();

      // Subscribe to the topic
      mqttService.subscribe(connection.topic);

      // Update connection status
      const bridgeStatus = mqttService.getStatus();
      const connectionStatus: MqttConnectionStatus =
        bridgeStatus === 'connected'
          ? 'connected'
          : bridgeStatus === 'connecting'
          ? 'connecting'
          : bridgeStatus === 'error'
          ? 'error'
          : 'disconnected';

      updateMqttConnection(id, {
        status: connectionStatus,
        messages: [
          ...connection.messages,
          `Connected to ${connection.host}:${connection.port}`,
        ],
      });

      showAlert('Success', 'MQTT Connected successfully', 'success');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      updateMqttConnection(id, {
        status: 'error',
        messages: [...connection.messages, `Connection error: ${errorMessage}`],
      });
      showAlert('Error', `Failed to connect: ${errorMessage}`, 'error');
    }
  };

  const disconnectMqtt = (id: string) => {
    try {
      // Disconnect centralized MQTT service
      mqttService.disconnect();

      updateMqttConnection(id, { status: 'disconnected' });
      const connection = mqttConnections.find((conn) => conn.id === id);
      if (connection) {
        updateMqttConnection(id, {
          messages: [...connection.messages, 'Disconnected from server'],
        });
      }
      showAlert('Success', 'MQTT Disconnected successfully', 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      showAlert('Error', `Failed to disconnect: ${errorMsg}`, 'error');
      console.error('MQTT Disconnection error:', error);
    }
  };

  const sendMqttMessage = (id: string) => {
    const connection = mqttConnections.find((conn) => conn.id === id);
    if (!connection) {
      showAlert('Error', 'Connection not found', 'error');
      return;
    }
    if (!mqttService.isConnected()) {
      showAlert('Error', 'MQTT not connected', 'error');
      return;
    }
    if (!connection.message.trim() || !connection.topic.trim()) {
      showAlert('Error', 'Message and topic cannot be empty', 'error');
      return;
    }
    try {
      // Send using centralized MQTT service
      console.log('[MQTT SEND]', {
        topic: connection.topic,
        message: connection.message,
      });

      const success = mqttService.publish(connection.topic, connection.message);

      if (success) {
        // Log success
        updateMqttConnection(id, (conn) => ({
          messages: [
            ...(conn.messages || []),
            `[${connection.topic}] Sending: ${connection.message}`,
            `[${connection.topic}] Sent successfully`,
          ],
          message: '',
        }));
      } else {
        throw new Error('Failed to publish message');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      updateMqttConnection(id, (conn) => ({
        messages: [
          ...(conn.messages || []),
          `Error sending control message: ${errorMessage}`,
        ],
      }));
      showAlert('Error', `Failed to send message: ${errorMessage}`, 'error');
    }
  };

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup centralized MQTT service if needed
      // Note: We don't disconnect here as other components might be using it
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Customize your smart home experience
          </Text>
        </View>

        {/* Device Setup Section */}
        <SettingSection title="Device Setup">
          <SettingItem
            icon={<Wifi size={24} color="#2563eb" />}
            title="WiFi Configuration"
            subtitle="Configure WiFi for ESP32 devices"
            onPress={() => router.push('/wifi-setup')}
          />
          <SettingItem
            icon={<Bluetooth size={24} color="#2563eb" />}
            title="Bluetooth Devices"
            subtitle={`${connectedDevices.length} device${
              connectedDevices.length !== 1 ? 's' : ''
            } connected`}
            onPress={() => {}}
          />
        </SettingSection>

        {/* Bluetooth Section */}
        {/* <SettingSection title="Bluetooth"> */}
        {/* Bluetooth Status Card */}
        {/* <View style={styles.bluetoothCard}> */}
        {/* <View style={styles.bluetoothHeader}>
              <View style={styles.bluetoothStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor:
                        connectedDevices.length > 0 ? '#22c55e' : '#ef4444',
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {connectedDevices.length > 0
                    ? `${connectedDevices.length} Device${
                        connectedDevices.length > 1 ? 's' : ''
                      } Connected`
                    : 'Disconnected'}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                {connectedDevices.length > 0 && (
                  <TouchableOpacity
                    style={[styles.headerButton, styles.disconnectAllButton]}
                    onPress={disconnectAllDevices}
                    disabled={connectingDeviceId === 'all'}
                  >
                    {connectingDeviceId === 'all' ? (
                      <ActivityIndicator color="#ef4444" />
                    ) : (
                      <PowerOff size={20} color="#ef4444" />
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    isScanning && styles.scanningButton,
                  ]}
                  onPress={startScan}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <ActivityIndicator color="#2563eb" />
                  ) : (
                    <RefreshCw size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              </View>
            </View> */}

        {/* Connected Devices */}
        {/* {connectedDevices.length > 0 ? (
              <View style={styles.connectedDevices}>
                <Text style={styles.sectionSubtitle}>Connected Devices</Text>
                {connectedDevices.map((device) => (
                  <TouchableOpacity
                    key={device.id}
                    style={styles.connectedDeviceInfo}
                    onPress={() => handleDevicePress(device)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.deviceIcon, styles.connectedDeviceIcon]}
                    >
                      <BluetoothConnected size={24} color="#22c55e" />
                    </View>
                    <View style={styles.deviceDetails}>
                      <Text style={styles.deviceName}>
                        {device.name || 'Unknown Device'}
                      </Text>
                      <Text style={styles.deviceId}>{device.id}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.disconnectButton,
                        connectingDeviceId === device.id &&
                          styles.disconnectButtonActive,
                      ]}
                      onPress={(e) => {
                        e.stopPropagation();
                        disconnectDevice(device.id);
                      }}
                      disabled={connectingDeviceId === device.id}
                    >
                      {connectingDeviceId === device.id ? (
                        <ActivityIndicator color="#ef4444" />
                      ) : (
                        <X size={20} color="#ef4444" />
                      )}
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noConnectedDevices}>
                <Text style={styles.noConnectedDevicesText}>
                  No devices connected
                </Text>
                <Text style={styles.noConnectedDevicesSubtext}>
                  Connect to a device from the available devices list below
                </Text>
              </View>
            )} */}
        {/* </View> */}

        {/* Available Devices */}
        {/* {devices.length > 0 && (
            <View style={styles.deviceList}>
              <Text style={styles.sectionSubtitle1}>Available Devices</Text>
              {devices.map((device) => (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.deviceItem,
                    (connectingDeviceId === device.id ||
                      bluetoothService.isDeviceConnected(device.id)) &&
                      styles.deviceItemDisabled,
                  ]}
                  onPress={() => connectToDevice(device)}
                  disabled={
                    connectingDeviceId === device.id ||
                    bluetoothService.isDeviceConnected(device.id)
                  }
                >
                  <View style={[styles.deviceIcon, styles.availableDeviceIcon]}>
                    <Radio size={24} color="#2563eb" />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>
                      {device.name || 'Unknown Device'}
                    </Text>
                    <Text style={styles.deviceId}>{device.id}</Text>
                  </View>
                  {connectingDeviceId === device.id ? (
                    <ActivityIndicator color="#2563eb" />
                  ) : bluetoothService.isDeviceConnected(device.id) ? (
                    <BluetoothConnected size={24} color="#22c55e" />
                  ) : (
                    <Bluetooth size={24} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )} */}

        {/* No Devices Found */}
        {/* {!isScanning &&
            devices.length === 0 &&
            connectedDevices.length === 0 && (
              <View style={styles.noDevices}>
                <View style={styles.noDevicesIcon}>
                  <WifiOff size={48} color="#64748b" />
                </View>
                <Text style={styles.noDevicesText}>No devices found</Text>
                <Text style={styles.noDevicesSubtext}>
                  Make sure Bluetooth is enabled and devices are nearby
                </Text>
                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    isScanning && styles.scanButtonActive,
                  ]}
                  onPress={startScan}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.scanButtonText}>Scan for Devices</Text>
                  )}
                </TouchableOpacity>
              </View>
            )} */}
        {/* </SettingSection> */}

        {/* MQTT Bridge Section */}
        {/* <SettingSection title="MQTT Bridge">
          <MQTTBridgeSection />
        </SettingSection> */}

        {/* Device Control Section */}
        {/* <SettingSection title="Device Control">
          <View style={styles.deviceControlCard}>
            <View style={styles.deviceControlHeader}>
              <View style={styles.deviceControlStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor:
                        Object.keys(deviceStates).length > 0
                          ? '#22c55e'
                          : '#ef4444',
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {Object.keys(deviceStates).length > 0
                    ? `${Object.keys(deviceStates).length} Device${
                        Object.keys(deviceStates).length !== 1 ? 's' : ''
                      } Available`
                    : 'No Devices Available'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.headerButton, styles.addDeviceButton]}
                onPress={() => {
                  // Add a new device control
                  const deviceId = `device_${Date.now()}`;
                  addDeviceControl(deviceId, `devices/${deviceId}/control`);
                }}
              >
                <Plus size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>

            {Object.keys(deviceStates).length > 0 ? (
              <View style={styles.deviceControlList}>
                {Object.entries(deviceStates).map(([deviceId, state]) => (
                  <View key={deviceId} style={styles.deviceControlItem}>
                    <View style={styles.deviceControlInfo}>
                      <Text style={styles.deviceControlName}>
                        Device {deviceId.split('_')[1]}
                      </Text>
                      <Text style={styles.deviceControlTopic}>
                        Topic: {deviceTopics[deviceId]}
                      </Text>
                    </View>
                    <View style={styles.deviceControlActions}>
                      <Switch
                        value={state}
                        onValueChange={() => toggleDeviceState(deviceId)}
                        trackColor={{ false: '#334155', true: '#2563eb' }}
                        thumbColor="white"
                      />
                      <TouchableOpacity
                        style={styles.removeDeviceButton}
                        onPress={() => removeDeviceControl(deviceId)}
                      >
                        <X size={20} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noDevicesControl}>
                <View style={styles.noDevicesControlIcon}>
                  <PowerOff size={48} color="#64748b" />
                </View>
                <Text style={styles.noDevicesControlText}>
                  No devices available for control
                </Text>
                <Text style={styles.noDevicesControlSubtext}>
                  Add devices to control them via MQTT
                </Text>
                <TouchableOpacity
                  style={styles.addDeviceControlButton}
                  onPress={() => {
                    const deviceId = `device_${Date.now()}`;
                    addDeviceControl(deviceId, `devices/${deviceId}/control`);
                  }}
                >
                  <Text style={styles.addDeviceControlButtonText}>
                    Add Device Control
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SettingSection> */}

        {/* WiFi Scan Section */}
        {/* <SettingSection title="WiFi Networks">
          <View style={styles.wifiCard}>
            <View style={styles.wifiHeader}>
              <View style={styles.wifiStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor:
                        wifiNetworks.length > 0 ? '#22c55e' : '#ef4444',
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {wifiNetworks.length > 0
                    ? `${wifiNetworks.length} Network${
                        wifiNetworks.length !== 1 ? 's' : ''
                      } Found`
                    : 'No Networks Found'}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    isWifiScanning && styles.scanningButton,
                  ]}
                  onPress={startWifiScan}
                  disabled={isWifiScanning}
                >
                  {isWifiScanning ? (
                    <ActivityIndicator color="#2563eb" />
                  ) : (
                    <RefreshCw size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {wifiNetworks.length > 0 ? (
              <View style={styles.wifiList}>
                {wifiNetworks.map((network, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.wifiItem}
                    onPress={() => {
                      setWifiConfig((prev) => ({
                        ...prev,
                        ssid: network.ssid,
                      }));
                      setIsModalVisible(true);
                    }}
                  >
                    <View style={styles.wifiIcon}>
                      <WifiIcon2
                        size={24}
                        color={getWifiSignalColor(network.rssi)}
                      />
                    </View>
                    <View style={styles.wifiInfo}>
                      <Text style={styles.wifiName}>{network.ssid}</Text>
                      <Text style={styles.wifiSignal}>
                        Signal: {getWifiSignalStrength(network.rssi)}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#64748b" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noWifiNetworks}>
                <View style={styles.noWifiIcon}>
                  <WifiOff size={48} color="#64748b" />
                </View>
                <Text style={styles.noWifiText}>No WiFi networks found</Text>
                <Text style={styles.noWifiSubtext}>
                  Make sure WiFi is enabled and try scanning again
                </Text>
                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    isWifiScanning && styles.scanButtonActive,
                  ]}
                  onPress={startWifiScan}
                  disabled={isWifiScanning}
                >
                  {isWifiScanning ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.scanButtonText}>Scan for Networks</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SettingSection> */}

        {/* Network Scanner Section */}
        {/* <SettingSection title="Network Devices">
          <View style={styles.networkCard}>
            <View style={styles.networkHeader}>
              <View style={styles.networkStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor:
                        networkDevices.length > 0 ? '#22c55e' : '#ef4444',
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {networkDevices.length > 0
                    ? `${networkDevices.length} Device${
                        networkDevices.length !== 1 ? 's' : ''
                      } Found`
                    : 'No Devices Found'}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    isScanningNetwork && styles.scanningButton,
                  ]}
                  onPress={startNetworkScan}
                  disabled={isScanningNetwork}
                >
                  {isScanningNetwork ? (
                    <ActivityIndicator color="#2563eb" />
                  ) : (
                    <RefreshCw size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {networkDevices.length > 0 ? (
              <View style={styles.networkList}>
                {networkDevices.map((device, index) => (
                  <View key={index} style={styles.networkItem}>
                    <View style={styles.networkIcon}>
                      {getDeviceIcon(device.vendor)}
                    </View>
                    <View style={styles.networkInfo}>
                      <Text style={styles.networkName}>{device.hostname}</Text>
                      <Text style={styles.networkDetails}>IP: {device.ip}</Text>
                      <Text style={styles.networkDetails}>
                        MAC: {device.mac}
                      </Text>
                      <Text style={styles.networkVendor}>{device.vendor}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noNetworkDevices}>
                <View style={styles.noNetworkIcon}>
                  <Network size={48} color="#64748b" />
                </View>
                <Text style={styles.noNetworkText}>
                  No network devices found
                </Text>
                <Text style={styles.noNetworkSubtext}>
                  Make sure you're connected to the network and try scanning
                  again
                </Text>
                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    isScanningNetwork && styles.scanButtonActive,
                  ]}
                  onPress={startNetworkScan}
                  disabled={isScanningNetwork}
                >
                  {isScanningNetwork ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.scanButtonText}>Scan Network</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SettingSection> */}

        {/* Centralized MQTT Configuration Section */}
        {/* <SettingSection title="MQTT Configuration">
          <View style={styles.tcpCard}>
            <View style={styles.tcpHeader}>
              <View style={styles.tcpStatus}>
                <Text style={styles.statusText}>Centralized MQTT Service</Text>
              </View>
              <View style={styles.headerButtons}>
                {mqttService.isConnected() ? (
                  <TouchableOpacity
                    style={[styles.headerButton, styles.disconnectButton]}
                    onPress={() => mqttService.disconnect()}
                  >
                    <PowerOff size={20} color="#ef4444" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.headerButton, styles.addDeviceButton]}
                    onPress={() => mqttService.connect()}
                  >
                    <Network size={20} color="#2563eb" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.tcpContent}>
              <View style={styles.tcpInputGroup}>
                <Text style={styles.tcpLabel}>Host:</Text>
                <TextInput
                  style={styles.tcpInput}
                  value={mqttConfig.host}
                  onChangeText={(text) => {
                    setMqttConfig((prev) => ({ ...prev, host: text }));
                    mqttService.updateConfig({ host: text });
                  }}
                  placeholder="Enter MQTT broker host"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.tcpInputGroup}>
                <Text style={styles.tcpLabel}>Port:</Text>
                <TextInput
                  style={styles.tcpInput}
                  value={mqttConfig.port.toString()}
                  onChangeText={(text) => {
                    const port = parseInt(text) || 1883;
                    setMqttConfig((prev) => ({ ...prev, port }));
                    mqttService.updateConfig({ port });
                  }}
                  placeholder="Enter MQTT broker port"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.tcpInputGroup}>
                <Text style={styles.tcpLabel}>Client ID:</Text>
                <TextInput
                  style={styles.tcpInput}
                  value={mqttConfig.clientId}
                  onChangeText={(text) => {
                    setMqttConfig((prev) => ({ ...prev, clientId: text }));
                    mqttService.updateConfig({ clientId: text });
                  }}
                  placeholder="Enter client ID"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.tcpInputGroup}>
                <Text style={styles.tcpLabel}>Username:</Text>
                <TextInput
                  style={styles.tcpInput}
                  value={mqttConfig.username || ''}
                  onChangeText={(text) => {
                    setMqttConfig((prev) => ({ ...prev, username: text }));
                    mqttService.updateConfig({ username: text });
                  }}
                  placeholder="Enter username (optional)"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={styles.tcpInputGroup}>
                <Text style={styles.tcpLabel}>Password:</Text>
                <TextInput
                  style={styles.tcpInput}
                  value={mqttConfig.password || ''}
                  onChangeText={(text) => {
                    setMqttConfig((prev) => ({ ...prev, password: text }));
                    mqttService.updateConfig({ password: text });
                  }}
                  placeholder="Enter password (optional)"
                  placeholderTextColor="#64748b"
                  secureTextEntry
                />
              </View>

              <View style={styles.tcpStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor: mqttService.isConnected()
                        ? '#22c55e'
                        : '#ef4444',
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  Status: {mqttService.getStatus()}
                </Text>
              </View>
            </View>
          </View>
        </SettingSection> */}

        {/* MQTT Connection Test Section */}
        {/* <SettingSection title="MQTT Connection Test">
          <View style={styles.tcpCard}>
            <View style={styles.tcpHeader}>
              <View style={styles.tcpStatus}>
                <Text style={styles.statusText}>
                  {mqttConnections.length} Connection
                  {mqttConnections.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.headerButton, styles.addDeviceButton]}
                onPress={addMqttConnection}
              >
                <Plus size={20} color="#2563eb" />
              </TouchableOpacity>
            </View>

            {mqttConnections.map((connection) => (
              <View key={connection.id} style={styles.tcpConnectionCard}>
                <View style={styles.tcpConnectionHeader}>
                  <View style={styles.tcpStatus}>
                    <View
                      style={[
                        styles.statusIndicator,
                        {
                          backgroundColor:
                            connection.status === 'connected'
                              ? '#22c55e'
                              : connection.status === 'connecting'
                              ? '#eab308'
                              : '#ef4444',
                        },
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {connection.status === 'connected'
                        ? 'Connected'
                        : connection.status === 'connecting'
                        ? 'Connecting...'
                        : 'Disconnected'}
                    </Text>
                  </View>
                  <View style={styles.headerButtons}>
                    {connection.status === 'connected' ? (
                      <TouchableOpacity
                        style={[styles.headerButton, styles.disconnectButton]}
                        onPress={() => disconnectMqtt(connection.id)}
                      >
                        <PowerOff size={20} color="#ef4444" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.headerButton,
                          connection.status === 'connecting' &&
                            styles.scanningButton,
                        ]}
                        onPress={() => connectMqtt(connection.id)}
                        disabled={connection.status === 'connecting'}
                      >
                        {connection.status === 'connecting' ? (
                          <ActivityIndicator color="#2563eb" />
                        ) : (
                          <Network size={20} color="#2563eb" />
                        )}
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.headerButton, styles.removeDeviceButton]}
                      onPress={() => removeMqttConnection(connection.id)}
                    >
                      <X size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.tcpContent}>
                  <View style={styles.tcpInputGroup}>
                    <Text style={styles.tcpLabel}>Host:</Text>
                    <TextInput
                      style={styles.tcpInput}
                      value={connection.host}
                      onChangeText={(text) =>
                        updateMqttConnection(connection.id, { host: text })
                      }
                      placeholder="Enter host (e.g., 127.0.0.1)"
                      placeholderTextColor="#64748b"
                      editable={connection.status === 'disconnected'}
                    />
                  </View>

                  <View style={styles.tcpInputGroup}>
                    <Text style={styles.tcpLabel}>Port:</Text>
                    <TextInput
                      style={styles.tcpInput}
                      value={connection.port.toString()}
                      onChangeText={(text) =>
                        updateMqttConnection(connection.id, {
                          port: parseInt(text) || 1883,
                        })
                      }
                      placeholder="Enter port (e.g., 1883)"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      editable={connection.status === 'disconnected'}
                    />
                  </View>

                  <View style={styles.tcpInputGroup}>
                    <Text style={styles.tcpLabel}>Client ID:</Text>
                    <TextInput
                      style={styles.tcpInput}
                      value={connection.clientId}
                      onChangeText={(text) =>
                        updateMqttConnection(connection.id, { clientId: text })
                      }
                      placeholder="Enter client ID"
                      placeholderTextColor="#64748b"
                      editable={connection.status === 'disconnected'}
                    />
                  </View>

                  <View style={styles.tcpInputGroup}>
                    <Text style={styles.tcpLabel}>Username:</Text>
                    <TextInput
                      style={styles.tcpInput}
                      value={connection.username || ''}
                      onChangeText={(text) =>
                        updateMqttConnection(connection.id, { username: text })
                      }
                      placeholder="Enter username (optional)"
                      placeholderTextColor="#64748b"
                      editable={connection.status === 'disconnected'}
                    />
                  </View>

                  <View style={styles.tcpInputGroup}>
                    <Text style={styles.tcpLabel}>Password:</Text>
                    <TextInput
                      style={styles.tcpInput}
                      value={connection.password || ''}
                      onChangeText={(text) =>
                        updateMqttConnection(connection.id, { password: text })
                      }
                      placeholder="Enter password (optional)"
                      placeholderTextColor="#64748b"
                      secureTextEntry
                      editable={connection.status === 'disconnected'}
                    />
                  </View>

                  <View style={styles.tcpInputGroup}>
                    <Text style={styles.tcpLabel}>Topic:</Text>
                    <TextInput
                      style={styles.tcpInput}
                      value={connection.topic}
                      onChangeText={(text) =>
                        updateMqttConnection(connection.id, { topic: text })
                      }
                      placeholder="Enter topic (e.g., test/topic)"
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  <View style={styles.tcpInputGroup}>
                    <Text style={styles.tcpLabel}>Test Message:</Text>
                    <TextInput
                      style={[styles.tcpInput, styles.tcpMessageInput]}
                      value={connection.message}
                      onChangeText={(text) =>
                        updateMqttConnection(connection.id, { message: text })
                      }
                      placeholder="Enter test message"
                      placeholderTextColor="#64748b"
                      multiline
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.tcpSendButton,
                      (!connection.message.trim() ||
                        !connection.topic.trim() ||
                        connection.status !== 'connected') &&
                        styles.buttonDisabled,
                    ]}
                    onPress={() => sendMqttMessage(connection.id)}
                    disabled={
                      !connection.message.trim() ||
                      !connection.topic.trim() ||
                      connection.status !== 'connected'
                    }
                  >
                    <Send size={20} color="#ffffff" />
                    <Text style={styles.tcpSendButtonText}>
                      Send Test Message
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.tcpMessagesContainer}>
                    <Text style={styles.tcpMessagesTitle}>Connection Log:</Text>
                    <ScrollView style={styles.tcpMessagesList}>
                      {connection.messages.map((msg, index) => (
                        <Text
                          key={index}
                          style={[
                            styles.tcpMessageText,
                            msg.includes('Sending:') &&
                              styles.sendingMessageText,
                            msg.includes('Sent successfully') &&
                              styles.sentMessageText,
                            msg.includes('Error') && styles.errorMessageText,
                            msg.includes('Received:') &&
                              styles.receivedMessageText,
                          ]}
                        >
                          {msg}
                        </Text>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </View>
            ))}

            {mqttConnections.length === 0 && (
              <View style={styles.noTcpConnections}>
                <View style={styles.noTcpIcon}>
                  <Network size={48} color="#64748b" />
                </View>
                <Text style={styles.noTcpText}>No MQTT connections</Text>
                <Text style={styles.noTcpSubtext}>
                  Add a new MQTT connection to start testing
                </Text>
                <TouchableOpacity
                  style={styles.addTcpButton}
                  onPress={addMqttConnection}
                >
                  <Text style={styles.addTcpButtonText}>
                    Add TCP Connection
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SettingSection> */}

        {/* Account Section */}
        <SettingSection title="Account">
          <SettingItem
            icon={<User size={24} color="#2563eb" />}
            title="Profile"
            subtitle="Manage your account information"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Lock size={24} color="#2563eb" />}
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Device Settings */}
        <SettingSection title="Device Settings">
          <SettingItem
            icon={<Wifi size={24} color="#2563eb" />}
            title="Network Settings"
            subtitle="Wi-Fi and connectivity options"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Smartphone size={24} color="#2563eb" />}
            title="Device Management"
            subtitle="Add, remove, and configure devices"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Shield size={24} color="#2563eb" />}
            title="Security"
            subtitle="Home security and access control"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences">
          <SettingItem
            icon={<Bell size={24} color="#2563eb" />}
            title="Notifications"
            subtitle="Push notifications and alerts"
            showArrow={false}
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#334155', true: '#2563eb' }}
                thumbColor="white"
              />
            }
          />
          <SettingItem
            icon={<Moon size={24} color="#2563eb" />}
            title="Dark Mode"
            subtitle={darkMode ? 'On' : 'Off'}
            showArrow={false}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#334155', true: '#2563eb' }}
                thumbColor="white"
              />
            }
          />
          <SettingItem
            icon={<Palette size={24} color="#2563eb" />}
            title="Theme"
            subtitle="Customize app appearance"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Globe size={24} color="#2563eb" />}
            title="Language"
            subtitle="English"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Automation */}
        <SettingSection title="Automation">
          <SettingItem
            icon={<Moon size={24} color="#2563eb" />}
            title="Auto Mode"
            subtitle="Automatically adjust devices based on time"
            showArrow={false}
            rightElement={
              <Switch
                value={autoMode}
                onValueChange={setAutoMode}
                trackColor={{ false: '#334155', true: '#2563eb' }}
                thumbColor="white"
              />
            }
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingItem
            icon={<HelpCircle size={24} color="#2563eb" />}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => {}}
          />
        </SettingSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Sixth Kendra Smart Home App</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          {/* <Text style={styles.appCredit}>Designed by Saurabh Dubey</Text> */}
        </View>
      </ScrollView>

      {/* WiFi Config Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsModalVisible(false);
          Keyboard.dismiss();
        }}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <WifiIcon
                  size={24}
                  color="#2563eb"
                  style={styles.modalTitleIcon}
                />
                <Text style={styles.modalTitle}>WiFi Configuration</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsModalVisible(false);
                  Keyboard.dismiss();
                }}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>WiFi SSID</Text>
                <View style={styles.inputContainer}>
                  <WifiIcon
                    size={20}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={wifiConfig.ssid}
                    onChangeText={(text) =>
                      setWifiConfig((prev) => ({ ...prev, ssid: text }))
                    }
                    placeholder="Enter WiFi name"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={wifiConfig.password}
                    onChangeText={(text) =>
                      setWifiConfig((prev) => ({ ...prev, password: text }))
                    }
                    placeholder="Enter WiFi password"
                    placeholderTextColor="#64748b"
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Port</Text>
                <View style={styles.inputContainer}>
                  <Globe size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={wifiConfig.port}
                    onChangeText={(text) =>
                      setWifiConfig((prev) => ({ ...prev, port: text }))
                    }
                    placeholder="Enter port number"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.button,
                  (isSending || !wifiConfig.ssid || !wifiConfig.password) &&
                    styles.buttonDisabled,
                ]}
                onPress={sendWifiConfig}
                disabled={isSending || !wifiConfig.ssid || !wifiConfig.password}
              >
                {isSending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Send size={20} color="#ffffff" style={styles.buttonIcon} />
                    <Text style={styles.buttonText}>Send Configuration</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingBottom: 20,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingTop: 0,
    paddingHorizontal: 20,
    marginBottom: 70,
  },
  appInfoText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginBottom: 8,
  },
  appCredit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  deviceList: {
    marginTop: 0,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceId: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionSubtitle1: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 20,
  },
  noDevices: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    marginTop: 8,
  },
  noDevicesIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noDevicesText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  noDevicesSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: width * 0.8,
  },
  scanButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanButtonActive: {
    backgroundColor: '#1e40af',
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  bluetoothCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  bluetoothHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  bluetoothStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  scanningButton: {
    backgroundColor: '#1e40af',
  },
  disconnectAllButton: {
    backgroundColor: '#1e293b',
  },
  connectedDevices: {
    marginTop: 16,
  },
  connectedDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  connectedDeviceIcon: {
    backgroundColor: '#064e3b',
  },
  availableDeviceIcon: {
    backgroundColor: '#0f172a80',
  },
  deviceDetails: {
    flex: 1,
  },
  disconnectButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  disconnectButtonActive: {
    backgroundColor: '#7f1d1d',
  },
  deviceItemDisabled: {
    opacity: 0.5,
  },
  noConnectedDevices: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginBottom: 16,
  },
  noConnectedDevicesText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  noConnectedDevicesSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  dataTransferCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  formatSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0f172a',
  },
  formatButtonActive: {
    backgroundColor: '#2563eb',
  },
  formatButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  formatButtonTextActive: {
    color: '#f8fafc',
  },
  dataInput: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    color: '#f8fafc',
    fontSize: 14,
    minHeight: 120,
    marginBottom: 16,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
  },
  sendButtonActive: {
    backgroundColor: '#1e40af',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  mqttCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  mqttHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mqttStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mqttContent: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
  },
  mqttInputGroup: {
    marginBottom: 16,
  },
  mqttLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  mqttInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
  },
  mqttMessageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  publishButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  messagesContainer: {
    marginTop: 16,
  },
  messagesTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  messagesList: {
    maxHeight: 200,
    padding: 8,
  },
  messageText: {
    color: '#f8fafc',
    fontSize: 12,
    marginBottom: 4,
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
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
    height: '65%',
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitleIcon: {
    marginRight: 12,
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
  modalBody: {
    flex: 1,
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2563eb30',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonDisabled: {
    backgroundColor: '#1e40af',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  wifiCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  wifiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  wifiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wifiList: {
    marginTop: 16,
  },
  wifiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  wifiIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  wifiInfo: {
    flex: 1,
  },
  wifiName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  wifiSignal: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  noWifiNetworks: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginTop: 16,
  },
  noWifiIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noWifiText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  noWifiSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: width * 0.8,
  },
  networkCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  networkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  networkStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkList: {
    marginTop: 16,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  networkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  networkDetails: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 2,
  },
  networkVendor: {
    color: '#2563eb',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  noNetworkDevices: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginTop: 16,
  },
  noNetworkIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noNetworkText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  noNetworkSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: width * 0.8,
  },
  tcpCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tcpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  tcpStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tcpContent: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
  },
  tcpInputGroup: {
    marginBottom: 16,
  },
  tcpLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  tcpInput: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
  },
  tcpMessageInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tcpSendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  tcpSendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tcpMessagesContainer: {
    marginTop: 16,
  },
  tcpMessagesTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  tcpMessagesList: {
    maxHeight: 200,
    padding: 8,
  },
  tcpMessageText: {
    color: '#f8fafc',
    fontSize: 12,
    marginBottom: 4,
    padding: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  sendingMessageText: {
    backgroundColor: '#1e40af',
    color: '#ffffff',
  },
  sentMessageText: {
    backgroundColor: '#064e3b',
    color: '#ffffff',
  },
  errorMessageText: {
    backgroundColor: '#7f1d1d',
    color: '#ffffff',
  },
  receivedMessageText: {
    backgroundColor: '#1e293b',
    color: '#f8fafc',
  },
  deviceControlCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  deviceControlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceControlStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addDeviceButton: {
    backgroundColor: '#1e40af',
  },
  deviceControlList: {
    marginTop: 16,
  },
  deviceControlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  deviceControlInfo: {
    flex: 1,
  },
  deviceControlName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceControlTopic: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  deviceControlActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeDeviceButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  noDevicesControl: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginBottom: 16,
  },
  noDevicesControlIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noDevicesControlText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  noDevicesControlSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  addDeviceControlButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
  },
  addDeviceControlButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  tcpConnectionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  tcpConnectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noTcpConnections: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginTop: 16,
  },
  noTcpIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noTcpText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  noTcpSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: width * 0.8,
  },
  addTcpButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
  },
  addTcpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // MQTT Bridge Styles
  brokerInfo: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  brokerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  brokerLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  brokerValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    fontWeight: '500',
  },
  testSection: {
    marginTop: 16,
  },
  testTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  testButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  cloudTestButton: {
    backgroundColor: '#059669',
  },
  testButtonActive: {
    opacity: 0.7,
  },
  testButtonError: {
    backgroundColor: '#dc2626',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  infoTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },

  // Bridge Test Styles
  bridgeTestButton: {
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  bridgeResults: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  bridgeResultsTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  bridgeResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bridgeResultLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  bridgeResultValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  bridgeErrors: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  bridgeErrorTitle: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  bridgeErrorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 4,
  },

  // Network Section Styles
  networkSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  networkIndicator: {
    marginTop: 8,
  },
});

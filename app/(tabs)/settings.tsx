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
  Animated,
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
  BluetoothConnected,
  RefreshCw,
  X,
  Signal,
  WifiOff,
  PowerOff,
  Radio,
  Send,
  FileJson,
  FileText,
  Wifi as WifiIcon,
  Router,
} from 'lucide-react-native';
import { bluetoothService } from '../../services/bluetooth';
import { Device } from 'react-native-ble-plx';
import { CustomAlert } from '../../components/CustomAlert';
import Paho from 'paho-mqtt';
import { useRouter } from 'expo-router';

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

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoMode, setAutoMode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(
    null
  );
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
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
  const mqttClient = useRef<any>(null);
  const [mqttStatus, setMqttStatus] = useState<
    'disconnected' | 'connecting' | 'connected'
  >('disconnected');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [wifiConfig, setWifiConfig] = useState({
    ssid: '',
    password: '',
    port: '1883',
  });
  const [isSending, setIsSending] = useState(false);
  const [isBluetoothReady, setIsBluetoothReady] = useState(false);

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

    initializeBluetooth();

    return () => {
      bluetoothService.stopScan();
      if (mqttClient.current) {
        mqttClient.current.disconnect();
      }
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
      await startScan();
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

  const connectToDevice = async (device: Device) => {
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

  const connectMQTT = () => {
    try {
      setMqttStatus('connecting');
      mqttClient.current = new Paho.Client(
        '192.168.1.124',
        Number(9001),
        `client-${Math.random().toString(16).substr(2, 8)}`
      );

      const options = {
        onSuccess: () => {
          setMqttStatus('connected');
          setMqttConnected(true);
          mqttClient.current.subscribe('detpos/#');
          showAlert('Success', 'MQTT Connected successfully', 'success');
        },
        onFailure: (err: any) => {
          setMqttStatus('disconnected');
          setMqttConnected(false);
          showAlert('Error', 'Failed to connect to MQTT broker', 'error');
          console.error('MQTT Connection failed:', err);
        },
        userName: 'detpos',
        password: 'asdffdsa',
        useSSL: false,
      };

      mqttClient.current.connect(options);
      mqttClient.current.onMessageArrived = onMessageArrived;
      mqttClient.current.onConnectionLost = onConnectionLost;
    } catch (error) {
      setMqttStatus('disconnected');
      showAlert('Error', 'Failed to initialize MQTT client', 'error');
      console.error('MQTT initialization error:', error);
    }
  };

  const disconnectMQTT = () => {
    if (mqttClient.current) {
      mqttClient.current.disconnect();
      setMqttStatus('disconnected');
      setMqttConnected(false);
      showAlert('Success', 'MQTT Disconnected successfully', 'success');
    }
  };

  const onMessageArrived = (message: any) => {
    setMqttMessages((prev) => [
      ...prev,
      `${message.destinationName}: ${message.payloadString}`,
    ]);
  };

  const onConnectionLost = (responseObject: any) => {
    if (responseObject.errorCode !== 0) {
      setMqttStatus('disconnected');
      setMqttConnected(false);
      showAlert('Error', 'MQTT Connection lost', 'error');
    }
  };

  const publishMessage = () => {
    if (!mqttClient.current || !mqttConnected) {
      showAlert('Error', 'MQTT not connected', 'error');
      return;
    }

    try {
      const message = new Paho.Message(mqttMessage);
      message.destinationName = mqttTopic;
      mqttClient.current.send(message);
      showAlert('Success', 'Message published successfully', 'success');
      setMqttMessage('');
    } catch (error) {
      showAlert('Error', 'Failed to publish message', 'error');
      console.error('Publish error:', error);
    }
  };

  const handleDevicePress = (device: Device) => {
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
        <SettingSection title="Bluetooth">
          {/* Bluetooth Status Card */}
          <View style={styles.bluetoothCard}>
            <View style={styles.bluetoothHeader}>
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
            </View>

            {/* Connected Devices */}
            {connectedDevices.length > 0 ? (
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
            )}
          </View>

          {/* Available Devices */}
          {devices.length > 0 && (
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
          )}

          {/* No Devices Found */}
          {!isScanning &&
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
            )}
        </SettingSection>

        {/* MQTT Section */}
        <SettingSection title="MQTT Connection">
          <View style={styles.mqttCard}>
            <View style={styles.mqttHeader}>
              <View style={styles.mqttStatus}>
                <View
                  style={[
                    styles.statusIndicator,
                    {
                      backgroundColor:
                        mqttStatus === 'connected'
                          ? '#22c55e'
                          : mqttStatus === 'connecting'
                          ? '#eab308'
                          : '#ef4444',
                    },
                  ]}
                />
                <Text style={styles.statusText}>
                  {mqttStatus === 'connected'
                    ? 'Connected'
                    : mqttStatus === 'connecting'
                    ? 'Connecting...'
                    : 'Disconnected'}
                </Text>
              </View>
              <View style={styles.headerButtons}>
                {mqttConnected ? (
                  <TouchableOpacity
                    style={[styles.headerButton, styles.disconnectButton]}
                    onPress={disconnectMQTT}
                  >
                    <PowerOff size={20} color="#ef4444" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.headerButton,
                      mqttStatus === 'connecting' && styles.scanningButton,
                    ]}
                    onPress={connectMQTT}
                    disabled={mqttStatus === 'connecting'}
                  >
                    {mqttStatus === 'connecting' ? (
                      <ActivityIndicator color="#2563eb" />
                    ) : (
                      <WifiIcon size={20} color="#2563eb" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {mqttConnected && (
              <View style={styles.mqttContent}>
                <View style={styles.mqttInputGroup}>
                  <Text style={styles.mqttLabel}>Topic:</Text>
                  <TextInput
                    style={styles.mqttInput}
                    value={mqttTopic}
                    onChangeText={setMqttTopic}
                    placeholder="Enter topic"
                    placeholderTextColor="#64748b"
                  />
                </View>

                <View style={styles.mqttInputGroup}>
                  <Text style={styles.mqttLabel}>Message:</Text>
                  <TextInput
                    style={[styles.mqttInput, styles.mqttMessageInput]}
                    value={mqttMessage}
                    onChangeText={setMqttMessage}
                    placeholder="Enter message"
                    placeholderTextColor="#64748b"
                    multiline
                  />
                </View>

                <TouchableOpacity
                  style={styles.publishButton}
                  onPress={publishMessage}
                  disabled={!mqttMessage.trim()}
                >
                  <Send size={20} color="#ffffff" />
                  <Text style={styles.publishButtonText}>Publish</Text>
                </TouchableOpacity>

                <View style={styles.messagesContainer}>
                  <Text style={styles.messagesTitle}>Recent Messages:</Text>
                  <ScrollView style={styles.messagesList}>
                    {mqttMessages.map((msg, index) => (
                      <Text key={index} style={styles.messageText}>
                        {msg}
                      </Text>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>
        </SettingSection>

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
});

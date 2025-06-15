import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wifi,
  Lock,
  Send,
  RefreshCw,
  X,
  Bluetooth,
  BluetoothConnected,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { bluetoothService } from '../services/bluetooth';
import { Device } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { CustomAlert } from '@/components/CustomAlert';
import { useRooms } from './context/RoomContext';
import { DeviceType, deviceIcons } from '../constants/defaultData';

const DEVICE_TYPES: { type: DeviceType; name: string }[] = [
  { type: 'smart-light', name: 'Smart Light' },
  { type: 'smart-ac', name: 'Smart AC' },
  { type: 'smart-tv', name: 'Smart TV' },
  { type: 'air-purifier', name: 'Air Purifier' },
];

interface ConfiguredDevice {
  id: string;
  name: string;
  type: DeviceType;
  roomId: string;
  wifiConfig: {
    ssid: string;
    password: string;
    port: number;
  };
  lastConnected: string;
  status: string;
}

export default function DeviceSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { rooms, updateRoom, loadConfiguredDevices } = useRooms();
  const [step, setStep] = useState<'device-info' | 'wifi-setup'>('device-info');
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<DeviceType>('smart-light');
  const [roomId, setRoomId] = useState<string>(params.roomId as string);

  // WiFi Setup States
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState('1883');
  const [showPassword, setShowPassword] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(
    null
  );
  const [isSending, setIsSending] = useState(false);
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
  const [sendingDeviceId, setSendingDeviceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [configuredDevices, setConfiguredDevices] = useState<
    ConfiguredDevice[]
  >([]);

  useEffect(() => {
    if (step === 'wifi-setup') {
      initializeBluetooth();
    }
    loadConfiguredDevices();
  }, [step]);

  const initializeBluetooth = async () => {
    try {
      // Request necessary permissions
      if (Platform.OS === 'android') {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        if (Number(Platform.Version) >= 31) {
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
          permissions.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        }

        const results = await PermissionsAndroid.requestMultiple(permissions);
        const allGranted = Object.values(results).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          showAlert('Error', 'Required permissions not granted', 'error');
          return;
        }
      }

      // Get current Wi-Fi SSID
      const state = await NetInfo.fetch();
      if (state.type === 'wifi' && state.details?.ssid) {
        setSsid(state.details.ssid);
      }

      // Initialize Bluetooth
      const hasPermissions = await bluetoothService.requestPermissions();
      if (!hasPermissions) {
        showAlert('Error', 'Bluetooth permissions not granted', 'error');
        return;
      }

      // Update connected devices list
      setConnectedDevices(bluetoothService.getConnectedDevices());

      // Start scanning for devices
      startScan();
    } catch (error) {
      console.error('Initialization error:', error);
      showAlert('Error', 'Failed to initialize', 'error');
    }
  };

  const startScan = async () => {
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

  const connectToDevice = async (device: Device) => {
    try {
      setConnectingDeviceId(device.id);
      const connected = await bluetoothService.connectToDevice(device.id);
      if (connected) {
        // Update the connected devices list immediately after successful connection
        const updatedConnectedDevices = bluetoothService.getConnectedDevices();
        setConnectedDevices(updatedConnectedDevices);

        // Also update the devices list to remove the connected device
        const updatedDevices = devices.filter((d) => d.id !== device.id);
        setDevices(updatedDevices);

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

      // Check if device is actually connected before trying to disconnect
      const isConnected = bluetoothService
        .getConnectedDevices()
        .some((device) => device.id === deviceId);

      if (isConnected) {
        await bluetoothService.disconnectDevice(deviceId);
      }

      // Update UI regardless of connection status
      setConnectedDevices((prev) =>
        prev.filter((device) => device.id !== deviceId)
      );

      showAlert('Success', 'Device removed successfully', 'success');
    } catch (error) {
      console.error('Error disconnecting device:', error);
      // Still update UI even if there's an error
      setConnectedDevices((prev) =>
        prev.filter((device) => device.id !== deviceId)
      );
      showAlert('Info', 'Device removed from list', 'info');
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const sendWifiCredentials = async (deviceId: string) => {
    if (!ssid || !password) {
      showAlert('Error', 'Please enter both SSID and password', 'error');
      return;
    }

    try {
      setSendingDeviceId(deviceId);

      // Format the WiFi configuration data
      const wifiConfigData = {
        wifiConfig: {
          ssid: ssid,
          password: password,
          port: parseInt(port) || 1883,
        },
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(wifiConfigData);

      // Send the data
      const success = await bluetoothService.sendData(deviceId, jsonData);

      if (success) {
        // Store device information in AsyncStorage
        const deviceInfo = {
          id: deviceId,
          name,
          type: selectedType,
          roomId,
          wifiConfig: wifiConfigData.wifiConfig,
          lastConnected: new Date().toISOString(),
          status: 'active',
        };

        try {
          const existingDevices = await AsyncStorage.getItem(
            'configuredDevices'
          );
          const devices = existingDevices ? JSON.parse(existingDevices) : [];

          // Check if device already exists
          const deviceIndex = devices.findIndex((d: any) => d.id === deviceId);
          if (deviceIndex !== -1) {
            devices[deviceIndex] = deviceInfo;
          } else {
            devices.push(deviceInfo);
          }

          await AsyncStorage.setItem(
            'configuredDevices',
            JSON.stringify(devices)
          );

          // Add device to room
          const room = rooms.find((r) => r.id === roomId);
          if (room) {
            const newDevice = {
              id: deviceId,
              name: name.trim(),
              isActive: true,
            };

            const updatedDevices = {
              ...room.devices,
              [selectedType]: [
                ...(room.devices[selectedType] || []),
                newDevice,
              ],
            };

            updateRoom(roomId, { devices: updatedDevices });
          }

          // Reload configured devices to update all rooms
          await loadConfiguredDevices();

          showAlert('Success', 'Device configured successfully', 'success');
          router.back();
        } catch (error) {
          console.error('Error saving device info:', error);
          showAlert('Error', 'Failed to save device information', 'error');
        }
      } else {
        showAlert('Error', 'Failed to send WiFi configuration', 'error');
      }
    } catch (error) {
      console.error('Error sending WiFi config:', error);
      showAlert('Error', 'Failed to send WiFi configuration', 'error');
    } finally {
      setSendingDeviceId(null);
    }
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

  const handleNextStep = () => {
    if (!name.trim()) {
      showAlert('Error', 'Please enter a device name', 'error');
      return;
    }
    setStep('wifi-setup');
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await startScan();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderDeviceInfoStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Device</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Device Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter device name"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Choose Device Type</Text>
        <View style={styles.typeContainer}>
          {DEVICE_TYPES.map(({ type, name: typeName }) => {
            const Icon = deviceIcons[type];
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  selectedType === type && styles.typeButtonSelected,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <View style={styles.typeContent}>
                  <Icon
                    size={24}
                    color={selectedType === type ? '#2563eb' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type && styles.typeButtonTextSelected,
                    ]}
                  >
                    {typeName}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.button, !name.trim() && styles.buttonDisabled]}
          onPress={handleNextStep}
          disabled={!name.trim()}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfiguredDevices = () => (
    <View style={styles.configuredDevicesCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Configured Devices</Text>
      </View>
      {configuredDevices.length > 0 ? (
        <View style={styles.configuredDevicesList}>
          {configuredDevices.map((device) => {
            const DeviceIcon = deviceIcons[device.type] || Bluetooth;
            return (
              <View key={device.id} style={styles.configuredDeviceItem}>
                <View style={styles.deviceIcon}>
                  <DeviceIcon size={24} color="#2563eb" />
                </View>
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <Text style={styles.deviceInfo}>
                    Type: {device.type.replace('smart-', '').toUpperCase()}
                  </Text>
                  <Text style={styles.deviceInfo}>
                    SSID: {device.wifiConfig.ssid}
                  </Text>
                  <Text style={styles.deviceInfo}>
                    Last Connected:{' '}
                    {new Date(device.lastConnected).toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.noDevices}>
          <Text style={styles.noDevicesText}>No configured devices</Text>
          <Text style={styles.noDevicesSubtext}>
            Configure a device to see it here
          </Text>
        </View>
      )}
    </View>
  );

  const renderWifiSetupStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setStep('device-info')}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.title}>WiFi Setup</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2563eb"
            colors={['#2563eb']}
            progressBackgroundColor="#1e293b"
          />
        }
      >
        <View style={styles.wifiSetupContainer}>
          {/* {renderConfiguredDevices()} */}
          <View style={styles.wifiSetupCard}>
            <View style={styles.cardHeader}>
              <Wifi size={24} color="#2563eb" />
              <Text style={styles.cardTitle}>Network Configuration</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>WiFi Network (SSID)</Text>
                <View style={styles.inputContainer}>
                  <Wifi size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={ssid}
                    onChangeText={setSsid}
                    placeholder="Enter WiFi name"
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter WiFi password"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#64748b" />
                    ) : (
                      <Eye size={20} color="#64748b" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Port</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={port}
                    onChangeText={setPort}
                    placeholder="Enter port number"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.deviceSetupCard}>
            <View style={styles.cardHeader}>
              <Bluetooth size={24} color="#2563eb" />
              <Text style={styles.cardTitle}>Device Connection</Text>
            </View>

            <View style={styles.deviceSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Connected Devices</Text>
                <View style={styles.headerRight}>
                  {/* <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={startScan}
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <RefreshCw size={20} color="#ffffff" />
                    )}
                  </TouchableOpacity> */}
                  <Text style={styles.connectedCount}>
                    {connectedDevices.length} device
                    {connectedDevices.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.connectedDevices}>
                {connectedDevices.map((device) => (
                  <View key={device.id} style={styles.connectedDeviceInfo}>
                    <View style={styles.deviceIcon}>
                      <BluetoothConnected size={24} color="#22c55e" />
                    </View>
                    <View style={styles.deviceDetails}>
                      <Text style={styles.deviceName}>
                        {device.name || 'Unknown Device'}
                      </Text>
                      <Text style={styles.deviceId}>{device.id}</Text>
                    </View>
                    <View style={styles.deviceActions}>
                      <TouchableOpacity
                        style={[
                          styles.sendButton,
                          (!ssid ||
                            !password ||
                            sendingDeviceId === device.id) &&
                            styles.sendButtonDisabled,
                        ]}
                        onPress={() => sendWifiCredentials(device.id)}
                        disabled={
                          !ssid || !password || sendingDeviceId === device.id
                        }
                      >
                        {sendingDeviceId === device.id ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <Send size={20} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.disconnectButton,
                          connectingDeviceId === device.id &&
                            styles.disconnectButtonActive,
                        ]}
                        onPress={() => disconnectDevice(device.id)}
                        disabled={connectingDeviceId === device.id}
                      >
                        {connectingDeviceId === device.id ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <X size={20} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              {connectedDevices.length > 0 && (
                <TouchableOpacity
                  style={[
                    styles.sendToAllButton,
                    (!ssid || !password || sendingDeviceId !== null) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={() => {
                    // Send to all connected devices
                    connectedDevices.forEach((device) => {
                      sendWifiCredentials(device.id);
                    });
                  }}
                  disabled={!ssid || !password || sendingDeviceId !== null}
                >
                  {sendingDeviceId !== null ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Send
                        size={20}
                        color="#ffffff"
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.buttonText}>Send to All Devices</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.deviceSection1}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Available Devices</Text>
                <TouchableOpacity
                  style={[
                    styles.scanButton,
                    isScanning && styles.scanningButton,
                  ]}
                  onPress={startScan}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <RefreshCw size={20} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>

              {devices.length > 0 ? (
                <View style={styles.deviceList}>
                  {devices.map((device) => (
                    <TouchableOpacity
                      key={device.id}
                      style={[
                        styles.deviceItem,
                        connectingDeviceId === device.id &&
                          styles.deviceItemDisabled,
                      ]}
                      onPress={() => connectToDevice(device)}
                      disabled={connectingDeviceId === device.id}
                    >
                      <View style={styles.deviceIcon}>
                        <Bluetooth size={24} color="#2563eb" />
                      </View>
                      <View style={styles.deviceInfo}>
                        <Text style={styles.deviceName}>
                          {device.name || 'Unknown Device'}
                        </Text>
                        <Text style={styles.deviceId}>{device.id}</Text>
                      </View>
                      {connectingDeviceId === device.id ? (
                        <ActivityIndicator color="#2563eb" />
                      ) : (
                        <Bluetooth size={24} color="#2563eb" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.noDevices}>
                  <Text style={styles.noDevicesText}>No devices found</Text>
                  <Text style={styles.noDevicesSubtext}>
                    Make sure your ESP32 is in pairing mode
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {step === 'device-info' ? renderDeviceInfoStep() : renderWifiSetupStep()}
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
  stepContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb20',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  content: {
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  wifiSetupContainer: {
    padding: 20,
    gap: 24,
  },
  wifiSetupCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2563eb30',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceSetupCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2563eb30',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  form: {
    // marginBottom: 28,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    color: '#94a3b8',
    marginBottom: 12,
    fontFamily: 'Inter-Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2563eb30',
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Inter-Regular',
    height: '100%',
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  passwordToggle: {
    padding: 8,
    marginRight: -8,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#f8fafc',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  typeContainer: {
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  typeButtonSelected: {
    backgroundColor: '#2563eb10',
    borderColor: '#2563eb',
  },
  typeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  typeButtonText: {
    color: '#94a3b8',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    flex: 1,
  },
  typeButtonTextSelected: {
    color: '#2563eb',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#1e40af',
    opacity: 0.5,
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.5,
  },
  deviceSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  scanningButton: {
    backgroundColor: '#1e40af',
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanButtonIcon: {
    marginRight: 4,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  deviceList: {
    gap: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2563eb30',
    marginBottom: 12,
  },
  deviceItemDisabled: {
    opacity: 0.5,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  deviceInfo: {
    color: '#94a3b8',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  deviceName: {
    color: '#f8fafc',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  deviceId: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  connectIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDevices: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  noDevicesIcon: {
    marginBottom: 16,
  },
  noDevicesText: {
    color: '#f8fafc',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  noDevicesSubtext: {
    color: '#94a3b8',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  connectedDevices: {
    // marginTop: 20,
  },
  connectedDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2563eb30',
    marginBottom: 10,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sendButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disconnectButtonActive: {
    backgroundColor: '#ef4444',
    opacity: 0.5,
    shadowOpacity: 0,
  },
  sendToAllButton: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectedCount: {
    color: '#94a3b8',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  deviceSection1: {
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 10,
    marginRight: 12,
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  configuredDevicesCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2563eb30',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  configuredDevicesList: {
    gap: 12,
  },
  configuredDeviceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
});

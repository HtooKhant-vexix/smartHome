import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wifi, Lock, Send, RefreshCw } from 'lucide-react-native';
import { bluetoothService } from '../../services/bluetooth';
import { Device } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import NetInfo from '@react-native-community/netinfo';
import { CustomAlert } from '../../components/CustomAlert';

export default function WifiSetupScreen() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
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

  useEffect(() => {
    const initialize = async () => {
      try {
        // Request necessary permissions
        if (Platform.OS === 'android') {
          const permissions = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
          ];

          if (Platform.Version >= 31) {
            permissions.push(
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
            );
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

        // Start scanning for devices
        startScan();
      } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Error', 'Failed to initialize', 'error');
      }
    };

    initialize();
  }, []);

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
      const connected = await bluetoothService.connectToDevice(device.id);
      if (connected) {
        setSelectedDevice(device);
        showAlert('Success', 'Device connected successfully', 'success');
      } else {
        showAlert('Error', 'Failed to connect to device', 'error');
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      showAlert('Error', 'Failed to connect to device', 'error');
    }
  };

  const sendWifiCredentials = async () => {
    if (!selectedDevice) {
      showAlert('Error', 'No device selected', 'error');
      return;
    }

    if (!ssid || !password) {
      showAlert('Error', 'Please enter both SSID and password', 'error');
      return;
    }

    try {
      setIsSending(true);

      // Format the WiFi configuration data
      const wifiConfigData = {
        wifiConfig: {
          ssid: ssid,
          password: password,
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>WiFi Setup</Text>
          <Text style={styles.subtitle}>Connect your ESP32 device to WiFi</Text>
        </View>

        {/* WiFi Configuration Form */}
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
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Device Selection */}
        <View style={styles.deviceSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Devices</Text>
            <TouchableOpacity
              style={[styles.scanButton, isScanning && styles.scanningButton]}
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
                    selectedDevice?.id === device.id && styles.selectedDevice,
                  ]}
                  onPress={() => connectToDevice(device)}
                >
                  <View style={styles.deviceIcon}>
                    <Wifi size={24} color="#2563eb" />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>
                      {device.name || 'Unknown Device'}
                    </Text>
                    <Text style={styles.deviceId}>{device.id}</Text>
                  </View>
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

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!selectedDevice || !ssid || !password || isSending) &&
              styles.sendButtonDisabled,
          ]}
          onPress={sendWifiCredentials}
          disabled={!selectedDevice || !ssid || !password || isSending}
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
      </ScrollView>

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
  scrollView: {
    flex: 1,
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
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
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
  },
  deviceSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  scanButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 12,
  },
  scanningButton: {
    backgroundColor: '#1e40af',
  },
  deviceList: {
    gap: 12,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedDevice: {
    borderColor: '#2563eb',
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  deviceId: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  noDevices: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
  },
  noDevicesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  noDevicesSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    margin: 20,
    padding: 16,
    borderRadius: 16,
    height: 56,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});

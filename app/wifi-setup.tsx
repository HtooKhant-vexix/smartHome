import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
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
} from 'lucide-react-native';
import { bluetoothService } from '../services/bluetooth';
import { Device } from 'react-native-ble-plx';
import NetInfo from '@react-native-community/netinfo';
// import { CustomAlert } from '../../_components/CustomAlert';
import { CustomAlert } from '@/components/CustomAlert';

export default function WifiSetupScreen() {
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
  const [isRefreshing, setIsRefreshing] = useState(false);
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

    initialize();

    return () => {
      bluetoothService.stopScan();
    };
  }, [startScan]);

  const startScan = useCallback(async () => {
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
  }, [showAlert]);

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

  const sendWifiCredentials = async (deviceId?: string) => {
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
          port: parseInt(port) || 1883,
        },
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(wifiConfigData);

      // If deviceId is provided, send to that specific device
      if (deviceId) {
        const success = await bluetoothService.sendData(deviceId, jsonData);
        if (success) {
          showAlert(
            'Success',
            'WiFi configuration sent successfully',
            'success'
          );
        } else {
          showAlert('Error', 'Failed to send WiFi configuration', 'error');
        }
      } else {
        // Send to all connected devices
        const results = await Promise.all(
          connectedDevices.map(async (device) => {
            try {
              const success = await bluetoothService.sendData(
                device.id,
                jsonData
              );
              return { deviceId: device.id, success };
            } catch (error) {
              console.error(`Error sending to device ${device.id}:`, error);
              return { deviceId: device.id, success: false };
            }
          })
        );

        const successfulSends = results.filter(
          (result) => result.success
        ).length;
        if (successfulSends === connectedDevices.length) {
          showAlert(
            'Success',
            'WiFi configuration sent to all devices successfully',
            'success'
          );
        } else if (successfulSends > 0) {
          showAlert(
            'Partial Success',
            `WiFi configuration sent to ${successfulSends} out of ${connectedDevices.length} devices`,
            'info'
          );
        } else {
          showAlert(
            'Error',
            'Failed to send WiFi configuration to any device',
            'error'
          );
        }
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

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      // Update connected devices list
      setConnectedDevices(bluetoothService.getConnectedDevices());
      // Start a new scan
      await startScan();
    } catch (error) {
      console.error('Error refreshing:', error);
      showAlert('Error', 'Failed to refresh devices', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
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

        {/* Connected Devices */}
        {connectedDevices.length > 0 && (
          <View style={styles.deviceSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Connected Devices</Text>
              <View style={styles.headerRight}>
                <Text style={styles.connectedCount}>
                  {connectedDevices.length} device
                  {connectedDevices.length !== 1 ? 's' : ''}
                </Text>
                {/* <TouchableOpacity
                  style={[
                    styles.refreshButton,
                    isRefreshing && styles.refreshButtonActive,
                  ]}
                  onPress={onRefresh}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <ActivityIndicator color="#2563eb" />
                  ) : (
                    <RefreshCw size={20} color="#2563eb" />
                  )}
                </TouchableOpacity> */}
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
                        (!ssid || !password || isSending) &&
                          styles.sendButtonDisabled,
                      ]}
                      onPress={() => sendWifiCredentials(device.id)}
                      disabled={!ssid || !password || isSending}
                    >
                      {isSending ? (
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
                        <X size={20} color="#ef4444" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            {/* Send to All Button */}
            <TouchableOpacity
              style={[
                styles.sendToAllButton,
                (!ssid || !password || isSending) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendWifiCredentials()}
              disabled={!ssid || !password || isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Send size={20} color="#ffffff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Send to All Devices</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Available Devices */}
        <View style={styles.deviceSection1}>
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
    paddingBottom: 80,
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
  deviceSection1: {
    padding: 20,
    paddingBottom: 40,
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
    marginBottom: 16,
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
  },
  deviceItemDisabled: {
    opacity: 0.5,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    // backgroundColor: '#064e3b',
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
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#94a3b8',
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
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  connectedDevices: {
    gap: 12,
  },
  connectedDeviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  deviceDetails: {
    flex: 1,
  },
  disconnectButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    minWidth: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  disconnectButtonActive: {
    backgroundColor: '#7f1d1d',
  },
  deviceActions: {
    flexDirection: 'row',
    gap: 8,
  },
  passwordToggle: {
    padding: 8,
    marginRight: -8,
  },
  connectedCount: {
    fontSize: 14,
    color: '#94a3b8',
  },
  sendToAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  refreshButtonActive: {
    backgroundColor: '#1e40af',
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wifi, Lock, Send, Eye, EyeOff } from 'lucide-react-native';
// Bluetooth service removed
import NetInfo from '@react-native-community/netinfo';
// import { CustomAlert } from '../../_components/CustomAlert';
import { CustomAlert } from '@/components/CustomAlert';

export default function WifiSetupScreen() {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [port, setPort] = useState('1883');
  const [showPassword, setShowPassword] = useState(false);
  // Bluetooth-related state removed
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
        // Get current Wi-Fi SSID
        const state = await NetInfo.fetch();
        if (state.type === 'wifi' && state.details?.ssid) {
          setSsid(state.details.ssid);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Error', 'Failed to initialize', 'error');
      }
    };

    initialize();
  }, []);

  // Bluetooth functions removed

  const saveWifiCredentials = async () => {
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

      // Save configuration (you can implement your own storage logic here)
      console.log('WiFi Configuration:', wifiConfigData);

      showAlert('Success', 'WiFi configuration saved successfully', 'success');
    } catch (error) {
      console.error('Error saving WiFi config:', error);
      showAlert('Error', 'Failed to save WiFi configuration', 'error');
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
      // Refresh functionality simplified
    } catch (error) {
      console.error('Error refreshing:', error);
      showAlert('Error', 'Failed to refresh', 'error');
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

        {/* Save Configuration Button */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!ssid || !password || isSending) && styles.saveButtonDisabled,
            ]}
            onPress={saveWifiCredentials}
            disabled={!ssid || !password || isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Send size={20} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Save WiFi Configuration</Text>
              </>
            )}
          </TouchableOpacity>
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
  saveSection: {
    padding: 20,
    paddingBottom: 40,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
});

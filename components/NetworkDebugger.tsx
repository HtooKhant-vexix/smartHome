import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { mqttService } from '../services/mqttService';
import { networkDetector } from '../utils/networkDetection';

export const NetworkDebugger: React.FC = () => {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [currentBroker, setCurrentBroker] = useState<string>('unknown');

  const refreshNetworkInfo = async () => {
    try {
      const info = await networkDetector.getNetworkInfo();
      setNetworkInfo(info);
      setCurrentBroker(mqttService.getCurrentBroker());
    } catch (error) {
      console.error('Error getting network info:', error);
    }
  };

  const forceLocalBroker = async () => {
    try {
      await mqttService.forceLocalBroker();
      setCurrentBroker(mqttService.getCurrentBroker());
    } catch (error) {
      console.error('Error forcing local broker:', error);
    }
  };

  const forceCloudBroker = async () => {
    try {
      await mqttService.forceCloudBroker();
      setCurrentBroker(mqttService.getCurrentBroker());
    } catch (error) {
      console.error('Error forcing cloud broker:', error);
    }
  };

  useEffect(() => {
    refreshNetworkInfo();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Debugger</Text>

      <TouchableOpacity style={styles.button} onPress={refreshNetworkInfo}>
        <Text style={styles.buttonText}>Refresh Network Info</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={forceLocalBroker}>
        <Text style={styles.buttonText}>Force Local Broker</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={forceCloudBroker}>
        <Text style={styles.buttonText}>Force Cloud Broker</Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.label}>Current Broker:</Text>
        <Text style={styles.value}>{currentBroker}</Text>
      </View>

      {networkInfo && (
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Network Info:</Text>
          <Text style={styles.value}>
            SSID: {networkInfo.ssid || 'Unknown'}
          </Text>
          <Text style={styles.value}>
            IP: {networkInfo.ipAddress || 'Unknown'}
          </Text>
          <Text style={styles.value}>
            Is Local: {networkInfo.isLocalNetwork ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.value}>
            Connected: {networkInfo.isConnected ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.value}>Type: {networkInfo.networkType}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#0f172a',
    borderRadius: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  value: {
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 4,
  },
});

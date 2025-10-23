import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Wifi, WifiOff, Home, Globe } from 'lucide-react-native';
import { useSmartHomeStore } from '../store/useSmartHomeStore';

interface NetworkIndicatorProps {
  style?: any;
}

export const NetworkIndicator: React.FC<NetworkIndicatorProps> = ({
  style,
}) => {
  const { getNetworkInfo } = useSmartHomeStore();
  const networkInfo = getNetworkInfo();

  if (!networkInfo) {
    return (
      <View style={[styles.container, style]}>
        <WifiOff size={16} color="#ef4444" />
        <Text style={styles.text}>Unknown Network</Text>
      </View>
    );
  }

  const getNetworkIcon = () => {
    if (!networkInfo.isConnected) {
      return <WifiOff size={16} color="#ef4444" />;
    }

    if (networkInfo.isLocalNetwork) {
      return <Home size={16} color="#22c55e" />;
    }

    return <Globe size={16} color="#3b82f6" />;
  };

  const getNetworkText = () => {
    if (!networkInfo.isConnected) {
      return 'No Connection';
    }

    if (networkInfo.isLocalNetwork) {
      return `Home Network${networkInfo.ssid ? ` (${networkInfo.ssid})` : ''}`;
    }

    return `External Network${
      networkInfo.ssid ? ` (${networkInfo.ssid})` : ''
    }`;
  };

  const getBrokerInfo = () => {
    if (!networkInfo.isConnected) {
      return 'No MQTT Connection';
    }

    if (networkInfo.isLocalNetwork) {
      return 'Will try local broker first';
    }

    return 'Will use cloud broker (local not reachable)';
  };

  const getNetworkColor = () => {
    if (!networkInfo.isConnected) {
      return '#ef4444';
    }

    if (networkInfo.isLocalNetwork) {
      return '#22c55e';
    }

    return '#3b82f6';
  };

  return (
    <View style={[styles.container, style]}>
      {getNetworkIcon()}
      <View style={styles.textContainer}>
        <Text style={[styles.text, { color: getNetworkColor() }]}>
          {getNetworkText()}
        </Text>
        {networkInfo.ipAddress && (
          <Text style={styles.ipText}>
            IP: {networkInfo.ipAddress}
            {networkInfo.isLocalNetwork && ' (Home Network)'}
          </Text>
        )}
        <Text style={styles.brokerText}>{getBrokerInfo()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textContainer: {
    flex: 1,
    marginLeft: 6,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  ipText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  brokerText: {
    fontSize: 9,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 1,
    fontStyle: 'italic',
  },
});

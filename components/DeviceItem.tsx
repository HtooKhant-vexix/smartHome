import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Power } from 'lucide-react-native';

interface DeviceItemProps {
  title: string;
  icon: React.ElementType;
  isActive: boolean;
  onToggle: () => void;
}

export const DeviceItem = ({
  title,
  icon: Icon,
  isActive,
  onToggle,
}: DeviceItemProps) => {
  return (
    <View style={styles.deviceItem}>
      <View style={styles.deviceInfo}>
        <View style={styles.deviceIconContainer}>
          <Icon size={24} color="white" />
        </View>
        <View>
          <Text style={styles.deviceTitle}>{title}</Text>
          <Text style={styles.deviceStatus}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.toggleButton, isActive && styles.toggleButtonActive]}
        onPress={onToggle}
      >
        <Power size={20} color={isActive ? 'white' : '#94a3b8'} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  deviceStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
});

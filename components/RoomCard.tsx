import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

interface RoomCardProps {
  title: string;
  deviceCount: number;
  icon: React.ElementType;
}

export const RoomCard = ({ title, deviceCount, icon: Icon }: RoomCardProps) => {
  const router = useRouter();
  const roomType = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() =>
        router.push({
          pathname: '/room/[id]',
          params: { id: roomType },
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.roomCardHeader}>
        <View style={styles.roomIconContainer}>
          <Icon size={24} color="white" />
        </View>
      </View>
      <Text style={styles.roomTitle}>{title}</Text>
      <Text style={styles.roomSubtitle}>
        {deviceCount} {deviceCount === 1 ? 'device' : 'devices'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  roomCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  roomSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
});

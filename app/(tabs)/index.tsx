import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Cloud,
  Lightbulb,
  Monitor,
  Tv,
  Wind,
  Thermometer,
  Droplets,
  Gauge,
  Plus,
  Home,
  DoorOpen,
  BedDouble,
  Utensils,
  Bath,
  Sofa,
  Car,
  Briefcase,
  Dumbbell,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { RoomCard } from '../../components/RoomCard';
import { StatCard } from '../../components/StatCard';
import AddRoomModal from '../_components/AddRoomModal';
import {
  deviceIcons,
  getDeviceTitle,
  DeviceType,
} from '../../constants/defaultData';
import { useLocalSearchParams } from 'expo-router';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';

const { width } = Dimensions.get('window');

const ICON_MAP = {
  Home,
  DoorOpen,
  BedDouble,
  Utensils,
  Bath,
  Sofa,
  Tv,
  Car,
  Briefcase,
  Dumbbell,
};

interface DeviceCardProps {
  title: string;
  icon: React.ElementType;
  deviceCount: number;
  activeCount: number;
}

const DeviceCard = ({
  title,
  icon: Icon,
  deviceCount,
  activeCount,
}: DeviceCardProps) => {
  const router = useRouter();
  const deviceType = title.toLowerCase().replace(/\s+/g, '-');

  return (
    <TouchableOpacity
      style={styles.deviceCard}
      onPress={() => router.push(`/device/list?type=${deviceType}`)}
      activeOpacity={0.8}
    >
      <View style={styles.deviceCardHeader}>
        <View style={styles.deviceIconContainer}>
          <Icon size={24} color="white" />
        </View>
        <View style={styles.deviceStatusContainer}>
          <View style={styles.deviceStatus}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: activeCount > 0 ? '#22c55e' : '#ef4444' },
              ]}
            />
            <Text style={styles.deviceStatusText}>
              {activeCount} / {deviceCount}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.deviceTitle}>{title}</Text>
      <Text style={styles.deviceSubtitle}>
        {deviceCount} {deviceCount === 1 ? 'device' : 'devices'}
      </Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'devices'>('rooms');
  const [isAddRoomModalVisible, setIsAddRoomModalVisible] = useState(false);

  // Use Zustand store
  const rooms = useSmartHomeStore((state) => state.rooms);
  const mqttConnected = useSmartHomeStore((state) => state.mqtt.isConnected);
  const mqttStatus = useSmartHomeStore((state) => state.mqtt.status);

  const router = useRouter();
  const { type, id } = useLocalSearchParams();
  console.log(type);
  console.log('is connected', mqttConnected);

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName as keyof typeof ICON_MAP] || Home;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Htoo</Text>
            <Text style={styles.subtitle}>Welcome back to your smart home</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Weather Card */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.weatherCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.weatherHeader}>
            <View>
              <Text style={styles.temperature}>20°C</Text>
              <Text style={styles.weatherCondition}>Cloudy</Text>
              <Text style={styles.weatherDate}>Tue, November 23</Text>
            </View>
            <Cloud size={60} color="white" />
          </View>

          <View style={styles.weatherStats}>
            <StatCard
              label="Indoor temp"
              value="23° C"
              icon={<Thermometer size={16} color="#2563eb" />}
            />
            <StatCard
              label="Humidity"
              value="40%"
              icon={<Droplets size={16} color="#2563eb" />}
            />
            <StatCard
              label="Air Quality"
              value="Poor"
              icon={<Gauge size={16} color="#2563eb" />}
            />
          </View>
        </LinearGradient>

        {/* Room/Devices Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeTab === 'rooms' && styles.toggleButtonActive,
            ]}
            onPress={() => setActiveTab('rooms')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeTab === 'rooms' && styles.toggleButtonTextActive,
              ]}
            >
              Rooms
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeTab === 'devices' && styles.toggleButtonActive,
            ]}
            onPress={() => setActiveTab('devices')}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeTab === 'devices' && styles.toggleButtonTextActive,
              ]}
            >
              Devices
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'rooms' ? (
          <View style={styles.roomGrid}>
            {rooms.map((room) => (
              <RoomCard
                data={room}
                key={room.id}
                roomId={room.id}
                icon={getIconComponent(room.icon)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.deviceGrid}>
            {(Object.keys(deviceIcons) as DeviceType[])
              .map((t) => {
                const deviceCount = rooms.reduce(
                  (acc, r) => acc + (r.devices[t]?.length || 0),
                  0
                );
                const activeCount = rooms.reduce(
                  (acc, r) =>
                    acc + (r.devices[t]?.filter((d) => d.isActive).length || 0),
                  0
                );
                return { t, deviceCount, activeCount };
              })
              .filter(({ deviceCount }) => deviceCount > 0)
              .map(({ t, deviceCount, activeCount }) => (
                <DeviceCard
                  key={t}
                  title={getDeviceTitle(t)}
                  icon={deviceIcons[t]}
                  deviceCount={deviceCount}
                  activeCount={activeCount}
                />
              ))}
          </View>
        )}

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addDeviceButton}
          onPress={() => {
            if (activeTab === 'rooms') {
              setIsAddRoomModalVisible(true);
            } else {
              router.push('/device-setup');
            }
          }}
        >
          <Plus size={24} color="#2563eb" />
          <Text style={styles.addDeviceText}>
            Add new {activeTab === 'rooms' ? 'room' : 'device'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AddRoomModal
        visible={isAddRoomModalVisible}
        onClose={() => setIsAddRoomModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingBottom: 20,
  },
  scrollView: {
    paddingBottom: 70,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 4,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  temperature: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  weatherCondition: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: 'white',
    opacity: 0.9,
  },
  weatherDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'white',
    opacity: 0.7,
    marginTop: 4,
  },
  weatherStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  toggleButtonTextActive: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  deviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  deviceCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  deviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceStatusContainer: {
    alignItems: 'flex-end',
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  deviceStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
  },
  deviceTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  deviceSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 80,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  addDeviceText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#2563eb',
    marginLeft: 8,
  },
});

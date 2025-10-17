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
import { networkDetector, NetworkInfo } from '../../utils/networkDetection';
import { RefreshControl } from 'react-native';

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
  const [refreshing, setRefreshing] = useState(false);

  // Use Zustand store
  const rooms = useSmartHomeStore((state) => state.rooms);
  const mqttConnected = useSmartHomeStore((state) => state.mqtt.isConnected);
  const mqttStatus = useSmartHomeStore((state) => state.mqtt.status);
  const currentBroker = useSmartHomeStore((state) => state.mqtt.currentBroker);
  const sensorData = useSmartHomeStore((state) => state.sensorData);

  // Network information
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);

  // Get network info on component mount
  useEffect(() => {
    const getNetworkInfo = async () => {
      try {
        const info = await networkDetector.getNetworkInfo();
        setNetworkInfo(info);
      } catch (error) {
        console.error('Failed to get network info:', error);
      }
    };

    getNetworkInfo();

    // Set up network listener
    const unsubscribe = networkDetector.addNetworkListener((info) => {
      setNetworkInfo(info);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const router = useRouter();
  const { type, id } = useLocalSearchParams();

  // Pull to refresh functionality
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Update network info
      const info = await networkDetector.getNetworkInfo();
      setNetworkInfo(info);

      // Force MQTT reconnection check if needed
      const { connectMqtt } = useSmartHomeStore.getState();
      if (mqttStatus === 'error' || mqttStatus === 'disconnected') {
        await connectMqtt();
      }

      // Add a small delay to show the refresh animation
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle broker indicator tap
  const handleBrokerIndicatorTap = async () => {
    if (!networkInfo) return;

    // If on external network but using local broker, suggest switching to cloud
    if (!networkInfo.isLocalNetwork && currentBroker === 'local') {
      try {
        const { switchMqttBroker } = useSmartHomeStore.getState();
        const success = await switchMqttBroker('cloud');
        if (success) {
          console.log('Successfully switched to cloud broker');
        } else {
          console.error('Failed to switch to cloud broker');
        }
      } catch (error) {
        console.error('Error switching broker:', error);
      }
    } else {
      // Otherwise just refresh
      onRefresh();
    }
  };

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName as keyof typeof ICON_MAP] || Home;
  };

  // Network and broker indicator
  const getBrokerIndicator = () => {
    if (!networkInfo) return null;

    const isLocalNetwork = networkInfo.isLocalNetwork;
    const brokerColor = currentBroker === 'local' ? '#22c55e' : '#3b82f6';
    const brokerIcon = currentBroker === 'local' ? '🏠' : '☁️';
    const brokerText = currentBroker === 'local' ? 'Local' : 'Cloud';
    const networkText = isLocalNetwork ? 'Home Network' : 'External Network';

    // Show fallback indicator if we're on external network but using local broker
    const showFallbackWarning = !isLocalNetwork && currentBroker === 'local';

    return (
      <View style={styles.brokerIndicator}>
        {/* <View style={[styles.brokerIcon, { backgroundColor: brokerColor }]}>
          <Text style={styles.brokerIconText}>{brokerIcon}</Text>
        </View> */}
        <View
          style={[
            styles.connectionStatus,
            {
              backgroundColor: mqttConnected ? '#22c55e' : '#ef4444',
            },
          ]}
        >
          {/* <Text style={styles.connectionStatusText}> */}
          {/* {mqttConnected ? 'Connected' : 'Disconnected'} */}
          {/* </Text> */}
        </View>
        <View style={styles.brokerInfo}>
          <View style={styles.brokerTitleRow}>
            <Text style={styles.brokerTitle}>{brokerText}</Text>
            {showFallbackWarning && (
              <Text style={styles.fallbackIndicator}>⚠️</Text>
            )}
          </View>
          {/* <Text style={styles.brokerSubtitle}>{networkText}</Text> */}
          {/* {showFallbackWarning && (
            <Text style={styles.fallbackText}>Tap to switch to cloud</Text>
          )} */}
        </View>
      </View>
    );
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
            title="Refreshing..."
            titleColor="#2563eb"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Sixth Kendra</Text>
            <Text style={styles.subtitle}>Welcome back to your smart home</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Network and Broker Indicator */}
        <TouchableOpacity
          style={styles.brokerIndicatorTouchable}
          onPress={handleBrokerIndicatorTap}
          activeOpacity={0.8}
        >
          {getBrokerIndicator()}
        </TouchableOpacity>

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
              <Text style={styles.weatherDate}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <Cloud size={60} color="white" />
          </View>

          <View style={styles.weatherStats}>
            <StatCard
              label="Indoor temp"
              value={
                sensorData.temperature > 0
                  ? `${sensorData.temperature.toFixed(1)}° C`
                  : '--° C'
              }
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
                    acc +
                    (r.devices[t]?.filter((d) => d.isActive)?.length || 0),
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
    // paddingBottom: 30,
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

  // Broker and Network Indicator Styles
  brokerIndicator: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    // backgroundColor: '#1e293b',
    // marginHorizontal: 20,
    // marginBottom: 20,
    // paddingHorizontal: 16,
    // paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 4,
    marginTop: 4,
    marginBottom: -10,
    // borderWidth: 1,
    // borderColor: '#334155',
  },
  brokerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // justifyContent: 'center',
    // alignItems: 'center',
    marginRight: 12,
  },
  brokerIconText: {
    fontSize: 20,
  },
  brokerInfo: {
    flex: 1,
  },
  brokerTitleRow: {
    flexDirection: 'row',
    // alignItems: 'center',
    marginBottom: 2,
  },
  brokerTitle: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  fallbackIndicator: {
    fontSize: 10,
    color: '#f59e0b',
    marginLeft: 6,
  },
  fallbackText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  brokerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  connectionStatus: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  connectionStatusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  brokerIndicatorTouchable: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  X,
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
import { useRooms } from '../context/RoomContext';

interface RoomSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRoom: (roomId: string) => void;
}

const ICON_MAP = {
  Home,
  DoorOpen,
  BedDouble,
  Utensils,
  Bath,
  Sofa,
  Car,
  Briefcase,
  Dumbbell,
};

const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({
  visible,
  onClose,
  onSelectRoom,
}) => {
  const { rooms } = useRooms();

  const getIconComponent = (iconName: string) => {
    const Icon = ICON_MAP[iconName as keyof typeof ICON_MAP];
    if (!Icon) {
      console.warn(`Icon not found for room: ${iconName}`);
      return Home;
    }
    return Icon;
  };

  const getTotalDevices = (room: any) => {
    return Object.values(room.devices).reduce((total: number, devices: any) => {
      return total + (devices?.length || 0);
    }, 0);
  };

  const getActiveDevices = (room: any) => {
    return Object.values(room.devices).reduce((total: number, devices: any) => {
      return (
        total + (devices?.filter((device: any) => device.isActive)?.length || 0)
      );
    }, 0);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Room</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.roomList}
            showsVerticalScrollIndicator={false}
          >
            {rooms.map((room) => {
              const RoomIcon = getIconComponent(room.icon);
              const totalDevices = getTotalDevices(room);
              const activeDevices = getActiveDevices(room);

              return (
                <TouchableOpacity
                  key={room.id}
                  style={styles.roomItem}
                  onPress={() => {
                    onSelectRoom(room.id);
                    onClose();
                  }}
                >
                  <View style={styles.roomContent}>
                    <View style={styles.roomIconContainer}>
                      <RoomIcon size={24} color="white" />
                    </View>
                    <View style={styles.roomInfo}>
                      <Text style={styles.roomName}>{room.name}</Text>
                      {/* <View style={styles.deviceStatus}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor:
                                activeDevices > 0 ? '#22c55e' : '#ef4444',
                            },
                          ]}
                        />
                        <Text style={styles.deviceStatusText}>
                          {activeDevices} / {totalDevices} devices
                        </Text>
                      </View> */}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2563eb30',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2563eb20',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomList: {
    maxHeight: '100%',
  },
  roomItem: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2563eb30',
    overflow: 'hidden',
  },
  roomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  roomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#f8fafc',
    // marginBottom: 8,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
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
});

export default RoomSelectionModal;

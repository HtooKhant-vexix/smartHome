import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useRooms } from '../context/RoomContext';

interface RoomSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRoom: (roomId: string) => void;
}

const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({
  visible,
  onClose,
  onSelectRoom,
}) => {
  const { rooms } = useRooms();

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
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.roomList}>
            {rooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={styles.roomItem}
                onPress={() => {
                  onSelectRoom(room.id);
                  onClose();
                }}
              >
                <Text style={styles.roomName}>{room.name}</Text>
              </TouchableOpacity>
            ))}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2563eb30',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#fff',
  },
  roomList: {
    maxHeight: '100%',
  },
  roomItem: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  roomName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#fff',
  },
});

export default RoomSelectionModal;

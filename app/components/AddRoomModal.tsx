import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useRooms } from '../context/RoomContext';
import {
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
} from 'lucide-react-native';

const ROOM_ICONS = [
  { name: 'Home', component: Home },
  { name: 'DoorOpen', component: DoorOpen },
  { name: 'BedDouble', component: BedDouble },
  { name: 'Utensils', component: Utensils },
  { name: 'Bath', component: Bath },
  { name: 'Sofa', component: Sofa },
  { name: 'Tv', component: Tv },
  { name: 'Car', component: Car },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Dumbbell', component: Dumbbell },
];

interface AddRoomModalProps {
  visible: boolean;
  onClose: () => void;
}

const AddRoomModal: React.FC<AddRoomModalProps> = ({ visible, onClose }) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Home');
  const { addRoom } = useRooms();

  const handleSubmit = () => {
    if (name.trim()) {
      const newRoom = {
        name: name.trim(),
        icon: selectedIcon,
        devices: {
          'smart-light': [],
          'smart-ac': [],
          'smart-tv': [],
          'air-purifier': [],
        },
      };
      console.warn(newRoom, '..');
      addRoom(newRoom);
      setName('');
      setSelectedIcon('Home');
      onClose();
    }
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
            <Text style={styles.modalTitle}>Add New Room</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Room Name"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.sectionTitle}>Choose an Icon</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.iconScroll}
          >
            <View style={styles.iconGrid}>
              {ROOM_ICONS.map(({ name: iconName, component: Icon }) => (
                <TouchableOpacity
                  key={iconName}
                  style={[
                    styles.iconButton,
                    selectedIcon === iconName && styles.iconButtonSelected,
                  ]}
                  onPress={() => setSelectedIcon(iconName)}
                >
                  <Icon
                    size={24}
                    color={selectedIcon === iconName ? '#2563eb' : '#94a3b8'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={styles.buttonText}>Add Room</Text>
          </TouchableOpacity>
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
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#94a3b8',
    marginBottom: 12,
  },
  iconScroll: {
    marginBottom: 20,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563eb30',
  },
  iconButtonSelected: {
    backgroundColor: '#2563eb20',
    borderColor: '#2563eb',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#1e40af',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default AddRoomModal;

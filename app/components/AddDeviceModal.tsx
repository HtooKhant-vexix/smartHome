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
import { DeviceType, deviceIcons } from '../../constants/defaultData';

interface AddDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
}

const DEVICE_TYPES: { type: DeviceType; name: string }[] = [
  { type: 'smart-light', name: 'Smart Light' },
  { type: 'smart-ac', name: 'Smart AC' },
  { type: 'smart-tv', name: 'Smart TV' },
  { type: 'air-purifier', name: 'Air Purifier' },
];

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  visible,
  onClose,
  roomId,
}) => {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<DeviceType>('smart-light');
  const { rooms, updateRoom } = useRooms();

  const handleSubmit = () => {
    if (name.trim()) {
      const room = rooms.find((r) => r.id === roomId);
      if (room) {
        const newDevice = {
          id: Date.now().toString(),
          name: name.trim(),
          isActive: false,
        };

        const updatedDevices = {
          ...room.devices,
          [selectedType]: [...(room.devices[selectedType] || []), newDevice],
        };

        updateRoom(roomId, { devices: updatedDevices });
        setName('');
        setSelectedType('smart-light');
        onClose();
      }
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
            <Text style={styles.modalTitle}>Add New Device</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Device Name"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.sectionTitle}>Choose Device Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.typeScroll}
          >
            <View style={styles.typeGrid}>
              {DEVICE_TYPES.map(({ type, name: typeName }) => {
                const Icon = deviceIcons[type];
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      selectedType === type && styles.typeButtonSelected,
                    ]}
                    onPress={() => setSelectedType(type)}
                  >
                    <Icon
                      size={24}
                      color={selectedType === type ? '#2563eb' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        selectedType === type && styles.typeButtonTextSelected,
                      ]}
                    >
                      {typeName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.button, !name.trim() && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={styles.buttonText}>Add Device</Text>
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
  typeScroll: {
    marginBottom: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2563eb30',
    minWidth: 120,
  },
  typeButtonSelected: {
    backgroundColor: '#2563eb20',
    borderColor: '#2563eb',
  },
  typeButtonText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  typeButtonTextSelected: {
    color: '#2563eb',
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

export default AddDeviceModal;

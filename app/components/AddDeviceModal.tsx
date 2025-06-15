import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface AddDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  roomId: string;
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  visible,
  onClose,
  roomId,
}) => {
  const router = useRouter();

  React.useEffect(() => {
    if (visible) {
      router.push({
        pathname: '/device-setup',
        params: { roomId },
      });
      onClose();
    }
  }, [visible]);

  return null;
};

export default AddDeviceModal;

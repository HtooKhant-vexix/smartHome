// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useRooms } from '../context/RoomContext';
// import { Home, DoorOpen } from 'lucide-react-native';

// interface RoomCardProps {
//   roomId: string;
//   icon: React.ElementType;
// }

// export const RoomCard: React.FC<RoomCardProps> = ({ roomId, icon: Icon }) => {
//   const router = useRouter();
//   const { rooms } = useRooms();
//   const room = rooms.find((r) => r.id === roomId);

//   console.log(room);

//   if (!room) {
//     return null;
//   }

//   // Calculate total number of devices across all device types
//   const totalDevices = Object.values(room.devices || {}).reduce(
//     (total, devices) => total + (devices?.length || 0),
//     0
//   );

//   return (
//     <TouchableOpacity
//       style={styles.roomCard}
//       onPress={() => router.push(`/room/${roomId}`)}
//       activeOpacity={0.8}
//     >
//       <View style={styles.roomIcon}>
//         <Icon size={24} color="#2563eb" />
//       </View>
//       <Text style={styles.roomName}>{room.name}</Text>
//       <View style={styles.deviceCount}>
//         <Text style={styles.deviceCountText}>
//           {totalDevices} device
//           {totalDevices !== 1 ? 's' : ''}
//         </Text>
//       </View>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   roomCard: {
//     width: '47%',
//     backgroundColor: '#1e293b',
//     borderRadius: 16,
//     padding: 16,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#2563eb30',
//   },
//   roomIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#2563eb20',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   roomName: {
//     fontSize: 18,
//     fontFamily: 'Inter-SemiBold',
//     color: '#fff',
//     marginBottom: 4,
//   },
//   deviceCount: {
//     backgroundColor: '#2563eb20',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 12,
//     alignSelf: 'flex-start',
//   },
//   deviceCountText: {
//     fontSize: 12,
//     fontFamily: 'Inter-Medium',
//     color: '#2563eb',
//   },
// });

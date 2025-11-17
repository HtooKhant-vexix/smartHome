import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CreditCard as Edit3,
  MapPin,
  Leaf,
  Zap,
  Chrome as Home,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '../../_context/AuthContext';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: [string, string, ...string[]];
}

function StatCard({ icon, value, label, color }: StatCardProps) {
  return (
    <LinearGradient
      colors={color}
      style={styles.statCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

function MenuItem({ icon, title, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuIcon}>{icon}</View>
      <Text style={styles.menuTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity style={styles.editButton}>
            <Edit3 size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.profileCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/images/pfp.jpg')}
                style={styles.avatar}
              />
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              <Text style={styles.profileEmail}>
                {user?.email || 'user@example.com'}
              </Text>
              <View style={styles.locationContainer}>
                <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
                <Text style={styles.locationText}>
                  Member since{' '}
                  {user?.createdAt
                    ? new Date(user.createdAt).getFullYear()
                    : '2024'}
                </Text>
              </View>
            </View>
          </View>

          {/* <View style={styles.membershipContainer}>
            <View style={styles.membershipBadge}>
              <Award size={16} color="#2563eb" />
              <Text style={styles.membershipText}>Premium Member</Text>
            </View>
            <View style={styles.joinedContainer}>
              <Calendar size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.joinedText}>Joined Nov 2023</Text>
            </View>
          </View> */}
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard
            icon={<Home size={20} color="white" />}
            value="12"
            label="Connected Devices"
            color={['#2563eb', '#1d4ed8']}
          />
          <StatCard
            icon={<Zap size={20} color="white" />}
            value="120"
            label="kWh Saved"
            color={['#0ea5e9', '#0284c7']}
          />
          <StatCard
            icon={<Leaf size={20} color="white" />}
            value="85%"
            label="Efficiency Score"
            color={['#06b6d4', '#0891b2']}
          />
        </View>

        {/* Achievements */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Achievements</Text>
          <View style={styles.achievementsContainer}>
            <View style={styles.achievementItem}>
              <View style={styles.achievementIcon}>
                <Leaf size={24} color="#06b6d4" />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>Eco Warrior</Text>
                <Text style={styles.achievementDescription}>
                  Reduced energy consumption by 20%
                </Text>
              </View>
              <Text style={styles.achievementDate}>2 days ago</Text>
            </View>

            <View style={styles.achievementItem}>
              <View style={styles.achievementIcon}>
                <Zap size={24} color="#0ea5e9" />
              </View>
              <View style={styles.achievementContent}>
                <Text style={styles.achievementTitle}>Smart Saver</Text>
                <Text style={styles.achievementDescription}>
                  Saved $50 on electricity bill
                </Text>
              </View>
              <Text style={styles.achievementDate}>1 week ago</Text>
            </View>
          </View>
        </View> */}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.menuContainer}>
            <MenuItem
              icon={<Settings size={24} color="#2563eb" />}
              title="Account Settings"
              onPress={() => {}}
            />
            <MenuItem
              icon={<Home size={24} color="#2563eb" />}
              title="Manage Devices"
              onPress={() => {}}
            />
            <MenuItem
              icon={<LogOut size={24} color="#dc2626" />}
              title="Sign Out"
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#06b6d4',
    borderWidth: 3,
    borderColor: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  membershipContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  membershipText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#2563eb',
    marginLeft: 4,
  },
  joinedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinedText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  achievementsContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
  },
  achievementDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
  menuContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
});

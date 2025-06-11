import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Wifi,
  Shield,
  Bell,
  Moon,
  Smartphone,
  CircleHelp as HelpCircle,
  ChevronRight,
  User,
  Lock,
  Globe,
  Palette,
} from 'lucide-react-native';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightElement,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>{icon}</View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showArrow && !rightElement && (
          <ChevronRight size={20} color="#64748b" />
        )}
      </View>
    </TouchableOpacity>
  );
}

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoMode, setAutoMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>
            Customize your smart home experience
          </Text>
        </View>

        {/* Account Section */}
        <SettingSection title="Account">
          <SettingItem
            icon={<User size={24} color="#2563eb" />}
            title="Profile"
            subtitle="Manage your account information"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Lock size={24} color="#2563eb" />}
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Device Settings */}
        <SettingSection title="Device Settings">
          <SettingItem
            icon={<Wifi size={24} color="#2563eb" />}
            title="Network Settings"
            subtitle="Wi-Fi and connectivity options"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Smartphone size={24} color="#2563eb" />}
            title="Device Management"
            subtitle="Add, remove, and configure devices"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Shield size={24} color="#2563eb" />}
            title="Security"
            subtitle="Home security and access control"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Preferences */}
        <SettingSection title="Preferences">
          <SettingItem
            icon={<Bell size={24} color="#2563eb" />}
            title="Notifications"
            subtitle="Push notifications and alerts"
            showArrow={false}
            rightElement={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#334155', true: '#2563eb' }}
                thumbColor="white"
              />
            }
          />
          <SettingItem
            icon={<Moon size={24} color="#2563eb" />}
            title="Dark Mode"
            subtitle={darkMode ? 'On' : 'Off'}
            showArrow={false}
            rightElement={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#334155', true: '#2563eb' }}
                thumbColor="white"
              />
            }
          />
          <SettingItem
            icon={<Palette size={24} color="#2563eb" />}
            title="Theme"
            subtitle="Customize app appearance"
            onPress={() => {}}
          />
          <SettingItem
            icon={<Globe size={24} color="#2563eb" />}
            title="Language"
            subtitle="English"
            onPress={() => {}}
          />
        </SettingSection>

        {/* Automation */}
        <SettingSection title="Automation">
          <SettingItem
            icon={<Moon size={24} color="#2563eb" />}
            title="Auto Mode"
            subtitle="Automatically adjust devices based on time"
            showArrow={false}
            rightElement={
              <Switch
                value={autoMode}
                onValueChange={setAutoMode}
                trackColor={{ false: '#334155', true: '#2563eb' }}
                thumbColor="white"
              />
            }
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingItem
            icon={<HelpCircle size={24} color="#2563eb" />}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => {}}
          />
        </SettingSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Sixth Kendra Smart Home App</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          {/* <Text style={styles.appCredit}>Designed by Saurabh Dubey</Text> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 4,
  },
  section: {
    marginBottom: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingTop: 0,
    paddingHorizontal: 20,
    marginBottom: 70,
  },
  appInfoText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#94a3b8',
    marginBottom: 8,
  },
  appCredit: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#64748b',
  },
});

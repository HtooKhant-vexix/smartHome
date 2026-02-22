import { Tabs } from 'expo-router';
import {
  Chrome as Home,
  Settings,
  User,
  ChartPie,
} from 'lucide-react-native';
import { View } from 'react-native';
import { AuthGuard } from '../../components/AuthGuard';

export default function TabLayout() {
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#1e293b',
            borderTopColor: 'transparent',
            // borderTopWidth: 0,
            marginHorizontal: 10,
            borderRadius: 40,
            position: 'absolute',
            bottom: 17,
            height: 80,
            paddingTop: 20,
            borderColor: '#2563eb90',
            borderWidth: 1,
          },
          tabBarIconStyle: {
            fontSize: 20,
          },
          tabBarActiveTintColor: 'white',
          tabBarInactiveTintColor: 'white',
          // tabBarLabelStyle: {
          //   fontFamily: 'Inter-Medium',
          //   fontSize: 12,
          //   marginTop: 4,
          // },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, size, color }) => (
              <View
                style={{
                  backgroundColor: focused ? '#2563eb' : 'transparent',
                  borderRadius: 9999,
                  padding: 16,
                }}
              >
                <Home size={size} color={'white'} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: 'Analytics',
            tabBarIcon: ({ focused, size, color }) => (
              <View
                style={{
                  backgroundColor: focused ? '#2563eb' : 'transparent',
                  borderRadius: 9999,
                  padding: 16,
                }}
              >
                <ChartPie size={size} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ focused, size, color }) => (
              <View
                style={{
                  backgroundColor: focused ? '#2563eb' : 'transparent',
                  borderRadius: 9999,
                  padding: 16,
                }}
              >
                <Settings size={size} color={color} />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, size, color }) => (
              <View
                style={{
                  backgroundColor: focused ? '#2563eb' : 'transparent',
                  borderRadius: 9999,
                  padding: 16,
                }}
              >
                <User size={size} color={color} />
              </View>
            ),
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}

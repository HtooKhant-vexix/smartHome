import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
import { useSmartHomeStore } from '@/store/useSmartHomeStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Initialize the Zustand store
  const initializeMqtt = useSmartHomeStore((state) => state.initializeMqtt);
  const loadConfiguredDevices = useSmartHomeStore(
    (state) => state.loadConfiguredDevices
  );

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Initialize MQTT and load devices when app starts
    initializeMqtt();
    loadConfiguredDevices();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 80,
          contentStyle: { backgroundColor: '#000' },
          presentation: 'transparentModal',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: 'fade',
            animationDuration: 80,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="+not-found"
          options={{
            animation: 'slide_from_right',
            animationDuration: 80,
            gestureEnabled: true,
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}

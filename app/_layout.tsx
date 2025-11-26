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
import { useSmartHomeStore } from '@/store/useSmartHomeStore';
import { AuthProvider } from '../_context/AuthContext';
import { CustomAlert } from '../components/CustomAlert';

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
  const initializeSmartHome = useSmartHomeStore((state) => state.initializeSmartHome);
  const loadConfiguredDevices = useSmartHomeStore(
    (state) => state.loadConfiguredDevices
  );
  const error = useSmartHomeStore((state) => state.error);
  const clearError = useSmartHomeStore((state) => state.clearError);

  const isHydrated = useSmartHomeStore((state) => state.isHydrated);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Initialize Smart Home Service and load devices when app starts
    // Only if store is hydrated (persisted data loaded)
    if (isHydrated) {
      initializeSmartHome();
      loadConfiguredDevices();
    }
  }, [isHydrated, initializeSmartHome, loadConfiguredDevices]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 80,
          contentStyle: { backgroundColor: '#0f172a' },
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
      <CustomAlert
        visible={!!error}
        title="Error"
        message={error || ''}
        type="error"
        onClose={clearError}
      />
    </AuthProvider>
  );
}

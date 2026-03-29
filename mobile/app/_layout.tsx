import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { SplashOverlay } from '@/components/SplashOverlay';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { SocketProvider } from '@/context/SocketContext';
import { registerPushToken } from '@/utils/registerPushToken';
import '@/i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

// Android requires explicit notification channels for sound/vibration to work
if (Platform.OS === 'android') {
  // Status updates from medic (ACCEPTED, ON_THE_WAY, ARRIVED, DONE, CANCELED)
  Notifications.setNotificationChannelAsync('order_updates', {
    name: 'Статус заказа',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0d9488',
  });
  // Silent channel for persistent background status notification
  Notifications.setNotificationChannelAsync('tracking_status', {
    name: 'Трекинг (фон)',
    importance: Notifications.AndroidImportance.LOW,
    sound: undefined,
    vibrationPattern: undefined,
  });
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, [loaded]);

  if (!loaded) return null;
  if (showSplash) return <SplashOverlay />;

  return (
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <RootLayoutNav />
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { token, isLoading } = useAuth();
  const { isLoaded, isFirstLaunch } = useLanguage();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isLoaded) return; // wait for both stores

    const inLangPicker = segments[0] === 'language-picker';

    // First launch → show language picker before auth
    if (isFirstLaunch) {
      if (!inLangPicker) router.replace('/language-picker');
      return;
    }

    const inAuth = segments[0] === 'auth';
    if (!token && !inAuth) {
      router.replace('/auth');
    } else if (token && inAuth) {
      router.replace('/(tabs)');
    }
  }, [isLoaded, isFirstLaunch, token, segments, isLoading]);

  useEffect(() => {
    if (token) registerPushToken(token);
  }, [token]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="language-picker" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="service" options={{ headerShown: false }} />
        <Stack.Screen name="order" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

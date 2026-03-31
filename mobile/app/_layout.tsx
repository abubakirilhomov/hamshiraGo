import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { SplashOverlay } from '@/components/SplashOverlay';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { SocketProvider } from '@/context/SocketContext';
import { ToastProvider } from '@/context/ToastContext';
import { registerPushToken } from '@/utils/registerPushToken';
import { reportError } from '@/utils/reportError';
import { trackEvent, flushPendingEvents } from '@/utils/analytics';
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
    <ErrorBoundary appType="mobile">
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <RootLayoutNav />
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { token, isLoading } = useAuth();
  const { isLoaded, isFirstLaunch } = useLanguage();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_completed')
      .then((value) => setOnboardingDone(value === 'true'))
      .catch(() => setOnboardingDone(true)); // skip onboarding if storage fails
  }, []);

  useEffect(() => {
    if (isLoading || !isLoaded || onboardingDone === null) return; // wait for all stores

    const inOnboarding = segments[0] === 'onboarding';
    const inLangPicker = segments[0] === 'language-picker';

    // First time ever → show onboarding slides
    if (!onboardingDone) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    // First launch (no language chosen yet) → show language picker before auth
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
  }, [isLoaded, isFirstLaunch, token, segments, isLoading, onboardingDone]);

  useEffect(() => {
    if (token) registerPushToken(token);
  }, [token]);

  // Analytics: track app open and flush pending events
  useEffect(() => {
    if (isLoading) return;
    trackEvent('app_opened').catch(() => {});
    flushPendingEvents().catch(() => {});
  }, [isLoading]);

  // Navigate when user taps a push notification (app in background)
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | Record<string, string>
          | undefined;
        if (!data) return;
        if (data.type === 'order' && data.orderId) {
          router.push(`/order/track?id=${data.orderId}`);
        } else if (data.type === 'course') {
          router.push('/courses');
        } else if (data.type === 'referral') {
          router.push('/referral');
        }
      },
    );
    return () => subscription.remove();
  }, []);

  // Handle notification that launched the app from killed state
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as
        | Record<string, string>
        | undefined;
      if (!data) return;
      if (data.type === 'order' && data.orderId) {
        router.push(`/order/track?id=${data.orderId}`);
      } else if (data.type === 'course') {
        router.push('/courses');
      } else if (data.type === 'referral') {
        router.push('/referral');
      }
    });
  }, []);

  useEffect(() => {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      reportError({
        message: error.message,
        stacktrace: error.stack,
        errorCode: isFatal ? 'FATAL_ERROR' : 'JS_ERROR',
        appType: 'mobile',
      });
      originalHandler(error, isFatal);
    });
    return () => ErrorUtils.setGlobalHandler(originalHandler);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <OfflineBanner />
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
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

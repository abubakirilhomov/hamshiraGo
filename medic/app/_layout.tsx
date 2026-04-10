import * as Sentry from '@sentry/react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import 'react-native-reanimated';
import { setupSslPinning } from '@/utils/sslPinning';

import { ONBOARDING_DONE_KEY } from './onboarding';

import { apiFetch } from '@/constants/api';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { SplashOverlay } from '@/components/SplashOverlay';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { SocketProvider } from '@/context/SocketContext';
import { ToastProvider, useToast } from '@/context/ToastContext';
import '@/i18n';
import {
  hasBackgroundLocationPermission,
  setBackgroundLocationToken,
  stopBackgroundLocationUpdates,
} from '@/utils/backgroundLocation';
import { registerPushToken } from '@/utils/registerPushToken';
import { reportError } from '@/utils/reportError';
import { trackEvent, flushPendingEvents } from '@/utils/analytics';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  enabled: !__DEV__,
});

// Show notifications in foreground with sound
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});


export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

// Android requires explicit notification channels for sound/vibration to work
if (Platform.OS === 'android') {
  // New order invitation — максимальный приоритет, пробивает DND
  Notifications.setNotificationChannelAsync('new_orders', {
    name: 'Новый заказ',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    vibrationPattern: [0, 500, 250, 500],
    lightColor: '#0d9488',
    bypassDnd: true,
  });
  // Status updates from client (CANCELED, DONE)
  Notifications.setNotificationChannelAsync('order_updates', {
    name: 'Статус заказа',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0d9488',
  });
  // Silent channel for persistent background status notification
  Notifications.setNotificationChannelAsync('tracking_status', {
    name: 'Активный заказ (фон)',
    importance: Notifications.AndroidImportance.LOW,
    sound: undefined,
    vibrationPattern: undefined,
  });
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setupSslPinning();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync();
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, [loaded]);

  if (!loaded) return null;
  if (showSplash) return <SplashOverlay />;

  return (
    <ErrorBoundary appType="medic">
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
  const { token, medic, isLoading } = useAuth();
  const { isLoaded, isFirstLaunch } = useLanguage();
  const { t } = useTranslation();
  const segments = useSegments();
  const router = useRouter();
  const lastLocationSyncTs = useRef(0);
  const lastPermissionReminderTs = useRef(0);
  const lastAutoOfflineAlertTs = useRef(0);
  const { showToast } = useToast();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  // Load onboarding completion flag from AsyncStorage (re-check when navigating back)
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_DONE_KEY)
      .then((val) => setOnboardingDone(val === 'true'))
      .catch(() => setOnboardingDone(true)); // skip onboarding if storage fails
  }, [segments]);

  useEffect(() => {
    if (isLoading || !isLoaded || onboardingDone === null) return; // wait for all stores

    const inOnboarding = segments[0] === 'onboarding';
    const inLangPicker = segments[0] === 'language-picker';

    // First time ever → show onboarding slides
    if (!onboardingDone) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    // First launch (language not yet chosen) → show language picker before auth
    if (isFirstLaunch) {
      if (!inLangPicker) router.replace('/language-picker');
      return;
    }

    const inAuth = segments[0] === 'auth';
    if (!token && !inAuth) {
      router.replace('/auth');
    } else if (token && inAuth) {
      const role = medic?.role ?? 'medic';
      if (role === 'doctor') {
        router.replace('/(doctor-tabs)');
      } else {
        router.replace('/(tabs)');
      }
    }
  }, [isLoaded, isFirstLaunch, token, segments, isLoading, onboardingDone]);

  // Register push token whenever the medic logs in
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
        if (data.type === 'consultation' && data.consultationId) {
          router.push(`/doctor-consultation/${data.consultationId}`);
        } else if (data.type === 'order' && data.orderId) {
          router.push(`/order/${data.orderId}`);
        } else if (data.type === 'invite') {
          router.push('/(tabs)/');
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
      if (data.type === 'consultation' && data.consultationId) {
        router.push(`/doctor-consultation/${data.consultationId}`);
      } else if (data.type === 'order' && data.orderId) {
        router.push(`/order/${data.orderId}`);
      } else if (data.type === 'invite') {
        router.push('/(tabs)/');
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
        appType: 'medic',
      });
      originalHandler(error, isFatal);
    });
    return () => ErrorUtils.setGlobalHandler(originalHandler);
  }, []);

  useEffect(() => {
    setBackgroundLocationToken(token ?? null);
    if (!token || !medic?.isOnline) {
      stopBackgroundLocationUpdates().catch(() => {});
    }
  }, [token, medic?.isOnline]);

  const remindBackgroundPermission = useCallback(async () => {
    if (!token || !medic?.isOnline) return;
    const now = Date.now();
    if (now - lastPermissionReminderTs.current < 5 * 60_000) return;

    try {
      const hasPermission = await hasBackgroundLocationPermission();
      if (hasPermission) return;
      lastPermissionReminderTs.current = now;
      Alert.alert(
        t('common.locationPermission'),
        t('common.alwaysAllow'),
        [
          { text: t('common.back'), style: 'cancel' },
          {
            text: t('common.openSettings'),
            onPress: () => {
              Linking.openSettings().catch(() => {});
            },
          },
        ],
      );
    } catch {
      // ignore
    }
  }, [token, medic?.isOnline]);

  const syncOnlineLocation = useCallback(async () => {
    if (!token || !medic?.isOnline) return;

    const now = Date.now();
    // Avoid spamming endpoint when app rapidly changes state
    if (now - lastLocationSyncTs.current < 60_000) return;
    lastLocationSyncTs.current = now;

    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await apiFetch('/medics/location', {
        method: 'PATCH',
        token,
        body: JSON.stringify({
          isOnline: true,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        }),
      });
    } catch {
      // silent: location sync is best-effort
    }
  }, [token, medic?.isOnline]);

  useEffect(() => {
    syncOnlineLocation();
  }, [syncOnlineLocation]);

  useEffect(() => {
    remindBackgroundPermission();
  }, [remindBackgroundPermission]);

  useEffect(() => {
    if (!token || !medic) return;
    if (medic.onlineDisabledReason !== 'INACTIVE_5H') return;
    const now = Date.now();
    if (now - lastAutoOfflineAlertTs.current < 60_000) return;
    lastAutoOfflineAlertTs.current = now;
    showToast(
      'Онлайн отключён автоматически. Вы были неактивны более 5 часов.',
      'info',
      5000,
    );
  }, [token, medic?.onlineDisabledReason]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        syncOnlineLocation();
        remindBackgroundPermission();
      }
    });
    return () => sub.remove();
  }, [syncOnlineLocation, remindBackgroundPermission]);

  return (
    <ThemeProvider value={DefaultTheme}>
      <OfflineBanner />
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="language-picker" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(doctor-tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="order/[id]"
          options={{ title: 'Детали заказа', headerBackTitle: 'Назад' }}
        />
        <Stack.Screen
          name="doctor-consultation/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="verification"
          options={{ title: 'Верификация аккаунта', headerBackTitle: 'Назад' }}
        />
        <Stack.Screen name="work-zone" options={{ headerBackTitle: 'Назад' }} />
      </Stack>
    </ThemeProvider>
  );
}

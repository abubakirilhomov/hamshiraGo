import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';
import { API_BASE } from '@/constants/api';

export async function reportError(params: {
  message: string;
  stacktrace?: string;
  screen?: string;
  errorCode?: string;
  userId?: string;
  appType: 'mobile' | 'medic';
}) {
  Sentry.captureException(new Error(params.message), {
    tags: { screen: params.screen, errorCode: params.errorCode, appType: params.appType },
    extra: { stacktrace: params.stacktrace },
  });

  try {
    await fetch(`${API_BASE}/client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        deviceInfo: `${Platform.OS} ${Platform.Version}`,
        appVersion: Constants.expoConfig?.version ?? 'unknown',
      }),
    });
  } catch { /* never throw */ }
}

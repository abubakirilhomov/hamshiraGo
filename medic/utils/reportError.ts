import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_BASE } from '@/constants/api';

export async function reportError(params: {
  message: string;
  stacktrace?: string;
  screen?: string;
  errorCode?: string;
  userId?: string;
  appType: 'mobile' | 'medic';
}) {
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

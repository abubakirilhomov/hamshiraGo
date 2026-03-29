import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE } from '@/constants/api';

export async function registerPushToken(authToken: string): Promise<void> {
  try {
    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.warn('[push] No EAS projectId found. Run `eas init` and set the projectId in app.json extra.eas.projectId.');
      return;
    }
    if (projectId === 'REPLACE_WITH_EAS_PROJECT_ID') {
      console.warn('[push] EAS projectId is a placeholder ("REPLACE_WITH_EAS_PROJECT_ID"). Push notifications will NOT work. Run `eas init` to generate a real project ID and update app.json.');
      return;
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync({ projectId });

    const res = await fetch(`${API_BASE}/auth/push-token`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token: pushToken }),
    });
    if (!res.ok) console.warn('Failed to register push token:', res.status);
  } catch (err) {
    console.warn('[push] registerPushToken failed:', err);
  }
}

import { initializeSslPinning } from 'react-native-ssl-public-key-pinning';
import { Platform } from 'react-native';

/**
 * Initialize SSL certificate pinning for the HamshiraGo API.
 * Only works in production builds (not Expo Go).
 * Fails silently in dev to not block development.
 */
export async function setupSslPinning(): Promise<void> {
  // Skip on web and in dev (Expo Go doesn't support native modules)
  if (Platform.OS === 'web' || __DEV__) return;

  try {
    await initializeSslPinning({
      'hamshirago-production-0a65.up.railway.app': {
        includeSubdomains: false,
        publicKeyHashes: [
          // Primary: leaf certificate
          'VYxe9LAwK2QozwAdcQXon+QWur/Wn6o01PdWoMq1jiw=',
          // Backup: intermediate CA
          'kZwN96eHtZftBWrOZUsd6cA4es80n3NzSk/XtYz2EqQ=',
        ],
      },
    });
    console.log('[SSL] Certificate pinning initialized');
  } catch (err) {
    // Don't crash app if pinning fails — log and continue
    console.warn('[SSL] Certificate pinning failed to initialize:', err);
  }
}

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// LiveKit is a native module — lazy load to avoid crash in Expo Go
let LiveKitRoom: any = null;
let VideoTrack: any = null;
let AudioSession: any = null;
let useTracks: any = () => [];
let useParticipants: any = () => [];
let useLocalParticipant: any = () => ({ localParticipant: null });
let isTrackReference: any = () => false;
let Track: any = { Source: { Camera: 'camera', ScreenShare: 'screen_share' } };
let livekitAvailable = false;

try {
  const lk = require('@livekit/react-native');
  LiveKitRoom = lk.LiveKitRoom;
  VideoTrack = lk.VideoTrack;
  AudioSession = lk.AudioSession;
  useTracks = lk.useTracks;
  useParticipants = lk.useParticipants;
  useLocalParticipant = lk.useLocalParticipant ?? (() => ({ localParticipant: null }));
  isTrackReference = lk.isTrackReference;
  Track = require('livekit-client').Track;
  livekitAvailable = true;
} catch {
  // LiveKit not available (Expo Go)
}

// ─── Timer hook ──────────────────────────────────────────────────────────────

function useCallTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function VideoCallScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const { token: authToken } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  const timer = useCallTimer(connected);

  // Initialize call
  useEffect(() => {
    if (!livekitAvailable || !consultationId || !authToken) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        if (AudioSession) await AudioSession.startAudioSession();

        const data = await apiFetch<{ token: string; serverUrl: string; roomName: string }>(
          `/consultations/${consultationId}/call`,
          { token: authToken, method: 'POST' },
        );
        setLivekitToken(data.token);
        setServerUrl(data.serverUrl);
      } catch (err: any) {
        toast.show(err.message ?? 'Error', 'error');
        router.back();
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      if (AudioSession) AudioSession.stopAudioSession();
    };
  }, [consultationId, authToken]);

  const handleEndCall = useCallback(async () => {
    try {
      if (authToken && consultationId) {
        await apiFetch(`/consultations/${consultationId}/call/end`, {
          token: authToken,
          method: 'POST',
        });
      }
    } catch { /* ignore */ }
    router.back();
  }, [authToken, consultationId]);

  // ─── LiveKit not available — fallback ─────────────────────────────
  if (!livekitAvailable) {
    return (
      <View style={s.fullDark}>
        <View style={[s.center, { paddingTop: insets.top }]}>
          <View style={s.fallbackIcon}>
            <FontAwesome name="video-camera" size={40} color={Theme.textTertiary} />
          </View>
          <Text style={s.fallbackTitle}>{t('videoCall.error')}</Text>
          <Text style={s.fallbackSubtext}>
            Videozvonki requires dev build. Expo Go is not supported.
          </Text>
          <Pressable
            style={({ pressed }) => [s.fallbackBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.back()}
          >
            <Text style={s.fallbackBtnText}>{t('nps.done')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.fullDark}>
        <View style={[s.center, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={s.loadingText}>{t('videoCall.connecting')}</Text>
        </View>
      </View>
    );
  }

  // ─── Error — no token ─────────────────────────────────────────────
  if (!livekitToken || !serverUrl) {
    return (
      <View style={s.fullDark}>
        <View style={[s.center, { paddingTop: insets.top }]}>
          <Text style={s.errorText}>{t('videoCall.error')}</Text>
          <Pressable
            style={({ pressed }) => [s.fallbackBtn, pressed && { opacity: 0.85 }]}
            onPress={() => router.back()}
          >
            <Text style={s.fallbackBtnText}>{t('nps.done')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={livekitToken}
      connect
      audio={micEnabled}
      video={camEnabled}
      options={{ adaptiveStream: true, dynacast: true }}
      onConnected={() => setConnected(true)}
      onDisconnected={() => {
        setConnected(false);
        router.back();
      }}
    >
      <View style={s.fullDark}>
        {/* Remote video / Video layout */}
        <VideoLayout insets={insets} timer={timer} />

        {/* Bottom control bar — glassmorphism */}
        <View style={[s.controlBar, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          {/* Mic toggle */}
          <Pressable
            style={({ pressed }) => [
              s.controlBtn,
              !micEnabled && s.controlBtnMuted,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setMicEnabled((v) => !v)}
          >
            <FontAwesome
              name={micEnabled ? 'microphone' : 'microphone-slash'}
              size={20}
              color={micEnabled ? Theme.text : '#ffffff'}
            />
          </Pressable>

          {/* End call */}
          <Pressable
            style={({ pressed }) => [s.endCallBtn, pressed && { opacity: 0.85, transform: [{ scale: 0.95 }] }]}
            onPress={handleEndCall}
          >
            <FontAwesome
              name="phone"
              size={24}
              color="#ffffff"
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </Pressable>

          {/* Camera toggle */}
          <Pressable
            style={({ pressed }) => [
              s.controlBtn,
              !camEnabled && s.controlBtnMuted,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setCamEnabled((v) => !v)}
          >
            <FontAwesome
              name={camEnabled ? 'video-camera' : 'eye-slash'}
              size={18}
              color={camEnabled ? Theme.text : '#ffffff'}
            />
          </Pressable>
        </View>
      </View>
    </LiveKitRoom>
  );
}

// ─── Video Layout ────────────────────────────────────────────────────────────

function VideoLayout({ insets, timer }: { insets: { top: number }; timer: string }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const participants = useParticipants();

  const remoteTracks = tracks.filter(
    (t: any) => isTrackReference(t) && !t.participant.isLocal,
  );
  const localTrack = tracks.find(
    (t: any) => isTrackReference(t) && t.participant.isLocal && t.source === Track.Source.Camera,
  );

  // Get remote participant name
  const remoteName = remoteTracks.length > 0
    ? remoteTracks[0]?.participant?.name ?? 'Shifokor'
    : 'Shifokor';

  return (
    <View style={s.videoContainer}>
      {/* Remote video */}
      {remoteTracks.length > 0 && isTrackReference(remoteTracks[0]) ? (
        <VideoTrack trackRef={remoteTracks[0]} style={s.remoteVideo} />
      ) : (
        <View style={s.remoteVideo}>
          <View style={s.remoteAvatarCircle}>
            <FontAwesome name="user-md" size={48} color="rgba(255,255,255,0.4)" />
          </View>
          <Text style={s.waitingText}>Shifokorni kutilmoqda...</Text>
        </View>
      )}

      {/* Header overlay */}
      <View style={[s.headerOverlay, { paddingTop: insets.top + 12 }]}>
        <Text style={s.headerName}>{remoteName}</Text>
        <Text style={s.headerTimer}>{timer}</Text>
      </View>

      {/* Local video preview — top right */}
      {localTrack && isTrackReference(localTrack) && VideoTrack && (
        <View style={[s.localVideoWrap, { top: insets.top + 60 }]}>
          <VideoTrack trackRef={localTrack} style={s.localVideo} />
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  fullDark: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },

  /* Fallback */
  fallbackIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
  },
  fallbackSubtext: {
    fontFamily: Fonts.inter,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  fallbackBtn: {
    backgroundColor: Theme.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
  },
  fallbackBtnText: {
    fontFamily: Fonts.manropeSb,
    color: '#ffffff',
    fontSize: 15,
  },
  loadingText: {
    fontFamily: Fonts.inter,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
  },
  errorText: {
    fontFamily: Fonts.manropeSb,
    color: '#EF4444',
    fontSize: 16,
  },

  /* Video layout */
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteAvatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  waitingText: {
    fontFamily: Fonts.inter,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
  },

  /* Header overlay */
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  headerName: {
    fontFamily: Fonts.manropeSb,
    fontSize: 17,
    color: '#ffffff',
  },
  headerTimer: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  /* Local video preview */
  localVideoWrap: {
    position: 'absolute',
    right: 16,
    width: 120,
    height: 160,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  localVideo: {
    flex: 1,
  },

  /* Control bar */
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnMuted: {
    backgroundColor: Theme.surfaceContainerLow,
  },
  endCallBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  LiveKitRoom,
  VideoTrack,
  AudioSession,
  useTracks,
  useParticipants,
  isTrackReference,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function VideoCallScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId: string }>();
  const { token: authToken } = useAuth();
  const { t } = useTranslation();
  const toast = useToast();

  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [camEnabled, setCamEnabled] = useState(true);

  // Initialize call
  useEffect(() => {
    if (!consultationId || !authToken) return;

    (async () => {
      try {
        await AudioSession.startAudioSession();

        const res = await apiFetch(
          `/consultations/${consultationId}/call`,
          authToken,
          { method: 'POST' },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to start call');
        }
        const data = await res.json();
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
      AudioSession.stopAudioSession();
    };
  }, [consultationId, authToken]);

  const handleEndCall = useCallback(async () => {
    try {
      if (authToken && consultationId) {
        await apiFetch(
          `/consultations/${consultationId}/call/end`,
          authToken,
          { method: 'POST' },
        );
      }
    } catch { /* ignore */ }
    router.back();
  }, [authToken, consultationId]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Theme.primary} />
        <Text style={s.loadingText}>{t('videoCall.connecting')}</Text>
      </View>
    );
  }

  if (!livekitToken || !serverUrl) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>{t('videoCall.error')}</Text>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>{t('nps.done')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={livekitToken}
      connect
      options={{ adaptiveStream: true, dynacast: true }}
      onConnected={() => setConnected(true)}
      onDisconnected={() => {
        setConnected(false);
        router.back();
      }}
    >
      <View style={s.container}>
        <VideoLayout />

        {/* Controls */}
        <View style={s.controls}>
          <Pressable
            style={[s.controlBtn, !micEnabled && s.controlBtnOff]}
            onPress={() => setMicEnabled((v) => !v)}
          >
            <FontAwesome
              name={micEnabled ? 'microphone' : 'microphone-slash'}
              size={22}
              color="#fff"
            />
          </Pressable>

          <Pressable style={s.endCallBtn} onPress={handleEndCall}>
            <FontAwesome name="phone" size={24} color="#fff" />
          </Pressable>

          <Pressable
            style={[s.controlBtn, !camEnabled && s.controlBtnOff]}
            onPress={() => setCamEnabled((v) => !v)}
          >
            <FontAwesome
              name={camEnabled ? 'video-camera' : 'eye-slash'}
              size={20}
              color="#fff"
            />
          </Pressable>
        </View>
      </View>
    </LiveKitRoom>
  );
}

/** Video layout showing remote and local tracks */
function VideoLayout() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);
  const participants = useParticipants();

  const remoteTracks = tracks.filter(
    (t) => isTrackReference(t) && !t.participant.isLocal,
  );
  const localTrack = tracks.find(
    (t) => isTrackReference(t) && t.participant.isLocal && t.source === Track.Source.Camera,
  );

  return (
    <View style={s.videoContainer}>
      {/* Remote video (full screen) */}
      {remoteTracks.length > 0 && isTrackReference(remoteTracks[0]) ? (
        <VideoTrack trackRef={remoteTracks[0]} style={s.remoteVideo} />
      ) : (
        <View style={s.remoteVideo}>
          <FontAwesome name="user-md" size={64} color="#6B7280" />
          <Text style={s.waitingText}>Ожидание врача...</Text>
        </View>
      )}

      {/* Local video (small pip) */}
      {localTrack && isTrackReference(localTrack) && (
        <View style={s.localVideoWrapper}>
          <VideoTrack trackRef={localTrack} style={s.localVideo} />
        </View>
      )}

      {/* Participant count */}
      <View style={s.participantBadge}>
        <FontAwesome name="users" size={12} color="#fff" />
        <Text style={s.participantText}>{participants.length}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    gap: Spacing.md,
  },
  loadingText: { color: '#fff', fontSize: 16, marginTop: Spacing.md },
  errorText: { color: '#EF4444', fontSize: 16 },
  backBtn: {
    backgroundColor: Theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  backBtnText: { color: '#fff', fontWeight: '600' },
  videoContainer: { flex: 1, position: 'relative' },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: { color: '#9CA3AF', fontSize: 16, marginTop: Spacing.md },
  localVideoWrapper: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localVideo: { flex: 1 },
  participantBadge: {
    position: 'absolute',
    top: 50,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  participantText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 32,
    paddingBottom: 48,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnOff: { backgroundColor: '#6B7280' },
  endCallBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
});

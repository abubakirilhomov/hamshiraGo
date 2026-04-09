import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { API_BASE } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type VoiceState = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'SPEAKING';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatResponse {
  reply: string;
  sessionId: string;
  sessionComplete?: boolean;
  recommendation?: 'DOCTOR' | 'NURSE';
  suggestedSpecialization?: string;
  suggestedServiceId?: string;
}

/* ------------------------------------------------------------------ */
/*  Quick suggestion chips                                             */
/* ------------------------------------------------------------------ */

const QUICK_CHIPS = [
  "Bosh og'rig'i",
  'Harorat',
  'Qon bosimi',
  'Uyqusizlik',
  "Yo'tal",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function VoiceAgentScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { language } = useLanguage();

  const [state, setState] = useState<VoiceState>('IDLE');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<ChatResponse | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulsing animation for RECORDING state
  useEffect(() => {
    if (state === 'RECORDING') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulseAnim.setValue(1);
  }, [state]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  /* ------------------------------------------------------------------ */
  /*  API helpers                                                        */
  /* ------------------------------------------------------------------ */

  const transcribeAudio = async (uri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any);

      const lang = language === 'uz' ? 'uz' : 'ru';
      const res = await fetch(
        `${API_BASE}/voice-agent/transcribe?lang=${lang}`,
        {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!res.ok) {
        // Fallback: transcription service unavailable
        return null;
      }

      const data = await res.json();
      return data.text ?? null;
    } catch {
      return null;
    }
  };

  const sendChat = async (message: string): Promise<ChatResponse | null> => {
    try {
      const lang = language === 'uz' ? 'uz' : 'ru';
      const res = await fetch(`${API_BASE}/voice-agent/chat`, {
        method: 'POST',
        body: JSON.stringify({ sessionId, message, lang }),
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      return await res.json();
    } catch {
      return null;
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Recording flow                                                     */
  /* ------------------------------------------------------------------ */

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      await recording.startAsync();
      recordingRef.current = recording;
      setState('RECORDING');
    } catch {
      setState('IDLE');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setState('PROCESSING');

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (!uri) {
        setState('IDLE');
        return;
      }

      // Step 1: Transcribe
      const transcribedText = await transcribeAudio(uri);

      if (!transcribedText) {
        // Transcription failed (GROQ_API_KEY not set or network issue)
        // Stay in IDLE — user can use quick chips for text-only mode
        setState('IDLE');
        return;
      }

      // Step 2: Send to chat
      await processMessage(transcribedText);
    } catch {
      setState('IDLE');
    }
  };

  const handleMicPress = () => {
    if (state === 'IDLE') {
      startRecording();
    } else if (state === 'RECORDING') {
      stopRecording();
    }
    // Ignore taps during PROCESSING / SPEAKING
  };

  /* ------------------------------------------------------------------ */
  /*  Message processing (shared between voice and chips)                */
  /* ------------------------------------------------------------------ */

  const processMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setState('PROCESSING');

    const chatRes = await sendChat(text);

    if (chatRes) {
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: chatRes.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setSessionId(chatRes.sessionId);

      if (chatRes.sessionComplete && chatRes.recommendation) {
        setRecommendation(chatRes);
      }

      setState('SPEAKING');
      // Simulate speaking duration then go back to IDLE
      setTimeout(() => setState('IDLE'), 2000);
    } else {
      setState('IDLE');
    }
  };

  const handleChipPress = (chipText: string) => {
    if (state !== 'IDLE') return;
    processMessage(chipText);
  };

  /* ------------------------------------------------------------------ */
  /*  State indicator text                                               */
  /* ------------------------------------------------------------------ */

  const getStateText = () => {
    switch (state) {
      case 'IDLE':
        return 'Bosing va gapiring';
      case 'RECORDING':
        return 'Tinglayapman...';
      case 'PROCESSING':
        return "O'ylayapman...";
      case 'SPEAKING':
        return 'Javob bermoqda...';
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'IDLE':
        return Theme.textTertiary;
      case 'RECORDING':
        return Theme.primary;
      case 'PROCESSING':
        return Theme.textSecondary;
      case 'SPEAKING':
        return Theme.accent;
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render helpers                                                     */
  /* ------------------------------------------------------------------ */

  const formatTime = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText,
          ]}
        >
          {item.content}
        </Text>
        <Text
          style={[
            styles.messageTime,
            isUser ? styles.userMessageTime : styles.aiMessageTime,
          ]}
        >
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  const renderRecommendationCard = () => {
    if (!recommendation) return null;

    const isDoctor = recommendation.recommendation === 'DOCTOR';

    return (
      <View style={styles.recommendationCard}>
        <View style={styles.recommendationIconRow}>
          <View
            style={[
              styles.recommendationIconCircle,
              { backgroundColor: isDoctor ? '#EEF2FF' : '#E0F5F2' },
            ]}
          >
            <FontAwesome
              name={isDoctor ? 'stethoscope' : 'medkit'}
              size={22}
              color={isDoctor ? '#6366F1' : Theme.primary}
            />
          </View>
          <Text style={styles.recommendationTitle}>
            {isDoctor
              ? 'Shifokorga murojaat qiling'
              : 'Hamshira chaqiring'}
          </Text>
        </View>

        {isDoctor && recommendation.suggestedSpecialization && (
          <Text style={styles.recommendationSubtext}>
            Tavsiya etilgan mutaxassislik:{' '}
            {recommendation.suggestedSpecialization}
          </Text>
        )}

        <Pressable
          onPress={() => {
            if (isDoctor) {
              router.push('/doctors');
            } else {
              router.push('/(tabs)');
            }
          }}
        >
          <LinearGradient
            colors={Theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.recommendationCta}
          >
            <Text style={styles.recommendationCtaText}>
              {isDoctor ? 'Shifokor tanlash' : 'Xizmat tanlash'}{' '}
              {'\u2192'}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  };

  /* ------------------------------------------------------------------ */
  /*  Main render                                                        */
  /* ------------------------------------------------------------------ */

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ---- Header ---- */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBackBtn}
          onPress={() => router.back()}
          hitSlop={16}
        >
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Salomat</Text>
        <View style={styles.headerMicIcon}>
          <FontAwesome name="microphone" size={18} color={Theme.primary} />
        </View>
      </View>

      {/* ---- Mic Button (hero) ---- */}
      <View style={styles.micSection}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Pressable
            onPress={handleMicPress}
            disabled={state === 'PROCESSING' || state === 'SPEAKING'}
          >
            <LinearGradient
              colors={Theme.primaryGradient}
              style={styles.micButton}
            >
              <FontAwesome
                name={state === 'RECORDING' ? 'stop' : 'microphone'}
                size={40}
                color="#fff"
              />
            </LinearGradient>
          </Pressable>
        </Animated.View>

        <View style={styles.stateRow}>
          {state === 'PROCESSING' && (
            <ActivityIndicator
              size="small"
              color={Theme.textSecondary}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.stateText,
              { color: getStateColor() },
              state === 'RECORDING' && styles.stateTextPulsing,
            ]}
          >
            {getStateText()}
          </Text>
        </View>
      </View>

      {/* ---- Chat history ---- */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={renderRecommendationCard}
      />

      {/* ---- Quick suggestion chips ---- */}
      <View style={[styles.chipsContainer, { paddingBottom: insets.bottom + 12 }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {QUICK_CHIPS.map((chip) => (
            <Pressable
              key={chip}
              style={({ pressed }) => [
                styles.chip,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => handleChipPress(chip)}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
  },
  headerMicIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Mic section */
  micSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    height: 24,
  },
  stateText: {
    fontSize: 14,
    fontFamily: Fonts.inter,
  },
  stateTextPulsing: {
    fontFamily: Fonts.interMd,
  },

  /* Chat */
  chatList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  chatContent: {
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    marginBottom: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Theme.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.inter,
  },
  userMessageText: {
    color: '#fff',
  },
  aiMessageText: {
    color: Theme.text,
  },
  messageTime: {
    fontSize: 11,
    fontFamily: Fonts.inter,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.6)',
  },
  aiMessageTime: {
    color: Theme.textTertiary,
  },

  /* Recommendation card */
  recommendationCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: 20,
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },
  recommendationIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  recommendationIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  recommendationTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Fonts.manropeBd,
    color: Theme.text,
    flex: 1,
  },
  recommendationSubtext: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginBottom: Spacing.lg,
  },
  recommendationCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
  },
  recommendationCtaText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.manropeSb,
    color: '#fff',
  },

  /* Quick chips */
  chipsContainer: {
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    paddingTop: Spacing.md,
    backgroundColor: Theme.background,
  },
  chipsScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Theme.surfaceContainerLow,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  chipText: {
    fontSize: 13,
    fontFamily: Fonts.interMd,
    color: Theme.text,
  },
});

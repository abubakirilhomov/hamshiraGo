import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text } from '@/components/Themed';
import { SalomatDisclaimer } from '@/components/SalomatDisclaimer';
import { Theme, Fonts, Radius, Spacing, Shadow } from '@/constants/Theme';
import { apiFetch, API_BASE } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiChatResponse {
  reply: string;
  recommendation?: {
    specialization: string;
    summary: string;
  };
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  recommendation?: {
    specialization: string;
    summary: string;
  };
}

// ─── Quick suggestion chips ─────────────────────────────────────────────────

const QUICK_SUGGESTIONS = [
  'Bosh og\'rig\'i',
  'Harorat',
  'Qon bosimi',
  'Uyqusizlik',
];

const EMPTY_SUGGESTIONS = [
  'У меня болит горло третий день',
  'У ребёнка температура 38, что делать?',
  'Болит голова с утра',
  'Изжога после еды',
];

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AiChatScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const [consentChecked, setConsentChecked] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('salomat_consent_accepted')
      .then((val) => {
        if (val !== 'true') setShowDisclaimer(true);
        setConsentChecked(true);
      })
      .catch(() => setConsentChecked(true));
  }, []);

  const handleConsentAccept = useCallback(async () => {
    await AsyncStorage.setItem('salomat_consent_accepted', 'true');
    setShowDisclaimer(false);
  }, []);

  const handleConsentDecline = useCallback(() => {
    setShowDisclaimer(false);
    router.back();
  }, []);

  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: 'Ассалому алайкум! Мен Salomat — сизнинг соғлиғингиз бўйича ёрдамчингизман.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const idCounter = useRef(1);

  // Accumulated messages for API context (without greeting)
  const apiMessages = useRef<ChatMessage[]>([]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // ── Streaming send (SSE) ──
  const sendStreaming = useCallback(async (text: string, assistantMsgId: string): Promise<boolean> => {
    try {
      const currentLanguage = 'ru'; // will be overridden by Accept-Language header in apiFetch
      const response = await fetch(`${API_BASE}/consultations/ai-chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept-Language': currentLanguage,
        },
        body: JSON.stringify({ messages: apiMessages.current }),
      });

      if (!response.ok) {
        return false; // fallback to non-streaming
      }

      const reader = response.body?.getReader();
      if (!reader) return false;

      const decoder = new TextDecoder();
      let fullText = '';
      let recommendation: DisplayMessage['recommendation'] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: fullText } : m,
                  ),
                );
                scrollToBottom();
              }
              if (data.done && data.recommendation) {
                recommendation = data.recommendation;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, recommendation } : m,
                  ),
                );
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }
      }

      apiMessages.current.push({ role: 'assistant', content: fullText });
      return true;
    } catch {
      return false; // fallback to non-streaming
    }
  }, [token, scrollToBottom]);

  // ── Non-streaming fallback ──
  const sendNonStreaming = useCallback(async (assistantMsgId: string) => {
    const res = await apiFetch<AiChatResponse>('/consultations/ai-chat', {
      method: 'POST',
      token,
      body: JSON.stringify({ messages: apiMessages.current }),
    });

    apiMessages.current.push({ role: 'assistant', content: res.reply });

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantMsgId
          ? { ...m, content: res.reply, recommendation: res.recommendation }
          : m,
      ),
    );
  }, [token]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || loading || !token) return;

    setInputText('');

    // Add user message
    const userMsg: DisplayMessage = {
      id: String(++idCounter.current),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    apiMessages.current.push({ role: 'user', content: text });
    scrollToBottom();

    setLoading(true);

    // Add empty assistant message placeholder for streaming
    const assistantMsgId = String(++idCounter.current);
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date() },
    ]);

    try {
      // Try streaming first (not supported on web)
      const supportsStreaming = Platform.OS !== 'web';
      let streamed = false;

      if (supportsStreaming) {
        streamed = await sendStreaming(text, assistantMsgId);
      }

      // Fallback to non-streaming
      if (!streamed) {
        await sendNonStreaming(assistantMsgId);
      }
    } catch {
      // Remove the empty assistant placeholder on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      showToast(t('aiChat.unavailable'), 'error');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [inputText, loading, token, t, showToast, scrollToBottom, sendStreaming, sendNonStreaming]);

  const handleFindDoctor = useCallback(
    (specialization: string) => {
      // Pass the accumulated symptoms from user messages
      const symptoms = apiMessages.current
        .filter((m) => m.role === 'user')
        .map((m) => m.content)
        .join('; ');
      router.push(
        `/doctors?spec=${encodeURIComponent(specialization)}&symptoms=${encodeURIComponent(symptoms)}`,
      );
    },
    [],
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* ── Teal gradient header ── */}
      <LinearGradient
        colors={Theme.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <FontAwesome name="chevron-left" size={18} color="#fff" />
        </Pressable>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <FontAwesome name="commenting" size={20} color={Theme.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Salomat</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>ONLINE</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.headerMenu}>
          <FontAwesome name="ellipsis-v" size={18} color="#fff" />
        </Pressable>
      </LinearGradient>

      {/* ── Chat area ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onFindDoctor={handleFindDoctor}
            formatTime={formatTime}
            t={t}
          />
        ))}

        {/* Empty-state suggestion chips — shown when only the greeting exists */}
        {messages.length === 1 && messages[0].id === 'greeting' && (
          <View style={styles.emptySuggestions}>
            {EMPTY_SUGGESTIONS.map((chip) => (
              <Pressable
                key={chip}
                style={({ pressed }) => [styles.emptySuggestionChip, pressed && { opacity: 0.7 }]}
                onPress={() => handleSend(chip)}
              >
                <Text style={styles.emptySuggestionText}>{chip}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {loading && messages[messages.length - 1]?.content === '' && (
          <View style={styles.typingRow}>
            <View style={styles.aiAvatarSmall}>
              <FontAwesome name="commenting" size={12} color={Theme.primary} />
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDotsRow}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, { opacity: 0.6 }]} />
                <View style={[styles.typingDot, { opacity: 0.3 }]} />
              </View>
              <Text style={styles.typingText}>{t('aiChat.typing')}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Quick suggestion chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        style={styles.chipsScroll}
      >
        {QUICK_SUGGESTIONS.map((chip) => (
          <Pressable
            key={chip}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.7 }]}
            onPress={() => handleSend(chip)}
          >
            <Text style={styles.chipText}>{chip}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ── Input bar ── */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('aiChat.placeholder')}
          placeholderTextColor={Theme.textTertiary}
          multiline
          maxLength={1000}
          editable={!loading}
          onSubmitEditing={() => handleSend()}
          blurOnSubmit={false}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (!inputText.trim() || loading) && styles.sendBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || loading}
        >
          <FontAwesome
            name="send"
            size={16}
            color={inputText.trim() && !loading ? '#fff' : Theme.textTertiary}
          />
        </Pressable>
      </View>

      {/* Salomat disclaimer modal — first-time only */}
      <SalomatDisclaimer
        visible={showDisclaimer}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onFindDoctor,
  formatTime,
  t,
}: {
  message: DisplayMessage;
  onFindDoctor: (spec: string) => void;
  formatTime: (date: Date) => string;
  t: (key: string) => string;
}) {
  const isUser = message.role === 'user';
  const content = message.content;

  // Detect action-worthy patterns in assistant messages
  const isAI = !isUser;
  const hasDoctor =
    isAI &&
    (content.includes('РЕКОМЕНДАЦИЯ: DOCTOR') || content.includes('обратиться к'));
  const hasNurse =
    isAI &&
    (content.includes('РЕКОМЕНДАЦИЯ: NURSE') || content.includes('вызвать медсестру'));
  const has103 =
    isAI && content.includes('103') && content.includes('скорую');

  // Clean recommendation markers from display text
  const displayText = isAI
    ? content
        .replace(/РЕКОМЕНДАЦИЯ:\s*(DOCTOR|NURSE)/gi, '')
        .replace(/СПЕЦИАЛИЗАЦИЯ:\s*\S+/gi, '')
        .trim()
    : content;

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.aiAvatarSmall}>
          <FontAwesome name="commenting" size={12} color={Theme.primary} />
        </View>
      )}
      <View style={{ flex: 1, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {displayText}
          </Text>

          {/* ── Action buttons inside the bubble ── */}
          {isAI && hasDoctor && (
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/doctors')}
            >
              <FontAwesome name="stethoscope" size={14} color="#fff" />
              <Text style={styles.actionButtonText}>Shifokor tanlash</Text>
            </Pressable>
          )}

          {isAI && hasNurse && (
            <Pressable
              style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.7 }]}
              onPress={() => router.push('/(tabs)')}
            >
              <FontAwesome name="medkit" size={14} color="#fff" />
              <Text style={styles.actionButtonText}>Hamshira chaqirish</Text>
            </Pressable>
          )}

          {isAI && has103 && (
            <Pressable
              style={({ pressed }) => [styles.emergencyButton, pressed && { opacity: 0.7 }]}
              onPress={() => Linking.openURL('tel:103')}
            >
              <FontAwesome name="phone" size={14} color="#fff" />
              <Text style={styles.emergencyButtonText}>103 ga qo'ng'iroq qilish</Text>
            </Pressable>
          )}
        </View>

        {/* Timestamp */}
        <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
          {formatTime(message.timestamp)}
        </Text>

        {/* Doctor recommendation card */}
        {message.recommendation && (
          <View style={styles.recommendationCard}>
            <View style={styles.recDoctorRow}>
              <View style={styles.recAvatar}>
                <FontAwesome name="user-md" size={20} color={Theme.textTertiary} />
              </View>
              <View style={styles.recInfo}>
                <Text style={styles.recName}>
                  {message.recommendation.specialization}
                </Text>
                <Text style={styles.recSpec}>Mutaxassis</Text>
                <Text style={styles.recExp}>
                  {message.recommendation.summary}
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.recButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => onFindDoctor(message.recommendation!.specialization)}
            >
              <LinearGradient
                colors={Theme.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.recButtonGradient}
              >
                <Text style={styles.recButtonText}>Konsultatsiya olish</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: Spacing.lg,
  },
  headerBack: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginLeft: Spacing.sm,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: 18,
    color: '#fff',
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  onlineText: {
    fontFamily: Fonts.interMd,
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  headerMenu: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Messages ── */
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.lg,
  },

  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },

  aiAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 16,
  },
  bubbleUser: {
    backgroundColor: Theme.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: Theme.surfaceContainerLow,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: Fonts.inter,
    fontSize: 15,
    lineHeight: 22,
    color: Theme.text,
  },
  bubbleTextUser: {
    color: '#fff',
  },

  timestamp: {
    fontFamily: Fonts.inter,
    fontSize: 11,
    color: Theme.textTertiary,
    marginTop: 4,
    marginLeft: 4,
  },
  timestampUser: {
    marginRight: 4,
    marginLeft: 0,
  },

  /* ── Action buttons (inside AI bubble) ── */
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: Theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#fff',
    fontFamily: Fonts.manropeSb,
    fontSize: 13,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: Theme.error,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  emergencyButtonText: {
    color: '#fff',
    fontFamily: Fonts.manropeSb,
    fontSize: 13,
  },

  /* ── Typing ── */
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  typingDotsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.primary,
  },
  typingText: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
    fontStyle: 'italic',
  },

  /* ── Recommendation card ── */
  recommendationCard: {
    marginTop: Spacing.sm,
    backgroundColor: Theme.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.md,
    maxWidth: '85%',
    ...Shadow.sm,
  },
  recDoctorRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  recAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recInfo: {
    flex: 1,
    gap: 2,
  },
  recName: {
    fontFamily: Fonts.manropeSb,
    fontSize: 15,
    color: Theme.text,
  },
  recSpec: {
    fontFamily: Fonts.inter,
    fontSize: 13,
    color: Theme.textSecondary,
  },
  recExp: {
    fontFamily: Fonts.inter,
    fontSize: 12,
    color: Theme.textTertiary,
    marginTop: 2,
  },
  recButton: {
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  recButtonGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
  },
  recButtonText: {
    fontFamily: Fonts.manropeSb,
    fontSize: 14,
    color: '#fff',
  },

  /* ── Quick suggestion chips ── */
  chipsScroll: {
    maxHeight: 44,
    backgroundColor: Theme.surface,
  },
  chipsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Theme.surfaceContainerLow,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  chipText: {
    fontFamily: Fonts.interMd,
    fontSize: 13,
    color: Theme.text,
  },

  /* ── Empty-state suggestion chips ── */
  emptySuggestions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  emptySuggestionChip: {
    backgroundColor: Theme.surface,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  emptySuggestionText: {
    fontFamily: Fonts.inter,
    fontSize: 14,
    color: Theme.text,
    lineHeight: 20,
  },

  /* ── Input bar ── */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Theme.surface,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.inter,
    fontSize: 15,
    color: Theme.text,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Theme.surfaceContainerLow,
  },
});

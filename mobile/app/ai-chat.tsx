import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useCallback, useRef, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
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
  recommendation?: {
    specialization: string;
    summary: string;
  };
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AiChatScreen() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: t('aiChat.greeting'),
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

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || loading || !token) return;

    setInputText('');

    // Add user message
    const userMsg: DisplayMessage = {
      id: String(++idCounter.current),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    apiMessages.current.push({ role: 'user', content: text });
    scrollToBottom();

    setLoading(true);
    try {
      const res = await apiFetch<AiChatResponse>('/consultations/ai-chat', {
        method: 'POST',
        token,
        body: JSON.stringify({ messages: apiMessages.current }),
      });

      apiMessages.current.push({ role: 'assistant', content: res.reply });

      const aiMsg: DisplayMessage = {
        id: String(++idCounter.current),
        role: 'assistant',
        content: res.reply,
        recommendation: res.recommendation,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      showToast(t('aiChat.unavailable'), 'error');
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }, [inputText, loading, token, t, showToast, scrollToBottom]);

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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
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
            t={t}
          />
        ))}

        {loading && (
          <View style={styles.typingRow}>
            <View style={styles.aiAvatar}>
              <FontAwesome name="heartbeat" size={14} color={Theme.primary} />
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={Theme.primary} />
              <Text style={styles.typingText}>{t('aiChat.typing')}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('aiChat.placeholder')}
          placeholderTextColor={Theme.textTertiary}
          multiline
          maxLength={1000}
          editable={!loading}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (!inputText.trim() || loading) && styles.sendBtnDisabled,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
        >
          <FontAwesome
            name="send"
            size={16}
            color={inputText.trim() && !loading ? '#fff' : Theme.textTertiary}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Message Bubble ─────────────────────────────────────────────────────────

function MessageBubble({
  message,
  onFindDoctor,
  t,
}: {
  message: DisplayMessage;
  onFindDoctor: (spec: string) => void;
  t: (key: string) => string;
}) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <FontAwesome name="heartbeat" size={14} color={Theme.primary} />
        </View>
      )}
      <View style={{ flex: 1, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {message.content}
          </Text>
        </View>

        {message.recommendation && (
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <FontAwesome name="stethoscope" size={14} color={Theme.primary} />
              <Text style={styles.recommendationTitle}>
                {t('aiChat.recommendation')}
              </Text>
            </View>
            <Text style={styles.recommendationSpec}>
              {t('aiChat.suggestedSpec')}: {message.recommendation.specialization}
            </Text>
            <Text style={styles.recommendationSummary}>
              {message.recommendation.summary}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.findDoctorBtn,
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => onFindDoctor(message.recommendation!.specialization)}
            >
              <FontAwesome name="search" size={13} color="#fff" />
              <Text style={styles.findDoctorText}>{t('aiChat.findDoctor')}</Text>
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
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },

  // Message row
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },

  // AI avatar
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${Theme.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  // Bubbles
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  bubbleUser: {
    backgroundColor: Theme.primary,
    borderBottomRightRadius: Radius.xs,
  },
  bubbleAi: {
    backgroundColor: Theme.surface,
    borderBottomLeftRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
    color: Theme.text,
  },
  bubbleTextUser: {
    color: '#fff',
  },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    borderBottomLeftRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  typingText: {
    fontSize: 13,
    color: Theme.textSecondary,
    fontStyle: 'italic',
  },

  // Recommendation card
  recommendationCard: {
    marginTop: Spacing.sm,
    backgroundColor: `${Theme.primary}08`,
    borderWidth: 1,
    borderColor: `${Theme.primary}30`,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
    maxWidth: '85%',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationSpec: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.text,
  },
  recommendationSummary: {
    fontSize: 14,
    color: Theme.textSecondary,
    lineHeight: 20,
  },
  findDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  findDoctorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Theme.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Theme.text,
    backgroundColor: Theme.surfaceSecondary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Theme.surfaceSecondary,
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useSharedSocket } from '@/context/SocketContext';
import { useToast } from '@/context/ToastContext';

interface Message {
  id: string;
  userId: string;
  role: 'user' | 'doctor';
  content: string;
  createdAt: string;
}

export default function MedicOrderChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { token, medic } = useAuth();
  const { t } = useTranslation();
  const { socket } = useSharedSocket();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  // Load messages
  useEffect(() => {
    if (!orderId || !token) return;
    (async () => {
      try {
        const data = await apiFetch<Message[]>(`/orders/${orderId}/messages`, { token });
        setMessages(data ?? []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, [orderId, token]);

  // Listen for real-time messages
  useEffect(() => {
    if (!socket || !orderId) return;
    socket.emit('subscribe_order', orderId);

    const handler = (data: { orderId: string; message: Message }) => {
      if (data.orderId === orderId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };

    socket.on('order_message', handler);
    return () => {
      socket.off('order_message', handler);
      socket.emit('unsubscribe_order', orderId);
    };
  }, [socket, orderId]);

  // Send message (medic endpoint)
  const handleSend = useCallback(async () => {
    if (!text.trim() || !token || !orderId || sending) return;
    const content = text.trim();
    setSending(true);
    try {
      const msg = await apiFetch<Message>(`/orders/${orderId}/medic-messages`, {
        token,
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      setText('');
      if (msg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch {
      showToast('Failed to send', 'error');
    } finally {
      setSending(false);
    }
  }, [text, token, orderId, sending]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.userId === medic?.id;
    return (
      <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
        <Text style={[s.bubbleText, isMe && s.bubbleTextMe]}>{item.content}</Text>
        <Text style={[s.bubbleTime, isMe && s.bubbleTimeMe]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* ── Teal gradient header ─────────────────────────────────── */}
      <LinearGradient
        colors={Theme.primaryGradient as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.header}
      >
        <Pressable style={s.headerBack} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Theme.textInverse} />
        </Pressable>
        <View style={s.headerAvatar}>
          <FontAwesome name="user" size={16} color={Theme.textInverse} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerName}>{t('chat.client', { defaultValue: 'Mijoz' })}</Text>
          <View style={s.onlineRow}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>Online</Text>
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={s.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <FontAwesome name="comments-o" size={48} color={Theme.surfaceContainerHigh} />
              <Text style={s.emptyText}>{t('chat.empty')}</Text>
            </View>
          }
        />

        {/* ── Input bar ──────────────────────────────────────────── */}
        <View style={[s.inputBar, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={Theme.textTertiary}
            multiline
            maxLength={2000}
          />
          <Pressable
            style={[s.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Theme.textInverse} />
            ) : (
              <FontAwesome name="send" size={16} color={Theme.textInverse} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.background },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background, gap: Spacing.md },

  /* ── Header ──────────────────────────────────────────────────── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: {
    ...Typography.h4,
    color: Theme.textInverse,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  onlineText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
  },

  /* ── Messages ────────────────────────────────────────────────── */
  list: { padding: Spacing.md, paddingBottom: Spacing.lg },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 80,
  },
  emptyText: {
    ...Typography.bodySmall,
    color: Theme.textTertiary,
  },
  bubble: {
    maxWidth: '78%',
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xs,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: Theme.primary,
    borderBottomRightRadius: Radius.xs,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.surfaceContainerLow,
    borderBottomLeftRadius: Radius.xs,
  },
  bubbleText: {
    ...Typography.body,
    color: Theme.text,
  },
  bubbleTextMe: {
    color: Theme.textInverse,
  },
  bubbleTime: {
    fontSize: 11,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },

  /* ── Input bar ───────────────────────────────────────────────── */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    paddingTop: Spacing.md,
    backgroundColor: Theme.surface,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  input: {
    flex: 1,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Theme.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

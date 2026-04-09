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
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Shadow, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';

interface Message {
  id: string;
  userId: string;
  role: 'user' | 'doctor';
  content: string;
  createdAt: string;
}

export default function OrderChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const socket = useSocket();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

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

  // Send message
  const handleSend = useCallback(async () => {
    if (!text.trim() || !token || !orderId || sending) return;
    const content = text.trim();
    setSending(true);
    try {
      const msg = await apiFetch<Message>(`/orders/${orderId}/messages`, {
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
      // Failed to send
    } finally {
      setSending(false);
    }
  }, [text, token, orderId, sending]);

  /** Group messages by date for separators */
  const getDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['YANVAR', 'FEVRAL', 'MART', 'APREL', 'MAY', 'IYUN', 'IYUL', 'AVGUST', 'SENTABR', 'OKTABR', 'NOYABR', 'DEKABR'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.userId === user?.id;
    const prevMsg = index > 0 ? messages[index - 1] : null;
    const showDateSep = !prevMsg || getDateLabel(prevMsg.createdAt) !== getDateLabel(item.createdAt);

    return (
      <>
        {showDateSep && (
          <View style={s.dateSep}>
            <Text style={s.dateSepText}>{getDateLabel(item.createdAt)}</Text>
          </View>
        )}
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
          <Text style={[s.bubbleText, isMe && s.bubbleTextMe]}>{item.content}</Text>
          <Text style={[s.bubbleTime, isMe && s.bubbleTimeMe]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <View style={s.centerFull}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  return (
    <View style={s.flex}>
      {/* Dark teal header */}
      <LinearGradient
        colors={['#006860', '#004D47']}
        style={[s.header, { paddingTop: insets.top + 8 }]}
      >
        <Pressable style={s.headerBack} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color="#fff" />
        </Pressable>
        <View style={s.headerAvatar}>
          <FontAwesome name="user-md" size={20} color="#fff" />
        </View>
        <View style={s.headerInfo}>
          <Text style={s.headerName}>{t('chat.medic', { defaultValue: 'Shifokor' })}</Text>
          <View style={s.headerStatusRow}>
            <View style={s.onlineDot} />
            <Text style={s.headerStatus}>Online</Text>
          </View>
        </View>
        <Pressable style={s.headerMenu} hitSlop={12}>
          <FontAwesome name="ellipsis-v" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>
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
            <View style={s.center}>
              <View style={s.emptyIconWrap}>
                <FontAwesome name="comments-o" size={48} color={Theme.textTertiary} />
              </View>
              <Text style={s.emptyText}>{t('chat.empty', { defaultValue: 'Xabarlar yo\'q' })}</Text>
            </View>
          }
        />

        {/* Input bar */}
        <View style={[s.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <Pressable style={s.attachBtn} hitSlop={8}>
            <FontAwesome name="paperclip" size={20} color={Theme.textSecondary} />
          </Pressable>
          <TextInput
            style={s.input}
            value={text}
            onChangeText={setText}
            placeholder={t('chat.placeholder', { defaultValue: 'Xabar yozing...' })}
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
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome name="send" size={16} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.background },
  centerFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 80,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: '#fff',
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  headerStatus: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: 'rgba(255,255,255,0.8)',
  },
  headerMenu: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Messages */
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  dateSep: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dateSepText: {
    fontSize: 12,
    fontFamily: Fonts.interMd,
    fontWeight: '500',
    color: Theme.textTertiary,
    letterSpacing: 1,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Theme.textTertiary,
    fontSize: 14,
    fontFamily: Fonts.inter,
  },

  /* Bubbles */
  bubble: {
    maxWidth: '78%',
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#006860',
    borderBottomRightRadius: Radius.xs,
  },
  bubbleThem: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.surfaceContainerLow,
    borderBottomLeftRadius: Radius.xs,
  },
  bubbleText: {
    fontSize: 15,
    fontFamily: Fonts.inter,
    color: Theme.text,
    lineHeight: 22,
  },
  bubbleTextMe: {
    color: '#fff',
  },
  bubbleTime: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  bubbleTimeMe: {
    color: 'rgba(255,255,255,0.6)',
  },

  /* Input bar */
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Theme.surface,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    fontSize: 15,
    fontFamily: Fonts.inter,
    maxHeight: 100,
    color: Theme.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#006860',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

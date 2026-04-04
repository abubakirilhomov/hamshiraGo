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
import { useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
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
  const socket = useSocket();
  const toast = useToast();
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
      toast.show('Failed to send', 'error');
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
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
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
            <FontAwesome name="comments-o" size={48} color="#D1D5DB" />
            <Text style={s.emptyText}>{t('chat.empty')}</Text>
          </View>
        }
      />

      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder={t('chat.placeholder')}
          placeholderTextColor="#9CA3AF"
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
            <FontAwesome name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  list: { padding: Spacing.md, paddingBottom: Spacing.lg },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  bubble: {
    maxWidth: '78%', padding: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: Radius.md, marginBottom: Spacing.xs,
  },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: Theme.primary, borderBottomRightRadius: 4 },
  bubbleThem: {
    alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  bubbleText: { fontSize: 15, color: '#111827', lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2, alignSelf: 'flex-end' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.sm, paddingBottom: Spacing.md,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: Spacing.sm,
  },
  input: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: 15, maxHeight: 100, color: '#111827',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Theme.primary,
    justifyContent: 'center', alignItems: 'center',
  },
});

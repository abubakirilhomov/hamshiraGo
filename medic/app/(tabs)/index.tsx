import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { io, Socket } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';
import { API_BASE, apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { OrderInviteModal, type DispatchInvitePayload } from '@/components/OrderInviteModal';

interface OrderLocation {
  house: string;
  floor: string | null;
  apartment: string | null;
  phone: string;
  latitude: number;
  longitude: number;
}

interface AvailableOrder {
  id: string;
  serviceTitle: string;
  priceAmount: number;
  discountAmount: number;
  location: OrderLocation | null;
  created_at: string;
}

// ─── In-app notification banner ───────────────────────────────────────────────

function NewOrderBanner({
  order,
  onAccept,
  onDismiss,
}: {
  order: AvailableOrder;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    // Slide in
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 300,
        useNativeDriver: true,
      }).start(onDismiss);
    }, 5000);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finalPrice = order.priceAmount - (order.discountAmount ?? 0);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY }] }]}>
      <View style={styles.bannerLeft}>
        <View style={styles.bannerIconWrap}>
          <FontAwesome name="bell" size={18} color="#fff" />
        </View>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle} numberOfLines={1}>{order.serviceTitle}</Text>
          <Text style={styles.bannerPrice}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
        </View>
      </View>
      <View style={styles.bannerActions}>
        <Pressable
          style={styles.bannerAcceptBtn}
          onPress={onAccept}
        >
          <Text style={styles.bannerAcceptText}>{t('dispatch.accept')}</Text>
        </Pressable>
        <Pressable style={styles.bannerCloseBtn} onPress={onDismiss}>
          <FontAwesome name="times" size={14} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AvailableOrdersScreen() {
  const { token, medic } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [bannerOrder, setBannerOrder] = useState<AvailableOrder | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [invite, setInvite] = useState<DispatchInvitePayload | null>(null);
  const [walletModal, setWalletModal] = useState<{ required: number; current: number } | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await apiFetch<AvailableOrder[]>('/orders/medic/available', {
        token: token ?? undefined,
      });
      setOrders(data);
      setFetchError(null);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : t('common.error'));
    }
  }, [token]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  // ── Refetch when tab comes into focus ───────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  // ── WebSocket ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    // Request notification permission (for dev build / Android in Expo Go)
    Notifications.requestPermissionsAsync().catch(() => {});

    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => setWsConnected(true));
    socket.on('disconnect', () => setWsConnected(false));

    socket.on('new_order', (order: AvailableOrder) => {
      // Add to list if not already present
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });

      // 1) Haptic feedback — works in Expo Go on both platforms
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});

      // 2) Show in-app banner
      setBannerOrder(order);

      // 3) System notification with sound (works in dev build; partial in Expo Go Android)
      Notifications.scheduleNotificationAsync({
        content: {
          title: '🚨 Новый заказ!',
          body: `${order.serviceTitle} — ${(order.priceAmount - (order.discountAmount ?? 0)).toLocaleString('ru-RU')} UZS`,
          sound: 'default',
          data: { orderId: order.id },
          ...(Platform.OS === 'android' ? { channelId: 'new_orders' } : {}),
        },
        trigger: null,
      }).catch(() => {}); // silently fail in Expo Go
    });

    // ── Dispatch invite (push-based assignment) ──────────────────────────────
    socket.on('dispatch_invite', (payload: DispatchInvitePayload) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setInvite(payload);
    });

    socket.on('dispatch_invite_expired', (payload: { orderId: string }) => {
      setInvite((prev) => (prev?.orderId === payload.orderId ? null : prev));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const handleAccept = async (orderId: string) => {
    if (!medic?.isOnline) {
      Alert.alert(t('profile.offline') ?? 'Offline', t('common.error'));
      return;
    }
    Alert.alert(t('orders.accepted'), '', [
      { text: t('common.back'), style: 'cancel' },
      {
        text: t('dispatch.accept'),
        style: 'default',
        onPress: async () => {
          setAccepting(orderId);
          setBannerOrder(null);
          try {
            const res = await fetch(`${API_BASE}/orders/${orderId}/accept`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              if (body?.message === 'INSUFFICIENT_WALLET') {
                setWalletModal({ required: body.required ?? 0, current: body.current ?? 0 });
              } else {
                const msg = body?.message ?? `HTTP ${res.status}`;
                Alert.alert(t('common.error'), Array.isArray(msg) ? msg.join(', ') : String(msg));
              }
              return;
            }
            setOrders((prev) => prev.filter((o) => o.id !== orderId));
            router.push(`/order/${orderId}`);
          } catch (e: unknown) {
            Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
          } finally {
            setAccepting(null);
          }
        },
      },
    ]);
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primary} />
      </View>
    );
  }

  const vStatus = medic?.verificationStatus ?? 'PENDING';
  const isNotApproved = vStatus !== 'APPROVED';

  return (
    <View style={styles.container}>
      {/* Verification warning banner */}
      {isNotApproved && (
        <Pressable
          style={[
            styles.verifyBanner,
            vStatus === 'REJECTED' ? styles.verifyBannerRejected : styles.verifyBannerPending,
          ]}
          onPress={() => router.push('/verification')}
        >
          <FontAwesome
            name={vStatus === 'REJECTED' ? 'times-circle' : 'clock-o'}
            size={15}
            color={vStatus === 'REJECTED' ? '#ef4444' : '#92400e'}
          />
          <Text style={[styles.verifyBannerText, vStatus === 'REJECTED' && { color: '#ef4444' }]}>
            {vStatus === 'REJECTED'
              ? 'Аккаунт отклонён — загрузите документы повторно'
              : 'Аккаунт не верифицирован — вы не можете принимать заказы'}
          </Text>
          <FontAwesome name="chevron-right" size={11} color={vStatus === 'REJECTED' ? '#ef4444' : '#92400e'} />
        </Pressable>
      )}

      {/* Offline banner */}
      {!medic?.isOnline && (
        <View style={styles.offlineBanner}>
          <FontAwesome name="power-off" size={14} color="#854d0e" />
          <Text style={styles.offlineText}>
            Вы офлайн — новые заказы не поступают. Включите онлайн в Профиле.
          </Text>
        </View>
      )}

      {/* Live connection status */}
      {medic?.isOnline && (
        <View style={[styles.statusBar, wsConnected ? styles.statusBarLive : styles.statusBarWaiting]}>
          <View style={[styles.statusDot, { backgroundColor: wsConnected ? Theme.success : Theme.warning }]} />
          <Text style={[styles.statusBarText, { color: wsConnected ? '#065f46' : '#78350f' }]}>
            {wsConnected ? 'Подключено — ожидаем новых заказов' : 'Подключение...'}
          </Text>
        </View>
      )}

      {/* Animated new order banner */}
      {bannerOrder && (
        <NewOrderBanner
          order={bannerOrder}
          onAccept={() => handleAccept(bannerOrder.id)}
          onDismiss={() => setBannerOrder(null)}
        />
      )}

      {/* Fetch error */}
      {fetchError && (
        <View style={styles.fetchErrorBox}>
          <Text style={styles.fetchErrorText}>{fetchError}</Text>
          <Pressable onPress={() => fetchOrders()} style={styles.fetchRetryBtn}>
            <Text style={styles.fetchRetryText}>Повторить</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="inbox" size={48} color={Theme.border} />
            <Text style={styles.emptyTitle}>{t('orders.empty')}</Text>
            <Text style={styles.emptyHint}>{t('common.retry')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <AvailableOrderCard
            order={item}
            onAccept={() => handleAccept(item.id)}
            accepting={accepting === item.id}
          />
        )}
      />

      {/* Fullscreen dispatch invite modal */}
      <OrderInviteModal invite={invite} onDismiss={() => setInvite(null)} />

      {/* Wallet insufficient funds modal */}
      <Modal
        visible={walletModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setWalletModal(null)}
      >
        <View style={styles.walletOverlay}>
          <View style={styles.walletModalBox}>
            <View style={styles.walletModalIcon}>
              <FontAwesome name="exclamation-circle" size={36} color="#ef4444" />
            </View>
            <Text style={styles.walletModalTitle}>{t('wallet.insufficientTitle')}</Text>
            <Text style={styles.walletModalDesc}>{t('wallet.insufficientDesc')}</Text>
            {walletModal && (
              <View style={styles.walletModalStats}>
                <View style={styles.walletStatRow}>
                  <Text style={styles.walletStatLabel}>{t('wallet.current')}</Text>
                  <Text style={[styles.walletStatValue, { color: '#ef4444' }]}>
                    {Number(walletModal.current).toLocaleString('ru-RU')} {t('common.sum')}
                  </Text>
                </View>
                <View style={styles.walletStatRow}>
                  <Text style={styles.walletStatLabel}>{t('wallet.required')}</Text>
                  <Text style={styles.walletStatValue}>
                    {Number(walletModal.required).toLocaleString('ru-RU')} {t('common.sum')}
                  </Text>
                </View>
              </View>
            )}
            <Pressable
              style={styles.walletContactBtn}
              onPress={() => Linking.openURL('https://t.me/hamshirago_support').catch(() => {})}
            >
              <FontAwesome name="telegram" size={16} color="#fff" />
              <Text style={styles.walletContactText}>{t('wallet.contactAdmin')}</Text>
            </Pressable>
            <Pressable style={styles.walletCloseBtn} onPress={() => setWalletModal(null)}>
              <Text style={styles.walletCloseText}>{t('wallet.close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

function AvailableOrderCard({
  order,
  onAccept,
  accepting,
}: {
  order: AvailableOrder;
  onAccept: () => void;
  accepting: boolean;
}) {
  const { t } = useTranslation();
  const finalPrice = order.priceAmount - (order.discountAmount ?? 0);
  const date = new Date(order.created_at);
  const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.serviceTitle}>{order.serviceTitle}</Text>
        <Text style={styles.price}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
      </View>

      {order.location && (
        <View style={styles.locationRow}>
          <FontAwesome name="map-marker" size={13} color={Theme.textSecondary} />
          <Text style={styles.locationText} numberOfLines={2}>
            {order.location.house}
            {order.location.floor ? `, эт. ${order.location.floor}` : ''}
            {order.location.apartment ? `, кв. ${order.location.apartment}` : ''}
          </Text>
        </View>
      )}

      {order.location && (
        <View style={styles.locationRow}>
          <FontAwesome name="phone" size={13} color={Theme.textSecondary} />
          <Text style={styles.locationText}>{order.location.phone}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.time}>{timeStr}</Text>
        <Pressable
          style={({ pressed }) => [
            styles.acceptBtn,
            pressed && styles.acceptBtnPressed,
            accepting && styles.acceptBtnDisabled,
          ]}
          onPress={onAccept}
          disabled={accepting}
        >
          {accepting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.acceptBtnText}>{t('dispatch.accept')}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },

  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  verifyBannerPending: {
    backgroundColor: '#fef3c720',
    borderBottomColor: '#f59e0b40',
  },
  verifyBannerRejected: {
    backgroundColor: '#fee2e220',
    borderBottomColor: '#ef444440',
  },
  verifyBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
  },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eab30820',
    borderBottomWidth: 1,
    borderBottomColor: '#eab30840',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  offlineText: { flex: 1, fontSize: 13, color: '#854d0e', fontWeight: '500' },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  statusBarLive: { backgroundColor: '#d1fae520', borderBottomColor: '#6ee7b740' },
  statusBarWaiting: { backgroundColor: '#fef3c720', borderBottomColor: '#fde68a40' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusBarText: { fontSize: 12, fontWeight: '600' },

  // ── In-app banner ──────────────────────────────────────────────────────────
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
    gap: 10,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  bannerPrice: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  bannerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerAcceptBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bannerAcceptText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  bannerCloseBtn: {
    padding: 6,
  },

  listContent: { padding: 16, gap: 12 },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingTop: 80,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Theme.text },
  emptyHint: { fontSize: 14, color: Theme.textSecondary },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  serviceTitle: { fontSize: 16, fontWeight: '700', color: Theme.text, flex: 1 },
  price: { fontSize: 15, fontWeight: '700', color: Theme.primary, marginLeft: 8 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  locationText: { flex: 1, fontSize: 13, color: Theme.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  time: { fontSize: 13, color: Theme.textSecondary },
  acceptBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  acceptBtnPressed: { opacity: 0.9 },
  acceptBtnDisabled: { opacity: 0.7 },
  acceptBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  fetchErrorBox: {
    margin: 12,
    padding: 14,
    backgroundColor: '#fee2e220',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef444440',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fetchErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
  },
  fetchRetryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 8,
  },
  fetchRetryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // ── Wallet insufficient modal ───────────────────────────────────────────────
  walletOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  walletModalBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  walletModalIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  walletModalDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  walletModalStats: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 4,
  },
  walletStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletStatLabel: { fontSize: 13, color: '#6b7280' },
  walletStatValue: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  walletContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0088cc',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    justifyContent: 'center',
    marginTop: 4,
  },
  walletContactText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  walletCloseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  walletCloseText: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
});

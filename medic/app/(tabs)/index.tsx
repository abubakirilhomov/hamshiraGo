import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import { Theme, Radius, Spacing, Typography } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { OrderInviteModal } from '@/components/OrderInviteModal';
import AppModal from '@/components/AppModal';
import NewOrderBanner from '@/components/NewOrderBanner';
import { SkeletonCard } from '@/components/SkeletonLoader';
import { useMedicOrderFeed, type AvailableOrder } from '@/hooks/useMedicOrderFeed';
import { trackEvent } from '@/utils/analytics';

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AvailableOrdersScreen() {
  const { medic } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [accepting, setAccepting] = useState<string | null>(null);

  const {
    orders,
    loading,
    refreshing,
    wsConnected,
    bannerOrder,
    invite,
    acceptModal,
    acceptError,
    fetchError,
    fetchOrders,
    acceptOrder,
    dismissBanner,
    setAcceptModal,
    setAcceptError,
    setInvite,
    onRefresh,
  } = useMedicOrderFeed();

  // ── Refetch when tab comes into focus ───────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders]),
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAccept = useCallback((orderId: string) => {
    if (!medic?.isOnline) {
      setAcceptError(t('profile.offline') ?? 'Offline');
      return;
    }
    setAcceptModal(orderId);
  }, [medic?.isOnline, t, setAcceptError, setAcceptModal]);

  const confirmAccept = async () => {
    const orderId = acceptModal;
    if (!orderId) return;
    setAccepting(orderId);
    try {
      await acceptOrder(orderId);
      trackEvent('order_accepted', { orderId }).catch(() => {});
      router.push(`/order/${orderId}`);
    } catch {
      // error is already handled by the hook (setAcceptError)
    } finally {
      setAccepting(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onRefresh();
  }, [onRefresh]);

  const renderItem = useCallback(
    ({ item }: { item: AvailableOrder }) => (
      <AvailableOrderCard
        order={item}
        onAccept={() => handleAccept(item.id)}
        accepting={accepting === item.id}
      />
    ),
    [accepting, handleAccept],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.listContent}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
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
              ? t('profile.accountRejected')
              : t('profile.accountNotVerified')}
          </Text>
          <FontAwesome name="chevron-right" size={11} color={vStatus === 'REJECTED' ? '#ef4444' : '#92400e'} />
        </Pressable>
      )}

      {/* No profile photo banner */}
      {medic?.verificationStatus === 'APPROVED' && !medic?.profilePhotoUrl && (
        <Pressable
          style={styles.nophotoBanner}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <FontAwesome name="camera" size={15} color="#92400e" />
          <Text style={styles.nophotoText}>
            {t('profile.addProfilePhoto')}
          </Text>
          <FontAwesome name="chevron-right" size={11} color="#92400e" />
        </Pressable>
      )}

      {/* Offline banner */}
      {!medic?.isOnline && (
        <View style={styles.offlineBanner}>
          <FontAwesome name="power-off" size={14} color="#854d0e" />
          <Text style={styles.offlineText}>
            {t('profile.offlineBannerMsg')}
          </Text>
        </View>
      )}

      {/* Live connection status */}
      {medic?.isOnline && (
        <View style={[styles.statusBar, wsConnected ? styles.statusBarLive : styles.statusBarWaiting]}>
          <View style={[styles.statusDot, { backgroundColor: wsConnected ? Theme.success : Theme.warning }]} />
          <Text style={[styles.statusBarText, { color: wsConnected ? '#065f46' : '#78350f' }]}>
            {wsConnected ? t('profile.wsConnected') : t('profile.wsConnecting')}
          </Text>
        </View>
      )}

      {/* Animated new order banner */}
      {bannerOrder && (
        <NewOrderBanner
          order={bannerOrder}
          onAccept={() => handleAccept(bannerOrder.id)}
          onDismiss={dismissBanner}
        />
      )}

      {/* Fetch error */}
      {fetchError && (
        <View style={styles.fetchErrorBox}>
          <Text style={styles.fetchErrorText}>{fetchError}</Text>
          <Pressable onPress={() => fetchOrders()} style={styles.fetchRetryBtn}>
            <Text style={styles.fetchRetryText}>{t('common.retry')}</Text>
          </Pressable>
        </View>
      )}

      <FlashList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={orders.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Theme.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="inbox" size={48} color={Theme.border} />
            <Text style={styles.emptyTitle}>{t('orders.empty')}</Text>
            <Text style={styles.emptyHint}>{t('common.retry')}</Text>
          </View>
        }
        renderItem={renderItem}
      />

      {/* Fullscreen dispatch invite modal */}
      <OrderInviteModal invite={invite} onDismiss={() => setInvite(null)} />

      {/* Accept order confirm */}
      <AppModal
        visible={acceptModal !== null}
        title={t('orders.accepted')}
        message={t('dispatch.confirmAccept')}
        buttons={[
          { text: t('common.back'), style: 'cancel', onPress: () => setAcceptModal(null) },
          { text: t('dispatch.accept'), style: 'default', onPress: confirmAccept },
        ]}
        onClose={() => setAcceptModal(null)}
      />

      {/* Accept error */}
      <AppModal
        visible={acceptError !== null}
        title={t('common.error')}
        message={acceptError ?? ''}
        buttons={[{ text: 'OK', style: 'default', onPress: () => setAcceptError(null) }]}
        onClose={() => setAcceptError(null)}
      />
    </View>
  );
}

// ─── Order card ───────────────────────────────────────────────────────────────

const AvailableOrderCard = React.memo(function AvailableOrderCard({
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
    <View style={styles.card} accessibilityRole="button" accessibilityLabel={`${order.serviceTitle}, ${order.location?.house ?? ''}, ${finalPrice.toLocaleString('ru-RU')} UZS`}>
      <View style={styles.cardHeader}>
        <Text style={styles.serviceTitle}>{order.serviceTitle}</Text>
        <Text style={styles.price}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
      </View>

      {order.location && (
        <View style={styles.locationRow}>
          <FontAwesome name="map-marker" size={13} color={Theme.textSecondary} />
          <Text style={styles.locationText} numberOfLines={2}>
            {order.location.house}
            {order.location.floor ? `, ${t('orders.floor')} ${order.location.floor}` : ''}
            {order.location.apartment ? `, ${t('orders.apartment')} ${order.location.apartment}` : ''}
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
          accessibilityRole="button"
          accessibilityLabel={t('dispatch.accept')}
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
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.background },

  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
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
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
    color: '#92400e',
  },

  nophotoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#fef3c720',
    borderBottomWidth: 1,
    borderBottomColor: '#f59e0b40',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  nophotoText: { flex: 1, fontSize: Typography.bodySmall.fontSize, color: '#92400e', fontWeight: '500' },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#eab30820',
    borderBottomWidth: 1,
    borderBottomColor: '#eab30840',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  offlineText: { flex: 1, fontSize: Typography.bodySmall.fontSize, color: '#854d0e', fontWeight: '500' },

  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderBottomWidth: 1,
  },
  statusBarLive: { backgroundColor: '#d1fae520', borderBottomColor: '#6ee7b740' },
  statusBarWaiting: { backgroundColor: '#fef3c720', borderBottomColor: '#fde68a40' },
  statusDot: { width: 8, height: 8, borderRadius: Radius.xs },
  statusBarText: { fontSize: Typography.caption.fontSize, fontWeight: '600' },

  listContent: { padding: Spacing.lg, gap: Spacing.md },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: 80,
  },
  emptyTitle: { fontSize: Typography.h3.fontSize, fontWeight: '700', color: Theme.text },
  emptyHint: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  serviceTitle: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Theme.text, flex: 1 },
  price: { fontSize: Typography.body.fontSize, fontWeight: '700', color: Theme.primary, marginLeft: Spacing.sm },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  locationText: { flex: 1, fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  time: { fontSize: Typography.bodySmall.fontSize, color: Theme.textSecondary },
  acceptBtn: {
    backgroundColor: Theme.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  acceptBtnPressed: { opacity: 0.9 },
  acceptBtnDisabled: { opacity: 0.7 },
  acceptBtnText: { fontSize: Typography.body.fontSize, fontWeight: '700', color: '#fff' },

  fetchErrorBox: {
    margin: Spacing.md,
    padding: 14,
    backgroundColor: '#fee2e220',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#ef444440',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fetchErrorText: {
    flex: 1,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.error,
  },
  fetchRetryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Theme.error,
    borderRadius: Radius.sm,
  },
  fetchRetryText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: '#fff',
  },
});

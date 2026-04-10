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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Theme, Fonts, Radius, Spacing, Typography, Shadow } from '@/constants/Theme';
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
  const insets = useSafeAreaInsets();
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>HamshiraGo Medic</Text>
          <View style={styles.bellWrap}>
            <FontAwesome name="bell-o" size={20} color={Theme.text} />
          </View>
        </View>
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HamshiraGo Medic</Text>
        <View style={styles.headerRight}>
          {/* WS status dot */}
          {medic?.isOnline && (
            <View style={[styles.wsDot, { backgroundColor: wsConnected ? Theme.success : Theme.warning }]} />
          )}
          <View style={styles.bellWrap}>
            <FontAwesome name="bell-o" size={20} color={Theme.text} />
          </View>
        </View>
      </View>

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
            color={vStatus === 'REJECTED' ? Theme.error : '#92400e'}
          />
          <Text style={[styles.verifyBannerText, vStatus === 'REJECTED' && { color: Theme.error }]}>
            {vStatus === 'REJECTED'
              ? t('profile.accountRejected')
              : t('profile.accountNotVerified')}
          </Text>
          <FontAwesome name="chevron-right" size={11} color={vStatus === 'REJECTED' ? Theme.error : '#92400e'} />
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
            <View style={styles.emptyIconWrap}>
              <FontAwesome6 name="clipboard-list" size={40} color={Theme.textTertiary} />
            </View>
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
      <View style={styles.cardTop}>
        {/* Service icon in teal circle */}
        <View style={styles.serviceIconWrap}>
          <FontAwesome6 name="syringe" size={18} color={Theme.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.serviceTitle} numberOfLines={2}>{order.serviceTitle}</Text>
          <Text style={styles.price}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
        </View>
      </View>

      {order.location && (
        <View style={styles.locationRow}>
          <FontAwesome name="map-marker" size={13} color={Theme.textTertiary} />
          <Text style={styles.locationText} numberOfLines={2}>
            {order.location.house}
            {order.location.floor ? `, ${t('orders.floor')} ${order.location.floor}` : ''}
            {order.location.apartment ? `, ${t('orders.apartment')} ${order.location.apartment}` : ''}
          </Text>
        </View>
      )}

      {order.location && (
        <View style={styles.locationRow}>
          <FontAwesome name="phone" size={13} color={Theme.textTertiary} />
          <Text style={styles.locationText}>{order.location.phone}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.time}>{timeStr}</Text>
        <Pressable
          onPress={onAccept}
          disabled={accepting}
          accessibilityRole="button"
          accessibilityLabel={t('dispatch.accept')}
        >
          <LinearGradient
            colors={Theme.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.acceptBtn, accepting && styles.acceptBtnDisabled]}
          >
            {accepting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.acceptBtnText}>{t('dispatch.accept')}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontFamily: Fonts.manropeBd,
    fontSize: Typography.h2.fontSize,
    color: Theme.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  wsDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  bellWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },

  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  verifyBannerPending: {
    backgroundColor: Theme.warningContainer,
  },
  verifyBannerRejected: {
    backgroundColor: Theme.errorContainer,
  },
  verifyBannerText: {
    flex: 1,
    fontFamily: Fonts.interSb,
    fontSize: Typography.caption.fontSize,
    color: '#92400e',
  },

  nophotoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.warningContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  nophotoText: {
    flex: 1,
    fontFamily: Fonts.interMd,
    fontSize: Typography.bodySmall.fontSize,
    color: '#92400e',
  },

  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.warningContainer,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  offlineText: {
    flex: 1,
    fontFamily: Fonts.interMd,
    fontSize: Typography.bodySmall.fontSize,
    color: '#854d0e',
  },

  listContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 80,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.h3.fontSize,
    color: Theme.text,
  },
  emptyHint: {
    fontFamily: Fonts.inter,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textSecondary,
  },

  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  serviceTitle: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.body.fontSize,
    color: Theme.text,
  },
  price: {
    fontFamily: Fonts.manropeBd,
    fontSize: Typography.h4.fontSize,
    color: Theme.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  locationText: {
    flex: 1,
    fontFamily: Fonts.inter,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
  },
  time: {
    fontFamily: Fonts.inter,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textTertiary,
  },
  acceptBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    minWidth: 100,
    alignItems: 'center',
  },
  acceptBtnDisabled: { opacity: 0.7 },
  acceptBtnText: {
    fontFamily: Fonts.manropeSb,
    fontSize: Typography.body.fontSize,
    color: Theme.textInverse,
  },

  fetchErrorBox: {
    margin: Spacing.lg,
    padding: 14,
    backgroundColor: Theme.errorContainer,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  fetchErrorText: {
    flex: 1,
    fontFamily: Fonts.inter,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.error,
  },
  fetchRetryBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Theme.error,
    borderRadius: Radius.full,
  },
  fetchRetryText: {
    fontFamily: Fonts.interSb,
    fontSize: Typography.bodySmall.fontSize,
    color: Theme.textInverse,
  },
});

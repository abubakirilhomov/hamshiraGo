import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme, Radius, Spacing } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useLanguage } from '@/context/LanguageContext';
import { FIRST_ORDER_DISCOUNT_RATE } from '@/constants/config';
import { trackEvent } from '@/utils/analytics';

interface CatalogService {
  id: string;
  title: string;
  titleUz: string | null;
  price: number;
  durationMinutes: number | null;
  category: string | null;
}

interface AppSettings {
  urgentFeePercent: number;
  urgentStartHour: number;
  urgentEndHour: number;
}

interface SubscriptionTier {
  id: string;
  name: string;
  nameUz: string;
  discountPercent: number;
  maxOrders: number;
}

interface ActiveSubscription {
  id: string;
  tier: SubscriptionTier;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  ordersUsed: number;
}

export default function OrderConfirmScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState<CatalogService | null>(null);
  const [loadingService, setLoadingService] = useState(true);
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [urgentFeePercent, setUrgentFeePercent] = useState(50);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);

  const params = useLocalSearchParams<{
    serviceId: string;
    lat: string;
    lng: string;
    house: string;
    floor?: string;
    apartment?: string;
    phone: string;
  }>();

  useEffect(() => {
    if (!params.serviceId) {
      setLoadingService(false);
      return;
    }
    // Fetch service and order count independently — order count failure must not block service display
    apiFetch<CatalogService>(`/services/${params.serviceId}`)
      .then((svc) => setService(svc))
      .catch(() => showToast(t('confirm.serviceLoadError', { defaultValue: 'Не удалось загрузить услугу' }), 'error'))
      .finally(() => setLoadingService(false));

    apiFetch<{ total: number }>('/orders?limit=1', { token: token ?? undefined })
      .then((resp) => setIsFirstOrder((resp?.total ?? 1) === 0))
      .catch((e) => console.warn('Orders count fetch failed:', e)); // non-critical — isFirstOrder stays false

    apiFetch<{ points: number }>('/loyalty/my', { token: token ?? undefined })
      .then((res) => setLoyaltyPoints(res?.points ?? 0))
      .catch(() => {}); // non-critical

    apiFetch<ActiveSubscription | null>('/subscriptions/my', { token: token ?? undefined })
      .then((res) => {
        if (res && res.status === 'ACTIVE') setActiveSub(res);
      })
      .catch(() => {}); // non-critical

    apiFetch<AppSettings>('/settings')
      .then((s) => {
        const pct = Math.max(0, Math.min(100, s?.urgentFeePercent ?? 50));
        setUrgentFeePercent(pct);
      })
      .catch((e) => console.warn('Settings fetch failed:', e)); // non-critical — keep default 50%
  }, [params.serviceId, token]);

  const basePrice = service?.price ?? 0;
  // TODO: discount should be validated server-side (see BE-L7).
  // Client computes it for display purposes only; the backend must
  // independently verify eligibility and cap the amount.
  const discountAmount = isFirstOrder ? Math.round(basePrice * FIRST_ORDER_DISCOUNT_RATE) : 0;
  const urgentFee = isUrgent ? Math.round(basePrice * urgentFeePercent / 100) : 0;
  const finalPrice = basePrice + urgentFee - discountAmount;

  const handleSubmit = async () => {
    if (!service) return;

    const phone = params.phone?.trim();
    if (!phone || phone.length < 9) {
      showToast(t('confirm.invalidPhone', { defaultValue: 'Неверный номер телефона' }), 'error');
      return;
    }

    const lat = parseFloat(params.lat);
    const lng = parseFloat(params.lng);
    if (isNaN(lat) || isNaN(lng)) {
      showToast(t('confirm.locationError', { defaultValue: 'Ошибка определения местоположения' }), 'error');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const order = await apiFetch<{ id: string }>('/orders', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          serviceId: service.id,
          ...(discountAmount > 0 ? { discountAmount } : {}),
          ...(isUrgent ? { isUrgent: true } : {}),
          location: {
            latitude: lat,
            longitude: lng,
            house: params.house,
            floor: params.floor ?? null,
            apartment: params.apartment ?? null,
            phone,
          },
        }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackEvent('order_created', {
        serviceId: service.id,
        isUrgent,
        hasDiscount: discountAmount > 0,
      }).catch(() => {});
      router.replace({ pathname: '/order/track', params: { orderId: order.id } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('confirm.error');
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loadingService) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.centered, { backgroundColor: Theme.background }]}>
        <FontAwesome name="exclamation-circle" size={40} color={Theme.textSecondary} />
        <Text style={{ marginTop: 12, fontSize: 16, color: Theme.textSecondary, textAlign: 'center' }}>
          {t('confirm.notFound')}
        </Text>
        <Pressable
          style={[styles.button, styles.primaryButton, { marginTop: 20, paddingHorizontal: 32 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryButtonText}>{t('common.back')}</Text>
        </Pressable>
      </View>
    );
  }

  const displayTitle = language === 'uz' && service.titleUz ? service.titleUz : service.title;
  const addressText = `${params.house}${params.floor ? `, ${t('confirm.floor')} ${params.floor}` : ''}${params.apartment ? `, ${t('confirm.apt')} ${params.apartment}` : ''}`;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('confirm.title')}</Text>

      <View style={styles.card}>
        <View style={styles.serviceRow}>
          <FontAwesome name="medkit" size={24} color={Theme.primary} />
          <Text style={styles.serviceName}>{displayTitle}</Text>
        </View>
        <View style={styles.divider} />
        <Row label={t('confirm.address')} value={addressText} />
        <Row label={t('confirm.phone')} value={params.phone ?? ''} />
        {service.durationMinutes && (
          <Row label={t('confirm.duration')} value={`~${service.durationMinutes} ${t('service.min')}`} />
        )}
      </View>

      {/* Urgent toggle */}
      <View style={styles.urgentCard}>
        <View style={styles.urgentRow}>
          <View style={styles.urgentLabelWrap}>
            <Text style={styles.urgentLabel}>{t('urgent.label')}</Text>
            <Text style={styles.urgentDescription}>{t('urgent.description')}</Text>
          </View>
          <Switch
            value={isUrgent}
            onValueChange={setIsUrgent}
            trackColor={{ false: Theme.border, true: `${Theme.error}88` }}
            thumbColor={isUrgent ? Theme.error : Theme.textSecondary}
          />
        </View>
        {isUrgent && (
          <Text style={styles.urgentFeeHint}>
            {t('urgent.fee')}: +{urgentFee.toLocaleString('ru-RU')} {t('common.sum')} ({urgentFeePercent}%)
          </Text>
        )}
      </View>

      {/* Loyalty points info */}
      {loyaltyPoints > 0 && (
        <Pressable
          style={({ pressed }) => [styles.loyaltyInfoCard, pressed && { opacity: 0.8 }]}
          onPress={() => router.push('/loyalty')}
        >
          <FontAwesome name="trophy" size={16} color={Theme.primary} />
          <Text style={styles.loyaltyInfoText}>
            {t('loyalty.availableDiscount', { amount: (loyaltyPoints * 100).toLocaleString('ru-RU') })}
          </Text>
          <FontAwesome name="chevron-right" size={12} color={Theme.textSecondary} />
        </Pressable>
      )}

      {/* Subscription discount info */}
      {activeSub && activeSub.ordersUsed < activeSub.tier.maxOrders && (
        <View style={styles.subscriptionInfoCard}>
          <FontAwesome name="id-card" size={16} color={Theme.primary} />
          <Text style={styles.subscriptionInfoText}>
            {t('subscription.subscriptionDiscount', {
              percent: String(activeSub.tier.discountPercent),
            })} ({Math.round(basePrice * activeSub.tier.discountPercent / 100).toLocaleString('ru-RU')} UZS)
          </Text>
        </View>
      )}
      {activeSub && activeSub.ordersUsed >= activeSub.tier.maxOrders && (
        <View style={styles.subscriptionWarningCard}>
          <FontAwesome name="exclamation-triangle" size={16} color={Theme.warning} />
          <Text style={styles.subscriptionWarningText}>
            {t('subscription.limitReached')}
          </Text>
        </View>
      )}

      <View style={styles.priceBlock}>
        {isFirstOrder && (
          <View style={styles.discountBadge}>
            <FontAwesome name="tag" size={14} color="#854d0e" />
            <Text style={styles.discountBadgeText}>
              {t('confirm.discountFirst', { amount: discountAmount.toLocaleString('ru-RU') })}
            </Text>
          </View>
        )}
        {(isFirstOrder || isUrgent) && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('confirm.basePrice')}</Text>
            <Text style={styles.rowValue}>{basePrice.toLocaleString('ru-RU')} UZS</Text>
          </View>
        )}
        {isUrgent && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('urgent.fee')}</Text>
            <Text style={[styles.rowValue, { color: Theme.error }]}>+{urgentFee.toLocaleString('ru-RU')} UZS</Text>
          </View>
        )}
        <View style={[styles.finalRow, !isFirstOrder && !isUrgent && { marginTop: 0, paddingTop: 0, borderTopWidth: 0 }]}>
          <Text style={styles.finalLabel}>{t('confirm.total')}</Text>
          <Text style={styles.finalPrice}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.primaryButton,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('confirm.submit')}</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.buttonPressed]}
          onPress={handleCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>{t('confirm.cancel')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  valueGreen,
}: {
  label: string;
  value: string;
  valueGreen?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel} lightColor={Theme.textSecondary} darkColor={Theme.textSecondary}>
        {label}
      </Text>
      <Text style={[styles.rowValue, valueGreen && styles.rowValueGreen]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Theme.background },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.text,
    marginBottom: Spacing.lg,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.text,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.border,
    marginVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600', color: Theme.text },
  rowValueGreen: { color: Theme.success },
  priceBlock: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 10,
    padding: 10,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  discountBadgeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#854d0e',
  },
  finalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  finalLabel: { fontSize: 16, fontWeight: '700', color: Theme.text },
  finalPrice: { fontSize: 18, fontWeight: '700', color: Theme.primary },
  urgentCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  urgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  urgentLabelWrap: {
    flex: 1,
  },
  urgentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.text,
  },
  urgentDescription: {
    fontSize: 12,
    color: Theme.textSecondary,
    marginTop: 2,
  },
  urgentFeeHint: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.error,
  },
  loyaltyInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Theme.primary}10`,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Theme.primary}30`,
  },
  loyaltyInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.primary,
  },
  subscriptionInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Theme.primary}10`,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: `${Theme.primary}30`,
  },
  subscriptionInfoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.primary,
  },
  subscriptionWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#fef3c7',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  subscriptionWarningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#854d0e',
  },
  buttons: { gap: Spacing.md },
  button: { paddingVertical: Spacing.lg, borderRadius: Radius.md, alignItems: 'center' },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.7 },
  primaryButton: { backgroundColor: Theme.primary },
  primaryButtonText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cancelButton: { backgroundColor: Theme.surface, borderWidth: 1, borderColor: Theme.border },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: Theme.text },
});

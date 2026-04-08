import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { Theme, Fonts, Radius, Shadow, Spacing } from '@/constants/Theme';
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
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState<CatalogService | null>(null);
  const [loadingService, setLoadingService] = useState(true);
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [urgentFeePercent, setUrgentFeePercent] = useState(50);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoId, setPromoId] = useState<string | null>(null);
  const [promoStatus, setPromoStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

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
    apiFetch<CatalogService>(`/services/${params.serviceId}`)
      .then((svc) => setService(svc))
      .catch(() => showToast(t('confirm.serviceLoadError', { defaultValue: 'Не удалось загрузить услугу' }), 'error'))
      .finally(() => setLoadingService(false));

    apiFetch<{ total: number }>('/orders?limit=1', { token: token ?? undefined })
      .then((resp) => setIsFirstOrder((resp?.total ?? 1) === 0))
      .catch((e) => console.warn('Orders count fetch failed:', e));

    apiFetch<{ points: number }>('/loyalty/my', { token: token ?? undefined })
      .then((res) => setLoyaltyPoints(res?.points ?? 0))
      .catch(() => {});

    apiFetch<ActiveSubscription | null>('/subscriptions/my', { token: token ?? undefined })
      .then((res) => {
        if (res && res.status === 'ACTIVE') setActiveSub(res);
      })
      .catch(() => {});

    apiFetch<AppSettings>('/settings')
      .then((s) => {
        const pct = Math.max(0, Math.min(100, s?.urgentFeePercent ?? 50));
        setUrgentFeePercent(pct);
      })
      .catch((e) => console.warn('Settings fetch failed:', e));
  }, [params.serviceId, token]);

  const basePrice = service?.price ?? 0;
  const firstOrderDiscount = isFirstOrder ? Math.round(basePrice * FIRST_ORDER_DISCOUNT_RATE) : 0;
  const subDiscount = activeSub ? Math.round(basePrice * (activeSub.discountPercent ?? 0) / 100) : 0;
  const discountAmount = firstOrderDiscount + promoDiscount + subDiscount;
  const urgentFee = isUrgent ? Math.round(basePrice * urgentFeePercent / 100) : 0;
  const finalPrice = Math.max(0, basePrice + urgentFee - discountAmount);

  const handleApplyPromo = async () => {
    if (!promoCode.trim() || !token) return;
    try {
      const res = await apiFetch<{ valid: boolean; discountAmount: number; promoId: string | null }>(
        '/promo/validate',
        { token, method: 'POST', body: JSON.stringify({ code: promoCode.trim() }) },
      );
      if (res.valid) {
        setPromoDiscount(res.discountAmount);
        setPromoId(res.promoId);
        setPromoStatus('valid');
      } else {
        setPromoDiscount(0);
        setPromoId(null);
        setPromoStatus('invalid');
      }
    } catch {
      setPromoStatus('invalid');
    }
  };

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
          ...(promoId ? { promoId } : {}),
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

  if (loadingService) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Theme.primary} />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIconWrap}>
          <FontAwesome name="exclamation-circle" size={40} color={Theme.textSecondary} />
        </View>
        <Text style={styles.errorText}>
          {t('confirm.notFound')}
        </Text>
        <Pressable onPress={() => router.back()}>
          <LinearGradient
            colors={[Theme.primaryGradient[0], Theme.primaryGradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.errorBtn}
          >
            <Text style={styles.errorBtnText}>{t('common.back')}</Text>
          </LinearGradient>
        </Pressable>
      </View>
    );
  }

  const displayTitle = language === 'uz' && service.titleUz ? service.titleUz : service.title;
  const addressText = `${params.house}${params.floor ? `, ${t('confirm.floor')} ${params.floor}` : ''}${params.apartment ? `, ${t('confirm.apt')} ${params.apartment}` : ''}`;

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={12}>
          <FontAwesome name="arrow-left" size={18} color={Theme.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('confirm.title', { defaultValue: 'Buyurtmani tasdiqlash' })}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Service card */}
        <View style={styles.serviceCard}>
          <View style={styles.serviceIconWrap}>
            <FontAwesome name="medkit" size={24} color={Theme.primary} />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{displayTitle}</Text>
            <Text style={styles.servicePrice}>{basePrice.toLocaleString('ru-RU')} UZS</Text>
          </View>
        </View>

        {/* Address card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('confirm.address', { defaultValue: 'Manzil' })}</Text>
          <View style={styles.addressRow}>
            <FontAwesome name="map-pin" size={14} color={Theme.primary} />
            <Text style={styles.addressText}>{addressText}</Text>
          </View>
          {params.phone && (
            <View style={styles.addressRow}>
              <FontAwesome name="phone" size={14} color={Theme.primary} />
              <Text style={styles.addressText}>{params.phone}</Text>
            </View>
          )}
        </View>

        {/* Urgent toggle */}
        <View style={styles.card}>
          <View style={styles.urgentRow}>
            <View style={styles.urgentLabelWrap}>
              <Text style={styles.urgentLabel}>{t('urgent.label', { defaultValue: 'Shoshilinch' })}</Text>
              <Text style={styles.urgentDesc}>{t('urgent.description', { defaultValue: "Tezkor xizmat ko'rsatish" })}</Text>
            </View>
            <Switch
              value={isUrgent}
              onValueChange={setIsUrgent}
              trackColor={{ false: Theme.surfaceContainerHigh, true: `${Theme.error}88` }}
              thumbColor={isUrgent ? Theme.error : Theme.textTertiary}
            />
          </View>
          {isUrgent && (
            <Text style={styles.urgentFeeHint}>
              +{urgentFee.toLocaleString('ru-RU')} UZS ({urgentFeePercent}%)
            </Text>
          )}
        </View>

        {/* Promo code */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t('promo.enterCode', { defaultValue: 'Promo kod' })}</Text>
          <View style={styles.promoRow}>
            <TextInput
              style={[
                styles.promoInput,
                promoStatus === 'valid' && styles.promoInputValid,
                promoStatus === 'invalid' && styles.promoInputInvalid,
              ]}
              value={promoCode}
              onChangeText={(v) => {
                const upper = v.toUpperCase();
                setPromoCode(upper);
                if (promoStatus !== 'idle') {
                  setPromoStatus('idle');
                  setPromoDiscount(0);
                  setPromoId(null);
                }
              }}
              placeholder={t('promo.placeholder', { defaultValue: 'Kodni kiriting' })}
              placeholderTextColor={Theme.textTertiary}
              autoCapitalize="characters"
              maxLength={50}
            />
            <Pressable
              style={({ pressed }) => [styles.promoBtn, pressed && { opacity: 0.8 }]}
              onPress={handleApplyPromo}
            >
              <Text style={styles.promoBtnText}>{t('promo.apply', { defaultValue: 'Qollash' })}</Text>
            </Pressable>
          </View>
          {promoStatus === 'valid' && (
            <Text style={styles.promoValid}>
              {t('promo.applied', { defaultValue: 'Qabul qilindi' })}: -{promoDiscount.toLocaleString('ru-RU')} UZS
            </Text>
          )}
          {promoStatus === 'invalid' && (
            <Text style={styles.promoInvalid}>{t('promo.invalid', { defaultValue: "Promo kod noto'g'ri" })}</Text>
          )}
        </View>

        {/* Loyalty info */}
        {loyaltyPoints > 0 && (
          <Pressable
            style={({ pressed }) => [styles.loyaltyCard, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/loyalty')}
          >
            <FontAwesome name="trophy" size={16} color={Theme.primary} />
            <Text style={styles.loyaltyText}>
              {t('loyalty.availableDiscount', { amount: (loyaltyPoints * 100).toLocaleString('ru-RU') })}
            </Text>
            <FontAwesome name="chevron-right" size={12} color={Theme.textTertiary} />
          </Pressable>
        )}

        {/* Subscription discount info */}
        {activeSub && activeSub.ordersUsed < activeSub.tier.maxOrders && (
          <View style={styles.subInfoCard}>
            <FontAwesome name="id-card" size={16} color={Theme.primary} />
            <Text style={styles.subInfoText}>
              {t('subscription.subscriptionDiscount', {
                percent: String(activeSub.tier.discountPercent),
              })} ({Math.round(basePrice * activeSub.tier.discountPercent / 100).toLocaleString('ru-RU')} UZS)
            </Text>
          </View>
        )}
        {activeSub && activeSub.ordersUsed >= activeSub.tier.maxOrders && (
          <View style={styles.subWarnCard}>
            <FontAwesome name="exclamation-triangle" size={16} color={Theme.warning} />
            <Text style={styles.subWarnText}>
              {t('subscription.limitReached')}
            </Text>
          </View>
        )}

        {/* Price breakdown */}
        <View style={styles.priceCard}>
          {isFirstOrder && (
            <View style={styles.discountBadge}>
              <FontAwesome name="tag" size={14} color={Theme.success} />
              <Text style={styles.discountBadgeText}>
                {t('confirm.discountFirst', { amount: discountAmount.toLocaleString('ru-RU') })}
              </Text>
            </View>
          )}

          <PriceRow
            label={t('confirm.basePrice', { defaultValue: 'Xizmat narxi' })}
            value={`${basePrice.toLocaleString('ru-RU')} UZS`}
          />

          {discountAmount > 0 && (
            <PriceRow
              label={t('confirm.discount', { defaultValue: 'Chegirma' })}
              value={`-${discountAmount.toLocaleString('ru-RU')} UZS`}
              valueColor={Theme.success}
            />
          )}

          {isUrgent && (
            <PriceRow
              label={t('urgent.label', { defaultValue: 'Shoshilinch' })}
              value={`+${urgentFee.toLocaleString('ru-RU')} UZS`}
              valueColor={Theme.error}
            />
          )}

          {/* Divider */}
          <View style={styles.priceDivider} />

          {/* Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('confirm.total', { defaultValue: 'Jami' })}</Text>
            <Text style={styles.totalValue}>{finalPrice.toLocaleString('ru-RU')} UZS</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable onPress={handleSubmit} disabled={loading}>
          <LinearGradient
            colors={[Theme.primaryGradient[0], Theme.primaryGradient[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.ctaButton, loading && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.ctaText}>
                {t('confirm.submit', { defaultValue: 'Buyurtma berish' })}
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

/* ---- Price Row sub-component ---- */
function PriceRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceRowLabel}>{label}</Text>
      <Text style={[styles.priceRowValue, valueColor ? { color: valueColor } : undefined]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  scroll: { flex: 1 },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.background,
    gap: Spacing.lg,
  },

  /* Error */
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    textAlign: 'center',
  },
  errorBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.full,
  },
  errorBtnText: {
    color: '#fff',
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Theme.surface,
    ...Shadow.sm,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.text,
  },

  /* Service card */
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  serviceIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
    gap: 4,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.text,
  },
  servicePrice: {
    fontSize: 18,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.primary,
  },

  /* Card */
  card: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: Fonts.interMd,
    fontWeight: '500',
    color: Theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  addressText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.inter,
    color: Theme.text,
    lineHeight: 22,
  },

  /* Urgent */
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
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: Theme.text,
  },
  urgentDesc: {
    fontSize: 12,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
    marginTop: 2,
  },
  urgentFeeHint: {
    marginTop: Spacing.sm,
    fontSize: 13,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.error,
  },

  /* Promo */
  promoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  promoInput: {
    flex: 1,
    backgroundColor: Theme.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 15,
    fontFamily: Fonts.inter,
    color: Theme.text,
  },
  promoInputValid: {
    backgroundColor: `${Theme.success}10`,
  },
  promoInputInvalid: {
    backgroundColor: `${Theme.error}10`,
  },
  promoBtn: {
    backgroundColor: Theme.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  promoBtnText: {
    color: '#fff',
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    fontSize: 14,
  },
  promoValid: {
    color: Theme.success,
    fontSize: 13,
    fontFamily: Fonts.interMd,
    marginTop: Spacing.xs,
  },
  promoInvalid: {
    color: Theme.error,
    fontSize: 13,
    fontFamily: Fonts.interMd,
    marginTop: Spacing.xs,
  },

  /* Loyalty */
  loyaltyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  loyaltyText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.primary,
  },

  /* Subscription */
  subInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  subInfoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.primary,
  },
  subWarnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Theme.warningContainer,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  subWarnText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: '#854d0e',
  },

  /* Price breakdown */
  priceCard: {
    backgroundColor: Theme.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.successContainer,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  discountBadgeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.success,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  priceRowLabel: {
    fontSize: 14,
    fontFamily: Fonts.inter,
    color: Theme.textSecondary,
  },
  priceRowValue: {
    fontSize: 14,
    fontFamily: Fonts.interSb,
    fontWeight: '600',
    color: Theme.text,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Theme.surfaceContainerLow,
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.text,
  },
  totalValue: {
    fontSize: 24,
    fontFamily: Fonts.manropeBd,
    fontWeight: '700',
    color: Theme.primary,
  },

  /* Sticky CTA */
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Theme.surface,
    ...Shadow.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.full,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: Fonts.manropeSb,
    fontWeight: '600',
    color: '#fff',
  },
});

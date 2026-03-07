import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

interface CatalogService {
  id: string;
  title: string;
  titleUz: string | null;
  price: number;
  durationMinutes: number | null;
  category: string | null;
}

const FIRST_ORDER_DISCOUNT_RATE = 0.10; // 10%

export default function OrderConfirmScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [service, setService] = useState<CatalogService | null>(null);
  const [loadingService, setLoadingService] = useState(true);
  const [isFirstOrder, setIsFirstOrder] = useState(false);

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
    if (!params.serviceId) return;
    Promise.all([
      apiFetch<CatalogService>(`/services/${params.serviceId}`),
      apiFetch<{ total: number }>('/orders?limit=1', { token: token ?? undefined }),
    ])
      .then(([svc, ordersResp]) => {
        setService(svc);
        setIsFirstOrder(ordersResp.total === 0);
      })
      .catch(() => {})
      .finally(() => setLoadingService(false));
  }, [params.serviceId]);

  const basePrice = service?.price ?? 0;
  const discountAmount = isFirstOrder ? Math.round(basePrice * FIRST_ORDER_DISCOUNT_RATE) : 0;
  const finalPrice = basePrice - discountAmount;

  const handleSubmit = async () => {
    if (!service) return;
    setLoading(true);
    try {
      const order = await apiFetch<{ id: string }>('/orders', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          serviceId: service.id,
          ...(discountAmount > 0 ? { discountAmount } : {}),
          location: {
            latitude: parseFloat(params.lat),
            longitude: parseFloat(params.lng),
            house: params.house,
            floor: params.floor ?? null,
            apartment: params.apartment ?? null,
            phone: params.phone,
          },
        }),
      });
      router.replace({ pathname: '/order/track', params: { orderId: order.id } });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('confirm.error');
      Alert.alert(t('common.error'), msg);
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
      <View style={styles.centered}>
        <Text>{t('confirm.notFound')}</Text>
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

      <View style={styles.priceBlock}>
        {isFirstOrder && (
          <View style={styles.discountBadge}>
            <FontAwesome name="tag" size={14} color="#854d0e" />
            <Text style={styles.discountBadgeText}>
              {t('confirm.discountFirst', { amount: discountAmount.toLocaleString('ru-RU') })}
            </Text>
          </View>
        )}
        {isFirstOrder && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('confirm.basePrice')}</Text>
            <Text style={styles.rowValue}>{basePrice.toLocaleString('ru-RU')} UZS</Text>
          </View>
        )}
        <View style={[styles.finalRow, !isFirstOrder && { marginTop: 0, paddingTop: 0, borderTopWidth: 0 }]}>
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
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: Theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600', color: Theme.text },
  rowValueGreen: { color: Theme.success },
  priceBlock: {
    backgroundColor: Theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
    marginBottom: 12,
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.border,
  },
  finalLabel: { fontSize: 16, fontWeight: '700', color: Theme.text },
  finalPrice: { fontSize: 18, fontWeight: '700', color: Theme.primary },
  buttons: { gap: 12 },
  button: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.7 },
  primaryButton: { backgroundColor: Theme.primary },
  primaryButtonText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cancelButton: { backgroundColor: Theme.surface, borderWidth: 1, borderColor: Theme.border },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: Theme.text },
});

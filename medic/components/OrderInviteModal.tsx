import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { apiFetch } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

export interface DispatchInvitePayload {
  orderId: string;
  order: {
    id: string;
    serviceTitle: string;
    priceAmount: number;
    discountAmount: number;
    location: {
      house: string;
      floor: string | null;
      apartment: string | null;
      phone: string;
      latitude: number;
      longitude: number;
    } | null;
  };
  expiresAt: string; // ISO timestamp
}

interface Props {
  invite: DispatchInvitePayload | null;
  onDismiss: () => void;
}

export function OrderInviteModal({ invite, onDismiss }: Props) {
  const { token } = useAuth();
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);

  useEffect(() => {
    if (!invite) return;
    const update = () => {
      const ms = new Date(invite.expiresAt).getTime() - Date.now();
      setSecondsLeft(Math.max(0, Math.ceil(ms / 1000)));
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [invite]);

  const handleAccept = async () => {
    if (!invite) return;
    setLoading('accept');
    try {
      await apiFetch(`/orders/${invite.orderId}/accept`, {
        method: 'POST',
        token: token ?? undefined,
      });
      onDismiss();
      router.push(`/order/${invite.orderId}`);
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось принять заказ');
      setLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!invite) return;
    setLoading('decline');
    try {
      await apiFetch(`/orders/${invite.orderId}/decline`, {
        method: 'POST',
        token: token ?? undefined,
      });
      onDismiss();
    } catch (e: unknown) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось отклонить заказ');
      setLoading(null);
    }
  };

  if (!invite) return null;

  const netPrice = (invite.order.priceAmount ?? 0) - (invite.order.discountAmount ?? 0);
  const isExpired = secondsLeft === 0;
  const isUrgent = secondsLeft <= 15 && !isExpired;
  const canAct = loading === null && !isExpired;

  const loc = invite.order.location;
  const addressParts = loc
    ? [
        loc.house,
        loc.floor ? `эт. ${loc.floor}` : null,
        loc.apartment ? `кв. ${loc.apartment}` : null,
      ].filter(Boolean)
    : [];

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Top header with countdown */}
        <View style={[styles.header, isUrgent && styles.headerUrgent, isExpired && styles.headerExpired]}>
          <View style={styles.timerWrap}>
            <Text style={[styles.timerNumber, isUrgent && styles.timerNumberUrgent, isExpired && styles.timerNumberExpired]}>
              {secondsLeft}
            </Text>
            <Text style={styles.timerSec}>сек</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {isExpired ? 'Время истекло' : '🚨 Новый заказ рядом!'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isExpired
                ? 'Заказ передан другому медику'
                : `Ответьте в течение ${secondsLeft} секунд`}
            </Text>
          </View>
        </View>

        {/* Order details card */}
        <View style={styles.card}>
          <View style={styles.serviceRow}>
            <FontAwesome name="medkit" size={22} color={Theme.primary} />
            <Text style={styles.serviceTitle}>{invite.order.serviceTitle}</Text>
          </View>
          <View style={styles.divider} />

          <InfoRow label="Стоимость" value={`${netPrice.toLocaleString('ru-RU')} UZS`} valueStyle={styles.priceValue} />

          {loc && (
            <>
              {addressParts.length > 0 && (
                <InfoRow label="Адрес" value={addressParts.join(', ')} />
              )}
              <InfoRow label="Телефон" value={loc.phone} />
              <InfoRow
                label="Координаты"
                value={`${Number(loc.latitude).toFixed(5)}, ${Number(loc.longitude).toFixed(5)}`}
              />
            </>
          )}
        </View>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.acceptBtn,
              pressed && styles.btnPressed,
              !canAct && styles.btnDisabled,
            ]}
            onPress={handleAccept}
            disabled={!canAct}
          >
            {loading === 'accept' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="check-circle" size={20} color="#fff" />
                <Text style={styles.acceptBtnText}>Принять заказ</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              styles.declineBtn,
              pressed && styles.btnPressed,
              !canAct && styles.btnDisabled,
            ]}
            onPress={handleDecline}
            disabled={!canAct}
          >
            {loading === 'decline' ? (
              <ActivityIndicator color={Theme.error} />
            ) : (
              <>
                <FontAwesome name="times-circle" size={20} color={Theme.error} />
                <Text style={styles.declineBtnText}>Отклонить</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function InfoRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Theme.primary,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
  },
  headerUrgent: {
    backgroundColor: '#d97706', // amber-600
  },
  headerExpired: {
    backgroundColor: Theme.textSecondary,
  },
  timerWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 32,
  },
  timerNumberUrgent: {
    color: '#fef3c7',
  },
  timerNumberExpired: {
    color: 'rgba(255,255,255,0.6)',
  },
  timerSec: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // ── Details card ────────────────────────────────────────────────────────────
  card: {
    margin: 16,
    backgroundColor: Theme.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.text,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.border,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: Theme.textSecondary,
    minWidth: 90,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.text,
    textAlign: 'right',
  },
  priceValue: {
    color: Theme.primary,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Buttons ─────────────────────────────────────────────────────────────────
  buttons: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
  },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.45 },
  acceptBtn: {
    backgroundColor: Theme.primary,
  },
  acceptBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  declineBtn: {
    backgroundColor: Theme.surface,
    borderWidth: 1.5,
    borderColor: Theme.error,
  },
  declineBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.error,
  },
});
